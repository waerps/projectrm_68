import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  User,
  XCircle,
} from "lucide-react";
import { getStudentCourses, getStudentSchedule } from "../callapi/callusers_student";

const DAY_MAP = { 1: "อาทิตย์", 2: "จันทร์", 3: "อังคาร", 4: "พุธ", 5: "พฤหัสบดี", 6: "ศุกร์", 7: "เสาร์" };
const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1];
const DEFAULT_TIME_SLOTS = [
  { label: "09:00-10:30", start: "09:00", end: "10:30" },
  { label: "10:30-12:00", start: "10:30", end: "12:00" },
  { label: "12:00-13:00", start: "12:00", end: "13:00", isBreak: true },
  { label: "13:30-15:00", start: "13:30", end: "15:00" },
  { label: "15:00-16:30", start: "15:00", end: "16:30" },
  { label: "17:00-18:30", start: "17:00", end: "18:30" },
  { label: "19:00-20:30", start: "19:00", end: "20:30" },
];

const STATUS_STYLE = {
  present: { card: "bg-emerald-50 border-emerald-300", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "มาเรียน", Icon: CheckCircle },
  absent: { card: "bg-red-50 border-red-300", dot: "bg-red-500", badge: "bg-red-100 text-red-700 border-red-200", label: "ขาดเรียน", Icon: XCircle },
  upcoming: { card: "bg-orange-50 border-orange-300", dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700 border-orange-200", label: "กำลังจะถึง", Icon: Clock },
  future: { card: "bg-blue-50 border-blue-200", dot: "bg-blue-400", badge: "bg-blue-100 text-blue-700 border-blue-200", label: "ยังไม่ถึง", Icon: Calendar },
  unknown: { card: "bg-neutral-100 border-neutral-300", dot: "bg-neutral-400", badge: "bg-neutral-200 text-neutral-600 border-neutral-300", label: "ผ่านไปแล้ว", Icon: AlertCircle },
};

const SUBJECT_COLORS = ["bg-orange-500", "bg-blue-500", "bg-pink-500", "bg-purple-500", "bg-teal-500", "bg-amber-600"];
const TIMELINE_CELL_STYLE = {
  present: "bg-emerald-500 text-white hover:bg-emerald-600",
  absent: "bg-red-500 text-white hover:bg-red-600",
  upcoming: "bg-orange-500 text-white hover:bg-orange-600",
  future: "bg-blue-400 text-white hover:bg-blue-500",
  unknown: "bg-neutral-400 text-white hover:bg-neutral-500",
};

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMondayOf(value) {
  const date = parseDate(value) || new Date();
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(value, amount) {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);
  return result;
}

function isoDate(value) {
  const date = parseDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeFromDate(value) {
  const date = parseDate(value);
  return date ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : "";
}

function normalizeSchedule(item) {
  const startDateTime = item.StartDateTime ?? item.startDateTime ?? item.ClassDateTime ?? item.classDateTime ?? item.ClassDate ?? item.classDate;
  const endDateTime = item.EndDateTime ?? item.endDateTime;
  const date = parseDate(startDateTime);
  const jsDay = date?.getDay();
  return {
    ...item,
    CourseScheduleDetailId: item.CourseScheduleDetailId ?? item.courseScheduleDetailId ?? item.ScheduleDetailId ?? item.scheduleDetailId,
    CourseID: item.CourseID ?? item.CourseId ?? item.courseId,
    CourseName: item.CourseName ?? item.courseName ?? "คอร์สเรียน",
    SubjectName: item.SubjectName ?? item.subjectName ?? "วิชาเรียน",
    StartDateTime: startDateTime,
    StartTime: (item.StartTime ?? item.startTime ?? timeFromDate(startDateTime))?.slice(0, 5),
    EndTime: (item.EndTime ?? item.endTime ?? timeFromDate(endDateTime))?.slice(0, 5),
    DayOfWeek: Number(item.DayOfWeek ?? item.dayOfWeek ?? (jsDay === 0 ? 1 : jsDay + 1)),
    AttendanceStatus: String(item.AttendanceStatus ?? item.attendanceStatus ?? item.Status ?? item.status ?? "").toLowerCase(),
    RoomDetail: item.RoomDetail ?? item.roomDetail ?? item.RoomName ?? item.roomName,
    TutorNickname: item.TutorNickname ?? item.tutorNickname ?? item.TutorName ?? item.tutorName,
  };
}

function normalizeCourse(item) {
  return {
    ...item,
    CourseID: item.CourseID ?? item.CourseId ?? item.courseId ?? item.id,
    CourseName: item.CourseName ?? item.courseName ?? item.name ?? "คอร์สเรียน",
    StartDate: item.StartDate ?? item.startDate,
    LastDate: item.LastDate ?? item.lastDate ?? item.EndDate ?? item.endDate,
  };
}

function getSlotStatus(item) {
  if (item.AttendanceStatus === "present") return "present";
  if (item.AttendanceStatus === "absent") return "absent";
  const classDate = isoDate(item.StartDateTime);
  const today = isoDate(new Date());
  if (classDate === today) return "upcoming";
  return classDate > today ? "future" : "unknown";
}

function formatWeekRange(start) {
  const end = addDays(start, 6);
  const options = { day: "numeric", month: "short", year: "numeric" };
  return `${start.toLocaleDateString("th-TH", options)} – ${end.toLocaleDateString("th-TH", options)}`;
}

export default function StudentSchedule() {
  const navigate = useNavigate();
  const token = localStorage.getItem("student_token");
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getStudentSchedule(token), getStudentCourses(token)])
      .then(([scheduleResult, courseResult]) => {
        if (cancelled) return;
        if (scheduleResult.status === "rejected") throw scheduleResult.reason;
        const schedulePayload = scheduleResult.value;
        const scheduleList = Array.isArray(schedulePayload) ? schedulePayload : schedulePayload?.schedule ?? schedulePayload?.data ?? [];
        const coursePayload = courseResult.status === "fulfilled" ? courseResult.value : [];
        const courseList = Array.isArray(coursePayload) ? coursePayload : coursePayload?.courses ?? coursePayload?.data ?? [];
        setSchedules(scheduleList.map(normalizeSchedule).filter((item) => item.StartDateTime));
        setCourses(courseList.map(normalizeCourse).filter((item) => item.CourseID));
      })
      .catch((err) => setError(typeof err === "string" ? err : err?.message || "โหลดตารางเรียนไม่สำเร็จ"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [token]);

  const weekEnd = addDays(weekStart, 6);
  const weekSchedules = useMemo(() => schedules.filter((item) => {
    const date = isoDate(item.StartDateTime);
    return date >= isoDate(weekStart) && date <= isoDate(weekEnd);
  }), [schedules, weekStart]);

  const scheduleMap = useMemo(() => {
    const map = {};
    weekSchedules.forEach((item) => {
      const key = `${item.StartTime}-${item.EndTime}`;
      map[item.DayOfWeek] ??= {};
      map[item.DayOfWeek][key] ??= [];
      map[item.DayOfWeek][key].push(item);
    });
    return map;
  }, [weekSchedules]);

  const timeSlots = useMemo(() => {
    const slots = new Map(DEFAULT_TIME_SLOTS.map((slot) => [slot.label, slot]));
    weekSchedules.forEach((item) => {
      if (item.StartTime && item.EndTime) {
        const label = `${item.StartTime}-${item.EndTime}`;
        if (!slots.has(label)) slots.set(label, { label, start: item.StartTime, end: item.EndTime });
      }
    });
    return [...slots.values()].sort((a, b) => a.start.localeCompare(b.start));
  }, [weekSchedules]);

  const timelineWeeks = useMemo(() => {
    const dates = [
      ...schedules.map((item) => parseDate(item.StartDateTime)),
      ...courses.flatMap((course) => [parseDate(course.StartDate), parseDate(course.LastDate)]),
    ].filter(Boolean);
    if (!dates.length) return [getMondayOf(new Date())];
    let cursor = getMondayOf(new Date(Math.min(...dates.map(Number))));
    const last = getMondayOf(new Date(Math.max(...dates.map(Number))));
    const weeks = [];
    while (cursor <= last && weeks.length < 104) {
      weeks.push(cursor);
      cursor = addDays(cursor, 7);
    }
    return weeks;
  }, [courses, schedules]);

  const visibleCourses = useMemo(() => {
    const courseMap = new Map(courses.map((course) => [String(course.CourseID), course]));
    schedules.forEach((item) => {
      const key = String(item.CourseID ?? "");
      if (key && !courseMap.has(key)) courseMap.set(key, normalizeCourse(item));
    });
    return [...courseMap.values()];
  }, [courses, schedules]);

  const goToCourse = (courseId) => courseId && navigate(`/profile/course-detail/${courseId}`);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (error) return <div className="mt-[90px] py-12 text-center text-red-500">{error}</div>;

  return (
    <div className="mx-auto mt-[90px] max-w-[1384px] space-y-6 px-4 pb-10 md:px-0">
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900"><Calendar className="h-6 w-6 text-orange-500" /> ตารางเรียนของฉัน</h1>
            <p className="mt-1 text-sm text-neutral-500">เลือกดูคาบเรียนแต่ละสัปดาห์ และกดที่คาบเพื่อดูรายละเอียดคอร์ส</p>
          </div>
          <div className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md">{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>

        <StatusLegend />

        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <button aria-label="สัปดาห์ก่อนหน้า" onClick={() => setWeekStart(addDays(weekStart, -7))} className="rounded-lg p-2 transition hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
          <div className="text-center">
            <p className="text-xs font-medium text-orange-600">{weekStart.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</p>
            <p className="text-sm font-semibold text-neutral-900">{formatWeekRange(weekStart)}</p>
            <button onClick={() => setWeekStart(getMondayOf(new Date()))} className="mt-0.5 text-xs text-orange-500 hover:underline">กลับสัปดาห์นี้</button>
          </div>
          <button aria-label="สัปดาห์ถัดไป" onClick={() => setWeekStart(addDays(weekStart, 7))} className="rounded-lg p-2 transition hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
          <div className="grid min-w-[1000px] grid-cols-8 gap-2">
            <div className="py-2 text-center text-sm font-bold uppercase tracking-wider text-neutral-400">เวลา</div>
            {DAY_ORDER.map((day, index) => {
              const date = addDays(weekStart, index);
              const isToday = isoDate(date) === isoDate(new Date());
              return <div key={day} className={`rounded-xl py-2 text-center text-sm font-bold ${isToday ? "bg-orange-500 text-white shadow-sm" : "bg-orange-50 text-neutral-700"}`}><div>{DAY_MAP[day]}</div><div className={`mt-0.5 text-[10px] font-normal ${isToday ? "text-orange-100" : "text-neutral-400"}`}>{date.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</div></div>;
            })}
            {timeSlots.map((slot) => <ScheduleRow key={slot.label} slot={slot} scheduleMap={scheduleMap} onSelect={goToCourse} />)}
          </div>
          {!weekSchedules.length && <div className="pointer-events-none mt-3 rounded-xl border border-dashed border-neutral-300 bg-white/80 py-4 text-center text-sm text-neutral-500">ไม่มีคาบเรียนในสัปดาห์นี้ — เลือกสัปดาห์อื่นจากภาพรวมด้านล่างได้</div>}
        </div>
      </section>

      <CourseWeekOverview courses={visibleCourses} schedules={schedules} weeks={timelineWeeks} selectedWeek={weekStart} onSelectWeek={setWeekStart} onSelectCourse={goToCourse} />
    </div>
  );
}

function StatusLegend() {
  return <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-neutral-600">{Object.entries(STATUS_STYLE).map(([key, style]) => <span key={key} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />{style.label}</span>)}</div>;
}

function ScheduleRow({ slot, scheduleMap, onSelect }) {
  return <>
    <div className="flex items-center justify-center border-r border-neutral-200/50 py-4 text-center text-xs font-bold text-neutral-500">{slot.label}</div>
    {DAY_ORDER.map((day) => {
      if (slot.isBreak) return <div key={`${day}-${slot.label}`} className="flex min-h-[70px] items-center justify-center rounded-xl border border-dashed border-neutral-200"><span className="text-[10px] text-neutral-300">พักเที่ยง</span></div>;
      const list = scheduleMap[day]?.[slot.label] ?? [];
      return <div key={`${day}-${slot.label}`} className="min-h-[100px] space-y-1">{list.map((item, index) => {
        const status = getSlotStatus(item);
        const style = STATUS_STYLE[status];
        return <button type="button" key={item.CourseScheduleDetailId ?? `${item.CourseID}-${index}`} onClick={() => onSelect(item.CourseID)} className={`w-full rounded-xl border-2 p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${style.card}`}>
          <span className={`block w-fit max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${SUBJECT_COLORS[Math.abs(Number(item.CourseID) || 0) % SUBJECT_COLORS.length]}`}>{item.SubjectName}</span>
          <span className="mt-1 block line-clamp-2 text-xs font-semibold text-neutral-800">{item.CourseName}</span>
          <span className="mt-2 flex items-center justify-between border-t border-dashed border-neutral-200 pt-2 text-[10px] text-neutral-600"><span className="flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{item.RoomDetail || "-"}</span></span>{item.TutorNickname && <span className="ml-1 flex min-w-0 items-center gap-1"><User className="h-3 w-3 shrink-0" /><span className="truncate">{item.TutorNickname}</span></span>}</span>
          <span className={`mt-2 flex items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[9px] font-bold ${style.badge}`}><style.Icon className="h-3 w-3" />{style.label}</span>
        </button>;
      })}</div>;
    })}
  </>;
}

function CourseWeekOverview({ courses, schedules, weeks, selectedWeek, onSelectWeek, onSelectCourse }) {
  const monthGroups = useMemo(() => {
    const groups = [];
    weeks.forEach((week) => {
      const key = `${week.getFullYear()}-${week.getMonth()}`;
      const last = groups[groups.length - 1];
      if (last?.key === key) last.count += 1;
      else groups.push({ key, count: 1, label: week.toLocaleDateString("th-TH", { month: "long", year: "numeric" }) });
    });
    return groups;
  }, [weeks]);

  const getCourseRange = (course) => {
    const courseSchedules = schedules.filter((item) => String(item.CourseID) === String(course.CourseID));
    const scheduleDates = courseSchedules.map((item) => parseDate(item.StartDateTime)).filter(Boolean);
    const start = parseDate(course.StartDate) || (scheduleDates.length ? new Date(Math.min(...scheduleDates.map(Number))) : null);
    const end = parseDate(course.LastDate) || (scheduleDates.length ? new Date(Math.max(...scheduleDates.map(Number))) : null);
    return { start, end };
  };

  const statusFor = (course, week) => {
    const end = addDays(week, 6);
    const range = getCourseRange(course);
    if (!range.start || !range.end || end < getMondayOf(range.start) || week > range.end) return null;
    const classes = schedules.filter((item) => String(item.CourseID) === String(course.CourseID) && isoDate(item.StartDateTime) >= isoDate(week) && isoDate(item.StartDateTime) <= isoDate(end));
    if (classes.some((item) => getSlotStatus(item) === "absent")) return "absent";
    if (classes.length && classes.every((item) => getSlotStatus(item) === "present")) return "present";
    if (classes.some((item) => getSlotStatus(item) === "upcoming")) return "upcoming";
    if (classes.some((item) => getSlotStatus(item) === "future")) return "future";
    const today = isoDate(new Date());
    if (isoDate(end) < today) return "unknown";
    if (isoDate(week) <= today && isoDate(end) >= today) return "upcoming";
    return "future";
  };

  return <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6">
    <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
      <div><h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900"><BookOpen className="h-5 w-5 text-orange-500" />คอร์สที่ลงเรียน: ภาพรวมรายสัปดาห์</h2><p className="mt-1 text-xs text-neutral-500">กดสัปดาห์เพื่อเปลี่ยนตารางด้านบน หากช่วงเรียนยาวสามารถเลื่อนตารางซ้าย–ขวาได้</p></div>
      <StatusLegend />
    </div>
    {!courses.length ? <p className="py-8 text-center text-sm text-neutral-400">ยังไม่มีคอร์สที่ลงทะเบียน</p> : <div className="overflow-x-auto rounded-xl border border-neutral-200">
      <div className="min-w-max" style={{ display: "grid", gridTemplateColumns: `minmax(210px, 260px) repeat(${weeks.length}, 64px)` }}>
        <div className="sticky left-0 z-20 row-span-2 flex items-center border-b border-r border-neutral-200 bg-neutral-50 px-4 text-xs font-bold text-neutral-500">ชื่อคอร์ส</div>
        {monthGroups.map((group) => <div key={group.key} className="border-b border-r border-neutral-200 bg-orange-50 px-2 py-2 text-center text-xs font-bold text-orange-700" style={{ gridColumn: `span ${group.count}` }}>{group.label}</div>)}
        {weeks.map((week, index) => {
          const selected = isoDate(week) === isoDate(selectedWeek);
          return <button key={isoDate(week)} onClick={() => onSelectWeek(new Date(week))} className={`border-b border-r border-neutral-200 px-1 py-2 text-center transition ${selected ? "bg-orange-500 text-white" : "bg-white text-neutral-600 hover:bg-orange-50"}`}><span className="block text-[11px] font-bold">สัปดาห์ {index + 1}</span><span className="block text-[9px] opacity-75">{week.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span></button>;
        })}
        {courses.map((course) => {
          const range = getCourseRange(course);
          return <div key={course.CourseID} className="contents">
          <button onClick={() => onSelectCourse(course.CourseID)} className="sticky left-0 z-10 min-w-0 border-b border-r border-neutral-200 bg-white px-4 py-3 text-left text-xs font-semibold text-neutral-800 hover:text-orange-600"><span className="block max-w-[220px] truncate">{course.CourseName}</span><span className="mt-0.5 block text-[10px] font-normal text-neutral-400">{range.start && range.end ? `${range.start.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} – ${range.end.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}` : "ดูรายละเอียดคอร์ส"}</span></button>
          {weeks.map((week) => {
            const status = statusFor(course, week);
            const selected = isoDate(week) === isoDate(selectedWeek);
            return <button aria-label={`${course.CourseName} ${formatWeekRange(week)}`} key={isoDate(week)} onClick={() => onSelectWeek(new Date(week))} className={`relative flex min-h-[54px] items-center justify-center border-b border-r transition ${status ? `${TIMELINE_CELL_STYLE[status]} border-white/40` : "border-neutral-200 bg-white hover:bg-neutral-50"} ${selected ? "z-[1] ring-2 ring-inset ring-orange-700" : ""}`} title={status ? STATUS_STYLE[status].label : "อยู่นอกช่วงคอร์ส"}>{status && <span className="text-[9px] font-bold leading-tight">{STATUS_STYLE[status].label}</span>}</button>;
          })}
        </div>;})}
      </div>
    </div>}
  </section>;
}
