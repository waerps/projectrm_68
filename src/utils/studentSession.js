import { API_URL } from "../config";

const GOOGLE_REGISTRATION_KEY = "student_google_registration";

export function safeStudentReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") ||
      /[\\\s]/.test(value) || [...value].some(character => character.charCodeAt(0) < 32)) return "/";
  try {
    const target = new URL(value, window.location.origin);
    if (target.origin !== window.location.origin || /^\/(?:login|register|admin|tutor)(?:\/|$)/i.test(target.pathname)) return "/";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}

export function studentReturnContext(location) {
  const queryReturnTo = new URLSearchParams(location.search).get("returnTo");
  return {
    returnTo: safeStudentReturnTo(location.state?.returnTo ?? queryReturnTo),
    openCheckout: Boolean(location.state?.openCheckout),
  };
}

export function clearGoogleRegistration() {
  try { sessionStorage.removeItem(GOOGLE_REGISTRATION_KEY); } catch { /* Storage may be unavailable. */ }
}

export function saveGoogleRegistration(data, returnContext) {
  if (typeof data.registrationToken !== "string" || !data.registrationToken || !(Number(data.expiresIn) > 0)) {
    throw new Error("เริ่มสมัครบัญชีไม่สำเร็จ กรุณาเลือกบัญชี Google อีกครั้ง");
  }
  const pending = {
    registrationToken: data.registrationToken,
    expiresAt: Date.now() + Math.min(Number(data.expiresIn), 900) * 1000,
    profile: {
      firstname: data.profile?.firstname || "",
      lastname: data.profile?.lastname || "",
      email: data.profile?.email || "",
    },
    returnTo: safeStudentReturnTo(returnContext.returnTo),
    openCheckout: Boolean(returnContext.openCheckout),
  };
  try {
    sessionStorage.setItem(GOOGLE_REGISTRATION_KEY, JSON.stringify(pending));
  } catch {
    throw new Error("เบราว์เซอร์ไม่สามารถจดจำการสมัครได้ กรุณาอนุญาตพื้นที่จัดเก็บของเว็บไซต์แล้วลองใหม่");
  }
  return pending;
}

export function readGoogleRegistration() {
  try {
    const pending = JSON.parse(sessionStorage.getItem(GOOGLE_REGISTRATION_KEY) || "null");
    if (typeof pending?.registrationToken !== "string" || !pending.registrationToken || !Number.isFinite(pending.expiresAt) || pending.expiresAt <= Date.now()) {
      clearGoogleRegistration();
      return null;
    }
    return { ...pending, returnTo: safeStudentReturnTo(pending.returnTo) };
  } catch {
    clearGoogleRegistration();
    return null;
  }
}

export function finishStudentLogin(data, navigate, returnContext) {
  if (typeof data.token !== "string" || !data.token || !data.user || data.user.role !== "student") {
    throw new Error("เข้าสู่ระบบนักเรียนไม่สำเร็จ กรุณาลองอีกครั้ง");
  }
  try {
    localStorage.setItem("student_token", data.token);
    localStorage.setItem("user_role", "student");
    localStorage.setItem("user", JSON.stringify(data.user));
  } catch {
    throw new Error("ไม่สามารถจดจำการเข้าสู่ระบบได้ กรุณาอนุญาตพื้นที่จัดเก็บของเว็บไซต์แล้วลองใหม่");
  }
  clearGoogleRegistration();
  window.dispatchEvent(new Event("student-profile-updated"));
  navigate(safeStudentReturnTo(returnContext.returnTo), {
    replace: true,
    state: { openCheckout: Boolean(returnContext.openCheckout) },
  });
}

export async function postStudentAuth(path, body, signal, token, timeoutMs = 20000) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; cancel(); }, timeoutMs);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง");
      error.status = response.status;
      error.code = data.code;
      throw error;
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timedOut) throw new Error("เซิร์ฟเวอร์ใช้เวลาตอบนานเกินไป กรุณาลองอีกครั้งในอีกสักครู่");
    if (error.name === "AbortError" || error instanceof TypeError) {
      throw new Error("การเชื่อมต่อขัดข้อง กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
