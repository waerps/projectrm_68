import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Bell, DollarSign, Users, BookOpen, AlertCircle, Trash2, Check, Filter, Boxes, DoorOpen, RefreshCw, Loader2, ChevronRight } from 'lucide-react';

const API = `${API_URL}/api/admin/notifications`;
const auth = () => {
  const token = localStorage.getItem('student_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};
const typeMeta = {
  payment: { label: 'การเงิน', Icon: DollarSign, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  tutor: { label: 'ติวเตอร์', Icon: Users, bg: 'bg-orange-100', color: 'text-orange-600' },
  course: { label: 'คอร์สเรียน', Icon: BookOpen, bg: 'bg-purple-100', color: 'text-purple-600' },
  alert: { label: 'แจ้งเตือนสำคัญ', Icon: AlertCircle, bg: 'bg-red-100', color: 'text-red-600' },
  facility: { label: 'อุปกรณ์', Icon: Boxes, bg: 'bg-blue-100', color: 'text-blue-600' },
  room: { label: 'ห้องเรียน', Icon: DoorOpen, bg: 'bg-cyan-100', color: 'text-cyan-600' },
};
const priorityMeta = {
  high: { label: 'สำคัญมาก', cls: 'bg-red-100 text-red-700 border-red-200' },
  normal: { label: 'ปกติ', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  low: { label: 'ไม่เร่งด่วน', cls: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
};

function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'เมื่อสักครู่';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.get(API, auth());
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err.response?.data?.message || 'โหลดการแจ้งเตือนไม่สำเร็จ');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const unreadCount = items.filter(item => !item.isRead).length;
  const actionRequiredCount = items.filter(item => item.actionRequired && !item.isRead).length;
  const filtered = useMemo(() => items.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    if (filterStatus === 'unread' && item.isRead) return false;
    if (filterStatus === 'read' && !item.isRead) return false;
    if (filterStatus === 'action' && !item.actionRequired) return false;
    return true;
  }), [items, filterType, filterPriority, filterStatus]);
  const availableTypes = [...new Set(items.map(item => item.type))];

  const markRead = async id => {
    setBusy(id);
    try {
      await axios.patch(`${API}/${encodeURIComponent(id)}/read`, {}, auth());
      setItems(current => current.map(item => item.id === id ? { ...item, isRead: true } : item));
    } catch (err) { setError(err.response?.data?.message || 'บันทึกสถานะไม่สำเร็จ'); }
    finally { setBusy(''); }
  };
  const markAll = async () => {
    setBusy('all');
    try {
      await axios.patch(`${API}/read-all`, {}, auth());
      setItems(current => current.map(item => ({ ...item, isRead: true })));
    } catch (err) { setError(err.response?.data?.message || 'บันทึกสถานะไม่สำเร็จ'); }
    finally { setBusy(''); }
  };
  const dismiss = async id => {
    setBusy(id);
    try {
      await axios.delete(`${API}/${encodeURIComponent(id)}`, auth());
      setItems(current => current.filter(item => item.id !== id));
    } catch (err) { setError(err.response?.data?.message || 'ซ่อนการแจ้งเตือนไม่สำเร็จ'); }
    finally { setBusy(''); }
  };
  const takeAction = async item => {
    if (!item.isRead) await markRead(item.id);
    if (item.link) navigate(item.link);
  };

  return (
    <div className="min-h-screen space-y-6 mt-[90px]">
      <div className="mx-auto max-w-[1400px] px-4 pb-10">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2"><Bell className="h-7 w-7 text-orange-600" />การแจ้งเตือนและกิจกรรม</h1>
            <p className="mt-1 text-sm text-neutral-500">ข้อมูลจริงจากส่วนต่าง ๆ ของระบบ · ยังไม่ได้อ่าน {unreadCount} รายการ{actionRequiredCount > 0 && <span className="text-red-600 font-semibold"> • ต้องดำเนินการ {actionRequiredCount} รายการ</span>}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 font-medium"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />รีเฟรช</button>
            {unreadCount > 0 && <button onClick={markAll} disabled={busy === 'all'} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium disabled:opacity-60"><Check className="h-4 w-4" />อ่านทั้งหมด</button>}
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between"><span>{error}</span><button onClick={load} className="font-bold underline">ลองใหม่</button></div>}

        <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3"><Filter className="h-4 w-4 text-orange-600" />กรองการแจ้งเตือน</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"><option value="all">ทุกประเภท ({items.length})</option>{availableTypes.map(type => <option key={type} value={type}>{typeMeta[type]?.label || type}</option>)}</select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"><option value="all">ทุกระดับความสำคัญ</option><option value="high">สำคัญมาก</option><option value="normal">ปกติ</option><option value="low">ไม่เร่งด่วน</option></select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"><option value="all">ทุกสถานะ</option><option value="unread">ยังไม่ได้อ่าน ({unreadCount})</option><option value="read">อ่านแล้ว</option><option value="action">ต้องดำเนินการ ({actionRequiredCount})</option></select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4 flex items-center justify-between text-sm"><span className="text-neutral-600">แสดง <b className="text-neutral-900">{filtered.length}</b> จาก {items.length} รายการจริง</span><button onClick={() => { setFilterType('all'); setFilterPriority('all'); setFilterStatus('all'); }} className="text-orange-600 hover:underline font-medium">ล้างตัวกรอง</button></div>

        {loading ? <div className="bg-white rounded-2xl border border-neutral-200 p-16 text-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-3" /><p className="text-neutral-500">กำลังรวมข้อมูลจากระบบ...</p></div> :
          filtered.length === 0 ? <div className="bg-white rounded-2xl border-2 border-neutral-200 p-12 text-center"><Bell className="h-16 w-16 text-neutral-300 mx-auto mb-4" /><p className="font-semibold text-neutral-700">ไม่มีรายการที่ตรงกับเงื่อนไข</p><p className="text-sm text-neutral-400 mt-1">ถ้าทุกอย่างเรียบร้อย หน้านี้ว่างได้เป็นปกติ</p></div> :
          <div className="space-y-3">{filtered.map(item => {
            const meta = typeMeta[item.type] || { label: item.type, Icon: Bell, bg: 'bg-neutral-100', color: 'text-neutral-600' };
            const priority = priorityMeta[item.priority] || priorityMeta.normal;
            return <div key={item.id} className={`bg-white rounded-2xl border-2 hover:border-orange-300 overflow-hidden ${item.isRead ? 'border-neutral-200' : 'border-orange-200 bg-orange-50/30'}`}><div className="p-5 flex gap-4">
              <div className={`p-3 rounded-xl ${meta.bg} shrink-0 h-fit`}><meta.Icon className={`h-5 w-5 ${meta.color}`} /></div>
              <div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-3 mb-2"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-neutral-900">{item.title}{!item.isRead && <span className="ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full" />}</h3><span className={`px-2 py-1 rounded-full text-xs font-semibold border ${priority.cls}`}>{priority.label}</span>{item.actionRequired && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">ต้องดำเนินการ</span>}</div><span className="text-xs text-neutral-500 whitespace-nowrap">{timeAgo(item.createdAt)}</span></div>
                <p className="text-sm text-neutral-600 mb-3">{item.message}</p><div className="flex flex-wrap gap-2">
                  {item.link && <button onClick={() => takeAction(item)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">{item.actionLabel || 'ดูรายละเอียด'}<ChevronRight className="h-3 w-3" /></button>}
                  {!item.isRead && <button disabled={busy === item.id} onClick={() => markRead(item.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium"><Check className="h-3 w-3" />ทำเครื่องหมายว่าอ่าน</button>}
                  <button disabled={busy === item.id} onClick={() => dismiss(item.id)} title="ซ่อนเฉพาะการแจ้งเตือน ไม่ลบข้อมูลต้นทาง" className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium"><Trash2 className="h-3 w-3" />ซ่อนรายการ</button>
                </div></div></div></div>;
          })}</div>}
      </div>
    </div>
  );
}
