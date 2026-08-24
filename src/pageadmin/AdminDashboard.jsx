import { API_URL } from "../config";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertCircle, AlertTriangle, Info, ChevronRight,
  BookOpen, GraduationCap, Wallet, TrendingUp, TrendingDown,
  Calendar, DoorOpen, Boxes, Clock, CheckCircle,
  UserCheck, Bell, Sparkles, PieChart as PieChartIcon,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";

// เก็บไว้เผื่อนำ Section "Refresh / ประชาสัมพันธ์ / ผู้ดูแลระบบ" กลับมาใช้ในอนาคต:
// ไอคอนที่ต้องเพิ่มกลับ: RefreshCw, Megaphone, Shield

const API_BASE = `${API_URL}/api/admin/dashboard`;
const READ_STORAGE_KEY = "admin_dashboard_read_alerts";

/* ─── Design tokens (อิงจาก AdminStudent.jsx / AdminTutors.jsx เพื่อให้เป็นระบบเดียวกัน) ─── */
const T = {
  card: "bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition",
  cardPad: "p-5",
  transition: "transition duration-200 ease-out",
  title: "text-base font-bold text-slate-900",
  subtitle: "text-sm text-slate-500",
  label: "text-xs font-medium text-slate-500",
  value: "text-2xl font-bold text-slate-900 tracking-tight",
  caption: "text-[11px] text-slate-400",
};

const SEVERITY_STYLE = {
  danger: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: AlertTriangle, iconColor: "text-red-500", rank: 0 },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: AlertCircle, iconColor: "text-amber-500", rank: 1 },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Info, iconColor: "text-blue-500", rank: 2 },
};

// สีสำหรับ Donut Chart — โทนเดียวกับระบบ (orange เป็นสีหลัก) พร้อมคู่สี light สำหรับทำ gradient/ความลึก
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

function SectionCard({ title, icon: Icon, action, children, className = "" }) {
  return (
    <div className={`${T.card} ${T.cardPad} flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${T.title} flex items-center gap-2`}>
          {Icon && <Icon className="h-4 w-4 text-orange-500" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

// ─── KPICard v2 — Executive style: ตัวเลขหลักใหญ่ + context สั้น ๆ แทน icon กล่องใหญ่ ───
function KPICard({ label, value, trend, trendUp, sub, icon: Icon, accent = "text-orange-500" }) {
  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${accent}`} />}
      </div>
      <p className="text-[26px] leading-tight font-black text-slate-900 mt-2 tracking-tight">{value}</p>
      {trend && (
        <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
          {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trend}
        </p>
      )}
      {sub && !trend && <p className="text-xs font-medium text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
}

function EmptyMini({ text, hint }) {
  return (
    <div className="text-center py-8">
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

/* ─── Action Center — กะทัดรัด: Summary + แสดงเฉพาะรายการสำคัญสุด 3–4 รายการ ───────── */
function ActionCenter({ items, loading, error, onRetry, readIds, onMarkRead, onNavigate }) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ra = SEVERITY_STYLE[a.severity]?.rank ?? 3;
      const rb = SEVERITY_STYLE[b.severity]?.rank ?? 3;
      return ra - rb;
    });
  }, [items]);
  const visible = sorted.slice(0, 4);

  if (loading) return <SkeletonGrid count={3} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  if (items.length === 0) {
    return (
      <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-sm px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">ไม่มีรายการที่ต้องจัดการตอนนี้</p>
          <p className="text-xs text-emerald-600 mt-0.5">ทุกอย่างเรียบร้อยดี</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-bold text-slate-700">
            ต้องจัดการ <span className="text-orange-600">{items.length}</span> รายการ
          </h2>
        </div>
        {items.length > visible.length && (
          <span className="text-[11px] text-slate-400">แสดง {visible.length} รายการสำคัญสุด</span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {visible.map((item) => {
          const s = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.info;
          const Icon = s.icon;
          const isUnread = !readIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => { onMarkRead(item.id); onNavigate(item.link); }}
              className={`text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${s.bg} ${s.border} hover:shadow-sm ${T.transition} relative`}
            >
              {isUnread && <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />}
              <Icon className={`h-4 w-4 shrink-0 ${s.iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold ${s.text} truncate`}>{item.title}</p>
                <p className="text-[11px] text-slate-500 truncate">{item.message}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Course Status Donut (3D-style) — ตรงกลางแสดงยอดรวม, segment ที่มากสุดเน้นเล็กน้อย ─────
   ข้อมูล: สัดส่วนคอร์สตามสถานะ (courses.byStatus) — ตอบคำถาม
   "ตอนนี้คอร์สทั้งหมดแบ่งเป็นสถานะอะไรบ้าง" ซึ่งเป็นข้อมูลที่เจ้าของสถาบันต้องการเห็นภาพรวมมากที่สุด
─────────────────────────────────────────────────────────────────────── */
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

  const topValue = chartData[0]?.value ?? 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative w-48 h-48 shrink-0 mx-auto md:mx-0">
        {/* วงเงาด้านหลัง จำลองความหนาของจาน (depth disc) */}
        <div className="absolute inset-3 rounded-full bg-slate-300/40 blur-md translate-y-2" />
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
              innerRadius={46}
              outerRadius={80}
              paddingAngle={3}
              cornerRadius={4}
              stroke="#ffffff"
              strokeWidth={2}
              style={{ filter: "drop-shadow(0 8px 8px rgba(15,23,42,0.28))" }}
              isAnimationActive={false}
            >
              {chartData.map((d, i) => (
                // segment ที่มีสัดส่วนมากที่สุด "ยื่น" ออกมาเล็กน้อยด้วย padAngle/รัศมีที่มากกว่านิดหน่อย
                <Cell key={i} fill={`url(#courseGrad-${i})`} style={d.value === topValue ? { filter: "drop-shadow(0 10px 10px rgba(15,23,42,0.32))" } : undefined} />
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

      <div className="flex-1 w-full space-y-2.5">
        {chartData.map((d, i) => (
          <div key={i} className={`flex items-center justify-between text-sm ${d.value === topValue ? "font-semibold" : ""}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color.base }} />
              <span className="text-slate-600 truncate">{d.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-slate-800">{d.value}</span>
              <span className="text-[11px] text-slate-400 w-9 text-right">
                {total ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "[]");
    } catch { return []; }
  });

  const getAdminAuthConfig = () => {
    const token = localStorage.getItem("student_token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/summary`, getAdminAuthConfig());
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        <SkeletonGrid count={3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
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
  // เก็บไว้เผื่อนำ Section "ประชาสัมพันธ์" และ "ผู้ดูแลระบบ" กลับมาใช้:
  // const announcements = data?.announcements || {};
  // const adminMgmt = data?.adminManagement || {};

  const revenueUp = (kpi.revenueGrowthPct ?? 0) >= 0;
  const profitUp = (kpi.monthlyProfit ?? 0) >= 0;

  // เตรียมข้อมูลกราฟการเงินให้เหลือแค่ "รายรับ vs รายจ่าย" (2 เส้นพอ) และเช็คว่ามีข้อมูลจริงหรือไม่
  const financeTrend = finance.trend || [];
  const hasRealFinanceData = financeTrend.some((d) => Number(d.revenue) > 0 || Number(d.expense) > 0);

  return (
    <div className="space-y-6 mt-[90px]">
      {/* ── Header ─────────────────────────────────────────────── */}
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
        {/* ★ เอาปุ่ม Refresh ออกจาก UI ตามที่ร้องขอ — คง logic ไว้ใช้ภายหลังได้ (fetchData(true) ยังทำงานปกติ)
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 ${T.transition}`}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
        */}
      </div>

      {/* ── Action Center (กะทัดรัด) ─────────────────────────────── */}
      <ActionCenter
        items={actionItems}
        loading={false}
        error={null}
        onRetry={() => fetchData()}
        readIds={readIds}
        onMarkRead={markRead}
        onNavigate={goTo}
      />

      {/* ── KPI หลัก — Executive style: เลขใหญ่ + context สั้น ───────── */}
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

      {/* ── แนวโน้มการเงิน (รายรับ vs รายจ่าย) + สัดส่วนคอร์สตามสถานะ (3D Donut) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="รายรับ vs รายจ่าย (6 เดือนล่าสุด)" icon={Wallet}
          action={
            <button onClick={() => navigate("/admin/finance")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
              ดูรายละเอียด <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          {hasRealFinanceData ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={financeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" name="รายรับ" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expense" name="รายจ่าย" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyMini
              text="ยังไม่มีข้อมูลทางการเงินเพียงพอสำหรับแสดงแนวโน้ม"
              hint="เริ่มมีรายการเมื่อมีการบันทึกรายรับหรือรายจ่าย"
            />
          )}
        </SectionCard>

        <SectionCard title="สัดส่วนคอร์สตามสถานะ" icon={PieChartIcon}
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

        {/* Resource Summary — นิยามชัดเจน: "อุปกรณ์ทั้งหมด" คือผลรวมของ พร้อมใช้/ใกล้หมด/หมดสต๊อก */}
        <SectionCard title="คลังอุปกรณ์" icon={Boxes}
          action={<button onClick={() => navigate("/admin/common-facilities")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">อุปกรณ์ทั้งหมด</span>
            <span className="text-lg font-bold text-slate-800">{facilities.total ?? 0}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl border bg-emerald-50 border-emerald-100">
              <span className="text-xs font-medium text-emerald-700">พร้อมใช้งาน</span>
              <span className="text-sm font-bold text-emerald-700">{facilities.ready ?? 0}</span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${facilities.lowStock > 0 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
              <span className={`text-xs font-medium ${facilities.lowStock > 0 ? "text-amber-700" : "text-slate-500"}`}>ใกล้หมด</span>
              <span className={`text-sm font-bold ${facilities.lowStock > 0 ? "text-amber-700" : "text-slate-400"}`}>{facilities.lowStock ?? 0}</span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${facilities.outOfStock > 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
              <span className={`text-xs font-medium ${facilities.outOfStock > 0 ? "text-red-600" : "text-slate-500"}`}>หมดสต๊อก</span>
              <span className={`text-sm font-bold ${facilities.outOfStock > 0 ? "text-red-600" : "text-slate-400"}`}>{facilities.outOfStock ?? 0}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ★ เอา Section "ประชาสัมพันธ์" และ "ผู้ดูแลระบบ" ออกจาก UI ตามที่ร้องขอ
          คง JSX เดิมไว้ทั้งหมดเพื่อนำกลับมาใช้ภายหลังได้ทันที
          (ต้องดึง const announcements / const adminMgmt กลับมา และ import Megaphone, Shield ก่อนใช้งาน)

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="ประชาสัมพันธ์" icon={Megaphone} className="lg:col-span-2"
          action={<button onClick={() => navigate("/admin/announcements")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด ({announcements.total ?? 0}) <ChevronRight className="h-3 w-3" /></button>}
        >
          {announcements.recent && announcements.recent.length > 0 ? (
            <div className="space-y-2">
              {announcements.recent.map((n) => (
                <div key={n.NewsId} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 shrink-0">{n.Category}</span>
                  <span className="text-xs text-slate-700 truncate flex-1">{n.Title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(n.Created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMini text="ยังไม่มีข่าวประชาสัมพันธ์" />
          )}
        </SectionCard>

        <SectionCard title="ผู้ดูแลระบบ" icon={Shield}
          action={<button onClick={() => navigate("/admin/management")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">จัดการ <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl px-2 py-2.5 border border-slate-100 text-center">
              <p className="text-[10px] text-slate-500">ทั้งหมด</p>
              <p className="text-base font-bold text-slate-800">{adminMgmt.total ?? 0}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-2 py-2.5 border border-emerald-100 text-center">
              <p className="text-[10px] text-emerald-600">ใช้งานอยู่</p>
              <p className="text-base font-bold text-emerald-700">{adminMgmt.active ?? 0}</p>
            </div>
            <div className="bg-slate-100 rounded-xl px-2 py-2.5 border border-slate-200 text-center">
              <p className="text-[10px] text-slate-500">ปิดใช้งาน</p>
              <p className="text-base font-bold text-slate-600">{adminMgmt.inactive ?? 0}</p>
            </div>
          </div>
        </SectionCard>
      </div>
      */}
    </div>
  );
}