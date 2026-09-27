/* ─────────────────────────────────────────────────────────────────────────
   คอร์สเดี่ยว (เรียนตัวต่อตัว 1 วิชา 1 นักเรียน) — ค่าคงที่ที่ใช้ร่วมกันทั้งหน้าเว็บและหน้าแอดมิน
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

// ราคาเริ่มต้น/ชม. ที่แสดงบนแบนเนอร์ (ราคาจริงพี่กวางกำหนดตามวิชา ความยาก และจำนวนชั่วโมง)
export const PRIVATE_STARTING_PRICE = 350;

// ระดับชั้นแยกเป็นชั้นปีจริง (ไม่ใช่แค่ช่วงกว้างๆ) เพราะบางวิชาอาจเปิดสอนแค่ชั้นเดียว เช่น ม.6
// ปุ่ม "ทั้งหมด" ของแต่ละกลุ่มในหน้าแอดมินจะเลือก/ยกเลิกทุกชั้นในกลุ่มนั้นให้ทีเดียว
export const PRIVATE_GRADE_GROUPS = [
  { key: "primary", label: "ประถม", grades: ["ป.3", "ป.4", "ป.5", "ป.6"] },
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
export const privateIconOf = (key) => (PRIVATE_ICONS[key] || PRIVATE_ICONS.other).Icon;

// ข้อความสำเร็จรูปสำหรับทักพี่กวาง
export const privateInquiryMessage = (subjectName) =>
  `สวัสดีค่ะพี่กวาง สนใจคอร์สเดี่ยว${subjectName ? `วิชา${subjectName}` : ""} สำหรับน้องชั้น ____ อยากปรึกษาเรื่องการประเมินและเลือกครูค่ะ`;
