import { BADGE_BASE, BADGE_TONE } from "./tokens";

/* ป้ายสถานะมาตรฐาน: tone = success | warning | danger | info | neutral | brand
   ถ้าต้องใช้สีเฉพาะ (เช่นระดับความรุนแรงจาก config) ส่ง colorClass แทน tone */
export default function Badge({ tone = "neutral", colorClass, icon, className = "", children }) {
  const Icon = icon;
  return (
    <span className={`${BADGE_BASE} ${colorClass || BADGE_TONE[tone] || BADGE_TONE.neutral} ${className}`}>
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  );
}
