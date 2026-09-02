// src/pageadmin/AdminIncidents.jsx
// ★ Incident Center — ดีไซน์ให้ consistent กับ AdminStudents.jsx (โทนส้ม/amber, การ์ด, modal เดียวกัน)
// Critical ต้องอยู่บนสุดเสมอ — เรียงจาก backend แล้ว (ORDER BY FIELD(Severity,...)) ไม่ต้อง sort ซ้ำฝั่ง client
import { API_URL } from "../config";
import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  AlertOctagon, Loader2, X, Eye, EyeOff, Clock, User, GraduationCap,
  BookOpen, ChevronDown, Filter, UserCheck, MessageSquare, Phone,
} from "lucide-react";
import {
  INCIDENT_CATEGORIES, getIncidentTypeById, getSeverityMeta, SEVERITY,
} from "../config/incidentTypes";

const API = `${API_URL}/api/admin/incidents`;

const STATUS_META = {
  new:        { label: "ใหม่",        bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  in_review:  { label: "กำลังตรวจสอบ", bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  resolved:   { label: "แก้ไขแล้ว",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  dismissed:  { label: "ปิดเรื่อง",    bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200" },
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
    axios.get(`${API}/${incidentId}`)
      .then(r => setData(r.data))
      .catch(() => showToast("error", "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [incidentId]);

  const updateStatus = async (status) => {
    setSaving(true);
    try {
      await axios.patch(`${API}/${incidentId}/status`, { status, note: note.trim() || undefined });
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
  const typeMeta = getIncidentTypeById(i.IncidentTypeId);
  const statusMeta = STATUS_META[i.Status] || STATUS_META.new;

  return (
    <Modal title={`เคส #${String(i.IncidentId).padStart(4, "0")}`} icon={AlertOctagon} onClose={onClose} wide>
      {/* Header summary */}
      <div className={`flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-2xl border ${sevMeta.bg} ${sevMeta.border}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${sevMeta.bg} ${sevMeta.text} border ${sevMeta.border}`}>
              {sevMeta.emoji} {sevMeta.label}
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

// ─── IncidentCard ─────────────────────────────────────────────────────────────
function IncidentCard({ incident, onView }) {
  const sevMeta = getSeverityMeta(incident.Severity);
  const typeMeta = getIncidentTypeById(incident.IncidentTypeId);
  const statusMeta = STATUS_META[incident.Status] || STATUS_META.new;

  return (
    <div onClick={() => onView(incident.IncidentId)}
      className={`bg-white rounded-2xl border p-4 cursor-pointer transition hover:shadow-md ${
        incident.Severity === SEVERITY.CRITICAL ? "border-red-300 ring-1 ring-red-100" : "border-slate-200"
      }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${sevMeta.bg} ${sevMeta.text} border ${sevMeta.border}`}>
              {sevMeta.emoji} {sevMeta.label}
            </span>
            <span className="text-[11px] text-slate-400">#{String(incident.IncidentId).padStart(4, "0")}</span>
          </div>
          <p className="font-semibold text-sm text-slate-900">{typeMeta?.label || incident.IncidentTypeId}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 flex-wrap">
            <span>ผู้แจ้ง: {incident.ReporterRole === "student" ? "นักเรียน" : "ติวเตอร์"}</span>
            {incident.TutorFirstname && <span>เกี่ยวข้องกับ: {incident.TutorFirstname} {incident.TutorLastname}</span>}
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(incident.Created_at)}</span>
          </div>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusMeta.bg} ${statusMeta.text} border ${statusMeta.border}`}>
          {statusMeta.label}
        </span>
      </div>
      {incident.Severity === SEVERITY.CRITICAL && incident.Status === "new" && (
        <p className="mt-2.5 text-xs font-bold text-red-600 flex items-center gap-1.5">
          <AlertOctagon className="h-3.5 w-3.5" /> ต้องตรวจสอบทันที
        </p>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminIncidents() {
  const { toasts, showToast, removeToast } = useToast();
  const [summary, setSummary] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewId, setViewId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterSeverity !== "all") params.severity = filterSeverity;
      if (filterStatus !== "all") params.status = filterStatus;
      const res = await axios.get(API, { params });
      setSummary(res.data.summary);
      setIncidents(res.data.incidents);
    } catch (e) {
      showToast("error", "โหลดข้อมูลไม่สำเร็จ");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [filterSeverity, filterStatus]);

  const SEVERITY_CARDS = [
    { key: SEVERITY.CRITICAL, ...getSeverityMeta(SEVERITY.CRITICAL) },
    { key: SEVERITY.HIGH, ...getSeverityMeta(SEVERITY.HIGH) },
    { key: SEVERITY.MEDIUM, ...getSeverityMeta(SEVERITY.MEDIUM) },
    { key: SEVERITY.LOW, ...getSeverityMeta(SEVERITY.LOW) },
  ];

  return (
    <div className="space-y-6 mt-[90px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <AlertOctagon className="h-6 w-6 text-red-500" /> Incident Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">ศูนย์รับแจ้งปัญหาและเหตุการณ์สำคัญ</p>
      </div>

      {/* Severity summary — คลิกเพื่อ filter ได้เลย */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SEVERITY_CARDS.map(s => (
          <button key={s.key}
            onClick={() => setFilterSeverity(filterSeverity === s.key ? "all" : s.key)}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm hover:shadow-md transition text-left ${
              filterSeverity === s.key ? `${s.bg} ${s.border} ring-2 ${s.ring}` : "bg-white border-slate-100"
            }`}>
            <div className={`h-10 w-10 rounded-xl ${s.solidBg} flex items-center justify-center shrink-0 text-lg`}>
              {s.emoji}
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-xl font-black text-slate-900">{summary[s.key] ?? 0}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer">
            <option value="all">ทุกสถานะ</option>
            {Object.entries(STATUS_META).map(([key, m]) => (
              <option key={key} value={key}>{m.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        {(filterSeverity !== "all" || filterStatus !== "all") && (
          <button onClick={() => { setFilterSeverity("all"); setFilterStatus("all"); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition">
            <X className="h-3.5 w-3.5" /> ล้างตัวกรอง
          </button>
        )}
        <p className="text-xs text-slate-400 ml-auto">แสดง {incidents.length} เคส</p>
      </div>

      {/* List — เรียง severity มาจาก backend แล้ว (Critical บนสุดเสมอ) */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-6xl mb-3">✅</div>
          <p className="text-slate-500 font-medium">ไม่มีเคสในหมวดนี้</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map(inc => (
            <IncidentCard key={inc.IncidentId} incident={inc} onView={setViewId} />
          ))}
        </div>
      )}

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