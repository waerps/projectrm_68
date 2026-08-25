import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ChevronRight, ChevronLeft, FileQuestion, Clock, Calendar, Users,
  Plus, Pencil, Upload, Zap, Check, X, AlertCircle, Info, Trash2,
  Download, FileSpreadsheet, QrCode, Copy, Play, StopCircle, Search,
  ListChecks, Settings as SettingsIcon, Eye, BarChart2,
} from "lucide-react";

import {
  EXAM_TYPES, TYPE_BADGE, STATUS_BADGE, LEVEL_BADGE, LEVEL_COLOR,
  MOCK_STUDENTS, deriveStatus, isExamReady, generateSessionId, formatTime,
  downloadXlsxTemplate, parseXlsx, emptyQuestion,
  getExam, saveExam,
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
  { key: "questions", label: "Questions", icon: FileQuestion },
  { key: "settings", label: "Exam Settings", icon: SettingsIcon },
  { key: "preview", label: "Preview", icon: Eye },
  { key: "session", label: "Exam Session", icon: QrCode },
  { key: "results", label: "Results / Analytics", icon: BarChart2 },
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

function ManualEditor({ questions, onChange, onDone }) {
  const [list, setList] = useState(questions.length > 0 ? questions : [emptyQuestion()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const current = list[activeIdx];

  const patchCurrent = (patch) => setList((prev) => prev.map((q, i) => (i === activeIdx ? { ...q, ...patch } : q)));
  const patchOption = (optIdx, val) => { const opts = [...current.options]; opts[optIdx] = val; patchCurrent({ options: opts }); };
  const isComplete = (q) => q.text.trim() && q.options.every((o) => o.trim()) && q.correct !== null;
  const addQuestion = () => { setList((prev) => [...prev, emptyQuestion()]); setActiveIdx(list.length); };
  const deleteQuestion = () => {
    if (list.length === 1) { setList([emptyQuestion()]); return; }
    const next = list.filter((_, i) => i !== activeIdx);
    setList(next);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
  };

  const completedCount = list.filter(isComplete).length;

  return (
    <div className="border border-neutral-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-neutral-50/60">
        <p className="text-sm font-semibold text-neutral-700">{completedCount}/{list.length} ข้อสมบูรณ์</p>
        <div className="flex gap-2">
          <button onClick={() => onDone(list.filter(isComplete))} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition">
            บันทึกและเสร็จสิ้น ({completedCount} ข้อ)
          </button>
          <button onClick={() => onChange(null)} className="h-9 w-9 rounded-xl hover:bg-neutral-100 flex items-center justify-center text-neutral-400 transition"><X className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="flex">
        <aside className="w-52 flex-shrink-0 border-r border-neutral-100 bg-neutral-50/40">
          <div className="p-3 border-b border-neutral-100">
            <button onClick={addQuestion} className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 text-xs font-semibold transition">
              <Plus className="h-3.5 w-3.5" /> เพิ่มข้อใหม่
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2 space-y-1">
            {list.map((q, i) => {
              const done = isComplete(q);
              const isActive = i === activeIdx;
              return (
                <button key={q.id} onClick={() => setActiveIdx(i)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${isActive ? "bg-orange-500 text-white shadow-sm" : "hover:bg-white text-neutral-700"}`}>
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isActive ? "bg-white/20 text-white" : done ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"}`}>{i + 1}</span>
                  <p className={`text-xs font-medium truncate ${isActive ? "text-white" : "text-neutral-700"}`}>{q.text ? q.text.slice(0, 24) + (q.text.length > 24 ? "…" : "") : "ยังไม่มีโจทย์"}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-700">ข้อที่ {activeIdx + 1} / {list.length}</span>
            <button onClick={deleteQuestion} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"><Trash2 className="h-3.5 w-3.5" /> ลบข้อนี้</button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">โจทย์</label>
            <textarea value={current.text} onChange={(e) => patchCurrent({ text: e.target.value })} placeholder="พิมพ์โจทย์ข้อสอบที่นี่…" rows={3} className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
          </div>

          <div className="space-y-2.5">
            {OPTION_LABELS.map((label, optIdx) => {
              const isCorrect = current.correct === optIdx;
              return (
                <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition ${isCorrect ? "border-green-400 bg-green-50" : "border-neutral-200 bg-white"}`}>
                  <button onClick={() => patchCurrent({ correct: isCorrect ? null : optIdx })} className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${isCorrect ? "border-green-500 bg-green-500" : "border-neutral-300 hover:border-green-400"}`}>
                    {isCorrect && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? "bg-green-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>{label}</span>
                  <input type="text" value={current.options[optIdx]} onChange={(e) => patchOption(optIdx, e.target.value)} placeholder={`ตัวเลือก ${label}`} className="flex-1 text-sm bg-transparent border-none outline-none text-neutral-800" />
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">คะแนน</label>
              <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
                <button onClick={() => patchCurrent({ score: Math.max(1, current.score - 1) })} className="px-3 py-2 text-neutral-500 hover:bg-neutral-50 text-sm font-bold">−</button>
                <span className="flex-1 text-center text-sm font-semibold text-neutral-800">{current.score}</span>
                <button onClick={() => patchCurrent({ score: current.score + 1 })} className="px-3 py-2 text-neutral-500 hover:bg-neutral-50 text-sm font-bold">+</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Difficulty</label>
              <div className="flex gap-1">
                {["ง่าย", "ปานกลาง", "ยาก"].map((lv) => (
                  <button key={lv} onClick={() => patchCurrent({ level: lv })} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${current.level === lv ? LEVEL_BADGE[lv] + " border-transparent" : "border-neutral-200 text-neutral-500"}`}>{lv}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Category</label>
              <input type="text" value={current.category} onChange={(e) => patchCurrent({ category: e.target.value })} placeholder="เช่น พีชคณิต" className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ExcelImportFlow({ onCancel, onConfirm }) {
  const [step, setStep] = useState(1); // 1 upload, 2 preview, 3 done
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
                    <p className="text-[10px] text-neutral-400">{q.level} {q.category && `· ${q.category}`}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-neutral-500 hover:text-neutral-700 font-medium">← อัปโหลดไฟล์อื่น</button>
            <button onClick={() => onConfirm(rows)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition">ยืนยันนำเข้า {rows.length} ข้อ</button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsTab({ exam, onUpdateQuestions }) {
  const [mode, setMode] = useState(null); // null | "picker" | "manual" | "excel"
  const questions = exam.questions || [];

  if (mode === "manual") {
    return <ManualEditor questions={questions} onChange={setMode} onDone={(qs) => { onUpdateQuestions(qs); setMode(null); }} />;
  }
  if (mode === "excel") {
    return <ExcelImportFlow onCancel={() => setMode(null)} onConfirm={(rows) => { onUpdateQuestions([...questions, ...rows]); setMode(null); }} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{questions.length} ข้อในชุดข้อสอบนี้</p>
        <button onClick={() => setMode("picker")} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition">
          <Plus className="h-4 w-4" /> เพิ่มข้อสอบ
        </button>
      </div>

      {mode === "picker" && (
        <div className="border border-neutral-200 rounded-2xl p-5 relative">
          <button onClick={() => setMode(null)} className="absolute top-3 right-3 h-8 w-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400"><X className="h-4 w-4" /></button>
          <p className="text-sm font-semibold text-neutral-800 mb-3">เลือกวิธีเพิ่มข้อสอบ</p>
          <AddMethodPicker onPick={setMode} />
        </div>
      )}

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 rounded-2xl">
          <FileQuestion className="h-10 w-10 text-neutral-300 mb-3" />
          <p className="text-sm font-semibold text-neutral-500">ยังไม่มีข้อสอบในชุดนี้</p>
          <p className="text-xs text-neutral-400 mt-1">กด “เพิ่มข้อสอบ” เพื่อเริ่มต้น</p>
        </div>
      ) : (
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
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onUpdateQuestions(questions.filter((x) => x.id !== q.id))} className="text-xs text-red-400 hover:text-red-600 font-medium">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsTab({ exam, onSave }) {
  const [form, setForm] = useState(exam.settings || { totalQuestions: 0, duration: 60, date: "" });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ ...form, totalQuestions: Number(form.totalQuestions), duration: Number(form.duration) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

      <button onClick={handleSave} className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${saved ? "bg-green-50 border border-green-300 text-green-700" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
        {saved ? <><Check className="h-4 w-4" /> บันทึกแล้ว</> : "บันทึกการตั้งค่า"}
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
      </div>
    </div>
  );
}

// ─── Session Tab ─────────────────────────────────────────────────────────────

function SessionTab({ exam, onOpen, onClose }) {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [timer, setTimer] = useState(0);
  const [copied, setCopied] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const status = deriveStatus(exam);
  const ready = isExamReady(exam);

  useEffect(() => {
    if (status !== "active") return;
    const iv = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [status]);

  useEffect(() => {
    if (status !== "active") return;
    const iv = setInterval(() => {
      setStudents((prev) => {
        const waiting = prev.filter((s) => s.status === "not-joined");
        if (waiting.length > 0 && Math.random() > 0.55) {
          const pick = waiting[Math.floor(Math.random() * waiting.length)];
          return prev.map((s) => (s.id === pick.id ? { ...s, status: "joined", joinedAt: new Date().toLocaleTimeString("th-TH") } : s));
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [status]);

  const joined = students.filter((s) => s.status === "joined").length;
  const url = exam.sessionId ? `https://exam.sornserm.com/t/${exam.sessionId}` : "";

  if (status === "closed") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 rounded-2xl">
        <StopCircle className="h-10 w-10 text-neutral-300 mb-3" />
        <p className="text-sm font-semibold text-neutral-500">การสอบนี้ปิดแล้ว</p>
        <p className="text-xs text-neutral-400 mt-1">ดูผลได้ที่แท็บ Results / Analytics</p>
      </div>
    );
  }

  if (status !== "active") {
    return (
      <div className="max-w-md mx-auto text-center py-10 space-y-4">
        <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
          <Play className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-800">พร้อมเปิด Exam Session ของ {exam.name} หรือยัง?</p>
          <p className="text-xs text-neutral-500 mt-1">การกดเปิดสอบจะสร้าง Session ID และ QR Code ใหม่ ไม่ใช่การสร้าง Exam ใหม่</p>
        </div>
        {!ready && (
          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">ข้อสอบยังไม่พร้อม — ตรวจสอบที่แท็บ Preview ก่อนเปิดสอบ</p>
          </div>
        )}
        <button
          onClick={() => onOpen()}
          disabled={!ready}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition"
        >
          <Play className="h-4 w-4" /> เปิด Exam Session
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="border border-neutral-200 rounded-2xl p-5 text-center space-y-3">
          <div className="flex justify-center">
            <div className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-4">
              <QrCode className="h-28 w-28 text-neutral-300" />
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl p-3">
            <p className="text-xs text-neutral-500 mb-1">Session ID</p>
            <p className="text-xl font-mono font-bold tracking-widest text-orange-600">{exam.sessionId}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition"
          >
            {copied ? <><Check className="h-4 w-4" /> คัดลอกแล้ว!</> : <><Copy className="h-4 w-4" /> คัดลอกลิงก์เข้าสอบ</>}
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-600">{joined}</p>
              <p className="text-xs text-neutral-500 mt-0.5">เข้าสอบแล้ว</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-500">{students.length - joined}</p>
              <p className="text-xs text-neutral-500 mt-0.5">ยังไม่เข้า</p>
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs text-neutral-500">เวลาที่ผ่านไป</span>
            <span className="text-lg font-mono font-semibold text-neutral-800">{formatTime(timer)}</span>
          </div>
          <button onClick={() => setConfirmClose(true)} className="w-full flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl py-2.5 text-sm font-semibold transition">
            <StopCircle className="h-4 w-4" /> ปิดสอบ
          </button>
        </div>
      </div>

      {confirmClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmClose(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><AlertCircle className="h-7 w-7 text-red-600" /></div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">ยืนยันการปิดสอบ?</h3>
              <p className="text-sm text-neutral-500">นักเรียนจะเข้าสอบผ่าน QR/ลิงก์นี้ไม่ได้อีก</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClose(false)} className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-semibold text-neutral-700">ยกเลิก</button>
              <button onClick={() => { onClose(); setConfirmClose(false); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold">ปิดสอบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Results Tab ─────────────────────────────────────────────────────────────

function ResultsTab({ exam }) {
  const status = deriveStatus(exam);
  if (status !== "closed" && status !== "active") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 rounded-2xl">
        <BarChart2 className="h-10 w-10 text-neutral-300 mb-3" />
        <p className="text-sm font-semibold text-neutral-500">ยังไม่มีผลสอบ</p>
        <p className="text-xs text-neutral-400 mt-1">ผลจะแสดงหลังเปิดสอบ</p>
      </div>
    );
  }

  const students = MOCK_STUDENTS.map((s, i) => ({ ...s, status: i < 18 ? "joined" : "not-joined" }));
  const totalQ = exam.questions?.length || exam.settings?.totalQuestions || 30;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "เข้าสอบ", val: 18, color: "text-green-600" },
          { label: "ไม่เข้าสอบ", val: 6, color: "text-red-500" },
          { label: "ส่งแล้ว", val: 15, color: "text-neutral-900" },
          { label: "คะแนนเฉลี่ย", val: "72%", color: "text-orange-600" },
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
              {["#", "ชื่อนักเรียน", "คะแนน", "สถานะ"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const score = s.status === "joined" ? Math.floor(Math.random() * (totalQ * 0.4)) + Math.floor(totalQ * 0.5) : null;
              const pct = score ? Math.round((score / totalQ) * 100) : null;
              const scoreCls = pct >= 80 ? "bg-green-100 text-green-700" : pct >= 60 ? "bg-amber-100 text-amber-700" : pct ? "bg-red-100 text-red-700" : "";
              return (
                <tr key={s.id} className="border-b border-neutral-50">
                  <td className="px-4 py-3 text-neutral-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-neutral-800">{s.name}</td>
                  <td className="px-4 py-3">{score ? <Badge className={scoreCls}>{score}/{totalQ} ({pct}%)</Badge> : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${s.status === "joined" ? "text-green-700" : "text-neutral-400"}`}>{s.status === "joined" ? "เข้าสอบแล้ว" : "ไม่เข้าสอบ"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
  const [tab, setTab] = useState("questions");

  useEffect(() => {
    setExam(getExam(courseId, subjectId, examId));
  }, [courseId, subjectId, examId]);

  const persist = (nextExam) => {
    setExam(nextExam);
    saveExam(courseId, subjectId, nextExam);
  };

  const backToExamList = () => {
    const params = new URLSearchParams({ courseId: courseId || "", subjectId: subjectId || "", courseName, subjectName });
    navigate(`/tutor/exam?${params.toString()}`);
  };

  if (!exam) {
    return (
      <div className="mt-[90px] text-center py-16">
        <p className="text-sm text-neutral-500">ไม่พบข้อมูลการสอบนี้</p>
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
          <QuestionsTab exam={exam} onUpdateQuestions={(qs) => persist({ ...exam, questions: qs })} />
        )}
        {tab === "settings" && (
          <SettingsTab exam={exam} onSave={(settings) => persist({ ...exam, settings })} />
        )}
        {tab === "preview" && (
          <PreviewTab exam={exam} goToQuestions={() => setTab("questions")} />
        )}
        {tab === "session" && (
          <SessionTab
            exam={exam}
            onOpen={() => persist({ ...exam, status: "active", sessionId: generateSessionId(), startTime: new Date().toISOString() })}
            onClose={() => persist({ ...exam, status: "closed" })}
          />
        )}
        {tab === "results" && <ResultsTab exam={exam} />}
      </div>
    </div>
  );
}