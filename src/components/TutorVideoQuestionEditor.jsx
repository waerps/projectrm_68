import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Check, Loader2, Pencil, Plus, Trash2, FileQuestion, BarChart2, Clock, Lock } from "lucide-react";
import { API_URL } from "../config";
import { confirmDialog } from "./ui/dialogs";

import { PAGE_TITLE } from "./ui/tokens";
import SegmentedControl from "./ui/SegmentedControl";
import TutorVideoReplayReport from "./TutorVideoReplayReport";

const emptyForm = () => ({ text: "", explanation: "", options: ["", "", "", ""], correctIndex: 0 });
const formatTime = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

export default function TutorVideoQuestionEditor({ video, token }) {
  const player = useRef(null);
  const editForm = useRef(null);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [questions, setQuestions] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [students, setStudents] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [pageTab, setPageTab] = useState("questions");
  const [reportTab, setReportTab] = useState("questions");
  const [editingId, setEditingId] = useState(null);
  const [replay, setReplay] = useState(null);
  const [reportErrors, setReportErrors] = useState({});
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [timestampMs, setTimestampMs] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setReady(false); setError(""); setReportErrors({});
    const base = `${API_URL}/api/tutor/videos/${video.VideoId}`;
    const results = await Promise.allSettled([
      axios.get(base + "/questions", { headers, timeout: 15000 }),
      ...["questions", "students", "answers", "replay"].map(name => axios.get(base + "/analytics/" + name, { headers, timeout: 15000 })),
    ]);
    const questionResult = results[0];
    if (questionResult.status === "fulfilled") {
      setQuestions(questionResult.value.data.questions || []);
      setLocked(Boolean(questionResult.value.data.locked)); setReady(true);
    } else { setError(questionResult.reason.response?.data?.message || "โหลดคำถามไม่สำเร็จ"); }
    const setters = [setAnalytics, setStudents, setAnswers, setReplay];
    const names = ["questions", "students", "answers", "replay"];
    const failures = {};
    results.slice(1).forEach((result, index) => {
      if (result.status === "fulfilled") setters[index](result.value.data);
      else { setters[index](index === 3 ? null : []); failures[names[index]] = result.reason.response?.data?.message || "โหลดสถิติไม่สำเร็จ"; }
    });
    setReportErrors(failures); setLoading(false);
  }, [video.VideoId, headers]);
  useEffect(() => { load(); }, [load]);

  const beginEdit = question => {
    setEditingId(question.questionId); setTimestampMs(Number(question.timestampMs));
    setForm({ text: question.text, explanation: question.explanation || "", options: question.options.map(option => option.text), correctIndex: Math.max(0, question.options.findIndex(option => option.isCorrect)) });
    if (player.current) player.current.currentTime = question.timestampMs / 1000;
    setError("");
    editForm.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const cancelEdit = () => { setEditingId(null); setForm(emptyForm()); };
  const mutationError = (err, fallback) => {
    if (err.response?.data?.code === "QUESTIONS_LOCKED" || (err.response?.status === 409 && /ล็อก|นักเรียนเริ่มดู/.test(err.response?.data?.message || ""))) { setLocked(true); cancelEdit(); }
    setError(err.response?.data?.message || fallback);
  };
  const activeReportTab = pageTab === "questions" ? "questions" : reportTab;
  const captureTime = () => setTimestampMs(Math.round((player.current?.currentTime || 0) * 1000));
  const save = async () => {
    setSaving(true); setError("");
    try {
      if (editingId) await axios.put(`${API_URL}/api/tutor/video-questions/${editingId}`, { ...form, timestampMs }, { headers });
      else await axios.post(`${API_URL}/api/tutor/videos/${video.VideoId}/questions`, { ...form, timestampMs }, { headers });
      cancelEdit(); await load();
    } catch (err) { mutationError(err, "บันทึกคำถามไม่สำเร็จ"); }
    finally { setSaving(false); }
  };
  const remove = async id => {
    if (!await confirmDialog("ลบคำถามนี้หรือไม่?")) return;
    setSaving(true);
    try { await axios.delete(`${API_URL}/api/tutor/video-questions/${id}`, { headers }); if (editingId === id) cancelEdit(); await load(); }
    catch (err) { mutationError(err, "ลบคำถามไม่สำเร็จ"); }
    finally { setSaving(false); }
  };
  const publish = async () => {
    if (!await confirmDialog("เผยแพร่แล้วนักเรียนจะพบคำถามระหว่างดูวิดีโอ ยืนยันหรือไม่?")) return;
    setSaving(true);
    try { await axios.post(`${API_URL}/api/tutor/videos/${video.VideoId}/questions/publish`, {}, { headers }); await load(); }
    catch (err) { mutationError(err, "เผยแพร่ไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">คำถามระหว่างวิดีโอ</span>{ready && <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold " + (locked ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700")}>{locked && <Lock size={12} />}{locked ? "ล็อกชุดคำถามแล้ว" : "แก้ไขได้"}</span>}</div>
          <h1 className={PAGE_TITLE + " break-words"}>{video.VideoTitle}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{[video.CourseName, video.SubjectName].filter(Boolean).join(" • ")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600"><span className="inline-flex items-center gap-2"><FileQuestion className="h-4 w-4 text-slate-400" />{ready ? questions.length : "—"} ข้อ</span>{Number(video.Duration) > 0 && <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" />ความยาว {formatTime(Number(video.Duration) * 1000)}</span>}</div>
      </div>
    </div>
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="จัดการวิดีโอ">
      {[{id:"questions",label:"จัดการคำถาม",icon:FileQuestion},{id:"analytics",label:"ผลตอบ / สถิติ",icon:BarChart2}].map(item => { const Icon = item.icon; return <button key={item.id} type="button" role="tab" id={`video-tab-${item.id}`} aria-controls="video-tabpanel" aria-selected={pageTab === item.id} onClick={() => { player.current?.pause(); setPageTab(item.id); }} className={"flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition " + (pageTab === item.id ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700")}><Icon size={16} />{item.label}</button>; })}
    </div>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div role="tabpanel" id="video-tabpanel" aria-labelledby={`video-tab-${pageTab}`} className={"grid items-start gap-6 " + (pageTab === "questions" || reportTab === "replay" ? "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : "")}>
      <div className={pageTab === "questions" || reportTab === "replay" ? "min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" : "hidden"}>
          <video ref={player} src={video.VideoUrl} controls className="aspect-video w-full rounded-xl bg-black"  />
          {pageTab === "questions" && <><div className="mt-3 rounded-2xl bg-orange-50 p-4">
            <p className="text-sm font-bold text-orange-700">เลือกตำแหน่งบนวิดีโอเพื่อเพิ่มคำถาม</p>
            <p className="mt-1 text-xs text-orange-600">เลื่อนวิดีโอแล้วกดใช้เวลาปัจจุบัน หรือกรอกเวลาเป็นวินาที จุดคำถาม <span className="font-bold">{formatTime(timestampMs)}</span></p>
          </div>
          {!ready ? <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{loading ? "กำลังโหลดคำถาม" : "โหลดคำถามไม่สำเร็จ"}<button onClick={load} disabled={loading} className="ml-2 underline">ลองอีกครั้ง</button></div> : locked ? <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">วิดีโอนี้มีนักเรียนเริ่มดูแล้ว ชุดคำถามถูกล็อกและแก้ไขไม่ได้</div> : <fieldset ref={editForm} disabled={saving || loading} className="mt-4 min-w-0 space-y-3">
            <div className="flex flex-wrap items-end gap-2"><label className="text-xs font-bold text-slate-600">เวลาคำถาม (วินาที)<input type="number" min="0" step="0.001" value={timestampMs / 1000} onChange={e => setTimestampMs(Math.round(Number(e.target.value) * 1000))} className="mt-1 block w-36 rounded-xl bg-slate-50 p-3 text-sm" /></label><button type="button" onClick={captureTime} className="rounded-xl bg-orange-50 p-3 text-xs font-bold text-orange-600">ใช้เวลาปัจจุบัน</button></div>
            {editingId && <p className="text-sm font-bold text-orange-600">กำลังแก้ไขคำถาม · {formatTime(timestampMs)}</p>}
            <div><label className="mb-1 block text-xs font-bold text-slate-600">คำถามที่ผู้เรียนจะเห็น</label><textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="พิมพ์คำถาม" className="w-full rounded-xl border-0 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" rows={3} /></div>
            <div><label className="block text-xs font-bold text-slate-600">ตัวเลือกคำตอบ</label><p className="mb-2 mt-1 text-xs text-slate-500">เลือกวงกลมหน้าตัวเลือกที่เป็นเฉลยที่ถูกต้อง</p>{form.options.map((option, index) => <div key={index} className="mb-2 flex items-center gap-2"><input type="radio" checked={form.correctIndex === index} onChange={() => setForm({ ...form, correctIndex: index })} aria-label={`กำหนดตัวเลือก ${index + 1} เป็นเฉลยที่ถูกต้อง`} className="text-orange-500 focus:ring-orange-400" /><input value={option} onChange={e => { const options = [...form.options]; options[index] = e.target.value; setForm({ ...form, options }); }} placeholder={`ตัวเลือก ${index + 1}`} className="min-w-0 flex-1 rounded-xl border-0 bg-slate-50 px-3 h-10 text-sm outline-none focus:ring-2 focus:ring-orange-400" /></div>)}</div>
            <div><label className="mb-1 block text-xs font-bold text-slate-600">คำอธิบายหลังตอบ <span className="font-normal text-slate-400">(ไม่บังคับ)</span></label><textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="อธิบายเพิ่มเติมว่าทำไมคำตอบนี้จึงถูก" className="w-full rounded-xl border-0 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" rows={2} /></div>
            <button onClick={save} disabled={saving || loading || !Number.isFinite(timestampMs) || timestampMs < 0 || !form.text.trim() || form.options.some(o => !o.trim())} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}{editingId ? "บันทึกการแก้ไข" : "เพิ่มเป็นฉบับร่าง"}</button>
            {editingId && <button type="button" onClick={cancelEdit} className="w-full py-2 text-sm text-slate-500">ยกเลิกการแก้ไข</button>}
          </fieldset>}</>}
        </div>
        <div className="min-w-0"><div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">{pageTab === "questions" ? "คำถามในวิดีโอนี้" : "ภาพรวมการตอบคำถาม"}</h2><p className="mt-1 text-sm leading-relaxed text-slate-500">{pageTab === "questions" ? "เพิ่มคำถามจากวิดีโอด้านซ้าย แล้วเผยแพร่ให้นักเรียนตอบระหว่างรับชม" : "สรุปคำตอบครั้งแรกของผู้เรียน เพื่อช่วยปรับการสอน"}</p></div>{pageTab === "questions" && ready && !loading && !locked && questions.some(q => q.status === "draft") && <button onClick={publish} disabled={saving || Boolean(editingId)} className="flex shrink-0 items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white"><Check className="h-4 w-4" />เผยแพร่</button>}</div>
          {pageTab === "analytics" && analytics.length > 0 && <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm"><p className="text-lg font-bold text-blue-600">{analytics.reduce((sum, item) => sum + item.answeredCount, 0)}</p><p className="text-[11px] font-medium text-blue-600">จำนวนครั้งที่ส่งคำตอบ</p></div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm"><p className="text-lg font-bold text-emerald-600">{analytics.reduce((sum, item) => sum + item.correctCount, 0)}</p><p className="text-[11px] font-medium text-emerald-600">คำตอบที่ถูกต้อง</p></div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm"><p className="text-lg font-bold text-rose-600">{analytics.reduce((sum, item) => sum + item.incorrectCount, 0)}</p><p className="text-[11px] font-medium text-rose-600">คำตอบที่ควรทบทวน</p></div>
          </div>}
          {pageTab === "analytics" && <SegmentedControl className="mb-3" size="sm" fullWidth value={reportTab} onChange={setReportTab} options={[{id:"questions",label:"รายคำถาม"},{id:"students",label:"ผู้เรียน"},{id:"answers",label:"คำตอบ"},{id:"replay",label:"การดูซ้ำ"}]} />}
          {pageTab === "analytics" && reportErrors[reportTab] && <div role="alert" className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{reportErrors[reportTab]}<button onClick={load} className="ml-2 underline">ลองอีกครั้ง</button></div>}

          {loading ? <Loader2 className="mx-auto mt-10 animate-spin text-orange-500" /> : <div className="space-y-3">
            {activeReportTab === "questions" && <>{pageTab === "analytics" && <p className="mb-2 text-xs text-slate-500">เปรียบเทียบจำนวนผู้เรียนที่ดูมาถึงจุดคำถามกับผลการตอบ เพื่อหาช่วงเนื้อหาที่ควรอธิบายเพิ่มเติม</p>}{questions.map(q => { const stats = analytics.find(item => String(item.questionId) === String(q.questionId)); return <div key={q.questionId} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex justify-between gap-3"><div className="min-w-0 flex-1"><span className={`mr-2 rounded px-2 py-0.5 text-[11px] font-bold ${q.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{q.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</span><span className="text-xs text-orange-600">จุดคำถาม {formatTime(q.timestampMs)}</span><p className="mt-2 text-sm font-semibold">{q.text}</p>{pageTab === "analytics" && q.status === "published" && !reportErrors.questions && <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1 text-center text-[11px]"><span className="rounded-lg bg-blue-50 px-1 py-1.5 text-blue-700">ดูถึงจุดนี้ {stats?.reachedCount || 0}</span><span className="rounded-lg bg-violet-50 px-1 py-1.5 text-violet-700">ตอบแล้ว {stats?.answeredCount || 0}</span><span className="rounded-lg bg-green-50 px-1 py-1.5 text-green-700">ตอบถูก {stats?.correctCount || 0}</span><span className="rounded-lg bg-amber-50 px-1 py-1.5 text-amber-700">เข้าใจ {stats?.comprehensionRate || 0}%</span></div>}</div>{pageTab === "questions" && ready && !locked && <><button disabled={saving || loading} aria-label="แก้ไขคำถาม" onClick={() => beginEdit(q)} className="h-fit p-2 text-orange-600"><Pencil className="h-4 w-4" /></button><button disabled={saving || loading} aria-label="ลบ" onClick={() => remove(q.questionId)} className="h-fit border-0 p-1 text-red-400 outline-none min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center"><Trash2 className="h-4 w-4" /></button></>}</div></div>; })}{!questions.length && <p className="py-10 text-center text-sm text-slate-500">ยังไม่มีคำถาม</p>}</>}
            {activeReportTab === "replay" && !reportErrors.replay && <TutorVideoReplayReport data={replay} onSeek={seconds => { if (player.current) player.current.currentTime = seconds; }} />}
            {activeReportTab === "students" && !reportErrors.students && <><p className="mb-2 text-xs text-slate-500">ติดตามความคืบหน้าและหัวข้อที่ผู้เรียนแต่ละคนควรกลับไปทบทวน</p>{students.map(student => <div key={student.userId} className="rounded-2xl bg-slate-50 p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold">{student.studentName}</p><p className="text-[11px] text-slate-500">{student.nickname ? `ชื่อเล่น ${student.nickname} · ` : ""}รหัสผู้เรียน #{student.userId}</p></div><span className="text-xs font-bold text-orange-600">รับชมแล้ว {Math.round(student.watchPercent)}%</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]"><span className="rounded-lg bg-blue-50 py-1 text-blue-700">ทำแล้ว {student.answeredCount} ข้อ</span><span className="rounded-lg bg-green-50 py-1 text-green-700">เข้าใจถูก {student.correctCount} ข้อ</span><span className="rounded-lg bg-rose-50 py-1 text-rose-700">ควรทบทวน {student.incorrectCount} ข้อ</span></div></div>)}{!students.length && <p className="py-10 text-center text-sm text-slate-500">ยังไม่มีผู้เรียนส่งคำตอบ</p>}</>}
            {activeReportTab === "answers" && !reportErrors.answers && <><p className="mb-2 text-xs text-slate-500">ตรวจสอบคำตอบที่ผู้เรียนเลือก เทียบกับคำตอบที่ติวเตอร์กำหนด พร้อมวันและเวลาที่ส่ง</p>{answers.map(answer => <div key={answer.attemptId} className="rounded-2xl bg-slate-50 p-4 text-xs shadow-[0_2px_10px_rgba(15,23,42,0.05)]"><div className="flex justify-between gap-2"><p className="font-bold">{answer.studentName}</p><span className={answer.isCorrect ? "text-green-600" : "text-rose-600"}>{answer.isCorrect ? "เข้าใจถูกต้อง" : "ควรทบทวนหัวข้อนี้"}</span></div><p className="mt-2 text-slate-700">คำถาม: {answer.question}</p><p className="mt-1 text-slate-500">คำตอบของผู้เรียน: <span className="font-semibold text-slate-800">{answer.selectedAnswer}</span></p>{!answer.isCorrect && <p className="text-green-700">คำตอบที่กำหนดไว้: {answer.correctAnswer}</p>}<p className="mt-1 text-[11px] text-slate-500">ส่งเมื่อ {answer.answeredAt ? new Date(answer.answeredAt).toLocaleString("th-TH") : ""}</p></div>)}{!answers.length && <p className="py-10 text-center text-sm text-slate-500">ยังไม่มีประวัติคำตอบ</p>}</>}
          </div>}
        </div>
    </div>
  </div>;
}
