// project/src/utils/format.js
// ─── ฟังก์ชัน format ข้อมูลฟอร์มที่ใช้ร่วมกันหลายหน้า (สมัครสมาชิก, แก้ไขข้อมูลนักเรียน/ผู้ปกครองในแอดมิน) ───
// ตัวช่วยจัดรูปแบบเบอร์โทรศัพท์สำหรับฟอร์ม

// เบอร์โทร: พิมพ์ตัวเลขล้วน ๆ แล้วแทรก "-" ให้อัตโนมัติเป็น 0xx-xxx-xxxx
export const formatPhone = (v) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
};
