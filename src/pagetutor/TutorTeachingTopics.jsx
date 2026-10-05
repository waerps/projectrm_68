import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowDown, ArrowUp, BookOpenText, Check, ChevronDown, Info, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { API_URL } from "../config";

const MAX_TOPICS = 30;
const MAX_TITLE_LENGTH = 200;

export default function TutorTeachingTopics({ courseId, subjectId, assignmentId, subjectName }) {
  const [topics, setTopics] = useState([]);
  const [savedTopics, setSavedTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const changed = JSON.stringify(topics) !== JSON.stringify(savedTopics);
  const requestData = useMemo(() => ({ courseId, subjectId, ...(assignmentId ? { assignmentId } : {}) }), [courseId, subjectId, assignmentId]);

  useEffect(() => {
    if (!courseId || !subjectId) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    setError("");
    const token = localStorage.getItem("student_token");
    axios.get(`${API_URL}/api/tutor-content/teaching-topics`, {
      params: requestData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(({ data }) => {
      if (!active) return;
      const loaded = (data.topics || []).map((topic) => ({ id: topic.id, title: topic.title }));
      setTopics(loaded);
      setSavedTopics(loaded);
      setLoadFailed(false);
    }).catch((err) => {
      if (active) {
        setLoadFailed(true);
        setError(err.response?.data?.message || "โหลดหัวข้อที่เตรียมสอนไม่สำเร็จ");
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, subjectId, requestData, reloadKey]);

  const updateAt = (index, title) => setTopics((items) => items.map((item, i) => i === index ? { ...item, title } : item));
  const move = (index, direction) => setTopics((items) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return items;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const save = async () => {
    if (topics.some((item) => !item.title.trim())) {
      setError("กรุณากรอกชื่อหัวข้อให้ครบ หรือลบรายการที่ว่าง");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("student_token");
      const cleaned = topics.map((item) => ({ id: item.id, title: item.title.trim() }));
      const response = await axios.put(`${API_URL}/api/tutor-content/teaching-topics`,
        { ...requestData, topics: cleaned },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const savedItems = response.data.topics.map(({ id, title }) => ({ id, title }));
      setTopics(savedItems);
      setSavedTopics(savedItems);
      setSaved(true);
      setEditing(false);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "บันทึกหัวข้อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setTopics([...savedTopics]);
    setError("");
    setEditing(false);
  };

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-[0_10px_30px_-18px_rgba(194,65,12,0.5)] transition-shadow duration-300 hover:shadow-[0_14px_34px_-18px_rgba(194,65,12,0.55)]">
      <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-orange-50 via-amber-50 to-white px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm"><BookOpenText className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">แผนหัวข้อการสอน</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">{subjectName || "วิชานี้"} · ภาพรวมเนื้อหาตลอดคอร์ส</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${savedTopics.length ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>{savedTopics.length ? `${savedTopics.length} หัวข้อ` : "ยังไม่ระบุ"}</span>
          {!loading && !loadFailed && !editing && <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md"><Pencil className="h-3.5 w-3.5" />{savedTopics.length ? "แก้ไขหัวข้อ" : "เริ่มเพิ่มหัวข้อ"}</button>}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3 sm:px-6">
        {loading ? <p className="text-sm text-slate-500">กำลังโหลดหัวข้อ…</p> : loadFailed ? <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm hover:bg-red-100">ลองโหลดใหม่</button>
        </div> : editing ? <>
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs leading-5 text-orange-800"><Info className="mt-0.5 h-4 w-4 shrink-0" />ระบุหัวข้อหลักพอสังเขป แอดมินจะเห็นรายการนี้ในภาพรวมคอร์ส</div>
          <ol className="max-h-80 space-y-2 overflow-y-auto pr-1.5 overscroll-contain">
            {topics.map((item, index) => <li key={item.id || index} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2 sm:items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-orange-600 shadow-sm">{index + 1}</span>
              <input
                value={item.title}
                onChange={(event) => updateAt(index, event.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                placeholder={`หัวข้อที่ ${index + 1}`}
                aria-label={`หัวข้อที่ ${index + 1}`}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`ย้ายหัวข้อที่ ${index + 1} ขึ้น`} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-orange-600 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === topics.length - 1} aria-label={`ย้ายหัวข้อที่ ${index + 1} ลง`} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-orange-600 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => setTopics((items) => items.filter((_, i) => i !== index))} aria-label={`ลบหัวข้อที่ ${index + 1}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>)}
          </ol>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => setTopics((items) => [...items, { id: null, title: "" }])} disabled={topics.length >= MAX_TOPICS || saving} className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-40"><Plus className="h-4 w-4" /> เพิ่มหัวข้อ</button>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs ${changed ? "font-semibold text-amber-700" : "text-slate-500"}`}>{changed ? "● ยังไม่บันทึก" : `${topics.length}/${MAX_TOPICS} หัวข้อ`}</span>
              <button type="button" onClick={cancelEdit} disabled={saving} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X className="h-4 w-4" /> ยกเลิก</button>
              <button type="button" onClick={save} disabled={!changed || saving} className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved && !changed ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saving ? "กำลังบันทึก" : "บันทึกหัวข้อ"}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        </> : savedTopics.length ? <>
          <ol className={`space-y-1.5 ${showAll ? "max-h-64 overflow-y-auto overscroll-contain pr-1" : ""}`}>
            {(showAll ? savedTopics : savedTopics.slice(0, 3)).map((item, index) => <li key={item.id || index} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-orange-50/60">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-600">{index + 1}</span><span className="min-w-0 break-words leading-6">{item.title}</span>
            </li>)}
          </ol>
          {savedTopics.length > 3 && <button type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)} className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-50">
            {showAll ? "ย่อรายการ" : `ดูทั้งหมดอีก ${savedTopics.length - 3} หัวข้อ`}<ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`} />
          </button>}
          {saved && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Check className="h-3.5 w-3.5" />บันทึกแล้ว</span>}
        </> : <p className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-3 text-sm text-slate-600">ยังไม่มีหัวข้อที่เตรียมสอน กด “เริ่มเพิ่มหัวข้อ” เพื่อวางภาพรวมของคอร์ส</p>}
      </div>
    </section>
  );
}
