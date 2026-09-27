import { Loader2 } from "lucide-react";

/* ตัวโหลดมาตรฐาน — ใช้แทนวงหมุนที่เขียนเอง / RefreshCw
   block = แสดงกลางพื้นที่พร้อมข้อความ */
export default function Spinner({ size = "md", label, block = false, className = "" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const icon = <Loader2 className={`${s} animate-spin text-orange-500 ${className}`} />;
  if (!block) return icon;
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-slate-500">
      {icon}
      {label && <p>{label}</p>}
    </div>
  );
}
