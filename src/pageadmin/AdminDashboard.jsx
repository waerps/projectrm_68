import { API_URL } from "../config";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertCircle, Info, ChevronRight,
  BookOpen, GraduationCap, Wallet, Clock,
  Calendar, DoorOpen, Boxes, CheckCircle, AlertTriangle,
  UserCheck, Bell, Sparkles, PieChart as PieChartIcon, Users,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";

const API_BASE = `${API_URL}/api/admin/dashboard`;

/* ─── Design tokens (อิงจาก AdminStudent.jsx / AdminTutors.jsx เพื่อให้เป็นระบบเดียวกัน) ─── */
const T = {
  card: "bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition",
  cardPad: "p-5",
  transition: "transition duration-200 ease-out",
  title: "text-base font-bold text-slate-900",
  subtitle: "text-sm text-slate-500",
  chartCardH: "h-[480px]", // ความสูงคงที่ร่วมกันของการ์ดกราฟทั้งคู่ในแถวกลาง
};

// สีสำหรับ Donut Chart — โทนเดียวกับระบบ (orange เป็นสีหลัก) พร้อมคู่สี light สำหรับ gradient
const PIE_COLORS = [
  { base: "#f97316", light: "#fdba74" }, // orange (ธีมหลัก)
  { base: "#10b981", light: "#6ee7b7" }, // emerald
  { base: "#3b82f6", light: "#93c5fd" }, // blue
  { base: "#f59e0b", light: "#fcd34d" }, // amber
  { base: "#94a3b8", light: "#cbd5e1" }, // slate
  { base: "#a855f7", light: "#d8b4fe" }, // purple (สำรอง)
];

// ★ ไอคอนของแต่ละหมวดใน "สิ่งที่ต้องจัดการ" — ให้สื่อความหมายตรงเนื้อหามากกว่าใช้ severity สีแดง/เหลืองแบบแจ้งเตือน
// (เพราะหน้านี้คือ "summary" ไม่ใช่หน้าแจ้งเตือน ซึ่งมีแยกอยู่แล้วที่อื่น)
const ACTION_ICONS = {
  "tutor-applications": UserCheck,
  "pending-payments": Wallet,
  "missed-checkins": Clock,
  "stock-issues": Boxes,
  "rooms-maintenance": DoorOpen,
  "missing-price": AlertCircle,
  "students-attention": AlertTriangle,   // ★ เพิ่ม
  "tutors-attention": UserCheck,          // ★ เพิ่ม
};

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
    <div className={`${T.card} ${T.cardPad} flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
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

/* ─── ★ ใหม่: StatCard — การ์ดสรุป 3 อันบนสุด สไตล์เดียวกับหน้านักเรียน
   (ไอคอนสี่เหลี่ยมสีทึบ + label/value ข้าง ๆ) แทน KPICard การเงินเดิม
   ข้อมูลที่เลือกมาแสดงตั้งใจให้ "ไม่ซ้ำ" กับหน้าการเงิน (ซึ่งมีรายรับ/กำไร/ยอดค้างอยู่แล้ว) ─── */
function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition h-full">
      <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── ★ ใหม่: MetricBox / StatusRow — ใช้ร่วมกันทั้ง 3 การ์ดล่างสุด
   (ตารางเรียนวันนี้ / ห้องเรียน / คลังอุปกรณ์) เพื่อให้ "โชว์ข้อมูลแบบเดียวกัน"
   ด้วยหน้าตาเดียวกันทุกจุด ───────────────────────────────────────────── */
function MetricBox({ label, value, tone = "slate" }) {
  const toneCls = {
    slate: "bg-slate-50 border-slate-100 text-slate-800",
    red: "bg-red-50 border-red-100 text-red-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  }[tone];
  return (
    <div className={`rounded-xl px-3 py-2 border flex-1 text-center ${toneCls}`}>
      <p className="text-[10px] opacity-70">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-1 py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-700">{value}</span>
    </div>
  );
}

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
      message: `ใกล้หมด ${lowCount} รายการ · หมดสต๊อก ${outCount} รายการ`,
      count: lowCount + outCount,
      link: "/admin/common-facilities",
    });
  }
  return [...chips, ...extra]; // ★ เพิ่ม
}

function ActionSummaryStrip({ items, extraItems = [], onNavigate }) {
  const chips = useMemo(() => buildActionChips(items, extraItems), [items, extraItems]);

  if (chips.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-2.5">
        <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
        <p className="text-xs font-semibold text-slate-500">ไม่มีรายการที่ต้องจัดการตอนนี้ — ทุกอย่างเรียบร้อยดี</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0 pr-2.5 border-r border-slate-100 whitespace-nowrap">
          <Bell className="h-3.5 w-3.5 text-orange-500" /> ต้องจัดการ {chips.length} รายการ
        </span>
        {chips.map((item) => {
          const Icon = ACTION_ICONS[item.id] || Info;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.link)}
              title={item.message}
              className={`flex items-center justify-between gap-2 pl-2.5 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-300 hover:bg-orange-50 ${T.transition} flex-1 min-w-[180px] whitespace-nowrap`}
            >
              <Icon className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-700">{item.title}</span>
              <span className="text-[11px] font-bold text-orange-700 bg-orange-100 rounded-full px-1.5 py-0.5 shrink-0">
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
      <div className="flex flex-col items-center gap-6 h-full justify-center">
          <div className="relative w-64 h-64 shrink-0">
              {/* วงเงาด้านหลัง จำลองความหนาของจาน (depth disc) */}
              <div className="absolute inset-4 rounded-full bg-slate-300/40 blur-md translate-y-2" />
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
                          innerRadius={62}
                          outerRadius={108}
                          paddingAngle={3}
                          cornerRadius={4}
                          stroke="#ffffff"
                          strokeWidth={2}
                          style={{ filter: "drop-shadow(0 8px 8px rgba(15,23,42,0.28))" }}
                          isAnimationActive={false}
                      >
                          {chartData.map((d, i) => (
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
                  <p className="text-3xl font-black text-slate-900">{total}</p>
                  <p className="text-xs text-slate-400">คอร์สทั้งหมด</p>
              </div>
          </div>

          <div className="w-full max-w-sm space-y-1">
              {chartData.map((d, i) => (
                  <div key={i} className={`flex items-center justify-between text-sm py-1 px-1 rounded-lg ${d.value === topValue ? "font-semibold bg-slate-50" : ""}`}>
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

  const goTo = (path) => { if (path) navigate(path); };

  if (loading) {
    return (
      <div className="space-y-6 mt-[90px]">
        <Skeleton className="h-14 w-full" />
        <SkeletonGrid count={3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[420px]" />
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

  const financeTrend = finance.trend || [];
  const hasRealFinanceData = financeTrend.some((d) => Number(d.revenue) > 0 || Number(d.expense) > 0);

  // ★ อุปกรณ์ทั้งหมด = พร้อมใช้ + ใกล้หมด + หมดสต๊อก เสมอ (เซฟตี้เน็ตฝั่ง frontend
  // คู่กับการแก้ query ฝั่ง backend ให้ 3 หมวดแยกจากกันแบบ mutually-exclusive)
  const facilitiesReady = Number(facilities.ready ?? 0);
  const facilitiesLow = Number(facilities.lowStock ?? 0);
  const facilitiesOut = Number(facilities.outOfStock ?? 0);
  const facilitiesTotal = Math.max(Number(facilities.total ?? 0), facilitiesReady + facilitiesLow + facilitiesOut);

  const roomMaintenance = (rooms.byStatus || []).find((s) => s.Status_Room_Id === 2);
  const localExtraChips = [
    scheduleToday.missed > 0 && {
      id: "missed-checkins",
      title: "คาบวันนี้ยังไม่เช็กอิน",
      message: `${scheduleToday.missed} คาบยังไม่เช็กอิน`,
      count: scheduleToday.missed,
      link: "/admin/schedule",
    },
    students.needsAttention?.length > 0 && {
      id: "students-attention",
      title: "นักเรียนเข้าเรียนต่ำ",
      message: "เข้าเรียนต่ำกว่า 50% เดือนนี้",
      count: students.needsAttention.length,
      link: "/admin/students",
    },
    tutors.needsAttention?.length > 0 && {
      id: "tutors-attention",
      title: "ติวเตอร์เช็กอินต่ำ",
      message: "เช็กอินต่ำกว่า 50% เดือนนี้",
      count: tutors.needsAttention.length,
      link: "/admin/tutors",
    },
    roomMaintenance?.cnt > 0 && {
      id: "rooms-maintenance",
      title: "ห้องปิดปรับปรุง",
      message: `${roomMaintenance.cnt} ห้องปิดปรับปรุง`,
      count: roomMaintenance.cnt,
      link: "/admin/rooms",
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6 mt-[90px]">
      {/* ── Header ─────────────────────────────────────────────── */}
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

      {/* ── สิ่งที่ต้องจัดการ — แถวเดียว เลื่อนแนวนอนได้ ไม่กินพื้นที่ ─────── */}
      <ActionSummaryStrip items={actionItems} extraItems={localExtraChips} onNavigate={goTo} />

      {/* ── การ์ดสรุป 3 อัน — ★ เปลี่ยนเป็นข้อมูลที่ไม่ซ้ำกับหน้าการเงิน
          (หน้าการเงินมีรายรับ/กำไร/ยอดค้างอยู่แล้ว) ใช้ดีไซน์ไอคอนสี่เหลี่ยมทึบ
          แบบเดียวกับการ์ดสรุปในหน้านักเรียน (AdminStudent.jsx) ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="คอร์สที่เปิดสอนอยู่"
          value={kpi.activeCourses ?? 0}
          sub={`ทั้งหมด ${kpi.totalCourses ?? 0} คอร์ส`}
          icon={BookOpen}
          color="bg-blue-500"
        />
        <StatCard
          label="นักเรียนทั้งหมด"
          value={kpi.totalStudents ?? 0}
          sub={`ลงทะเบียนแล้ว ${kpi.enrolledStudents ?? 0} คน`}
          icon={GraduationCap}
          color="bg-orange-600"
        />
        <StatCard
          label="ติวเตอร์ทั้งหมด"
          value={kpi.totalTutors ?? 0}
          sub={`กำลังสอน ${kpi.activeTutors ?? 0} คน`}
          icon={Users}
          color="bg-emerald-500"
        />
        <StatCard
          label="รายรับเดือนนี้"
          value={formatMoney(kpi.monthlyRevenue)}
          sub={
            kpi.revenueGrowthPct !== undefined
              ? `${kpi.revenueGrowthPct >= 0 ? "+" : ""}${kpi.revenueGrowthPct}% จากเดือนก่อน`
              : undefined
          }
          icon={Wallet}
          color="bg-amber-500"
        />
      </div>

      {/* ── สัดส่วนคอร์สตามสถานะ (ซ้าย) + แนวโน้มการเงิน (ขวา) ───────────
          ★ สลับตำแหน่งกับเดิม: Donut ต้นฉบับย้ายมาซ้าย, กราฟรายรับ-รายจ่ายไปขวา ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <ResponsiveContainer width="100%" height="100%">
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
                  sub={`${s.PerformanceScore} คะแนน`}
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

      {/* ── ตารางเรียนวันนี้ / ห้องเรียน / คลังอุปกรณ์ ───────────────────
          ★ ปรับให้ทั้ง 3 การ์ดใช้หน้าตาเดียวกัน: MetricBox กล่องสรุปด้านบน
          ตามด้วย StatusRow แถวสถานะ/breakdown ด้านล่าง เหมือนกันทุกใบ ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="ตารางเรียนวันนี้" icon={Calendar}
          action={<button onClick={() => navigate("/admin/schedule")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูตารางเต็ม <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="flex items-center gap-3 mb-3">
            <MetricBox label="คาบวันนี้" value={scheduleToday.total ?? 0} tone="slate" />
            <MetricBox label="ยังไม่เช็กอิน" value={scheduleToday.missed ?? 0} tone={scheduleToday.missed > 0 ? "red" : "emerald"} />
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
          <div className="flex items-center gap-3 mb-3">
            <MetricBox label="ห้องทั้งหมด" value={rooms.total ?? 0} tone="slate" />
          </div>
          <div className="space-y-1.5">
            {rooms.byStatus?.map((s) => (
              <StatusRow key={s.Status_Room_Id} label={s.Status_Room_Name} value={s.cnt} />
            ))}
          </div>
        </SectionCard>

        {/* คลังอุปกรณ์ — "อุปกรณ์ทั้งหมด" = พร้อมใช้ + ใกล้หมด + หมดสต๊อก เสมอ */}
        <SectionCard title="คลังอุปกรณ์" icon={Boxes}
          action={<button onClick={() => navigate("/admin/common-facilities")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="flex items-center gap-3 mb-3">
            <MetricBox label="อุปกรณ์ทั้งหมด" value={facilitiesTotal} tone="slate" />
          </div>
          <div className="space-y-1.5">
            <StatusRow label="พร้อมใช้งาน" value={facilitiesReady} />
            <StatusRow label="ใกล้หมด" value={facilitiesLow} />
            <StatusRow label="หมดสต๊อก" value={facilitiesOut} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}