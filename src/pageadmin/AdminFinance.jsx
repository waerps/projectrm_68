import { useState } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown, Users, Calendar,
    CreditCard, FileText, Download, Search, Eye, Plus,
    ArrowUpRight, ArrowDownRight, Target, Wallet, BarChart3,
    Clock, CheckCircle, AlertCircle, XCircle, Banknote,
    Receipt, User, Phone, X, ChevronLeft, ChevronRight, PieChart
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

/* ─── Status & Type helpers ──────────────────────────────────────────────────── */
const STATUS_CONFIG = {
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'สำเร็จ' },
    pending:   { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200',  icon: Clock,        label: 'รอตรวจสอบ' },
    overdue:   { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     icon: AlertCircle,  label: 'เกินกำหนด' },
    cancelled: { bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200',   icon: XCircle,      label: 'ยกเลิก' },
};

function StatusBadge({ status }) {
    const { bg, text, border, icon: Icon, label } = STATUS_CONFIG[status] ?? STATUS_CONFIG.cancelled;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
            <Icon className="h-3 w-3" />{label}
        </span>
    );
}

function TypeBadge({ type }) {
    if (type === 'income')
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ArrowDownRight className="h-3 w-3" />รายรับ
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
            <ArrowUpRight className="h-3 w-3" />รายจ่าย
        </span>
    );
}

/* ─── Transaction Detail Modal ───────────────────────────────────────────────── */
function TransactionModal({ txn, onClose }) {
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

                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    {/* Amount header */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-sm font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-lg">
                                {txn.id}
                            </span>
                            <StatusBadge status={txn.status} />
                        </div>
                        <p className={`text-2xl font-black mb-1.5 ${txn.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {txn.type === 'income' ? '+' : '-'}฿{txn.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-600">{txn.description}</p>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'ประเภท',    value: <TypeBadge type={txn.type} /> },
                            { label: 'หมวดหมู่',  value: txn.category },
                            { label: 'วันที่',     value: txn.date, icon: Calendar },
                            { label: 'วิธีชำระ',  value: txn.paymentMethod, icon: CreditCard },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                                <p className="text-xs text-slate-500 font-medium mb-1.5">{label}</p>
                                {typeof value === 'string' ? (
                                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                        {Icon && <Icon className="h-3.5 w-3.5 text-orange-500" />}
                                        {value}
                                    </p>
                                ) : value}
                            </div>
                        ))}
                    </div>

                    {/* Payer info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">ข้อมูลผู้ชำระ</p>
                        <div className="flex items-center gap-2 text-sm text-slate-900">
                            <User className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="font-semibold">{txn.payer}</span>
                        </div>
                        {txn.phone !== '-' && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="h-4 w-4 text-blue-500 shrink-0" />
                                <span>{txn.phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Slip */}
                    {txn.slip && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-orange-500" />สลิปการโอนเงิน
                            </p>
                            <div className="bg-slate-100 rounded-lg h-36 flex items-center justify-center border border-dashed border-slate-300">
                                <p className="text-sm text-slate-400">{txn.slip}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                            พิมพ์ใบเสร็จ
                        </button>
                        {txn.status === 'pending' && (
                            <button className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition">
                                อนุมัติรายการ
                            </button>
                        )}
                        {txn.status === 'overdue' && (
                            <button className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition">
                                ติดตามการชำระ
                            </button>
                        )}
                    </div>
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
                    {txn.id}
                </span>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-900 leading-tight max-w-[200px] truncate">{txn.description}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{txn.date}
                </p>
            </td>
            <td className="px-4 py-3"><TypeBadge type={txn.type} /></td>
            <td className="px-4 py-3">
                <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                    {txn.category}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {txn.payer}
                </div>
                {txn.phone !== '-' && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <Phone className="h-3 w-3 shrink-0" />{txn.phone}
                    </div>
                )}
            </td>
            <td className="px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {txn.paymentMethod}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <p className={`text-sm font-black ${txn.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {txn.type === 'income' ? '+' : '-'}฿{txn.amount.toLocaleString()}
                </p>
            </td>
            <td className="px-4 py-3"><StatusBadge status={txn.status} /></td>
            <td className="px-4 py-3">
                <button
                    onClick={() => onView(txn)}
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
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedTab, setSelectedTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const ITEMS_PER_PAGE = 10;

    const stats = {
        totalRevenue: 2450000,
        monthlyRevenue: 385000,
        pendingPayments: 125000,
        expenses: 180000,
        profit: 205000,
        totalStudents: 247,
        activeStudents: 195,
        tutorSalaries: 165000,
        revenueGrowth: 15.3,
        profitMargin: 53.2,
    };

    const monthlyRevenueData = [
        { month: 'ส.ค.', revenue: 320000, expenses: 145000, profit: 175000 },
        { month: 'ก.ย.', revenue: 340000, expenses: 152000, profit: 188000 },
        { month: 'ต.ค.', revenue: 365000, expenses: 165000, profit: 200000 },
        { month: 'พ.ย.', revenue: 350000, expenses: 158000, profit: 192000 },
        { month: 'ธ.ค.', revenue: 395000, expenses: 172000, profit: 223000 },
        { month: 'ม.ค.', revenue: 385000, expenses: 180000, profit: 205000 },
    ];

    const revenueSourcesData = [
        { name: 'คอร์สรวม',  value: 185000, color: '#f97316' },
        { name: 'คอร์สเดี่ยว', value: 95000, color: '#fb923c' },
        { name: 'NETSAT',   value: 75000, color: '#fdba74' },
        { name: 'A-Level',  value: 30000, color: '#fed7aa' },
    ];

    const expensesData = [
        { name: 'เงินเดือนติวเตอร์', value: 165000, color: '#3b82f6' },
        { name: 'ค่าเช่าสถานที่',    value: 45000,  color: '#60a5fa' },
        { name: 'สื่อการสอน',        value: 25000,  color: '#93c5fd' },
        { name: 'สาธารณูปโภค',       value: 18000,  color: '#bfdbfe' },
        { name: 'อื่นๆ',             value: 12000,  color: '#dbeafe' },
    ];

    const [transactions] = useState([
        { id: 'TXN001', date: '15 ม.ค. 2568', type: 'income',  category: 'คอร์สรวม',  description: 'ชำระค่าเทอม 1/2568 - ด.ญ. สมใจ รักเรียน',    amount: 17000, status: 'completed', paymentMethod: 'โอนเงิน',     payer: 'คุณสมศรี รักเรียน',  phone: '089-765-4321', slip: 'slip_001.jpg' },
        { id: 'TXN002', date: '15 ม.ค. 2568', type: 'expense', category: 'เงินเดือนติวเตอร์', description: 'เงินเดือน ม.ค. 2568 - อ.สมชาย ใจดี',    amount: 35000, status: 'completed', paymentMethod: 'โอนเงิน',     payer: 'สถาบัน',            phone: '-',            slip: null },
        { id: 'TXN003', date: '14 ม.ค. 2568', type: 'income',  category: 'NETSAT',    description: 'ชำระค่าคอร์ส NETSAT - ด.ช. วิทย์ ขยัน',       amount: 15000, status: 'completed', paymentMethod: 'เงินสด',      payer: 'คุณมานิต ขยัน',     phone: '088-654-3210', slip: null },
        { id: 'TXN004', date: '14 ม.ค. 2568', type: 'income',  category: 'คอร์สเดี่ยว', description: 'ชำระค่าคอร์สเดี่ยว - ด.ญ. สุดา เก่ง',      amount: 8500,  status: 'pending',   paymentMethod: 'รอตรวจสอบ',  payer: 'คุณวิมล เก่ง',      phone: '087-543-2109', slip: 'slip_004.jpg' },
        { id: 'TXN005', date: '13 ม.ค. 2568', type: 'expense', category: 'ค่าเช่า',   description: 'ค่าเช่าสถานที่ ม.ค. 2568',                     amount: 45000, status: 'completed', paymentMethod: 'โอนเงิน',     payer: 'สถาบัน',            phone: '-',            slip: null },
        { id: 'TXN006', date: '12 ม.ค. 2568', type: 'income',  category: 'คอร์สรวม',  description: 'ชำระค่าเทอม 1/2568 - ด.ช. มานะ พยายาม',        amount: 17000, status: 'overdue',   paymentMethod: 'ยังไม่ชำระ', payer: 'คุณสมพร พยายาม',   phone: '086-432-1098', slip: null },
        { id: 'TXN007', date: '11 ม.ค. 2568', type: 'expense', category: 'สื่อการสอน', description: 'ซื้อหนังสือและเอกสาร',                         amount: 12500, status: 'completed', paymentMethod: 'เงินสด',      payer: 'สถาบัน',            phone: '-',            slip: null },
        { id: 'TXN008', date: '10 ม.ค. 2568', type: 'income',  category: 'A-Level',   description: 'ชำระค่าคอร์ส A-Level - ด.ญ. ปัญญา ฉลาด',       amount: 22000, status: 'completed', paymentMethod: 'โอนเงิน',     payer: 'คุณสุรีย์ ฉลาด',   phone: '085-321-0987', slip: 'slip_008.jpg' },
    ]);

    const filtered = transactions.filter(t => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || t.description.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.payer.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchType   = typeFilter   === 'all' || t.type   === typeFilter;
        return matchSearch && matchStatus && matchType;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const pendingCount = transactions.filter(t => t.status === 'pending' || t.status === 'overdue').length;

    return (
        <div className="space-y-6 mt-[90px]">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">การเงินสถาบัน</h1>
                    <p className="text-sm text-slate-500 mt-1">ภาพรวมรายรับ-รายจ่าย และจัดการธุรกรรมทั้งหมด</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition shadow-sm">
                        <Download className="h-4 w-4" />ส่งออกรายงาน
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-sm transition">
                        <Plus className="h-4 w-4" />บันทึกรายการ
                    </button>
                </div>
            </div>

            {/* ── Period selector ── */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium mr-1">ช่วงเวลา</span>
                {[
                    { key: 'day', label: 'วันนี้' },
                    { key: 'week', label: 'สัปดาห์' },
                    { key: 'month', label: 'เดือนนี้' },
                    { key: 'year', label: 'ปีนี้' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setSelectedPeriod(key)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                            selectedPeriod === key
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: 'รายรับเดือนนี้',
                        value: `฿${stats.monthlyRevenue.toLocaleString()}`,
                        sub: `+${stats.revenueGrowth}% จากเดือนที่แล้ว`,
                        color: 'bg-emerald-500',
                        icon: TrendingUp,
                    },
                    {
                        label: 'กำไรสุทธิ',
                        value: `฿${stats.profit.toLocaleString()}`,
                        sub: `Margin ${stats.profitMargin}%`,
                        color: 'bg-blue-500',
                        icon: Target,
                    },
                    {
                        label: 'รอตรวจสอบ/ชำระ',
                        value: `฿${stats.pendingPayments.toLocaleString()}`,
                        sub: `${pendingCount} รายการรออนุมัติ`,
                        color: 'bg-yellow-500',
                        icon: Clock,
                    },
                    {
                        label: 'ค่าใช้จ่ายเดือนนี้',
                        value: `฿${stats.expenses.toLocaleString()}`,
                        sub: `เงินเดือนติวเตอร์ ฿${stats.tutorSalaries.toLocaleString()}`,
                        color: 'bg-red-500',
                        icon: TrendingDown,
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

            {/* ── Tabs ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    {[
                        { id: 'overview',      label: 'ภาพรวม',        icon: BarChart3 },
                        { id: 'transactions',  label: 'รายการธุรกรรม', icon: Receipt },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setSelectedTab(id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition ${
                                selectedTab === id
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
                            {/* Charts row */}
                            <div className="grid gap-5 lg:grid-cols-2">
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-orange-500" />
                                        รายรับ - รายจ่าย (6 เดือน)
                                    </h3>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={monthlyRevenueData} barGap={4}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }}
                                                formatter={v => `฿${v.toLocaleString()}`}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                            <Bar dataKey="revenue"  name="รายรับ"  fill="#22c55e" radius={[6,6,0,0]} />
                                            <Bar dataKey="expenses" name="รายจ่าย" fill="#ef4444" radius={[6,6,0,0]} />
                                            <Bar dataKey="profit"   name="กำไร"    fill="#3b82f6" radius={[6,6,0,0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-orange-500" />
                                        แนวโน้มกำไร
                                    </h3>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart data={monthlyRevenueData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }}
                                                formatter={v => `฿${v.toLocaleString()}`}
                                            />
                                            <Line type="monotone" dataKey="profit" stroke="#f97316" strokeWidth={2.5} name="กำไร" dot={{ fill: '#f97316', r: 5, strokeWidth: 0 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pie charts row */}
                            <div className="grid gap-5 lg:grid-cols-2">
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <PieChart className="h-4 w-4 text-orange-500" />
                                        แหล่งรายรับ
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <ResponsiveContainer width="50%" height={180}>
                                            <RePieChart>
                                                <Pie data={revenueSourcesData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                                                    {revenueSourcesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip formatter={v => `฿${v.toLocaleString()}`} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="flex-1 space-y-2.5">
                                            {revenueSourcesData.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                                                        <span className="text-slate-600 text-xs">{item.name}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-xs">฿{item.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-orange-500" />
                                        ค่าใช้จ่ายแยกหมวด
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <ResponsiveContainer width="50%" height={180}>
                                            <RePieChart>
                                                <Pie data={expensesData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                                                    {expensesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip formatter={v => `฿${v.toLocaleString()}`} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="flex-1 space-y-2.5">
                                            {expensesData.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                                                        <span className="text-slate-600 text-xs">{item.name}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-xs">฿{item.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick KPIs */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 font-medium">นักเรียนที่ชำระแล้ว</p>
                                        <p className="text-lg font-black text-slate-900">{stats.activeStudents} / {stats.totalStudents}</p>
                                        <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${(stats.activeStudents / stats.totalStudents) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                                        <CheckCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">อัตราชำระตรงเวลา</p>
                                        <p className="text-lg font-black text-slate-900">78.9%</p>
                                        <p className="text-[10px] text-emerald-600 mt-0.5">↑ ดีขึ้น +5% จากเดือนที่แล้ว</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                                    <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                                        <Banknote className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">รายรับเฉลี่ย/นักเรียน</p>
                                        <p className="text-lg font-black text-slate-900">
                                            ฿{Math.round(stats.monthlyRevenue / stats.activeStudents).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">คำนวณจากนักเรียนที่ชำระแล้ว</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Transactions Tab ── */}
                    {selectedTab === 'transactions' && (
                        <div className="space-y-4">
                            {/* Sub-stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'รายรับทั้งหมด',  value: `฿${filtered.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0).toLocaleString()}`,  color: 'bg-emerald-500', icon: TrendingUp },
                                    { label: 'รายจ่ายทั้งหมด', value: `฿${filtered.filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0).toLocaleString()}`, color: 'bg-red-500',     icon: TrendingDown },
                                    { label: 'รายการทั้งหมด',  value: `${filtered.length} รายการ`,                                                                       color: 'bg-blue-500',    icon: Receipt },
                                    { label: 'รอดำเนินการ',    value: `${filtered.filter(t => t.status==='pending'||t.status==='overdue').length} รายการ`,               color: 'bg-yellow-500',  icon: Clock },
                                ].map(({ label, value, color, icon: Icon }, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-slate-500 font-medium truncate">{label}</p>
                                            <p className="text-sm font-black text-slate-900">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Search & filter */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={searchQuery}
                                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                            placeholder="ค้นหารายการ, รหัส, ชื่อผู้ชำระ..."
                                            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
                                        />
                                    </div>
                                    <select
                                        value={typeFilter}
                                        onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                    >
                                        <option value="all">ทุกประเภท</option>
                                        <option value="income">รายรับ</option>
                                        <option value="expense">รายจ่าย</option>
                                    </select>
                                    <select
                                        value={statusFilter}
                                        onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                    >
                                        <option value="all">ทุกสถานะ</option>
                                        <option value="completed">สำเร็จ</option>
                                        <option value="pending">รอตรวจสอบ</option>
                                        <option value="overdue">เกินกำหนด</option>
                                        <option value="cancelled">ยกเลิก</option>
                                    </select>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition">
                                        <Download className="h-4 w-4" />ส่งออก
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 pl-1">
                                    แสดง {filtered.length} จาก {transactions.length} รายการ
                                </p>
                            </div>

                            {/* Table */}
                            {paginated.length === 0 ? (
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
                                                    {['รหัส', 'รายการ', 'ประเภท', 'หมวดหมู่', 'ผู้ชำระ', 'วิธีชำระ', 'จำนวนเงิน', 'สถานะ', ''].map((h, i) => (
                                                        <th key={i} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i >= 6 ? 'text-right' : 'text-left'}`}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {paginated.map(txn => (
                                                    <TransactionRow key={txn.id} txn={txn} onView={setSelectedTransaction} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500">
                                        แสดง <span className="font-semibold">{(currentPage-1)*ITEMS_PER_PAGE+1}–{Math.min(currentPage*ITEMS_PER_PAGE, filtered.length)}</span> จาก <span className="font-semibold">{filtered.length}</span> รายการ
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 transition">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i+1)
                                            .filter(p => p===1 || p===totalPages || Math.abs(p-currentPage)<=1)
                                            .reduce((acc, p, idx, arr) => { if (idx>0 && p-arr[idx-1]>1) acc.push('...'); acc.push(p); return acc; }, [])
                                            .map((p, idx) => p==='...' ? (
                                                <span key={`d${idx}`} className="flex h-9 w-9 items-center justify-center text-slate-400 text-sm">…</span>
                                            ) : (
                                                <button key={p} onClick={() => setCurrentPage(p)}
                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${currentPage===p ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}
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

            {/* ── Transaction Detail Modal ── */}
            {selectedTransaction && (
                <TransactionModal txn={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
            )}
        </div>
    );
}