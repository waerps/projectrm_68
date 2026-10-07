import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileQuestion, BookOpen, AlertTriangle, Search, Loader2, ChevronLeft, Settings2,
} from "lucide-react";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import { fetchMySubjects } from "../utils/examShared";
import { BankTab } from "./TutorExamDetail.jsx";
import { PAGE_TITLE, PAGE_SUBTITLE } from "../components/ui/tokens";
import Breadcrumb from "../components/ui/Breadcrumb";
import { STAT_LABEL, STAT_VALUE, STAT_UNIT } from "../components/ui/tokens";
import { BookOpen as LuBookOpen } from "lucide-react";
import ExamRightsNotice from "./ExamRightsNotice";
import ErrorState from "../components/ui/ErrorState";

// ─── คลังข้อสอบของฉัน — ทางลัดจากเมนู ────────────────────────────────────────
// เดิมกว่าจะเข้าถึงคลังได้ต้องไล่ คอร์ส → วิชา → รอบสอบ → แท็บคลัง ทั้งที่คลังข้อสอบ
// ไม่ได้ผูกกับคอร์สหรือรอบสอบเลย มันเป็นของครูต่อวิชาล้วน ๆ หน้านี้จึงเข้าตรงจากเมนู
//
// ตัวจัดการคลังใช้ BankTab ตัวเดียวกับในหน้าจัดการการสอบ ไม่ได้เขียนใหม่
// แก้ที่เดียวแล้วเหมือนกันทั้งสองทางเข้าเสมอ
//
// วิชาที่เลือกอยู่เก็บไว้ใน query string (?subjectId=) เพื่อให้รีเฟรชหรือกดย้อนกลับแล้วยังอยู่ที่เดิม
// หน้าตายึดตามหน้าฝั่งแอดมิน (AdminTutors / AdminStudents): โทน slate + ส้ม,
// การ์ดสถิติไอคอนสี่เหลี่ยมทึบ, แถบค้นหาการ์ดขาว และตารางชุดเดียวกัน
const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

function CourseTypeBadges({ types = [] }) {
  if (!types.length) return <span className="text-[11px] text-slate-400">ไม่มีคอร์สที่สอนอยู่</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {types.includes("single") && <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">คอร์สเดี่ยว</span>}
      {types.includes("bundle") && <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">คอร์สรวม</span>}
    </span>
  );
}

export default function TutorQuestionBank() {
  const { toasts, showToast, removeToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectId = searchParams.get("subjectId") || "";

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [courseTypeFilter, setCourseTypeFilter] = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
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

  const typeSubjects = useMemo(() => subjects.filter((s) =>
    courseTypeFilter === "all" || s.courseTypes?.includes(courseTypeFilter)
  ), [subjects, courseTypeFilter]);

  const stats = useMemo(() => ({
    questions: typeSubjects.reduce((a, s) => a + s.total, 0),
    ready: typeSubjects.filter((s) => s.total > 0).length,
    empty: typeSubjects.filter((s) => s.total === 0).length,
  }), [typeSubjects]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return typeSubjects;
    return typeSubjects.filter((s) => s.subjectName.toLowerCase().includes(kw));
  }, [typeSubjects, search]);

  const openSubject = (id) => setSearchParams({ subjectId: String(id) });
  const backToList = () => {
    setSearchParams({});
    load();   // กลับมาแล้วให้ตัวเลขจำนวนข้อตรงกับที่เพิ่งแก้ไป
  };

  // ── เลือกวิชาแล้ว: แสดงตัวจัดการคลังตัวเดียวกับหน้าจัดการการสอบ ──
  if (subjectId) {
    return (
      <div className="space-y-6 px-4 lg:px-0">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <Breadcrumb
          items={[
            { label: "หน้าแรก", to: "/tutor" },
            // ย้อนกลับด้วย backToList เพื่อให้โหลดจำนวนข้อใหม่หลังแก้ไขคลัง
            { label: "คลังข้อสอบ", onClick: backToList },
            { label: selected?.subjectName || "วิชา" },
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <h1 className={`${PAGE_TITLE} break-words`}>
              คลังข้อสอบ{selected?.subjectName ? ` — ${selected.subjectName}` : ""}
            </h1>
            <p className="text-sm text-slate-500 mt-1">เพิ่ม แก้ไข และจัดหมวดหมู่ข้อสอบของคุณในวิชานี้</p>
            {selected && <div className="mt-2"><CourseTypeBadges types={selected.courseTypes} /></div>}
          </div>
          <button
            onClick={backToList}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:border-orange-300 hover:text-orange-600 transition shrink-0 self-start md:self-auto"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> เปลี่ยนวิชา
          </button>
        </div>

        {selected?.courseTypes?.includes("single") && <ExamRightsNotice standaloneBank />}
        {selected?.courseTypes?.includes("single") && selected?.courseTypes?.includes("bundle") && (
          <p className="text-xs text-slate-500">วิชานี้ใช้คลังข้อสอบชุดเดียวกันทั้งคอร์สเดี่ยวและคอร์สรวม</p>
        )}

        <BankTab
          subjectId={subjectId}
          subjectName={selected?.subjectName || ""}
          showToast={showToast}
        />
      </div>
    );
  }

  if (loading) return (
    <div className="px-4 lg:px-0 flex flex-col items-center justify-center h-64 text-orange-600">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลคลังข้อสอบ...</p>
    </div>
  );

  // ── ยังไม่เลือกวิชา: ให้เลือกก่อน ──
  return (
    <div className="space-y-6 px-4 lg:px-0">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={PAGE_TITLE}>คลังข้อสอบของฉัน</h1>
          <p className={PAGE_SUBTITLE}>เลือกวิชาที่ต้องการจัดการข้อสอบ</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 min-[360px]:[&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
        {[
          { label: "ข้อสอบทั้งหมด", value: stats.questions, unit: "ข้อ", color: "bg-orange-600", icon: FileQuestion },
          { label: "วิชาที่มีข้อสอบแล้ว", value: stats.ready, unit: "วิชา", color: "bg-emerald-500", icon: BookOpen },
          { label: "วิชาที่ยังไม่มีข้อสอบ", value: stats.empty, unit: "วิชา", color: "bg-amber-500", icon: AlertTriangle },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className={`h-10 w-10 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className={STAT_LABEL}>{card.label}</p>
                <p className={STAT_VALUE}>{error ? "—" : <>{card.value.toLocaleString()}<span className={STAT_UNIT}>{card.unit}</span></>}</p>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อวิชา..."
              className="pl-10 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
            />
          </div>
          <select
            aria-label="กรองประเภทคอร์ส"
            value={courseTypeFilter}
            onChange={(e) => setCourseTypeFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <option value="all">ทุกประเภทคอร์ส</option>
            <option value="single">คอร์สเดี่ยว</option>
            <option value="bundle">คอร์สรวม</option>
          </select>
        </div>
        {!error && <p className="text-xs text-slate-500 mt-2 pl-1">แสดง {filtered.length} จาก {typeSubjects.length} วิชา</p>}
      </div>

      {error && <ErrorState title={error} onRetry={load} />}

      {!error && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-6 py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50"><LuBookOpen className="h-7 w-7 text-orange-400" /></div>
          <p className="text-base font-semibold text-slate-700">
            {search.trim() ? "ไม่พบวิชาที่ค้นหา" : courseTypeFilter !== "all" ? "ไม่มีวิชาในประเภทคอร์สนี้" : "ยังไม่มีวิชาที่คุณสอน"}
          </p>
          {!search.trim() && courseTypeFilter === "all" && (
            <p className="text-xs text-slate-500 mt-1">
              วิชาจะแสดงที่นี่เมื่อผู้ดูแลระบบมอบหมายการสอน
            </p>
          )}
        </div>
      ) : (
        !error && (
          <>
          {/* มือถือ/แท็บเล็ต: การ์ดรายวิชา แตะทั้งการ์ดเพื่อเปิดคลัง */}
          <div className="lg:hidden grid gap-3 md:grid-cols-2">
            {filtered.map((s) => (
              <button key={s.subjectId} onClick={() => openSubject(s.subjectId)}
                className="min-w-0 text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4 active:bg-orange-50/60">
                <span className="flex items-start justify-between gap-3">
                  <span className="block min-w-0">
                    <span className="block font-semibold text-slate-900 text-sm leading-snug">{s.subjectName || "ไม่ระบุชื่อวิชา"}</span>
                    <span className="block mt-1"><CourseTypeBadges types={s.courseTypes} /></span>
                    {fmtDate(s.lastUpdatedAt) && <span className="block mt-1 text-[11px] text-slate-500">แก้ไขล่าสุด {fmtDate(s.lastUpdatedAt)}</span>}
                  </span>
                  {s.total > 0 ? (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">มีข้อสอบแล้ว</span>
                  ) : (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">ยังไม่มีข้อสอบ</span>
                  )}
                </span>
                <span className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="block text-xs text-slate-500"><span className="text-sm font-bold text-slate-900">{s.total}</span> ข้อ{s.categories > 0 ? ` · หมวดหมู่ ${s.categories}` : ""}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-600"><Settings2 className="h-4 w-4" /> จัดการคลัง</span>
                </span>
              </button>
            ))}
          </div>
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">วิชา</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จำนวนข้อสอบ</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">หมวดหมู่</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">แก้ไขล่าสุด</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานะ</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide sticky right-0 bg-slate-50 lg:static lg:bg-transparent">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.subjectId} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 text-sm">{s.subjectName || "ไม่ระบุชื่อวิชา"}</p>
                        <div className="mt-1"><CourseTypeBadges types={s.courseTypes} /></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-slate-900">{s.total}</span>
                        <span className="text-xs text-slate-500"> ข้อ</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.categories > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                            {s.categories}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {fmtDate(s.lastUpdatedAt) ? (
                          <span className="text-xs text-slate-600">{fmtDate(s.lastUpdatedAt)}</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.total > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            มีข้อสอบแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                            ยังไม่มีข้อสอบ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 sticky right-0 bg-white lg:static lg:bg-transparent">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openSubject(s.subjectId)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition whitespace-nowrap lg:whitespace-normal"
                          >
                            <Settings2 className="h-3.5 w-3.5" /> จัดการคลัง
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )
      )}
    </div>
  );
}
