import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  Download,
  Search,
  ChevronRight,
  Check,
  AlertCircle,
  FileText,
  BarChart3,
  Eye,
  CreditCard,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TutorIncome() {
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('overview');

  // 📊 ข้อมูลรายรับรายเดือน
  const monthlyData = [
    { month: 'ก.ค.', total: 38400, individual: 15200, group: 23200, online: 12000 },
    { month: 'ส.ค.', total: 42600, individual: 18400, group: 24200, online: 14000 },
    { month: 'ก.ย.', total: 40800, individual: 16800, group: 24000, online: 13200 },
    { month: 'ต.ค.', total: 45200, individual: 19600, group: 25600, online: 15400 },
    { month: 'พ.ย.', total: 43800, individual: 17200, group: 26600, online: 14800 },
    { month: 'ธ.ค.', total: 48600, individual: 21400, group: 27200, online: 16200 },
  ];

  // 💰 สรุปภาพรวม
  const summary = {
    thisMonth: 48600,
    growth: 12,
    total: 320400,
    pending: 12800,
    pendingCount: 2,
  };

  // 📚 รายได้แยกตามคอร์ส
  const courseIncomes = [
    {
      id: 1,
      name: 'คอร์สเปิดเทอม ป.6 เทอม 1/2567',
      type: 'คอร์สรวม',
      location: 'Onsite',
      students: 24,
      pricePerStudent: 800,
      totalIncome: 19200,
      status: 'paid',
      paidDate: '5 ธ.ค. 2567',
      period: 'พ.ย. - ธ.ค. 2567',
    },
    {
      id: 2,
      name: 'คณิต ป.5 (คอร์สเดี่ยว)',
      type: 'คอร์สเดี่ยว',
      location: 'Onsite',
      students: 5,
      pricePerStudent: 1200,
      totalIncome: 6000,
      status: 'paid',
      paidDate: '5 ธ.ค. 2567',
      period: 'ธ.ค. 2567',
    },
    {
      id: 3,
      name: 'วิทย์ ม.4 (คอร์สเดี่ยว)',
      type: 'คอร์สเดี่ยว',
      location: 'Onsite',
      students: 16,
      pricePerStudent: 1000,
      totalIncome: 16000,
      status: 'pending',
      paidDate: '-',
      period: 'ธ.ค. 2567',
    },
    {
      id: 4,
      name: 'NETSAT (Online)',
      type: 'คอร์สรวม',
      location: 'Online',
      students: 62,
      pricePerStudent: 600,
      totalIncome: 37200,
      status: 'paid',
      paidDate: '28 พ.ย. 2567',
      period: 'พ.ย. 2567',
    },
    {
      id: 5,
      name: 'อังกฤษ ป.5',
      type: 'คอร์สรวม',
      location: 'Onsite',
      students: 9,
      pricePerStudent: 850,
      totalIncome: 7650,
      status: 'paid',
      paidDate: '5 ธ.ค. 2567',
      period: 'ธ.ค. 2567',
    },
    {
      id: 6,
      name: 'ไทย ป.4',
      type: 'คอร์สรวม',
      location: 'Onsite',
      students: 8,
      pricePerStudent: 800,
      totalIncome: 6400,
      status: 'partial',
      paidDate: '3 ธ.ค. 2567',
      period: 'ธ.ค. 2567',
    },
  ];

  // 📅 ประวัติการรับเงิน
  const paymentHistory = [
    {
      id: 1,
      date: '5 ธ.ค. 2567',
      amount: 32850,
      courses: ['คอร์สเปิดเทอม ป.6', 'คณิต ป.5', 'อังกฤษ ป.5-6'],
      slip: 'slip_dec_001.pdf',
      status: 'completed',
    },
    {
      id: 2,
      date: '28 พ.ย. 2567',
      amount: 37200,
      courses: ['NETSAT (Online)'],
      slip: 'slip_nov_002.pdf',
      status: 'completed',
    },
    {
      id: 3,
      date: '20 พ.ย. 2567',
      amount: 28400,
      courses: ['คอร์สเปิดเทอม ป.6', 'วิทย์ ม.1'],
      slip: 'slip_nov_001.pdf',
      status: 'completed',
    },
    {
      id: 4,
      date: '5 พ.ย. 2567',
      amount: 31600,
      courses: ['NETSAT', 'คณิต ป.4-6'],
      slip: 'slip_oct_002.pdf',
      status: 'completed',
    },
  ];

  // 🎨 สีตามสถานะ
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'partial':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'จ่ายแล้ว';
      case 'pending':
        return 'รอจ่าย';
      case 'partial':
        return 'จ่ายบางส่วน';
      default:
        return '-';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <Check className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'partial':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // 🔍 Filter
  const filteredCourses = courseIncomes.filter((course) => {
    if (filterStatus !== 'all' && course.status !== filterStatus) return false;
    if (searchQuery && !course.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleExport = () => {
    alert('กำลังดาวน์โหลดรายงาน PDF...');
  };

  return (
    <div className="min-h-screen space-y-6 mt-[90px]">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">รายรับของฉัน</h1>
              <p className="mt-1 text-sm text-neutral-500">ติดตามรายได้และประวัติการรับเงินของคุณ</p>
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium shadow-sm"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลดรายงาน
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <span className="text-2xl font text-green-600">฿</span>
              </div>
              <div className="flex items-center gap-1 text-sm bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-200">
                <TrendingUp className="h-3 w-3" />
                <span className="font-semibold">+{summary.growth}%</span>
              </div>
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">รายรับเดือนนี้</h3>
            <p className="text-3xl font-bold text-neutral-900">
              {summary.thisMonth.toLocaleString()}
              <span className="text-lg text-neutral-500 ml-2">บาท</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">เพิ่มขึ้นจากเดือนก่อน</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">รายรับสะสม</h3>
            <p className="text-3xl font-bold text-neutral-900">
              {summary.total.toLocaleString()}
              <span className="text-lg text-neutral-500 ml-2">บาท</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">6 เดือนที่ผ่านมา</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-sm bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-200 font-semibold">
                {summary.pendingCount} รายการ
              </div>
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">รอรับเงิน</h3>
            <p className="text-3xl font-bold text-neutral-900">
              {summary.pending.toLocaleString()}
              <span className="text-lg text-neutral-500 ml-2">บาท</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">คาดว่าจะได้รับภายใน 7 วัน</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden mb-6">
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setViewMode('overview')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                viewMode === 'overview'
                  ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              ภาพรวม & กราฟ
            </button>
            <button
              onClick={() => setViewMode('courses')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                viewMode === 'courses'
                  ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              รายละเอียดตามคอร์ส
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                viewMode === 'history'
                  ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              ประวัติการรับเงิน
            </button>
          </div>
        </div>

        {/* Content: Overview & Chart */}
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {/* Chart Section */}
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-6">รายรับรายเดือน (6 เดือนย้อนหลัง)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} name="รายรับรวม" />
                  <Line type="monotone" dataKey="individual" stroke="#3b82f6" strokeWidth={2} name="คอร์สเดี่ยว" />
                  <Line type="monotone" dataKey="group" stroke="#10b981" strokeWidth={2} name="คอร์สรวม" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Online vs Onsite */}
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-6">เปรียบเทียบ Online vs Onsite</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="online" fill="#8b5cf6" name="Online" />
                  <Bar dataKey="total" fill="#f97316" name="Onsite (คำนวณจาก Total-Online)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Income Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
                <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  แหล่งรายได้
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-700">ค่าสอนคอร์สรวม</span>
                    <span className="font-bold text-neutral-900">27,200 บาท</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-700">ค่าสอนคอร์สเดี่ยว</span>
                    <span className="font-bold text-neutral-900">21,400 บาท</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                    <span className="text-sm text-green-700 font-medium">รวมทั้งหมด</span>
                    <span className="font-bold text-green-700">48,600 บาท</span>
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
                    <span className="text-sm text-neutral-700">จำนวนคอร์สทั้งหมด</span>
                    <span className="font-bold text-neutral-900">6 คอร์ส</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-700">นักเรียนทั้งหมด</span>
                    <span className="font-bold text-neutral-900">124 คน</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-sm text-blue-700 font-medium">รายได้เฉลี่ย/นักเรียน</span>
                    <span className="font-bold text-blue-700">782 บาท</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content: Course Details */}
        {viewMode === 'courses' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-neutral-200 rounded-xl p-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาคอร์ส..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>

                <select
                  className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent md:min-w-[180px]"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="paid">จ่ายแล้ว</option>
                  <option value="pending">รอจ่าย</option>
                  <option value="partial">จ่ายบางส่วน</option>
                </select>
              </div>
            </div>

            {/* Course Income List */}
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 transition overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-neutral-900">{course.name}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${
                              course.type === 'คอร์สเดี่ยว'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {course.type}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${
                              course.location === 'Online'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {course.location}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                          <span>ระยะเวลา: {course.period}</span>
                          <span>นักเรียน: {course.students} คน</span>
                          <span>ค่าสอน/คน: {course.pricePerStudent.toLocaleString()} บาท</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-neutral-600">รายได้รวม</div>
                          <div className="text-2xl font-bold text-orange-600">
                            {course.totalIncome.toLocaleString()}
                            <span className="text-sm text-neutral-500 ml-1">บาท</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-600">สถานะ:</span>
                        <span className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 font-medium ${getStatusColor(course.status)}`}>
                          {getStatusIcon(course.status)}
                          {getStatusText(course.status)}
                        </span>
                        {course.status === 'paid' && (
                          <span className="text-xs text-neutral-500">• จ่ายเมื่อ: {course.paidDate}</span>
                        )}
                      </div>

                      <button className="flex items-center gap-1 px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition text-sm">
                        <Eye className="h-3 w-3" />
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCourses.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-neutral-200">
                  <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">ไม่พบคอร์สที่ค้นหา</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content: Payment History */}
        {viewMode === 'history' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                ประวัติการรับเงิน
              </h2>

              <div className="space-y-4">
                {paymentHistory.map((payment, index) => (
                  <div key={payment.id} className="relative">
                    {index !== paymentHistory.length - 1 && (
                      <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-neutral-200" />
                    )}

                    <div className="flex gap-4">
                      <div className="relative shrink-0">
                        <div className="h-12 w-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                          <Check className="h-6 w-6 text-green-600" />
                        </div>
                      </div>

                      <div className="flex-1 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">{payment.date}</div>
                            <div className="text-2xl font-bold text-green-600">
                              +{payment.amount.toLocaleString()}
                              <span className="text-sm text-neutral-500 ml-1">บาท</span>
                            </div>
                          </div>

                          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition text-sm font-medium">
                            <Download className="h-4 w-4" />
                            ดาวน์โหลดสลิป
                          </button>
                        </div>

                        <div>
                          <div className="text-xs text-neutral-600 mb-2 font-medium">คอร์สที่เกี่ยวข้อง:</div>
                          <div className="flex flex-wrap gap-2">
                            {payment.courses.map((course, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-white text-neutral-700 px-3 py-1 rounded-md border border-neutral-200"
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}