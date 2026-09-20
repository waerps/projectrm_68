import { API_URL } from "../config";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PROGRESS_ORIGINS } from "./progressOrigins";
import axios from "axios";
import {
  TrendingUp, BookOpen, Search, Loader2, ChevronLeft, ChevronRight,
  BarChart2, AlertTriangle, GraduationCap, Calendar, Users,
} from "lucide-react";

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

const fmtPct = (v) => (v === null || v === undefined ? "—" : `${v}%`);

const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

// ป้ายพัฒนาการ — ใช้เครื่องหมายของผลต่าง Post − Pre ตรง ๆ ไม่มีเกณฑ์ประดิษฐ์
// growth.delta มาจาก backend แล้ว หน้านี้แค่เลือกสี
function growthTone(growth) {
  if (!growth || growth.delta === null || growth.delta === undefined) {
    return { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" };
  }
  if (growth.delta > 0) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
  if (growth.delta < 0) return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
  return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
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
  const [totals, setTotals] = useState(null);
  const [orphanGroups, setOrphanGroups] = useState(0);
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
        setTotals(res.data?.totals || null);
        setOrphanGroups(Number(res.data?.orphanExamGroups) || 0);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Fetch admin progress overview failed:", err);
        setError("โหลดข้อมูลภาพรวมพัฒนาการไม่สำเร็จ");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = rows;
    if (presetCourseId) list = list.filter((r) => String(r.courseId) === String(presetCourseId));
    if (presetSubjectId) list = list.filter((r) => String(r.subjectId) === String(presetSubjectId));
    if (presetTutorId) list = list.filter((r) => String(r.tutorId) === String(presetTutorId));
    const kw = search.trim().toLowerCase();
    if (!kw) return list;
    return list.filter(
      (r) =>
        r.courseName.toLowerCase().includes(kw) ||
        (r.subjectName || "").toLowerCase().includes(kw) ||
        (r.tutorName || "").toLowerCase().includes(kw)
    );
  }, [rows, search, presetCourseId, presetSubjectId, presetTutorId]);

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
    <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-600">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดภาพรวมพัฒนาการ...</p>
    </div>
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
    <div className="space-y-6 mt-[90px]">
      <Breadcrumb cameFrom={cameFrom} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ภาพรวมพัฒนาการ</h1>
          <p className="text-sm text-slate-500 mt-1">
            ผลสอบ Pre / Mid / Post ของทุกคอร์สและทุกวิชา
            {presetLabel && ` · กรองเฉพาะ ${presetLabel}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "คอร์สที่เปิดสอน", value: totals?.courses ?? 0, color: "bg-orange-600", icon: BookOpen },
          { label: "วิชา x ติวเตอร์", value: totals?.subjectGroups ?? 0, color: "bg-blue-500", icon: GraduationCap },
          {
            label: "คะแนนเฉลี่ย Post-test",
            value: totals?.avgPost === null || totals?.avgPost === undefined ? "—" : `${totals.avgPost}%`,
            color: "bg-emerald-500", icon: BarChart2,
          },
          {
            label: "นักเรียนที่คะแนนดีขึ้น",
            value: totals ? `${totals.improved}/${totals.comparable}` : "—",
            color: "bg-purple-500", icon: TrendingUp,
          },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className={`h-10 w-10 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                <p className="text-xl font-black text-slate-900">
                  {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ข้อมูลไม่สอดคล้อง — แจ้งอย่างเดียว ไม่แก้ให้เอง */}
      {orphanGroups > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            พบชุดข้อสอบ {orphanGroups} กลุ่ม ที่ผูกกับคอร์ส+วิชาแต่ติวเตอร์เจ้าของไม่ได้ถูกมอบหมายให้สอนวิชานั้นแล้ว
            ผลสอบของกลุ่มนี้จะไม่ถูกนับในตารางด้านล่าง — เป็นการแจ้งให้ทราบเฉยๆ ระบบไม่ได้แก้ไขข้อมูลใดๆ ให้
          </p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาคอร์ส วิชา หรือติวเตอร์..."
            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">
          แสดง {filtered.length} จาก {rows.length} รายการ ({courseCards.length} คอร์ส)
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!error && filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-6xl mb-3">📊</div>
          <p className="text-slate-500 font-medium">
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
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
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
                      <span className="text-xs text-slate-400">· {c.items.length} วิชา/กลุ่ม</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {c.items.map((r) => {
                      const tone = growthTone(r.growth);
                      return (
                        <button
                          key={r.key}
                          onClick={() => openDetail(r)}
                          className="w-full text-left px-4 py-3 hover:bg-orange-50/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-slate-800">
                                  {r.subjectName || `วิชา #${r.subjectId}`}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                  <GraduationCap className="h-3 w-3 text-slate-400" />
                                  {r.tutorName || "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap text-xs text-slate-500">
                                <span>Pre {fmtPct(r.pre.avgPct)}</span>
                                <span>Mid {fmtPct(r.mid.avgPct)}</span>
                                <span className="font-bold text-slate-700">Post {fmtPct(r.post.avgPct)}</span>
                                {r.growth ? (
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${tone.bg} ${tone.text} ${tone.border}`}>
                                    {r.growth.delta > 0 ? "+" : ""}{r.growth.delta} จุด
                                  </span>
                                ) : (
                                  <span className="text-slate-300">พัฒนาการ —</span>
                                )}
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold">
                                  สอบแล้ว {r.post.takers}/{r.studentsEnrolled}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 shrink-0">
                              <BarChart2 className="h-3.5 w-3.5" /> ดูพัฒนาการ <ChevronRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  แสดง <span className="font-semibold">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, courseCards.length)}</span> จาก <span className="font-semibold">{courseCards.length}</span> คอร์ส
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) => p === "..." ? (
                      <span key={`d${idx}`} className="flex h-9 w-9 items-center justify-center text-slate-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                          page === p ? "bg-orange-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}

    </div>
  );
}

// ── breadcrumb ตามต้นทางที่กดเข้ามา ─────────────────────────────────────────
// หน้านี้เข้าได้จาก 3 ที่ ถ้า breadcrumb ชี้กลับที่เดียวเสมอ คนกดจากหน้าติวเตอร์
// จะถูกโยนไปหน้าอื่นที่ไม่ได้ตั้งใจไป จึงอ่านจาก ?from= ที่ต้นทางติดมาให้
function Breadcrumb({ cameFrom }) {
  const origin = PROGRESS_ORIGINS[cameFrom];
  return (
    <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm text-slate-400">
      {origin ? (
        <>
          <Link to={origin.to} className="hover:text-orange-600 transition font-medium">{origin.label}</Link>
          <ChevronRight className="h-4 w-4" />
        </>
      ) : (
        <>
          <Link to="/admin/dashboard" className="hover:text-orange-600 transition font-medium">แดชบอร์ด</Link>
          <ChevronRight className="h-4 w-4" />
        </>
      )}
      <span className="font-semibold text-slate-700">ภาพรวมพัฒนาการ</span>
    </div>
  );
}
