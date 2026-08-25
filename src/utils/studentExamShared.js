import axios from "axios";
import { API_URL } from "../config";

const API_BASE = `${API_URL}/api/student/exam`;

export function getCurrentUserId() {
    return JSON.parse(localStorage.getItem("user") || "null")?.id || null;
}

export const formatTime = (totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
};

// GET /api/student/exam/by-course/:courseId?userId= → { token } OR { choices: [...] }
// when more than one subject in this course has an exam open at once.
export async function fetchExamEntry(courseId, userId) {
    const { data } = await axios.get(`${API_BASE}/by-course/${courseId}`, { params: { userId } });
    return data;
  }

// GET /api/student/exam/:token?userId= → landing status (not-started / in-progress / submitted)
export async function fetchExamByToken(token, userId) {
    const { data } = await axios.get(`${API_BASE}/${token}`, { params: { userId } });
    return data;
}

// POST /api/student/exam/:token/start → { examJoinId, joinedAt, durationMinutes, questions }
export async function startExam(token, userId) {
    const { data } = await axios.post(`${API_BASE}/${token}/start`, { userId });
    return data;
}

// PUT /api/student/exam/answer — autosave a single answer
export async function saveAnswer({ examJoinId, userId, questionId, selected }) {
    const { data } = await axios.put(`${API_BASE}/answer`, { examJoinId, userId, questionId, selected });
    return data;
}

// POST /api/student/exam/:examJoinId/submit → final grading
export async function submitExam(examJoinId, userId) {
    const { data } = await axios.post(`${API_BASE}/${examJoinId}/submit`, { userId });
    return data;
}

// GET /api/student/exam/:examJoinId/result?userId= → full per-question review
export async function fetchExamResult(examJoinId, userId) {
    const { data } = await axios.get(`${API_BASE}/${examJoinId}/result`, { params: { userId } });
    return data;
}