import { X } from "lucide-react";

/* ปุ่ม "ล้างตัวกรอง" มาตรฐาน — แสดงเฉพาะตอนมีการกรอง/ค้นหาอยู่ (show) */
export default function ClearFiltersButton({ show = true, onClick, className = "" }) {
  if (!show) return null;
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 h-10 px-3 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition ${className}`}>
      <X className="h-3.5 w-3.5" /> ล้างตัวกรอง
    </button>
  );
}
