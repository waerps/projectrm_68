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

const PIE_COLORS_A = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#c2410c', '#9a3412'];
const PIE_COLORS_B = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#1d4ed8', '#1e3a8a'];

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — one system, reused everywhere. Nothing below this block
   should declare its own one-off spacing, radius, border or shadow value.
   ────────────────────────────────────────────────────────────────────── */
const T = {
    card: 'bg-white rounded-2xl border border-slate-200 shadow-sm',
    cardPad: 'p-6',
    cardPadSm: 'p-4',
    transition: 'transition duration-200 ease-out',
    title: 'text-lg font-bold text-slate-900',
    subtitle: 'text-sm text-slate-500',
    label: 'text-xs font-medium text-slate-500',
    value: 'text-2xl font-bold text-slate-900 tracking-tight',
    caption: 'text-[11px] text-slate-400',
    chartHeight: 260,
};

const CHART_TICK = { fontSize: 12, fill: '#94a3b8' };
const CHART_TOOLTIP_STYLE = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 };

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const formatDate = (d) => {
    if (!d) return '—';
    try {
        const date = new Date(String(d).includes('T') ? d : `${d}T00:00:00`);
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

/* ─── Shared: KPICard — same height, same type scale, icon small & quiet ── */
function KPICard({ label, value, sub, icon: Icon, tone = 'neutral' }) {
    const toneText = {
        neutral: 'text-slate-400',
        green: 'text-green-600',
        red: 'text-red-600',
        blue: 'text-blue-600',
        orange: 'text-orange-500',
    }[tone];

    return (
        <div className={`${T.card} ${T.cardPadSm} h-full flex flex-col justify-between hover:shadow-md ${T.transition}`}>
            <div className="flex items-center justify-between mb-2">
                <p className={T.label}>{label}</p>
                {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${toneText}`} />}
            </div>
            <p className={T.value}>{value}</p>
            {sub && <p className={`${T.caption} mt-1 truncate`}>{sub}</p>}
        </div>
    );
}

/* ─── Shared: SegmentedControl — replaces the old underline tab bar ──────── */
function SegmentedControl({ options, value, onChange }) {
    return (
        <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {options.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${T.transition} ${
                        value === id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Icon className="h-4 w-4" />{label}
                </button>
            ))}
        </div>
    );
}

/* ─── Hero: minimal white card, thin orange accent, the 5-second answer ── */
function HeroSummary({ loading, error, onRetry, revenue, revenueGrowth, profit, profitMargin, expense, expenseCount, outstanding, outstandingCount }) {
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
                        <p className={`${T.value} text-3xl mt-1`}>{formatMoney(revenue)}</p>
                        <p className={`${T.caption} mt-1.5 flex items-center gap-1`}>
                            {revenueGrowth !== null && (
                                <span className={`inline-flex items-center gap-0.5 font-semibold ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%
                                </span>
                            )}
                            <span>เทียบเดือนก่อน</span>
                        </p>
                    </div>
                    <div>
                        <p className={T.label}>กำไรสุทธิ</p>
                        <p className={`${T.value} text-3xl mt-1 ${profit < 0 ? 'text-red-600' : ''}`}>{formatMoney(profit)}</p>
                        <p className={`${T.caption} mt-1.5`}>{profitMargin === null ? 'ยังไม่มีข้อมูลเดือนนี้' : `Margin ${profitMargin}%`}</p>
                    </div>
                    <div>
                        <p className={T.label}>รายจ่าย (ติวเตอร์)</p>
                        <p className={`${T.value} text-3xl mt-1`}>{formatMoney(expense)}</p>
                        <p className={`${T.caption} mt-1.5`}>{expenseCount} รายการ</p>
                    </div>
                    <div>
                        <p className={T.label}>ยอดค้างชำระ</p>
                        <p className={`${T.value} text-3xl mt-1 ${outstanding > 0 ? 'text-red-600' : ''}`}>{formatMoney(outstanding)}</p>
                        <p className={`${T.caption} mt-1.5`}>{outstandingCount} รายการ</p>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${T.card} w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                    <h3 className={`${T.title} flex items-center gap-2.5`}>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50">
                            <Receipt className="h-4 w-4 text-orange-500" />
                        </span>
                        รายละเอียดธุรกรรม
                    </h3>
                    <button onClick={onClose} className={`p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${T.transition}`}>
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
                                    className={`w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 ${T.transition}`}
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
        <tr className={`hover:bg-slate-50 ${T.transition}`}>
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
    const [charts, setCharts] = useState({ byCourseType: [], byTerm: [], byStatus: [] });
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

    /* filters state */
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState(''); // yyyy-mm from <input type="month">, empty = all
    const [termId, setTermId] = useState('all');
    const [statusId, setStatusId] = useState('all');
    const [paymentType, setPaymentType] = useState('all');
    const [courseId, setCourseId] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [viewTxId, setViewTxId] = useState(null);
    const [exporting, setExporting] = useState(false);
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
        if (monthFilter) {
            const [y, m] = monthFilter.split('-');
            params.year = y;
            params.month = m;
        }
        if (termId !== 'all') params.termId = termId;
        if (statusId !== 'all') params.statusId = statusId;
        if (paymentType !== 'all') params.paymentType = paymentType;
        if (courseId !== 'all') params.courseId = courseId;
        if (withPaging) {
            params.page = currentPage;
            params.limit = ITEMS_PER_PAGE;
        }
        return params;
    };

    const fetchTransactions = () => {
        setTxLoading(true); setTxError(null);
        axios.get(`${FINANCE_API}/transactions`, { params: buildTxParams(true) })
            .then(r => {
                setTxData(r.data.data || []);
                setTxPagination(r.data.pagination || { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 1 });
            })
            .catch(e => setTxError(e.response?.data?.message || 'โหลดรายการธุรกรรมไม่สำเร็จ'))
            .finally(() => setTxLoading(false));
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await axios.get(`${FINANCE_API}/export`, {
                params: buildTxParams(false),
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `finance_transactions_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert(e.response?.data?.message || 'ส่งออกข้อมูลไม่สำเร็จ');
        } finally {
            setExporting(false);
        }
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

    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, monthFilter, termId, statusId, paymentType, courseId]);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, monthFilter, termId, statusId, paymentType, courseId, currentPage]);

    /* ── Derived values (same arithmetic as before — no new business logic) ── */
    const monthlyRevenue = summary?.monthlyRevenue ?? 0;
    const monthlyProfit = summary?.monthlyProfit ?? 0;
    const monthlyTutorExpense = summary?.monthlyTutorExpense ?? 0;
    const monthlyTutorExpenseCount = summary?.monthlyTutorExpenseCount ?? 0;
    const pendingApprovalAmount = summary?.pendingApprovalAmount ?? 0;
    const pendingApprovalCount = summary?.pendingApprovalCount ?? 0;
    const monthlyPendingApprovalCount = summary?.monthlyPendingApprovalCount ?? 0;
    const totalRevenueAllTime = summary?.totalRevenueAllTime ?? 0;
    const paidEnrollCount = summary?.paidEnrollCount ?? 0;
    const totalEnrollCount = summary?.totalEnrollCount ?? 0;
    const outstandingTotalAmount = summary?.outstandingTotalAmount ?? 0;
    const outstandingEnrollCount = summary?.outstandingEnrollCount ?? 0;
    const monthlyTransactionCount = summary?.monthlyTransactionCount ?? 0;

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

    const approvalSuccessRate = monthlyTransactionCount > 0
        ? Math.round(((monthlyTransactionCount - Math.min(monthlyPendingApprovalCount, monthlyTransactionCount)) / monthlyTransactionCount) * 100)
        : null;

    const avgRevenuePerStudent = paidEnrollCount > 0 ? Math.round(monthlyRevenue / paidEnrollCount) : 0;
    const paidRate = totalEnrollCount > 0 ? Math.round((paidEnrollCount / totalEnrollCount) * 100) : 0;

    const monthlyChartData = monthly.map(m => ({
        month: m.label,
        revenue: m.revenue,
        expenses: m.expense,
        profit: m.profit,
        profitTrend: m.hasActivity ? m.profit : null,
    }));

    const revenueByCourseType = (charts.byCourseType || []).map((c, i) => ({
        name: c.TypeName || 'ไม่ระบุ',
        value: Number(c.revenue) || 0,
        color: PIE_COLORS_A[i % PIE_COLORS_A.length],
    }));

    const revenueByStatus = (charts.byStatus || []).map((c, i) => ({
        name: c.Status_Payment_Name || 'ไม่ระบุ',
        value: Number(c.revenue) || 0,
        color: PIE_COLORS_B[i % PIE_COLORS_B.length],
    }));

    const totalPages = txPagination.totalPages || 1;
    const currentPageNum = txPagination.page || 1;
    const totalTx = txPagination.total || 0;

    return (
        <div className="grid grid-cols-12 gap-6 mt-[90px]">

            {/* ── Page header ── */}
            <div className="col-span-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                <div className="col-span-12 flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-2xl text-sm text-orange-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    พบ {missingPriceCount} รายการลงทะเบียนที่ยังไม่ได้กรอกราคา (FullPrice/ส่วนลด) — จะไม่ถูกนับทั้งใน "จ่ายแล้ว" และ "ค้างชำระ" จนกว่าจะกรอกราคาให้ครบ
                </div>
            )}

            {/* ── Hero: the 5-second answer — no scrolling required ── */}
            <div className="col-span-12">
                <HeroSummary
                    loading={summaryLoading}
                    error={summaryError}
                    onRetry={fetchSummary}
                    revenue={monthlyRevenue}
                    revenueGrowth={revenueGrowth}
                    profit={monthlyProfit}
                    profitMargin={profitMargin}
                    expense={monthlyTutorExpense}
                    expenseCount={monthlyTutorExpenseCount}
                    outstanding={outstandingTotalAmount}
                    outstandingCount={outstandingEnrollCount}
                />
            </div>

            {/* ── Secondary KPIs — same existing summary fields, quieter design ── */}
            <div className="col-span-12">
                <ApiState loading={summaryLoading} error={summaryError} onRetry={fetchSummary} minHeight="h-24" skeletonHeight="h-24">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <KPICard
                            label="รายรับสะสมทั้งหมด"
                            value={formatMoney(totalRevenueAllTime)}
                            sub="ตั้งแต่เริ่มดำเนินการ"
                            icon={Banknote}
                            tone="orange"
                        />
                        <KPICard
                            label="รอตรวจสอบ/ชำระ"
                            value={formatMoney(pendingApprovalAmount)}
                            sub={`${pendingApprovalCount} รายการรออนุมัติ`}
                            icon={Clock}
                            tone="blue"
                        />
                        <KPICard
                            label="นักเรียนที่ชำระแล้ว"
                            value={`${paidEnrollCount} / ${totalEnrollCount}`}
                            sub={`${paidRate}% ของนักเรียนทั้งหมด`}
                            icon={Users}
                            tone="green"
                        />
                        <KPICard
                            label="อัตราการอนุมัติสำเร็จ"
                            value={approvalSuccessRate === null ? '—' : `${approvalSuccessRate}%`}
                            sub={`${monthlyTransactionCount} รายการเดือนนี้`}
                            icon={CheckCircle}
                            tone="green"
                        />
                        <KPICard
                            label="รายรับเฉลี่ย/นักเรียน"
                            value={formatMoney(avgRevenuePerStudent)}
                            sub="คำนวณจากนักเรียนที่ชำระแล้ว"
                            icon={Target}
                            tone="neutral"
                        />
                    </div>
                </ApiState>
            </div>

            {/* ── Overview Tab ── */}
            {selectedTab === 'overview' && (
                <>
                    <div className="col-span-12 lg:col-span-6">
                        <SectionCard title="รายรับ - รายจ่าย (6 เดือน)" icon={BarChart3}>
                            <ApiState loading={monthlyLoading} error={monthlyError} onRetry={fetchMonthly} minHeight="h-64" skeletonHeight="h-64">
                                <ResponsiveContainer width="100%" height={T.chartHeight}>
                                    <BarChart data={monthlyChartData} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={v => formatMoney(v)} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar dataKey="revenue" name="รายรับ" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="expenses" name="รายจ่าย" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="profit" name="กำไร" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ApiState>
                        </SectionCard>
                    </div>

                    <div className="col-span-12 lg:col-span-6">
                        <SectionCard title="แนวโน้มกำไร" icon={TrendingUp}>
                            <ApiState loading={monthlyLoading} error={monthlyError} onRetry={fetchMonthly} minHeight="h-64" skeletonHeight="h-64">
                                <ResponsiveContainer width="100%" height={T.chartHeight}>
                                    <LineChart data={monthlyChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={v => formatMoney(v)} />
                                        <Line type="monotone" dataKey="profitTrend" stroke="#f97316" strokeWidth={2.5} name="กำไร" dot={{ fill: '#f97316', r: 5, strokeWidth: 0 }} connectNulls={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ApiState>
                        </SectionCard>
                    </div>

                    <div className="col-span-12 lg:col-span-6">
                        <SectionCard title="แหล่งรายรับ (ตามประเภทคอร์ส)" icon={PieChart}>
                            <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-64" skeletonHeight="h-64">
                                {revenueByCourseType.length === 0 ? (
                                    <EmptyState message="ยังไม่มีข้อมูลรายรับ" suggestion="ข้อมูลจะแสดงเมื่อมีการชำระเงินเข้ามาในระบบ" />
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <ResponsiveContainer width="50%" height={180}>
                                            <RePieChart>
                                                <Pie data={revenueByCourseType} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                                                    {revenueByCourseType.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={v => formatMoney(v)} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="flex-1 space-y-2.5">
                                            {revenueByCourseType.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                                                        <span className="text-slate-600 text-xs">{item.name}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-xs">{formatMoney(item.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </ApiState>
                        </SectionCard>
                    </div>

                    <div className="col-span-12 lg:col-span-6">
                        <SectionCard title="รายรับแยกตามสถานะการชำระ" icon={Wallet}>
                            <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-64" skeletonHeight="h-64">
                                {revenueByStatus.length === 0 ? (
                                    <EmptyState message="ยังไม่มีข้อมูลสถานะการชำระ" suggestion="ข้อมูลจะแสดงเมื่อมีการชำระเงินเข้ามาในระบบ" />
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <ResponsiveContainer width="50%" height={180}>
                                            <RePieChart>
                                                <Pie data={revenueByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                                                    {revenueByStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={v => formatMoney(v)} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="flex-1 space-y-2.5">
                                            {revenueByStatus.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                                                        <span className="text-slate-600 text-xs">{item.name}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-xs">{formatMoney(item.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </ApiState>
                        </SectionCard>
                    </div>
                </>
            )}

            {/* ── Transactions Tab ── */}
            {selectedTab === 'transactions' && (
                <>
                    {/* Filter row — search, month, status, payment, course on one line; export at far right */}
                    <div className="col-span-12">
                        <div className={`${T.card} ${T.cardPadSm}`}>
                            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={searchInput}
                                        onChange={e => setSearchInput(e.target.value)}
                                        placeholder="ค้นหาชื่อ, เลขบิล, คอร์ส..."
                                        className={`pl-10 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none ${T.transition}`}
                                    />
                                </div>
                                <input
                                    type="month"
                                    value={monthFilter}
                                    onChange={e => setMonthFilter(e.target.value)}
                                    className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none ${T.transition}`}
                                />
                                <select
                                    value={statusId}
                                    onChange={e => setStatusId(e.target.value)}
                                    disabled={filtersLoading}
                                    className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:opacity-50 ${T.transition}`}
                                >
                                    <option value="all">ทุกสถานะ</option>
                                    {filtersMeta.statuses.map(s => (
                                        <option key={s.Status_Payment_Id} value={s.Status_Payment_Id}>{s.Status_Payment_Name}</option>
                                    ))}
                                </select>
                                <select
                                    value={paymentType}
                                    onChange={e => setPaymentType(e.target.value)}
                                    disabled={filtersLoading}
                                    className={`h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:opacity-50 ${T.transition}`}
                                >
                                    <option value="all">ทุกวิธีชำระ</option>
                                    {filtersMeta.paymentTypes.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
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
                                <button
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className={`flex items-center gap-2 h-10 px-4 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 lg:ml-auto ${T.transition}`}
                                >
                                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}ส่งออก
                                </button>
                            </div>
                            {filtersError && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-red-500">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {filtersError}
                                    <button onClick={fetchFiltersMeta} className="font-semibold underline underline-offset-2">ลองใหม่</button>
                                </div>
                            )}
                            <p className={`${T.caption} mt-2 pl-1`}>
                                แสดง {txData.length} จาก {totalTx.toLocaleString()} รายการ
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="col-span-12">
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
                                                    {['รหัส', 'รายการ', 'หมวดหมู่', 'ผู้ชำระ', 'วิธีชำระ', 'จำนวนเงิน', 'สถานะ', ''].map((h, i) => (
                                                        <th key={i} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i === 5 ? 'text-right' : 'text-left'}`}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {txData.map(txn => (
                                                    <TransactionRow key={txn.StudentPaymentId} txn={txn} onView={setViewTxId} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </ApiState>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="col-span-12 flex items-center justify-between flex-wrap gap-3">
                            <p className={T.subtitle}>
                                หน้า <span className="font-semibold text-slate-700">{currentPageNum}</span> จาก <span className="font-semibold text-slate-700">{totalPages}</span> · ทั้งหมด <span className="font-semibold text-slate-700">{totalTx.toLocaleString()}</span> รายการ
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPageNum === 1}
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 ${T.transition}`}>
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPageNum) <= 1)
                                    .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                                    .map((p, idx) => p === '...' ? (
                                        <span key={`d${idx}`} className="flex h-9 w-9 items-center justify-center text-slate-400 text-sm">…</span>
                                    ) : (
                                        <button key={p} onClick={() => setCurrentPage(p)}
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium ${T.transition} ${currentPageNum === p ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600'}`}>
                                            {p}
                                        </button>
                                    ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPageNum === totalPages}
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 ${T.transition}`}>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Transaction Detail Modal ── */}
            {viewTxId && (
                <TransactionDetailModal transactionId={viewTxId} onClose={() => setViewTxId(null)} />
            )}
        </div>
    );
}