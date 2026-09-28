import { API_URL } from "../config";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertCircle, Info, ChevronRight, BookOpen, GraduationCap, Wallet, Clock, Calendar, CalendarClock, DoorOpen, Boxes,
  AlertTriangle, UserCheck, UserX, Bell, BellRing, Sparkles, PieChart as PieChartIcon, Users, Award, TrendingUp,
  ListChecks, ArrowUpRight, ArrowRight, Radio, Check, X, Crown, CheckCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const API_BASE = `${API_URL}/api/admin/dashboard`;

/* ─────────────────────────────────────────────────────────────────────────
   หน้าภาพรวมสถาบัน (ดีไซน์ v4)
   หลักการ: 3D ใช้เฉพาะ "กราฟที่ดูเป็นภาพ" (วงแหวนสุขภาพ / พายคอร์ส / ผังห้อง / แถบคลัง)
   ส่วนที่เป็นตัวหนังสือ ตัวเลข ไอคอน และรายการ ใช้สไตล์แบนเดียวกับหน้าอื่นในระบบ
   ───────────────────────────────────────────────────────────────────────── */

const T = {
  card: "bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition",
  cardPad: "p-4 sm:p-5",
  title: "text-base font-bold text-slate-900",
  subtitle: "text-sm text-slate-500",
  link: "text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0",
};

// สีชุดเดียวกับ DONUT_COLORS (AdminFinance) / TutorIncome
const PIE_COLORS = [
  { base: "#f97316", light: "#fdba74" },
  { base: "#10b981", light: "#6ee7b7" },
  { base: "#3b82f6", light: "#93c5fd" },
  { base: "#f59e0b", light: "#fcd34d" },
  { base: "#94a3b8", light: "#cbd5e1" },
  { base: "#a855f7", light: "#d8b4fe" },
];

// ไอคอน + สีทึบของการ์ด "สิ่งที่ต้องจัดการ" (สี่เหลี่ยมสีทึบแบบ StatCard ของหน้าอื่น)
const ACTION_META = {
  "missed-checkins": { icon: Clock, color: "bg-red-500", urgent: true },
  "pending-payments": { icon: Wallet, color: "bg-orange-500" },
  "tutor-applications": { icon: UserCheck, color: "bg-blue-500" },
  "stock-issues": { icon: Boxes, color: "bg-amber-500" },
  "students-attention": { icon: AlertTriangle, color: "bg-rose-500" },
  "tutors-attention": { icon: UserX, color: "bg-violet-500" },
  "rooms-maintenance": { icon: DoorOpen, color: "bg-slate-500" },
  "missing-price": { icon: AlertCircle, color: "bg-orange-500" },
};

const RM = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
const formatMoney = (v) => `฿${Number(v || 0).toLocaleString()}`;
const fmt = (v) => Number(v || 0).toLocaleString("th-TH");
const photoUrl = (p) => (!p ? null : p.startsWith("http") ? p : `${API_URL}${p}`);
const personName = (p) => p?.Nickname || [p?.Firstname, p?.Lastname].filter(Boolean).join(" ") || "—";
const initialOf = (s = "") => {
  const t = String(s).replace(/^ครู(พี่)?/, "");
  return (/^[เแโใไ]/.test(t) ? t.charAt(1) : t.charAt(0)) || "?";
};
const toMin = (hm) => { const [h, m] = String(hm || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const shade = (hex, a) => {
  const t = Math.abs(a), f = a < 0 ? 0 : 255;
  return `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).map((c) => Math.round(c + (f - c) * t)).join(",")})`;
};
// แถบวงแหวน/ชิ้นพายบนระนาบเอียง (t = อัตราส่วนความเอียง)
function band(cx, cy, rO, rI, a0, a1, t) {
  const P = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a) * t).toFixed(2)}`;
  const lg = a1 - a0 > Math.PI ? 1 : 0;
  return `M${P(rO, a0)}A${rO} ${rO * t} 0 ${lg} 1 ${P(rO, a1)}L${P(rI, a1)}A${rI} ${rI * t} 0 ${lg} 0 ${P(rI, a0)}Z`;
}

/* ─── hooks ─────────────────────────────────────────────────────────── */
function useInView({ once = true, threshold = 0.15 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!("IntersectionObserver" in window)) { setInView(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); if (once) io.disconnect(); }
      else if (!once) setInView(false);
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold]);
  return [ref, inView];
}

function useProgress(active, dur = 1300) {
  const [p, setP] = useState(RM ? 1 : 0);
  useEffect(() => {
    if (!active || RM) return undefined;
    let raf;
    const t0 = performance.now();
    const step = (t) => { const v = clamp((t - t0) / dur); setP(v); if (v < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, dur]);
  return p;
}

function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

// การ์ดเอียงตามเมาส์ + แสงเรือง (ชุดเดียวกับ TutorExamAnalytics)
const tiltMove = (e) => {
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  el.style.setProperty("--gx", `${px * 100}%`);
  el.style.setProperty("--gy", `${py * 100}%`);
  el.style.transform = `perspective(700px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-2px)`;
};
const tiltLeave = (e) => { e.currentTarget.style.transform = ""; };

/* ─── ชิ้นส่วนเล็ก ──────────────────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}

function ErrorState({ message, onRetry }) {
  return (
    <div className={`${T.card} ${T.cardPad} flex flex-col items-center justify-center text-center py-10`}>
      <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
      <p className="text-sm text-slate-600 mb-3">{message}</p>
      <button onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition">
        ลองใหม่
      </button>
    </div>
  );
}

function EmptyMini({ text, hint }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-8">
      <p className="text-xs text-slate-500">{text}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function CountUp({ value, prefix = "", suffix = "" }) {
  const [ref, inView] = useInView();
  const p = useProgress(inView, 1200);
  return <span ref={ref} className="tabular-nums">{prefix}{fmt(Math.round(Number(value || 0) * ease(p)))}{suffix}</span>;
}

function Reveal({ className = "", children, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`sa-reveal ${inView ? "is-in" : ""} ${className}`} style={delay ? { transitionDelay: `${delay}s` } : undefined}>
      {typeof children === "function" ? children(inView) : children}
    </div>
  );
}

function SectionCard({ title, icon: Icon, action, subtitle, children, className = "" }) {
  return (
    <Reveal className={`${T.card} ${T.cardPad} flex flex-col ${className}`}>
      {(inView) => (
        <>
          <div className="flex items-center justify-between gap-2 shrink-0">
            <h3 className={`${T.title} flex items-center gap-2`}>
              {Icon && <Icon className="h-4 w-4 text-orange-500" />}
              {title}
            </h3>
            {action}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          <div className="flex-1 min-h-0 mt-4">{typeof children === "function" ? children(inView) : children}</div>
        </>
      )}
    </Reveal>
  );
}

function LinkBtn({ onClick, children }) {
  return <button onClick={onClick} className={T.link}>{children} <ChevronRight className="h-3 w-3" /></button>;
}

function Avatar({ person, className = "h-8 w-8 rounded-lg text-[11px]", fallbackCls = "bg-orange-50 border border-orange-100 text-orange-600" }) {
  const src = photoUrl(person?.Photo);
  return (
    <span className={`${className} ${src ? "" : fallbackCls} flex items-center justify-center font-bold shrink-0 overflow-hidden`}>
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : initialOf(personName(person))}
    </span>
  );
}

function FlatBar({ pct, className = "bg-slate-100", fill, delay = 0, h = "h-1.5", stripes = false, marker = null }) {
  return (
    <div className={`relative ${h} rounded-full ${className} overflow-hidden`}>
      <div className={`sa-grow h-full rounded-full ${stripes ? "sa-stripes" : ""}`} style={{ width: `${clamp(pct / 100) * 100}%`, background: fill, animationDelay: `${delay}s` }} />
      {marker !== null && <span className="absolute inset-y-0 w-px bg-slate-300" style={{ left: `${marker}%` }} />}
    </div>
  );
}

/* ─── Action chips (logic เดิม + กันรายการซ้ำ id) ───────────────────── */
function buildActionChips(items, extra = []) {
  const lowStock = items.find((i) => i.id === "low-stock");
  const outOfStock = items.find((i) => i.id === "out-of-stock");
  const rest = items.filter((i) => i.id !== "low-stock" && i.id !== "out-of-stock");
  const chips = [...rest];
  if (lowStock || outOfStock) {
    const lowCount = lowStock?.count || 0;
    const outCount = outOfStock?.count || 0;
    chips.push({
      id: "stock-issues",
      title: "อุปกรณ์ต้องเติมสต๊อก",
      message: `ใกล้หมด ${lowCount} · หมด ${outCount}`,
      count: lowCount + outCount,
      link: "/admin/common-facilities",
    });
  }
  const seen = new Set();
  return [...chips, ...extra]
    .filter((c) => (seen.has(c.id) ? false : seen.add(c.id)))
    .sort((a, b) => Number(!!ACTION_META[b.id]?.urgent) - Number(!!ACTION_META[a.id]?.urgent));
}

/* ═════════ HERO ═════════ */
function HealthRing({ score, active }) {
  const p = useProgress(active, 1500);
  const cx = 110, cy = 62, rO = 96, rI = 70, t = 0.42, depth = 14;
  const val = score === null ? 0 : (score / 100) * ease(p);
  const a0 = -Math.PI / 2, a1 = a0 + Math.max(val * 2 * Math.PI, 0.001);
  const track = band(cx, cy, rO, rI, a1, a0 + 2 * Math.PI - 0.0001, t);
  const prog = band(cx, cy, rO, rI, a0, a1, t);
  const layers = [];
  for (let k = depth; k >= 1; k--) {
    layers.push(<path key={`t${k}`} d={track} transform={`translate(0 ${k})`} fill={`rgba(255,255,255,${0.03 + (1 - k / depth) * 0.03})`} />);
    if (val > 0) layers.push(<path key={`p${k}`} d={prog} transform={`translate(0 ${k})`} fill={shade("#f97316", -0.25 - (k / depth) * 0.2)} />);
  }
  return (
    <svg viewBox="0 0 220 150" className="w-full overflow-visible">
      <defs>
        <radialGradient id="dashHealthGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fcd34d" /><stop offset="1" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy + depth + 10} rx={rO * 0.95} ry={rO * t * 0.75} fill="rgba(0,0,0,.35)" style={{ filter: "blur(6px)" }} />
      {layers}
      <path d={track} fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.15)" strokeWidth=".8" />
      {val > 0 && <path d={prog} fill="url(#dashHealthGrad)" stroke="rgba(255,255,255,.55)" strokeWidth="1" />}
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="34" fontWeight="700" fill="#fff">
        {score === null ? "—" : Math.round(score * ease(p))}
      </text>
    </svg>
  );
}

function Cube({ size, className = "", style }) {
  const h = size / 2;
  const faces = ["", "rotateY(180deg) ", "rotateY(90deg) ", "rotateY(-90deg) ", "rotateX(90deg) ", "rotateX(-90deg) "];
  return (
    <div className={`sa-cube-scene absolute hidden lg:block ${className}`} style={style}>
      <div className="sa-cube" style={{ width: size, height: size }}>
        {faces.map((f, i) => <i key={i} style={{ transform: `${f}translateZ(${h}px)` }} />)}
      </div>
    </div>
  );
}

function Hero({ generatedAt, userName, sessionsTotal, liveRooms, actionCount, metrics, score }) {
  const [ref, inView] = useInView();
  const heroRef = useRef(null);
  const onMove = (e) => {
    const el = heroRef.current; if (!el || RM) return;
    const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    el.querySelectorAll("[data-px]").forEach((n) => { const s = Number(n.dataset.px); n.style.transform = `translate(${px * s}px, ${py * s}px)`; });
  };
  const hour = new Date().getHours();
  const greet = hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";
  const today = new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  const METRIC_COLORS = [["#10b981", "#6ee7b7"], ["#f97316", "#fdba74"], ["#3b82f6", "#93c5fd"]];

  return (
    <div ref={ref} className={`sa-reveal ${inView ? "is-in" : ""}`}>
      <section ref={heroRef} onMouseMove={onMove} className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-5 sm:p-8">
        <div className="absolute inset-0 sa-grain opacity-30" />
        <div data-px="18" className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-orange-500/40 blur-3xl" />
        <div data-px="-12" className="absolute left-1/3 -bottom-32 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div data-px="26" className="absolute right-[38%] top-8 hidden lg:block"><Cube size={64} className="!relative" /></div>
        <div data-px="-20" className="absolute left-[46%] bottom-6 hidden lg:block opacity-60"><Cube size={32} className="!relative" /></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 text-emerald-300 px-2.5 py-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 sa-blink" /> ข้อมูลสด
              </span>
              <span className="text-slate-400">
                {today}
                {generatedAt && ` · อัปเดตล่าสุด ${new Date(generatedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`}
              </span>
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              ภาพรวม<span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">สถาบัน</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              {greet}{userName ? ` คุณ${userName}` : ""} — วันนี้มี <b className="text-white">{sessionsTotal} คาบ</b>
              {actionCount > 0 ? <> และมี <b className="text-amber-300">{actionCount} เรื่อง</b> ที่รอจัดการ</> : " และไม่มีเรื่องค้างให้จัดการ"}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3 sm:p-4">
                <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> คาบวันนี้</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1"><CountUp value={sessionsTotal} /> <span className="text-xs font-medium text-slate-400">คาบ</span></p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3 sm:p-4">
                <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1"><Radio className="h-3.5 w-3.5" /> ห้องที่ใช้อยู่</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 text-orange-300"><CountUp value={liveRooms} /> <span className="text-xs font-medium text-slate-400">ห้อง</span></p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-3 sm:p-4 relative overflow-hidden shadow-lg shadow-orange-500/30">
                <span className="absolute inset-0 sa-shine" />
                <p className="relative text-[11px] sm:text-xs text-orange-50 flex items-center gap-1"><BellRing className="h-3.5 w-3.5" /> ต้องจัดการ</p>
                <p className="relative text-2xl sm:text-3xl font-bold mt-1"><CountUp value={actionCount} /> <span className="text-xs font-medium text-orange-50">เรื่อง</span></p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 shrink-0">
            <div className="relative w-[230px] shrink-0 sa-float" style={{ animationDuration: "5s" }}>
              <HealthRing score={score} active={inView} />
            </div>
            <div className="space-y-3 text-xs w-full sm:w-[180px]">
              {metrics.map((m, i) => (
                <div key={m.label}>
                  <div className="flex justify-between text-slate-400 mb-1"><span>{m.label}</span><b className="text-white tabular-nums">{m.value}%</b></div>
                  <FlatBar pct={m.value} className="bg-white/10" fill={`linear-gradient(90deg, ${METRIC_COLORS[i][0]}, ${METRIC_COLORS[i][1]})`} delay={0.2 + i * 0.15} />
                </div>
              ))}
              <p className="text-[10px] text-slate-500">
                {metrics.length ? `คะแนนสุขภาพ = ค่าเฉลี่ยของ ${metrics.length} ตัวชี้วัดนี้` : "ยังไม่มีข้อมูลพอคำนวณคะแนนสุขภาพ"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═════════ สิ่งที่ต้องจัดการ ═════════ */
// จอใหญ่แสดงแถวเดียวเสมอ: คอลัมน์ = จำนวนการ์ด (สูงสุด 5) ถ้าเกินให้ช่องสุดท้ายรวมเป็น "อีก N เรื่อง"
const ACTION_COLS = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };
const ACTION_MAX = 5;
function ActionSection({ chips, onNavigate }) {
  const overflow = chips.length > ACTION_MAX;
  const shown = overflow ? chips.slice(0, ACTION_MAX - 1) : chips;
  const hidden = chips.length - shown.length;
  return (
    <Reveal>
      <div className="flex items-end justify-between mb-3">
        <h2 className={`${T.title} flex items-center gap-2`}>
          <ListChecks className="h-4 w-4 text-orange-500" />
          ต้องจัดการ <span className="text-orange-600">{chips.length}</span> รายการ
        </h2>
        {chips.length > 1 && <span className="text-xs text-slate-400 hidden sm:block">เรื่องเร่งด่วนขึ้นก่อน</span>}
      </div>
      {chips.length === 0 ? (
        <div className={`${T.card} px-4 py-3 flex items-center gap-2.5`}>
          <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-xs font-semibold text-slate-500">ไม่มีรายการที่ต้องจัดการตอนนี้ — ทุกอย่างเรียบร้อยดี</p>
        </div>
      ) : (
        <div className={`sa-scroll flex lg:grid ${ACTION_COLS[Math.min(chips.length, ACTION_MAX)]} gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x`}>
          {shown.map((a, i) => {
            const meta = ACTION_META[a.id] || { icon: Info, color: "bg-orange-500" };
            const Icon = meta.icon;
            return (
              <button key={a.id} onClick={() => onNavigate(a.link)} title={a.message}
                className={`sa-rise group snap-start shrink-0 w-[240px] lg:w-auto text-left relative overflow-hidden bg-white rounded-2xl border ${meta.urgent ? "border-red-200" : "border-slate-200"} shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-300 transition p-4 flex items-center gap-3`}
                style={{ animationDelay: `${0.05 + i * 0.05}s` }}>
                {meta.urgent && <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-500 sa-stripes" />}
                <span className={`h-11 w-11 rounded-xl ${meta.color} flex items-center justify-center shrink-0 ${meta.urgent ? "sa-pulse-red" : ""}`}>
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800 truncate">{a.title}</span>
                  <span className="block text-[11px] text-slate-500 truncate">{a.message}</span>
                </span>
                <span className="flex flex-col items-end">
                  <span className={`tabular-nums text-2xl font-bold leading-none ${meta.urgent ? "text-red-600" : "text-slate-900"}`}>{a.count} <span className="text-xs font-medium text-slate-500">รายการ</span></span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 transition mt-1" />
                </span>
              </button>
            );
          })}
          {overflow && (
            <button onClick={() => onNavigate("/admin/notification")}
              className="sa-rise snap-start shrink-0 w-[200px] lg:w-auto flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 text-sm font-semibold text-orange-600 hover:bg-orange-100 transition p-4"
              style={{ animationDelay: `${0.05 + shown.length * 0.05}s` }}>
              <Bell className="h-4 w-4" /> อีก {hidden} เรื่อง <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </Reveal>
  );
}

/* ═════════ การ์ดสรุป 4 ใบ ═════════ */
function Sparkline({ values, color }) {
  const vals = (values || []).map(Number);
  if (vals.length < 2 || vals.every((v) => v === vals[0])) return null;
  const w = 120, h = 36, min = Math.min(...vals), max = Math.max(...vals);
  const pts = vals.map((v, i) => [i * (w / (vals.length - 1)), h - 4 - ((v - min) / (max - min || 1)) * (h - 8)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  const gid = `spark-${color.slice(1)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".25" /><stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sa-draw" style={{ "--len": 200 }} />
      <circle cx={lx} cy={ly} r="3.5" fill="#fff" stroke={color} strokeWidth="2" className="sa-pop" style={{ animationDelay: "1.2s", transformOrigin: `${lx}px ${ly}px` }} />
    </svg>
  );
}

function StatCard({ label, value, unit, money, sub, subUp, icon, color, spark, sparkColor, delay }) {
  const Icon = icon;
  return (
    <div onMouseMove={tiltMove} onMouseLeave={tiltLeave}
      className="sa-tilt sa-rise relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-200 p-3.5 sm:p-5"
      style={{ animationDelay: `${delay}s` }}>
      <span className="sa-glow" />
      <Icon className="absolute -right-4 -top-4 h-24 w-24 text-slate-100" />
      <div className="relative flex items-center gap-3">
        <span className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0`}><Icon className="h-5 w-5 text-white" /></span>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
      <p className="relative text-2xl sm:text-3xl font-bold text-slate-900 mt-3"><CountUp value={value} prefix={money ? "฿" : ""} />{unit && <> <span className="text-xs font-medium text-slate-500">{unit}</span></>}</p>
      <div className="relative flex items-end justify-between gap-3 mt-1">
        {sub && (
          <p className={`text-[11px] sm:whitespace-nowrap ${subUp === undefined ? "text-slate-500" : subUp ? "text-emerald-600 font-semibold flex items-center gap-0.5" : "text-red-500 font-semibold flex items-center gap-0.5"}`}>
            {subUp !== undefined && <TrendingUp className={`h-3.5 w-3.5 shrink-0 ${subUp ? "" : "rotate-180"}`} />}{sub}
          </p>
        )}
        <div className="hidden sm:block w-24 shrink-0"><Sparkline values={spark} color={sparkColor} /></div>
      </div>
    </div>
  );
}

/* ═════════ พาย 3D ═════════ */
function Pie3D({ data, total }) {
  const wrapRef = useRef(null);
  const [ref, inView] = useInView({ once: false, threshold: 0.05 });
  const st = useRef({ rot: 0, prog: RM ? 1 : 0, hover: null, hv: [], last: 0 });
  const [, setTick] = useState(0);
  const [hover, setHoverState] = useState(null);
  const [tip, setTip] = useState(null);

  if (st.current.hv.length !== data.length) st.current.hv = data.map(() => 0);
  const setHover = (i) => { st.current.hover = i; setHoverState(i); };

  useEffect(() => {
    if (!inView) return undefined;
    let raf;
    st.current.last = performance.now();
    const loop = (t) => {
      const s = st.current;
      const dt = Math.min((t - s.last) / 1000, 0.05); s.last = t;
      if (s.prog < 1) s.prog = clamp(s.prog + dt / 1.3);
      if (!RM && s.hover === null) s.rot += dt * 0.12;
      s.hv = s.hv.map((h, i) => h + ((s.hover === i ? 1 : 0) - h) * 0.18);
      setTick((n) => (n + 1) % 1e6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const s = st.current;
  const cx = 140, cy = 88, rO = 118, rI = 58, t = 0.52, depth = 24, pad = 0.035;
  let a = -Math.PI / 2 + s.rot;
  const slices = data.map((d, i) => {
    const sw = (d.value / total) * 2 * Math.PI * ease(s.prog);
    const a0 = a + pad / 2, a1 = a + Math.max(sw - pad / 2, pad / 2 + 0.001);
    a += sw;
    const m = (a0 + a1) / 2, h = s.hv[i] || 0;
    return { ...d, i, a0, a1, m, ex: Math.cos(m) * 12 * h, ey: Math.sin(m) * 12 * t * h - 10 * h };
  });
  const dz = Math.round(depth * ease(s.prog * 1.2));
  const layers = [];
  for (let k = dz; k >= 1; k--) {
    slices.forEach((sl) => layers.push(
      <path key={`${k}-${sl.i}`} d={band(cx, cy, rO, rI, sl.a0, sl.a1, t)} data-i={sl.i}
        transform={`translate(${sl.ex.toFixed(2)} ${(sl.ey + k).toFixed(2)})`} fill={shade(sl.color.base, -0.22 - (k / depth) * 0.22)} />
    ));
  }
  const cur = hover === null ? { v: total, l: "คอร์สทั้งหมด" } : { v: data[hover].value, l: data[hover].name };
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0);

  const onMove = (e) => {
    const i = e.target.dataset?.i;
    if (i === undefined) { setHover(null); setTip(null); return; }
    setHover(Number(i));
    const r = wrapRef.current.getBoundingClientRect();
    setTip({ x: Math.min(e.clientX - r.left + 14, r.width - 140), y: e.clientY - r.top - 52 });
  };

  return (
    <div ref={ref} className="flex flex-col h-full">
      <div ref={wrapRef} className="relative">
        <svg viewBox="0 0 280 200" className="w-full max-w-[380px] mx-auto overflow-visible cursor-pointer" onMouseMove={onMove} onMouseLeave={() => { setHover(null); setTip(null); }}>
          <defs>
            {data.map((d, i) => (
              <radialGradient id={`dashPie-${i}`} key={i} cx="35%" cy="30%" r="75%">
                <stop offset="0" stopColor={d.color.light} /><stop offset="1" stopColor={d.color.base} />
              </radialGradient>
            ))}
          </defs>
          <ellipse cx={cx} cy={cy + depth + 12} rx={rO * 0.92} ry={rO * t * 0.7} fill="rgba(15,23,42,.18)" style={{ filter: "blur(8px)" }} />
          {layers}
          {slices.map((sl) => (
            <path key={`top-${sl.i}`} d={band(cx, cy, rO, rI, sl.a0, sl.a1, t)} data-i={sl.i}
              transform={`translate(${sl.ex.toFixed(2)} ${sl.ey.toFixed(2)})`} fill={`url(#dashPie-${sl.i})`}
              stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" opacity={hover === null || hover === sl.i ? 1 : 0.55} />
          ))}
          {s.prog > 0.9 && slices.filter((sl) => sl.value / total > 0.1).map((sl) => {
            const r = (rO + rI) / 2;
            return (
              <text key={`lb-${sl.i}`} x={cx + Math.cos(sl.m) * r + sl.ex} y={cy + Math.sin(sl.m) * r * t + sl.ey + 4}
                textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff" pointerEvents="none">{pct(sl.value)}%</text>
            );
          })}
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="26" fontWeight="700" fill="#0f172a" pointerEvents="none">{cur.v}</text>
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize="9" fill="#64748b" pointerEvents="none">{cur.l}</text>
        </svg>
        {tip && hover !== null && (
          <div className="pointer-events-none absolute z-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg w-max" style={{ left: tip.x, top: tip.y }}>
            <p className="font-semibold text-slate-900">{data[hover].name}</p>
            <p className="tabular-nums text-slate-600"><b className="text-orange-600">{data[hover].value}</b> คอร์ส · {pct(data[hover].value)}%</p>
          </div>
        )}
      </div>
      <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-5 gap-y-1">
        {data.map((d, i) => (
          <div key={d.name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            className={`rounded-xl px-2 py-1.5 transition cursor-pointer ${hover === i ? "bg-orange-50" : "hover:bg-orange-50/60"}`}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-2 text-slate-600 min-w-0"><span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color.base }} /><span className="truncate">{d.name}</span></span>
              <span className="flex items-baseline gap-1.5 shrink-0"><b className="tabular-nums text-slate-800">{d.value}</b><span className="tabular-nums text-[11px] text-slate-400 w-8 text-right">{pct(d.value)}%</span></span>
            </div>
            <FlatBar pct={(d.value / data[0].value) * 100} fill={`linear-gradient(90deg, ${d.color.light}, ${d.color.base})`} delay={0.3 + i * 0.1} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════ การเงิน ═════════ */
function FinanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-slate-900 mb-1">{label}</p>
      <p className="flex justify-between gap-4"><span className="text-emerald-600">รายรับ</span><b className="tabular-nums text-slate-800">{formatMoney(row.revenue)}</b></p>
      <p className="flex justify-between gap-4"><span className="text-red-600">รายจ่าย</span><b className="tabular-nums text-slate-800">{formatMoney(row.expense)}</b></p>
      <p className="flex justify-between gap-4 border-t border-slate-100 mt-1 pt-1"><span className="text-orange-600">กำไร</span><b className="tabular-nums text-slate-800">{formatMoney(row.revenue - row.expense)}</b></p>
    </div>
  );
}

function FinanceCard({ finance, onNavigate }) {
  const trend = finance.trend || [];
  const hasData = trend.some((d) => Number(d.revenue) > 0 || Number(d.expense) > 0);
  const [vis, setVis] = useState({ revenue: true, expense: true });
  const profit = Number(finance.monthlyProfit || 0);
  const lastIdx = trend.length - 1;
  const dot = (color) => (props) => {
    const { cx, cy, index } = props;
    if (cx == null || cy == null) return null;
    return <circle key={index} cx={cx} cy={cy} r={index === lastIdx ? 5 : 3} fill="#fff" stroke={color} strokeWidth={index === lastIdx ? 2.5 : 2} />;
  };
  const toggleCls = (on, tone) => `inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border transition ${tone} ${on ? "" : "opacity-40"}`;

  return (
    <SectionCard
      title="รายรับ vs รายจ่าย" icon={Wallet} className="lg:col-span-3"
      subtitle="6 เดือนล่าสุด · ชี้ที่กราฟเพื่อดูรายเดือน"
      action={
        <div className="flex items-center gap-2">
          <button onClick={() => setVis((v) => ({ ...v, revenue: !v.revenue }))} className={toggleCls(vis.revenue, "bg-emerald-50 border-emerald-200 text-emerald-700")}><span className="h-2 w-2 rounded-full bg-emerald-500" />รายรับ</button>
          <button onClick={() => setVis((v) => ({ ...v, expense: !v.expense }))} className={toggleCls(vis.expense, "bg-red-50 border-red-200 text-red-700")}><span className="h-2 w-2 rounded-full bg-red-500" />รายจ่าย</button>
          <span className="hidden sm:flex ml-1"><LinkBtn onClick={() => onNavigate("/admin/finance")}>รายละเอียด</LinkBtn></span>
        </div>
      }
    >
      {(inView) => (
        <div className="flex flex-col h-full">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[11px] text-slate-500">รายรับเดือนนี้</p>
              <p className="text-base sm:text-lg font-bold text-slate-900"><CountUp value={finance.monthlyRevenue} prefix="฿" /></p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[11px] text-slate-500">รายจ่ายเดือนนี้</p>
              <p className="text-base sm:text-lg font-bold text-slate-900"><CountUp value={finance.monthlyExpense} prefix="฿" /></p>
            </div>
            <div className={`rounded-xl text-white px-3 py-2 relative overflow-hidden bg-gradient-to-br ${profit >= 0 ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600"}`}>
              <span className="absolute inset-0 sa-shine opacity-60" />
              <p className="relative text-[11px] text-white/80">กำไรสุทธิ</p>
              <p className="relative text-base sm:text-lg font-bold">{profit < 0 && "-"}<CountUp value={Math.abs(profit)} prefix="฿" /></p>
            </div>
          </div>
          <div className="flex-1 min-h-[240px]">
            {!hasData ? (
              <EmptyMini text="ยังไม่มีข้อมูลทางการเงินเพียงพอสำหรับแสดงแนวโน้ม" hint="เริ่มมีรายการเมื่อมีการบันทึกรายรับหรือรายจ่าย" />
            ) : inView && (
              <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                <AreaChart data={trend} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                    <linearGradient id="dashExp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.18} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
                  <Tooltip content={<FinanceTooltip />} cursor={{ stroke: "#fdba74", strokeDasharray: "4 3", strokeWidth: 1.5 }} />
                  {vis.expense && <Area type="monotone" dataKey="expense" name="รายจ่าย" stroke="#ef4444" strokeWidth={3} fill="url(#dashExp)" dot={dot("#ef4444")} activeDot={{ r: 6 }} animationDuration={1200} />}
                  {vis.revenue && <Area type="monotone" dataKey="revenue" name="รายรับ" stroke="#22c55e" strokeWidth={3} fill="url(#dashRev)" dot={dot("#22c55e")} activeDot={{ r: 6 }} animationDuration={1200} />}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ═════════ นักเรียน ═════════ */
const POD_GRAD = { 1: "from-amber-300 to-orange-500", 2: "from-slate-200 to-slate-400", 3: "from-orange-300 to-rose-400" };
const POD_H = { 1: "h-24", 2: "h-16", 3: "h-12" };

function StudentsCard({ students, onNavigate }) {
  const top = students.topPerformers || [];
  const excellence = top.filter((s) => s.TopKind !== "improvement");
  const improvement = top.filter((s) => s.TopKind === "improvement");
  const podium = [excellence[1] && { ...excellence[1], rank: 2 }, excellence[0] && { ...excellence[0], rank: 1 }, excellence[2] && { ...excellence[2], rank: 3 }].filter(Boolean);
  const attention = students.needsAttention || [];

  return (
    <SectionCard title="ภาพรวมนักเรียน" icon={GraduationCap} action={<LinkBtn onClick={() => onNavigate("/admin/students")}>ดูทั้งหมด</LinkBtn>}>
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-4 pb-0">
        <div className="absolute inset-0 sa-grain opacity-30" />
        <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-orange-500/30 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5"><Award className="h-4 w-4" /> ความสามารถโดดเด่น</p>
          <div className="flex gap-4 text-right">
            <div><p className="text-lg font-bold leading-none"><CountUp value={students.total} /> <span className="text-xs font-medium text-slate-400">คน</span></p><p className="text-[10px] text-slate-400">ทั้งหมด</p></div>
            <div><p className="text-lg font-bold leading-none text-emerald-300"><CountUp value={students.enrolled} /> <span className="text-xs font-medium text-slate-400">คน</span></p><p className="text-[10px] text-slate-400">ลงทะเบียน</p></div>
          </div>
        </div>
        {podium.length === 0 ? (
          <p className="relative text-xs text-slate-400 text-center py-8">ยังไม่มีนักเรียนที่สอบ Post-test ครบสำหรับจัดอันดับ</p>
        ) : (
          <div className={`relative mt-4 grid items-end gap-2 ${podium.length === 1 ? "grid-cols-1 max-w-[140px] mx-auto" : podium.length === 2 ? "grid-cols-2 max-w-xs mx-auto" : "grid-cols-3"}`}>
            {podium.map((p) => (
              <div key={p.UserId} className="flex flex-col items-center min-w-0">
                <span className={`relative ${p.rank === 1 ? "sa-float" : ""}`}>
                  <Avatar person={p} className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl text-xl shadow-lg`} fallbackCls={`bg-gradient-to-br ${POD_GRAD[p.rank]} text-slate-900`} />
                  {p.rank === 1 && <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-orange-600 flex items-center justify-center shadow"><Crown className="h-3.5 w-3.5" /></span>}
                </span>
                <p className="mt-1.5 text-sm font-bold truncate max-w-full">{p.Nickname || p.Firstname}</p>
                <p className="text-[10px] text-slate-400 -mt-0.5 truncate max-w-full">{p.Nickname ? p.Firstname : p.Lastname}</p>
                <div className={`sa-growY mt-2 w-full ${POD_H[p.rank]} rounded-t-xl bg-gradient-to-b ${p.rank === 1 ? "from-orange-500/80 to-orange-500/20" : "from-white/20 to-white/5"} border-t border-x border-white/10 flex flex-col items-center pt-1.5`}
                  style={{ animationDelay: `${0.2 + (3 - p.rank) * 0.1}s` }}>
                  <span className={`text-lg font-bold tabular-nums ${p.rank === 1 ? "text-white" : "text-amber-200"}`}>{p.TopScore}</span>
                  <span className="text-[10px] text-white/60">#{p.rank}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><TrendingUp className="h-3.5 w-3.5 text-orange-500" /> พัฒนาการโดดเด่น</p>
            <button onClick={() => onNavigate("/admin/progress?from=dashboard")} className="text-[11px] font-semibold text-orange-600 hover:underline">ดูภาพรวม</button>
          </div>
          {improvement.length === 0 ? <EmptyMini text="ยังไม่มีนักเรียนที่มีทั้ง Pre-test และ Post-test" /> : (
            <div className="space-y-1.5">
              {improvement.map((s, i) => {
                const pre = s.PreTestScore, post = s.PostTestScore, hasRange = pre != null && post != null;
                const delta = s.ImprovementDelta ?? (hasRange ? post - pre : null);
                return (
                  <div key={s.UserId} className="flex items-center gap-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 px-2.5 py-2">
                    <Avatar person={s} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{personName(s)}</p>
                      {hasRange ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 tabular-nums">
                          {Math.round(pre)}
                          <span className="relative h-1.5 flex-1 rounded-full bg-emerald-100">
                            <span className="sa-grow absolute inset-y-0 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500" style={{ left: `${clamp(pre / 100) * 100}%`, width: `${clamp((post - pre) / 100) * 100}%`, animationDelay: `${0.2 + i * 0.12}s` }} />
                            <span className="absolute top-1/2 -mt-1 h-2 w-2 rounded-full bg-white border-2 border-emerald-500" style={{ left: `calc(${clamp(post / 100) * 100}% - 4px)` }} />
                          </span>
                          {Math.round(post)}
                        </div>
                      ) : <p className="text-[11px] text-slate-500">คะแนนพัฒนาการ {s.TopScore}/100</p>}
                    </div>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums">{delta != null ? `${delta >= 0 ? "+" : ""}${Math.round(delta)}` : s.TopScore}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5"><AlertTriangle className="h-3.5 w-3.5 text-red-400" /> ควรติดตามเป็นพิเศษ</p>
          {attention.length === 0 ? <EmptyMini text="ยังไม่มีนักเรียนที่ต้องติดตามเป็นพิเศษ" /> : (
            <div className="space-y-1.5">
              {attention.slice(0, 4).map((s) => {
                const flag = s.Flags?.[0];
                const red = flag?.tone !== "amber";
                return (
                  <div key={s.UserId} className="flex items-center gap-2.5 py-1">
                    <span className="relative">
                      <Avatar person={s} />
                      {red && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white sa-pulse-red" />}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 truncate flex-1">{personName(s)}</p>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 max-w-[55%] truncate ${red ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-600 border-amber-100"}`} title={flag?.label}>
                      {flag?.label || `เข้าเรียน ${s.AttendanceRate ?? 0}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/* ═════════ ติวเตอร์ ═════════ */
function TutorRow({ t, good, i }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar person={t} className="h-9 w-9 rounded-xl text-xs" fallbackCls={good ? "bg-orange-500 text-white" : "bg-amber-50 border border-amber-200 text-amber-700"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-slate-800 truncate">{personName(t)} <span className="font-normal text-[11px] text-slate-400">เช็กอิน {t.TotalCheckin}/{t.TotalScheduled} คาบ</span></p>
          <span className={`text-sm font-bold tabular-nums ${good ? "text-emerald-600" : "text-amber-600"}`}>{t.CheckinRate}%</span>
        </div>
        <FlatBar pct={t.CheckinRate} h="h-2" fill={good ? "linear-gradient(90deg,#34d399,#10b981)" : "#fbbf24"} stripes={!good} delay={0.2 + i * 0.12} marker={50} />
      </div>
    </div>
  );
}

function TutorsCard({ tutors, onNavigate }) {
  const rate = tutors.avgCheckinRate;
  const arc = 157.08;
  return (
    <SectionCard title="ภาพรวมติวเตอร์" icon={UserCheck} action={<LinkBtn onClick={() => onNavigate("/admin/tutors")}>ดูทั้งหมด</LinkBtn>}>
      <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4">
        <div className="relative w-36 shrink-0">
          <svg viewBox="0 0 120 70" className="w-full">
            <defs><linearGradient id="dashGauge" x1="0" x2="1"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs>
            <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="#fed7aa" strokeWidth="10" strokeLinecap="round" />
            {rate !== null && rate !== undefined && rate > 0 && (
              <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="url(#dashGauge)" strokeWidth="10" strokeLinecap="round" className="sa-draw"
                style={{ "--len": arc, strokeDasharray: `${(arc * rate) / 100} ${arc}` }} />
            )}
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <p className="text-2xl font-bold text-slate-900 leading-none">{rate === null || rate === undefined ? "—" : <CountUp value={rate} suffix="%" />}</p>
            <p className="text-[10px] text-slate-500">เช็กอินเฉลี่ยเดือนนี้</p>
          </div>
        </div>
        <div className="flex-1 w-full grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/80 border border-orange-100 p-3 text-center"><p className="text-2xl font-bold text-slate-900"><CountUp value={tutors.total} /> <span className="text-xs font-medium text-slate-500">คน</span></p><p className="text-[11px] text-slate-500">ทั้งหมด</p></div>
          <div className="rounded-xl bg-white/80 border border-orange-100 p-3 text-center"><p className="text-2xl font-bold text-emerald-600"><CountUp value={tutors.active} /> <span className="text-xs font-medium text-slate-500">คน</span></p><p className="text-[11px] text-slate-500">กำลังสอน</p></div>
        </div>
      </div>

      {tutors.topPerformers?.length > 0 && (
        <>
          <p className="text-xs font-bold text-slate-500 mt-4 mb-2">ทำได้ดี <span className="font-medium text-slate-400">· เช็กอิน ≥ 90%</span></p>
          <div className="space-y-2.5">{tutors.topPerformers.map((t, i) => <TutorRow key={`top-${t.AdminId}`} t={t} good i={i} />)}</div>
        </>
      )}
      <p className="text-xs font-bold text-slate-500 mt-4 mb-2">ควรติดตาม <span className="font-medium text-slate-400">· เช็กอิน &lt; 50% (จาก ≥ 3 คาบ)</span></p>
      {tutors.needsAttention?.length > 0
        ? <div className="space-y-2.5">{tutors.needsAttention.slice(0, 4).map((t, i) => <TutorRow key={t.AdminId} t={t} good={false} i={i} />)}</div>
        : <EmptyMini text="ยังไม่มีติวเตอร์ที่ต้องติดตามเป็นพิเศษ" />}
    </SectionCard>
  );
}

/* ═════════ ตารางเรียนวันนี้ ═════════ */
const ST_META = {
  done: { dot: "bg-emerald-500", Icon: Check, card: "bg-white border-slate-200" },
  live: { dot: "bg-orange-500 sa-ring", Icon: Radio, card: "bg-orange-50 border-orange-200" },
  missed: { dot: "bg-red-500 sa-pulse-red", Icon: X, card: "bg-red-50 border-red-200" },
  next: { dot: "bg-slate-300", Icon: Clock, card: "bg-white border-dashed border-slate-200 opacity-70" },
};

function ScheduleCard({ sessions, nowMin, counts, onNavigate }) {
  const listRef = useRef(null);
  const nowRef = useRef(null);
  useEffect(() => {
    const l = listRef.current, n = nowRef.current;
    if (l && n) l.scrollTop = n.closest("li").offsetTop - l.clientHeight / 2;
  }, [sessions.length]);
  const nowLabel = `${String(Math.floor(nowMin / 60)).padStart(2, "0")}:${String(nowMin % 60).padStart(2, "0")}`;
  const firstNext = sessions.findIndex((s) => s.st === "next");

  return (
    <SectionCard title="ตารางเรียนวันนี้" icon={Calendar} action={<LinkBtn onClick={() => onNavigate("/admin/schedule")}>ตารางเต็ม</LinkBtn>}>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle className="h-3 w-3" />เช็กอินแล้ว {counts.checked}</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-orange-50 text-orange-700 border-orange-200"><span className="h-1.5 w-1.5 rounded-full bg-orange-500 sa-blink" />กำลังสอน {counts.live}</span>
        {counts.missed > 0 && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-red-50 text-red-700 border-red-200">ยังไม่เช็กอิน {counts.missed}</span>}
      </div>
      {sessions.length === 0 ? <EmptyMini text="วันนี้ไม่มีคาบเรียน" /> : (
        <ol ref={listRef} className="sa-scroll relative space-y-2 max-h-[340px] overflow-y-auto pr-1 pl-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-300 before:via-orange-300 before:to-slate-200">
          {sessions.map((s, i) => {
            const m = ST_META[s.st];
            return (
              <li key={s.CourseScheduleDetailId} className="relative">
                {i === firstNext && (
                  <div ref={nowRef} className="relative -ml-6 flex items-center gap-2 py-1 mb-2">
                    <span className="h-5 w-5 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center shadow ring-4 ring-orange-100 shrink-0">▶</span>
                    <span className="h-0.5 flex-1 bg-gradient-to-r from-orange-500 to-transparent" />
                    <span className="text-[11px] font-bold text-orange-600">ตอนนี้ {nowLabel}</span>
                  </div>
                )}
                <span className={`absolute -left-6 ${i === firstNext ? "top-12" : "top-3"} h-5 w-5 rounded-full ${m.dot} text-white flex items-center justify-center ring-4 ring-white`}><m.Icon className="h-3 w-3" /></span>
                <div className={`rounded-xl border ${m.card} px-3 py-2`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500">{s.StartTime}–{s.EndTime}</span>
                    {s.st === "live" && <span className="text-[10px] font-bold text-white bg-orange-500 rounded-full px-1.5 py-0.5">LIVE</span>}
                    {s.st === "missed" && <span className="text-[10px] font-bold text-red-600 bg-white border border-red-200 rounded-full px-1.5 py-0.5">ยังไม่เช็กอิน</span>}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{s.CourseName}{s.SubjectName ? ` · ${s.SubjectName}` : ""}</p>
                  <p className="text-[11px] text-slate-500 truncate">{[s.RoomDetail && `ห้อง ${s.RoomDetail}`, s.TutorNickname].filter(Boolean).join(" · ") || "—"}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}

/* ═════════ ห้องเรียน: ผังตึก 3D ═════════ */
const ROOM_COLORS = {
  busy: ["#fed7aa", "#fb923c", "#ea580c", "#9a3412"],
  free: ["#d1fae5", "#6ee7b7", "#34d399", "#047857"],
  fix: ["url(#dashHatch)", "#e2e8f0", "#cbd5e1", "#94a3b8"],
};

function RoomsIso({ list, active }) {
  const wrapRef = useRef(null);
  const W = useWidth(wrapRef);
  const p = useProgress(active && W > 0, 1500);
  const [hover, setHover] = useState(null);
  const [tip, setTip] = useState(null);

  const floors = useMemo(() => {
    const m = new Map();
    list.forEach((r) => { const f = Number(r.Floor) || 1; if (!m.has(f)) m.set(f, []); m.get(f).push(r); });
    return [...m.entries()].sort((a, b) => b[0] - a[0]); // ชั้นสูงอยู่ด้านหลัง
  }, [list]);
  const cols = Math.max(1, ...floors.map(([, rs]) => rs.length));
  const rows = Math.max(1, floors.length);
  const statusOf = (r) => (r.InUseNow ? "busy" : Number(r.Status_Room_Id) !== 1 ? "fix" : "free");

  let svg = null, H = 0;
  if (W > 0) {
    const C = 0.866, S = 0.5;
    const unit = Math.min((W - 70) / ((cols + rows) * C), 64);
    const s = unit * 0.74, g = unit - s;
    const HT = { busy: unit * 0.85, free: unit * 0.34, fix: unit * 0.14 };
    const isoW = (cols + rows) * unit * C;
    const ox = (W - isoW) / 2 + rows * unit * C + 18, oy = HT.busy + 26;
    const P = (x, y, z) => [(x - y) * C + ox, (x + y) * S - z + oy];
    const pts = (...a) => a.map(([x, y, z]) => P(x, y, z).map((v) => v.toFixed(1)).join(",")).join(" ");
    const box = (key, x, y, z, sx, sy, h, [top, left, right], extra = {}) => (
      <g key={key} {...extra}>
        <polygon points={pts([x, y + sy, z], [x + sx, y + sy, z], [x + sx, y + sy, z + h], [x, y + sy, z + h])} fill={left} />
        <polygon points={pts([x + sx, y, z], [x + sx, y + sy, z], [x + sx, y + sy, z + h], [x + sx, y, z + h])} fill={right} />
        <polygon points={pts([x, y, z + h], [x + sx, y, z + h], [x + sx, y + sy, z + h], [x, y + sy, z + h])} fill={top} stroke="rgba(255,255,255,.7)" strokeWidth=".8" />
      </g>
    );
    H = (cols + rows) * unit * S + oy + 14;
    const tiles = [];
    floors.forEach(([, rs], gy) => rs.forEach((r, gx) => tiles.push({ r, gx, gy })));
    tiles.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
    const els = [
      <ellipse key="sh" cx={W / 2} cy={H - 14} rx={W * 0.4} ry="10" fill="rgba(15,23,42,.10)" style={{ filter: "blur(6px)" }} />,
      box("plate", -g, -g, -9, cols * unit + g, rows * unit + g, 9, ["#f8fafc", "#e2e8f0", "#cbd5e1"]),
    ];
    tiles.forEach(({ r, gx, gy }) => {
      const st = statusOf(r);
      const x = gx * unit, y = gy * unit, pr = ease(p * 1.7 - (gx + gy) * 0.12);
      const lift = hover === r.RoomId ? unit * 0.18 : 0, h = HT[st] * pr, [t, l, rr, tx] = ROOM_COLORS[st];
      els.push(box(`r${r.RoomId}`, x, y, lift, s, s, h, [t, l, rr], { "data-room": r.RoomId, style: { cursor: "pointer" } }));
      const [cx, cy] = P(x + s / 2, y + s / 2, h + lift);
      const label = String(r.RoomDetail || r.RoomId);
      if (pr > 0.6) els.push(<text key={`t${r.RoomId}`} x={cx} y={cy + 3} textAnchor="middle" fontSize={Math.max(9, unit * 0.2)} fontWeight="700" fill={tx} pointerEvents="none">{label.length > 6 ? `${label.slice(0, 5)}…` : label}</text>);
      if (st === "busy" && pr > 0.9) els.push(<circle key={`d${r.RoomId}`} cx={cx} cy={cy - unit * 0.28} r="3" fill="#f97316" className="sa-blink" pointerEvents="none" />);
    });
    floors.forEach(([f], gy) => {
      const [fx, fy] = P(-g - unit * 0.45, gy * unit + s / 2, 0);
      els.push(<text key={`f${f}`} x={fx - 6} y={fy + 4} textAnchor="end" fontSize="10" fill="#94a3b8">ชั้น {f}</text>);
    });
    svg = els;
  }

  const onMove = (e) => {
    const el = e.target.closest("[data-room]");
    if (!el) { setHover(null); setTip(null); return; }
    const id = Number(el.getAttribute("data-room"));
    setHover(id);
    const r = wrapRef.current.getBoundingClientRect();
    setTip({ id, x: clamp(e.clientX - r.left + 12, 0, r.width - 180), y: e.clientY - r.top - 56 });
  };
  const tipRoom = tip && list.find((r) => r.RoomId === tip.id);
  const tipSt = tipRoom && statusOf(tipRoom);

  return (
    <div ref={wrapRef} className="relative w-full">
      {W > 0 && (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="overflow-visible" onMouseMove={onMove} onMouseLeave={() => { setHover(null); setTip(null); }}>
          <defs>
            <pattern id="dashHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#f1f5f9" /><rect width="3" height="6" fill="#e2e8f0" />
            </pattern>
          </defs>
          {svg}
        </svg>
      )}
      {tipRoom && (
        <div className="pointer-events-none absolute z-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg w-max max-w-[220px]" style={{ left: tip.x, top: tip.y }}>
          <p className="font-bold text-slate-900">ห้อง {tipRoom.RoomDetail} · <span className={tipSt === "busy" ? "text-orange-600" : tipSt === "free" ? "text-emerald-600" : "text-slate-500"}>{tipSt === "busy" ? "กำลังใช้" : tipSt === "free" ? "ว่าง" : tipRoom.Status_Room_Name || "ใช้งานไม่ได้"}</span></p>
          {tipSt === "busy" && <p className="text-slate-500">{[tipRoom.CurrentCourse, tipRoom.CurrentTutor].filter(Boolean).join(" · ")}</p>}
        </div>
      )}
    </div>
  );
}

function RoomsCard({ rooms, onNavigate }) {
  const list = rooms.list || [];
  const busy = list.filter((r) => r.InUseNow).length;
  const fix = list.filter((r) => !r.InUseNow && Number(r.Status_Room_Id) !== 1).length;
  const free = list.length - busy - fix;
  return (
    <SectionCard title="ห้องเรียน" icon={DoorOpen} action={<LinkBtn onClick={() => onNavigate("/admin/rooms")}>ดูทั้งหมด</LinkBtn>}>
      {(inView) => (
        <div className="flex flex-col h-full">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-900"><CountUp value={rooms.total} /></p>
            <p className="text-sm text-slate-500">ห้อง</p>
            {list.length > 0 && <span className="ml-auto text-[11px] text-slate-400 hidden sm:block">ชี้ที่ห้องเพื่อดูรายละเอียด</span>}
          </div>
          <div className="flex-1 flex items-center py-2">
            {list.length === 0 ? <EmptyMini text="ยังไม่มีห้องเรียนในระบบ" /> : <RoomsIso list={list} active={inView} />}
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-gradient-to-br from-orange-300 to-orange-500" />กำลังใช้ <b className="ml-auto tabular-nums">{busy}</b></div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-200 border border-emerald-300" />ว่าง <b className="ml-auto tabular-nums">{free}</b></div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-slate-200 border border-slate-300" />ปิดใช้งาน <b className="ml-auto tabular-nums">{fix}</b></div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ═════════ คลังอุปกรณ์ ═════════ */
const B3_VARS = {
  emerald: { "--c1": "#34d399", "--c2": "#059669", "--ct": "#a7f3d0", "--cs": "#047857" },
  amber: { "--c1": "#fbbf24", "--c2": "#d97706", "--ct": "#fde68a", "--cs": "#b45309" },
  red: { "--c1": "#f87171", "--c2": "#dc2626", "--ct": "#fecaca", "--cs": "#b91c1c" },
  track: { "--c1": "#f1f5f9", "--c2": "#e2e8f0", "--ct": "#f8fafc", "--cs": "#cbd5e1" },
};
function B3Seg({ left, width, tone, delay = 0, stripes = false }) {
  if (width <= 0) return null;
  return (
    <span className="sa-grow" style={{ left: `${left}%`, width: `${width}%`, animationDelay: `${delay}s`, ...B3_VARS[tone] }}>
      <span className={`fc ${stripes ? "sa-stripes" : ""}`} /><span className="tp" /><span className="sd" />
    </span>
  );
}

function FacilitiesCard({ facilities, onNavigate }) {
  const ready = Number(facilities.ready ?? 0);
  const low = Number(facilities.lowStock ?? 0);
  const out = Number(facilities.outOfStock ?? 0);
  // "ทั้งหมด" = พร้อมใช้ + ใกล้หมด + หมดสต๊อก เสมอ (เซฟตี้เน็ตเดิม)
  const total = Math.max(Number(facilities.total ?? 0), ready + low + out);
  const pct = (v) => (total ? (v / total) * 100 : 0);
  const items = facilities.lowItems || [];
  return (
    <SectionCard title="คลังอุปกรณ์" icon={Boxes} action={<LinkBtn onClick={() => onNavigate("/admin/common-facilities")}>ดูทั้งหมด</LinkBtn>}>
      <div className="flex items-baseline gap-2 mb-2"><p className="text-3xl font-bold text-slate-900"><CountUp value={total} /></p><p className="text-sm text-slate-500">อุปกรณ์ทั้งหมด</p></div>
      {total > 0 && (
        <div className="sa-b3" style={{ "--h": "22px", "--d": "10px" }}>
          <span style={{ right: 0, ...B3_VARS.track }}><span className="fc" /><span className="tp" /><span className="sd" /></span>
          <B3Seg left={0} width={pct(ready)} tone="emerald" />
          <B3Seg left={pct(ready)} width={pct(low)} tone="amber" delay={0.25} stripes />
          <B3Seg left={pct(ready) + pct(low)} width={pct(out)} tone="red" delay={0.45} />
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl px-2 py-2 border text-center bg-emerald-50 border-emerald-100 text-emerald-700"><p className="text-[11px] opacity-70">พร้อมใช้</p><p className="text-lg font-bold tabular-nums">{ready} <span className="text-xs font-medium opacity-70">รายการ</span></p></div>
        <div className="rounded-xl px-2 py-2 border text-center bg-amber-50 border-amber-100 text-amber-700"><p className="text-[11px] opacity-70">ใกล้หมด</p><p className="text-lg font-bold tabular-nums">{low} <span className="text-xs font-medium opacity-70">รายการ</span></p></div>
        <div className={`rounded-xl px-2 py-2 border text-center bg-red-50 border-red-100 text-red-600 ${out > 0 ? "sa-pulse-red" : ""}`}><p className="text-[11px] opacity-70">หมดสต๊อก</p><p className="text-lg font-bold tabular-nums">{out} <span className="text-xs font-medium opacity-70">รายการ</span></p></div>
      </div>
      {items.length > 0 && (
        <>
          <p className="text-xs font-bold text-slate-500 mt-5 mb-2">ต้องเติมก่อน</p>
          <div className="space-y-3">
            {items.map((it, i) => {
              const isOut = it.quantity === 0;
              const p = it.minQuantity ? (it.quantity / it.minQuantity) * 100 : 0;
              return (
                <div key={it.id}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-700 truncate">{it.name}</span>
                    <span className={`font-bold tabular-nums shrink-0 ${isOut ? "text-red-600" : "text-amber-600"}`}>{isOut ? "หมดแล้ว" : `เหลือ ${it.quantity}${it.minQuantity ? ` (ขั้นต่ำ ${it.minQuantity})` : ""}`}</span>
                  </div>
                  <div className="mt-1"><FlatBar pct={p} className={isOut ? "bg-red-100" : "bg-slate-100"} fill="#fbbf24" delay={0.2 + i * 0.1} /></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </SectionCard>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nowMin, setNowMin] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("student_token");
      const res = await axios.get(`${API_BASE}/summary`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  // อัปเดตสถานะคาบ (กำลังสอน / เลยเวลา) ทุกนาที
  useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()); }, 60000);
    return () => clearInterval(id);
  }, []);

  const goTo = (path) => { if (path) navigate(path); };

  const kpi = data?.kpi || {};
  const courses = data?.courses || {};
  const students = data?.students || {};
  const tutors = data?.tutors || {};
  const finance = data?.finance || {};
  const scheduleToday = data?.scheduleToday || {};
  const rooms = data?.rooms || {};
  const facilities = data?.facilities || {};

  // สถานะแต่ละคาบ ณ ตอนนี้
  const sessions = useMemo(() => (scheduleToday.sessions || []).map((s) => {
    const start = toMin(s.StartTime), end = toMin(s.EndTime);
    const st = start > nowMin ? "next" : !s.CheckedIn ? "missed" : end <= nowMin ? "done" : "live";
    return { ...s, st, started: start <= nowMin };
  }), [scheduleToday.sessions, nowMin]);
  const counts = {
    checked: sessions.filter((s) => s.CheckedIn).length,
    live: sessions.filter((s) => s.st === "live").length,
    missed: sessions.filter((s) => s.st === "missed").length,
  };
  const liveRooms = (rooms.list || []).filter((r) => r.InUseNow).length;

  const pieData = useMemo(() => (courses.byStatus || [])
    .map((s, i) => ({ name: s.Status_Course_Name, value: Number(s.cnt), color: PIE_COLORS[i % PIE_COLORS.length] }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value), [courses.byStatus]);

  const roomMaintenance = (rooms.byStatus || []).find((s) => s.Status_Room_Id === 2);
  const chips = useMemo(() => buildActionChips(data?.actionCenter?.items || [], [
    counts.missed > 0 && { id: "missed-checkins", title: "คาบวันนี้ยังไม่เช็กอิน", message: `${counts.missed} คาบยังไม่เช็กอิน`, count: counts.missed, link: "/admin/schedule" },
    roomMaintenance?.cnt > 0 && { id: "rooms-maintenance", title: "ห้องปิดปรับปรุง", message: `${roomMaintenance.cnt} ห้องปิดปรับปรุง`, count: roomMaintenance.cnt, link: "/admin/rooms" },
  ].filter(Boolean)), [data, counts.missed, roomMaintenance]);

  // คะแนนสุขภาพ = ค่าเฉลี่ยของตัวชี้วัดที่มีข้อมูลจริงเท่านั้น
  const facTotal = Math.max(Number(facilities.total ?? 0), Number(facilities.ready ?? 0) + Number(facilities.lowStock ?? 0) + Number(facilities.outOfStock ?? 0));
  const startedCount = sessions.filter((s) => s.started).length;
  const metrics = [
    tutors.avgCheckinRate != null && { label: "เช็กอินติวเตอร์เดือนนี้", value: Number(tutors.avgCheckinRate) },
    startedCount > 0 && { label: "คาบวันนี้เช็กอินแล้ว", value: Math.round((sessions.filter((s) => s.started && s.CheckedIn).length / startedCount) * 100) },
    facTotal > 0 && { label: "อุปกรณ์พร้อมใช้", value: Math.round((Number(facilities.ready ?? 0) / facTotal) * 100) },
  ].filter(Boolean);
  const score = metrics.length ? Math.round(metrics.reduce((a, m) => a + m.value, 0) / metrics.length) : null;

  const userName = (() => { try { return JSON.parse(localStorage.getItem("user") || "null")?.firstname || ""; } catch { return ""; } })();

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-0">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Skeleton className="h-[420px]" /><Skeleton className="h-[420px]" /></div>
      </div>
    );
  }
  if (error && !data) {
    return <div className="px-4 lg:px-0"><ErrorState message={error} onRetry={fetchData} /></div>;
  }

  const series = kpi.series || {};
  const growth = kpi.revenueGrowthPct;

  return (
    <div className="space-y-6 px-4 lg:px-0 overflow-x-clip">
      <Hero generatedAt={data?.generatedAt} userName={userName} sessionsTotal={scheduleToday.total ?? sessions.length}
        liveRooms={liveRooms} actionCount={chips.length} metrics={metrics} score={score} />

      <ActionSection chips={chips} onNavigate={goTo} />

      <Reveal className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="คอร์สที่เปิดสอนอยู่" value={kpi.activeCourses ?? 0} unit="คอร์ส" sub={`ทั้งหมด ${kpi.totalCourses ?? 0} คอร์ส`} icon={BookOpen} color="bg-blue-500" spark={series.courses} sparkColor="#3b82f6" delay={0.1} />
        <StatCard label="นักเรียนทั้งหมด" value={kpi.totalStudents ?? 0} unit="คน" sub={`ลงทะเบียนแล้ว ${kpi.enrolledStudents ?? 0} คน`} icon={GraduationCap} color="bg-orange-600" spark={series.students} sparkColor="#f97316" delay={0.16} />
        <StatCard label="ติวเตอร์ทั้งหมด" value={kpi.totalTutors ?? 0} unit="คน" sub={`กำลังสอน ${kpi.activeTutors ?? 0} คน`} icon={Users} color="bg-emerald-500" spark={series.tutors} sparkColor="#10b981" delay={0.22} />
        <StatCard label="รายรับเดือนนี้" value={kpi.monthlyRevenue ?? 0} money icon={Wallet} color="bg-amber-500"
          sub={growth !== undefined ? `${growth >= 0 ? "+" : ""}${growth}% จากเดือนก่อน` : undefined} subUp={growth !== undefined ? growth >= 0 : undefined}
          spark={(finance.trend || []).map((d) => d.revenue)} sparkColor="#f59e0b" delay={0.28} />
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <SectionCard title="สัดส่วนคอร์สตามสถานะ" icon={PieChartIcon} className="lg:col-span-2" subtitle="ชี้ที่ชิ้นเพื่อดูรายละเอียด"
          action={<LinkBtn onClick={() => goTo("/admin/courses")}>ดูทั้งหมด</LinkBtn>}>
          {pieData.length ? <Pie3D data={pieData} total={courses.total || pieData.reduce((a, d) => a + d.value, 0)} /> : <EmptyMini text="ยังไม่มีข้อมูลคอร์สในระบบ" />}
        </SectionCard>
        <FinanceCard finance={finance} onNavigate={goTo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StudentsCard students={students} onNavigate={goTo} />
        <TutorsCard tutors={tutors} onNavigate={goTo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ScheduleCard sessions={sessions} nowMin={nowMin} counts={counts} onNavigate={goTo} />
        <RoomsCard rooms={rooms} onNavigate={goTo} />
        <FacilitiesCard facilities={facilities} onNavigate={goTo} />
      </div>
    </div>
  );
}
