import axios from "axios";
import { API_URL } from "../config";
import * as XLSX from "xlsx";

const API_BASE = `${API_URL}/api/exam`;

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

export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};


export function deriveStatus(exam) {
  if (exam.status === "active" || exam.status === "closed") return exam.status;
  return (exam.questions?.length || exam.questionCount || 0) > 0 ? "ready" : "draft";
}

export function isExamReady(exam) {
  const qs = exam.questions || [];
  if (qs.length === 0) return false;
  const target = Number(exam.settings?.totalQuestions) || 0;
  if (target && qs.length < target) return false;
  return qs.every((q) => q.text?.trim() && q.options?.every((o) => o.trim()) && q.correct !== null && q.correct !== undefined);
}

export const emptyQuestion = () => ({
  id: `new-${Date.now()}-${Math.random()}`,
  text: "",
  options: ["", "", "", ""],
  correct: null,
  score: 1,
  level: "ปานกลาง",
  category: "",
  explanation: "",
});

// ── xlsx template / import (parsing only — saving goes through addQuestions) ─
export const downloadXlsxTemplate = () => {
  const headers = ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "score", "level", "category", "explanation"];
  const sample = [
    { question: "ถ้า x² − 5x + 6 = 0 แล้ว x มีค่าเท่ากับเท่าไร", option_a: "x = 1 หรือ x = 6", option_b: "x = 2 หรือ x = 3", option_c: "x = −2 หรือ x = −3", option_d: "x = 0 หรือ x = 5", correct_answer: "B", score: 1, level: "ง่าย", category: "พีชคณิต", explanation: "แยกตัวประกอบได้ (x−2)(x−3)=0 จึงได้ x=2 หรือ x=3" },
    { question: "หาค่า sin 30° + cos 60°", option_a: "0", option_b: "0.5", option_c: "1", option_d: "√2", correct_answer: "C", score: 2, level: "ปานกลาง", category: "ตรีโกณมิติ", explanation: "" },
  ];
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...sample.map((r) => headers.map((h) => r[h]))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [{ wch: 60 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 50 }];
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
    ["explanation", "คำอธิบายเฉลย", "ข้อความอธิบายว่าทำไมคำตอบถึงถูก — นักเรียนจะเห็นหลังส่งข้อสอบ", "ไม่บังคับ"],
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
            id: `import-${Date.now()}-${i}`,
            text: String(r.question || ""),
            options: [String(r.option_a || ""), String(r.option_b || ""), String(r.option_c || ""), String(r.option_d || "")],
            correct: OPTION_MAP[String(r.correct_answer || "").toUpperCase()] ?? null,
            score: Number(r.score) || 1,
            level: ["ง่าย", "ปานกลาง", "ยาก"].includes(r.level) ? r.level : "ปานกลาง",
            category: String(r.category || ""),
            explanation: String(r.explanation || ""),   // ← เพิ่ม
          }));
        resolve(parsed);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

// ── API layer (real backend — /api/exam) ─────────────────────────────────────

// GET /api/exam?courseId=&subjectId=&adminId= → the 3 Exams (Pre/Mid/Post) for this Subject.
export async function fetchExams({ courseId, subjectId, adminId }) {
  const { data } = await axios.get(API_BASE, { params: { courseId, subjectId, adminId } });
  return data;
}

// GET /api/exam/:examId → full exam detail incl. settings + questions.
export async function fetchExamDetail(examId) {
  const { data } = await axios.get(`${API_BASE}/${examId}`);
  return data;
}

// PUT /api/exam/:examId/settings → { totalQuestions, duration, date }
export async function updateExamSettings(examId, settings) {
  const { data } = await axios.put(`${API_BASE}/${examId}/settings`, settings);
  return data;
}

// POST /api/exam/:examId/questions → adds question(s) to the EXISTING exam.
// `questions` is always an array (manual add sends length-1 arrays too).
export async function addQuestions(examId, questions) {
  const { data } = await axios.post(`${API_BASE}/${examId}/questions`, { questions });
  return data;
}

// PUT /api/exam/questions/:questionId
export async function updateQuestion(questionId, patch) {
  const { data } = await axios.put(`${API_BASE}/questions/${questionId}`, patch);
  return data;
}

// DELETE /api/exam/questions/:questionId
export async function deleteQuestion(questionId) {
  const { data } = await axios.delete(`${API_BASE}/questions/${questionId}`);
  return data;
}

// POST /api/exam/:examId/session/open → { status, sessionId, examLink }
export async function openExamSession(examId) {
  const { data } = await axios.post(`${API_BASE}/${examId}/session/open`);
  return data;
}

// POST /api/exam/:examId/session/close
export async function closeExamSession(examId) {
  const { data } = await axios.post(`${API_BASE}/${examId}/session/close`);
  return data;
}

// GET /api/exam/:examId/results → real results from exam_join / exam_student_answers
export async function fetchExamResults(examId) {
  const { data } = await axios.get(`${API_BASE}/${examId}/results`);
  return data;
}

// GET /api/exam/join/:examJoinId/detail → รายละเอียดรายข้อของนักเรียน 1 คน (คำตอบ/ผล/เวลาที่ใช้)
export async function fetchExamJoinDetail(examJoinId) {
  const { data } = await axios.get(`${API_BASE}/join/${examJoinId}/detail`);
  return data;
}