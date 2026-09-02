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
    cardPad: 'p-6',
    cardPadSm: 'p-4',
    transition: 'transition duration-200 ease-out',
    title: 'text-lg font-bold text-slate-900',
    subtitle: 'text-sm text-slate-500',
    label: 'text-xs font-medium text-slate-500',
    value: 'text-xl font-black text-slate-900 tracking-tight',
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
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
            <Icon className="h-3 w-3" />{name || 'ไม่ระบุสถานะ'}
        </span>
    );
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
function EmptyState({ icon: Icon = Inbox, message, suggestion }) {
    return (
        <div className={`flex flex-col items-center justify-center text-center py-16 px-4`}>
            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <Icon className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">{message}</p>
            {suggestion && <p className={`${T.caption} mt-1 max-w-xs`}>{suggestion}</p>}
        </div>
    );
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
        <div className={`${T.card} ${T.cardPad} flex flex-col h-full ${className}`}>
            {title && (
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className={`${T.title} flex items-center gap-2`}>
                        {Icon && <Icon className="h-4 w-4 text-orange-500" />}
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
    }[tone];

    return (
        <div className={`flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md ${T.transition} h-full min-h-[96px]`}>
            {Icon && (
                <div className={`h-11 w-11 rounded-xl ${toneBg} flex items-center justify-center shrink-0`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className={`${T.label} leading-snug`}>{label}</p>
                <p className="text-lg font-black text-slate-900 tracking-tight truncate mt-0.5">{value}</p>
                {sub && <p className={`${T.caption} mt-0.5 line-clamp-2 leading-snug`}>{sub}</p>}
            </div>
        </div>
    );
}

/* ─── Donut3D — โทนเดียวกับ CourseStatusDonut ใน Dashboard ──────────── */
function Donut3D({ idPrefix, data, centerValue, centerLabel, valueFormatter = (v) => v, size = 200 }) {
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
                        >
                            {sorted.map((d, i) => (
                                <Cell
                                    key={i}
                                    fill={`url(#${idPrefix}-${i})`}
                                    style={d.value === topValue ? { filter: 'drop-shadow(0 5px 7px rgba(15,23,42,0.18))' } : undefined}
                                />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={CHART_TOOLTIP_STYLE} />
                    </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-black text-slate-900">{centerValue}</p>
                    <p className="text-[11px] text-slate-400">{centerLabel}</p>
                </div>
            </div>
            <div className="w-full max-w-xs space-y-1">
                {sorted.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.base }} />
                            <span className="text-slate-600 truncate">{d.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 shrink-0">{valueFormatter(d.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Shared: SegmentedControl — ★ เปลี่ยนเป็นแถวปุ่มแบบเดียวกับแท็บใน
   AdminTutorsPage (bg-orange-500 ตอน active / border ตอน inactive) แทน
   pill พื้นเทาเดิม เพื่อให้แท็บทั้งแอปหน้าตาเดียวกัน ──────────────────── */
function SegmentedControl({ options, value, onChange }) {
    return (
        <div className="flex gap-2 flex-wrap">
            {options.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${T.transition} ${value === id ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Icon className="h-4 w-4" />{label}
                </button>
            ))}
        </div>
    );
}

/* ─── Hero: minimal white card, thin orange accent, the 5-second answer ── */
function HeroSummary({ loading, error, onRetry, revenue, revenueGrowth, cashNet, cashMargin, tutorPayable, tutorAccrued, overdue, overdueCount }) {
    return (
        <div className={`${T.card} ${T.cardPad} relative overflow-hidden`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className={T.title}>ภาพรวมเดือนนี้</h2>
                    <p className={T.subtitle}>สรุปสถานะการเงินล่าสุด ณ ตอนนี้</p>
                </div>
            </div>

            <ApiState loading={loading} error={error} onRetry={onRetry} minHeight="h-28" skeletonHeight="h-28">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <p className={T.label}>รายรับเดือนนี้</p>
                        <p className={`${T.value} mt-1`}>{formatMoney(revenue)}</p>
                        {/* <p className={`${T.caption} mt-1.5 flex items-center gap-1`}>
                            {revenueGrowth !== null && (
                                <span className={`inline-flex items-center gap-0.5 font-semibold ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%
                                </span>
                            )}
                        </p> */}
                    </div>
                    <div>
                        <p className={T.label}>กระแสเงินสดสุทธิ</p>
                        <p className={`${T.value} mt-1 ${cashNet < 0 ? 'text-red-600' : ''}`}>{formatMoney(cashNet)}</p>
                    </div>
                    <div>
                        <p className={T.label}>ค่าติวเตอร์ค้างจ่าย</p>
                        <p className={`${T.value} mt-1 ${tutorPayable > 0 ? 'text-orange-600' : ''}`}>{formatMoney(tutorPayable)}</p>
                    </div>
                    <div>
                        <p className={T.label}>ยอดเกินกำหนด</p>
                        <p className={`${T.value} mt-1 ${overdue > 0 ? 'text-red-600' : ''}`}>{formatMoney(overdue)}</p>
                    </div>
                </div>
            </ApiState>
        </div>
    );
}

/* ─── Transaction Detail Modal — always re-fetches GET /transaction/:id ── */
function TransactionDetailModal({ transactionId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = () => {
        setLoading(true); setError(null);
        axios.get(`${FINANCE_API}/transaction/${transactionId}`)
            .then(r => setData(r.data))
            .catch(e => setError(e.response?.data?.message || 'โหลดรายละเอียดธุรกรรมไม่สำเร็จ'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [transactionId]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
                    <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                            <Receipt className="h-4 w-4 text-white" />
                        </span>
                        รายละเอียดธุรกรรม
                    </h3>
                    <button onClick={onClose} className={`p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white ${T.transition}`}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    <ApiState loading={loading} error={error} onRetry={load} minHeight="h-64">
                        {data && (
                            <div className="space-y-5">
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-mono text-sm font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-xl">
                                            #{data.StudentPaymentId}
                                        </span>
                                        <StatusBadge name={data.Status_Payment_Name} />
                                    </div>
                                    <p className="text-2xl font-bold mb-1.5 text-green-600">+{formatMoney(data.Price)}</p>
                                    <p className="text-sm text-slate-600">{txDescription(data)}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'ประเภทคอร์ส', value: data.CourseTypeName || data.Course_Type || '—' },
                                        { label: 'เทอม', value: data.Term_Name || '—' },
                                        { label: 'วันที่ชำระ', value: formatDate(data.PaymentDate), icon: Calendar },
                                        { label: 'วิธีชำระ', value: data.PaymentType || '—', icon: CreditCard },
                                        { label: 'เลขที่บิล', value: data.BillNo || '—', icon: FileText },
                                        { label: 'ธนาคาร/บัญชี', value: data.BankAccountName ? `${data.BankAccountName}${data.PaymentBankName ? ' · ' + data.PaymentBankName : ''}` : '—', icon: Banknote },
                                    ].map(({ label, value, icon: Icon }) => (
                                        <div key={label} className={`${T.card} ${T.cardPadSm}`}>
                                            <p className={`${T.label} mb-1.5`}>{label}</p>
                                            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                                {Icon && <Icon className="h-3.5 w-3.5 text-orange-500" />}
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">ข้อมูลผู้ชำระ</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-900">
                                        <User className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="font-semibold">{data.Firstname} {data.Lastname}</span>
                                    </div>
                                    {data.PhoneNo && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Phone className="h-4 w-4 text-blue-500 shrink-0" />
                                            <span>{data.PhoneNo}</span>
                                        </div>
                                    )}
                                    {(data.PaymentSender || data.PaymentReceiver) && (
                                        <div className="pt-1 text-xs text-slate-500 space-y-0.5">
                                            {data.PaymentSender && <p>ผู้โอน: {data.PaymentSender}</p>}
                                            {data.PaymentReceiver && <p>ผู้รับโอน: {data.PaymentReceiver}</p>}
                                        </div>
                                    )}
                                </div>

                                <div className={`${T.card} ${T.cardPadSm}`}>
                                    <p className={`${T.label} mb-3 flex items-center gap-1.5`}>
                                        <FileText className="h-3.5 w-3.5 text-orange-500" />สลิปการโอนเงิน
                                    </p>
                                    {data.PaymentPicture ? (
                                        <img
                                            src={getFileUrl(data.PaymentPicture)}
                                            alt="สลิปการโอนเงิน"
                                            className="w-full max-h-72 object-contain rounded-xl border border-slate-200 bg-slate-50"
                                        />
                                    ) : (
                                        <EmptyState icon={FileText} message="ไม่มีสลิปแนบ" />
                                    )}
                                </div>

                                <button
                                    onClick={() => window.print()}
                                    className={`w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 ${T.transition}`}
                                >
                                    พิมพ์ใบเสร็จ
                                </button>
                            </div>
                        )}
                    </ApiState>
                </div>
            </div>
        </div>
    );
}

/* ─── Transaction Row ────────────────────────────────────────────────── */
function TransactionRow({ txn, onView }) {
    return (
        <tr className={`hover:bg-orange-50/40 ${T.transition}`}>
            <td className="px-4 py-3">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
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
                    className={`p-1.5 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 ${T.transition}`}
                    title="ดูรายละเอียด"
                >
                    <Eye className="h-3.5 w-3.5" />
                </button>
            </td>
        </tr>
    );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
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
    const [charts, setCharts] = useState({ byCourseType: [], byTerm: [], byStatus: [], topCourses: [], installmentStatuses: [] });
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

    /* filters state */
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState(''); // yyyy-mm from <input type="month">, empty = all
    const [orderStatus, setOrderStatus] = useState('all');
    const [paymentPlanFilter, setPaymentPlanFilter] = useState('all');
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

    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, monthFilter, orderStatus, paymentPlanFilter, courseId]);

    useEffect(() => {
        if (transactionKind === 'student') fetchTransactions();
        else fetchTutorPayables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactionKind, debouncedSearch, monthFilter, orderStatus, paymentPlanFilter, tutorStatus, courseId, currentPage]);

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
    }));

    const NEUTRAL_DONUT = { base: '#94a3b8', light: '#cbd5e1' };
    const namedColors = DONUT_COLORS.filter((_, i) => i !== DONUT_COLORS.length - 1); // เก็บสีเทาไว้แยกให้ "ไม่ระบุ" โดยเฉพาะ

    let colorCursor = 0;
    const revenueByCourseType = (charts.byCourseType || []).map((c) => {
        const isUnlabeled = !c.TypeName;
        const color = isUnlabeled ? NEUTRAL_DONUT : namedColors[colorCursor++ % namedColors.length];
        return {
            name: c.TypeName || 'ไม่ระบุ',
            value: Number(c.revenue) || 0,
            ...color,
        };
    });

    const installmentStatusData = (charts.installmentStatuses || []).map((c, i) => ({
        name: c.label,
        value: Number(c.count) || 0,
        ...DONUT_COLORS[i % DONUT_COLORS.length],
    }));

    const revenueByCourseTypeTotal = revenueByCourseType.reduce((s, d) => s + d.value, 0);
    const installmentTotalCount = installmentStatusData.reduce((s, d) => s + d.value, 0);

    const topCourseData = (charts.topCourses || []).map(c => ({
        name: c.CourseName,
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
        <div className="space-y-6 mt-[90px]">

            {/* ── Page header ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">การเงินสถาบัน</h1>
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
                <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-2xl text-sm text-orange-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    พบ {missingPriceCount} รายการลงทะเบียนที่ยังไม่ได้กรอกราคา (FullPrice/ส่วนลด) — จะไม่ถูกนับทั้งใน "จ่ายแล้ว" และ "ค้างชำระ" จนกว่าจะกรอกราคาให้ครบ
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
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <KPICard label="รายรับสะสม" value={formatMoney(totalRevenueAllTime)} icon={Banknote} tone="orange" />
                    <KPICard label="ยอดคงเหลือ (ผ่อน)" value={formatMoney(outstandingTotalAmount)} icon={Clock} tone="orange" />
                    <KPICard label="นักเรียนที่ชำระแล้ว" value={`${paidEnrollCount} / ${totalEnrollCount}`} icon={Users} tone="green" />
                    <KPICard label="ชำระตรงเวลา" value={onTimePaymentRate === null ? '—' : `${onTimePaymentRate}%`} icon={CheckCircle} tone="green" />
                    {/* <KPICard label="รายรับเฉลี่ย/นักเรียน" value={formatMoney(avgRevenuePerStudent)} icon={Target} tone="neutral" />
                    <KPICard label="รูปแบบการชำระ" value={`${fullPlanPercent}% เต็ม`} icon={CreditCard} tone="blue" /> */}
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
                        <SectionCard title="แหล่งรายรับ (ตามประเภทคอร์ส)" icon={PieChart}>
                            <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-64" skeletonHeight="h-64">
                                {revenueByCourseType.length === 0 ? (
                                    <EmptyState message="ยังไม่มีข้อมูลรายรับ" suggestion="ข้อมูลจะแสดงเมื่อมีการชำระเงินเข้ามาในระบบ" />
                                ) : (
                                    <Donut3D idPrefix="courseTypeDonut" data={revenueByCourseType} centerValue={formatMoney(revenueByCourseTypeTotal)} centerLabel="รายรับรวม" valueFormatter={formatMoney} />
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

                    <SectionCard title="🏆 5 คอร์สที่สร้างรายรับสูงสุด" icon={TrendingUp}>
                        <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-64" skeletonHeight="h-64">
                            {topCourseData.length === 0 ? (
                                <EmptyState message="ยังไม่มีข้อมูลรายรับรายคอร์ส" suggestion="จะแสดงเมื่อมีรายการชำระที่ตรวจสอบสำเร็จ" />
                            ) : (
                                <ResponsiveContainer width="100%" height={Math.max(240, topCourseData.length * 56)}>
                                    <BarChart data={topCourseData} layout="vertical" margin={{ top: 8, left: 12, right: 30, bottom: 8 }}>
                                        <defs>
                                            <linearGradient id="topCourseBarTop" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#fdba74" />
                                                <stop offset="100%" stopColor="#ea580c" />
                                            </linearGradient>
                                            <linearGradient id="topCourseBarRest" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#fed7aa" />
                                                <stop offset="100%" stopColor="#fb923c" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" tick={CHART_TICK} tickFormatter={value => `฿${Number(value).toLocaleString()}`} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" width={180} tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={v => formatMoney(v)} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="revenue" name="รายรับ" radius={[0, 10, 10, 0]}>
                                            {topCourseData.map((_, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={i === 0 ? 'url(#topCourseBarTop)' : 'url(#topCourseBarRest)'}
                                                    style={{ filter: i === 0 ? 'drop-shadow(2px 4px 6px rgba(234,88,12,0.35))' : 'drop-shadow(1px 2px 3px rgba(100,116,139,0.15))' }}
                                                />
                                            ))}
                                        </Bar>
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

                        <div className="flex items-center justify-center border-b border-slate-100">
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
                                    className={`pl-10 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none ${T.transition}`}
                                />
                            </div>
                            <input
                                type="month"
                                value={monthFilter}
                                onChange={e => setMonthFilter(e.target.value)}
                                className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none ${T.transition}`}
                            />
                            {transactionKind === 'student' ? <>
                                <select value={paymentPlanFilter} onChange={e => setPaymentPlanFilter(e.target.value)} className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none ${T.transition}`}>
                                    <option value="all">เต็มและผ่อน</option><option value="full">เต็มจำนวน</option><option value="installment">ผ่อนชำระ</option>
                                </select>
                                <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none ${T.transition}`}>
                                    <option value="all">ทุกสถานะชำระ</option><option value="paid">ชำระครบ</option><option value="partially_paid">กำลังผ่อน</option>
                                </select>
                                <select
                                    value={courseId}
                                    onChange={e => setCourseId(e.target.value)}
                                    disabled={filtersLoading}
                                    className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:opacity-50 lg:max-w-[180px] ${T.transition}`}
                                >
                                    <option value="all">ทุกคอร์ส</option>
                                    {filtersMeta.courses.map(c => (
                                        <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>
                                    ))}
                                </select>
                            </> : <select value={tutorStatus} onChange={e => setTutorStatus(e.target.value)} className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none ${T.transition}`}>
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
                                        suggestion="ลองปรับตัวกรองหรือคำค้นหา แล้วลองใหม่อีกครั้ง"
                                    />
                                </div>
                            ) : (
                                <div className={`${T.card} overflow-hidden`}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    {['รหัส', 'นักเรียน', 'คอร์ส', 'รูปแบบ', 'ยอดรับ', 'วันที่รับ', ''].map((h, i) => (
                                                        <th key={i} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i === 4 ? 'text-right' : 'text-left'}`}>
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
                            )}
                        </ApiState>
                    ) : (
                        <ApiState loading={tutorLoading} error={tutorError} onRetry={fetchTutorPayables} minHeight="h-64">
                            {tutorData.length === 0 ? (
                                <div className={T.card}>
                                    <EmptyState icon={Users} message="ไม่พบรายการค่าติวเตอร์" suggestion="ค่าสอนจะแสดงหลังติวเตอร์เช็กอินสอนและมีข้อมูลเช็กชื่อนักเรียน" />
                                </div>
                            ) : (
                                <div className={`${T.card} overflow-x-auto`}>
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                {['ติวเตอร์', 'รอบ/คอร์ส', 'คาบ', 'ยอดเงิน', 'บัญชีรับเงิน', 'สถานะ', ''].map((h, i) => (
                                                    <th key={h} className={`px-4 py-3 text-xs text-slate-500 ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {tutorData.map(item => (
                                                <tr key={item.key} className={`hover:bg-orange-50/40 ${T.transition}`}>
                                                    <td className="px-4 py-3 font-semibold">{item.tutorName}</td>
                                                    <td className="px-4 py-3"><p>{item.period || '—'}</p><p className={`${T.caption} max-w-[280px] truncate`}>{item.courses.join(', ')}</p></td>
                                                    <td className="px-4 py-3">{item.sessionCount} คาบ</td>
                                                    <td className="px-4 py-3 text-right font-bold">{formatMoney(item.amount)}</td>
                                                    <td className="px-4 py-3"><p>{item.bankName || 'ข้อมูลไม่ครบ'}</p><p className={T.caption}>{item.bankAccountNumber || 'ยังไม่มีเลขบัญชี'}</p></td>
                                                    <td className="px-4 py-3"><StatusBadge name={item.status === 'paid' ? 'จ่ายแล้ว' : item.canPay ? 'รอโอน' : 'กำลังสะสม'} /></td>
                                                    <td className="px-4 py-3">
                                                        {item.status === 'unpaid' ? (item.canPay
                                                            ? <button onClick={() => setPayoutItem(item)} className={`px-3 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 ${T.transition}`}>บันทึกการโอน</button>
                                                            : <span className={T.caption}>จ่ายได้วันสิ้นเดือน</span>)
                                                            : item.slipUrl ? <a href={getFileUrl(item.slipUrl)} target="_blank" rel="noreferrer" className="text-orange-600 text-xs font-bold">ดูสลิป</a> : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </ApiState>
                    )}

                    {/* Pagination */}
                    {transactionKind === 'student' && totalPages > 1 && (
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <p className={T.subtitle}>
                                หน้า <span className="font-semibold text-slate-700">{currentPageNum}</span> จาก <span className="font-semibold text-slate-700">{totalPages}</span> · ทั้งหมด <span className="font-semibold text-slate-700">{totalTx.toLocaleString()}</span> รายการ
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPageNum === 1}
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 ${T.transition}`}>
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPageNum) <= 1)
                                    .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                                    .map((p, idx) => p === '...' ? (
                                        <span key={`d${idx}`} className="flex h-9 w-9 items-center justify-center text-slate-400 text-sm">…</span>
                                    ) : (
                                        <button key={p} onClick={() => setCurrentPage(p)}
                                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${T.transition} ${currentPageNum === p ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600'}`}>
                                            {p}
                                        </button>
                                    ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPageNum === totalPages}
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 ${T.transition}`}>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Modals ── */}
            {viewTxId && (
                <StudentPaymentDetailModal transactionId={viewTxId} onClose={() => setViewTxId(null)} />
            )}
            {payoutItem && <TutorPayoutModal item={payoutItem} onClose={() => setPayoutItem(null)} onSuccess={() => { fetchTutorPayables(); fetchSummary(); fetchMonthly(); }} />}
        </div>
    );
}

function StudentPaymentRow({ txn, onView }) {
    const isFull = txn.PaymentPlan === 'full';
    return (
        <tr className={`hover:bg-orange-50/40 ${T.transition}`}>
            <td className="px-4 py-3 font-mono text-xs text-slate-500">#{txn.TransactionId}</td>
            <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{studentDisplayName(txn)}</p>
                <p className={T.caption}>{txn.PhoneNo || 'ไม่มีเบอร์โทร'}</p>
            </td>
            <td className="px-4 py-3 max-w-[260px]">
                <p className="font-semibold text-slate-800 truncate">{txn.CourseName}</p>
                <p className={T.caption}>Order {String(txn.OrderCode || '').slice(0, 8)}</p>
            </td>
            <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isFull ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {isFull ? 'เต็มจำนวน' : `ผ่อน งวด ${txn.InstallmentNo}/${txn.InstallmentCount}`}
                </span>
            </td>
            <td className="px-4 py-3 text-right font-bold text-green-600">+{formatMoney(txn.Amount)}</td>
            <td className="px-4 py-3 text-xs text-slate-500">{formatDate(txn.TransDate || txn.Created_at)}</td>
            <td className="px-4 py-3">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
                <div className="sticky top-0 z-10 px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 flex justify-between items-center">
                    <div>
                        <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                                <Receipt className="h-4 w-4 text-white" />
                            </span>
                            รายละเอียดรับชำระ
                        </h3>
                        <p className="text-xs text-orange-100 mt-0.5 ml-[42px]">Transaction #{transactionId}</p>
                    </div>
                    <button onClick={onClose} className={`p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white ${T.transition}`}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6">
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
                            <div><p className="font-bold mb-3">ตารางงวดของ Order นี้</p><div className="overflow-x-auto border border-slate-200 rounded-xl"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-left">งวด</th><th className="p-3 text-right">ยอด</th><th className="p-3 text-left">กำหนด</th><th className="p-3 text-left">สถานะ</th></tr></thead><tbody>{data.installments?.map(i => <tr key={i.InstallmentId} className={`border-t border-slate-100 hover:bg-orange-50/40 ${T.transition}`}><td className="p-3">งวด {i.InstallmentNo}</td><td className="p-3 text-right font-semibold">{formatMoney(i.Amount)}</td><td className="p-3">{formatDate(i.DueDate)}</td><td className="p-3"><StatusBadge name={i.Status === 'paid' ? 'ชำระแล้ว' : i.Status === 'scheduled' ? 'ยังไม่ถึงกำหนด' : i.Status === 'due' ? 'ถึงกำหนด' : 'ค้างชำระ'} /></td></tr>)}</tbody></table></div></div>
                            <div><p className="font-bold mb-3">สลิปการชำระ</p>{data.SlipUrl ? <a href={getFileUrl(data.SlipUrl)} target="_blank" rel="noreferrer"><img src={getFileUrl(data.SlipUrl)} className="max-h-96 mx-auto rounded-xl border border-slate-200 object-contain" alt="สลิปนักเรียน" /></a> : <EmptyState icon={FileText} message="ไม่มีรูปสลิป" />}</div>
                        </div>}
                    </ApiState>
                </div>
            </div>
        </div>
    );
}

function TutorPayoutModal({ item, onClose, onSuccess }) {
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
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
    const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
    return <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500">
                <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                        <Wallet className="h-4 w-4 text-white" />
                    </span>
                    บันทึกโอนค่าติวเตอร์
                </h3>
                <button type="button" onClick={onClose} className={`p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white ${T.transition}`}>
                    <X className="h-5 w-5" />
                </button>
            </div>
            <p className="px-6 pt-3 text-xs text-slate-400">{item.tutorName} · รอบ {item.period}</p>
            <div className="p-6 space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4"><p className={T.label}>ยอดที่ต้องโอน</p><p className="text-3xl font-bold text-orange-600">{formatMoney(item.amount)}</p><p className={T.caption}>{item.sessionCount} คาบ · {item.courses.join(', ')}</p></div>
                <div className="grid grid-cols-2 gap-3 text-sm"><div><p className={T.label}>ธนาคาร</p><p className="font-semibold">{item.bankName || 'ยังไม่กรอก'}</p></div><div><p className={T.label}>เลขบัญชี</p><p className="font-semibold">{item.bankAccountNumber || 'ยังไม่กรอก'}</p></div><div className="col-span-2"><p className={T.label}>ชื่อบัญชี</p><p className="font-semibold">{item.bankAccountName || 'ยังไม่กรอก'}</p></div></div>
                {!bankReady && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">ข้อมูลบัญชีติวเตอร์ไม่ครบ กรุณาแก้ในหน้าจัดการติวเตอร์ก่อนโอนเงิน</p>}
                <label className="block"><span className={T.label}>วันที่โอน *</span><input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className={`mt-1 ${inp}`} /></label>
                <label className="block"><span className={T.label}>สลิปการโอน *</span><input required type="file" accept="image/*" onChange={e => setSlip(e.target.files?.[0] || null)} className={`mt-1 ${inp}`} /></label>
                <p className={T.caption}>ระบบคำนวณยอดและสร้างเลขที่ใบจ่ายให้อัตโนมัติ ไม่ตรวจ SlipOK เพราะเป็นรายการที่แอดมินโอนออก</p>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={onClose} disabled={saving}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
                    ยกเลิก
                </button>
                <button disabled={saving || !bankReady}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition text-sm">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันว่าโอนแล้ว"}
                </button>
            </div>
        </form>
    </div>;
}