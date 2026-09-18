import { API_URL } from "../config";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  TrendingUp, BookOpen, Users, Search, Loader2, ChevronLeft, ChevronRight,
  BarChart2, X, AlertTriangle, GraduationCap,
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
  const [searchParams] = useSearchParams();
  // เปิดจากปุ่มในหน้าคอร์สหรือหน้าติวเตอร์ จะกรองมาให้เลยตั้งแต่เข้าหน้า
  const presetCourseId = searchParams.get("courseId");
  const presetSubjectId = searchParams.get("subjectId");
  const presetTutorId = searchParams.get("tutorId");

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [orphanGroups, setOrphanGroups] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);

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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openDetail = useCallback((row) => setDetail({ row }), []);

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
        <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {rows.length} รายการ</p>
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">คอร์ส / วิชา</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ติวเตอร์</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pre</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mid</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Post</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">พัฒนาการ</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">สอบแล้ว</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((r) => {
                      const tone = growthTone(r.growth);
                      return (
                        <tr key={r.key} className="hover:bg-orange-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 text-sm">{r.courseName}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-semibold">
                              {r.subjectName || `วิชา #${r.subjectId}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-slate-600">{r.tutorName || "—"}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-slate-600">{fmtPct(r.pre.avgPct)}</td>
                          <td className="px-4 py-3 text-center text-xs text-slate-600">{fmtPct(r.mid.avgPct)}</td>
                          <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{fmtPct(r.post.avgPct)}</td>
                          <td className="px-4 py-3 text-center">
                            {r.growth ? (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${tone.bg} ${tone.text} ${tone.border}`}>
                                {r.growth.delta > 0 ? "+" : ""}{r.growth.delta} จุด
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                              {r.post.takers}/{r.studentsEnrolled}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => openDetail(r)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition"
                              >
                                <BarChart2 className="h-3.5 w-3.5" /> ดูรายคน
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  แสดง <span className="font-semibold">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span> จาก <span className="font-semibold">{filtered.length}</span> รายการ
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

      {detail && <DetailModal row={detail.row} onClose={() => setDetail(null)} />}
    </div>
  );
}

// ── โมดัลรายคน ──────────────────────────────────────────────────────────────
// แสดงเฉพาะคะแนนกับพัฒนาการ ไม่มีเนื้อหาข้อสอบ ไม่มีปุ่มแก้ไขใดๆ
function DetailModal({ row, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      courseId: String(row.courseId),
      subjectId: String(row.subjectId),
      tutorId: String(row.tutorId),
    });
    axios
      .get(`${API_BASE}/detail?${params.toString()}`, getAdminAuthConfig())
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => {
        if (cancelled) return;
        console.error("Fetch admin progress detail failed:", err);
        setError("โหลดข้อมูลรายคนไม่สำเร็จ");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [row]);

  const tested = data?.students?.filter((s) => s.tested) || [];
  const notTested = data?.students?.filter((s) => !s.tested) || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate">{row.courseName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {row.subjectName || `วิชา #${row.subjectId}`}
              {row.tutorName && ` · ${row.tutorName}`}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-orange-600">
              <Loader2 className="w-7 h-7 animate-spin mb-3" />
              <p className="text-sm text-slate-500">กำลังโหลด...</p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 py-8 text-center">{error}</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Pre-test", value: row.pre.avgPct, takers: row.pre.takers },
                  { label: "Mid-test", value: row.mid.avgPct, takers: row.mid.takers },
                  { label: "Post-test", value: row.post.avgPct, takers: row.post.takers },
                ].map((b) => (
                  <div key={b.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 mb-1">{b.label}</p>
                    <p className="text-lg font-black text-slate-800">{fmtPct(b.value)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{b.takers} คนสอบ</p>
                  </div>
                ))}
              </div>

              {row.growth?.capped && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                  คะแนน Pre-test เฉลี่ยสูงอยู่แล้ว เหลือพื้นที่ให้พัฒนาน้อย ตัวเลขพัฒนาการของกลุ่มนี้
                  จึงเทียบกับกลุ่มที่พื้นฐานต่ำกว่าตรงๆ ไม่ได้
                </p>
              )}

              {tested.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400">ยังไม่มีนักเรียนคนไหนสอบในวิชานี้</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">นักเรียน</th>
                        <th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Pre</th>
                        <th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Mid</th>
                        <th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Post</th>
                        <th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">พัฒนาการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tested.map((s) => {
                        const tone = growthTone(s.growth);
                        return (
                          <tr key={s.userId} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2 text-slate-700 text-xs">{s.name}</td>
                            <td className="px-3 py-2 text-center text-xs text-slate-600">{fmtPct(s.pre)}</td>
                            <td className="px-3 py-2 text-center text-xs text-slate-600">{fmtPct(s.mid)}</td>
                            <td className="px-3 py-2 text-center text-xs font-bold text-slate-800">{fmtPct(s.post)}</td>
                            <td className="px-3 py-2 text-center">
                              {s.growth ? (
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${tone.bg} ${tone.text} ${tone.border}`}>
                                  {s.growth.delta > 0 ? "+" : ""}{s.growth.delta} จุด
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {notTested.length > 0 && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    ลงทะเบียนแล้วแต่ยังไม่ได้สอบ ({notTested.length} คน)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {notTested.map((s) => (
                      <span key={s.userId} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
