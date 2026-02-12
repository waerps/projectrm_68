import { useState } from 'react';
import {
  Bell,
  ChevronRight,
  DollarSign,
  MessageCircle,
  Calendar,
  AlertCircle,
  CheckCircle,
  Trash2,
  Check,
} from 'lucide-react';

export default function TutorNotifications() {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'payment',
      title: 'รับเงินค่าสอนแล้ว',
      message: 'คุณได้รับเงินค่าสอน 32,850 บาท จากคอร์สเปิดเทอม ป.6',
      time: '2 ชั่วโมงที่แล้ว',
      isRead: false,
      icon: 'payment',
    },
    {
      id: 3,
      type: 'schedule',
      title: 'เตือนตารางสอนวันพรุ่งนี้',
      message: 'คุณมีคลาสสอน วิชาคณิต ป.6 เวลา 17:00-18:30 น. ห้อง 1',
      time: '1 วันที่แล้ว',
      isRead: true,
      icon: 'schedule',
    },
    {
      id: 4,
      type: 'alert',
      title: 'นักเรียนขาดเรียน',
      message: 'ด.ญ. มานี ขยัน ขาดเรียนติดต่อกัน 3 ครั้ง ในวิชาคณิต',
      time: '1 วันที่แล้ว',
      isRead: true,
      icon: 'alert',
    },
    {
      id: 5,
      type: 'success',
      title: 'อัปโหลดวิดีโอสำเร็จ',
      message: 'วิดีโอ "บทที่ 5: สมการเชิงเส้น" อัปโหลดเรียบร้อยแล้ว',
      time: '2 วันที่แล้ว',
      isRead: true,
      icon: 'success',
    },
    {
      id: 6,
      type: 'payment',
      title: 'การชำระเงินรอดำเนินการ',
      message: 'รอรับเงินค่าสอน 16,000 บาท จากคอร์ส วิทย์ ม.4',
      time: '3 วันที่แล้ว',
      isRead: true,
      icon: 'payment',
    },
  ]);

  const getIcon = (type) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-600" />;
      case 'schedule':
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'payment':
        return 'bg-green-100';
      case 'message':
        return 'bg-blue-100';
      case 'schedule':
        return 'bg-orange-100';
      case 'alert':
        return 'bg-red-100';
      case 'success':
        return 'bg-green-100';
      default:
        return 'bg-neutral-100';
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen space-y-6 mt-[90px]">
      <div className="mx-auto ">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                <Bell className="h-7 w-7 text-orange-600" />
                การแจ้งเตือน
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                คุณมีการแจ้งเตือนที่ยังไม่ได้อ่าน {unreadCount} รายการ
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium shadow-sm"
              >
                <Check className="h-4 w-4" />
                ทำเครื่องหมายว่าอ่านทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl border-2 border-neutral-200 p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              ทั้งหมด ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'unread'
                  ? 'bg-orange-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              ยังไม่ได้อ่าน ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('payment')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'payment'
                  ? 'bg-orange-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              การเงิน
            </button>

            <button
              onClick={() => setFilter('schedule')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'schedule'
                  ? 'bg-orange-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              ตารางสอน
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-12 text-center">
              <Bell className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-2xl border-2 transition hover:border-orange-300 overflow-hidden ${
                  notif.isRead ? 'border-neutral-200' : 'border-orange-200 bg-orange-50/30'
                }`}
              >
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl ${getIconBg(notif.type)} shrink-0 h-fit`}>
                      {getIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className={`font-bold ${notif.isRead ? 'text-neutral-900' : 'text-neutral-900'}`}>
                          {notif.title}
                          {!notif.isRead && (
                            <span className="ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                          )}
                        </h3>
                        <span className="text-xs text-neutral-500 whitespace-nowrap">{notif.time}</span>
                      </div>

                      <p className={`text-sm mb-3 ${notif.isRead ? 'text-neutral-600' : 'text-neutral-700'}`}>
                        {notif.message}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!notif.isRead && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition font-medium"
                          >
                            <Check className="h-3 w-3" />
                            ทำเครื่องหมายว่าอ่านแล้ว
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"
                        >
                          <Trash2 className="h-3 w-3" />
                          ลบ
                        </button>
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