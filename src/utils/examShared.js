// examShared.js
// Shared constants / helpers / mock data store for the Exam Management flow.
// Frontend-only (no backend calls). Exam records are seeded per Course+Subject
// and persisted to sessionStorage so state survives navigation between
// TutorExam.jsx (list) and TutorExamDetail.jsx (detail) during a session.
//
// IMPORTANT CONCEPT (do not break):
//   Exam    = Pre-test / Mid-test / Post-test — these 3 already exist, always.
//   Question = one item added into an Exam.
//   Session  = one live "เปิดสอบ" instance of an Exam.
// "เพิ่มข้อสอบ" (add question) must NEVER create a new Exam.

import * as XLSX from "xlsx";

export const EXAM_TYPES = [
  { value: "pre-test", label: "Pre-test", sub: "สอบก่อนเรียน", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-400" },
  { value: "mid-test", label: "Mid-test", sub: "สอบกลางเทอม", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-400" },
  { value: "post-test", label: "Post-test", sub: "สอบหลังเรียน", color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-400" },
];

export const TYPE_BADGE = {
  "pre-test": "bg-blue-50  text-blue-700",
  "mid-test": "bg-amber-50 text-amber-700",
  "post-test": "bg-pink-50  text-pink-700",
};

// Status ladder per spec §12: Draft → Ready → Open/In Progress → Closed
export const STATUS_BADGE = {
  draft: { cls: "bg-neutral-100 text-neutral-600", label: "Draft" },
  ready: { cls: "bg-blue-50 text-blue-700", label: "Ready" },
  active: { cls: "bg-green-100 text-green-700", label: "Open / กำลังสอบ" },
  closed: { cls: "bg-neutral-100 text-neutral-500", label: "Closed" },
};

export const LEVEL_BADGE = {
  ง่าย: "bg-green-100 text-green-700",
  ปานกลาง: "bg-amber-100 text-amber-700",
  ยาก: "bg-red-100   text-red-700",
};

export const LEVEL_COLOR = {
  ง่าย: { dot: "bg-green-400", text: "text-green-700", pill: "bg-green-50 text-green-700 border-green-200" },
  ปานกลาง: { dot: "bg-amber-400", text: "text-amber-700", pill: "bg-amber-50 text-amber-700 border-amber-200" },
  ยาก: { dot: "bg-red-400", text: "text-red-700", pill: "bg-red-50 text-red-700 border-red-200" },
};

export const generateSessionId = () =>
  Math.random().toString(36).substring(2, 9).toUpperCase();

export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

export const MOCK_STUDENTS = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: `นักเรียน ${i + 1}`,
  status: "not-joined",
  joinedAt: null,
}));

// Derives the display status from stored data.
// active/closed are explicit (set by the Exam Session tab); otherwise
// draft/ready is computed from whether any questions exist yet.
export function deriveStatus(exam) {
  if (exam.status === "active" || exam.status === "closed") return exam.status;
  return (exam.questions?.length || 0) > 0 ? "ready" : "draft";
}

export function isExamReady(exam) {
  const qs = exam.questions || [];
  if (qs.length === 0) return false;
  const target = Number(exam.settings?.totalQuestions) || 0;
  if (target && qs.length < target) return false;
  return qs.every((q) => q.text?.trim() && q.options?.every((o) => o.trim()) && q.correct !== null && q.correct !== undefined);
}

// ── xlsx template / import (mock only, no upload to backend) ────────────────

export const downloadXlsxTemplate = () => {
  const headers = ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "score", "level", "category"];
  const sample = [
    { question: "ถ้า x² − 5x + 6 = 0 แล้ว x มีค่าเท่ากับเท่าไร", option_a: "x = 1 หรือ x = 6", option_b: "x = 2 หรือ x = 3", option_c: "x = −2 หรือ x = −3", option_d: "x = 0 หรือ x = 5", correct_answer: "B", score: 1, level: "ง่าย", category: "พีชคณิต" },
    { question: "หาค่า sin 30° + cos 60°", option_a: "0", option_b: "0.5", option_c: "1", option_d: "√2", correct_answer: "C", score: 2, level: "ปานกลาง", category: "ตรีโกณมิติ" },
  ];
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...sample.map((r) => headers.map((h) => r[h]))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [{ wch: 60 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 8 }, { wch: 12 }, { wch: 18 }];
  const instr = [
    ["📋 คำอธิบาย Template ข้อสอบ"], [],
    ["คอลัมน์", "คำอธิบาย", "ค่าที่รองรับ", "บังคับ?"],
    ["question", "โจทย์ข้อสอบ", "ข้อความ (รองรับ LaTeX เช่น $x^2$)", "✅ บังคับ"],
    ["option_a", "ตัวเลือก A", "ข้อความ", "✅ บังคับ"],
    ["option_b", "ตัวเลือก B", "ข้อความ", "✅ บังคับ"],
    ["option_c", "ตัวเลือก C", "ข้อความ", "✅ บังคับ"],
    ["option_d", "ตัวเลือก D", "ข้อความ", "✅ บังคับ"],
    ["correct_answer", "เฉลย", "A, B, C หรือ D (ตัวพิมพ์ใหญ่)", "✅ บังคับ"],
    ["score", "คะแนนต่อข้อ", "ตัวเลข เช่น 1, 2, 3 …", "ไม่บังคับ (default = 1)"],
    ["level", "ระดับความยาก", "ง่าย / ปานกลาง / ยาก", "ไม่บังคับ (default = ปานกลาง)"],
    ["category", "หมวดหมู่", "ข้อความใดก็ได้ เช่น พีชคณิต", "ไม่บังคับ"],
    [], [], ["• ห้ามลบแถวหัวตาราง"], ["• correct_answer ต้องเป็น A B C D เท่านั้น"],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(instr);
  ws2["!cols"] = [{ wch: 20 }, { wch: 40 }, { wch: 36 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.utils.book_append_sheet(wb, ws2, "คำอธิบาย");
  XLSX.writeFile(wb, "exam_template.xlsx");
};

export const parseXlsx = (file) =>
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
            level: ["ง่าย", "ปานกลาง", "ยาก"].includes(r.level) ? r.level : "ปานกลาง",
            category: String(r.category || ""),
          }));
        resolve(parsed);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

export const emptyQuestion = () => ({
  id: Date.now() + Math.random(),
  text: "",
  options: ["", "", "", ""],
  correct: null,
  score: 1,
  level: "ปานกลาง",
  category: "",
});

// ── Mock store (sessionStorage-backed, keyed by Course+Subject) ─────────────
// Replace with real API calls when the backend for Exam/Question/Session
// endpoints is ready — the shape here (`exam.settings`, `exam.questions`,
// `exam.status`, `exam.sessionId`) is intended to map cleanly onto that.

const storeKey = (courseId, subjectId) => `sornserm_exams_${courseId || "c"}_${subjectId || "s"}`;

function seedExams(courseId, subjectId) {
  return EXAM_TYPES.map((t) => ({
    id: `${t.value}-${courseId || "c"}-${subjectId || "s"}`,
    type: t.value,
    name: t.label,
    fullName: t.sub,
    status: "inactive", // "inactive" | "active" | "closed" — draft/ready are derived
    sessionId: null,
    startTime: null,
    settings: { totalQuestions: 0, duration: 60, date: "" },
    questions: [],
  }));
}

export function loadExams(courseId, subjectId) {
  try {
    const raw = sessionStorage.getItem(storeKey(courseId, subjectId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt storage */ }
  const seeded = seedExams(courseId, subjectId);
  saveExams(courseId, subjectId, seeded);
  return seeded;
}

export function saveExams(courseId, subjectId, exams) {
  try {
    sessionStorage.setItem(storeKey(courseId, subjectId), JSON.stringify(exams));
  } catch { /* storage unavailable — mock data just won't persist */ }
}

export function getExam(courseId, subjectId, examId) {
  return loadExams(courseId, subjectId).find((e) => e.id === examId) || null;
}

export function saveExam(courseId, subjectId, exam) {
  const next = loadExams(courseId, subjectId).map((e) => (e.id === exam.id ? exam : e));
  saveExams(courseId, subjectId, next);
  return next;
}