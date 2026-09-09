import axios from "axios";
import { API_URL } from "../config";

const API_BASE = `${API_URL}/api/student/exam`;

export function getCurrentUserId() {
    return JSON.parse(localStorage.getItem("user") || "null")?.id || null;
}

// ── ธง "ยังมีการสอบค้างอยู่ (เข้าสอบแล้วแต่ยังไม่กดส่ง)" ────────────────────
// ใช้ซ่อนปุ่มแชตบอตทั่วทั้งเว็บ ไม่ใช่แค่หน้าสอบ — กันเคสออกจากหน้าสอบไปหน้าอื่น
// แล้วไปถามบอตต่อ ทั้งที่ยังไม่ได้กดส่งข้อสอบและยังทำต่อได้อยู่
// เก็บ deadline ไว้ด้วย พอเลยเวลาแล้วถือว่าไม่ค้างแล้วโดยอัตโนมัติ (backend บังคับส่งให้เอง)
const EXAM_ACTIVE_KEY = "sornserm_exam_active";
const EXAM_ACTIVE_EVENT = "sornserm-exam-active-changed";

export function readExamActive() {
    try {
        const raw = JSON.parse(localStorage.getItem(EXAM_ACTIVE_KEY) || "null");
        if (!raw) return null;
        // เลย deadline แล้ว = ทำต่อไม่ได้อีก ล้างธงทิ้ง
        if (raw.deadlineAt && new Date(raw.deadlineAt).getTime() <= Date.now()) {
            clearExamActive();
            return null;
        }
        return raw;
    } catch {
        return null;
    }
}

export function markExamActive({ examJoinId = null, deadlineAt = null } = {}) {
    try {
        localStorage.setItem(EXAM_ACTIVE_KEY, JSON.stringify({ examJoinId, deadlineAt }));
    } catch { /* localStorage เต็ม/ถูกปิด — ข้ามไป ไม่ใช่เรื่องคอขาดบาดตาย */ }
    window.dispatchEvent(new Event(EXAM_ACTIVE_EVENT));
}

export function clearExamActive() {
    try { localStorage.removeItem(EXAM_ACTIVE_KEY); } catch { /* ignore */ }
    window.dispatchEvent(new Event(EXAM_ACTIVE_EVENT));
}

export const EXAM_ACTIVE_CHANGED_EVENT = EXAM_ACTIVE_EVENT;

// GET /api/student/exam/active → { active, examJoinId, deadlineAt }
// ใช้ยืนยันกับ backend ตอนโหลดหน้าใหม่ (กันเคสเปลี่ยนเบราว์เซอร์/ล้าง localStorage)
export async function fetchActiveExam() {
    const { data } = await axios.get(`${API_BASE}/active`, { headers: authHeaders() });
    return data;
}

// แนบ Bearer token ของนักเรียนไปกับทุก request — คู่กับ authRequired ที่เพิ่มฝั่ง backend
function authHeaders() {
    const token = localStorage.getItem("student_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export const formatTime = (totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
};

// GET /api/student/exam/by-course/:courseId?userId= → { token } OR { choices: [...] }
// ถ้าส่ง subjectId มา backend จะคืน token ตรง ไม่ต้องเดา/โชว์ choices อีก
export async function fetchExamEntry(courseId, userId, subjectId = null) {
    const params = { userId };
    if (subjectId) params.subjectId = subjectId;
    const { data } = await axios.get(`${API_BASE}/by-course/${courseId}`, { params, headers: authHeaders() });
    return data;
}

// GET /api/student/exam/by-course/:courseId/schedule?subjectId= → กำหนดสอบล่วงหน้า (ยังไม่เปิด)
// ไม่ส่ง subjectId มา = เอาทุกวิชาในคอร์สนี้ (หน้าคอร์สลิสต์) ส่ง subjectId มา = กรองเฉพาะวิชานั้น (หน้ารายละเอียดวิชา)
export async function fetchExamSchedule(courseId, subjectId = null) {
    const params = subjectId ? { subjectId } : {};
    const { data } = await axios.get(`${API_BASE}/by-course/${courseId}/schedule`, { params, headers: authHeaders() });
    return data;
}

// GET /api/student/exam/:token?userId= → landing status (not-started / in-progress / submitted)
export async function fetchExamByToken(token, userId) {
    const { data } = await axios.get(`${API_BASE}/${token}`, { params: { userId }, headers: authHeaders() });
    return data;
}

// POST /api/student/exam/:token/start → { examJoinId, joinedAt, durationMinutes, questions }
export async function startExam(token, userId) {
    const { data } = await axios.post(`${API_BASE}/${token}/start`, { userId }, { headers: authHeaders() });
    return data;
}

// PUT /api/student/exam/answer — autosave a single answer
export async function saveAnswer({ examJoinId, userId, questionId, selected }) {
    const { data } = await axios.put(`${API_BASE}/answer`, { examJoinId, userId, questionId, selected }, { headers: authHeaders() });
    return data;
}

// POST /api/student/exam/:examJoinId/submit → final grading
export async function submitExam(examJoinId, userId) {
    const { data } = await axios.post(`${API_BASE}/${examJoinId}/submit`, { userId }, { headers: authHeaders() });
    return data;
}

// GET /api/student/exam/:examJoinId/result?userId= → full per-question review
export async function fetchExamResult(examJoinId, userId) {
    const { data } = await axios.get(`${API_BASE}/${examJoinId}/result`, { params: { userId }, headers: authHeaders() });
    return data;
}

// POST /api/student/exam/question/enter — log ว่านักเรียนเริ่มดูข้อนี้เมื่อไหร่
export async function logQuestionEnter({ examJoinId, userId, questionId }) {
    const { data } = await axios.post(`${API_BASE}/question/enter`, { examJoinId, userId, questionId }, { headers: authHeaders() });
    return data;
}

// POST /api/student/exam/integrity-log — บันทึก "ธงคุณภาพข้อมูล" ระหว่างสอบ
// eventType: 'leave' = ออกจากหน้าสอบแล้วกลับมา (ส่ง durationSec มาด้วย) | 'copy' = คัดลอกข้อความในหน้าสอบ
// ผู้เรียกต้อง .catch() เองเสมอ — การบันทึกล้มเหลวต้องไม่กระทบการทำข้อสอบ
export async function logIntegrityEvent({ examJoinId, eventType, durationSec = null, questionId = null }) {
    const { data } = await axios.post(
        `${API_BASE}/integrity-log`,
        { examJoinId, eventType, durationSec, questionId },
        { headers: authHeaders() }
    );
    return data;
}