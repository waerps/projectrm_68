import { API_URL } from "../config";
import axios from "axios";

const BASE_URL = API_URL; // ใช้ค่ากลางจาก config (preview/production ไม่หลุดไป localhost)

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

function withAuth(token) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

function throwNiceError(error) {
  console.error("API Error:", error);
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "เกิดข้อผิดพลาดขณะส่งข้อมูล";
  throw message;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function studentLogin(username, password) {
  try {
    const res = await apiClient.post('/auth/login', {
      username,
      password,
    });

    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getStudentProfile(token) {
  try {
    const res = await apiClient.get("/api/student/profile", withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function updateStudentProfile(token, payload) {
  try {
    const res = await apiClient.put("/api/student/profile", payload, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getParentProfileTypes() {
  try {
    const res = await apiClient.get("/api/student/profile/parent-profile-types");
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function submitParentProfile(token, payload) {
  try {
    const res = await apiClient.post("/api/student/profile/parent", payload, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function updateParentProfile(token, payload) {
  try {
    const res = await apiClient.put("/api/student/profile/parent", payload, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Courses (enrolled) ───────────────────────────────────────────────────────

export async function getStudentCourses(token) {
  try {
    const res = await apiClient.get("/api/student/courses", withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getStudentCourseDetail(token, courseId) {
  try {
    const res = await apiClient.get(
      `/api/student/courses/${courseId}/detail`,
      withAuth(token)
    );
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export async function getStudentSchedule(token) {
  try {
    const res = await apiClient.get("/api/student/schedule", withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export async function getStudentVideos(token, courseId) {
  try {
    const res = await apiClient.get(`/api/student/courses/${courseId}/videos`, withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

export async function updateVideoProgress(token, videoId, payload) {
  try {
    // payload: { WatchPercent, LastWatchTime }
    const res = await apiClient.put(
      `/api/student/videos/${videoId}/progress`,
      payload,
      withAuth(token)
    );
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function updateVideoWatchSegments(token, videoId, payload) {
  try {
    const res = await apiClient.put(
      `/api/student/videos/${videoId}/watch-segments`,
      payload,
      withAuth(token)
    );
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Files ───────────────────────────────────────────────────────────────────

export async function getStudentFiles(token, courseId) {
  try {
    const res = await apiClient.get(`/api/student/courses/${courseId}/files`, withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Subjects (course + subject scoped) ───────────────────────────────────────

// ส่ง token ด้วย เพื่อให้เปิดคอร์สเดี่ยว (ซ่อนจากหน้าเว็บ) ของตัวเองได้
export async function getCourseBasic(courseId, token) {
  try {
    const res = await apiClient.get(`/courses/${courseId}`, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getStudentSubjectsProgress(token, courseId) {
  try {
    const res = await apiClient.get(`/courses/${courseId}/subjects-progress`, withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getStudentSubjectVideos(token, courseId, subjectId) {
  try {
    const res = await apiClient.get(`/courses/${courseId}/subjects/${subjectId}/videos`, withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getStudentSubjectFiles(token, courseId, subjectId) {
  try {
    const res = await apiClient.get(`/courses/${courseId}/subjects/${subjectId}/files`, withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export async function getStudentAttendance(token) {
  try {
    const res = await apiClient.get("/api/student/attendance", withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function getStudentPayments(token) {
  try {
    const res = await apiClient.get("/api/student/payments", withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

export async function createLineLinkCode(token) {
  try {
    const res = await apiClient.post("/api/payments/line-link-code", {}, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getLineLoginStatus(token) {
  try {
    const res = await apiClient.get("/api/line/login/status", withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function startLineLogin(token, returnPath) {
  try {
    const res = await apiClient.post("/api/line/login/start", { returnPath }, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function disconnectLine(token) {
  try {
    const res = await apiClient.delete("/api/line/login/connection", withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getPaymentOrders(token) {
  try {
    const res = await apiClient.get("/api/payments/orders", withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getInstallmentQr(token, installmentId) {
  try {
    const res = await apiClient.get(`/api/payments/installments/${installmentId}/qr`, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function verifyInstallmentSlip(token, installmentId, slipImage) {
  try {
    const form = new FormData();
    form.append("installmentId", installmentId);
    form.append("slipImage", slipImage);
    const res = await apiClient.post("/api/payments/check-slip", form, {
      ...withAuth(token),
      headers: {
        ...withAuth(token).headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getStudentNotifications(token) {
  try {
    const res = await apiClient.get("/api/student/notifications", withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── Incidents (ใช้ร่วมกันทั้ง student และ tutor — token เดียวกันทั้งระบบ) ─────

export async function getMyIncidents(token) {
  try {
    const res = await apiClient.get("/api/incidents/mine", withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getIncidentsAgainstMe(token) {
  try {
    const res = await apiClient.get("/api/incidents/against-me", withAuth(token));
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getIncidentDetail(token, incidentId) {
  try {
    const res = await apiClient.get(`/api/incidents/${incidentId}`, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function cancelIncident(token, incidentId) {
  try {
    const res = await apiClient.delete(`/api/incidents/${incidentId}`, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// ─── ความยินยอม PDPA ─────────────────────────────────────────────────────────

export async function getConsentCatalog() {
  try {
    const res = await apiClient.get("/api/consents/catalog");
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// courseId ไม่ระบุ (undefined) → backend สรุปภาพรวม "ทุกคอร์สที่ลงทะเบียนอยู่" แทน
// (ใช้กับ PdpaConsentBanner ที่ยังไม่รู้ว่ากำลังพูดถึงคอร์สไหน) — ระบุ courseId มา →
// สถานะของคอร์สนั้นเท่านั้น (ใช้ตอน checkout คอร์สหนึ่ง ๆ ใน Cart.jsx)
export async function getMyConsents(token, courseId) {
  try {
    const params = courseId ? { courseId } : {};
    const res = await apiClient.get("/api/consents/me", { ...withAuth(token), params });
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// courseId: บังคับ — ความยินยอมผูกกับคอร์สเสมอ (backend ตอบ 400 ถ้าไม่ส่งมา)
// items: [{ consentKey, isGranted }]
// opts.grantedByRole: "student" | "parent" — ใครเป็นคนกดตอบจริง ๆ ตอนนี้ (ดีฟอลต์ "student"
// ที่ backend) ใช้ตอนผู้ปกครองเป็นคนตอบแทนผู้เยาว์ผ่านหน้าเว็บ (เช่น ตอนซื้อคอร์ส/ดูโปรไฟล์)
export async function saveConsents(token, courseId, items, opts = {}) {
  try {
    const body = { items, courseId };
    if (opts.grantedByRole) body.grantedByRole = opts.grantedByRole;
    const res = await apiClient.post("/api/consents", body, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getVideoLearningState(token, videoId) {
  try {
    const res = await apiClient.get(`/api/student/videos/${videoId}/learning-state`, withAuth(token));
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function submitVideoQuestionAnswer(token, videoId, questionId, optionId, requestId) {
  try {
    const res = await apiClient.post(
      `/api/student/videos/${videoId}/questions/${questionId}/attempt`,
      { optionId, requestId },
      withAuth(token)
    );
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}
