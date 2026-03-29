import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Clock, Calendar,
  Download, Search, Check, AlertCircle, FileText,
  BarChart3, Eye, CreditCard, RefreshCw, BookOpen, ChevronDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
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

const ADMIN_ID = 1;
const API_BASE = 'http://localhost:3000/api/tutor';

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
      const res = await fetch(`${API_BASE}/income/${adminId}`);
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

// ─── Page Size Options ───────────────────────────────────────
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// ─── Component ───────────────────────────────────────────────
export default function TutorIncome() {
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
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium shadow-sm">
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

        {/* ── Summary Cards ─────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <span className="text-2xl text-green-600">฿</span>
              </div>
              <div className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full border font-semibold ${summary.growth >= 0 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {summary.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {summary.growth >= 0 ? '+' : ''}{summary.growth}%
              </div>
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">รายรับเดือนนี้</h3>
            <p className="text-3xl font-bold text-neutral-900">
              {summary.thisMonthEarned.toLocaleString()}
              <span className="text-lg text-neutral-500 ml-2">บาท</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">เดือนก่อน {summary.lastMonthEarned.toLocaleString()} บาท</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">{summary.totalSessions} คลาส</span>
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">รายรับสะสม</h3>
            <p className="text-3xl font-bold text-neutral-900">
              {summary.totalEarned.toLocaleString()}
              <span className="text-lg text-neutral-500 ml-2">บาท</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">รับแล้ว {summary.totalPaid.toLocaleString()} บาท</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              {summary.pendingSessionCount > 0 && (
                <div className="text-sm bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-200 font-semibold">
                  {summary.pendingSessionCount} คลาส
                </div>
              )}
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">รอรับเงิน</h3>
            <p className="text-3xl font-bold text-neutral-900">
              {summary.totalPending.toLocaleString()}
              <span className="text-lg text-neutral-500 ml-2">บาท</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              {summary.pendingSessionCount > 0 ? 'ยังไม่ได้รับเงิน' : 'รับครบแล้ว 🎉'}
            </p>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden mb-6">
          <div className="flex border-b border-neutral-200">
            {[
              { key: 'overview', label: 'ภาพรวม & กราฟ' },
              { key: 'courses', label: 'รายคอร์ส' },
              { key: 'sessions', label: 'รายคลาส' },
              { key: 'history', label: 'ประวัติรับเงิน' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setViewMode(tab.key)}
                className={`flex-1 px-4 py-4 text-sm font-medium transition ${viewMode === tab.key ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                {tab.label}
              </button>
            ))}
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

            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-6">รายรับรายเดือน</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={(props) => <CustomXTick {...props} monthly={filteredMonthly} />} height={40} />
                  <YAxis stroke="#6b7280" tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [`฿${v.toLocaleString()}`, '']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} name="รายรับรวม" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="elementary" stroke="#3b82f6" strokeWidth={2} name="ประถม" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="secondary" stroke="#10b981" strokeWidth={2} name="มัธยม" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-6">จำนวนคลาสรายเดือน</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={(props) => <CustomXTick {...props} monthly={filteredMonthly} />} height={40} />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="sessions" fill="#f97316" name="จำนวนคลาส" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
                <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  สรุปรายได้ตามระดับ
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-700">ระดับประถม (ป.1–ป.6)</span>
                    <span className="font-bold text-neutral-900">
                      {sessions.filter(s => s.levelType === 'elementary').reduce((a, s) => a + s.earnedAmount, 0).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-700">ระดับมัธยม</span>
                    <span className="font-bold text-neutral-900">
                      {sessions.filter(s => s.levelType === 'secondary').reduce((a, s) => a + s.earnedAmount, 0).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                    <span className="text-sm text-green-700 font-medium">รวมทั้งหมด</span>
                    <span className="font-bold text-green-700">{summary.totalEarned.toLocaleString()} บาท</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
                <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  สถิติการสอน
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-700">คลาสที่สอนทั้งหมด</span>
                    <span className="font-bold text-neutral-900">{summary.totalSessions} คลาส</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-700">เฉลี่ยต่อคลาส</span>
                    <span className="font-bold text-neutral-900">
                      {summary.totalSessions > 0 ? Math.round(summary.totalEarned / summary.totalSessions).toLocaleString() : 0} บาท
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-sm text-blue-700 font-medium">รับแล้ว / ค้างรับ</span>
                    <span className="font-bold text-blue-700">
                      {summary.totalPaid.toLocaleString()} / {summary.totalPending.toLocaleString()} บาท
                    </span>
                  </div>
                </div>
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
                {/* Page size */}
                <select className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  value={coursePageSize} onChange={e => setCoursePageSize(Number(e.target.value))}>
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>แสดง {n} รายการ</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course cards */}
            <div className="space-y-3">
              {coursePag.paged.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-neutral-200">
                  <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">ไม่พบคอร์สที่ค้นหา</p>
                </div>
              ) : coursePag.paged.map(course => {
                const status = getCourseStatus(course);
                const sc = statusConfig[status];
                return (
                  <div key={course.courseId} className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 transition p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-neutral-900">{course.courseName}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full border ${course.levelType === 'elementary' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                            {course.levelType === 'elementary' ? 'ประถม' : 'มัธยม'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                          <span>สอนไปแล้ว {course.sessions} คลาส</span>
                          <span className="text-green-600">รับแล้ว {course.paidEarned.toLocaleString()} บาท</span>
                          {course.pendingEarned > 0 && (
                            <span className="text-orange-600">ค้างรับ {course.pendingEarned.toLocaleString()} บาท</span>
                          )}
                          {course.lastSession && (
                            <span className="text-neutral-400">ล่าสุด {formatDate(course.lastSession)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-neutral-500 mb-1">รายได้รวม</div>
                        <div className="text-2xl font-bold text-orange-600">
                          {course.totalEarned.toLocaleString()}
                          <span className="text-sm text-neutral-500 ml-1">บาท</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                      <span className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 font-medium ${sc.bg}`}>
                        {sc.icon}{sc.label}
                      </span>
                      <button onClick={() => { setViewMode('sessions'); setSearchQuery(course.courseName); }}
                        className="flex items-center gap-1 px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition text-sm">
                        <Eye className="h-3 w-3" />ดูคลาสทั้งหมด
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

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
            {/* Filter bar */}
            <div className="bg-white border border-neutral-200 rounded-xl p-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input type="text" placeholder="ค้นหาชื่อคอร์ส..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                {/* Page size */}
                <select className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  value={sessionPageSize} onChange={e => setSessionPageSize(Number(e.target.value))}>
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>แสดง {n} รายการ</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden">
              <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">รายละเอียดแต่ละคลาส</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    ค่าสอนคิดจาก <span className="font-medium text-neutral-700">rate ต่อคาบ (1.5 ชม.)</span> × จำนวนคาบที่สอนจริง
                  </p>
                </div>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-xs text-orange-600 hover:underline">
                    ล้างตัวกรอง
                  </button>
                )}
              </div>

              {/* Mobile */}
              <div className="block md:hidden divide-y divide-neutral-100">
                {sessionPag.paged.map(s => (
                  <div key={s.tutorCheckinId} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-neutral-800 text-sm">{s.courseName}</p>
                        {s.subjectName && (
                          <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                            <BookOpen className="h-3 w-3" />{s.subjectName}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border shrink-0 ml-2 ${s.levelType === 'elementary' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                        {s.levelType === 'elementary' ? 'ประถม' : 'มัธยม'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                      <span>📅 {formatDate(s.sessionDate)}</span>
                      <span>👨‍🎓 {s.actualStudents} คน</span>
                      <span>⏱ {Number(s.durationHours).toFixed(1)} ชม.</span>
                      <span>💰 {s.ratePerSession} บ./คลาส</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-600 text-base">{s.earnedAmount.toLocaleString()} บาท</span>
                      {s.isPaid
                        ? <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"><Check className="h-3 w-3" />รับแล้ว</span>
                        : <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1"><Clock className="h-3 w-3" />ค้างรับ</span>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600 text-xs">
                    <tr>
                      <th className="text-left px-4 py-3">วันที่สอน</th>
                      <th className="text-left px-4 py-3">คอร์ส / วิชา</th>
                      <th className="text-center px-4 py-3">ระดับ</th>
                      <th className="text-center px-4 py-3">นักเรียนจริง</th>
                      <th className="text-center px-4 py-3">ชั่วโมง</th>
                      <th className="text-center px-4 py-3">Rate/คลาส</th>
                      <th className="text-right px-4 py-3">รายได้</th>
                      <th className="text-center px-4 py-3">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {sessionPag.paged.map(s => (
                      <tr key={s.tutorCheckinId} className="hover:bg-neutral-50 transition">
                        <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">{formatDate(s.sessionDate)}</td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="font-medium text-neutral-800 truncate">{s.courseName}</p>
                          {s.subjectName && (
                            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                              <BookOpen className="h-3 w-3" />{s.subjectName}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full border ${s.levelType === 'elementary' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                            {s.levelType === 'elementary' ? 'ประถม' : 'มัธยม'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-neutral-800">{s.actualStudents} คน</td>
                        <td className="px-4 py-3 text-center text-neutral-600">{Number(s.durationHours).toFixed(1)} ชม.</td>
                        <td className="px-4 py-3 text-center text-neutral-600">{s.ratePerSession} บ.</td>
                        <td className="px-4 py-3 text-right font-bold text-orange-600">{s.earnedAmount.toLocaleString()} บ.</td>
                        <td className="px-4 py-3 text-center">
                          {s.isPaid
                            ? <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 inline-flex items-center gap-1"><Check className="h-3 w-3" />รับแล้ว</span>
                            : <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 inline-flex items-center gap-1"><Clock className="h-3 w-3" />ค้างรับ</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-sm font-bold text-neutral-700">
                        รวมทั้งหมด ({filteredSessions.length} คลาส)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-orange-600 text-base">
                        {filteredSessions.reduce((sum, s) => sum + s.earnedAmount, 0).toLocaleString()} บ.
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
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

              <div className="bg-white rounded-2xl border-2 border-neutral-200 p-5">
                {/* ── Header + Filters ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    ประวัติการรับเงิน
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={historyYear}
                      onChange={e => { setHistoryYear(e.target.value); setHistoryMonth('all'); }}
                      className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">ทุกปี</option>
                      {paymentYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select
                      value={historyMonth}
                      onChange={e => setHistoryMonth(e.target.value)}
                      disabled={historyYear === 'all'}
                      className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
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

                {/* ── Summary ── */}
                <div className="flex gap-3 mb-5">
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-green-600 mb-0.5">{isFiltered ? 'ยอดรับในช่วงที่เลือก' : 'รับไปแล้วทั้งหมด'}</p>
                    <p className="text-xl font-bold text-green-700">{filteredTotal.toLocaleString()} บาท</p>
                    <p className="text-xs text-green-500 mt-0.5">{filteredPayments.length} ครั้ง</p>
                  </div>
                  {!isFiltered && summary.totalPending > 0 && (
                    <div className="flex-1 bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-orange-600 mb-0.5">ยังค้างรับ</p>
                      <p className="text-xl font-bold text-orange-700">{summary.totalPending.toLocaleString()} บาท</p>
                      <p className="text-xs text-orange-500 mt-0.5">{summary.pendingSessionCount} คลาส</p>
                    </div>
                  )}
                </div>

                {/* ── Timeline ── */}
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 text-sm">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPayments.map((payment, index) => (
                      <div key={payment.tutorPaymentId} className="relative">
                        {index !== filteredPayments.length - 1 && (
                          <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-neutral-200" />
                        )}
                        <div className="flex gap-4">
                          <div className="shrink-0">
                            <div className="h-12 w-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                              <Check className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                          <div className="flex-1 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                            {/* วันที่ + ยอด + เลขที่ */}
                            <div className="mb-3">
                              <div className="text-sm text-neutral-500 mb-1">
                                {payment.paymentDate
                                  ? new Date(payment.paymentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                                  : '-'}
                              </div>
                              <div className="text-2xl font-bold text-green-600">
                                +{Number(payment.paymentCost).toLocaleString()}
                                <span className="text-sm text-neutral-500 ml-1">บาท</span>
                              </div>
                              {payment.billNo && (
                                <div className="text-xs text-neutral-400 mt-1">เลขที่ใบจ่าย: {payment.billNo}</div>
                              )}
                            </div>

                            {/* คอร์สที่เกี่ยวข้อง */}
                            {payment.courses.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs text-neutral-500 mb-2 font-medium">คอร์สที่เกี่ยวข้อง:</div>
                                <div className="flex flex-wrap gap-2">
                                  {payment.courses.map((c, i) => (
                                    <span key={i} className="text-xs bg-white text-neutral-700 px-3 py-1 rounded-md border border-neutral-200">{c}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ปุ่มดูสลิป */}
                            {payment.paymentPicture && (
                              <button
                                onClick={() => setSlipUrl(payment.paymentPicture)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 text-neutral-600 rounded-lg text-xs font-medium hover:border-neutral-400 hover:text-neutral-800 transition mt-2"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                ดูสลิป
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Rate Table ── */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          {(['elementary', 'secondary']).map(level => (
            <div key={level} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-neutral-200">
                <span className="text-sm font-medium text-neutral-900">{level === 'elementary' ? 'ประถม' : 'มัธยม'}</span>
                <span className="text-xs text-neutral-400 ml-2">{level === 'elementary' ? 'ป.1–ป.6' : 'ม.1–ม.6'}</span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {RATE_TABLE[level].map((r, i) => (
                    <tr key={r.rate} className={i % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}>
                      <td className="px-4 py-2 text-neutral-500">{r.label}</td>
                      <td className="px-4 py-2 text-right font-medium text-neutral-900">{r.rate} บ.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-2">ต่อ 1.5 ชม. — คิดตามจำนวนนักเรียนที่มาจริง</p>
      </div>
    </div>
  );
}