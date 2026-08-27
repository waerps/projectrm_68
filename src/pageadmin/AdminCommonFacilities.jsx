import { API_URL } from "../config";
import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
    Plus, Search, Edit2, Trash2, X, Check, Eye, Loader2,
    AlertTriangle, ChevronDown, Package, Cpu, Printer, Sofa,
    Refrigerator, PenTool, FileText, MapPin, History, Minus,
    TrendingDown, TrendingUp, Boxes, AlertCircle, Info,
} from "lucide-react";

const API = `${API_URL}/api/admin`;

// ─── Status style map (พร้อมใช้งาน / ชำรุด / กำลังซ่อม / [หมด — legacy]) ───
const STATUS_STYLE = {
    1: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    2: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
    3: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    4: { bg: "bg-slate-200", text: "text-slate-600", border: "border-slate-300", dot: "bg-slate-400" },
};
const styleOf = (id) => STATUS_STYLE[id] || STATUS_STYLE[4];

// สถานะ "หมด" ไม่ใช่สภาพอุปกรณ์ (เป็นเรื่องของจำนวน/Quantity) — จึงไม่ให้เลือกใหม่อีกต่อไป
// แต่ถ้า Database เก่ายังมีอยู่ ก็ไม่ลบ/ไม่แก้ migration เอง แค่ไม่เอามาให้เลือกใน UI
const NON_ASSIGNABLE_STATUS_NAME = "หมด";
const assignableStatuses = (statuses = []) => statuses.filter(s => s.Status_Name !== NON_ASSIGNABLE_STATUS_NAME);

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
    const selectableStatuses = assignableStatuses(statuses);
    const [form, setForm] = useState({
        name: initial.Name || "",
        categoryId: initial.CategoryId || (categories[0]?.CategoryId ?? ""),
        quantity: initial.Quantity ?? "0",
        unit: initial.Unit || "ชิ้น",
        statusId: initial.StatusId || (selectableStatuses[0]?.Status_Id ?? 1),
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
            {isEdit && (
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                        ฟอร์มนี้ใช้แก้ <b>ข้อมูลทั่วไป</b> ของอุปกรณ์เท่านั้น
                        หากต้องการปรับ <b>จำนวน</b> หรือเปลี่ยน <b>สถานะ</b> ให้ปิดหน้านี้แล้วใช้ปุ่ม
                        "ปรับจำนวน" / "เปลี่ยนสถานะ" ในหน้ารายละเอียดแทน (ระบบจะเก็บประวัติแยกไว้)
                    </p>
                </div>
            )}

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
                            {selectableStatuses.map(s => (
                                <option key={s.Status_Id} value={s.Status_Id}>{s.Status_Name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {form.trackingType === "consumable" && (
                <div>
                    <label className={lbl}>แจ้งเตือนเมื่อเหลือไม่เกิน (ไม่บังคับ)</label>
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
                <label className={lbl}>รายละเอียดอุปกรณ์ (ยี่ห้อ, รุ่น ฯลฯ)</label>
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
// เหตุผลแยกตามประเภท: Consumable = เบิกใช้/หมดสภาพการใช้งาน, Asset = จำหน่าย/โอนย้าย
// (ไม่ใช้ "ชำรุด" เป็นเหตุผลลดจำนวน เพราะ "สภาพอุปกรณ์" ให้ไปเปลี่ยนที่ปุ่ม "เปลี่ยนสถานะ" แทน)
const CONSUMABLE_REMOVE_REASONS = ["เบิกใช้", "ใช้หมด", "สูญหาย", "อื่นๆ"];
const ASSET_REMOVE_REASONS = ["จำหน่ายออก/ปลดระวาง", "โอนย้ายออกนอกคลัง", "สูญหาย", "อื่นๆ"];

function QuantityAdjustModal({ item, onClose, onSaved, showToast }) {
    const isConsumable = item.TrackingType === "consumable";
    const REMOVE_REASONS = isConsumable ? CONSUMABLE_REMOVE_REASONS : ASSET_REMOVE_REASONS;

    const [targetQty, setTargetQty] = useState(item.Quantity);
    const [reasonPreset, setReasonPreset] = useState(REMOVE_REASONS[0]);
    const [reasonNote, setReasonNote] = useState("");
    const [loading, setLoading] = useState(false);

    const delta = targetQty - item.Quantity;
    const isIncrease = delta > 0;
    const isDecrease = delta < 0;
    const hasChange = delta !== 0;

    const step = (n) => setTargetQty(q => Math.max(0, (Number(q) || 0) + n));
    const handleInput = (v) => {
        if (v === "") return setTargetQty("");
        const n = Math.max(0, Math.floor(Number(v) || 0));
        setTargetQty(n);
    };

    const submit = async () => {
        const qty = Number(targetQty) || 0;
        const d = qty - item.Quantity;
        if (d === 0) return showToast("error", "กรุณาปรับจำนวนให้แตกต่างจากเดิมก่อนบันทึก");
        if (d < 0 && !reasonPreset) return showToast("error", "กรุณาเลือกเหตุผลการลดจำนวน");

        setLoading(true);
        try {
            const reason = d < 0
                ? `${reasonPreset}${reasonNote.trim() ? ` — ${reasonNote.trim()}` : ""}`
                : (reasonNote.trim() || null);
            await axios.patch(`${API}/common-facilities/${item.CommonFacilityId}/quantity`, {
                delta: d,
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
        <Modal title={`ปรับจำนวน: ${item.Name}`} icon={isConsumable ? TrendingDown : Boxes} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className={lbl}>จำนวน ({item.Unit})</label>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => step(-1)}
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 active:scale-95 transition-all shrink-0">
                            <Minus className="h-5 w-5" />
                        </button>
                        <input
                            type="number" min="0" step="1" onKeyDown={blockNegativeKeys}
                            className={`${inp} text-center text-lg font-bold`}
                            value={targetQty}
                            onChange={e => handleInput(e.target.value)}
                        />
                        <button type="button" onClick={() => step(1)}
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 active:scale-95 transition-all shrink-0">
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    {hasChange ? (
                        <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${isIncrease ? "text-emerald-600" : "text-rose-600"}`}>
                            {isIncrease ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            จาก {item.Quantity} {item.Unit} → {targetQty || 0} {item.Unit}
                            <span className="font-bold">({isIncrease ? "+" : ""}{delta})</span>
                        </p>
                    ) : (
                        <p className="text-xs text-slate-400 mt-2">ปัจจุบันมี {item.Quantity} {item.Unit} — ใช้ปุ่ม +/- เพื่อปรับจำนวน</p>
                    )}
                </div>

                {isDecrease && (
                    <div>
                        <label className={lbl}>เหตุผลที่ลดจำนวน <span className="text-red-400 normal-case">*</span></label>
                        <select className={inp} value={reasonPreset} onChange={e => setReasonPreset(e.target.value)}>
                            {REMOVE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <input
                            className={`${inp} mt-2`}
                            value={reasonNote}
                            onChange={e => setReasonNote(e.target.value)}
                            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                        />
                        {!isConsumable && (
                            <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                การลดจำนวนนี้ไม่ได้บันทึกสภาพอุปกรณ์ — ถ้าอุปกรณ์ชำรุดหรือกำลังซ่อม ให้ใช้ปุ่ม "เปลี่ยนสถานะ" แยกต่างหาก
                            </p>
                        )}
                    </div>
                )}

                {isIncrease && (
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
                    <button onClick={submit} disabled={loading || !hasChange}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl font-bold disabled:opacity-50 transition text-sm shadow-sm ${isDecrease ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> บันทึก</>}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── StatusChangeModal ──────────────────────────────────────────────────────
// Status = สภาพอุปกรณ์เท่านั้น ("หมด" ไม่ใช่ตัวเลือกอีกต่อไป เพราะเป็นเรื่องของจำนวน)
function StatusChangeModal({ item, statuses, onClose, onSaved, showToast }) {
    const selectableStatuses = assignableStatuses(statuses);
    const [statusId, setStatusId] = useState(
        selectableStatuses.some(s => s.Status_Id === item.StatusId) ? item.StatusId : (selectableStatuses[0]?.Status_Id ?? item.StatusId)
    );
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
                {item.TrackingType === "asset" && item.Quantity > 1 && (
                    <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            อุปกรณ์นี้มีทั้งหมด {item.Quantity} {item.Unit} ระบบยังไม่รองรับการติดตามสภาพรายชิ้น
                            สถานะที่เลือกจะถูกบันทึกเป็น <b>ภาพรวม</b> ของอุปกรณ์ทั้งหมดนี้
                        </p>
                    </div>
                )}
                <div>
                    <label className={lbl}>สถานะ</label>
                    <select className={inp} value={statusId} onChange={e => setStatusId(Number(e.target.value))}>
                        {selectableStatuses.map(s => (
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

// ─── ConfirmDelete — Backend ใช้ Soft Delete จริง จึงต้องสื่อสารให้ตรง ──────
function ConfirmDelete({ item, onConfirm, onCancel, isDeleting }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">ยืนยันการนำอุปกรณ์ออกจากรายการ</h3>
                        <p className="text-xs text-slate-400 mt-0.5">อุปกรณ์นี้จะถูกซ่อนออกจากรายการ ข้อมูลและประวัติยังถูกเก็บไว้ในระบบ</p>
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
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "นำออกจากรายการ"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── DetailModal — รายละเอียด + Action รอง + ประวัติการเปลี่ยนแปลง ─────────
function DetailModal({ item, statuses, onClose, onEdit, onAdjustQty, onStatusChange, onDelete }) {
    const statusNameOf = (id) => statuses.find(s => String(s.Status_Id) === String(id))?.Status_Name || `#${id}`;
    const st = styleOf(item.StatusId);
    const CIcon = iconForCategory(item.Category_Name);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const isAssetMultiUnit = item.TrackingType === "asset" && item.Quantity > 1;

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
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">สถานะ (สภาพอุปกรณ์)</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {item.Status_Name}
                    </span>
                    {isAssetMultiUnit && (
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            * เป็นสถานะภาพรวมของอุปกรณ์ทั้งหมด {item.Quantity} ชิ้น (ยังไม่รองรับสถานะรายชิ้น)
                        </p>
                    )}
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
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">รายละเอียดอุปกรณ์</p>
                        <p className="text-sm text-slate-700">{item.Detail}</p>
                    </div>
                )}
            </div>

            {item.Quantity === 0 && (
                <div className="mt-4 rounded-xl p-3 border bg-red-50 border-red-200">
                    <p className="text-xs font-bold text-red-700">
                        <AlertCircle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> หมดสต๊อก
                    </p>
                </div>
            )}
            {item.TrackingType === "consumable" && item.MinQuantity != null && item.Quantity > 0 && (
                <div className={`mt-4 rounded-xl p-3 border ${item.Quantity <= item.MinQuantity ? "bg-yellow-50 border-yellow-200" : "bg-slate-50 border-slate-200"}`}>
                    <p className="text-xs text-slate-600">
                        <AlertCircle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                        แจ้งเตือนเมื่อเหลือไม่เกิน <b>{item.MinQuantity} {item.Unit}</b>
                        {item.Quantity <= item.MinQuantity && <span className="text-yellow-700 font-bold"> — ใกล้หมดแล้ว</span>}
                    </p>
                </div>
            )}

                        {/* Action รอง: ปรับจำนวน (ดู/แก้ไข/เปลี่ยนสถานะ/ลบ ย้ายไปแสดงในตารางแล้ว) */}
                        <div className="mt-5 flex gap-2">
                <button onClick={() => onAdjustQty(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 hover:bg-orange-100 active:scale-95 transition-all">
                    <Boxes className="h-4 w-4" /> ปรับจำนวน
                </button>
                <button onClick={() => onEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-100 active:scale-95 transition-all">
                    <Edit2 className="h-4 w-4" /> แก้ไขข้อมูลทั่วไป
                </button>
            </div>

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
                                            : `สถานะ: ${statusNameOf(log.Old_Value)} → ${statusNameOf(log.New_Value)}`}
                                    </p>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(log.Created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                </div>
                                {log.Reason && <p className="text-[11px] text-slate-500 mt-0.5">เหตุผล/หมายเหตุ: {log.Reason}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ─── FacilityTable — แสดงข้อมูลแบบตาราง ─────────────────────────────
function FacilityTable({ items, onEdit, onView, onStatusChange, onDelete }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">อุปกรณ์</th>
                            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">หมวดหมู่</th>
                            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">จำนวน</th>
                            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">สถานะ</th>
                            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">ตำแหน่ง</th>
                            <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map(item => {
                            const st = styleOf(item.StatusId);
                            const CIcon = iconForCategory(item.Category_Name);
                            const outOfStock = item.Quantity === 0;
                            const lowStock = !outOfStock && item.LowStock;
                            const isAssetMultiUnit = item.TrackingType === "asset" && item.Quantity > 1;

                            return (
                                <tr key={item.CommonFacilityId}
                                    className={`hover:bg-slate-50 transition ${outOfStock ? "bg-red-50/40" : lowStock ? "bg-yellow-50/40" : ""}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                                                <CIcon className="h-4 w-4 text-orange-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate">{item.Name}</p>
                                                {item.Detail && <p className="text-[11px] text-slate-400 truncate max-w-[220px]">{item.Detail}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{item.Category_Name}</td>
                                    <td className="px-4 py-3">
                                        <p className="text-slate-700">
                                            <span className="font-black text-slate-900">{item.Quantity}</span> {item.Unit}
                                        </p>
                                        {outOfStock && (
                                            <p className="flex items-center gap-1 text-[10px] font-bold text-red-600 mt-0.5">
                                                <AlertCircle className="h-3 w-3" /> หมดสต๊อก
                                            </p>
                                        )}
                                        {lowStock && (
                                            <p className="flex items-center gap-1 text-[10px] font-bold text-yellow-700 mt-0.5">
                                                <AlertCircle className="h-3 w-3" /> ใกล้หมด
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                            {item.Status_Name}
                                        </span>
                                        {isAssetMultiUnit && (
                                            <p className="text-[10px] text-slate-400 mt-1">ภาพรวม {item.Quantity} ชิ้น</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {item.Location && (
                                            <span className="flex items-center gap-1 text-xs">
                                                <MapPin className="h-3 w-3 shrink-0" /> {item.Location}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button onClick={() => onView(item)} title="ดูรายละเอียด"
                                                className="flex items-center justify-center w-8 h-8 text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 active:scale-95 transition-all">
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => onEdit(item)} title="แก้ไขข้อมูลทั่วไป"
                                                className="flex items-center justify-center w-8 h-8 text-amber-600 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 active:scale-95 transition-all">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => onStatusChange(item)} title="เปลี่ยนสถานะ"
                                                className="flex items-center justify-center w-8 h-8 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 active:scale-95 transition-all">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => onDelete(item)} title="นำออกจากรายการ"
                                                className="flex items-center justify-center w-8 h-8 text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 active:scale-95 transition-all">
                                                <Trash2 className="h-3.5 w-3.5" />
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
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminCommonFacilities() {
    const { toasts, showToast, removeToast } = useToast();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterType, setFilterType] = useState("all"); // 'all' | 'asset' | 'consumable'
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterStock, setFilterStock] = useState("all"); // 'all' | 'instock' | 'low' | 'out'

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

    // Asset ไม่ควรถูกกรองด้วยแนวคิด "ใกล้หมด" (เป็นแนวคิดของ Consumable เท่านั้น)
    useEffect(() => {
        if (filterType === "asset" && filterStock === "low") setFilterStock("all");
    }, [filterType, filterStock]);

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
            showToast("success", "นำอุปกรณ์ออกจากรายการสำเร็จ!");
            setDeletingItem(null);
            fetchAll();
        } catch (e) {
            showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
        } finally { setIsDeleting(false); }
    };

    const matchTypeFn = (i) => filterType === "all" || i.TrackingType === filterType;
    const matchSearchFn = (i) => {
        const s = search.toLowerCase();
        return !s || i.Name.toLowerCase().includes(s) || (i.Location || "").toLowerCase().includes(s);
    };
    const matchCategoryFn = (i) => filterCategory === "all" || String(i.CategoryId) === filterCategory;
    const matchStatusFn = (i) => filterStatus === "all" || String(i.StatusId) === filterStatus;
    const matchStockFn = (i) => {
        if (filterStock === "all") return true;
        if (filterStock === "out") return i.Quantity === 0;
        if (filterStock === "low") return i.LowStock;
        if (filterStock === "instock") return i.Quantity > 0 && !i.LowStock;
        return true;
    };

    const filtered = items.filter(i => matchTypeFn(i) && matchSearchFn(i) && matchCategoryFn(i) && matchStatusFn(i) && matchStockFn(i));

    const totalItems = items.length;
    const readyCount = items.filter(i => Number(i.StatusId) === 1).length;
    const lowStockCount = items.filter(i => i.OutOfStock || i.LowStock).length;

    // ตัวเลือก "จำนวนในคลัง" — ซ่อน "ใกล้หมด" เมื่อกำลังดูเฉพาะ Asset เพราะไม่ใช่แนวคิดของ Asset
    const stockOptions = filterType === "asset"
        ? [
            { value: "all", label: "ทั้งหมด" },
            { value: "instock", label: "มีของ" },
            { value: "out", label: "หมดสต๊อก" },
        ]
        : [
            { value: "all", label: "ทั้งหมด" },
            { value: "instock", label: "มีของปกติ" },
            { value: "low", label: "ใกล้หมด" },
            { value: "out", label: "หมดสต๊อก" },
        ];

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
                    <h1 className="text-2xl font-bold text-slate-900">จัดการคลังอุปกรณ์</h1>
                    <p className="text-sm text-slate-500 mt-1">จัดการทรัพย์สินและวัสดุส่วนกลางที่ใช้ร่วมกันในสถาบัน</p>
                </div>
                <button onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm hover:shadow-md transition text-sm active:scale-95">
                    <Plus className="h-4 w-4" /> เพิ่มอุปกรณ์
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "รายการทั้งหมด", value: totalItems, color: "bg-orange-500", icon: Boxes },
                    { label: "สภาพพร้อมใช้งาน", value: readyCount, color: "bg-emerald-500", icon: Check },
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

            {/* Filter bar — ไม่มี header/label กำกับแต่ละช่อง ให้ดูเป็นชุดเดียวกัน */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="ชื่ออุปกรณ์, ตำแหน่ง..."
                                className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <select value={filterType} onChange={e => setFilterType(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[150px] w-full">
                            <option value="all">ทุกประเภท</option>
                            <option value="asset">ทรัพย์สิน</option>
                            <option value="consumable">วัสดุสิ้นเปลือง</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[150px] w-full">
                            <option value="all">ทุกหมวดหมู่</option>
                            {categories.map(c => <option key={c.CategoryId} value={c.CategoryId}>{c.Category_Name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[140px] w-full">
                            <option value="all">ทุกสถานะ</option>
                            {statuses.map(s => <option key={s.Status_Id} value={s.Status_Id}>{s.Status_Name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[140px] w-full">
                            {stockOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {items.length} รายการ</p>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                    <Boxes className="h-16 w-16 mx-auto text-slate-200" />
                    <p className="text-slate-500 font-medium mt-3">ไม่พบอุปกรณ์ที่ค้นหา</p>
                </div>
                        ) : (
                            <FacilityTable
                                items={filtered}
                                onEdit={setEditingItem}
                                onView={setViewingItem}
                                onStatusChange={setStatusItem}
                                onDelete={setDeletingItem}
                            />
                        )}

            {deletingItem && (
                <ConfirmDelete item={deletingItem} onConfirm={handleDelete} onCancel={() => setDeletingItem(null)} isDeleting={isDeleting} />
            )}
            {viewingItem && (
                <DetailModal
                    item={viewingItem}
                    statuses={statuses}
                    onClose={() => setViewingItem(null)}
                    onEdit={(it) => { setViewingItem(null); setEditingItem(it); }}
                    onAdjustQty={(it) => { setViewingItem(null); setAdjustItem(it); }}
                    // onStatusChange={(it) => { setViewingItem(null); setStatusItem(it); }}
                    // onDelete={(it) => { setViewingItem(null); setDeletingItem(it); }}
                />
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