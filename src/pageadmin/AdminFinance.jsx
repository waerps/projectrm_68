import { useState } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown, Users, BookOpen, Calendar,
    CreditCard, FileText, Download, Filter, Search, Eye, Plus,
    ArrowUpRight, ArrowDownRight, Wallet, PieChart, BarChart3,
    Clock, CheckCircle, AlertCircle, XCircle, RefreshCw, Target,
    Banknote, Receipt, Building, User, Mail, Phone, X
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminFinance() {
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedTab, setSelectedTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // ข้อมูลสถิติรวม
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
        profitMargin: 53.2
    };

    // ข้อมูลรายได้รายเดือน (6 เดือนล่าสุด)
    const monthlyRevenueData = [
        { month: 'ส.ค.', revenue: 320000, expenses: 145000, profit: 175000 },
        { month: 'ก.ย.', revenue: 340000, expenses: 152000, profit: 188000 },
        { month: 'ต.ค.', revenue: 365000, expenses: 165000, profit: 200000 },
        { month: 'พ.ย.', revenue: 350000, expenses: 158000, profit: 192000 },
        { month: 'ธ.ค.', revenue: 395000, expenses: 172000, profit: 223000 },
        { month: 'ม.ค.', revenue: 385000, expenses: 180000, profit: 205000 }
    ];

    // ข้อมูลแหล่งรายได้
    const revenueSourcesData = [
        { name: 'คอร์สรวม', value: 185000, color: '#f97316' },
        { name: 'คอร์สเดี่ยว', value: 95000, color: '#fb923c' },
        { name: 'NETSAT', value: 75000, color: '#fdba74' },
        { name: 'A-Level', value: 30000, color: '#fed7aa' }
    ];

    // ข้อมูลค่าใช้จ่าย
    const expensesData = [
        { name: 'เงินเดือนติวเตอร์', value: 165000, color: '#3b82f6' },
        { name: 'ค่าเช่าสถานที่', value: 45000, color: '#60a5fa' },
        { name: 'สื่อการสอน', value: 25000, color: '#93c5fd' },
        { name: 'สาธารณูปโภค', value: 18000, color: '#bfdbfe' },
        { name: 'อื่นๆ', value: 12000, color: '#dbeafe' }
    ];

    // รายการธุรกรรม
    const [transactions] = useState([
        {
            id: 'TXN001',
            date: '15 ม.ค. 2568',
            type: 'income',
            category: 'คอร์สรวม',
            description: 'ชำระค่าเทอม 1/2568 - ด.ญ. สมใจ รักเรียน',
            amount: 17000,
            status: 'completed',
            paymentMethod: 'โอนเงิน',
            payer: 'คุณสมศรี รักเรียน',
            phone: '089-765-4321',
            slip: 'slip_001.jpg'
        },
        {
            id: 'TXN002',
            date: '15 ม.ค. 2568',
            type: 'expense',
            category: 'เงินเดือนติวเตอร์',
            description: 'เงินเดือน ม.ค. 2568 - อ.สมชาย ใจดี',
            amount: 35000,
            status: 'completed',
            paymentMethod: 'โอนเงิน',
            payer: 'สถาบัน',
            phone: '-',
            slip: null
        },
        {
            id: 'TXN003',
            date: '14 ม.ค. 2568',
            type: 'income',
            category: 'NETSAT',
            description: 'ชำระค่าคอร์ส NETSAT - ด.ช. วิทย์ ขยัน',
            amount: 15000,
            status: 'completed',
            paymentMethod: 'เงินสด',
            payer: 'คุณมานิต ขยัน',
            phone: '088-654-3210',
            slip: null
        },
        {
            id: 'TXN004',
            date: '14 ม.ค. 2568',
            type: 'income',
            category: 'คอร์สเดี่ยว',
            description: 'ชำระค่าคอร์สเดี่ยว - ด.ญ. สุดา เก่ง',
            amount: 8500,
            status: 'pending',
            paymentMethod: 'รอตรวจสอบ',
            payer: 'คุณวิมล เก่ง',
            phone: '087-543-2109',
            slip: 'slip_004.jpg'
        },
        {
            id: 'TXN005',
            date: '13 ม.ค. 2568',
            type: 'expense',
            category: 'ค่าเช่า',
            description: 'ค่าเช่าสถานที่ ม.ค. 2568',
            amount: 45000,
            status: 'completed',
            paymentMethod: 'โอนเงิน',
            payer: 'สถาบัน',
            phone: '-',
            slip: null
        },
        {
            id: 'TXN006',
            date: '12 ม.ค. 2568',
            type: 'income',
            category: 'คอร์สรวม',
            description: 'ชำระค่าเทอม 1/2568 - ด.ช. มานะ พยายาม',
            amount: 17000,
            status: 'overdue',
            paymentMethod: 'ยังไม่ชำระ',
            payer: 'คุณสมพร พยายาม',
            phone: '086-432-1098',
            slip: null
        },
        {
            id: 'TXN007',
            date: '11 ม.ค. 2568',
            type: 'expense',
            category: 'สื่อการสอน',
            description: 'ซื้อหนังสือและเอกสาร',
            amount: 12500,
            status: 'completed',
            paymentMethod: 'เงินสด',
            payer: 'สถาบัน',
            phone: '-',
            slip: null
        },
        {
            id: 'TXN008',
            date: '10 ม.ค. 2568',
            type: 'income',
            category: 'A-Level',
            description: 'ชำระค่าคอร์ส A-Level - ด.ญ. ปัญญา ฉลาด',
            amount: 22000,
            status: 'completed',
            paymentMethod: 'โอนเงิน',
            payer: 'คุณสุรีย์ ฉลาด',
            phone: '085-321-0987',
            slip: 'slip_008.jpg'
        }
    ]);

    // กรองธุรกรรม
    const filteredTransactions = transactions.filter(txn => {
        if (searchQuery && !txn.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !txn.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (statusFilter !== 'all' && txn.status !== statusFilter) return false;
        return true;
    });

    // Status Badge
    const getStatusBadge = (status) => {
        const config = {
            completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'สำเร็จ' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'รอตรวจสอบ' },
            overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle, label: 'เกินกำหนด' },
            cancelled: { bg: 'bg-neutral-200', text: 'text-neutral-700', icon: XCircle, label: 'ยกเลิก' }
        };
        const { bg, text, icon: Icon, label } = config[status];
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
                <Icon className="h-3 w-3" />
                {label}
            </span>
        );
    };

    // Type Badge
    const getTypeBadge = (type) => {
        if (type === 'income') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    <ArrowDownRight className="h-3 w-3" />
                    รายรับ
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <ArrowUpRight className="h-3 w-3" />
                รายจ่าย
            </span>
        );
    };

    return (
        <div className="min-h-screen  from-orange-50 via-white to-orange-50 space-y-6 mt-[90px]">
            <div className="mx-auto max-w-[1400px] px-4">
                {/* Hero Header */}
                <div className="mb-8">
                    <div className="bg-linear-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
                                    การเงินสถาบัน
                                </h1>
                                <p className="text-orange-100">ภาพรวมและจัดการการเงินทั้งหมด</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition  shadow-lg">
                                    <Download className="h-5 w-5" />
                                    ส่งออกรายงาน
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition border-2 border-white/50">
                                    <Plus className="h-5 w-5" />
                                    บันทึกรายการ
                                </button>
                            </div>
                        </div>

                        {/* Period Selector */}
                        <div className="mt-6 flex gap-2">
                            {['day', 'week', 'month', 'year'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${
                                        selectedPeriod === period
                                            ? 'bg-white text-orange-600 shadow-md'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                                >
                                    {period === 'day' ? 'วันนี้' : period === 'week' ? 'สัปดาห์' : period === 'month' ? 'เดือนนี้' : 'ปีนี้'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    {/* รายรับรวม */}
                    <div className="bg-linear-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <TrendingUp className="h-8 w-8" />
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                                <ArrowUpRight className="h-3 w-3" />
                                +{stats.revenueGrowth}%
                            </div>
                        </div>
                        <p className="text-green-100 text-sm mb-1">รายรับเดือนนี้</p>
                        <p className="text-xl font-bold mb-2">฿{stats.monthlyRevenue.toLocaleString()}</p>
                        <p className="text-xs text-green-100">รวมทั้งปี: ฿{stats.totalRevenue.toLocaleString()}</p>
                    </div>

                    {/* กำไรสุทธิ */}
                    <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Target className="h-8 w-8" />
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                                {stats.profitMargin}%
                            </div>
                        </div>
                        <p className="text-blue-100 text-sm mb-1">กำไรสุทธิ</p>
                        <p className="text-xl font-bold mb-2">฿{stats.profit.toLocaleString()}</p>
                        <p className="text-xs text-blue-100">จากรายรับ {stats.monthlyRevenue.toLocaleString()}</p>
                    </div>

                    {/* รอชำระ */}
                    <div className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Clock className="h-8 w-8" />
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                                รออนุมัติ
                            </div>
                        </div>
                        <p className="text-yellow-100 text-sm mb-1">รอตรวจสอบ/ชำระ</p>
                        <p className="text-xl font-bold mb-2">฿{stats.pendingPayments.toLocaleString()}</p>
                        <p className="text-xs text-yellow-100">จาก {transactions.filter(t => t.status === 'pending' || t.status === 'overdue').length} รายการ</p>
                    </div>

                    {/* ค่าใช้จ่าย */}
                    <div className="bg-linear-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <TrendingDown className="h-8 w-8" />
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                                <ArrowDownRight className="h-3 w-3" />
                                46.8%
                            </div>
                        </div>
                        <p className="text-red-100 text-sm mb-1">ค่าใช้จ่ายเดือนนี้</p>
                        <p className="text-xl font-bold mb-2">฿{stats.expenses.toLocaleString()}</p>
                        <p className="text-xs text-red-100">เงินเดือนติวเตอร์: ฿{stats.tutorSalaries.toLocaleString()}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-neutral-200 mb-6">
                    <div className="flex border-b-2 border-neutral-200 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
                            { id: 'transactions', label: 'รายการธุรกรรม', icon: Receipt },
                            // { id: 'revenue', label: 'รายรับ', icon: TrendingUp },
                            // { id: 'expenses', label: 'รายจ่าย', icon: TrendingDown }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 font-semibold transition whitespace-nowrap ${
                                    selectedTab === tab.id
                                        ? 'text-orange-600 border-b-4 border-orange-600 -mb-0.5'
                                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                                }`}
                            >
                                <tab.icon className="h-5 w-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {selectedTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Charts Row */}
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Revenue & Expenses Chart */}
                                    <div className="bg-neutral-50 rounded-xl p-6 border-2 border-neutral-200">
                                        <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-orange-600" />
                                            รายรับ - รายจ่าย (6 เดือน)
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={monthlyRevenueData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis dataKey="month" stroke="#6b7280" />
                                                <YAxis stroke="#6b7280" />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px' }}
                                                    formatter={(value) => `฿${value.toLocaleString()}`}
                                                />
                                                <Legend />
                                                <Bar dataKey="revenue" fill="#22c55e" name="รายรับ" radius={[8, 8, 0, 0]} />
                                                <Bar dataKey="expenses" fill="#ef4444" name="รายจ่าย" radius={[8, 8, 0, 0]} />
                                                <Bar dataKey="profit" fill="#3b82f6" name="กำไร" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Profit Trend */}
                                    <div className="bg-neutral-50 rounded-xl p-6 border-2 border-neutral-200">
                                        <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-orange-600" />
                                            แนวโน้มกำไร
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={monthlyRevenueData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis dataKey="month" stroke="#6b7280" />
                                                <YAxis stroke="#6b7280" />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px' }}
                                                    formatter={(value) => `฿${value.toLocaleString()}`}
                                                />
                                                <Legend />
                                                <Line type="monotone" dataKey="profit" stroke="#f97316" strokeWidth={3} name="กำไร" dot={{ fill: '#f97316', r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Pie Charts Row */}
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Revenue Sources */}
                                    <div className="bg-neutral-50 rounded-xl p-6 border-2 border-neutral-200">
                                        <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                            <PieChart className="h-5 w-5 text-orange-600" />
                                            แหล่งรายรับ
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RePieChart>
                                                <Pie
                                                    data={revenueSourcesData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={100}
                                                    dataKey="value"
                                                >
                                                    {revenueSourcesData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            {revenueSourcesData.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                    <span className="text-neutral-700">{item.name}</span>
                                                    <span className="font-bold ml-auto">฿{item.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Expenses Breakdown */}
                                    <div className="bg-neutral-50 rounded-xl p-6 border-2 border-neutral-200">
                                        <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                            <Wallet className="h-5 w-5 text-orange-600" />
                                            ค่าใช้จ่ายแยกตามหมวด
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RePieChart>
                                                <Pie
                                                    data={expensesData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={100}
                                                    dataKey="value"
                                                >
                                                    {expensesData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="grid grid-cols-1 gap-2 mt-4">
                                            {expensesData.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                    <span className="text-neutral-700">{item.name}</span>
                                                    <span className="font-bold ml-auto">฿{item.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Users className="h-8 w-8 text-orange-600" />
                                            <div>
                                                <p className="text-sm text-orange-700">นักเรียนที่ชำระแล้ว</p>
                                                <p className="text-xl font-bold text-orange-900">{stats.activeStudents}/{stats.totalStudents}</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-orange-200 rounded-full h-2">
                                            <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${(stats.activeStudents / stats.totalStudents) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <CheckCircle className="h-8 w-8 text-green-600" />
                                            <div>
                                                <p className="text-sm text-green-700">อัตราการชำระตรงเวลา</p>
                                                <p className="text-xl font-bold text-green-900">78.9%</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-green-700">ดีกว่าเดือนที่แล้ว +5%</p>
                                    </div>

                                    <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Banknote className="h-8 w-8 text-blue-600" />
                                            <div>
                                                <p className="text-sm text-blue-700">รายรับเฉลี่ยต่อนักเรียน</p>
                                                <p className="text-xl font-bold text-blue-900">฿{Math.round(stats.monthlyRevenue / stats.activeStudents).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-blue-700">คำนวณจากนักเรียนที่ชำระแล้ว</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transactions Tab */}
                        {selectedTab === 'transactions' && (
                            <div className="space-y-4">
                                {/* Filter Bar */}
                                <div className="flex flex-col md:flex-row gap-3 mb-6">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="ค้นหารายการ, รหัส, ชื่อ..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 pr-4 py-2.5 w-full bg-neutral-50 border-2 border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-2.5 bg-neutral-50 border-2 border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="all">ทุกสถานะ</option>
                                        <option value="completed">สำเร็จ</option>
                                        <option value="pending">รอตรวจสอบ</option>
                                        <option value="overdue">เกินกำหนด</option>
                                        <option value="cancelled">ยกเลิก</option>
                                    </select>
                                    <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium">
                                        <Download className="h-4 w-4" />
                                        ส่งออก
                                    </button>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid gap-3 md:grid-cols-4 mb-4">
                                    <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                                        <p className="text-sm text-green-700 mb-1">รายรับทั้งหมด</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            ฿{filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-linear-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200">
                                        <p className="text-sm text-red-700 mb-1">รายจ่ายทั้งหมด</p>
                                        <p className="text-xl font-bold text-red-900">
                                            ฿{filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                                        <p className="text-sm text-blue-700 mb-1">จำนวนรายการ</p>
                                        <p className="text-xl font-bold text-blue-900">{filteredTransactions.length}</p>
                                    </div>
                                    <div className="bg-linear-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-200">
                                        <p className="text-sm text-yellow-700 mb-1">รอดำเนินการ</p>
                                        <p className="text-xl font-bold text-yellow-900">
                                            {filteredTransactions.filter(t => t.status === 'pending' || t.status === 'overdue').length}
                                        </p>
                                    </div>
                                </div>

                                {/* Transactions List */}
                                <div className="space-y-3">
                                    {filteredTransactions.map((txn) => (
                                        <div
                                            key={txn.id}
                                            className="bg-white border-2 border-neutral-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <span className="font-mono text-sm font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-lg">
                                                            {txn.id}
                                                        </span>
                                                        {getTypeBadge(txn.type)}
                                                        {getStatusBadge(txn.status)}
                                                    </div>
                                                    <p className="font-semibold text-neutral-900 text-lg mb-1">{txn.description}</p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {txn.date}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {txn.payer}
                                                        </span>
                                                        {txn.phone !== '-' && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {txn.phone}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <CreditCard className="h-3 w-3" />
                                                            {txn.paymentMethod}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className={`text-xl font-bold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {txn.type === 'income' ? '+' : '-'}฿{txn.amount.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-neutral-500 mt-1">{txn.category}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTransaction(txn);
                                                            setShowTransactionModal(true);
                                                        }}
                                                        className="p-3 border-2 border-neutral-300 rounded-xl hover:bg-neutral-50 hover:border-orange-300 transition"
                                                    >
                                                        <Eye className="h-5 w-5 text-neutral-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredTransactions.length === 0 && (
                                    <div className="text-center py-16 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300">
                                        <Receipt className="h-16 w-16 text-neutral-300 mx-auto mb-3" />
                                        <p className="text-neutral-500 text-lg font-medium">ไม่พบรายการที่ค้นหา</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Revenue Tab */}
                        {selectedTab === 'revenue' && (
                            <div className="text-center py-16">
                                <TrendingUp className="h-16 w-16 text-orange-300 mx-auto mb-4" />
                                <p className="text-xl font-semibold text-neutral-600">รายละเอียดรายรับ</p>
                                <p className="text-neutral-500 mt-2">ส่วนนี้กำลังพัฒนา</p>
                            </div>
                        )}

                        {/* Expenses Tab */}
                        {selectedTab === 'expenses' && (
                            <div className="text-center py-16">
                                <TrendingDown className="h-16 w-16 text-red-300 mx-auto mb-4" />
                                <p className="text-xl font-semibold text-neutral-600">รายละเอียดรายจ่าย</p>
                                <p className="text-neutral-500 mt-2">ส่วนนี้กำลังพัฒนา</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transaction Detail Modal */}
            {showTransactionModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-neutral-900">รายละเอียดธุรกรรม</h3>
                            <button
                                onClick={() => setShowTransactionModal(false)}
                                className="text-neutral-400 hover:text-neutral-600 p-2 hover:bg-neutral-100 rounded-xl transition"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="bg-linear-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-mono text-lg font-bold text-orange-900">{selectedTransaction.id}</span>
                                    {getStatusBadge(selectedTransaction.status)}
                                </div>
                                <p className={`text-xl font-bold mb-2 ${selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedTransaction.type === 'income' ? '+' : '-'}฿{selectedTransaction.amount.toLocaleString()}
                                </p>
                                <p className="text-neutral-700">{selectedTransaction.description}</p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
                                    <p className="text-sm text-neutral-600 mb-1">ประเภท</p>
                                    {getTypeBadge(selectedTransaction.type)}
                                </div>
                                <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
                                    <p className="text-sm text-neutral-600 mb-1">หมวดหมู่</p>
                                    <p className="font-semibold text-neutral-900">{selectedTransaction.category}</p>
                                </div>
                                <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
                                    <p className="text-sm text-neutral-600 mb-1">วันที่</p>
                                    <p className="font-semibold text-neutral-900 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-orange-600" />
                                        {selectedTransaction.date}
                                    </p>
                                </div>
                                <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
                                    <p className="text-sm text-neutral-600 mb-1">วิธีชำระ</p>
                                    <p className="font-semibold text-neutral-900 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-orange-600" />
                                        {selectedTransaction.paymentMethod}
                                    </p>
                                </div>
                            </div>

                            {/* Payer Info */}
                            <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                                <p className="text-sm text-blue-700 font-semibold mb-3">ข้อมูลผู้ชำระ</p>
                                <div className="space-y-2">
                                    <p className="flex items-center gap-2 text-neutral-900">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <span className="font-semibold">{selectedTransaction.payer}</span>
                                    </p>
                                    {selectedTransaction.phone !== '-' && (
                                        <p className="flex items-center gap-2 text-neutral-700">
                                            <Phone className="h-4 w-4 text-blue-600" />
                                            {selectedTransaction.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Slip */}
                            {selectedTransaction.slip && (
                                <div className="bg-neutral-50 rounded-xl p-5 border-2 border-neutral-200">
                                    <p className="text-sm text-neutral-600 font-semibold mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-orange-600" />
                                        สลิปการโอนเงิน
                                    </p>
                                    <div className="bg-neutral-200 rounded-xl h-48 flex items-center justify-center">
                                        <p className="text-neutral-500">แสดงรูปสลิป: {selectedTransaction.slip}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button className="flex-1 px-4 py-3 border-2 border-neutral-300 rounded-xl hover:bg-neutral-50 font-medium transition">
                                    พิมพ์ใบเสร็จ
                                </button>
                                {selectedTransaction.status === 'pending' && (
                                    <button className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium transition">
                                        อนุมัติรายการ
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}