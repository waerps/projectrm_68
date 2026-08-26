import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const ago = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - date) / 1000));
  if (seconds < 60) return 'เมื่อสักครู่';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชม.ที่แล้ว`;
  return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
};

export default function NotificationBell({ role, pagePath }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const api = `${API_URL}/api/${role}/notifications`;

  const load = async () => {
    const token = localStorage.getItem('student_token');
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(api, { headers: { Authorization: `Bearer ${token}` } });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [api]);
  useEffect(() => {
    const close = event => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const unread = items.filter(item => !item.isRead).length;
  return <div className="relative" ref={ref}>
    <button type="button" onClick={() => { setOpen(value => !value); if (!open) load(); }} aria-label="การแจ้งเตือน" className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${open ? 'bg-orange-50 text-orange-500' : 'hover:bg-orange-100 hover:text-orange-500'}`}>
      <Bell className="h-5 w-5" />
      {unread > 0 && <span className="absolute right-0 top-0 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <div className="navbar-drop absolute right-0 top-[calc(100%+12px)] z-[70] w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="font-bold text-gray-900">การแจ้งเตือน</span>
        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">ยังไม่อ่าน {unread}</span>
      </div>
      <div className="max-h-[330px] overflow-y-auto">
        {loading && items.length === 0 ? <p className="px-4 py-10 text-center text-sm text-gray-400">กำลังโหลด...</p> : items.length === 0 ? <div className="px-4 py-10 text-center"><Bell className="mx-auto mb-2 h-10 w-10 text-gray-200"/><p className="text-sm text-gray-400">ยังไม่มีการแจ้งเตือน</p></div> : items.slice(0, 5).map(item => <Link key={item.id} to={item.link || pagePath} onClick={() => setOpen(false)} className={`block border-b border-gray-50 px-4 py-3 transition hover:bg-orange-50 ${!item.isRead ? 'bg-orange-50/40' : ''}`}>
          <div className="flex items-start gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? 'bg-gray-200' : 'bg-orange-500'}`}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-gray-900">{item.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">{item.message}</p><p className="mt-1 text-[11px] text-gray-400">{ago(item.createdAt)}</p></div></div>
        </Link>)}
      </div>
      <Link to={pagePath} onClick={() => setOpen(false)} className="flex items-center justify-center gap-1 border-t border-gray-100 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50">ดูการแจ้งเตือนทั้งหมด <ChevronRight className="h-4 w-4"/></Link>
    </div>}
  </div>;
}
