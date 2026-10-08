// ===================== 3) StudentCourseDetail.jsx =====================
// สไตล์เป๊ะจาก TutorStudentDetail.jsx แต่ดึงข้อมูลของนักเรียนคนที่ล็อกอินอยู่เอง ในคอร์สที่เลือก
import { API_URL } from "../config";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Users, Calendar, Video, FileText, Download, BarChart2, PlayCircle,
  CheckCircle, XCircle, Clock, ChevronRight,
  WalletCards, BookOpen, RefreshCw,
} from "lucide-react";
import { getStudentCourseDetail } from "../callapi/callusers_student";
import CoursePaymentsTab from "../components/CoursePaymentsTab";
import Breadcrumb from "../components/ui/Breadcrumb";

const API_BASE = API_URL;

function resolveUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE}${value.startsWith("/") ? "" : "/"}${value}`;
}

function normalizeAttendance(value) {
  if (value === null || value === undefined || value === "") return "pending";
  const status = String(value).trim().toLowerCase();
  if (["1", "present", "มา", "มาเรียน"].includes(status)) return "present";
  if (["0", "absent", "ขาด", "ขาดเรียน"].includes(status)) return "absent";
  return "other";
}

function thaiDate(value, options) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("th-TH", options);
}

export default function StudentCourseDetail() {
  const { courseId: routeCourseId } = useParams();
  const [searchParams] = useSearchParams();

  // รองรับทั้ง /student/courses/:courseId และ ?courseId=...
  const courseId = routeCourseId || searchParams.get("courseId");
  const token = localStorage.getItem("student_token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [courseName, setCourseName] = useState(
    searchParams.get("courseName") || "คอร์สเรียน"
  );
  const [courseType, setCourseType] = useState("bundle");
  const [fullCost, setFullCost] = useState(0);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [videos, setVideos] = useState([]);
  const [files, setFiles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachingTopics, setTeachingTopics] = useState([]);
  const [activeTab, setActiveTab] = useState("plan");

  useEffect(() => {
    let cancelled = false;

    const loadCourseDetail = async () => {
      if (!token) {
        setError("ไม่พบโทเคน กรุณาเข้าสู่ระบบใหม่");
        setLoading(false);
        return;
      }

      if (!courseId) {
        setError("ไม่พบรหัสคอร์ส");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getStudentCourseDetail(token, courseId);
        if (cancelled) return;

        const detail = response?.data ?? response ?? {};
        const profile = detail.student ?? {};
        setStudent({
          UserId: profile.userId ?? profile.UserId,
          Firstname: profile.firstname ?? profile.Firstname ?? "",
          Lastname: profile.lastname ?? profile.Lastname ?? "",
          Nickname: profile.nickname ?? profile.Nickname ?? "student",
          Photo: profile.photo ?? profile.Photo ?? "",
          SchoolName: profile.schoolName ?? profile.SchoolName ?? "",
          PhoneNo: profile.phoneNo ?? profile.PhoneNo ?? "",
          GradeDetail: profile.gradeDetail ?? profile.GradeDetail ?? "ไม่ระบุระดับชั้น",
        });
        setCourseName(detail.course?.courseName ?? detail.course?.CourseName ?? "คอร์สเรียน");
        const type = detail.course?.courseType ?? detail.course?.Course_Type ?? "bundle";
        setCourseType(type);
        setFullCost(Number(detail.course?.fullCost ?? detail.course?.FullCost ?? 0));
        setActiveTab("plan");
        setSubjects(detail.subjects ?? []);
        setTeachingTopics(detail.teachingTopics ?? []);
        setAttendance((detail.schedule ?? []).map((item) => ({
          StudentAttendanceId: item.attendanceId ?? item.AttendanceId ?? item.courseScheduleDetailId ?? item.CourseScheduleDetailId,
          CourseScheduleDetailId: item.courseScheduleDetailId ?? item.CourseScheduleDetailId,
          SubjectName: item.subjectName ?? item.SubjectName,
          TutorName: item.tutorName ?? item.TutorName,
          Room: item.room ?? item.Room,
          StartDateTime: item.startDateTime ?? item.StartDateTime ?? ((item.classDate ?? item.ClassDate) && (item.startTime ?? item.StartTime)
            ? `${item.classDate ?? item.ClassDate}T${item.startTime ?? item.StartTime}`
            : item.classDate ?? item.ClassDate),
          EndTime: item.endTime ?? item.EndTime,
          Status: normalizeAttendance(item.attendanceStatus ?? item.AttendanceStatus),
          RawStatus: item.attendanceStatus ?? item.AttendanceStatus,
          Reason: item.attendanceReason ?? item.AttendanceReason,
        })));
        setVideos((detail.videos ?? []).map((video) => {
          const rawProgress = Number(video.watchPercent ?? video.WatchPercent ?? 0);
          const progress = Number.isFinite(rawProgress) ? Math.min(100, Math.max(0, Math.round(rawProgress))) : 0;
          return {
            id: video.videoId ?? video.VideoId,
            subjectId: video.subjectId ?? video.SubjectId,
            title: video.videoTitle ?? video.VideoTitle ?? "ไม่มีชื่อคลิป",
            subjectName: video.subjectName ?? video.SubjectName,
            duration: video.duration ?? video.Duration ?? "-",
            url: video.videoUrl ?? video.VideoUrl,
            watched: progress >= 80,
            watchedAt: video.watchDate ?? video.WatchDate,
            progress,
          };
        }));
        setFiles((detail.files ?? []).map((file) => ({
          fileId: file.fileId ?? file.FileId,
          subjectId: file.subjectId ?? file.SubjectId,
          fileName: file.fileName ?? file.FileName,
          subjectName: file.subjectName ?? file.SubjectName,
          filePath: file.filePath ?? file.FilePath,
        })));
      } catch (loadError) {
        console.error("โหลดรายละเอียดคอร์สไม่สำเร็จ:", loadError);
        if (!cancelled) {
          setStudent(null);
          setError(loadError?.message || "โหลดรายละเอียดคอร์สไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCourseDetail();

    return () => {
      cancelled = true;
    };
  }, [courseId, token, reloadKey]);

  const attendedCount = attendance.filter((a) => a.Status === "present").length;
  const absentCount = attendance.filter((a) => a.Status === "absent").length;
  const recordedCount = attendedCount + absentCount;
  const attendanceRate = recordedCount ? Math.round((attendedCount / recordedCount) * 100) : 0;
  const attendanceRateLabel = recordedCount ? `${attendanceRate}%` : "—";
  const watchedCount = videos.filter((v) => v.watched).length;
  const videoRate = videos.length
    ? Math.round(videos.reduce((sum, video) => sum + video.progress, 0) / videos.length)
    : 0;
  const videoRateLabel = videos.length ? `${videoRate}%` : "—";

  const rateColor = attendanceRate >= 80 ? "bg-green-500" : attendanceRate >= 60 ? "bg-orange-500" : "bg-red-500";
  const rateText = attendanceRate >= 80 ? "text-green-600" : attendanceRate >= 60 ? "text-orange-500" : "text-red-500";

  if (loading) return <div className="mt-[90px] text-center p-10 text-orange-600 font-medium">กำลังโหลดข้อมูล...</div>;
  if (error) return (
    <div className="mt-[90px] text-center p-10 text-red-500" role="alert">
      {error}
      {token && courseId && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" /> ลองใหม่
          </button>
        </div>
      )}
    </div>
  );
  if (!student) return <div className="mt-[90px] text-center p-10 text-neutral-500">ไม่พบข้อมูลนักเรียน</div>;

  return (
    <div className="mt-[90px] min-w-0 space-y-6 pb-8">
      <div className="flex min-w-0 items-center gap-2 text-sm text-neutral-500">
        <Link to="/profile/my-courses" className="hover:text-orange-600 transition font-medium">คอร์สเรียนของฉัน</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="min-w-0 truncate text-neutral-800 font-semibold">{courseName}</span>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="h-20 w-20 rounded-xl border-2 border-orange-200 overflow-hidden shrink-0 bg-white">
            <img src={student.Photo ? resolveUrl(student.Photo) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.Nickname}&backgroundColor=fef3c7`} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-bold text-neutral-900">{student.Firstname} {student.Lastname}</h1>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-neutral-600">
              <span className="max-w-full break-words bg-white border rounded px-2 py-0.5">🏫 {student.SchoolName || "ไม่ระบุ"}</span>
              <span className="max-w-full break-words bg-white border rounded px-2 py-0.5">📞 {student.PhoneNo || "-"}</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5">{student.GradeDetail}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {courseType === "single" && <div className="min-w-0 bg-white border border-green-200 rounded-xl px-2 py-2 text-center sm:px-4">
              <p className="text-xs text-neutral-500 mb-0.5">เข้าเรียน</p>
              <p className={`text-lg font-bold ${rateText}`}>{attendanceRateLabel}</p>
              <p className="text-xs text-neutral-400">{attendedCount}/{recordedCount} คาบที่บันทึก</p>
            </div>}
            <div className="min-w-0 bg-white border border-orange-200 rounded-xl px-2 py-2 text-center sm:px-4">
              <p className="text-xs text-neutral-500 mb-0.5">ดูคลิป</p>
              <p className="text-lg font-bold text-orange-600">{videoRateLabel}</p>
              <p className="text-xs text-neutral-400">{watchedCount}/{videos.length} คลิป</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1 sm:grid-cols-3 lg:flex lg:flex-wrap">
        {[
          { key: "plan", label: "แผนการสอน", icon: <BookOpen className="h-4 w-4" /> },
          ...(courseType === "single" ? [{ key: "attendance", label: "ตารางเข้าเรียน", icon: <Calendar className="h-4 w-4" /> }] : []),
          { key: "videos", label: "รายการคลิป", icon: <Video className="h-4 w-4" /> },
          { key: "files", label: "เอกสารประกอบ", icon: <FileText className="h-4 w-4" /> },
          ...(courseType === "single" ? [{ key: "overview", label: "ภาพรวม", icon: <BarChart2 className="h-4 w-4" /> }] : []),
          { key: "payments", label: "ค่าชำระคอร์ส", icon: <WalletCards className="h-4 w-4" /> },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center text-xs font-semibold transition sm:text-sm lg:px-4 ${
              activeTab === tab.key ? "bg-white shadow text-orange-600" : "text-neutral-500 hover:text-neutral-700"
            }`}>
            <span className="shrink-0">{tab.icon}</span><span className="min-w-0">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "plan" && (
        <section className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
          <header className="bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4">
            <h2 className="flex items-center gap-2 font-bold text-slate-900"><BookOpen className="h-5 w-5 text-orange-600" />แผนการสอนของคอร์ส</h2>
            <p className="mt-1 text-sm text-slate-600">หัวข้อที่ติวเตอร์เตรียมสอนและสื่อประกอบของแต่ละวิชา · สอนแล้ว {teachingTopics.filter(topic => topic.isTaught).length}/{teachingTopics.length} หัวข้อ</p>
          </header>
          <div className="space-y-4 p-4 sm:p-5">
            {subjects.length ? subjects.map(subject => {
              const topicList = teachingTopics.filter(topic => Number(topic.subjectId) === Number(subject.subjectId) && Number(topic.tutorId) === Number(subject.tutorId));
              const subjectVideos = videos.filter(video => Number(video.subjectId) === Number(subject.subjectId));
              const subjectFiles = files.filter(file => Number(file.subjectId) === Number(subject.subjectId));
              return <article key={`${subject.subjectId}-${subject.tutorId}`} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-slate-900">{subject.subjectName}</h3><p className="text-xs text-slate-500">ติวเตอร์ {subject.tutorName || 'ยังไม่ระบุ'}</p></div><span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{topicList.length} หัวข้อ</span></div>
                {topicList.length ? <ol className="mt-4 grid gap-2 sm:grid-cols-2">{topicList.map((topic, index) => <li key={topic.id} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-600">{index + 1}</span><span className="min-w-0 flex-1 break-words">{topic.title}{topic.plannedLessons?.length > 0 && <span className="block text-xs text-slate-500">คาดว่า {topic.plannedLessons.map(lesson => `${lesson.date} ${lesson.startTime}–${lesson.endTime}`).join(' · ')}</span>}{topic.taughtLessons?.map((lesson, lessonIndex) => <span key={lessonIndex} className="block text-xs text-emerald-700">สอน {lesson.date}{lesson.detail ? ` · ${lesson.detail}` : ''}</span>)}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${topic.isTaught ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{topic.isTaught ? 'สอนแล้ว' : 'ในแผน'}</span></li>)}</ol> : <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">ติวเตอร์ยังไม่ได้ระบุหัวข้อ</p>}
                <div className="mt-4 rounded-xl bg-white px-3 py-3 text-sm"><p className="font-semibold text-slate-700">สื่อประกอบของวิชานี้</p><div className="mt-2 flex flex-wrap gap-2">{subjectVideos.map(video => <button key={`video-${video.id}`} type="button" onClick={() => setActiveTab('videos')} className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100">▶ {video.title}</button>)}{subjectFiles.map(file => <button key={`file-${file.fileId}`} type="button" onClick={() => setActiveTab('files')} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">▤ {file.fileName}</button>)}{!subjectVideos.length && !subjectFiles.length && <span className="text-xs text-slate-500">ยังไม่มีสื่อประกอบ</span>}</div></div>
              </article>;
            }) : <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีข้อมูลวิชาในคอร์สนี้</p>}
          </div>
        </section>
      )}

      {courseType === "single" && activeTab === "attendance" && (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <h2 className="font-bold text-neutral-900">ประวัติการเข้าเรียนรายคาบ</h2>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">มา {attendedCount} คาบ</span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">ขาด {absentCount} คาบ</span>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <div className="flex justify-between text-xs text-neutral-500 mb-1">
              <span>อัตราการเข้าเรียน</span>
              <span className={`font-bold ${rateText}`}>{attendanceRateLabel}</span>
            </div>
            <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${rateColor}`} style={{ width: `${attendanceRate}%` }} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-xs">
                  <th className="text-left px-4 py-3 font-semibold">วันที่</th>
                  <th className="text-left px-4 py-3 font-semibold">วิชา</th>
                  <th className="text-center px-4 py-3 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-10 text-neutral-400">ยังไม่มีข้อมูลการเข้าเรียน</td></tr>
                ) : attendance.map((rec, idx) => (
                  <tr key={idx} className={`border-t border-neutral-100 ${rec.Status === "absent" ? "bg-red-50" : "hover:bg-neutral-50"}`}>
                    <td className="px-4 py-3 font-medium text-neutral-800">
                      {thaiDate(rec.StartDateTime, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{rec.SubjectName || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      {rec.Status === "present" ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          <CheckCircle className="h-3.5 w-3.5" /> มาเรียน
                        </span>
                      ) : rec.Status === "absent" ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                          <XCircle className="h-3.5 w-3.5" /> ขาดเรียน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-500 text-xs font-bold px-2.5 py-1 rounded-full">
                          <Clock className="h-3.5 w-3.5" /> ยังไม่บันทึก
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "videos" && (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-orange-600" />
              <h2 className="font-bold text-neutral-900">รายการคลิปทั้งหมด</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">▶ ดูแล้ว {watchedCount} คลิป</span>
              <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">⏸ ยังไม่ดู {videos.length - watchedCount} คลิป</span>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <div className="flex justify-between text-xs text-neutral-500 mb-1">
              <span>ความคืบหน้าการดูคลิป</span>
              <span className="font-bold text-orange-600">{videoRateLabel}</span>
            </div>
            <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all" style={{ width: `${videoRate}%` }} />
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {videos.length === 0 ? (
              <div className="text-center py-10 text-neutral-400">ยังไม่มีคลิปในคอร์สนี้</div>
            ) : videos.map((vid) => (
              <div key={vid.id} className={`grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 px-4 py-3.5 sm:flex sm:gap-4 ${vid.watched ? "" : "bg-neutral-50"}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${vid.watched ? "bg-orange-100" : "bg-neutral-200"}`}>
                  <PlayCircle className={`h-5 w-5 ${vid.watched ? "text-orange-600" : "text-neutral-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${vid.watched ? "text-neutral-900" : "text-neutral-400"}`}>{vid.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{vid.duration}</span>
                    {vid.watchedAt && <span>ดูเมื่อ {thaiDate(vid.watchedAt, { day: "numeric", month: "short", year: "numeric" })}</span>}
                  </div>
                  {!vid.watched && vid.progress > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${vid.progress}%` }} />
                      </div>
                      <span className="text-xs text-orange-500 font-medium">{vid.progress}%</span>
                    </div>
                  )}
                </div>
                <div className="col-span-2 justify-self-end sm:col-auto sm:shrink-0">
                  {vid.url ? (
                    <Link to={`/profile/course-content/${courseId}${vid.id != null ? `?videoId=${encodeURIComponent(vid.id)}` : ""}`} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1.5 rounded-full hover:bg-orange-200">
                      <PlayCircle className="h-3.5 w-3.5" /> เปิดดูวิดีโอ
                    </Link>
                  ) : vid.watched ? (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5" /> ดูแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-neutral-200 text-neutral-500 text-xs font-bold px-2.5 py-1 rounded-full">ยังไม่ดู</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <h2 className="font-bold text-neutral-900">เอกสารประกอบการเรียน</h2>
            </div>
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">{files.length} ไฟล์</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {files.length === 0 ? (
              <div className="text-center py-10 text-neutral-400">ยังไม่มีเอกสารในคอร์สนี้</div>
            ) : files.map((file) => (
              <div key={file.fileId} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 px-4 py-3.5 sm:flex sm:gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{file.fileName || "เอกสารประกอบ"}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{file.subjectName || "ไม่ระบุวิชา"}</p>
                </div>
                {file.filePath ? (
                  <a href={resolveUrl(file.filePath)} target="_blank" rel="noreferrer" className="col-span-2 inline-flex items-center justify-center gap-1.5 justify-self-end rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 sm:col-auto">
                    <Download className="h-3.5 w-3.5" /> ดาวน์โหลด
                  </a>
                ) : (
                  <span className="col-span-2 justify-self-end text-xs text-neutral-400 sm:col-auto">ไม่มีไฟล์</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {courseType === "single" && activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "คาบทั้งหมด", value: attendance.length, color: "text-neutral-700", icon: <Calendar className="h-5 w-5 text-neutral-500" /> },
              { label: "มาเรียน", value: `${attendedCount} คาบ`, color: "text-green-600", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { label: "ขาดเรียน", value: `${absentCount} คาบ`, color: "text-red-500", icon: <XCircle className="h-5 w-5 text-red-400" /> },
              { label: "คลิปที่ยังไม่ดู", value: `${videos.length - watchedCount} คลิป`, color: "text-orange-600", icon: <Video className="h-5 w-5 text-orange-500" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-neutral-500 font-medium">{s.label}</span></div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-5 w-5 text-orange-600" />
              <h2 className="font-bold text-neutral-900">Timeline การเข้าเรียน</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {attendance.map((rec, idx) => (
                <div key={idx}
                  title={`${rec.StartDateTime} – ${rec.SubjectName} – ${rec.Status === "present" ? "มาเรียน" : rec.Status === "absent" ? "ขาดเรียน" : "ยังไม่บันทึก"}`}
                  className={`group relative h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold cursor-default border-2 transition ${
                    rec.Status === "present" ? "bg-green-100 border-green-300 text-green-700" : rec.Status === "absent" ? "bg-red-100 border-red-300 text-red-600" : "bg-neutral-100 border-neutral-300 text-neutral-500"
                  }`}>
                  {idx + 1}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-300 inline-block" /> มาเรียน</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-300 inline-block" /> ขาดเรียน</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-neutral-300 inline-block" /> ยังไม่บันทึก</span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-5 w-5 text-orange-600" />
              <h2 className="font-bold text-neutral-900">ความคืบหน้าคลิป</h2>
            </div>
            <div className="space-y-2.5">
              {videos.map((vid) => (
                <div key={vid.id} className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500 w-32 truncate shrink-0">{vid.title}</span>
                  <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${vid.watched ? "bg-orange-500" : "bg-neutral-300"}`} style={{ width: `${vid.watched ? 100 : vid.progress}%` }} />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${vid.watched ? "text-orange-600" : "text-neutral-400"}`}>
                    {vid.watched ? "100%" : `${vid.progress}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "payments" && <CoursePaymentsTab courseId={courseId} courseType={courseType} fullCost={fullCost} />}
    </div>
  );
}
