// ===================== 1) StudentCourses.jsx =====================
import { API_URL } from "../config";
import { BookOpen, Users, Clock, Video, FileText, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStudentCourses } from "../callapi/callusers_student";

export default function StudentCourses() {
  const token = localStorage.getItem("student_token");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── สถานะคอร์ส (คำนวณจากวันที่ เหมือนของติวเตอร์) ──────────────
  const mapStatus = (startDate, lastDate) => {
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
        // ⚠️ ใช้ endpoint เดิม GET /api/student/courses (ดู student.routes.js)
        const data = await getStudentCourses(token);

        const formatted = data.map((c) => {
          const statusInfo = mapStatus(c.StartDate, c.LastDate);
          const progress = calcProgress(c.CompletedSessions, c.TotalSessions, statusInfo.id);

          return {
            id: c.CourseID,
            enrollId: c.EnrollId,
            name: c.CourseName,
            startDate: c.StartDate
              ? new Date(c.StartDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
              : "ไม่ระบุ",
            totalSessions: c.TotalSessions || 0,
            completedSessions: statusInfo.id === "completed" ? (c.TotalSessions || 0) : (c.CompletedSessions || 0),
            totalVideos: c.TotalVideos || 0,
            watchedVideos: c.WatchedVideos || 0,
            totalFiles: c.TotalFiles || 0,

            statusId: statusInfo.id,
            statusText: statusInfo.text,
            statusColor: statusInfo.colorClass,
            progress,
          };
        });

        setCourses(formatted);
      } catch (err) {
        console.error("Error fetching student courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

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
    const searchMatch = search === "" || c.name.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  if (loading) {
    return <div className="mt-[90px] text-center p-10 font-medium text-neutral-500">กำลังโหลดข้อมูลคอร์ส...</div>;
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

                {/* ปุ่ม 2 ปุ่ม ตามที่ขอ */}
                <div className="flex gap-3 p-4 bg-white border-t border-neutral-100">
                  <Link
                      to={`/profile/course-content?courseId=${course.id}&subjectId=${course.subjectId}&courseName=${encodeURIComponent(course.name)}&subjectName=${encodeURIComponent(course.subjectName || "")}`}
                    className="flex-1 bg-orange-50 text-orange-600 border-2 border-orange-100 rounded-xl py-2.5 hover:bg-orange-100 hover:border-orange-200 transition flex items-center justify-center gap-2 font-bold text-sm shadow-sm"
                  >
                    <FileText className="h-4 w-4" /> เนื้อหาในคอร์ส
                  </Link>

                  <Link
                      to={`/profile/course-detail?courseId=${course.id}&subjectId=${course.subjectId}&courseName=${encodeURIComponent(course.name)}&subjectName=${encodeURIComponent(course.subjectName || "")}`}
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
    </div>
  );
}