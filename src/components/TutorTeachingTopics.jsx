import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { ArrowDown, ArrowUp, Calendar, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { API_URL } from "../config";

const sessionLabel = session => `${new Date(session.startsAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" })} · ${session.startTime}–${session.endTime}${session.room ? ` · ${session.room}` : ""}`;
const keyed = topics => topics.map(topic => ({ ...topic, key: `saved-${topic.id}` }));

export default function TutorTeachingTopics({ courseId, subjectId, token, assignmentId }) {
  const [plan, setPlan] = useState({ topics: [], sessions: [] });
  const [draft, setDraft] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError(""); setEditing(false);
    try {
      const { data } = await axios.get(`${API_URL}/api/tutor-content/teaching-plan`, { params: { courseId, subjectId, ...(assignmentId ? { assignmentId } : {}) }, headers: { Authorization: `Bearer ${token}` } });
      setPlan(data); setDraft(keyed(data.topics));
    } catch (err) { setError(err.response?.data?.message || "โหลดแผนการสอนไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, [courseId, subjectId, token, assignmentId]);
  useEffect(() => { load(); }, [load]);
  const change = (key, patch) => setDraft(items => items.map(item => item.key === key ? { ...item, ...patch } : item));
  const move = (index, delta) => setDraft(items => { const next = [...items]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; });
  const save = async () => {
    setSaving(true); setError("");
    try {
      const { data } = await axios.put(`${API_URL}/api/tutor-content/teaching-plan`, { courseId, subjectId, assignmentId: plan.assignmentId, topics: draft.map(({ id, title, scheduleIds }) => ({ id, title, scheduleIds })) }, { headers: { Authorization: `Bearer ${token}` } });
      setPlan(data); setDraft(keyed(data.topics)); setEditing(false);
    } catch (err) { setError(err.response?.data?.message || "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง"); }
    finally { setSaving(false); }
  };
  return <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold text-slate-800">แผนหัวข้อการสอน</h2><p className="mt-1 text-sm text-slate-500">เรียงหัวข้อที่ต้องสอนและเลือกคาบที่จะใช้สอนแต่ละหัวข้อ</p></div>
      {!editing && !loading && plan.assignmentId && <button type="button" onClick={() => { setDraft(keyed(plan.topics)); setEditing(true); setError(""); }} className="inline-flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600"><Pencil size={16} />แก้ไขหัวข้อ</button>}
    </div>
    {error && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}{!editing && <button type="button" onClick={load} className="ml-3 underline">ลองอีกครั้ง</button>}</div>}
    {loading ? <Loader2 className="mx-auto my-8 animate-spin text-orange-500" /> : <>
      <fieldset disabled={saving} className="mt-4 min-w-0 space-y-3">
        {(editing ? draft : plan.topics).map((topic, index) => <div key={topic.key || topic.id} className="rounded-xl bg-slate-50 p-3 sm:p-4">
          <div className="flex items-start gap-3"><span className="mt-2 text-sm font-bold text-orange-600">{index + 1}.</span>
            {editing ? <input aria-label={`หัวข้อที่ ${index + 1}`} value={topic.title} maxLength={200} onChange={e => change(topic.key, { title: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="ชื่อหัวข้อการสอน" /> : <p className="flex-1 py-2 font-semibold text-slate-800">{topic.title}</p>}
            {editing && <div className="flex shrink-0 gap-1"><button type="button" aria-label={`เลื่อนหัวข้อ ${index + 1} ขึ้น`} disabled={index === 0} onClick={() => move(index, -1)} className="p-2 disabled:opacity-30"><ArrowUp size={16} /></button><button type="button" aria-label={`เลื่อนหัวข้อ ${index + 1} ลง`} disabled={index === draft.length - 1} onClick={() => move(index, 1)} className="p-2 disabled:opacity-30"><ArrowDown size={16} /></button><button type="button" aria-label={`ลบหัวข้อ ${index + 1}`} onClick={() => setDraft(items => items.filter(item => item.key !== topic.key))} className="p-2 text-red-500"><Trash2 size={16} /></button></div>}
          </div>
          {editing ? <details className="mt-2 ml-6 text-sm"><summary className="cursor-pointer font-medium text-slate-600">เลือกคาบสอน · เลือกแล้ว {topic.scheduleIds.length} คาบ</summary><div className="mt-2 max-h-52 space-y-2 overflow-y-auto">{plan.sessions.map(session => <label key={session.id} className="flex items-start gap-2 rounded-lg bg-white p-2"><input type="checkbox" className="mt-1" checked={topic.scheduleIds.includes(session.id)} onChange={e => change(topic.key, { scheduleIds: e.target.checked ? [...topic.scheduleIds, session.id] : topic.scheduleIds.filter(id => id !== session.id) })} /><span>{sessionLabel(session)}</span></label>)}{!plan.sessions.length && <p className="text-slate-500">ยังไม่มีคาบในตารางของวิชานี้ เพิ่มหัวข้อไว้ก่อนได้</p>}</div></details> : <div className="ml-6 space-y-1 text-xs text-slate-500">{topic.scheduleIds.length ? topic.scheduleIds.map(id => { const session = plan.sessions.find(row => row.id === id); return session && <p key={id} className="flex items-center gap-2"><Calendar size={13} />{sessionLabel(session)}</p>; }) : <p>ยังไม่ได้ผูกกับคาบ</p>}</div>}
        </div>)}
        {!draft.length && editing && <p className="py-4 text-sm text-slate-500">เพิ่มหัวข้อแรกเพื่อเริ่มวางแผน</p>}
        {!plan.topics.length && !editing && !error && <p className="py-6 text-center text-sm text-slate-500">ยังไม่มีแผนหัวข้อการสอน กดแก้ไขหัวข้อเพื่อเริ่มต้น</p>}
        {editing && <><button type="button" disabled={draft.length >= 30} onClick={() => setDraft(items => [...items, { key: crypto.randomUUID(), id: null, title: "", scheduleIds: [] }])} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-orange-600 disabled:opacity-40"><Plus size={16} />เพิ่มหัวข้อ ({draft.length}/30)</button><div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={() => { setEditing(false); setError(""); }} className="rounded-xl px-4 py-2 text-sm text-slate-600">ยกเลิก</button><button type="button" onClick={save} disabled={draft.some(topic => !topic.title.trim())} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{saving && <Loader2 size={16} className="animate-spin" />}บันทึกแผนการสอน</button></div></>}
      </fieldset>
    </>}
  </section>;
}
