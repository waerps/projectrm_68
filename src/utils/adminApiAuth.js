/* ─────────────────────────────────────────────────────────────────────────
   แนบ token ให้ทุกคำขอที่ยิงไป /api/admin อัตโนมัติ (ทั้ง axios และ fetch)
   backend ตรวจสิทธิ์แอดมินทุก API ใต้ /api/admin แล้ว (middlewares/adminGuard.js)
   หน้าแอดมินเดิมหลายหน้าไม่ได้ส่ง Authorization เอง จึงแนบให้ตรงนี้ที่เดียว
   ถ้า token หมดอายุระหว่างอยู่หน้าแอดมิน (401) → พาไปหน้า login
   ───────────────────────────────────────────────────────────────────────── */
import axios from "axios";

const readToken = () => {
  try { return localStorage.getItem("student_token"); } catch { return null; }
};

const isAdminApi = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url, window.location.origin);
    return /^\/api\/admin(\/|$)/.test(u.pathname);
  } catch {
    return false;
  }
};

let redirecting = false;
const onUnauthorized = (status) => {
  if (status !== 401 || redirecting) return;
  if (!window.location.pathname.startsWith("/admin")) return;
  redirecting = true;
  try {
    localStorage.removeItem("student_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_role");
  } catch { /* ignore */ }
  window.location.href = "/login";
};

export function installAdminApiAuth() {
  if (window.__adminApiAuthInstalled) return;
  window.__adminApiAuthInstalled = true;

  axios.interceptors.request.use((config) => {
    const url = config.baseURL && !/^https?:/i.test(config.url || "") ? `${config.baseURL}${config.url || ""}` : config.url;
    if (isAdminApi(url)) {
      const token = readToken();
      const has = config.headers?.get ? config.headers.get("Authorization") : config.headers?.Authorization;
      if (token && !has) {
        if (config.headers?.set) config.headers.set("Authorization", `Bearer ${token}`);
        else config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
      }
    }
    return config;
  });
  // API แอดมินตอบ 202 = บันทึกเป็นฉบับร่างรอเผยแพร่ → แจ้งทุกจุดที่แสดงรายการร่างให้โหลดใหม่
  const notifyDraft = (status) => {
    if (status === 202) window.dispatchEvent(new Event("course-drafts-changed"));
  };
  axios.interceptors.response.use(
    (res) => {
      if (isAdminApi(res?.config?.url) || isAdminApi(`${res?.config?.baseURL || ""}${res?.config?.url || ""}`)) notifyDraft(res.status);
      return res;
    },
    (err) => {
      const url = err?.config?.url;
      if (isAdminApi(url) || isAdminApi(`${err?.config?.baseURL || ""}${url || ""}`)) onUnauthorized(err?.response?.status);
      return Promise.reject(err);
    }
  );

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url;
    if (!isAdminApi(url)) return originalFetch(input, init);
    const token = readToken();
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    const res = await originalFetch(input, { ...(init || {}), headers });
    onUnauthorized(res.status);
    notifyDraft(res.status);
    return res;
  };
}
