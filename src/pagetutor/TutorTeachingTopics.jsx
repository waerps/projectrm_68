import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowDown, ArrowUp, BookOpenText, Check, Loader2, Plus, Save, Trash2 } from "lucide-react";
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
      const names = (data.topics || []).map((topic) => topic.title);
      setTopics(names);
      setSavedTopics(names);
      setLoadFailed(false);
    }).catch((err) => {
      if (active) {
        setLoadFailed(true);
        setError(err.response?.data?.message || "โหลดหัวข้อที่เตรียมสอนไม่สำเร็จ");
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, subjectId, requestData, reloadKey]);

  const updateAt = (index, title) => setTopics((items) => items.map((item, i) => i === index ? title : item));
  const move = (index, direction) => setTopics((items) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return items;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const save = async () => {
    if (topics.some((title) => !title.trim())) {
      setError("กรุณากรอกชื่อหัวข้อให้ครบ หรือลบรายการที่ว่าง");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("student_token");
      const cleaned = topics.map((title) => title.trim());
      await axios.put(`${API_URL}/api/tutor-content/teaching-topics`,
        { ...requestData, topics: cleaned },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setTopics(cleaned);
      setSavedTopics(cleaned);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "บันทึกหัวข้อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-[0_10px_30px_-18px_rgba(194,65,12,0.5)]">
      <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-orange-50 via-amber-50 to-white px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm"><BookOpenText className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">หัวข้อที่เตรียมสอนทั้งคอร์ส</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">{subjectName || "วิชานี้"} · ระบุหัวข้อหลักพอสังเขปเพื่อให้แอดมินเห็นภาพรวม ไม่ใช่แผนรายคาบ</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${topics.length ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
          {topics.length ? `${topics.length} หัวข้อ` : "ยังไม่ระบุ"}
        </span>
      </div>

      <div className="px-4 pb-5 pt-4 sm:px-6">
        {loading ? <p className="text-sm text-slate-500">กำลังโหลดหัวข้อ…</p> : loadFailed ? <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm hover:bg-red-100">ลองโหลดใหม่</button>
        </div> : <>
          {topics.length === 0 && <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-slate-700">เริ่มวางหัวข้อที่ตั้งใจจะสอน</p>
            <p className="mt-1 text-xs text-slate-500">เช่น เศษส่วน → ทศนิยม → ร้อยละ · เพิ่มหรือลดลำดับได้ภายหลัง</p>
          </div>}
          <ol className="space-y-2">
            {topics.map((title, index) => <li key={index} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2 sm:items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-orange-600 shadow-sm">{index + 1}</span>
              <input
                value={title}
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setTopics((items) => [...items, ""])} disabled={topics.length >= MAX_TOPICS || saving} className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-40"><Plus className="h-4 w-4" /> เพิ่มหัวข้อ</button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{changed ? "มีการเปลี่ยนแปลงที่ยังไม่บันทึก" : saved ? "บันทึกแล้ว" : "แก้ไขได้ตลอดคอร์ส"}</span>
              <button type="button" onClick={save} disabled={!changed || saving} className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved && !changed ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saving ? "กำลังบันทึก" : "บันทึกหัวข้อ"}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        </>}
      </div>
    </section>
  );
}
