import { useState, useEffect } from "react";
import { Loader2, Inbox, Clock, EyeOff } from "lucide-react";
import { getMyIncidents, getIncidentsAgainstMe } from "../callapi/callusers_student";
import { getIncidentTypeById, getSeverityMeta } from "../config/incidentTypes";
import { getFileUrl } from "../utils/fileUrl";
import { Paperclip, FileText } from "lucide-react";
import MyIncidentDetailModal from "../components/MyIncidentDetailModal";
import SegmentedControl from "../components/ui/SegmentedControl";
import { PAGE_TITLE, PAGE_SUBTITLE } from "../components/ui/tokens";
import UIEmptyState from "../components/ui/EmptyState";
import { Inbox as LuInbox } from "lucide-react";
import ErrorState from "../components/ui/ErrorState";
import Spinner from "../components/ui/Spinner";

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

function IncidentCard({ incident, showReporter, onClick }) {
    const type = getIncidentTypeById(incident.IncidentTypeId);
    const severityMeta = getSeverityMeta(incident.Severity);
    const statusMeta = STATUS_META[incident.Status] || STATUS_META.new;
    const SeverityIcon = severityMeta?.icon;

    return (
        <button onClick={onClick} disabled={!onClick} className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition disabled:cursor-default">
            <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl ${severityMeta?.solidBg || "bg-slate-400"} flex items-center justify-center shrink-0`}>
                    {SeverityIcon && <SeverityIcon className="h-5 w-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-slate-900">
                            {type?.label || incident.IncidentTypeId}
                        </p>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                            {statusMeta.label}
                        </span>
                    </div>

                    {showReporter && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            {incident.IsAnonymous ? (
                                <><EyeOff className="h-3 w-3" /> ไม่เปิดเผยผู้แจ้ง</>
                            ) : (
                                <>ผู้แจ้ง: {incident.ReporterFirstname ? `${incident.ReporterFirstname} ${incident.ReporterLastname}` : "ไม่ระบุ"}</>
                            )}
                        </p>
                    )}

                    <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 break-words">{incident.Description}</p>

                    {incident.Attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {incident.Attachments.map((att) => {
                                const isPdf = att.url.toLowerCase().endsWith(".pdf");

                                return (
                                    <a
                                        key={att.id}
                                        href={getFileUrl(att.url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1.5"
                                    >
                                        {isPdf ? (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 hover:border-orange-300">
                                                <FileText className="h-3 w-3" /> เอกสาร
                                            </span>
                                        ) : (
                                            <img
                                                src={getFileUrl(att.url)}
                                                alt="หลักฐานแนบ"
                                                className="h-14 w-14 rounded-lg object-cover border border-slate-200 hover:border-orange-300 transition"
                                            />
                                        )}
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> แจ้งเมื่อ {formatDate(incident.Created_at)}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}

function EmptyState({ text }) {
    // ใช้หน้าว่างกลางของระบบ (components/ui/EmptyState)
    return <UIEmptyState icon={LuInbox} title={text} />;
}

export default function TutorIncidents() {
    const token = localStorage.getItem("student_token");
    const [tab, setTab] = useState("mine"); // 'mine' | 'against'
    const [mine, setMine] = useState([]);
    const [against, setAgainst] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState(null);

    const load = () => {
        Promise.all([getMyIncidents(token), getIncidentsAgainstMe(token)])
            .then(([mineData, againstData]) => {
                setMine(mineData);
                setAgainst(againstData);
            })
            .catch((err) => setError(typeof err === "string" ? err : "โหลดข้อมูลไม่สำเร็จ"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [token]);

    if (loading) {
        return (
            <Spinner block label="กำลังโหลดข้อมูล..." />
        );
    }

    if (error) {
        return <ErrorState />;
    }

    const list = tab === "mine" ? mine : against;

    return (
        <div className="space-y-6 px-4 lg:px-0">
            <div>
                <h1 className={PAGE_TITLE}>รายการแจ้งเหตุการณ์</h1>
                <p className={PAGE_SUBTITLE}>เรื่องที่คุณแจ้งไป และเรื่องที่ถูกแจ้งเกี่ยวกับคุณ</p>
            </div>

            <SegmentedControl className="w-full sm:w-fit" value={tab} onChange={setTab} options={[
                { id: "mine", label: "เรื่องที่ฉันแจ้ง", count: mine.length },
                { id: "against", label: "เรื่องที่ถูกแจ้งเกี่ยวกับฉัน", count: against.length },
            ]} />

            {list.length === 0 ? (
                <EmptyState text={tab === "mine" ? "ยังไม่มีเรื่องที่แจ้งไป" : "ยังไม่มีเรื่องที่ถูกแจ้งเกี่ยวกับคุณ"} />
            ) : (
                <div className="space-y-3">
                    {list.map((i) => (
                        <IncidentCard
                            key={i.IncidentId}
                            incident={i}
                            showReporter={tab === "against"}
                            onClick={tab === "mine" ? () => setSelectedId(i.IncidentId) : undefined}
                        />
                    ))}
                </div>
            )}

            {selectedId && (
                <MyIncidentDetailModal
                    incidentId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onCancelled={load}
                />
            )}
        </div>
    );
}