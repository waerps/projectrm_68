import { API_URL } from "../config";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart2, BookOpen, Users, Search, Loader2, Calendar, ChevronRight, ChevronLeft,
} from "lucide-react";

// ─── ภาพรวมพัฒนาการ — ทางลัดจากเมนู ──────────────────────────────────────────
// หน้าวิเคราะห์ผูกกับ "คอร์ส + วิชา" โดยธรรมชาติ (TutorExamAnalytics ต้องมีทั้งสองค่า
// ไม่งั้นไม่โหลดอะไรเลย) หน้านี้จึงเป็นตัวเลือกคอร์ส+วิชา แล้วพาเข้าหน้าวิเคราะห์โดยตรง
// ไม่ต้องอ้อมผ่านหน้าจัดการการสอบเหมือนเดิม
//
// ใช้ endpoint เดิมที่หน้า "คอร์สที่สอน" ใช้อยู่แล้ว (/coursestutor?adminId=)
// ซึ่งคืนข้อมูลมาเป็นระดับคอร์ส x วิชาพอดี จึงไม่ต้องเพิ่ม API ใหม่
//
// โทนสี/การ์ดสถิติ/แถบค้นหา ยึดตามหน้าฝั่งแอดมิน (AdminTutors / AdminStudents)
// ส่วน "เนื้อหา" ด้านล่างเป็นการ์ดต่อคอร์ส แต่ละใบมีรายชื่อวิชาซ้อนอยู่ข้างใน
// (ตามที่ผู้ใช้ขอ) แทนตารางแถวแบนแบบเดิม — คลิกที่วิชาไหนก็เข้าไปดูพัฒนาการของวิชานั้น
const ITEMS_PER_PAGE = 12; // จำนวน "คอร์ส" (การ์ด) ต่อหน้า ไม่ใช่จำนวนวิชา

const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

export default function TutorProgressOverview() {
  const tutorId = JSON.parse(localStorage.getItem("user") || "{}")?.id;
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);   // แถวละ 1 คอร์ส x 1 วิชา (ดิบจาก API)
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

  // จัดกลุ่มแถวดิบ (คอร์ส x วิชา) ให้เป็น "การ์ดคอร์ส" แต่ละใบมีรายวิชาซ้อนอยู่ข้างใน
  // แล้วค่อยกรองด้วยคำค้นหา: ถ้าชื่อคอร์สตรงคำค้น ให้โชว์ทุกวิชาของคอร์สนั้น
  // ถ้าชื่อคอร์สไม่ตรง ให้เหลือเฉพาะวิชาที่ชื่อตรงคำค้น แล้วค่อยตัดคอร์สที่ไม่เหลือวิชาออก
  const courseCards = useMemo(() => {
    const byId = new Map();
    for (const r of rows) {
      if (!byId.has(r.courseId)) {
        byId.set(r.courseId, {
          courseId: r.courseId,
          courseName: r.courseName,
          startDate: r.startDate,
          studentCount: r.studentCount,
          subjects: [],
        });
      }
      byId.get(r.courseId).subjects.push({
        key: r.key,
        subjectId: r.subjectId,
        subjectName: r.subjectName,
      });
    }
    const all = [...byId.values()];

    const kw = search.trim().toLowerCase();
    if (!kw) return all;

    return all
      .map((c) => {
        const courseMatches = c.courseName.toLowerCase().includes(kw);
        const subjects = courseMatches
          ? c.subjects
          : c.subjects.filter((s) => s.subjectName.toLowerCase().includes(kw));
        return { ...c, subjects };
      })
      .filter((c) => c.subjects.length > 0);
  }, [rows, search]);

  const matchedSubjectCount = useMemo(
    () => courseCards.reduce((sum, c) => sum + c.subjects.length, 0),
    [courseCards]
  );

  const totalPages = Math.ceil(courseCards.length / ITEMS_PER_PAGE) || 1;
  const paginatedCourses = courseCards.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openAnalytics = (courseId, courseName, subjectId, subjectName) => {
    const params = new URLSearchParams({
      courseId: String(courseId),
      subjectId: String(subjectId),
      courseName,
      subjectName,
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
            {stats.subjects > 0 && ` · คุณสอนอยู่ ${stats.subjects} วิชา ใน ${stats.courses} คอร์ส`}
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
        <p className="text-xs text-slate-400 mt-2 pl-1">
          แสดง {matchedSubjectCount} จาก {rows.length} วิชา ({courseCards.length} คอร์ส)
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!error && courseCards.length === 0 ? (
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
            {/* การ์ดคอร์ส — แต่ละใบมีรายชื่อวิชาซ้อนอยู่ข้างใน คลิกวิชาไหนก็เข้าดูพัฒนาการของวิชานั้น */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paginatedCourses.map((c) => (
                <div
                  key={c.courseId}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">{c.courseName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {fmtDate(c.startDate) ? `เริ่ม ${fmtDate(c.startDate)}` : "ยังไม่ระบุวันเริ่ม"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {c.studentCount} คน
                      </span>
                    </div>
                  </div>

                  {c.subjects.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-slate-400">ไม่มีวิชาที่ตรงกับคำค้นหาในคอร์สนี้</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {c.subjects.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => openAnalytics(c.courseId, c.courseName, s.subjectId, s.subjectName)}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-orange-50/40 transition-colors"
                        >
                          <BarChart2 className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                            {s.subjectName || `วิชา #${s.subjectId}`}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
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
