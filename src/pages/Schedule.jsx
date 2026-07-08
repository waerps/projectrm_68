import { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, MapPin, User, Loader2, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { getStudentSchedule } from "../callapi/callusers_student";

// DayOfWeek: 1=อาทิตย์ 2=จันทร์ ... 7=เสาร์
const DAY_MAP = {
  1: "อาทิตย์",
  2: "จันทร์",
  3: "อังคาร",
  4: "พุธ",
  5: "พฤหัสบดี",
  6: "ศุกร์",
  7: "เสาร์",
};

const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1]; // จันทร์–อาทิตย์

const SUBJECT_COLORS = {
  ภาษาไทย: "bg-pink-100 text-pink-700 border-pink-200",
  คณิตศาสตร์: "bg-blue-100 text-blue-700 border-blue-200",
  วิทยาศาสตร์: "bg-green-100 text-green-700 border-green-200",
  ภาษาอังกฤษ: "bg-purple-100 text-purple-700 border-purple-200",
  สังคม: "bg-orange-100 text-orange-700 border-orange-200",
};

function subjectColor(name) {
  return SUBJECT_COLORS[name] ?? "bg-neutral-100 text-neutral-700 border-neutral-200";
}

function attendanceBadge(status) {
  if (!status) return null;
  if (status === "present")
    return <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3.5 w-3.5" />เข้าเรียน</span>;
  if (status === "absent")
    return <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="h-3.5 w-3.5" />ขาด</span>;
  return <span className="flex items-center gap-1 text-xs text-yellow-500"><MinusCircle className="h-3.5 w-3.5" />{status}</span>;
}

export default function StudentSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("week"); // "week" | "list"
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = สัปดาห์นี้

  const token = localStorage.getItem("student_token");

  useEffect(() => {
    (async () => {
      try {
        const data = await getStudentSchedule(token);
        setSchedules(data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── สัปดาห์ที่แสดง ─────────────────────────────────────────────────────
  function getWeekRange(offset = 0) {
    const now = new Date();
    const day = now.getDay(); // 0=อาทิตย์
    // ให้จันทร์เป็นวันแรก
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  }

  const { monday, sunday } = getWeekRange(selectedWeekOffset);

  const weekSchedules = schedules.filter((s) => {
    const dt = new Date(s.StartDateTime);
    return dt >= monday && dt <= sunday;
  });

  // จัดกลุ่มตามวัน
  const byDay = DAY_ORDER.reduce((acc, d) => {
    acc[d] = weekSchedules.filter((s) => Number(s.DayOfWeek) === d);
    return acc;
  }, {});

  // ─── List view: upcoming ─────────────────────────────────────────────────
  const upcoming = [...schedules]
    .filter((s) => new Date(s.StartDateTime) >= new Date())
    .sort((a, b) => new Date(a.StartDateTime) - new Date(b.StartDateTime))
    .slice(0, 30);

  // ─── Stats ──────────────────────────────────────────────────────────────
  const presentCount = schedules.filter((s) => s.AttendanceStatus === "present").length;
  const absentCount = schedules.filter((s) => s.AttendanceStatus === "absent").length;
  const todayCount = schedules.filter((s) => {
    const d = new Date(s.StartDateTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const weekLabel = `${monday.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center mt-[90px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="mt-[90px] text-center text-red-500 py-12">{error}</div>;
  }

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Calendar className="h-7 w-7 text-blue-600" />
          ตารางเรียนของฉัน
        </h1>
        <p className="mt-1 text-sm text-neutral-500">ตารางเรียนตามคอร์สที่ลงทะเบียนไว้</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MiniStat icon={<Calendar className="h-5 w-5" />} label="วันนี้" value={todayCount} color="blue" />
        <MiniStat icon={<CheckCircle className="h-5 w-5" />} label="เข้าเรียน" value={presentCount} color="green" />
        <MiniStat icon={<XCircle className="h-5 w-5" />} label="ขาดเรียน" value={absentCount} color="red" />
      </div>

      {/* View Toggle */}
      <div className="bg-white border border-neutral-200 rounded-xl p-2 mb-6 flex gap-2">
        <ViewBtn active={viewMode === "week"} onClick={() => setViewMode("week")} label="ตารางสัปดาห์" />
        <ViewBtn active={viewMode === "list"} onClick={() => setViewMode("list")} label="รายการคาบที่กำลังจะมาถึง" />
      </div>

      {/* ─── Week View ─── */}
      {viewMode === "week" && (
        <>
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedWeekOffset((o) => o - 1)}
              className="px-3 py-2 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 transition"
            >
              ← ก่อนหน้า
            </button>
            <span className="text-sm font-semibold text-neutral-700">{weekLabel}</span>
            <button
              onClick={() => setSelectedWeekOffset((o) => o + 1)}
              className="px-3 py-2 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 transition"
            >
              ถัดไป →
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DAY_ORDER.map((dow) => {
              const classes = byDay[dow] ?? [];
              const isToday = classes.some((s) => {
                const d = new Date(s.StartDateTime);
                return d.toDateString() === new Date().toDateString();
              });
              return (
                <div
                  key={dow}
                  className={`rounded-2xl border-2 overflow-hidden ${
                    isToday ? "border-blue-400" : "border-neutral-200"
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 flex items-center justify-between ${
                      isToday ? "bg-blue-600 text-white" : "bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <span className="font-semibold text-sm">{DAY_MAP[dow]}</span>
                    {isToday && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">วันนี้</span>
                    )}
                    <span className={`text-xs ${isToday ? "text-white/70" : "text-neutral-500"}`}>
                      {classes.length > 0
                        ? new Date(classes[0].StartDateTime).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                          })
                        : ""}
                    </span>
                  </div>
                  <div className="bg-white p-3 space-y-2 min-h-[80px]">
                    {classes.length === 0 ? (
                      <p className="text-center text-xs text-neutral-300 py-4">ไม่มีคาบเรียน</p>
                    ) : (
                      classes.map((cls) => (
                        <ClassCard key={cls.CourseScheduleDetailId} cls={cls} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── List View ─── */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">ไม่มีคาบเรียนที่กำลังจะมาถึง</div>
          ) : (
            upcoming.map((s) => {
              const dt = new Date(s.StartDateTime);
              const isToday = dt.toDateString() === new Date().toDateString();
              return (
                <div
                  key={s.CourseScheduleDetailId}
                  className={`bg-white rounded-2xl border-2 p-4 flex gap-4 items-start transition ${
                    isToday ? "border-blue-300 bg-blue-50/30" : "border-neutral-200 hover:border-blue-200"
                  }`}
                >
                  {/* Date block */}
                  <div
                    className={`shrink-0 w-14 rounded-xl flex flex-col items-center py-2 ${
                      isToday ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    <span className="text-lg font-bold leading-none">{dt.getDate()}</span>
                    <span className="text-xs">
                      {dt.toLocaleDateString("th-TH", { month: "short" })}
                    </span>
                    <span className="text-xs opacity-70">{DAY_MAP[Number(s.DayOfWeek)]}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm truncate">{s.CourseName}</p>
                    {s.SubjectName && (
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${subjectColor(s.SubjectName)}`}
                      >
                        {s.SubjectName}
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {s.StartTime?.slice(0, 5)} – {s.EndTime?.slice(0, 5)}
                      </span>
                      {s.RoomDetail && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {s.RoomDetail} {s.Floor && `(${s.Floor})`}
                        </span>
                      )}
                      {s.TutorNickname && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {s.TutorNickname}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="shrink-0">{attendanceBadge(s.AttendanceStatus)}</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ───── Sub-components ───── */

function ClassCard({ cls }) {
  return (
    <div
      className={`rounded-xl border p-2.5 text-xs ${subjectColor(cls.SubjectName)}`}
    >
      <div className="font-semibold mb-0.5">{cls.SubjectName ?? cls.CourseName}</div>
      <div className="flex items-center gap-1 opacity-80">
        <Clock className="h-3 w-3" />
        {cls.StartTime?.slice(0, 5)} – {cls.EndTime?.slice(0, 5)}
      </div>
      {cls.RoomDetail && (
        <div className="flex items-center gap-1 opacity-80 mt-0.5">
          <MapPin className="h-3 w-3" /> {cls.RoomDetail}
        </div>
      )}
      {cls.TutorNickname && (
        <div className="flex items-center gap-1 opacity-80 mt-0.5">
          <User className="h-3 w-3" /> {cls.TutorNickname}
        </div>
      )}
      {attendanceBadge(cls.AttendanceStatus)}
    </div>
  );
}

function MiniStat({ icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <div className={`rounded-2xl border p-4 flex flex-col items-center gap-1 ${colors[color]}`}>
      {icon}
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function ViewBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-blue-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}