import { API_URL } from "../config";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  RefreshCw, AlertCircle, AlertTriangle, Info, ChevronRight,
  BookOpen, Users, GraduationCap, Wallet, TrendingUp, TrendingDown,
  Calendar, DoorOpen, Boxes, Megaphone, Shield, Clock, CheckCircle,
  UserCheck, Award, Bell, Sparkles,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const API_BASE = `${API_URL}/api/admin/dashboard`;
const READ_STORAGE_KEY = "admin_dashboard_read_alerts";

/* ─── Design tokens (ยืมมาจาก AdminFinance.jsx เพื่อให้ระบบดูเป็นชุดเดียวกัน) ─── */
const T = {
  card: "bg-white rounded-2xl border border-slate-200 shadow-sm",
  cardPad: "p-5",
  transition: "transition duration-200 ease-out",
  title: "text-base font-bold text-slate-900",
  subtitle: "text-sm text-slate-500",
  label: "text-xs font-medium text-slate-500",
  value: "text-2xl font-bold text-slate-900 tracking-tight",
  caption: "text-[11px] text-slate-400",
};

const SEVERITY_STYLE = {
  danger: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: AlertTriangle, iconColor: "text-red-500" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: AlertCircle, iconColor: "text-amber-500" },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Info, iconColor: "text-blue-500" },
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
        <RefreshCw className="h-3.5 w-3.5" /> ลองใหม่
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

function KPICard({ label, value, sub, icon: Icon, tone = "neutral" }) {
  const toneText = {
    neutral: "text-slate-400", green: "text-green-600", red: "text-red-600",
    blue: "text-blue-600", orange: "text-orange-500",
  }[tone];
  return (
    <div className={`${T.card} p-4 h-full flex flex-col justify-between hover:shadow-md ${T.transition}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={T.label}>{label}</p>
        {Icon && <Icon className={`h-4 w-4 shrink-0 ${toneText}`} />}
      </div>
      <p className={T.value}>{value}</p>
      {sub && <p className={`${T.caption} mt-1 truncate`}>{sub}</p>}
    </div>
  );
}

function EmptyMini({ text }) {
  return <p className="text-xs text-slate-400 text-center py-6">{text}</p>;
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

/* ─── Action Center ────────────────────────────────────────────────────── */
function ActionCenter({ items, loading, error, onRetry, readIds, onMarkRead, onNavigate }) {
  if (loading) return <SkeletonGrid count={3} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  const unread = items.filter((i) => !readIds.includes(i.id));

  if (items.length === 0) {
    return (
      <div className={`${T.card} ${T.cardPad} flex items-center gap-3 bg-emerald-50/60 border-emerald-200`}>
        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">ไม่มีรายการที่ต้องจัดการตอนนี้</p>
          <p className="text-xs text-emerald-600 mt-0.5">ทุกอย่างเรียบร้อยดี</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((item) => {
        const s = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.info;
        const Icon = s.icon;
        const isUnread = !readIds.includes(item.id);
        return (
          <button
            key={item.id}
            onClick={() => { onMarkRead(item.id); onNavigate(item.link); }}
            className={`text-left flex items-start gap-3 p-4 rounded-2xl border ${s.bg} ${s.border} hover:shadow-md ${T.transition} relative`}
          >
            {isUnread && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-red-500" />}
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${s.iconColor}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${s.text}`}>{item.title}</p>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{item.message}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
          </button>
        );
      })}
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

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/summary`);
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
        <SkeletonGrid count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72" />
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
  const announcements = data?.announcements || {};
  const adminMgmt = data?.adminManagement || {};

  const statusLabelOf = (list, id) => list.find((r) => r.Status_Course_Id === id || r.Status_Room_Id === id);

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
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 ${T.transition}`}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
      </div>

      {/* ── Action Center ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">สิ่งที่ต้องจัดการ</h2>
        </div>
        <ActionCenter
          items={actionItems}
          loading={false}
          error={null}
          onRetry={() => fetchData()}
          readIds={readIds}
          onMarkRead={markRead}
          onNavigate={goTo}
        />
      </div>

      {/* ── KPI หลัก ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          label="รายรับเดือนนี้"
          value={formatMoney(kpi.monthlyRevenue)}
          sub={`${kpi.revenueGrowthPct >= 0 ? "+" : ""}${kpi.revenueGrowthPct ?? 0}% จากเดือนก่อน`}
          icon={kpi.revenueGrowthPct >= 0 ? TrendingUp : TrendingDown}
          tone={kpi.revenueGrowthPct >= 0 ? "green" : "red"}
        />
        <KPICard
          label="กำไรสุทธิเดือนนี้"
          value={formatMoney(kpi.monthlyProfit)}
          sub={kpi.profitMargin !== null ? `Margin ${kpi.profitMargin}%` : "ยังไม่มีข้อมูล"}
          icon={Wallet}
          tone={kpi.monthlyProfit >= 0 ? "green" : "red"}
        />
        <KPICard
          label="ยอดค้างชำระ"
          value={formatMoney(kpi.outstandingAmount)}
          sub={`${kpi.outstandingCount ?? 0} รายการ`}
          icon={Clock}
          tone={kpi.outstandingCount > 0 ? "orange" : "neutral"}
        />
        <KPICard
          label="คอร์สทั้งหมด"
          value={kpi.totalCourses ?? 0}
          sub={`กำลังสอน ${kpi.activeCourses ?? 0} · เปิดรับสมัคร ${kpi.openCourses ?? 0}`}
          icon={BookOpen}
          tone="orange"
        />
        <KPICard
          label="นักเรียนทั้งหมด"
          value={kpi.totalStudents ?? 0}
          sub={`ลงทะเบียนแล้ว ${kpi.enrolledStudents ?? 0} คน`}
          icon={GraduationCap}
          tone="blue"
        />
        <KPICard
          label="ติวเตอร์ทั้งหมด"
          value={kpi.totalTutors ?? 0}
          sub={`กำลังสอน ${kpi.activeTutors ?? 0} คน`}
          icon={UserCheck}
          tone="blue"
        />
      </div>

      {/* ── การเงิน (trend) ──────────────────────────────────────── */}
      <SectionCard title="แนวโน้มการเงิน (6 เดือนล่าสุด)" icon={Wallet}
        action={
          <button onClick={() => navigate("/admin/finance")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
            ดูรายละเอียด <ChevronRight className="h-3 w-3" />
          </button>
        }
      >
        {finance.trend && finance.trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={finance.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="รายรับ" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" name="รายจ่าย" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="profit" name="กำไร" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyMini text="ยังไม่มีข้อมูลรายรับ-รายจ่ายในช่วงนี้" />
        )}
      </SectionCard>

      {/* ── คอร์ส / นักเรียน / ติวเตอร์ ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="ภาพรวมคอร์ส" icon={BookOpen}
          action={<button onClick={() => navigate("/admin/courses")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="grid grid-cols-2 gap-2 mb-3">
            {courses.byStatus?.map((s) => (
              <div key={s.Status_Course_Id} className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                <p className="text-[11px] text-slate-500">{s.Status_Course_Name}</p>
                <p className="text-lg font-bold text-slate-800">{s.cnt}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">คอร์สใกล้เต็ม</p>
          {courses.nearFull && courses.nearFull.length > 0 ? (
            <div className="space-y-1">
              {courses.nearFull.map((c) => (
                <div key={c.CourseID} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-700 truncate flex-1">{c.CourseName}</span>
                  <span className="font-bold text-orange-600 shrink-0 ml-2">{c.EnrolledCount}/{c.MaxStudents}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMini text="ยังไม่มีคอร์สที่ใกล้เต็ม" />
          )}
        </SectionCard>

        <SectionCard title="ภาพรวมนักเรียน" icon={GraduationCap}
          action={<button onClick={() => navigate("/admin/students")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-slate-50 rounded-xl px-2.5 py-2 border border-slate-100 text-center">
              <p className="text-[10px] text-slate-500">ทั้งหมด</p>
              <p className="text-base font-bold text-slate-800">{students.total ?? 0}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-2.5 py-2 border border-emerald-100 text-center">
              <p className="text-[10px] text-emerald-600">ลงทะเบียน</p>
              <p className="text-base font-bold text-emerald-700">{students.enrolled ?? 0}</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-2.5 py-2 border border-amber-100 text-center">
              <p className="text-[10px] text-amber-600">เข้าเรียนเฉลี่ย</p>
              <p className="text-base font-bold text-amber-700">{students.avgAttendanceRate !== null ? `${students.avgAttendanceRate}%` : "—"}</p>
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">ควรติดตาม (เข้าเรียนต่ำ)</p>
          {students.needsAttention && students.needsAttention.length > 0 ? (
            <div>
              {students.needsAttention.map((s) => (
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
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-slate-50 rounded-xl px-2.5 py-2 border border-slate-100 text-center">
              <p className="text-[10px] text-slate-500">ทั้งหมด</p>
              <p className="text-base font-bold text-slate-800">{tutors.total ?? 0}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-2.5 py-2 border border-emerald-100 text-center">
              <p className="text-[10px] text-emerald-600">กำลังสอน</p>
              <p className="text-base font-bold text-emerald-700">{tutors.active ?? 0}</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-2.5 py-2 border border-amber-100 text-center">
              <p className="text-[10px] text-amber-600">เช็กอินเฉลี่ย</p>
              <p className="text-base font-bold text-amber-700">{tutors.avgCheckinRate !== null ? `${tutors.avgCheckinRate}%` : "—"}</p>
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">ควรติดตาม (เช็กอินต่ำ)</p>
          {tutors.needsAttention && tutors.needsAttention.length > 0 ? (
            <div>
              {tutors.needsAttention.map((t) => (
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

      {/* ── ตารางเรียนวันนี้ / ห้องเรียน / คลังอุปกรณ์ ─────────────── */}
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

        <SectionCard title="คลังอุปกรณ์" icon={Boxes}
          action={<button onClick={() => navigate("/admin/common-facilities")} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="h-3 w-3" /></button>}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 text-center">
              <p className="text-[10px] text-slate-500">ทั้งหมด</p>
              <p className="text-base font-bold text-slate-800">{facilities.total ?? 0}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-3 py-2.5 border border-emerald-100 text-center">
              <p className="text-[10px] text-emerald-600">พร้อมใช้งาน</p>
              <p className="text-base font-bold text-emerald-700">{facilities.ready ?? 0}</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100 text-center">
              <p className="text-[10px] text-amber-600">ใกล้หมด</p>
              <p className="text-base font-bold text-amber-700">{facilities.lowStock ?? 0}</p>
            </div>
            <div className="bg-red-50 rounded-xl px-3 py-2.5 border border-red-100 text-center">
              <p className="text-[10px] text-red-500">หมดสต๊อก</p>
              <p className="text-base font-bold text-red-600">{facilities.outOfStock ?? 0}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── ประชาสัมพันธ์ / ผู้ดูแลระบบ ───────────────────────────── */}
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
    </div>
  );
}