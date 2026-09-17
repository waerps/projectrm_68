import { API_URL } from "../config";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart2, BookOpen, Users, Search, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── ภาพรวมพัฒนาการ — ทางลัดจากเมนู ──────────────────────────────────────────
// หน้าวิเคราะห์ผูกกับ "คอร์ส + วิชา" โดยธรรมชาติ (TutorExamAnalytics ต้องมีทั้งสองค่า
// ไม่งั้นไม่โหลดอะไรเลย) หน้านี้จึงเป็นตัวเลือกคอร์ส+วิชา แล้วพาเข้าหน้าวิเคราะห์โดยตรง
// ไม่ต้องอ้อมผ่านหน้าจัดการการสอบเหมือนเดิม
//
// ใช้ endpoint เดิมที่หน้า "คอร์สที่สอน" ใช้อยู่แล้ว (/coursestutor?adminId=)
// ซึ่งคืนข้อมูลมาเป็นระดับคอร์ส x วิชาพอดี จึงไม่ต้องเพิ่ม API ใหม่
//
// หน้าตายึดตามหน้าฝั่งแอดมิน (AdminTutors / AdminStudents): โทน slate + ส้ม,
// การ์ดสถิติไอคอนสี่เหลี่ยมทึบ, แถบค้นหาการ์ดขาว, ตาราง และ pagination ชุดเดียวกัน
const ITEMS_PER_PAGE = 12;

const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

export default function TutorProgressOverview() {
  const tutorId = JSON.parse(localStorage.getItem("user") || "{}")?.id;
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);   // แถวละ 1 คอร์ส x 1 วิชา
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!tutorId) {
      setError("ไม่พบข้อมูลผู้ใช้ ลองออกจากระบบแล้วเข้าใหม่");
      setLoading(false);
      return;
    }
    let cancelled = false;
    axios
      .get(`${API_URL}/coursestutor?adminId=${tutorId}`)
      .then((res) => {
        if (cancelled) return;
        const seen = new Set();
        const list = [];
        for (const r of Array.isArray(res.data) ? res.data : []) {
          const key = `${r.CourseID}-${r.SubjectId}`;
          if (seen.has(key)) continue;   // กันแถวซ้ำจากการ join หลายคาบ
          seen.add(key);
          list.push({
            key,
            courseId: r.CourseID,
            courseName: r.CourseName || `คอร์ส #${r.CourseID}`,
            subjectId: r.SubjectId,
            subjectName: r.SubjectName || "",
            startDate: r.StartDate,
            studentCount: Number(r.StudentCount) || 0,
          });
        }
        setRows(list);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Fetch tutor courses failed:", err);
        setError("โหลดรายการคอร์สไม่สำเร็จ");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tutorId]);

  const stats = useMemo(() => {
    const courses = new Map();
    for (const r of rows) if (!courses.has(r.courseId)) courses.set(r.courseId, r.studentCount);
    return {
      courses: courses.size,
      subjects: rows.length,
      // นับนักเรียนจากคอร์สที่ไม่ซ้ำ ไม่งั้นคอร์สที่สอนหลายวิชาจะถูกนับซ้ำ
      students: [...courses.values()].reduce((a, b) => a + b, 0),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter(
      (r) => r.courseName.toLowerCase().includes(kw) || r.subjectName.toLowerCase().includes(kw)
    );
  }, [rows, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openAnalytics = (r) => {
    const params = new URLSearchParams({
      courseId: String(r.courseId),
      subjectId: String(r.subjectId),
      courseName: r.courseName,
      subjectName: r.subjectName,
    });
    navigate(`/tutor/exam-analytics?${params.toString()}`);
  };

  if (loading) return (
    <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-600">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลคอร์ส...</p>
    </div>
  );

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ภาพรวมพัฒนาการ</h1>
          <p className="text-sm text-slate-500 mt-1">
            เลือกคอร์สและวิชาที่ต้องการดูพัฒนาการของนักเรียน
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "คอร์สที่สอน", value: stats.courses, color: "bg-orange-600", icon: BookOpen },
          { label: "วิชาที่สอน", value: stats.subjects, color: "bg-blue-500", icon: BarChart2 },
          { label: "นักเรียนทั้งหมด", value: stats.students, color: "bg-emerald-500", icon: Users },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className={`h-10 w-10 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                <p className="text-xl font-black text-slate-900">{card.value.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="ค้นหาชื่อคอร์สหรือวิชา..."
              className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {rows.length} วิชา</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!error && filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-6xl mb-3">📈</div>
          <p className="text-slate-500 font-medium">
            {search.trim() ? "ไม่พบคอร์สหรือวิชาที่ค้นหา" : "ยังไม่มีคอร์สที่คุณสอน"}
          </p>
          {!search.trim() && (
            <p className="text-xs text-slate-400 mt-1">คอร์สจะขึ้นที่นี่เมื่อแอดมินมอบหมายให้คุณสอนในคอร์สแล้ว</p>
          )}
        </div>
      ) : (
        !error && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">คอร์ส</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">วิชา</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">นักเรียน</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">เริ่มเรียน</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((r) => (
                      <tr key={r.key} className="hover:bg-orange-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 text-sm">{r.courseName}</p>
                          <p className="text-[10px] text-slate-400">#{r.courseId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-semibold">
                            {r.subjectName || `วิชา #${r.subjectId}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                            {r.studentCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {fmtDate(r.startDate) ? (
                            <span className="text-xs text-slate-600">{fmtDate(r.startDate)}</span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openAnalytics(r)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition"
                            >
                              <BarChart2 className="h-3.5 w-3.5" /> ดูพัฒนาการ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  แสดง <span className="font-semibold">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span> จาก <span className="font-semibold">{filtered.length}</span> วิชา
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
