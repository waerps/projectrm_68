import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FileQuestion, ChevronRight, ChevronLeft, Search, Loader2, Tags, Clock } from "lucide-react";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import { fetchMySubjects } from "../utils/examShared";
import { BankTab } from "./TutorExamDetail.jsx";

// ─── คลังข้อสอบของฉัน — ทางลัดจากเมนู ────────────────────────────────────────
// เดิมกว่าจะเข้าถึงคลังได้ต้องไล่ คอร์ส → วิชา → รอบสอบ → แท็บคลัง ทั้งที่คลังข้อสอบ
// ไม่ได้ผูกกับคอร์สหรือรอบสอบไหนเลย มันเป็นของครูต่อวิชาล้วน ๆ หน้านี้จึงเข้าตรงจากเมนู
//
// ตัวจัดการคลังใช้ BankTab ตัวเดียวกับในหน้าจัดการการสอบ ไม่ได้เขียนใหม่
// แก้ที่เดียวแล้วเหมือนกันทั้งสองทางเข้าเสมอ
//
// วิชาที่เลือกอยู่เก็บไว้ใน query string (?subjectId=) เพื่อให้รีเฟรชหรือกดย้อนกลับแล้วยังอยู่ที่เดิม
const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

export default function TutorQuestionBank() {
  const { toasts, showToast, removeToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectId = searchParams.get("subjectId") || "";

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchMySubjects()
      .then((rows) => setSubjects(Array.isArray(rows) ? rows : []))
      .catch((err) => {
        console.error("Load my subjects failed:", err);
        setError("โหลดรายการวิชาไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = subjects.find((s) => String(s.subjectId) === String(subjectId));
  const kw = search.trim().toLowerCase();
  const shown = kw ? subjects.filter((s) => s.subjectName.toLowerCase().includes(kw)) : subjects;
  const totalQuestions = subjects.reduce((a, s) => a + s.total, 0);

  const openSubject = (id) => setSearchParams({ subjectId: String(id) });
  const backToList = () => {
    setSearchParams({});
    load();   // กลับมาแล้วให้ตัวเลขจำนวนข้อตรงกับที่เพิ่งแก้ไป
  };

  // ── เลือกวิชาแล้ว: แสดงตัวจัดการคลังตัวเดียวกับหน้าจัดการการสอบ ──
  if (subjectId) {
    return (
      <div className="space-y-6 mt-[90px]">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="flex items-center text-sm flex-wrap gap-y-1">
          <button onClick={backToList} className="font-medium text-gray-500 hover:text-orange-600 transition">
            คลังข้อสอบ
          </button>
          <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-800">{selected?.subjectName || "วิชา"}</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              คลังข้อสอบ{selected?.subjectName ? ` — ${selected.subjectName}` : ""}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              ข้อสอบในนี้เป็นของคุณเอง ครูคนอื่นที่สอนวิชาเดียวกันมีคลังของตัวเองแยกต่างหาก
            </p>
          </div>
          <button
            onClick={backToList}
            className="flex items-center gap-2 border border-neutral-200 hover:border-orange-300 hover:bg-orange-50 text-neutral-700 hover:text-orange-600 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          >
            <ChevronLeft className="h-4 w-4" /> เปลี่ยนวิชา
          </button>
        </div>

        <BankTab
          subjectId={subjectId}
          subjectName={selected?.subjectName || ""}
          showToast={showToast}
        />
      </div>
    );
  }

  // ── ยังไม่เลือกวิชา: ให้เลือกก่อน ──
  return (
    <div className="space-y-6 mt-[90px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">คลังข้อสอบของฉัน</h1>
          <p className="text-sm text-neutral-500 mt-1">
            เลือกวิชาที่ต้องการจัดการ · ตอนนี้มีข้อสอบของคุณทั้งหมด {totalQuestions} ข้อ ใน {subjects.length} วิชา
          </p>
        </div>
      </div>

      {subjects.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อวิชา"
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
          <FileQuestion className="h-10 w-10 text-neutral-300 mb-3" />
          <p className="text-sm font-semibold text-neutral-500">
            {kw ? "ไม่พบวิชาที่ค้นหา" : "ยังไม่มีวิชาที่คุณสอน"}
          </p>
          {!kw && (
            <p className="text-xs text-neutral-400 mt-1">
              วิชาจะขึ้นที่นี่เมื่อแอดมินมอบหมายให้คุณสอนวิชานั้นในคอร์สแล้ว
            </p>
          )}
        </div>
      ) : (
        !loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((s) => (
              <button
                key={s.subjectId}
                onClick={() => openSubject(s.subjectId)}
                className="text-left bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-200 p-5 transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-base font-bold text-neutral-900">{s.subjectName}</p>
                  <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0 mt-1" />
                </div>
                <p className="text-2xl font-bold text-neutral-900">
                  {s.total}
                  <span className="text-sm font-normal text-neutral-400"> ข้อ</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <Tags className="h-3.5 w-3.5 text-neutral-400" /> {s.categories} หมวดหมู่
                  </span>
                  {s.lastUpdatedAt && (
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      <Clock className="h-3.5 w-3.5" /> แก้ล่าสุด {fmtDate(s.lastUpdatedAt)}
                    </span>
                  )}
                </div>
                {s.total === 0 && (
                  <p className="text-xs text-orange-600 mt-2 font-medium">ยังไม่มีข้อสอบ — กดเพื่อเริ่มเพิ่ม</p>
                )}
              </button>
            ))}
          </div>
        )
      )}

      <p className="text-xs text-neutral-400">
        ถ้าต้องการจัดชุดข้อสอบเพื่อเปิดสอบ ให้ไปที่{" "}
        <Link to="/tutor/courses" className="text-orange-600 hover:underline font-medium">คอร์สที่สอน</Link>
        {" "}แล้วเลือกคอร์สกับรอบสอบที่ต้องการ
      </p>
    </div>
  );
}
