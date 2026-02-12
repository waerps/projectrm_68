import { useState } from 'react';
import { Bell, DollarSign, Users, BookOpen, AlertCircle, CheckCircle, Trash2, Check, UserPlus, FileText, Settings, Filter } from 'lucide-react';

export default function AdminNotifications() {
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'payment', priority: 'high', title: 'รับชำระค่าเรียนจำนวนมาก', message: 'มีนักเรียน 15 คน ชำระค่าคอร์สรวม 127,500 บาท', time: '10 นาทีที่แล้ว', isRead: false, actionRequired: false },
    { id: 2, type: 'enrollment', priority: 'normal', title: 'นักเรียนสมัครใหม่', message: 'ด.ญ. สุดา รักเรียน สมัครคอร์ส NETSAT (รอชำระเงิน)', time: '30 นาทีที่แล้ว', isRead: false, actionRequired: true },
    { id: 3, type: 'alert', priority: 'high', title: 'นักเรียนขาดเรียนติดต่อกัน', message: 'ด.ช. วิทย์ ช่างคิด ขาดเรียนคณิต ม.4 ติดต่อกัน 5 ครั้ง - ควรติดต่อผู้ปกครอง', time: '1 ชั่วโมงที่แล้ว', isRead: false, actionRequired: true },
    { id: 4, type: 'tutor', priority: 'normal', title: 'ติวเตอร์ส่งบันทึกการสอน', message: 'ครูเป้ว ส่งบันทึกการสอนคณิต ป.4-6 คาบเช้า พร้อมรูปถ่าย', time: '2 ชั่วโมงที่แล้ว', isRead: true, actionRequired: false },
    { id: 5, type: 'course', priority: 'normal', title: 'คอร์สใกล้เต็ม', message: 'คอร์ส NETSAT ม.4-6 มีนักเรียนเหลือที่นั่ง 3/80 ควรเปิดรอบเพิ่ม', time: '3 ชั่วโมงที่แล้ว', isRead: true, actionRequired: false },
    { id: 6, type: 'payment', priority: 'normal', title: 'การจ่ายเงินติวเตอร์ครบกำหนด', message: 'ถึงกำหนดจ่ายค่าสอนเดือน ธ.ค. ให้ติวเตอร์ 5 คน รวม 243,000 บาท', time: '5 ชั่วโมงที่แล้ว', isRead: true, actionRequired: true },
    { id: 7, type: 'system', priority: 'low', title: 'อัปเดตระบบสำเร็จ', message: 'ระบบได้รับการอัปเดตเวอร์ชัน 2.5.0 เรียบร้อยแล้ว', time: '1 วันที่แล้ว', isRead: true, actionRequired: false },
    { id: 8, type: 'report', priority: 'normal', title: 'รายงานประจำเดือนพร้อมแล้ว', message: 'รายงานสรุปผลการดำเนินงานเดือน พ.ย. พร้อมดาวน์โหลด', time: '1 วันที่แล้ว', isRead: true, actionRequired: false },
    { id: 9, type: 'alert', priority: 'high', title: 'ห้องเรียนเต็ม', message: 'ห้อง 2 ชั้น 2 มีการจองซ้อนทับกัน เวลา 14:00-16:00 วันเสาร์', time: '2 วันที่แล้ว', isRead: true, actionRequired: true },
    { id: 10, type: 'tutor', priority: 'normal', title: 'ติวเตอร์ขออนุมัติลา', message: 'ครูเป้ว ขออนุมัติลาป่วย วันที่ 20 ธ.ค. (มีคลาส 2 คาบ)', time: '3 วันที่แล้ว', isRead: true, actionRequired: true },
  ]);

  const getIcon = (type) => {
    if (type === 'payment') return <DollarSign className="h-5 w-5 text-green-600" />;
    if (type === 'enrollment') return <UserPlus className="h-5 w-5 text-blue-600" />;
    if (type === 'tutor') return <Users className="h-5 w-5 text-orange-600" />;
    if (type === 'course') return <BookOpen className="h-5 w-5 text-purple-600" />;
    if (type === 'alert') return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (type === 'system') return <Settings className="h-5 w-5 text-neutral-600" />;
    if (type === 'report') return <FileText className="h-5 w-5 text-indigo-600" />;
    return <Bell className="h-5 w-5 text-neutral-600" />;
  };

  const getIconBg = (type) => {
    if (type === 'payment') return 'bg-green-100';
    if (type === 'enrollment') return 'bg-blue-100';
    if (type === 'tutor') return 'bg-orange-100';
    if (type === 'course') return 'bg-purple-100';
    if (type === 'alert') return 'bg-red-100';
    if (type === 'system') return 'bg-neutral-100';
    if (type === 'report') return 'bg-indigo-100';
    return 'bg-neutral-100';
  };

  const getPriorityBadge = (priority) => {
    const map = { high: 'bg-red-100 text-red-700 border-red-200', normal: 'bg-blue-100 text-blue-700 border-blue-200', low: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
    const labels = { high: 'สำคัญมาก', normal: 'ปกติ', low: 'ไม่สำคัญ' };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${map[priority]}`}>{labels[priority]}</span>;
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filterType !== 'all' && notif.type !== filterType) return false;
    if (filterPriority !== 'all' && notif.priority !== filterPriority) return false;
    if (filterStatus === 'unread' && notif.isRead) return false;
    if (filterStatus === 'read' && !notif.isRead) return false;
    if (filterStatus === 'action' && !notif.actionRequired) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const actionRequiredCount = notifications.filter((n) => n.actionRequired && !n.isRead).length;

  const markAsRead = (id) => { setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))); };
  const markAllAsRead = () => { setNotifications(notifications.map((n) => ({ ...n, isRead: true }))); };
  const deleteNotification = (id) => { setNotifications(notifications.filter((n) => n.id !== id)); };

  return (
    <div className="min-h-screen space-y-6 mt-[90px] ">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2"><Bell className="h-7 w-7 text-orange-600" />การแจ้งเตือนและกิจกรรม</h1>
              <p className="mt-1 text-sm text-neutral-500">ยังไม่ได้อ่าน {unreadCount} รายการ{actionRequiredCount > 0 && <span className="text-red-600 font-semibold"> • ต้องดำเนินการ {actionRequiredCount} รายการ</span>}</p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium">
                <Check className="h-4 w-4" />ทำเครื่องหมายว่าอ่านทั้งหมด
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700"><Filter className="h-4 w-4 text-orange-600" /><span>กรองการแจ้งเตือน</span></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกประเภท ({notifications.length})</option>
                <option value="payment">การเงิน</option>
                <option value="enrollment">การสมัคร</option>
                <option value="tutor">ติวเตอร์</option>
                <option value="course">คอร์สเรียน</option>
                <option value="alert">เตือน</option>
                <option value="report">รายงาน</option>
                <option value="system">ระบบ</option>
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกระดับความสำคัญ</option>
                <option value="high">สำคัญมาก</option>
                <option value="normal">ปกติ</option>
                <option value="low">ไม่สำคัญ</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกสถานะ</option>
                <option value="unread">ยังไม่ได้อ่าน ({unreadCount})</option>
                <option value="read">อ่านแล้ว</option>
                <option value="action">ต้องดำเนินการ ({actionRequiredCount})</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">แสดง <span className="font-bold text-neutral-900">{filteredNotifications.length}</span> จาก {notifications.length} รายการ</span>
            <button onClick={() => { setFilterType('all'); setFilterPriority('all'); setFilterStatus('all'); }} className="text-orange-600 hover:underline font-medium">ล้างตัวกรอง</button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-12 text-center"><Bell className="h-16 w-16 text-neutral-300 mx-auto mb-4" /><p className="text-neutral-500">ไม่มีการแจ้งเตือนที่ตรงกับเงื่อนไข</p></div>
          ) : (
            filteredNotifications.map((notif) => (
              <div key={notif.id} className={`bg-white rounded-2xl border-2 transition hover:border-orange-300 overflow-hidden ${notif.isRead ? 'border-neutral-200' : 'border-orange-200 bg-orange-50/30'}`}>
                <div className="p-5">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl ${getIconBg(notif.type)} shrink-0 h-fit`}>{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-neutral-900">{notif.title}{!notif.isRead && <span className="ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full"></span>}</h3>
                          {getPriorityBadge(notif.priority)}
                          {notif.actionRequired && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">ต้องดำเนินการ</span>}
                        </div>
                        <span className="text-xs text-neutral-500 whitespace-nowrap">{notif.time}</span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">{notif.message}</p>
                      <div className="flex gap-2">
                        {notif.actionRequired && <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"><CheckCircle className="h-3 w-3" />ดำเนินการ</button>}
                        {!notif.isRead && <button onClick={() => markAsRead(notif.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition font-medium"><Check className="h-3 w-3" />ทำเครื่องหมายว่าอ่าน</button>}
                        <button onClick={() => deleteNotification(notif.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"><Trash2 className="h-3 w-3" />ลบ</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}