import { API_URL } from "../config";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronUp, X, Download,
  AlertTriangle, Clock, CreditCard, CheckCircle,
  TrendingDown, Users, BookOpen, Camera,
  EyeIcon
} from 'lucide-react';

const API_BASE = `${API_URL}/api/admin`;

function thisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = now.toISOString().slice(0, 10);
  return { start, end };
}

const { start, end } = thisMonthRange();

// ── Avatar สีวน ──────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: 'bg-orange-100', color: 'text-orange-700' },
  { bg: 'bg-blue-100', color: 'text-blue-700' },
  { bg: 'bg-green-100', color: 'text-green-700' },
  { bg: 'bg-purple-100', color: 'text-purple-700' },
  { bg: 'bg-red-100', color: 'text-red-700' },
];
function avatarCls(idx) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

// ── Rate Bar ──────────────────────────────────────────────────
function RateBar({ rate }) {
  const color = rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = rate >= 80 ? 'text-emerald-700' : rate >= 50 ? 'text-amber-700' : 'text-red-700';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden min-w-[40px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className={`text-xs font-semibold min-w-[32px] text-right ${textColor}`}>{rate}%</span>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ rate, unpaid }) {
  if (rate < 50) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />น่าเป็นห่วง
    </span>
  );
  if (unpaid > 0) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />มีค้างจ่าย
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />ปกติ
    </span>
  );
}

// ── สร้าง list เดือนย้อนหลัง 12 เดือน ──────────────────────
function buildMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-based
    const start = new Date(year, month, 1).toISOString().slice(0, 10);
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10); // วันสุดท้ายของเดือน
    const label = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
    options.push({ label, start, end });
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();

// ── CSV Export ────────────────────────────────────────────────
function exportCSV(tutors, startDate, endDate) {
  const headers = ['ชื่อเล่น', 'ชื่อ', 'นามสกุล', 'คาบทั้งหมด', 'เช็กอิน', 'อัตราเช็กอิน(%)', 'ค้างจ่าย(คาบ)', 'รายได้ค้างจ่าย(บาท)', 'สถานะ'];
  const rows = tutors.map(t => {
    const rate = t.AttendanceRate ?? 0;
    const unpaid = t.UnpaidCheckin ?? 0;
    const status = rate < 50 ? 'น่าเป็นห่วง' : unpaid > 0 ? 'มีค้างจ่าย' : 'ปกติ';
    return [
      t.Nickname || '',
      t.Firstname || '',
      t.Lastname || '',
      t.TotalScheduled ?? 0,
      t.TotalCheckin ?? 0,
      rate,
      unpaid,
      unpaid > 0 ? unpaid * (t.RatePerHour || 300) : 0,
      status,
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF'; // UTF-8 BOM for Thai characters in Excel
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_${startDate}_${endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Session Detail Modal ──────────────────────────────────────
function SessionDetailModal({ tutor, sessions, sessionsLoading, startDate, endDate, onClose }) {
  const [expandedSession, setExpandedSession] = useState(null);
  const { start, end } = thisMonthRange();

  const parsePhotoTime = (path) => {
    if (!path) return null;
    const match = path?.match(/(\d{13})/);
    if (!match) return null;
    return new Date(parseInt(match[1]));
  };
  const formatTime = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const getPhotoDiff = (photoStart, photoEnd) => {
    const s = parsePhotoTime(photoStart);
    const e = parsePhotoTime(photoEnd);
    if (!s || !e) return null;
    return Math.round((e - s) / 60000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{tutor.Nickname}</h3>
              <p className="text-white/70 text-xs">
                {tutor.Firstname} {tutor.Lastname} · {tutor.TotalScheduled} คาบ
                {startDate ? ` · ${startDate} ถึง ${endDate}` : ' · ทั้งหมด'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(tutor.UnpaidCheckin ?? 0) > 0 && (
              <button className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white/20 text-white hover:bg-white/30 transition border border-white/30">
                จ่ายค้างทั้งหมด ({tutor.UnpaidCheckin} คาบ)
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="overflow-y-auto flex-1">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">กำลังโหลด...</p>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <BookOpen className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">ไม่มีข้อมูลการสอนในช่วงนี้</p>
            </div>
          ) : sessions.map(session => {
            const diffMin = getPhotoDiff(session.PhotoStart, session.PhotoEnd);
            const isValid = diffMin !== null && diffMin >= 30;
            const isExpanded = expandedSession === session.TutorCheckinId;
            const startAt = parsePhotoTime(session.PhotoStart);
            const endAt = parsePhotoTime(session.PhotoEnd);
            const presentCount = session.students?.filter(s => s.Status == 1).length ?? 0;
            const totalCount = session.students?.length ?? 0;

            return (
              <div key={session.TutorCheckinId} className="border-b border-slate-100 last:border-0">
                {/* Session Row */}
                <div
                  onClick={() => setExpandedSession(isExpanded ? null : session.TutorCheckinId)}
                  className="flex items-center gap-3 px-6 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  {/* Date */}
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-semibold text-slate-800">{formatDate(session.ClassDate)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{session.StartTime} – {session.EndTime}</p>
                  </div>

                  {/* Subject */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{session.SubjectName || session.CourseName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{session.CourseName} · {session.RoomDetail || 'ไม่ระบุห้อง'}</p>
                  </div>

                  {/* Photo pill */}
                  <div className="shrink-0">
                    {session.PhotoStart && session.PhotoEnd ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${isValid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        <Camera className="w-3 h-3" />
                        {isValid ? `✓ ${diffMin} นาที` : `⚠ ${diffMin ?? '?'} นาที`}
                      </span>
                    ) : session.PhotoStart ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock className="w-3 h-3" />รอปิดคาบ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                        <Camera className="w-3 h-3" />ไม่มีรูป
                      </span>
                    )}
                  </div>

                  {/* Students */}
                  <div className="w-14 text-right shrink-0">
                    <p className="text-sm font-bold text-slate-700">{totalCount > 0 ? `${presentCount}/${totalCount}` : '—'}</p>
                    <p className="text-[10px] text-slate-400">นักเรียน</p>
                  </div>

                  {/* Payment */}
                  <div className={`w-14 text-right shrink-0 text-xs font-bold ${session.TutorPaymentId ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {session.TutorPaymentId ? 'จ่ายแล้ว' : 'ค้างจ่าย'}
                  </div>

                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-slate-300 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />
                  }
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 space-y-4">
                    {/* Photos */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'รูปต้นคาบ', photo: session.PhotoStart, time: startAt, placeholder: 'ไม่มีรูป' },
                        { label: 'รูปท้ายคาบ', photo: session.PhotoEnd, time: endAt, placeholder: 'ยังไม่ปิดคาบ' },
                      ].map(({ label, photo, time, placeholder }) => (
                        <div key={label}>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
                          {photo ? (
                            <div className="relative">
                              <a href={`${API_URL}${photo}`} target="_blank" rel="noreferrer">
                                <img src={`${API_URL}${photo}`} alt={label}
                                  className="w-full h-28 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition" />
                              </a>
                              {time && (
                                <span className="absolute bottom-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                                  {formatTime(time)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="h-28 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-1.5">
                              <Camera className="w-6 h-6 text-slate-300" />
                              <span className="text-xs text-slate-400">{placeholder}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Timing bar */}
                    {diffMin !== null && (
                      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium ${isValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {isValid
                          ? <><CheckCircle className="w-3.5 h-3.5" />รูปห่างกัน {diffMin} นาที — สอนครบชั่วโมง</>
                          : <><AlertTriangle className="w-3.5 h-3.5" />รูปห่างกันเพียง {diffMin} นาที — อาจสอนไม่ครบ</>
                        }
                      </div>
                    )}

                    {/* Remark */}
                    {session.Remark && (
                      <div className="text-xs text-slate-600 px-3 py-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="font-semibold text-slate-500">บันทึก: </span>{session.Remark}
                      </div>
                    )}

                    {/* Students */}
                    {session.students?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          นักเรียน ({presentCount}/{totalCount} คน)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {session.students.map(s => (
                            <span key={s.UserId} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${s.Status == 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                              {s.Status == 1 ? '✓' : '✗'} {s.Nickname || s.Firstname}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Missed banner */}
          {sessions.some(s => !s.PhotoStart) && (
            <div className="flex items-center gap-2 px-6 py-3 bg-red-50/60 border-t border-red-100 text-xs text-red-700 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              มีคาบที่ผ่านมา &gt; 4 ชั่วโมงแล้วแต่ยังไม่มีรูปบันทึก — อาจต้องติดตามติวเตอร์โดยตรง
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function TutorAttendanceDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('AttendanceRate');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showBatchPayment, setShowBatchPayment] = useState(false);

  // helper ดึง range จาก selectedMonth (null = ไม่ filter)
  const getDateRange = () => {
    if (!selectedMonth) return { startDate: null, endDate: null };
    return { startDate: selectedMonth.start, endDate: selectedMonth.end };
  };

  // แก้ fetchData
  const fetchData = async (month) => {
    setLoading(true);
    const url = month
      ? `${API_BASE}/tutors/attendance?startDate=${month.start}&endDate=${month.end}`
      : `${API_BASE}/tutors/attendance`;
    const r = await fetch(url);
    const d = await r.json();
    setTutors(d.tutors || []);
    setLoading(false);
  };

  // auto-fetch เมื่อ selectedMonth เปลี่ยน
  useEffect(() => { fetchData(selectedMonth); }, [selectedMonth]);

  const processed = useMemo(() => {
    let list = [...tutors];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.Nickname || '').toLowerCase().includes(q) ||
        (t.Firstname || '').toLowerCase().includes(q) ||
        (t.Lastname || '').toLowerCase().includes(q)
      );
    }
    if (filter === 'atRisk') list = list.filter(t => (t.AttendanceRate ?? 100) < 50);
    if (filter === 'unpaid') list = list.filter(t => t.UnpaidCheckin > 0);
    if (filter === 'pending') list = list.filter(t => (t.MissedCount ?? 0) > 0);
    list.sort((a, b) => {
      const av = a[sortBy] ?? -1;
      const bv = b[sortBy] ?? -1;
      return sortAsc ? av - bv : bv - av;
    });
    return list;
  }, [tutors, sortBy, sortAsc, search, filter]);

  const avgRate = tutors.length
    ? Math.round(tutors.reduce((s, t) => s + (t.AttendanceRate ?? 0), 0) / tutors.length) : 0;
  const atRisk = tutors.filter(t => (t.AttendanceRate ?? 100) < 50).length;
  const unpaidTotal = tutors.reduce((s, t) => s + (t.UnpaidCheckin ?? 0), 0);
  const missedTotal = tutors.reduce((s, t) => s + (t.MissedCount ?? 0), 0);

  const toggleSort = (col) => {
    if (sortBy === col) setSortAsc(a => !a);
    else { setSortBy(col); setSortAsc(false); }
  };

  const { start: thisMonthStart, end: thisMonthEnd } = thisMonthRange();

  // แก้ fetchSessions — ใช้ range เดียวกับ attendance
  const fetchSessions = async (adminId) => {
    setSessionsLoading(true);
    const { startDate, endDate } = getDateRange();

    // ถ้าไม่มี filter ให้ดึงตั้งแต่ปีที่แล้วจนถึงวันนี้ (เผื่อ checkin เก่า)
    const s = startDate || '2020-01-01';
    const e = endDate || new Date().toISOString().slice(0, 10);

    try {
      const r = await fetch(`${API_BASE}/tutors/${adminId}/sessions?startDate=${s}&endDate=${e}`);
      const d = await r.json();
      setSessions(d.sessions || []);
    } catch (err) {
      console.error(err);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleViewDetail = (tutor, e) => {
    e.stopPropagation();
    setSelectedTutor(tutor);
    setSessions([]);
    fetchSessions(tutor.AdminId);
  };

  const TABS = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'atRisk', label: 'น่าเป็นห่วง' },
    { key: 'unpaid', label: 'ค้างจ่าย' },
    { key: 'pending', label: 'ยังไม่บันทึก' },
  ];

  const STAT_CARDS = [
    {
      label: 'อัตราเช็กอินเฉลี่ย',
      value: `${avgRate}%`,
      icon: TrendingDown,
      color: 'bg-emerald-500',
      badge: null,
    },
    {
      label: 'คาบที่ยังไม่ได้บันทึก',
      value: missedTotal,
      icon: Clock,
      color: missedTotal > 0 ? 'bg-red-500' : 'bg-slate-400',
    },
    {
      label: 'ค้างจ่ายค่าสอน',
      value: `${unpaidTotal} คาบ`,
      icon: CreditCard,
      color: unpaidTotal > 0 ? 'bg-amber-500' : 'bg-slate-400',
    },
    {
      label: 'ติวเตอร์น่าเป็นห่วง',
      value: atRisk,
      icon: AlertTriangle,
      color: atRisk > 0 ? 'bg-red-500' : 'bg-slate-400',
    },
  ];

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return null;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-0.5 opacity-60" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5 opacity-60" />;
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายงานบันทึกชั่วโมงการสอน</h1>
          <p className="text-sm text-slate-500 mt-1">ติดตามการเช็กอิน  ค้างจ่าย  ขาดสอน ของติวเตอร์แต่ละคน</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportCSV(processed, startDate, endDate)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-orange-300 hover:text-orange-600 transition shadow-sm"
          >
            <Download className="w-4 h-4" /> ส่งออก CSV
          </button>
          <button
            onClick={() => setShowBatchPayment(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <CreditCard className="w-4 h-4" /> จ่ายเงินเป็นชุด
            {unpaidTotal > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full">
                {unpaidTotal}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Month Dropdown Filter ───────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-600">เลือกเดือน</label>
        <select
          value={selectedMonth ? selectedMonth.start : ''}
          onChange={e => {
            const found = MONTH_OPTIONS.find(o => o.start === e.target.value);
            setSelectedMonth(found || null);
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition min-w-[180px]"
        >
          <option value="">ทั้งหมด (ไม่กำหนดช่วง)</option>
          {MONTH_OPTIONS.map(opt => (
            <option key={opt.start} value={opt.start}>{opt.label}</option>
          ))}
        </select>
        {selectedMonth && (
          <span className="text-xs text-slate-400">
            {selectedMonth.start} ถึง {selectedMonth.end}
          </span>
        )}
      </div>

      {/* ── Stats Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, sub, icon: Icon, color, badge }) => (
          <div key={label} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
              {badge && (
                <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Absence Heatmap ────────────────────────────── */}
      <AbsenceHeatmap selectedMonth={selectedMonth} />
      {/* ── Filter Bar ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อติวเตอร์..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
            />
          </div>
          {/* Tabs */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-2 text-xs font-medium transition
                                    ${i < TABS.length - 1 ? 'border-r border-slate-200' : ''}
                                    ${filter === tab.key
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Sort select */}
          <select
            value={`${sortBy}_${sortAsc ? 'asc' : 'desc'}`}
            onChange={e => {
              const [col, dir] = e.target.value.split('_');
              setSortBy(col);
              setSortAsc(dir === 'asc');
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-orange-400 outline-none shrink-0"
          >
            <option value="AttendanceRate_asc">อัตราเช็กอิน </option>
            <option value="AttendanceRate_desc">อัตราเช็กอิน </option>
            <option value="TotalScheduled_desc">คาบทั้งหมด </option>
            <option value="UnpaidCheckin_desc">ค้างจ่าย </option>
            <option value="MissedCount_desc">ขาด </option>
          </select>
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">
          แสดง {processed.length} จาก {tutors.length} คน
        </p>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 transition"
                  onClick={() => toggleSort('Nickname')}>
                  ติวเตอร์ <SortIcon col="Nickname" />
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 transition"
                  onClick={() => toggleSort('TotalScheduled')}>
                  คาบทั้งหมด <SortIcon col="TotalScheduled" />
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 transition"
                  onClick={() => toggleSort('TotalCheckin')}>
                  เช็กอิน <SortIcon col="TotalCheckin" />
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานะ</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 transition"
                  onClick={() => toggleSort('UnpaidCheckin')}>
                  ค้างจ่าย <SortIcon col="UnpaidCheckin" />
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">รายได้ค้างจ่าย</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 transition"
                  onClick={() => toggleSort('AttendanceRate')}>
                  อัตราเช็กอิน <SortIcon col="AttendanceRate" />
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm">กำลังโหลด...</p>
                    </div>
                  </td>
                </tr>
              ) : processed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">ไม่มีข้อมูลในช่วงนี้</p>
                  </td>
                </tr>
              ) : processed.map((t, idx) => {
                const av = avatarCls(idx);
                const isAtRisk = (t.AttendanceRate ?? 100) < 50;
                return (
                  <tr
                    key={t.AdminId}
                    className={`transition-colors ${isAtRisk ? 'bg-red-50/30' : 'hover:bg-orange-50/30'}`}
                  >
                    {/* Tutor */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${av.bg} ${av.color}`}>
                          {t.Nickname?.slice(0, 2) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{t.Nickname}</p>
                          <p className="text-[10px] text-slate-400">{t.Firstname} {t.Lastname}</p>
                        </div>
                      </div>
                    </td>
                    {/* Total */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                        {t.TotalScheduled}
                      </span>
                    </td>
                    {/* Checkin */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                        {t.TotalCheckin}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <StatusBadge rate={t.AttendanceRate ?? 100} unpaid={t.UnpaidCheckin ?? 0} />
                    </td>
                    {/* Unpaid */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${(t.UnpaidCheckin ?? 0) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'}`}>
                        {t.UnpaidCheckin ?? 0}
                      </span>
                    </td>
                    {/* Revenue */}
                    <td className="px-4 py-3 text-center text-xs">
                      {(t.UnpaidCheckin ?? 0) > 0
                        ? <span className="font-bold text-amber-700">฿{(t.UnpaidCheckin * (t.RatePerHour || 300)).toLocaleString()}</span>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                    {/* Rate bar */}
                    <td className="px-4 py-3 min-w-[120px]">
                      {t.AttendanceRate !== null && t.AttendanceRate !== undefined
                        ? <RateBar rate={t.AttendanceRate} />
                        : <span className="text-xs text-slate-300">ไม่มีข้อมูล</span>
                      }
                    </td>
                    {/* View detail button */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => handleViewDetail(t, e)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition"
                      >
                        <EyeIcon className="w-3.5 h-3.5" /> ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 px-1">
        {[
          { dot: 'bg-emerald-500', text: 'ปกติ — เช็กอิน ≥ 80%' },
          { dot: 'bg-amber-500', text: 'มีค้างจ่าย — ยังไม่ได้รับเงิน' },
          { dot: 'bg-red-500', text: 'น่าเป็นห่วง — เช็กอิน < 50%' },
        ].map(({ dot, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {text}
          </div>
        ))}
      </div>

      {/* ── Session Detail Modal ───────────────────────── */}
      {selectedTutor && (
        <SessionDetailModal
          tutor={selectedTutor}
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          startDate={startDate}
          endDate={endDate}
          onClose={() => { setSelectedTutor(null); setSessions([]); }}
        />
      )}

      {/* ── Batch Payment Modal ────────────────────────── */}
      {showBatchPayment && (
        <BatchPaymentModal
          tutors={tutors}
          onClose={() => setShowBatchPayment(false)}
          onSuccess={(result) => {
            setShowBatchPayment(false);
            fetchData(selectedMonth);
            alert(`บันทึกสำเร็จ! จ่าย ${result.SessionCount} คาบ รวม ฿${result.TotalAmount.toLocaleString()}`);
          }}
        />
      )}
    </div>
  );
}

// ── Batch Payment Modal ───────────────────────────────────────
function BatchPaymentModal({ tutors, onClose, onSuccess }) {
  // step: 'select-tutor' | 'select-sessions' | 'confirm'
  const [step, setStep] = useState('select-tutor');
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [billNo, setBillNo] = useState('');
  const [remark, setRemark] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ติวเตอร์ที่มียอดค้าง
  const unpaidTutors = tutors.filter(t => (t.UnpaidCheckin ?? 0) > 0);

  // โหลด session ที่ค้างจ่ายของติวเตอร์ที่เลือก
  const loadSessions = async (tutor) => {
    setSessionsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/tutors/${tutor.AdminId}/unpaid-sessions`);
      const d = await r.json();
      setSessions(d);
      setCheckedIds(new Set(d.map(s => s.TutorCheckinId))); // tick ทั้งหมดเป็น default
    } catch (err) {
      setError('โหลด session ไม่สำเร็จ');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSelectTutor = async (tutor) => {
    setSelectedTutor(tutor);
    setStep('select-sessions');
    await loadSessions(tutor);
  };

  const toggleAll = () => {
    if (checkedIds.size === sessions.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(sessions.map(s => s.TutorCheckinId)));
    }
  };

  const toggleOne = (id) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSlipChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  // คำนวณยอดรวมจาก session ที่ tick
  const selectedSessions = sessions.filter(s => checkedIds.has(s.TutorCheckinId));
  const totalAmount = selectedSessions.reduce((sum, s) => {
    return sum + (s.RatePerTutors * s.PlannedMinutes / 60);
  }, 0);

  const handleSubmit = async () => {
    if (!checkedIds.size) return setError('กรุณาเลือก session อย่างน้อย 1 รายการ');
    if (!paymentDate) return setError('กรุณาระบุวันที่จ่ายเงิน');

    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('adminId', selectedTutor.AdminId);
      formData.append('checkinIds', JSON.stringify([...checkedIds]));
      formData.append('paymentDate', paymentDate);
      formData.append('billNo', billNo);
      formData.append('remark', remark);
      if (slipFile) formData.append('slip', slipFile);

      const r = await fetch(`${API_BASE}/tutor-payments`, {
        method: 'POST',
        body: formData,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      onSuccess(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  // ── Step indicators ───────────────────────────────────────
  const STEPS = ['เลือกติวเตอร์', 'เลือก session', 'ยืนยันการจ่าย'];
  const stepIdx = { 'select-tutor': 0, 'select-sessions': 1, 'confirm': 2 };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">จ่ายเงินติวเตอร์</h3>
                {selectedTutor && (
                  <p className="text-white/70 text-xs">{selectedTutor.Nickname} · {selectedTutor.Firstname} {selectedTutor.Lastname}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step bar */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => {
              const current = stepIdx[step];
              const done = i < current;
              const active = i === current;
              return (
                <React.Fragment key={label}>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition
                      ${active ? 'bg-white text-blue-700' : done ? 'bg-white/30 text-white' : 'bg-white/10 text-white/50'}`}>
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black
                        ${active ? 'bg-blue-600 text-white' : done ? 'bg-white/60 text-blue-700' : 'bg-white/20 text-white/50'}`}>
                      {done ? '✓' : i + 1}
                    </span>
                    {label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px ${done ? 'bg-white/50' : 'bg-white/20'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Content ────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1">

          {/* Step 1: เลือกติวเตอร์ */}
          {step === 'select-tutor' && (
            <div className="p-4 space-y-2">
              {unpaidTutors.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">ไม่มียอดค้างจ่าย</p>
                </div>
              ) : unpaidTutors.map((t, idx) => {
                const av = avatarCls(idx);
                const est = (t.UnpaidCheckin ?? 0) * (t.RatePerHour || 300);
                return (
                  <button
                    key={t.AdminId}
                    onClick={() => handleSelectTutor(t)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${av.bg} ${av.color}`}>
                      {t.Nickname?.slice(0, 2) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{t.Nickname}</p>
                      <p className="text-xs text-slate-400">{t.Firstname} {t.Lastname}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-amber-600">{t.UnpaidCheckin} คาบ</p>
                      <p className="text-xs text-slate-400">~฿{est.toLocaleString()}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 group-hover:text-blue-400 transition shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: เลือก session */}
          {step === 'select-sessions' && (
            <div>
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm">กำลังโหลด...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Select all bar */}
                  <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checkedIds.size === sessions.length && sessions.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded accent-blue-600"
                      />
                      <span className="text-sm font-semibold text-slate-700">
                        เลือกทั้งหมด ({sessions.length} คาบ)
                      </span>
                    </label>
                    <span className="text-xs text-slate-500">
                      เลือกแล้ว <span className="font-bold text-blue-600">{checkedIds.size}</span> คาบ
                    </span>
                  </div>

                  {/* Session list */}
                  <div className="divide-y divide-slate-100">
                    {sessions.map(s => {
                      const checked = checkedIds.has(s.TutorCheckinId);
                      const amount = s.RatePerTutors * s.PlannedMinutes / 60;
                      const hrs = (s.PlannedMinutes / 60).toFixed(1);
                      return (
                        <label
                          key={s.TutorCheckinId}
                          className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition
                              ${checked ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(s.TutorCheckinId)}
                            className="w-4 h-4 rounded accent-blue-600 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              {s.SubjectName || s.CourseName}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatDate(s.ClassDate)} · {s.StartTime}–{s.EndTime} · {hrs} ชม.
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-800">฿{amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                            <p className="text-[10px] text-slate-400">{s.PlannedMinutes} นาที</p>
                          </div>
                          {/* Photo indicator */}
                          <div className="shrink-0 w-6 flex items-center justify-center">
                            {s.PhotoStart && s.PhotoEnd
                              ? <span title="มีรูปครบ" className="text-emerald-500 text-sm">✓</span>
                              : <span title="รูปไม่ครบ" className="text-amber-400 text-sm">⚠</span>
                            }
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Total bar */}
                  <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-medium">ยอดรวม {checkedIds.size} คาบ</span>
                    <span className="text-xl font-black text-blue-700">
                      ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: ยืนยัน + กรอกข้อมูล */}
          {step === 'confirm' && (
            <div className="p-5 space-y-5">

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-semibold">ยอดที่จะจ่าย ({checkedIds.size} คาบ)</p>
                  <p className="text-2xl font-black text-blue-800 mt-0.5">
                    ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{selectedTutor?.Nickname}</p>
                  <p className="text-xs text-slate-400">{selectedTutor?.Firstname} {selectedTutor?.Lastname}</p>
                </div>
              </div>

              {/* Session summary list */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">
                  รายการที่เลือก
                </div>
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {selectedSessions.map(s => (
                    <div key={s.TutorCheckinId} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-xs font-medium text-slate-800">{s.SubjectName || s.CourseName}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(s.ClassDate)} · {(s.PlannedMinutes / 60).toFixed(1)} ชม.</p>
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        ฿{(s.RatePerTutors * s.PlannedMinutes / 60).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                    วันที่จ่ายเงิน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date" value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">เลขที่บิล / อ้างอิง</label>
                  <input
                    type="text" value={billNo} onChange={e => setBillNo(e.target.value)}
                    placeholder="เช่น PAY-20250430-001"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">หมายเหตุ</label>
                  <textarea
                    value={remark} onChange={e => setRemark(e.target.value)}
                    placeholder="บันทึกเพิ่มเติม..."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                  />
                </div>

                {/* Slip upload */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">แนบสลิปการโอน</label>
                  {slipPreview ? (
                    <div className="relative">
                      <img src={slipPreview} alt="slip" className="w-full h-40 object-cover rounded-xl border border-slate-200" />
                      <button
                        onClick={() => { setSlipFile(null); setSlipPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-md">
                        {slipFile?.name}
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition">
                      <Camera className="w-6 h-6 text-slate-400" />
                      <span className="text-xs text-slate-400">คลิกหรือลาก/วางไฟล์สลิปที่นี่</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSlipChange} />
                    </label>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Buttons ──────────────────────────────── */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <button
            onClick={() => {
              if (step === 'select-tutor') onClose();
              if (step === 'select-sessions') { setStep('select-tutor'); setSelectedTutor(null); }
              if (step === 'confirm') setStep('select-sessions');
            }}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            {step === 'select-tutor' ? 'ยกเลิก' : '← ย้อนกลับ'}
          </button>

          {step === 'select-sessions' && (
            <button
              disabled={checkedIds.size === 0 || sessionsLoading}
              onClick={() => setStep('confirm')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold shadow-sm transition text-sm"
            >
              ถัดไป → ยืนยันการจ่าย
            </button>
          )}

          {step === 'confirm' && (
            <button
              disabled={submitting || checkedIds.size === 0}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold shadow-sm transition text-sm"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังบันทึก...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> บันทึกการจ่ายเงิน</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Absence Heatmap (แยกตามสัปดาห์) ─────────────────────────
// ── constants ─────────────────────────────────────────────────
const DAY_LABELS = { 2: 'จ', 3: 'อ', 4: 'พ', 5: 'พฤ', 6: 'ศ', 7: 'ส', 1: 'อา' };
const DAY_FULL = { 2: 'จันทร์', 3: 'อังคาร', 4: 'พุธ', 5: 'พฤหัส', 6: 'ศุกร์', 7: 'เสาร์', 1: 'อาทิตย์' };
const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1];

function cellColor(count) {
  if (!count) return null;
  if (count >= 8) return 'bg-red-500 text-white';
  if (count >= 5) return 'bg-orange-400 text-white';
  if (count >= 3) return 'bg-amber-300 text-amber-900';
  return 'bg-amber-100 text-amber-700';
}

function shortDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

// ── Tooltip ───────────────────────────────────────────────────
function HeatmapTooltip({ tooltip }) {
  if (!tooltip) return null;
  const OFFSET_X = 14, OFFSET_Y = -70, W = 180;
  const left = tooltip.x + OFFSET_X + W > window.innerWidth
    ? tooltip.x - W - OFFSET_X : tooltip.x + OFFSET_X;
  const top = Math.max(8, tooltip.y + OFFSET_Y);
  return (
    <div className="fixed z-50 pointer-events-none" style={{ left, top }}>
      <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl w-[180px]">
        <p className="font-bold text-sm">{tooltip.nickname}</p>
        <p className="text-slate-300 text-[11px] mt-0.5">{tooltip.weekLabel}</p>
        <p className="text-slate-300 text-[11px]">{tooltip.dateRange}</p>
        <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between gap-2">
          <span className="text-slate-400">วัน{tooltip.dayLabel}</span>
          <span className={`font-black text-sm ${tooltip.count >= 8 ? 'text-red-400' :
              tooltip.count >= 5 ? 'text-orange-400' :
                tooltip.count >= 3 ? 'text-amber-400' : 'text-yellow-300'
            }`}>ขาด {tooltip.count} ครั้ง</span>
        </div>
        <p className="text-slate-500 text-[10px] mt-1.5">คลิกเพื่อดูรายละเอียด</p>
      </div>
    </div>
  );
}

// ── Drill Down Modal ──────────────────────────────────────────
function DrillDownModal({ info, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `${API_BASE}/tutors/missed-session-detail?adminId=${info.adminId}&weekStart=${info.weekStart}&weekEnd=${info.weekEnd}&dayOfWeek=${info.dayOfWeek}`
        );
        const d = await r.json();
        setSessions(Array.isArray(d) ? d : []);
      } catch { setSessions([]); }
      finally { setLoading(false); }
    };
    load();
  }, [info]);

  const formatDate = (ds) => ds
    ? new Date(ds).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-between shrink-0">
          <div>
            <p className="text-white font-bold">{info.nickname} · วัน{DAY_FULL[info.dayOfWeek]}</p>
            <p className="text-white/70 text-xs mt-0.5">
              {info.weekLabel} · {shortDate(info.weekStart)}–{shortDate(info.weekEnd)}
              · ขาด {info.count} ครั้ง
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <div className="w-7 h-7 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mr-3" />
              กำลังโหลด...
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <BookOpen className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">ไม่พบรายละเอียดคาบ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((s, i) => (
                <div key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">
                      {s.SubjectName || s.CourseName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.CourseName}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {s.StartTime}–{s.EndTime}
                      </span>
                      {s.RoomDetail && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          📍 {s.RoomDetail}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-slate-700">
                      {shortDate(s.ClassDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-right shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Heatmap Summary ───────────────────────────────────────────
function HeatmapSummary({ tutors, daySummary, weekSummary, weeks }) {
  const totalMissed = tutors.reduce((s, t) => s + t.totalMissed, 0);
  const worstTutor = tutors[0];
  const worstDayNum = DAY_ORDER.reduce((best, d) =>
    (daySummary[d] || 0) > (daySummary[best] || 0) ? d : best, DAY_ORDER[0]);
  const worstWeek = weeks.reduce((best, w) =>
    (weekSummary[w.YearWeek] || 0) > (weekSummary[best?.YearWeek] || 0) ? w : best, null);
  const cleanWeeks = weeks.filter(w => !weekSummary[w.YearWeek]);

  if (totalMissed === 0) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
      <CheckCircle className="w-10 h-10 text-emerald-500 shrink-0" />
      <div>
        <p className="font-bold text-emerald-800">เดือนนี้ไม่มีการขาดสอนเลย 🎉</p>
        <p className="text-sm text-emerald-600 mt-0.5">ติวเตอร์ทุกคนเช็กอินครบทุกคาบ</p>
      </div>
    </div>
  );

  const CARDS = [
    {
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-100',
      iconColor: 'text-red-500',
      label: 'ขาดรวมทั้งเดือน',
      value: `${totalMissed} ครั้ง`,
      sub: `จาก ${tutors.length} ติวเตอร์`,
    },
    {
      icon: Users,
      color: 'bg-orange-50 border-orange-100',
      iconColor: 'text-orange-500',
      label: 'ติวเตอร์ขาดบ่อยสุด',
      value: worstTutor?.Nickname || '—',
      sub: worstTutor ? `${worstTutor.totalMissed} ครั้ง` : '',
    },
    {
      icon: Clock,
      color: 'bg-amber-50 border-amber-100',
      iconColor: 'text-amber-500',
      label: 'วันที่ขาดบ่อยสุด',
      value: `วัน${DAY_FULL[worstDayNum]}`,
      sub: `รวม ${daySummary[worstDayNum]} ครั้ง`,
    },
    {
      icon: BookOpen,
      color: cleanWeeks.length > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100',
      iconColor: cleanWeeks.length > 0 ? 'text-emerald-500' : 'text-slate-400',
      label: 'สัปดาห์ไม่มีขาดเลย',
      value: `${cleanWeeks.length} สัปดาห์`,
      sub: cleanWeeks.length > 0
        ? cleanWeeks.map(w => `สัปดาห์ที่ ${w.weekIndex}`).join(', ')
        : 'ทุกสัปดาห์มีการขาด',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Insight bar */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-800 font-medium flex-1">
          <span className="font-black">สรุปเดือนนี้ —&nbsp;</span>
          วัน<span className="font-black text-red-600">{DAY_FULL[worstDayNum]}</span>มีการขาดสอนบ่อยที่สุด ({daySummary[worstDayNum]} ครั้ง)
          {worstTutor && <>, และ <span className="font-black text-red-600">{worstTutor.Nickname}</span> ขาดมากที่สุด {worstTutor.totalMissed} ครั้ง</>}
          {worstWeek && <>, ช่วงที่หนักสุดคือ<span className="font-black"> สัปดาห์ที่ {worstWeek.weekIndex}</span> ({shortDate(worstWeek.WeekStart)}–{shortDate(worstWeek.WeekEnd)})</>}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CARDS.map(({ icon: Icon, color, iconColor, label, value, sub }) => (
          <div key={label} className={`flex items-start gap-3 p-4 rounded-2xl border ${color}`}>
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-medium">{label}</p>
              <p className="text-base font-black text-slate-900 mt-0.5 truncate">{value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Day bar chart mini */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
        <p className="text-xs font-bold text-slate-500 mb-3">การขาดแยกตามวันในสัปดาห์</p>
        <div className="flex items-end gap-2 h-16">
          {DAY_ORDER.map(d => {
            const cnt = daySummary[d] || 0;
            const maxCnt = Math.max(...DAY_ORDER.map(x => daySummary[x] || 0), 1);
            const pct = Math.round((cnt / maxCnt) * 100);
            const isWorst = d === worstDayNum && cnt > 0;
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-600">{cnt > 0 ? cnt : ''}</span>
                <div className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(pct * 0.48, cnt > 0 ? 4 : 2)}px`,
                    background: isWorst ? '#ef4444' : cnt >= 3 ? '#fb923c' : cnt > 0 ? '#fcd34d' : '#f1f5f9',
                  }} />
                <span className={`text-[10px] font-semibold ${d === 1 ? 'text-red-400' : d === 7 ? 'text-blue-400' : 'text-slate-400'
                  }`}>{DAY_LABELS[d]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Absence Heatmap (main) ────────────────────────────────────
function AbsenceHeatmap({ selectedMonth }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [drillDown, setDrillDown] = useState(null); // { adminId, nickname, weekStart, weekEnd, weekLabel, dayOfWeek, count }

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setTooltip(null);
      try {
        const url = selectedMonth
          ? `${API_BASE}/tutors/absence-heatmap?startDate=${selectedMonth.start}&endDate=${selectedMonth.end}`
          : `${API_BASE}/tutors/absence-heatmap`;
        const r = await fetch(url);
        const d = await r.json();
        setData(d);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [selectedMonth]);

  const handleMouseEnter = (e, t, w, day, count) => {
    setTooltip({
      x: e.clientX, y: e.clientY,
      nickname: t.Nickname,
      weekLabel: `สัปดาห์ที่ ${w.weekIndex}`,
      dateRange: `${shortDate(w.WeekStart)} – ${shortDate(w.WeekEnd)}`,
      dayLabel: DAY_LABELS[day],
      count,
    });
  };
  const handleMouseMove = (e) => {
    if (tooltip) setTooltip(p => ({ ...p, x: e.clientX, y: e.clientY }));
  };

  const handleCellClick = (t, w, day, count) => {
    if (!count) return;
    setTooltip(null);
    setDrillDown({
      adminId: t.AdminId,
      nickname: t.Nickname,
      weekStart: w.WeekStart,
      weekEnd: w.WeekEnd,
      weekLabel: `สัปดาห์ที่ ${w.weekIndex}`,
      dayOfWeek: day,
      count,
    });
  };

  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex items-center justify-center">
      <div className="text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">กำลังโหลด Heatmap...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { weeks = [], tutors = [], daySummary = {}, weekSummary = {} } = data;

  return (
    <div className="space-y-4">

      {/* ── Summary ────────────────────────────────────── */}
      <HeatmapSummary
        tutors={tutors}
        daySummary={daySummary}
        weekSummary={weekSummary}
        weeks={weeks}
      />

      {/* ── Heatmap Table ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Heatmap การขาดสอนรายสัปดาห์</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              คลิกที่ช่องเพื่อดูรายละเอียดคาบที่ขาด
              {selectedMonth ? ` · ${selectedMonth.label}` : ' · ทุกช่วงเวลา'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 shrink-0">
            <span>น้อย</span>
            {['bg-amber-100', 'bg-amber-300', 'bg-orange-400', 'bg-red-500'].map(c => (
              <span key={c} className={`w-4 h-4 rounded ${c} inline-block border border-white`} />
            ))}
            <span>มาก</span>
          </div>
        </div>

        {weeks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <BookOpen className="w-10 h-10 opacity-30" />
            <p className="text-sm">ไม่มีข้อมูลการสอนในช่วงนี้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse w-full">
              <thead>
                {/* Row 1: สัปดาห์ */}
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-2 text-left text-xs font-semibold text-slate-500 bg-slate-50 w-36 sticky left-0 z-10 border-r border-slate-200">
                    ติวเตอร์
                  </th>
                  {weeks.map(w => {
                    const wTotal = weekSummary[w.YearWeek] || 0;
                    return (
                      <th key={w.YearWeek} colSpan={7}
                        className="text-center px-2 py-2 bg-slate-50 border-l border-slate-200">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
                            สัปดาห์ที่ {w.weekIndex}
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {shortDate(w.WeekStart)}–{shortDate(w.WeekEnd)}
                          </span>
                          {wTotal > 0 ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${cellColor(wTotal)}`}>
                              {wTotal} ครั้ง
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600">
                              ✓ ไม่มีขาด
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-50 border-l border-slate-200 whitespace-nowrap">
                    รวม
                  </th>
                </tr>

                {/* Row 2: วัน จ-อา */}
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-5 py-1.5 sticky left-0 z-10 bg-slate-50 border-r border-slate-200" />
                  {weeks.map(w =>
                    DAY_ORDER.map(day => (
                      <th key={`${w.YearWeek}-${day}`}
                        className={`text-center px-1 py-1.5 text-[10px] font-semibold w-8
                          ${day === 1 ? 'text-red-400' : day === 7 ? 'text-blue-400' : 'text-slate-400'}
                          ${day === DAY_ORDER[0] ? 'border-l border-slate-200' : ''}`}>
                        {DAY_LABELS[day]}
                      </th>
                    ))
                  )}
                  <th className="border-l border-slate-200" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {tutors.length === 0 ? (
                  <tr>
                    <td colSpan={weeks.length * 7 + 2}
                      className="text-center py-10 text-slate-400 text-sm">
                      ไม่มีการขาดสอนในช่วงนี้ 🎉
                    </td>
                  </tr>
                ) : tutors.map((t, idx) => {
                  const av = avatarCls(idx);
                  return (
                    <tr key={t.AdminId} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-white border-r border-slate-100 z-10">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${av.bg} ${av.color}`}>
                            {t.Nickname?.slice(0, 2) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{t.Nickname}</p>
                            <p className="text-[10px] text-slate-400 truncate">{t.Firstname}</p>
                          </div>
                        </div>
                      </td>

                      {weeks.map(w =>
                        DAY_ORDER.map(day => {
                          const count = t.weeks[w.YearWeek]?.[day] ?? 0;
                          const color = cellColor(count);
                          return (
                            <td key={`${w.YearWeek}-${day}`}
                              className={`text-center px-1 py-3 ${day === DAY_ORDER[0] ? 'border-l border-slate-100' : ''}`}>
                              {count > 0 ? (
                                <div
                                  className={`mx-auto w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black cursor-pointer transition hover:scale-110 hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 ${color}`}
                                  onMouseEnter={e => handleMouseEnter(e, t, w, day, count)}
                                  onMouseMove={handleMouseMove}
                                  onMouseLeave={() => setTooltip(null)}
                                  onClick={() => handleCellClick(t, w, day, count)}
                                >
                                  {count}
                                </div>
                              ) : (
                                <div className="mx-auto w-7 h-7 rounded-lg flex items-center justify-center">
                                  <span className="text-slate-100 text-xs">·</span>
                                </div>
                              )}
                            </td>
                          );
                        })
                      )}

                      <td className="px-3 py-3 text-center border-l border-slate-100">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black
                          ${t.totalMissed >= 5 ? 'bg-red-100 text-red-700' :
                            t.totalMissed >= 3 ? 'bg-orange-100 text-orange-700' :
                              t.totalMissed >= 1 ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-400'}`}>
                          {t.totalMissed || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-5 py-2.5 text-xs font-bold text-slate-600 sticky left-0 bg-slate-50 border-r border-slate-200">
                    รวมทุกคน
                  </td>
                  {weeks.map(w =>
                    DAY_ORDER.map(day => {
                      const total = tutors.reduce((s, t) => s + (t.weeks[w.YearWeek]?.[day] ?? 0), 0);
                      return (
                        <td key={`foot-${w.YearWeek}-${day}`}
                          className={`text-center px-1 py-2.5 ${day === DAY_ORDER[0] ? 'border-l border-slate-200' : ''}`}>
                          {total > 0 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-black ${cellColor(total)}`}>
                              {total}
                            </span>
                          ) : (
                            <span className="text-slate-200 text-xs">·</span>
                          )}
                        </td>
                      );
                    })
                  )}
                  <td className="px-3 py-2.5 text-center border-l border-slate-200">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 text-slate-700 text-xs font-black">
                      {tutors.reduce((s, t) => s + t.totalMissed, 0) || '—'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Footer note */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {[
              { dot: 'bg-amber-100 border border-amber-200', text: '1–2 ครั้ง' },
              { dot: 'bg-amber-300', text: '3–4 ครั้ง' },
              { dot: 'bg-orange-400', text: '5–7 ครั้ง' },
              { dot: 'bg-red-500', text: '8+ ครั้ง' },
            ].map(({ dot, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className={`w-3 h-3 rounded ${dot} inline-block`} />
                {text}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-slate-400">* คลิกที่ช่องสีเพื่อดูรายละเอียดคาบ</span>
        </div>
      </div>

      {/* Tooltip */}
      <HeatmapTooltip tooltip={tooltip} />

      {/* Drill Down Modal */}
      {drillDown && (
        <DrillDownModal
          info={drillDown}
          onClose={() => setDrillDown(null)}
        />
      )}
    </div>
  );
}

