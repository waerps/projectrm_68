import { AlertTriangle, RefreshCw } from "lucide-react";

/* สถานะโหลดข้อมูลไม่สำเร็จ — แยกจากหน้าว่าง (EmptyState) เพื่อไม่ให้ผู้ใช้เข้าใจผิดว่า "ไม่มีข้อมูล" */
export default function ErrorState({ title = "โหลดข้อมูลไม่สำเร็จ", description = "กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง", onRetry, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-6 py-12 text-center shadow-sm ${className}`}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-600" />
      </div>
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      <button type="button" onClick={onRetry || (() => window.location.reload())}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        <RefreshCw className="h-4 w-4" /> ลองใหม่
      </button>
    </div>
  );
}
