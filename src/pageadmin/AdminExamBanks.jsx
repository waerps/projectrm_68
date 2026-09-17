import { API_URL } from "../config";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  FileQuestion, BookOpen, AlertTriangle, Ban, Search, Loader2,
  RefreshCw, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";

// ─── คลังข้อสอบในมุมของแอดมิน ───────────────────────────────────────────────
// ข้อสอบเป็นของ "วิชา" และคนเติมคือติวเตอร์ที่สอนวิชานั้น แอดมินจึงไม่เห็นเลยว่า
// ทั้งระบบมีข้อสอบอะไรอยู่บ้าง จนกว่าจะไล่เปิดดูทีละวิชา หน้านี้จึงมีสองแท็บ:
//   รายการข้อสอบ — ดูข้อสอบทั้งระบบ กรองตามคอร์ส/วิชา/ระดับชั้น
//   สรุปรายวิชา  — ดูว่าวิชาไหนข้อสอบยังไม่พอเปิดสอบ และใครดูแลคลังนั้นอยู่
// หน้านี้แสดงข้อมูลอย่างเดียว การเพิ่ม/แก้ไขข้อสอบอยู่ที่หน้าคลังของติวเตอร์
const API = `${API_URL}/api/admin`;
const auth = () => {
  const token = localStorage.getItem("student_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const ITEMS_PER_PAGE = 12;

// เกณฑ์ขั้นต่ำเริ่มต้น — ชุดสอบมาตรฐานของระบบคือ 20 ข้อ วิชาที่มีน้อยกว่านี้
// จึงจัดชุดสอบไม่ได้เต็มชุดด้วยซ้ำ แอดมินปรับเลขนี้เองได้ที่หน้าจอ
const DEFAULT_MIN = 20;

const LEVEL_PILL = {
  "ง่าย": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "ปานกลาง": "bg-blue-50 text-blue-700 border-blue-200",
  "ยาก": "bg-red-50 text-red-700 border-red-200",
};

const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

export default function AdminExamBanks() {
  const { toasts, showToast, removeToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [activeTab, setActiveTab] = useState("questions"); // questions | summary

  // ตัวกรองแท็บรายการข้อสอบ
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [page, setPage] = useState(1);

  // ตัวกรองแท็บสรุปรายวิชา
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectScope, setSubjectScope] = useState("all");   // all | below | empty
  const [subjectOrder, setSubjectOrder] = useState("fewest"); // fewest | name | updated
  const [minRequired, setMinRequired] = useState(DEFAULT_MIN);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/question-banks`, auth());
      setSubjects(res.data?.subjects || []);
      setGradeLevels(res.data?.gradeLevels || []);
      setCourses(res.data?.courses || []);
    } catch (err) {
      showToast("error", "โหลดข้อมูลไม่สำเร็จ", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // รายการข้อสอบกรองที่ฝั่งเซิร์ฟเวอร์ เพื่อไม่ต้องดึงทั้งคลังมาไว้ในเบราว์เซอร์
  const loadQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const params = {};
      if (filterCourse !== "all") params.courseId = filterCourse;
      if (filterSubject !== "all") params.subjectId = filterSubject;
      if (filterGrade !== "all") params.gradeLevelId = filterGrade;
      if (search.trim()) params.search = search.trim();
      const res = await axios.get(`${API}/question-banks/questions`, { params, ...auth() });
      setQuestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast("error", "โหลดรายการข้อสอบไม่สำเร็จ", err.response?.data?.message || err.message);
    } finally {
      setLoadingQuestions(false);
    }
  }, [filterCourse, filterSubject, filterGrade, search, showToast]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  // หน่วงคำค้นไว้เล็กน้อย กันยิง API ทุกตัวอักษรที่พิมพ์
  useEffect(() => {
    const t = setTimeout(() => { loadQuestions(); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [loadQuestions]);

  const totalQuestions = useMemo(
    () => subjects.reduce((a, s) => a + s.total, 0),
    [subjects]
  );
  const belowCount = useMemo(
    () => subjects.filter((s) => s.total > 0 && s.total < minRequired).length,
    [subjects, minRequired]
  );
  const emptyCount = useMemo(() => subjects.filter((s) => s.total === 0).length, [subjects]);

  // เลือกคอร์สแล้วให้ตัวเลือกวิชาแคบลงเหลือเฉพาะวิชาที่สอนในคอร์สนั้น
  const subjectChoices = useMemo(() => {
    if (filterCourse === "all") return subjects;
    const c = courses.find((x) => String(x.id) === String(filterCourse));
    if (!c) return subjects;
    return subjects.filter((s) => c.subjectIds.includes(s.subjectId));
  }, [subjects, courses, filterCourse]);

  // ถ้าวิชาที่เลือกไว้ไม่ได้อยู่ในคอร์สที่เพิ่งเลือก ให้กลับไปเป็นทุกวิชา
  useEffect(() => {
    if (filterSubject === "all") return;
    if (!subjectChoices.some((s) => String(s.subjectId) === String(filterSubject))) {
      setFilterSubject("all");
    }
  }, [subjectChoices, filterSubject]);

  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE) || 1;
  const paginated = questions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const shownSubjects = useMemo(() => {
    const kw = subjectSearch.trim().toLowerCase();
    const list = subjects.filter((s) => {
      if (kw && !s.subjectName.toLowerCase().includes(kw)) return false;
      if (subjectScope === "below") return s.total > 0 && s.total < minRequired;
      if (subjectScope === "empty") return s.total === 0;
      return true;
    });
    const sorted = [...list];
    if (subjectOrder === "name") sorted.sort((a, b) => a.subjectName.localeCompare(b.subjectName, "th"));
    else if (subjectOrder === "updated") sorted.sort((a, b) => new Date(b.lastUpdatedAt || 0) - new Date(a.lastUpdatedAt || 0));
    else sorted.sort((a, b) => a.total - b.total);
    return sorted;
  }, [subjects, subjectSearch, subjectScope, subjectOrder, minRequired]);

  const statusOf = (s) => {
    if (s.total === 0) return { label: "ยังไม่มีข้อสอบ", cls: "bg-red-50 text-red-700 border-red-200" };
    if (s.total < minRequired) return { label: "ไม่ถึงเกณฑ์", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "พร้อมใช้งาน", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  };

  const openSubjectQuestions = (subjectId) => {
    setFilterCourse("all");
    setFilterSubject(String(subjectId));
    setFilterGrade("all");
    setSearch("");
    setActiveTab("questions");
    setPage(1);
  };

  if (loading) return (
    <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-600">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลคลังข้อสอบ...</p>
    </div>
  );

  return (
    <div className="space-y-6 mt-[90px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">คลังข้อสอบ</h1>
          <p className="text-sm text-slate-500 mt-1">
            ตรวจสอบข้อสอบทั้งหมดในระบบ และความพร้อมของคลังข้อสอบรายวิชา
            <span className="ml-1 text-slate-400">· หน้านี้แสดงข้อมูลอย่างเดียว การเพิ่มและแก้ไขข้อสอบเป็นหน้าที่ของติวเตอร์ประจำวิชา</span>
          </p>
        </div>
        <button
          onClick={() => { loadOverview(); loadQuestions(); }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-orange-300 hover:text-orange-600 transition shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" /> โหลดข้อมูลใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "ข้อสอบทั้งหมด", value: totalQuestions, sub: null, color: "bg-orange-600", icon: FileQuestion },
          { label: "วิชาทั้งหมด", value: subjects.length, sub: null, color: "bg-blue-500", icon: BookOpen },
          { label: "วิชาที่ข้อสอบไม่ถึงเกณฑ์", value: belowCount, sub: `มีข้อสอบน้อยกว่า ${minRequired} ข้อ`, color: "bg-amber-500", icon: AlertTriangle },
          { label: "วิชาที่ยังไม่มีข้อสอบ", value: emptyCount, sub: "ยังไม่มีการเพิ่มข้อสอบ", color: "bg-red-500", icon: Ban },
        ].map((card, i) => {
          // รับไอคอนเป็นตัวแปรใน body ไม่ใช่ destructure ที่พารามิเตอร์
          // เพราะ eslint ของโปรเจกต์นี้ไม่ได้เปิด plugin react จึงมองไม่เห็นว่า <Icon/> คือการใช้งาน
          const Icon = card.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className={`h-10 w-10 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                <p className="text-xl font-black text-slate-900">{card.value.toLocaleString()}</p>
                {card.sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{card.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "questions" ? "bg-orange-500 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          รายการข้อสอบ
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "summary" ? "bg-orange-500 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          สรุปรายวิชา
        </button>
      </div>

      {activeTab === "questions" ? (
        <>
          {/* Search & Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาโจทย์, หมวดหมู่..."
                  className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
              <select
                value={filterCourse}
                onChange={(e) => { setFilterCourse(e.target.value); setPage(1); }}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[200px]"
              >
                <option value="all">ทุกคอร์ส ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.termName ? ` · ${c.termName}` : ""}
                  </option>
                ))}
              </select>
              <select
                value={filterSubject}
                onChange={(e) => { setFilterSubject(e.target.value); setPage(1); }}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[180px]"
              >
                <option value="all">ทุกวิชา ({subjectChoices.length})</option>
                {subjectChoices.map((s) => (
                  <option key={s.subjectId} value={s.subjectId}>{s.subjectName} ({s.total})</option>
                ))}
              </select>
              <select
                value={filterGrade}
                onChange={(e) => { setFilterGrade(e.target.value); setPage(1); }}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[170px]"
              >
                <option value="all">ทุกระดับชั้น</option>
                {gradeLevels.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                <option value="none">ไม่ระบุระดับชั้น</option>
              </select>
            </div>
            <p className="text-xs text-slate-400 mt-2 pl-1">
              {loadingQuestions ? "กำลังโหลดรายการข้อสอบ..." : `แสดง ${questions.length} ข้อ จากคลังทั้งหมด ${totalQuestions} ข้อ`}
            </p>
          </div>

          {loadingQuestions ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="text-6xl mb-3">📄</div>
              <p className="text-slate-500 font-medium">
                {search.trim() || filterCourse !== "all" || filterSubject !== "all" || filterGrade !== "all"
                  ? "ไม่พบข้อสอบที่ตรงกับตัวกรอง"
                  : "ยังไม่มีข้อสอบในระบบ"}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">โจทย์</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">วิชา / หมวดหมู่</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ระดับชั้น</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ระดับความยาก</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">การใช้งาน</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ผู้เพิ่ม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginated.map((q) => (
                        <tr key={q.id} className="hover:bg-orange-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-900 line-clamp-2 max-w-[420px]">{q.text}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">#{q.id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-slate-600">{q.subjectName || <span className="text-slate-300">—</span>}</p>
                            {q.category ? (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-semibold">
                                {q.category}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {q.gradeDetail ? (
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-semibold">
                                {q.gradeDetail}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-semibold">
                                ทุกระดับชั้น
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${LEVEL_PILL[q.level] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                              {q.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {q.usedCount > 0 ? (
                              <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                                {q.usedCount} ครั้ง
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">ยังไม่ถูกใช้</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-slate-600">{q.createdBy || <span className="text-slate-300">—</span>}</p>
                            <p className="text-[10px] text-slate-400">แก้ไขล่าสุด {fmtDate(q.updatedAt) || "—"}</p>
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
                    แสดง <span className="font-semibold">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, questions.length)}</span> จาก <span className="font-semibold">{questions.length}</span> ข้อ
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
          )}
        </>
      ) : (
        <>
          {/* Search & Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="ค้นหาชื่อวิชา..."
                  className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
              <select
                value={subjectScope}
                onChange={(e) => setSubjectScope(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[220px]"
              >
                <option value="all">ทุกวิชา ({subjects.length})</option>
                <option value="below">วิชาที่ข้อสอบไม่ถึงเกณฑ์ ({belowCount})</option>
                <option value="empty">วิชาที่ยังไม่มีข้อสอบ ({emptyCount})</option>
              </select>
              <select
                value={subjectOrder}
                onChange={(e) => setSubjectOrder(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[200px]"
              >
                <option value="fewest">ข้อสอบน้อยที่สุดก่อน</option>
                <option value="name">ชื่อวิชา ก–ฮ</option>
                <option value="updated">อัปเดตล่าสุดก่อน</option>
              </select>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                <span className="text-sm text-slate-500 whitespace-nowrap">เกณฑ์ขั้นต่ำ</span>
                <input
                  type="number"
                  min={1}
                  value={minRequired}
                  onChange={(e) => setMinRequired(Math.max(1, Number(e.target.value) || 1))}
                  className="w-14 bg-white border border-slate-200 rounded px-2 py-0.5 text-sm text-center focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <span className="text-sm text-slate-500">ข้อ</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {shownSubjects.length} จาก {subjects.length} วิชา</p>
          </div>

          {shownSubjects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="text-6xl mb-3">📚</div>
              <p className="text-slate-500 font-medium">ไม่พบวิชาที่ตรงกับตัวกรอง</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">วิชา</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จำนวนข้อสอบ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ระดับความยาก</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ระดับชั้นที่มีข้อสอบ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ผู้ดูแลล่าสุด</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานะ</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shownSubjects.map((s) => {
                      const st = statusOf(s);
                      // แสดงเฉพาะระดับชั้นที่มีข้อสอบจริง ไม่ต้องไล่โชว์ทุกระดับชั้นให้รก
                      const tagged = gradeLevels
                        .map((g) => ({ label: g.label, count: s.byGrade?.[g.id] || 0 }))
                        .filter((g) => g.count > 0);
                      return (
                        <tr key={s.subjectId} className="hover:bg-orange-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 text-sm">{s.subjectName || `วิชา #${s.subjectId}`}</p>
                            <p className="text-[10px] text-slate-400">#{s.subjectId} · {s.categoryCount} หมวดหมู่</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-bold text-slate-900">{s.total}</span>
                            <span className="text-xs text-slate-400"> ข้อ</span>
                          </td>
                          <td className="px-4 py-3">
                            {s.total > 0 ? (
                              <p className="text-xs text-slate-600">ง่าย {s.easy} · ปานกลาง {s.medium} · ยาก {s.hard}</p>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {tagged.length === 0 && !s.noGrade ? (
                              <span className="text-xs text-slate-300">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {tagged.slice(0, 4).map((g) => (
                                  <span key={g.label} className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-semibold">
                                    {g.label} {g.count}
                                  </span>
                                ))}
                                {tagged.length > 4 && (
                                  <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-semibold">
                                    +{tagged.length - 4}
                                  </span>
                                )}
                                {s.noGrade > 0 && (
                                  <span title="ข้อสอบที่ไม่ได้ระบุระดับชั้น ใช้ได้กับทุกระดับชั้น" className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-semibold">
                                    ทุกระดับชั้น {s.noGrade}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {s.lastUpdatedBy ? (
                              <>
                                <p
                                  className="text-xs text-slate-600 truncate max-w-[160px]"
                                  title={s.contributors?.map((c) => `${c.name} · ${c.count} ข้อ`).join("\n")}
                                >
                                  {s.lastUpdatedBy}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {fmtDate(s.lastUpdatedAt) || "—"}
                                  {s.contributors?.length > 1 ? ` · รวม ${s.contributors.length} คน` : ""}
                                </p>
                              </>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.cls}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openSubjectQuestions(s.subjectId)}
                                disabled={s.total === 0}
                                title="ดูข้อสอบของวิชานี้"
                                className="p-1.5 text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 disabled:opacity-30 transition"
                              >
                                <Eye className="h-3.5 w-3.5" />
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
          )}
        </>
      )}
    </div>
  );
}
