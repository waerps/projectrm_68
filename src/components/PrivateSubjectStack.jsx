import { useEffect, useState } from "react";
import { PRIVATE_PRICING } from "../config/privateCourses";

// การ์ดสำรองตอนยังไม่มีรายวิชา (หรือกำลังโหลด)
const FALLBACK = [{ key: "all", generic: true, name: "ทุกวิชาที่น้องต้องการ", icon: "other", levels: [], note: "ประเมินก่อนเรียน · เลือกครูได้" }];

/* การ์ดวิชาคอร์สเดี่ยวซ้อนกัน เลื่อนเปลี่ยนเองทุก 3.8 วินาที
   (ภาษาเดียวกับ AboutFlashcard ในหน้าแรก) — ใช้ในแบนเนอร์หน้าคอร์สเดี่ยว */
export default function PrivateSubjectStack({ subjects, iconOf, onSelect, className = "relative mx-auto h-[230px] w-full max-w-[320px] md:ml-auto md:mr-4" }) {
  const items = subjects?.length ? subjects : FALLBACK;
  const [idx, setIdx] = useState(0);
  const n = items.length;
  useEffect(() => {
    if (n < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), 3800);
    return () => clearInterval(t);
  }, [n]);

  return (
    <div className={className}>
      {items.map((s, i) => {
        const off = (i - (idx % n) + n) % n;
        const Icon = iconOf(s);
        const top = off === 0;
        return (
          <button key={s.key} type="button" tabIndex={top ? 0 : -1} onClick={() => top && onSelect?.(s)}
            className={`absolute inset-0 overflow-hidden rounded-3xl p-5 text-left shadow-xl transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] [&>*]:transition-opacity [&>*]:duration-500 ${top ? "cursor-pointer" : "pointer-events-none [&>*]:opacity-0"}`}
            style={{
              background: "linear-gradient(160deg,#ffffff 0%,#FFF3E8 100%)",
              transform: `translateY(${off * 12}px) scale(${Math.max(1 - off * 0.05, 0.8)}) rotate(${top ? 0 : off * 2}deg)`,
              zIndex: n - off,
              opacity: off > 2 ? 0 : 1,
              visibility: off > 2 ? "hidden" : "visible",
            }}
            aria-hidden={!top}>
            <Icon className="absolute -bottom-6 -right-6 h-32 w-32 text-orange-100" />
            <div className="relative flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg,#FDBA74,#F97316)" }}>
                <Icon className="h-6 w-6" />
              </span>
            </div>
            <p className="relative mt-4 text-[11px] font-semibold text-gray-400">คอร์สเดี่ยว</p>
            <p className="relative text-[20px] font-extrabold" style={{ color: "#14213D" }}>{s.name}</p>
            {s.note && <p className="relative mt-0.5 line-clamp-1 text-xs text-gray-500">{s.note}</p>}
            <div className="relative mt-4 flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "rgba(20,33,61,.07)" }}>
              <span className="truncate text-[11px] text-gray-500">{s.levels.length ? s.levels.join(" · ") : "ทุกระดับชั้น"}</span>
              <span className="shrink-0 text-xs font-bold text-orange-600">ออนไลน์เริ่ม {PRIVATE_PRICING[0].modes[1].starting}/ชม.</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
