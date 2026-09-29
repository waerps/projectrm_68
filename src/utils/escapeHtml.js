/* escape ข้อความก่อนแทรกลงใน HTML string (เช่น หน้าพิมพ์รายงาน) — กันสคริปต์แฝงจากชื่อที่ผู้ใช้กรอก */
const MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => MAP[ch]);
export default escapeHtml;
