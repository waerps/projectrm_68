import { API_URL } from "../config";
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Clock, Calendar,
  Download, Search, Check, AlertCircle, FileText,
  BarChart3, Eye, RefreshCw, BookOpen, ChevronDown,
  ChevronLeft, ChevronRight,
  Wallet, Hourglass, CheckCircle2, Trophy, Coins, Users, CalendarDays, CalendarCheck, Receipt,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ComposedChart, Line, Bar, Cell, LabelList, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';

// ─── อัตราค่าสอน (แสดงในตาราง) ─────────────────────────────
const RATE_TABLE = {
  elementary: [
    { label: '1-4 คน', rate: 180 },
    { label: '5-10 คน', rate: 210 },
    { label: '11-15 คน', rate: 240 },
    { label: '16-20 คน', rate: 270 },
    { label: '21+ คน', rate: 300 },
  ],
  secondary: [
    { label: '1-4 คน', rate: 210 },
    { label: '5-10 คน', rate: 240 },
    { label: '11-15 คน', rate: 270 },
    { label: '16-20 คน', rate: 300 },
    { label: '21+ คน', rate: 330 },
  ],
};

const API_BASE = `${API_URL}/api/tutor`;

// ─── Pagination Hook ─────────────────────────────────────────
function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);

  // reset เมื่อ items เปลี่ยน (search/filter)
  useEffect(() => { setPage(1); }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return { paged, page: safePage, totalPages, setPage, total: items.length };
}

// ─── Pagination Component ────────────────────────────────────
function Pagination({ page, totalPages, total, pageSize, setPage }) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // สร้างเลขหน้าที่แสดง (ไม่เกิน 5 ปุ่ม)
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
      {/* แสดงจำนวน */}
      <p className="text-xs text-neutral-500 order-2 sm:order-1">
        แสดง <span className="font-semibold text-neutral-700">{start}–{end}</span> จาก{' '}
        <span className="font-semibold text-neutral-700">{total}</span> รายการ
      </p>

      {/* ปุ่มเลขหน้า */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* ก่อนหน้า */}
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm border border-neutral-200 text-neutral-600 hover:bg-white hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {getPageNumbers().map(n => (
          <button
            key={n}
            onClick={() => setPage(n)}
            className={`w-8 h-8 rounded-lg text-sm font-medium border transition ${
              n === page
                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                : 'border-neutral-200 text-neutral-600 hover:bg-white hover:border-orange-300'
            }`}
          >
            {n}
          </button>
        ))}

        {/* ถัดไป */}
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm border border-neutral-200 text-neutral-600 hover:bg-white hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Fetch hook ──────────────────────────────────────────────
function useTutorIncome(adminId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // (แก้บั๊ก) เดิมไม่แนบ token เลย ตอนนี้ backend ต้อง login ก่อนแล้ว
      const token = localStorage.getItem("student_token");
      const res = await fetch(`${API_BASE}/income/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}

// ─── Status config ──────────────────────────────────────────
const statusConfig = {
  paid: { label: 'รับครบแล้ว', bg: 'bg-green-50 text-green-700 border-green-200', icon: <Check className="h-3 w-3" /> },
  pending: { label: 'ยังไม่ได้รับ', bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: <Clock className="h-3 w-3" /> },
  partial: { label: 'รับบางส่วน', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: <AlertCircle className="h-3 w-3" /> },
};

function getCourseStatus(course) {
  if (course.pendingEarned === 0 && course.paidEarned > 0) return 'paid';
  if (course.paidEarned === 0) return 'pending';
  return 'partial';
}

function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: '2-digit', ...opts,
  });
}

const CustomXTick = ({ x, y, payload, index, monthly }) => {
  const item = monthly?.[index];
  const showYear = item && (item.month === 'ม.ค.' || index === 0);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#6b7280" fontSize={11}>
        {payload.value}
      </text>
      {showYear && (
        <text x={0} y={0} dy={24} textAnchor="middle" fill="#9ca3af" fontSize={10}>
          {item.year}
        </text>
      )}
    </g>
  );
};

// ─── ชิ้นส่วน UI หน้ารายรับ (ดีไซน์ใหม่ — ตรรกะ/ข้อมูลเหมือนเดิมทั้งหมด) ────────────
const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};
const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const LEVEL_BADGE = {
  elementary: 'bg-blue-50 text-blue-700 border-blue-200',
  secondary: 'bg-purple-50 text-purple-700 border-purple-200',
};
const tierIndexOf = (n) => (n <= 4 ? 0 : n <= 10 ? 1 : n <= 15 ? 2 : n <= 20 ? 3 : 4);

// ตัวเลขเงินนับขึ้นตอนแสดงครั้งแรก
function MoneyCountUp({ value }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!value || prefersReducedMotion()) { setShown(value); return undefined; }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1100);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (shown ?? 0).toLocaleString();
}

// กราฟเส้นจิ๋ว 6 เดือนล่าสุดในการ์ดสรุปด้านบน
function IncomeSparkline({ months }) {
  const W = 300, H = 90;
  if (!months.length) return null;
  const max = Math.max(1, ...months.map((m) => m.total));
  const pts = months.map((m, i) => [10 + i * ((W - 20) / Math.max(1, months.length - 1)), H - 12 - (m.total / max) * (H - 26)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full mt-2" aria-hidden="true">
      <defs>
        <linearGradient id="incSpark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fb923c" stopOpacity=".3" /><stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </linearGradient>
      </defs>
      {pts.length > 1 && <path d={`${d} L${pts[last][0]},${H} L${pts[0][0]},${H} Z`} fill="url(#incSpark)" />}
      <path d={d} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="sa-draw" style={{ '--len': 600 }} />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={i === last ? 5 : 3} fill={i === last ? '#f97316' : '#fff'} stroke="#f97316" strokeWidth="1.8">
            <title>{`${months[i].month} ${months[i].year}: ${months[i].total.toLocaleString()} บาท`}</title>
          </circle>
          <text x={p[0]} y={H + 14} textAnchor="middle" fontSize="10" fill={i === last ? '#ea580c' : '#a3a3a3'} fontWeight={i === last ? 700 : 400}>{months[i].month}</text>
        </g>
      ))}
    </svg>
  );
}

// ปฏิทินการสอน 26 สัปดาห์ล่าสุด — 1 ช่อง = 1 วัน ยิ่งเข้มยิ่งได้รายรับมาก
function TeachingHeatmap({ sessions }) {
  const { cols, byDay, maxDay, end } = useMemo(() => {
    const endDate = new Date(); endDate.setHours(0, 0, 0, 0);
    const first = new Date(endDate); first.setDate(endDate.getDate() - 7 * 26 + 1);
    while (first.getDay() !== 0) first.setDate(first.getDate() - 1);
    const map = new Map();
    sessions.forEach((s) => {
      const d = new Date(s.sessionDate); d.setHours(0, 0, 0, 0);
      map.set(d.toDateString(), (map.get(d.toDateString()) || 0) + s.earnedAmount);
    });
    const out = []; const cur = new Date(first);
    while (cur <= endDate) {
      const col = [];
      for (let i = 0; i < 7; i += 1) { col.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
      out.push(col);
    }
    return { cols: out, byDay: map, maxDay: Math.max(1, ...map.values()), end: endDate };
  }, [sessions]);
  const tone = (v) => (!v ? 'bg-neutral-100' : v / maxDay > 0.66 ? 'bg-orange-600' : v / maxDay > 0.33 ? 'bg-orange-400' : 'bg-orange-200');
  return (
    <div className="sa-rise bg-white rounded-2xl border-2 border-neutral-200 p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-orange-600" /> ปฏิทินการสอน 6 เดือน</h2>
          <p className="text-xs text-neutral-500 mt-0.5">1 ช่อง = 1 วัน · สีเข้ม = วันที่ได้รายรับมาก · ชี้เพื่อดูยอด</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-neutral-400">
          น้อย {['bg-neutral-100', 'bg-orange-200', 'bg-orange-400', 'bg-orange-600'].map((c) => <span key={c} className={`h-3.5 w-3.5 rounded ${c}`} />)} มาก
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 min-w-max">
          <div className="flex flex-col gap-1 pr-1 text-[10px] text-neutral-400">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => <span key={d} className="h-[18px] leading-[18px]">{d}</span>)}
          </div>
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((d) => {
                const v = byDay.get(d.toDateString()) || 0;
                return (
                  <span key={d.toISOString()}
                    className={`h-[18px] w-[18px] rounded-[5px] transition ${d > end ? 'opacity-0' : `${tone(v)} hover:ring-2 hover:ring-neutral-800`}`}
                    title={`${d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })}${v ? ` · ${v.toLocaleString()} บาท` : ' · ไม่มีคลาส'}`} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page Size Options ───────────────────────────────────────
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// ─── Component ───────────────────────────────────────────────
export default function TutorIncome() {
  const ADMIN_ID = JSON.parse(localStorage.getItem("user"))?.id;  // ✅ เพิ่มตรงนี้
  const [viewMode, setViewMode] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  // page size แยกกันต่อ tab
  const [coursePageSize, setCoursePageSize] = useState(10);
  const [sessionPageSize, setSessionPageSize] = useState(10);

  // history filters
  const [historyYear, setHistoryYear] = useState('all');
  const [historyMonth, setHistoryMonth] = useState('all');

  // slip modal
  const [slipUrl, setSlipUrl] = useState(null);

  const { data, loading, error, refetch } = useTutorIncome(ADMIN_ID);

  // ── Export Excel ─────────────────────────────────────────────
  const downloadExcel = (sessions, courses, summary, admin) => {
    const wb = XLSX.utils.book_new();
    const courseData = courses.map(c => ({
      'ชื่อคอร์ส': c.courseName,
      'ระดับ': c.levelType === 'elementary' ? 'ประถม' : 'มัธยม',
      'จำนวนคลาส': c.sessions,
      'รายได้รวม (บาท)': c.totalEarned,
      'รับแล้ว (บาท)': c.paidEarned,
      'ค้างรับ (บาท)': c.pendingEarned,
      'สอนล่าสุด': formatDate(c.lastSession),
      'สถานะ': getCourseStatus(c) === 'paid' ? 'รับครบแล้ว' : getCourseStatus(c) === 'pending' ? 'ยังไม่ได้รับ' : 'รับบางส่วน',
    }));
    const wsCourse = XLSX.utils.json_to_sheet(courseData);
    wsCourse['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsCourse, 'สรุปรายคอร์ส');

    const sessionData = sessions.map(s => ({
      'วันที่สอน': formatDate(s.sessionDate),
      'คอร์ส': s.courseName,
      'วิชา': s.subjectName || '-',
      'ระดับ': s.levelType === 'elementary' ? 'ประถม' : 'มัธยม',
      'นักเรียนจริง (คน)': s.actualStudents,
      'ชั่วโมง': Number(s.durationHours).toFixed(1),
      'Rate/คลาส (บาท)': s.ratePerSession,
      'รายได้ (บาท)': s.earnedAmount,
      'สถานะ': s.isPaid ? 'รับแล้ว' : 'ค้างรับ',
    }));
    const wsSession = XLSX.utils.json_to_sheet(sessionData);
    wsSession['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsSession, 'รายละเอียดแต่ละคลาส');

    const summaryData = [
      { 'หัวข้อ': 'รายรับเดือนนี้', 'จำนวน (บาท)': summary.thisMonthEarned },
      { 'หัวข้อ': 'รายรับเดือนก่อน', 'จำนวน (บาท)': summary.lastMonthEarned },
      { 'หัวข้อ': 'รายรับสะสมทั้งหมด', 'จำนวน (บาท)': summary.totalEarned },
      { 'หัวข้อ': 'รับแล้ว', 'จำนวน (บาท)': summary.totalPaid },
      { 'หัวข้อ': 'ค้างรับ', 'จำนวน (บาท)': summary.totalPending },
      { 'หัวข้อ': 'คลาสทั้งหมด', 'จำนวน (บาท)': summary.totalSessions },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 24 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปยอดรวม');

    const tutorName = admin?.nickname || 'tutor';
    XLSX.writeFile(wb, `รายรับ_${tutorName}_${new Date().toLocaleDateString('th-TH')}.xlsx`);
  };

  // ── Export PDF ───────────────────────────────────────────────
  const downloadPDF = (sessions, courses, summary, admin) => {
    const printWindow = window.open('', '_blank');
    const tutorName = admin?.nickname || 'ติวเตอร์';
    const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

    const courseRows = courses.map(c => {
      const status = getCourseStatus(c);
      const statusLabel = status === 'paid' ? 'รับครบแล้ว' : status === 'pending' ? 'ยังไม่ได้รับ' : 'รับบางส่วน';
      const statusColor = status === 'paid' ? 'color:#16a34a' : status === 'pending' ? 'color:#ea580c' : 'color:#2563eb';
      return `
        <tr>
          <td>${c.courseName}</td>
          <td style="text-align:center">${c.levelType === 'elementary' ? 'ประถม' : 'มัธยม'}</td>
          <td style="text-align:center">${c.sessions}</td>
          <td style="text-align:right">${c.totalEarned.toLocaleString()}</td>
          <td style="text-align:right;color:#16a34a">${c.paidEarned.toLocaleString()}</td>
          <td style="text-align:right;color:#ea580c">${c.pendingEarned.toLocaleString()}</td>
          <td style="text-align:center;${statusColor}">${statusLabel}</td>
        </tr>`;
    }).join('');

    const sessionRows = sessions.map(s => `
      <tr>
        <td>${formatDate(s.sessionDate)}</td>
        <td>${s.courseName}${s.subjectName ? ` (${s.subjectName})` : ''}</td>
        <td style="text-align:center">${s.levelType === 'elementary' ? 'ประถม' : 'มัธยม'}</td>
        <td style="text-align:center">${s.actualStudents} คน</td>
        <td style="text-align:center">${Number(s.durationHours).toFixed(1)} ชม.</td>
        <td style="text-align:right">${s.earnedAmount.toLocaleString()}</td>
        <td style="text-align:center;color:${s.isPaid ? '#16a34a' : '#ea580c'}">${s.isPaid ? 'รับแล้ว' : 'ค้างรับ'}</td>
      </tr>`).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายรับ - ${tutorName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
      <style>* { box-sizing:border-box;margin:0;padding:0; } body{font-family:'Sarabun',sans-serif;padding:32px;font-size:13px;color:#1f2937;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #f97316;padding-bottom:16px;}
      .header h1{font-size:22px;font-weight:700;color:#f97316;} .header p{font-size:12px;color:#6b7280;margin-top:4px;} .header-right{text-align:right;}
      .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;}
      .summary-card{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;}
      .summary-card .label{font-size:11px;color:#9a3412;margin-bottom:4px;} .summary-card .value{font-size:18px;font-weight:700;color:#ea580c;}
      h2{font-size:15px;font-weight:700;color:#1f2937;margin-bottom:10px;margin-top:24px;padding-left:10px;border-left:3px solid #f97316;}
      table{width:100%;border-collapse:collapse;margin-bottom:8px;} th{background:#f97316;color:white;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;}
      td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;} tr:nth-child(even) td{background:#fff7ed;}
      tfoot td{background:#fef3c7;font-weight:700;border-top:2px solid #f97316;}
      .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;}
      @media print{body{padding:16px;}}</style></head><body>
      <div class="header"><div><h1>รายงานรายรับ</h1><p>ติวเตอร์: ${tutorName} &nbsp;|&nbsp; วันที่ออกรายงาน: ${today}</p></div>
      <div class="header-right"><p style="font-size:11px;color:#6b7280">คลาสทั้งหมด</p><p style="font-size:20px;font-weight:700;color:#1f2937">${summary.totalSessions} คลาส</p></div></div>
      <div class="summary-grid">
        <div class="summary-card"><div class="label">รายรับสะสมทั้งหมด</div><div class="value">${summary.totalEarned.toLocaleString()} บ.</div></div>
        <div class="summary-card" style="background:#f0fdf4;border-color:#bbf7d0"><div class="label" style="color:#14532d">รับแล้ว</div><div class="value" style="color:#16a34a">${summary.totalPaid.toLocaleString()} บ.</div></div>
        <div class="summary-card"><div class="label">ค้างรับ</div><div class="value">${summary.totalPending.toLocaleString()} บ.</div></div>
      </div>
      <h2>สรุปรายคอร์ส</h2>
      <table><thead><tr><th>ชื่อคอร์ส</th><th style="text-align:center">ระดับ</th><th style="text-align:center">คลาส</th>
      <th style="text-align:right">รายได้รวม</th><th style="text-align:right">รับแล้ว</th><th style="text-align:right">ค้างรับ</th><th style="text-align:center">สถานะ</th></tr></thead>
      <tbody>${courseRows}</tbody>
      <tfoot><tr><td colspan="3">รวมทั้งหมด</td><td style="text-align:right">${courses.reduce((s, c) => s + c.totalEarned, 0).toLocaleString()} บ.</td>
      <td style="text-align:right;color:#16a34a">${summary.totalPaid.toLocaleString()} บ.</td>
      <td style="text-align:right;color:#ea580c">${summary.totalPending.toLocaleString()} บ.</td><td></td></tr></tfoot></table>
      <h2>รายละเอียดแต่ละคลาส</h2>
      <table><thead><tr><th>วันที่สอน</th><th>คอร์ส / วิชา</th><th style="text-align:center">ระดับ</th>
      <th style="text-align:center">นักเรียน</th><th style="text-align:center">ชั่วโมง</th><th style="text-align:right">รายได้</th><th style="text-align:center">สถานะ</th></tr></thead>
      <tbody>${sessionRows}</tbody>
      <tfoot><tr><td colspan="5">รวม ${sessions.length} คลาส</td><td style="text-align:right">${sessions.reduce((s, x) => s + x.earnedAmount, 0).toLocaleString()} บ.</td><td></td></tr></tfoot></table>
      <div class="footer">ออกรายงานโดยระบบจัดการติวเตอร์ &nbsp;|&nbsp; ${today}</div>
      <script>window.onload = () => window.print();</script></body></html>`);
    printWindow.document.close();
  };

  // ── Derived data (ต้องอยู่ก่อน early return ทุกครั้ง) ──────────
  const courses = data?.courses ?? [];
  const sessions = data?.sessions ?? [];
  const monthly = data?.monthly ?? [];

  const filteredCourses = useMemo(() => courses.filter(c => {
    const status = getCourseStatus(c);
    const statusOk = filterStatus === 'all' || status === filterStatus;
    const searchOk = !searchQuery || c.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    return statusOk && searchOk;
  }), [courses, filterStatus, searchQuery]);

  const filteredSessions = useMemo(() => sessions.filter(s =>
    !searchQuery || s.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  ), [sessions, searchQuery]);

  // ── Pagination hooks (ต้องเรียกก่อน early return เสมอ) ─────────
  const coursePag = usePagination(filteredCourses, coursePageSize);
  const sessionPag = usePagination(filteredSessions, sessionPageSize);

  // ── Early returns ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-[90px]">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-neutral-500 text-sm">กำลังโหลดข้อมูลรายรับ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-[90px]">
        <div className="text-center space-y-4 bg-white border-2 border-red-200 rounded-2xl p-8 max-w-md">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-red-700 font-medium">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-neutral-500 text-sm">{error}</p>
          <button onClick={refetch} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const { summary, payments, admin } = data;

  const availableYears = [...new Set(monthly.map(m => m.year))].sort();
  const filteredMonthly = selectedYear === 'all'
    ? monthly
    : monthly.filter(m => m.year === Number(selectedYear));

  // ── ค่าที่ใช้แสดงผลเท่านั้น (ไม่เปลี่ยนตรรกะเดิม) ─────────────────
  const recentMonths = monthly.slice(-6);
  const totalHours = sessions.reduce((a, s) => a + Number(s.durationHours || 0), 0);
  const paidPct = summary.totalEarned > 0 ? Math.round((summary.totalPaid / summary.totalEarned) * 100) : 0;
  const avgPerSession = summary.totalSessions > 0 ? Math.round(summary.totalEarned / summary.totalSessions) : 0;
  const thisMonthSessions = monthly.length ? monthly[monthly.length - 1].sessions : 0;
  const elementaryTotal = sessions.filter(s => s.levelType === 'elementary').reduce((a, s) => a + s.earnedAmount, 0);
  const secondaryTotal = sessions.filter(s => s.levelType === 'secondary').reduce((a, s) => a + s.earnedAmount, 0);
  const bestMonth = filteredMonthly.reduce((b, m) => (!b || m.total > b.total ? m : b), null);
  const currentMonthKey = monthly.length ? `${monthly[monthly.length - 1].month}-${monthly[monthly.length - 1].year}` : null;
  const tierCounts = [0, 0, 0, 0, 0];
  sessions.forEach(s => { tierCounts[tierIndexOf(Number(s.actualStudents) || 0)] += 1; });
  const topTier = sessions.length ? tierCounts.indexOf(Math.max(...tierCounts)) : -1;
  const chartData = filteredMonthly.map(m => ({
    ...m,
    label: m.month,
    isCurrent: `${m.month}-${m.year}` === currentMonthKey,
    isBest: bestMonth && m === bestMonth && m.total > 0,
  }));

  const TABS = [
    { key: 'overview', label: 'ภาพรวม & กราฟ', icon: BarChart3 },
    { key: 'courses', label: 'รายคอร์ส', icon: BookOpen },
    { key: 'sessions', label: 'รายคลาส', icon: CalendarDays },
    { key: 'history', label: 'ประวัติรับเงิน', icon: Receipt },
  ];

  return (
    <div className="space-y-6 mt-[80px]">
      <div className="">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">รายรับของฉัน</h1>
              <p className="mt-1 text-sm text-neutral-500">ติดตามรายได้และประวัติการรับเงินของคุณ</p>
            </div>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition font-medium">
                <Download className="h-4 w-4" />
                ดาวน์โหลดรายงาน
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-neutral-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={() => downloadExcel(sessions, courses, summary, admin)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-600 rounded-t-xl transition font-medium">
                  📊 ดาวน์โหลด Excel
                </button>
                <button onClick={() => downloadPDF(sessions, courses, summary, admin)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-600 rounded-b-xl transition font-medium">
                  📄 ดาวน์โหลด PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── การ์ดสรุปด้านบน (โทนขาว) ───────────────────────────── */}
        <div className="sa-rise relative overflow-hidden bg-white rounded-2xl border-2 border-neutral-200 mb-6">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-orange-50" />
          <div className="absolute right-56 -bottom-24 h-48 w-48 rounded-full bg-amber-50/70" />
          <div className="relative grid lg:grid-cols-[1fr_20rem] gap-6 p-6">
            <div>
              <p className="text-sm font-medium text-neutral-600 flex items-center gap-2">
                <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-sm"><Wallet className="h-4 w-4" /></span>
                รายรับเดือนนี้
              </p>
              <div className="flex items-end gap-3 flex-wrap mt-3">
                <p className="tabular-nums text-4xl font-black leading-none text-neutral-900">
                  <MoneyCountUp value={summary.thisMonthEarned} />
                  <span className="text-lg font-semibold text-neutral-400 ml-2">บาท</span>
                </p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold mb-0.5 ${summary.growth >= 0 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {summary.growth >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {summary.growth >= 0 ? '+' : ''}{summary.growth}% จากเดือนก่อน
                </span>
              </div>
              <p className="text-sm text-neutral-500 mt-2">
                {thisMonthSessions} คลาส · เดือนก่อน {summary.lastMonthEarned.toLocaleString()} บาท
              </p>
              <div className="mt-5 max-w-xl">
                <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-600 font-bold">โอนแล้ว <span className="text-neutral-400 font-medium ml-1">(รายรับสะสม {summary.totalEarned.toLocaleString()} บาท)</span></span>
                    <span className="font-black text-orange-600">{paidPct}%</span>
                  </div>
                  <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden shadow-inner">
                    <div className="sa-grow h-full bg-gradient-to-r from-orange-400 to-orange-600" style={{ width: `${paidPct}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                    <span className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle2 className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-green-700">รับแล้ว</p>
                      <p className="tabular-nums text-lg font-black text-neutral-900 leading-tight">{summary.totalPaid.toLocaleString()} <span className="text-xs font-medium text-neutral-400">บาท</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
                    <span className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><Hourglass className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-orange-700">รอรับเงิน{summary.pendingSessionCount > 0 ? ` · ${summary.pendingSessionCount} คลาส` : ''}</p>
                      <p className="tabular-nums text-lg font-black text-neutral-900 leading-tight">{summary.totalPending.toLocaleString()} <span className="text-xs font-medium text-neutral-400">บาท</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/80 border border-orange-100 backdrop-blur-sm p-4 flex flex-col shadow-sm">
              <p className="text-xs font-semibold text-neutral-500">6 เดือนล่าสุด</p>
              <IncomeSparkline months={recentMonths} />
              <div className="mt-auto grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-neutral-50 border border-neutral-100 py-2">
                  <p className="tabular-nums text-lg font-black text-neutral-900">{summary.totalSessions}</p>
                  <p className="text-[10px] text-neutral-500">คลาสทั้งหมด</p>
                </div>
                <div className="rounded-xl bg-neutral-50 border border-neutral-100 py-2">
                  <p className="tabular-nums text-lg font-black text-neutral-900">{Number(totalHours.toFixed(1))}</p>
                  <p className="text-[10px] text-neutral-500">ชั่วโมงสอน</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden mb-6">
          <div className="flex border-b border-neutral-200 overflow-x-auto">
            {TABS.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setViewMode(tab.key)}
                  className={`flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition ${viewMode === tab.key ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                  <TabIcon className="h-4 w-4" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ Tab: Overview ══════════════════════════════════════ */}
        {viewMode === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">แสดงข้อมูลปี:</span>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setSelectedYear('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${selectedYear === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-neutral-600 border-neutral-200 hover:border-orange-300'}`}>
                  ทั้งหมด
                </button>
                {availableYears.map(year => (
                  <button key={year} onClick={() => setSelectedYear(year)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${selectedYear === year ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-neutral-600 border-neutral-200 hover:border-orange-300'}`}>
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_20rem] gap-4">
              {/* กราฟแท่งรายรับ + เส้นจำนวนคลาส */}
              <div className="sa-rise bg-white rounded-2xl border-2 border-neutral-200 p-6">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <h2 className="text-lg font-bold text-neutral-900">รายรับและจำนวนคลาสรายเดือน</h2>
                  <div className="flex gap-3 text-[11px] text-neutral-500">
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-orange-400" />รายรับ</span>
                    <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-neutral-800 rounded" />จำนวนคลาส</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incBar" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fed7aa" /><stop offset="1" stopColor="#fdba74" /></linearGradient>
                      <linearGradient id="incBarNow" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fbbf24" /><stop offset="1" stopColor="#ea580c" /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                    <XAxis dataKey="label" tick={(props) => <CustomXTick {...props} monthly={filteredMonthly} />} height={40} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="money" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#a3a3a3' }} tickLine={false} axisLine={false} width={40} />
                    <YAxis yAxisId="count" orientation="right" hide domain={[0, (max) => Math.max(1, max) * 1.6]} />
                    <Tooltip
                      cursor={{ fill: '#fff7ed' }}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', fontSize: 12 }}
                      formatter={(v, name) => (name === 'จำนวนคลาส' ? [`${v} คลาส`, name] : [`${Number(v).toLocaleString()} บาท`, name])}
                      labelFormatter={(l, p) => (p?.[0] ? `${p[0].payload.month} ${p[0].payload.year}` : l)}
                    />
                    <Bar yAxisId="money" dataKey="total" name="รายรับรวม" radius={[10, 10, 0, 0]} maxBarSize={56}>
                      {chartData.map((m, i) => <Cell key={i} fill={m.isCurrent ? 'url(#incBarNow)' : 'url(#incBar)'} />)}
                      <LabelList dataKey="total" position="top" formatter={v => (v ? `${(v / 1000).toFixed(1)}k` : '')} style={{ fontSize: 11, fontWeight: 700, fill: '#737373' }} />
                    </Bar>
                    <Line yAxisId="count" type="linear" dataKey="sessions" name="จำนวนคลาส" stroke="#262626" strokeWidth={2}
                      dot={{ r: 11, fill: '#171717', stroke: '#171717' }} activeDot={{ r: 12 }}>
                      <LabelList dataKey="sessions" position="center" style={{ fontSize: 10, fontWeight: 700, fill: '#fff' }} />
                    </Line>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* การ์ดข้าง */}
              <div className="space-y-4">
                <div className="sa-rise bg-white rounded-2xl border-2 border-neutral-200 p-5" style={{ animationDelay: '.06s' }}>
                  <p className="text-xs text-neutral-500 font-medium">เฉลี่ยต่อคลาส</p>
                  <p className="tabular-nums text-2xl font-bold text-neutral-900 mt-0.5">{avgPerSession.toLocaleString()} <span className="text-sm font-medium text-neutral-500">บาท</span></p>
                  <p className="text-[11px] text-neutral-400">จาก {summary.totalSessions} คลาส · รับแล้ว {summary.totalPaid.toLocaleString()} / ค้างรับ {summary.totalPending.toLocaleString()} บาท</p>
                </div>
                <div className="sa-rise bg-white rounded-2xl border-2 border-neutral-200 p-5" style={{ animationDelay: '.1s' }}>
                  <p className="text-xs text-neutral-500 font-medium">รายได้แยกระดับชั้น</p>
                  {[
                    ['ระดับมัธยม', secondaryTotal, 'from-orange-500 to-amber-400'],
                    ['ระดับประถม (ป.1–ป.6)', elementaryTotal, 'from-sky-400 to-blue-500'],
                  ].map(([label, value, grad]) => (
                    <div key={label} className="mt-2.5">
                      <div className="flex justify-between text-sm gap-2"><span className="font-semibold text-neutral-700">{label}</span><span className="tabular-nums font-bold text-neutral-900">{value.toLocaleString()} บาท</span></div>
                      <div className="h-2.5 rounded-full bg-neutral-100 mt-1 overflow-hidden">
                        <span className={`sa-grow block h-full rounded-full bg-gradient-to-r ${grad}`} style={{ width: `${summary.totalEarned ? (value / summary.totalEarned) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between mt-3 p-2.5 bg-green-50 rounded-xl border border-green-200">
                    <span className="text-xs text-green-700 font-medium">รวมทั้งหมด</span>
                    <span className="tabular-nums text-sm font-bold text-green-700">{summary.totalEarned.toLocaleString()} บาท</span>
                  </div>
                </div>
                {bestMonth && bestMonth.total > 0 && (
                  <div className="sa-rise relative overflow-hidden rounded-2xl bg-neutral-900 text-white p-5" style={{ animationDelay: '.14s' }}>
                    <div className="absolute -right-10 -bottom-12 h-40 w-40 rounded-full bg-orange-500/30 blur-2xl" />
                    <p className="relative text-xs font-bold text-amber-300 flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> เดือนที่ดีที่สุด</p>
                    <p className="relative tabular-nums text-2xl font-black mt-1">{bestMonth.month} {bestMonth.year} · {bestMonth.total.toLocaleString()} บาท</p>
                    <p className="relative text-[11px] text-neutral-400">{bestMonth.sessions} คลาสในเดือนเดียว</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ Tab: Courses ═══════════════════════════════════════ */}
        {viewMode === 'courses' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-white border border-neutral-200 rounded-xl p-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input type="text" placeholder="ค้นหาชื่อคอร์ส..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <select className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 md:min-w-[180px]"
                  value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">ทุกสถานะ</option>
                  <option value="paid">รับครบแล้ว</option>
                  <option value="pending">ยังไม่ได้รับ</option>
                  <option value="partial">รับบางส่วน</option>
                </select>
                <select className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  value={coursePageSize} onChange={e => setCoursePageSize(Number(e.target.value))}>
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>แสดง {n} รายการ</option>
                  ))}
                </select>
              </div>
            </div>

            {coursePag.paged.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-neutral-200">
                <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">ไม่พบคอร์สที่ค้นหา</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {coursePag.paged.map((course, idx) => {
                  const status = getCourseStatus(course);
                  const sc = statusConfig[status];
                  const pp = course.totalEarned > 0 ? Math.round((course.paidEarned / course.totalEarned) * 100) : 0;
                  return (
                    <div key={course.courseId} className="sa-rise bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col" style={{ animationDelay: `${Math.min(idx, 8) * 0.04}s` }}>
                      <div className="p-5 border-b border-neutral-100 flex-1">
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-neutral-900 leading-tight">{course.courseName}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${LEVEL_BADGE[course.levelType] || LEVEL_BADGE.secondary}`}>
                                {course.levelType === 'elementary' ? 'ประถม' : 'มัธยม'}
                              </span>
                              {course.lastSession && (
                                <span className="text-[11px] text-neutral-400 flex items-center gap-1"><Clock className="w-3 h-3" />ล่าสุด {formatDate(course.lastSession)}</span>
                              )}
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap border ${sc.bg}`}>
                            {sc.icon}{sc.label}
                          </span>
                        </div>
                        <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-neutral-600 font-bold">รับเงินแล้ว <span className="text-neutral-400 font-medium ml-1">({course.paidEarned.toLocaleString()}/{course.totalEarned.toLocaleString()} บาท)</span></span>
                            <span className="font-black text-orange-600">{pp}%</span>
                          </div>
                          <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden shadow-inner">
                            <div className="sa-grow h-full bg-gradient-to-r from-orange-400 to-orange-600" style={{ width: `${pp}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 p-4 bg-neutral-50/50">
                        {[
                          [CalendarCheck, 'bg-blue-100 text-blue-600', course.sessions, 'คลาส'],
                          [Check, 'bg-green-100 text-green-600', course.paidEarned.toLocaleString(), 'รับแล้ว (บาท)'],
                          [Clock, 'bg-orange-100 text-orange-600', course.pendingEarned.toLocaleString(), 'ค้างรับ (บาท)'],
                        ].map((item, k) => {
                          const StatIcon = item[0];
                          return (
                            <div key={k} className={`flex items-center gap-2 min-w-0 ${k < 2 ? 'border-r border-neutral-200 pr-2' : ''}`}>
                              <div className={`w-8 h-8 rounded-full ${item[1]} flex items-center justify-center shrink-0`}><StatIcon className="w-4 h-4" /></div>
                              <div className="min-w-0">
                                <p className="tabular-nums font-bold text-neutral-900 leading-none truncate">{item[2]}</p>
                                <p className="text-[10px] text-neutral-500 mt-0.5">{item[3]}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={() => { setViewMode('sessions'); setSearchQuery(course.courseName); }}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-neutral-100 text-sm font-medium text-neutral-600 hover:bg-orange-50 hover:text-orange-600 transition">
                        <Eye className="h-3.5 w-3.5" />ดูคลาสทั้งหมด
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Course Pagination */}
            {coursePag.totalPages > 1 && (
              <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden">
                <Pagination
                  page={coursePag.page}
                  totalPages={coursePag.totalPages}
                  total={coursePag.total}
                  pageSize={coursePageSize}
                  setPage={coursePag.setPage}
                />
              </div>
            )}
          </div>
        )}

        {/* ══ Tab: Sessions ══════════════════════════════════════ */}
        {viewMode === 'sessions' && (
          <div className="space-y-4">
            <TeachingHeatmap sessions={sessions} />

            {/* Filter bar */}
            <div className="bg-white border border-neutral-200 rounded-xl p-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input type="text" placeholder="ค้นหาชื่อคอร์ส..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <select className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  value={sessionPageSize} onChange={e => setSessionPageSize(Number(e.target.value))}>
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>แสดง {n} รายการ</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden">
              <div className="p-5 border-b border-neutral-200 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">รายละเอียดแต่ละคลาส</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    ค่าสอนคิดจาก <span className="font-medium text-neutral-700">rate ต่อคาบ (1.5 ชม.)</span> × จำนวนคาบที่สอนจริง
                  </p>
                </div>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-xs text-orange-600 hover:underline shrink-0">
                    ล้างตัวกรอง
                  </button>
                )}
              </div>

              {sessionPag.paged.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">ไม่พบคลาสที่ค้นหา</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {sessionPag.paged.map(s => {
                    const d = new Date(s.sessionDate);
                    return (
                      <div key={s.tutorCheckinId} className="px-5 py-3.5 flex items-center gap-4 hover:bg-orange-50/40 transition">
                        <div className={`w-14 shrink-0 text-center rounded-xl py-1.5 ${s.isPaid ? 'bg-neutral-50' : 'bg-orange-50'}`}>
                          <p className={`text-[10px] font-semibold ${s.isPaid ? 'text-neutral-400' : 'text-orange-500'}`}>{TH_MONTHS_SHORT[d.getMonth()]} {String((d.getFullYear() + 543) % 100).padStart(2, '0')}</p>
                          <p className={`tabular-nums text-lg font-black leading-none ${s.isPaid ? 'text-neutral-800' : 'text-orange-600'}`}>{d.getDate()}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-900 truncate">{s.courseName}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 mt-0.5">
                            {s.subjectName && <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-semibold">{s.subjectName}</span>}
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${LEVEL_BADGE[s.levelType] || LEVEL_BADGE.secondary}`}>{s.levelType === 'elementary' ? 'ประถม' : 'มัธยม'}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.classType === 'substitute' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {s.classType === 'substitute' ? 'รับสอนแทน' : 'คอร์สหลัก'}
                            </span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.actualStudents} คน</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Number(s.durationHours).toFixed(1)} ชม.</span>
                            <span className="text-neutral-400" title="rate ต่อคาบ × (ชั่วโมง ÷ 1.5)">{s.ratePerSession} × ({Number(s.durationHours).toFixed(1)} ÷ 1.5)</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="tabular-nums font-black text-neutral-900">{s.earnedAmount.toLocaleString()} <span className="text-xs font-normal text-neutral-400">บาท</span></p>
                          {s.isPaid
                            ? <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold bg-green-50 text-green-700 border-green-200"><Check className="h-3 w-3" />รับแล้ว</span>
                            : <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold bg-orange-50 text-orange-700 border-orange-200"><Clock className="h-3 w-3" />ค้างรับ</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between px-5 py-3 bg-neutral-50 border-t-2 border-neutral-200">
                <span className="text-sm font-bold text-neutral-700">รวมทั้งหมด ({filteredSessions.length} คลาส)</span>
                <span className="tabular-nums font-black text-orange-600">{filteredSessions.reduce((sum, s) => sum + s.earnedAmount, 0).toLocaleString()} บาท</span>
              </div>

              {/* Session Pagination */}
              <Pagination
                page={sessionPag.page}
                totalPages={sessionPag.totalPages}
                total={sessionPag.total}
                pageSize={sessionPageSize}
                setPage={sessionPag.setPage}
              />
            </div>
          </div>
        )}

        {/* ══ Tab: History ═══════════════════════════════════════ */}
        {viewMode === 'history' && (() => {
          const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

          const paymentYears = [...new Set(
            payments.filter(p => p.paymentDate).map(p => new Date(p.paymentDate).getFullYear())
          )].sort((a, b) => b - a);

          const monthsInYear = historyYear === 'all' ? [] : [...new Set(
            payments
              .filter(p => p.paymentDate && new Date(p.paymentDate).getFullYear() === Number(historyYear))
              .map(p => new Date(p.paymentDate).getMonth())
          )].sort((a, b) => a - b);

          const filteredPayments = payments.filter(p => {
            if (!p.paymentDate) return historyYear === 'all';
            const d = new Date(p.paymentDate);
            const yearOk = historyYear === 'all' || d.getFullYear() === Number(historyYear);
            const monthOk = historyMonth === 'all' || d.getMonth() === Number(historyMonth);
            return yearOk && monthOk;
          });

          const filteredTotal = filteredPayments.reduce((s, p) => s + Number(p.paymentCost), 0);
          const isFiltered = historyYear !== 'all' || historyMonth !== 'all';

          return (
            <div className="space-y-4">
              {/* ── Slip Modal ── */}
              {slipUrl && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                  onClick={() => setSlipUrl(null)}
                >
                  <div
                    className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                      <span className="font-semibold text-neutral-800 text-sm">สลิปการโอนเงิน</span>
                      <div className="flex items-center gap-2">
                        <a href={slipUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-medium hover:bg-orange-100 transition">
                          <Download className="h-3.5 w-3.5" />เปิดในแท็บใหม่
                        </a>
                        <button onClick={() => setSlipUrl(null)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 transition font-bold text-base">
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-center bg-neutral-50 min-h-[300px]">
                      <img
                        src={slipUrl}
                        alt="สลิปการโอนเงิน"
                        className="max-h-[70vh] max-w-full rounded-lg object-contain shadow"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── ค้างรับ ── */}
              {!isFiltered && summary.totalPending > 0 && (
                <div className="sa-rise flex items-center gap-4 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/60 p-4">
                  <div className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0"><Hourglass className="h-6 w-6" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900">ยังค้างรับ {summary.pendingSessionCount} คลาส</p>
                    <p className="text-xs text-neutral-500">จะขึ้นในประวัติเมื่อแอดมินโอนและแนบสลิปแล้ว</p>
                  </div>
                  <p className="tabular-nums text-xl font-black text-orange-600 shrink-0">{summary.totalPending.toLocaleString()} <span className="text-xs font-medium text-neutral-400">บาท</span></p>
                </div>
              )}

              {/* ── Header + Filters ── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    ประวัติการรับเงิน
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                    {isFiltered ? 'ยอดรับในช่วงที่เลือก' : 'รับไปแล้วทั้งหมด'} <span className="tabular-nums font-black">{filteredTotal.toLocaleString()} บาท</span> · {filteredPayments.length} ครั้ง
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={historyYear}
                    onChange={e => { setHistoryYear(e.target.value); setHistoryMonth('all'); }}
                    className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">ทุกปี</option>
                    {paymentYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select
                    value={historyMonth}
                    onChange={e => setHistoryMonth(e.target.value)}
                    disabled={historyYear === 'all'}
                    className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="all">ทุกเดือน</option>
                    {monthsInYear.map(m => <option key={m} value={m}>{THAI_MONTHS[m]}</option>)}
                  </select>
                  {isFiltered && (
                    <button
                      onClick={() => { setHistoryYear('all'); setHistoryMonth('all'); }}
                      className="text-xs text-orange-600 hover:underline px-1"
                    >รีเซ็ต</button>
                  )}
                </div>
              </div>

              {/* ── Timeline ── */}
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-neutral-200">
                  <FileText className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
                </div>
              ) : (
                <ol className="relative space-y-4 pl-9 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-green-300 before:to-neutral-200">
                  {filteredPayments.map((payment, index) => (
                    <li key={payment.tutorPaymentId} className="sa-rise relative" style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}>
                      <span className="absolute -left-9 top-5 h-6 w-6 rounded-full bg-green-500 ring-4 ring-green-100 text-white flex items-center justify-center"><Check className="h-3.5 w-3.5" /></span>
                      <div className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100 flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-xs font-bold text-orange-600 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              โอนเมื่อ {payment.paymentDate
                                ? new Date(payment.paymentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                                : '-'}
                            </p>
                            <p className="tabular-nums text-3xl font-bold text-neutral-900 mt-1">
                              +{Number(payment.paymentCost).toLocaleString()} <span className="text-base font-medium text-neutral-500">บาท</span>
                            </p>
                            {payment.billNo && <p className="text-xs text-neutral-500 mt-0.5">เลขที่ใบจ่าย: {payment.billNo}</p>}
                          </div>
                          {payment.paymentPicture && (
                            <button
                              onClick={() => setSlipUrl(payment.paymentPicture)}
                              className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3.5 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100 transition"
                            >
                              <ImageIcon className="h-4 w-4" />ดูสลิป
                            </button>
                          )}
                        </div>
                        {payment.courses.length > 0 && (
                          <div className="px-5 py-3 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-neutral-400 font-semibold">คอร์สที่เกี่ยวข้อง:</span>
                            {payment.courses.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-semibold">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── อัตราค่าสอน ── */}
      <div className="sa-rise bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden mb-6">
        <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-neutral-900 flex items-center gap-2"><Coins className="h-5 w-5 text-orange-600" /> อัตราค่าสอน</h3>
            <p className="text-xs text-neutral-500 mt-0.5">ต่อ 1.5 ชม. — คิดตามจำนวนนักเรียนที่มาจริง</p>
          </div>
          {topTier >= 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5">
              <Users className="h-3.5 w-3.5" /> คลาสส่วนใหญ่ของคุณมีนักเรียน {RATE_TABLE.secondary[topTier].label} ({tierCounts[topTier]} คลาส)
            </span>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {(['elementary', 'secondary']).map(level => {
            const rates = RATE_TABLE[level];
            const lo = Math.min(...rates.map(r => r.rate)) - 40;
            const hi = Math.max(...RATE_TABLE.secondary.map(r => r.rate));
            return (
              <div key={level}>
                <p className="text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${LEVEL_BADGE[level]}`}>{level === 'elementary' ? 'ประถม' : 'มัธยม'}</span>
                  {level === 'elementary' ? 'ป.1–ป.6' : 'ม.1–ม.6'}
                </p>
                <div className="flex items-end gap-2 h-40">
                  {rates.map((r, i) => (
                    <div key={r.rate} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className={`tabular-nums text-sm font-black ${i === topTier ? 'text-orange-600' : 'text-neutral-700'}`}>{r.rate}</span>
                      <div className={`sa-growY w-full rounded-t-xl mt-1 ${i === topTier ? 'bg-gradient-to-t from-orange-600 to-amber-400 ring-4 ring-orange-100' : 'bg-orange-100'}`}
                        style={{ height: `${((r.rate - lo) / (hi - lo)) * 100}%`, animationDelay: `${i * 0.06}s` }} />
                      <span className={`text-[11px] mt-1.5 text-center leading-tight ${i === topTier ? 'font-bold text-neutral-800' : 'text-neutral-500'}`}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
