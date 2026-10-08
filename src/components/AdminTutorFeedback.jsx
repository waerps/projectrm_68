import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronDown, Heart, Loader2, Medal, MessageSquare, Star, Users } from "lucide-react";
import { API_URL } from "../config";

import Pagination from "./ui/Pagination";

import { STAT_LABEL, STAT_NUM, STAT_VALUE } from "./ui/tokens";
import InitialAvatar from "./ui/InitialAvatar";

const MEDALS = ['🥇', '🥈', '🥉'];

// โพเดียม 3 อันดับ — หน้าตาเดียวกับโพเดียมนักเรียน (AdminStudents) แต่ข้อมูลเหมือนเดิมทุกอย่าง
// คะแนนเท่ากันได้อันดับร่วมกัน · แสดงคะแนนเฉลี่ย จำนวนรีวิว และป้าย "ข้อมูลยังน้อย"
function ReviewPodium({ tutors }) {
  const groups = [];
  for (const tutor of tutors) {
    const rating = score(tutor.filteredAverage);
    const group = groups[groups.length - 1];
    if (group?.rating === rating) group.tutors.push(tutor);
    else {
      if (groups.length === 3) break;
      groups.push({ rating, tutors: [tutor] });
    }
  }
  const stepClass = ['order-1 sm:order-none sm:mt-0', 'order-2 sm:order-none sm:mt-4', 'order-3 sm:order-none sm:mt-8'];
  return <div className="space-y-3">
    <div><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Medal size={18} className="text-orange-500" />อันดับติวเตอร์จากคะแนนรีวิว</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">เรียงตามคะแนนเฉลี่ยในเดือนและวิชาที่เลือก คะแนนเท่ากันได้อันดับร่วมกัน ดูจำนวนรีวิวประกอบ</p></div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">{[1, 0, 2].map(medalIdx => {
      const group = groups[medalIdx];
      if (!group) return <div key={`empty-${medalIdx}`} data-rank={medalIdx + 1} className={`flex min-w-0 items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-2 text-left sm:block sm:p-3 sm:text-center ${stepClass[medalIdx]}`}>
        <div className="shrink-0 text-2xl opacity-30">{MEDALS[medalIdx]}</div>
        <div className="mt-2 flex justify-center"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60"><Users className="h-4 w-4 text-slate-400" /></span></div>
        <p className="mt-1.5 min-w-0 flex-1 text-sm font-medium text-slate-500 sm:flex-none">ยังไม่มี</p>
        <p className={`${STAT_NUM} mt-1 text-slate-300`}>—</p>
        <p className="text-xs font-medium text-slate-300">/ 5 ดาว</p>
      </div>;
      const reviews = group.tutors.reduce((sum, t) => sum + t.filteredCount, 0);
      return <div key={group.rating} data-rank={medalIdx + 1} className={`flex min-w-0 items-center gap-3 rounded-xl border p-2 text-left sm:block sm:p-3 sm:text-center ${medalIdx === 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-slate-50'} ${stepClass[medalIdx]}`}>
        <div className="shrink-0 text-2xl">{MEDALS[medalIdx]}</div>
        <div className="mt-2 flex flex-wrap justify-center -space-x-2">
          {group.tutors.slice(0, 4).map(t => <span key={t.tutorId} title={t.tutorName} className="h-10 w-10 overflow-hidden rounded-xl border-2 border-white shadow-sm hover:z-10">
            <InitialAvatar photo={t.photo} name={t.tutorName} alt={t.tutorName} className="h-full w-full rounded-xl" />
          </span>)}
          {group.tutors.length > 4 && <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-slate-200 text-[11px] font-bold text-slate-600 shadow-sm">+{group.tutors.length - 4}</span>}
        </div>
        <p className="mt-1.5 min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 sm:flex-none" title={group.tutors.map(t => t.tutorName).join(', ')}>{group.tutors.length === 1 ? group.tutors[0].tutorName : `${group.tutors.length} คนได้อันดับร่วมกัน`}</p>
        <div className="shrink-0 text-right sm:text-center">
          <p className={`${STAT_VALUE} mt-1`}>{group.rating}</p>
          <p className={STAT_LABEL}>/ 5 ดาว · {group.tutors.length > 1 ? 'รวม ' : ''}{reviews.toLocaleString()} รีวิว</p>
          {group.tutors.some(t => t.filteredCount < 5) && <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">{group.tutors.length === 1 ? 'ข้อมูลยังน้อย' : 'มีผู้ที่ข้อมูลยังน้อย'}</span>}
        </div>
      </div>;
    })}</div>
  </div>;
}

const PAGE_SIZE = 12;
const score = n => Number(n).toFixed(2);
export default function AdminTutorFeedback() {
  const [month, setMonth] = useState(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit' }).format(new Date()).replace('/', '-'));
  const [subject, setSubject] = useState('all');
  const [page, setPage] = useState(1);
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
  }).filter(t => t.filteredCount).sort((a,b) => Number(score(b.filteredAverage))-Number(score(a.filteredAverage)) || b.filteredCount-a.filteredCount || String(a.tutorId).localeCompare(String(b.tutorId)));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const visibleTutors = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  // อันดับแบบเดียวกับโพเดียม: คะแนนเท่ากัน = อันดับร่วม และอันดับถัดไปนับต่อจากกลุ่มก่อนหน้า (1,1,2,3)
  const distinctScores = [...new Set(filtered.map(o => score(o.filteredAverage)))];
  const rankOf = (t) => distinctScores.indexOf(score(t.filteredAverage)) + 1;
  const count = filtered.reduce((sum,t) => sum+t.filteredCount,0);
  const average = count ? filtered.reduce((sum,t) => sum+t.filteredAverage*t.filteredCount,0)/count : null;
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-6"><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Heart size={22} className="text-orange-500" />รีวิวการสอนจากนักเรียน</h2><p className="text-xs text-slate-500">ความพึงพอใจหลังเรียนจบคอร์ส</p></div>
    <div className="space-y-5 p-4 sm:p-6"><div className="flex flex-col items-start gap-2 sm:items-end"><div className="flex flex-wrap items-center gap-2"><label className="text-xs text-slate-500">เดือนที่ได้รับรีวิว<input aria-label="เดือนที่ได้รับรีวิว" type="month" value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} className="ml-2 min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3" /></label><button onClick={() => { setMonth(''); setPage(1); }} className={`min-h-10 rounded-xl border px-3 text-xs ${!month ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'}`}>ทุกเดือน</button><select aria-label="วิชาของรีวิว" value={subject} onChange={e => { setSubject(e.target.value); setPage(1); }} className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"><option value="all">ทุกวิชา</option>{subjects.map(([id,name]) => <option value={id} key={id}>{name}</option>)}</select></div><p className="text-xs leading-relaxed text-slate-500">เดือนที่ได้รับรีวิวอ้างอิงวันที่ส่งครั้งแรก การแก้ไขรีวิวไม่นับเป็นรีวิวใหม่</p></div>
      {loading ? <div role="status" className="flex justify-center gap-2 py-10 text-slate-500"><Loader2 className="animate-spin" />กำลังโหลดรีวิว</div> : error ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}<button className="ml-3 underline" onClick={() => setRetry(n => n+1)}>ลองอีกครั้ง</button></div> : <>
        {/* สรุปสั้นบรรทัดเดียว — ไม่ทำเป็นการ์ดใหญ่อีกแถว จะได้ไม่ซ้ำกับการ์ดสถิติติวเตอร์ด้านบนของหน้า */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600" title="คะแนนเฉลี่ยคำนวณจากดาวรวม ÷ จำนวนรีวิว ในเดือนและวิชาที่เลือก">
          <span className="flex items-center gap-1.5"><Star size={15} className="text-orange-500" fill="currentColor" aria-hidden="true" />เฉลี่ย <strong className="text-slate-900">{average === null ? '—' : score(average)}</strong> / 5 ดาว</span>
          <span className="flex items-center gap-1.5"><MessageSquare size={15} className="text-slate-400" aria-hidden="true" /><strong className="text-slate-900">{count.toLocaleString()}</strong> รีวิว</span>
          <span className="flex items-center gap-1.5"><Users size={15} className="text-slate-400" aria-hidden="true" />ติวเตอร์ <strong className="text-slate-900">{filtered.length.toLocaleString()}</strong> คน</span>
        </div>
        <ReviewPodium tutors={filtered} />
        {!filtered.length ? <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center"><MessageSquare aria-hidden="true" className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">ยังไม่มีรีวิวในช่วงที่เลือก</p><p className="mt-1 text-sm text-slate-500">นักเรียนส่งรีวิวได้จากคอร์สที่เรียนจบแล้ว คะแนนจะแสดงเมื่อมีผู้ตอบ</p></div> : <div className="space-y-2">{visibleTutors.map(t => <details key={t.tutorId} className={`group rounded-2xl border bg-white transition-all ${rankOf(t) === 1 ? 'border-amber-300' : 'border-slate-200'} open:border-orange-200`}><summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 [&::-webkit-details-marker]:hidden">
            <span className="w-6 shrink-0 text-center text-lg">{MEDALS[rankOf(t) - 1] || <span className="text-sm font-semibold text-slate-500">{rankOf(t)}</span>}</span>
            <InitialAvatar photo={t.photo} name={t.tutorName} alt={t.tutorName} className="hidden h-9 w-9 shrink-0 rounded-xl border border-orange-100 sm:flex" />
            <span className="block min-w-0 flex-1"><span className="block break-words text-sm font-semibold text-slate-900 sm:text-base">{t.tutorName}</span><span className="mt-0.5 flex flex-wrap items-center gap-1.5"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${t.filteredCount < 5 ? 'border-amber-200 bg-amber-50 text-amber-700' : t.filteredAverage < 3.5 ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{t.filteredCount < 5 ? 'ข้อมูลยังน้อย' : t.filteredAverage < 3.5 ? 'ควรติดตาม' : 'ผลตอบรับดี'}</span><span className="text-xs text-slate-500">{t.filteredCount} รีวิว · {t.subjects.map(s => s.subjectName).join(' / ')}</span></span></span>
            <span className="shrink-0 text-right"><span className="flex items-center justify-end gap-1 text-lg font-bold text-orange-600 sm:text-xl"><Star size={16} fill="currentColor" aria-hidden="true" />{score(t.filteredAverage)}</span><span className="text-xs text-slate-400">จาก 5 ดาว</span></span>
            <ChevronDown size={16} className="shrink-0 text-slate-400 transition group-open:rotate-180" /></summary>
          <div className="space-y-4 border-t border-slate-100 p-4 sm:p-5"><p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{subject === 'all' ? t.analysis : t.filteredCount < 5 ? 'ข้อมูลของวิชานี้ยังน้อย ควรอ่านความคิดเห็นประกอบ' : t.filteredAverage < 3.5 ? 'ควรติดตามประสบการณ์เรียนในวิชานี้และอ่านข้อเสนอแนะประกอบ' : 'วิชานี้ได้รับผลตอบรับดี ใช้ความคิดเห็นเพื่อพัฒนาการสอนต่อ'}</p>
            {subject === 'all' && <div className="grid gap-4 sm:grid-cols-2"><div><h3 className="mb-2 text-sm font-semibold text-slate-700">การกระจายดาว</h3>{[5,4,3,2,1].map(star => <div key={star} className="mb-2 flex items-center gap-2 text-xs text-slate-500"><span className="w-10">{star} ดาว</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{width:`${t.distribution[star-1]/t.count*100}%`}} /></div><span className="w-14 text-right">{t.distribution[star-1]} รีวิว</span></div>)}<p className="mt-2 text-xs text-slate-500">1–2 ดาว: {t.lowRatingCount} รีวิว · ใช้ติดตามข้อเสนอแนะ</p></div><div><h3 className="mb-2 text-sm font-semibold text-slate-700">คะแนนแยกตามวิชา</h3>{[...t.subjects].sort((a,b)=>a.average-b.average).map(s => <div key={s.subjectId} className="mb-2 flex justify-between gap-2 rounded-xl bg-orange-50/50 p-3 text-sm"><span>{s.subjectName}<span className="block text-xs text-slate-500">{s.count} รีวิว{s.count < 3 ? ' · ข้อมูลยังน้อย' : s.average < 3.5 ? ' · ควรติดตาม' : ''}</span></span><strong className="shrink-0 whitespace-nowrap text-orange-700">{score(s.average)} / 5 ดาว</strong></div>)}</div></div>}
            <div><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><MessageSquare size={16} />ความคิดเห็นจากนักเรียน <span className="font-normal text-slate-400">(ข้อความล่าสุด ไม่แสดงชื่อ)</span></h3>{t.comments.filter(c => subject === 'all' || String(c.subjectId) === subject).length ? t.comments.filter(c => subject === 'all' || String(c.subjectId) === subject).map(c => <blockquote key={c.id} className="mb-2 rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="whitespace-pre-wrap break-words text-sm text-slate-700">{c.comment}</p><footer className="mt-2 text-xs text-slate-500">{c.rating} ดาว · {c.subjectName} · {c.courseName} · {new Date(c.reviewedAt).toLocaleDateString('th-TH')}</footer></blockquote>) : <p className="text-sm text-slate-400">ไม่มีข้อความในรายการล่าสุด คะแนนดาวถูกนำมาคำนวณตามปกติ</p>}</div>
          </div></details>)}</div>}
        {filtered.length > 0 && (totalPages > 1 ? <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} unit="คน" onChange={setPage} /> : <p className="text-sm text-slate-500">แสดง <span className="font-semibold text-slate-700">1–{filtered.length}</span> จาก <span className="font-semibold text-slate-700">{filtered.length}</span> คน</p>)}
      </>}
    </div>
  </section>;
}
