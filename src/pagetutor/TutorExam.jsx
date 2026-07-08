import { useState, useEffect, useRef } from "react";
import {
  BookOpen, Users, Clock, QrCode, Copy, X, Check,
  AlertCircle, Play, StopCircle, ChevronRight, Database,
  Plus, Upload, Pencil, Zap, Info, Eye, ChevronDown,
  Trash2, ChevronLeft, GripVertical, ListChecks, FileQuestion,
  Download, FileSpreadsheet, Search, BookMarked, BarChart2, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

// ─── helpers ────────────────────────────────────────────────────────────────

const generateSessionId = () =>
  Math.random().toString(36).substring(2, 9).toUpperCase();

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

const EXAM_TYPES = [
  { value: "pre-test", label: "Pre-test", sub: "สอบก่อนเรียน", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-400" },
  { value: "mid-test", label: "Mid-test", sub: "สอบกลางเทอม", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-400" },
  { value: "post-test", label: "Post-test", sub: "สอบหลังเรียน", color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-400" },
];

const TYPE_BADGE = {
  "pre-test": "bg-blue-50  text-blue-700",
  "mid-test": "bg-amber-50 text-amber-700",
  "post-test": "bg-pink-50  text-pink-700",
};

const STATUS_BADGE = {
  inactive: { cls: "bg-neutral-100 text-neutral-600", label: "ยังไม่เปิด" },
  active: { cls: "bg-green-100  text-green-700", label: "กำลังเปิดสอบ" },
  closed: { cls: "bg-neutral-100 text-neutral-500", label: "ปิดแล้ว" },
};

const LEVEL_BADGE = {
  ง่าย: "bg-green-100 text-green-700",
  ปานกลาง: "bg-amber-100 text-amber-700",
  ยาก: "bg-red-100   text-red-700",
};

const LEVEL_COLOR = {
  ง่าย: { dot: "bg-green-400", text: "text-green-700", pill: "bg-green-50 text-green-700 border-green-200" },
  ปานกลาง: { dot: "bg-amber-400", text: "text-amber-700", pill: "bg-amber-50 text-amber-700 border-amber-200" },
  ยาก: { dot: "bg-red-400", text: "text-red-700", pill: "bg-red-50 text-red-700 border-red-200" },
};

const MOCK_STUDENTS = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: `นักเรียน ${i + 1}`,
  status: "not-joined",
  joinedAt: null,
}));

const MOCK_BANK = [
  { id: 1, question: "ถ้า x² − 5x + 6 = 0 แล้ว x มีค่าเท่ากับเท่าไร", category: "พีชคณิต", level: "ง่าย", used: 3 },
  { id: 2, question: "หาค่า sin 30° + cos 60°", category: "ตรีโกณมิติ", level: "ง่าย", used: 5 },
  { id: 3, question: "พื้นที่วงกลมรัศมี 7 ซม. เท่ากับเท่าไร (π = 22/7)", category: "เรขาคณิต", level: "ปานกลาง", used: 2 },
  { id: 4, question: "ถ้า log₂ 8 = x แล้ว x = ?", category: "ลอการิทึม", level: "ยาก", used: 1 },
  { id: 5, question: "ลำดับเลขคณิต 2, 5, 8, 11 … พจน์ที่ 20 คือเท่าไร", category: "ลำดับและอนุกรม", level: "ปานกลาง", used: 4 },
];

// ─── xlsx template download ──────────────────────────────────────────────────

const downloadXlsxTemplate = () => {
  const headers = ["question","option_a","option_b","option_c","option_d","correct_answer","score","level","category"];
  const sample = [
    { question: "ถ้า x² − 5x + 6 = 0 แล้ว x มีค่าเท่ากับเท่าไร", option_a: "x = 1 หรือ x = 6", option_b: "x = 2 หรือ x = 3", option_c: "x = −2 หรือ x = −3", option_d: "x = 0 หรือ x = 5", correct_answer: "B", score: 1, level: "ง่าย", category: "พีชคณิต" },
    { question: "หาค่า sin 30° + cos 60°", option_a: "0", option_b: "0.5", option_c: "1", option_d: "√2", correct_answer: "C", score: 2, level: "ปานกลาง", category: "ตรีโกณมิติ" },
  ];
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...sample.map((r) => headers.map((h) => r[h]))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [{ wch: 60 },{ wch: 28 },{ wch: 28 },{ wch: 28 },{ wch: 28 },{ wch: 16 },{ wch: 8 },{ wch: 12 },{ wch: 18 }];
  const instr = [
    ["📋 คำอธิบาย Template ข้อสอบ"],[],
    ["คอลัมน์","คำอธิบาย","ค่าที่รองรับ","บังคับ?"],
    ["question","โจทย์ข้อสอบ","ข้อความ (รองรับ LaTeX เช่น $x^2$)","✅ บังคับ"],
    ["option_a","ตัวเลือก A","ข้อความ","✅ บังคับ"],
    ["option_b","ตัวเลือก B","ข้อความ","✅ บังคับ"],
    ["option_c","ตัวเลือก C","ข้อความ","✅ บังคับ"],
    ["option_d","ตัวเลือก D","ข้อความ","✅ บังคับ"],
    ["correct_answer","เฉลย","A, B, C หรือ D (ตัวพิมพ์ใหญ่)","✅ บังคับ"],
    ["score","คะแนนต่อข้อ","ตัวเลข เช่น 1, 2, 3 …","ไม่บังคับ (default = 1)"],
    ["level","ระดับความยาก","ง่าย / ปานกลาง / ยาก","ไม่บังคับ (default = ปานกลาง)"],
    ["category","หมวดหมู่","ข้อความใดก็ได้ เช่น พีชคณิต","ไม่บังคับ"],
    [],[],["• ห้ามลบแถวหัวตาราง"],["• correct_answer ต้องเป็น A B C D เท่านั้น"],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(instr);
  ws2["!cols"] = [{ wch: 20 },{ wch: 40 },{ wch: 36 },{ wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.utils.book_append_sheet(wb, ws2, "คำอธิบาย");
  XLSX.writeFile(wb, "exam_template.xlsx");
};

// ─── parse uploaded xlsx ─────────────────────────────────────────────────────

const parseXlsx = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const OPTION_MAP = { A: 0, B: 1, C: 2, D: 3 };
        const parsed = rows
          .filter((r) => r.question && r.option_a)
          .map((r, i) => ({
            id: Date.now() + i,
            text: String(r.question || ""),
            options: [String(r.option_a || ""), String(r.option_b || ""), String(r.option_c || ""), String(r.option_d || "")],
            correct: OPTION_MAP[String(r.correct_answer || "").toUpperCase()] ?? null,
            score: Number(r.score) || 1,
            level: ["ง่าย","ปานกลาง","ยาก"].includes(r.level) ? r.level : "ปานกลาง",
            category: String(r.category || ""),
          }));
        resolve(parsed);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

// ─── sub-components ─────────────────────────────────────────────────────────

function Badge({ className, children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function IconBtn({ onClick, className = "", children, title }) {
  return (
    <button onClick={onClick} title={title} className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${className}`}>
      {children}
    </button>
  );
}

function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center mb-6">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i + 1 === current ? "bg-orange-500 text-white" : i + 1 < current ? "bg-green-500 text-white" : "bg-neutral-200 text-neutral-500"}`}>
              {i + 1 < current ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i + 1 === current ? "text-neutral-900" : "text-neutral-400"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`mx-3 h-px w-8 ${i + 1 < current ? "bg-green-400" : "bg-neutral-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function Modal({ show, onClose, title, subtitle, children, maxWidth = "max-w-2xl" }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start p-6 border-b border-neutral-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
            {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          <IconBtn onClick={onClose} className="hover:bg-neutral-100 text-neutral-500">
            <X className="h-5 w-5" />
          </IconBtn>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Add Exam Modal ──────────────────────────────────────────────────────────

function AddExamModal({ show, onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", type: "mid-test", addMethod: "manual", totalQuestions: 30, duration: 90, date: "" });
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const reset = () => {
    setStep(1);
    setForm({ name: "", type: "mid-test", addMethod: "manual", totalQuestions: 30, duration: 90, date: "" });
    setUploadedQuestions([]);
    setUploadError("");
  };
  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const qs = await parseXlsx(file);
      if (qs.length === 0) throw new Error("ไม่พบข้อสอบในไฟล์ — ตรวจสอบ format ให้ตรงกับ Template");
      setUploadedQuestions(qs);
    } catch (err) {
      setUploadError(err.message || "ไฟล์ผิดพลาด กรุณาใช้ Template ที่ดาวน์โหลดมา");
    } finally { setUploading(false); }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleFileChange({ target: { files: [file] } });
  };

  const handleSubmit = () => {
    const questions = form.addMethod === "upload" ? uploadedQuestions : [];
    onAdd({
      ...form,
      totalQuestions: form.addMethod === "upload" && questions.length > 0 ? questions.length : Number(form.totalQuestions),
      duration: Number(form.duration),
      questions,
    });
    reset();
    onClose();
  };

  const canProceed = step === 1
    ? form.name.trim()
    : step === 2 ? form.addMethod === "manual" || uploadedQuestions.length > 0 : true;

  return (
    <Modal show={show} onClose={handleClose} title="เพิ่มการสอบใหม่" maxWidth="max-w-xl">
      <div className="p-6">
        <StepIndicator current={step} steps={["ข้อมูลพื้นฐาน", "ชุดข้อสอบ", "ตั้งค่า"]} />

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ชื่อการสอบ <span className="text-orange-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น Mid-test บทที่ 2 — สมการเชิงเส้น" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">ประเภทการสอบ</label>
              <div className="grid grid-cols-3 gap-3">
                {EXAM_TYPES.map((t) => (
                  <button key={t.value} onClick={() => setForm({ ...form, type: t.value })} className={`border-2 rounded-xl p-3 text-center transition ${form.type === t.value ? `${t.border} ${t.bg}` : "border-neutral-200 hover:border-neutral-300"}`}>
                    <p className={`text-sm font-semibold ${form.type === t.value ? t.color : "text-neutral-700"}`}>{t.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{t.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500 mb-4">เลือกวิธีเพิ่มชุดข้อสอบ</p>
            <div className="relative border-2 border-neutral-200 rounded-xl p-4 opacity-50 bg-neutral-50 cursor-not-allowed select-none">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0"><Zap className="h-4 w-4 text-amber-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-700">สุ่มจากคลังกลาง (n8n workflow)</p>
                  <p className="text-xs text-neutral-500 mt-0.5">ระบบ randomize อัตโนมัติ — นักเรียนแต่ละคนได้ข้อไม่ซ้ำกัน</p>
                </div>
              </div>
              <span className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">🔧 เร็วๆ นี้</span>
            </div>

            <div onClick={() => setForm({ ...form, addMethod: "manual" })} className={`border-2 rounded-xl p-4 cursor-pointer transition ${form.addMethod === "manual" ? "border-orange-400 bg-orange-50" : "border-neutral-200 hover:border-neutral-300"}`}>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0"><Pencil className="h-4 w-4 text-orange-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">พิมพ์ข้อสอบเอง</p>
                  <p className="text-xs text-neutral-500 mt-0.5">เพิ่มทีละข้อผ่าน editor — ระบุโจทย์ ตัวเลือก และเฉลยได้ทันที</p>
                </div>
              </div>
              {form.addMethod === "manual" && (
                <div className="flex gap-2 bg-orange-50 border border-orange-100 rounded-xl p-3 mt-3">
                  <Info className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700 leading-relaxed">หลังกด <strong>สร้างการสอบ</strong> ระบบจะเปิดหน้าเพิ่มข้อสอบให้ทันที</p>
                </div>
              )}
            </div>

            <div onClick={() => setForm({ ...form, addMethod: "upload" })} className={`border-2 rounded-xl p-4 cursor-pointer transition ${form.addMethod === "upload" ? "border-orange-400 bg-orange-50" : "border-neutral-200 hover:border-neutral-300"}`}>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0"><Upload className="h-4 w-4 text-orange-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">อัปโหลดไฟล์ .xlsx / .csv</p>
                  <p className="text-xs text-neutral-500 mt-0.5">นำเข้าข้อสอบจากไฟล์ Excel ได้ครั้งละหลายข้อ</p>
                </div>
              </div>
              {form.addMethod === "upload" && (
                <div className="mt-3 space-y-3">
                  <button onClick={(e) => { e.stopPropagation(); downloadXlsxTemplate(); }} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-green-300 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl py-2.5 text-xs font-semibold transition">
                    <Download className="h-3.5 w-3.5" /> ดาวน์โหลด Template (.xlsx)
                  </button>
                  <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer ${uploadedQuestions.length > 0 ? "border-green-400 bg-green-50" : "border-neutral-200 bg-white hover:border-orange-300"}`}>
                    {uploading ? <p className="text-xs text-neutral-500 animate-pulse">กำลังอ่านไฟล์…</p>
                      : uploadedQuestions.length > 0 ? (
                        <div className="flex items-center justify-center gap-2 text-green-700">
                          <Check className="h-5 w-5" />
                          <p className="text-sm font-semibold">โหลดสำเร็จ — {uploadedQuestions.length} ข้อ</p>
                        </div>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-7 w-7 text-neutral-300 mx-auto mb-1.5" />
                          <p className="text-xs text-neutral-500">ลากไฟล์มาวางที่นี่ หรือ</p>
                          <p className="text-xs text-orange-500 font-medium mt-0.5">คลิกเพื่อเลือกไฟล์</p>
                          <p className="text-[10px] text-neutral-400 mt-1">รองรับ .xlsx, .xls, .csv</p>
                        </>
                      )}
                  </div>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} onClick={(e) => e.stopPropagation()} />
                  {uploadError && (
                    <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{uploadError}</p>
                    </div>
                  )}
                  {uploadedQuestions.length > 0 && (
                    <div className="bg-white border border-neutral-100 rounded-xl p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-neutral-700">ตัวอย่างข้อที่นำเข้า</p>
                      {uploadedQuestions.slice(0, 3).map((q, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          <p className="text-xs text-neutral-600 truncate">{q.text}</p>
                        </div>
                      ))}
                      {uploadedQuestions.length > 3 && <p className="text-[10px] text-neutral-400 pl-7">และอีก {uploadedQuestions.length - 3} ข้อ…</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">จำนวนข้อสอบ</label>
                <input type="number" value={form.addMethod === "upload" && uploadedQuestions.length > 0 ? uploadedQuestions.length : form.totalQuestions} disabled={form.addMethod === "upload" && uploadedQuestions.length > 0} onChange={(e) => setForm({ ...form, totalQuestions: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-neutral-50 disabled:text-neutral-500" />
                {form.addMethod === "upload" && uploadedQuestions.length > 0 && <p className="text-[10px] text-neutral-400 mt-1">คำนวณจากไฟล์ที่อัปโหลดอัตโนมัติ</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">ระยะเวลาสอบ (นาที)</label>
                <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">วันที่กำหนดสอบ (ไม่บังคับ)</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">QR Code และ Session ID ใหม่จะถูกสร้างทุกครั้งที่กด <strong>เปิดสอบ</strong></p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center p-6 border-t border-neutral-100 flex-shrink-0">
        <button onClick={() => step > 1 ? setStep(step - 1) : handleClose()} className="text-sm text-neutral-500 hover:text-neutral-700 font-medium">
          {step > 1 ? "← ย้อนกลับ" : "ยกเลิก"}
        </button>
        <button onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()} disabled={!canProceed} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition">
          {step === 3 ? (form.addMethod === "manual" ? "สร้างและเพิ่มข้อสอบ →" : "สร้างการสอบ ✓") : "ถัดไป →"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Question Bank Modal ─────────────────────────────────────────────────────

function QuestionBankModal({ show, onClose }) {
  const [questions, setQuestions] = useState(MOCK_BANK);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQ, setNewQ] = useState({ question: "", category: "", level: "ง่าย" });

  const handleAddQ = () => {
    if (!newQ.question.trim()) return;
    setQuestions([...questions, { id: questions.length + 1, ...newQ, used: 0 }]);
    setNewQ({ question: "", category: "", level: "ง่าย" });
    setShowAddForm(false);
  };

  return (
    <Modal show={show} onClose={onClose} title="คลังข้อสอบ" subtitle={`ทั้งหมด ${questions.length} ข้อ`} maxWidth="max-w-3xl">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-xs text-amber-700">เมื่อ n8n workflow พร้อม ระบบจะสุ่มข้อจากคลังนี้ให้อัตโนมัติ</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadXlsxTemplate} className="flex items-center gap-1.5 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl px-3 py-2 text-xs font-medium">
              <Download className="h-3.5 w-3.5" /> Template .xlsx
            </button>
            <button className="flex items-center gap-1.5 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
              <Upload className="h-3.5 w-3.5" /> อัปโหลด .xlsx
            </button>
            <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3 py-2 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> เพิ่มข้อ
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="border-2 border-orange-200 rounded-xl p-4 bg-orange-50 space-y-3">
            <p className="text-sm font-semibold text-neutral-800">เพิ่มข้อสอบใหม่</p>
            <textarea value={newQ.question} onChange={(e) => setNewQ({ ...newQ, question: e.target.value })} placeholder="พิมพ์โจทย์ข้อสอบ..." rows={2} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
            <div className="flex gap-2">
              <input value={newQ.category} onChange={(e) => setNewQ({ ...newQ, category: e.target.value })} placeholder="หมวดหมู่ เช่น พีชคณิต" className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              <select value={newQ.level} onChange={(e) => setNewQ({ ...newQ, level: e.target.value })} className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option>ง่าย</option><option>ปานกลาง</option><option>ยาก</option>
              </select>
              <button onClick={handleAddQ} className="bg-orange-500 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-orange-600">บันทึก</button>
              <button onClick={() => setShowAddForm(false)} className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-white">ยกเลิก</button>
            </div>
          </div>
        )}

        <div className="border border-neutral-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                {["#","โจทย์","หมวด","ระดับ","ใช้แล้ว",""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition">
                  <td className="px-4 py-3 text-neutral-400">{q.id}</td>
                  <td className="px-4 py-3 text-neutral-800 max-w-[280px] truncate">{q.question}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{q.category}</span></td>
                  <td className="px-4 py-3"><Badge className={LEVEL_BADGE[q.level]}>{q.level}</Badge></td>
                  <td className="px-4 py-3 text-neutral-500">{q.used} ครั้ง</td>
                  <td className="px-4 py-3"><button className="text-xs text-neutral-400 hover:text-orange-500 font-medium">แก้ไข</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

// ─── QR / Session Modal ──────────────────────────────────────────────────────

function QRModal({ show, onClose, exam }) {
  const [copied, setCopied] = useState(false);
  if (!exam) return null;
  const url = `https://exam.sornserm.com/t/${exam.sessionId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal show={show} onClose={onClose} title={`QR Code — ${exam.name}`} subtitle="กำลังเปิดสอบ" maxWidth="max-w-md">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
          <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-600">Session ID ใหม่ถูกสร้างทุกครั้งที่เปิดสอบ</p>
        </div>
        <div className="flex justify-center">
          <div className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-5">
            <div className="h-52 w-52 flex items-center justify-center">
              <QrCode className="h-32 w-32 text-neutral-300" />
            </div>
          </div>
        </div>
        <div className="bg-neutral-50 rounded-xl p-3 text-center">
          <p className="text-xs text-neutral-500 mb-1">Session ID</p>
          <p className="text-2xl font-mono font-bold tracking-widest text-orange-600">{exam.sessionId}</p>
        </div>
        <div className="bg-neutral-50 rounded-xl p-3">
          <p className="text-xs text-neutral-500 mb-1">ลิงก์เข้าสอบ</p>
          <p className="text-sm font-mono text-neutral-800 break-all">{url}</p>
        </div>
        <button onClick={handleCopy} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition">
          {copied ? <><Check className="h-4 w-4" />คัดลอกแล้ว!</> : <><Copy className="h-4 w-4" />คัดลอก URL</>}
        </button>
      </div>
    </Modal>
  );
}

// ─── Student Detail Modal ────────────────────────────────────────────────────
// รวม "รายละเอียด" + "Live stats" เป็น modal เดียว

function DetailModal({ show, onClose, exam, students }) {
  if (!exam) return null;
  const joined = students.filter((s) => s.status === "joined").length;
  const total = students.length;

  return (
    <Modal
      show={show} onClose={onClose}
      title={`${exam.name}`}
      subtitle={`${exam.fullName} • ${exam.totalQuestions} ข้อ / ${exam.duration} นาที${exam.sessionId ? ` • Session: ${exam.sessionId}` : ""}`}
      maxWidth="max-w-4xl"
    >
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "เข้าสอบแล้ว", val: joined, color: "text-green-600" },
            { label: "ยังไม่เข้า", val: total - joined, color: "text-red-500" },
            { label: "ส่งแล้ว", val: Math.floor(joined * 0.7), color: "text-neutral-900" },
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
                {["#","ชื่อนักเรียน","เริ่มสอบ","ส่งข้อสอบ","ใช้เวลา","คะแนน","สถานะ"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const score = s.status === "joined" ? Math.floor(Math.random() * 11) + 20 : null;
                const pct = score ? Math.round((score / exam.totalQuestions) * 100) : null;
                const scoreCls = pct >= 80 ? "bg-green-100 text-green-700" : pct >= 60 ? "bg-amber-100 text-amber-700" : pct ? "bg-red-100 text-red-700" : "";
                return (
                  <tr key={s.id} className={`border-b border-neutral-50 transition ${s.status === "joined" ? "bg-green-50/40" : ""}`}>
                    <td className="px-4 py-3 text-neutral-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{s.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{s.joinedAt || "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{s.status === "joined" ? "10:15" : "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{s.status === "joined" ? "73 นาที" : "—"}</td>
                    <td className="px-4 py-3">{score ? <Badge className={scoreCls}>{score}/{exam.totalQuestions} ({pct}%)</Badge> : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.status === "joined" ? "text-green-700" : "text-neutral-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.status === "joined" ? "bg-green-500" : "bg-neutral-300"}`} />
                        {s.status === "joined" ? "เข้าแล้ว" : "ยังไม่เข้า"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

// ─── Confirm Close Modal ─────────────────────────────────────────────────────

function ConfirmCloseModal({ show, onClose, onConfirm, examName }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-1">ยืนยันการปิดสอบ?</h3>
          <p className="text-sm text-neutral-500"><strong>{examName}</strong> จะถูกปิดทันที นักเรียนจะเข้าสอบผ่าน QR/ลิงก์นี้ไม่ได้อีก</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold transition">ปิดสอบ</button>
        </div>
      </div>
    </div>
  );
}

// ─── Exam Preview Modal ──────────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"];
const OPTION_COLORS = ["bg-blue-50 border-blue-200 text-blue-800","bg-violet-50 border-violet-200 text-violet-800","bg-amber-50 border-amber-200 text-amber-800","bg-pink-50 border-pink-200 text-pink-800"];

function ExamPreviewModal({ show, onClose, exam, onEdit }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [filterLevel, setFilterLevel] = useState("ทั้งหมด");
  const [showCorrect, setShowCorrect] = useState(false);
  const [search, setSearch] = useState("");

  if (!show || !exam) return null;

  const questions = exam.questions || [];
  const filtered = questions.filter((q) => {
    const matchLevel = filterLevel === "ทั้งหมด" || q.level === filterLevel;
    const matchSearch = !search || q.text.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });
  const current = filtered[activeIdx] || null;
  const totalScore = questions.reduce((s, q) => s + (q.score || 1), 0);
  const issues = questions.filter((q) => !q.text?.trim() || q.options?.some((o) => !o.trim()) || q.correct === null);
  const levelStats = ["ง่าย","ปานกลาง","ยาก"].map((lv) => ({ level: lv, count: questions.filter((q) => q.level === lv).length }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0 bg-neutral-50/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <BookMarked className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 leading-tight">ตัวอย่างข้อสอบ</h2>
              <p className="text-xs text-neutral-400 mt-0.5">{exam.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {issues.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">{issues.length} ข้อมีปัญหา</span>
              </div>
            )}
            {issues.length === 0 && questions.length > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs font-semibold text-green-700">ข้อสอบพร้อมเปิดสอบ</span>
              </div>
            )}
            <button onClick={onClose} className="h-9 w-9 rounded-xl hover:bg-neutral-100 flex items-center justify-center text-neutral-400 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 flex-shrink-0 border-r border-neutral-100 flex flex-col bg-neutral-50/40">
            <div className="p-4 border-b border-neutral-100 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl border border-neutral-100 p-3 text-center">
                  <p className="text-xl font-bold text-orange-600">{questions.length}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">ข้อทั้งหมด</p>
                </div>
                <div className="bg-white rounded-xl border border-neutral-100 p-3 text-center">
                  <p className="text-xl font-bold text-neutral-800">{totalScore}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">คะแนนรวม</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {levelStats.map(({ level, count }) => (
                  <div key={level} className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${LEVEL_COLOR[level]?.dot}`} />
                    <span className="text-xs text-neutral-600 w-16">{level}</span>
                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${LEVEL_COLOR[level]?.dot}`} style={{ width: questions.length ? `${(count / questions.length) * 100}%` : "0%" }} />
                    </div>
                    <span className="text-xs text-neutral-500 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowCorrect((v) => !v)} className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold border transition ${showCorrect ? "bg-green-500 text-white border-green-500" : "bg-white border-neutral-200 text-neutral-700 hover:border-green-300"}`}>
                <Check className="h-3.5 w-3.5" />
                {showCorrect ? "ซ่อนเฉลย" : "แสดงเฉลย"}
              </button>
            </div>
            <div className="p-3 border-b border-neutral-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setActiveIdx(0); }} placeholder="ค้นหาโจทย์…" className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {["ทั้งหมด","ง่าย","ปานกลาง","ยาก"].map((lv) => (
                  <button key={lv} onClick={() => { setFilterLevel(lv); setActiveIdx(0); }} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${filterLevel === lv ? "bg-orange-500 text-white border-orange-500" : "bg-white border-neutral-200 text-neutral-600 hover:border-orange-200"}`}>{lv}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 && <p className="text-xs text-neutral-400 text-center py-6">ไม่พบข้อสอบ</p>}
              {filtered.map((q, i) => {
                const hasIssue = !q.text?.trim() || q.options?.some((o) => !o.trim()) || q.correct === null;
                const isActive = i === activeIdx;
                const origIdx = questions.indexOf(q);
                return (
                  <button key={q.id} onClick={() => setActiveIdx(i)} className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${isActive ? "bg-orange-500 text-white shadow-sm" : "hover:bg-white text-neutral-700 hover:shadow-sm"}`}>
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${isActive ? "bg-white/20 text-white" : hasIssue ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600"}`}>
                      {hasIssue ? "!" : origIdx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed truncate ${isActive ? "text-white" : "text-neutral-700"}`}>{q.text || "ยังไม่มีโจทย์"}</p>
                      {!isActive && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-[10px] font-medium ${LEVEL_COLOR[q.level]?.text || "text-neutral-400"}`}>{q.level}</span>
                          {q.category && <span className="text-[10px] text-neutral-400">· {q.category}</span>}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto">
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="h-16 w-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
                  <FileQuestion className="h-8 w-8 text-neutral-300" />
                </div>
                <p className="text-sm font-semibold text-neutral-500">ยังไม่มีข้อสอบ</p>
                <p className="text-xs text-neutral-400 mt-1">กดปุ่ม "ข้อสอบ" เพื่อเพิ่มข้อสอบก่อน</p>
                <button onClick={() => { onClose(); onEdit && onEdit(); }} className="mt-4 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition">
                  <Plus className="h-4 w-4" /> เพิ่มข้อสอบ
                </button>
              </div>
            ) : !current ? (
              <div className="flex items-center justify-center h-full text-xs text-neutral-400">ไม่พบข้อสอบที่ตรงเงื่อนไข</div>
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveIdx((i) => Math.max(0, i - 1))} disabled={activeIdx === 0} className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 transition">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-neutral-700">ข้อที่ {questions.indexOf(current) + 1}<span className="font-normal text-neutral-400"> / {questions.length}</span></span>
                    <button onClick={() => setActiveIdx((i) => Math.min(filtered.length - 1, i + 1))} disabled={activeIdx === filtered.length - 1} className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 transition">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {current.level && <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${LEVEL_COLOR[current.level]?.pill}`}>{current.level}</span>}
                    {current.category && <span className="text-xs px-2.5 py-1 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600">{current.category}</span>}
                    <span className="text-xs px-2.5 py-1 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 font-semibold">{current.score || 1} คะแนน</span>
                  </div>
                </div>

                {(!current.text?.trim() || current.options?.some((o) => !o.trim()) || current.correct === null) && (
                  <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-700">ข้อนี้ยังไม่สมบูรณ์</p>
                      <ul className="text-xs text-amber-600 mt-1 space-y-0.5">
                        {!current.text?.trim() && <li>· ยังไม่มีโจทย์</li>}
                        {current.options?.some((o) => !o.trim()) && <li>· ตัวเลือกบางข้อว่าง</li>}
                        {current.correct === null && <li>· ยังไม่ระบุเฉลย</li>}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black text-orange-500">{questions.indexOf(current) + 1}.</span>
                    <p className="text-base font-medium text-neutral-900 leading-relaxed">{current.text || <span className="text-neutral-300 italic">ยังไม่มีโจทย์</span>}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {OPTION_LABELS.map((label, optIdx) => {
                    const isCorrect = current.correct === optIdx;
                    const optText = current.options?.[optIdx];
                    const reveal = showCorrect && isCorrect;
                    return (
                      <div key={label} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition ${reveal ? "border-green-400 bg-green-50" : "border-neutral-200 bg-white"}`}>
                        <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${reveal ? "bg-green-500 text-white" : `${OPTION_COLORS[optIdx]} border`}`}>{label}</span>
                        <span className={`text-sm flex-1 ${optText ? "text-neutral-800" : "text-neutral-300 italic"}`}>{optText || "ยังไม่มีตัวเลือก"}</span>
                        {reveal && <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><Check className="h-3.5 w-3.5" /> เฉลย</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t border-neutral-100">
                  <button onClick={() => setActiveIdx((i) => Math.max(0, i - 1))} disabled={activeIdx === 0} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 disabled:opacity-30 transition">
                    <ChevronLeft className="h-4 w-4" /> ข้อก่อนหน้า
                  </button>
                  <button onClick={() => setActiveIdx((i) => Math.min(filtered.length - 1, i + 1))} disabled={activeIdx === filtered.length - 1} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 disabled:opacity-30 transition">
                    ข้อถัดไป <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Question Editor Modal ───────────────────────────────────────────────────

const emptyQuestion = () => ({
  id: Date.now() + Math.random(),
  text: "",
  options: ["", "", "", ""],
  correct: null,
  score: 1,
  level: "ปานกลาง",
  category: "",
});

function QuestionEditorModal({ show, onClose, exam, onSaveQuestions }) {
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (show) {
      const initial = exam?.questions?.length > 0 ? exam.questions : [emptyQuestion()];
      setQuestions(initial);
      setActiveIdx(0);
      setSaved(false);
    }
  }, [show, exam?.id]);

  const current = questions[activeIdx];
  const patchCurrent = (patch) => setQuestions((prev) => prev.map((q, i) => (i === activeIdx ? { ...q, ...patch } : q)));
  const patchOption = (optIdx, val) => { const opts = [...current.options]; opts[optIdx] = val; patchCurrent({ options: opts }); };
  const isComplete = (q) => q.text.trim() && q.options.every((o) => o.trim()) && q.correct !== null;
  const addQuestion = () => { setQuestions((prev) => [...prev, emptyQuestion()]); setActiveIdx(questions.length); };
  const deleteQuestion = () => {
    if (questions.length === 1) { setQuestions([emptyQuestion()]); return; }
    const next = questions.filter((_, i) => i !== activeIdx);
    setQuestions(next);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
  };
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleFinish = () => { const completed = questions.filter(isComplete); if (onSaveQuestions) onSaveQuestions(exam.id, completed); onClose(); };
  const completedCount = questions.filter(isComplete).length;

  if (!show || !exam) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileQuestion className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 leading-tight">{exam.name}</h2>
              <p className="text-xs text-neutral-400 mt-0.5">{completedCount}/{questions.length} ข้อสมบูรณ์</p>
            </div>
          </div>
          <div className="flex-1 mx-8 hidden md:block">
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>ความคืบหน้า</span><span>{completedCount} / {questions.length} ข้อ</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full transition-all duration-300" style={{ width: `${questions.length ? (completedCount / questions.length) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleFinish} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition">เสร็จสิ้น ({completedCount} ข้อ)</button>
            <button onClick={onClose} className="h-9 w-9 rounded-xl hover:bg-neutral-100 flex items-center justify-center text-neutral-400 transition"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-56 flex-shrink-0 border-r border-neutral-100 flex flex-col bg-neutral-50/60">
            <div className="p-3 border-b border-neutral-100">
              <button onClick={addQuestion} className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 text-xs font-semibold transition">
                <Plus className="h-3.5 w-3.5" /> เพิ่มข้อใหม่
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {questions.map((q, i) => {
                const done = isComplete(q);
                const isActive = i === activeIdx;
                return (
                  <button key={q.id} onClick={() => setActiveIdx(i)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${isActive ? "bg-orange-500 text-white shadow-sm" : "hover:bg-white text-neutral-700 hover:shadow-sm"}`}>
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isActive ? "bg-white/20 text-white" : done ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isActive ? "text-white" : "text-neutral-700"}`}>{q.text ? q.text.slice(0, 28) + (q.text.length > 28 ? "…" : "") : "ยังไม่มีโจทย์"}</p>
                      {!isActive && <p className={`text-[10px] mt-0.5 ${done ? "text-green-600" : "text-neutral-400"}`}>{done ? "✓ สมบูรณ์" : "ยังไม่เสร็จ"}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-neutral-100 space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-neutral-500"><span className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center text-[9px] text-green-700 font-bold">✓</span>สมบูรณ์</div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500"><span className="h-4 w-4 rounded-full bg-neutral-200" />ยังไม่เสร็จ</div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveIdx((i) => Math.max(0, i - 1))} disabled={activeIdx === 0} className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 transition"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-sm font-semibold text-neutral-700">ข้อที่ {activeIdx + 1}<span className="font-normal text-neutral-400"> / {questions.length}</span></span>
                <button onClick={() => setActiveIdx((i) => Math.min(questions.length - 1, i + 1))} disabled={activeIdx === questions.length - 1} className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 transition"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <button onClick={deleteQuestion} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"><Trash2 className="h-3.5 w-3.5" /> ลบข้อนี้</button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-2">โจทย์ข้อที่ {activeIdx + 1}<span className="ml-2 text-xs font-normal text-neutral-400">(รองรับ LaTeX เช่น $x^2 + y^2$)</span></label>
              <textarea value={current.text} onChange={(e) => patchCurrent({ text: e.target.value })} placeholder="พิมพ์โจทย์ข้อสอบที่นี่…" rows={4} className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none transition" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-neutral-800">ตัวเลือก</label>
                <p className="text-xs text-neutral-400">คลิก ○ เพื่อระบุเฉลย</p>
              </div>
              <div className="space-y-2.5">
                {OPTION_LABELS.map((label, optIdx) => {
                  const isCorrect = current.correct === optIdx;
                  return (
                    <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition ${isCorrect ? "border-green-400 bg-green-50" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
                      <button onClick={() => patchCurrent({ correct: isCorrect ? null : optIdx })} className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${isCorrect ? "border-green-500 bg-green-500" : "border-neutral-300 hover:border-green-400"}`}>
                        {isCorrect && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                      <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? "bg-green-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>{label}</span>
                      <input type="text" value={current.options[optIdx]} onChange={(e) => patchOption(optIdx, e.target.value)} placeholder={`ตัวเลือก ${label}`} className="flex-1 text-sm bg-transparent border-none outline-none text-neutral-800 placeholder-neutral-300" />
                      {isCorrect && <span className="text-xs font-semibold text-green-600 flex-shrink-0">เฉลย</span>}
                    </div>
                  );
                })}
              </div>
              {current.correct === null && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> ยังไม่ได้ระบุเฉลย</p>}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">คะแนนข้อนี้</label>
                <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
                  <button onClick={() => patchCurrent({ score: Math.max(1, current.score - 1) })} className="px-3 py-2 text-neutral-500 hover:bg-neutral-50 text-sm font-bold transition">−</button>
                  <span className="flex-1 text-center text-sm font-semibold text-neutral-800">{current.score} คะแนน</span>
                  <button onClick={() => patchCurrent({ score: current.score + 1 })} className="px-3 py-2 text-neutral-500 hover:bg-neutral-50 text-sm font-bold transition">+</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">ระดับความยาก</label>
                <div className="flex gap-1">
                  {["ง่าย","ปานกลาง","ยาก"].map((lv) => (
                    <button key={lv} onClick={() => patchCurrent({ level: lv })} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${current.level === lv ? LEVEL_BADGE[lv] + " border-transparent" : "border-neutral-200 text-neutral-500 hover:border-neutral-300"}`}>{lv}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">หมวดหมู่ (ไม่บังคับ)</label>
                <input type="text" value={current.category} onChange={(e) => patchCurrent({ category: e.target.value })} placeholder="เช่น พีชคณิต" className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                {isComplete(current)
                  ? <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium"><Check className="h-3.5 w-3.5" /> ข้อนี้สมบูรณ์แล้ว</span>
                  : <span className="flex items-center gap-1.5 text-xs text-neutral-400"><AlertCircle className="h-3.5 w-3.5" /> กรอกโจทย์ ตัวเลือก A–D และระบุเฉลยให้ครบ</span>
                }
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition ${saved ? "bg-green-50 border-green-300 text-green-700" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}>
                  {saved ? <><Check className="h-4 w-4" /> บันทึกแล้ว</> : "บันทึก"}
                </button>
                {activeIdx < questions.length - 1
                  ? <button onClick={() => setActiveIdx((i) => i + 1)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">ข้อถัดไป <ChevronRight className="h-4 w-4" /></button>
                  : <button onClick={addQuestion} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"><Plus className="h-4 w-4" /> เพิ่มข้อถัดไป</button>
                }
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_QUESTIONS_DEMO = [
  { id: 101, text: "ถ้า x² − 5x + 6 = 0 แล้ว x มีค่าเท่าไร", options: ["x = 1 หรือ x = 6","x = 2 หรือ x = 3","x = −2 หรือ x = −3","x = 0 หรือ x = 5"], correct: 1, score: 1, level: "ง่าย", category: "พีชคณิต" },
  { id: 102, text: "หาค่า sin 30° + cos 60°", options: ["0","0.5","1","√2"], correct: 2, score: 1, level: "ง่าย", category: "ตรีโกณมิติ" },
  { id: 103, text: "พื้นที่วงกลมรัศมี 7 ซม. เท่ากับเท่าไร (π = 22/7)", options: ["144 ตร.ซม.","154 ตร.ซม.","164 ตร.ซม.","174 ตร.ซม."], correct: 1, score: 2, level: "ปานกลาง", category: "เรขาคณิต" },
  { id: 104, text: "ถ้า log₂ 8 = x แล้ว x = ?", options: ["2","3","4","8"], correct: 1, score: 2, level: "ยาก", category: "ลอการิทึม" },
  { id: 105, text: "ลำดับเลขคณิต 2, 5, 8, 11 … พจน์ที่ 20 คือเท่าไร", options: ["56","59","62","65"], correct: 1, score: 2, level: "ปานกลาง", category: "ลำดับและอนุกรม" },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TutorExamManagement() {
  const [exams, setExams] = useState([
    { id: 1, type: "pre-test", name: "Pre-test บทที่ 1 — จำนวนจริง", fullName: "สอบก่อนเรียน", status: "inactive", totalQuestions: 5, duration: 30, questions: MOCK_QUESTIONS_DEMO },
    { id: 2, type: "mid-test", name: "Mid-test ครั้งที่ 1", fullName: "สอบกลางเทอม", status: "active", sessionId: "MID7X2A", startTime: new Date(), totalQuestions: 30, duration: 90, questions: [] },
    { id: 3, type: "post-test", name: "Post-test ปลายภาค", fullName: "สอบหลังเรียน", status: "closed", sessionId: null, startTime: null, totalQuestions: 40, duration: 120, questions: [] },
  ]);

  const [studentProgress, setStudentProgress] = useState(MOCK_STUDENTS);
  const [timer, setTimer] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const activeExam = exams.find((e) => e.id === activeId) || null;

  useEffect(() => {
    const active = exams.some((e) => e.status === "active");
    if (!active) return;
    const iv = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [exams]);

  useEffect(() => {
    if (!showQR) return;
    const iv = setInterval(() => {
      setStudentProgress((prev) => {
        const waiting = prev.filter((s) => s.status === "not-joined");
        if (waiting.length > 0 && Math.random() > 0.55) {
          const pick = waiting[Math.floor(Math.random() * waiting.length)];
          return prev.map((s) => s.id === pick.id ? { ...s, status: "joined", joinedAt: new Date().toLocaleTimeString("th-TH") } : s);
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [showQR]);

  const handleOpenExam = (id) => {
    const sid = generateSessionId();
    setExams((prev) => prev.map((e) => e.id === id ? { ...e, status: "active", sessionId: sid, startTime: new Date() } : e));
    setStudentProgress(MOCK_STUDENTS);
    setTimer(0);
    setActiveId(id);
    setShowQR(true);
  };

  const handleCloseExam = () => {
    setExams((prev) => prev.map((e) => e.id === activeId ? { ...e, status: "closed" } : e));
    setShowConfirm(false);
    setShowQR(false);
    setActiveId(null);
  };

  const handleAddExam = (form) => {
    const newId = Date.now();
    const newExam = {
      id: newId,
      type: form.type,
      name: form.name,
      fullName: EXAM_TYPES.find((t) => t.value === form.type)?.sub || "",
      status: "inactive",
      sessionId: null,
      startTime: null,
      totalQuestions: form.totalQuestions,
      duration: form.duration,
      questions: form.questions || [],
    };
    setExams((prev) => [...prev, newExam]);
    if (form.addMethod === "manual") { setActiveId(newId); setShowEditor(true); }
  };

  const handleSaveQuestions = (examId, completedQuestions) => {
    setExams((prev) => prev.map((e) => e.id === examId ? { ...e, totalQuestions: completedQuestions.length || e.totalQuestions, questions: completedQuestions } : e));
  };

  const joinedCount = studentProgress.filter((s) => s.status === "joined").length;

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm">
        <Link to="/tutor/courses" className="font-medium text-gray-500 hover:text-orange-600 transition">คอร์ส</Link>
        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-800">จัดการการสอบ</span>
      </div>

      {/* Header — ตัด Template .xlsx และ Analytics รวม ออก */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">จัดการการสอบ</h1>
          <p className="text-sm text-neutral-500 mt-1">คณิตศาสตร์ ม.3 เทอม 1/2567 • นักเรียนทั้งหมด 24 คน</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBank(true)} className="flex items-center gap-2 border border-neutral-200 bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition">
            <Database className="h-4 w-4" /> คลังข้อสอบ
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition">
            <Plus className="h-4 w-4" /> เพิ่มการสอบ
          </button>
        </div>
      </div>

      {/* Exam Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-[30%_10%_13%_13%_10%_24%] px-5 py-3 bg-neutral-50 border-b border-neutral-100">
          {["ชื่อการสอบ","ประเภท","จำนวนข้อ / เวลา","นักเรียน","สถานะ","การจัดการ"].map((h) => (
            <p key={h} className="text-xs font-semibold text-neutral-500 text-right">{h}</p>
          ))}
        </div>

        {exams.length === 0 && (
          <div className="py-16 text-center text-neutral-400 text-sm">
            ยังไม่มีการสอบ — กด <strong>เพิ่มการสอบ</strong> เพื่อเริ่มต้น
          </div>
        )}

        {exams.map((exam) => {
          const joined = exam.status === "active" ? joinedCount : exam.status === "closed" ? 22 : 0;
          const total = 24;
          const pct = Math.round((joined / total) * 100);
          const sb = STATUS_BADGE[exam.status];
          const qCount = exam.questions?.length ?? 0;

          return (
            <div
              key={exam.id}
              className={`grid grid-cols-[30%_10%_13%_13%_10%_24%] px-5 py-3 px-5 border-b border-neutral-100 last:border-b-0 items-center hover:bg-neutral-50 transition ${exam.status === "active" ? "bg-green-50/30" : ""}`}
            >
              {/* ชื่อการสอบ — ตัด "ดูผลการสอบ" ใน subtitle ออก */}
              <div>
                <p className="text-sm font-semibold text-neutral-900">{exam.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {exam.status === "active" && exam.startTime
                    ? `เปิดสอบ ${exam.startTime.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} • ${formatTime(timer)}`
                    : exam.status === "closed"
                      ? "ปิดสอบแล้ว"
                      : qCount > 0 ? `${qCount} ข้อพร้อมแล้ว` : "ยังไม่เปิด"}
                </p>
              </div>

              <div>
                <Badge className={TYPE_BADGE[exam.type] || "bg-neutral-100 text-neutral-600"}>
                  {EXAM_TYPES.find((t) => t.value === exam.type)?.label || exam.type}
                </Badge>
              </div>

              <p className="text-sm text-neutral-700">{exam.totalQuestions} ข้อ / {exam.duration} นาที</p>

              <div>
                <p className={`text-sm font-semibold ${exam.status === "active" ? "text-green-700" : "text-neutral-700"}`}>{joined}/{total}</p>
                <div className="h-1.5 bg-neutral-100 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${exam.status === "active" ? "bg-green-500" : "bg-neutral-300"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div>
                <Badge className={sb.cls}>
                  {exam.status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                  {sb.label}
                </Badge>
              </div>

              {/* Action Buttons — กระชับ ไม่ซ้ำซ้อน */}
              <div className="flex gap-1.5 flex-wrap justify-end">
                {exam.status === "inactive" && (
                  <>
                    <button
                      onClick={() => handleOpenExam(exam.id)}
                      className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    >
                      <Play className="h-3 w-3" /> เปิดสอบ
                    </button>
                    <button
                      onClick={() => { setActiveId(exam.id); setShowEditor(true); }}
                      className="flex items-center gap-1.5 border border-orange-200 hover:bg-orange-50 text-orange-600 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    >
                      <FileQuestion className="h-3 w-3" /> ข้อสอบ{qCount > 0 ? ` (${qCount})` : ""}
                    </button>
                    {/* Preview เฉพาะตอนมีข้อสอบแล้ว */}
                    {qCount > 0 && (
                      <button
                        onClick={() => { setActiveId(exam.id); setShowPreview(true); }}
                        className="flex items-center gap-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                      >
                        <Eye className="h-3 w-3" /> Preview
                      </button>
                    )}
                  </>
                )}

                {exam.status === "active" && (
                  <>
                    <button
                      onClick={() => { setActiveId(exam.id); setShowQR(true); }}
                      className="flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    >
                      <QrCode className="h-3 w-3" /> QR
                    </button>
                    {/* รวม Live stats + รายละเอียด เป็นปุ่มเดียว */}
                    <button
                      onClick={() => { setActiveId(exam.id); setShowDetail(true); }}
                      className="flex items-center gap-1.5 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    >
                      <Users className="h-3 w-3" /> นักเรียน
                    </button>
                    <button
                      onClick={() => { setActiveId(exam.id); setShowConfirm(true); }}
                      className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    >
                      <StopCircle className="h-3 w-3" /> ปิดสอบ
                    </button>
                  </>
                )}

                {exam.status === "closed" && (
                  <>
                    <Link
                      to={`/tutor/examanalytics?examType=${exam.type}`}
                      className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    >
                      <BarChart2 className="h-3 w-3" /> ดูผลการสอบ
                    </Link>
                    <button
                      onClick={() => { setActiveId(exam.id); setShowDetail(true); }}
                      className="flex items-center gap-1.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    >
                      <Users className="h-3 w-3" /> นักเรียน
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AddExamModal show={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAddExam} />
      <QuestionBankModal show={showBank} onClose={() => setShowBank(false)} />
      <QRModal show={showQR} onClose={() => setShowQR(false)} exam={activeExam} />
      <DetailModal show={showDetail} onClose={() => setShowDetail(false)} exam={activeExam} students={studentProgress} />
      <ConfirmCloseModal show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleCloseExam} examName={activeExam?.name} />
      <QuestionEditorModal show={showEditor} onClose={() => { setShowEditor(false); setActiveId(null); }} exam={activeExam} onSaveQuestions={handleSaveQuestions} />
      <ExamPreviewModal show={showPreview} onClose={() => { setShowPreview(false); setActiveId(null); }} exam={activeExam} onEdit={() => { setShowEditor(true); }} />
    </div>
  );
}