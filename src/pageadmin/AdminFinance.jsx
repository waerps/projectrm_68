import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { getFileUrl } from '../utils/fileUrl';
import {
    TrendingUp, TrendingDown, Users, Calendar,
    CreditCard, Download, Search, Eye, X,
    Target, Wallet, BarChart3,
    Clock, CheckCircle, AlertCircle, XCircle, Banknote,
    Receipt, User, Phone, ChevronLeft, ChevronRight, PieChart,
    Loader2, RefreshCw, FileText, Inbox,
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import SegmentedControl from "../components/ui/SegmentedControl";
import UIPagination from "../components/ui/Pagination";
import Badge from "../components/ui/Badge";
import { PAGE_TITLE } from "../components/ui/tokens";
import UIEmptyState from "../components/ui/EmptyState";
import { BTN } from "../components/ui/tokens";
import { CALLOUT, CALLOUT_ICON } from "../components/ui/tokens";
import { STAT_LABEL, STAT_NUM, STAT_VALUE, STAT_UNIT, STAT_SUB } from "../components/ui/tokens";

const FINANCE_API = `${API_URL}/api/admin/finance`;
const ITEMS_PER_PAGE = 10;

const DONUT_COLORS = [
    { base: '#f97316', light: '#fdba74' },
    { base: '#3b82f6', light: '#93c5fd' },
    { base: '#10b981', light: '#6ee7b7' },
    { base: '#f59e0b', light: '#fcd34d' },
    { base: '#a855f7', light: '#d8b4fe' },
    { base: '#94a3b8', light: '#cbd5e1' },
];

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — one system, reused everywhere. Nothing below this block
   should declare its own one-off spacing, radius, border or shadow value.
   (อิงจาก AdminStudent.jsx / AdminTutors.jsx / AdminDashboard.jsx เพื่อให้เป็นระบบเดียวกัน)
   ────────────────────────────────────────────────────────────────────── */
const T = {
    card: 'bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition',
    cardPad: 'p-4 sm:p-6',
    cardPadSm: 'p-4',
    transition: 'transition duration-200 ease-out',
    title: 'text-lg font-bold text-slate-900',
    subtitle: 'text-sm text-slate-500',
    label: 'text-xs font-medium text-slate-500',
    value: STAT_VALUE,
    caption: 'text-[11px] text-slate-400',
    chartHeight: 260,
};

const CHART_TICK = { fontSize: 12, fill: '#94a3b8' };
const CHART_TOOLTIP_STYLE = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 };

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const formatDate = (d) => {
    if (!d) return '—';
    try {
        const raw = String(d);
        const normalized = /^\d{8}$/.test(raw)
            ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00`
            : raw.includes('T') ? raw : `${raw}T00:00:00`;
        const date = new Date(normalized);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '—'; }
};

const formatMoney = (v) => `฿${Number(v || 0).toLocaleString()}`;

/* ─── การ์ดเอียงตามเมาส์ + แสงเรือง (ชุดเดียวกับ Dashboard/TutorExamAnalytics) ── */
const tiltMove = (e) => {
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
    el.style.transform = `perspective(700px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-2px)`;
};
const tiltLeave = (e) => { e.currentTarget.style.transform = ''; };

/* ─── useCountUp — เลขวิ่งขึ้นแบบ ease-out, ใช้กับตัวเลขในฮีโร่ ───────────── */
function useCountUp(target, { duration = 900, active = true } = {}) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!active) return;
        const end = Number(target) || 0;
        if (end === 0) { setValue(0); return; }
        let raf;
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
        const step = (now) => {
            const p = ease((now - start) / duration);
            setValue(Math.round(end * p));
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, active]);
    return value;
}

const studentDisplayName = (t) => t.Nickname || `${t.Firstname || ''} ${t.Lastname || ''}`.trim() || '—';

const txDescription = (t) => {
    const course = t.CourseName || 'ไม่ระบุคอร์ส';
    const term = t.Term_Name ? ` (${t.Term_Name})` : '';
    return `${course}${term} - ${studentDisplayName(t)}`;
};

function getStatusStyle(name = '') {
    if (name.includes('รอ')) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock };
    if (name.includes('ยกเลิก')) return { text: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', icon: XCircle };
    if (name.includes('เกิน') || name.includes('ค้าง')) return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle };
    return { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle };
}

function StatusBadge({ name }) {
    const { bg, text, border, icon: Icon } = getStatusStyle(name || '');
    return (
        <Badge colorClass={`${bg} ${text} ${border}`} icon={Icon}>{name || 'ไม่ระบุสถานะ'}</Badge>
    );
}

/* ─── TypeMixBadge — ตัวต่อตัว/กลุ่ม/ผสม สำหรับรอบจ่ายค่าติวเตอร์ ──────────── */
function TypeMixBadge({ typeMix }) {
    if (!typeMix) return null;
    const style = typeMix === 'single'
        ? 'bg-orange-50 text-orange-700 border-orange-200'
        : typeMix === 'mixed'
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-blue-50 text-blue-700 border-blue-200';
    const label = typeMix === 'single' ? 'ตัวต่อตัว' : typeMix === 'mixed' ? 'ผสม' : 'กลุ่ม';
    return <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style}`}>{label}</span>;
}

/* ─── Shared: single Skeleton used by every loading state ───────────────
   Same shimmer block, same radius, same border — chart / card / table
   loading all route through this so nothing looks like a different system. */
function Skeleton({ className = '' }) {
    return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

function SkeletonBlock({ height = 'h-64' }) {
    return (
        <div className={`w-full ${height} flex flex-col gap-3 justify-center px-2`}>
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-full w-full" />
        </div>
    );
}

/* ─── Shared: single Error state used by every API-backed section ──────── */
function ErrorState({ message, onRetry, minHeight }) {
    return (
        <div className={`flex flex-col items-center justify-center ${minHeight} text-center px-4`}>
            <AlertCircle className="h-5 w-5 text-red-500 mb-2" />
            <p className={`${T.caption} text-slate-500 mb-3`}>{message}</p>
            <button
                onClick={onRetry}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 ${T.transition}`}
            >
                <RefreshCw className="h-3.5 w-3.5" />ลองใหม่
            </button>
        </div>
    );
}

/* ─── Shared: Empty state — icon + message + suggestion, never fake data ── */
function EmptyState({ icon = Inbox, message, suggestion }) {
    // ใช้หน้าว่างกลางของระบบ (components/ui/EmptyState)
    return <UIEmptyState icon={icon} title={message} description={suggestion} className="border-0" />;
}

/* ─── Reusable Loading / Error wrapper for each API-backed section ──────── */
function ApiState({ loading, error, onRetry, minHeight = 'h-40', skeletonHeight, children }) {
    if (loading) return <SkeletonBlock height={skeletonHeight || minHeight} />;
    if (error) return <ErrorState message={error} onRetry={onRetry} minHeight={minHeight} />;
    return children;
}

/* ─── Shared: SectionCard — every card in the dashboard is this ─────────
   Equal padding, equal radius, equal border, equal shadow. Optional
   icon+title header keeps every section's hierarchy identical. */
function SectionCard({ title, icon: Icon, action, children, className = '', bodyClassName = '' }) {
    return (
        <div className={`${T.card} ${T.cardPad} flex flex-col h-full min-w-0 overflow-x-clip ${className}`}>
            {title && (
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className={`${T.title} flex items-center gap-2.5`}>
                        {Icon && (
                            <span className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                <Icon className="h-4 w-4 text-orange-600" />
                            </span>
                        )}
                        {title}
                    </h3>
                    {action}
                </div>
            )}
            <div className={`flex-1 min-h-0 ${bodyClassName}`}>{children}</div>
        </div>
    );
}

/* ─── Shared: KPICard — สี icon square ตามระดับความสำคัญ (tone) เหมือน
   StatCard ในหน้า Dashboard / การ์ดสรุปในหน้านักเรียน-ติวเตอร์ ─────────── */
function KPICard({ label, value, sub, icon: Icon, tone = 'neutral' }) {
    const toneBg = {
        neutral: 'bg-slate-400',
        green: 'bg-emerald-500',
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        orange: 'bg-orange-600',
        purple: 'bg-purple-500',
    }[tone];

    return (
        <div
            onMouseMove={tiltMove}
            onMouseLeave={tiltLeave}
            className={`sa-tilt relative overflow-hidden flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-200 ${T.transition} h-full min-h-[96px]`}
        >
            <span className="sa-glow" />
            {Icon && <Icon className="absolute -right-3 -top-3 h-16 w-16 text-slate-50 pointer-events-none" />}
            {Icon && (
                <div className={`relative h-11 w-11 rounded-xl ${toneBg} flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            )}
            <div className="relative min-w-0 flex-1">
                <p className={`${T.label} leading-snug`}>{label}</p>
                <p className={`${STAT_VALUE} truncate mt-0.5`}>{value}</p>
                {sub && <p className={`${STAT_SUB} mt-0.5 line-clamp-2 leading-snug`}>{sub}</p>}
            </div>
        </div>
    );
}

/* ─── Donut3D — โทนเดียวกับ CourseStatusDonut ใน Dashboard ──────────── */
function Donut3D({ idPrefix, data, centerValue, centerLabel, valueFormatter = (v) => v, size = 200 }) {
    const [hoverIdx, setHoverIdx] = useState(null);
    if (!data.length) return <EmptyState message="ยังไม่มีข้อมูล" />;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const topValue = sorted[0]?.value ?? 0;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <div className="absolute inset-4 rounded-full bg-slate-300/20 blur-md translate-y-1" />
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <defs>
                            {sorted.map((d, i) => (
                                <radialGradient id={`${idPrefix}-${i}`} key={i} cx="35%" cy="30%" r="75%">
                                    <stop offset="0%" stopColor={d.light} />
                                    <stop offset="100%" stopColor={d.base} />
                                </radialGradient>
                            ))}
                        </defs>
                        <Pie
                            data={sorted}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={size * 0.28}
                            outerRadius={size * 0.49}
                            paddingAngle={3}
                            cornerRadius={4}
                            stroke="#ffffff"
                            strokeWidth={2}
                            style={{ filter: 'drop-shadow(0 4px 6px rgba(15,23,42,0.14))' }}
                            isAnimationActive={false}
                            onMouseEnter={(_, i) => setHoverIdx(i)}
                            onMouseLeave={() => setHoverIdx(null)}
                        >
                            {sorted.map((d, i) => (
                                <Cell
                                    key={i}
                                    fill={`url(#${idPrefix}-${i})`}
                                    style={{
                                        filter: hoverIdx === i
                                            ? 'brightness(1.08) drop-shadow(0 6px 12px rgba(15,23,42,0.25))'
                                            : d.value === topValue ? 'drop-shadow(0 5px 7px rgba(15,23,42,0.18))' : undefined,
                                        transform: hoverIdx === i ? 'scale(1.035)' : undefined,
                                        transformOrigin: 'center',
                                        transition: 'filter .15s ease, transform .15s ease',
                                        cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={CHART_TOOLTIP_STYLE} />
                    </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className={STAT_VALUE}>{centerValue}</p>
                    <p className={STAT_SUB}>{centerLabel}</p>
                </div>
            </div>
            <div className="w-full max-w-xs space-y-1">
                {sorted.map((d, i) => (
                    <div
                        key={i}
                        onMouseEnter={() => setHoverIdx(i)}
                        onMouseLeave={() => setHoverIdx(null)}
                        className={`flex items-center justify-between text-xs py-1 px-1.5 -mx-1.5 rounded-lg cursor-default transition-colors ${hoverIdx === i ? 'bg-slate-50' : ''}`}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.base }} />
                            <span className={`text-slate-600 truncate ${hoverIdx === i ? 'font-semibold text-slate-800' : ''}`}>{d.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 shrink-0">{valueFormatter(d.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── HeroStat — การ์ดกระจกในฮีโร่ พร้อมเลขวิ่งขึ้น ───────────────────── */
function HeroStat({ label, icon: Icon, value, tone, ready }) {
    const shown = useCountUp(value, { active: ready });
    return (
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-white/70 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
            <p className={`${STAT_LABEL} flex items-center gap-1`}>
                {Icon && <Icon className="h-3.5 w-3.5" />}{label}
            </p>
            <p className={`${STAT_NUM} mt-1 ${tone || 'text-slate-900'}`}>
                ฿{Number(shown).toLocaleString()}
            </p>
        </div>
    );
}

/* ─── Hero: ไล่เฉดอ่อนๆ + การ์ดกระจกลอย + เลขวิ่งขึ้น (สอดคล้องกับดีไซน์ที่ตกลงกัน) ── */
function HeroSummary({ loading, error, onRetry, revenue, revenueGrowth, cashNet, cashMargin, tutorPayable, tutorAccrued, overdue, overdueCount }) {
    const ready = !loading && !error;
    return (
        <div className="relative overflow-hidden rounded-3xl border border-orange-100 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_30px_-10px_rgba(234,88,12,0.30)] p-5 sm:p-7" style={{ background: 'linear-gradient(135deg,#fff7ed,#fff 45%,#eff6ff)' }}>
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-orange-300/25 blur-3xl pointer-events-none" />
            <div className="absolute left-1/4 -bottom-28 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />
            <div className="relative">
                <div className="flex items-center justify-between mb-1">
                    <div>
                        <h2 className={T.title}>ภาพรวมเดือนนี้</h2>
                        <p className={T.subtitle}>สรุปสถานะการเงินล่าสุด</p>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-semibold shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />ข้อมูลสด
                    </span>
                </div>

                <ApiState loading={loading} error={error} onRetry={onRetry} minHeight="h-28" skeletonHeight="h-28">
                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        <HeroStat label="รายรับเดือนนี้" icon={Wallet} value={revenue} ready={ready} />
                        <HeroStat label="กระแสเงินสดสุทธิ" icon={TrendingUp} value={cashNet} tone={cashNet < 0 ? 'text-red-600' : 'text-slate-900'} ready={ready} />
                        <HeroStat label="ค่าติวเตอร์ค้างจ่าย" icon={Banknote} value={tutorPayable} tone={tutorPayable > 0 ? 'text-orange-600' : 'text-slate-900'} ready={ready} />
                        <HeroStat label="ยอดเกินกำหนด" icon={AlertCircle} value={overdue} tone={overdue > 0 ? 'text-red-600' : 'text-slate-900'} ready={ready} />
                    </div>
                </ApiState>
            </div>
        </div>
    );
}

/* ─── Transaction Row ────────────────────────────────────────────────── */
function TransactionRow({ txn, onView }) {
    return (
        <tr className={`hover:bg-orange-50/40 ${T.transition}`}>
            <td className="px-4 py-3">
                <span className="tabular-nums text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    #{txn.StudentPaymentId}
                </span>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-900 leading-tight max-w-[220px] truncate">{txDescription(txn)}</p>
                <p className={`${T.caption} mt-0.5 flex items-center gap-1`}>
                    <Calendar className="h-3 w-3" />{formatDate(txn.PaymentDate)}
                </p>
            </td>
            <td className="px-4 py-3">
                <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                    {txn.CourseTypeName || txn.Course_Type || '—'}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {studentDisplayName(txn)}
                </div>
                {txn.PhoneNo && (
                    <div className={`flex items-center gap-1.5 ${T.caption} mt-0.5`}>
                        <Phone className="h-3 w-3 shrink-0" />{txn.PhoneNo}
                    </div>
                )}
            </td>
            <td className="px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {txn.PaymentType || '—'}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <p className="text-sm font-bold text-green-600">+{formatMoney(txn.Price)}</p>
            </td>
            <td className="px-4 py-3"><StatusBadge name={txn.Status_Payment_Name} /></td>
            <td className="px-4 py-3">
                <button
                    onClick={() => onView(txn.StudentPaymentId)}
                    className={`p-1.5 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 ${T.transition} min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center`}
                    title="ดูรายละเอียด"
                >
                    <Eye className="h-3.5 w-3.5" />
                </button>
            </td>
        </tr>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════ */
export default function AdminFinance() {
    const [selectedTab, setSelectedTab] = useState('overview');

    /* summary */
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState(null);

    /* monthly chart */
    const [monthly, setMonthly] = useState([]);
    const [monthlyLoading, setMonthlyLoading] = useState(true);
    const [monthlyError, setMonthlyError] = useState(null);

    /* pie charts */
    const [charts, setCharts] = useState({ byTerm: [], byStatus: [], installmentStatuses: [], bySingleBundle: [], topSingleCourses: [], topBundleCourses: [] });
    const [chartsLoading, setChartsLoading] = useState(true);
    const [chartsError, setChartsError] = useState(null);

    /* filters meta */
    const [filtersMeta, setFiltersMeta] = useState({ terms: [], statuses: [], paymentTypes: [], courses: [] });
    const [filtersLoading, setFiltersLoading] = useState(true);
    const [filtersError, setFiltersError] = useState(null);

    /* transactions */
    const [txData, setTxData] = useState([]);
    const [txPagination, setTxPagination] = useState({ page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 1 });
    const [txLoading, setTxLoading] = useState(true);
    const [txError, setTxError] = useState(null);
    const [transactionKind, setTransactionKind] = useState('student');
    const [tutorData, setTutorData] = useState([]);
    const [tutorSummary, setTutorSummary] = useState({ unpaidAmount: 0, unpaidCount: 0, paidAmount: 0, paidCount: 0 });
    const [tutorLoading, setTutorLoading] = useState(false);
    const [tutorError, setTutorError] = useState(null);
    const [payoutItem, setPayoutItem] = useState(null);
    const [tutorDetailItem, setTutorDetailItem] = useState(null);

    /* filters state */
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState(''); // yyyy-mm from <input type="month">, empty = all
    const [orderStatus, setOrderStatus] = useState('all');
    const [paymentPlanFilter, setPaymentPlanFilter] = useState('all');
    const [courseTypeFilter, setCourseTypeFilter] = useState('all'); // 'all' | 'single' | 'bundle' — แยกคอร์สเดี่ยว/คอร์สรวม
    const [tutorStatus, setTutorStatus] = useState('all');
    const [courseId, setCourseId] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [viewTxId, setViewTxId] = useState(null);
    const [missingPriceCount, setMissingPriceCount] = useState(0);

    /* ── Fetchers (unchanged endpoints / params — presentation layer only) ── */
    const fetchSummary = () => {
        setSummaryLoading(true); setSummaryError(null);
        axios.get(`${FINANCE_API}/summary`)
            .then(r => setSummary(r.data))
            .catch(e => setSummaryError(e.response?.data?.message || 'โหลดข้อมูลสรุปการเงินไม่สำเร็จ'))
            .finally(() => setSummaryLoading(false));
    };

    const fetchMonthly = () => {
        setMonthlyLoading(true); setMonthlyError(null);
        axios.get(`${FINANCE_API}/monthly`, { params: { months: 6 } })
            .then(r => setMonthly(r.data))
            .catch(e => setMonthlyError(e.response?.data?.message || 'โหลดข้อมูลรายเดือนไม่สำเร็จ'))
            .finally(() => setMonthlyLoading(false));
    };

    const fetchCharts = () => {
        setChartsLoading(true); setChartsError(null);
        axios.get(`${FINANCE_API}/charts`)
            .then(r => setCharts(r.data))
            .catch(e => setChartsError(e.response?.data?.message || 'โหลดข้อมูลกราฟไม่สำเร็จ'))
            .finally(() => setChartsLoading(false));
    };

    const fetchFiltersMeta = () => {
        setFiltersLoading(true); setFiltersError(null);
        axios.get(`${FINANCE_API}/filters-meta`)
            .then(r => setFiltersMeta(r.data))
            .catch(e => setFiltersError(e.response?.data?.message || 'โหลดตัวเลือกตัวกรองไม่สำเร็จ'))
            .finally(() => setFiltersLoading(false));
    };

    const buildTxParams = (withPaging) => {
        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (monthFilter) params.month = monthFilter;
        if (orderStatus !== 'all') params.orderStatus = orderStatus;
        if (paymentPlanFilter !== 'all') params.paymentPlan = paymentPlanFilter;
        if (courseTypeFilter !== 'all') params.courseType = courseTypeFilter;
        if (courseId !== 'all') params.courseId = courseId;
        if (withPaging) {
            params.page = currentPage;
            params.limit = ITEMS_PER_PAGE;
        }
        return params;
    };

    const fetchTransactions = () => {
        setTxLoading(true); setTxError(null);
        axios.get(`${FINANCE_API}/student-transactions`, { params: buildTxParams(true) })
            .then(r => {
                setTxData(r.data.data || []);
                setTxPagination(r.data.pagination || { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 1 });
            })
            .catch(e => setTxError(e.response?.data?.message || 'โหลดรายการธุรกรรมไม่สำเร็จ'))
            .finally(() => setTxLoading(false));
    };

    const fetchTutorPayables = () => {
        setTutorLoading(true); setTutorError(null);
        axios.get(`${FINANCE_API}/tutor-payables`, {
            params: {
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
                ...(monthFilter ? { month: monthFilter } : {}),
                ...(tutorStatus !== 'all' ? { status: tutorStatus } : {}),
            }
        }).then(r => {
            setTutorData(r.data.data || []);
            setTutorSummary(r.data.summary || { unpaidAmount: 0, unpaidCount: 0, paidAmount: 0, paidCount: 0 });
        }).catch(e => setTutorError(e.response?.data?.message || 'โหลดรายการค่าติวเตอร์ไม่สำเร็จ'))
            .finally(() => setTutorLoading(false));
    };

    /* ── Effects ───────────────────────────────────────────────────────── */
    useEffect(() => { fetchSummary(); }, []);
    useEffect(() => { fetchMonthly(); }, []);
    useEffect(() => { fetchCharts(); }, []);
    useEffect(() => { fetchFiltersMeta(); }, []);
    useEffect(() => {
        axios.get(`${FINANCE_API}/missing-price`)
            .then(r => setMissingPriceCount(r.data?.count || 0))
            .catch(() => { });
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, monthFilter, orderStatus, paymentPlanFilter, courseTypeFilter, courseId]);

    useEffect(() => {
        if (transactionKind === 'student') fetchTransactions();
        else fetchTutorPayables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactionKind, debouncedSearch, monthFilter, orderStatus, paymentPlanFilter, courseTypeFilter, tutorStatus, courseId, currentPage]);

    /* ── Derived values (same arithmetic as before — no new business logic) ── */
    const monthlyRevenue = summary?.monthlyRevenue ?? 0;
    const monthlyProfit = summary?.monthlyProfit ?? 0;
    const totalRevenueAllTime = summary?.totalRevenueAllTime ?? 0;
    const paidEnrollCount = summary?.paidEnrollCount ?? 0;
    const totalEnrollCount = summary?.totalEnrollCount ?? 0;
    const outstandingTotalAmount = summary?.outstandingTotalAmount ?? 0;
    const outstandingEnrollCount = summary?.outstandingEnrollCount ?? 0;
    const monthlyPayingStudentCount = summary?.monthlyPayingStudentCount ?? 0;
    const tutorPayableOutstanding = summary?.tutorPayableOutstanding ?? 0;
    const monthlyTutorAccrued = summary?.monthlyTutorAccrued ?? 0;
    const overdueAmount = summary?.overdueAmount ?? 0;
    const overdueInstallmentCount = summary?.overdueInstallmentCount ?? 0;
    const onTimePaymentRate = summary?.onTimePaymentRate ?? null;
    const paymentPlanMix = summary?.paymentPlanMix || {
        full: { orderCount: 0, paidAmount: 0 },
        installment: { orderCount: 0, paidAmount: 0 },
    };

    const profitMargin = monthlyRevenue > 0
        ? Math.round((monthlyProfit / monthlyRevenue) * 1000) / 10
        : null;

    const revenueGrowth = (() => {
        if (monthly.length < 2) return null;
        const prev = monthly[monthly.length - 2].revenue;
        const curr = monthly[monthly.length - 1].revenue;
        if (!prev) return null;
        return Math.round(((curr - prev) / prev) * 1000) / 10;
    })();

    const avgRevenuePerStudent = monthlyPayingStudentCount > 0
        ? Math.round(monthlyRevenue / monthlyPayingStudentCount)
        : 0;
    const paidRate = totalEnrollCount > 0 ? Math.round((paidEnrollCount / totalEnrollCount) * 100) : 0;

    const monthlyChartData = monthly.map(m => ({
        month: m.label,
        revenue: m.revenue,
        expenses: m.expense,
        profit: m.profit,
        profitTrend: m.hasActivity ? m.profit : null,
        bundleRevenue: m.bundleRevenue ?? Math.max((m.revenue || 0) - (m.singleRevenue || 0), 0),
        singleRevenue: m.singleRevenue || 0,
    }));

    const installmentStatusData = (charts.installmentStatuses || []).map((c, i) => ({
        name: c.label,
        value: Number(c.count) || 0,
        ...DONUT_COLORS[i % DONUT_COLORS.length],
    }));

    const installmentTotalCount = installmentStatusData.reduce((s, d) => s + d.value, 0);

    // ⚠️ ใหม่: รายรับแยก "คอร์สรวม" vs "คอร์สเดี่ยว" — คนละมิติกับ revenueByCourseType ด้านบน (นั่นคือแยกตามหมวดวิชา)
    const SINGLE_BUNDLE_COLOR = { single: DONUT_COLORS[0], bundle: DONUT_COLORS[1] };
    const revenueBySingleBundle = (charts.bySingleBundle || []).map((c) => ({
        name: c.CourseType === 'single' ? 'คอร์สเดี่ยว' : 'คอร์สรวม',
        value: Number(c.revenue) || 0,
        ...(SINGLE_BUNDLE_COLOR[c.CourseType] || SINGLE_BUNDLE_COLOR.bundle),
    }));
    const revenueBySingleBundleTotal = revenueBySingleBundle.reduce((s, d) => s + d.value, 0);
    const singleRevenueShare = revenueBySingleBundleTotal > 0
        ? Math.round(((revenueBySingleBundle.find(d => d.name === 'คอร์สเดี่ยว')?.value || 0) / revenueBySingleBundleTotal) * 1000) / 10
        : null;

    // ⚠️ ใหม่: 5 คอร์สรวมที่สร้างรายรับสูงสุด — แยกจากคอร์สเดี่ยวโดยเฉพาะ ไม่นำมาปะปนกัน
    const topBundleCourseData = (charts.topBundleCourses || []).map(c => ({
        name: c.CourseName,
        revenue: Number(c.revenue) || 0,
    }));

    // ⚠️ ใหม่: 5 คอร์สเดี่ยวขายดีที่สุด พร้อมวิชา/ระดับชั้น — ตอบคำถาม "วิชาไหน ป.ไหนของคอร์สเดี่ยวขายดี"
    const topSingleCourseData = (charts.topSingleCourses || []).map(c => ({
        name: [c.Subjects, c.GradeLevelDetail].filter(Boolean).join(' · ') || c.CourseName,
        courseName: c.CourseName,
        revenue: Number(c.revenue) || 0,
    }));

    const fullOrderCount = Number(paymentPlanMix.full?.orderCount || 0);
    const installmentOrderCount = Number(paymentPlanMix.installment?.orderCount || 0);
    const activeOrderCount = fullOrderCount + installmentOrderCount;
    const fullPlanPercent = activeOrderCount > 0 ? Math.round((fullOrderCount / activeOrderCount) * 100) : 0;

    const totalPages = txPagination.totalPages || 1;
    const currentPageNum = txPagination.page || 1;
    const totalTx = txPagination.total || 0;

    return (
        <div className="space-y-6 px-4 lg:px-0">

            {/* ── Page header ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={`${PAGE_TITLE}`}>การเงินสถาบัน</h1>
                    <p className={`${T.subtitle} mt-1`}>ภาพรวมรายรับ-รายจ่าย และจัดการธุรกรรมทั้งหมด</p>
                </div>
                <SegmentedControl
                    value={selectedTab}
                    onChange={setSelectedTab}
                    options={[
                        { id: 'overview', label: 'สรุปภาพรวม', icon: BarChart3 },
                        { id: 'transactions', label: 'รายการธุรกรรม', icon: Receipt },
                    ]}
                />
            </div>

            {missingPriceCount > 0 && (
                <div className={`${CALLOUT.box} ${CALLOUT.warning}`}>
                    <AlertCircle className={`h-5 w-5 shrink-0 ${CALLOUT_ICON.warning}`} />
                    <p>พบ {missingPriceCount} รายการลงทะเบียนที่ยังไม่ได้กรอกราคา (FullPrice/ส่วนลด) — จะไม่ถูกนับทั้งใน "จ่ายแล้ว" และ "ค้างชำระ" จนกว่าจะกรอกราคาให้ครบ</p>
                </div>
            )}

            {/* ── Hero ── */}
            <HeroSummary
                loading={summaryLoading}
                error={summaryError}
                onRetry={fetchSummary}
                revenue={monthlyRevenue}
                revenueGrowth={revenueGrowth}
                cashNet={monthlyProfit}
                cashMargin={profitMargin}
                tutorPayable={tutorPayableOutstanding}
                tutorAccrued={monthlyTutorAccrued}
                overdue={overdueAmount}
                overdueCount={overdueInstallmentCount}
            />

            {/* ── Secondary KPIs ── */}
            <ApiState loading={summaryLoading} error={summaryError} onRetry={fetchSummary} minHeight="h-28" skeletonHeight="h-28">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <KPICard label="รายรับสะสม" value={formatMoney(totalRevenueAllTime)} icon={Banknote} tone="orange" />
                    <KPICard label="ยอดคงเหลือ (ผ่อน)" value={formatMoney(outstandingTotalAmount)} icon={Clock} tone="blue" />
                    <KPICard label="นักเรียนที่ชำระแล้ว" value={<>{paidEnrollCount} / {totalEnrollCount}<span className={STAT_UNIT}>คน</span></>} icon={Users} tone="purple" />
                    <KPICard label="ชำระตรงเวลา" value={onTimePaymentRate === null ? '—' : <>{onTimePaymentRate}<span className="ml-0.5 text-xs font-medium text-slate-500">%</span></>} icon={CheckCircle} tone="green" />
                </div>
            </ApiState>

            {/* ── Overview Tab ── */}
            {selectedTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SectionCard title="รายรับ - เงินจ่ายติวเตอร์ (6 เดือน)" icon={BarChart3}>
                            <ApiState loading={monthlyLoading} error={monthlyError} onRetry={fetchMonthly} minHeight="h-64" skeletonHeight="h-64">
                                <ResponsiveContainer width="100%" height={T.chartHeight}>
                                    <BarChart data={monthlyChartData} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={v => formatMoney(v)} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar dataKey="revenue" name="รายรับ" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="expenses" name="จ่ายติวเตอร์แล้ว" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="profit" name="เงินสดสุทธิ" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ApiState>
                        </SectionCard>

                        <SectionCard title="แนวโน้มกระแสเงินสดสุทธิ" icon={TrendingUp}>
                            <ApiState loading={monthlyLoading} error={monthlyError} onRetry={fetchMonthly} minHeight="h-64" skeletonHeight="h-64">
                                <ResponsiveContainer width="100%" height={T.chartHeight}>
                                    <LineChart data={monthlyChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={v => formatMoney(v)} />
                                        <Line type="monotone" dataKey="profitTrend" stroke="#f97316" strokeWidth={2.5} name="เงินสดสุทธิ" dot={{ fill: '#f97316', r: 5, strokeWidth: 0 }} connectNulls={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ApiState>
                        </SectionCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SectionCard
                            title="คอร์สรวม vs คอร์สเดี่ยว"
                            icon={PieChart}
                            className="border-orange-200"
                            action={<span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">ใหม่</span>}
                        >
                            <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-64" skeletonHeight="h-64">
                                {revenueBySingleBundle.length === 0 ? (
                                    <EmptyState message="ยังไม่มีข้อมูลรายรับ" suggestion="ข้อมูลจะแสดงเมื่อมีการชำระเงินเข้ามาในระบบ" />
                                ) : (
                                    <Donut3D idPrefix="singleBundleDonut" data={revenueBySingleBundle} centerValue={singleRevenueShare === null ? '—' : `${singleRevenueShare}%`} centerLabel="สัดส่วนคอร์สเดี่ยว" valueFormatter={formatMoney} />
                                )}
                            </ApiState>
                        </SectionCard>

                        <SectionCard title="สถานะงวดผ่อน" icon={Wallet}>
                            <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-64" skeletonHeight="h-64">
                                {installmentStatusData.length === 0 ? (
                                    <EmptyState message="ยังไม่มีแผนผ่อนที่เริ่มชำระ" suggestion="ไม่นับรายการที่เพียงสร้าง QR แล้วออก" />
                                ) : (
                                    <Donut3D idPrefix="installmentDonut" data={installmentStatusData} centerValue={installmentTotalCount} centerLabel="งวดทั้งหมด" valueFormatter={(v) => `${v} งวด`} />
                                )}
                            </ApiState>
                        </SectionCard>
                    </div>

                    <SectionCard title="แนวโน้มรายรับ 6 เดือน (คอร์สรวม vs คอร์สเดี่ยว)" icon={BarChart3}>
                        <p className={`${T.caption} -mt-2 mb-2`}>ใหม่ — แยกให้เห็นว่าคอร์สเดี่ยวสมทบรายรับเท่าไรในแต่ละเดือน</p>
                        <ApiState loading={monthlyLoading} error={monthlyError} onRetry={fetchMonthly} minHeight="h-64" skeletonHeight="h-64">
                            <ResponsiveContainer width="100%" height={T.chartHeight}>
                                <BarChart data={monthlyChartData} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
                                    <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={v => formatMoney(v)} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="bundleRevenue" name="คอร์สรวม" stackId="rev" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="singleRevenue" name="คอร์สเดี่ยว" stackId="rev" fill="#f97316" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ApiState>
                    </SectionCard>

                    <SectionCard title="5 อันดับคอร์สรวมที่สร้างรายรับสูงสุด" icon={TrendingUp}>
                        <p className={`${T.caption} -mt-2 mb-2`}>แสดงเฉพาะคอร์สรวม 5 อันดับแรกที่สร้างรายรับสูงสุด แยกออกจากคอร์สเดี่ยวโดยเฉพาะ ไม่นำมารวมกัน</p>
                        <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-64" skeletonHeight="h-64">
                            {topBundleCourseData.length === 0 ? (
                                <EmptyState message="ยังไม่มีข้อมูลรายรับคอร์สรวม" suggestion="จะแสดงเมื่อมีการชำระเงินคอร์สรวมเข้ามาในระบบ" />
                            ) : (
                                <ResponsiveContainer width="100%" height={Math.max(240, topBundleCourseData.length * 56)}>
                                    <BarChart data={topBundleCourseData} layout="vertical" margin={{ top: 8, left: 12, right: 30, bottom: 8 }}>
                                        <defs>
                                            <linearGradient id="topCourseBarBundle" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#93c5fd" />
                                                <stop offset="100%" stopColor="#2563eb" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" tick={CHART_TICK} tickFormatter={value => `฿${Number(value).toLocaleString()}`} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" width={180} tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [formatMoney(v), 'รายรับ (คอร์สรวม)']} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="revenue" name="รายรับ" fill="url(#topCourseBarBundle)" radius={[0, 10, 10, 0]} style={{ filter: 'drop-shadow(1px 2px 3px rgba(37,99,235,0.2))' }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ApiState>
                    </SectionCard>

                    <SectionCard
                        title="5 อันดับคอร์สเดี่ยวที่สร้างรายรับสูงสุด (แยกตามวิชาและระดับชั้น)"
                        icon={User}
                        className="border-orange-200"
                        action={<span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">ใหม่</span>}
                    >
                        <p className={`${T.caption} -mt-2 mb-2`}>แสดงข้อมูลวิชาและระดับชั้นของคอร์สเดี่ยว 5 อันดับแรกที่สร้างรายรับสูงสุดโดยเฉพาะ แยกออกจากคอร์สรวมอย่างชัดเจน</p>
                        <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-56" skeletonHeight="h-56">
                            {topSingleCourseData.length === 0 ? (
                                <EmptyState message="ยังไม่มีข้อมูลรายรับคอร์สเดี่ยว" suggestion="จะแสดงเมื่อมีการชำระเงินคอร์สเดี่ยวเข้ามาในระบบ" />
                            ) : (
                                <ResponsiveContainer width="100%" height={Math.max(200, topSingleCourseData.length * 56)}>
                                    <BarChart data={topSingleCourseData} layout="vertical" margin={{ top: 8, left: 12, right: 30, bottom: 8 }}>
                                        <defs>
                                            <linearGradient id="topSingleBarFill" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#fdba74" />
                                                <stop offset="100%" stopColor="#ea580c" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" tick={CHART_TICK} tickFormatter={value => `฿${Number(value).toLocaleString()}`} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" width={190} tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v, n, p) => [formatMoney(v), p.payload.courseName]} cursor={{ fill: '#fff7ed' }} />
                                        <Bar dataKey="revenue" name="รายรับ" fill="url(#topSingleBarFill)" radius={[0, 10, 10, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ApiState>
                    </SectionCard>
                </>
            )}

            {/* ── Transactions Tab ── */}
            {selectedTab === 'transactions' && (
                <>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">

                        <div className="flex items-center justify-center pb-3 mb-3 border-b border-slate-100">
                            <SegmentedControl value={transactionKind} onChange={setTransactionKind} options={[
                                { id: 'student', label: 'เงินรับจากนักเรียน', icon: Banknote },
                                { id: 'tutor', label: 'เงินจ่ายติวเตอร์', icon: Users },
                            ]} />
                        </div>
                        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    placeholder={transactionKind === 'student' ? 'ค้นหานักเรียน, Order, เลขอ้างอิง, คอร์ส...' : 'ค้นหาติวเตอร์หรือคอร์ส...'}
                                    className={`pl-10 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none ${T.transition}`}
                                />
                            </div>
                            <input
                                type="month"
                                value={monthFilter}
                                onChange={e => setMonthFilter(e.target.value)}
                                className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none ${T.transition}`}
                            />
                            {transactionKind === 'student' ? <>
                                <select value={paymentPlanFilter} onChange={e => setPaymentPlanFilter(e.target.value)} className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none ${T.transition}`}>
                                    <option value="all">เต็มและผ่อน</option><option value="full">เต็มจำนวน</option><option value="installment">ผ่อนชำระ</option>
                                </select>
                                <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none ${T.transition}`}>
                                    <option value="all">ทุกสถานะชำระ</option><option value="paid">ชำระครบ</option><option value="partially_paid">กำลังผ่อน</option>
                                </select>
                                {/* ⚠️ ใหม่: แยกคอร์สรวม/คอร์สเดี่ยวชัดเจนจากตัวกรองอื่น */}
                                <select value={courseTypeFilter} onChange={e => setCourseTypeFilter(e.target.value)} className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none font-semibold ${T.transition}`}>
                                    <option value="all">ทุกประเภทคอร์ส</option><option value="bundle">คอร์สรวม</option><option value="single">คอร์สเดี่ยว</option>
                                </select>
                                <select
                                    value={courseId}
                                    onChange={e => setCourseId(e.target.value)}
                                    disabled={filtersLoading}
                                    className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:opacity-50 lg:max-w-[180px] ${T.transition}`}
                                >
                                    <option value="all">ทุกคอร์ส</option>
                                    {filtersMeta.courses.map(c => (
                                        <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>
                                    ))}
                                </select>
                            </> : <select value={tutorStatus} onChange={e => setTutorStatus(e.target.value)} className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none ${T.transition}`}>
                                <option value="all">ค้างจ่ายและจ่ายแล้ว</option><option value="unpaid">รอโอน</option><option value="paid">จ่ายแล้ว</option>
                            </select>}
                        </div>
                        {filtersError && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-red-500">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {filtersError}
                                <button onClick={fetchFiltersMeta} className="font-semibold underline underline-offset-2">ลองใหม่</button>
                            </div>
                        )}
                        <p className={`${T.caption} mt-2 pl-1`}>{transactionKind === 'student'
                            ? `แสดง ${txData.length} จาก ${totalTx.toLocaleString()} รายการรับเงินจริง`
                            : `รอโอน ${tutorSummary.unpaidCount} รอบ ${formatMoney(tutorSummary.unpaidAmount)} · จ่ายแล้ว ${tutorSummary.paidCount} รอบ ${formatMoney(tutorSummary.paidAmount)}`}</p>
                    </div>

                    {transactionKind === 'student' ? (
                        <ApiState loading={txLoading} error={txError} onRetry={fetchTransactions} minHeight="h-64" skeletonHeight="h-64">
                            {txData.length === 0 ? (
                                <div className={T.card}>
                                    <EmptyState
                                        icon={Receipt}
                                        message="ไม่พบรายการที่ค้นหา"
                                        suggestion="โปรดปรับตัวกรองหรือคำค้นหา"
                                    />
                                </div>
                            ) : (
                                <>
                                {/* มือถือ/แท็บเล็ต: การ์ดรายการรับเงิน */}
                                <div className="lg:hidden grid gap-3 md:grid-cols-2">
                                    {txData.map(txn => {
                                        const isFull = txn.PaymentPlan === 'full';
                                        return (
                                            <button key={txn.TransactionId} onClick={() => setViewTxId(txn.TransactionId)}
                                                className={`min-w-0 text-left ${T.card} p-4`}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate">{studentDisplayName(txn)}</p>
                                                        <p className={T.caption}>{txn.PhoneNo || 'ไม่มีเบอร์โทร'}</p>
                                                    </div>
                                                    <p className="shrink-0 font-bold text-green-600">+{formatMoney(txn.Amount)}</p>
                                                </div>
                                                <p className="mt-2 text-sm font-semibold text-slate-800 line-clamp-2">{txn.CourseName}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${txn.Course_Type === 'single' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                                        {txn.Course_Type === 'single' ? 'คอร์สเดี่ยว' : 'คอร์สรวม'}
                                                    </span>
                                                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isFull ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                                        {isFull ? 'เต็มจำนวน' : `ผ่อน งวด ${txn.InstallmentNo}/${txn.InstallmentCount}`}
                                                    </span>
                                                    <span className={T.caption}>{formatDate(txn.TransDate || txn.Created_at)} · #{txn.TransactionId}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className={`hidden lg:block ${T.card} overflow-hidden`}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[820px] text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    {['รหัส', 'นักเรียน', 'คอร์ส', 'ประเภทคอร์ส', 'รูปแบบ', 'ยอดรับ', 'วันที่รับ', ''].map((h, i) => (
                                                        <th key={i} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide last:sticky last:right-0 last:bg-slate-50 lg:last:static lg:last:bg-transparent ${i === 5 ? 'text-right' : 'text-left'}`}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {txData.map(txn => (
                                                    <StudentPaymentRow key={txn.TransactionId} txn={txn} onView={setViewTxId} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                </>
                            )}
                        </ApiState>
                    ) : (
                        <ApiState loading={tutorLoading} error={tutorError} onRetry={fetchTutorPayables} minHeight="h-64">
                            {tutorData.length === 0 ? (
                                <div className={T.card}>
                                    <EmptyState icon={Users} message="ไม่พบรายการค่าติวเตอร์" suggestion="ค่าสอนจะแสดงหลังติวเตอร์เช็กอินสอนและมีข้อมูลเช็กชื่อนักเรียน" />
                                </div>
                            ) : (
                                <>
                                {/* มือถือ/แท็บเล็ต: การ์ดค่าติวเตอร์ */}
                                <div className="lg:hidden grid gap-3 md:grid-cols-2">
                                    {tutorData.map(item => (
                                        <div key={item.key} className={`min-w-0 ${T.card} p-4 flex flex-col`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">{item.tutorName}<TypeMixBadge typeMix={item.typeMix} /></p>
                                                    <p className={T.caption}>{item.period || '—'} · {item.sessionCount} คาบ</p>
                                                </div>
                                                <p className="shrink-0 font-bold text-slate-900">{formatMoney(item.amount)}</p>
                                            </div>
                                            <p className={`${T.caption} mt-1 line-clamp-2`}>{item.courses.join(', ')}</p>
                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                <p className="text-xs text-slate-600 min-w-0 truncate">{item.bankName || 'ข้อมูลไม่ครบ'} · {item.bankAccountNumber || 'ยังไม่มีเลขบัญชี'}</p>
                                                <StatusBadge name={item.status === 'paid' ? 'จ่ายแล้ว' : item.canPay ? 'รอโอน' : 'กำลังสะสม'} />
                                            </div>
                                            <div className="mt-auto pt-3">
                                                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                                                    <button onClick={() => setTutorDetailItem(item)}
                                                        className="h-10 px-3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold">
                                                        <Eye className="h-4 w-4" /> ดูรายละเอียดคาบสอน
                                                    </button>
                                                    <div className="flex-1 flex justify-end">
                                                        {item.status === 'unpaid' ? (item.canPay
                                                            ? <button onClick={() => setPayoutItem(item)} className="h-10 px-4 bg-orange-500 text-white rounded-xl text-xs font-bold">บันทึกการโอน</button>
                                                            : <span className={T.caption}>จ่ายได้วันสิ้นเดือน</span>)
                                                            : item.slipUrl ? <a href={getFileUrl(item.slipUrl)} target="_blank" rel="noreferrer" className="h-10 px-3 flex items-center text-orange-600 text-xs font-bold">ดูสลิป</a> : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={`hidden lg:block ${T.card} overflow-x-auto`}>
                                    <table className="w-full min-w-[900px] text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                {['ติวเตอร์', 'รอบ/คอร์ส', 'คาบ', 'ยอดเงิน', 'บัญชีรับเงิน', 'สถานะ', ''].map((h, i) => (
                                                    <th key={h} className={`px-4 py-3 text-xs text-slate-500 last:sticky last:right-0 last:bg-slate-50 lg:last:static lg:last:bg-transparent ${i === 3 ? 'text-right' : i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {tutorData.map(item => (
                                                <tr key={item.key} className={`hover:bg-orange-50/40 ${T.transition}`}>
                                                    <td className="px-4 py-3 font-semibold whitespace-nowrap lg:whitespace-normal">
                                                        <span className="flex items-center gap-1.5">{item.tutorName}<TypeMixBadge typeMix={item.typeMix} /></span>
                                                    </td>
                                                    <td className="px-4 py-3"><p>{item.period || '—'}</p><p className={`${T.caption} max-w-[280px] truncate`}>{item.courses.join(', ')}</p></td>
                                                    <td className="px-4 py-3 whitespace-nowrap lg:whitespace-normal">{item.sessionCount} คาบ</td>
                                                    <td className="px-4 py-3 text-right font-bold">{formatMoney(item.amount)}</td>
                                                    <td className="px-4 py-3 min-w-[140px] lg:min-w-0"><p>{item.bankName || 'ข้อมูลไม่ครบ'}</p><p className={T.caption}>{item.bankAccountNumber || 'ยังไม่มีเลขบัญชี'}</p></td>
                                                    <td className="px-4 py-3"><StatusBadge name={item.status === 'paid' ? 'จ่ายแล้ว' : item.canPay ? 'รอโอน' : 'กำลังสะสม'} /></td>
                                                    <td className="px-4 py-3 sticky right-0 bg-white lg:static lg:bg-transparent">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => setTutorDetailItem(item)}
                                                                className={`p-2 rounded-lg border border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600 ${T.transition}`}
                                                                title="ดูรายละเอียดคาบสอน"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            {item.status === 'unpaid' ? (item.canPay
                                                                ? <button onClick={() => setPayoutItem(item)} className={`px-3 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 ${T.transition}`}>บันทึกการโอน</button>
                                                                : <span className={T.caption}>จ่ายได้วันสิ้นเดือน</span>)
                                                                : item.slipUrl ? <a href={getFileUrl(item.slipUrl)} target="_blank" rel="noreferrer" className="text-orange-600 text-xs font-bold">ดูสลิป</a> : '—'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                </>
                            )}
                        </ApiState>
                    )}

                    {/* Pagination */}
                    {transactionKind === 'student' && (
                        <UIPagination page={currentPageNum} totalPages={totalPages} total={totalTx} pageSize={ITEMS_PER_PAGE} onChange={setCurrentPage} />
                    )}
                </>
            )}

            {/* ── Modals ── */}
            {viewTxId && (
                <StudentPaymentDetailModal transactionId={viewTxId} onClose={() => setViewTxId(null)} />
            )}
            {payoutItem && <TutorPayoutModal item={payoutItem} onClose={() => setPayoutItem(null)} onSuccess={() => { fetchTutorPayables(); fetchSummary(); fetchMonthly(); }} />}
            {tutorDetailItem && <TutorPaymentDetailModal item={tutorDetailItem} onClose={() => setTutorDetailItem(null)} />}
        </div>
    );
}

/* ─── Student payment row / detail modal ─────────────────────────────── */
function StudentPaymentRow({ txn, onView }) {
    const isFull = txn.PaymentPlan === 'full';
    return (
        <tr className={`hover:bg-orange-50/40 ${T.transition}`}>
            <td className="px-4 py-3 tabular-nums text-xs text-slate-500">#{txn.TransactionId}</td>
            <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{studentDisplayName(txn)}</p>
                <p className={T.caption}>{txn.PhoneNo || 'ไม่มีเบอร์โทร'}</p>
            </td>
            <td className="px-4 py-3 max-w-[260px]">
                <p className="font-semibold text-slate-800 truncate">{txn.CourseName}</p>
                <p className={T.caption}>Order {String(txn.OrderCode || '').slice(0, 8)}</p>
            </td>
            <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${txn.Course_Type === 'single' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    {txn.Course_Type === 'single' ? 'คอร์สเดี่ยว' : 'คอร์สรวม'}
                </span>
            </td>
            <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isFull ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {isFull ? 'เต็มจำนวน' : `ผ่อน งวด ${txn.InstallmentNo}/${txn.InstallmentCount}`}
                </span>
            </td>
            <td className="px-4 py-3 text-right font-bold text-green-600">+{formatMoney(txn.Amount)}</td>
            <td className="px-4 py-3 text-xs text-slate-500">{formatDate(txn.TransDate || txn.Created_at)}</td>
            <td className="px-4 py-3 sticky right-0 bg-white lg:static lg:bg-transparent">
                <button onClick={() => onView(txn.TransactionId)} className={`p-2 rounded-lg border border-slate-200 hover:border-orange-300 hover:text-orange-600 ${T.transition}`} title="ดูรายละเอียดและสลิป">
                    <Eye className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
}

function StudentPaymentDetailModal({ transactionId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        axios.get(`${FINANCE_API}/student-transactions/${transactionId}`)
            .then(r => setData(r.data)).catch(e => setError(e.response?.data?.message || 'โหลดรายละเอียดไม่สำเร็จ'))
            .finally(() => setLoading(false));
    }, [transactionId]);
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
                <div className="sticky top-0 z-10 px-4 sm:px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 flex justify-between items-center">
                    <div>
                        <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                                <Receipt className="h-4 w-4 text-white" />
                            </span>
                            รายละเอียดรับชำระ
                        </h3>
                        <p className="text-xs text-orange-100 mt-0.5 ml-[42px]">Transaction #{transactionId}</p>
                    </div>
                    <button aria-label="ปิด" onClick={onClose} className={`p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white ${T.transition} min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center`}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-4 sm:p-6">
                    <ApiState loading={loading} error={error} minHeight="h-64">
                        {data && <div className="space-y-5">
                            <div className="grid md:grid-cols-3 gap-3">
                                <KPICard label="ยอดรับครั้งนี้" value={formatMoney(data.Amount)} icon={Banknote} tone="green" />
                                <KPICard label="ยอดรับสะสม Order" value={formatMoney(data.PaidAmount)} sub={`จาก ${formatMoney(data.TotalAmount)}`} icon={Wallet} tone="blue" />
                                <KPICard label="รูปแบบ" value={data.PaymentPlan === 'full' ? 'เต็มจำนวน' : `ผ่อน งวด ${data.InstallmentNo}`} icon={CreditCard} tone="orange" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div className={`${T.card} p-4 space-y-2`}><p className={T.label}>นักเรียน</p><p className="font-bold">{studentDisplayName(data)}</p><p>{data.PhoneNo || '—'}</p><p className="text-slate-500">{data.CourseName}</p></div>
                                <div className={`${T.card} p-4 space-y-2`}><p className={T.label}>ข้อมูลการโอน</p><p>วันที่ {formatDate(data.TransDate || data.Created_at)}</p><p>เลขอ้างอิง {data.TransRef}</p><p>{data.SendingBank || 'ไม่ระบุธนาคารต้นทาง'} → {data.ReceivingBank || 'บัญชีสถาบัน'}</p></div>
                            </div>
                            <div><p className="font-bold mb-3">ตารางงวดของ Order นี้</p><div className="overflow-x-auto border border-slate-200 rounded-xl"><table className="w-full sm:min-w-[480px] text-sm"><thead className="bg-slate-50"><tr><th className="p-2 sm:p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">งวด</th><th className="p-2 sm:p-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">ยอด</th><th className="p-2 sm:p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">กำหนด</th><th className="p-2 sm:p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานะ</th></tr></thead><tbody>{data.installments?.map(i => <tr key={i.InstallmentId} className={`border-t border-slate-100 hover:bg-orange-50/40 ${T.transition}`}><td className="p-2 sm:p-3">งวด {i.InstallmentNo}</td><td className="p-2 sm:p-3 text-right font-semibold">{formatMoney(i.Amount)}</td><td className="p-2 sm:p-3">{formatDate(i.DueDate)}</td><td className="p-2 sm:p-3"><StatusBadge name={i.Status === 'paid' ? 'ชำระแล้ว' : i.Status === 'scheduled' ? 'ยังไม่ถึงกำหนด' : i.Status === 'due' ? 'ถึงกำหนด' : 'ค้างชำระ'} /></td></tr>)}</tbody></table></div></div>
                            <div><p className="font-bold mb-3">สลิปการชำระ</p>{data.SlipUrl ? <a href={getFileUrl(data.SlipUrl)} target="_blank" rel="noreferrer"><img src={getFileUrl(data.SlipUrl)} className="max-h-96 mx-auto rounded-xl border border-slate-200 object-contain" alt="สลิปนักเรียน" /></a> : <EmptyState icon={FileText} message="ไม่มีรูปสลิป" />}</div>
                        </div>}
                    </ApiState>
                </div>
            </div>
        </div>
    );
}

/* ─── Tutor payment session-detail modal (แสดงรายละเอียดคาบสอน + สูตรคำนวณ) ── */
function TutorPaymentDetailModal({ item, onClose }) {
    const sessions = Array.isArray(item.sessions) ? item.sessions : [];
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 px-4 sm:px-6 py-4">
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-bold text-white">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                                <Eye className="h-4 w-4 text-white" />
                            </span>
                            รายละเอียดค่าติวเตอร์
                        </h3>
                        <p className="mt-0.5 text-xs text-orange-100 ml-[42px]">{item.tutorName} · รอบ {item.period}</p>
                    </div>
                    <button aria-label="ปิด" onClick={onClose} className={`p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white ${T.transition} min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center`}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto p-4 sm:p-6">
                    <div className="mb-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className={T.label}>ยอดรวม</p>
                            <p className={`mt-1 ${STAT_NUM} text-orange-600`}>{formatMoney(item.amount)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className={T.label}>จำนวนคาบ</p>
                            <p className={`mt-1 ${STAT_VALUE}`}>{item.sessionCount}<span className={STAT_UNIT}>คาบ</span></p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className={T.label}>เรทในโปรไฟล์ติวเตอร์</p>
                            <p className={`mt-1 ${STAT_VALUE}`}>{item.profileRate != null ? <>{Number(item.profileRate).toLocaleString('th-TH')}<span className={STAT_UNIT}>บาท/ชม.</span></> : 'ไม่ได้ระบุ'}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ประเภท</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">วันที่/คอร์ส</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">วิชา</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">ผู้เรียนมา</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">ชั่วโมง</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">ขั้นเรท</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">สูตร</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">ยอด</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sessions.map(session => (
                                    <tr key={session.tutorCheckinId} className="hover:bg-orange-50/30">
                                        <td className="px-4 py-3">
                                            <span className={`whitespace-nowrap lg:whitespace-normal rounded-full px-2.5 py-0.5 text-xs font-semibold ${session.classType === 'substitute' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {session.classType === 'substitute' ? 'รับสอนแทน' : 'คอร์สหลัก'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-800">{formatDate(session.startDateTime)}</p>
                                            <p className="mt-0.5 max-w-[250px] text-xs text-slate-500">{session.courseName}</p>
                                        </td>
                                        <td className="px-4 py-3">{session.subjectName || '—'}</td>
                                        <td className="px-4 py-3 text-center">{session.actualStudents} คน</td>
                                        <td className="px-4 py-3 text-center">{Number(session.durationHours).toFixed(1)} ชม.</td>
                                        <td className="px-4 py-3 text-center">{Number(session.ratePerSession).toLocaleString('th-TH')} บาท/1.5 ชม.</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{Number(session.ratePerSession).toLocaleString('th-TH')} × ({Number(session.durationHours).toFixed(1)} ÷ 1.5)</td>
                                        <td className="px-4 py-3 text-right font-bold text-orange-600">{formatMoney(session.earnedAmount)}</td>
                                    </tr>
                                ))}
                                {!sessions.length && (
                                    <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-400">ไม่พบรายละเอียดคาบในรายการนี้</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Tutor payout modal — บันทึกการโอนเงิน, แก้วันที่ได้ + โชว์บัญชีให้เช็คก่อนโอน ── */
function TutorPayoutModal({ item, onClose, onSuccess }) {
    const paymentDate = new Date().toISOString().slice(0, 10);
    const [slip, setSlip] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const submit = async (e) => {
        e.preventDefault(); setError('');
        if (!slip) return setError('กรุณาแนบสลิปการโอนเงิน');
        const form = new FormData();
        form.append('adminId', item.adminId);
        form.append('checkinIds', JSON.stringify(item.checkinIds));
        form.append('paymentDate', paymentDate);
        form.append('slip', slip);
        setSaving(true);
        try {
            await axios.post(`${API_URL}/api/admin/tutor-payments`, form);
            onSuccess(); onClose();
        } catch (err) { setError(err.response?.data?.message || 'บันทึกการจ่ายเงินไม่สำเร็จ'); }
        finally { setSaving(false); }
    };
    const bankReady = item.bankName && item.bankAccountNumber && item.bankAccountName;
    const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
    return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <form onSubmit={submit} className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto lg:max-h-none lg:overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500">
                <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                        <Wallet className="h-4 w-4 text-white" />
                    </span>
                    บันทึกโอนค่าติวเตอร์
                </h3>
                <button aria-label="ปิด" type="button" onClick={onClose} className={`p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white ${T.transition} min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center`}>
                    <X className="h-5 w-5" />
                </button>
            </div>
            <p className="px-4 sm:px-6 pt-3 text-xs text-slate-500">{item.tutorName} · รอบ {item.period}</p>
            <div className="p-4 sm:p-6 space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                    <p className={T.label}>ยอดที่ต้องโอน</p>
                    <p className="tabular-nums text-2xl sm:text-3xl font-bold text-orange-600">{formatMoney(item.amount)}</p>
                    <p className={T.caption}>{item.sessionCount} คาบ · {item.courses.join(', ')}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className={T.label}>ธนาคาร</p><p className="font-semibold">{item.bankName || 'ยังไม่กรอก'}</p></div>
                    <div><p className={T.label}>เลขบัญชี</p><p className="font-semibold break-all">{item.bankAccountNumber || 'ยังไม่กรอก'}</p></div>
                    <div className="col-span-2"><p className={T.label}>ชื่อบัญชี</p><p className="font-semibold">{item.bankAccountName || 'ยังไม่กรอก'}</p></div>
                </div>
                {!bankReady && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">ข้อมูลบัญชีติวเตอร์ไม่ครบ กรุณาแก้ในหน้าจัดการติวเตอร์ก่อนโอนเงิน</p>}
                <label className="block"><span className={T.label}>สลิปการโอน *</span><input required type="file" accept="image/*" onChange={e => setSlip(e.target.files?.[0] || null)} className={`mt-1 ${inp}`} /></label>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={onClose} disabled={saving}
                    className={`${BTN.secondary} flex-1 py-2.5 rounded-xl font-bold disabled:opacity-50 transition text-sm`}>
                    ยกเลิก
                </button>
                <button disabled={saving || !bankReady}
                    className={`${BTN.primary} flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold disabled:opacity-50 transition text-sm`}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันว่าโอนแล้ว"}
                </button>
            </div>
        </form>
    </div>;
}
