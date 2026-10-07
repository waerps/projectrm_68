import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Bell, DollarSign, Users, BookOpen, AlertCircle, Trash2, Check, Filter, Boxes, DoorOpen, Loader2, ChevronRight, AlertTriangle, AlertOctagon, KeyRound, Search } from 'lucide-react';
import { PAGE_TITLE } from "../components/ui/tokens";
import { BTN } from "../components/ui/tokens";
import { STAT_LABEL, STAT_VALUE, STAT_UNIT } from "../components/ui/tokens";
import ClearFiltersButton from "../components/ui/ClearFiltersButton";

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
  'password-reset': { label: 'ลืมรหัสผ่าน', Icon: KeyRound, accentBar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' }, // ★ เพิ่ม
  'private-inquiry': { label: 'คำขอคอร์สเดี่ยว', Icon: BookOpen, accentBar: 'bg-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
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
  const [search, setSearch] = useState('');

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
    const query = search.trim().toLocaleLowerCase('th-TH');
    if (query && ![item.title, item.message, typeMeta[item.type]?.label].some(value => String(value || '').toLocaleLowerCase('th-TH').includes(query))) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    if (filterStatus === 'unread' && item.isRead) return false;
    if (filterStatus === 'read' && !item.isRead) return false;
    if (filterStatus === 'action' && !item.actionRequired) return false;
    return true;
  }), [items, search, filterType, filterPriority, filterStatus]);
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
    <div className="space-y-4 px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`${PAGE_TITLE} flex items-center gap-2.5`}>
            <Bell className="h-6 w-6 text-orange-600" /> การแจ้งเตือนและกิจกรรม
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            รวมการแจ้งเตือนจากทุกส่วนของระบบ · ยังไม่ได้อ่าน {unreadCount} รายการ
            {actionRequiredCount > 0 && <span className="text-red-600 font-semibold"> · ต้องดำเนินการ {actionRequiredCount} รายการ</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} disabled={busy === 'all'}
            className={`${BTN.secondary} flex items-center justify-center gap-2 self-end sm:self-auto px-4 py-2 rounded-xl font-semibold transition text-sm disabled:opacity-60`}>
            <Check className="h-4 w-4 text-slate-500" /> อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* ★ ใหม่: Stat summary — เหมือนหน้า AdminTutors/AdminStudents */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-3 min-[360px]:[&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
        {[
          { key: 'all', label: 'การแจ้งเตือนทั้งหมด', value: items.length, color: 'bg-orange-500' },
          { key: 'unread', label: 'ยังไม่ได้อ่าน', value: unreadCount, color: 'bg-amber-500' },
          { key: 'action', label: 'ต้องดำเนินการ', value: actionRequiredCount, color: 'bg-red-500' },
        ].map(({ key, label, value, color }) => (
          // กดการ์ดเพื่อกรองตามสถานะ — ใช้แทนตัวเลขซ้ำในตัวกรองด้านล่าง
          <button key={key} type="button" aria-pressed={filterStatus === key}
            onClick={() => setFilterStatus(filterStatus === key && key !== 'all' ? 'all' : key)}
            className={`flex min-w-0 items-center gap-3 p-3 text-left bg-white rounded-2xl border shadow-sm hover:shadow-md hover:border-orange-300 transition ${filterStatus === key ? "border-orange-400 ring-2 ring-orange-100" : "border-slate-200"}`}>
            <span className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              {key === 'all' ? <Bell className="h-5 w-5 text-white" /> : key === 'unread' ? <Filter className="h-5 w-5 text-white" /> : <AlertTriangle className="h-5 w-5 text-white" />}
            </span>
            <span className="block min-w-0">
              <span className={`block ${STAT_LABEL}`}>{label}</span>
              <span className={`block ${STAT_VALUE}`}>{value.toLocaleString()}<span className={STAT_UNIT}>รายการ</span></span>
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={load} className="font-bold underline">โหลดใหม่</button>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(0,1fr))]">
          <label className="relative sm:col-span-2 lg:col-span-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาหัวข้อ ชื่อ หรือรายละเอียด" aria-label="ค้นหาการแจ้งเตือน" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" /></label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="h-10 w-full min-w-0 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-400">
            <option value="all">ทุกประเภท ({items.length})</option>
            {availableTypes.map(type => <option key={type} value={type}>{typeMeta[type]?.label || type}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="h-10 w-full min-w-0 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-400">
            <option value="all">ทุกระดับความสำคัญ</option>
            <option value="high">สำคัญมาก</option>
            <option value="normal">ปกติ</option>
            <option value="low">ไม่เร่งด่วน</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="h-10 w-full min-w-0 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-400">
            <option value="all">ทุกสถานะ</option>
            <option value="unread">ยังไม่ได้อ่าน</option>
            <option value="read">อ่านแล้ว</option>
            <option value="action">ต้องดำเนินการ</option>
          </select>
        </div>
        <div className="text-xs text-slate-500 mt-2 pl-1 flex items-center justify-between gap-2">
          <span>แสดง {filtered.length} จาก {items.length} รายการ</span>
          <ClearFiltersButton show={search !== '' || filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'all'}
            onClick={() => { setSearch(''); setFilterType('all'); setFilterPriority('all'); setFilterStatus('all'); }} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
          <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูล...</p>
        </div>
      ) : error && items.length === 0 ? null : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">ไม่มีรายการที่ตรงกับเงื่อนไข</p>
          <p className="text-sm text-slate-500 mt-1">ปรับตัวกรองเพื่อดูรายการอื่น</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([groupLabel, groupItems]) => (
            <div key={groupLabel}>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">{groupLabel}</h2>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] text-slate-500">{groupItems.length} รายการ</span>
              </div>

              <div className="space-y-2">
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
                            className="h-7 w-7 flex items-center justify-center rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 shadow-sm transition disabled:opacity-50 min-h-10 min-w-10 lg:min-h-0 lg:min-w-0">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button disabled={busy === item.id} onClick={() => dismiss(item.id)} title="ซ่อนเฉพาะการแจ้งเตือน ไม่ลบข้อมูลต้นทาง"
                          className="h-7 w-7 flex items-center justify-center rounded-full bg-white border border-red-200 text-red-500 hover:bg-red-50 shadow-sm transition disabled:opacity-50 min-h-10 min-w-10 lg:min-h-0 lg:min-w-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-3 p-3 pl-4">
                        <div className={`h-9 w-9 rounded-lg ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <meta.Icon className={`h-4.5 w-4.5 ${meta.text}`} />
                        </div>

                        <div className="min-w-0 flex-1 pr-14 sm:pr-16">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-slate-900">
                              {item.title}
                              {!item.isRead && <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-orange-500 rounded-full align-middle" />}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
                              {meta.label}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priority.cls}`}>
                              {priority.label}
                            </span>
                            {item.actionRequired && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                ต้องดำเนินการ
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-6 text-slate-600 break-words">{item.message}</p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <span className="text-xs text-slate-500">{timeAgo(item.createdAt)}</span>
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
