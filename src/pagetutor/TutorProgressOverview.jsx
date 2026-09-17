import { API_URL } from "../config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BarChart2, Users, CalendarDays, ChevronRight, Search, Loader2 } from "lucide-react";

// ─── ภาพรวมพัฒนาการ — ทางลัดจากเมนู ──────────────────────────────────────────
// ต่างจากคลังข้อสอบตรงที่หน้าวิเคราะห์ผูกกับ "คอร์ส + วิชา" โดยธรรมชาติ
// (TutorExamAnalytics ต้องมี courseId และ subjectId ไม่งั้นไม่โหลดอะไรเลย)
// หน้านี้จึงเป็นตัวเลือกคอร์ส+วิชา แล้วพาเข้าหน้าวิเคราะห์โดยตรง
// ไม่ต้องอ้อมผ่านหน้าจัดการการสอบเหมือนเดิม
//
// ใช้ endpoint เดิมที่หน้า "คอร์สที่สอน" ใช้อยู่แล้ว (/coursestutor?adminId=)
// ซึ่งคืนข้อมูลมาเป็นระดับคอร์ส x วิชาพอดี จึงไม่ต้องเพิ่ม API ใหม่
const fmtDate = (v) => {
  if (!v) return "ไม่ระบุ";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "ไม่ระบุ";
  return d.toLocaleDateString("th-TH", { year: "2-digit", month: "short", day: "numeric" });
};

export default function TutorProgressOverview() {
  const tutorId = JSON.parse(localStorage.getItem("user") || "{}")?.id;
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
        // รวมแถวที่เป็นคอร์สเดียวกันเข้าด้วยกัน แล้วเก็บวิชาไว้ข้างใน
        // เพราะคอร์สหนึ่งครูอาจสอนหลายวิชา และแต่ละวิชามีหน้าวิเคราะห์ของตัวเอง
        const map = new Map();
        for (const row of Array.isArray(res.data) ? res.data : []) {
          if (!map.has(row.CourseID)) {
            map.set(row.CourseID, {
              id: row.CourseID,
              name: row.CourseName || `คอร์ส #${row.CourseID}`,
              startDate: row.StartDate,
              studentCount: Number(row.StudentCount) || 0,
              subjects: [],
            });
          }
          const c = map.get(row.CourseID);
          if (!c.subjects.some((s) => s.subjectId === row.SubjectId)) {
            c.subjects.push({ subjectId: row.SubjectId, subjectName: row.SubjectName || "" });
          }
        }
        setCourses([...map.values()]);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Fetch tutor courses failed:", err);
        setError("โหลดรายการคอร์สไม่สำเร็จ");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tutorId]);

  const openAnalytics = (course, subject) => {
    const params = new URLSearchParams({
      courseId: String(course.id),
      subjectId: String(subject.subjectId),
      courseName: course.name,
      subjectName: subject.subjectName,
    });
    navigate(`/tutor/exam-analytics?${params.toString()}`);
  };

  const kw = search.trim().toLowerCase();
  const shown = kw
    ? courses.filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.subjects.some((s) => s.subjectName.toLowerCase().includes(kw))
      )
    : courses;

  const totalPairs = courses.reduce((a, c) => a + c.subjects.length, 0);

  return (
    <div className="space-y-6 mt-[90px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">ภาพรวมพัฒนาการ</h1>
          <p className="text-sm text-neutral-500 mt-1">
            เลือกคอร์สและวิชาที่ต้องการดูพัฒนาการของนักเรียน · คุณสอนอยู่ {totalPairs} วิชา ใน {courses.length} คอร์ส
          </p>
        </div>
      </div>

      {courses.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อคอร์สหรือวิชา"
            className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 rounded-2xl">
          <BarChart2 className="h-10 w-10 text-neutral-300 mb-3" />
          <p className="text-sm font-semibold text-neutral-500">
            {kw ? "ไม่พบคอร์สหรือวิชาที่ค้นหา" : "ยังไม่มีคอร์สที่คุณสอน"}
          </p>
          {!kw && (
            <p className="text-xs text-neutral-400 mt-1">
              คอร์สจะขึ้นที่นี่เมื่อแอดมินมอบหมายให้คุณสอนในคอร์สแล้ว
            </p>
          )}
        </div>
      ) : (
        !loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shown.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
                <p className="text-base font-bold text-neutral-900">{course.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 mb-3">
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <CalendarDays className="h-3.5 w-3.5 text-neutral-400" /> เริ่ม {fmtDate(course.startDate)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <Users className="h-3.5 w-3.5 text-neutral-400" /> {course.studentCount} คน
                  </span>
                </div>

                <div className="border-t border-neutral-100 pt-2 space-y-1">
                  {course.subjects.map((s) => (
                    <button
                      key={s.subjectId}
                      onClick={() => openAnalytics(course, s)}
                      className="w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-xl hover:bg-orange-50 text-neutral-700 hover:text-orange-600 transition group"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium truncate">
                        <BarChart2 className="h-4 w-4 text-neutral-300 group-hover:text-orange-400 shrink-0" />
                        {s.subjectName || `วิชา #${s.subjectId}`}
                      </span>
                      <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-orange-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
