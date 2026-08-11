import { API_URL } from "../config";
import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
    Plus, Search, Edit2, Trash2, X, Check, Eye, Loader2,
    AlertTriangle, Layers, Users, DoorOpen, ChevronDown, Info,
} from "lucide-react";

const API = `${API_URL}/api/admin`;

// ─── Status style map ─────────────────────────────────────────────────────────
const ROOM_STATUS_STYLE = {
    1: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    2: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    3: { bg: "bg-slate-200", text: "text-slate-600", border: "border-slate-300", dot: "bg-slate-400" },
};
const styleOf = (id) => ROOM_STATUS_STYLE[id] || ROOM_STATUS_STYLE[3];

const DAY_NAMES = ["", "อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

// ★ ย้ายมาไว้ตรงนี้ — ระดับโมดูล ใช้ได้ทุก component
const blockNegativeKeys = (e) => {
    if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

// ─── Isometric Room Preview (SVG placeholder — เตรียมต่อยอด Furniture/Facilities) ──
// ─── Isometric Room Preview — โต๊ะครู, แถวโต๊ะนักเรียน, กระดาน, ประตู ──────────
function RoomIsoPreview({ statusId, seed = 0 }) {
    const palettes = [
        ["#FDBA74", "#FB923C", "#EA580C"],
        ["#FCD34D", "#FBBF24", "#D97706"],
    ];
    const isInactive = Number(statusId) === 3;
    const [light, mid, dark] = isInactive ? ["#E2E8F0", "#CBD5E1", "#94A3B8"] : palettes[seed % 2];
    const wood = isInactive ? "#CBD5E1" : "#92400E";
    const woodLight = isInactive ? "#E2E8F0" : "#B45309";

    return (
        <div className="relative flex items-center justify-center h-44 w-full overflow-hidden rounded-t-2xl bg-gradient-to-b from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors">
            <svg viewBox="0 0 200 150" className="h-32 w-32 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105">
                {/* พื้นห้อง isometric */}
                <polygon points="100,25 180,65 100,105 20,65" fill={light} opacity="0.6" />
                <polygon points="20,65 100,105 100,130 20,90" fill={mid} />
                <polygon points="180,65 100,105 100,130 180,90" fill={dark} />
                <polygon points="100,25 180,65 100,105 20,65" fill={light} />

                {/* กระดาน (ผนังด้านหลัง) */}
                <polygon points="65,35 110,58 110,70 65,47" fill="#134E4A" opacity={isInactive ? 0.3 : 0.85} />
                <polygon points="65,35 110,58 108,59 63,36" fill="#0F766E" opacity={isInactive ? 0.3 : 0.85} />

                {/* โต๊ะครู (ใกล้กระดาน) */}
                <rect x="72" y="60" width="16" height="9" rx="1" fill={wood} />
                <rect x="72" y="60" width="16" height="3" rx="1" fill={woodLight} />

                {/* แถวโต๊ะนักเรียน (isometric grid 2x2) */}
                {[
                    [55, 78], [95, 78],
                    [55, 95], [95, 95],
                ].map(([x, y], i) => (
                    <g key={i}>
                        <rect x={x} y={y} width="12" height="8" rx="1" fill={wood} />
                        <rect x={x} y={y} width="12" height="2.5" rx="1" fill={woodLight} />
                        {/* เก้าอี้ */}
                        <rect x={x + 3} y={y + 9} width="6" height="4" rx="1" fill={dark} opacity="0.8" />
                    </g>
                ))}

                {/* ประตู (ด้านขวา) */}
                <rect x="140" y="72" width="9" height="16" rx="1" fill={isInactive ? "#94A3B8" : "#78350F"} />
                <circle cx="146.5" cy="80" r="0.8" fill={light} />
            </svg>
            {isInactive && (
                <span className="absolute inset-0 flex items-center justify-center bg-slate-500/10 backdrop-blur-[1px]">
                    <span className="text-[11px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full">ไม่ใช้งาน</span>
                </span>
            )}
        </div>
    );
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, icon: Icon, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.15s_ease-out]">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-[scaleIn_0.2s_ease-out]">
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

// ─── RoomForm ───────────────────────────────────────────────────────────────
function RoomForm({ initial = {}, statuses, onSave, onCancel, isSubmitting }) {
    const [form, setForm] = useState({
        roomDetail: initial.RoomDetail || "",
        floor: initial.Floor ?? "",
        capacity: initial.Capacity ?? "",
        statusRoomId: initial.Status_Room_Id || (statuses[0]?.Status_Room_Id ?? 1),
    });
    const [errors, setErrors] = useState({});
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.roomDetail.trim()) e.roomDetail = "กรุณากรอกชื่อห้อง";
        if (form.floor === "" || Number(form.floor) < 0 || !Number.isInteger(Number(form.floor)))
            e.floor = "กรุณากรอกชั้นเป็นตัวเลขไม่ติดลบ";
        if (form.capacity !== "" && (Number(form.capacity) < 0 || !Number.isInteger(Number(form.capacity))))
            e.capacity = "ความจุต้องเป็นตัวเลขไม่ติดลบ";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = () => { if (validate()) onSave(form); };

    const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
    const errInp = "border-red-300 focus:ring-red-300";
    const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

    return (
        <div className="space-y-4">
            <div>
                <label className={lbl}>ชื่อห้อง <span className="text-red-400 normal-case">*</span></label>
                <input
                    className={`${inp} ${errors.roomDetail ? errInp : ""}`}
                    value={form.roomDetail}
                    onChange={e => set("roomDetail", e.target.value)}
                    placeholder="เช่น ห้อง 1"
                />
                {errors.roomDetail && <p className="text-xs text-red-500 mt-1">{errors.roomDetail}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={lbl}>ชั้น <span className="text-red-400 normal-case">*</span></label>
                    <select className={`${inp} ${errors.floor ? errInp : ""}`} value={form.floor} onChange={e => set("floor", e.target.value)}>
                        <option value="">เลือกชั้น</option>
                        {Array.from({ length: 3 }, (_, i) => i + 1).map(f => (
                            <option key={f} value={f}>ชั้น {f}</option>
                        ))}
                    </select>
                    {errors.floor && <p className="text-xs text-red-500 mt-1">{errors.floor}</p>}
                </div>
                <div>
                    <label className={lbl}>ความจุ (คน)</label>
                    <input
                        type="number" min="0" step="1" onKeyDown={blockNegativeKeys}
                        className={`${inp} ${errors.capacity ? errInp : ""}`}
                        value={form.capacity}
                        onChange={e => set("capacity", e.target.value)}
                        placeholder="15"
                    />
                    {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
                </div>
            </div>

            <div>
                <label className={lbl}>สถานะห้อง</label>
                <select className={inp} value={form.statusRoomId} onChange={e => set("statusRoomId", e.target.value)}>
                    {statuses.map(s => (
                        <option key={s.Status_Room_Id} value={s.Status_Room_Id}>{s.Status_Room_Name}</option>
                    ))}
                </select>
            </div>

            <div className="flex gap-3 pt-2">
                <button onClick={onCancel} disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
                    ยกเลิก
                </button>
                <button onClick={submit} disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition text-sm shadow-sm">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> บันทึก</>}
                </button>
            </div>
        </div>
    );
}

// ─── ConfirmDelete ─────────────────────────────────────────────────────────
function ConfirmDelete({ room, onConfirm, onCancel, isDeleting }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">ยืนยันการลบห้องเรียน</h3>
                        <p className="text-xs text-slate-400 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
                    <p className="text-sm font-semibold text-red-800">{room.RoomDetail}</p>
                    <p className="text-xs text-red-400 mt-0.5">ชั้น {room.Floor} · ID: #{room.RoomId}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={isDeleting}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
                        ยกเลิก
                    </button>
                    <button onClick={onConfirm} disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 transition text-sm">
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ลบเลย"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── RoomStatusModal — เปลี่ยนสถานะห้อง พร้อมเหตุผล/วันที่คาดว่าจะเปิดใช้ ──
function RoomStatusModal({ room, statuses, onClose, onSaved, showToast }) {
    const [statusRoomId, setStatusRoomId] = useState(room.Status_Room_Id);
    const [reason, setReason] = useState(room.Status_Reason || "");
    const [expectedReopenDate, setExpectedReopenDate] = useState(room.Expected_Reopen_Date?.slice(0, 10) || "");
    const [loading, setLoading] = useState(false);

    const isMaintenance = Number(statusRoomId) === 2;

    const submit = async () => {
        if (isMaintenance && !reason.trim())
            return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณาระบุเหตุผลการปิดปรับปรุง");
        setLoading(true);
        try {
            await axios.patch(`${API}/rooms/${room.RoomId}/status`, {
                statusRoomId,
                reason: isMaintenance ? reason.trim() : null,
                expectedReopenDate: isMaintenance ? (expectedReopenDate || null) : null,
            });
            showToast("success", "เปลี่ยนสถานะห้องสำเร็จ");
            onSaved();
            onClose();
        } catch (e) {
            showToast("error", "เกิดข้อผิดพลาด", e.response?.data?.message);
        } finally { setLoading(false); }
    };

    const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
    const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

    return (
        <Modal title={`เปลี่ยนสถานะ: ${room.RoomDetail}`} icon={AlertTriangle} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className={lbl}>สถานะห้อง</label>
                    <select className={inp} value={statusRoomId} onChange={e => setStatusRoomId(Number(e.target.value))}>
                        {statuses.map(s => (
                            <option key={s.Status_Room_Id} value={s.Status_Room_Id}>{s.Status_Room_Name}</option>
                        ))}
                    </select>
                </div>

                {isMaintenance && (
                    <>
                        <div>
                            <label className={lbl}>เหตุผลการปิดปรับปรุง <span className="text-red-400 normal-case">*</span></label>
                            <textarea
                                rows={3}
                                className={inp}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="เช่น ซ่อมเครื่องปรับอากาศ / ทาสีใหม่..."
                            />
                        </div>
                        <div>
                            <label className={lbl}>วันที่คาดว่าจะเปิดใช้ได้ (ไม่บังคับ)</label>
                            <input
                                type="date"
                                className={inp}
                                value={expectedReopenDate}
                                onChange={e => setExpectedReopenDate(e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} disabled={loading}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
                        ยกเลิก
                    </button>
                    <button onClick={submit} disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition text-sm shadow-sm">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> บันทึก</>}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── RoomCard ────────────────────────────────────────────────────────────────
function RoomCard({ room, index, onEdit, onDelete, onView, onStatusChange }) {
    const st = styleOf(room.Status_Room_Id);
    return (
        <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 overflow-hidden">
            <div className="relative">
                <RoomIsoPreview statusId={room.Status_Room_Id} seed={index} />

                {/* Overlay: สถานะ มุมขวาบน */}
                <span className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm shadow-sm ${st.bg} ${st.text} ${st.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {room.Status_Room_Name || "ไม่ระบุสถานะ"}
                </span>

                {/* Overlay: ชื่อห้อง + ชั้น มุมล่างซ้าย */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pt-8 pb-3 bg-gradient-to-t from-black/50 to-transparent">
                    <p className="font-bold text-white text-sm truncate drop-shadow">{room.RoomDetail}</p>
                    <p className="text-[11px] text-white/80">ชั้น {room.Floor}</p>
                </div>
            </div>

            <div className="p-3">
                <div className="flex items-center justify-center gap-1.5 mb-3 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5 text-orange-400" />
                    {room.Capacity ? `${room.Capacity} ที่นั่ง` : "ไม่ระบุความจุ"}
                </div>

                <div className="flex items-center gap-1.5">
                    <button onClick={() => onView(room)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 active:scale-95 transition-all">
                        <Eye className="h-3.5 w-3.5" /> ดู
                    </button>
                    <button onClick={() => onEdit(room)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 active:scale-95 transition-all">
                        <Edit2 className="h-3.5 w-3.5" /> แก้ไข
                    </button>
                    <button onClick={() => onDelete(room)}
                        className="p-1.5 text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 active:scale-95 transition-all" title="ลบ">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onStatusChange(room)}
                        className="p-1.5 text-slate-500 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 active:scale-95 transition-all" title="เปลี่ยนสถานะ">
                        <AlertTriangle className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function RoomDetailModal({ room, onClose }) {
    const st = styleOf(room.Status_Room_Id);
    const [schedule, setSchedule] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(true);

    useEffect(() => {
        axios.get(`${API}/rooms/${room.RoomId}/schedule`)
            .then(res => setSchedule(res.data))
            .catch(() => setSchedule([]))
            .finally(() => setLoadingSchedule(false));
    }, [room.RoomId]);

    return (
        <Modal title={`ห้องเรียน: ${room.RoomDetail}`} icon={DoorOpen} onClose={onClose}>
            <RoomIsoPreview statusId={room.Status_Room_Id} seed={room.RoomId} />
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">ชั้น</p>
                    <p className="text-sm text-slate-800 font-semibold">{room.Floor}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">ความจุ</p>
                    <p className="text-sm text-slate-800 font-semibold">{room.Capacity ? `${room.Capacity} ที่นั่ง` : "ไม่ระบุ"}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 col-span-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">สถานะ</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {room.Status_Room_Name || "ไม่ระบุสถานะ"}
                    </span>
                </div>
            </div>

            {Number(room.Status_Room_Id) === 2 && (room.Status_Reason || room.Expected_Reopen_Date) && (
                <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    {room.Status_Reason && (
                        <p className="text-xs text-amber-800"><b>เหตุผล:</b> {room.Status_Reason}</p>
                    )}
                    {room.Expected_Reopen_Date && (
                        <p className="text-xs text-amber-700 mt-1">
                            <b>คาดว่าจะเปิดใช้:</b> {new Date(room.Expected_Reopen_Date).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    )}
                </div>
            )}

            {/* ─── ตารางการใช้ห้อง ─── */}
            <div className="mt-5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">ตารางการใช้ห้อง (คาบที่กำลังจะถึง)</p>
                {loadingSchedule ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-orange-400" /></div>
                ) : schedule.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        ยังไม่มีคาบสอนที่จองห้องนี้
                    </p>
                ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {schedule.map(item => (
                            <div key={item.CourseScheduleDetailId} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-center shrink-0 w-14">
                                    <p className="text-[10px] text-slate-400">{DAY_NAMES[item.DayOfWeek]}</p>
                                    <p className="text-xs font-bold text-slate-700">{item.ClassDate?.slice(5).replace("-", "/")}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{item.CourseName}</p>
                                    <p className="text-[11px] text-slate-500">
                                        {item.SubjectName && `${item.SubjectName} · `}
                                        {item.TutorNickname || "ไม่ระบุติวเตอร์"}
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold text-orange-600 shrink-0">{item.StartTime}–{item.EndTime}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminRooms() {
    const { toasts, showToast, removeToast } = useToast();
    const [rooms, setRooms] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterFloor, setFilterFloor] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [deletingRoom, setDeletingRoom] = useState(null);
    const [viewingRoom, setViewingRoom] = useState(null);
    const [statusRoom, setStatusRoom] = useState(null);

    const fetchAll = async () => {
        try {
            const [rRes, sRes] = await Promise.all([
                axios.get(`${API}/rooms`),
                axios.get(`${API}/status-room`),
            ]);
            setRooms(rRes.data);
            setStatuses(sRes.data);
        } catch (e) {
            console.error("fetch rooms error:", e.response?.status, e.response?.data || e.message);
            showToast(
                "error",
                "โหลดข้อมูลห้องเรียนไม่สำเร็จ",
                e.response?.data?.message || `HTTP ${e.response?.status || "?"}: ${e.message}`
            );
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleCreate = async (form) => {
        setIsSubmitting(true);
        try {
            await axios.post(`${API}/rooms`, form);
            showToast("success", "เพิ่มห้องเรียนสำเร็จ!");
            setShowAddModal(false);
            fetchAll();
        } catch (e) {
            showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
        } finally { setIsSubmitting(false); }
    };

    const handleUpdate = async (form) => {
        setIsSubmitting(true);
        try {
            await axios.put(`${API}/rooms/${editingRoom.RoomId}`, form);
            showToast("success", "แก้ไขห้องเรียนสำเร็จ!");
            setEditingRoom(null);
            fetchAll();
        } catch (e) {
            showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
        } finally { setIsSubmitting(false); }
    };

    const handleDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await axios.delete(`${API}/rooms/${deletingRoom.RoomId}`);
            showToast("success", "ลบห้องเรียนสำเร็จ!");
            setDeletingRoom(null);
            fetchAll();
        } catch (e) {
            showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
        } finally { setIsDeleting(false); }
    };

    const floors = [...new Set(rooms.map(r => r.Floor))].sort((a, b) => a - b);

    const matchSearchFn = (r) => {
        const s = search.toLowerCase();
        return !s || (r.RoomDetail || "").toLowerCase().includes(s) || String(r.RoomId).includes(s);
    };
    const matchFloorFn = (r) => filterFloor === "all" || String(r.Floor) === filterFloor;
    const matchStatusFn = (r) => filterStatus === "all" || String(r.Status_Room_Id) === filterStatus;

    const filtered = rooms.filter(r => matchSearchFn(r) && matchFloorFn(r) && matchStatusFn(r));

    const totalCapacity = rooms.reduce((sum, r) => sum + (Number(r.Capacity) || 0), 0);
    const availableCount = rooms.filter(r => Number(r.Status_Room_Id) === 1).length;

    if (loading) return (
        <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลห้องเรียน...</p>
        </div>
    );

    return (
        <div className="space-y-6 mt-[90px] px-4 md:px-0">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">จัดการห้องเรียน</h1>
                    <p className="text-sm text-slate-500 mt-1">เพิ่ม แก้ไข และจัดการห้องเรียนทั้งหมดในระบบ</p>
                </div>
                <button onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm hover:shadow-md transition text-sm active:scale-95">
                    <Plus className="h-4 w-4" /> Add Classroom
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "ห้องเรียนทั้งหมด", value: rooms.length, color: "bg-orange-500", icon: DoorOpen },
                    { label: "ห้องพร้อมใช้งาน", value: availableCount, color: "bg-emerald-500", icon: Check },
                    { label: "ความจุรวมทั้งหมด", value: `${totalCapacity.toLocaleString()}`, color: "bg-amber-500", icon: Users },
                ].map(({ label, value, color, icon: Icon }, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
                        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{label}</p>
                            <p className="text-xl font-black text-slate-900">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่อห้อง, ID..."
                            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
                        />
                    </div>
                    <div className="relative">
                        <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[140px]">
                            <option value="all">ทุกชั้น</option>
                            {floors.map(f => <option key={f} value={f}>ชั้น {f}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[150px]">
                            <option value="all">ทุกสถานะ</option>
                            {statuses.map(s => <option key={s.Status_Room_Id} value={s.Status_Room_Id}>{s.Status_Room_Name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {rooms.length} ห้อง</p>
            </div>

            {filtered.length === 0 ? (
                // ใหม่
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                    <svg viewBox="0 0 200 150" className="h-28 w-28 mx-auto opacity-70">
                        <polygon points="100,25 180,65 100,105 20,65" fill="#E2E8F0" opacity="0.6" />
                        <polygon points="20,65 100,105 100,130 20,90" fill="#CBD5E1" />
                        <polygon points="180,65 100,105 100,130 180,90" fill="#94A3B8" />
                        <polygon points="100,25 180,65 100,105 20,65" fill="#E2E8F0" />
                        <polygon points="65,35 110,58 110,70 65,47" fill="#CBD5E1" opacity="0.5" />
                    </svg>
                    <p className="text-slate-500 font-medium mt-2">ไม่พบห้องเรียนที่ค้นหา</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((room, i) => (
                        <RoomCard key={room.RoomId} room={room} index={i}
                            onEdit={setEditingRoom} onDelete={setDeletingRoom} onView={setViewingRoom}
                            onStatusChange={setStatusRoom} />
                    ))}
                </div>
            )}

            {showAddModal && (
                <Modal title="เพิ่มห้องเรียนใหม่" icon={Plus} onClose={() => setShowAddModal(false)}>
                    <RoomForm statuses={statuses} onSave={handleCreate} onCancel={() => setShowAddModal(false)} isSubmitting={isSubmitting} />
                </Modal>
            )}
            {editingRoom && (
                <Modal title={`แก้ไขห้องเรียน: ${editingRoom.RoomDetail}`} icon={Edit2} onClose={() => setEditingRoom(null)}>
                    <RoomForm initial={editingRoom} statuses={statuses} onSave={handleUpdate} onCancel={() => setEditingRoom(null)} isSubmitting={isSubmitting} />
                </Modal>
            )}
            {deletingRoom && (
                <ConfirmDelete room={deletingRoom} onConfirm={handleDelete} onCancel={() => setDeletingRoom(null)} isDeleting={isDeleting} />
            )}
            {viewingRoom && (
                <RoomDetailModal room={viewingRoom} onClose={() => setViewingRoom(null)} />
            )}
            {statusRoom && (
                <RoomStatusModal
                    room={statusRoom}
                    statuses={statuses}
                    onClose={() => setStatusRoom(null)}
                    onSaved={fetchAll}
                    showToast={showToast}
                />
            )}
        </div>
    );
}