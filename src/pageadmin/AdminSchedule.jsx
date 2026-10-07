import { API_URL } from "../config";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, X, Save, UserCheck, BookOpen,
  Users, MapPin, RefreshCw, AlertCircle, Loader2, ChevronLeft,
  ChevronRight, CheckCircle, Clock, AlertTriangle, Layers, Info,
} from 'lucide-react';
import { confirmDialog, toast } from "../components/ui/dialogs";
import { PAGE_TITLE, PAGE_SUBTITLE } from "../components/ui/tokens";
import { AlertTriangle as LuAlertTriangle, CalendarOff as LuCalendarOff, Lightbulb as LuLightbulb } from "lucide-react";
import { BTN } from "../components/ui/tokens";
import { STAT_LABEL, STAT_NUM, STAT_UNIT } from "../components/ui/tokens";
import ClearFiltersButton from "../components/ui/ClearFiltersButton";
import { PendingDraftsCallout } from "../components/CourseDrafts";

const API_BASE = `${API_URL}/api/admin`;

// ─── constants ────────────────────────────────────────────────
const DAY_MAP = { 2: 'จันทร์', 3: 'อังคาร', 4: 'พุธ', 5: 'พฤหัสบดี', 6: 'ศุกร์', 7: 'เสาร์', 1: 'อาทิตย์' };
const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1];

const DEFAULT_TIME_SLOTS = [
  { label: '09:00-10:30', start: '09:00', end: '10:30' },
  { label: '10:30-12:00', start: '10:30', end: '12:00' },
  { label: '12:00-13:00', start: '12:00', end: '13:00', isBreak: true },
  { label: '13:30-15:00', start: '13:30', end: '15:00' },
  { label: '15:00-16:30', start: '15:00', end: '16:30' },
  { label: '17:00-18:30', start: '17:00', end: '18:30' },
  { label: '19:00-20:30', start: '19:00', end: '20:30' },
];

const SUBJECT_COLOR = (name = '') => {
  if (name.includes('คณิต')) return 'bg-orange-500';
  if (name.includes('วิทย์') || name.includes('ฟิสิกส์') || name.includes('เคมี') || name.includes('ชีว')) return 'bg-blue-500';
  if (name.includes('ไทย')) return 'bg-pink-500';
  if (name.includes('สังคม')) return 'bg-yellow-600';
  if (name.includes('อังกฤษ')) return 'bg-purple-500';
  if (name.includes('NETSAT') || name.includes('A-Level')) return 'bg-red-500';
  return 'bg-teal-500';
};

const EMPTY_FORM = {
  CourseID: '',
  SubjectId: '',
  AdminId: '',
  RoomId: '',
  DayOfWeek: '',
  StartTime: '',
  EndTime: '',
  TermStartDate: '',
  TermEndDate: '',
};

// วันจันทร์ของสัปดาห์ที่มี date นี้
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
  return new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isoDate(d) {
  return new Date(d)
    .toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' })
    .slice(0, 10);
}

// คืนรายวิชาที่ Course นั้นรองรับ
// รองรับทั้งกรณี backend ส่ง course.Subjects (array ของ {SubjectId, SubjectName})
// หรือ course.SubjectIds (array ของ id) ถ้ายังไม่มีข้อมูลนี้จาก backend
// จะ fallback ไปแสดงวิชาทั้งหมดแทน (ไม่บล็อกการทำงานเดิม)
function getCourseSubjects(course, allSubjects) {
  if (!course) return allSubjects;
  if (Array.isArray(course.Subjects) && course.Subjects.length) return course.Subjects;
  if (Array.isArray(course.SubjectIds) && course.SubjectIds.length) {
    return allSubjects.filter(s => course.SubjectIds.includes(s.SubjectId));
  }
  return allSubjects;
}

// ─── component ────────────────────────────────────────────────
export default function AdminSchedule() {
  // มือถือ: วันที่เลือกดูในมุมมองรายวัน (1=อาทิตย์ … 7=เสาร์ แบบเดียวกับ DayOfWeek)
  const [mobileDow, setMobileDow] = useState(() => new Date().getDay() + 1);
  // data
  const [schedule, setSchedule] = useState([]);
  const [meta, setMeta] = useState({ rooms: [], tutors: [], subjects: [], courses: [] });
  const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [holidays, setHolidays] = useState([]);

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editScope, setEditScope] = useState('this');
  const [deleteScope, setDeleteScope] = useState('this');

  // conflict warning in form
  const [conflicts, setConflicts] = useState([]);
  const conflictTimer = useRef(null);

  // filters
  const [fTutor, setFTutor] = useState('all');
  const [fRoom, setFRoom] = useState('all');
  const [fSubject, setFSubject] = useState('all');
  const [fSearch, setFSearch] = useState('');

  // ── fetch ──────────────────────────────────────────────────
  const fetchSchedule = useCallback(async (ws = weekStart) => {
    setLoading(true);
    setError(null);

    try {
      const r = await fetch(`${API_BASE}/schedule/weekly?week=${isoDate(ws)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setSchedule(data.schedule || []);
      setHolidays(data.holidays || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  // holidayMap สำหรับ lookup เร็ว
  const holidayMap = useMemo(() => {
    const m = {};
    holidays.forEach(h => { m[h.date] = h.Name; });
    return m;
  }, [holidays]);

  const fetchMeta = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/schedule/meta`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setMeta(await r.json());
    } catch (e) {
      console.error('[meta]', e);
    }
  }, []);

  useEffect(() => {
    fetchSchedule(weekStart);
  }, [weekStart]);

  useEffect(() => {
    fetchMeta();
  }, []);

  // ── week navigation ────────────────────────────────────────
  const goPrevWeek = () => setWeekStart(w => addDays(w, -7));
  const goNextWeek = () => setWeekStart(w => addDays(w, +7));
  const goToday = () => setWeekStart(getMondayOf(new Date()));

  // ── build grid map ─────────────────────────────────────────
  const scheduleMap = {};
  schedule.forEach(e => {
    const key = `${e.StartTime}-${e.EndTime}`;
    if (!scheduleMap[e.DayOfWeek]) scheduleMap[e.DayOfWeek] = {};
    if (!scheduleMap[e.DayOfWeek][key]) scheduleMap[e.DayOfWeek][key] = [];
    scheduleMap[e.DayOfWeek][key].push(e);
  });

  // ── mixed time slots: default + real data from API ────────
  const derivedTimeSlots = useMemo(() => {
    const slotMap = new Map();

    DEFAULT_TIME_SLOTS.forEach((slot) => {
      slotMap.set(`${slot.start}-${slot.end}`, slot);
    });

    schedule.forEach((e) => {
      if (!e.StartTime || !e.EndTime) return;
      const key = `${e.StartTime}-${e.EndTime}`;

      if (!slotMap.has(key)) {
        slotMap.set(key, {
          label: key,
          start: e.StartTime,
          end: e.EndTime,
        });
      }
    });

    return Array.from(slotMap.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [schedule]);

  // ── filter ─────────────────────────────────────────────────
  const pass = e => {
    if (fTutor !== 'all' && String(e.AdminId) !== fTutor) return false;
    if (fRoom !== 'all' && String(e.RoomId) !== fRoom) return false;
    if (fSubject !== 'all' && String(e.SubjectId) !== fSubject) return false;

    if (
      fSearch &&
      ![(e.CourseName || ''), (e.SubjectName || '')]
        .some(s => s.toLowerCase().includes(fSearch.toLowerCase()))
    ) return false;

    return true;
  };

  // ── conflict check (debounced) ─────────────────────────────
  const checkConflicts = useCallback(async (form, excludeId = null) => {
    if (!form.DayOfWeek || !form.StartTime || !form.EndTime) {
      setConflicts([]);
      return;
    }

    clearTimeout(conflictTimer.current);
    conflictTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          dayOfWeek: form.DayOfWeek,
          startTime: form.StartTime,
          endTime: form.EndTime,
          ...(form.RoomId ? { roomId: form.RoomId } : {}),
          ...(form.AdminId ? { adminId: form.AdminId } : {}),
          ...(excludeId ? { excludeId } : {}),
        });

        const r = await fetch(`${API_BASE}/schedule/conflicts?${params}`);
        const d = await r.json();
        setConflicts(d.conflicts || []);
      } catch {
        setConflicts([]);
      }
    }, 400);
  }, []);

  // ── open modals ────────────────────────────────────────────
  const openAdd = (dow, start, end) => {
    setFormData({
      ...EMPTY_FORM,
      DayOfWeek: String(dow),
      StartTime: start,
      EndTime: end,
    });
    setConflicts([]);
    setShowAdd(true);
  };

  const openEdit = entry => {
    // ── ใหม่: ห้ามแก้ไขคาบสอนที่ผ่านไปแล้ว ──
    if (entry.WeekDate && isoDate(entry.WeekDate) < isoDate(new Date())) {
      toast('ไม่สามารถแก้ไขคาบสอนที่ผ่านไปแล้วได้');
      return;
    }
    setSelected(entry);

    const f = {
      CourseID: String(entry.CourseID || ''),
      SubjectId: String(entry.SubjectId || ''),
      AdminId: String(entry.AdminId || ''),
      RoomId: String(entry.RoomId || ''),
      DayOfWeek: String(entry.DayOfWeek || ''),
      StartTime: entry.StartTime || '',
      EndTime: entry.EndTime || '',
      TermStartDate: '',
      TermEndDate: '',
    };

    setFormData(f);
    setEditScope('this');
    setConflicts([]);
    setShowEdit(true);
  };

  // ── CRUD ───────────────────────────────────────────────────
  const handleCreate = async () => {
    if (conflicts.length) return;
    setSaving(true);

    try {
      const r = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          CourseID: formData.CourseID || null,
          SubjectId: formData.SubjectId || null,
          AdminId: formData.AdminId || null,
          RoomId: formData.RoomId || null,
        }),
      });

      const d = await r.json();

      if (!r.ok) {
        if (r.status === 409) {
          setConflicts(d.conflicts || []);
          return;
        }
        throw new Error(d.message);
      }

      if (d.drafted) toast(d.message);

      setShowAdd(false);
      await fetchSchedule(weekStart);
    } catch (e) {
      toast(`ไม่สามารถสร้างคาบสอนได้: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected || conflicts.length) return;
    setSaving(true);

    try {
      const r = await fetch(`${API_BASE}/schedule/${selected.CourseScheduleDetailId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scope: editScope,
          CourseID: formData.CourseID || null,
          SubjectId: formData.SubjectId || null,
          AdminId: formData.AdminId || null,
          RoomId: formData.RoomId || null,
        }),
      });

      const d = await r.json();

      if (!r.ok) {
        if (r.status === 409) {
          setConflicts(d.conflicts || []);
          return;
        }
        throw new Error(d.message);
      }

      if (d.drafted) toast(d.message);

      setShowEdit(false);
      setSelected(null);
      await fetchSchedule(weekStart);
    } catch (e) {
      toast(`แก้ไขไม่สำเร็จ: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);

    try {
      const r = await fetch(`${API_BASE}/schedule/${selected.CourseScheduleDetailId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: deleteScope }),
      });

      const d = await r.json();

      if (!r.ok) {
        // ✅ ใหม่: จัดการ paid checkin error แยกออกมา
        if (r.status === 409 && d.paidCheckins) {
          const list = d.paidCheckins
            .map(c => `• ${c.date} — ${c.tutor} (Payment #${c.paymentId})`)
            .join('\n');
          toast(`${d.message}\n\nรายการที่ติดค้าง:\n${list}\n\n${d.hint}`);
          return;
        }
        throw new Error(d.message);
      }

      setShowDelete(false);
      if (d.drafted) toast(d.message);
      setSelected(null);
      await fetchSchedule(weekStart);
    } catch (e) {
      toast(`ลบไม่สำเร็จ: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── stats ──────────────────────────────────────────────────
  const totalClasses = schedule.length;
  const totalStudents = [...new Set(schedule.map(e => e.CourseID))].length;
  const noCheckin = schedule.filter(e =>
    e.WeekDate &&
    e.CheckinCount === 0 &&
    new Date(`${e.WeekDate}T${e.StartTime}`) < new Date()
  ).length;

  // ── render ─────────────────────────────────────────────────
  const weekEndDate = addDays(weekStart, 6);

  return (
    <div className="min-h-screen px-4 lg:px-0">
      <div className="mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h1 className={PAGE_TITLE}>จัดการตารางสอน</h1>
            <p className={PAGE_SUBTITLE}>ตารางสอนประจำสัปดาห์ทั้งหมดของสถาบัน</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* <button
              onClick={() => fetchSchedule(weekStart)}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" /> รีเฟรช
            </button> */}
            <button
              onClick={() => {
                setFormData(EMPTY_FORM);
                setConflicts([]);
                setShowAdd(true);
              }}
              className={`${BTN.primary} flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold`}
            >
              <Plus className="h-4 w-4" /> เพิ่มคาบสอน
            </button>
          </div>
        </div>

        {/* ── การแก้ไขตารางที่รอเผยแพร่ (ยังไม่แสดงในตารางด้านล่าง) ── */}
        <PendingDraftsCallout category="schedule" what="ตารางสอน" className="mb-4"
          onChanged={() => fetchSchedule(weekStart)} />

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">เชื่อมต่อ API ไม่สำเร็จ: {error}</span>
            <button type="button" onClick={() => fetchSchedule(weekStart)}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100">
              <RefreshCw className="h-3.5 w-3.5" /> ลองใหม่
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-3 mb-4 min-[360px]:[&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-white" />}
            bg="bg-blue-500"
            label="คาบสอนทั้งหมด"
            value={totalClasses}
            unit="คาบ"
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-white" />}
            bg="bg-emerald-500"
            label="คอร์สที่เปิดอยู่"
            value={totalStudents}
            unit="คอร์ส"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-white" />}
            bg="bg-red-500"
            label="ยังไม่เช็กอิน (สัปดาห์นี้)"
            value={noCheckin}
            unit="คาบ"
            warn={noCheckin > 0}
          />
        </div>

        {/* ── Week Navigation ── */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 mb-3 flex items-center justify-between gap-3">
          <button aria-label="ก่อนหน้า" onClick={goPrevWeek} className="p-2 rounded-lg hover:bg-slate-100 transition">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>

          <div className="text-center">
            <p className="font-semibold text-slate-900 text-sm">
              {fmtDate(weekStart)} – {fmtDate(weekEndDate)}
            </p>
            <button onClick={goToday} className="text-xs text-orange-500 hover:underline mt-0.5">
              กลับสัปดาห์นี้
            </button>
          </div>

          <button aria-label="ถัดไป" onClick={goNextWeek} className="p-2 rounded-lg hover:bg-slate-100 transition">
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 mb-3">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={fSearch}
                onChange={e => setFSearch(e.target.value)}
                placeholder="ค้นหา..."
                className="pl-8 pr-3 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>

            <Select
              value={fTutor}
              onChange={setFTutor}
              options={meta.tutors.map(t => ({ value: String(t.AdminId), label: t.Nickname }))}
              placeholder="ทุกติวเตอร์"
            />

            <Select
              value={fRoom}
              onChange={setFRoom}
              options={meta.rooms.map(r => ({ value: String(r.RoomId), label: r.RoomDetail }))}
              placeholder="ทุกห้อง"
            />

            <Select
              value={fSubject}
              onChange={setFSubject}
              options={meta.subjects.map(s => ({ value: String(s.SubjectId), label: s.SubjectName }))}
              placeholder="ทุกวิชา"
            />

            <ClearFiltersButton show={fTutor !== 'all' || fRoom !== 'all' || fSubject !== 'all' || !!fSearch} onClick={() => {
                setFTutor('all');
                setFRoom('all');
                setFSubject('all');
                setFSearch('');
              }} />
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 px-1 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              เช็กอินแล้ว
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-yellow-500" />
              กำลังจะถึง
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              ยังไม่เช็กอิน
            </span>
            <span className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-slate-300" />
              ยังไม่ถึงวัน
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>กำลังโหลด...</span>
            </div>
          ) : (
            <>
            {!error && schedule.length === 0 && (
              <div className="flex items-center gap-2 p-3 mb-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm">
                <Info className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span>สัปดาห์นี้ยังไม่มีคาบเรียน — กด "เพิ่มคาบสอน" เพื่อเพิ่มคาบใหม่</span>
              </div>
            )}
            {/* มือถือ: มุมมองรายวัน */}
            <div className="lg:hidden">
              <div className="-mx-1 px-1 flex gap-2 overflow-x-auto pb-2 snap-x">
                {DAY_ORDER.map(dow => {
                  const dayDate = addDays(weekStart, dow === 1 ? 6 : dow - 2);
                  const isToday = isoDate(dayDate) === isoDate(new Date());
                  const holiday = holidayMap[isoDate(dayDate)];
                  const active = dow === mobileDow;
                  const n = Object.values(scheduleMap[dow] || {}).reduce((a, arr) => a + arr.filter(pass).length, 0);
                  return (
                    <button key={dow} type="button" onClick={() => setMobileDow(dow)}
                      className={`snap-start shrink-0 w-[4.5rem] rounded-2xl border py-2 text-center transition ${active ? 'bg-orange-500 border-orange-500 text-white shadow-sm' : holiday ? 'bg-red-50 border-red-200 text-red-700' : isToday ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <span className="block text-sm font-bold">{DAY_MAP[dow].length > 3 ? DAY_MAP[dow].slice(0, 3) + '.' : DAY_MAP[dow]}</span>
                      <span className={`block text-[11px] ${active ? 'text-orange-100' : 'text-slate-400'}`}>{dayDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                      <span className={`block mt-0.5 text-[11px] font-bold ${active ? 'text-white' : 'text-orange-500'}`}>{n ? `${n} คาบ` : ' '}</span>
                    </button>
                  );
                })}
              </div>
              {(() => {
                const dow = mobileDow;
                const dayDate = addDays(weekStart, dow === 1 ? 6 : dow - 2);
                const dateStr = isoDate(dayDate);
                const holiday = holidayMap[dateStr];
                const addAt = async (slot) => {
                  if (holiday) {
                    const ok = await confirmDialog(`วันที่เลือกเป็นวันหยุดของสถาบัน (${holiday}) ต้องการเพิ่มคาบสอนในวันนี้หรือไม่?`);
                    if (!ok) return;
                  }
                  openAdd(dow, slot.start, slot.end);
                };
                return (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-bold text-slate-800">วัน{DAY_MAP[dow]} <span className="font-normal text-slate-400">· {dayDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}</span></p>
                    {holiday && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-center gap-1.5"><LuCalendarOff className="h-3.5 w-3.5 shrink-0" /> วันหยุด: {holiday}</p>}
                    {derivedTimeSlots.filter(sl => !sl.isBreak).map(slot => {
                      const entries = (scheduleMap[dow]?.[`${slot.start}-${slot.end}`] || []).filter(pass);
                      return (
                        <div key={slot.label} className={`flex gap-3 rounded-2xl border p-2.5 ${entries.length ? 'bg-white border-slate-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                          <div className="w-16 shrink-0 pt-1 text-center text-xs font-bold text-slate-600 leading-tight">{slot.label}</div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            {entries.map(e => (
                              <ClassCard key={e.CourseScheduleDetailId} entry={e} weekStart={weekStart}
                                onEdit={() => openEdit(e)}
                                onDelete={() => { setSelected(e); setDeleteScope('this'); setShowDelete(true); }} />
                            ))}
                            <button type="button" onClick={() => addAt(slot)}
                              className={`w-full ${entries.length ? 'h-8' : 'h-10'} rounded-xl text-xs font-semibold text-slate-500 hover:text-orange-500 flex items-center justify-center gap-1 border border-dashed border-slate-200 bg-white/60`}>
                              <Plus className="h-3.5 w-3.5" /> เพิ่มคาบ
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div className="hidden lg:block overflow-x-auto">
              <div className="min-w-[1100px]">
                <div className="grid grid-cols-8 gap-1.5">

                  {/* Header */}
                  <div className="text-center text-xs font-semibold text-slate-500 py-2 sticky left-0 z-10 bg-white lg:static lg:bg-transparent">เวลา</div>

                  {DAY_ORDER.map(dow => {
                    const dayDate = addDays(weekStart, dow === 1 ? 6 : dow - 2);
                    const isToday = isoDate(dayDate) === isoDate(new Date());
                    const dateStr = isoDate(dayDate);
                    const holiday = holidayMap[dateStr];

                    return (
                      <div
                        key={dow}
                        className={`text-center py-2 rounded-xl text-xs font-semibold
                              ${holiday ? 'bg-red-100 text-red-700' :
                            isToday ? 'bg-orange-500 text-white' :
                              'bg-orange-50 text-orange-700'}`}
                      >
                        {DAY_MAP[dow]}
                        <div className={`text-[11px] font-normal
                              ${holiday ? 'text-red-400' : isToday ? 'text-orange-100' : 'text-orange-400'}`}>
                          {dayDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </div>
                        {/* ── ชื่อวันหยุด ── */}
                        {holiday && (
                          <div className="text-[11px] mt-0.5 font-normal text-red-500 truncate px-1"
                            title={holiday}>
                            <LuCalendarOff className="inline h-3 w-3 shrink-0" /> {holiday}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Rows */}
                  {derivedTimeSlots.map(slot => (
                    <React.Fragment key={slot.label}>
                      <div className="text-center text-[11px] text-slate-500 py-2 flex items-center justify-center bg-slate-50 rounded-xl font-medium sticky left-0 z-10 lg:static">
                        {slot.label}
                      </div>

                      {DAY_ORDER.map(dow => {
                        if (slot.isBreak) {
                          return (
                            <div
                              key={dow}
                              className="min-h-[70px] rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center"
                            >
                              <span className="text-[11px] text-slate-300">พักเที่ยง</span>
                            </div>
                          );
                        }

                        const dayDate = addDays(weekStart, dow === 1 ? 6 : dow - 2);
                        const dateStr = isoDate(dayDate);
                        const isHoliday = !!holidayMap[dateStr];

                        const entries = (scheduleMap[dow]?.[`${slot.start}-${slot.end}`] || []).filter(pass);
                        const hasEntries = entries.length > 0;

                        // วันหยุดไม่ disable การเลือกวันอีกต่อไป — สามารถเพิ่มคาบสอนได้
                        // แต่ถ้าเลือกวันหยุด ให้ยืนยันก่อนเสมอ
                        const confirmHolidayThenAdd = async () => {
                          if (isHoliday) {
                            const holidayName = holidayMap[dateStr];
                            const ok = await confirmDialog(
                              `วันที่เลือกเป็นวันหยุดของสถาบัน${holidayName ? ` (${holidayName})` : ''} ต้องการเพิ่มคาบสอนในวันนี้หรือไม่?`
                            );
                            if (!ok) return;
                          }
                          openAdd(dow, slot.start, slot.end);
                        };

                        return (
                          <div
                            key={dow}
                            className={`min-h-[110px] rounded-xl border transition-all p-1 space-y-1 relative
                                  ${hasEntries
                                ? 'border-slate-200 bg-white hover:shadow-sm'
                                : isHoliday
                                  ? 'border-dashed border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100 cursor-pointer group'
                                  : 'border-dashed border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50 cursor-pointer group'
                              }`}
                            onClick={() => {
                              if (!hasEntries) confirmHolidayThenAdd();
                            }}
                          >
                            {isHoliday && !hasEntries && (
                              <span className="absolute top-1 left-1 text-[11px] text-red-400 pointer-events-none">
                                วันหยุด
                              </span>
                            )}
                            {hasEntries ? (
                              entries.map(e => (
                                <ClassCard
                                  key={e.CourseScheduleDetailId}
                                  entry={e}
                                  weekStart={weekStart}
                                  onEdit={() => openEdit(e)}
                                  onDelete={() => {
                                    setSelected(e);
                                    setDeleteScope('this');
                                    setShowDelete(true);
                                  }}
                                />
                              ))
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Plus className={`h-4 w-4 transition ${isHoliday ? 'text-red-200 group-hover:text-red-400' : 'text-slate-300 group-hover:text-orange-400'}`} />
                              </div>
                            )}

                            {hasEntries && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  confirmHolidayThenAdd();
                                }}
                                className="w-full py-0.5 text-[11px] text-slate-500 lg:text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded transition flex items-center justify-center gap-0.5"
                              >
                                <Plus className="h-2.5 w-2.5" /> เพิ่ม
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Add */}
      {showAdd && (
        <ScheduleModal
          title="เพิ่มคาบสอนใหม่"
          formData={formData}
          setFormData={setFormData}
          meta={meta}
          saving={saving}
          conflicts={conflicts}
          onClose={() => setShowAdd(false)}
          onSave={handleCreate}
          onFormChange={(f) => checkConflicts(f, null)}
          showTermFields
          timeSlots={derivedTimeSlots}
        />
      )}

      {/* Pencil */}
      {showEdit && selected && (
        <ScheduleModal
          title="แก้ไขคาบสอน"
          formData={formData}
          setFormData={setFormData}
          meta={meta}
          saving={saving}
          conflicts={conflicts}
          onClose={() => {
            setShowEdit(false);
            setSelected(null);
          }}
          onSave={handleUpdate}
          onFormChange={(f) => checkConflicts(f, selected.CourseScheduleDetailId)}
          scopeSelector
          scope={editScope}
          setScope={setEditScope}
          totalOccurrences={selected.TotalOccurrences}
          timeSlots={derivedTimeSlots}
          excludeId={selected.CourseScheduleDetailId}   // ★ เพิ่มบรรทัดนี้
        />
      )}

      {/* Delete */}
      {showDelete && selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-7 w-7 text-red-600" /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 text-center">ยืนยันการลบคาบสอน</h3>
            <p className="text-sm text-slate-500 mb-4 text-center">
              ลบคาบ <strong>{selected.SubjectName || selected.CourseName}</strong> วัน{DAY_MAP[selected.DayOfWeek]} {selected.StartTime}–{selected.EndTime}
            </p>

            {selected.TotalOccurrences > 1 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  เลือกขอบเขตการลบ (มีทั้งหมด {selected.TotalOccurrences} คาบในระบบ)
                </p>
                {[
                  { v: 'this', l: 'ลบเฉพาะคาบนี้' },
                  { v: 'future', l: 'ลบคาบนี้และคาบถัดไปทั้งหมด' },
                  { v: 'all', l: 'ลบทุกคาบในเทอมนี้' },
                ].map(o => (
                  <label key={o.v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dscope"
                      value={o.v}
                      checked={deleteScope === o.v}
                      onChange={() => setDeleteScope(o.v)}
                      className="accent-red-500"
                    />
                    <span className="text-sm text-slate-700">{o.l}</span>
                  </label>
                ))}
              </div>
            )}

            <p className="text-xs text-red-500 mb-4">* การเช็กอินที่เกี่ยวข้องจะถูกยกเลิกด้วย</p>

            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button
                onClick={() => {
                  setShowDelete(false);
                  setSelected(null);
                }}
                className={`${BTN.secondary} flex-1 py-2.5 rounded-xl text-sm font-bold`}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'กำลังลบ...' : 'ลบคาบสอน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ClassCard ────────────────────────────────────────────────
function ClassCard({ entry, weekStart, onEdit, onDelete }) {
  const colorClass = SUBJECT_COLOR(entry.SubjectName || '');
  const pct = entry.MaxStudents
    ? Math.min(Math.round((entry.StudentCount / entry.MaxStudents) * 100), 100)
    : 0;
  const isFull = pct >= 100;

  // สถานะ checkin
  const now = new Date();
  let checkinStatus = 'future';

  if (entry.WeekDate) {
    // 1. แปลงวันที่จากฐานข้อมูลให้เป็น YYYY-MM-DD (เวลาไทย) ที่สะอาดเป๊ะๆ
    const entryDateStr = new Date(entry.WeekDate).toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 10);
    const todayStr = now.toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 10);

    // 2. ประกอบวันที่ + เวลาจบคาบ ให้ถูกต้อง (ใช้ entryDateStr ที่สะอาดแล้ว)
    const classEnd = new Date(`${entryDateStr}T${entry.EndTime}:00`);

    // 3. ตั้งค่าเวลาผ่อนผัน: 2 ชั่วโมง (แปลงเป็นมิลลิวินาที)
    const GRACE_PERIOD_MS = 2 * 60 * 60 * 1000;
    const classEndWithGrace = new Date(classEnd.getTime() + GRACE_PERIOD_MS);

    if (entry.CheckinCount > 0) {
      // 1. เช็กอินแล้ว (เขียว)
      checkinStatus = 'done';
    } else if (now > classEndWithGrace) {
      // 2. เลยเวลาจบคาบ + หมดเวลาผ่อนผัน 2 ชม. แล้วยังไม่เช็กอิน (แดง)
      checkinStatus = 'missed';
    } else if (entryDateStr === todayStr) {
      // 3. คาบของวันนี้ ที่ยังอยู่ในช่วงเวลาผ่อนผัน (ส้ม)
      checkinStatus = 'upcoming';
    } else if (entryDateStr < todayStr) {
      // 4. คาบของเมื่อวานที่ลืมเช็ก (แดง)
      checkinStatus = 'missed';
    } else {
      // 5. อนาคต พรุ่งนี้เป็นต้นไป (เทา)
      checkinStatus = 'future';
    }
  }

  const statusIcon = {
    done: <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />,
    missed: <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />,
    upcoming: <Clock className="h-3 w-3 text-yellow-500 flex-shrink-0" />,
    future: <div className="h-3 w-3 rounded-full bg-slate-300 flex-shrink-0" />,
  }[checkinStatus];

  const borderColor = {
    done: 'border-green-200',
    missed: 'border-red-200',
    upcoming: 'border-yellow-200',
    future: 'border-slate-200',
  }[checkinStatus];

  return (
    <div className={`relative group bg-white border rounded-lg p-2 hover:shadow-sm transition ${borderColor}`}>
      <div className="flex items-start justify-between gap-1 mb-1 pr-14 lg:pr-0">
        <div className={`${colorClass} text-white text-[11px] font-semibold px-1.5 py-0.5 rounded inline-block`}>
          {entry.SubjectName || '—'}
        </div>
        {statusIcon}
      </div>

      <p className="text-[11px] text-slate-700 font-medium line-clamp-1 mb-1 leading-tight">
        {entry.CourseName}
      </p>

      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
        <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate">{entry.RoomDetail || 'ไม่ระบุ'}</span>
      </div>

      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
        <UserCheck className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate">{entry.TutorNickname || 'ไม่ระบุ'}</span>
      </div>

      <div className="flex items-center gap-1 text-[11px] mb-1">
        <Users className="h-2.5 w-2.5 text-slate-400" />
        <span className={`font-medium ${isFull ? 'text-red-600' : 'text-slate-700'}`}>
          {entry.StudentCount}/{entry.MaxStudents || '—'}
        </span>
        {isFull && <span className="text-red-500 text-[11px]">เต็ม</span>}
      </div>

      {entry.MaxStudents > 0 && (
        <div className="w-full bg-slate-100 rounded-full h-1 mb-1">
          <div
            className={`${isFull ? 'bg-red-400' : 'bg-green-400'} h-1 rounded-full`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {entry.TotalOccurrences > 1 && (
        <p className="text-[11px] text-slate-500">{entry.TotalOccurrences} คาบในเทอม</p>
      )}

      <div className="mt-1 border-t border-slate-100 pt-1 text-[11px] leading-4">
        {entry.PlannedTopics?.length > 0 && <p className="font-semibold text-slate-600">คาดว่าจะสอน: {entry.PlannedTopics.join(', ')}</p>}
        {entry.TaughtTopics?.length > 0 && <p className="mt-0.5 font-semibold text-emerald-700">สอนจริง: {entry.TaughtTopics.join(', ')}</p>}
        {entry.TaughtTopics?.length > 0 && entry.LessonDetail && <p className="mt-0.5 text-slate-600 line-clamp-2">รายละเอียด: {entry.LessonDetail}</p>}
      </div>

      {/* Actions */}
      <div className="absolute top-1 right-1 opacity-100 lg:opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 transition flex gap-1">
        <button aria-label="แก้ไข"
          onClick={e => {
            e.stopPropagation();
            onEdit();
          }}
          className={`${BTN.primary} p-1.5 lg:p-1 rounded min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center`}
        >
          <Pencil className="h-3.5 w-3.5 lg:h-2.5 lg:w-2.5" />
        </button>
        <button aria-label="ลบ"
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 lg:p-1 bg-red-500 text-white rounded hover:bg-red-600 min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center"
        >
          <Trash2 className="h-3.5 w-3.5 lg:h-2.5 lg:w-2.5" />
        </button>
      </div>
    </div>
  );
}

// ─── ScheduleModal ────────────────────────────────────────────
function ScheduleModal({
  title,
  formData,
  setFormData,
  meta,
  saving,
  conflicts,
  onClose,
  onSave,
  onFormChange,
  showTermFields,
  scopeSelector,
  scope,
  setScope,
  totalOccurrences,
  timeSlots,
  excludeId,   // ★ เพิ่ม
}) {
  const set = (key, val) => {
    const next = { ...formData, [key]: val };
    setFormData(next);
    onFormChange?.(next);
  };

  const handleSlot = label => {
    const slot = timeSlots.find(s => s.label === label);
    if (!slot) return;

    const next = {
      ...formData,
      StartTime: slot.start,
      EndTime: slot.end,
    };

    setFormData(next);
    onFormChange?.(next);
  };

  const currentSlotLabel =
    timeSlots.find(s => s.start === formData.StartTime && s.end === formData.EndTime)?.label || '';

  // คอร์สที่เลือกอยู่ตอนนี้ (ใช้แสดงข้อมูลคอร์ส + กรอง dropdown วิชา)
  const selectedCourse = meta.courses.find(c => String(c.CourseID) === String(formData.CourseID));
  const availableSubjects = getCourseSubjects(selectedCourse, meta.subjects);

  const [roomSuggestions, setRoomSuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimer = useRef(null);

  useEffect(() => {
    clearTimeout(suggestTimer.current);
    if (!formData.DayOfWeek || !formData.StartTime || !formData.EndTime) {
      setRoomSuggestions(null);
      return;
    }
    setSuggestLoading(true);
    suggestTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          dayOfWeek: formData.DayOfWeek,
          startTime: formData.StartTime,
          endTime: formData.EndTime,
          studentCount: selectedCourse?.EnrolledCount ?? 0,
          ...(excludeId ? { excludeId } : {}),
        });
        const r = await fetch(`${API_BASE}/schedule/room-suggestions?${params}`);
        setRoomSuggestions(await r.json());
      } catch {
        setRoomSuggestions(null);
      } finally {
        setSuggestLoading(false);
      }
    }, 400);
  }, [formData.DayOfWeek, formData.StartTime, formData.EndTime, selectedCourse?.EnrolledCount, excludeId]);

  // auto-fill term dates เมื่อเลือก course + ล้างวิชาที่ไม่ตรงกับคอร์สใหม่
  const handleCourseChange = val => {
    const course = meta.courses.find(c => String(c.CourseID) === val);
    const subjectsForCourse = getCourseSubjects(course, meta.subjects);
    const subjectStillValid = subjectsForCourse.some(s => String(s.SubjectId) === String(formData.SubjectId));

    const next = {
      ...formData,
      CourseID: val,
      SubjectId: subjectStillValid ? formData.SubjectId : '',
      ...(course
        ? {
          TermStartDate: course.StartDate || '',
          TermEndDate: course.LastDate || '',
        }
        : {}),
    };

    setFormData(next);
    onFormChange?.(next);
  };

  // ── Validation ฝั่ง Frontend สำหรับช่วงวันที่ ──
  // 1) ห้ามเพิ่มตารางเรียนย้อนหลัง
  // 2) ช่วงวันที่ต้องอยู่ในช่วงเปิด-ปิดของคอร์ส
  const dateError = useMemo(() => {
    if (!showTermFields) return null;
    if (!formData.TermStartDate || !formData.TermEndDate) return null;

    const todayStr = isoDate(new Date());
    if (formData.TermStartDate < todayStr) {
      return 'ไม่สามารถเพิ่มตารางสอนย้อนหลังได้';
    }

    if (selectedCourse?.StartDate && selectedCourse?.LastDate) {
      if (formData.TermStartDate < selectedCourse.StartDate || formData.TermEndDate > selectedCourse.LastDate) {
        return 'วันที่เลือกอยู่นอกช่วงเวลาของคอร์ส';
      }
    }

    return null;
  }, [showTermFields, formData.TermStartDate, formData.TermEndDate, selectedCourse]);

  // ── ใหม่: เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด ──
  const timeError = useMemo(() => {
    if (!formData.StartTime || !formData.EndTime) return null;
    if (formData.StartTime >= formData.EndTime) {
      return 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด';
    }
    return null;
  }, [formData.StartTime, formData.EndTime]);

  const canSave =
    formData.CourseID &&
    formData.DayOfWeek &&
    formData.StartTime &&
    (!showTermFields || (formData.TermStartDate && formData.TermEndDate)) &&
    conflicts.length === 0 &&
    !dateError &&
    !timeError;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4 px-4 sm:px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 sticky -top-4 sm:-top-6 z-10">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} aria-label="ปิด" className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">

          {/* Scope selector (edit only) */}
          {scopeSelector && totalOccurrences > 1 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-2">
                เลือกขอบเขตการแก้ไข (มีทั้งหมด {totalOccurrences} คาบในระบบ)
              </p>
              <div className="space-y-1.5">
                {[
                  { v: 'this', l: 'แก้เฉพาะคาบนี้เท่านั้น' },
                  { v: 'future', l: 'แก้คาบนี้และคาบถัดไปทั้งหมด' },
                  { v: 'all', l: 'แก้ทุกคาบในเทอมนี้' },
                ].map(o => (
                  <label key={o.v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="escope"
                      value={o.v}
                      checked={scope === o.v}
                      onChange={() => setScope(o.v)}
                      className="accent-orange-500"
                    />
                    <span className="text-xs text-slate-700">{o.l}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Day + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">วัน *</label>
              <select
                value={formData.DayOfWeek}
                onChange={e => set('DayOfWeek', e.target.value)}
                className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="">เลือกวัน</option>
                {DAY_ORDER.map(d => (
                  <option key={d} value={d}>{DAY_MAP[d]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 mb-1 block">ช่วงเวลา *</label>
              <select
                value={currentSlotLabel}
                onChange={e => handleSlot(e.target.value)}
                className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="">เลือกเวลา</option>
                {timeSlots.filter(s => !s.isBreak).map(s => (
                  <option key={s.label} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── ใหม่: แสดง timeError ── */}
          {timeError && (
            <p className="text-[11px] text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" /> {timeError}
            </p>
          )}

          {/* Course */}
          <div>
            <label className="text-xs text-slate-600 mb-1 block">คอร์ส *</label>
            <select
              value={formData.CourseID}
              onChange={e => handleCourseChange(e.target.value)}
              className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              <option value="">เลือกคอร์ส</option>
              {meta.courses.map(c => (
                <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>
              ))}
            </select>
          </div>

          {/* Course info card — แสดงข้อมูลคอร์สที่เลือกก่อนสร้างตาราง */}
          {selectedCourse && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1">
                <Info className="h-3.5 w-3.5" /> ข้อมูลคอร์ส
              </div>
              <p className="text-xs text-slate-700">
                <span className="text-slate-500">คอร์ส:</span> {selectedCourse.CourseName}
              </p>
              {selectedCourse.StartDate && selectedCourse.LastDate && (
                <p className="text-xs text-slate-700">
                  <span className="text-slate-500">ระยะเวลา:</span>{' '}
                  {new Date(selectedCourse.StartDate).toLocaleDateString('th-TH')} - {new Date(selectedCourse.LastDate).toLocaleDateString('th-TH')}
                </p>
              )}
              {Array.isArray(availableSubjects) && availableSubjects.length > 0 && (
                <p className="text-xs text-slate-700">
                  <span className="text-slate-500">วิชาที่รองรับ:</span>{' '}
                  {availableSubjects.map(s => s.SubjectName).join(', ')}
                </p>
              )}
              {selectedCourse.EnrolledCount != null && (
                <p className="text-xs text-slate-700">
                  <span className="text-slate-500">นักเรียน:</span>{' '}
                  {selectedCourse.EnrolledCount} คน
                </p>
              )}
            </div>
          )}

          {/* ★ แผงแนะนำห้อง */}
          <RoomSuggestionPanel
            data={roomSuggestions}
            loading={suggestLoading}
            onPick={(roomId) => set('RoomId', String(roomId))}
            selectedRoomId={formData.RoomId}
          />

          {/* Subject + Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">วิชา</label>
              <select
                value={formData.SubjectId}
                onChange={e => set('SubjectId', e.target.value)}
                className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="">เลือกวิชา</option>
                {availableSubjects.map(s => (
                  <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 mb-1 block">ห้อง</label>
              <select
                value={formData.RoomId}
                onChange={e => set('RoomId', e.target.value)}
                className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="">เลือกห้อง</option>
                {meta.rooms.map(r => (
                  <option key={r.RoomId} value={r.RoomId}>
                    {r.RoomDetail}{r.Capacity ? ` (${r.Capacity} คน)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tutor */}
          <div>
            <label className="text-xs text-slate-600 mb-1 block">ติวเตอร์</label>
            <select
              value={formData.AdminId}
              onChange={e => set('AdminId', e.target.value)}
              className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              <option value="">เลือกติวเตอร์</option>
              {meta.tutors
                .filter(t => Number(t.Status_Tutor_Id) === 1 || String(t.AdminId) === String(formData.AdminId))
                .map(t => (
                  <option key={t.AdminId} value={t.AdminId}>
                    {t.Nickname}{Number(t.Status_Tutor_Id) === 1 ? '' : ' (ไม่ได้สอนแล้ว)'}
                  </option>
                ))}
            </select>
          </div>

          {/* Term dates (add only) */}
          {showTermFields && (
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                ช่วงเทอม * <span className="text-slate-400">(จะสร้างทุกสัปดาห์อัตโนมัติ)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.TermStartDate}
                  onChange={e => set('TermStartDate', e.target.value)}
                  className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
                <input
                  type="date"
                  value={formData.TermEndDate}
                  onChange={e => set('TermEndDate', e.target.value)}
                  className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>

              {formData.TermStartDate && formData.TermEndDate && formData.DayOfWeek && !dateError && (
                <p className="text-[11px] text-orange-600 mt-1">
                  * จะสร้างคาบสอนทุกวัน{DAY_MAP[formData.DayOfWeek]} ตั้งแต่ {new Date(formData.TermStartDate).toLocaleDateString('th-TH')} ถึง {new Date(formData.TermEndDate).toLocaleDateString('th-TH')}
                </p>
              )}

              {dateError && (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" /> {dateError}
                </p>
              )}
            </div>
          )}

          {/* Conflict warnings */}
          {conflicts.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
              {conflicts.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{c.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-sm font-medium"
          >
            ยกเลิก
          </button>

          <button
            onClick={onSave}
            disabled={saving || !canSave}
            className={`${BTN.primary} flex-1 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────
function StatCard({ icon, bg, label, value, unit, warn }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
      <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={STAT_LABEL}>{label}</p>
        <p className={`${STAT_NUM} ${warn ? 'text-red-600' : 'text-slate-900'}`}>
          {value}
          {unit && <span className={STAT_UNIT}>{unit}</span>}
        </p>
      </div>
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none max-w-full md:max-w-[240px] truncate"
    >
      <option value="all">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function RoomSuggestionPanel({ data, loading, onPick, selectedRoomId }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 p-3 bg-slate-50 rounded-xl">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> กำลังหาห้องที่เหมาะสม...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        เลือกคอร์ส วัน และเวลาก่อน ระบบจะแนะนำห้องให้อัตโนมัติ
      </div>
    );
  }

  const { suggestions, busyButFits, studentCount, hasEnrollment } = data;

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
      <p className="text-xs font-semibold text-slate-600">
        <LuLightbulb className="inline h-4 w-4 shrink-0 text-amber-500" /> แนะนำห้องสำหรับคาบนี้
        {hasEnrollment ? ` (นักเรียน ${studentCount} คน)` : ' (ยังไม่มีนักเรียนลงทะเบียน)'}
      </p>

      {!hasEnrollment && (
        <p className="text-[11px] text-amber-600">
          <LuAlertTriangle className="inline h-3.5 w-3.5 shrink-0" /> คอร์สนี้ยังไม่มีผู้ลงทะเบียน ระบบจึงแนะนำห้องขนาดเล็กที่สุดที่ว่าง
          หากมีผู้ลงทะเบียนเพิ่ม ควรปรับห้องอีกครั้ง
        </p>
      )}

      {suggestions.length === 0 ? (
        <p className="text-xs text-red-600">ไม่พบห้องที่ว่างและจุพอสำหรับจำนวนนักเรียนนี้</p>
      ) : (
        <div className="space-y-1.5">
          {suggestions.map(r => {
            const isSelected = String(r.RoomId) === String(selectedRoomId);
            const isTop = r.rank === 1;
            return (
              <button
                key={r.RoomId}
                type="button"
                onClick={() => onPick(r.RoomId)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition
        ${isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : isTop
                      ? 'border-orange-300 bg-white hover:bg-orange-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <span className="block">
                  <span className={`block text-xs font-bold ${isTop ? 'text-orange-600' : 'text-slate-600'}`}>
                    {isTop ? 'ห้องที่แนะนำ' : `ตัวเลือกที่ ${r.rank}`}
                  </span>
                  <span className="block text-[11px] text-slate-600">
                    {r.RoomDetail} — {r.Capacity} ที่นั่ง — ว่าง
                    {r.isOversized && (
                      <span className="text-amber-600"> · ที่นั่งเกินความจำเป็น {r.extraSeats} ที่นั่ง</span>
                    )}
                  </span>
                </span>
                {isSelected && <CheckCircle className="h-4 w-4 text-orange-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {busyButFits.length > 0 && (
        <details className="text-[11px] text-slate-500">
          <summary className="cursor-pointer hover:text-slate-700">
            ห้องที่จุพอแต่ไม่ว่าง ({busyButFits.length})
          </summary>
          <ul className="mt-1 space-y-0.5 pl-3">
            {busyButFits.map(r => (
              <li key={r.RoomId}>{r.RoomDetail} ({r.Capacity} ที่นั่ง) — ติดคาบ {r.busyWith}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
