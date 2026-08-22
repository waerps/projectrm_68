import { API_URL } from "../config";
import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
    Plus, Search, Edit2, Trash2, X, Check, Eye, Loader2,
    AlertTriangle, ChevronDown, Package, Cpu, Printer, Sofa,
    Refrigerator, PenTool, FileText, MapPin, History, Minus,
    TrendingDown, TrendingUp, Boxes, AlertCircle,
} from "lucide-react";

const API = `${API_URL}/api/admin`;

// ─── Status style map (พร้อมใช้งาน / ชำรุด / กำลังซ่อม / หมด) ────────────────
const STATUS_STYLE = {
    1: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    2: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
    3: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    4: { bg: "bg-slate-200", text: "text-slate-600", border: "border-slate-300", dot: "bg-slate-400" },
};
const styleOf = (id) => STATUS_STYLE[id] || STATUS_STYLE[4];

// ─── Category icon map — จับคู่ตามชื่อหมวดหมู่จริง (ไม่ hardcode id) ────────
const CATEGORY_ICON_MAP = [
    { keys: ["อิเล็กทรอนิกส์", "กล้อง", "คอม"], icon: Cpu },
    { keys: ["สำนักงาน", "ปริ้น", "เครื่องพิมพ์"], icon: Printer },
    { keys: ["เฟอร์นิเจอร์", "โต๊ะ", "เก้าอี้", "โซฟา"], icon: Sofa },
    { keys: ["ไฟฟ้า", "แอร์", "ตู้เย็น", "พัดลม"], icon: Refrigerator },
    { keys: ["การเรียน", "ปากกา", "ดินสอ", "สี", "กระดาน"], icon: PenTool },
    { keys: ["สิ้นเปลือง", "กระดาษ", "สมุด"], icon: FileText },
];
function iconForCategory(name = "") {
    const n = name.toLowerCase();
    return CATEGORY_ICON_MAP.find(c => c.keys.some(k => n.includes(k)))?.icon || Package;
}

const blockNegativeKeys = (e) => {
    if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

const TRACKING_LABEL = { asset: "ทรัพย์สิน", consumable: "วัสดุสิ้นเปลือง" };

// ─── Modal wrapper ─────────────────────────────────────────────────────────
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

// ─── CommonFacilityForm — เพิ่ม/แก้ไข ─────────────────────────────────────
// สร้างใหม่: กรอกจำนวนเริ่มต้น + สถานะเริ่มต้นได้
// แก้ไข: ไม่แตะจำนวน/สถานะตรงนี้ — ให้ปรับผ่านปุ่มเฉพาะ (มี log เก็บประวัติ)
function CommonFacilityForm({ initial = {}, categories, statuses, onSave, onCancel, isSubmitting }) {
    const isEdit = Boolean(initial.CommonFacilityId);
    const [form, setForm] = useState({
        name: initial.Name || "",
        categoryId: initial.CategoryId || (categories[0]?.CategoryId ?? ""),
        quantity: initial.Quantity ?? "0",
        unit: initial.Unit || "ชิ้น",
        statusId: initial.StatusId || (statuses[0]?.Status_Id ?? 1),
        location: initial.Location || "",
        detail: initial.Detail || "",
        trackingType: initial.TrackingType || "asset",
        minQuantity: initial.MinQuantity ?? "",
    });
    const [errors, setErrors] = useState({});
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "กรุณากรอกชื่ออุปกรณ์";
        if (!form.categoryId) e.categoryId = "กรุณาเลือกหมวดหมู่";
        if (!isEdit && (form.quantity === "" || Number(form.quantity) < 0 || !Number.isInteger(Number(form.quantity))))
            e.quantity = "จำนวนต้องเป็นตัวเลขไม่ติดลบ";
        if (!form.unit.trim()) e.unit = "กรุณาระบุหน่วยนับ";
        if (form.trackingType === "consumable" && form.minQuantity !== "" &&
            (Number(form.minQuantity) < 0 || !Number.isInteger(Number(form.minQuantity))))
            e.minQuantity = "จำนวนขั้นต่ำต้องเป็นตัวเลขไม่ติดลบ";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = () => {
        if (!validate()) return;
        onSave({
            name: form.name.trim(),
            categoryId: form.categoryId,
            unit: form.unit.trim(),
            location: form.location.trim(),
            detail: form.detail.trim(),
            trackingType: form.trackingType,
            minQuantity: form.trackingType === "consumable" ? form.minQuantity : "",
            ...(isEdit ? {} : { quantity: form.quantity, statusId: form.statusId }),
        });
    };

    const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
    const errInp = "border-red-300 focus:ring-red-300";
    const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

    return (
        <div className="space-y-4">
            <div>
                <label className={lbl}>ชื่ออุปกรณ์ <span className="text-red-400 normal-case">*</span></label>
                <input
                    className={`${inp} ${errors.name ? errInp : ""}`}
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="เช่น เครื่องปริ้นเตอร์, กระดาษ A4"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
                <label className={lbl}>ลักษณะการนับ</label>
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => set("trackingType", "asset")}
                        className={`py-2 rounded-lg text-xs font-bold border transition ${form.trackingType === "asset"
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                        ทรัพย์สิน (นับเป็นชิ้น)
                    </button>
                    <button type="button" onClick={() => set("trackingType", "consumable")}
                        className={`py-2 rounded-lg text-xs font-bold border transition ${form.trackingType === "consumable"
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                        วัสดุสิ้นเปลือง (มีเบิกใช้)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={lbl}>หมวดหมู่ <span className="text-red-400 normal-case">*</span></label>
                    <select className={`${inp} ${errors.categoryId ? errInp : ""}`} value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                        {categories.map(c => (
                            <option key={c.CategoryId} value={c.CategoryId}>{c.Category_Name}</option>
                        ))}
                    </select>
                    {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
                </div>
                <div>
                    <label className={lbl}>หน่วยนับ <span className="text-red-400 normal-case">*</span></label>
                    <input
                        className={`${inp} ${errors.unit ? errInp : ""}`}
                        value={form.unit}
                        onChange={e => set("unit", e.target.value)}
                        placeholder="ชิ้น, เครื่อง, เส้น, ริม"
                    />
                    {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
                </div>
            </div>

            {!isEdit && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={lbl}>จำนวนเริ่มต้น <span className="text-red-400 normal-case">*</span></label>
                        <input
                            type="number" min="0" step="1" onKeyDown={blockNegativeKeys}
                            className={`${inp} ${errors.quantity ? errInp : ""}`}
                            value={form.quantity}
                            onChange={e => set("quantity", e.target.value)}
                        />
                        {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
                    </div>
                    <div>
                        <label className={lbl}>สถานะเริ่มต้น</label>
                        <select className={inp} value={form.statusId} onChange={e => set("statusId", Number(e.target.value))}>
                            {statuses.map(s => (
                                <option key={s.Status_Id} value={s.Status_Id}>{s.Status_Name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {form.trackingType === "consumable" && (
                <div>
                    <label className={lbl}>แจ้งเตือนเมื่อเหลือน้อยกว่า (ไม่บังคับ)</label>
                    <input
                        type="number" min="0" step="1" onKeyDown={blockNegativeKeys}
                        className={`${inp} ${errors.minQuantity ? errInp : ""}`}
                        value={form.minQuantity}
                        onChange={e => set("minQuantity", e.target.value)}
                        placeholder="เช่น 10"
                    />
                    {errors.minQuantity && <p className="text-xs text-red-500 mt-1">{errors.minQuantity}</p>}
                </div>
            )}

            <div>
                <label className={lbl}>ตำแหน่งจัดเก็บ/ใช้งาน</label>
                <input
                    className={inp}
                    value={form.location}
                    onChange={e => set("location", e.target.value)}
                    placeholder="เช่น ห้องโถงชั้น 1, เคาน์เตอร์ต้อนรับ"
                />
            </div>

            <div>
                <label className={lbl}>รายละเอียดเพิ่มเติม</label>
                <textarea
                    rows={2}
                    className={inp}
                    value={form.detail}
                    onChange={e => set("detail", e.target.value)}
                    placeholder="หมายเหตุ, ยี่ห้อ, รุ่น ฯลฯ"
                />
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

// ─── QuantityAdjustModal — เพิ่ม/ลดจำนวน — ลดต้องกรอกเหตุผลเสมอ ────────────
const REMOVE_REASONS = ["ใช้หมด", "ชำรุด", "สูญหาย", "อื่นๆ"];

function QuantityAdjustModal({ item, onClose, onSaved, showToast }) {
    const [mode, setMode] = useState("add"); // 'add' | 'remove'
    const [amount, setAmount] = useState("1");
    const [reasonPreset, setReasonPreset] = useState(REMOVE_REASONS[0]);
    const [reasonNote, setReasonNote] = useState("");
    const [loading, setLoading] = useState(false);

    const isRemove = mode === "remove";
    const amountNum = Math.max(0, Number(amount) || 0);
    const nextQty = isRemove ? Math.max(0, item.Quantity - amountNum) : item.Quantity + amountNum;

    const submit = async () => {
        if (amountNum <= 0) return showToast("error", "กรุณาระบุจำนวนที่มากกว่า 0");
        if (isRemove && !reasonPreset) return showToast("error", "กรุณาเลือกเหตุผลการลดจำนวน");

        setLoading(true);
        try {
            const reason = isRemove
                ? `${reasonPreset}${reasonNote.trim() ? ` — ${reasonNote.trim()}` : ""}`
                : (reasonNote.trim() || null);
            await axios.patch(`${API}/common-facilities/${item.CommonFacilityId}/quantity`, {
                delta: isRemove ? -amountNum : amountNum,
                reason,
            });
            showToast("success", "ปรับจำนวนสำเร็จ");
            onSaved();
            onClose();
        } catch (e) {
            showToast("error", "ปรับจำนวนไม่สำเร็จ", e.response?.data?.message);
        } finally { setLoading(false); }
    };

    const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
    const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

    return (
        <Modal title={`ปรับจำนวน: ${item.Name}`} icon={item.TrackingType === "consumable" ? TrendingDown : Boxes} onClose={onClose}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setMode("add")}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition ${mode === "add"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                        <TrendingUp className="h-3.5 w-3.5" /> เพิ่มจำนวน
                    </button>
                    <button type="button" onClick={() => setMode("remove")}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition ${mode === "remove"
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                        <TrendingDown className="h-3.5 w-3.5" /> ลดจำนวน
                    </button>
                </div>

                <div>
                    <label className={lbl}>จำนวนที่จะ{isRemove ? "ลด" : "เพิ่ม"} ({item.Unit})</label>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setAmount(String(Math.max(1, amountNum - 1)))}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0">
                            <Minus className="h-4 w-4" />
                        </button>
                        <input
                            type="number" min="1" step="1" onKeyDown={blockNegativeKeys}
                            className={`${inp} text-center`}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                        <button type="button" onClick={() => setAmount(String(amountNum + 1))}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                        จาก {item.Quantity} {item.Unit} → <span className="font-bold text-slate-700">{nextQty} {item.Unit}</span>
                    </p>
                </div>

                {isRemove ? (
                    <div>
                        <label className={lbl}>เหตุผล <span className="text-red-400 normal-case">*</span></label>
                        <select className={inp} value={reasonPreset} onChange={e => setReasonPreset(e.target.value)}>
                            {REMOVE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <input
                            className={`${inp} mt-2`}
                            value={reasonNote}
                            onChange={e => setReasonNote(e.target.value)}
                            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                        />
                    </div>
                ) : (
                    <div>
                        <label className={lbl}>หมายเหตุ (ไม่บังคับ)</label>
                        <input
                            className={inp}
                            value={reasonNote}
                            onChange={e => setReasonNote(e.target.value)}
                            placeholder="เช่น ซื้อเพิ่ม, ได้รับบริจาค"
                        />
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} disabled={loading}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
                        ยกเลิก
                    </button>
                    <button onClick={submit} disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl font-bold disabled:opacity-50 transition text-sm shadow-sm ${isRemove ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> ยืนยัน</>}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── StatusChangeModal ──────────────────────────────────────────────────────
function StatusChangeModal({ item, statuses, onClose, onSaved, showToast }) {
    const [statusId, setStatusId] = useState(item.StatusId);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        try {
            await axios.patch(`${API}/common-facilities/${item.CommonFacilityId}/status`, {
                statusId,
                reason: reason.trim() || null,
            });
            showToast("success", "เปลี่ยนสถานะสำเร็จ");
            onSaved();
            onClose();
        } catch (e) {
            showToast("error", "เปลี่ยนสถานะไม่สำเร็จ", e.response?.data?.message);
        } finally { setLoading(false); }
    };

    const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
    const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

    return (
        <Modal title={`เปลี่ยนสถานะ: ${item.Name}`} icon={AlertTriangle} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className={lbl}>สถานะ</label>
                    <select className={inp} value={statusId} onChange={e => setStatusId(Number(e.target.value))}>
                        {statuses.map(s => (
                            <option key={s.Status_Id} value={s.Status_Id}>{s.Status_Name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={lbl}>หมายเหตุ (ไม่บังคับ)</label>
                    <textarea
                        rows={2}
                        className={inp}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="เช่น ส่งซ่อมที่ร้าน, รอสั่งอะไหล่..."
                    />
                </div>
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

// ─── ConfirmDelete ─────────────────────────────────────────────────────────
function ConfirmDelete({ item, onConfirm, onCancel, isDeleting }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">ยืนยันการลบอุปกรณ์</h3>
                        <p className="text-xs text-slate-400 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
                    <p className="text-sm font-semibold text-red-800">{item.Name}</p>
                    <p className="text-xs text-red-400 mt-0.5">{item.Quantity} {item.Unit} · ID: #{item.CommonFacilityId}</p>
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

// ─── DetailModal — รายละเอียด + ประวัติการเปลี่ยนแปลง ──────────────────────
function DetailModal({ item, onClose }) {
    const st = styleOf(item.StatusId);
    const CIcon = iconForCategory(item.Category_Name);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    useEffect(() => {
        axios.get(`${API}/common-facilities/${item.CommonFacilityId}/logs`)
            .then(r => setLogs(r.data)).catch(() => setLogs([])).finally(() => setLoadingLogs(false));
    }, [item.CommonFacilityId]);

    return (
        <Modal title={item.Name} icon={CIcon} onClose={onClose}>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">จำนวนคงเหลือ</p>
                    <p className="text-sm text-slate-800 font-semibold">{item.Quantity} {item.Unit}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">หมวดหมู่</p>
                    <p className="text-sm text-slate-800 font-semibold">{item.Category_Name}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 col-span-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">สถานะ</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {item.Status_Name}
                    </span>
                </div>
                {item.Location && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 col-span-2">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> ตำแหน่ง
                        </p>
                        <p className="text-sm text-slate-800 font-semibold">{item.Location}</p>
                    </div>
                )}
                {item.Detail && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 col-span-2">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">รายละเอียด</p>
                        <p className="text-sm text-slate-700">{item.Detail}</p>
                    </div>
                )}
            </div>

            {item.TrackingType === "consumable" && item.MinQuantity != null && (
                <div className={`mt-4 rounded-xl p-3 border ${item.Quantity <= item.MinQuantity ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
                    <p className="text-xs text-slate-600">
                        <AlertCircle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                        แจ้งเตือนเมื่อเหลือน้อยกว่า <b>{item.MinQuantity} {item.Unit}</b>
                        {item.Quantity <= item.MinQuantity && <span className="text-amber-700 font-bold"> — ใกล้หมดแล้ว</span>}
                    </p>
                </div>
            )}

            <div className="mt-5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" /> ประวัติการเปลี่ยนแปลง
                </p>
                {loadingLogs ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-orange-400" /></div>
                ) : logs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        ยังไม่มีประวัติการเปลี่ยนแปลง
                    </p>
                ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {logs.map(log => (
                            <div key={log.LogId} className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-slate-700">
                                        {log.ActionType === "quantity_change"
                                            ? `จำนวน: ${log.Old_Value} → ${log.New_Value} ${item.Unit}`
                                            : `สถานะ: #${log.Old_Value} → #${log.New_Value}`}
                                    </p>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(log.Created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                </div>
                                {log.Reason && <p className="text-[11px] text-slate-500 mt-0.5">เหตุผล: {log.Reason}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ─── FacilityCard ────────────────────────────────────────────────────────────
function FacilityCard({ item, onEdit, onDelete, onView, onStatusChange, onAdjustQty }) {
    const st = styleOf(item.StatusId);
    const CIcon = iconForCategory(item.Category_Name);
    const lowStock = item.TrackingType === "consumable" && item.LowStock;

    return (
        <div className={`group bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden ${lowStock ? "border-amber-300" : "border-slate-200 hover:border-orange-200"}`}>
            <div className="p-4 flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                    <CIcon className="h-5 w-5 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm truncate">{item.Name}</p>
                    <p className="text-[11px] text-slate-400">{item.Category_Name}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${st.bg} ${st.text} ${st.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {item.Status_Name}
                </span>
            </div>

            <div className="px-4 pb-3">
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    <div>
                        <p className="text-lg font-black text-slate-900 leading-none">{item.Quantity}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.Unit}</p>
                    </div>
                    <button onClick={() => onAdjustQty(item)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 active:scale-95 transition-all">
                        <Boxes className="h-3.5 w-3.5" /> ปรับจำนวน
                    </button>
                </div>
                {lowStock && (
                    <p className="flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-2">
                        <AlertCircle className="h-3.5 w-3.5" /> ใกล้หมด (ขั้นต่ำ {item.MinQuantity} {item.Unit})
                    </p>
                )}
                {item.Location && (
                    <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                        <MapPin className="h-3 w-3" /> {item.Location}
                    </p>
                )}
            </div>

            <div className="px-4 pb-4 flex items-center gap-1.5">
                <button onClick={() => onView(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 active:scale-95 transition-all">
                    <Eye className="h-3.5 w-3.5" /> ดู
                </button>
                <button onClick={() => onEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 active:scale-95 transition-all">
                    <Edit2 className="h-3.5 w-3.5" /> แก้ไข
                </button>
                <button onClick={() => onDelete(item)}
                    className="p-1.5 text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 active:scale-95 transition-all" title="ลบ">
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onStatusChange(item)}
                    className="p-1.5 text-slate-500 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 active:scale-95 transition-all" title="เปลี่ยนสถานะ">
                    <AlertTriangle className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminCommonFacilities() {
    const { toasts, showToast, removeToast } = useToast();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [tab, setTab] = useState("asset"); // 'asset' | 'consumable'
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [statusItem, setStatusItem] = useState(null);
    const [adjustItem, setAdjustItem] = useState(null);

    const fetchAll = async () => {
        try {
            const [iRes, cRes, sRes] = await Promise.all([
                axios.get(`${API}/common-facilities`),
                axios.get(`${API}/common-facilities/categories`),
                axios.get(`${API}/common-facilities/status`),
            ]);
            setItems(iRes.data);
            setCategories(cRes.data);
            setStatuses(sRes.data);
        } catch (e) {
            console.error("fetch common-facilities error:", e.response?.status, e.response?.data || e.message);
            showToast("error", "โหลดข้อมูลคลังอุปกรณ์ไม่สำเร็จ", e.response?.data?.message || `HTTP ${e.response?.status || "?"}: ${e.message}`);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleCreate = async (form) => {
        setIsSubmitting(true);
        try {
            await axios.post(`${API}/common-facilities`, form);
            showToast("success", "เพิ่มอุปกรณ์สำเร็จ!");
            setShowAddModal(false);
            fetchAll();
        } catch (e) {
            showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
        } finally { setIsSubmitting(false); }
    };

    const handleUpdate = async (form) => {
        setIsSubmitting(true);
        try {
            await axios.put(`${API}/common-facilities/${editingItem.CommonFacilityId}`, form);
            showToast("success", "แก้ไขอุปกรณ์สำเร็จ!");
            setEditingItem(null);
            fetchAll();
        } catch (e) {
            showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
        } finally { setIsSubmitting(false); }
    };

    const handleDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await axios.delete(`${API}/common-facilities/${deletingItem.CommonFacilityId}`);
            showToast("success", "ลบอุปกรณ์สำเร็จ!");
            setDeletingItem(null);
            fetchAll();
        } catch (e) {
            showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
        } finally { setIsDeleting(false); }
    };

    const byTab = items.filter(i => i.TrackingType === tab);
    const matchSearchFn = (i) => {
        const s = search.toLowerCase();
        return !s || i.Name.toLowerCase().includes(s) || (i.Location || "").toLowerCase().includes(s);
    };
    const matchCategoryFn = (i) => filterCategory === "all" || String(i.CategoryId) === filterCategory;
    const matchStatusFn = (i) => filterStatus === "all" || String(i.StatusId) === filterStatus;

    const filtered = byTab.filter(i => matchSearchFn(i) && matchCategoryFn(i) && matchStatusFn(i));

    const totalItems = items.length;
    const readyCount = items.filter(i => Number(i.StatusId) === 1).length;
    const lowStockCount = items.filter(i => i.TrackingType === "consumable" && i.LowStock).length;

    if (loading) return (
        <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลคลังอุปกรณ์...</p>
        </div>
    );

    return (
        <div className="space-y-6 mt-[90px] px-4 md:px-0">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">คลังอุปกรณ์ส่วนกลาง</h1>
                    <p className="text-sm text-slate-500 mt-1">จัดการทรัพย์สินและวัสดุที่ใช้ร่วมกันในสถาบัน ไม่ผูกกับห้องเรียนใดห้องหนึ่ง</p>
                </div>
                <button onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm hover:shadow-md transition text-sm active:scale-95">
                    <Plus className="h-4 w-4" /> เพิ่มอุปกรณ์
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "รายการทั้งหมด", value: totalItems, color: "bg-orange-500", icon: Boxes },
                    { label: "พร้อมใช้งาน", value: readyCount, color: "bg-emerald-500", icon: Check },
                    { label: "ใกล้หมด/ต้องเติม", value: lowStockCount, color: "bg-amber-500", icon: AlertCircle },
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

            {/* Tab: ทรัพย์สิน / วัสดุสิ้นเปลือง */}
            <div className="flex gap-2">
                {["asset", "consumable"].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 md:flex-none md:px-8 py-2.5 rounded-xl text-sm font-bold transition ${tab === t
                            ? "bg-orange-500 text-white shadow-sm"
                            : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
                        {TRACKING_LABEL[t]}
                        <span className="ml-1.5 opacity-70">({items.filter(i => i.TrackingType === t).length})</span>
                    </button>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่ออุปกรณ์, ตำแหน่ง..."
                            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
                        />
                    </div>
                    <div className="relative">
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[160px]">
                            <option value="all">ทุกหมวดหมู่</option>
                            {categories.map(c => <option key={c.CategoryId} value={c.CategoryId}>{c.Category_Name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[150px]">
                            <option value="all">ทุกสถานะ</option>
                            {statuses.map(s => <option key={s.Status_Id} value={s.Status_Id}>{s.Status_Name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {byTab.length} รายการ ({TRACKING_LABEL[tab]})</p>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                    <Boxes className="h-16 w-16 mx-auto text-slate-200" />
                    <p className="text-slate-500 font-medium mt-3">ไม่พบอุปกรณ์ที่ค้นหา</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(item => (
                        <FacilityCard key={item.CommonFacilityId} item={item}
                            onEdit={setEditingItem} onDelete={setDeletingItem} onView={setViewingItem}
                            onStatusChange={setStatusItem} onAdjustQty={setAdjustItem} />
                    ))}
                </div>
            )}

            {deletingItem && (
                <ConfirmDelete item={deletingItem} onConfirm={handleDelete} onCancel={() => setDeletingItem(null)} isDeleting={isDeleting} />
            )}
            {viewingItem && (
                <DetailModal item={viewingItem} onClose={() => setViewingItem(null)} />
            )}
            {statusItem && (
                <StatusChangeModal
                    item={statusItem}
                    statuses={statuses}
                    onClose={() => setStatusItem(null)}
                    onSaved={fetchAll}
                    showToast={showToast}
                />
            )}
            {adjustItem && (
                <QuantityAdjustModal
                    item={adjustItem}
                    onClose={() => setAdjustItem(null)}
                    onSaved={fetchAll}
                    showToast={showToast}
                />
            )}
            {showAddModal && (
                <Modal title="เพิ่มอุปกรณ์ส่วนกลาง" icon={Plus} onClose={() => setShowAddModal(false)}>
                    <CommonFacilityForm categories={categories} statuses={statuses} onSave={handleCreate} onCancel={() => setShowAddModal(false)} isSubmitting={isSubmitting} />
                </Modal>
            )}
            {editingItem && (
                <Modal title={`แก้ไขอุปกรณ์: ${editingItem.Name}`} icon={Edit2} onClose={() => setEditingItem(null)}>
                    <CommonFacilityForm initial={editingItem} categories={categories} statuses={statuses} onSave={handleUpdate} onCancel={() => setEditingItem(null)} isSubmitting={isSubmitting} />
                </Modal>
            )}
        </div>
    );
}