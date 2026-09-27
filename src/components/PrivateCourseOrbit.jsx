import { useEffect, useRef, useState } from "react";
import { Presentation, GraduationCap, UserRoundCheck } from "lucide-react";

/* วงโคจรเอียงแบบ 3D: การ์ด "ครูที่ใช่" กับ "น้อง 1 คน" โคจรรอบของที่อยู่ตรงกลาง
   ใบที่อยู่ด้านหลังจะเล็ก จาง เบลอ และลอดหลังของตรงกลาง ใบด้านหน้าจะลอยทับ
   - variant="hero"    : ใช้ในแบนเนอร์หน้าคอร์สเดี่ยว (ตรงกลาง = การ์ดวิชาซ้อน ส่งมาทาง children)
   - variant="compact" : แถบแนะนำในหน้าแรก (ตรงกลาง = เหรียญ 1:1)
   รัศมีคำนวณจากความกว้างจริง การ์ดจึงไม่ล้นจอมือถือ */

const REDUCED = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Coin3D({ size = 96 }) {
  const layers = [];
  for (let z = -6; z <= 6; z++) {
    layers.push(<div key={z} style={{ transform: `translateZ(${z}px)`, background: z % 2 ? "#ea580c" : "#c2410c" }} />);
  }
  return (
    <div className="sa-coin-scene" style={{ width: size, height: size }}>
      <div className="sa-coin">
        {layers}
        <div className="grid place-items-center" style={{ transform: "translateZ(7px)", background: "radial-gradient(circle at 35% 30%,#ffffff,#fff7ed)", boxShadow: "inset 0 0 0 5px #fdba74" }}>
          <div className="text-center leading-none">
            <p className="font-extrabold text-orange-500" style={{ fontSize: size * 0.3 }}>1:1</p>
            <p className="mt-1 font-semibold text-gray-400" style={{ fontSize: Math.max(9, size * 0.1) }}>ตัวต่อตัว</p>
          </div>
        </div>
        <div className="grid place-items-center" style={{ transform: "rotateY(180deg) translateZ(7px)", background: "radial-gradient(circle at 35% 30%,#fdba74,#f97316)", boxShadow: "inset 0 0 0 5px #fed7aa" }}>
          <div className="text-center leading-tight text-white">
            <UserRoundCheck className="mx-auto" style={{ width: size * 0.24, height: size * 0.24 }} />
            <p className="mt-1 font-extrabold" style={{ fontSize: Math.max(10, size * 0.13) }}>ตัวต่อตัว</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const VARIANTS = {
  // lift = ยกของตรงกลางขึ้นจากจุดศูนย์กลางวง ให้การ์ดที่ผ่านด้านหน้าลอดใต้ขอบล่างการ์ดวิชาแทนที่จะทับชื่อวิชา
  hero: { box: "h-[330px] max-w-[560px] sm:h-[370px]", maxR: 250, ratio: 0.3, card: (W) => (W < 440 ? 124 : 152), speed: 0.35, lift: 36 },
  compact: { box: "h-[210px] max-w-[360px]", maxR: 118, ratio: 0.375, card: () => 128, speed: 0.45, lift: 0 },
};

export default function PrivateCourseOrbit({ variant = "compact", orbitCoin = false, children }) {
  const v = VARIANTS[variant] || VARIANTS.compact;
  const wrapRef = useRef(null);
  const teacherRef = useRef(null);
  const studentRef = useRef(null);
  const coinRef = useRef(null);
  const [W, setW] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  const cardW = v.card(W);
  const R = Math.max(70, Math.min(v.maxR, (W - cardW) / 2 - 2)); // รัศมีแนวนอน
  const r = R * v.ratio; // รัศมีแนวตั้ง (มองวงจากมุมเอียง)
  const showDetail = variant === "hero" && cardW >= 150;

  useEffect(() => {
    if (!W) return undefined;
    const place = (t) => {
      const bodies = orbitCoin
        ? [[teacherRef.current, t + (2 * Math.PI) / 3], [studentRef.current, t], [coinRef.current, t + (4 * Math.PI) / 3]]
        : [[teacherRef.current, t + Math.PI], [studentRef.current, t]];
      bodies.forEach(([el, a]) => {
        if (!el) return;
        const depth = (Math.sin(a) + 1) / 2; // 0 = ด้านหลัง, 1 = ด้านหน้า
        el.style.transform = `translate(calc(-50% + ${Math.cos(a) * R}px), calc(-50% + ${Math.sin(a) * r}px)) scale(${0.74 + depth * 0.3})`;
        el.style.zIndex = depth > 0.5 ? 30 : 1; // ตรงกลางอยู่ที่ z 10
        el.style.opacity = String(0.5 + depth * 0.5);
        el.style.filter = `blur(${((1 - depth) * 1.2).toFixed(2)}px)`;
      });
    };
    let angle = 0.25;
    place(angle);
    if (REDUCED || !inView) return undefined;
    let raf, last = performance.now();
    const loop = (now) => {
      angle += Math.min((now - last) / 1000, 0.05) * v.speed;
      last = now;
      place(angle);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [W, R, r, inView, v.speed, orbitCoin]);

  const card = "absolute left-1/2 top-1/2 rounded-2xl bg-white p-2.5 text-[#14213D] shadow-xl will-change-transform pointer-events-none";
  return (
    <div ref={wrapRef} className={`relative mx-auto w-full ${v.box}`}>
      {/* วงเอียง */}
      <div className="sa-orbit-scene pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 rounded-full border-2 border-dashed border-orange-200"
          style={{ width: R * 2, height: R * 2, marginLeft: -R, marginTop: -R, transform: `rotateX(${Math.round(Math.acos(v.ratio) * 180 / Math.PI)}deg)` }}>
          <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300" />
          <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300" />
          <span className="absolute right-0 top-1/2 h-2 w-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200" />
        </div>
      </div>

      {/* ตรงกลาง */}
      <div className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2" style={{ top: `calc(50% - ${v.lift}px)` }}>
        {children || <div className="sa-float"><Coin3D size={72} /></div>}
      </div>

      {/* เหรียญ 1:1 โคจรเป็นดวงที่ 3 */}
      {orbitCoin && (
        <div ref={coinRef} className="pointer-events-none absolute left-1/2 top-1/2 will-change-transform" aria-hidden="true">
          <Coin3D size={W < 440 ? 56 : 68} />
        </div>
      )}

      {/* ครู */}
      <div ref={teacherRef} className={card} style={{ width: cardW }} aria-hidden="true">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white"><Presentation className="h-4 w-4" /></span>
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] text-gray-400">ครูที่จับคู่ให้</p>
            <p className="text-sm font-bold">ครูที่ใช่</p>
          </div>
        </div>
        {showDetail && (
          <div className="mt-2 flex gap-1">
            <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">ตรงวิชา</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">ตรงสไตล์</span>
          </div>
        )}
      </div>

      {/* นักเรียน */}
      <div ref={studentRef} className={card} style={{ width: cardW }} aria-hidden="true">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-white"><GraduationCap className="h-4 w-4" /></span>
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] text-gray-400">นักเรียน</p>
            <p className="text-sm font-bold">น้อง 1 คน</p>
          </div>
        </div>
        {showDetail && (
          <>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full w-4/5 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" /></div>
            <p className="mt-1 text-[10px] text-gray-400">ติดตามพัฒนาการในระบบ</p>
          </>
        )}
      </div>
    </div>
  );
}
