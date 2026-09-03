import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronRight, ChevronLeft, FileQuestion, Clock, Calendar, Users,
  Plus, Pencil, Upload, Zap, Check, X, AlertCircle, Info, Trash2,
  Download, FileSpreadsheet, Play, StopCircle,
  Settings as SettingsIcon, Eye, BarChart2,
} from "lucide-react";

import {
  EXAM_TYPES, TYPE_BADGE, STATUS_BADGE, LEVEL_BADGE, LEVEL_COLOR,
  deriveStatus, isExamReady, formatTime,
  downloadXlsxTemplate, parseXlsx, emptyQuestion,
  fetchExamDetail, updateExamSettings, addQuestions, updateQuestion, deleteQuestion,
  openExamSession, closeExamSession, fetchExamResults, fetchExamJoinDetail,
} from "../utils/examShared";

// ─── small shared bits ───────────────────────────────────────────────────────

function Badge({ className, children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

const TABS = [
  { key: "questions", label: "ข้อสอบ", icon: FileQuestion },
  { key: "settings", label: "ตั้งค่าข้อสอบ", icon: SettingsIcon },
  { key: "preview", label: "ดูตัวอย่างข้อสอบ", icon: Eye },
  { key: "session", label: "เปิด/ปิดสอบ", icon: Play },
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

// Single-question form — reused for both "add new" (loops, one POST per save)
// and "edit existing" (one PUT per save). Every save is a real API round trip.
function QuestionFormPanel({ initial, saving, error, onSave, onClose, saveLabel }) {
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
          <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
            <button onClick={() => patch({ score: Math.max(1, q.score - 1) })} className="px-3 py-2 text-neutral-500 hover:bg-neutral-50 text-sm font-bold">−</button>
            <span className="flex-1 text-center text-sm font-semibold text-neutral-800">{q.score}</span>
            <button onClick={() => patch({ score: q.score + 1 })} className="px-3 py-2 text-neutral-500 hover:bg-neutral-50 text-sm font-bold">+</button>
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
          <input type="text" value={q.category} onChange={(e) => patch({ category: e.target.value })} placeholder="เช่น พีชคณิต" className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
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

function ExcelImportFlow({ examId, onCancel, onImported }) {
  const [step, setStep] = useState(1); // 1 upload, 2 preview
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

function QuestionsTab({ examId, questions, status, onChanged }) {
  const locked = status === "active";
  const [mode, setMode] = useState(null); // null | "picker" | "manual" | "excel"
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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
        {!editingId && !locked && (
          <button onClick={() => setMode(mode ? null : "picker")} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition">
            <Plus className="h-4 w-4" /> เพิ่มข้อสอบ
          </button>
        )}
      </div>

      {locked && (
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">การสอบนี้กำลังเปิดอยู่ — เพิ่ม/ลบ/แก้ไขข้อสอบไม่ได้จนกว่าจะปิดสอบ (ไปที่แท็บ "เปิด/ปิดสอบ")</p>
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
        />
      )}

      {mode === "excel" && (
        <ExcelImportFlow examId={examId} onCancel={() => setMode(null)} onImported={async () => { await onChanged(); setMode(null); }} />
      )}

      {editingId && (
        <QuestionFormPanel
          initial={editingQuestion}
          saving={saving}
          error={formError}
          saveLabel="บันทึกการแก้ไข"
          onSave={handleEditSave}
          onClose={() => { setEditingId(null); setFormError(""); }}
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
                  <td className="px-4 py-3 text-neutral-500">{q.score}</td>
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

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsTab({ examId, settings, onSaved }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { totalQuestions: Number(form.totalQuestions), duration: Number(form.duration), date: form.date || null };
      await updateExamSettings(examId, payload);
      await onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save settings failed:", err);
      setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">Exam Settings คุมภาพรวมของการสอบเท่านั้น (จำนวนข้อเป้าหมาย / เวลา / วันสอบ) — ส่วนโจทย์แต่ละข้อแก้ไขได้ที่แท็บ Questions</p>
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
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button onClick={handleSave} disabled={saving} className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${saved ? "bg-green-50 border border-green-300 text-green-700" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
        {saving ? "กำลังบันทึก…" : saved ? <><Check className="h-4 w-4" /> บันทึกแล้ว</> : "บันทึกการตั้งค่า"}
      </button>
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

function SessionTab({ exam, onOpen, onReopen, onClose }) {
  const [opening, setOpening] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [live, setLive] = useState(null);
  const [remainingSec, setRemainingSec] = useState(null);
  const status = deriveStatus(exam);
  const ready = isExamReady(exam);

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

  // ── closed: offer "เปิดสอบใหม่" (reset + reopen), with a clear warning ──
  if (status === "closed") {
    return (
      <div className="max-w-md mx-auto text-center py-10 space-y-4">
        <div className="h-14 w-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
          <StopCircle className="h-6 w-6 text-neutral-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-800">การสอบนี้ปิดแล้ว</p>
          <p className="text-xs text-neutral-500 mt-1">ผลสอบรอบที่ผ่านมาดูได้ที่แท็บ Results / Analytics</p>
        </div>

        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
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
    );
  }

  // ── inactive: first-time open, nothing to reset ──
  if (status !== "active") {
    return (
      <div className="max-w-md mx-auto text-center py-10 space-y-4">
        <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
          <Play className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-800">พร้อมเปิดสอบ {exam.name} หรือยัง?</p>
          <p className="text-xs text-neutral-500 mt-1">นักเรียนที่ enroll ในคอร์สนี้จะกด "เข้าสอบ" จากหน้าคอร์สของตัวเองได้ทันทีหลังเปิด</p>
        </div>
        {!ready && (
          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">ข้อสอบยังไม่พร้อม — ตรวจสอบที่แท็บ Preview ก่อนเปิดสอบ</p>
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
    );
  }

  // ── active ──
  const joined = live?.joinedCount ?? 0;
  const enrolled = live?.enrolledCount ?? 0;
  const pct = enrolled ? Math.round((joined / enrolled) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto space-y-5">
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
  );
}

function StudentDetailModal({ examJoinId, onClose }) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-neutral-800">{detail?.studentName || "รายละเอียดการทำข้อสอบ"}</p>
            {detail && <p className="text-xs text-neutral-400 mt-0.5">{detail.examName}</p>}
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400"><X className="h-4 w-4" /></button>
        </div>

        {loading && <p className="text-sm text-neutral-400 text-center py-8">กำลังโหลด...</p>}
        {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}

        {detail && !loading && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div className="bg-neutral-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-orange-600">{detail.totalScore}/{detail.maxScore}</p>
                <p className="text-xs text-neutral-500">คะแนน</p>
              </div>
              <div className="bg-neutral-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-neutral-700">{detail.joinedAt ? new Date(detail.joinedAt).toLocaleTimeString("th-TH") : "—"}</p>
                <p className="text-xs text-neutral-500">เริ่มสอบ</p>
              </div>
              <div className="bg-neutral-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-neutral-700">{detail.submittedAt ? new Date(detail.submittedAt).toLocaleTimeString("th-TH") : "—"}</p>
                <p className="text-xs text-neutral-500">ส่งข้อสอบ</p>
              </div>
            </div>

            {detail.questions.map((q, i) => (
              <div key={q.id} className={`border rounded-xl p-3.5 ${q.isCorrect ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"}`}>
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <p className="text-sm font-medium text-neutral-900 flex-1"><span className="text-neutral-400 font-bold mr-1.5">{i + 1}.</span>{q.text}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {q.scoreAwarded}/{q.score}
                    </span>
                    <span className="text-xs font-mono text-neutral-500">{formatTime(q.totalSeconds)}</span>
                  </div>
                </div>
                {q.periods?.length > 1 && (
                  <div className="pl-5 mt-1 space-y-0.5">
                    {q.periods.map((p, pi) => (
                      <p key={pi} className="text-[11px] text-neutral-400">
                        ครั้งที่ {pi + 1}: {formatTime(p.seconds)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Results Tab ─────────────────────────────────────────────────────────────
function ResultsTab({ exam }) {
  const status = deriveStatus(exam);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailJoinId, setDetailJoinId] = useState(null);
  const [remainingSec, setRemainingSec] = useState(null);

  useEffect(() => {
    if (!results?.examStartedAt || results?.durationMinutes == null) { setRemainingSec(null); return; }
    const deadline = new Date(results.examStartedAt).getTime() + results.durationMinutes * 60 * 1000;
    const tick = () => setRemainingSec(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [results?.examStartedAt, results?.durationMinutes]);

  useEffect(() => {
    if (status !== "closed" && status !== "active") return;
    let cancelled = false;
    setLoading(true);
    fetchExamResults(exam.id)
      .then((data) => { if (!cancelled) setResults(data); })
      .catch((err) => { console.error("Fetch results failed:", err); if (!cancelled) setError("โหลดผลสอบไม่สำเร็จ"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [exam.id, status]);

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
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "เข้าสอบ", val: results.joinedCount, color: "text-green-600" },
          { label: "นักเรียนในคอร์ส", val: results.enrolledCount, color: "text-neutral-700" },
          { label: "ส่งแล้ว", val: results.submittedCount, color: "text-neutral-900" },
          { label: "คะแนนเฉลี่ย", val: `${results.averageScorePct}%`, color: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-50 rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-neutral-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              {["#", "ชื่อนักเรียน", "เข้าสอบเมื่อ", "คะแนน", "ตอบ/ไม่ตอบ", "เวลาที่ใช้", "สถานะ", ""].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.students.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-neutral-400 text-sm">ยังไม่มีนักเรียนเข้าสอบ</td></tr>
            )}
            {results.students.map((s, i) => {
              const pct = s.maxScore ? Math.round((s.totalScore / s.maxScore) * 100) : null;
              const scoreCls = pct >= 80 ? "bg-green-100 text-green-700" : pct >= 60 ? "bg-amber-100 text-amber-700" : pct != null ? "bg-red-100 text-red-700" : "";
              return (
                <tr key={s.examJoinId} className="border-b border-neutral-50">
                  <td className="px-4 py-3 text-neutral-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-neutral-800">{s.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{s.joinedAt ? new Date(s.joinedAt).toLocaleString("th-TH") : "—"}</td>
                  <td className="px-4 py-3">{pct != null ? <Badge className={scoreCls}>{s.totalScore}/{s.maxScore} ({pct}%)</Badge> : "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">{s.answeredCount ?? "—"}/{s.unansweredCount ?? "—"}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${!s.submittedAt && remainingSec != null ? "text-orange-600 font-semibold" : "text-neutral-500"}`}>
                    {s.submittedAt
                      ? (s.secondsUsed != null ? formatTime(s.secondsUsed) : "—")
                      : (remainingSec != null ? `เหลือ ${formatTime(remainingSec)}` : "—")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${s.submittedAt ? "text-green-700" : "text-neutral-400"}`}>{s.status || (s.submittedAt ? "ส่งข้อสอบแล้ว" : "กำลังทำ")}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.submittedAt && (
                      <button onClick={() => setDetailJoinId(s.examJoinId)} className="text-xs text-orange-500 hover:text-orange-700 font-medium">ดูรายละเอียด</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {detailJoinId && (
        <StudentDetailModal examJoinId={detailJoinId} onClose={() => setDetailJoinId(null)} />
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
          <QuestionsTab examId={exam.id} questions={exam.questions || []} status={status} onChanged={reload} />
        )}
        {tab === "settings" && (
          <SettingsTab examId={exam.id} settings={exam.settings} onSaved={reload} />
        )}
        {tab === "preview" && (
          <PreviewTab exam={exam} goToQuestions={() => setTab("questions")} />
        )}
        {tab === "session" && (
          <SessionTab
            exam={exam}
            onOpen={async () => { await openExamSession(exam.id); await reload(); }}
            onReopen={async () => { await openExamSession(exam.id); await reload(); }}
            onClose={async () => { await closeExamSession(exam.id); await reload(); }}
          />
        )}
        {tab === "results" && <ResultsTab exam={exam} />}
      </div>
    </div>
  );
}