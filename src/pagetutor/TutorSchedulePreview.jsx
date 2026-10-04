import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { API_URL } from "../config";

const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

function formatDay(iso, options) {
  if (!iso) return "—";
  const date = new Date(`${iso}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", ...options });
}

function currentBangkokMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

function moveMonth(monthKey, offset) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getCalendarCells(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${monthKey}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export default function TutorSchedulePreview() {
  const [monthKey, setMonthKey] = useState(currentBangkokMonth);
  const [schedule, setSchedule] = useState([]);
  const [todayDate, setTodayDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let user;
    try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { user = null; }
    const tutorId = user?.id ?? user?.AdminId;
    const token = localStorage.getItem("student_token");
    if (!tutorId || !token) {
      setError(true);
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    setError(false);
    setSchedule([]);
    axios.get(`${API_URL}/api/tutor/${tutorId}/schedule`, {
      params: { month: monthKey },
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then(({ data }) => {
      setSchedule(Array.isArray(data?.schedule) ? data.schedule : []);
      setTodayDate(data?.todayDate || "");
    }).catch((requestError) => {
      if (requestError.code !== "ERR_CANCELED") setError(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [monthKey]);

  const calendarCells = useMemo(() => getCalendarCells(monthKey), [monthKey]);
  const classCounts = useMemo(() => {
    const counts = new Map();
    for (const session of schedule) {
      if (session.classDate) counts.set(session.classDate, (counts.get(session.classDate) || 0) + 1);
    }
    return counts;
  }, [schedule]);

  return (
    <section className="hidden lg:block" aria-labelledby="tutor-schedule-preview-title">
      <div className="rounded-[24px] border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/60 p-4 shadow-[0_14px_40px_-28px_rgba(234,88,12,0.3)]">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />
          <h2 id="tutor-schedule-preview-title" className="text-sm font-extrabold text-neutral-900">ตารางสอนรายเดือน</h2>
          <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-700">{loading ? "…" : `${schedule.length} คาบ`}</span>
        </div>

        <div className="mb-2 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setMonthKey((month) => moveMonth(month, -1))} className="grid h-7 w-7 place-items-center rounded-lg border border-orange-100 bg-white text-orange-700 transition hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-500" aria-label="เดือนก่อนหน้า"><ChevronLeft className="h-4 w-4" /></button>
          <strong className="text-xs text-neutral-800">{formatDay(`${monthKey}-01`, { month: "long", year: "numeric" })}</strong>
          <button type="button" onClick={() => setMonthKey((month) => moveMonth(month, 1))} className="grid h-7 w-7 place-items-center rounded-lg border border-orange-100 bg-white text-orange-700 transition hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-500" aria-label="เดือนถัดไป"><ChevronRight className="h-4 w-4" /></button>
        </div>

        {loading ? <div className="rounded-xl bg-orange-50/70 px-3 py-10 text-center text-xs text-neutral-500" role="status">กำลังโหลดตารางสอน...</div> : error ? <div className="rounded-xl border border-orange-100 bg-orange-50/70 px-3 py-8 text-center text-xs text-neutral-600" role="alert">โหลดตารางสอนไม่สำเร็จ</div> : (
          <div className="grid grid-cols-7 gap-1" aria-label={`ปฏิทินตารางสอน ${formatDay(`${monthKey}-01`, { month: "long", year: "numeric" })}`}>
            {WEEKDAYS.map((day) => <span key={day} className="pb-0.5 text-center text-[10px] font-bold text-neutral-500">{day}</span>)}
            {calendarCells.map((date, index) => {
              if (!date) return <span key={`blank-${index}`} aria-hidden="true" />;
              const count = classCounts.get(date) || 0;
              const isToday = date === todayDate;
              return (
                <div key={date} aria-label={`${formatDay(date, { weekday: "long", day: "numeric", month: "long" })} ${count ? `${count} คาบ` : "ไม่มีคาบ"}`} className={`flex h-9 min-w-0 flex-col items-center justify-center rounded-lg border text-center ${isToday ? "border-orange-500 bg-orange-500 text-white" : count ? "border-orange-200 bg-orange-50 text-orange-800" : "border-transparent bg-white text-neutral-600"}`}>
                  <span className="text-[11px] font-bold leading-none">{Number(date.slice(-2))}</span>
                  <span className={`mt-0.5 text-[9px] font-semibold leading-none ${isToday ? "text-orange-50" : count ? "text-orange-700" : "text-neutral-300"}`}>{count ? `${count} คาบ` : "—"}</span>
                </div>
              );
            })}
          </div>
        )}

        <Link to="/tutor/schedule" className="mt-3 flex items-center justify-end gap-1 text-xs font-bold text-orange-700 hover:underline">ดูตารางสอนเต็ม <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
