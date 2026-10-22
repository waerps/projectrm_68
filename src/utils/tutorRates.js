// เรทสถาบันของคอร์สรวม — ต้องตรงกับ backend-project/services/tutor-compensation.service.js
// บาทต่อคาบ 1.5 ชม. ตามระดับชั้นและจำนวนนักเรียนที่มาเรียนจริง
export const INSTITUTION_RATES = {
  elementary: [
    { max: 4, rate: 180 }, { max: 10, rate: 210 }, { max: 15, rate: 240 },
    { max: 20, rate: 270 }, { max: Infinity, rate: 300 },
  ],
  secondary: [
    { max: 4, rate: 210 }, { max: 10, rate: 240 }, { max: 15, rate: 270 },
    { max: 20, rate: 300 }, { max: Infinity, rate: 330 },
  ],
};

// ระดับชั้นของคอร์สเป็นหลัก ถ้าไม่ได้เลือกค่อยดูจากชื่อคอร์ส (ถือเป็นมัธยมถ้าไม่ระบุ)
export function levelTypeOf(gradeDetail = "", courseName = "") {
  const grade = String(gradeDetail || "");
  if (/ป\.?\s*\d|ประถม|อนุบาล/.test(grade)) return "elementary";
  if (/ม\.?\s*\d|มัธยม/.test(grade)) return "secondary";
  return /ป\.\d/.test(String(courseName || "")) ? "elementary" : "secondary";
}

export function institutionRate(levelType, students) {
  const table = INSTITUTION_RATES[levelType] || INSTITUTION_RATES.secondary;
  return table.find((tier) => Number(students || 0) <= tier.max)?.rate || table.at(-1).rate;
}

// ต้นทุนติวเตอร์โดยประมาณของคอร์สรวม = เรทสถาบัน × (ชั่วโมงรวม ÷ 1.5)
export function estimateBundleTutorCost(totalHours, levelType, students) {
  const rate = institutionRate(levelType, students);
  return { rate, cost: Math.round(rate * (Number(totalHours || 0) / 1.5)) };
}
