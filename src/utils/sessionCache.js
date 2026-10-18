// แคชข้อมูลไว้ใน sessionStorage (อยู่แค่ในแท็บนี้ ปิดแท็บแล้วหาย) แยกตามผู้ใช้ที่ล็อกอิน
// ใช้แสดงข้อมูลล่าสุดทันทีเมื่อกลับมาหน้าเดิม แล้วค่อยดึงข้อมูลใหม่จากเซิร์ฟเวอร์มาอัปเดต (ช่วย Lighthouse LCP/CLS)
const keyOf = (name) => {
  let token = "";
  try { token = localStorage.getItem("student_token") || ""; } catch { /* ใช้ไม่ได้ */ }
  return `cache:${name}:${token.slice(-16)}`;
};

export function readSessionCache(name) {
  try { return JSON.parse(sessionStorage.getItem(keyOf(name)) || "null"); } catch { return null; }
}

export function writeSessionCache(name, value) {
  try { sessionStorage.setItem(keyOf(name), JSON.stringify(value)); } catch { /* ที่เก็บเต็มหรือใช้ไม่ได้ — ข้าม */ }
}
