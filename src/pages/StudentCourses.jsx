// ===================== 1) StudentCourses.jsx =====================
import { BookOpen, Users, Clock, Video, FileText, Search, ClipboardList, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getStudentCourses,
  getStudentFiles,
  getStudentSchedule,
  getStudentSubjectsProgress,
  getStudentVideos,
} from "../callapi/callusers_student";
import { fetchExamSchedule } from "../utils/studentExamShared";

function unwrapList(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }
  return Array.isArray(payload?.data) ? payload.data : [];
}

function safeCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

export default function StudentCourses() {
  const token = localStorage.getItem("student_token");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // ── สถานะคอร์ส (คำนวณจากวันที่ เหมือนของติวเตอร์) ──────────────
  const mapStatus = (startDate, lastDate) => {
    if (!startDate || !lastDate) {
      return { id: "upcoming", text: "รอกำหนดวันเรียน", colorClass: "bg-blue-100 text-blue-700" };
    }
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(lastDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { id: "upcoming", text: "รอกำหนดวันเรียน", colorClass: "bg-blue-100 text-blue-700" };
    }
    if (typeof lastDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(lastDate)) end.setHours(23, 59, 59, 999);

    if (today > end) {
      return { id: "completed", text: "เรียนจบแล้ว", colorClass: "bg-neutral-200 text-neutral-700" };
    }
    if (today >= start && today <= end) {
      return { id: "active", text: "กำลังเรียน", colorClass: "bg-green-100 text-green-700" };
    }
    return { id: "upcoming", text: "ยังไม่เริ่มเรียน", colorClass: "bg-blue-100 text-blue-700" };
  };

  // ── progress ตามคาบที่ผ่านไปแล้ว (เหมือน hours ของติวเตอร์) ────
  const calcProgress = (completed, total) => {
    if (!total) return 0;
    return Math.min(Math.max(Math.round((completed / total) * 100), 0), 100);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getStudentCourses(token);
        const courseList = unwrapList(data, ["courses"]);

        const scheduleResult = await getStudentSchedule(token).catch(() => []);
        const allSchedules = unwrapList(scheduleResult, ["schedule", "schedules"]);

        const contentByCourse = await Promise.all(courseList.map(async (course) => {
          const id = course.courseId ?? course.CourseId ?? course.CourseID ?? course.id;
          const [videoResult, fileResult, scheduleResult2, subjectsResult] = await Promise.allSettled([
            getStudentVideos(token, id),
            getStudentFiles(token, id),
            fetchExamSchedule(id), // ไม่ส่ง subjectId = เอากำหนดสอบทุกวิชาในคอร์สนี้
            getStudentSubjectsProgress(token, id),
          ]);
          return {
            id: String(id),
            videos: videoResult.status === "fulfilled" ? unwrapList(videoResult.value, ["videos"]) : [],
            files: fileResult.status === "fulfilled" ? unwrapList(fileResult.value, ["files", "documents"]) : [],
            examSchedule: scheduleResult2.status === "fulfilled" ? (scheduleResult2.value?.schedule || []) : [],
            subjects: subjectsResult.status === "fulfilled" ? unwrapList(subjectsResult.value, ["subjects"]) : [],
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
          const courseContent = contentMap.get(String(courseId)) ?? { videos: [], files: [], subjects: [] };

          const apiTotalSessions = safeCount(c.totalSessions ?? c.TotalSessions);
          const subjectTotalSessions = courseContent.subjects.reduce((sum, subject) =>
            sum + safeCount(subject.totalSessions ?? subject.TotalSessions), 0);
          const subjectAttendedSessions = courseContent.subjects.reduce((sum, subject) =>
            sum + safeCount(subject.attendedSessions ?? subject.AttendedSessions), 0);
          const totalSessions = Math.max(courseSchedules.length, apiTotalSessions, subjectTotalSessions);

          const courseType = c.courseType ?? c.CourseType ?? c.Course_Type ?? "bundle";
          const derivedCompletedSessions = courseSchedules.filter((item) => {
            const date = new Date(item.StartDateTime ?? item.startDateTime ?? item.ClassDate ?? item.classDate);
            return !Number.isNaN(date.getTime()) && date < new Date();
          }).length;
          const completedSessions = courseSchedules.length
            ? derivedCompletedSessions
            : courseType === "single" ? Math.max(safeCount(c.completedSessions ?? c.CompletedSessions), subjectAttendedSessions) : 0;

          const statusInfo = mapStatus(startDate, lastDate);

          const plannedTopicCount = safeCount(c.plannedTopicCount ?? c.PlannedTopicCount);
          const taughtTopicCount = safeCount(c.taughtTopicCount ?? c.TaughtTopicCount);
          const progress = courseType === "bundle"
            ? calcProgress(taughtTopicCount, plannedTopicCount)
            : calcProgress(completedSessions, totalSessions);

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

            completedSessions: Math.min(totalSessions, completedSessions),
            plannedTopicCount,
            taughtTopicCount,

            totalVideos:
              courseContent.videos.length || safeCount(c.totalVideos ?? c.TotalVideos),

            watchedVideos:
              courseContent.videos.length
                ? courseContent.videos.filter((video) => Number(video.WatchPercent ?? video.watchPercent ?? 0) >= 80).length
                : safeCount(c.watchedVideos ?? c.WatchedVideos),

            totalFiles:
              courseContent.files.length || safeCount(c.totalFiles ?? c.TotalFiles),

            courseType,

            statusId: statusInfo.id,
            statusText: statusInfo.text,
            statusColor: statusInfo.colorClass,
            progress,

            examSchedule: courseContent.examSchedule,
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
  }, [token, reloadKey]);

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
    const typeMatch = filterType === "all" || c.courseType === filterType;
    const searchMatch = search === "" || String(c.name || "").toLowerCase().includes(search.toLowerCase());
    return statusMatch && typeMatch && searchMatch;
  });

  if (loading) {
    return <div className="mt-[90px] text-center p-10 font-medium text-neutral-500">กำลังโหลดข้อมูลคอร์ส...</div>;
  }

  if (error) {
    return (
      <div className="mt-[90px] rounded-xl bg-red-50 p-10 text-center font-medium text-red-600" role="alert">
        {error}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" /> ลองใหม่
          </button>
        </div>
      </div>
    );
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
        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-2.5 text-center shadow-sm transition hover:shadow-md sm:flex-row sm:gap-4 sm:p-4 sm:text-left">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] leading-tight text-neutral-600 font-medium sm:text-xs">{stat.label}</p>
                  <p className="text-xl font-bold text-neutral-900 sm:text-2xl">{stat.value}</p>
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
              className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[160px]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">ทุกประเภทคอร์ส</option>
              <option value="bundle">คอร์สรวม</option>
              <option value="single">คอร์สเดี่ยว</option>
            </select>
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
                        {course.courseType === "bundle" ? "ความคืบหน้าแผนการสอน" : "ความคืบหน้า"} <span className="text-neutral-400 font-medium ml-1">{course.courseType === "bundle" ? `(${course.taughtTopicCount}/${course.plannedTopicCount} หัวข้อ)` : `(${course.completedSessions}/${course.totalSessions} คาบ)`}</span>
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
                      <p className="font-bold text-neutral-900 leading-none">{course.courseType === "bundle" ? `${course.taughtTopicCount}/${course.plannedTopicCount}` : `${course.completedSessions}/${course.totalSessions}`}</p>
                      <p className="text-[9px] text-neutral-500 font-medium mt-1 uppercase">{course.courseType === "bundle" ? "หัวข้อที่สอน" : "คาบเรียน"}</p>
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

                {/* กำหนดสอบล่วงหน้า (ยังไม่เปิด) — โชว์ให้เห็นเฉยๆ ไม่เกี่ยวกับปุ่ม "เข้าสอบ" ด้านล่าง */}
                {course.examSchedule?.length > 0 && (
                  <div className="px-4 pt-3 space-y-1.5">
                    {course.examSchedule.map((s) => {
                      const d = new Date(s.examDate);
                      const dateLabel = d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
                      const timeLabel = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                      return (
                        <div key={s.examId} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-amber-800">
                            {s.subjectName ? `${s.subjectName} · ` : ""}{s.examName}: กำหนดสอบ {dateLabel} เวลา {timeLabel} น.
                          </p>
                          <p className="text-[10px] text-amber-700 mt-0.5">
                            {s.openMode === "auto" ? "ระบบจะเปิดสอบให้อัตโนมัติเมื่อถึงเวลานี้" : "ติวเตอร์จะเป็นคนกดเปิดสอบเอง เวลานี้อาจเปลี่ยนแปลงได้"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ปุ่ม 3 ปุ่ม: เนื้อหา / เข้าสอบ / รายละเอียด */}
                <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 bg-white p-3 sm:flex sm:gap-3 sm:p-4">
                  <Link
                    to={`/profile/course/${course.id}/subjects`}
                    className="min-w-0 flex-1 bg-orange-50 text-orange-600 border-2 border-orange-100 rounded-xl py-2.5 hover:bg-orange-100 hover:border-orange-200 transition flex items-center justify-center gap-1 font-bold text-xs shadow-sm sm:gap-2 sm:text-sm"
                  >
                    <FileText className="h-4 w-4" /> เนื้อหาในคอร์ส
                  </Link>

                  <Link
                    to={`/profile/course/${course.id}/exams`}
                    className="min-w-0 flex-1 bg-green-50 text-green-700 border-2 border-green-100 rounded-xl py-2.5 hover:bg-green-100 hover:border-green-200 transition flex items-center justify-center gap-1 font-bold text-xs shadow-sm sm:gap-2 sm:text-sm"
                  >
                    <ClipboardList className="h-4 w-4" /> การสอบ
                  </Link>

                  <Link
                    to={`/profile/course-detail/${course.id}`}
                    className="col-span-2 min-w-0 flex-1 border-2 border-neutral-200 text-neutral-700 rounded-xl py-2.5 hover:bg-neutral-50 hover:border-neutral-300 transition flex items-center justify-center gap-1 font-bold text-xs sm:col-span-1 sm:gap-2 sm:text-sm"
                  >
                    <Users className="h-4 w-4 text-neutral-400" /> ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


    </div>
  );
}
