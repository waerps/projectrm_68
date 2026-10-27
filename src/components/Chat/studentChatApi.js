import { API_URL } from "../../config"

const root = `${API_URL}/api/student/chat/conversations`

async function request(path = "", { method = "GET", body, signal } = {}) {
  const token = localStorage.getItem("student_token")
  if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่")
  const response = await fetch(`${root}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || "โหลดหรือบันทึกประวัติแชตไม่สำเร็จ")
  return data
}

export const studentChatApi = {
  list: () => request(),
  get: (id) => request(`/${encodeURIComponent(id)}`),
  create: (title) => request("", { method: "POST", body: { title } }),
  rename: (id, title) => request(`/${encodeURIComponent(id)}`, { method: "PATCH", body: { title } }),
  remove: (id) => request(`/${encodeURIComponent(id)}`, { method: "DELETE" }),
  ask: (id, text, requestId, signal) => request(`/${encodeURIComponent(id)}/ask`, { method: "POST", body: { text, requestId }, signal }),
}
