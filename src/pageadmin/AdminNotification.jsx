import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Bell, DollarSign, Users, BookOpen, AlertCircle, Trash2, Check, Filter, Boxes, DoorOpen, Loader2, ChevronRight, AlertTriangle, AlertOctagon } from 'lucide-react';

const API = `${API_URL}/api/admin/notifications`;
const auth = () => {
  const token = localStorage.getItem('student_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// ── typeMeta: เพิ่ม accentBar/text/border ให้โครงสร้างเดียวกับหน้าติวเตอร์/นักเรียน ──
const typeMeta = {
  payment: { label: 'การเงิน', Icon: DollarSign, accentBar: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  tutor: { label: 'ติวเตอร์', Icon: Users, accentBar: 'bg-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
  course: { label: 'คอร์สเรียน', Icon: BookOpen, accentBar: 'bg-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
  alert: { label: 'แจ้งเตือนสำคัญ', Icon: AlertCircle, accentBar: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
  facility: { label: 'อุปกรณ์', Icon: Boxes, accentBar: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  room: { label: 'ห้องเรียน', Icon: DoorOpen, accentBar: 'bg-cyan-400', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' },
  incident: { label: 'แจ้งเหตุการณ์', Icon: AlertOctagon, accentBar: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' }, // ★ เพิ่ม
};
const fallbackTypeMeta = { label: '', Icon: Bell, accentBar: 'bg-slate-300', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };

const priorityMeta = {
  high: { label: 'สำคัญมาก', cls: 'bg-red-50 text-red-700 border-red-200' },
  normal: { label: 'ปกติ', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  low: { label: 'ไม่เร่งด่วน', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
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

// ★ ใหม่ (UI only): จัดกลุ่มตามวัน — เหมือนหน้าติวเตอร์/นักเรียน
function groupByDate(items) {
  const now = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOf(now);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);

  const groups = { 'วันนี้': [], 'เมื่อวาน': [], 'สัปดาห์นี้': [], 'ก่อนหน้านี้': [] };
  for (const item of items) {
    const d = new Date(item.createdAt);
    if (Number.isNaN(d.getTime())) { groups['ก่อนหน้านี้'].push(item); continue; }
    const dayStart = startOf(d);
    if (dayStart.getTime() === today.getTime()) groups['วันนี้'].push(item);
    else if (dayStart.getTime() === yesterday.getTime()) groups['เมื่อวาน'].push(item);
    else if (dayStart.getTime() > weekAgo.getTime()) groups['สัปดาห์นี้'].push(item);
    else groups['ก่อนหน้านี้'].push(item);
  }
  return Object.entries(groups).filter(([, arr]) => arr.length > 0);
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

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-orange-600" /> การแจ้งเตือนและกิจกรรม
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ข้อมูลจริงจากส่วนต่าง ๆ ของระบบ · ยังไม่ได้อ่าน {unreadCount} รายการ
            {actionRequiredCount > 0 && <span className="text-red-600 font-semibold"> · ต้องดำเนินการ {actionRequiredCount} รายการ</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} disabled={busy === 'all'}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition text-sm disabled:opacity-60">
            <Check className="h-4 w-4" /> อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* ★ ใหม่: Stat summary — เหมือนหน้า AdminTutors/AdminStudents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'การแจ้งเตือนทั้งหมด', value: items.length, color: 'bg-orange-500', Icon: Bell },
          { label: 'ยังไม่ได้อ่าน', value: unreadCount, color: 'bg-amber-500', Icon: Filter },
          { label: 'ต้องดำเนินการ', value: actionRequiredCount, color: 'bg-red-500', Icon: AlertTriangle },
        ].map(({ label, value, color, Icon }, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-black text-slate-900">{value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="font-bold underline">ลองใหม่</button>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
          <Filter className="h-4 w-4 text-orange-600" /> กรองการแจ้งเตือน
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none">
            <option value="all">ทุกประเภท ({items.length})</option>
            {availableTypes.map(type => <option key={type} value={type}>{typeMeta[type]?.label || type}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none">
            <option value="all">ทุกระดับความสำคัญ</option>
            <option value="high">สำคัญมาก</option>
            <option value="normal">ปกติ</option>
            <option value="low">ไม่เร่งด่วน</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none">
            <option value="all">ทุกสถานะ</option>
            <option value="unread">ยังไม่ได้อ่าน ({unreadCount})</option>
            <option value="read">อ่านแล้ว</option>
            <option value="action">ต้องดำเนินการ ({actionRequiredCount})</option>
          </select>
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1 flex items-center justify-between">
          <span>แสดง {filtered.length} จาก {items.length} รายการจริง</span>
          <button onClick={() => { setFilterType('all'); setFilterPriority('all'); setFilterStatus('all'); }}
            className="text-orange-600 hover:underline font-semibold">ล้างตัวกรอง</button>
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
          <p className="text-sm font-medium text-slate-500">กำลังรวมข้อมูลจากระบบ...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">ไม่มีรายการที่ตรงกับเงื่อนไข</p>
          <p className="text-sm text-slate-400 mt-1">ถ้าทุกอย่างเรียบร้อย หน้านี้ว่างได้เป็นปกติ</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([groupLabel, groupItems]) => (
            <div key={groupLabel}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide">{groupLabel}</h2>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] text-slate-400">{groupItems.length} รายการ</span>
              </div>

              <div className="space-y-3">
                {groupItems.map(item => {
                  const meta = typeMeta[item.type] || fallbackTypeMeta;
                  const priority = priorityMeta[item.priority] || priorityMeta.normal;
                  return (
                    <div key={item.id}
                      className={`relative bg-white rounded-xl border ${item.isRead ? 'border-slate-200' : 'border-orange-200'} border-l-4 ${meta.accentBar} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${!item.isRead ? 'bg-orange-50/20' : ''}`}>

                      {/* ปุ่ม action มุมขวาบน — โชว์ตลอดเวลา */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {!item.isRead && (
                          <button disabled={busy === item.id} onClick={() => markRead(item.id)} title="ทำเครื่องหมายว่าอ่าน"
                            className="h-7 w-7 flex items-center justify-center rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 shadow-sm transition disabled:opacity-50">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button disabled={busy === item.id} onClick={() => dismiss(item.id)} title="ซ่อนเฉพาะการแจ้งเตือน ไม่ลบข้อมูลต้นทาง"
                          className="h-7 w-7 flex items-center justify-center rounded-full bg-white border border-red-200 text-red-500 hover:bg-red-50 shadow-sm transition disabled:opacity-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="p-4 pl-5 flex gap-3">
                        <div className={`h-9 w-9 rounded-lg ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <meta.Icon className={`h-4.5 w-4.5 ${meta.text}`} />
                        </div>

                        <div className="flex-1 min-w-0 pr-16">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-slate-900">
                              {item.title}
                              {!item.isRead && <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-orange-500 rounded-full align-middle" />}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.text}`}>
                              {meta.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${priority.cls}`}>
                              {priority.label}
                            </span>
                            {item.actionRequired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                ต้องดำเนินการ
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-6 text-slate-600">{item.message}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                            {item.link && (
                              <button onClick={() => takeAction(item)}
                                className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition">
                                {item.actionLabel || 'ดูรายละเอียด'} <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}