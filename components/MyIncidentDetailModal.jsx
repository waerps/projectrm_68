import { useState, useEffect } from "react";
import { X, Loader2, Clock, AlertTriangle, Paperclip, FileText } from "lucide-react";
import { getIncidentDetail, cancelIncident } from "../callapi/callusers_student";
import { getIncidentTypeById, getSeverityMeta } from "../config/incidentTypes";
import { getFileUrl } from "../utils/fileUrl";

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
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

export default function MyIncidentDetailModal({ incidentId, onClose, onCancelled }) {
  const token = localStorage.getItem("student_token");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getIncidentDetail(token, incidentId)
      .then(setData)
      .catch((err) => setError(typeof err === "string" ? err : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [incidentId]);

  const handleCancel = async () => {
    if (!confirm("ยืนยันยกเลิกเรื่องที่แจ้งนี้?")) return;
    setCancelling(true);
    try {
      await cancelIncident(token, incidentId);
      onCancelled?.();
      onClose();
    } catch (err) {
      alert(typeof err === "string" ? err : "ยกเลิกไม่สำเร็จ");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
          <h3 className="text-base font-bold text-white">รายละเอียดที่แจ้ง</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (() => {
            const { incident: i, attachments = [] } = data;
            const type = getIncidentTypeById(i.IncidentTypeId);
            const statusMeta = STATUS_META[i.Status] || STATUS_META.new;
            const canCancel = i.Status === "new";
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusMeta.bg} ${statusMeta.text} border ${statusMeta.border}`}>
                    {statusMeta.label}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(i.Created_at)}
                  </span>
                </div>

                <p className="font-semibold text-slate-900">{type?.label || i.IncidentTypeId}</p>

                <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 border border-slate-200 whitespace-pre-wrap leading-relaxed">
                  {i.Description}
                </p>

                {attachments.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" /> ไฟล์แนบ
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map(att => {
                        const isPdf = att.FilePath.toLowerCase().endsWith(".pdf");
                        return (
                          <a key={att.IncidentAttachmentId} href={getFileUrl(att.FilePath)} target="_blank" rel="noreferrer">
                            {isPdf ? (
                              <span className="flex items-center gap-1.5 h-16 w-24 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                                <FileText className="h-4 w-4 shrink-0" /> PDF
                              </span>
                            ) : (
                              <img src={getFileUrl(att.FilePath)} alt="หลักฐาน" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                            )}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {i.Status === "resolved" || i.Status === "dismissed" ? (
                  <p className="text-xs text-slate-400 italic">เรื่องนี้ปิดแล้ว ไม่สามารถยกเลิกได้</p>
                ) : canCancel ? (
                  <button onClick={handleCancel} disabled={cancelling}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 disabled:opacity-50 transition text-sm">
                    {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                    ยกเลิกเรื่องที่แจ้งนี้
                  </button>
                ) : (
                  <p className="text-xs text-slate-400 italic">ทีมงานเริ่มตรวจสอบแล้ว ไม่สามารถยกเลิกเองได้ — หากต้องการแก้ไข กรุณาติดต่อทีมงานโดยตรง</p>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}