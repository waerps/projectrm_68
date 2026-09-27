import { ChevronLeft, ChevronRight } from "lucide-react";

/* ตัวแบ่งหน้ามาตรฐาน (แบบหน้าการเงินแอดมิน)
   page เริ่มที่ 1 · ส่ง total + pageSize เพื่อแสดง "แสดง a–b จาก n <unit>" */
export default function Pagination({ page, totalPages, onChange, total, pageSize, unit = "รายการ", className = "" }) {
  if (!totalPages || totalPages <= 1) return null;
  const items = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push("..."); acc.push(p); return acc; }, []);
  const btn = "flex h-9 min-w-9 px-2 items-center justify-center rounded-xl text-sm font-medium transition";
  const idle = "border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600";
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-sm text-slate-500">
        {total != null && pageSize ? (
          <>แสดง <span className="font-semibold text-slate-700">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</span> จาก <span className="font-semibold text-slate-700">{Number(total).toLocaleString()}</span> {unit}</>
        ) : (
          <>หน้า <span className="font-semibold text-slate-700">{page}</span> จาก <span className="font-semibold text-slate-700">{totalPages}</span></>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" aria-label="หน้าก่อนหน้า" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className={`${btn} ${idle}`}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        {items.map((p, i) => p === "..." ? (
          <span key={`d${i}`} className="flex h-9 w-6 items-center justify-center text-sm text-slate-400">…</span>
        ) : (
          <button key={p} type="button" onClick={() => onChange(p)}
            className={`${btn} ${p === page ? "bg-orange-500 text-white shadow-sm" : idle}`}>{p}</button>
        ))}
        <button type="button" aria-label="หน้าถัดไป" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className={`${btn} ${idle}`}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
