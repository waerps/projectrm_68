import { API_URL } from "../config";
import { useSearchParams } from "react-router-dom";
import Spinner from "../components/ui/Spinner";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, X, Save, UserCheck, BookOpen, Users, MapPin, RefreshCw,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, ChevronDown, CheckCircle, Clock,
  AlertTriangle, Info,
} from 'lucide-react';
import { confirmDialog, toast } from "../components/ui/dialogs";
import { PAGE_TITLE, PAGE_SUBTITLE } from "../components/ui/tokens";
import { AlertTriangle as LuAlertTriangle, CalendarOff as LuCalendarOff, Lightbulb as LuLightbulb } from "lucide-react";
import { BTN } from "../components/ui/tokens";
import { STAT_LABEL, STAT_NUM, STAT_UNIT } from "../components/ui/tokens";
import ClearFiltersButton from "../components/ui/ClearFiltersButton";
import { PendingDraftsCallout } from "../components/CourseDrafts";
import { scheduleSubjectColor } from "../utils/scheduleSubjectColor";

const API_BASE = `${API_URL}/api/admin`;

// ─── constants ────────────────────────────────────────────────
const DAY_MAP = { 2: 'จันทร์', 3: 'อังคาร', 4: 'พุธ', 5: 'พฤหัสบดี', 6: 'ศุกร์', 7: 'เสาร์', 1: 'อาทิตย์' };
const DAY_SHORT = { 2: 'จ', 3: 'อ', 4: 'พ', 5: 'พฤ', 6: 'ศ', 7: 'ส', 1: 'อา' };
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

const EMPTY_FORM = {
  CourseID: '',
  SubjectId: '',
  AdminId: '',
  RoomId: '',
  DayOfWeek: '',
  DaysOfWeek: [],
  StartTime: '',
  EndTime: '',
  TermStartDate: '',
  TermEndDate: '',
  IncludeHolidayDates: [],
  IncludeHolidays: false,
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

function checkinStatusFor(entry, now = new Date()) {
  if (!entry.WeekDate) return 'future';
  if (Number(entry.CheckinCount) > 0) return 'done';

  const classDate = isoDate(entry.WeekDate);
  const endTime = /^(\d{1,2}):(\d{2})/.exec(String(entry.EndTime || ''));
  if (!endTime) return 'future';

  const [year, month, day] = classDate.split('-').map(Number);
  const endWithGrace = Date.UTC(year, month - 1, day, Number(endTime[1]) - 7, Number(endTime[2]))
    + 2 * 60 * 60 * 1000;
  if (now.getTime() > endWithGrace) return 'missed';
  return classDate > isoDate(now) ? 'future' : 'upcoming';
}

function getCourseSubjects(course) {
  return Array.isArray(course?.Subjects) ? course.Subjects : [];
}

function isSchedulableCourse(course) {
  return course && Number(course.Status_Course_Id) !== 4 &&
    String(course.LastDate || '').slice(0, 10) >= isoDate(new Date());
}

function tutorLabel(tutor) {
  const nickname = String(tutor.Nickname || '').trim();
  const fullName = [tutor.Firstname, tutor.Lastname]
    .map(part => String(part || '').trim()).filter(part => part && part !== '-').join(' ');
  return nickname || fullName || `ติวเตอร์ #${tutor.AdminId}`;
}

// ─── component ────────────────────────────────────────────────
export default function AdminSchedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  // มือถือ: วันที่เลือกดูในมุมมองรายวัน (1=อาทิตย์ … 7=เสาร์ แบบเดียวกับ DayOfWeek)
  const [mobileDow, setMobileDow] = useState(() => new Date().getDay() + 1);
  // data
  const [schedule, setSchedule] = useState([]);
  const [scheduleWeek, setScheduleWeek] = useState(null);
  const [meta, setMeta] = useState({ rooms: [], tutors: [], subjects: [], courses: [] });
  const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [metaError, setMetaError] = useState(null);
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
  const conflictRequest = useRef(0);

  // filters
  const [fTutor, setFTutor] = useState('all');
  const [fCourse, setFCourse] = useState(() => searchParams.get('courseId') || 'all');
  const [fRoom, setFRoom] = useState('all');
  const [fSubject, setFSubject] = useState('all');
  const [fSearch, setFSearch] = useState('');
  const [expandedCells, setExpandedCells] = useState({});
  const scheduleRequest = useRef(0);

  // ── fetch ──────────────────────────────────────────────────
  const fetchSchedule = useCallback(async (ws = weekStart) => {
    const request = ++scheduleRequest.current;
    const requestedWeek = isoDate(ws);
    const requestedWeekEnd = isoDate(addDays(ws, 6));
    setLoading(true);
    setError(null);
    setSchedule([]);
    setScheduleWeek(null);
    setHolidays([]);

    try {
      const r = await fetch(`${API_BASE}/schedule/weekly?week=${requestedWeek}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (request !== scheduleRequest.current) return;
      if (data.weekStart !== requestedWeek) throw new Error('API ส่งตารางสอนผิดสัปดาห์');
      const rows = Array.isArray(data.schedule) ? data.schedule : [];
      setSchedule(rows.filter(e => {
        const date = e.WeekDate ? isoDate(e.WeekDate) : '';
        const courseStart = String(e.CourseStartDate || '').slice(0, 10);
        const courseEnd = String(e.CourseEndDate || '').slice(0, 10);
        return date >= requestedWeek && date <= requestedWeekEnd
          && (!courseStart || date >= courseStart)
          && (!courseEnd || date <= courseEnd);
      }));
      setScheduleWeek(requestedWeek);
      setHolidays(data.holidays || []);
    } catch (e) {
      if (request === scheduleRequest.current) setError(e.message);
    } finally {
      if (request === scheduleRequest.current) setLoading(false);
    }
  }, [weekStart]);

  const displayedSchedule = useMemo(
    () => scheduleWeek === isoDate(weekStart) ? schedule : [],
    [schedule, scheduleWeek, weekStart]
  );

  // holidayMap สำหรับ lookup เร็ว
  const holidayMap = useMemo(() => {
    const m = {};
    if (scheduleWeek === isoDate(weekStart)) {
      holidays.forEach(h => { m[h.date] = h.Name; });
    }
    return m;
  }, [holidays, scheduleWeek, weekStart]);

  const fetchMeta = useCallback(async () => {
    setMetaError(null);
    const read = async (path) => {
      const response = await fetch(`${API_BASE}/schedule/${path}`);
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return response.json();
    };
    const [all, tutorList] = await Promise.allSettled([read('meta'), read('meta/tutors')]);
    const data = all.status === 'fulfilled' ? all.value : null;
    const tutors = tutorList.status === 'fulfilled' ? tutorList.value.tutors : data?.tutors;
    if (data || tutors) setMeta({
      rooms: data?.rooms || [], subjects: data?.subjects || [],
      courses: data?.courses || [], tutors: tutors || [],
    });
    if (!data || !Array.isArray(tutors) || !tutors.length) {
      setMetaError(!data ? 'โหลดข้อมูลตัวกรองบางส่วนไม่สำเร็จ' : 'โหลดรายชื่อติวเตอร์ไม่สำเร็จ');
    }
  }, []);

  useEffect(() => {
    fetchSchedule(weekStart);
  }, [weekStart]);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    const courseId = searchParams.get('courseId');
    const course = meta.courses.find(item => String(item.CourseID) === courseId);
    if (!courseId || !course) return;
    setFCourse(courseId);
    if (isSchedulableCourse(course)) {
      setFormData({ ...EMPTY_FORM, CourseID: courseId,
        TermStartDate: course.StartDate > isoDate(new Date()) ? course.StartDate : isoDate(new Date()),
        TermEndDate: course.LastDate || '' });
      setShowAdd(true);
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, meta.courses, setSearchParams]);

  // ── week navigation ────────────────────────────────────────
  const goPrevWeek = () => setWeekStart(w => addDays(w, -7));
  const goNextWeek = () => setWeekStart(w => addDays(w, +7));
  const goToday = () => setWeekStart(getMondayOf(new Date()));
  useEffect(() => setExpandedCells({}), [weekStart]);

  // ── build grid map ─────────────────────────────────────────
  const scheduleMap = {};
  displayedSchedule.forEach(e => {
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

    displayedSchedule.forEach((e) => {
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
  }, [displayedSchedule]);

  // ── filter ─────────────────────────────────────────────────
  const pass = e => {
    if (fTutor !== 'all' && String(e.AdminId) !== fTutor) return false;
    if (fCourse !== 'all' && String(e.CourseID) !== fCourse) return false;
    if (fRoom !== 'all' && String(e.RoomId) !== fRoom) return false;
    if (fSubject !== 'all' && String(e.SubjectId) !== fSubject) return false;

    if (
      fSearch &&
      ![(e.CourseName || ''), (e.SubjectName || ''), (e.TutorNickname || ''),
        (e.RoomDetail || ''), (e.ClassGroup || '')]
        .some(s => s.toLowerCase().includes(fSearch.toLowerCase()))
    ) return false;

    return true;
  };

  // ── conflict check (debounced) ─────────────────────────────
  const checkConflicts = useCallback(async (form, excludeId = null, occurrenceDate = null) => {
    const days = Array.isArray(form.DaysOfWeek) && !occurrenceDate ? form.DaysOfWeek : [form.DayOfWeek].filter(Boolean);
    const request = ++conflictRequest.current;
    clearTimeout(conflictTimer.current);
    if (!days.length || !form.StartTime || !form.EndTime
      || (!occurrenceDate && Array.isArray(form.DaysOfWeek) && (!form.TermStartDate || !form.TermEndDate))) {
      setConflicts([]);
      return;
    }

    setConflicts([]);
    conflictTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          dayOfWeek: days[0],
          ...(!occurrenceDate ? { daysOfWeek: days.join(',') } : {}),
          startTime: form.StartTime,
          endTime: form.EndTime,
          ...(form.CourseID ? { courseId: form.CourseID } : {}),
          ...(form.RoomId ? { roomId: form.RoomId } : {}),
          ...(form.AdminId ? { adminId: form.AdminId } : {}),
          ...(excludeId ? { excludeId } : {}),
          ...(occurrenceDate ? { occurrenceDate: isoDate(occurrenceDate) } : {}),
          ...(form.TermStartDate && form.TermEndDate ? {
            termStart: form.TermStartDate, termEnd: form.TermEndDate,
            includeHolidays: String(Boolean(form.IncludeHolidays)),
            includeHolidayDates: (form.IncludeHolidayDates || []).join(','),
          } : {}),
        });

        const r = await fetch(`${API_BASE}/schedule/conflicts?${params}`);
        const d = await r.json();
        if (request === conflictRequest.current) setConflicts(d.conflicts || []);
      } catch {
        if (request === conflictRequest.current) setConflicts([]);
      }
    }, 400);
  }, []);

  // ── open modals ────────────────────────────────────────────
  const initialAddForm = (requestedDate = null) => {
    const course = meta.courses.find(item => String(item.CourseID) === fCourse && isSchedulableCourse(item));
    const today = isoDate(new Date());
    return {
      ...EMPTY_FORM,
      CourseID: course ? String(course.CourseID) : '',
      TermStartDate: [today, course?.StartDate, requestedDate].filter(Boolean).sort().at(-1) || today,
      TermEndDate: course?.LastDate || '',
    };
  };

  const openAdd = (dow, start, end, holidayDate = null) => {
    const cellDate = isoDate(addDays(weekStart, Number(dow) === 1 ? 6 : Number(dow) - 2));
    setFormData({
      ...initialAddForm(cellDate),
      DayOfWeek: String(dow),
      DaysOfWeek: [Number(dow)],
      StartTime: start,
      EndTime: end,
      ...(holidayDate ? { TermStartDate: holidayDate, TermEndDate: holidayDate,
        IncludeHolidayDates: [holidayDate] } : {}),
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
      DaysOfWeek: [],
      StartTime: entry.StartTime || '',
      EndTime: entry.EndTime || '',
      TermStartDate: '',
      TermEndDate: '',
      IncludeHolidayDates: [],
      IncludeHolidays: false,
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
          if (d.conflicts?.length) setConflicts(d.conflicts);
          else toast(d.message || 'บันทึกคาบสอนไม่สำเร็จ');
          return;
        }
        throw new Error(d.message);
      }

      toast(d.drafted ? d.message : 'สร้างคาบสอนแล้ว ตารางมีผลทันที');

      setShowAdd(false);
      await fetchSchedule(weekStart);
      await fetchMeta();
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
          if (d.conflicts?.length) setConflicts(d.conflicts);
          else toast(d.message || 'แก้ไขคาบสอนไม่สำเร็จ');
          return;
        }
        throw new Error(d.message);
      }

      toast(d.drafted ? d.message : 'แก้คาบสอนแล้ว ตารางมีผลทันที');

      setShowEdit(false);
      setSelected(null);
      await fetchSchedule(weekStart);
      await fetchMeta();
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
      toast(d.drafted ? d.message : 'ลบคาบสอนแล้ว ตารางมีผลทันที');
      setSelected(null);
      await fetchSchedule(weekStart);
      await fetchMeta();
    } catch (e) {
      toast(`ลบไม่สำเร็จ: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── stats ──────────────────────────────────────────────────
  const visibleSchedule = displayedSchedule.filter(pass);
  const totalClasses = visibleSchedule.length;
  const totalStudents = [...new Set(visibleSchedule.map(e => e.CourseID))].length;
  const noCheckin = visibleSchedule.filter(e => checkinStatusFor(e) === 'missed').length;
  const selectedCourse = meta.courses.find(c => String(c.CourseID) === fCourse);
  const courseHours = selectedCourse && Number(selectedCourse.TotalCourseHours) > 0
    ? {
        total: Number(selectedCourse.TotalCourseHours),
        scheduled: Number(selectedCourse.ScheduledMinutes || 0) / 60,
        remaining: Math.max(0, Number(selectedCourse.TotalCourseHours) - Number(selectedCourse.ScheduledMinutes || 0) / 60),
        over: Math.max(0, Number(selectedCourse.ScheduledMinutes || 0) / 60 - Number(selectedCourse.TotalCourseHours)),
      }
    : null;
  const subjectHours = getCourseSubjects(selectedCourse).map(subject => {
    const planned = Number(subject.PlannedHours || 0);
    const scheduled = Number(subject.ScheduledMinutes || 0) / 60;
    return { ...subject, planned, scheduled, remaining: Math.max(0, planned - scheduled), over: Math.max(0, scheduled - planned) };
  });
  const hasSubjectPlans = subjectHours.some(subject => subject.planned > 0);

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
                setFormData(initialAddForm());
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
            label="คาบในสัปดาห์นี้"
            value={totalClasses}
            unit="คาบ"
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-white" />}
            bg="bg-emerald-500"
            label="คอร์สที่มีคาบสัปดาห์นี้"
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-2">
            <div className="relative col-span-2 xl:col-span-4">
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
              options={meta.tutors.map(t => ({ value: String(t.AdminId), label: tutorLabel(t) }))}
              placeholder="ทุกติวเตอร์"
            />

            <Select
              value={fCourse}
              onChange={setFCourse}
              options={meta.courses.map(c => ({ value: String(c.CourseID), label: c.CourseName }))}
              placeholder="ทุกคอร์ส"
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

            <ClearFiltersButton show={fTutor !== 'all' || fCourse !== 'all' || fRoom !== 'all' || fSubject !== 'all' || !!fSearch} onClick={() => {
                setFTutor('all');
                setFCourse('all');
                setFRoom('all');
                setFSubject('all');
                setFSearch('');
              }} />
          </div>
          {metaError && <div role="alert" className="mt-2 flex flex-wrap items-center gap-2 text-xs text-red-700">
            <span>{metaError}</span>
            <button type="button" onClick={fetchMeta} className="font-bold underline">ลองโหลดใหม่</button>
          </div>}
        </div>

        {isSchedulableCourse(selectedCourse) && !courseHours && !hasSubjectPlans && Number(selectedCourse.ScheduledMinutes || 0) === 0 && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {selectedCourse.CourseName} ยังไม่จัดตารางสอน
          </div>
        )}

        {(courseHours || hasSubjectPlans) && isSchedulableCourse(selectedCourse) && (
          <div className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{selectedCourse.CourseName}</p>
                {courseHours && <p className="mt-0.5 text-xs text-slate-500">รวม {courseHours.scheduled} / {courseHours.total} ชม.</p>}
              </div>
              {courseHours && <span className={`shrink-0 text-xs font-bold ${courseHours.over > 0 ? 'text-red-700' : courseHours.remaining > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {courseHours.over > 0 ? `เกิน ${courseHours.over} ชม.` : courseHours.remaining > 0 ? `เหลือ ${courseHours.remaining} ชม.` : 'ครบแล้ว'}
              </span>}
            </div>
            {subjectHours.length > 0 && (
              <div className="mt-2 divide-y divide-slate-100 border-t border-slate-100 pt-1">
                {subjectHours.map(subject => (
                  <div key={subject.SubjectId} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                    <span className="min-w-0 truncate text-slate-700">{subject.SubjectName} <span className="text-slate-400">· {subject.scheduled}{subject.planned > 0 ? ` / ${subject.planned}` : ''} ชม.</span></span>
                    <span className={`shrink-0 font-semibold ${subject.over > 0 ? 'text-red-700' : subject.remaining > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {subject.planned <= 0 ? 'ไม่กำหนดชั่วโมง' : subject.over > 0 ? `เกิน ${subject.over} ชม.` : subject.remaining > 0 ? `เหลือ ${subject.remaining} ชม.` : 'ครบแล้ว'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
              <span className="block h-3 w-3 rounded-full bg-slate-300" />
              ยังไม่ถึงวัน
            </span>
            <span className="ml-auto text-slate-400">มุมมองสัปดาห์แสดง 2 คาบแรกต่อช่อง กดดูทั้งหมดเพื่อขยาย</span>
          </div>

          {loading || (!error && scheduleWeek !== isoDate(weekStart)) ? (
            <Spinner block label="กำลังโหลดตารางเรียน..." wrapperClassName="py-20" />
          ) : (
            <>
            {!error && displayedSchedule.length === 0 && (
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
                    const ok = await confirmDialog(`วันที่เลือกเป็นวันหยุด (${holiday}) ต้องการเพิ่มคาบสอนในวันนี้หรือไม่?`);
                    if (!ok) return;
                  }
                  openAdd(dow, slot.start, slot.end, holiday ? dateStr : null);
                };
                return (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-bold text-slate-800">วัน{DAY_MAP[dow]} <span className="font-normal text-slate-400">· {dayDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}</span></p>
                    {holiday && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-center gap-1.5"><LuCalendarOff className="h-3.5 w-3.5 shrink-0" /> วันหยุดราชการ: {holiday}{Object.values(scheduleMap[dow] || {}).some(items => items.some(pass)) ? ' · มีเรียน' : ''}</p>}
                    {derivedTimeSlots.filter(sl => !sl.isBreak).map(slot => {
                      const entries = (scheduleMap[dow]?.[`${slot.start}-${slot.end}`] || []).filter(pass);
                      return (
                        <div key={slot.label} className={`flex gap-3 rounded-2xl border p-2.5 ${entries.length ? 'bg-white border-slate-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                          <div className="w-16 shrink-0 pt-1 text-center text-xs font-bold text-slate-600 leading-tight">{slot.label}</div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            {entries.map(e => (
                              <ClassCard key={e.CourseScheduleDetailId} entry={e}
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
                            <LuCalendarOff className="inline h-3 w-3 shrink-0" /> {holiday}{Object.values(scheduleMap[dow] || {}).some(items => items.some(pass)) ? ' · มีเรียน' : ''}
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
                        const cellKey = `${dateStr}:${slot.start}-${slot.end}`;
                        const expanded = !!expandedCells[cellKey];
                        const visibleEntries = expanded ? entries : entries.slice(0, 2);

                        // วันหยุดไม่ disable การเลือกวันอีกต่อไป — สามารถเพิ่มคาบสอนได้
                        // แต่ถ้าเลือกวันหยุด ให้ยืนยันก่อนเสมอ
                        const confirmHolidayThenAdd = async () => {
                          if (isHoliday) {
                            const holidayName = holidayMap[dateStr];
                            const ok = await confirmDialog(
                              `วันที่เลือกเป็นวันหยุด${holidayName ? ` (${holidayName})` : ''} ต้องการเพิ่มคาบสอนในวันนี้หรือไม่?`
                            );
                            if (!ok) return;
                          }
                          openAdd(dow, slot.start, slot.end, isHoliday ? dateStr : null);
                        };

                        return (
                          <div
                            key={dow}
                            className={`min-h-[110px] rounded-xl border transition-all p-1.5 space-y-1.5 relative
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
                              <>
                                <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500">
                                  <span>{entries.length} คาบ</span>
                                </div>
                                {visibleEntries.map(e => (
                                  <ClassCard
                                    key={e.CourseScheduleDetailId}
                                    entry={e}
                                    compact
                                    onEdit={() => openEdit(e)}
                                    onDelete={() => {
                                      setSelected(e);
                                      setDeleteScope('this');
                                      setShowDelete(true);
                                    }}
                                  />
                                ))}
                                {entries.length > 2 && (
                                  <button type="button"
                                    onClick={e => { e.stopPropagation(); setExpandedCells(current => ({ ...current, [cellKey]: !expanded })); }}
                                    aria-expanded={expanded}
                                    className="w-full rounded-lg bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700">
                                    {expanded ? 'ย่อรายการ' : `ดูอีก ${entries.length - 2} คาบ`}
                                  </button>
                                )}
                              </>
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
          onFormChange={(f) => checkConflicts(f, selected.CourseScheduleDetailId, selected.WeekDate)}
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
            <h2 className="text-lg font-bold text-slate-900 mb-1 text-center">ยืนยันการลบคาบสอน</h2>
            <p className="text-sm text-slate-500 mb-4 text-center">
              ลบคาบ <strong>{selected.SubjectName || selected.CourseName}</strong> วัน{DAY_MAP[selected.DayOfWeek]} {selected.StartTime}–{selected.EndTime}
            </p>

            {selected.TotalOccurrences > 1 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  เลือกขอบเขตการลบ ({selected.TotalOccurrences} คาบที่มีวันเวลาและครูเดียวกัน)
                </p>
                {[
                  { v: 'this', l: 'ลบเฉพาะคาบนี้' },
                  { v: 'future', l: 'ลบคาบนี้และคาบถัดไปทั้งหมด' },
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

            <p className="text-xs text-red-500 mb-4">* คาบที่มีประวัติเช็กอินแล้วจะลบไม่ได้</p>

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
function ClassCard({ entry, onEdit, onDelete, compact = false }) {
  const colorClass = scheduleSubjectColor(entry.SubjectName || '');
  const pct = entry.MaxStudents
    ? Math.min(Math.round((entry.StudentCount / entry.MaxStudents) * 100), 100)
    : 0;
  const isFull = pct >= 100;

  // สถานะ checkin
  const checkinStatus = checkinStatusFor(entry);

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
  const compactBorderColor = {
    done: 'border-l-green-400',
    missed: 'border-l-red-400',
    upcoming: 'border-l-yellow-400',
    future: 'border-l-slate-300',
  }[checkinStatus];

  if (compact) return (
    <div className={`group relative min-w-0 rounded-lg border-l-[3px] bg-slate-50 px-2 py-1.5 hover:bg-white hover:shadow-sm ${compactBorderColor}`}>
      <div className="flex items-center gap-1.5 pr-7">
        <span className={`min-w-0 max-w-full truncate rounded px-1.5 py-0.5 text-[11px] font-bold text-white ${colorClass}`} title={entry.SubjectName}>{entry.SubjectName || '—'}</span>
        {statusIcon}
      </div>
      <p className="truncate text-[11px] text-slate-600" title={entry.CourseName}>{entry.CourseName}{entry.ClassGroup ? ` · กลุ่ม ${entry.ClassGroup}` : ''}</p>
      <p className="truncate text-[11px] font-semibold text-slate-700"><MapPin className="mr-0.5 inline h-3 w-3" />{entry.RoomDetail || 'ยังไม่ระบุห้อง'}</p>
      <div className="mt-0.5 flex items-center justify-between gap-1 text-[11px] text-slate-500">
        <span className="min-w-0 truncate">{entry.TutorNickname || 'ยังไม่ระบุครู'}</span>
        <span className="flex shrink-0 items-center gap-0.5" aria-label={`นักเรียน ${entry.StudentCount || 0} คน`}><Users className="h-3 w-3" />{entry.StudentCount || 0}</span>
      </div>
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
        <button type="button" aria-label="แก้ไข" onClick={e => { e.stopPropagation(); onEdit(); }} className="rounded p-1 text-slate-500 hover:bg-orange-50 hover:text-orange-600"><Pencil className="h-3 w-3" /></button>
        <button type="button" aria-label="ลบ" onClick={e => { e.stopPropagation(); onDelete(); }} className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
      </div>
    </div>
  );

  return (
    <div className={`relative group bg-white border rounded-lg p-2 hover:shadow-sm transition ${borderColor}`}>
      <div className="flex items-start justify-between gap-1 mb-1 pr-14 lg:pr-0">
        <div className={`${colorClass} text-white text-[11px] font-semibold px-1.5 py-0.5 rounded inline-block`}>
          {entry.SubjectName || '—'}
        </div>
        {statusIcon}
      </div>

      <p className="text-[11px] text-slate-700 font-medium line-clamp-1 mb-1 leading-tight">
        {entry.CourseName}{entry.ClassGroup ? ` · กลุ่ม ${entry.ClassGroup}` : ''}
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
          {entry.StudentCount || 0}
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
        <p className="text-[11px] text-slate-500">{entry.TotalOccurrences} คาบรูปแบบเดียวกัน</p>
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
    const next = { ...formData, [key]: val,
      ...(['TermStartDate', 'TermEndDate'].includes(key) ? { IncludeHolidayDates: [] } : {}) };
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
  const availableSubjects = getCourseSubjects(selectedCourse);
  const selectedSubject = availableSubjects.find(s => String(s.SubjectId) === String(formData.SubjectId));
  const days = showTermFields ? (formData.DaysOfWeek || []) : [Number(formData.DayOfWeek)].filter(Boolean);
  const setDays = nextDays => {
    const ordered = DAY_ORDER.filter(day => nextDays.includes(day));
    const next = { ...formData, DaysOfWeek: ordered, DayOfWeek: ordered[0] ? String(ordered[0]) : '',
      IncludeHolidayDates: (formData.IncludeHolidayDates || []).filter(date =>
        ordered.includes(new Date(`${date}T00:00:00Z`).getUTCDay() + 1)) };
    setFormData(next);
    onFormChange?.(next);
  };

  const [occurrences, setOccurrences] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  useEffect(() => {
    if (!showTermFields || !days.length || !formData.TermStartDate || !formData.TermEndDate
      || formData.TermEndDate < formData.TermStartDate) {
      setOccurrences(null);
      setPreviewLoading(false);
      return;
    }
    let active = true;
    setOccurrences(null);
    setPreviewLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          daysOfWeek: days.join(','), termStart: formData.TermStartDate, termEnd: formData.TermEndDate,
          includeHolidays: String(Boolean(formData.IncludeHolidays)),
          includeHolidayDates: (formData.IncludeHolidayDates || []).join(','),
        });
        const response = await fetch(`${API_BASE}/schedule/occurrences-preview?${params}`);
        const data = await response.json();
        if (active) setOccurrences(response.ok ? data : { error: data.message || 'คำนวณวันสอนไม่สำเร็จ' });
      } catch {
        if (active) setOccurrences({ error: 'คำนวณวันสอนไม่สำเร็จ' });
      } finally {
        if (active) setPreviewLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [showTermFields, formData.DaysOfWeek, formData.TermStartDate, formData.TermEndDate,
    formData.IncludeHolidays, formData.IncludeHolidayDates]);

  // ── ชั่วโมงรวมที่กำหนดของคอร์ส: คำนวณก่อนบันทึก ──
  const [capacity, setCapacity] = useState(null);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [capacityVersion, setCapacityVersion] = useState(0);
  const [cancellingDraft, setCancellingDraft] = useState(null);
  // ยกเลิกร่าง "สร้างตาราง" ที่ค้างอยู่ (เช่นร่างที่เกินแพ็กเกจตั้งแต่ก่อนมีตัวเช็กนี้) จากในฟอร์มเลย
  const cancelPendingSchedule = async (actionId) => {
    setCancellingDraft(actionId);
    try {
      const r = await fetch(`${API_BASE}/courses/${formData.CourseID}/drafts/${actionId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || 'ยกเลิกร่างไม่สำเร็จ');
      setCapacityVersion(v => v + 1);
      toast('ยกเลิกร่างตารางแล้ว', 'success');
    } catch (e) {
      toast(e.message || 'ยกเลิกร่างไม่สำเร็จ', 'error');
    } finally { setCancellingDraft(null); }
  };
  useEffect(() => {
    const ready = showTermFields && formData.CourseID && days.length && formData.StartTime && formData.EndTime
      && formData.TermStartDate && formData.TermEndDate && formData.StartTime < formData.EndTime;
    if (!ready) { setCapacity(null); setCapacityLoading(false); return; }
    let active = true;
    setCapacity(null);
    setCapacityLoading(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          courseId: formData.CourseID, dayOfWeek: formData.DayOfWeek, startTime: formData.StartTime,
          daysOfWeek: days.join(','), includeHolidays: String(Boolean(formData.IncludeHolidays)),
          endTime: formData.EndTime, termStart: formData.TermStartDate, termEnd: formData.TermEndDate,
          includeHolidayDates: (formData.IncludeHolidayDates || []).join(','),
        });
        const r = await fetch(`${API_BASE}/schedule/private-capacity?${params}`);
        const result = r.ok ? await r.json() : null;
        if (active) setCapacity(result);
      } catch { if (active) setCapacity(null); }
      finally { if (active) setCapacityLoading(false); }
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [showTermFields, formData.CourseID, formData.DaysOfWeek, formData.StartTime, formData.EndTime,
    formData.TermStartDate, formData.TermEndDate, formData.IncludeHolidays, formData.IncludeHolidayDates, capacityVersion]);
  const fmtH = (min) => {
    const h = Math.floor(min / 60), m = Math.round(min % 60);
    return m ? (h ? `${h} ชม. ${m} นาที` : `${m} นาที`) : `${h} ชม.`;
  };
  const slotMinutes = (sl) => {
    const [a, b] = [sl.start, sl.end].map(x => x.split(':').map(Number));
    return (b[0] * 60 + b[1]) - (a[0] * 60 + a[1]);
  };
  // ช่วงเวลามาตรฐานที่สั้นกว่าและทำให้ "ครบทุกคาบในช่วงวันที่เดิม" ได้พอดีแพ็กเกจ (เรียงจากยาวสุด)
  const fittingSlots = capacity?.isLimited && !capacity.fits && capacity.sessions > 0
    ? timeSlots.filter(sl => !sl.isBreak && slotMinutes(sl) > 0 && slotMinutes(sl) < capacity.perSession
        && slotMinutes(sl) * capacity.sessions <= capacity.remainMinutes)
      .sort((x, y) => slotMinutes(y) - slotMinutes(x)).slice(0, 2)
    : [];
  const overCapacity = Boolean(capacity?.isLimited && !capacity.fits);
  const subjectLimitMinutes = Number(selectedSubject?.PlannedHours || 0) > 0
    ? Math.round(Number(selectedSubject.PlannedHours) * 60) : null;
  const subjectUsedMinutes = Number(selectedSubject?.ScheduledMinutes || 0);
  const subjectAddMinutes = showTermFields && occurrences?.dates?.length && formData.StartTime < formData.EndTime
    ? occurrences.dates.length * slotMinutes({ start: formData.StartTime, end: formData.EndTime }) : 0;
  const subjectOverCapacity = subjectLimitMinutes !== null
    && subjectUsedMinutes + subjectAddMinutes > subjectLimitMinutes;

  const [roomSuggestions, setRoomSuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimer = useRef(null);

  useEffect(() => {
    clearTimeout(suggestTimer.current);
    if (!days.length || !formData.StartTime || !formData.EndTime
      || (showTermFields && (!formData.TermStartDate || !formData.TermEndDate))) {
      setRoomSuggestions(null);
      setSuggestLoading(false);
      return;
    }
    let active = true;
    setRoomSuggestions(null);
    setSuggestLoading(true);
    suggestTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          dayOfWeek: formData.DayOfWeek,
          ...(showTermFields ? { daysOfWeek: days.join(','), includeHolidays: String(Boolean(formData.IncludeHolidays)) } : {}),
          startTime: formData.StartTime,
          endTime: formData.EndTime,
          studentCount: selectedCourse?.EnrolledCount ?? 0,
          ...(formData.TermStartDate && formData.TermEndDate ? {
            termStart: formData.TermStartDate, termEnd: formData.TermEndDate,
            includeHolidayDates: (formData.IncludeHolidayDates || []).join(','),
          } : {}),
          ...(excludeId ? { excludeId } : {}),
        });
        const r = await fetch(`${API_BASE}/schedule/room-suggestions?${params}`);
        const result = await r.json();
        if (active) setRoomSuggestions(r.ok ? result : null);
      } catch {
        if (active) setRoomSuggestions(null);
      } finally {
        if (active) setSuggestLoading(false);
      }
    }, 400);
    return () => { active = false; clearTimeout(suggestTimer.current); };
  }, [formData.DayOfWeek, formData.DaysOfWeek, formData.StartTime, formData.EndTime, formData.TermStartDate,
      formData.TermEndDate, formData.IncludeHolidays, formData.IncludeHolidayDates,
      selectedCourse?.EnrolledCount, excludeId, showTermFields]);

  // auto-fill term dates เมื่อเลือก course + ล้างวิชาที่ไม่ตรงกับคอร์สใหม่
  const handleCourseChange = val => {
    const course = meta.courses.find(c => String(c.CourseID) === val);
    const subjectsForCourse = getCourseSubjects(course);
    const subjectStillValid = subjectsForCourse.some(s => String(s.SubjectId) === String(formData.SubjectId));
    const subject = subjectStillValid ? subjectsForCourse.find(s => String(s.SubjectId) === String(formData.SubjectId)) : null;

    const holidayDate = formData.IncludeHolidayDates?.[0];
    const selectedHolidayFits = holidayDate && course?.StartDate <= holidayDate && course?.LastDate >= holidayDate;
    const next = {
      ...formData,
      CourseID: val,
      SubjectId: subjectStillValid ? formData.SubjectId : '',
      AdminId: subject?.AdminId ? String(subject.AdminId) : '',
      ...(course
        ? {
          TermStartDate: selectedHolidayFits ? holidayDate : course.StartDate > isoDate(new Date()) ? course.StartDate : isoDate(new Date()),
          TermEndDate: selectedHolidayFits ? holidayDate : course.LastDate || '',
          IncludeHolidayDates: selectedHolidayFits ? [holidayDate] : [],
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

    if (formData.TermEndDate < formData.TermStartDate) {
      return 'วันสิ้นสุดต้องไม่ก่อนวันเริ่ม';
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
    selectedSubject?.AdminId &&
    Number(selectedSubject.Status_Tutor_Id) === 1 &&
    days.length > 0 &&
    formData.StartTime &&
    formData.EndTime &&
    (!showTermFields || (formData.TermStartDate && formData.TermEndDate)) &&
    conflicts.length === 0 &&
    !dateError &&
    !timeError &&
    (!showTermFields || (!previewLoading && occurrences?.dates?.length > 0)) &&
    (!showTermFields || !capacityLoading) &&
    !overCapacity &&
    (!showTermFields || !subjectOverCapacity);

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
                เลือกขอบเขตการแก้ไข ({totalOccurrences} คาบที่มีวันเวลาและครูเดียวกัน)
              </p>
              <div className="space-y-1.5">
                {[
                  { v: 'this', l: 'แก้เฉพาะคาบนี้เท่านั้น' },
                  { v: 'future', l: 'แก้คาบนี้และคาบถัดไปทั้งหมด' },
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

          {/* Days and time */}
          {showTermFields ? (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-xs font-semibold text-slate-700">สอนวันไหนบ้าง <span className="text-red-500">*</span></label>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setDays([2, 3, 4, 5, 6])}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-orange-700 hover:bg-orange-50">จ.–ศ.</button>
                  <button type="button" onClick={() => setDays(DAY_ORDER)}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-orange-700 hover:bg-orange-50">ทุกวัน</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {DAY_ORDER.map(day => {
                  const active = days.includes(day);
                  return (
                    <button key={day} type="button" aria-pressed={active} aria-label={`วัน${DAY_MAP[day]}`}
                      onClick={() => setDays(active ? days.filter(selected => selected !== day) : [...days, day])}
                      className={`h-10 rounded-xl border text-xs font-semibold transition ${active
                        ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300'}`}>
                      {DAY_SHORT[day]}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-slate-600 mb-1 block">วัน <span className="text-red-500">*</span></label>
              <select value={formData.DayOfWeek} onChange={e => set('DayOfWeek', e.target.value)}
                className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none">
                <option value="">เลือกวัน</option>
                {DAY_ORDER.map(day => <option key={day} value={day}>{DAY_MAP[day]}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-600 mb-1 block">ช่วงเวลา <span className="text-red-500">*</span></label>
            <select value={currentSlotLabel} onChange={e => handleSlot(e.target.value)}
              className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none">
              <option value="">เลือกเวลา</option>
              {timeSlots.filter(s => !s.isBreak).map(slot => <option key={slot.label} value={slot.label}>{slot.label}</option>)}
            </select>
          </div>

          {/* ── ใหม่: แสดง timeError ── */}
          {timeError && (
            <p className="text-[11px] text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" /> {timeError}
            </p>
          )}

          {/* Course */}
          <div>
            <label className="text-xs text-slate-600 mb-1 block">คอร์ส <span className="text-red-500">*</span></label>
            <select
              value={formData.CourseID}
              onChange={e => handleCourseChange(e.target.value)}
              disabled={!showTermFields}
              className="w-full px-3 h-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:bg-slate-100"
            >
              <option value="">เลือกคอร์ส</option>
              {meta.courses.filter(c => isSchedulableCourse(c) || String(c.CourseID) === String(formData.CourseID)).map(c => (
                <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>
              ))}
            </select>
          </div>

          {selectedCourse?.StartDate && selectedCourse?.LastDate && (
            <p className="text-xs text-slate-500">
              ช่วงคอร์ส {new Date(selectedCourse.StartDate).toLocaleDateString('th-TH')} – {new Date(selectedCourse.LastDate).toLocaleDateString('th-TH')}
              {selectedCourse.EnrolledCount != null && ` · นักเรียน ${selectedCourse.EnrolledCount} คน`}
            </p>
          )}

          {/* Subject + Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">วิชา <span className="text-red-500">*</span></label>
              <select
                value={formData.SubjectId}
                onChange={e => {
                  const subject = availableSubjects.find(s => String(s.SubjectId) === e.target.value);
                  const next = { ...formData, SubjectId: e.target.value, AdminId: subject?.AdminId ? String(subject.AdminId) : '' };
                  setFormData(next);
                  onFormChange?.(next);
                }}
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

          <RoomSuggestionPanel
            data={roomSuggestions}
            loading={suggestLoading}
            onPick={(roomId) => set('RoomId', String(roomId))}
            selectedRoomId={formData.RoomId}
          />

          {/* Tutor is assigned to the course subject; replacements use tutor release. */}
          <div>
            <label className="text-xs text-slate-600 mb-1 block">ครูประจำวิชา</label>
            <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
              {Number(selectedSubject?.TutorCount) > 1
                ? 'วิชานี้มีครูประจำหลายคน กรุณากำหนดให้ชัดเจนในหน้าคอร์ส'
                : selectedSubject?.AdminId ? tutorLabel(selectedSubject) : 'ยังไม่ได้มอบหมายครูประจำวิชาในหน้าคอร์ส'}
            </div>
            {!showTermFields && selectedSubject?.AdminId && formData.AdminId && String(formData.AdminId) !== String(selectedSubject.AdminId) && (
              <p className="mt-1 text-xs text-amber-700">ผู้สอนที่บันทึกในคาบนี้คือ {tutorLabel(meta.tutors.find(t => String(t.AdminId) === String(formData.AdminId)) || { AdminId: formData.AdminId })} ซึ่งต่างจากครูประจำวิชา</p>
            )}
            {selectedSubject && !selectedSubject.AdminId && Number(selectedSubject.TutorCount) === 0 && <p className="mt-1 text-xs text-amber-700">กรุณามอบหมายครูในหน้าคอร์สก่อนจัดคาบ</p>}
          </div>

          {/* Term dates (add only) */}
          {showTermFields && (
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                ช่วงวันที่สอน <span className="text-red-500">*</span>
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

              <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" checked={Boolean(formData.IncludeHolidays)}
                  onChange={e => set('IncludeHolidays', e.target.checked)} className="accent-orange-500" />
                สอนวันหยุดที่อยู่ในช่วงนี้ด้วย
              </label>

              {dateError && (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" /> {dateError}
                </p>
              )}

              {!dateError && days.length > 0 && formData.TermStartDate && formData.TermEndDate && (
                <div className={`mt-3 rounded-xl border px-3 py-3 text-xs ${subjectOverCapacity || overCapacity || occurrences?.error
                  ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`} role={subjectOverCapacity || overCapacity || occurrences?.error ? 'alert' : 'status'}>
                  <p className="font-bold text-slate-800">สรุปก่อนบันทึก</p>
                  {previewLoading ? <p className="mt-2 text-slate-500">กำลังคำนวณคาบ...</p>
                    : occurrences?.error ? <p className="mt-2 text-red-700">{occurrences.error}</p>
                    : occurrences?.dates && <>
                      <div className="mt-2 flex items-start justify-between gap-2">
                        <span className="text-slate-600">วันที่สอน</span>
                        <strong className="text-right text-slate-800">{occurrences.dates.length} คาบ
                          {formData.StartTime && formData.EndTime && formData.StartTime < formData.EndTime
                            ? ` · ${fmtH(subjectAddMinutes)}` : ''}</strong>
                      </div>
                      {occurrences.dates.length > 1 ? (
                        <details className="mt-1 text-slate-500">
                          <summary className="cursor-pointer text-right text-orange-700">ดูวันที่ทั้งหมด</summary>
                          <p className="mt-1 leading-5">{occurrences.dates.map(fmtDate).join(', ')}</p>
                        </details>
                      ) : occurrences.dates.length === 1
                        ? <p className="mt-1 text-right text-slate-500">{fmtDate(occurrences.dates[0])}</p>
                        : <p className="mt-1 text-red-700">ไม่มีคาบในช่วงวันที่เลือก</p>}
                      {occurrences.skippedHolidays?.length > 0 && <p className="mt-1 text-slate-500">ข้ามวันหยุด {occurrences.skippedHolidays.length} วัน</p>}
                    </>}

                  {selectedSubject && <div className="mt-2 flex items-start justify-between gap-2 border-t border-slate-200 pt-2">
                    <span className="min-w-0 text-slate-600">{selectedSubject.SubjectName}
                      {subjectLimitMinutes !== null && <span className="block text-[11px] text-slate-500">ลงแล้ว {fmtH(subjectUsedMinutes)} / {fmtH(subjectLimitMinutes)}</span>}
                    </span>
                    <strong className={`shrink-0 text-right ${subjectOverCapacity ? 'text-red-700' : 'text-slate-800'}`}>
                      {subjectLimitMinutes === null ? 'ไม่กำหนดชั่วโมง' : subjectOverCapacity
                        ? `เกิน ${fmtH(subjectUsedMinutes + subjectAddMinutes - subjectLimitMinutes)}`
                        : `เหลือ ${fmtH(Math.max(0, subjectLimitMinutes - subjectUsedMinutes - subjectAddMinutes))}`}
                    </strong>
                  </div>}

                  {capacity?.isLimited && <div className="mt-2 flex items-start justify-between gap-2 border-t border-slate-200 pt-2">
                    <span className="text-slate-600">รวมทั้งคอร์ส
                      <span className="block text-[11px] text-slate-500">ลงแล้ว {fmtH(capacity.usedMinutes)} / {fmtH(capacity.limitMinutes)}</span>
                    </span>
                    <strong className={`shrink-0 text-right ${overCapacity ? 'text-red-700' : 'text-slate-800'}`}>
                      {overCapacity ? `เกิน ${fmtH(capacity.addMinutes - capacity.remainMinutes)}`
                        : `เหลือ ${fmtH(capacity.remainMinutes - capacity.addMinutes)}`}
                    </strong>
                  </div>}
                  {capacity?.pendingMinutes > 0 && <p className="mt-1 text-slate-500">รวมตารางที่รอเผยแพร่ {fmtH(capacity.pendingMinutes)}</p>}
                  {(subjectOverCapacity || overCapacity) && <p className="mt-2 font-semibold text-red-700">ชั่วโมงเกินแผน ลดวันสอนหรือเลือกคาบสั้นลง</p>}

                  {capacity?.isLimited && <>
                  {overCapacity && (capacity.suggestions?.length > 0 || fittingSlots.length > 0) && (
                    <details className="mt-2 text-slate-700">
                      <summary className="cursor-pointer font-semibold text-orange-700">ดูตัวเลือกที่พอดีชั่วโมง</summary>
                      <div className="mt-2 space-y-1.5">
                      {(capacity.suggestions || []).filter(sg => sg.kind === 'endDate').map(sg => (
                        <button key="endDate" type="button" onClick={() => set('TermEndDate', sg.termEndDate)}
                          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700">
                          จบเร็วขึ้น: {sg.label}
                        </button>
                      ))}
                      {fittingSlots.map(sl => (
                        <button key={sl.label} type="button" onClick={() => handleSlot(sl.label)}
                          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700">
                          คาบสั้นลง: {sl.label} ({fmtH(slotMinutes(sl))}) — ครบ {capacity.sessions} คาบ รวม {fmtH(slotMinutes(sl) * capacity.sessions)}
                        </button>
                      ))}
                      </div>
                    </details>
                  )}
                  {overCapacity && !capacity.suggestions?.length && !fittingSlots.length && !(capacity.pendingSchedules?.length > 0) && (
                    <p className="mt-1 text-red-700">ชั่วโมงที่เหลือไม่พอแม้ 1 คาบ — ปรับชั่วโมงคอร์สหรือลบคาบเดิมที่ไม่ใช้ก่อน</p>
                  )}
                  {/* ร่างสร้างตารางที่รอเผยแพร่ — ถ้าชั่วโมงไม่พอเพราะร่างเหล่านี้ ให้ยกเลิกได้ตรงนี้ */}
                  {overCapacity && capacity.pendingSchedules?.length > 0 && (
                    <details className="mt-2 text-slate-700">
                      <summary className="cursor-pointer font-semibold text-orange-700">ดูตารางร่างที่รอเผยแพร่</summary>
                      <div className="mt-2 space-y-1.5">
                      <p>
                        {capacity.usedMinutes - capacity.pendingMinutes < capacity.limitMinutes && capacity.usedMinutes >= capacity.limitMinutes
                          ? 'ชั่วโมงเต็มเพราะตารางที่ยังรอเผยแพร่ — ยกเลิกร่างที่ไม่ใช้แล้ว ระบบจะคำนวณใหม่ทันที:'
                          : 'ตารางที่รอเผยแพร่ของคอร์สนี้ (ยกเลิกได้ถ้าไม่ใช้แล้ว):'}
                      </p>
                      {capacity.pendingSchedules.map(ps => (
                        <div key={ps.ActionId} className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-white px-3 py-2">
                          <span className="min-w-0 text-slate-700">{ps.label}</span>
                          <button type="button" disabled={cancellingDraft === ps.ActionId} onClick={() => cancelPendingSchedule(ps.ActionId)}
                            className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 hover:border-red-300 hover:text-red-600 disabled:opacity-50">
                            {cancellingDraft === ps.ActionId ? 'กำลังยกเลิก…' : 'ยกเลิกร่างนี้'}
                          </button>
                        </div>
                      ))}
                      </div>
                    </details>
                  )}
                  </>}
                </div>
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
  // เลือกห้องแล้วให้พับแผงเหลือบรรทัดเดียว ไม่กินที่ในฟอร์ม (กดเปิดดูใหม่ได้)
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [selectedRoomId]);
  if (selectedRoomId && !open && !loading) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-600 hover:border-orange-200">
        <span><LuLightbulb className="inline h-4 w-4 shrink-0 text-amber-500" /> เลือกห้องแล้ว — ดูห้องที่แนะนำอีกครั้ง</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> กำลังหาห้องที่เหมาะสม...
      </div>
    );
  }

  if (!data) return null;

  const { suggestions, busyButFits, studentCount, hasEnrollment } = data;

  return (
    <div className="space-y-1.5 text-xs">
      <p className="font-semibold text-slate-600">ห้องที่แนะนำ{hasEnrollment ? ` · นักเรียน ${studentCount} คน` : ''}</p>

      {!hasEnrollment && (
        <p className="text-[11px] text-amber-700">
          <LuAlertTriangle className="inline h-3.5 w-3.5 shrink-0" /> คอร์สนี้ยังไม่มีผู้ลงทะเบียน ระบบจึงแนะนำห้องขนาดเล็กที่สุดที่ว่าง
          หากมีผู้ลงทะเบียนเพิ่ม ควรปรับห้องอีกครั้ง
        </p>
      )}

      {suggestions.length === 0 ? (
        <p className="text-xs text-red-600">ไม่พบห้องที่ว่างและจุพอสำหรับจำนวนนักเรียนนี้</p>
      ) : (
        <div className="space-y-1">
          {[suggestions[0]].map(r => {
            const isSelected = String(r.RoomId) === String(selectedRoomId);
            const isTop = r.rank === 1;
            return (
              <button
                key={r.RoomId}
                type="button"
                onClick={() => onPick(r.RoomId)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition
        ${isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : isTop
                      ? 'border-orange-300 bg-white hover:bg-orange-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <span className="text-slate-700"><strong>{r.RoomDetail}</strong> · {r.Capacity} ที่นั่ง · ว่าง</span>
                {isSelected && <CheckCircle className="h-4 w-4 text-orange-600 shrink-0" />}
              </button>
            );
          })}
          {suggestions.length > 1 && (
            <details className="text-xs text-slate-600">
              <summary className="cursor-pointer py-1 text-orange-700">ดูห้องอื่นอีก {suggestions.length - 1} ห้อง</summary>
              <div className="mt-1 space-y-1.5">
                {suggestions.slice(1).map(r => (
                  <button key={r.RoomId} type="button" onClick={() => onPick(r.RoomId)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:border-orange-300">
                    <span className="block font-semibold">{r.RoomDetail} · {r.Capacity} ที่นั่ง</span>
                    <span className="text-[11px] text-slate-500">ว่าง{r.isOversized ? ` · ที่นั่งเกินความจำเป็น ${r.extraSeats} ที่นั่ง` : ''}</span>
                  </button>
                ))}
              </div>
            </details>
          )}
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
