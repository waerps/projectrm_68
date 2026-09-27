/* ─────────────────────────────────────────────────────────────────────────
   คอร์สเดี่ยว (เรียนตัวต่อตัว 1:1) — ข้อมูลที่แสดงบนหน้าเว็บ
   คอร์สเดี่ยวไม่ขายผ่านระบบ ผู้สนใจต้องติดต่อพี่กวางเพื่อประเมินน้องและเลือกครูก่อน
   แก้ข้อมูลติดต่อ ราคาเริ่มต้น และรายวิชาได้ที่ไฟล์นี้ไฟล์เดียว
   ───────────────────────────────────────────────────────────────────────── */

export const PRIVATE_CONTACT = {
  name: "พี่กวาง",
  role: "เจ้าของสถาบัน",
  phone: "082-664-6551",
  tel: "tel:0826646551",
  facebookName: "ศรเสริม ติวเตอร์ - SornSerm Tutor",
  facebookUrl: "https://www.facebook.com/SornSerm.tutor",
};

// ราคาเริ่มต้นต่อชั่วโมง (ราคาจริงพี่กวางกำหนดตามวิชา ความยาก และจำนวนชั่วโมง)
export const PRIVATE_STARTING_PRICE = 350;

export const PRIVATE_LEVELS = ["ม.ต้น", "ม.ปลาย"];

// icon = ชื่อไอคอนใน PrivateCourses.jsx (SUBJECT_ICONS)
// price = ราคาเริ่มต้น/ชม. ของวิชานั้น, ใส่ null ถ้าต้องการให้ขึ้น "สอบถามราคา"
export const PRIVATE_SUBJECTS = [
  { key: "math", name: "คณิตศาสตร์", icon: "math", levels: ["ม.ต้น", "ม.ปลาย"], price: PRIVATE_STARTING_PRICE, note: "ปูพื้นฐาน · เพิ่มเกรด · เตรียมสอบ" },
  { key: "english", name: "ภาษาอังกฤษ", icon: "english", levels: ["ม.ต้น", "ม.ปลาย"], price: PRIVATE_STARTING_PRICE, note: "Grammar · Reading · สอบเข้า" },
  { key: "science", name: "วิทยาศาสตร์", icon: "science", levels: ["ม.ต้น"], price: PRIVATE_STARTING_PRICE, note: "สรุปเนื้อหา · ฝึกทำโจทย์" },
  { key: "thai", name: "ภาษาไทย", icon: "thai", levels: ["ม.ต้น", "ม.ปลาย"], price: PRIVATE_STARTING_PRICE, note: "หลักภาษา · อ่านจับใจความ" },
  { key: "physics", name: "ฟิสิกส์", icon: "physics", levels: ["ม.ปลาย"], price: PRIVATE_STARTING_PRICE, note: "กลศาสตร์ · ไฟฟ้า · สอบเข้า" },
  { key: "chemistry", name: "เคมี", icon: "chemistry", levels: ["ม.ปลาย"], price: PRIVATE_STARTING_PRICE, note: "ปริมาณสัมพันธ์ · สมดุลเคมี" },
  { key: "biology", name: "ชีววิทยา", icon: "biology", levels: ["ม.ปลาย"], price: PRIVATE_STARTING_PRICE, note: "สรุปเข้มข้น · ติวรายบท" },
  { key: "social", name: "สังคมศึกษา", icon: "social", levels: ["ม.ต้น", "ม.ปลาย"], price: PRIVATE_STARTING_PRICE, note: "ประวัติศาสตร์ · หน้าที่พลเมือง" },
];

// ข้อความสำเร็จรูปสำหรับทักพี่กวาง
export const privateInquiryMessage = (subjectName) =>
  `สวัสดีค่ะพี่กวาง สนใจคอร์สเดี่ยว${subjectName ? `วิชา${subjectName}` : ""} สำหรับน้องชั้น ____ อยากปรึกษาเรื่องการประเมินและเลือกครูค่ะ`;
