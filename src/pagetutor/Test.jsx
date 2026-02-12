import { useState } from 'react';
import {
  Users, GraduationCap, BookOpen, DollarSign, TrendingUp, TrendingDown,
  Calendar, Clock, AlertCircle, ChevronRight, Download, Eye, Banknote
} from 'lucide-react';

export default function AdminDashboard() {
  const [dateFilter, setDateFilter] = useState('today');

  const stats = [
    { label: 'นักเรียนทั้งหมด', value: '486', change: '+12%', trend: 'up', icon: Users, color: 'bg-blue-500' },
    { label: 'ติวเตอร์ทั้งหมด', value: '24', change: '+2', trend: 'up', icon: GraduationCap, color: 'bg-orange-500' },
    { label: 'คอร์สเปิดสอน', value: '48', change: '+5', trend: 'up', icon: BookOpen, color: 'bg-green-500' },
    { label: 'รายรับเดือนนี้', value: '227,000฿', change: '+18%', trend: 'up', icon: Banknote, color: 'bg-purple-500' },
  ];

  const todayClasses = [
    { id: 1, time: '09:00-10:30', course: 'คณิต ป.4', tutor: 'ครูเป้ว', students: 8, room: 'ห้อง 1', status: 'ongoing' },
    { id: 2, time: '09:00-10:30', course: 'NETSAT ม.4', tutor: 'ครูโลตัส', students: 12, room: 'ห้อง 5', status: 'ongoing' },
    { id: 3, time: '09:00-10:30', course: 'วิทย์ ม.1', tutor: 'ครูไก่', students: 12, room: 'ห้อง 2', status: 'ongoing' },
    { id: 4, time: '14:30-16:00', course: 'สังคม ม.1', tutor: 'ครูช้าง', students: 12, room: 'ห้อง 6', status: 'upcoming' },
  ];

  const activities = [
    { id: 1, type: 'payment', title: 'รับชำระค่าเรียน', description: 'ด.ช. สมชาย ใจดี ชำระค่าคอร์สคณิต ป.6', amount: '+8,500 บาท', time: '5 นาทีที่แล้ว' },
    { id: 2, type: 'enrollment', title: 'นักเรียนสมัครใหม่', description: 'ด.ญ. สุดา รักเรียน สมัครคอร์ส NETSAT', time: '15 นาทีที่แล้ว' },
    { id: 3, type: 'teaching', title: 'บันทึกการสอน', description: 'ครูเป้ว บันทึกการสอนคณิต ป.4-6 คาบเช้า', time: '1 ชั่วโมงที่แล้ว' },
    { id: 4, type: 'alert', title: 'นักเรียนขาดเรียน', description: 'ด.ช. วิทย์ ขาดเรียนคณิต 3 ครั้งติดต่อกัน', time: '2 ชั่วโมงที่แล้ว' },
    { id: 5, type: 'payment', title: 'จ่ายเงินติวเตอร์', description: 'โอนค่าสอนเดือน ธ.ค. ให้ครูเป้ว', amount: '-48,600 บาท', time: '3 ชั่วโมงที่แล้ว' },
    { id: 6, type: 'enrollment', title: 'นักเรียนสมัครใหม่', description: 'ด.ช. มานะ พยายาม สมัครคอร์สวิทย์ ม.3', time: '5 ชั่วโมงที่แล้ว' },
  ];

  const quickStats = [
    { label: 'คลาสวันนี้', value: 5, color: 'text-orange-600' },
    { label: 'นักเรียนเข้าเรียนวันนี้', value: 49, color: 'text-blue-600' },
    { label: 'รายรับวันนี้', value: '24,500', unit: '฿', color: 'text-green-600' },
    { label: 'รออนุมัติ', value: 3, color: 'text-red-600' },
  ];

  const getStatusBadge = (status) => {
    const map = {
      ongoing: 'bg-green-100 text-green-700',
      upcoming: 'bg-blue-100 text-blue-700',
      completed: 'bg-neutral-200 text-neutral-700'
    };
    const labels = { ongoing: 'กำลังสอน', upcoming: 'กำลังจะเริ่ม', completed: 'สอนจบแล้ว' };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[status]}`}>{labels[status]}</span>;
  };

  const getActivityIcon = (type) => {
    if (type === 'payment') return <DollarSign className="h-5 w-5 text-green-600" />;
    if (type === 'enrollment') return <Users className="h-5 w-5 text-blue-600" />;
    if (type === 'teaching') return <BookOpen className="h-5 w-5 text-orange-600" />;
    if (type === 'alert') return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <Clock className="h-5 w-5 text-neutral-600" />;
  };

  return (
    <div className="min-h-screen space-y-6 mt-[90px] ">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">แผงควบคุมระบบ</h1>
              <p className="mt-1 text-sm text-neutral-500">ภาพรวมสถาบันติวศรเสริม ติวเตอร์</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                <option value="today">วันนี้</option>
                <option value="week">สัปดาห์นี้</option>
                <option value="month">เดือนนี้</option>
                <option value="year">ปีนี้</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium">
                <Download className="h-4 w-4" />
                ดาวน์โหลดรายงาน
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border-2 border-neutral-200 p-6 hover:border-orange-300 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}><Icon className="h-6 w-6 text-white" /></div>
                  <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="font-semibold">{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-sm text-neutral-600 mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {quickStats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-neutral-200 p-4">
              <p className="text-xs text-neutral-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}{stat.unit && <span className="text-sm ml-1">{stat.unit}</span>}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden">
            <div className="p-5 bg-linear-to-br from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  คลาสเรียนวันนี้ ({todayClasses.length})
                </h2>
                <button className="text-sm text-orange-600 font-medium hover:underline flex items-center gap-1">ดูทั้งหมด<ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              {todayClasses.map((cls) => (
                <div key={cls.id} className="p-4 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-orange-600">{cls.time}</span>
                        {getStatusBadge(cls.status)}
                      </div>
                      <h4 className="font-semibold text-neutral-900 mb-1">{cls.course}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600">
                        <span>ครู: {cls.tutor}</span><span>นักเรียน: {cls.students} คน</span><span>{cls.room}</span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-white rounded-lg transition"><Eye className="h-4 w-4 text-neutral-600" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden">
            <div className="p-5 bg-linear-to-br from-orange-50 to-amber-50 border-b border-orange-100">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><Clock className="h-5 w-5 text-orange-600" />กิจกรรมล่าสุด</h2>
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg h-fit ${activity.type === 'payment' ? 'bg-green-100' : activity.type === 'enrollment' ? 'bg-blue-100' : activity.type === 'teaching' ? 'bg-orange-100' : 'bg-red-100'}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-neutral-900">{activity.title}</h4>
                        <span className="text-xs text-neutral-500 whitespace-nowrap">{activity.time}</span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{activity.description}</p>
                      {activity.amount && <p className={`text-sm font-bold mt-1 ${activity.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{activity.amount}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}