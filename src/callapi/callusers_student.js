import axios from "axios";

const BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:3000";

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
