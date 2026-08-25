// ===================== 1) StudentCourses.jsx =====================
import { BookOpen, Users, Clock, Video, FileText, Search, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getStudentCourses,
  getStudentFiles,
  getStudentSchedule,
  getStudentVideos,
} from "../callapi/callusers_student";
import { fetchExamEntry, getCurrentUserId } from "../utils/studentExamShared";

function unwrapList(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return Array.isArray(payload?.data) ? payload.data : [];
}

export default function StudentCourses() {
  const token = localStorage.getItem("student_token");
  const navigate = useNavigate();
  const [examLoadingId, setExamLoadingId] = useState(null);
  const [examError, setExamError] = useState(null); // { courseId, message }
  const [examChoices, setExamChoices] = useState(null); // [{ subjectId, subjectName, examName, token }]

  const handleEnterExam = async (courseId) => {
    const userId = getCurrentUserId();
    if (!userId) return navigate("/login");
    setExamLoadingId(courseId);
    setExamError(null);
    try {
      const data = await fetchExamEntry(courseId, userId);
      if (data.token) {
        navigate(`/exam/${data.token}`);
      } else if (data.choices?.length) {
        setExamChoices(data.choices);
      }
    } catch (err) {
      setExamError({ courseId, message: err.response?.data?.message || "ยังไม่มีข้อสอบที่เปิดอยู่ตอนนี้" });
    } finally {
      setExamLoadingId(null);
    }
  };

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── สถานะคอร์ส (คำนวณจากวันที่ เหมือนของติวเตอร์) ──────────────
  const mapStatus = (startDate, lastDate) => {
    if (!startDate || !lastDate) {
      return { id: "upcoming", text: "รอกำหนดวันเรียน", colorClass: "bg-blue-100 text-blue-700" };
    }
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(lastDate);

    if (today > end) {
      return { id: "completed", text: "เรียนจบแล้ว", colorClass: "bg-neutral-200 text-neutral-700" };
    }
    if (today >= start && today <= end) {
      return { id: "active", text: "กำลังเรียน", colorClass: "bg-green-100 text-green-700" };
    }
    return { id: "upcoming", text: "ยังไม่เริ่มเรียน", colorClass: "bg-blue-100 text-blue-700" };
  };

  // ── progress ตามคาบที่ผ่านไปแล้ว (เหมือน hours ของติวเตอร์) ────
  const calcProgress = (completed, total, statusId) => {
    if (statusId === "completed") return 100;
    if (!total) return 0;
    return Math.min(Math.max(Math.round((completed / total) * 100), 0), 100);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getStudentCourses(token);
        const courseList = unwrapList(data, ["courses"]);

        const scheduleResult = await getStudentSchedule(token).catch(() => []);
        const allSchedules = unwrapList(scheduleResult, ["schedule", "schedules"]);

        const contentByCourse = await Promise.all(courseList.map(async (course) => {
          const id = course.courseId ?? course.CourseId ?? course.CourseID ?? course.id;
          const [videoResult, fileResult] = await Promise.allSettled([
            getStudentVideos(token, id),
            getStudentFiles(token, id),
          ]);
          return {
            id: String(id),
            videos: videoResult.status === "fulfilled" ? unwrapList(videoResult.value, ["videos"]) : [],
            files: fileResult.status === "fulfilled" ? unwrapList(fileResult.value, ["files", "documents"]) : [],
          };
        }));
        const contentMap = new Map(contentByCourse.map((item) => [item.id, item]));

        const formatted = courseList.map((c) => {
          const courseId = c.courseId ?? c.CourseId ?? c.CourseID ?? c.id;
          const startDate = c.startDate ?? c.StartDate;
          const lastDate = c.lastDate ?? c.LastDate;

          const courseSchedules = allSchedules.filter((item) =>
            String(item.CourseID ?? item.CourseId ?? item.courseId) === String(courseId)
          );
          const courseContent = contentMap.get(String(courseId)) ?? { videos: [], files: [] };

          const apiTotalSessions = Number(c.totalSessions ?? c.TotalSessions ?? 0);
          const totalSessions = courseSchedules.length || apiTotalSessions;

          const derivedCompletedSessions = courseSchedules.filter((item) => {
            const status = String(item.AttendanceStatus ?? item.attendanceStatus ?? item.Status ?? item.status ?? "").toLowerCase();
            if (status === "present") return true;
            if (status === "absent") return false;
            const date = new Date(item.StartDateTime ?? item.startDateTime ?? item.ClassDate ?? item.classDate);
            return !Number.isNaN(date.getTime()) && date < new Date();
          }).length;
          const completedSessions = courseSchedules.length
            ? derivedCompletedSessions
            : Number(c.completedSessions ?? c.CompletedSessions ?? 0);

          const statusInfo = mapStatus(startDate, lastDate);

          const progress = calcProgress(
            completedSessions,
            totalSessions,
            statusInfo.id
          );

          return {
            id: courseId,
            enrollId: c.enrollId ?? c.EnrollId,
            name: c.courseName ?? c.CourseName ?? c.name ?? "คอร์สเรียน",

            startDate: startDate
              ? new Date(startDate).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
              : "ไม่ระบุ",

            totalSessions,

            completedSessions:
              statusInfo.id === "completed"
                ? totalSessions
                : completedSessions,

            totalVideos:
              courseContent.videos.length || Number(c.totalVideos ?? c.TotalVideos ?? 0),

            watchedVideos:
              courseContent.videos.length
                ? courseContent.videos.filter((video) => Number(video.WatchPercent ?? video.watchPercent ?? 0) >= 80).length
                : Number(c.watchedVideos ?? c.WatchedVideos ?? 0),

            totalFiles:
              courseContent.files.length || Number(c.totalFiles ?? c.TotalFiles ?? 0),

            statusId: statusInfo.id,
            statusText: statusInfo.text,
            statusColor: statusInfo.colorClass,
            progress,
          };
        });

        setCourses(formatted);
      } catch (err) {
        console.error("Error fetching student courses:", err);
        setError(typeof err === "string" ? err : err?.message || "โหลดข้อมูลคอร์สไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [token]);

  // ── สถิติรวมด้านบน ─────────────────────────────────────────
  const activeCount = courses.filter((c) => c.statusId === "active").length;
  const totalSessionsAll = courses.reduce((sum, c) => sum + Number(c.totalSessions), 0);

  const stats = [
    { label: "คอร์สทั้งหมด", value: courses.length.toString(), icon: BookOpen },
    { label: "กำลังเรียน", value: activeCount.toString(), icon: Users },
    { label: "คาบเรียนรวม", value: totalSessionsAll.toString(), icon: Clock },
  ];

  const filteredCourses = courses.filter((c) => {
    const statusMatch = filterStatus === "all" || c.statusId === filterStatus;
    const searchMatch = search === "" || String(c.name || "").toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  if (loading) {
    return <div className="mt-[90px] text-center p-10 font-medium text-neutral-500">กำลังโหลดข้อมูลคอร์ส...</div>;
  }

  if (error) {
    return <div className="mt-[90px] rounded-xl bg-red-50 p-10 text-center font-medium text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 mt-[90px]">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">คอร์สเรียนของฉัน</h1>
          <p className="text-sm text-neutral-500 mt-1">
            ดูวิดีโอ เอกสาร และติดตามความคืบหน้าการเรียนของคุณ
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-neutral-600 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อคอร์ส..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none"
              />
            </div>
            <select
              className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[180px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">กำลังเรียน</option>
              <option value="completed">เรียนจบแล้ว</option>
              <option value="upcoming">ยังไม่เริ่มเรียน</option>
            </select>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
          {filteredCourses.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-white rounded-3xl border border-neutral-200 border-dashed">
              <div className="text-5xl mb-3">📚</div>
              <p className="text-neutral-500 font-medium">ไม่พบคอร์สเรียนของคุณ</p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-neutral-100 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <h2 className="text-lg font-bold text-neutral-900 leading-tight mb-1">{course.name}</h2>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> เริ่มเรียน: {course.startDate}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap shadow-sm border border-white/50 ${course.statusColor}`}>
                      {course.statusText}
                    </span>
                  </div>

                  <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-600 font-bold">
                        ความคืบหน้า <span className="text-neutral-400 font-medium ml-1">({course.completedSessions}/{course.totalSessions} คาบ)</span>
                      </span>
                      <span className="font-black text-orange-600">{course.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 ease-out" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                </div>

                {/* สรุปตัวเลข: คาบเรียน / วิดีโอ / ไฟล์ */}
                <div className="grid grid-cols-3 gap-2 p-4 bg-neutral-50/50 border-y border-neutral-100">
                  <div className="flex items-center gap-2 border-r border-neutral-200 pr-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 leading-none">{course.completedSessions}/{course.totalSessions}</p>
                      <p className="text-[9px] text-neutral-500 font-medium mt-1 uppercase">คาบเรียน</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-r border-neutral-200 pr-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 leading-none">{course.watchedVideos}/{course.totalVideos}</p>
                      <p className="text-[9px] text-neutral-500 font-medium mt-1 uppercase">วิดีโอ</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 leading-none">{course.totalFiles}</p>
                      <p className="text-[9px] text-neutral-500 font-medium mt-1 uppercase">ไฟล์</p>
                    </div>
                  </div>
                </div>

                {/* ปุ่ม 3 ปุ่ม: เนื้อหา / เข้าสอบ / รายละเอียด */}
                <div className="flex gap-3 p-4 bg-white border-t border-neutral-100">
                  <Link
                    to={`/profile/course-content/${course.id}`}
                    className="flex-1 bg-orange-50 text-orange-600 border-2 border-orange-100 rounded-xl py-2.5 hover:bg-orange-100 hover:border-orange-200 transition flex items-center justify-center gap-2 font-bold text-sm shadow-sm"
                  >
                    <FileText className="h-4 w-4" /> เนื้อหาในคอร์ส
                  </Link>

                  <div className="flex-1 relative">
                    <button
                      onClick={() => handleEnterExam(course.id)}
                      disabled={examLoadingId === course.id}
                      className="w-full h-full bg-green-50 text-green-700 border-2 border-green-100 rounded-xl py-2.5 hover:bg-green-100 hover:border-green-200 disabled:opacity-50 transition flex items-center justify-center gap-2 font-bold text-sm shadow-sm"
                    >
                      <ClipboardList className="h-4 w-4" /> {examLoadingId === course.id ? "กำลังตรวจสอบ…" : "เข้าสอบ"}
                    </button>
                    {examError?.courseId === course.id && (
                      <p className="absolute top-full left-0 right-0 mt-1 text-[11px] text-red-500 text-center">{examError.message}</p>
                    )}
                  </div>

                  <Link
                    to={`/profile/course-detail/${course.id}`}
                    className="flex-1 border-2 border-neutral-200 text-neutral-700 rounded-xl py-2.5 hover:bg-neutral-50 hover:border-neutral-300 transition flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    <Users className="h-4 w-4 text-neutral-400" /> ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {examChoices && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setExamChoices(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-neutral-900 mb-1 text-center">เลือกวิชาที่จะเข้าสอบ</h3>
            <p className="text-sm text-neutral-500 mb-4 text-center">คอร์สนี้มีข้อสอบเปิดอยู่มากกว่า 1 วิชา</p>
            <div className="space-y-2">
              {examChoices.map((c) => (
                <button
                  key={c.token}
                  onClick={() => navigate(`/exam/${c.token}`)}
                  className="w-full text-left border-2 border-neutral-200 hover:border-green-300 hover:bg-green-50 rounded-xl px-4 py-3 transition"
                >
                  <p className="font-semibold text-neutral-800 text-sm">{c.subjectName}</p>
                  <p className="text-xs text-neutral-500">{c.examName}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setExamChoices(null)} className="w-full mt-4 text-sm text-neutral-500 hover:text-neutral-700 font-medium">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}
