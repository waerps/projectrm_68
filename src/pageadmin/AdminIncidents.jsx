// src/pageadmin/AdminIncidents.jsx
// ★ Incident Center — รีดีไซน์ให้ consistent กับ AdminStudents.jsx ทุกจุด
//   (ค้นหา, dropdown filter, ตาราง, pagination, ปุ่มดูข้อมูล, ไม่มี emoji)
import { API_URL } from "../config";
import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  AlertOctagon, Loader2, X, Eye, EyeOff, Clock, User, GraduationCap,
  BookOpen, ChevronDown, ChevronLeft, ChevronRight, UserCheck,
  MessageSquare, Phone, Search, CheckCircle2,
} from "lucide-react";
import {
  INCIDENT_CATEGORIES, getIncidentTypeById, getSeverityMeta, SEVERITY,
} from "../config/incidentTypes";

const API = `${API_URL}/api/admin/incidents`;
const ITEMS_PER_PAGE = 12;

// ★ แก้ 401: incidents route บังคับ authRequired+requireRole('admin')
// ต่างจาก AdminStudents/AdminCourses เดิมที่ backend ไม่บังคับ auth
// ใช้ key เดียวกับที่ AdminTutors.jsx ใช้ (getAdminAuthConfig)
const getAdminAuthConfig = () => {
  const token = localStorage.getItem("student_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const STATUS_META = {
  new: { label: "ใหม่", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  in_review: { label: "กำลังตรวจสอบ", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  resolved: { label: "แก้ไขแล้ว", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  dismissed: { label: "ปิดเรื่อง", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
};

const formatDateTime = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("th-TH", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

// ─── Modal (โครงเดียวกับ AdminStudents.jsx) ──────────────────────────────────
function Modal({ title, icon: Icon, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col w-full ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
          <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <Icon className="h-4 w-4 text-white" />
              </span>
            )}
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── IncidentDetailModal ──────────────────────────────────────────────────────
function IncidentDetailModal({ incidentId, onClose, showToast, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  const load = () => {
    setLoading(true);
    axios.get(`${API}/${incidentId}`, getAdminAuthConfig())
      .then(r => setData(r.data))
      .catch(() => showToast("error", "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [incidentId]);

  const updateStatus = async (status) => {
    setSaving(true);
    try {
      await axios.patch(`${API}/${incidentId}/status`, { status, note: note.trim() || undefined }, getAdminAuthConfig());
      showToast("success", "อัปเดตสถานะสำเร็จ");
      setNote("");
      load();
      onUpdated?.();
    } catch (err) {
      showToast("error", "อัปเดตไม่สำเร็จ", err.response?.data?.message);
    } finally { setSaving(false); }
  };

  if (loading) return (
    <Modal title="รายละเอียดเคส" icon={AlertOctagon} onClose={onClose} wide>
      <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
    </Modal>
  );
  if (!data) return null;

  const { incident: i, history } = data;
  const sevMeta = getSeverityMeta(i.Severity);
  const SevIcon = sevMeta.icon;
  const typeMeta = getIncidentTypeById(i.IncidentTypeId);
  const statusMeta = STATUS_META[i.Status] || STATUS_META.new;

  return (
    <Modal title={`เคส #${String(i.IncidentId).padStart(4, "0")}`} icon={AlertOctagon} onClose={onClose} wide>
      {/* Header summary */}
      <div className={`flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-2xl border ${sevMeta.bg} ${sevMeta.border}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sevMeta.bg} ${sevMeta.text} border ${sevMeta.border}`}>
              <SevIcon className="h-3.5 w-3.5" /> {sevMeta.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusMeta.bg} ${statusMeta.text} border ${statusMeta.border}`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="font-semibold text-slate-900">{typeMeta?.label || i.IncidentTypeId}</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDateTime(i.Created_at)}
          </p>
        </div>
      </div>

      {/* ผู้แจ้ง */}
      <div className="mb-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> ผู้แจ้ง
        </p>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-slate-900">
              {i.ReporterNickname || `${i.ReporterFirstname} ${i.ReporterLastname}`}
              <span className="ml-2 text-xs font-normal text-slate-400">
                ({i.ReporterRole === "student" ? "นักเรียน" : "ติวเตอร์"})
              </span>
            </p>
            {i.IsAnonymous ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[11px] font-semibold">
                <EyeOff className="h-3 w-3" /> ไม่เปิดเผยตัวตน (คู่กรณีไม่เห็น)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-semibold">
                <Eye className="h-3 w-3" /> เปิดเผยตัวตน
              </span>
            )}
          </div>
          {i.ReporterPhoneNo && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> {i.ReporterPhoneNo}
            </p>
          )}
        </div>
      </div>

      {/* คู่กรณี/ที่เกี่ยวข้อง */}
      {(i.TutorFirstname || i.CourseName) && (
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5" /> เกี่ยวข้องกับ
          </p>
          <div className="flex flex-wrap gap-2">
            {i.TutorFirstname && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-semibold">
                <GraduationCap className="h-3.5 w-3.5" /> {i.TutorFirstname} {i.TutorLastname}
              </span>
            )}
            {i.CourseName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                <BookOpen className="h-3.5 w-3.5" /> {i.CourseName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* รายละเอียด */}
      <div className="mb-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" /> รายละเอียด
        </p>
        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 border border-slate-200 whitespace-pre-wrap leading-relaxed">
          {i.Description}
        </p>
      </div>

      {/* Timeline */}
      {history.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">ประวัติการดำเนินการ</p>
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.IncidentStatusHistoryId} className="flex items-start gap-3 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-slate-600">
                    <span className="font-semibold">{STATUS_META[h.FromStatus]?.label || h.FromStatus || "เริ่มต้น"}</span>
                    {" → "}
                    <span className="font-semibold">{STATUS_META[h.ToStatus]?.label || h.ToStatus}</span>
                    {h.ChangedByFirstname && <span className="text-slate-400"> โดย {h.ChangedByFirstname}</span>}
                  </p>
                  {h.Note && <p className="text-slate-400 mt-0.5">{h.Note}</p>}
                  <p className="text-slate-300">{formatDateTime(h.Created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)..."
          rows={2}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition resize-none"
        />
        <div className="flex flex-wrap gap-2">
          {i.Status !== "in_review" && (
            <button onClick={() => updateStatus("in_review")} disabled={saving}
              className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition">
              เริ่มตรวจสอบ
            </button>
          )}
          {i.Status !== "resolved" && (
            <button onClick={() => updateStatus("resolved")} disabled={saving}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition">
              แก้ไขแล้ว
            </button>
          )}
          {i.Status !== "dismissed" && (
            <button onClick={() => updateStatus("dismissed")} disabled={saving}
              className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 disabled:opacity-50 transition">
              ปิดเรื่อง
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminIncidents() {
  const { toasts, showToast, removeToast } = useToast();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewId, setViewId] = useState(null);

  // ★ ดึงข้อมูลครั้งเดียว (ไม่ผูก severity/status กับ backend params) แล้วกรองฝั่ง client
  //   เหมือนแพทเทิร์นของ AdminStudents.jsx เพื่อให้ตัวนับใน dropdown/การ์ดอัปเดตแบบ realtime
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, getAdminAuthConfig());
      setIncidents(res.data.incidents);
    } catch (e) {
      showToast("error", "โหลดข้อมูลไม่สำเร็จ");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterSeverity, filterStatus]);

  const SEVERITY_ORDER = [SEVERITY.CRITICAL, SEVERITY.HIGH, SEVERITY.MEDIUM, SEVERITY.LOW];

  const matchSearchFn = (inc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const typeMeta = getIncidentTypeById(inc.IncidentTypeId);
    const reporterName = (inc.ReporterNickname || `${inc.ReporterFirstname || ""} ${inc.ReporterLastname || ""}`).toLowerCase();
    const tutorName = `${inc.TutorFirstname || ""} ${inc.TutorLastname || ""}`.toLowerCase();
    return (
      String(inc.IncidentId).includes(q) ||
      reporterName.includes(q) ||
      tutorName.includes(q) ||
      (typeMeta?.label || "").toLowerCase().includes(q) ||
      (inc.CourseName || "").toLowerCase().includes(q)
    );
  };
  const matchSeverityFn = (inc) => filterSeverity === "all" || inc.Severity === filterSeverity;
  const matchStatusFn = (inc) => filterStatus === "all" || inc.Status === filterStatus;

  const filtered = incidents
    .filter(inc => matchSearchFn(inc) && matchSeverityFn(inc) && matchStatusFn(inc))
    // Critical ต้องอยู่บนสุดเสมอ — เรียงตาม severity ก่อน แล้วค่อยตามวันที่ล่าสุด
    .sort((a, b) => {
      const sevDiff = SEVERITY_ORDER.indexOf(a.Severity) - SEVERITY_ORDER.indexOf(b.Severity);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.Created_at) - new Date(a.Created_at);
    });

  // ★ นับจำนวนสำหรับการ์ด/สรุปด้านบน (ไม่ผูกกับ filter อื่น เพื่อให้เห็นภาพรวมทั้งหมดเสมอ)
  const summary = SEVERITY_ORDER.reduce((acc, key) => {
    acc[key] = incidents.filter(inc => inc.Severity === key).length;
    return acc;
  }, {});

  // ★ นับจำนวนสำหรับ dropdown ความรุนแรง (กรองตามค้นหา+สถานะที่เลือกไว้ก่อน)
  const baseForSeverityCount = incidents.filter(inc => matchSearchFn(inc) && matchStatusFn(inc));
  const allSeverityCount = baseForSeverityCount.length;
  const severityCounts = SEVERITY_ORDER.reduce((acc, key) => {
    acc[key] = baseForSeverityCount.filter(inc => inc.Severity === key).length;
    return acc;
  }, {});

  // ★ นับจำนวนสำหรับ dropdown สถานะ (กรองตามค้นหา+ความรุนแรงที่เลือกไว้ก่อน)
  const baseForStatusCount = incidents.filter(inc => matchSearchFn(inc) && matchSeverityFn(inc));
  const allStatusCount = baseForStatusCount.length;
  const statusCounts = Object.keys(STATUS_META).reduce((acc, key) => {
    acc[key] = baseForStatusCount.filter(inc => inc.Status === key).length;
    return acc;
  }, {});

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const SEVERITY_CARDS = SEVERITY_ORDER.map(key => ({ key, ...getSeverityMeta(key) }));

  if (loading) return (
    <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-600">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลเคส...</p>
    </div>
  );

  return (
    <div className="space-y-6 mt-[90px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ศูนย์รับแจ้งปัญหา</h1>
        <p className="text-sm text-slate-500 mt-1">จัดการปัญหาที่ได้รับแจ้งจากผู้ใช้งาน</p>
      </div>

      {/* Stats — คลิกเพื่อ filter ตามความรุนแรงได้เหมือนเดิม */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SEVERITY_CARDS.map(s => {
          const Icon = s.icon;
          const active = filterSeverity === s.key;
          return (
            <button key={s.key}
              onClick={() => setFilterSeverity(active ? "all" : s.key)}
              className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm hover:shadow-md transition text-left ${active ? `${s.bg} ${s.border} ring-2 ${s.ring}` : "bg-white border-slate-100"
                }`}>
              <div className={`h-10 w-10 rounded-xl ${s.solidBg} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className="text-xl font-black text-slate-900">{summary[s.key] ?? 0}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter — โครงเดียวกับ AdminStudents.jsx */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาเลขที่เคส, ผู้แจ้ง, ประเภทปัญหา, ติวเตอร์, คอร์ส..."
              className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="relative md:min-w-[180px]">
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
              className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition cursor-pointer">
              <option value="all">ทุกระดับความรุนแรง ({allSeverityCount})</option>
              {SEVERITY_CARDS.map(s => (
                <option key={s.key} value={s.key}>
                  {s.label} ({severityCounts[s.key] || 0})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative md:min-w-[180px]">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition cursor-pointer">
              <option value="all">ทุกสถานะ ({allStatusCount})</option>
              {Object.entries(STATUS_META).map(([key, m]) => (
                <option key={key} value={key}>
                  {m.label} ({statusCounts[key] || 0})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          {(filterSeverity !== "all" || filterStatus !== "all" || search) && (
            <button
              onClick={() => { setFilterSeverity("all"); setFilterStatus("all"); setSearch(""); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition">
              <X className="h-3.5 w-3.5" /> ล้างตัวกรอง
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {incidents.length} เคส</p>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <CheckCircle2 className="h-14 w-14 text-emerald-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">ไม่มีเคสในหมวดนี้</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">เคส</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ผู้แจ้ง</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">เกี่ยวข้องกับ</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ความรุนแรง</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานะ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(inc => {
                  const sevMeta = getSeverityMeta(inc.Severity);
                  const SevIcon = sevMeta.icon;
                  const typeMeta = getIncidentTypeById(inc.IncidentTypeId);
                  const statusMeta = STATUS_META[inc.Status] || STATUS_META.new;
                  const needsUrgentReview = inc.Severity === SEVERITY.CRITICAL && inc.Status === "new";
                  const reporterName = inc.ReporterNickname || `${inc.ReporterFirstname} ${inc.ReporterLastname}`;

                  return (
                    <tr key={inc.IncidentId}
                      className={`hover:bg-orange-50/40 transition-colors ${needsUrgentReview ? "bg-red-50/40" : ""}`}>
                      {/* คอลัมน์: เคส */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl ${sevMeta.solidBg} flex items-center justify-center shrink-0`}>
                            <SevIcon className="h-4.5 w-4.5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">{typeMeta?.label || inc.IncidentTypeId}</p>
                            <p className="text-[10px] text-slate-400">#{String(inc.IncidentId).padStart(4, "0")}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {formatDateTime(inc.Created_at)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* คอลัมน์: ผู้แจ้ง */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 truncate max-w-[160px]">{reporterName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {inc.ReporterRole === "student" ? "นักเรียน" : "ติวเตอร์"}
                          </span>
                          {inc.IsAnonymous && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-semibold">
                              <EyeOff className="h-3 w-3" /> ไม่เปิดเผยตัวตน
                            </span>
                          )}
                        </div>
                      </td>

                      {/* คอลัมน์: เกี่ยวข้องกับ */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {inc.TutorFirstname && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-semibold">
                              <GraduationCap className="h-3 w-3" /> {inc.TutorFirstname} {inc.TutorLastname}
                            </span>
                          )}
                          {inc.CourseName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-semibold">
                              <BookOpen className="h-3 w-3" /> {inc.CourseName}
                            </span>
                          )}
                          {!inc.TutorFirstname && !inc.CourseName && (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </div>
                        {needsUrgentReview && (
                          <p className="mt-1.5 text-[10px] font-bold text-red-600 flex items-center gap-1">
                            <AlertOctagon className="h-3 w-3" /> ต้องตรวจสอบทันที
                          </p>
                        )}
                      </td>

                      {/* คอลัมน์: ความรุนแรง */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${sevMeta.bg} ${sevMeta.text} border ${sevMeta.border}`}>
                          {sevMeta.label}
                        </span>
                      </td>

                      {/* คอลัมน์: สถานะ */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusMeta.bg} ${statusMeta.text} border ${statusMeta.border}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* คอลัมน์: ปุ่มจัดการ */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setViewId(inc.IncidentId)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> ดูข้อมูล
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

      {/* Pagination — โครงเดียวกับ AdminStudents.jsx */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            แสดง <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> จาก <span className="font-semibold">{filtered.length}</span> เคส
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) => p === "..." ? (
                <span key={`d${idx}`} className="flex h-9 w-9 items-center justify-center text-slate-400 text-sm">…</span>
              ) : (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === p ? "bg-orange-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600"}`}>
                  {p}
                </button>
              ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {viewId && (
        <IncidentDetailModal
          incidentId={viewId}
          onClose={() => setViewId(null)}
          showToast={showToast}
          onUpdated={fetchAll}
        />
      )}
    </div>
  );
}