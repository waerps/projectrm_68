import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import {
  Calendar, Clock, MapPin, User, Loader2, CheckCircle,
  XCircle, AlertCircle, ChevronLeft, ChevronRight, BookOpen,
} from "lucide-react";
import { getStudentSchedule } from "../callapi/callusers_student";

// ─── ค่าคงที่ (ให้ตรงกับฝั่งติวเตอร์/แอดมิน) ──────────────────────
const DAY_MAP = { 1: "อาทิตย์", 2: "จันทร์", 3: "อังคาร", 4: "พุธ", 5: "พฤหัสบดี", 6: "ศุกร์", 7: "เสาร์" };
const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1]; // จันทร์–อาทิตย์

const DEFAULT_TIME_SLOTS = [
  { label: "09:00-10:30", start: "09:00", end: "10:30" },
  { label: "10:30-12:00", start: "10:30", end: "12:00" },
  { label: "12:00-13:00", start: "12:00", end: "13:00", isBreak: true },
  { label: "13:30-15:00", start: "13:30", end: "15:00" },
  { label: "15:00-16:30", start: "15:00", end: "16:30" },
  { label: "17:00-18:30", start: "17:00", end: "18:30" },
  { label: "19:00-20:30", start: "19:00", end: "20:30" },
];

const SUBJECT_COLOR = (name = "") => {
  if (name.includes("คณิต")) return "bg-orange-500";
  if (name.includes("วิทย์") || name.includes("ฟิสิกส์") || name.includes("เคมี") || name.includes("ชีว")) return "bg-blue-500";
  if (name.includes("ไทย")) return "bg-pink-500";
  if (name.includes("สังคม")) return "bg-yellow-600";
  if (name.includes("อังกฤษ")) return "bg-purple-500";
  return "bg-teal-500";
};

// ป้ายสถานะ — เอารูปแบบมาจาก TutorSchedule.jsx (STATUS_STYLE)
const STATUS_STYLE = {
  present: {
    card: "bg-green-50 border-green-200",
    badge: "bg-green-50 text-green-600 border-green-100",
    label: "มาเรียน",
    Icon: CheckCircle,
  },
  absent: {
    card: "bg-red-50 border-red-200",
    badge: "bg-red-50 text-red-600 border-red-100",
    label: "ขาดเรียน",
    Icon: XCircle,
  },
  upcoming: {
    card: "bg-white border-orange-300 hover:shadow-lg",
    badge: "bg-orange-50 text-orange-600 border-orange-100",
    label: "กำลังจะถึง",
    Icon: Clock,
  },
  future: {
    card: "bg-neutral-50 border-neutral-200 opacity-60",
    badge: "bg-neutral-100 text-neutral-400 border-neutral-200",
    label: "ยังไม่ถึงวัน",
    Icon: null,
  },
  // คาบผ่านมาแล้วแต่ยังไม่มีการเช็คชื่อในระบบ (ครูยังไม่บันทึก)
  unknown: {
    card: "bg-neutral-50 border-neutral-200",
    badge: "bg-neutral-100 text-neutral-500 border-neutral-200",
    label: "ยังไม่มีข้อมูลเช็คชื่อ",
    Icon: AlertCircle,
  },
};

// ─── helpers วันที่ (เอามาจาก AdminSchedule.jsx) ──────────────────
function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function isoDate(d) {
  return new Date(d).toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 10);
}

function getSlotStatus(cls, holidayMap) {
  if (!cls) return null;

  if (cls.AttendanceStatus === "present") return "present";
  if (cls.AttendanceStatus === "absent") return "absent";

  const dateStr = isoDate(cls.StartDateTime);
  const todayStr = isoDate(new Date());

  if (dateStr === todayStr) return "upcoming";
  if (dateStr > todayStr) return "future";
  return "unknown"; // อดีต แต่ไม่มี AttendanceStatus
}

export default function StudentSchedule() {
  const navigate = useNavigate();
  const token = localStorage.getItem("student_token");

  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
  const [todayDate, setTodayDate] = useState(null)   // 'YYYY-MM-DD'

  // ── โหลดตารางเรียน (เหมือนเดิม) ─────────────────────────────
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

  // ── โหลดคอร์สที่ลงเรียน (สำหรับ Gantt ด้านล่าง) ──────────────
  // ⚠️ ใช้ endpoint เดิมที่มีอยู่แล้ว: GET /api/student/courses
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/student/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setCourses(await res.json());
      } catch (err) {
        console.error("โหลดคอร์สไม่สำเร็จ", err);
      }
    })();
  }, []);

  // ── โหลดวันหยุด ──────────────────────────────────────────────
  // ⚠️ ตอนนี้ยิงไปที่ /api/admin/holidays — ต้องเช็คว่า route นี้
  //     เปิดให้เรียกแบบ public ได้ไหม (ดูหมายเหตุท้ายข้อความ)
  useEffect(() => {
    (async () => {
      try {
        const year = weekStart.getFullYear();
        const res = await fetch(`${API_URL}/api/admin/holidays?year=${year}`);
        if (res.ok) setHolidays(await res.json());
      } catch (err) {
        console.error("โหลดวันหยุดไม่สำเร็จ", err);
      }
    })();
  }, [weekStart]);

  const holidayMap = useMemo(() => {
    const m = {};
    holidays.forEach((h) => {
      m[isoDate(h.HolidayDate)] = h.Name;
    });
    return m;
  }, [holidays]);

  // ── สัปดาห์ที่กำลังแสดง ──────────────────────────────────────
  const weekEnd = addDays(weekStart, 6);
  const weekSchedules = schedules.filter((s) => {
    const dt = new Date(s.StartDateTime);
    return isoDate(dt) >= isoDate(weekStart) && isoDate(dt) <= isoDate(weekEnd);
  });

  const scheduleMap = {};
  weekSchedules.forEach((s) => {
    const key = `${s.StartTime?.slice(0, 5)}-${s.EndTime?.slice(0, 5)}`;
    const dow = Number(s.DayOfWeek);
    if (!scheduleMap[dow]) scheduleMap[dow] = {};
    if (!scheduleMap[dow][key]) scheduleMap[dow][key] = [];
    scheduleMap[dow][key].push(s);
  });

  const derivedTimeSlots = useMemo(() => {
    const slotMap = new Map();
    DEFAULT_TIME_SLOTS.forEach((s) => slotMap.set(`${s.start}-${s.end}`, s));
    weekSchedules.forEach((s) => {
      const start = s.StartTime?.slice(0, 5);
      const end = s.EndTime?.slice(0, 5);
      if (start && end && !slotMap.has(`${start}-${end}`)) {
        slotMap.set(`${start}-${end}`, { label: `${start}-${end}`, start, end });
      }
    });
    return Array.from(slotMap.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [weekSchedules]);

  // ── สถิติ ─────────────────────────────────────────────────
  const presentCount = schedules.filter((s) => s.AttendanceStatus === "present").length;
  const absentCount = schedules.filter((s) => s.AttendanceStatus === "absent").length;
  const todayCount = schedules.filter((s) => isoDate(s.StartDateTime) === isoDate(new Date())).length;

  const goPrevWeek = () => setWeekStart((w) => addDays(w, -7));
  const goNextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => setWeekStart(getMondayOf(new Date()));

  const goToCourse = (courseId) => {
    if (!courseId) return;
    // ⚠️ ปรับ path ตรงนี้ให้ตรงกับ route จริงของหน้าคอร์สในระบบ
    navigate(`/student/courses/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center mt-[90px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }
  if (error) {
    return <div className="mt-[90px] text-center text-red-500 py-12">{error}</div>;
  }

    // ── วันนี้ (สำหรับ label หัวข้อ) คำนวณจาก todayDate ของ backend เท่านั้น ──
  const todayLabel = todayDate
    ? DAY_THAI[new Date(todayDate + 'T00:00:00').getDay()]
    : ''
  const formattedDate = todayDate
    ? new Date(todayDate + 'T00:00:00').toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    : ''

  return (
    <div className="space-y-6 mt-[90px] px-4 md:px-0 max-w-[1384px] mx-auto pb-10">
      {/* Header + Stats */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-orange-500" /> ตารางเรียนของฉัน
            </h1>
            <p className="text-sm text-neutral-500 mt-1">ตารางเรียนตามคอร์สที่ลงทะเบียนไว้</p>
          </div>
          {/* <div className="grid grid-cols-3 gap-3">
            <MiniStat icon={<Calendar className="h-4 w-4" />} label="วันนี้" value={todayCount} color="orange" />
            <MiniStat icon={<CheckCircle className="h-4 w-4" />} label="มาเรียน" value={presentCount} color="green" />
            <MiniStat icon={<XCircle className="h-4 w-4" />} label="ขาดเรียน" value={absentCount} color="red" />
          </div> */}
          <div className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md self-start md:self-center">
            วันนี้: วัน{todayLabel}ที่ {formattedDate}
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold">
          {Object.entries(STATUS_STYLE).map(([key, s]) => (
            <span key={key} className="flex items-center gap-1.5" style={{ color: "inherit" }}>
              {s.Icon ? <s.Icon className="h-3.5 w-3.5" /> : <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 inline-block" />}
              {s.label}
            </span>
          ))}
        </div>

        {/* Week navigation */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 flex items-center justify-between gap-3">
          <button onClick={goPrevWeek} className="p-2 rounded-lg hover:bg-white transition">
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div className="text-center">
            <p className="font-semibold text-neutral-900 text-sm">
              {fmtDate(weekStart)} – {fmtDate(weekEnd)}
            </p>
            <button onClick={goToday} className="text-xs text-orange-500 hover:underline mt-0.5">
              กลับสัปดาห์นี้
            </button>
          </div>
          <button onClick={goNextWeek} className="p-2 rounded-lg hover:bg-white transition">
            <ChevronRight className="h-5 w-5 text-neutral-600" />
          </button>
        </div>

        {/* Grid ตาราง */}
        <div className="bg-neutral-50 rounded-2xl p-4 overflow-x-auto border border-neutral-100">
          <div className="grid grid-cols-8 gap-2 min-w-[1000px]">
            <div className="text-center font-bold text-neutral-400 py-2 text-sm uppercase tracking-wider">เวลา</div>

            {DAY_ORDER.map((dow) => {
              const dayDate = addDays(weekStart, dow === 1 ? 6 : dow - 2);
              const dateStr = isoDate(dayDate);
              const isTodayCol = dateStr === isoDate(new Date());
              const holiday = holidayMap[dateStr];

              return (
                <div
                  key={dow}
                  className={`text-center font-bold py-2 rounded-xl text-sm transition-colors
                    ${holiday ? "bg-red-100 text-red-700" : isTodayCol ? "bg-orange-500 text-white shadow-sm" : "text-neutral-700 bg-orange-50/60"}`}
                >
                  <div>{DAY_MAP[dow]}</div>
                  <div className={`text-[10px] font-normal mt-0.5 ${holiday ? "text-red-400" : isTodayCol ? "text-orange-100" : "text-neutral-400"}`}>
                    {dayDate.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  </div>
                  {holiday && (
                    <div className="text-[9px] mt-0.5 font-normal text-red-500 truncate px-1" title={holiday}>
                      🎌 {holiday}
                    </div>
                  )}
                </div>
              );
            })}

            {derivedTimeSlots.map((slot) => (
              <FragmentRow
                key={slot.label}
                slot={slot}
                scheduleMap={scheduleMap}
                holidayMap={holidayMap}
                weekStart={weekStart}
                onClickClass={goToCourse}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Gantt คอร์สที่ลงเรียน */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-orange-500" /> คอร์สที่ลงเรียน
        </h2>

        {courses.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">ยังไม่มีคอร์สที่ลงทะเบียน</p>
        ) : (
          <div className="space-y-4">
            {courses.map((c) => (
              <CourseTimelineBar key={c.CourseID} course={c} onClick={() => goToCourse(c.CourseID)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── แถวเวลาในตาราง ───── */
function FragmentRow({ slot, scheduleMap, weekStart, onClickClass }) {
  return (
    <>
      <div className="text-center text-xs text-neutral-500 py-4 font-bold flex items-center justify-center border-r border-neutral-200/50">
        {slot.label}
      </div>

      {slot.isBreak
        ? DAY_ORDER.map((d) => (
            <div key={d + slot.label} className="min-h-[70px] rounded-xl bg-neutral-50 border border-dashed border-neutral-200 flex items-center justify-center">
              <span className="text-[10px] text-neutral-300">พักเที่ยง</span>
            </div>
          ))
        : DAY_ORDER.map((dow) => {
            const list = scheduleMap[dow]?.[slot.label] || [];
            return (
              <div key={dow + slot.label} className="min-h-[100px] space-y-1">
                {list.length === 0 ? (
                  <div className="h-full rounded-xl bg-transparent" />
                ) : (
                  list.map((cls) => {
                    const status = getSlotStatus(cls);
                    const style = STATUS_STYLE[status] || STATUS_STYLE.future;
                    return (
                      <div
                        key={cls.CourseScheduleDetailId}
                        onClick={() => onClickClass(cls.CourseID)}
                        className={`p-2.5 rounded-xl border-2 cursor-pointer transform hover:-translate-y-0.5 transition-all duration-200 ${style.card}`}
                      >
                        <div className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded w-fit line-clamp-1 ${SUBJECT_COLOR(cls.SubjectName)}`}>
                          {cls.SubjectName || cls.CourseName}
                        </div>
                        <div className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{cls.CourseName}</div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-neutral-200 text-[10px] text-neutral-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 opacity-70" />
                            <span className="truncate max-w-[60px]">{cls.RoomDetail || "-"}</span>
                          </div>
                          {cls.TutorNickname && (
                            <div className="flex items-center gap-1 font-medium">
                              <User className="h-3 w-3 opacity-70" />
                              <span className="truncate max-w-[50px]">{cls.TutorNickname}</span>
                            </div>
                          )}
                        </div>

                        <div className={`mt-2 text-[9px] font-black py-1 px-1.5 rounded-md border flex items-center justify-center gap-1 uppercase tracking-tighter ${style.badge}`}>
                          {style.Icon ? <style.Icon className="w-3 h-3 shrink-0" /> : <span className="h-2 w-2 rounded-full bg-neutral-300 inline-block shrink-0" />}
                          <span className="truncate">{style.label}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
    </>
  );
}

/* ───── Gantt bar ต่อคอร์ส ───── */
function CourseTimelineBar({ course, onClick }) {
  const start = new Date(course.StartDate);
  const end = new Date(course.LastDate);
  const now = new Date();

  let pct = 0;
  if (now >= end) pct = 100;
  else if (now > start) pct = Math.round(((now - start) / (end - start)) * 100);

  return (
    <div onClick={onClick} className="cursor-pointer group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-neutral-800 group-hover:text-orange-600 transition truncate">
          {course.CourseName}
        </span>
        <span className="text-xs text-neutral-400 shrink-0 ml-2">
          {start.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
          {" – "}
          {end.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-neutral-400 mt-1">{pct}% ของระยะเวลาคอร์สผ่านไปแล้ว</div>
    </div>
  );
}

/* ───── stat card เล็ก ───── */
function MiniStat({ icon, label, value, color }) {
  const colors = {
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <div className={`rounded-xl border p-2.5 flex flex-col items-center gap-0.5 ${colors[color]}`}>
      {icon}
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}