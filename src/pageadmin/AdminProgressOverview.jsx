import { API_URL } from "../config";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PROGRESS_ORIGINS } from "./progressOrigins";
import axios from "axios";
import {
  TrendingUp, BookOpen, Search, Loader2, ChevronLeft, ChevronRight,
  BarChart2, GraduationCap, Calendar, Users,
} from "lucide-react";
import UIPagination from "../components/ui/Pagination";
import { PAGE_SUBTITLE } from "../components/ui/tokens";
import Breadcrumb from "../components/ui/Breadcrumb";
import PageHeader from "../components/ui/PageHeader";
import { STAT_LABEL, STAT_VALUE, STAT_UNIT } from "../components/ui/tokens";
import { BarChart3 as LuBarChart3 } from "lucide-react";
import Spinner from "../components/ui/Spinner";

// ─── ภาพรวมพัฒนาการ (ฝั่งแอดมิน) ─────────────────────────────────────────────
// หนึ่งแถว = คอร์ส 1 × วิชา 1 × ติวเตอร์ 1 ซึ่งตรงกับหน่วยที่ระบบใช้จริง
// เพราะแถวข้อสอบ (exam) ถูกสร้างแยกตามติวเตอร์เจ้าของ
//
// หน้านี้อ่านอย่างเดียว ไม่มีปุ่มแก้ไขอะไรทั้งสิ้น และไม่เปิดเนื้อหาข้อสอบ
// (โจทย์/ตัวเลือก/เฉลย) ให้แอดมินเห็น เพราะคลังข้อสอบเป็นของติวเตอร์แต่ละคน
// แอดมินเห็นได้แค่ผลลัพธ์: ใครสอบแล้วกี่คน คะแนนเฉลี่ยเท่าไร พัฒนาการขึ้นไหม
//
// ตัวเลข "พัฒนาการ" มาจาก computeGrowth ของ backend (สูตร Normalized Gain
// ตัวเดียวกับหน้าจัดการนักเรียน) ไม่ได้คำนวณซ้ำในหน้านี้
//
// UI ยึดตาม AdminTutors / AdminStudents: slate + ส้ม, การ์ดสถิติไอคอนทึบ,
// แถบค้นหาการ์ดขาว, ตาราง และ pagination ชุดเดียวกัน
const ITEMS_PER_PAGE = 12;

const API_BASE = `${API_URL}/api/admin/progress`;

// key เดียวกับที่หน้าแอดมินอื่นใช้ (AdminDashboard / AdminTutors / AdminIncidents)
const getAdminAuthConfig = () => {
  const token = localStorage.getItem("student_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

// ─── การ์ดเอียงตามเมาส์ + แสงเรือง (ชุดเดียวกับ Dashboard/การเงิน) ─────────────
const tiltMove = (e) => {
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  el.style.setProperty("--gx", `${px * 100}%`);
  el.style.setProperty("--gy", `${py * 100}%`);
  el.style.transform = `perspective(700px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-2px)`;
};
const tiltLeave = (e) => { e.currentTarget.style.transform = ""; };

// ─── ตัวเลขวิ่งขึ้นแบบ ease-out ใช้กับการ์ดสถิติด้านบน ──────────────────────────
function useCountUp(target, active = true, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || typeof target !== "number") { setValue(typeof target === "number" ? target : 0); return; }
    let raf;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
    const step = (now) => {
      const p = ease((now - start) / duration);
      // จบที่ค่าจริงเสมอ (รองรับทศนิยม เช่น 72.5%)
      setValue(p < 1 ? Math.round(target * p) : target);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, active]);
  return value;
}

// ─── การ์ดสถิติ: เอียงตามเมาส์ + แสงเรือง + ไอคอนลายน้ำ + ตัวเลขวิ่งขึ้น ─────────
// card.value = ตัวเลข (หรือ null = ยังไม่มีข้อมูล) · card.unit = หน่วยตัวเล็กต่อท้ายตัวเลข
function StatTile({ card, ready }) {
  const Icon = card.icon;
  const hasValue = typeof card.value === "number" && !Number.isNaN(card.value);
  const shown = useCountUp(hasValue ? card.value : 0, ready && hasValue);
  return (
    <div
      onMouseMove={tiltMove}
      onMouseLeave={tiltLeave}
      className="sa-tilt relative overflow-hidden flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-200 transition"
    >
      <span className="sa-glow" />
      <Icon className="absolute -right-3 -top-3 h-14 w-14 text-slate-50 pointer-events-none" />
      <div className={`relative h-10 w-10 rounded-xl ${card.color} flex items-center justify-center shrink-0 shadow-sm`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="relative min-w-0">
        <p className={STAT_LABEL}>{card.label}</p>
        {card.note && <p className="text-[10px] text-slate-500">{card.note}</p>}
        <p className={`${STAT_VALUE} break-words`}>
          {hasValue ? shown.toLocaleString() : "—"}
          {hasValue && card.unit && <span className={STAT_UNIT}>{card.unit}</span>}
        </p>
      </div>
    </div>
  );
}

export default function AdminProgressOverview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // เปิดจากปุ่มในหน้าคอร์สหรือหน้าติวเตอร์ จะกรองมาให้เลยตั้งแต่เข้าหน้า
  const presetCourseId = searchParams.get("courseId");
  const presetSubjectId = searchParams.get("subjectId");
  const presetTutorId = searchParams.get("tutorId");
  // มาจากหน้าไหน ใช้พา breadcrumb กลับไปที่เดิม ไม่ใช่โยนกลับหน้าเดียวเสมอ
  const cameFrom = searchParams.get("from");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_BASE}/overview`, getAdminAuthConfig())
      .then((res) => {
        if (cancelled) return;
        setRows(Array.isArray(res.data?.rows) ? res.data.rows : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Fetch admin progress overview failed:", err);
        setError("โหลดข้อมูลภาพรวมพัฒนาการไม่สำเร็จ");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // แถวหลังกรองตามปุ่มที่กดเข้ามา (ยังไม่กรองคำค้น) — ใช้คิดการ์ดสรุปพัฒนาการด้านบน
  const presetRows = useMemo(() => {
    let list = rows;
    if (presetCourseId) list = list.filter((r) => String(r.courseId) === String(presetCourseId));
    if (presetSubjectId) list = list.filter((r) => String(r.subjectId) === String(presetSubjectId));
    if (presetTutorId) list = list.filter((r) => String(r.tutorId) === String(presetTutorId));
    return list;
  }, [rows, presetCourseId, presetSubjectId, presetTutorId]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return presetRows;
    return presetRows.filter(
      (r) =>
        r.courseName.toLowerCase().includes(kw) ||
        (r.subjectName || "").toLowerCase().includes(kw) ||
        (r.tutorName || "").toLowerCase().includes(kw)
    );
  }, [presetRows, search]);

  // สรุปพัฒนาการ — ใช้เฉพาะตัวเลขที่ /overview คืนมาแล้ว (pre/post avgPct, growth, improvement)
  // ไม่แสดงจำนวนคอร์ส/ติวเตอร์/นักเรียนรวม เพราะซ้ำกับหน้าจัดการคอร์ส/ติวเตอร์/นักเรียน
  const summary = useMemo(() => {
    const r1 = (v) => Math.round(v * 10) / 10;
    const mean = (arr) => (arr.length ? r1(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
    const comparableGroups = presetRows.filter((r) => r.pre?.avgPct != null && r.post?.avgPct != null).length;
    const avgPost = mean(presetRows.map((r) => r.post?.avgPct).filter((v) => v != null));
    const avgGrowth = mean(presetRows.map((r) => r.growth?.growth).filter((v) => v != null));
    const improved = presetRows.reduce((s, r) => s + (r.improvement?.improved || 0), 0);
    const comparableResults = presetRows.reduce((s, r) => s + (r.improvement?.comparable || 0), 0);
    const improvedPct = comparableResults ? r1((improved / comparableResults) * 100) : null;
    return { groups: presetRows.length, comparableGroups, avgPost, avgGrowth, improved, comparableResults, improvedPct };
  }, [presetRows]);

  // จัดกลุ่มเป็นการ์ดต่อคอร์ส (หนึ่งคอร์สอาจมีหลายวิชา และหลายติวเตอร์สอนวิชาเดียวกันได้)
  const courseCards = useMemo(() => {
    const byId = new Map();
    for (const r of filtered) {
      if (!byId.has(r.courseId)) {
        byId.set(r.courseId, {
          courseId: r.courseId,
          courseName: r.courseName,
          startDate: r.startDate,
          studentsEnrolled: r.studentsEnrolled,
          items: [],
        });
      }
      byId.get(r.courseId).items.push(r);
    }
    return [...byId.values()];
  }, [filtered]);

  const totalPages = Math.ceil(courseCards.length / ITEMS_PER_PAGE) || 1;
  const paginatedCourses = courseCards.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // เปิดหน้าวิเคราะห์ตัวเต็ม (ตัวเดียวกับที่ติวเตอร์เห็น) ส่ง tutorId ไปด้วยเสมอ
  // เพราะคอร์ส+วิชาเดียวกันแต่คนละติวเตอร์ = คนละชุดข้อสอบ คนละผลสอบ
  const openDetail = useCallback((row) => {
    const params = new URLSearchParams({
      courseId: String(row.courseId),
      subjectId: String(row.subjectId),
      tutorId: String(row.tutorId),
      courseName: row.courseName || "",
      subjectName: row.subjectName || "",
      tutorName: row.tutorName || "",
    });
    // ส่งต้นทางต่อไปด้วย breadcrumb หน้าถัดไปจะได้ลากกลับได้ถึงจุดเริ่ม
    if (cameFrom) params.set("from", cameFrom);
    navigate(`/admin/exam-analytics?${params.toString()}`);
  }, [navigate, cameFrom]);

  if (loading) return (
    <Spinner block label="กำลังโหลดภาพรวมพัฒนาการ..." />
  );

  // ป้ายบอกว่ากำลังกรองอะไรอยู่ เมื่อเข้ามาจากปุ่มในหน้าอื่น
  const presetLabel = filtered.length
    ? [
        presetCourseId && filtered[0].courseName,
        presetSubjectId && filtered[0].subjectName,
        presetTutorId && filtered[0].tutorName,
      ].filter(Boolean).join(" · ") || null
    : null;

  return (
    <div className="space-y-6 px-4 lg:px-0">
      <ProgressBreadcrumb cameFrom={cameFrom} />

      <PageHeader
        title="ภาพรวมพัฒนาการ"
        subtitle="ผลสอบ Pre / Mid / Post แยกตามคอร์ส วิชา และติวเตอร์"
      />

      {/* แบนเนอร์โทนส้ม */}
      <div className="admin-summary-banner p-5 sm:p-6">
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-700 px-2.5 py-1 text-[11px] font-bold">
            <LuBarChart3 className="h-3.5 w-3.5" /> ข้อมูลผลสอบล่าสุด
          </span>
          <h2 className="mt-2 text-lg font-bold text-slate-900">สรุปผลพัฒนาการ</h2>
          <p className={PAGE_SUBTITLE}>
            เปรียบเทียบคะแนนเฉลี่ยก่อนเรียนและหลังเรียนของแต่ละรายการสอน
            {presetLabel && ` · กรองเฉพาะ ${presetLabel}`}
          </p>
        </div>
      </div>

      {/* Stats — สรุปพัฒนาการเท่านั้น */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "รายการวิชาที่เทียบผลได้",
            note: "แยกตามคอร์ส วิชา และติวเตอร์",
            value: summary.comparableGroups,
            unit: `/ ${summary.groups} รายการ`,
            color: "bg-orange-600", icon: BookOpen,
          },
          { label: "คะแนนหลังเรียนเฉลี่ยต่อรายการ", note: "% ของคะแนนเต็มแต่ละรอบ", value: summary.avgPost, unit: "%", color: "bg-emerald-500", icon: BarChart2 },
          {
            label: "สัดส่วนผลคะแนนที่ดีขึ้น",
            note: "นับแยกตามรายการสอน",
            value: summary.improvedPct,
            unit: `% (${summary.improved}/${summary.comparableResults} ผล)`,
            color: "bg-purple-500", icon: Users,
          },
          {
            label: "อัตราพัฒนาการเฉลี่ยต่อรายการ",
            note: "เฉลี่ยจากรายการที่มีผล Pre–Post",
            value: summary.avgGrowth,
            unit: "%",
            color: "bg-blue-500", icon: TrendingUp,
          },
        ].map((card, i) => (
          <StatTile key={i} card={card} ready={!loading} />
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาคอร์ส วิชา หรือติวเตอร์..."
            className="pl-10 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2 pl-1">
          แสดง {filtered.length} จาก {rows.length} รายการ ({courseCards.length} คอร์ส)
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!error && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-6 py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50"><LuBarChart3 className="h-7 w-7 text-orange-400" /></div>
          <p className="text-base font-semibold text-slate-700">
            {search.trim() ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีคอร์สที่มอบหมายวิชาให้ติวเตอร์"}
          </p>
        </div>
      ) : (
        !error && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paginatedCourses.map((c) => (
                <div
                  key={c.courseId}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                    <p className="font-bold text-slate-900 text-sm">{c.courseName}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {fmtDate(c.startDate) ? `เริ่ม ${fmtDate(c.startDate)}` : "ยังไม่ระบุวันเริ่ม"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {c.studentsEnrolled} คน
                      </span>
                      <span className="text-xs text-slate-500">· {c.items.length} รายการสอน</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {c.items.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => openDetail(r)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-orange-50/40 transition-colors"
                      >
                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">
                            {r.subjectName || `วิชา #${r.subjectId}`}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <GraduationCap className="h-3 w-3 text-slate-400" />
                            {r.tutorName || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 shrink-0">
                          <BarChart2 className="h-4 w-4 text-slate-400 shrink-0" /> ดูพัฒนาการ <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <UIPagination page={page} totalPages={totalPages} total={courseCards.length} pageSize={ITEMS_PER_PAGE} unit="คอร์ส" onChange={setPage} />
          </>
        )
      )}

    </div>
  );
}

// ── breadcrumb ตามต้นทางที่กดเข้ามา ─────────────────────────────────────────
// หน้านี้เข้าได้จาก 3 ที่ ถ้า breadcrumb ชี้กลับที่เดียวเสมอ คนกดจากหน้าติวเตอร์
// จะถูกโยนไปหน้าอื่นที่ไม่ได้ตั้งใจไป จึงอ่านจาก ?from= ที่ต้นทางติดมาให้
function ProgressBreadcrumb({ cameFrom }) {
  const origin = PROGRESS_ORIGINS[cameFrom];
  // ★ เข้าตรงจาก navbar (ไม่มี ?from=) = หน้าระดับบนสุด ไม่ต้องมี breadcrumb
  if (!origin) return null;
  return (
    <Breadcrumb
      items={[
        { label: "หน้าแรก", to: "/admin/dashboard" },
        // มาจากแดชบอร์ด = ชั้นเดียวกับ "หน้าแรก" อยู่แล้ว ไม่ต้องซ้ำ
        cameFrom !== "dashboard" && { label: origin.label, to: origin.to },
        { label: "ภาพรวมพัฒนาการ" },
      ]}
    />
  );
}
