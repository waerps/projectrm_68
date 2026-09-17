import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileQuestion, BookOpen, AlertTriangle, Search, Loader2, ChevronRight, ChevronLeft, Settings2,
} from "lucide-react";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import { fetchMySubjects } from "../utils/examShared";
import { BankTab } from "./TutorExamDetail.jsx";

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

  const stats = useMemo(() => ({
    questions: subjects.reduce((a, s) => a + s.total, 0),
    ready: subjects.filter((s) => s.total > 0).length,
    empty: subjects.filter((s) => s.total === 0).length,
  }), [subjects]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return subjects;
    return subjects.filter((s) => s.subjectName.toLowerCase().includes(kw));
  }, [subjects, search]);

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
          <button onClick={backToList} className="font-medium text-slate-500 hover:text-orange-600 transition">
            คลังข้อสอบ
          </button>
          <ChevronRight className="mx-2 h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-800">{selected?.subjectName || "วิชา"}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              คลังข้อสอบ{selected?.subjectName ? ` — ${selected.subjectName}` : ""}
            </h1>
            <p className="text-sm text-slate-500 mt-1">เพิ่ม แก้ไข และจัดหมวดหมู่ข้อสอบของคุณในวิชานี้</p>
          </div>
          <button
            onClick={backToList}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-orange-300 hover:text-orange-600 transition shrink-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> เปลี่ยนวิชา
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

  if (loading) return (
    <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-600">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลคลังข้อสอบ...</p>
    </div>
  );

  // ── ยังไม่เลือกวิชา: ให้เลือกก่อน ──
  return (
    <div className="space-y-6 mt-[90px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">คลังข้อสอบของฉัน</h1>
          <p className="text-sm text-slate-500 mt-1">เลือกวิชาที่ต้องการจัดการข้อสอบ</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "ข้อสอบทั้งหมด", value: stats.questions, color: "bg-orange-600", icon: FileQuestion },
          { label: "วิชาที่มีข้อสอบแล้ว", value: stats.ready, color: "bg-emerald-500", icon: BookOpen },
          { label: "วิชาที่ยังไม่มีข้อสอบ", value: stats.empty, color: "bg-amber-500", icon: AlertTriangle },
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อวิชา..."
              className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {subjects.length} วิชา</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!error && filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-6xl mb-3">📚</div>
          <p className="text-slate-500 font-medium">
            {search.trim() ? "ไม่พบวิชาที่ค้นหา" : "ยังไม่มีวิชาที่คุณสอน"}
          </p>
          {!search.trim() && (
            <p className="text-xs text-slate-400 mt-1">
              วิชาจะขึ้นที่นี่เมื่อแอดมินมอบหมายให้คุณสอนวิชานั้นในคอร์สแล้ว
            </p>
          )}
        </div>
      ) : (
        !error && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">วิชา</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จำนวนข้อสอบ</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">หมวดหมู่</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">แก้ไขล่าสุด</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานะ</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.subjectId} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 text-sm">{s.subjectName || `วิชา #${s.subjectId}`}</p>
                        <p className="text-[10px] text-slate-400">#{s.subjectId}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-slate-900">{s.total}</span>
                        <span className="text-xs text-slate-400"> ข้อ</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.categories > 0 ? (
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            มีข้อสอบแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                            ยังไม่มีข้อสอบ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openSubject(s.subjectId)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition"
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
        )
      )}
    </div>
  );
}
