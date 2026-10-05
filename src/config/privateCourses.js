/* ─────────────────────────────────────────────────────────────────────────
   คอร์สเดี่ยว (เรียนส่วนตัว 1–2 คน) — ค่าคงที่ที่ใช้ร่วมกันทั้งหน้าเว็บและหน้าแอดมิน
   รายวิชาที่โชว์หน้าเว็บเก็บในฐานข้อมูล (private_course_offers) แอดมินจัดการที่ /admin/private-courses
   ───────────────────────────────────────────────────────────────────────── */
import {
  Calculator, Languages, FlaskConical, BookOpenText, Atom, TestTubes, Leaf, Landmark, Cpu, BookOpen,
} from "lucide-react";

export const PRIVATE_CONTACT = {
  name: "พี่กวาง",
  role: "เจ้าของสถาบัน",
  phone: "082-664-6551",
  tel: "tel:0826646551",
  facebookName: "ศรเสริม ติวเตอร์ - SornSerm Tutor",
  facebookUrl: "https://www.facebook.com/SornSerm.tutor",
};

// ราคาประชาสัมพันธ์คอร์สเดี่ยว ใช้ร่วมกันทุกจุดบนหน้าเว็บ
export const PRIVATE_PRICING = [
  { learners: 1, label: "เรียน 1 คน", modes: [
    { key: "onsite", label: "ออนไซต์", starting: 300, packages: [{ hours: 15, price: 4300 }, { hours: 20, price: 5200 }, { hours: 30, price: 7000 }] },
    { key: "online", label: "ออนไลน์", starting: 250, packages: [{ hours: 15, price: 3700 }, { hours: 20, price: 4600 }, { hours: 30, price: 6500 }] },
  ] },
  { learners: 2, label: "เรียน 2 คน", modes: [
    { key: "onsite", label: "ออนไซต์", packages: [{ hours: 15, price: 3000 }, { hours: 20, price: 3500 }, { hours: 30, price: 5000 }] },
    { key: "online", label: "ออนไลน์", packages: [{ hours: 15, price: 2000 }, { hours: 20, price: 2500 }, { hours: 30, price: 3500 }] },
  ] },
];
export const PRIVATE_GRADE_OPTIONS = [
  ...Array.from({ length: 6 }, (_, i) => `ป.${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `ม.${i + 1}`),
  "อื่น ๆ",
];

// ระดับชั้นแยกเป็นชั้นปีจริง (ไม่ใช่แค่ช่วงกว้างๆ) เพราะบางวิชาอาจเปิดสอนแค่ชั้นเดียว เช่น ม.6
// ปุ่ม "ทั้งหมด" ของแต่ละกลุ่มในหน้าแอดมินจะเลือก/ยกเลิกทุกชั้นในกลุ่มนั้นให้ทีเดียว
export const PRIVATE_GRADE_GROUPS = [
  { key: "primary", label: "ประถม", grades: ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"] },
  { key: "middle", label: "ม.ต้น", grades: ["ม.1", "ม.2", "ม.3"] },
  { key: "high", label: "ม.ปลาย", grades: ["ม.4", "ม.5", "ม.6"] },
];
// รายชั้นทั้งหมดแบบแบน (ใช้เป็นตัวกรองในหน้าเว็บ — โชว์เฉพาะชั้นที่มีวิชาเปิดสอนจริง)
export const PRIVATE_LEVELS = PRIVATE_GRADE_GROUPS.flatMap((g) => g.grades);

// ไอคอนวิชา: key ที่เก็บใน private_course_offers.IconKey → ไอคอนที่แสดง
export const PRIVATE_ICONS = {
  math: { label: "คณิตศาสตร์", Icon: Calculator },
  english: { label: "ภาษาอังกฤษ", Icon: Languages },
  science: { label: "วิทยาศาสตร์", Icon: FlaskConical },
  thai: { label: "ภาษาไทย", Icon: BookOpenText },
  physics: { label: "ฟิสิกส์", Icon: Atom },
  chemistry: { label: "เคมี", Icon: TestTubes },
  biology: { label: "ชีววิทยา", Icon: Leaf },
  social: { label: "สังคมศึกษา", Icon: Landmark },
  tech: { label: "เทคโนโลยี", Icon: Cpu },
  other: { label: "อื่นๆ", Icon: BookOpen },
};
export const PRIVATE_SUBJECT_OPTIONS = Object.entries(PRIVATE_ICONS)
  .filter(([key]) => key !== "other")
  .map(([key, subject]) => ({ key, name: subject.label }));
export const privateIconOf = (key) => (PRIVATE_ICONS[key] || PRIVATE_ICONS.other).Icon;

// ข้อความสำเร็จรูปสำหรับทักพี่กวาง
export const privateInquiryMessage = (subjectName) =>
  `สวัสดีค่ะพี่กวาง สนใจคอร์สเดี่ยว${subjectName ? `วิชา${subjectName}` : ""} สำหรับน้องชั้น ____ อยากปรึกษาเรื่องการประเมินและเลือกครูค่ะ`;
