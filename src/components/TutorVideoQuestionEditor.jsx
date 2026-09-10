import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { API_URL } from "../config";

const emptyForm = () => ({ text: "", explanation: "", options: ["", "", "", ""], correctIndex: 0 });
const formatTime = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

export default function TutorVideoQuestionEditor({ video, token, onClose }) {
  const player = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };
  const [questions, setQuestions] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [students, setStudents] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [reportTab, setReportTab] = useState("questions");
  const [locked, setLocked] = useState(false);
  const [timestampMs, setTimestampMs] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [questionResponse, analyticsResponse, studentResponse, answerResponse] = await Promise.all([
        axios.get(`${API_URL}/api/tutor/videos/${video.VideoId}/questions`, { headers }),
        axios.get(`${API_URL}/api/tutor/videos/${video.VideoId}/analytics/questions`, { headers }),
        axios.get(`${API_URL}/api/tutor/videos/${video.VideoId}/analytics/students`, { headers }),
        axios.get(`${API_URL}/api/tutor/videos/${video.VideoId}/analytics/answers`, { headers }),
      ]);
      const data = questionResponse.data;
      setQuestions(data.questions || []); setLocked(Boolean(data.locked));
      setAnalytics(analyticsResponse.data || []);
      setStudents(studentResponse.data || []);
      setAnswers(answerResponse.data || []);
    } catch (err) { setError(err.response?.data?.message || "โหลดคำถามไม่สำเร็จ"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [video.VideoId]);

  const captureTime = () => setTimestampMs(Math.round((player.current?.currentTime || 0) * 1000));
  const save = async () => {
    setSaving(true); setError("");
    try {
      await axios.post(`${API_URL}/api/tutor/videos/${video.VideoId}/questions`, { ...form, timestampMs }, { headers });
      setForm(emptyForm()); await load();
    } catch (err) { setError(err.response?.data?.message || "เพิ่มคำถามไม่สำเร็จ"); }
    finally { setSaving(false); }
  };
  const remove = async id => {
    if (!confirm("ลบคำถามนี้หรือไม่?")) return;
    try { await axios.delete(`${API_URL}/api/tutor/video-questions/${id}`, { headers }); await load(); }
    catch (err) { setError(err.response?.data?.message || "ลบคำถามไม่สำเร็จ"); }
  };
  const publish = async () => {
    if (!confirm("เผยแพร่แล้วนักเรียนจะพบคำถามระหว่างดูวิดีโอ ยืนยันหรือไม่?")) return;
    setSaving(true);
    try { await axios.post(`${API_URL}/api/tutor/videos/${video.VideoId}/questions/publish`, {}, { headers }); await load(); }
    catch (err) { setError(err.response?.data?.message || "เผยแพร่ไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
    <div className="mx-auto my-4 max-w-5xl rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between px-6 py-5 shadow-[0_1px_12px_rgba(15,23,42,0.06)]"><div><h2 className="text-xl font-bold text-neutral-900">จัดการคำถามระหว่างวิดีโอ</h2><p className="mt-1 text-sm text-neutral-500">กำหนดจุดคำถามและติดตามความเข้าใจของผู้เรียนในคลิป “{video.VideoTitle}”</p></div><button onClick={onClose} className="rounded-xl border-0 p-2 text-neutral-400 outline-none hover:bg-orange-50 hover:text-orange-500"><X /></button></div>
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <video ref={player} src={video.VideoUrl} controls className="aspect-video w-full rounded-xl bg-black" onTimeUpdate={captureTime} />
          <div className="mt-3 rounded-2xl bg-orange-50 p-4">
            <p className="text-sm font-bold text-orange-700">เลือกตำแหน่งบนวิดีโอเพื่อเพิ่มคำถาม</p>
            <p className="mt-1 text-xs text-orange-600">เลื่อนหรือเล่นวิดีโอไปยังช่วงที่ต้องการ ระบบจะวางคำถามไว้ที่เวลา <span className="font-bold">{formatTime(timestampMs)}</span></p>
          </div>
          {locked ? <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">วิดีโอนี้มีนักเรียนเริ่มดูแล้ว ชุดคำถามถูกล็อกและแก้ไขไม่ได้</div> : <div className="mt-4 space-y-3">
            <div><label className="mb-1 block text-xs font-bold text-neutral-600">คำถามที่ผู้เรียนจะเห็น</label><textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="พิมพ์คำถาม" className="w-full rounded-xl border-0 bg-neutral-50 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-200" rows={3} /></div>
            <div><label className="block text-xs font-bold text-neutral-600">ตัวเลือกคำตอบ</label><p className="mb-2 mt-1 text-xs text-neutral-400">เลือกวงกลมหน้าตัวเลือกที่เป็นเฉลยที่ถูกต้อง</p>{form.options.map((option, index) => <div key={index} className="mb-2 flex items-center gap-2"><input type="radio" checked={form.correctIndex === index} onChange={() => setForm({ ...form, correctIndex: index })} aria-label={`กำหนดตัวเลือก ${index + 1} เป็นเฉลยที่ถูกต้อง`} className="text-orange-500 focus:ring-orange-200" /><input value={option} onChange={e => { const options = [...form.options]; options[index] = e.target.value; setForm({ ...form, options }); }} placeholder={`ตัวเลือก ${index + 1}`} className="flex-1 rounded-xl border-0 bg-neutral-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200" /></div>)}</div>
            <div><label className="mb-1 block text-xs font-bold text-neutral-600">คำอธิบายหลังตอบ <span className="font-normal text-neutral-400">(ไม่บังคับ)</span></label><textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="อธิบายเพิ่มเติมว่าทำไมคำตอบนี้จึงถูก" className="w-full rounded-xl border-0 bg-neutral-50 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-200" rows={2} /></div>
            <button onClick={save} disabled={saving || !form.text.trim() || form.options.some(o => !o.trim())} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}เพิ่มเป็นฉบับร่าง</button>
          </div>}
        </div>
        <div><div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="font-bold text-neutral-900">ภาพรวมการตอบคำถาม</h3><p className="mt-1 text-xs leading-relaxed text-neutral-500">สรุปคำตอบครั้งแรกของผู้เรียน เพื่อช่วยหาจุดที่ยังไม่เข้าใจและนำไปปรับการสอน</p></div>{!locked && questions.some(q => q.status === "draft") && <button onClick={publish} disabled={saving} className="flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white"><Check className="h-4 w-4" />เผยแพร่</button>}</div>
          {analytics.length > 0 && <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm"><p className="text-lg font-bold text-blue-600">{analytics.reduce((sum, item) => sum + item.answeredCount, 0)}</p><p className="text-[11px] font-medium text-blue-600">จำนวนครั้งที่ส่งคำตอบ</p></div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm"><p className="text-lg font-bold text-emerald-600">{analytics.reduce((sum, item) => sum + item.correctCount, 0)}</p><p className="text-[11px] font-medium text-emerald-600">คำตอบที่ถูกต้อง</p></div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm"><p className="text-lg font-bold text-rose-600">{analytics.reduce((sum, item) => sum + item.incorrectCount, 0)}</p><p className="text-[11px] font-medium text-rose-600">คำตอบที่ควรทบทวน</p></div>
          </div>}
          <div className="mb-3 grid grid-cols-3 rounded-xl bg-neutral-100 p-1 text-xs font-bold">
            {[["questions", "วิเคราะห์รายคำถาม"], ["students", "ความเข้าใจผู้เรียน"], ["answers", "ประวัติการตอบ"]].map(([key, label]) => <button key={key} onClick={() => setReportTab(key)} className={`rounded-lg border-0 px-2 py-2 outline-none ${reportTab === key ? "bg-white text-orange-600 shadow-sm" : "text-neutral-500"}`}>{label}</button>)}
          </div>
          {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {loading ? <Loader2 className="mx-auto mt-10 animate-spin text-orange-500" /> : <div className="max-h-[55vh] space-y-2 overflow-y-auto">
            {reportTab === "questions" && <><p className="mb-2 text-xs text-neutral-500">เปรียบเทียบจำนวนผู้เรียนที่ดูมาถึงจุดคำถามกับผลการตอบ เพื่อหาช่วงเนื้อหาที่ควรอธิบายเพิ่มเติม</p>{questions.map(q => { const stats = analytics.find(item => String(item.questionId) === String(q.questionId)); return <div key={q.questionId} className="rounded-2xl bg-neutral-50 p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]"><div className="flex justify-between gap-3"><div className="min-w-0 flex-1"><span className={`mr-2 rounded px-2 py-0.5 text-[10px] font-bold ${q.status === "published" ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-600"}`}>{q.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</span><span className="text-xs text-orange-600">จุดคำถาม {formatTime(q.timestampMs)}</span><p className="mt-2 text-sm font-semibold">{q.text}</p>{q.status === "published" && <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px]"><span className="rounded-lg bg-blue-50 px-1 py-1.5 text-blue-700">ดูถึงจุดนี้ {stats?.reachedCount || 0}</span><span className="rounded-lg bg-violet-50 px-1 py-1.5 text-violet-700">ตอบแล้ว {stats?.answeredCount || 0}</span><span className="rounded-lg bg-green-50 px-1 py-1.5 text-green-700">ตอบถูก {stats?.correctCount || 0}</span><span className="rounded-lg bg-amber-50 px-1 py-1.5 text-amber-700">เข้าใจ {stats?.comprehensionRate || 0}%</span></div>}</div>{!locked && <button onClick={() => remove(q.questionId)} className="h-fit border-0 p-1 text-red-400 outline-none"><Trash2 className="h-4 w-4" /></button>}</div></div>; })}{!questions.length && <p className="py-10 text-center text-sm text-neutral-400">ยังไม่มีคำถาม</p>}</>}
            {reportTab === "students" && <><p className="mb-2 text-xs text-neutral-500">ติดตามความคืบหน้าและหัวข้อที่ผู้เรียนแต่ละคนควรกลับไปทบทวน</p>{students.map(student => <div key={student.userId} className="rounded-2xl bg-neutral-50 p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">{student.studentName}</p><p className="text-[10px] text-neutral-400">{student.nickname ? `ชื่อเล่น ${student.nickname} · ` : ""}รหัสผู้เรียน #{student.userId}</p></div><span className="text-xs font-bold text-orange-600">รับชมแล้ว {Math.round(student.watchPercent)}%</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]"><span className="rounded-lg bg-blue-50 py-1 text-blue-700">ทำแล้ว {student.answeredCount} ข้อ</span><span className="rounded-lg bg-green-50 py-1 text-green-700">เข้าใจถูก {student.correctCount} ข้อ</span><span className="rounded-lg bg-rose-50 py-1 text-rose-700">ควรทบทวน {student.incorrectCount} ข้อ</span></div></div>)}{!students.length && <p className="py-10 text-center text-sm text-neutral-400">ยังไม่มีผู้เรียนส่งคำตอบ</p>}</>}
            {reportTab === "answers" && <><p className="mb-2 text-xs text-neutral-500">ตรวจสอบคำตอบที่ผู้เรียนเลือก เทียบกับคำตอบที่ติวเตอร์กำหนด พร้อมวันและเวลาที่ส่ง</p>{answers.map(answer => <div key={answer.attemptId} className="rounded-2xl bg-neutral-50 p-4 text-xs shadow-[0_2px_10px_rgba(15,23,42,0.05)]"><div className="flex justify-between gap-2"><p className="font-bold">{answer.studentName}</p><span className={answer.isCorrect ? "text-green-600" : "text-rose-600"}>{answer.isCorrect ? "เข้าใจถูกต้อง" : "ควรทบทวนหัวข้อนี้"}</span></div><p className="mt-2 text-neutral-700">คำถาม: {answer.question}</p><p className="mt-1 text-neutral-500">คำตอบของผู้เรียน: <span className="font-semibold text-neutral-800">{answer.selectedAnswer}</span></p>{!answer.isCorrect && <p className="text-green-700">คำตอบที่กำหนดไว้: {answer.correctAnswer}</p>}<p className="mt-1 text-[10px] text-neutral-400">ส่งเมื่อ {answer.answeredAt ? new Date(answer.answeredAt).toLocaleString("th-TH") : ""}</p></div>)}{!answers.length && <p className="py-10 text-center text-sm text-neutral-400">ยังไม่มีประวัติคำตอบ</p>}</>}
          </div>}
        </div>
      </div>
    </div>
  </div>;
}
