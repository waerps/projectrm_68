// ─── ชื่อเรียกและคำอธิบาย "พัฒนาการ" กลางของทั้งระบบ ─────────────────────────
// ในระบบมีตัวเลข 3 ชนิด ต้องเรียกชื่อให้ต่างกันเสมอ ห้ามเรียกรวมว่า "พัฒนาการ" เฉย ๆ
//   ① คะแนนเปลี่ยนแปลง       = คะแนนรอบหลัง − คะแนนรอบแรก              (หน่วย: คะแนน)
//   ② พัฒนาการสัมพัทธ์        = ① ÷ คะแนนที่ยังพัฒนาได้ × 100            (หน่วย: %)
//      (Relative Gain / Normalized Gain — สูตรกลางอยู่ที่ backend services/studentPerformance.js computeGrowth)
//   ③ คะแนนจัดอันดับพัฒนาการ = ② × 80% + การเข้าเรียน × 20%            (หน่วย: /100 ใช้จัดโพเดียมเท่านั้น)
// และต้องบอกรอบที่เทียบกำกับไว้ทุกครั้ง เช่น "Pre-test → Mid-test"

export const CHANGE_LABEL = "คะแนนเปลี่ยนแปลง";
export const GROWTH_LABEL = "พัฒนาการสัมพัทธ์";
// ระดับพัฒนาการสัมพัทธ์ — เกณฑ์ 4 ระดับที่ใช้ทั่วไปในการวัดผลการศึกษาไทย
const LEVELS = [
  { max: 25, label: "ระดับต้น", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  { max: 50, label: "ระดับกลาง", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  { max: 75, label: "ระดับสูง", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { max: 100, label: "ระดับสูงมาก", cls: "bg-green-100 text-green-800 border-green-300" },
];
export function growthLevel(growth) {
  if (growth == null || !Number.isFinite(Number(growth))) return null;
  return LEVELS.find((l) => Number(growth) <= l.max) || LEVELS[LEVELS.length - 1];
}

const r1 = (v) => Math.round(Number(v) * 10) / 10;
export const fmtGrowth = (g) => (g == null ? "—" : `${Math.round(Number(g))}%`);
export const fmtChange = (delta, unit = "คะแนน") =>
  delta == null ? "—" : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(r1(delta)).toLocaleString("th-TH")} ${unit}`;

// basis จาก backend: 'pre-post' | 'pre-mid'
export const basisLabel = (basis) => (basis === "pre-mid" ? "Pre-test → Mid-test" : "Pre-test → Post-test");
