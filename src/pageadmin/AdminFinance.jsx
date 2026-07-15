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
    Loader2, RefreshCw, FileText,
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const FINANCE_API = `${API_URL}/api/admin/finance`;
const ITEMS_PER_PAGE = 10;

const PIE_COLORS_A = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#c2410c', '#9a3412'];
const PIE_COLORS_B = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#1d4ed8', '#1e3a8a'];

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
    if (name.includes('รอ')) return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock };
    if (name.includes('ยกเลิก')) return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', icon: XCircle };
    if (name.includes('เกิน') || name.includes('ค้าง')) return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: AlertCircle };
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle };
}

function StatusBadge({ name }) {
    const { bg, text, border, icon: Icon } = getStatusStyle(name || '');
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
            <Icon className="h-3 w-3" />{name || 'ไม่ระบุสถานะ'}
        </span>
    );
}

/* ─── Reusable Loading / Error wrapper for each API-backed section ──────── */
function ApiState({ loading, error, onRetry, loadingLabel, minHeight = 'h-40', children }) {
    if (loading) {
        return (
            <div className={`flex flex-col items-center justify-center ${minHeight} text-orange-500`}>
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-xs text-slate-400">{loadingLabel || 'กำลังโหลดข้อมูล...'}</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center ${minHeight} text-center px-4`}>
                <AlertCircle className="h-6 w-6 text-red-400 mb-2" />
                <p className="text-xs text-slate-500 mb-3">{error}</p>
                <button
                    onClick={onRetry}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition"
                >
                    <RefreshCw className="h-3.5 w-3.5" />ลองใหม่
                </button>
            </div>
        );
    }
    return children;
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
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
                    <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                            <Receipt className="h-4 w-4 text-white" />
                        </span>
                        รายละเอียดธุรกรรม
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    <ApiState loading={loading} error={error} onRetry={load} loadingLabel="กำลังโหลดรายละเอียด...">
                        {data && (
                            <div className="space-y-5">
                                {/* Amount header */}
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-mono text-sm font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-lg">
                                            #{data.StudentPaymentId}
                                        </span>
                                        <StatusBadge name={data.Status_Payment_Name} />
                                    </div>
                                    <p className="text-2xl font-black mb-1.5 text-emerald-600">
                                        +{formatMoney(data.Price)}
                                    </p>
                                    <p className="text-sm text-slate-600">{txDescription(data)}</p>
                                </div>

                                {/* Details grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'ประเภทคอร์ส', value: data.CourseTypeName || data.Course_Type || '—' },
                                        { label: 'เทอม', value: data.Term_Name || '—' },
                                        { label: 'วันที่ชำระ', value: formatDate(data.PaymentDate), icon: Calendar },
                                        { label: 'วิธีชำระ', value: data.PaymentType || '—', icon: CreditCard },
                                        { label: 'เลขที่บิล', value: data.BillNo || '—', icon: FileText },
                                        { label: 'ธนาคาร/บัญชี', value: data.BankAccountName ? `${data.BankAccountName}${data.PaymentBankName ? ' · ' + data.PaymentBankName : ''}` : '—', icon: Banknote },
                                    ].map(({ label, value, icon: Icon }) => (
                                        <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                                            <p className="text-xs text-slate-500 font-medium mb-1.5">{label}</p>
                                            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                                {Icon && <Icon className="h-3.5 w-3.5 text-orange-500" />}
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Payer info */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
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

                                {/* Slip */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-orange-500" />สลิปการโอนเงิน
                                    </p>
                                    {data.PaymentPicture ? (
                                        <img
                                            src={getFileUrl(data.PaymentPicture)}
                                            alt="สลิปการโอนเงิน"
                                            className="w-full max-h-72 object-contain rounded-lg border border-slate-200 bg-slate-50"
                                        />
                                    ) : (
                                        <div className="bg-slate-100 rounded-lg h-36 flex items-center justify-center border border-dashed border-slate-300">
                                            <p className="text-sm text-slate-400">ไม่มีสลิปแนบ</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
                                    >
                                        พิมพ์ใบเสร็จ
                                    </button>
                                </div>
                            </div>
                        )}
                    </ApiState>
                </div>
            </div>
        </div>
    );
}

/* ─── Transaction Row ────────────────────────────────────────────────────────── */
function TransactionRow({ txn, onView }) {
    return (
        <tr className="hover:bg-orange-50/40 transition-colors">
            <td className="px-4 py-3">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    #{txn.StudentPaymentId}
                </span>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-900 leading-tight max-w-[220px] truncate">{txDescription(txn)}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
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
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
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
                <p className="text-sm font-black text-emerald-600">
                    +{formatMoney(txn.Price)}
                </p>
            </td>
            <td className="px-4 py-3"><StatusBadge name={txn.Status_Payment_Name} /></td>
            <td className="px-4 py-3">
                <button
                    onClick={() => onView(txn.StudentPaymentId)}
                    className="p-1.5 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition"
                    title="ดูรายละเอียด"
                >
                    <Eye className="h-3.5 w-3.5" />
                </button>
            </td>
        </tr>
    );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
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
    const [termId, setTermId] = useState('all');
    const [statusId, setStatusId] = useState('all');
    const [paymentType, setPaymentType] = useState('all');
    const [courseId, setCourseId] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [viewTxId, setViewTxId] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [missingPriceCount, setMissingPriceCount] = useState(0);

    /* ── Fetchers ──────────────────────────────────────────────────────── */
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
            .catch(() => { }); // เงียบไว้ ไม่ใช่ critical path ของหน้า
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, termId, statusId, paymentType, courseId]);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, termId, statusId, paymentType, courseId, currentPage]);

    /* ── Derived values (computed only from real API data — no invented numbers) ── */
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
        <div className="space-y-6 mt-[90px]">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">การเงินสถาบัน</h1>
                    <p className="text-sm text-slate-500 mt-1">ภาพรวมรายรับ-รายจ่าย และจัดการธุรกรรมทั้งหมด</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
                    >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        ส่งออกรายงาน
                    </button>
                </div>
            </div>

            {missingPriceCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    พบ {missingPriceCount} รายการลงทะเบียนที่ยังไม่ได้กรอกราคา (FullPrice/ส่วนลด) — จะไม่ถูกนับทั้งใน "จ่ายแล้ว" และ "ค้างชำระ" จนกว่าจะกรอกราคาให้ครบ
                </div>
            )}

            {/* ── Stats cards (from GET /summary) ── */}
            <ApiState loading={summaryLoading} error={summaryError} onRetry={fetchSummary} minHeight="h-24">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'รายรับเดือนนี้',
                            value: formatMoney(monthlyRevenue),
                            sub: revenueGrowth === null ? 'เทียบเดือนก่อนหน้า' : `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% จากเดือนที่แล้ว`,
                            color: 'bg-emerald-500',
                            icon: TrendingUp,
                        },
                        {
                            label: 'กำไรสุทธิ (เดือนนี้)',
                            value: formatMoney(monthlyProfit),
                            sub: profitMargin === null
                                ? (monthlyProfit < 0 ? 'ไม่มีรายรับเทียบ (ขาดทุนล้วน)' : 'ยังไม่มีข้อมูลเดือนนี้')
                                : `Margin ${profitMargin}%`,
                            color: 'bg-blue-500',
                            icon: Target,
                        },
                        {
                            label: 'รอตรวจสอบ/ชำระ',
                            value: formatMoney(pendingApprovalAmount),
                            sub: `${pendingApprovalCount} รายการรออนุมัติ`,
                            color: 'bg-yellow-500',
                            icon: Clock,
                        },
                        {
                            label: 'ค่าใช้จ่ายเดือนนี้ (ติวเตอร์)',
                            value: formatMoney(monthlyTutorExpense),
                            sub: `${monthlyTutorExpenseCount} รายการ`,
                            color: 'bg-red-500',
                            icon: TrendingDown,
                        },
                        {
                            label: 'ยอดค้างชำระ',
                            value: formatMoney(outstandingTotalAmount),
                            sub: `${outstandingEnrollCount} รายการค้างชำระ`,
                            color: 'bg-amber-500',
                            icon: Wallet,
                        },
                        {
                            label: 'รายรับสะสมทั้งหมด',
                            value: formatMoney(totalRevenueAllTime),
                            sub: 'ตั้งแต่เริ่มดำเนินการ',
                            color: 'bg-orange-600',
                            icon: Banknote,
                        },
                    ].map(({ label, value, sub, color, icon: Icon }, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
                            <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                                <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
                                <p className="text-lg font-black text-slate-900 leading-tight">{value}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ApiState>

            {/* ── Tabs ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
                        { id: 'transactions', label: 'รายการธุรกรรม', icon: Receipt },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setSelectedTab(id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition ${selectedTab === id
                                ? 'text-orange-600 border-b-2 border-orange-500 -mb-px'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <Icon className="h-4 w-4" />{label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* ── Overview Tab ── */}
                    {selectedTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Charts row (from GET /monthly) */}
                            <div className="grid gap-5 lg:grid-cols-2">
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-orange-500" />
                                        รายรับ - รายจ่าย (6 เดือน)
                                    </h3>
                                    <ApiState loading={monthlyLoading} error={monthlyError} onRetry={fetchMonthly} minHeight="h-64">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={monthlyChartData} barGap={4}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }}
                                                    formatter={v => formatMoney(v)}
                                                />
                                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                                <Bar dataKey="revenue" name="รายรับ" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                                <Bar dataKey="expenses" name="รายจ่าย" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                                <Bar dataKey="profit" name="กำไร" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ApiState>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-orange-500" />
                                        แนวโน้มกำไร
                                    </h3>
                                    <ApiState loading={monthlyLoading} error={monthlyError} onRetry={fetchMonthly} minHeight="h-64">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <LineChart data={monthlyChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }}
                                                    formatter={v => formatMoney(v)}
                                                />
                                                <Line type="monotone" dataKey="profitTrend" stroke="#f97316" strokeWidth={2.5} name="กำไร" dot={{ fill: '#f97316', r: 5, strokeWidth: 0 }} connectNulls={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </ApiState>
                                </div>
                            </div>

                            {/* Pie charts row (from GET /charts) */}
                            <div className="grid gap-5 lg:grid-cols-2">
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <PieChart className="h-4 w-4 text-orange-500" />
                                        แหล่งรายรับ (ตามประเภทคอร์ส)
                                    </h3>
                                    <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-44">
                                        {revenueByCourseType.length === 0 ? (
                                            <p className="text-center text-sm text-slate-400 py-10">ยังไม่มีข้อมูล</p>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <ResponsiveContainer width="50%" height={180}>
                                                    <RePieChart>
                                                        <Pie data={revenueByCourseType} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                                                            {revenueByCourseType.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                        </Pie>
                                                        <Tooltip formatter={v => formatMoney(v)} />
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
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-orange-500" />
                                        รายรับแยกตามสถานะการชำระ
                                    </h3>
                                    <ApiState loading={chartsLoading} error={chartsError} onRetry={fetchCharts} minHeight="h-44">
                                        {revenueByStatus.length === 0 ? (
                                            <p className="text-center text-sm text-slate-400 py-10">ยังไม่มีข้อมูล</p>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <ResponsiveContainer width="50%" height={180}>
                                                    <RePieChart>
                                                        <Pie data={revenueByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                                                            {revenueByStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                        </Pie>
                                                        <Tooltip formatter={v => formatMoney(v)} />
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
                                </div>
                            </div>

                            {/* Quick KPIs (from GET /summary) */}
                            <ApiState loading={summaryLoading} error={summaryError} onRetry={fetchSummary} minHeight="h-24">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                                        <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                                            <Users className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-500 font-medium">นักเรียนที่ชำระแล้ว</p>
                                            <p className="text-lg font-black text-slate-900">{paidEnrollCount} / {totalEnrollCount}</p>
                                            <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${paidRate}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                                            <CheckCircle className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">อัตราการอนุมัติสำเร็จ (เดือนนี้)</p>
                                            <p className="text-lg font-black text-slate-900">{approvalSuccessRate === null ? '—' : `${approvalSuccessRate}%`}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{monthlyTransactionCount} รายการในเดือนนี้</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                                            <Banknote className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">รายรับเฉลี่ย/นักเรียน</p>
                                            <p className="text-lg font-black text-slate-900">{formatMoney(avgRevenuePerStudent)}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">คำนวณจากนักเรียนที่ชำระแล้ว</p>
                                        </div>
                                    </div>
                                </div>
                            </ApiState>
                        </div>
                    )}

                    {/* ── Transactions Tab ── */}
                    {selectedTab === 'transactions' && (
                        <div className="space-y-4">
                            {/* Search & filter (dropdowns from GET /filters-meta) */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                                <div className="flex flex-col md:flex-row gap-3 flex-wrap">
                                    <div className="relative flex-1 min-w-[220px]">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={searchInput}
                                            onChange={e => setSearchInput(e.target.value)}
                                            placeholder="ค้นหาชื่อ, เลขบิล, คอร์ส..."
                                            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
                                        />
                                    </div>
                                    <select
                                        value={termId}
                                        onChange={e => setTermId(e.target.value)}
                                        disabled={filtersLoading}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:opacity-50"
                                    >
                                        <option value="all">ทุกเทอม</option>
                                        {filtersMeta.terms.map(t => (
                                            <option key={t.Term_Id} value={t.Term_Id}>{t.Term_Name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={statusId}
                                        onChange={e => setStatusId(e.target.value)}
                                        disabled={filtersLoading}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:opacity-50"
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
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:opacity-50"
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
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:opacity-50 md:max-w-[200px]"
                                    >
                                        <option value="all">ทุกคอร์ส</option>
                                        {filtersMeta.courses.map(c => (
                                            <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleExport}
                                        disabled={exporting}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition"
                                    >
                                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}ส่งออก
                                    </button>
                                </div>
                                {filtersError && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-red-500">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {filtersError}
                                        <button onClick={fetchFiltersMeta} className="font-bold underline underline-offset-2">ลองใหม่</button>
                                    </div>
                                )}
                                <p className="text-xs text-slate-400 mt-2 pl-1">
                                    แสดง {txData.length} จาก {totalTx.toLocaleString()} รายการ
                                </p>
                            </div>

                            {/* Table (from GET /transactions) */}
                            <ApiState loading={txLoading} error={txError} onRetry={fetchTransactions} minHeight="h-64">
                                {txData.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                                        <div className="text-5xl mb-3">🧾</div>
                                        <p className="text-slate-500 font-medium">ไม่พบรายการที่ค้นหา</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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

                            {/* Pagination (driven entirely by backend pagination fields) */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <p className="text-sm text-slate-500">
                                        หน้า <span className="font-semibold">{currentPageNum}</span> จาก <span className="font-semibold">{totalPages}</span> · ทั้งหมด <span className="font-semibold">{totalTx.toLocaleString()}</span> รายการ
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPageNum === 1}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 transition">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPageNum) <= 1)
                                            .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                                            .map((p, idx) => p === '...' ? (
                                                <span key={`d${idx}`} className="flex h-9 w-9 items-center justify-center text-slate-400 text-sm">…</span>
                                            ) : (
                                                <button key={p} onClick={() => setCurrentPage(p)}
                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${currentPageNum === p ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPageNum === totalPages}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 transition">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Transaction Detail Modal (always re-fetches GET /transaction/:id) ── */}
            {viewTxId && (
                <TransactionDetailModal transactionId={viewTxId} onClose={() => setViewTxId(null)} />
            )}
        </div>
    );
}