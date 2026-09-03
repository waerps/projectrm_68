import { useState, useEffect } from "react";
import { AlertOctagon, Loader2, Clock, EyeOff, Inbox } from "lucide-react";
import { getMyIncidents } from "../callapi/callusers_student";
import { getIncidentTypeById, getSeverityMeta } from "../config/incidentTypes";

const STATUS_META = {
  new: { label: "รอตรวจสอบ", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  in_review: { label: "กำลังตรวจสอบ", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  resolved: { label: "ดำเนินการเสร็จสิ้น", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  dismissed: { label: "ไม่ดำเนินการ", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("th-TH", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

function IncidentCard({ incident }) {
  const type = getIncidentTypeById(incident.IncidentTypeId);
  const severityMeta = getSeverityMeta(incident.Severity);
  const statusMeta = STATUS_META[incident.Status] || STATUS_META.new;
  const SeverityIcon = severityMeta?.icon || AlertOctagon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-xl ${severityMeta?.solidBg || "bg-slate-400"} flex items-center justify-center shrink-0`}>
          <SeverityIcon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-semibold text-sm text-slate-900">
              {type?.label || incident.IncidentTypeId}
            </p>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">{incident.Description}</p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> แจ้งเมื่อ {formatDate(incident.Created_at)}
            </span>
            {incident.Updated_at && (
              <span>อัปเดตล่าสุด {formatDate(incident.Updated_at)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyIncidents() {
  const token = localStorage.getItem("student_token");
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyIncidents(token)
      .then(setIncidents)
      .catch((err) => setError(typeof err === "string" ? err : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-600">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">กำลังโหลดประวัติการแจ้งเรื่อง...</p>
      </div>
    );
  }

  if (error) {
    return <div className="mt-[90px] rounded-xl bg-red-50 p-10 text-center font-medium text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 mt-[90px]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ประวัติการแจ้งเรื่อง</h1>
        <p className="text-sm text-slate-500 mt-1">รายการที่คุณเคยแจ้งไปและความคืบหน้าปัจจุบัน</p>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">ยังไม่มีเรื่องที่แจ้งไป</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((i) => (
            <IncidentCard key={i.IncidentId} incident={i} />
          ))}
        </div>
      )}
    </div>
  );
}