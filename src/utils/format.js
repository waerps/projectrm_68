// project/src/utils/format.js
// ─── ฟังก์ชัน format ข้อมูลฟอร์มที่ใช้ร่วมกันหลายหน้า (สมัครสมาชิก, แก้ไขข้อมูลนักเรียน/ผู้ปกครองในแอดมิน) ───
// อ้างอิงลอจิกเดียวกับที่ใช้ใน pageadmin/AdminStudents.jsx (formatPhone/formatGPA เดิม)
// แยกมาไว้ที่นี่เพื่อให้หน้าอื่น (เช่น Register.jsx) เรียกใช้ตัวเดียวกันได้ ไม่ต้องเขียนซ้ำ

// เบอร์โทร: พิมพ์ตัวเลขล้วน ๆ แล้วแทรก "-" ให้อัตโนมัติเป็น 0xx-xxx-xxxx
export const formatPhone = (v) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
};

// GPA: พิมพ์ตัวเลขล้วน ๆ แล้วแทรกจุดทศนิยมให้อัตโนมัติ (พิมพ์ "350" ได้ "3.50") กันไม่ให้เกิน 4.00
export const formatGPA = (raw) => {
  const digits = (raw || "").replace(/[^\d]/g, "").slice(0, 3);
  if (digits.length === 0) return "";
  const formatted = digits.length === 1 ? digits : `${digits[0]}.${digits.slice(1)}`;
  if (parseFloat(formatted) > 4) return "4.00";
  return formatted;
};
