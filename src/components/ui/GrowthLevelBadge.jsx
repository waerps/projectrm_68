import { growthLevel } from "../../utils/growthText";

// ป้ายระดับพัฒนาการสัมพัทธ์ — จุดสีตรงกับไม้บรรทัดระดับ (ต้น/กลาง/สูง/สูงมาก)
const DOT = { "ระดับต้น": "bg-slate-400", "ระดับกลาง": "bg-amber-400", "ระดับสูง": "bg-emerald-500", "ระดับสูงมาก": "bg-green-600" };

export default function GrowthLevelBadge({ growth, size = "md", className = "" }) {
  const level = growthLevel(growth);
  if (!level) return null;
  const sz = size === "sm" ? "px-2 py-0.5 text-[11px] gap-1" : "px-2.5 py-1 text-xs gap-1.5";
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border font-bold ${level.cls} ${sz} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${DOT[level.label] || "bg-slate-400"}`} aria-hidden="true" />
      {level.label}
    </span>
  );
}
