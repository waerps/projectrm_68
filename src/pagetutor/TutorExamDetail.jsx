import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

import {
  ChevronRight, ChevronLeft, FileQuestion, Clock, Calendar, Users,
  Plus, Pencil, Upload, Zap, Check, X, AlertCircle, Info, Trash2,
  Download, FileSpreadsheet, Play, StopCircle,
  Settings as SettingsIcon, Eye, BarChart2, Search, Award, CheckCircle,
  Tags, Merge, UserX, Flag,
} from "lucide-react";

import {
  EXAM_TYPES, TYPE_BADGE, STATUS_BADGE, LEVEL_BADGE, LEVEL_COLOR,
  deriveStatus, isExamReady, formatTime,
  downloadXlsxTemplate, parseXlsx, emptyQuestion,
  fetchExamDetail, updateExamSettings, addQuestions, updateQuestion, deleteQuestion,
  bulkUpdateQuestionScores,
  openExamSession, closeExamSession, fetchExamResults, fetchExamJoinDetail,
  fetchSubjectCategories, renameSubjectCategory,
} from "../utils/examShared";
import { EXAM_SCORE_CAP, splitScoreEvenly, sumScores, fmtScore } from "../utils/examScore";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";

// เกณฑ์ผ่าน — อ้างอิง logic เดียวกับ TutorExamAnalytics.jsx (PASS_PCT = 60)
const PASS_PCT = 60;

// ─── small shared bits ───────────────────────────────────────────────────────

function Badge({ className, children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

// StatCard สไตล์เดียวกับ TutorExamAnalytics.jsx (ไอคอนสี่เหลี่ยมทึบ + label/value/sub)
// onClick เป็น optional — ใส่มาแล้วการ์ดจะกดได้ (เช่น การ์ด "ขาดสอบ" ที่กดดูรายชื่อได้)
function StatCard({ icon: Icon, label, value, sub, color = "bg-orange-500", onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`flex items-center gap-3 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm h-full w-full text-left ${onClick ? "cursor-pointer hover:border-orange-200 hover:shadow-md transition" : ""}`}
    >
      <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-500 font-medium">{label}</p>
        <p className="text-xl font-black text-neutral-900">{value}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </Wrapper>
  );
}

const TABS = [
  { key: "questions", label: "ข้อสอบ", icon: FileQuestion },
  { key: "preview", label: "ดูตัวอย่างข้อสอบ", icon: Eye },
  { key: "manage", label: "ตั้งค่า / เปิดสอบ", icon: SettingsIcon },
  { key: "results", label: "ผลสอบ / สถิติ", icon: BarChart2 },
];

const OPTION_LABELS = ["A", "B", "C", "D"];

// ─── Questions Tab ───────────────────────────────────────────────────────────

function AddMethodPicker({ onPick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="relative border-2 border-neutral-200 rounded-xl p-4 opacity-50 bg-neutral-50 cursor-not-allowed select-none">
        <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center mb-2"><Zap className="h-4 w-4 text-amber-600" /></div>
        <p className="text-sm font-semibold text-neutral-700">สุ่มจากคลังข้อสอบกลาง</p>
        <p className="text-xs text-neutral-500 mt-0.5">ระบบสุ่มข้ออัตโนมัติ</p>
        <span className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">เร็วๆ นี้</span>
      </div>

      <button onClick={() => onPick("manual")} className="text-left border-2 border-neutral-200 hover:border-orange-300 rounded-xl p-4 transition">
        <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center mb-2"><Pencil className="h-4 w-4 text-orange-600" /></div>
        <p className="text-sm font-semibold text-neutral-800">พิมพ์ข้อสอบเอง</p>
        <p className="text-xs text-neutral-500 mt-0.5">เพิ่มทีละข้อผ่าน editor</p>
      </button>

      <button onClick={() => onPick("excel")} className="text-left border-2 border-neutral-200 hover:border-orange-300 rounded-xl p-4 transition">
        <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center mb-2"><Upload className="h-4 w-4 text-orange-600" /></div>
        <p className="text-sm font-semibold text-neutral-800">Import จาก Excel</p>
        <p className="text-xs text-neutral-500 mt-0.5">นำเข้าได้ครั้งละหลายข้อ</p>
      </button>
    </div>
  );
}

// ─── Manage Categories Modal ─────────────────────────────────────────────────
// รวม/เปลี่ยนชื่อหมวดย้อนหลัง — สำหรับซ่อมกรณีพิมพ์ผิด/พิมพ์ไม่ตรงกันระหว่างรอบสอบ
// cascade อัปเดตทุก exam (Pre/Mid/Post) ของวิชานี้ในครั้งเดียว
function ManageCategoriesModal({ subjectId, adminId, onClose, onChanged }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renamingFrom, setRenamingFrom] = useState(null);
  const [renameTo, setRenameTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = () => {
    setLoading(true);
    fetchSubjectCategories({ subjectId, adminId })
      .then(setCategories)
      .catch((err) => { console.error("Fetch categories failed:", err); setError("โหลดรายชื่อหมวดไม่สำเร็จ"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [subjectId, adminId]);

  const startRename = (cat) => { setRenamingFrom(cat); setRenameTo(cat); setSaveError(""); };

  const confirmRename = async () => {
    if (!renameTo.trim() || renameTo.trim() === renamingFrom) { setRenamingFrom(null); return; }
    setSaving(true);
    setSaveError("");
    try {
      await renameSubjectCategory({ subjectId, adminId, from: renamingFrom, to: renameTo.trim() });
      setRenamingFrom(null);
      load();
      await onChanged(); // reload exam detail ที่หน้าหลัก เพื่อให้ตาราง Questions อัปเดตชื่อหมวดใหม่ด้วย
    } catch (err) {
      console.error("Rename category failed:", err);
      setSaveError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <p className="text-sm font-semibold text-neutral-800 flex items-center gap-2"><Tags className="h-4 w-4 text-orange-500" /> จัดการหมวดหมู่ (Category)</p>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              รวม 2 หมวดที่จริงๆ เป็นเรื่องเดียวกันแต่พิมพ์ไม่ตรงกัน (เช่น "พีชคณิต" กับ "พีชคณิค") — การกด "เปลี่ยนชื่อ" จะอัปเดตทุกข้อในวิชานี้ ทุกรอบสอบ (Pre/Mid/Post) ทันที
            </p>
          </div>

          {loading && <p className="text-sm text-neutral-400 text-center py-6">กำลังโหลด...</p>}
          {error && <p className="text-sm text-red-500 text-center py-6">{error}</p>}

          {!loading && !error && categories.length === 0 && (
            <p className="text-sm text-neutral-400 text-center py-6">ยังไม่มีหมวดหมู่ในวิชานี้</p>
          )}

          {!loading && !error && categories.length > 0 && (
            <div className="border border-neutral-100 rounded-xl divide-y divide-neutral-50 overflow-hidden">
              {categories.map((c) => (
                <div key={c.category} className="px-4 py-3">
                  {renamingFrom === c.category ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={renameTo}
                        onChange={(e) => setRenameTo(e.target.value)}
                        list="category-options-manage"
                        className="flex-1 border border-orange-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                      <datalist id="category-options-manage">
                        {categories.filter((x) => x.category !== c.category).map((x) => (
                          <option key={x.category} value={x.category} />
                        ))}
                      </datalist>
                      <button onClick={confirmRename} disabled={saving} className="text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-lg px-3 py-1.5">
                        {saving ? "กำลังบันทึก…" : "ยืนยัน"}
                      </button>
                      <button onClick={() => setRenamingFrom(null)} className="text-xs font-medium text-neutral-500 hover:text-neutral-700 px-2">ยกเลิก</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 truncate">{c.category}</p>
                        <p className="text-xs text-neutral-400">{c.questionCount} ข้อ</p>
                      </div>
                      <button onClick={() => startRename(c.category)} className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1.5 hover:bg-orange-100 transition flex-shrink-0">
                        <Merge className="h-3.5 w-3.5" /> เปลี่ยนชื่อ / รวมหมวด
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
        </div>
      </div>
    </div>
  );
}

// Single-question form — reused for both "add new" (loops, one POST per save)
// and "edit existing" (one PUT per save). Every save is a real API round trip.
function QuestionFormPanel({ initial, saving, error, onSave, onClose, saveLabel, categoryOptions }) {
  const [q, setQ] = useState(initial || emptyQuestion());
  const patch = (p) => setQ((prev) => ({ ...prev, ...p }));
  const patchOption = (i, val) => { const opts = [...q.options]; opts[i] = val; patch({ options: opts }); };
  const complete = q.text.trim() && q.options.every((o) => o.trim()) && q.correct !== null;

  return (
    <div className="border border-neutral-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-800">{initial ? "แก้ไขข้อสอบ" : "เพิ่มข้อสอบ"}</p>
        <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400"><X className="h-4 w-4" /></button>
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-800 mb-2">โจทย์</label>
        <textarea value={q.text} onChange={(e) => patch({ text: e.target.value })} placeholder="พิมพ์โจทย์ข้อสอบที่นี่…" rows={3} className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
      </div>

      <div className="space-y-2.5">
        {OPTION_LABELS.map((label, optIdx) => {
          const isCorrect = q.correct === optIdx;
          return (
            <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition ${isCorrect ? "border-green-400 bg-green-50" : "border-neutral-200 bg-white"}`}>
              <button onClick={() => patch({ correct: isCorrect ? null : optIdx })} className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${isCorrect ? "border-green-500 bg-green-500" : "border-neutral-300 hover:border-green-400"}`}>
                {isCorrect && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
              <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? "bg-green-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>{label}</span>
              <input type="text" value={q.options[optIdx]} onChange={(e) => patchOption(optIdx, e.target.value)} placeholder={`ตัวเลือก ${label}`} className="flex-1 text-sm bg-transparent border-none outline-none text-neutral-800" />
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-800 mb-2">
          💡 คำอธิบายเฉลย <span className="text-xs font-normal text-neutral-400">(ไม่บังคับ — นักเรียนจะเห็นหลังส่งข้อสอบ)</span>
        </label>
        <textarea
          value={q.explanation || ""}
          onChange={(e) => patch({ explanation: e.target.value })}
          placeholder="อธิบายว่าทำไมคำตอบนี้ถึงถูก…"
          rows={2}
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5">คะแนน</label>
          {/* รองรับทศนิยม เพราะกติกาใหม่คือเพดาน 20 คะแนนต่อรอบ ข้อสอบ 40 ข้อ = ข้อละ 0.5
              ปุ่ม −/+ เดินทีละ 0.5 ส่วนช่องกลางพิมพ์ตัวเลขเองได้ทุกค่า */}
          <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
            <button onClick={() => patch({ score: Math.max(0.5, Math.round((q.score - 0.5) * 100) / 100) })} className="px-3 py-2 text-neutral-500 hover:bg-neutral-50 text-sm font-bold">−</button>
            <input
              type="number" step="0.25" min="0"
              value={q.score}
              onChange={(e) => {
                const v = e.target.value;
                patch({ score: v === "" ? "" : Math.max(0, Math.round(Number(v) * 100) / 100) });
              }}
              onBlur={(e) => { if (e.target.value === "" || Number(e.target.value) <= 0) patch({ score: 1 }); }}
              className="flex-1 w-full text-center text-sm font-semibold text-neutral-800 outline-none py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button onClick={() => patch({ score: Math.round((Number(q.score) + 0.5) * 100) / 100 })} className="px-3 py-2 text-neutral-500 hover:bg-neutral-50 text-sm font-bold">+</button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Difficulty</label>
          <div className="flex gap-1">
            {["ง่าย", "ปานกลาง", "ยาก"].map((lv) => (
              <button key={lv} onClick={() => patch({ level: lv })} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${q.level === lv ? LEVEL_BADGE[lv] + " border-transparent" : "border-neutral-200 text-neutral-500"}`}>{lv}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Category</label>
          <input
            type="text"
            list="category-options"
            value={q.category}
            onChange={(e) => patch({ category: e.target.value })}
            placeholder="เช่น พีชคณิต"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <datalist id="category-options">
            {(categoryOptions || []).map((c) => (
              <option key={c.category} value={c.category} />
            ))}
          </datalist>
          {categoryOptions?.length > 0 && (
            <p className="text-[10px] text-neutral-400 mt-1">หมวดที่เคยใช้ในวิชานี้: {categoryOptions.map((c) => c.category).join(", ")}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-700 font-medium px-3">ยกเลิก</button>
        <button
          onClick={() => onSave(q)}
          disabled={!complete || saving}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 text-sm font-semibold transition"
        >
          {saving ? "กำลังบันทึก…" : (saveLabel || "บันทึก")}
        </button>
      </div>
    </div>
  );
}

function ExcelImportFlow({ examId, onCancel, onImported, categoryOptions }) {
  const [step, setStep] = useState(1); // 1 upload, 2 preview
  const knownCategories = new Set((categoryOptions || []).map((c) => c.category.trim().toLowerCase()));
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const qs = await parseXlsx(file);
      if (qs.length === 0) throw new Error("ไม่พบข้อสอบในไฟล์ — ตรวจสอบ format ให้ตรงกับ Template");
      setRows(qs);
      setStep(2);
    } catch (err) {
      setError(err.message || "ไฟล์ผิดพลาด กรุณาใช้ Template ที่ดาวน์โหลดมา");
    } finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError("");
    try {
      const inserted = await addQuestions(examId, rows);
      onImported(inserted);
    } catch (err) {
      console.error("Excel import save failed:", err);
      setError("บันทึกลงฐานข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setConfirming(false);
    }
  };

  const invalidCount = rows.filter((q) => !q.text.trim() || q.options.some((o) => !o.trim()) || q.correct === null).length;

  return (
    <div className="border border-neutral-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-800">นำเข้าข้อสอบจาก Excel</p>
        <button onClick={onCancel} className="h-8 w-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400"><X className="h-4 w-4" /></button>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <button onClick={downloadXlsxTemplate} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-green-300 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl py-2.5 text-xs font-semibold transition">
            <Download className="h-3.5 w-3.5" /> ดาวน์โหลด Template (.xlsx)
          </button>
          <div onClick={() => fileRef.current?.click()} onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-orange-300 transition">
            {loading ? <p className="text-xs text-neutral-500 animate-pulse">กำลังอ่านไฟล์…</p> : (
              <>
                <FileSpreadsheet className="h-7 w-7 text-neutral-300 mx-auto mb-1.5" />
                <p className="text-xs text-neutral-500">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                <p className="text-[10px] text-neutral-400 mt-1">รองรับ .xlsx, .xls, .csv</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700">พบ {rows.length} ข้อ</Badge>
            {invalidCount > 0 && <Badge className="bg-amber-100 text-amber-700">{invalidCount} ข้อมีปัญหา</Badge>}
          </div>
          <div className="border border-neutral-100 rounded-xl max-h-64 overflow-y-auto divide-y divide-neutral-50">
            {rows.map((q, i) => {
              const bad = !q.text.trim() || q.options.some((o) => !o.trim()) || q.correct === null;
              return (
                <div key={i} className={`px-4 py-2.5 flex items-start gap-3 ${bad ? "bg-amber-50/50" : ""}`}>
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${bad ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600"}`}>{bad ? "!" : i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-700 truncate">{q.text || "(ไม่มีโจทย์)"}</p>
                    <p className="text-[10px] text-neutral-400">
                      {q.level} {q.category && `· ${q.category}`}
                      {q.explanation?.trim() ? (
                        <span className="text-blue-500"> · มีคำอธิบายเฉลย</span>
                      ) : (
                        <span className="text-neutral-300"> · ไม่มีคำอธิบายเฉลย</span>
                      )}
                    </p>
                    {q.category?.trim() && knownCategories.size > 0 && !knownCategories.has(q.category.trim().toLowerCase()) && (
                      <p className="text-[10px] text-amber-600 mt-0.5">⚠️ หมวด "{q.category}" ยังไม่เคยใช้ในวิชานี้ — พิมพ์ผิดหรือหมวดใหม่จริง?</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-neutral-500 hover:text-neutral-700 font-medium">← อัปโหลดไฟล์อื่น</button>
            <button onClick={handleConfirm} disabled={confirming} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition">
              {confirming ? "กำลังบันทึก…" : `ยืนยันนำเข้า ${rows.length} ข้อ`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsTab({ examId, subjectId, adminId, questions, status, onChanged }) {
  const locked = status === "active";
  const [mode, setMode] = useState(null); // null | "picker" | "manual" | "excel"
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [splitting, setSplitting] = useState(false);

  // ── ตัวช่วยแบ่งคะแนนให้ครบเพดาน 20 ต่อรอบ ────────────────────────────────
  // ติวเตอร์ใส่ข้อสอบกี่ข้อก็ได้ ระบบหารให้เอง และกระจายเศษให้ผลรวมเท่ากับ 20.00 พอดี
  const currentTotal = sumScores(questions);
  const isBalanced = Math.abs(currentTotal - EXAM_SCORE_CAP) < 0.005;

  const handleAutoSplit = async () => {
    if (!questions.length) return;
    setSplitting(true);
    setFormError("");
    try {
      const values = splitScoreEvenly(questions.length, EXAM_SCORE_CAP);
      await bulkUpdateQuestionScores(
        examId,
        questions.map((q, i) => ({ questionId: q.id, score: values[i] }))
      );
      await onChanged();
    } catch (err) {
      console.error("Auto split scores failed:", err);
      setFormError(err.response?.data?.message || "แบ่งคะแนนไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSplitting(false);
    }
  };

  const loadCategories = () => {
    if (!subjectId || !adminId) return;
    fetchSubjectCategories({ subjectId, adminId })
      .then(setCategoryOptions)
      .catch((err) => console.error("Fetch subject categories failed:", err));
  };

  useEffect(() => { loadCategories(); }, [subjectId, adminId]);

  const editingQuestion = questions.find((q) => q.id === editingId) || null;

  const handleAddOne = async (q) => {
    setSaving(true);
    setFormError("");
    try {
      await addQuestions(examId, [q]);
      await onChanged();
      // stay open so the tutor can add the next question right away
      setMode("manual-added");
      setTimeout(() => setMode("manual"), 0);
    } catch (err) {
      console.error("Add question failed:", err);
      setFormError("บันทึกลงฐานข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (q) => {
    setSaving(true);
    setFormError("");
    try {
      await updateQuestion(editingId, q);
      await onChanged();
      setEditingId(null);
    } catch (err) {
      console.error("Update question failed:", err);
      setFormError("บันทึกลงฐานข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId) => {
    setDeletingId(questionId);
    try {
      await deleteQuestion(questionId);
      await onChanged();
    } catch (err) {
      console.error("Delete question failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
            <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{questions.length} ข้อในชุดข้อสอบนี้</p>
        <div className="flex items-center gap-2">
          {categoryOptions.length > 0 && (
            <button onClick={() => setShowManageCategories(true)} className="flex items-center gap-1.5 border border-neutral-200 hover:border-orange-300 hover:bg-orange-50 text-neutral-600 hover:text-orange-600 rounded-xl px-3 py-2 text-sm font-semibold transition">
              <Tags className="h-4 w-4" /> จัดการหมวดหมู่
            </button>
          )}
          {!editingId && !locked && (
            <button onClick={() => setMode(mode ? null : "picker")} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition">
              <Plus className="h-4 w-4" /> เพิ่มข้อสอบ
            </button>
          )}
        </div>
      </div>

      {showManageCategories && (
        <ManageCategoriesModal
          subjectId={subjectId}
          adminId={adminId}
          onClose={() => setShowManageCategories(false)}
          onChanged={async () => { loadCategories(); await onChanged(); }}
        />
      )}

      {locked && (
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">การสอบนี้กำลังเปิดอยู่ — เพิ่ม/ลบ/แก้ไขข้อสอบไม่ได้จนกว่าจะปิดสอบ (ไปที่แท็บ "เปิด/ปิดสอบ")</p>
        </div>
      )}

      {/* แถบสถานะคะแนนรวม — ทุกวิชาต้องเต็ม 20 เท่ากันหมด เพื่อให้รวมทั้งแพ็กเกจได้ 100 (5 วิชา) หรือ 80 (4 วิชา) */}
      {questions.length > 0 && (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 ${
          isBalanced ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {isBalanced
              ? <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              : <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />}
            <div className="min-w-0">
              <p className={`text-sm font-bold ${isBalanced ? "text-emerald-800" : "text-amber-800"}`}>
                รวมตอนนี้ {fmtScore(currentTotal)} / {EXAM_SCORE_CAP} คะแนน
                <span className="font-medium"> · {questions.length} ข้อ</span>
              </p>
              <p className={`text-xs mt-0.5 ${isBalanced ? "text-emerald-600" : "text-amber-700"}`}>
                {isBalanced
                  ? "ครบเพดานพอดีแล้ว พร้อมเปิดสอบ"
                  : currentTotal < EXAM_SCORE_CAP
                    ? `ยังขาดอีก ${fmtScore(EXAM_SCORE_CAP - currentTotal)} คะแนน — กดแบ่งอัตโนมัติให้ครบได้เลย`
                    : `เกินเพดานอยู่ ${fmtScore(currentTotal - EXAM_SCORE_CAP)} คะแนน — กดแบ่งอัตโนมัติเพื่อปรับให้พอดี`}
              </p>
            </div>
          </div>
          {!locked && !editingId && (
            <button
              onClick={handleAutoSplit}
              disabled={splitting}
              title={`หาร ${EXAM_SCORE_CAP} คะแนนให้ข้อสอบ ${questions.length} ข้อเท่า ๆ กัน`}
              className="flex-shrink-0 flex items-center gap-1.5 border border-neutral-200 bg-white hover:border-orange-300 hover:bg-orange-50 text-neutral-700 hover:text-orange-600 disabled:opacity-40 rounded-xl px-3.5 py-2 text-sm font-semibold transition"
            >
              <Zap className="h-4 w-4" /> {splitting ? "กำลังแบ่ง…" : "แบ่งคะแนนอัตโนมัติ"}
            </button>
          )}
        </div>
      )}

      {mode === "picker" && (
        <div className="border border-neutral-200 rounded-2xl p-5 relative">
          <button onClick={() => setMode(null)} className="absolute top-3 right-3 h-8 w-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400"><X className="h-4 w-4" /></button>
          <p className="text-sm font-semibold text-neutral-800 mb-3">เลือกวิธีเพิ่มข้อสอบ</p>
          <AddMethodPicker onPick={setMode} />
        </div>
      )}

      {mode === "manual" && (
        <QuestionFormPanel
          saving={saving}
          error={formError}
          saveLabel="บันทึกและเพิ่มข้อถัดไป"
          onSave={handleAddOne}
          onClose={() => setMode(null)}
          categoryOptions={categoryOptions}
        />
      )}

      {mode === "excel" && (
        <ExcelImportFlow examId={examId} onCancel={() => setMode(null)} onImported={async () => { await onChanged(); setMode(null); }} categoryOptions={categoryOptions} />
      )}

      {editingId && (
        <QuestionFormPanel
          initial={editingQuestion}
          saving={saving}
          error={formError}
          saveLabel="บันทึกการแก้ไข"
          onSave={handleEditSave}
          onClose={() => { setEditingId(null); setFormError(""); }}
          categoryOptions={categoryOptions}
        />
      )}

      {questions.length === 0 && !mode ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 rounded-2xl">
          <FileQuestion className="h-10 w-10 text-neutral-300 mb-3" />
          <p className="text-sm font-semibold text-neutral-500">ยังไม่มีข้อสอบในชุดนี้</p>
          <p className="text-xs text-neutral-400 mt-1">กด “เพิ่มข้อสอบ” เพื่อเริ่มต้น</p>
        </div>
      ) : questions.length > 0 && !editingId ? (
        <div className="border border-neutral-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                {["#", "โจทย์", "หมวด", "ระดับ", "คะแนน", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition">
                  <td className="px-4 py-3 text-neutral-400">{i + 1}</td>
                  <td className="px-4 py-3 text-neutral-800 max-w-[320px] truncate">{q.text}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{q.category || "—"}</span></td>
                  <td className="px-4 py-3"><Badge className={LEVEL_BADGE[q.level]}>{q.level}</Badge></td>
                  <td className="px-4 py-3 text-neutral-500">{fmtScore(q.score)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {locked ? (
                      <span className="text-xs text-neutral-300">ล็อกอยู่</span>
                    ) : (
                      <>
                        <button onClick={() => { setMode(null); setEditingId(q.id); }} className="text-xs text-orange-500 hover:text-orange-700 font-medium mr-3">แก้ไข</button>
                        <button onClick={() => handleDelete(q.id)} disabled={deletingId === q.id} className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-40">
                          {deletingId === q.id ? "กำลังลบ…" : "ลบ"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

// ─── Preview Tab ─────────────────────────────────────────────────────────────

function PreviewTab({ exam, goToQuestions }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const questions = exam.questions || [];
  const current = questions[activeIdx];
  const ready = isExamReady(exam);
  const target = Number(exam.settings?.totalQuestions) || 0;

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 rounded-2xl">
        <FileQuestion className="h-10 w-10 text-neutral-300 mb-3" />
        <p className="text-sm font-semibold text-neutral-500">ยังไม่มีข้อสอบให้ preview</p>
        <button onClick={goToQuestions} className="mt-4 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition">
          <Plus className="h-4 w-4" /> เพิ่มข้อสอบ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ready ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          <Check className="h-4 w-4 text-green-600" />
          <p className="text-sm font-semibold text-green-700">ข้อสอบพร้อมเปิดสอบ</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <p className="text-sm text-amber-700">
            ยังไม่พร้อมเปิดสอบ
            {target > 0 && questions.length < target && ` — มี ${questions.length}/${target} ข้อ`}
            {questions.some((q) => !q.text?.trim() || q.options?.some((o) => !o.trim()) || q.correct === null) && " — มีข้อที่ยังไม่สมบูรณ์"}
          </p>
        </div>
      )}

      <div className="border border-neutral-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveIdx((i) => Math.max(0, i - 1))} disabled={activeIdx === 0} className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-semibold text-neutral-700">ข้อที่ {activeIdx + 1} / {questions.length}</span>
            <button onClick={() => setActiveIdx((i) => Math.min(questions.length - 1, i + 1))} disabled={activeIdx === questions.length - 1} className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
          {current.level && <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${LEVEL_COLOR[current.level]?.pill}`}>{current.level}</span>}
        </div>

        <div className="flex items-baseline gap-3 mb-5">
          <span className="text-xl font-black text-orange-500">{activeIdx + 1}.</span>
          <p className="text-base font-medium text-neutral-900 leading-relaxed">{current.text || <span className="text-neutral-300 italic">ยังไม่มีโจทย์</span>}</p>
        </div>

        <div className="space-y-2.5">
          {OPTION_LABELS.map((label, optIdx) => {
            const isCorrect = current.correct === optIdx;
            return (
              <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isCorrect ? "border-green-400 bg-green-50" : "border-neutral-200"}`}>
                <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? "bg-green-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>{label}</span>
                <span className="text-sm text-neutral-800">{current.options?.[optIdx] || <span className="text-neutral-300 italic">ว่าง</span>}</span>
                {isCorrect && <Check className="h-4 w-4 text-green-600 ml-auto" />}
              </div>
            );
          })}
        </div>

        {current.explanation?.trim() ? (
          <div className="mt-4 flex gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <span className="text-sm flex-shrink-0">💡</span>
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-0.5">คำอธิบายเฉลย</p>
              <p className="text-xs text-blue-700/90 leading-relaxed">{current.explanation}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex gap-2 bg-neutral-50 border border-neutral-100 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 text-neutral-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-400">ยังไม่ได้ใส่คำอธิบายเฉลยสำหรับข้อนี้</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Manage Tab (ตั้งค่าข้อสอบ + เปิด/ปิดสอบ รวมกันแท็บเดียว) ──────────────────
// เดิมเป็น 2 แท็บแยกกัน (SettingsTab / SessionTab) ทำให้ต้องสลับไปมาเวลาตั้งเป็น
// auto — พอกลับไปแท็บเปิด/ปิดสอบก็ยังมีปุ่ม "เปิดสอบ" ให้กดเองซ้ำซ้อน งงว่าจะเปิดยังไงกันแน่
// รวมเป็นแท็บเดียว: ถ้าตั้ง auto ไว้ ครึ่งล่างจะไม่โชว์ปุ่ม "เปิดสอบ" หลักอีกต่อไป แต่โชว์
// สถานะ + นับถอยหลังแทน มีแค่ปุ่มเล็กๆ "เปิดเลยตอนนี้" ไว้ข้ามกำหนดเวลาได้ถ้าจำเป็นจริงๆ

function formatThaiDate(dateStr) {
  if (!dateStr) return "";
  return new Date(`${dateStr}T00:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" });
}

// นับถอยหลังจนถึงเวลาเปิดอัตโนมัติ — โชว์แบบ "อีก X วัน Y ชม. Z นาที"
function formatCountdown(sec) {
  if (sec == null) return "";
  if (sec <= 0) return "ถึงเวลาที่ตั้งไว้แล้ว — ระบบกำลังจะเปิดให้ในไม่ช้า (ไม่เกิน 1 นาที)";
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} วัน`);
  if (days > 0 || hours > 0) parts.push(`${hours} ชม.`);
  parts.push(`${minutes} นาที`);
  if (days === 0 && hours === 0) parts.push(`${seconds} วิ`);
  return `เหลืออีก ${parts.join(" ")}`;
}

function ManageExamTab({ exam, onSaved, showToast, onOpen, onReopen, onClose }) {
  const examId = exam.id;
  const settings = exam.settings;
  const status = deriveStatus(exam);
  // ข้อสอบที่เคยปิดไปแล้วห้ามตั้งเปิดอัตโนมัติได้อีก — เพราะ "เปิดสอบใหม่" เปิดเป็น active
  // ทันทีเสมอ ไม่มีทางเข้าสถานะรอเปิดแบบที่ auto sweep ยอมรับได้อีก (ดู examAutoOpen.js)
  // ตั้งไว้ก็จะไม่มีผลอะไรเลย เลยบล็อกไว้ตั้งแต่ต้นทางกันงง
  const isClosed = status === "closed";

  // ── ส่วนตั้งค่า ──────────────────────────────────────────────────────────
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const mode = isClosed ? "manual" : (form.openMode === "auto" ? "auto" : "manual");
    if (mode === "auto" && (!form.date || !form.time)) {
      setError("โหมดเปิดสอบอัตโนมัติต้องระบุวันที่และเวลาให้ครบ");
      setSaving(false);
      return;
    }
    try {
      const payload = { totalQuestions: Number(form.totalQuestions), duration: Number(form.duration), date: form.date || null, time: form.time || null, openMode: mode };
      const result = await updateExamSettings(examId, payload);
      await onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // โหมด auto — เตือนให้ชัดว่าบันทึกไว้แล้ว แต่จะยังไม่เปิดสอบจริงจนกว่าจะมีข้อสอบ
      // อย่างน้อย 1 ข้อ (ตรงกับเงื่อนไขที่ sweepScheduledOpens ฝั่ง backend ใช้เช็ค)
      if (mode === "auto" && showToast) {
        if ((result?.questionCount ?? 0) === 0) {
          showToast("warning", "บันทึกแล้ว แต่ยังไม่เปิดสอบ", "ระบบจะยังไม่เปิดสอบอัตโนมัติจนกว่าจะใส่ข้อสอบให้ครบอย่างน้อย 1 ข้อ ถึงเวลาที่ตั้งไว้แล้วจะรอจนกว่าจะพร้อม");
        } else {
          showToast("success", "บันทึกแล้ว", "ระบบจะเปิดสอบให้อัตโนมัติทันทีที่ถึงวันเวลาที่ตั้งไว้");
        }
      }
    } catch (err) {
      console.error("Save settings failed:", err);
      setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  // ── ส่วนเปิด/ปิดสอบ ──────────────────────────────────────────────────────
  const [opening, setOpening] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [live, setLive] = useState(null);
  const [remainingSec, setRemainingSec] = useState(null);
  const [scheduleRemainingSec, setScheduleRemainingSec] = useState(null);
  const ready = isExamReady(exam);
  // ตั้งเปิดอัตโนมัติไว้จริง (มีทั้งวันและเวลา) และยังไม่เคยเปิด/ปิด — เงื่อนไขเดียวกับที่
  // ใช้ซ่อนปุ่ม "เปิดสอบ" หลัก แล้วโชว์การ์ดนับถอยหลังแทน
  const isScheduledAuto = status !== "active" && !isClosed && settings.openMode === "auto" && !!settings.date && !!settings.time;

  // นับถอยหลังฝั่ง Tutor เอง (ไม่รอ poll ทุก 5 วิ) แต่ยึด deadline จาก
  // Backend เสมอ (examStartedAt + durationMinutes) เพื่อให้ตรงกับฝั่งนักเรียน
  useEffect(() => {
    if (!live?.examStartedAt || live?.durationMinutes == null) { setRemainingSec(null); return; }
    const deadline = new Date(live.examStartedAt).getTime() + live.durationMinutes * 60 * 1000;
    const tick = () => setRemainingSec(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [live?.examStartedAt, live?.durationMinutes]);

  // นับถอยหลังจนถึงเวลาเปิดอัตโนมัติที่ตั้งไว้ (settings.date/time เป็นเวลาไทยตรงๆ
  // ที่ backend ส่งมา — ใส่ offset +07:00 ชัดเจน กันเบราว์เซอร์ตีความผิด)
  useEffect(() => {
    if (!isScheduledAuto) { setScheduleRemainingSec(null); return; }
    const target = new Date(`${settings.date}T${settings.time}:00+07:00`).getTime();
    const tick = () => setScheduleRemainingSec(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [isScheduledAuto, settings.date, settings.time]);

  // ระหว่างรอเปิดอัตโนมัติ เช็คสถานะซ้ำเป็นระยะ เผื่อ backend เปิดให้แล้วจริง
  // (sweep ฝั่ง backend รันทุก 1 นาที) จะได้สลับมาโชว์สถานะ "กำลังเปิดอยู่" เอง
  // โดยไม่ต้องให้ติวเตอร์กด refresh หน้าเว็บเอง
  useEffect(() => {
    if (!isScheduledAuto) return;
    const iv = setInterval(() => { onSaved(); }, 10_000);
    return () => clearInterval(iv);
  }, [isScheduledAuto, onSaved]);

  const pollResults = useCallback(async () => {
    try {
      const data = await fetchExamResults(exam.id);
      setLive(data);
    } catch (err) {
      console.error("Fetch live results failed:", err);
    }
  }, [exam.id]);

  useEffect(() => {
    if (status !== "active") return;
    pollResults();
    const iv = setInterval(pollResults, 5000);
    return () => clearInterval(iv);
  }, [status, pollResults]);

  const joined = live?.joinedCount ?? 0;
  const enrolled = live?.enrolledCount ?? 0;
  const pct = enrolled ? Math.round((joined / enrolled) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── ตั้งค่าข้อสอบ ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-5">
        <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-neutral-400" /> ตั้งค่าข้อสอบ
        </h3>

        <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">Exam Settings คุมภาพรวมของการสอบเท่านั้น (จำนวนข้อเป้าหมาย / เวลา / วันสอบ) — ส่วนโจทย์แต่ละข้อแก้ไขได้ที่แท็บ ข้อสอบ</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">จำนวนข้อ (เป้าหมาย)</label>
            <input type="number" min={0} value={form.totalQuestions} onChange={(e) => setForm({ ...form, totalQuestions: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">เวลาสอบ (นาที)</label>
            <input type="number" min={0} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">วันที่สอบ (ไม่บังคับ)</label>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            <input type="time" value={form.time || ""} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">วิธีเปิดสอบ</label>
          <div className={`flex rounded-xl overflow-hidden border border-neutral-200 ${isClosed ? "opacity-50" : ""}`}>
            <button
              type="button"
              onClick={() => setForm({ ...form, openMode: "manual" })}
              className={`flex-1 px-3 py-2.5 text-sm font-semibold transition ${isClosed || (form.openMode || "manual") === "manual" ? "bg-orange-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}
            >
              เปิดเอง
            </button>
            <button
              type="button"
              disabled={isClosed}
              onClick={() => setForm({ ...form, openMode: "auto" })}
              className={`flex-1 px-3 py-2.5 text-sm font-semibold transition ${isClosed ? "bg-white text-neutral-400 cursor-not-allowed" : form.openMode === "auto" ? "bg-orange-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}
            >
              เปิดอัตโนมัติตามวันเวลา
            </button>
          </div>
          {isClosed ? (
            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2 text-left">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                ข้อสอบนี้ปิดไปแล้ว โหมดเปิดอัตโนมัติจะยังไม่มีผลใดๆ จนกว่าจะกดปุ่ม "เปิดสอบใหม่" ด้วยตัวเองก่อน (ระบบจะไม่เปิดข้อสอบที่เคยปิดไปแล้วให้อัตโนมัติ เพื่อป้องกันการลบผลสอบเดิมของนักเรียนโดยไม่ตั้งใจ)
              </p>
            </div>
          ) : (
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              {form.openMode === "auto"
                ? "ระบบจะเปิดสอบให้อัตโนมัติทันทีที่ถึงวันเวลาที่ตั้งไว้ (ต้องระบุวันที่และเวลาให้ครบ) — ถ้าถึงเวลาแล้วแต่ยังใส่ข้อสอบไม่ครบ ระบบจะรอจนกว่าจะมีข้อสอบก่อนค่อยเปิดให้"
                : "ติวเตอร์เป็นคนกดปุ่มเปิดสอบเองด้านล่าง — วันที่ที่ตั้งไว้จะโชว์ให้นักเรียนเห็นเป็นกำหนดการเฉยๆ (อาจเปลี่ยนแปลงได้)"}
            </p>
          )}
          {isScheduledAuto && (
            <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mt-2 text-left">
              <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                กำลังนับถอยหลังเพื่อเปิดอัตโนมัติอยู่ด้านล่าง — ถ้าแก้วันที่/เวลาแล้วกดบันทึก จะเปลี่ยนเวลาที่ตั้งไว้ทันที
              </p>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button onClick={handleSave} disabled={saving} className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${saved ? "bg-green-50 border border-green-300 text-green-700" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
          {saving ? "กำลังบันทึก…" : saved ? <><Check className="h-4 w-4" /> บันทึกแล้ว</> : "บันทึกการตั้งค่า"}
        </button>
      </div>

      {/* ── เปิด/ปิดสอบ ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2 mb-5">
          <Play className="h-4 w-4 text-neutral-400" /> เปิด/ปิดสอบ
        </h3>

        {/* ── closed: offer "เปิดสอบใหม่" (reset + reopen), with a clear warning ── */}
        {status === "closed" && (
          <div className="text-center py-6 space-y-4">
            <div className="h-14 w-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
              <StopCircle className="h-6 w-6 text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">การสอบนี้ปิดแล้ว</p>
              <p className="text-xs text-neutral-500 mt-1">ผลสอบรอบที่ผ่านมาดูได้ที่แท็บ ผลสอบ/สถิติ</p>
            </div>

            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left max-w-md mx-auto">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                การกด "เปิดสอบใหม่" จะ<strong>ลบข้อมูลผลสอบของนักเรียนจากรอบนี้ทั้งหมด</strong>
                (คำถามและการตั้งค่าจะยังอยู่เหมือนเดิม)
              </p>
            </div>

            <button
              onClick={() => setConfirmReopen(true)}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition"
            >
              <Play className="h-4 w-4" /> เปิดสอบใหม่
            </button>

            {confirmReopen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmReopen(false)}>
                <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-left" onClick={(e) => e.stopPropagation()}>
                  <div className="text-center mb-5">
                    <div className="h-14 w-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3"><AlertCircle className="h-7 w-7 text-amber-600" /></div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">เปิดสอบใหม่?</h3>
                    <p className="text-sm text-neutral-500">
                      ข้อมูลผลสอบของนักเรียนทั้งหมดจากรอบก่อนจะถูกลบ และนักเรียนทุกคนจะต้องเริ่มสอบใหม่
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmReopen(false)} className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-semibold text-neutral-700">ยกเลิก</button>
                    <button
                      onClick={async () => { setReopening(true); try { await onReopen(); setConfirmReopen(false); } finally { setReopening(false); } }}
                      disabled={reopening}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold"
                    >
                      {reopening ? "กำลังเปิด…" : "เปิดสอบใหม่"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── inactive + ตั้งเปิดอัตโนมัติไว้: โชว์นับถอยหลังแทนปุ่ม "เปิดสอบ" หลัก ── */}
        {status !== "active" && status !== "closed" && isScheduledAuto && (
          <div className="text-center py-6 space-y-4">
            <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                ตั้งเปิดอัตโนมัติวันที่ {formatThaiDate(settings.date)} เวลา {settings.time} น.
              </p>
              <p className="text-xs text-neutral-500 mt-1">{formatCountdown(scheduleRemainingSec)}</p>
            </div>
            {!ready && (
              <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left max-w-md mx-auto">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">ข้อสอบยังไม่พร้อม (ยังไม่มีข้อสอบ) — ถึงเวลาที่ตั้งไว้แล้ว ระบบจะรอจนกว่าจะใส่ข้อสอบครบก่อนค่อยเปิดให้</p>
              </div>
            )}
            <button
              onClick={() => setConfirmOverride(true)}
              disabled={!ready}
              className="inline-flex items-center gap-1.5 border border-orange-200 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed text-orange-600 rounded-xl px-4 py-2 text-xs font-semibold transition"
            >
              <Play className="h-3.5 w-3.5" /> เปิดเลยตอนนี้ (ข้ามกำหนดเวลา)
            </button>

            {confirmOverride && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmOverride(false)}>
                <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-left" onClick={(e) => e.stopPropagation()}>
                  <div className="text-center mb-5">
                    <div className="h-14 w-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3"><AlertCircle className="h-7 w-7 text-amber-600" /></div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">เปิดสอบก่อนกำหนด?</h3>
                    <p className="text-sm text-neutral-500">
                      ตั้งเปิดอัตโนมัติไว้วันที่ {formatThaiDate(settings.date)} เวลา {settings.time} น. — ถ้ากดเปิดตอนนี้ นักเรียนจะเข้าสอบได้ทันที ก่อนถึงเวลาที่ตั้งไว้
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmOverride(false)} className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-semibold text-neutral-700">ยกเลิก</button>
                    <button
                      onClick={async () => { setOverriding(true); try { await onOpen(); setConfirmOverride(false); } finally { setOverriding(false); } }}
                      disabled={overriding}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold"
                    >
                      {overriding ? "กำลังเปิด…" : "เปิดเลยตอนนี้"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── inactive + เปิดเอง (หรือยังไม่ได้ตั้งวันเวลาให้ auto ครบ): ปุ่ม "เปิดสอบ" ปกติ ── */}
        {status !== "active" && status !== "closed" && !isScheduledAuto && (
          <div className="text-center py-6 space-y-4">
            <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <Play className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">พร้อมเปิดสอบ {exam.name} หรือยัง?</p>
              <p className="text-xs text-neutral-500 mt-1">นักเรียนที่ enroll ในคอร์สนี้จะกด "เข้าสอบ" จากหน้าคอร์สของตัวเองได้ทันทีหลังเปิด</p>
            </div>
            {!ready && (
              <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left max-w-md mx-auto">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">ข้อสอบยังไม่พร้อม — ตรวจสอบที่แท็บ ดูตัวอย่างข้อสอบ ก่อนเปิดสอบ</p>
              </div>
            )}
            <button
              onClick={async () => { setOpening(true); try { await onOpen(); } finally { setOpening(false); } }}
              disabled={!ready || opening}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition"
            >
              <Play className="h-4 w-4" /> {opening ? "กำลังเปิด…" : "เปิดสอบ"}
            </button>
          </div>
        )}

        {/* ── active ── */}
        {status === "active" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">การสอบกำลังเปิดอยู่ — นักเรียนกด "เข้าสอบ" จากหน้าคอร์สของตัวเองได้เลย</p>
            </div>

            <div className="border border-neutral-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-neutral-700">ความคืบหน้าการเข้าสอบ</p>
                <p className="text-sm font-bold text-orange-600">{joined}/{enrolled} คน</p>
              </div>
              <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {remainingSec != null && (
              <div className={`border rounded-2xl p-5 ${remainingSec <= 60 ? "border-red-200 bg-red-50" : "border-neutral-200"}`}>
                <p className="text-sm font-semibold text-neutral-700 mb-1">เวลาที่เหลือของการสอบ</p>
                <div className={`flex items-center gap-2 font-mono font-bold text-2xl ${remainingSec <= 60 ? "text-red-600" : "text-neutral-800"}`}>
                  <Clock className="h-5 w-5" /> {formatTime(remainingSec)}
                </div>
              </div>
            )}

            <button onClick={() => setConfirmClose(true)} className="w-full flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl py-2.5 text-sm font-semibold transition">
              <StopCircle className="h-4 w-4" /> ปิดสอบ
            </button>

            {confirmClose && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmClose(false)}>
                <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="text-center mb-5">
                    <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><AlertCircle className="h-7 w-7 text-red-600" /></div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">ยืนยันการปิดสอบ?</h3>
                    <p className="text-sm text-neutral-500">นักเรียนจะเข้าสอบต่อไม่ได้อีก</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmClose(false)} className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-semibold text-neutral-700">ยกเลิก</button>
                    <button
                      onClick={async () => { setClosing(true); try { await onClose(); } finally { setClosing(false); setConfirmClose(false); } }}
                      disabled={closing}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold"
                    >
                      {closing ? "กำลังปิด…" : "ปิดสอบ"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Student Detail Modal ─────────────────────────────────────────────────────
// UI ปรับให้ยึด StudentModal ของ TutorExamAnalytics.jsx เป็น visual reference
// แต่ข้อมูลทั้งหมดมาจาก fetchExamJoinDetail() จริง (ไม่ใช้ mock)
//
// หมายเหตุเรื่อง "คะแนนรายหัวข้อ": response ของ fetchExamJoinDetail ที่ให้มา
// ไม่มี field หมวดหมู่ (category) ต่อข้อคำถามโดยตรง — เรา join ข้อมูลนี้จาก
// exam.questions ที่ parent component โหลดไว้แล้ว (ข้อมูลจริงจาก backend
// เดียวกัน ไม่ใช่ mock) โดยจับคู่ด้วย question id แทนที่จะเรียก API เพิ่ม
// ถ้าในอนาคต fetchExamJoinDetail() ส่ง category ต่อข้อมาด้วยโดยตรง ให้ใช้ค่า
// จาก response นั้นแทนการ join นี้ได้เลย
// รายการ "ครั้งที่ 1, 2, 3..." ของข้อหนึ่ง — พับเก็บไว้ก่อน กดค่อยกาง
// เดิมกางทั้งหมดตลอดเวลา พอข้อสอบเยอะ ๆ หน้าจะยาวและอ่านยาก
function QuestionPeriods({ periods }) {
  const [open, setOpen] = useState(false);
  if (!periods || periods.length <= 1) return null;
  return (
    <div className="pl-5 mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-neutral-400 hover:text-neutral-600 transition font-medium"
      >
        {open ? "ซ่อน" : "ดู"}ช่วงเวลาที่กลับมาทำซ้ำ ({periods.length} ครั้ง) {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {periods.map((p, pi) => (
            <p key={pi} className="text-[11px] text-neutral-400">
              ครั้งที่ {pi + 1}: {formatTime(p.seconds)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentDetailModal({ student, examJoinId, examName, examQuestions, onClose }) {
  // แบ่งเนื้อหาเป็น 2 แท็บ — เดิมต่อกันยาวทั้งหมดในหน้าเดียว พอข้อสอบเยอะจะตาลาย
  const [modalTab, setModalTab] = useState("overview");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchExamJoinDetail(examJoinId)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch((err) => { console.error("Fetch join detail failed:", err); if (!cancelled) setError("โหลดรายละเอียดไม่สำเร็จ"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [examJoinId]);

  const enrichedQuestions = useMemo(() => {
    if (!detail?.questions) return [];
    const byId = new Map((examQuestions || []).map((q) => [q.id, q]));
    return detail.questions.map((q) => ({ ...q, category: byId.get(q.id)?.category || null }));
  }, [detail, examQuestions]);

  // questionId → ลำดับข้อที่โชว์ (1, 2, 3...) ใช้กับไทม์ไลน์ธงคุณภาพข้อมูล
  // ยึดลำดับเดียวกับส่วน "รายข้อ" ด้านล่าง เพื่อให้ติวเตอร์อ้างอิงตรงกัน
  const questionNoById = useMemo(() => {
    const m = new Map();
    (detail?.questions || []).forEach((q, i) => m.set(q.id, i + 1));
    return m;
  }, [detail]);

  const topicBreakdown = useMemo(() => {
    const cats = [...new Set(enrichedQuestions.map((q) => q.category).filter(Boolean))];
    if (cats.length === 0) return null; // ไม่มีข้อมูลหมวดหมู่ให้ join ได้ — ข้ามส่วนนี้ไป
    return cats.map((cat) => {
      const qs = enrichedQuestions.filter((q) => q.category === cat);
      const maxSc = qs.reduce((s, q) => s + q.score, 0);
      const sc = qs.reduce((s, q) => s + (q.isCorrect ? q.score : 0), 0);
      return { category: cat, sc, maxSc, pct: maxSc ? sc / maxSc : 0 };
    });
  }, [enrichedQuestions]);

  const pct = student?.maxScore ? Math.round((student.totalScore / student.maxScore) * 100) : null;
  const passed = student?.submittedAt && pct != null ? pct >= PASS_PCT : null;
  const correctCount = detail?.questions ? detail.questions.filter((q) => q.isCorrect).length : null;
  const wrongCount = detail?.questions ? detail.questions.length - correctCount : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-neutral-800">รายละเอียดผลสอบ</p>
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400"><X className="h-4 w-4" /></button>
          </div>

          {/* Header / summary card — สไตล์เดียวกับ StudentModal ของ Analytics */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl text-white">
            <div className="h-14 w-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <p className="font-bold text-lg">{detail?.studentName || student?.name}</p>
              <p className="text-sm text-orange-100">{detail?.examName || examName} · ใช้เวลา {student?.secondsUsed != null ? formatTime(student.secondsUsed) : "—"}</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {passed != null && (
                <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-xl font-black">{passed ? "✓" : "✗"}</p>
                  <p className="text-[10px] text-orange-100">{passed ? "ผ่าน" : "ไม่ผ่าน"}</p>
                </div>
              )}
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <p className="text-xl font-black">{student?.totalScore ?? "—"}/{student?.maxScore ?? "—"}</p>
                <p className="text-[10px] text-orange-100">{pct != null ? `${pct}%` : "—"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-600">{correctCount ?? "—"}</p>
              <p className="text-xs text-neutral-500">ตอบถูก</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-red-500">{wrongCount ?? "—"}</p>
              <p className="text-xs text-neutral-500">ตอบผิด</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-neutral-700">{student?.answeredCount ?? "—"}</p>
              <p className="text-xs text-neutral-500">ตอบแล้ว</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-neutral-700">{student?.unansweredCount ?? "—"}</p>
              <p className="text-xs text-neutral-500">ไม่ตอบ</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-neutral-700">{detail?.joinedAt ? new Date(detail.joinedAt).toLocaleTimeString("th-TH") : "—"}</p>
              <p className="text-xs text-neutral-500">เริ่มสอบ</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-neutral-700">{detail?.submittedAt ? new Date(detail.submittedAt).toLocaleTimeString("th-TH") : "—"}</p>
              <p className="text-xs text-neutral-500">ส่งข้อสอบ</p>
            </div>
          </div>

          {/* แท็บในโมดัล: ภาพรวม (สถิติ/ธง/รายหัวข้อ) กับ รายข้อ (คำตอบทีละข้อ) */}
          <div className="flex gap-1.5 mb-5 border-b border-neutral-200">
            {[
              ["overview", "ภาพรวม"],
              ["items", `รายข้อ${enrichedQuestions.length ? ` (${enrichedQuestions.length})` : ""}`],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setModalTab(key)}
                className={`px-3.5 py-2 text-xs font-bold transition border-b-2 -mb-px ${
                  modalTab === key
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── ธงคุณภาพข้อมูล ──────────────────────────────────────────────
              บอกว่า "คะแนนชุดนี้เชื่อถือได้แค่ไหน" ก่อนนำไปวางแผนสอนหรือคุยกับผู้ปกครอง
              ไม่ใช่ข้อสรุปว่าทุจริต — การสลับแอปอาจมาจากแจ้งเตือนเด้งหรือจอล็อกก็ได้ */}
          {modalTab === "overview" && student?.integrity && (student.integrity.leaveCount > 0 || student.integrity.copyCount > 0) ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-800 mb-1.5 flex items-center gap-1.5">
                <Flag className="h-4 w-4" /> ธงคุณภาพข้อมูล — ควรตรวจสอบก่อนใช้คะแนนนี้
              </p>
              <ul className="text-xs text-amber-700 leading-relaxed space-y-1">
                {student.integrity.leaveCount > 0 && (
                  <li>
                    • ออกจากหน้าสอบ {student.integrity.leaveCount} ครั้ง
                    {" "}(รวม {formatTime(student.integrity.leaveSeconds)} · นานสุด {formatTime(student.integrity.maxLeaveSeconds)})
                  </li>
                )}
                {student.integrity.copyCount > 0 && (
                  <li>• คัดลอกข้อความในหน้าสอบ {student.integrity.copyCount} ครั้ง (ข้อสอบเป็นปรนัย ปกติไม่มีเหตุต้องคัดลอก)</li>
                )}
              </ul>
              {/* ไทม์ไลน์รายเหตุการณ์ — เกิดอะไรขึ้นตอนไหน ระหว่างทำข้อไหน */}
              {detail?.integrityEvents?.length > 0 && (
                <div className="mt-3 border-t border-amber-200 pt-2.5">
                  <p className="text-[11px] font-bold text-amber-800 mb-1.5">
                    ไทม์ไลน์เหตุการณ์ ({detail.integrityEvents.length} ครั้ง)
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {detail.integrityEvents.map((ev, i) => {
                      const no = ev.questionId != null ? questionNoById.get(ev.questionId) : null;
                      return (
                        <div key={i} className="flex items-baseline gap-2 text-[11px] text-amber-700">
                          <span className="font-mono text-amber-500 flex-shrink-0">
                            {ev.occurredAt ? new Date(ev.occurredAt).toLocaleTimeString("th-TH") : "—"}
                          </span>
                          <span className="flex-1">
                            {ev.eventType === "leave" ? (
                              <>ออกจากหน้าสอบ {ev.durationSec != null ? formatTime(ev.durationSec) : "ไม่ทราบระยะเวลา"}</>
                            ) : (
                              <>คัดลอกข้อความ</>
                            )}
                            {no ? <span className="text-amber-500"> · ระหว่างทำข้อ {no}</span> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-amber-600 mt-2 leading-relaxed">
                นี่ไม่ใช่ข้อสรุปว่าทุจริต — การออกจากหน้าอาจเกิดจากการแจ้งเตือนเด้ง สายเข้า หรือจอล็อกก็ได้
                แนะนำให้ลองถามความเข้าใจของนักเรียนในคาบเรียนเพื่อยืนยันก่อนตัดสินใจอะไร
              </p>
            </div>
          ) : modalTab === "overview" && student?.submittedAt ? (
            <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700">
                ไม่พบพฤติกรรมที่ต้องตรวจสอบระหว่างสอบ — ไม่มีการออกจากหน้าสอบหรือคัดลอกข้อความ คะแนนชุดนี้ใช้อ้างอิงได้ตามปกติ
              </p>
            </div>
          ) : null}

          {modalTab === "overview" && topicBreakdown && (
            <div className="mb-6">
              <p className="text-sm font-bold text-neutral-800 mb-3">คะแนนรายหัวข้อ</p>
              <div className="space-y-2.5">
                {topicBreakdown.map((t) => (
                  <div key={t.category} className="flex items-center gap-3">
                    <p className="text-xs text-neutral-500 w-32 flex-shrink-0 truncate">{t.category}</p>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-orange-400" style={{ width: `${t.pct * 100}%` }} />
                    </div>
                    <p className="text-xs font-semibold text-neutral-700 w-24 text-right">{fmtScore(t.sc)}/{fmtScore(t.maxSc)} ({Math.round(t.pct * 100)}%)</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && <p className="text-sm text-neutral-400 text-center py-8">กำลังโหลด...</p>}
          {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}

          {modalTab === "items" && detail && !loading && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-neutral-800">รายข้อ</p>
                <p className="text-[11px] text-neutral-400">เขียว = ตอบถูก · แดง = ตอบผิด</p>
              </div>
              <div className="space-y-2.5">
                {enrichedQuestions.map((q, i) => (
                  <div key={q.id} className={`border rounded-xl p-3.5 ${q.isCorrect ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"}`}>
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="text-sm font-medium text-neutral-900 flex-1 leading-relaxed">
                        <span className={`inline-flex h-5 w-5 rounded-md items-center justify-center text-[11px] font-bold mr-2 align-text-bottom ${q.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{i + 1}</span>
                        {q.text}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {q.category && <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-md">{q.category}</span>}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {fmtScore(q.scoreAwarded)}/{fmtScore(q.score)}
                        </span>
                        <span className="text-xs font-mono text-neutral-500">{formatTime(q.totalSeconds)}</span>
                      </div>
                    </div>
                    <QuestionPeriods periods={q.periods} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// เปิดหน้าต่างใหม่พร้อม HTML ที่จัดหน้าไว้แล้ว แล้วเรียก window.print() — ผู้ใช้จะเห็น
// พรีวิวของเบราว์เซอร์ก่อนเสมอ (เลือก "บันทึกเป็น PDF" ในหน้าต่างพรีวิวนั้นได้เลย)
// รูปแบบเดียวกับ downloadPDF ใน TutorStudents.jsx / TutorIncome.jsx
const exportResultsPdf = (exam, results, courseName, subjectName) => {
  if (!results) return;

  const submitted = results.students.filter((s) => s.submittedAt && s.maxScore);
  const avgTimeList = results.students.filter((s) => s.submittedAt && s.secondsUsed != null);
  const avgTimeSec = avgTimeList.length
    ? Math.round(avgTimeList.reduce((sum, s) => sum + s.secondsUsed, 0) / avgTimeList.length)
    : null;
  const passedCount = submitted.filter((s) => (s.totalScore / s.maxScore) * 100 >= PASS_PCT).length;
  const passRatePct = submitted.length ? Math.round((passedCount / submitted.length) * 1000) / 10 : null;
  const joinedPct = results.enrolledCount ? Math.round((results.joinedCount / results.enrolledCount) * 100) : 0;
  const submittedPct = results.enrolledCount ? Math.round((results.submittedCount / results.enrolledCount) * 100) : 0;

  const ranked = [...results.students].sort((a, b) => {
    const pa = a.maxScore ? a.totalScore / a.maxScore : -1;
    const pb = b.maxScore ? b.totalScore / b.maxScore : -1;
    if (pb !== pa) return pb - pa;
    return (a.name || "").localeCompare(b.name || "", "th");
  });

  const studentRows = ranked.map((s, i) => {
    const pct = s.maxScore ? Math.round((s.totalScore / s.maxScore) * 100) : null;
    const passed = s.submittedAt && pct != null ? pct >= PASS_PCT : null;
    return `<tr>
      <td>${i + 1}</td>
      <td>${s.name}</td>
      <td>${s.joinedAt ? new Date(s.joinedAt).toLocaleString("th-TH") : "—"}</td>
      <td style="text-align:right">${pct != null ? `${s.totalScore}/${s.maxScore} (${pct}%)` : "—"}</td>
      <td style="text-align:center">${s.answeredCount ?? "—"} / ${s.unansweredCount ?? "—"}</td>
      <td style="text-align:right">${s.submittedAt && s.secondsUsed != null ? formatTime(s.secondsUsed) : "—"}</td>
      <td>${s.status || (s.submittedAt ? "ส่งข้อสอบแล้ว" : "กำลังทำ")}</td>
      <td style="text-align:center;${passed == null ? "" : passed ? "color:#16a34a" : "color:#dc2626"}">${passed == null ? "—" : passed ? "ผ่าน" : "ไม่ผ่าน"}</td>
    </tr>`;
  }).join("");

  const absentRows = (results.absentStudents || []).map((s) => `<tr><td>${s.name}</td></tr>`).join("");

  const printWindow = window.open("", "_blank");
  const today = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ผลสอบ - ${exam.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    <style>* { box-sizing:border-box;margin:0;padding:0; } body{font-family:'Sarabun',sans-serif;padding:32px;font-size:13px;color:#1f2937;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #f97316;padding-bottom:16px;}
    .header h1{font-size:22px;font-weight:700;color:#f97316;} .header p{font-size:12px;color:#6b7280;margin-top:4px;}
    .summary-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px;}
    .summary-card{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 14px;}
    .summary-card .label{font-size:11px;color:#9a3412;margin-bottom:4px;} .summary-card .value{font-size:16px;font-weight:700;color:#ea580c;}
    .summary-card .sub{font-size:10px;color:#9a3412;margin-top:2px;}
    h2{font-size:15px;font-weight:700;color:#1f2937;margin-bottom:10px;margin-top:24px;padding-left:10px;border-left:3px solid #f97316;}
    table{width:100%;border-collapse:collapse;margin-bottom:8px;} th{background:#f97316;color:white;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;}
    td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;} tr:nth-child(even) td{background:#fff7ed;}
    .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;}
    @media print{body{padding:16px;}}</style></head><body>
    <div class="header"><div><h1>ผลสอบ: ${exam.name}</h1><p>${courseName || ""}${subjectName ? ` · ${subjectName}` : ""} &nbsp;|&nbsp; ออกรายงานวันที่: ${today}</p></div></div>
    <div class="summary-grid">
      <div class="summary-card"><div class="label">เข้าสอบ</div><div class="value">${joinedPct}%</div><div class="sub">${results.joinedCount} จาก ${results.enrolledCount} คน</div></div>
      <div class="summary-card"><div class="label">ส่งแล้ว</div><div class="value">${submittedPct}%</div><div class="sub">${results.submittedCount} จาก ${results.enrolledCount} คน</div></div>
      <div class="summary-card"><div class="label">คะแนนเฉลี่ย</div><div class="value">${results.averageScorePct}%</div></div>
      <div class="summary-card"><div class="label">ผ่านเกณฑ์</div><div class="value">${passRatePct != null ? `${passRatePct}%` : "—"}</div></div>
      <div class="summary-card"><div class="label">เวลาเฉลี่ย</div><div class="value">${avgTimeSec != null ? formatTime(avgTimeSec) : "—"}</div></div>
    </div>
    <h2>รายชื่อนักเรียน</h2>
    <table><thead><tr><th>อันดับ</th><th>ชื่อ</th><th>เข้าสอบเมื่อ</th><th style="text-align:right">คะแนน</th><th style="text-align:center">ตอบ/ไม่ตอบ</th><th style="text-align:right">เวลาที่ใช้</th><th>สถานะ</th><th style="text-align:center">ผล</th></tr></thead>
    <tbody>${studentRows}</tbody></table>
    ${absentRows ? `<h2>นักเรียนที่ขาดสอบ (${results.absentStudents.length} คน)</h2><table><tbody>${absentRows}</tbody></table>` : ""}
    <div class="footer">ออกรายงานโดยระบบจัดการติวเตอร์ &nbsp;|&nbsp; ${today}</div>
    <script>window.onload = () => window.print();</script></body></html>`);
  printWindow.document.close();
};

// ─── Results Tab ─────────────────────────────────────────────────────────────
function ResultsTab({ exam, courseId, subjectId, courseName, subjectName }) {
  const status = deriveStatus(exam);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remainingSec, setRemainingSec] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPass, setFilterPass] = useState("ทั้งหมด");
  const [sortKey, setSortKey] = useState("rank");
  const [sortDir, setSortDir] = useState(1);

  // ปิดตัวนับเวลาถอยหลังแบบเรียลไทม์ไว้ก่อนตามที่ขอ — ไม่จำเป็นต้องอัปเดตทุกวินาที
  // remainingSec เลยค้างเป็น null ตลอด ทำให้คอลัมน์ "เวลาที่ใช้" ของคนที่ยังทำไม่เสร็จ
  // โชว์ "—" เฉยๆ แทน จะกลับมาเปิดใช้ก็แค่เอาคอมเมนต์ block นี้ออก
  // useEffect(() => {
  //   if (!results?.examStartedAt || results?.durationMinutes == null) { setRemainingSec(null); return; }
  //   const deadline = new Date(results.examStartedAt).getTime() + results.durationMinutes * 60 * 1000;
  //   const tick = () => setRemainingSec(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
  //   tick();
  //   const iv = setInterval(tick, 1000);
  //   return () => clearInterval(iv);
  // }, [results?.examStartedAt, results?.durationMinutes]);

  useEffect(() => {
    if (status !== "closed" && status !== "active") return;
    let cancelled = false;

    const load = (showSpinner) => {
      if (showSpinner) setLoading(true);
      fetchExamResults(exam.id)
        .then((data) => { if (!cancelled) setResults(data); })
        .catch((err) => { console.error("Fetch results failed:", err); if (!cancelled) setError("โหลดผลสอบไม่สำเร็จ"); })
        .finally(() => { if (!cancelled && showSpinner) setLoading(false); });
    };

    load(true); // ครั้งแรกโชว์ spinner

    // active = สอบยังไม่จบ ต้อง poll สด, closed = ข้อมูลนิ่งแล้ว fetch ครั้งเดียวพอ
    if (status !== "active") return () => { cancelled = true; };
    const iv = setInterval(() => load(false), 5000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [exam.id, status]);

  // อันดับต้องยึดคะแนนเป็นหลักเสมอ (มาก → น้อย, เท่ากันใช้ชื่อ) และคำนวณจาก
  // ชุดข้อมูลหลัง search/filter เท่านั้น — ห้ามใช้ index ดิบของ array ทั้งหมด
  // ไม่งั้นอันดับจะผิดเมื่อ filter เหลือนักเรียนบางส่วน
  // อันดับนี้จะ "ไม่" เปลี่ยนตาม sortKey ที่ผู้ใช้เลือกดูอยู่ (เช่น sort ตามชื่อ)
  // เพราะอันดับควรสื่อถึงลำดับคะแนนจริงเสมอ ไม่ใช่ลำดับที่กำลังแสดงผลอยู่
  const rankedStudents = useMemo(() => {
    const students = results?.students || [];
    let base = students;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      base = base.filter((s) => s.name?.toLowerCase().includes(q));
    }
    if (filterPass === "ผ่าน" || filterPass === "ไม่ผ่าน") {
      base = base.filter((s) => {
        if (!s.submittedAt || !s.maxScore) return false;
        const isPass = (s.totalScore / s.maxScore) * 100 >= PASS_PCT;
        return filterPass === "ผ่าน" ? isPass : !isPass;
      });
    }
    const byScore = [...base].sort((a, b) => {
      const pa = a.maxScore ? a.totalScore / a.maxScore : -1;
      const pb = b.maxScore ? b.totalScore / b.maxScore : -1;
      if (pb !== pa) return pb - pa;
      return (a.name || "").localeCompare(b.name || "", "th");
    });
    return byScore.map((s, i) => ({ ...s, rank: i + 1 }));
  }, [results, search, filterPass]);

  const displayedStudents = useMemo(() => {
    const arr = [...rankedStudents];
    const dir = sortDir;
    const cmp = (a, b) => {
      let res = 0;
      if (sortKey === "name") res = (a.name || "").localeCompare(b.name || "", "th");
      else if (sortKey === "score") {
        const pa = a.maxScore ? a.totalScore / a.maxScore : -1;
        const pb = b.maxScore ? b.totalScore / b.maxScore : -1;
        res = pa - pb;
      } else if (sortKey === "time") {
        const ta = a.secondsUsed ?? -1;
        const tb = b.secondsUsed ?? -1;
        res = ta - tb;
      } else {
        res = a.rank - b.rank; // "rank" = ลำดับคะแนนตามธรรมชาติ
      }
      if (res !== 0) return dir * res;
      return (a.name || "").localeCompare(b.name || "", "th");
    };
    return arr.sort(cmp);
  }, [rankedStudents, sortKey, sortDir]);

  // รายชื่อคนขาดสอบ (กรองด้วยช่องค้นหาเดียวกัน) — ใช้ตอนกดแท็บ "ขาดสอบ" ในแถบ ทั้งหมด/ผ่าน/ไม่ผ่าน
  const filteredAbsent = useMemo(() => {
    const list = results?.absentStudents || [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((s) => s.name?.toLowerCase().includes(q));
  }, [results, search]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d * -1);
    else { setSortKey(key); setSortDir(key === "name" ? 1 : -1); }
  };
  const SortIcon = ({ k }) => (sortKey === k ? <span className="ml-0.5 text-orange-500">{sortDir === 1 ? "▲" : "▼"}</span> : null);

  // ค่าเฉลี่ยต้องคำนวณจากนักเรียนที่มีค่าจริงเท่านั้น — คนที่ยังสอบไม่เสร็จ
  // หรือ secondsUsed เป็น null ต้องไม่ถูกนำมารวมจนค่าเฉลี่ยผิดเพี้ยน
  const submittedWithTime = (results?.students || []).filter((s) => s.submittedAt && s.secondsUsed != null);
  const avgTimeSec = submittedWithTime.length
    ? Math.round(submittedWithTime.reduce((sum, s) => sum + s.secondsUsed, 0) / submittedWithTime.length)
    : null;
  const passEligible = (results?.students || []).filter((s) => s.submittedAt && s.maxScore);
  const passedCount = passEligible.filter((s) => (s.totalScore / s.maxScore) * 100 >= PASS_PCT).length;
  const passRatePct = passEligible.length ? Math.round((passedCount / passEligible.length) * 1000) / 10 : null;
  const joinedPct = results?.enrolledCount ? Math.round((results.joinedCount / results.enrolledCount) * 100) : 0;
  const submittedPct = results?.enrolledCount ? Math.round((results.submittedCount / results.enrolledCount) * 100) : 0;
  const avgScoreRaw = passEligible.length
    ? passEligible.reduce((sum, s) => sum + s.totalScore, 0) / passEligible.length
    : null;
  const examMaxScore = passEligible.length ? passEligible[0].maxScore : (results?.students?.[0]?.maxScore ?? null);

  if (status !== "closed" && status !== "active") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 rounded-2xl">
        <BarChart2 className="h-10 w-10 text-neutral-300 mb-3" />
        <p className="text-sm font-semibold text-neutral-500">ยังไม่มีผลสอบ</p>
        <p className="text-xs text-neutral-400 mt-1">ผลจะแสดงหลังเปิดสอบ</p>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-neutral-400">กำลังโหลดผลสอบ...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!results) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={Users}
          label="เข้าสอบ"
          value={`${joinedPct}%`}
          sub={`${results.joinedCount} จาก ${results.enrolledCount} คน`}
          color="bg-blue-500"
        />
        <StatCard
          icon={Check}
          label="ส่งแล้ว"
          value={`${submittedPct}%`}
          sub={`${results.submittedCount} จาก ${results.enrolledCount} คน`}
          color="bg-teal-500"
        />
        <StatCard
          icon={Award}
          label="คะแนนเฉลี่ย"
          value={`${results.averageScorePct}%`}
          sub={avgScoreRaw != null ? `${avgScoreRaw.toFixed(1)} / ${examMaxScore} คะแนน` : "ยังไม่มีคนส่ง"}
          color="bg-orange-500"
        />
        <StatCard
          icon={CheckCircle}
          label="ผ่านเกณฑ์"
          value={passRatePct != null ? `${passRatePct}%` : "—"}
          sub={passRatePct != null ? `${passedCount} จาก ${passEligible.length} คน` : "ยังไม่มีคนส่ง"}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Clock}
          label="เวลาเฉลี่ย"
          value={avgTimeSec != null ? `${formatTime(avgTimeSec)} น.` : "—"}
          sub="ต่อคน"
          color="bg-amber-500"
        />
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหานักเรียน..."
              className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex rounded-xl overflow-hidden border border-neutral-200 flex-shrink-0">
            {["ทั้งหมด", "ผ่าน", "ไม่ผ่าน", "ขาดสอบ"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterPass(f)}
                className={`px-3 py-2 text-xs font-bold transition ${filterPass === f ? "bg-orange-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}
              >
                {f}{f === "ขาดสอบ" && results.absentStudents?.length ? ` (${results.absentStudents.length})` : ""}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportResultsPdf(exam, results, courseName, subjectName)}
            disabled={!results.students?.length}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-2 pl-1">
          {filterPass === "ขาดสอบ"
            ? <>แสดง {filteredAbsent.length} จาก {results.absentStudents?.length ?? 0} คน</>
            : <>แสดง {displayedStudents.length} จาก {results.students.length} คน</>}
        </p>
      </div>

      {/* Table */}
      {filterPass === "ขาดสอบ" ? (
        filteredAbsent.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-neutral-200">
            <p className="text-sm text-neutral-500 font-medium">{search.trim() ? "ไม่พบนักเรียนที่ค้นหา" : "ไม่มีนักเรียนที่ขาดสอบ"}</p>
          </div>
        ) : (
          <div className="border border-neutral-100 rounded-xl overflow-hidden bg-white divide-y divide-neutral-50">
            {filteredAbsent.map((s) => (
              <div key={s.userId} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <UserX className="h-4 w-4 text-red-400" />
                </div>
                <p className="text-sm font-medium text-neutral-700 flex-1">{s.name}</p>
                <span className="text-xs font-medium text-red-500">ขาดสอบ</span>
              </div>
            ))}
          </div>
        )
      ) : displayedStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-neutral-200">
          <p className="text-sm text-neutral-500 font-medium">ไม่พบนักเรียนที่ค้นหา</p>
        </div>
      ) : (
        <div className="border border-neutral-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  {[
                    ["rank", "อันดับ"],
                    ["name", "ชื่อนักเรียน"],
                    [null, "เข้าสอบเมื่อ"],
                    ["score", "คะแนน"],
                    [null, "ตอบ/ไม่ตอบ"],
                    ["time", "เวลาที่ใช้"],
                    [null, "สถานะ"],
                    [null, "ผล"],
                    [null, ""],
                  ].map(([k, label]) => (
                    <th
                      key={label}
                      onClick={k ? () => handleSort(k) : undefined}
                      className={`text-left text-xs font-semibold text-neutral-500 px-4 py-2.5 whitespace-nowrap ${k ? "cursor-pointer hover:text-neutral-700 select-none" : ""}`}
                    >
                      {label}{k && <SortIcon k={k} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedStudents.map((s) => {
                  const pct = s.maxScore ? Math.round((s.totalScore / s.maxScore) * 100) : null;
                  const passed = s.submittedAt && pct != null ? pct >= PASS_PCT : null;
                  return (
                    <tr key={s.examJoinId} className="border-b border-neutral-50 hover:bg-neutral-50 transition">
                      <td className="px-4 py-3">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${s.rank === 1 ? "bg-amber-400 text-white" : s.rank === 2 ? "bg-neutral-400 text-white" : s.rank === 3 ? "bg-amber-700 text-white" : "bg-neutral-100 text-neutral-500"}`}>{s.rank}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-800">{s.name}</td>
                      <td className="px-4 py-3 text-neutral-500">{s.joinedAt ? new Date(s.joinedAt).toLocaleString("th-TH") : "—"}</td>
                      <td className="px-4 py-3">
                        {pct != null ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? "#22c55e" : pct >= 60 ? "#f97316" : "#ef4444" }} />
                              </div>
                              <span className="font-semibold text-neutral-700">{pct}%</span>
                            </div>
                            <p className="text-neutral-400 mt-0.5 text-xs">{fmtScore(s.totalScore)}/{fmtScore(s.maxScore)}</p>
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><Check className="h-3 w-3" />{s.answeredCount ?? "—"}</span>
                        <span className="text-neutral-300 mx-1">/</span>
                        <span className="inline-flex items-center gap-1 text-neutral-400 font-semibold"><X className="h-3 w-3" />{s.unansweredCount ?? "—"}</span>
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs ${!s.submittedAt && remainingSec != null ? "text-orange-600 font-semibold" : "text-neutral-500"}`}>
                        {s.submittedAt
                          ? (s.secondsUsed != null ? formatTime(s.secondsUsed) : "—")
                          : (remainingSec != null ? `เหลือ ${formatTime(remainingSec)}` : "—")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${s.submittedAt ? "text-green-700" : "text-neutral-400"}`}>{s.status || (s.submittedAt ? "ส่งข้อสอบแล้ว" : "กำลังทำ")}</span>
                        {/* ธงคุณภาพข้อมูล — เตือนให้ตรวจสอบก่อนเชื่อตัวเลข ไม่ใช่การกล่าวหา (ดูรายละเอียดในหน้า "ดูผล") */}
                        {(s.integrity?.leaveCount > 0 || s.integrity?.copyCount > 0) && (
                          <span
                            title="มีพฤติกรรมที่ควรตรวจสอบก่อนใช้คะแนนนี้ — กด 'ดูผล' เพื่อดูรายละเอียด"
                            className="ml-1.5 inline-flex items-center gap-1 align-middle text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5"
                          >
                            <Flag className="h-2.5 w-2.5" /> ตรวจซ้ำ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {passed == null ? (
                          <span className="text-xs text-neutral-300">—</span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${passed ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-600 border-red-200"}`}>
                            {passed ? "✓ ผ่าน" : "✗ ไม่ผ่าน"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.submittedAt && (
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition ml-auto"
                          >
                            <Eye className="h-3.5 w-3.5" /> ดูผล
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.students.length > 0 && (
        <div className="flex justify-end">
          <Link
            to={`/tutor/exam-analytics?${new URLSearchParams({
              courseId: courseId || "",
              subjectId: subjectId || "",
              courseName,
              subjectName,
              examType: exam.type,
              // บอกหน้า analytics ว่าเข้ามาจากหน้ารอบสอบ เพื่อให้ breadcrumb แทรกชั้นรอบสอบ
              // ไว้ให้กดกลับมาหน้านี้ได้ (แทนปุ่ม "ย้อนกลับ" ที่เอาออกไปแล้ว)
              from: "exam-detail",
            }).toString()}`}
            className="text-sm text-orange-500 hover:text-orange-700 font-semibold"
          >
            ดูวิเคราะห์เชิงลึก
          </Link>
        </div>
      )}

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          examJoinId={selectedStudent.examJoinId}
          examName={exam.name}
          examQuestions={exam.questions}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TutorExamDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const courseId = searchParams.get("courseId");
  const subjectId = searchParams.get("subjectId");
  const courseName = searchParams.get("courseName") || "";
  const subjectName = searchParams.get("subjectName") || "";
  const examId = searchParams.get("examId");

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("questions");
  const { toasts, showToast, removeToast } = useToast();

  const reload = useCallback(async () => {
    if (!examId) return;
    try {
      const data = await fetchExamDetail(examId);
      setExam(data);
      setLoadError("");
    } catch (err) {
      console.error("Fetch exam detail failed:", err);
      setLoadError("โหลดข้อมูลการสอบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { setLoading(true); reload(); }, [reload]);

  const backToExamList = () => {
    const params = new URLSearchParams({ courseId: courseId || "", subjectId: subjectId || "", courseName, subjectName });
    navigate(`/tutor/exam?${params.toString()}`);
  };

  if (loading) {
    return <div className="mt-[90px] text-center py-16 text-sm text-neutral-400">กำลังโหลดข้อมูลการสอบ...</div>;
  }

  if (loadError || !exam) {
    return (
      <div className="mt-[90px] text-center py-16">
        <p className="text-sm text-neutral-500">{loadError || "ไม่พบข้อมูลการสอบนี้"}</p>
        <button onClick={backToExamList} className="mt-3 text-sm text-orange-600 font-semibold hover:underline">← กลับไปหน้ารายการสอบ</button>
      </div>
    );
  }

  const meta = EXAM_TYPES.find((t) => t.value === exam.type);
  const status = deriveStatus(exam);
  const sb = STATUS_BADGE[status];

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm flex-wrap gap-y-1">
        <Link to="/tutor/courses" className="font-medium text-gray-500 hover:text-orange-600 transition">คอร์ส</Link>
        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
        <button onClick={backToExamList} className="font-medium text-gray-500 hover:text-orange-600 transition">{subjectName || "จัดการการสอบ"}</button>
        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-800">{exam.name}</span>
      </div>

      {/* Exam header */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className={TYPE_BADGE[exam.type]}>{meta?.label}</Badge>
              <Badge className={sb.cls}>
                {status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                {sb.label}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-neutral-900">{exam.name}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{courseName} {subjectName ? `• ${subjectName}` : ""}</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600"><FileQuestion className="h-4 w-4 text-neutral-400" />{exam.questions?.length || 0} ข้อ</div>
            <div className="flex items-center gap-2 text-sm text-neutral-600"><Clock className="h-4 w-4 text-neutral-400" />{exam.settings?.duration || 0} นาที</div>
            {exam.settings?.date && <div className="flex items-center gap-2 text-sm text-neutral-600"><Calendar className="h-4 w-4 text-neutral-400" />{exam.settings.date}</div>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${active ? "border-orange-500 text-orange-600" : "border-transparent text-neutral-500 hover:text-neutral-700"}`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div>
        {tab === "questions" && (
          <QuestionsTab
            examId={exam.id}
            subjectId={subjectId}
            adminId={JSON.parse(localStorage.getItem("user") || "null")?.id}
            questions={exam.questions || []}
            status={status}
            onChanged={reload}
          />
        )}
        {tab === "preview" && (
          <PreviewTab exam={exam} goToQuestions={() => setTab("questions")} />
        )}
        {tab === "manage" && (
          <ManageExamTab
            exam={exam}
            onSaved={reload}
            showToast={showToast}
            onOpen={async () => { await openExamSession(exam.id); await reload(); }}
            onReopen={async () => { await openExamSession(exam.id); await reload(); }}
            onClose={async () => { await closeExamSession(exam.id); await reload(); }}
          />
        )}
        {tab === "results" && (
          <ResultsTab exam={exam} courseId={courseId} subjectId={subjectId} courseName={courseName} subjectName={subjectName} />
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}