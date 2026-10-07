import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Heart, Loader2, Star } from "lucide-react";
import Modal from "./ui/Modal";
import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";

const moods = [null, { emoji: "😔", label: "อยากให้ปรับปรุง" }, { emoji: "🙁", label: "ยังไม่ค่อยเข้าใจ" }, { emoji: "🙂", label: "โอเคเลย" }, { emoji: "😊", label: "ชอบมาก" }, { emoji: "🤩", label: "ประทับใจสุด ๆ" }];
function ReviewCard({ target, courseId, onSaved }) {
  const [rating, setRating] = useState(Number(target.rating) || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(target.comment || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const changed = rating !== Number(target.rating || 0) || comment !== (target.comment || "");
  const mood = moods[hover || rating];
  async function save() {
    setBusy(true); setError(""); setSaved(false);
    try {
      await axios.put(`${API_URL}/api/student/tutor-feedback/${courseId}`, { subjectId: target.subjectId, tutorId: target.tutorId, rating, comment }, { headers: { Authorization: `Bearer ${localStorage.getItem("student_token")}` }, timeout: 15000 });
      onSaved({ ...target, rating, comment: comment.trim() }); setComment(comment.trim()); setSaved(true);
    } catch (e) { setError(e.response?.data?.message || "ส่งรีวิวไม่สำเร็จ กรุณาลองอีกครั้ง"); }
    finally { setBusy(false); }
  }
  return <article className="rounded-2xl border border-orange-100 bg-white p-4 sm:p-5">
    <div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 text-xl">{target.photo ? <img src={getFileUrl(target.photo)} alt="" className="h-full w-full object-cover" /> : "👩‍🏫"}</div><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{target.subjectName}</h3><p className="text-sm text-slate-500">{target.tutorName} · {target.lessons} คาบ</p></div>{target.rating && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">รีวิวแล้ว</span>}</div>
    <fieldset disabled={busy} className="mt-4 min-w-0">
      <legend className="text-sm font-semibold text-slate-700">เรียนกับครูแล้วรู้สึกอย่างไร?</legend>
      <div className="mt-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 text-center">
        <div aria-live="polite" className="min-h-20"><span aria-hidden="true" className="inline-block text-4xl transition-transform duration-200 motion-safe:hover:scale-110">{mood?.emoji || "✨"}</span><p className="mt-2 text-sm font-semibold text-orange-800">{mood?.label || "แตะดาวเพื่อบอกความรู้สึกของน้อง"}</p></div>
        <div className="mt-3 flex justify-center gap-1 sm:gap-3" onMouseLeave={() => setHover(0)}>{[1,2,3,4,5].map(n => <button key={n} type="button" aria-label={`${n} ดาว: ${moods[n].label}`} aria-pressed={rating === n} onClick={() => { setRating(n); setSaved(false); }} onMouseEnter={() => setHover(n)} className={`flex h-11 w-11 items-center justify-center rounded-xl transition motion-safe:hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${n <= (hover || rating) ? "bg-white text-amber-500 shadow-sm" : "text-slate-300 hover:bg-white"}`}><Star size={30} fill={n <= (hover || rating) ? "currentColor" : "none"} strokeWidth={1.7} /></button>)}</div>
        <p className="mt-2 text-xs text-orange-800">{rating ? `เลือกแล้ว ${rating} / 5 ดาว` : "เลือก 1–5 ดาว"}</p>
      </div>
      <label className="mt-4 block text-sm font-semibold text-slate-700">อยากบอกอะไรกับครูไหม? <span className="font-normal text-slate-500">(ไม่บังคับ)</span><textarea value={comment} maxLength={1000} onChange={e => { setComment(e.target.value); setSaved(false); }} rows={3} placeholder="ชอบตรงไหน หรืออยากให้ครูช่วยเพิ่มเรื่องอะไร เล่าได้เลย…" className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
      <p className="text-right text-xs text-slate-400">{Array.from(comment).length}/1,000</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p role="status" className="flex items-center gap-1 text-sm text-emerald-700">{saved && <><CheckCircle2 size={16} />ขอบคุณที่ช่วยให้ครูสอนได้ดีขึ้น 💛</>}</p><button type="button" onClick={save} disabled={!rating || !changed || busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-500">{busy ? <Loader2 className="animate-spin" size={16} /> : <Heart size={16} />}{target.rating ? "บันทึกการแก้ไข" : "ส่งรีวิวให้ครู"}</button></div>
    </fieldset>
  </article>;
}
export default function StudentTutorFeedback({ course, onClose }) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    axios.get(`${API_URL}/api/student/tutor-feedback/${course.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("student_token")}` }, signal: controller.signal, timeout: 15000 })
      .then(({ data }) => setTargets(data.targets))
      .catch(e => { if (!axios.isCancel(e)) setError(e.response?.data?.message || "โหลดรายชื่อติวเตอร์ไม่สำเร็จ"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [course.id, retry]);
  const reviewed = targets.filter(t => t.rating).length;
  return <Modal title="ส่งดาวให้ครู ✨" subtitle={course.name} icon={Star} onClose={onClose} size="lg">
    <div className="mb-5 rounded-xl bg-orange-50 p-4"><p className="text-sm font-semibold text-orange-900">จบคอร์สแล้ว มาช่วยให้ครูรู้จักการเรียนของน้องมากขึ้น</p><p className="mt-1 text-xs leading-relaxed text-orange-800">เลือกดาวแยกตามวิชาและครูที่สอน ข้อความไม่บังคับ แอดมินจะใช้รีวิวเพื่อพัฒนาการสอน และรายงานไม่แสดงชื่อนักเรียน</p>{targets.length > 0 && <p className="mt-2 text-xs font-bold text-orange-700">รีวิวแล้ว {reviewed}/{targets.length} รายการ · กลับมาแก้ไขได้</p>}</div>
    {loading ? <div role="status" className="flex justify-center gap-2 py-8 text-slate-500"><Loader2 className="animate-spin" />กำลังโหลดติวเตอร์</div> : error ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={() => setRetry(n => n + 1)} className="ml-3 underline">ลองอีกครั้ง</button></div> : targets.length ? <div className="space-y-4">{targets.map(t => <ReviewCard key={`${t.subjectId}-${t.tutorId}`} target={t} courseId={course.id} onSaved={updated => setTargets(items => items.map(item => item.subjectId === updated.subjectId && item.tutorId === updated.tutorId ? updated : item))} />)}</div> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">ยังไม่มีคาบสอนที่สิ้นสุดแล้วสำหรับคอร์สนี้ จึงยังไม่มีติวเตอร์ให้รีวิว</p>}
  </Modal>;
}
