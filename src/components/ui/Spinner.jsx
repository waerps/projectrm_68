import { Loader2 } from "lucide-react";

/* ตัวโหลดมาตรฐานของทั้งเว็บ — ใช้ตัวนี้ที่เดียว ไม่เขียนวงหมุนเอง
   - inline (ค่าเริ่มต้น): ไอคอนหมุนอย่างเดียว ใช้ในปุ่ม/ช่องเล็ก
   - block: วงหมุนสีส้มขนาดใหญ่ + ข้อความกลางพื้นที่ (ใช้ตอนโหลดหน้า/ส่วนของหน้า)
     wrapperClassName กำหนดความสูง/กรอบของพื้นที่ (ค่าเริ่มต้น py-12) — ใช้จองที่กัน CLS */
export default function Spinner({ size, label, block = false, className = "", wrapperClassName = "py-12" }) {
  const sz = size || (block ? "lg" : "md");
  const s = sz === "sm" ? "h-4 w-4" : sz === "lg" ? "h-8 w-8" : "h-6 w-6";
  const icon = <Loader2 className={`${s} animate-spin text-orange-500 ${className}`} aria-hidden={block ? "true" : undefined} />;
  if (!block) return icon;
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 text-center ${wrapperClassName}`}>
      {icon}
      <p className={label ? "text-sm font-medium text-slate-500" : "sr-only"}>{label || "กำลังโหลด..."}</p>
    </div>
  );
}
