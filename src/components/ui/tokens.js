/* ─────────────────────────────────────────────────────────────────────────
   Design tokens กลางของระบบ (ติวเตอร์ / แอดมิน / นักเรียน)
   ใช้ร่วมกับ components ใน components/ui — ห้ามเขียนสไตล์พวกนี้ใหม่ในแต่ละหน้า
   ────────────────────────────────────────────────────────────────────── */

// ปุ่ม — มุม rounded-xl เท่ากันทุกแบบ
export const BTN = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed",
  primary: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm",
  secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  md: "h-10 px-4",
  sm: "h-8 px-3 text-xs",
};

// ช่องกรอก — สูง h-10, กรอบตอนกด orange-400
export const INPUT = "w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition";

// ป้ายสถานะ
export const BADGE_BASE = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap";
export const BADGE_TONE = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
  brand: "bg-orange-50 text-orange-700 border-orange-200",
};

// หัวข้อหน้า
export const PAGE_TITLE = "text-xl sm:text-2xl font-bold text-slate-900";
export const PAGE_SUBTITLE = "text-sm text-slate-500 mt-1";

/* จุดเปลี่ยน layout (กติกาของระบบ)
   - ตารางข้อมูลหลัก (รายชื่อ/ธุรกรรม/เคส ฯลฯ): จอ < lg แสดงเป็นการ์ด  → `lg:hidden` / `hidden lg:block`
   - ตารางสอนรายสัปดาห์ (ติวเตอร์/แอดมิน): จอ < lg แสดงแบบรายวัน       → `lg:hidden` / `hidden lg:block`
   - Navbar: เมนูเต็มแสดงที่ md ขึ้นไป */
export const BREAKPOINT = { table: "lg", schedule: "lg", navbar: "md" };

/* แถบแจ้งเตือนในหน้า (Callout) — ใช้กล่อง + สีตามระดับเดียวกันทุกหน้า
   ใช้คู่กัน: className={`${CALLOUT.box} ${CALLOUT.warning}`} + ไอคอน h-5 w-5 สี CALLOUT_ICON.warning */
export const CALLOUT = {
  box: "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  danger: "bg-red-50 border-red-200 text-red-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
};
export const CALLOUT_ICON = { info: "text-blue-500", warning: "text-amber-500", danger: "text-red-500", success: "text-emerald-500" };

/* ตัวเลขสรุป / การ์ดสถิติ (KPI) — ใช้ขนาดเดียวกันทุกหน้า (อ้างอิงหน้าการเงิน)
   <p className={STAT_LABEL}>ป้าย</p>
   <p className={STAT_VALUE}>123<span className={STAT_UNIT}>หน่วย</span></p>
   <p className={STAT_SUB}>คำอธิบายย่อย</p>
   ต้องการสีเฉพาะ (เช่น ค้างชำระ) ให้ใช้ STAT_NUM (ไม่มีสี) + คลาสสี เช่น `${STAT_NUM} text-red-600`
   (ไม่ต่อสีท้าย STAT_VALUE เพราะ Tailwind ไม่รับประกันว่าคลาสสีไหนชนะ) */
export const STAT_LABEL = "text-xs font-medium text-slate-500";
export const STAT_NUM = "text-xl sm:text-2xl font-bold tabular-nums leading-tight";
export const STAT_VALUE = `${STAT_NUM} text-slate-900`;
export const STAT_UNIT = "ml-1 text-xs font-medium text-slate-500";
export const STAT_SUB = "text-[11px] text-slate-500";
