import { API_URL } from "../config";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertCircle, AlertTriangle, Info, ChevronRight,
  BookOpen, GraduationCap, Wallet, TrendingUp, TrendingDown,
  Calendar, DoorOpen, Boxes, Clock, CheckCircle,
  UserCheck, Bell, Sparkles, PieChart as PieChartIcon,
} from "lucide-react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";

const API_BASE = `${API_URL}/api/admin/dashboard`;
const READ_STORAGE_KEY = "admin_dashboard_read_alerts";

/* ─── Design tokens (อิงจาก AdminStudent.jsx / AdminTutors.jsx เพื่อให้เป็นระบบเดียวกัน) ───
   ★ ปรับ: เพิ่ม cardH (ความสูงมาตรฐานของการ์ดกราฟกลาง) เพื่อบังคับให้ Line chart กับ
   Donut chart มีน้ำหนักภาพเท่ากันเป๊ะ ๆ ตาม requirement #3
─────────────────────────────────────────────────────────────────────────── */
const T = {
  card: "bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition",
  cardPad: "p-5",
  transition: "transition duration-200 ease-out",
  title: "text-base font-bold text-slate-900",
  subtitle: "text-sm text-slate-500",
  label: "text-xs font-medium text-slate-500",
  value: "text-2xl font-bold text-slate-900 tracking-tight",
  caption: "text-[11px] text-slate-400",
  chartCardH: "h-[400px]", // ★ ความสูงคงที่ร่วมกันของการ์ดกราฟทั้งคู่ในแถวกลาง
};

const SEVERITY_STYLE = {
  danger: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: AlertTriangle, iconColor: "text-red-500", rank: 0 },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: AlertCircle, iconColor: "text-amber-500", rank: 1 },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Info, iconColor: "text-blue-500", rank: 2 },
};

// สีสำหรับ Donut Chart — โทนเดียวกับระบบ (orange เป็นสีหลัก)
const PIE_COLORS = [
  { base: "#f97316", light: "#fdba74" }, // orange (ธีมหลัก)
  { base: "#10b981", light: "#6ee7b7" }, // emerald
  { base: "#3b82f6", light: "#93c5fd" }, // blue
  { base: "#f59e0b", light: "#fcd34d" }, // amber
  { base: "#94a3b8", light: "#cbd5e1" }, // slate
  { base: "#a855f7", light: "#d8b4fe" }, // purple (สำรอง)
];

const formatMoney = (v) => `฿${Number(v || 0).toLocaleString()}`;

/* ─── Shared small components ─────────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className={`${T.card} ${T.cardPad} flex flex-col items-center justify-center text-center py-10`}>
      <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
      <p className="text-sm text-slate-600 mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition"
      >
        ลองใหม่
      </button>
    </div>
  );
}

// ★ ปรับ: เพิ่ม prop bodyClassName เพื่อให้ SectionCard บังคับความสูง content ได้เท่ากันทุกใบ
function SectionCard({ title, icon: Icon, action, children, className = "", bodyClassName = "" }) {
  return (
    <div className={`${T.card} ${T.cardPad} flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className={`${T.title} flex items-center gap-2`}>
          {Icon && <Icon className="h-4 w-4 text-orange-500" />}
          {title}
        </h3>
        {action}
      </div>
      <div className={`flex-1 min-h-0 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

// ─── KPICard — Executive style: ตัวเลขหลักใหญ่ + context สั้น ๆ ───
function KPICard({ label, value, trend, trendUp, sub, icon: Icon, accent = "text-orange-500" }) {
  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition h-full flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${accent}`} />}
      </div>
      <div>
        <p className="text-[26px] leading-tight font-black text-slate-900 mt-2 tracking-tight">{value}</p>
        {trend && (
          <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
            {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend}
          </p>
        )}
        {sub && !trend && <p className="text-xs font-medium text-slate-400 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyMini({ text, hint }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-8">
      <p className="text-xs text-slate-400">{text}</p>
      {hint && <p className="text-[11px] text-slate-300 mt-1">{hint}</p>}
    </div>
  );
}

function MiniPersonRow({ photo, name, sub, tone = "slate" }) {
  const toneCls = {
    slate: "bg-slate-50 text-slate-600 border-slate-200",
    red: "bg-red-50 text-red-600 border-red-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  }[tone];
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[11px] font-bold text-orange-600 shrink-0 overflow-hidden">
        {photo ? (
          <img src={photo.startsWith("http") ? photo : `${API_URL}${photo}`} alt="" className="w-full h-full object-cover" />
        ) : (
          (name || "?").charAt(0)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${toneCls}`}>{sub}</span>
    </div>
  );
}

// ─── Inline KPI row เล็ก ๆ ใช้แทนกล่อง 3 กล่องใหญ่ใน Card นักเรียน/ติวเตอร์ ───
function InlineStat({ label, value, tone = "slate" }) {
  const toneCls = {
    slate: "text-slate-800",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  }[tone];
  return (
    <div className="flex-1 text-center">
      <p className={`text-lg font-bold ${toneCls}`}>{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

/* ─── ★ ใหม่: NotificationBell — แทนที่ ActionCenter เดิม ─────────────────────
   Requirement #2: เดิม ActionCenter เป็นกริดเต็มความกว้างที่กินพื้นที่แนวตั้งเยอะ
   จนบัง KPI การเงินซึ่งเป็นสิ่งสำคัญที่สุด → ย้ายมาเป็นไอคอนกระดิ่ง + badge ที่มุมขวาบน
   ของ header คลิกแล้วค่อย dropdown แสดงรายการ ทำให้ KPI การเงินเป็นสิ่งแรกที่เห็น
─────────────────────────────────────────────────────────────────────────── */
function NotificationBell({ items, readIds, onMarkRead, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ra = SEVERITY_STYLE[a.severity]?.rank ?? 3;
      const rb = SEVERITY_STYLE[b.severity]?.rank ?? 3;
      return ra - rb;
    });
  }, [items]);

  const unreadCount = items.filter((i) => !readIds.includes(i.id)).length;
  const hasItems = items.length > 0;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-2 pl-3 pr-3.5 py-2.5 rounded-xl border bg-white ${T.transition} ${
          hasItems ? "border-slate-200 hover:border-orange-300 hover:bg-orange-50" : "border-slate-200"
        }`}
      >
        <Bell className={`h-4 w-4 ${hasItems ? "text-orange-500" : "text-slate-400"}`} />
        <span className="text-xs font-semibold text-slate-600">
          {hasItems ? `ต้องจัดการ ${items.length} รายการ` : "ไม่มีรายการที่ต้องจัดการ"}
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[90vw] bg-white rounded-2xl border border-slate-100 shadow-xl z-20 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-orange-500" /> สิ่งที่ต้องจัดการ
            </p>
            <span className="text-[11px] text-slate-400">{items.length} รายการ</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                <p className="text-xs text-slate-400">ทุกอย่างเรียบร้อยดี</p>
              </div>
            ) : (
              sorted.map((item) => {
                const s = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.info;
                const Icon = s.icon;
                const isUnread = !readIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => { onMarkRead(item.id); onNavigate(item.link); setOpen(false); }}
                    className="w-full flex items-start gap-2.5 px-4 py-3 text-left border-b border-slate-50 last:border-0 hover:bg-orange-50/60 transition relative"
                  >
                    {isUnread && <span className="absolute top-3.5 right-4 h-1.5 w-1.5 rounded-full bg-red-500" />}
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${s.iconColor}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold ${s.text}`}>{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.message}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Course Status Donut — ★ ปรับใหม่ตาม requirement #3 ──────────────────
   เดิม: legend เรียงเป็น list แนวตั้งด้านข้าง ทำให้การ์ดนี้ "แน่น" กว่าฝั่งกราฟเส้นมาก
   ใหม่: ย้าย legend มาเป็นแถวแนวนอนด้านล่าง (wrap ได้), ลดขนาดวงกลมลงเล็กน้อย,
   และ layout เป็นแนวตั้ง (โดนัทกลาง + legend ล่าง) แทนแนวนอน (โดนัท + list ข้าง)
   เพื่อให้ "น้ำหนักภาพ" เทียบเท่ากับ LineChart ฝั่งซ้ายที่มีความสูงเท่ากัน (T.chartCardH)
─────────────────────────────────────────────────────────────────────────── */
function CourseStatusDonut({ byStatus = [], total = 0 }) {
  const chartData = byStatus
    .filter((s) => Number(s.cnt) > 0)
    .map((s, i) => ({
      name: s.Status_Course_Name,
      value: Number(s.cnt),
      color: PIE_COLORS[i % PIE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return <EmptyMini text="ยังไม่มีข้อมูลคอร์สในระบบ" />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative w-44 h-44 shrink-0 mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <RPieChart>
            <defs>
              {chartData.map((d, i) => (
                <radialGradient id={`courseGrad-${i}`} key={i} cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor={d.color.light} />
                  <stop offset="100%" stopColor={d.color.base} />
                </radialGradient>
              ))}
            </defs>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={44}
              outerRadius={76}
              paddingAngle={3}
              cornerRadius={4}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {chartData.map((d, i) => (
                <Cell key={i} fill={`url(#courseGrad-${i})`} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} คอร์ส`, name]}
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
            />
          </RPieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-black text-slate-900">{total}</p>
          <p className="text-[10px] text-slate-400">คอร์สทั้งหมด</p>
        </div>
      </div>

      {/* ★ legend แนวนอนด้านล่าง แทนที่ list แนวตั้งด้านข้างเดิม */}
      <div className="flex-1 flex flex-wrap content-center justify-center gap-x-4 gap-y-2.5 mt-4 px-2">
        {chartData.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color.base }} />
            <span className="text-xs text-slate-600">{d.name}</span>
            <span className="text-xs font-bold text-slate-800">{d.value}</span>
            <span className="text-[10px] text-slate-400">
              ({total ? Math.round((d.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Finance Trend Chart — ★ ปรับใหม่ตาม requirement #3 ───────────────────
   เดิม: LineChart เปล่า ๆ ดูโหวงเมื่อข้อมูลกระจุกตัวช่วงเดียว
   ใหม่: ใช้ ComposedChart + Area (พื้นที่ใต้เส้นรายรับแบบ gradient fill บาง ๆ)
   ทำให้กราฟมี "เนื้อ" มากขึ้น รู้สึกเต็มพื้นที่การ์ดพอ ๆ กับ Donut ฝั่งขวา
   โดยไม่ต้องพึ่งการ mock ข้อมูลเพิ่ม
─────────────────────────────────────────────────────────────────────────── */
function FinanceTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Area type="monotone" dataKey="revenue" name="รายรับ" stroke="#22c55e" strokeWidth={2.5} fill="url(#revenueFill)" dot={{ r: 3 }} />
        <Line type="monotone" dataKey="expense" name="รายจ่าย" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "[]");
    } catch { return []; }
  });

  const getAdminAuthConfig = () => {
    const token = localStorage.getItem("student_token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/summary`, getAdminAuthConfig());
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markRead = (id) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const goTo = (path) => { if (path) navigate(path); };

  if (loading) {
    return (
      <div className="space-y-6 mt-[90px]">
        <Skeleton className="h-14 w-full" />
        <SkeletonGrid count={3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mt-[90px]">
        <ErrorState message={error} onRetry={() => fetchData()} />
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const actionItems = data?.actionCenter?.items || [];
  const courses = data?.courses || {};
  const students = data?.students || {};
  const tutors = data?.tutors || {};
  const finance = data?.finance || {};
  const scheduleToday = data?.scheduleToday || {};
  const rooms = data?.rooms || {};
  const facilities = data?.facilities || {};

  const revenueUp = (kpi.revenueGrowthPct ?? 0) >= 0;
  const profitUp = (kpi.monthlyProfit ?? 0) >= 0;

  const financeTrend = finance.trend || [];
  const hasRealFinanceData = financeTrend.some((d) => Number(d.revenue) > 0 || Number(d.expense) > 0);

  // ★ Requirement #4 (ตาข่ายนิรภัยฝั่ง frontend): "อุปกรณ์ทั้งหมด" ต้อง = พร้อมใช้ + ใกล้หมด + หมดสต๊อก เสมอ
  // การแก้ที่ถูกต้องคือฝั่ง backend (ดู admin.dashboard.routes.js ที่แนบมาด้วย) ให้ทั้ง 3 หมวด
  // แยกจากกันแบบ mutually-exclusive ตั้งแต่ query แล้ว ตัวเลขจะตรงกันเองโดยไม่ต้องคำนวณซ้ำที่นี่
  // แต่ยังคง fallback นี้ไว้เผื่อกรณี backend ยังไม่ได้ deploy การแก้ไข เพื่อไม่ให้ตัวเลขที่ผู้ใช้เห็นขัดกันเอง
  const facilitiesReady = Number(facilities.ready ?? 0);
  const facilitiesLow = Number(facilities.lowStock ?? 0);
  const facilitiesOut = Number(facilities.outOfStock ?? 0);
  const facilitiesBreakdownSum = facilitiesReady + facilitiesLow + facilitiesOut;
  const facilitiesTotal = Math.max(Number(facilities.total ?? 0), facilitiesBreakdownSum);

  return (
    <div className="space-y-6 mt-[90px]">
      {/* ── Header + Notification Bell ────────────────────────────
          ★ Requirement #2: การแจ้งเตือนย้ายมาไว้ที่มุมขวาบนของ header แบบกระทัดรัด
          แทนที่การ์ดเต็มความกว้างเดิม ทำให้ KPI การเงินด้านล่างเป็นสิ่งแรกที่ผู้ใช้เห็น */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ภาพรวมสถาบัน</h1>
          <p className={`${T.subtitle} mt-1`}>
            สรุปสถานะและสิ่งที่ต้องจัดการ ณ ตอนนี้
            {data?.generatedAt && (
              <span className="ml-1 text-slate-400">
                · อัปเดตล่าสุด {new Date(data.generatedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <NotificationBell
          items={actionItems}
          readIds={readIds}
          onMarkRead={markRead}
          onNavigate={goTo}
        />
      </div>

      {/* ── KPI หลัก — ตอนนี้เป็นสิ่งแรกที่มีน้ำหนักภาพสุดในหน้า ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          label="รายรับเดือนนี้"
          value={formatMoney(kpi.monthlyRevenue)}
          trend={`${revenueUp ? "↑" : "↓"} ${Math.abs(kpi.revenueGrowthPct ?? 0)}% จากเดือนก่อน`}
          trendUp={revenueUp}
          icon={Wallet}
          accent="text-emerald-500"
        />
        <KPICard
          label="กำไรสุทธิ"
          value={formatMoney(kpi.monthlyProfit)}
          sub={kpi.profitMargin !== null ? `Margin ${kpi.profitMargin}%` : "ยังไม่มีข้อมูล"}
          icon={TrendingUp}
          accent={profitUp ? "text-orange-500" : "text-red-500"}
        />
        <KPICard
          label="ยอดค้างชำระ"
          value={formatMoney(kpi.outstandingAmount)}
          sub={`${kpi.outstandingCount ?? 0} รายการ`}
          icon={Clock}
          accent={kpi.outstandingCount > 0 ? "text-amber-500" : "text-slate-400"}
        />
      </div>

      {/* ── แนวโน้มการเงิน + สัดส่วนคอร์สตามสถานะ ───────────────────────
          ★ Requirement #1 & #3: ทั้งสองการ์ดใช้ T.chartCardH ความสูงเท่ากันเป๊ะ,
          กว้างเท่ากันด้วย grid-cols-2, และ "เนื้อ" ของกราฟถูกปรับให้มีน้ำหนักภาพใกล้เคียงกัน
          (Line chart เพิ่ม Area fill, Donut ย้าย legend ลงล่างแนวนอนแทน list ข้าง) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="รายรับ vs รายจ่าย (6 เดือนล่าสุด)"
          icon={Wallet}
          className={T.chartCardH}
          action={
            <button onClick={() => navigate("/admin/finance")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
              ดูรายละเอียด <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          {hasRealFinanceData ? (
            <FinanceTrendChart data={financeTrend} />
          ) : (
            <EmptyMini
              text="ยังไม่มีข้อมูลทางการเงินเพียงพอสำหรับแสดงแนวโน้ม"
              hint="เริ่มมีรายการเมื่อมีการบันทึกรายรับหรือรายจ่าย"
            />
          )}
        </SectionCard>

        <SectionCard
          title="สัดส่วนคอร์สตามสถานะ"
          icon={PieChartIcon}
          className={T.chartCardH}
          action={
            <button onClick={() => navigate("/admin/courses")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
              ดูทั้งหมด <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          <CourseStatusDonut byStatus={courses.byStatus || []} total={courses.total || 0} />
        </SectionCard>
      </div>

      {/* ── นักเรียน / ติวเตอร์ ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="ภาพรวมนักเรียน" icon={GraduationCap}
          action={<button onClick={() => navigate("/admin/students")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="flex items-center py-1 mb-3 border-b border-slate-50">
            <InlineStat label="ทั้งหมด" value={students.total ?? 0} />
            <InlineStat label="ลงทะเบียน" value={students.enrolled ?? 0} tone="emerald" />
            <InlineStat label="เข้าเรียนเฉลี่ย" value={students.avgAttendanceRate !== null ? `${students.avgAttendanceRate}%` : "—"} tone="amber" />
          </div>
          {students.needsAttention && students.needsAttention.length > 0 ? (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">ควรติดตาม (เข้าเรียนต่ำ)</p>
              {students.needsAttention.slice(0, 4).map((s) => (
                <MiniPersonRow
                  key={s.UserId}
                  photo={s.Photo}
                  name={s.Nickname || `${s.Firstname} ${s.Lastname}`}
                  sub={`${Math.round((s.Attended / s.TotalClasses) * 100)}%`}
                  tone="red"
                />
              ))}
            </div>
          ) : (
            <EmptyMini text="ยังไม่มีนักเรียนที่ต้องติดตามเป็นพิเศษ" />
          )}
        </SectionCard>

        <SectionCard title="ภาพรวมติวเตอร์" icon={UserCheck}
          action={<button onClick={() => navigate("/admin/tutors")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="flex items-center py-1 mb-3 border-b border-slate-50">
            <InlineStat label="ทั้งหมด" value={tutors.total ?? 0} />
            <InlineStat label="กำลังสอน" value={tutors.active ?? 0} tone="emerald" />
            <InlineStat label="เช็กอินเฉลี่ย" value={tutors.avgCheckinRate !== null ? `${tutors.avgCheckinRate}%` : "—"} tone="amber" />
          </div>
          {tutors.needsAttention && tutors.needsAttention.length > 0 ? (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">ควรติดตาม (เช็กอินต่ำ)</p>
              {tutors.needsAttention.slice(0, 4).map((t) => (
                <MiniPersonRow
                  key={t.AdminId}
                  photo={t.Photo}
                  name={t.Nickname || `${t.Firstname} ${t.Lastname}`}
                  sub={`${Math.round((t.TotalCheckin / t.TotalScheduled) * 100)}%`}
                  tone="amber"
                />
              ))}
            </div>
          ) : (
            <EmptyMini text="ยังไม่มีติวเตอร์ที่ต้องติดตามเป็นพิเศษ" />
          )}
        </SectionCard>
      </div>

      {/* ── ตารางเรียนวันนี้ / ห้องเรียน / คลังอุปกรณ์ ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="ตารางเรียนวันนี้" icon={Calendar}
          action={<button onClick={() => navigate("/admin/schedule")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูตารางเต็ม <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 flex-1 text-center">
              <p className="text-[10px] text-slate-500">คาบวันนี้</p>
              <p className="text-lg font-bold text-slate-800">{scheduleToday.total ?? 0}</p>
            </div>
            <div className={`rounded-xl px-3 py-2 border flex-1 text-center ${scheduleToday.missed > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
              <p className={`text-[10px] ${scheduleToday.missed > 0 ? "text-red-500" : "text-emerald-600"}`}>ยังไม่เช็กอิน</p>
              <p className={`text-lg font-bold ${scheduleToday.missed > 0 ? "text-red-600" : "text-emerald-700"}`}>{scheduleToday.missed ?? 0}</p>
            </div>
          </div>
          {scheduleToday.sessions && scheduleToday.sessions.length > 0 ? (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {scheduleToday.sessions.map((s) => (
                <div key={s.CourseScheduleDetailId} className="flex items-center gap-2 text-xs py-1 border-b border-slate-50 last:border-0">
                  <span className="font-mono text-[11px] text-slate-500 w-24 shrink-0">{s.StartTime}–{s.EndTime}</span>
                  <span className="flex-1 truncate text-slate-700">{s.CourseName}</span>
                  {s.CheckedIn ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyMini text="วันนี้ไม่มีคาบเรียน" />
          )}
        </SectionCard>

        <SectionCard title="ห้องเรียน" icon={DoorOpen}
          action={<button onClick={() => navigate("/admin/rooms")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">ห้องทั้งหมด</span>
              <span className="text-base font-bold text-slate-800">{rooms.total ?? 0}</span>
            </div>
            {rooms.byStatus?.map((s) => (
              <div key={s.Status_Room_Id} className="flex items-center justify-between px-1 py-1">
                <span className="text-xs text-slate-600">{s.Status_Room_Name}</span>
                <span className={`text-xs font-bold ${s.Status_Room_Id === 2 ? "text-amber-600" : "text-slate-700"}`}>{s.cnt}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── คลังอุปกรณ์ — ★ Requirement #4: แก้ตรรกะให้ "อุปกรณ์ทั้งหมด" = ผลรวมของ
            พร้อมใช้ + ใกล้หมด + หมดสต๊อก เสมอ (ดูส่วน facilitiesTotal ด้านบน + backend fix) ── */}
        <SectionCard title="คลังอุปกรณ์" icon={Boxes}
          action={<button onClick={() => navigate("/admin/common-facilities")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">อุปกรณ์ทั้งหมด</span>
            <span className="text-lg font-bold text-slate-800">{facilitiesTotal}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl border bg-emerald-50 border-emerald-100">
              <span className="text-xs font-medium text-emerald-700">พร้อมใช้งาน</span>
              <span className="text-sm font-bold text-emerald-700">{facilitiesReady}</span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${facilitiesLow > 0 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
              <span className={`text-xs font-medium ${facilitiesLow > 0 ? "text-amber-700" : "text-slate-500"}`}>ใกล้หมด</span>
              <span className={`text-sm font-bold ${facilitiesLow > 0 ? "text-amber-700" : "text-slate-400"}`}>{facilitiesLow}</span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${facilitiesOut > 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
              <span className={`text-xs font-medium ${facilitiesOut > 0 ? "text-red-600" : "text-slate-500"}`}>หมดสต๊อก</span>
              <span className={`text-sm font-bold ${facilitiesOut > 0 ? "text-red-600" : "text-slate-400"}`}>{facilitiesOut}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}