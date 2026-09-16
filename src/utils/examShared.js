import axios from "axios";
import { API_URL } from "../config";
import * as XLSX from "xlsx";

const API_BASE = `${API_URL}/api/exam`;

// แนบ Bearer token ของติวเตอร์/แอดมิน — ใช้ key เดียวกับฝั่งนักเรียนเพราะ Login.jsx
// เก็บ token ของทั้งสองฝั่งไว้ที่ "student_token" เหมือนกัน
function authHeaders() {
  const token = localStorage.getItem("student_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
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
  gradeLevelId: null, // ไม่ระบุ = แสดงในทุกตัวกรองระดับชั้นตอนจัดชุด
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
  const { data } = await axios.get(API_BASE, { params: { courseId, subjectId, adminId }, headers: authHeaders() });
  return data;
}

// GET /api/exam/:examId → full exam detail incl. settings + questions.
export async function fetchExamDetail(examId) {
  const { data } = await axios.get(`${API_BASE}/${examId}`, { headers: authHeaders() });
  return data;
}

// PUT /api/exam/:examId/settings → { totalQuestions, duration, date }
export async function updateExamSettings(examId, settings) {
  const { data } = await axios.put(`${API_BASE}/${examId}/settings`, settings, { headers: authHeaders() });
  return data;
}

// POST /api/exam/:examId/questions → adds question(s) to the EXISTING exam.
// `questions` is always an array (manual add sends length-1 arrays too).
export async function addQuestions(examId, questions) {
  const { data } = await axios.post(`${API_BASE}/${examId}/questions`, { questions }, { headers: authHeaders() });
  return data;
}

// PUT /api/exam/questions/:questionId
export async function updateQuestion(questionId, patch) {
  const { data } = await axios.put(`${API_BASE}/questions/${questionId}`, patch, { headers: authHeaders() });
  return data;
}

// DELETE /api/exam/questions/:questionId
// PUT /api/exam/:examId/questions/scores — อัปเดตคะแนนหลายข้อพร้อมกัน (ปุ่มแบ่งคะแนนอัตโนมัติ)
export async function bulkUpdateQuestionScores(examId, scores) {
    const { data } = await axios.put(`${API_BASE}/${examId}/questions/scores`, { scores }, { headers: authHeaders() });
    return data;
}

// DELETE /api/exam/:examId/questions — ลบข้อสอบทั้งชุดในครั้งเดียว
export async function deleteAllQuestions(examId) {
    const { data } = await axios.delete(`${API_BASE}/${examId}/questions`, { headers: authHeaders() });
    return data;
}

export async function deleteQuestion(questionId) {
  const { data } = await axios.delete(`${API_BASE}/questions/${questionId}`, { headers: authHeaders() });
  return data;
}

// POST /api/exam/:examId/session/open → { status, sessionId, examLink }
export async function openExamSession(examId) {
  const { data } = await axios.post(`${API_BASE}/${examId}/session/open`, {}, { headers: authHeaders() });
  return data;
}

// POST /api/exam/:examId/session/close
export async function closeExamSession(examId) {
  const { data } = await axios.post(`${API_BASE}/${examId}/session/close`, {}, { headers: authHeaders() });
  return data;
}

// GET /api/exam/:examId/results → real results from exam_join / exam_student_answers
export async function fetchExamResults(examId) {
  const { data } = await axios.get(`${API_BASE}/${examId}/results`, { headers: authHeaders() });
  return data;
}

// GET /api/exam/join/:examJoinId/detail → รายละเอียดรายข้อของนักเรียน 1 คน (คำตอบ/ผล/เวลาที่ใช้)
export async function fetchExamJoinDetail(examJoinId) {
  const { data } = await axios.get(`${API_BASE}/join/${examJoinId}/detail`, { headers: authHeaders() });
  return data;
}

export async function fetchTopicBreakdown(examId) {
  const { data } = await axios.get(`${API_BASE}/${examId}/topic-breakdown`, { headers: authHeaders() });
  return data;
}


// GET /api/exam/subject/:subjectId/categories?adminId= → หมวดทั้งหมดที่เคยใช้ในวิชานี้ (ข้าม 3 รอบ)
export async function fetchSubjectCategories({ subjectId, adminId }) {
  const { data } = await axios.get(`${API_BASE}/subject/${subjectId}/categories`, { params: { adminId }, headers: authHeaders() });
  return data;
}


// ── คลังข้อสอบของวิชา (/api/bank) ─────────────────────────────────────────────
// คลังแยกจากชุดที่ใช้สอบจริง แก้ข้อในคลังไม่กระทบข้อสอบที่เคยใช้ไปแล้ว
const BANK_BASE = `${API_URL}/api/bank`;

// GET /api/bank?subjectId= → [{ id, text, options, correct, level, category, explanation, usedCount, lastUsed }]
export async function fetchBank(subjectId) {
  const { data } = await axios.get(BANK_BASE, { params: { subjectId }, headers: authHeaders() });
  return data;
}

// GET /api/bank/summary?subjectId= → [{ category, level, count }] ใช้เติมตารางตอนกรอกเงื่อนไข
export async function fetchBankSummary(subjectId) {
  const { data } = await axios.get(`${BANK_BASE}/summary`, { params: { subjectId }, headers: authHeaders() });
  return data;
}

// GET /api/bank/usage-history?subjectId= → ชุดข้อสอบที่เคยใช้ไปแล้วในวิชานี้
export async function fetchBankUsageHistory(subjectId) {
  const { data } = await axios.get(`${BANK_BASE}/usage-history`, { params: { subjectId }, headers: authHeaders() });
  return data;
}

// GET /api/bank/grade-levels → [{ id, label }] รายการระดับชั้นให้เลือกตอนเพิ่มข้อในคลัง
export async function fetchGradeLevels() {
  const { data } = await axios.get(`${BANK_BASE}/grade-levels`, { headers: authHeaders() });
  return data;
}

// POST /api/bank → เพิ่มเข้าคลัง ใช้ได้ทั้งพิมพ์เองทีละข้อและ import Excel หลายข้อ
export async function addBankQuestions(subjectId, questions) {
  const { data } = await axios.post(BANK_BASE, { subjectId, questions }, { headers: authHeaders() });
  return data;
}

export async function updateBankQuestion(id, patch) {
  const { data } = await axios.put(`${BANK_BASE}/${id}`, patch, { headers: authHeaders() });
  return data;
}

export async function deleteBankQuestion(id) {
  const { data } = await axios.delete(`${BANK_BASE}/${id}`, { headers: authHeaders() });
  return data;
}

// GET /api/bank/categories?subjectId= → [{ category, count }]
export async function fetchBankCategories(subjectId) {
  const { data } = await axios.get(`${BANK_BASE}/categories`, { params: { subjectId }, headers: authHeaders() });
  return data;
}

// PUT /api/bank/categories/rename → เปลี่ยนชื่อหรือรวมหมวด
// cascade = true จะตามไปแก้ข้อสอบที่เคยใช้สอบไปแล้วด้วย (แก้ประวัติ) ค่าเริ่มต้นคือไม่แก้
export async function renameBankCategory({ subjectId, from, to, cascade = false }) {
  const { data } = await axios.put(`${BANK_BASE}/categories/rename`, { subjectId, from, to, cascade }, { headers: authHeaders() });
  return data;
}

// ── จัดชุดข้อสอบ ─────────────────────────────────────────────────────────────

// POST /api/exam/assemble → { ok, sets: [{ label, items, totalScore, reusedCount }] }
// หลังบ้านส่งเงื่อนไขให้ n8n เลือกข้อ แล้วอ่านเนื้อข้อจากคลังกับคิดคะแนนให้เอง
// ยังไม่มีอะไรถูกบันทึกในขั้นนี้ เป็นแค่ตัวเลือกให้ครูดู
export async function assembleExamSet({ courseId, subjectId, blueprint, totalScore = 20, setCount = 3 }) {
  const { data } = await axios.post(
    `${API_BASE}/assemble`,
    { courseId: Number(courseId), subjectId: Number(subjectId), blueprint, totalScore, setCount },
    { headers: authHeaders() }
  );
  return data;
}

// POST /api/exam/apply-set → บันทึกชุดที่ครูเลือกลงรอบสอบ
// applyTo: "all" = ลงทั้ง Pre/Mid/Post ของคอร์สนี้ | "this" = เฉพาะรอบนี้
export async function applyExamSet({ examId, bankQuestionIds, applyTo = "all", totalScore = 20 }) {
  const { data } = await axios.post(
    `${API_BASE}/apply-set`,
    { examId, bankQuestionIds, applyTo, totalScore },
    { headers: authHeaders() }
  );
  return data;
}

// PUT /api/exam/subject/:subjectId/categories/rename → รวม/เปลี่ยนชื่อหมวด (cascade ทุก exam ของวิชานี้)
export async function renameSubjectCategory({ subjectId, adminId, from, to }) {
  const { data } = await axios.put(`${API_BASE}/subject/${subjectId}/categories/rename`, { adminId, from, to }, { headers: authHeaders() });
  return data;
}

// ── AI อ่านผลสอบรายคน (/api/ai) ──────────────────────────────────────────────
// ตัวเลขทั้งหมดมาจากระบบ AI ทำหน้าที่แปลเป็นคำอธิบายและร่างข้อความถึงผู้ปกครอง
// ทุกฉบับเป็นร่างเสมอ ติวเตอร์ต้องกดอนุมัติก่อนจึงจะถือว่าใช้ได้
const AI_BASE = `${API_URL}/api/ai`;

// POST /api/ai/analyze → สั่งวิเคราะห์ทั้งห้อง (ใช้เวลานาน ห้อง 30 คนอาจเป็นนาที)
export async function analyzeExamWithAi(examId) {
  const { data } = await axios.post(`${AI_BASE}/analyze`, { examId }, { headers: authHeaders(), timeout: 300000 });
  return data;
}

// GET /api/ai/summaries?examId=
export async function fetchAiSummaries(examId) {
  const { data } = await axios.get(`${AI_BASE}/summaries`, { params: { examId }, headers: authHeaders() });
  return data;
}

// PUT /api/ai/summaries/:id → แก้ข้อความ หรือกดอนุมัติ
export async function updateAiSummary(id, patch) {
  const { data } = await axios.put(`${AI_BASE}/summaries/${id}`, patch, { headers: authHeaders() });
  return data;
}
