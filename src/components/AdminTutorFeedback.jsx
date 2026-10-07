import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronDown, Heart, Loader2, MessageSquare, Star } from "lucide-react";
import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";

const score = n => Number(n).toFixed(2);
export default function AdminTutorFeedback() {
  const [month, setMonth] = useState(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit' }).format(new Date()).replace('/', '-'));
  const [subject, setSubject] = useState('all');
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    axios.get(`${API_URL}/api/admin/tutor-feedback`, { params: { month: month || 'all' }, headers: { Authorization: `Bearer ${localStorage.getItem('student_token')}` }, signal: controller.signal, timeout: 15000 })
      .then(({ data }) => setTutors(data.tutors))
      .catch(e => { if (!axios.isCancel(e)) setError(e.response?.data?.message || 'โหลดสรุปรีวิวไม่สำเร็จ'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [month, retry]);
  const subjects = useMemo(() => [...new Map(tutors.flatMap(t => t.subjects).map(s => [String(s.subjectId), s.subjectName])).entries()], [tutors]);
  const filtered = tutors.map(t => {
    const selected = t.subjects.filter(s => subject === 'all' || String(s.subjectId) === subject);
    const count = selected.reduce((sum,s) => sum+s.count,0);
    return { ...t, subjects: selected, filteredCount: count, filteredAverage: count ? selected.reduce((sum,s) => sum+s.average*s.count,0)/count : 0 };
  }).filter(t => t.filteredCount).sort((a,b) => b.filteredAverage-a.filteredAverage);
  const count = filtered.reduce((sum,t) => sum+t.filteredCount,0);
  const average = count ? filtered.reduce((sum,t) => sum+t.filteredAverage*t.filteredCount,0)/count : null;
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-6"><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Heart size={22} className="text-orange-500" />เสียงจากนักเรียน · รีวิวติวเตอร์</h2><p className="text-xs text-slate-500">คะแนนความรู้สึกหลังจบคอร์ส · แยกจาก Performance Score</p></div>
    <div className="space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><p className="max-w-xl text-xs leading-relaxed text-slate-500">นับตามเดือนที่ส่งรีวิวครั้งแรก การแก้ไขไม่เพิ่มจำนวนรีวิว ตัวเลขเป็นฟีดแบ็กจากผู้ตอบ ไม่ใช่นักเรียนทั้งคอร์ส</p><div className="flex flex-wrap items-center gap-2"><label className="text-xs text-slate-500">เดือนที่ได้รับรีวิว<input aria-label="เดือนที่ได้รับรีวิว" type="month" value={month} onChange={e => setMonth(e.target.value)} className="ml-2 min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3" /></label><button onClick={() => setMonth('')} className={`min-h-10 rounded-xl border px-3 text-xs ${!month ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'}`}>ทุกเดือน</button><select aria-label="วิชาของรีวิว" value={subject} onChange={e => setSubject(e.target.value)} className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"><option value="all">ทุกวิชา</option>{subjects.map(([id,name]) => <option value={id} key={id}>{name}</option>)}</select></div></div>
      {loading ? <div role="status" className="flex justify-center gap-2 py-10 text-slate-500"><Loader2 className="animate-spin" />กำลังโหลดรีวิว</div> : error ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}<button className="ml-3 underline" onClick={() => setRetry(n => n+1)}>ลองอีกครั้ง</button></div> : <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[{title:'คะแนนเฉลี่ย',value:average === null ? '—' : `${score(average)} / 5`,icon:'⭐'},{title:'รีวิวที่ได้รับ',value:`${count} รีวิว`,icon:'💬'},{title:'ติวเตอร์ที่ได้รับรีวิว',value:`${filtered.length} คน`,icon:'👩‍🏫'}].map(item => <div key={item.title} className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/80 to-white p-5"><p className="text-xs text-slate-500">{item.icon} {item.title}</p><p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p></div>)}</div>
        {!filtered.length ? <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center"><span className="text-4xl">💛</span><p className="mt-3 font-semibold text-slate-700">ยังไม่มีรีวิวในช่วงที่เลือก</p><p className="mt-1 text-sm text-slate-500">นักเรียนส่งรีวิวได้จากคอร์สที่เรียนจบแล้ว คะแนนจะแสดงเมื่อมีผู้ตอบ</p></div> : <div className="space-y-3">{filtered.map(t => <details key={t.tutorId} className="group rounded-2xl border border-slate-200 open:border-orange-200"><summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50">{t.photo ? <img src={getFileUrl(t.photo)} alt="" className="h-full w-full object-cover" /> : '👩‍🏫'}</div><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{t.tutorName}</h3><p className="mt-1 text-xs text-slate-500">{t.filteredCount} รีวิว · {t.subjects.map(s => s.subjectName).join(' / ')}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${t.filteredCount < 5 ? 'bg-amber-50 text-amber-700' : t.filteredAverage < 3.5 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{t.filteredCount < 5 ? 'ข้อมูลยังน้อย' : t.filteredAverage < 3.5 ? 'ควรติดตาม' : 'ผลตอบรับดี'}</span></div><span className="shrink-0 text-right"><span className="flex items-center gap-1 text-xl font-bold text-orange-600"><Star size={18} fill="currentColor" />{score(t.filteredAverage)}</span><span className="text-xs text-slate-400">จาก 5 ดาว</span></span><ChevronDown size={18} className="shrink-0 text-slate-400 transition group-open:rotate-180" /></summary>
          <div className="space-y-4 border-t border-slate-100 p-4 sm:p-5"><p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{subject === 'all' ? t.analysis : t.filteredCount < 5 ? 'ข้อมูลของวิชานี้ยังน้อย ควรอ่านความคิดเห็นประกอบ' : t.filteredAverage < 3.5 ? 'ควรติดตามประสบการณ์เรียนในวิชานี้และอ่านข้อเสนอแนะประกอบ' : 'วิชานี้ได้รับผลตอบรับดี ใช้ความคิดเห็นเพื่อพัฒนาการสอนต่อ'}</p>
            {subject === 'all' && <div className="grid gap-4 sm:grid-cols-2"><div><h4 className="mb-2 text-sm font-semibold text-slate-700">การกระจายดาว</h4>{[5,4,3,2,1].map(star => <div key={star} className="mb-2 flex items-center gap-2 text-xs text-slate-500"><span className="w-8">{star} ★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{width:`${t.distribution[star-1]/t.count*100}%`}} /></div><span className="w-8 text-right">{t.distribution[star-1]}</span></div>)}<p className="mt-2 text-xs text-slate-500">1–2 ดาว: {t.lowRatingCount} รีวิว · ใช้ติดตามข้อเสนอแนะ</p></div><div><h4 className="mb-2 text-sm font-semibold text-slate-700">คะแนนแยกตามวิชา</h4>{[...t.subjects].sort((a,b)=>a.average-b.average).map(s => <div key={s.subjectId} className="mb-2 flex justify-between gap-2 rounded-xl bg-orange-50/50 p-3 text-sm"><span>{s.subjectName}<span className="block text-xs text-slate-500">{s.count} รีวิว{s.count < 3 ? ' · ข้อมูลยังน้อย' : s.average < 3.5 ? ' · ควรติดตาม' : ''}</span></span><strong className="text-orange-700">{score(s.average)} ★</strong></div>)}</div></div>}
            <div><h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><MessageSquare size={16} />ความคิดเห็นจากนักเรียน <span className="font-normal text-slate-400">(ข้อความล่าสุด ไม่แสดงชื่อ)</span></h4>{t.comments.filter(c => subject === 'all' || String(c.subjectId) === subject).length ? t.comments.filter(c => subject === 'all' || String(c.subjectId) === subject).map(c => <blockquote key={c.id} className="mb-2 rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="whitespace-pre-wrap break-words text-sm text-slate-700">{c.comment}</p><footer className="mt-2 text-xs text-slate-500">{c.rating} ★ · {c.subjectName} · {c.courseName} · {new Date(c.reviewedAt).toLocaleDateString('th-TH')}</footer></blockquote>) : <p className="text-sm text-slate-400">ไม่มีข้อความในรายการล่าสุด คะแนนดาวถูกนำมาคำนวณตามปกติ</p>}</div>
          </div></details>)}</div>}
      </>}
    </div>
  </section>;
}
