// utils/examScore.js
// ตัวช่วยเรื่อง "คะแนน" ของข้อสอบ — ฟังก์ชันบริสุทธิ์ล้วน ไม่ import อะไรเลย
// แยกไฟล์ไว้เพื่อให้ทั้งฝั่งติวเตอร์และฝั่งนักเรียนใช้ร่วมกันได้ โดยฝั่งนักเรียน
// ไม่ต้องดึง examShared.js (ซึ่งลาก axios กับ XLSX มาด้วย) ติดไปใน bundle

// เพดานคะแนนต่อ 1 รอบสอบ ตามกติกาของสถาบัน — ทุกวิชาเท่ากันหมด
// (แพ็กเกจ 5 วิชา = 100 คะแนน, 4 วิชา = 80 คะแนน)
export const EXAM_SCORE_CAP = 20;

// แบ่งคะแนนเต็มให้ข้อสอบ n ข้อเท่า ๆ กัน โดยผลรวมต้องเท่ากับ cap "เป๊ะ"
// วิธี: คิดเป็นหน่วยสตางค์เพื่อเลี่ยงปัญหาทศนิยมลอยตัว แล้วแจกเศษที่เหลือ
// ให้ข้อแรก ๆ ทีละ 0.01 — เช่น 30 ข้อ จะได้ 0.67 x 20 ข้อ + 0.66 x 10 ข้อ = 20.00 พอดี
// (ถ้าหารตรง ๆ แล้วปัดจะได้ 0.67 x 30 = 20.10 ซึ่งเกินเพดาน)
export function splitScoreEvenly(n, cap = EXAM_SCORE_CAP) {
  if (!n || n < 1) return [];
  const totalCents = Math.round(cap * 100);
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100);
}

// รวมคะแนนของข้อสอบทั้งชุด — ปัดที่ 2 ตำแหน่งเพื่อกันเศษทศนิยมลอยตัว
// (0.1 + 0.2 ใน JavaScript ได้ 0.30000000000000004 ถ้าไม่ปัดจะโผล่บนหน้าจอ)
export function sumScores(questions) {
  const cents = (questions || []).reduce((s, q) => s + Math.round((Number(q?.score) || 0) * 100), 0);
  return cents / 100;
}

// จัดรูปแบบคะแนนสำหรับแสดงผล — ตัดศูนย์ท้ายทิ้งและกันทศนิยมลอยตัว
// 0.50 → "0.5" · 2 → "2" · 4.0200000000000005 → "4.02" · null → "—"
// จำเป็นเพราะฐานข้อมูลคืนค่า DECIMAL มาเป็นข้อความ ("0.50") และการบวกทศนิยม
// ในฝั่ง JavaScript ทำให้เกิดเศษยาว ๆ ที่ไม่ควรโผล่ให้ผู้ใช้เห็น
export function fmtScore(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return String(Math.round(n * 100) / 100);
}
