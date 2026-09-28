import { API_URL } from "../config";
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Clock, Calendar,
  Download, Search, Check, AlertCircle, FileText,
  BarChart3, Eye, RefreshCw, BookOpen, ChevronDown,
  ChevronLeft, ChevronRight,
  Wallet, Hourglass, CheckCircle2, Trophy, Coins, Users, CalendarDays, CalendarCheck, Receipt,
  Image as ImageIcon, Gauge, Presentation, BadgeCheck, Timer, Banknote, Sparkles, Crown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import UIPagination from "../components/ui/Pagination";
import Badge from "../components/ui/Badge";
import { PAGE_TITLE, PAGE_SUBTITLE, CALLOUT, CALLOUT_ICON } from "../components/ui/tokens";
import Spinner from "../components/ui/Spinner";
import ClearFiltersButton from "../components/ui/ClearFiltersButton";
import { FileSpreadsheet as LuFileSpreadsheet, FileText as LuFileText } from "lucide-react";
import { BTN } from "../components/ui/tokens";

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
  // ใช้ตัวแบ่งหน้ากลางของระบบ (components/ui/Pagination)
  return <UIPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onChange={setPage}
    className="px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl" />;
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
  paid: { label: 'รับครบแล้ว', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Check className="h-3 w-3" /> },
  pending: { label: 'ยังไม่ได้รับ', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" /> },
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

// พ.ศ. — แปลงเฉพาะเมื่อยังเป็น ค.ศ.
const toBE = (y) => { const n = Number(y); return n && n < 2400 ? n + 543 : n; };
// รูปแบบตัวเลขแกนกราฟ: ต่ำกว่า 1,000 แสดงเต็ม, ตั้งแต่ 1,000 ใช้ k
const fmtAxis = (v) => {
  if (v < 1000) return Math.round(v).toLocaleString();
  const k = v / 1000;
  return `${Number.isInteger(k) ? k : Number(k.toFixed(1))}k`;
};
// หาช่วงแกนที่เป็นเลขกลม (1, 2, 2.5, 5 × 10^n) สำหรับ 4 ช่อง
function niceAxis(maxV, steps = 4) {
  const raw = Math.max(1, maxV) / steps;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 1.5, 2, 2.5, 3, 5, 10].map((m) => m * mag).find((c) => c >= raw);
  return { top: step * steps, ticks: Array.from({ length: steps + 1 }, (_, k) => step * (steps - k)) };
}

const TH_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TIER_MIN = [1, 5, 11, 16, 21];

// สีโดนัท — ชุดเดียวกับ DONUT_COLORS (AdminFinance) / PIE_COLORS (AdminDashboard)
const DONUT_COLORS = [
  { base: '#f97316', light: '#fdba74' },
  { base: '#3b82f6', light: '#93c5fd' },
  { base: '#10b981', light: '#6ee7b7' },
  { base: '#f59e0b', light: '#fcd34d' },
  { base: '#a855f7', light: '#d8b4fe' },
  { base: '#94a3b8', light: '#cbd5e1' },
];

// เส้นประมีจุดวิ่ง ระหว่างกล่อง "สอนแล้ว → รอโอน → เข้าบัญชี"
function FlowConnector({ dotClass }) {
  return (
    <div className="relative h-6 sm:h-auto sm:w-10 sm:shrink-0" aria-hidden="true">
      <span className="hidden sm:block absolute inset-x-0 top-1/2 border-t-2 border-dashed border-slate-200" />
      <span className="sm:hidden absolute inset-y-0 left-1/2 border-l-2 border-dashed border-slate-200" />
      {[0, 0.8, 1.6].map((d) => <span key={`h${d}`} className={`sa-flow hidden sm:block ${dotClass}`} style={{ animationDelay: `${d}s` }} />)}
      {[0, 0.9].map((d) => <span key={`v${d}`} className={`sa-flowY sm:hidden ${dotClass}`} style={{ animationDelay: `${d}s` }} />)}
    </div>
  );
}

// ─── สไตล์เฉพาะหน้ารายรับ (คลาส inc3d-*) ─────────────────────────────
// การ์ดสรุปด้านบน + แท็บ ใช้ขอบนูนเล็กน้อย ส่วนการ์ดอื่นเป็นการ์ดมาตรฐานของระบบ
// (bg-white rounded-2xl border border-slate-200 shadow-sm) — แอนิเมชันในการ์ดยังคงไว้
const INC3D_CSS = `
@property --inc3d-sweep { syntax: '<number>'; inherits: true; initial-value: 1; }
.inc3d-card{position:relative;background:#fff;border:1px solid #E7E1D8;border-radius:20px;
  box-shadow:0 6px 0 #EDE6DC,0 8px 0 #DFD6CA,0 20px 30px -18px rgba(15,23,42,.25);
  transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(var(--ty,0px));
  transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s cubic-bezier(.2,.8,.2,1)}
.inc3d-chip{box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 3px 0 var(--chip-edge,#C2410C),0 8px 14px -6px var(--chip-glow,rgba(234,88,12,.5))}
.inc3d-step{transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.inc3d-step:hover{transform:translateY(-3px)}
.inc3d-track{box-shadow:inset 0 2px 3px rgba(15,23,42,.08)}
.inc3d-bar{position:relative;transform-origin:bottom;animation:inc3d-grow 1s cubic-bezier(.2,.8,.2,1) both}
.inc3d-bar .fc{position:absolute;inset:0;border-radius:6px 6px 0 0;background:#FDBA74}
.inc3d-bar.now .fc{background:linear-gradient(180deg,#FB923C,#EA580C)}
.inc3d-bar.hov .fc{filter:brightness(1.05) saturate(1.1)}
@keyframes inc3d-grow{from{transform:scaleY(0)}}
.inc3d-line{animation:inc3d-reveal 1.3s .8s cubic-bezier(.2,.8,.2,1) both}
@keyframes inc3d-reveal{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.inc3d-dot{background:#1E293B;box-shadow:0 0 0 2px #fff}
.inc3d-ball{background:#EA580C;box-shadow:0 0 0 3px #fff,0 1px 3px rgba(15,23,42,.3)}
.inc3d-person{background:#22C55E}
.inc3d-mini{background:#0EA5E9}
.inc3d-mini.dim{background:#BAE6FD}
.inc3d-donut{position:relative;width:176px;height:176px;animation:inc3d-sweep 1.2s .2s cubic-bezier(.2,.8,.2,1) both}
@keyframes inc3d-sweep{from{--inc3d-sweep:0}}
.inc3d-disc{position:absolute;inset:0;border-radius:50%;-webkit-mask:radial-gradient(circle,transparent 58%,#000 59%);mask:radial-gradient(circle,transparent 58%,#000 59%)}
.inc3d-center{position:absolute;inset:0;display:grid;place-items:center}
.inc3d-in{animation:inc3d-in .5s ease both}
@keyframes inc3d-in{from{translate:0 10px;opacity:0}}
.inc3d-tabs{box-shadow:inset 0 2px 4px rgba(15,23,42,.07)}
.inc3d-pill{box-shadow:inset 0 1px 0 #fff,0 3px 0 #E2DCD3,0 8px 14px -8px rgba(15,23,42,.25);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
@media (prefers-reduced-motion:reduce){
  .inc3d-bar,.inc3d-line,.inc3d-donut,.inc3d-in{animation:none!important}
  .inc3d-card{transform:none!important;transition:none}
  .inc3d-pill{transition:none}
}`;

// แท็บเต็มความกว้าง แคปซูลสีขาวเลื่อนตามแท็บที่เลือก
function IsoTabs({ tabs, value, onChange }) {
  const idx = Math.max(0, tabs.findIndex((t) => t.key === value));
  return (
    <div role="tablist" aria-label="มุมมองรายรับ"
      className="inc3d-tabs relative grid w-full rounded-2xl bg-[#ECE8E2] p-1.5 mb-6"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
      <span aria-hidden="true" className="inc3d-pill absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-white"
        style={{ width: `calc((100% - 12px) / ${tabs.length})`, transform: `translateX(${idx * 100}%)` }} />
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = t.key === value;
        return (
          <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => onChange(t.key)}
            className={`relative z-10 flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition-colors ${active ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
            {Icon && <Icon className="hidden sm:block h-4 w-4 shrink-0" />}
            <span className="sm:hidden truncate">{t.short || t.label}</span>
            <span className="hidden sm:inline truncate">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// กราฟรายรับรายเดือน: แท่ง (รายรับ) + เส้นจุด (จำนวนคลาส) — วาดเองด้วย HTML/SVG
function IsoMonthlyChart({ data }) {
  const [hover, setHover] = useState(null);
  const n = data.length;
  if (!n) return <p className="py-16 text-center text-sm text-slate-500">ยังไม่มีข้อมูลรายรับ</p>;
  const maxV = Math.max(1, ...data.map((d) => d.total || 0));
  const { top, ticks } = niceAxis(maxV * 1.1);
  const sMax = Math.max(1, ...data.map((d) => d.sessions || 0)) * 1.6;
  const pts = data.map((d, i) => [((i + 0.5) / n) * 100, 100 - ((d.sessions || 0) / sMax) * 100]);
  const showAllValues = n <= 8;
  const fmtK = fmtAxis;
  const h = hover != null ? data[hover] : null;
  const tipLeft = hover != null ? Math.min(88, Math.max(12, pts[hover][0])) : 0;
  return (
    <div className="relative mt-4 h-[340px] pl-10 pb-10">
      <div className="absolute left-0 top-0 bottom-10 w-9 flex flex-col justify-between text-right text-[11px] text-slate-400 tabular-nums">
        {ticks.map((t) => <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{fmtAxis(t)}</span>)}
      </div>
      <div className="relative h-full">
        {[0, 25, 50, 75].map((p) => <span key={p} className="absolute inset-x-0 h-px bg-slate-100" style={{ top: `${p}%` }} />)}
        <span className="absolute inset-x-0 bottom-0 h-px bg-slate-300" />
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {data.map((d, i) => {
            const showVal = d.total > 0 && (showAllValues || d.isCurrent || d.isBest || hover === i);
            const showYear = d.month === 'ม.ค.' || i === 0;
            return (
              <div key={`${d.month}-${d.year}`} className="relative flex h-full items-end justify-center cursor-default"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <div className={`inc3d-bar ${d.isCurrent ? 'now' : ''} ${hover === i ? 'hov' : ''}`}
                  style={{ height: `${((d.total || 0) / top) * 100}%`, width: 'min(52%, 48px)', animationDelay: `${i * 70}ms` }}>
                  <span className="fc" />
                  {showVal && (
                    <span className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold tabular-nums ${d.isCurrent ? 'text-orange-700' : 'text-slate-500'}`}
                      style={{ bottom: 'calc(100% + 6px)' }}>{fmtK(d.total)}</span>
                  )}
                  {d.isBest && (
                    <span className="sa-pop absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-amber-300 shadow"
                      style={{ bottom: 'calc(100% + 24px)', animationDelay: '1.1s' }}>สูงสุด</span>
                  )}
                </div>
                <span className={`absolute -bottom-9 inset-x-0 text-center text-[11px] leading-tight ${d.isCurrent ? 'font-semibold text-orange-700' : 'text-slate-500'}`}>
                  {d.month}
                  {showYear && <span className="block text-[10px] text-slate-400">{toBE(d.year)}</span>}
                </span>
              </div>
            );
          })}
        </div>
        <svg className="inc3d-line pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')}
            fill="none" stroke="#1E293B" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {pts.map((p, i) => (
          <span key={i} className="inc3d-dot sa-pop pointer-events-none absolute grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold tabular-nums text-white"
            style={{ left: `${p[0]}%`, bottom: `${100 - p[1]}%`, margin: '0 0 -12px -12px', animationDelay: `${1 + i * 0.08}s` }}>
            {data[i].sessions || 0}
          </span>
        ))}
        {h && (
          <div className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: `${tipLeft}%`, top: -8 }}>
            <p className="font-semibold text-slate-900">{h.month} {toBE(h.year)}</p>
            <p className="tabular-nums text-slate-600"><b className="text-orange-600">{(h.total || 0).toLocaleString()}</b> บาท · {h.sessions || 0} คลาส</p>
          </div>
        )}
      </div>
    </div>
  );
}

// โดนัทสัดส่วนรายได้ — ชิ้นกวาดขึ้นตอนโหลด
function IsoDonut({ data, centerValue, centerLabel }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (!total) return <p className="text-center text-sm text-slate-500 py-10">ยังไม่มีรายรับ</p>;
  let acc = 0;
  const stops = data.map((d) => {
    const a = acc; acc += (d.value / total) * 100;
    return `${d.base} calc(var(--inc3d-sweep) * ${a.toFixed(3)}%) calc(var(--inc3d-sweep) * ${acc.toFixed(3)}%)`;
  }).join(', ');
  const bg = `conic-gradient(from -90deg, ${stops}, #F1F5F9 0)`;
  const sig = data.map((d) => `${d.name}:${d.value}`).join('|');
  const topValue = Math.max(...data.map((d) => d.value));
  const pct = (v) => Math.round((v / total) * 100);
  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <div className="grid h-[196px] w-full place-items-center">
        <div key={sig} className="inc3d-donut">
          <span className="inc3d-disc" style={{ background: bg }} />
          <div className="inc3d-center">
            <div className="text-center">
              <p className="tabular-nums text-2xl font-bold leading-none text-slate-900">{centerValue} <span className="text-xs font-medium text-slate-500">คอร์ส</span></p>
              <p className="text-[11px] text-slate-500">{centerLabel}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full space-y-1">
        {data.map((d, i) => (
          <div key={i} className={`flex items-center justify-between gap-2 text-xs py-1 px-1 rounded-lg ${d.value === topValue ? 'font-semibold bg-slate-50' : ''}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-[3px] shrink-0" style={{ background: d.base }} />
              <span className="text-slate-600 truncate" title={d.name}>{d.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="tabular-nums font-bold text-slate-800">{d.value.toLocaleString()} บาท</span>
              <span className="tabular-nums text-[11px] text-slate-500 w-8 text-right">{pct(d.value)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// เครื่องคำนวณค่าสอน: เลือกระดับ + เลื่อนจำนวนนักเรียน → เรตต่อคาบ และบอกว่าอีกกี่คนจะขึ้นเรต
function RateCalculator({ topTier, tierCounts }) {
  const [level, setLevel] = useState('secondary');
  const [students, setStudents] = useState(() => (topTier >= 0 ? TIER_MIN[topTier] + 2 : 8));
  const rates = RATE_TABLE[level];
  const tier = tierIndexOf(students);
  const rate = rates[tier].rate;
  const lo = 140;
  const hi = Math.max(...RATE_TABLE.secondary.map((r) => r.rate));
  return (
    <div className="sa-rise bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ animationDelay: '.1s' }}>
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Coins className="h-4 w-4 text-orange-600" /> เกณฑ์การคิดค่าสอน</h2>
          <p className="text-[11px] text-slate-500">อัตราต่อคาบ 1.5 ชม. คิดตามจำนวนนักเรียนที่มาเรียนจริง</p>
        </div>
        {topTier >= 0 && (
          <span className="self-start md:self-auto inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-2.5 py-0.5">
            <Users className="h-3.5 w-3.5" /> คลาสส่วนใหญ่มีนักเรียน {RATE_TABLE.secondary[topTier].label} ({tierCounts[topTier]} คลาส)
          </span>
        )}
      </div>
      <div className="grid gap-6 p-4 sm:p-5 md:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm">
            {[['elementary', 'ประถม'], ['secondary', 'มัธยม']].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setLevel(k)}
                className={`px-4 py-1.5 rounded-xl font-medium transition ${level === k ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>{l}</button>
            ))}
          </div>
          <div>
            <label htmlFor="income-rate-students" className="flex items-center justify-between text-xs text-slate-600">
              <span>นักเรียนที่มาเรียน</span><span className="tabular-nums text-sm font-bold text-slate-900">{students} คน</span>
            </label>
            <input id="income-rate-students" type="range" min={1} max={25} value={students} onChange={(e) => setStudents(Number(e.target.value))} className="w-full mt-2 accent-orange-500" />
          </div>
          <div className="rounded-xl bg-slate-900 text-white p-4 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-10 h-32 w-32 rounded-full bg-orange-500/30 blur-2xl" />
            <p className="relative text-[11px] text-slate-400">ค่าสอนต่อคาบ (1.5 ชม.)</p>
            <p className="relative tabular-nums text-2xl font-bold"><span key={`${level}-${rate}`} className="sa-rise inline-block">{rate}</span> <span className="text-sm font-medium text-slate-500">บาท</span></p>
            <p className="relative text-[11px] text-slate-300 mt-1">สอน 3 ชม. (2 คาบ) = {(rate * 2).toLocaleString()} บาท</p>
            <p className="relative text-[11px] text-amber-300 mt-2 flex items-center gap-1">
              {tier < 4
                ? <><Sparkles className="h-3.5 w-3.5 shrink-0" /> เพิ่มอีก {TIER_MIN[tier + 1] - students} คน อัตราจะเป็น {rates[tier + 1].rate} บาท (+{rates[tier + 1].rate - rate} บาท)</>
                : <><Crown className="h-3.5 w-3.5 shrink-0" /> อัตราสูงสุดแล้ว</>}
            </p>
          </div>
        </div>
        <div className="min-w-0">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 items-end h-52">
            {rates.map((r, i) => (
              <div key={r.rate} className="flex flex-col items-center justify-end h-full">
                <span className={`tabular-nums text-xs font-bold ${i === tier ? 'text-orange-600' : 'text-slate-600'}`}>{r.rate}</span>
                <div className={`w-full rounded-t-xl mt-1 transition-all duration-500 ${i === tier ? 'bg-gradient-to-t from-orange-600 to-amber-400 ring-4 ring-orange-100' : 'bg-orange-100'}`}
                  style={{ height: `${((r.rate - lo) / (hi - lo)) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-2">
            {rates.map((r, i) => (
              <span key={r.rate} className={`text-center text-[11px] leading-tight ${i === tier ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{r.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// เงินเข้าบัญชีสะสม — กราฟขั้นบันได 1 ขั้น = การโอน 1 ครั้ง
function PayCumulativeChart({ payments }) {
  const asc = payments.filter((p) => p.paymentDate).map((p) => ({ p, t: new Date(p.paymentDate).getTime() })).sort((a, b) => a.t - b.t);
  if (!asc.length) return null;
  let run = 0;
  const pts = asc.map((q) => ({ ...q, v: (run += Number(q.p.paymentCost) || 0) }));
  const W = 1000; const H = 200; const L = 44; const R = 84; const T = 16; const B = 26;
  const t0 = pts[0].t - 864e5 * 20; const t1 = Math.max(Date.now(), pts[pts.length - 1].t + 864e5 * 5);
  const { top, ticks: cumTicks } = niceAxis(run * 1.05, 2);
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (v) => T + (H - T - B) - (v / top) * (H - T - B);
  let d = `M${x(t0)},${y(0)}`;
  pts.forEach((q) => { d += ` H${x(q.t)} V${y(q.v)}`; });
  d += ` H${x(t1)}`;
  let len = 0; let px = x(t0); let py = y(0);
  pts.forEach((q) => { len += Math.abs(x(q.t) - px) + Math.abs(y(q.v) - py); px = x(q.t); py = y(q.v); });
  len += x(t1) - px;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-2">
      <defs>
        <linearGradient id="incCum" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#22c55e" stopOpacity=".22" /><stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {cumTicks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#f5f5f5" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#a3a3a3">{fmtAxis(v)}</text>
        </g>
      ))}
      <path d={`${d} V${y(0)} Z`} fill="url(#incCum)" className="sa-rise" />
      <path d={d} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinejoin="round" className="sa-draw" style={{ '--len': len }} />
      {pts.map((q, i) => (
        <g key={i}>
          <circle cx={x(q.t)} cy={y(q.v)} r={5} fill="#fff" stroke="#16a34a" strokeWidth={2.5} className="sa-pop" style={{ animationDelay: `${0.4 + i * 0.08}s`, transformBox: 'fill-box', transformOrigin: 'center', cursor: 'pointer' }}>
            <title>{`โอน ${new Date(q.t).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}: +${Number(q.p.paymentCost).toLocaleString()} บาท · สะสม ${q.v.toLocaleString()} บาท`}</title>
          </circle>
          <text x={x(q.t)} y={H - 8} textAnchor="middle" fontSize={10} fill="#a3a3a3">{TH_MONTHS_SHORT[new Date(q.t).getMonth()]}</text>
        </g>
      ))}
      <text x={x(t1) + 6} y={y(run) + 4} fontSize={12} fontWeight={700} fill="#15803d">{run.toLocaleString()}</text>
    </svg>
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
      'สถานะ': s.isPaid ? 'รับแล้ว' : s.isPartiallyPaid ? 'รับบางส่วน' : 'ค้างรับ',
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
      { 'หัวข้อ': 'ยอดโอนเกินค่าสอน', 'จำนวน (บาท)': summary.overpaid || 0 },
      { 'หัวข้อ': 'คลาสทั้งหมด (คลาส)', 'จำนวน (บาท)': summary.totalSessions },
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
        <td style="text-align:center;color:${s.isPaid ? '#16a34a' : '#ea580c'}">${s.isPaid ? 'รับแล้ว' : s.isPartiallyPaid ? 'รับบางส่วน' : 'ค้างรับ'}</td>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลรายรับ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 bg-white border border-red-200 shadow-sm rounded-2xl p-8 max-w-md">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-red-700 font-medium">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={refetch} className={`${BTN.primary} px-5 py-2 rounded-xl text-sm font-medium transition`}>
            ลองอีกครั้ง
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
  const totalHours = sessions.reduce((a, s) => a + Number(s.durationHours || 0), 0);
  const paidPct = summary.totalEarned > 0 ? Math.min(100, Math.round((summary.totalPaid / summary.totalEarned) * 100)) : 0;
  const overpaid = Number(summary.overpaid) || 0;
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

  const now = new Date();
  const thisMonthHours = sessions
    .filter(s => { const d = new Date(s.sessionDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((a, s) => a + Number(s.durationHours || 0), 0);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projected = Math.round((summary.thisMonthEarned / Math.max(1, now.getDate())) * daysInMonth);
  const paceScale = Math.max(projected, summary.lastMonthEarned, 1) * 1.08;
  const paceDiff = projected - summary.lastMonthEarned;
  const perHour = totalHours > 0 ? Math.round(summary.totalEarned / totalHours) : 0;
  const maxPerHour = Math.round(Math.max(...RATE_TABLE.secondary.map(r => r.rate)) / 1.5);
  const avgStudents = sessions.length ? sessions.reduce((a, s) => a + (Number(s.actualStudents) || 0), 0) / sessions.length : 0;
  const maxStudents = sessions.length ? Math.max(...sessions.map(s => Number(s.actualStudents) || 0)) : 0;
  const minEarned = sessions.length ? Math.min(...sessions.map(s => s.earnedAmount)) : 0;
  const maxEarned = sessions.length ? Math.max(...sessions.map(s => s.earnedAmount)) : 0;
  const avgPos = maxEarned > minEarned ? ((avgPerSession - minEarned) / (maxEarned - minEarned)) * 100 : 50;
  const hourBars = monthly.slice(-12);
  const maxMonthSessions = Math.max(1, ...hourBars.map(m => m.sessions || 0));
  const latestPayment = payments.filter(p => p.paymentDate).reduce((b, p) => (!b || new Date(p.paymentDate) > new Date(b.paymentDate) ? p : b), null);
  const donutData = [...courses].filter(c => c.totalEarned > 0).sort((a, b) => b.totalEarned - a.totalEarned)
    .map((c, i) => ({ name: c.courseName, value: c.totalEarned, ...DONUT_COLORS[i % DONUT_COLORS.length] }));
  const prevMonthShort = TH_MONTHS_SHORT[(now.getMonth() + 11) % 12];

  const TABS = [
    { key: 'overview', label: 'ภาพรวม & กราฟ', short: 'ภาพรวม', icon: BarChart3 },
    { key: 'courses', label: 'รายคอร์ส', short: 'คอร์ส', icon: BookOpen },
    { key: 'sessions', label: 'รายคลาส', short: 'คลาส', icon: CalendarDays },
    { key: 'history', label: 'ประวัติรับเงิน', short: 'รับเงิน', icon: Receipt },
  ];

  return (
    <div className="space-y-6 px-4 lg:px-0">
      <style>{INC3D_CSS}</style>
      <div className="">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className={PAGE_TITLE}>รายรับของฉัน</h1>
              <p className={PAGE_SUBTITLE}>ติดตามรายได้และประวัติการรับเงินของคุณ</p>
            </div>
            <div className="relative group self-start md:self-auto">
              <button type="button" className={`${BTN.base} ${BTN.primary} ${BTN.md}`}>
                <Download className="h-4 w-4" />
                ดาวน์โหลดรายงาน
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-30">
                <button onClick={() => downloadExcel(sessions, courses, summary, admin)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 rounded-t-xl transition font-medium">
                  <LuFileSpreadsheet className="inline h-4 w-4 shrink-0" /> ดาวน์โหลด Excel
                </button>
                <button onClick={() => downloadPDF(sessions, courses, summary, admin)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 rounded-b-xl transition font-medium">
                  <LuFileText className="inline h-4 w-4 shrink-0" /> ดาวน์โหลด PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── การ์ดสรุปด้านบน: เดือนนี้ + เส้นทางเงิน ─────────────────── */}
        <div className="inc3d-card inc3d-in overflow-hidden mb-8">
          <div className="sa-float pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, #FFF7F0, #FFE6D1 60%, #FFD7B5)', opacity: 0.75 }} />
          <div className="relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            {/* เดือนนี้ */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-600 flex items-center gap-2.5 flex-wrap">
                <span className="inc3d-chip h-9 w-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center"><Wallet className="h-4 w-4" /></span>
                รายรับเดือนนี้ <span className="text-xs text-slate-500">· {TH_MONTHS_FULL[now.getMonth()]} {now.getFullYear() + 543}</span>
              </p>
              <div className="flex items-end gap-3 flex-wrap mt-4">
                <p className="tabular-nums text-4xl sm:text-5xl font-bold leading-none tracking-tight text-slate-900">
                  <MoneyCountUp value={summary.thisMonthEarned} />
                  <span className="text-base font-medium text-slate-500 ml-1.5">บาท</span>
                </p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${summary.growth >= 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {summary.growth >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {summary.growth >= 0 ? '+' : ''}{summary.growth}% จากเดือนก่อน
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {thisMonthSessions} คลาส · {Number(thisMonthHours.toFixed(1))} ชม. · เดือนก่อน {summary.lastMonthEarned.toLocaleString()} บาท
              </p>
              <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-orange-500" /> ประมาณการรายรับสิ้นเดือน</span>
                  <span className="tabular-nums font-bold text-orange-600 shrink-0">≈ {projected.toLocaleString()} <span className="text-xs font-medium text-slate-500">บาท</span></span>
                </div>
                <div className="inc3d-track relative mt-7 mb-1 h-3 rounded-full bg-slate-200">
                  <div className="sa-stripes sa-grow absolute inset-y-0 left-0 rounded-full bg-orange-200" style={{ width: `${(projected / paceScale) * 100}%` }} />
                  <div className="sa-grow absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-[inset_0_1px_0_rgba(255,255,255,.4)]" style={{ width: `${(summary.thisMonthEarned / paceScale) * 100}%`, animationDelay: '.25s' }} />
                  <div className="absolute -top-6 -translate-x-1/2 flex flex-col items-center" style={{ left: `${(summary.lastMonthEarned / paceScale) * 100}%` }}>
                    <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">{prevMonthShort} {summary.lastMonthEarned.toLocaleString()} บาท</span>
                    <span className="mt-0.5 h-5 w-0.5 rounded bg-slate-800" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  ผ่านไป {now.getDate()} จาก {daysInMonth} วัน ·{' '}
                  {paceDiff >= 0
                    ? <b className="text-green-600">สูงกว่าเดือนก่อนประมาณ {paceDiff.toLocaleString()} บาท</b>
                    : <b className="text-orange-600">ต่ำกว่าเดือนก่อนประมาณ {(-paceDiff).toLocaleString()} บาท</b>}
                </p>
              </div>
            </div>

            {/* เส้นทางเงิน */}
            <div className="min-w-0 rounded-2xl border border-orange-100 bg-white/80 p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-slate-900">สถานะการรับเงิน</p>
                  <p className="text-[11px] text-slate-500">ค่าสอนจะเปลี่ยนเป็น "รับแล้ว" เมื่อผู้ดูแลระบบบันทึกการโอนพร้อมแนบสลิป</p>
                </div>
                {latestPayment && (
                  <span className="text-[11px] text-slate-500">โอนล่าสุด {formatDate(latestPayment.paymentDate)} · {Number(latestPayment.paymentCost).toLocaleString()} บาท</span>
                )}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-stretch">
                <div className="inc3d-step rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-1 min-w-0">
                  <span className="inc3d-chip h-8 w-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-900 text-white flex items-center justify-center" style={{ '--chip-edge': '#020617', '--chip-glow': 'rgba(2,6,23,.35)' }}><Presentation className="h-4 w-4" /></span>
                  <p className="text-[11px] text-slate-500 mt-2">ค่าสอนทั้งหมด</p>
                  <p className="tabular-nums text-lg font-bold text-slate-900 leading-tight"><MoneyCountUp value={summary.totalEarned} /> <span className="text-xs font-medium text-slate-500">บาท</span></p>
                  <p className="text-[11px] text-slate-500">{summary.totalSessions} คลาส</p>
                </div>
                <FlowConnector dotClass="bg-orange-400" />
                <div className="inc3d-step rounded-xl border border-orange-200 bg-orange-50 p-3 sm:flex-1 min-w-0">
                  <span className={`inc3d-chip h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center ${summary.totalPending > 0 ? 'sa-ring' : ''}`}><Hourglass className={`h-4 w-4 ${summary.totalPending > 0 ? 'sa-hourglass' : ''}`} /></span>
                  <p className="text-[11px] text-orange-700 mt-2">รอการโอน</p>
                  <p className="tabular-nums text-lg font-bold text-slate-900 leading-tight"><MoneyCountUp value={summary.totalPending} /> <span className="text-xs font-medium text-slate-500">บาท</span></p>
                  <p className="text-[11px] text-orange-700/90">{summary.pendingSessionCount > 0 ? `${summary.pendingSessionCount} คลาสรอการโอน` : 'ไม่มียอดค้าง'}</p>
                </div>
                <FlowConnector dotClass="bg-green-500" />
                <div className="inc3d-step rounded-xl border border-green-200 bg-green-50 p-3 sm:flex-1 min-w-0">
                  <span className="inc3d-chip h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-green-700 text-white flex items-center justify-center" style={{ '--chip-edge': '#14532D', '--chip-glow': 'rgba(21,128,61,.4)' }}><BadgeCheck className="h-4 w-4" /></span>
                  <p className="text-[11px] text-green-700 mt-2">รับแล้ว</p>
                  <p className="tabular-nums text-lg font-bold text-slate-900 leading-tight"><MoneyCountUp value={summary.totalPaid} /> <span className="text-xs font-medium text-slate-500">บาท</span></p>
                  <p className="text-[11px] text-green-700/90">โอนแล้ว {payments.length} ครั้ง</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="inc3d-track flex h-3 rounded-full overflow-hidden bg-slate-100">
                  <div className="sa-grow h-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: `${paidPct}%`, animationDelay: '.3s' }} />
                  <div className="sa-grow sa-stripes h-full bg-orange-400" style={{ width: `${summary.totalEarned > 0 ? 100 - paidPct : 0}%`, animationDelay: '.7s' }} />
                </div>
                <div className="flex justify-between text-[11px] mt-1.5">
                  <span className="text-green-700 font-semibold">โอนแล้ว {paidPct}%</span>
                  <span className="text-orange-600 font-semibold">ค้างรับ {summary.totalEarned > 0 ? 100 - paidPct : 0}%</span>
                </div>
              </div>
              {overpaid > 0 && (
                <div className={`${CALLOUT.box} ${CALLOUT.warning} mt-3 text-xs`}>
                  <AlertCircle className={`h-4 w-4 shrink-0 ${CALLOUT_ICON.warning}`} />
                  <p>
                    ยอดโอนรวม {Number(summary.totalTransferred || 0).toLocaleString()} บาท สูงกว่าค่าสอนที่คำนวณจากคลาสที่บันทึกไว้{' '}
                    <b className="tabular-nums">{overpaid.toLocaleString()} บาท</b> (ยอดนี้ไม่นับรวมใน "รับแล้ว")
                    กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs (เต็มความกว้าง) ─────────────────────────────── */}
        <IsoTabs tabs={TABS} value={viewMode} onChange={setViewMode} />

        {/* ══ Tab: Overview ══════════════════════════════════════ */}
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {/* ตัวเลขสรุป 4 ช่อง */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow inc3d-in p-4 min-w-0">
                <div className="flex items-center gap-2"><span className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Receipt className="h-4 w-4" /></span><p className="text-xs text-slate-600 font-medium leading-tight">เฉลี่ยต่อคลาส</p></div>
                <p className="tabular-nums text-xl sm:text-2xl font-bold text-slate-900 mt-2"><MoneyCountUp value={avgPerSession} /> <span className="text-xs font-medium text-slate-500">บาท</span></p>
                <div className="inc3d-track relative mt-4 h-2 rounded-full bg-gradient-to-r from-orange-100 to-orange-300">
                  <span className="inc3d-ball sa-pop absolute top-1/2 h-[18px] w-[18px] -mt-[9px] -ml-[9px] rounded-full" style={{ left: `${avgPos}%`, animationDelay: '.6s' }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 tabular-nums"><span>ต่ำสุด {minEarned.toLocaleString()} บาท</span><span>สูงสุด {maxEarned.toLocaleString()} บาท</span></div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow inc3d-in p-4 min-w-0" style={{ animationDelay: '.05s' }}>
                <div className="flex items-center gap-2"><span className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Timer className="h-4 w-4" /></span><p className="text-xs text-slate-600 font-medium leading-tight">รายได้ต่อชั่วโมง</p></div>
                <p className="tabular-nums text-xl sm:text-2xl font-bold text-slate-900 mt-2"><MoneyCountUp value={perHour} /> <span className="text-xs font-medium text-slate-500">บาท/ชม.</span></p>
                <svg viewBox="0 0 100 54" className="mt-1 h-12 w-full" aria-hidden="true">
                  <defs><linearGradient id="incGauge"><stop offset="0" stopColor="#fbbf24" /><stop offset="1" stopColor="#ea580c" /></linearGradient></defs>
                  <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#eef1f5" strokeWidth="10" strokeLinecap="round" />
                  <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="url(#incGauge)" strokeWidth="10" strokeLinecap="round" pathLength="100"
                    className="sa-draw" style={{ '--len': 100, strokeDasharray: `${Math.min(100, (perHour / Math.max(1, maxPerHour)) * 100)} 100` }} />
                </svg>
                <p className="text-[11px] text-slate-500 -mt-1 text-center">อัตราสูงสุด {maxPerHour} บาท/ชม.</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow inc3d-in p-4 min-w-0" style={{ animationDelay: '.1s' }}>
                <div className="flex items-center gap-2"><span className="h-8 w-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0"><Clock className="h-4 w-4" /></span><p className="text-xs text-slate-600 font-medium leading-tight">ชั่วโมงสอนรวม</p></div>
                <p className="tabular-nums text-xl sm:text-2xl font-bold text-slate-900 mt-2">{Number(totalHours.toFixed(1)).toLocaleString()} <span className="text-xs font-medium text-slate-500">ชม.</span></p>
                <div className="mt-3 flex items-end gap-[3px] h-9">
                  {hourBars.map((m, k) => (
                    <span key={k} className={`inc3d-mini sa-growY flex-1 rounded-t-[4px] rounded-b-[2px] ${k < hourBars.length - 3 ? 'dim' : ''}`} title={`${m.month} ${toBE(m.year)}: ${m.sessions} คลาส`}
                      style={{ height: `${Math.max(8, ((m.sessions || 0) / maxMonthSessions) * 100)}%`, animationDelay: `${k * 0.04}s` }} />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">เทียบเท่า {Math.round(totalHours / 8).toLocaleString()} วันทำงาน (8 ชม./วัน)</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow inc3d-in p-4 min-w-0" style={{ animationDelay: '.15s' }}>
                <div className="flex items-center gap-2"><span className="h-8 w-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0"><Users className="h-4 w-4" /></span><p className="text-xs text-slate-600 font-medium leading-tight">นักเรียนเฉลี่ยต่อคลาส</p></div>
                <p className="tabular-nums text-xl sm:text-2xl font-bold text-slate-900 mt-2">{avgStudents.toFixed(1)} <span className="text-xs font-medium text-slate-500">คน</span></p>
                <div className="mt-3 flex flex-wrap gap-[5px]">
                  {Array.from({ length: Math.min(20, Math.max(12, maxStudents)) }, (_, k) => (
                    <span key={k} className={`sa-pop h-3 w-3 rounded-full ${k < Math.round(avgStudents) ? 'inc3d-person' : 'bg-slate-200'}`} style={{ animationDelay: `${0.3 + k * 0.04}s` }} />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">สูงสุด {maxStudents} คนต่อคลาส</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
              {/* กราฟแท่งรายรับ + เส้นจำนวนคลาส */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow inc3d-in min-w-0 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">รายรับรายเดือน</h2>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-orange-300" />รายรับ</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-amber-400 to-orange-600" />เดือนนี้</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-900" />จำนวนคลาส</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[['all', 'ทั้งหมด'], ...availableYears.map(y => [y, String(toBE(y))])].map(([k, l]) => (
                      <button key={k} onClick={() => setSelectedYear(k)}
                        className={`px-3 min-h-8 rounded-xl text-xs font-medium border transition ${selectedYear === k ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <IsoMonthlyChart key={selectedYear} data={chartData} />
              </div>

              {/* สัดส่วนรายได้ตามคอร์ส */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow inc3d-in p-4 sm:p-5" style={{ animationDelay: '.06s' }}>
                <h2 className="text-base font-bold text-slate-900">สัดส่วนรายได้ตามคอร์ส</h2>
                <p className="text-[11px] text-slate-500">สัดส่วนจากรายรับสะสมทั้งหมด</p>
                <IsoDonut data={donutData} centerValue={courses.length} centerLabel="ที่สอน" />
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500 mb-1.5">แยกตามระดับชั้น</p>
                  <div className="inc3d-track flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                    <span className="sa-grow h-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${summary.totalEarned ? (secondaryTotal / summary.totalEarned) * 100 : 0}%`, animationDelay: '.5s' }} />
                    <span className="sa-grow h-full bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: `${summary.totalEarned ? (elementaryTotal / summary.totalEarned) * 100 : 0}%`, animationDelay: '.8s' }} />
                  </div>
                  <div className="flex justify-between gap-2 text-[11px] mt-1 tabular-nums">
                    <span className="text-orange-600 font-semibold">มัธยม {summary.totalEarned ? Math.round((secondaryTotal / summary.totalEarned) * 100) : 0}% · {secondaryTotal.toLocaleString()} บาท</span>
                    <span className="text-sky-700 font-semibold text-right">ประถม {summary.totalEarned ? Math.round((elementaryTotal / summary.totalEarned) * 100) : 0}% · {elementaryTotal.toLocaleString()} บาท</span>
                  </div>
                </div>
              </div>
            </div>

            <RateCalculator topTier={topTier} tierCounts={tierCounts} />
          </div>
        )}

        {/* ══ Tab: Courses ═══════════════════════════════════════ */}
        {viewMode === 'courses' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="ค้นหาชื่อคอร์ส..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                </div>
                <select className="px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 md:min-w-[180px] max-w-full md:max-w-[240px] truncate"
                  value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">ทุกสถานะ</option>
                  <option value="paid">รับครบแล้ว</option>
                  <option value="pending">ยังไม่ได้รับ</option>
                  <option value="partial">รับบางส่วน</option>
                </select>
                <select className="px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 max-w-full md:max-w-[240px] truncate"
                  value={coursePageSize} onChange={e => setCoursePageSize(Number(e.target.value))}>
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>แสดง {n} รายการ</option>
                  ))}
                </select>
              </div>
            </div>

            {coursePag.paged.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">ไม่พบคอร์สที่ค้นหา</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {coursePag.paged.map((course, idx) => {
                  const status = getCourseStatus(course);
                  const sc = statusConfig[status];
                  const pp = course.totalEarned > 0 ? Math.round((course.paidEarned / course.totalEarned) * 100) : 0;
                  return (
                    <div key={course.courseId} className="sa-rise bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col" style={{ animationDelay: `${Math.min(idx, 8) * 0.04}s` }}>
                      <div className="p-5 border-b border-slate-100 flex-1">
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">{course.courseName}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${LEVEL_BADGE[course.levelType] || LEVEL_BADGE.secondary}`}>
                                {course.levelType === 'elementary' ? 'ประถม' : 'มัธยม'}
                              </span>
                              {course.lastSession && (
                                <span className="text-[11px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />ล่าสุด {formatDate(course.lastSession)}</span>
                              )}
                            </div>
                          </div>
                          <Badge colorClass={sc.bg}>{sc.icon}{sc.label}</Badge>
                        </div>
                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-bold">รับเงินแล้ว <span className="text-slate-400 font-medium ml-1">({course.paidEarned.toLocaleString()}/{course.totalEarned.toLocaleString()} บาท)</span></span>
                            <span className="font-bold text-orange-600">{pp}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <div className="sa-grow h-full bg-gradient-to-r from-orange-400 to-orange-600" style={{ width: `${pp}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50/50">
                        {[
                          [CalendarCheck, 'bg-blue-100 text-blue-600', course.sessions, 'คลาส'],
                          [Check, 'bg-green-100 text-green-600', course.paidEarned.toLocaleString(), 'รับแล้ว (บาท)'],
                          [Clock, 'bg-orange-100 text-orange-600', course.pendingEarned.toLocaleString(), 'ค้างรับ (บาท)'],
                        ].map((item, k) => {
                          const StatIcon = item[0];
                          return (
                            <div key={k} className={`flex items-center gap-2 min-w-0 ${k < 2 ? 'border-r border-slate-200 pr-2' : ''}`}>
                              <div className={`w-8 h-8 rounded-full ${item[1]} flex items-center justify-center shrink-0`}><StatIcon className="w-4 h-4" /></div>
                              <div className="min-w-0">
                                <p className="tabular-nums font-bold text-slate-900 leading-none truncate">{item[2]}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{item[3]}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={() => { setViewMode('sessions'); setSearchQuery(course.courseName); }}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-slate-100 text-sm font-medium text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition">
                        <Eye className="h-3.5 w-3.5" />ดูคลาสทั้งหมด
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Course Pagination */}
            {coursePag.totalPages > 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="ค้นหาชื่อคอร์ส..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                </div>
                <select className="px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 max-w-full md:max-w-[240px] truncate"
                  value={sessionPageSize} onChange={e => setSessionPageSize(Number(e.target.value))}>
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>แสดง {n} รายการ</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">รายละเอียดแต่ละคลาส</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ค่าสอนคิดจาก <span className="font-medium text-slate-700">อัตราต่อคาบ (1.5 ชม.)</span> × จำนวนคาบที่สอนจริง
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
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">ไม่พบคลาสที่ค้นหา</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sessionPag.paged.map(s => {
                    const d = new Date(s.sessionDate);
                    return (
                      <div key={s.tutorCheckinId} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 sm:gap-4 hover:bg-orange-50/40 transition">
                        <div className={`w-12 shrink-0 text-center rounded-xl py-1 ${s.isPaid ? 'bg-slate-50' : 'bg-orange-50'}`}>
                          <p className={`text-[11px] font-semibold ${s.isPaid ? 'text-slate-400' : 'text-orange-500'}`}>{TH_MONTHS_SHORT[d.getMonth()]} {String((d.getFullYear() + 543) % 100).padStart(2, '0')}</p>
                          <p className={`tabular-nums text-base font-bold leading-none ${s.isPaid ? 'text-slate-800' : 'text-orange-600'}`}>{d.getDate()}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{s.courseName}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-0.5">
                            {s.subjectName && <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">{s.subjectName}</span>}
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${LEVEL_BADGE[s.levelType] || LEVEL_BADGE.secondary}`}>{s.levelType === 'elementary' ? 'ประถม' : 'มัธยม'}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.classType === 'substitute' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {s.classType === 'substitute' ? 'รับสอนแทน' : 'คอร์สหลัก'}
                            </span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.actualStudents} คน</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Number(s.durationHours).toFixed(1)} ชม.</span>
                            <span className="text-slate-400" title="อัตราต่อคาบ × (ชั่วโมง ÷ 1.5)">{s.ratePerSession} × ({Number(s.durationHours).toFixed(1)} ÷ 1.5)</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="tabular-nums text-sm font-bold text-slate-900">{s.earnedAmount.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">บาท</span></p>
                          {s.isPaid
                            ? <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold bg-green-50 text-green-700 border-green-200"><Check className="h-3 w-3" />รับแล้ว</span>
                            : s.isPartiallyPaid
                            ? <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold bg-blue-50 text-blue-700 border-blue-200" title={`รับแล้ว ${Number(s.paidAmount || 0).toLocaleString()} บาท`}><AlertCircle className="h-3 w-3" />รับบางส่วน</span>
                            : <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold bg-orange-50 text-orange-700 border-orange-200"><Clock className="h-3 w-3" />ค้างรับ</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-slate-50 border-t-2 border-slate-200">
                <span className="text-sm font-semibold text-slate-700">รวมทั้งหมด ({filteredSessions.length} คลาส)</span>
                <span className="tabular-nums text-sm font-bold text-orange-600">{filteredSessions.reduce((sum, s) => sum + s.earnedAmount, 0).toLocaleString()} บาท</span>
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
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                      <span className="font-semibold text-slate-800 text-sm">สลิปการโอนเงิน</span>
                      <div className="flex items-center gap-2">
                        <a href={slipUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-medium hover:bg-orange-100 transition">
                          <Download className="h-3.5 w-3.5" />เปิดในแท็บใหม่
                        </a>
                        <button onClick={() => setSlipUrl(null)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition font-bold text-base">
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-center bg-slate-50 min-h-[300px]">
                      <img
                        src={slipUrl}
                        alt="สลิปการโอนเงิน"
                        className="max-h-[70vh] max-w-full rounded-lg object-contain shadow"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Header + Filters ── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    ประวัติการรับเงิน
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    {isFiltered ? 'ยอดโอนในช่วงที่เลือก' : 'ยอดโอนทั้งหมด'} <span className="tabular-nums font-bold">{filteredTotal.toLocaleString()} บาท</span> · {filteredPayments.length} ครั้ง
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={historyYear}
                    onChange={e => { setHistoryYear(e.target.value); setHistoryMonth('all'); }}
                    className="px-3 h-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 max-w-full md:max-w-[240px] truncate"
                  >
                    <option value="all">ทุกปี</option>
                    {paymentYears.map(y => <option key={y} value={y}>{toBE(y)}</option>)}
                  </select>
                  <select
                    value={historyMonth}
                    onChange={e => setHistoryMonth(e.target.value)}
                    disabled={historyYear === 'all'}
                    className="px-3 h-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 disabled:opacity-40 disabled:cursor-not-allowed max-w-full md:max-w-[240px] truncate"
                  >
                    <option value="all">ทุกเดือน</option>
                    {monthsInYear.map(m => <option key={m} value={m}>{THAI_MONTHS[m]}</option>)}
                  </select>
                  <ClearFiltersButton
                    show={isFiltered}
                    onClick={() => { setHistoryYear('all'); setHistoryMonth('all'); }}
                  />
                </div>
              </div>

              {overpaid > 0 && (
                <div className={`${CALLOUT.box} ${CALLOUT.warning}`}>
                  <AlertCircle className={`h-5 w-5 shrink-0 ${CALLOUT_ICON.warning}`} />
                  <p>
                    ยอดโอนรวมสูงกว่าค่าสอนที่คำนวณจากคลาสที่บันทึกไว้ <b className="tabular-nums">{overpaid.toLocaleString()} บาท</b>{' '}
                    ระบบนับเป็น "รับแล้ว" ไม่เกินค่าสอนของคลาสที่เกี่ยวข้อง กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบ
                  </p>
                </div>
              )}

              {/* ── ยอดโอนสะสม ── */}
              {filteredPayments.some(p => p.paymentDate) && (
                <div className="sa-rise bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-slate-900">ยอดโอนสะสม</p>
                      <p className="text-[11px] text-slate-500">แต่ละขั้นคือการโอน 1 ครั้ง</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500">โอนเฉลี่ยต่อครั้ง</p>
                      <p className="tabular-nums text-base font-bold text-slate-900">{Math.round(filteredTotal / Math.max(1, filteredPayments.length)).toLocaleString()} <span className="text-xs font-medium text-slate-500">บาท</span></p>
                    </div>
                  </div>
                  <div className="overflow-x-auto sa-scroll"><div className="min-w-[640px]"><PayCumulativeChart payments={filteredPayments} /></div></div>
                </div>
              )}

              {/* ── Timeline ── */}
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
                </div>
              ) : (
                <ol className="relative space-y-3 pl-8 sm:pl-9 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-green-300 before:to-slate-200">
                  {filteredPayments.map((payment, index) => (
                    <li key={payment.tutorPaymentId} className="sa-rise relative" style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}>
                      <span className="absolute -left-8 sm:-left-9 top-4 h-6 w-6 rounded-full bg-green-500 ring-4 ring-green-100 text-white flex items-center justify-center"><Check className="h-3.5 w-3.5" /></span>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="p-4 sm:p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100 flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-[11px] font-semibold text-orange-600 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              โอนเมื่อ {payment.paymentDate
                                ? new Date(payment.paymentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                                : '-'}
                            </p>
                            <p className="tabular-nums text-xl font-bold text-slate-900 mt-0.5">
                              +{Number(payment.paymentCost).toLocaleString()} <span className="text-sm font-medium text-slate-500">บาท</span>
                            </p>
                            {payment.billNo && <p className="text-[11px] text-slate-500">เลขที่ใบจ่าย: {payment.billNo}</p>}
                            {Number(payment.overpaidAmount) > 0 && (
                              <p className="text-[11px] font-semibold text-amber-700 mt-0.5">
                                โอนเกินค่าสอนของคลาสที่เกี่ยวข้อง {Number(payment.overpaidAmount).toLocaleString()} บาท (ค่าสอน {Number(payment.sessionEarned || 0).toLocaleString()} บาท · {payment.sessionCount || 0} คลาส)
                              </p>
                            )}
                          </div>
                          {payment.paymentPicture && (
                            <button
                              onClick={() => setSlipUrl(payment.paymentPicture)}
                              className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition"
                            >
                              <ImageIcon className="h-3.5 w-3.5" />ดูสลิป
                            </button>
                          )}
                        </div>
                        {payment.courses.length > 0 && (
                          <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-semibold">คอร์สที่เกี่ยวข้อง:</span>
                            {payment.courses.map((c, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">{c}</span>
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

    </div>
  );
}
