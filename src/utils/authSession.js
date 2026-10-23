const AUTH_CHANNEL_NAME = "sornserm-auth-session";
let authChannel;

function getAuthChannel() {
  if (authChannel || typeof BroadcastChannel === "undefined") return authChannel;
  try {
    authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    authChannel.addEventListener("message", (event) => {
      if (event.data?.type !== "session-check") return;
      try {
        if (sessionStorage.getItem("session_active") === "1" && getAuthenticatedRole()) {
          authChannel.postMessage({ type: "session-present", requestId: event.data.requestId });
        }
      } catch { /* Storage may be unavailable. */ }
    });
  } catch { return null; }
  return authChannel;
}

function hasAnotherOpenSession(channel) {
  if (!channel) return Promise.resolve(false);
  return new Promise((resolve) => {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const finish = (found) => {
      clearTimeout(timeout);
      channel.removeEventListener("message", onMessage);
      resolve(found);
    };
    const onMessage = (event) => {
      if (event.data?.type === "session-present" && event.data.requestId === requestId) finish(true);
    };
    const timeout = setTimeout(() => finish(false), 500);
    channel.addEventListener("message", onMessage);
    channel.postMessage({ type: "session-check", requestId });
  });
}

export function startAuthSession() {
  // หน้าเข้าสู่ระบบยังไม่มีตัวเลือกให้จำบัญชี จึงให้การล็อกอินอยู่แค่ช่วงเปิดแท็บนี้
  localStorage.setItem("remember_me", "false");
  sessionStorage.setItem("session_active", "1");
}

export async function enforceAuthSessionOnStartup() {
  try {
    let signedOut = false;
    const channel = getAuthChannel();
    const token = localStorage.getItem("student_token");
    const rememberMe = localStorage.getItem("remember_me");
    const sessionActive = sessionStorage.getItem("session_active");
    if (token && rememberMe !== "true" && !sessionActive) {
      if (await hasAnotherOpenSession(channel)) {
        sessionStorage.setItem("session_active", "1");
      } else {
        localStorage.removeItem("student_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user");
        localStorage.removeItem("remember_me");
        signedOut = true;
      }
    }
    if (localStorage.getItem("student_token")) sessionStorage.setItem("session_active", "1");
    else sessionStorage.removeItem("session_active");
    return signedOut;
  } catch {
    // เบราว์เซอร์บางโหมดไม่อนุญาต storage
    return false;
  }
}

export function readTokenClaims() {
  try {
    const token = localStorage.getItem("student_token");
    if (!token) return null;
    const payload = JSON.parse(decodeURIComponent(escape(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuthenticatedRole() {
  const role = readTokenClaims()?.role;
  return role === "student" || role === "tutor" || role === "admin" ? role : null;
}
