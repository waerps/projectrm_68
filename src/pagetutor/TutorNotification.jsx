import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Bell, ChevronRight, DollarSign, Calendar, AlertCircle, CheckCircle, Trash2, Check, Loader2, Repeat2 } from 'lucide-react';

const API=`${API_URL}/api/tutor/notifications`;
const auth=()=>{const token=localStorage.getItem('student_token');return token?{headers:{Authorization:`Bearer ${token}`}}:{};};

// ── meta: เพิ่ม accent (สำหรับแถบซ้าย + badge) ให้ตรงโทนเว็บ (ส้ม/แดง/เขียว/น้ำเงิน) ──
const meta={
  payment:{label:'การเงิน',Icon:DollarSign,accent:'border-emerald-400',bg:'bg-emerald-50',text:'text-emerald-700',border:'border-emerald-200'},
  schedule:{label:'ตารางสอน',Icon:Calendar,accent:'border-orange-400',bg:'bg-orange-50',text:'text-orange-700',border:'border-orange-200'},
  alert:{label:'ต้องจัดการ',Icon:AlertCircle,accent:'border-red-400',bg:'bg-red-50',text:'text-red-700',border:'border-red-200'},
  success:{label:'สำเร็จ',Icon:CheckCircle,accent:'border-teal-400',bg:'bg-teal-50',text:'text-teal-700',border:'border-teal-200'},
  release:{label:'คาบสอนแทน',Icon:Repeat2,accent:'border-blue-400',bg:'bg-blue-50',text:'text-blue-700',border:'border-blue-200'},
};
const fallbackMeta = {label:'',Icon:Bell,accent:'border-slate-300',bg:'bg-slate-100',text:'text-slate-600',border:'border-slate-200'};

function ago(value){const d=new Date(value);if(Number.isNaN(d.getTime()))return'—';const s=Math.max(0,Math.floor((Date.now()-d)/1000));if(s<60)return'เมื่อสักครู่';if(s<3600)return`${Math.floor(s/60)} นาทีที่แล้ว`;if(s<86400)return`${Math.floor(s/3600)} ชั่วโมงที่แล้ว`;if(s<604800)return`${Math.floor(s/86400)} วันที่แล้ว`;return d.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});}

// ★ ใหม่ (UI only): จัดกลุ่มรายการตามวัน — ไม่กระทบข้อมูลจริง แค่จัดการแสดงผล
function groupByDate(items){
  const now=new Date();
  const startOf=(d)=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const today=startOf(now);
  const yesterday=new Date(today); yesterday.setDate(today.getDate()-1);
  const weekAgo=new Date(today); weekAgo.setDate(today.getDate()-7);

  const groups={ 'วันนี้':[], 'เมื่อวาน':[], 'สัปดาห์นี้':[], 'ก่อนหน้านี้':[] };
  for(const item of items){
    const d=new Date(item.createdAt);
    if(Number.isNaN(d.getTime())){ groups['ก่อนหน้านี้'].push(item); continue; }
    const dayStart=startOf(d);
    if(dayStart.getTime()===today.getTime()) groups['วันนี้'].push(item);
    else if(dayStart.getTime()===yesterday.getTime()) groups['เมื่อวาน'].push(item);
    else if(dayStart.getTime()>weekAgo.getTime()) groups['สัปดาห์นี้'].push(item);
    else groups['ก่อนหน้านี้'].push(item);
  }
  return Object.entries(groups).filter(([,arr])=>arr.length>0);
}

const pillClass = (active) =>
  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition border ${
    active ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
  }`;

export default function TutorNotifications(){
  const navigate=useNavigate();
  const [filter,setFilter]=useState('all');const [items,setItems]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [busy,setBusy]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');try{const {data}=await axios.get(API,auth());setItems(Array.isArray(data.items)?data.items:[]);}catch(err){setError(err.response?.data?.message||'โหลดการแจ้งเตือนไม่สำเร็จ');}finally{setLoading(false);}},[]);
  useEffect(()=>{load();},[load]);
  const unread=items.filter(x=>!x.isRead).length;
  const filtered=useMemo(()=>items.filter(x=>filter==='all'?true:filter==='unread'?!x.isRead:filter==='read'?x.isRead:x.type===filter),[items,filter]);
  const types=[...new Set(items.map(x=>x.type))];
  const mark=async id=>{setBusy(id);try{await axios.patch(`${API}/${encodeURIComponent(id)}/read`,{},auth());setItems(xs=>xs.map(x=>x.id===id?{...x,isRead:true}:x));}catch(err){setError(err.response?.data?.message||'บันทึกสถานะไม่สำเร็จ');}finally{setBusy('');}};
  const markAll=async()=>{setBusy('all');try{await axios.patch(`${API}/read-all`,{},auth());setItems(xs=>xs.map(x=>({...x,isRead:true})));}catch(err){setError(err.response?.data?.message||'บันทึกสถานะไม่สำเร็จ');}finally{setBusy('');}};
  const dismiss=async id=>{setBusy(id);try{await axios.delete(`${API}/${encodeURIComponent(id)}`,auth());setItems(xs=>xs.filter(x=>x.id!==id));}catch(err){setError(err.response?.data?.message||'ซ่อนรายการไม่สำเร็จ');}finally{setBusy('');}};
  const act=async item=>{if(!item.isRead)await mark(item.id);if(item.link)navigate(item.link);};

  const grouped = useMemo(()=>groupByDate(filtered),[filtered]);

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-orange-600" /> การแจ้งเตือน
          </h1>
          <p className="text-sm text-slate-500 mt-1">ข้อมูลจริงสำหรับงานสอนของคุณ · ยังไม่ได้อ่าน {unread} รายการ</p>
        </div>
        {unread>0 && (
          <button onClick={markAll} disabled={busy==='all'}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition text-sm disabled:opacity-60">
            <Check className="h-4 w-4" /> อ่านทั้งหมด
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="font-bold underline">ลองใหม่</button>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setFilter('all')} className={pillClass(filter==='all')}>ทั้งหมด ({items.length})</button>
          <button onClick={()=>setFilter('unread')} className={pillClass(filter==='unread')}>ยังไม่ได้อ่าน ({unread})</button>
          {types.map(type=>(
            <button key={type} onClick={()=>setFilter(type)} className={pillClass(filter===type)}>
              {meta[type]?.label||type}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
          <p className="text-sm font-medium text-slate-500">กำลังโหลดงานของคุณ...</p>
        </div>
      ) : filtered.length===0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">ไม่มีการแจ้งเตือน</p>
          <p className="text-sm text-slate-400 mt-1">หากไม่มีงานค้าง หน้านี้ว่างได้เป็นปกติ</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([groupLabel, groupItems]) => (
            <div key={groupLabel}>
              {/* หัวกลุ่มวัน — sticky เล็กน้อยให้รู้ว่ากำลังอยู่ช่วงไหน */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide">{groupLabel}</h2>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] text-slate-400">{groupItems.length} รายการ</span>
              </div>

              <div className="space-y-3">
                {groupItems.map(item=>{
                  const m=meta[item.type]||fallbackMeta;
                  return (
                    <div key={item.id}
                      className={`group relative bg-white rounded-xl border ${item.isRead?'border-slate-200':'border-orange-200'} border-l-4 ${m.accent} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${!item.isRead ? 'bg-orange-50/20' : ''}`}>

                      {/* ปุ่ม action มุมขวาบน — compact icon เท่านั้น (C) */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {!item.isRead && (
                          <button disabled={busy===item.id} onClick={()=>mark(item.id)} title="อ่านแล้ว"
                            className="h-7 w-7 flex items-center justify-center rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 shadow-sm transition disabled:opacity-50">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button disabled={busy===item.id} onClick={()=>dismiss(item.id)} title="ซ่อนรายการ"
                          className="h-7 w-7 flex items-center justify-center rounded-full bg-white border border-red-200 text-red-500 hover:bg-red-50 shadow-sm transition disabled:opacity-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="p-4 pl-5 flex gap-3">
                        <div className={`h-9 w-9 rounded-lg ${m.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <m.Icon className={`h-4.5 w-4.5 ${m.text}`} />
                        </div>

                        <div className="flex-1 min-w-0 pr-16">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-slate-900">
                              {item.title}
                              {!item.isRead && <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-orange-500 rounded-full align-middle" />}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${m.bg} ${m.text}`}>
                              {m.label}
                            </span>
                          </div>
                          <p className="text-sm leading-6 text-slate-600">{item.message}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-slate-400">{ago(item.createdAt)}</span>
                            {item.link && (
                              <button onClick={()=>act(item)}
                                className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition">
                                {item.actionLabel||'ดูรายละเอียด'} <ChevronRight className="h-3.5 w-3.5" />
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