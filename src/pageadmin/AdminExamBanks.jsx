import { API_URL } from "../config";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  FileQuestion, Loader2, Search, AlertTriangle, CheckCircle2,
  RefreshCw, Clock, Users, ChevronDown, ChevronRight,
} from "lucide-react";

// ─── ภาพรวมคลังข้อสอบทุกวิชา (อ่านอย่างเดียว) ───────────────────────────────
// คลังข้อสอบเป็นของ "วิชา" และคนเติมคือติวเตอร์ที่สอนวิชานั้น แอดมินจึงไม่มีทางรู้เลย
// ว่าวิชาไหนคลังยังบางจนจัดชุดสอบไม่ได้ จนกว่าจะไล่เปิดดูทีละวิชา หน้านี้ตอบคำถามเดียว:
// "วิชาไหนยังไม่พร้อม และต้องไปตามใคร"
//
// หน้านี้ไม่แก้ข้อมูลอะไรทั้งสิ้น การเติม/แก้ข้อยังเป็นงานของติวเตอร์ที่หน้าคลังของตัวเอง
const API = `${API_URL}/api/admin`;
const auth = () => {
  const token = localStorage.getItem("student_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// เกณฑ์ว่า "คลังบาง" — ตั้งเป็นค่าเริ่มต้นไว้ 20 ข้อ เพราะชุดสอบมาตรฐานของระบบคือ 20 ข้อ
// คลังที่มีน้อยกว่านี้แปลว่าจัดชุดได้ไม่ถึงหนึ่งชุดเต็ม ๆ ด้วยซ้ำ — แอดมินปรับเลขเองได้
const DEFAULT_THIN = 20;

const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

// "แตะล่าสุดเมื่อไหร่" อ่านง่ายกว่าวันที่ดิบ ๆ เวลาอยากรู้ว่าคลังถูกทิ้งร้างหรือเปล่า
const daysAgo = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff <= 0) return "วันนี้";
  if (diff === 1) return "เมื่อวาน";
  if (diff < 30) return `${diff} วันก่อน`;
  if (diff < 365) return `${Math.floor(diff / 30)} เดือนก่อน`;
  return `${Math.floor(diff / 365)} ปีก่อน`;
};

export default function AdminExamBanks() {
  const { toasts, showToast, removeToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("thin");     // thin | name | updated
  const [onlyNeedsWork, setOnlyNeedsWork] = useState(false);
  const [thin, setThin] = useState(DEFAULT_THIN);
  const [expanded, setExpanded] = useState(null);   // subjectId ที่กางดูรายชื่อคนเติมคลัง

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/question-banks`, auth());
      setSubjects(res.data?.subjects || []);
      setGradeLevels(res.data?.gradeLevels || []);
    } catch (err) {
      showToast("error", "โหลดข้อมูลไม่สำเร็จ", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    subjectCount: subjects.length,
    empty: subjects.filter((s) => s.total === 0).length,
    thinCount: subjects.filter((s) => s.total > 0 && s.total < thin).length,
    totalQuestions: subjects.reduce((a, s) => a + s.total, 0),
  }), [subjects, thin]);

  const shown = useMemo(() => {
    const kw = search.trim().toLowerCase();
    const list = subjects.filter((s) =>
      (!kw || s.subjectName.toLowerCase().includes(kw)) &&
      (!onlyNeedsWork || s.total < thin)
    );
    const sorted = [...list];
    if (sortBy === "name") sorted.sort((a, b) => a.subjectName.localeCompare(b.subjectName, "th"));
    else if (sortBy === "updated") {
      sorted.sort((a, b) => new Date(b.lastUpdatedAt || 0) - new Date(a.lastUpdatedAt || 0));
    } else sorted.sort((a, b) => a.total - b.total);  // คลังบางสุดขึ้นก่อน = สิ่งที่ต้องไปตาม
    return sorted;
  }, [subjects, search, onlyNeedsWork, sortBy, thin]);

  const statusOf = (s) => {
    if (s.total === 0) return { label: "ยังไม่มีข้อเลย", cls: "bg-red-100 text-red-700 border-red-200" };
    if (s.total < thin) return { label: "คลังยังบาง", cls: "bg-amber-100 text-amber-700 border-amber-200" };
    return { label: "พร้อมใช้", cls: "bg-green-100 text-green-700 border-green-200" };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileQuestion className="h-6 w-6 text-orange-500" /> ภาพรวมคลังข้อสอบ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ดูว่าวิชาไหนคลังยังบางเกินกว่าจะเปิดสอบได้ และติวเตอร์คนไหนดูแลคลังนั้นอยู่ — หน้านี้ดูอย่างเดียว การเติมข้อเป็นงานของติวเตอร์
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-slate-600 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> รีเฟรช
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs text-slate-500">วิชาทั้งหมด</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.subjectCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs text-slate-500">ข้อสอบรวมทั้งระบบ</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalQuestions}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-2xl p-4">
          <p className="text-xs text-amber-700">คลังยังบาง</p>
          <p className="text-2xl font-bold text-amber-700 mt-0.5">{stats.thinCount}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-4">
          <p className="text-xs text-red-700">ยังไม่มีข้อเลย</p>
          <p className="text-2xl font-bold text-red-700 mt-0.5">{stats.empty}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อวิชา"
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="thin">เรียง: คลังบางสุดก่อน</option>
          <option value="name">เรียง: ชื่อวิชา</option>
          <option value="updated">เรียง: อัปเดตล่าสุด</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={onlyNeedsWork} onChange={(e) => setOnlyNeedsWork(e.target.checked)} className="accent-orange-500" />
          เฉพาะที่ต้องตาม
        </label>
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          เกณฑ์คลังบาง
          <input
            type="number"
            min={1}
            value={thin}
            onChange={(e) => setThin(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm"
          />
          ข้อ
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl">
          <CheckCircle2 className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">ไม่พบวิชาตามเงื่อนไขที่กรอง</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((s) => {
            const st = statusOf(s);
            const open = expanded === s.subjectId;
            return (
              <div key={s.subjectId} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="min-w-[160px] flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{s.subjectName || `วิชา #${s.subjectId}`}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {s.total} ข้อ · {s.categoryCount} หมวด · ง่าย {s.easy} / ปานกลาง {s.medium} / ยาก {s.hard}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {gradeLevels.map((g) => {
                      const c = s.byGrade?.[g.id] || 0;
                      return (
                        <span
                          key={g.id}
                          title={c === 0 ? `ยังไม่มีข้อที่แท็ก ${g.label}` : `${g.label}: ${c} ข้อ`}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border ${
                            c === 0 ? "bg-slate-50 text-slate-300 border-slate-100" : "bg-blue-50 text-blue-600 border-blue-100"
                          }`}
                        >
                          {g.label} {c}
                        </span>
                      );
                    })}
                    {(s.byGrade?.none || 0) > 0 && (
                      <span title="ข้อที่ไม่ได้ระบุระดับชั้น — ใช้ได้กับทุกระดับชั้น" className="text-[11px] px-2 py-0.5 rounded-lg border bg-slate-100 text-slate-500 border-slate-200">
                        ไม่ระบุชั้น {s.byGrade.none}
                      </span>
                    )}
                  </div>

                  <div className="text-right min-w-[150px]">
                    {s.lastUpdatedAt ? (
                      <>
                        <p className="text-xs text-slate-600 flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3 text-slate-400" /> {daysAgo(s.lastUpdatedAt)}
                          <span className="text-slate-400">({fmtDate(s.lastUpdatedAt)})</span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">โดย {s.lastUpdatedBy || "ไม่ทราบ"}</p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                        <AlertTriangle className="h-3 w-3" /> ยังไม่เคยมีใครเติม
                      </p>
                    )}
                  </div>

                  {s.contributors?.length > 0 && (
                    <button
                      onClick={() => setExpanded(open ? null : s.subjectId)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-orange-600 font-medium"
                    >
                      {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      <Users className="h-3.5 w-3.5" /> {s.contributors.length} คน
                    </button>
                  )}
                </div>

                {open && s.contributors?.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">ใครเติมข้อเข้าคลังวิชานี้บ้าง</p>
                    <div className="space-y-1">
                      {s.contributors.map((c, i) => (
                        <div key={`${c.adminId ?? "unknown"}-${i}`} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700">{c.name}</span>
                          <span className="text-slate-500">
                            {c.count} ข้อ · แตะล่าสุด {daysAgo(c.lastAt) || "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
