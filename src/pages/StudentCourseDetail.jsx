// ===================== 3) StudentCourseDetail.jsx =====================
// สไตล์เป๊ะจาก TutorStudentDetail.jsx แต่ดึงข้อมูลของนักเรียนคนที่ล็อกอินอยู่เอง ในคอร์สที่เลือก
import { Link, useSearchParams, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Users, Calendar, Video, FileText, Download, BarChart2, ChevronRight, PlayCircle,
  CheckCircle, XCircle, Clock,
  WalletCards,
} from "lucide-react";
import { getStudentCourseDetail } from "../callapi/callusers_student";
import CoursePaymentsTab from "../components/CoursePaymentsTab";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

export default function StudentCourseDetail() {
  const { courseId: routeCourseId } = useParams();
  const [searchParams] = useSearchParams();

  // รองรับทั้ง /student/courses/:courseId และ ?courseId=...
  const courseId = routeCourseId || searchParams.get("courseId");
  const token = localStorage.getItem("student_token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseName, setCourseName] = useState(
    searchParams.get("courseName") || "คอร์สเรียน"
  );
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [videos, setVideos] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState("attendance");

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

        const profile = response.student || {};
        setStudent({
          UserId: profile.userId,
          Firstname: profile.firstname || "",
          Lastname: profile.lastname || "",
          Nickname: profile.nickname || "student",
          Photo: profile.photo || "",
          SchoolName: profile.schoolName || "",
          PhoneNo: profile.phoneNo || "",
          GradeDetail: profile.gradeDetail || "ไม่ระบุระดับชั้น",
        });
        setCourseName(response.course?.courseName || "คอร์สเรียน");
        setAttendance((response.schedule || []).map((item) => ({
          StudentAttendanceId: item.attendanceId || item.courseScheduleDetailId,
          CourseScheduleDetailId: item.courseScheduleDetailId,
          SubjectName: item.subjectName,
          TutorName: item.tutorName,
          Room: item.room,
          StartDateTime: item.classDate && item.startTime
            ? `${item.classDate}T${item.startTime}`
            : item.classDate,
          EndTime: item.endTime,
          Status: normalizeAttendance(item.attendanceStatus),
          RawStatus: item.attendanceStatus,
          Reason: item.attendanceReason,
        })));
        setVideos((response.videos || []).map((video) => {
          const progress = Math.round(Number(video.watchPercent || 0));
          return {
            id: video.videoId,
            title: video.videoTitle || "ไม่มีชื่อคลิป",
            subjectName: video.subjectName,
            duration: video.duration || "-",
            url: video.videoUrl,
            watched: progress >= 80,
            watchedAt: video.watchDate,
            progress,
          };
        }));
        setFiles(response.files || []);
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
  }, [courseId, token]);

  const attendedCount = attendance.filter((a) => a.Status === "present").length;
  const absentCount = attendance.filter((a) => a.Status === "absent").length;
  const recordedCount = attendedCount + absentCount;
  const attendanceRate = recordedCount ? Math.round((attendedCount / recordedCount) * 100) : 0;
  const watchedCount = videos.filter((v) => v.watched).length;
  const videoRate = videos.length
    ? Math.round(videos.reduce((sum, video) => sum + video.progress, 0) / videos.length)
    : 0;

  const rateColor = attendanceRate >= 80 ? "bg-green-500" : attendanceRate >= 60 ? "bg-orange-500" : "bg-red-500";
  const rateText = attendanceRate >= 80 ? "text-green-600" : attendanceRate >= 60 ? "text-orange-500" : "text-red-500";

  if (loading) return <div className="mt-[90px] text-center p-10 text-orange-600 font-medium">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="mt-[90px] text-center p-10 text-red-500">{error}</div>;
  if (!student) return <div className="mt-[90px] text-center p-10 text-neutral-500">ไม่พบข้อมูลนักเรียน</div>;

  return (
    <div className="space-y-6 mt-[90px]">
      <div className="flex items-center text-sm text-neutral-500 gap-2">
        <Link to="/profile/my-courses" className="hover:text-orange-600 transition font-medium">คอร์สเรียนของฉัน</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-800 font-semibold">{courseName}</span>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="h-20 w-20 rounded-xl border-2 border-orange-200 overflow-hidden shrink-0 bg-white">
            <img src={student.Photo ? resolveUrl(student.Photo) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.Nickname}&backgroundColor=fef3c7`} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-neutral-900">{student.Firstname} {student.Lastname}</h1>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-neutral-600">
              <span className="bg-white border rounded px-2 py-0.5">🏫 {student.SchoolName || "ไม่ระบุ"}</span>
              <span className="bg-white border rounded px-2 py-0.5">📞 {student.PhoneNo || "-"}</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5">{student.GradeDetail}</span>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white border border-green-200 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-neutral-500 mb-0.5">เข้าเรียน</p>
              <p className={`text-lg font-bold ${rateText}`}>{attendanceRate}%</p>
              <p className="text-xs text-neutral-400">{attendedCount}/{recordedCount} คาบที่บันทึก</p>
            </div>
            <div className="bg-white border border-orange-200 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-neutral-500 mb-0.5">ดูคลิป</p>
              <p className="text-lg font-bold text-orange-600">{videoRate}%</p>
              <p className="text-xs text-neutral-400">{watchedCount}/{videos.length} คลิป</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit flex-wrap">
        {[
          { key: "attendance", label: "ตารางเข้าเรียน", icon: <Calendar className="h-4 w-4" /> },
          { key: "videos", label: "รายการคลิป", icon: <Video className="h-4 w-4" /> },
          { key: "files", label: "เอกสารประกอบ", icon: <FileText className="h-4 w-4" /> },
          { key: "overview", label: "ภาพรวม", icon: <BarChart2 className="h-4 w-4" /> },
          { key: "payments", label: "ค่าชำระคอร์ส", icon: <WalletCards className="h-4 w-4" /> },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.key ? "bg-white shadow text-orange-600" : "text-neutral-500 hover:text-neutral-700"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "attendance" && (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
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
              <span className={`font-bold ${rateText}`}>{attendanceRate}%</span>
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
                      {new Date(rec.StartDateTime).toLocaleDateString("th-TH", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
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
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-orange-600" />
              <h2 className="font-bold text-neutral-900">รายการคลิปทั้งหมด</h2>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">▶ ดูแล้ว {watchedCount} คลิป</span>
              <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">⏸ ยังไม่ดู {videos.length - watchedCount} คลิป</span>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <div className="flex justify-between text-xs text-neutral-500 mb-1">
              <span>ความคืบหน้าการดูคลิป</span>
              <span className="font-bold text-orange-600">{videoRate}%</span>
            </div>
            <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all" style={{ width: `${videoRate}%` }} />
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {videos.length === 0 ? (
              <div className="text-center py-10 text-neutral-400">ยังไม่มีคลิปในคอร์สนี้</div>
            ) : videos.map((vid) => (
              <div key={vid.id} className={`flex items-center gap-4 px-4 py-3.5 ${vid.watched ? "" : "bg-neutral-50"}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${vid.watched ? "bg-orange-100" : "bg-neutral-200"}`}>
                  <PlayCircle className={`h-5 w-5 ${vid.watched ? "text-orange-600" : "text-neutral-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${vid.watched ? "text-neutral-900" : "text-neutral-400"}`}>{vid.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{vid.duration}</span>
                    {vid.watchedAt && <span>ดูเมื่อ {new Date(vid.watchedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>}
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
                <div className="shrink-0">
                  {vid.url ? (
                    <a href={resolveUrl(vid.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1.5 rounded-full hover:bg-orange-200">
                      <PlayCircle className="h-3.5 w-3.5" /> เปิดดูวิดีโอ
                    </a>
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
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
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
              <div key={file.fileId} className="flex items-center gap-4 px-4 py-3.5">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{file.fileName || "เอกสารประกอบ"}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{file.subjectName || "ไม่ระบุวิชา"}</p>
                </div>
                {file.filePath ? (
                  <a href={resolveUrl(file.filePath)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border border-blue-200 text-blue-600 text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-50">
                    <Download className="h-3.5 w-3.5" /> ดาวน์โหลด
                  </a>
                ) : (
                  <span className="text-xs text-neutral-400">ไม่มีไฟล์</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "overview" && (
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

      {activeTab === "payments" && <CoursePaymentsTab courseId={courseId} />}
    </div>
  );
}
