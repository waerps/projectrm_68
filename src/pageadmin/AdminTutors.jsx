import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  Users, Plus, Search, Edit2, Trash2, X, Check, Eye, EyeOff,
  Phone, BookOpen, ChevronLeft, ChevronRight, Loader2,
  AlertTriangle, KeyRound, CreditCard, Briefcase, Shield, ImagePlus
} from "lucide-react";
import AdminAttendanceDashboard from './AdminAttendanceDashboard';

const API = `${API_URL}/api/admin`;
const ITEMS_PER_PAGE = 12;

// ─── FIX #6-equivalent: ใช้ AdminId เป็น seed แทนชื่อ
const avatarUrl = (adminId) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_${adminId}&backgroundColor=ffedd5`;

// ─── FIX #8-equivalent: handle format วันที่ที่หลากหลาย
const formatDate = (d) => {
  if (!d) return "ไม่ระบุ";
  try {
    const date = new Date(d.includes?.("T") ? d : d + "T00:00:00");
    if (isNaN(date.getTime())) return "ไม่ระบุ";
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
  } catch { return "ไม่ระบุ"; }
};

// ★ เพิ่ม: format เบอร์โทร เหมือนหน้านักเรียน (098-888-8888)
const formatPhone = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
};

// ★ เพิ่ม: format จำนวนเงิน เหมือนหน้าคอร์ส (Price/Discount) — comma คั่นหลักพัน ไม่มีทศนิยม
const formatMoney = (p) =>
  Number(p || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ★ เพิ่ม: helper แปลง input ที่มี comma กลับเป็นตัวเลขดิบ + กันค่าติดลบ
const sanitizeMoneyInput = (raw) => {
  const cleaned = String(raw).replace(/,/g, "").replace(/[^0-9]/g, "");
  return cleaned;
};
const blockNegativeKeys = (e) => {
  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
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

// ─── ImageUpload (เหมือนหน้าคอร์สทุกจุด — ใช้ endpoint /api/admin/upload/image ร่วมกัน) ──
function ImageUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setErr("ไฟล์ต้องไม่เกิน 5MB");
    setErr(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await axios.post(`${API}/upload/image`, fd);
      onChange(res.data.path);
    } catch {
      setErr("อัปโหลดไม่สำเร็จ");
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        className={`relative flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed cursor-pointer transition
          ${uploading ? "border-orange-300 bg-orange-50" : value ? "border-green-300 bg-green-50" : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50"}`}
      >
        {value && !uploading && (
          <img src={getFileUrl(value)} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-25" onError={() => { }} />
        )}
        <div className="relative z-10 flex flex-col items-center gap-1 text-center">
          {uploading
            ? <><Loader2 className="h-7 w-7 text-orange-500 animate-spin" /><p className="text-xs text-orange-500 font-medium">กำลังอัปโหลด...</p></>
            : value
              ? <><Check className="h-7 w-7 text-green-600" /><p className="text-xs text-green-600 font-medium">อัปโหลดแล้ว</p></>
              : <><ImagePlus className="h-7 w-7 text-slate-400" /><p className="text-xs text-slate-500 font-medium">คลิกหรือลากไฟล์มาวาง</p><p className="text-[10px] text-slate-400">JPG, PNG, WEBP · ไม่เกิน 5MB</p></>
          }
        </div>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      {value && !uploading && (
        <button type="button" onClick={() => onChange("")}
          className="text-xs text-slate-400 hover:text-red-500 transition flex items-center gap-1">
          <X className="h-3.5 w-3.5" /> ลบรูปภาพ
        </button>
      )}
    </div>
  );
}

// ─── TutorForm ─────────────────────────────────────────────────────────────────
function TutorForm({ initial = {}, onSave, onCancel, isSubmitting }) {
  const [form, setForm] = useState({
    firstname: initial.Firstname || initial.firstname || "",
    lastname: initial.Lastname || initial.lastname || "",
    nickname: initial.Nickname || initial.nickname || "",
    phoneNo: initial.PhoneNo || initial.phoneNo || "",
    occupation: initial.Occupation || initial.occupation || "",
    birthOfDate: initial.BirthOfDate || initial.birthOfDate || "",
    remark: initial.Remark || initial.remark || "",
    username: initial.Username || initial.username || "",
    password: "",
    ratePerTutors: initial.RatePerTutors || initial.ratePerTutors || "",
    emergencyContactName: initial.EmergencyContactName || initial.emergencyContactName || "",
    emergencyContactPhoneNo: initial.EmergencyContactPhoneNo || initial.emergencyContactPhoneNo || "",
    lineId: initial.LineID || initial.lineId || "",
    bankName: initial.BankName || initial.bankName || "",
    bankAccountNumber: initial.BankAccountNumber || initial.bankAccountNumber || "",
    bankAccountName: initial.BankAccountName || initial.bankAccountName || "",
    photo: initial.Photo || initial.photo || "", // ★ เพิ่ม: รูปโปรไฟล์
  });
  const [showPwd, setShowPwd] = useState(false);
  const isEdit = !!initial.AdminId;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ★ เพิ่ม: helper สำหรับช่องเงิน (เหมือนหน้าคอร์ส — comma คั่นหลักพัน)
  const handleMoneyChange = (key) => (e) => set(key, sanitizeMoneyInput(e.target.value));
  const moneyDisplay = (v) => (v === "" || v === null || v === undefined ? "" : formatMoney(v));

  const submit = () => {
    if (!form.firstname.trim() || !form.lastname.trim())
      return alert("กรุณากรอกชื่อ-นามสกุล");
    if (!isEdit && (!form.username.trim() || !form.password.trim()))
      return alert("กรุณากรอก Username และ Password");
    // ★ เพิ่ม: validate อัตราค่าสอนไม่ติดลบ (กันเหนียวฝั่ง client แม้ backend เช็คแล้ว)
    if (form.ratePerTutors !== "" && Number(form.ratePerTutors) < 0)
      return alert("อัตราค่าสอนต้องเป็นตัวเลขไม่ติดลบ");
    onSave(form);
  };

  const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
  const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <div className="space-y-5">
      {/* ★ เพิ่ม: รูปโปรไฟล์ */}
      <div>
        <label className={lbl}>รูปโปรไฟล์</label>
        <ImageUpload value={form.photo || ""} onChange={(path) => set("photo", path)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ชื่อ <span className="text-red-400 normal-case">*</span></label>
          <input className={inp} value={form.firstname} onChange={e => set("firstname", e.target.value)} placeholder="ชื่อจริง" />
        </div>
        <div>
          <label className={lbl}>นามสกุล <span className="text-red-400 normal-case">*</span></label>
          <input className={inp} value={form.lastname} onChange={e => set("lastname", e.target.value)} placeholder="นามสกุล" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ชื่อเล่น / ชื่อที่ใช้เรียก</label>
          <input className={inp} value={form.nickname || ""} onChange={e => set("nickname", e.target.value)} placeholder="เช่น ครูเป้ว" />
        </div>
        <div>
          <label className={lbl}>เบอร์โทร</label>
          {/* ★ แก้: ใช้ formatPhone เหมือนหน้านักเรียน */}
          <input
            className={inp}
            value={form.phoneNo || ""}
            onChange={e => set("phoneNo", formatPhone(e.target.value))}
            placeholder="098-888-8888"
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Line ID</label>
          <input className={inp} value={form.lineId || ""} onChange={e => set("lineId", e.target.value)} placeholder="@lineid" />
        </div>
        <div>
          <label className={lbl}>วันเกิด</label>
          <input type="date" className={inp} value={form.birthOfDate?.slice(0, 10) || ""} onChange={e => set("birthOfDate", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>อาชีพ / สาขาวิชา</label>
          <input className={inp} value={form.occupation || ""} onChange={e => set("occupation", e.target.value)} placeholder="เช่น นักศึกษา" />
        </div>
        <div>
          <label className={lbl}>อัตราค่าสอน (บาท/ชม.)</label>
          {/* ★ แก้: comma คั่นหลักพัน + กันติดลบ เหมือน Price/Discount ของคอร์ส */}
          <input
            type="text" inputMode="numeric"
            className={inp}
            value={moneyDisplay(form.ratePerTutors)}
            onChange={handleMoneyChange("ratePerTutors")}
            onKeyDown={blockNegativeKeys}
            placeholder="180"
          />
        </div>
      </div>

      {/* ข้อมูลธนาคาร */}
      <div className="border border-orange-100 rounded-xl p-4 bg-orange-50/50 space-y-3">
        <p className="text-xs font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" /> ข้อมูลบัญชีธนาคาร
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={lbl}>ธนาคาร</label>
            <input className={inp} value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} placeholder="เช่น ไทยพาณิชย์" />
          </div>
          <div>
            <label className={lbl}>เลขบัญชี</label>
            <input className={inp} value={form.bankAccountNumber || ""} onChange={e => set("bankAccountNumber", e.target.value)} placeholder="xxx-x-xxxxx-x" />
          </div>
          <div>
            <label className={lbl}>ชื่อบัญชี</label>
            <input className={inp} value={form.bankAccountName || ""} onChange={e => set("bankAccountName", e.target.value)} placeholder="ชื่อ-นามสกุลบัญชี" />
          </div>
        </div>
      </div>

      {/* ผู้ติดต่อฉุกเฉิน */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ผู้ติดต่อฉุกเฉิน</label>
          <input className={inp} value={form.emergencyContactName || ""} onChange={e => set("emergencyContactName", e.target.value)} />
        </div>
        <div>
          <label className={lbl}>เบอร์ผู้ติดต่อฉุกเฉิน</label>
          {/* ★ แก้: ใช้ formatPhone เช่นเดียวกับเบอร์หลัก */}
          <input
            className={inp}
            value={form.emergencyContactPhoneNo || ""}
            onChange={e => set("emergencyContactPhoneNo", formatPhone(e.target.value))}
            placeholder="098-888-8888"
            inputMode="numeric"
          />
        </div>
      </div>
      <div>
        <label className={lbl}>หมายเหตุ</label>
        <textarea className={inp} rows={2} value={form.remark || ""} onChange={e => set("remark", e.target.value)} />
      </div>

      {/* ★ เพิ่ม: แสดง Username แบบอ่านอย่างเดียวตอนแก้ไข เหมือนหน้านักเรียน */}
      {isEdit && (
        <div>
          <label className={lbl}>Username</label>
          <input
            className={inp + " bg-slate-100 text-slate-500 cursor-not-allowed"}
            value={form.username}
            disabled
            readOnly
          />
          <p className="text-[11px] text-slate-400 mt-1">ไม่สามารถแก้ไข Username ได้</p>
        </div>
      )}

      {!isEdit && (
        <div className="border border-orange-100 rounded-xl p-4 space-y-3 bg-orange-50/40">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> ข้อมูลเข้าสู่ระบบ
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Username <span className="text-red-400 normal-case">*</span></label>
              <input className={inp} value={form.username} onChange={e => set("username", e.target.value)} placeholder="username" autoComplete="off" />
            </div>
            <div>
              <label className={lbl}>Password <span className="text-red-400 normal-case">*</span></label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className={inp + " pr-10"}
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  placeholder="รหัสผ่าน"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

// ─── ResetPasswordModal ────────────────────────────────────────────────────────
function ResetPasswordModal({ tutor, onClose }) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const inp = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400 transition";

  const submit = async () => {
    if (!pwd.trim()) return alert("กรุณากรอกรหัสผ่านใหม่");
    setLoading(true);
    try {
      await axios.patch(`${API}/tutors/${tutor.AdminId}/reset-password`, { newPassword: pwd });
      alert("รีเซ็ตรหัสผ่านสำเร็จ");
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <KeyRound className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">รีเซ็ตรหัสผ่าน</h3>
            <p className="text-xs text-slate-400">{tutor.Nickname || `${tutor.Firstname} ${tutor.Lastname}`}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mb-4">
          <input type={show ? "text" : "password"} value={pwd} onChange={e => setPwd(e.target.value)}
            className={inp + " pr-10"} placeholder="รหัสผ่านใหม่" autoComplete="new-password" />
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
            ยกเลิก
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-50 transition">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยัน"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ConfirmDelete ─────────────────────────────────────────────────────────────
function ConfirmDelete({ tutor, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">ยืนยันการลบติวเตอร์</h3>
            <p className="text-xs text-slate-400 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
          <p className="text-sm font-semibold text-red-800">
            {tutor.Nickname || `${tutor.Firstname} ${tutor.Lastname}`}
          </p>
          <p className="text-xs text-red-400 mt-0.5">ID: #{tutor.AdminId}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isDeleting}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
            ยกเลิก
          </button>
          {/* FIX #7-equivalent: ปุ่ม disable + loading */}
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 transition text-sm">
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ลบเลย"}
          </button>
        </div>
      </div>
    </div>
  );
}

// เพิ่ม component นี้ไว้นอก AdminTutorsPage
function TutorRow({ t, setEditingTutor, setResetPwdTutor, setDeletingTutor }) {
  const [imgErr, setImgErr] = useState(false);
  const displayName = t.Nickname || `${t.Firstname} ${t.Lastname}`;
  const fullName = `${t.Firstname} ${t.Lastname}`;

  return (
    <tr className="hover:bg-orange-50/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl overflow-hidden bg-orange-50 border border-orange-100 shrink-0">
            {t.Photo && !imgErr ? (
              <img src={getFileUrl(t.Photo)} alt={displayName}
                onError={() => setImgErr(true)} className="w-full h-full object-cover" />
            ) : (
              <img src={avatarUrl(t.AdminId)} alt={displayName} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{displayName}</p>
            {t.Nickname && displayName !== fullName && (
              <p className="text-xs text-slate-400">{fullName}</p>
            )}
            <p className="text-[10px] text-slate-400">#{t.AdminId} · {t.ExperienceYear} ปี</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {t.Occupation && (
          <div className="flex items-center gap-1.5 text-xs text-orange-600 font-medium mb-1">
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            <span>{t.Occupation}</span>
          </div>
        )}
        {t.Subjects && (
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <BookOpen className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1 max-w-[160px]">{t.Subjects}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {t.PhoneNo && t.PhoneNo !== "000-000-0000" && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{t.PhoneNo}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {t.BankName ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-medium text-slate-700">{t.BankName}</p>
              <p className="text-slate-400">{t.BankAccountNumber}</p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
          {t.StudentCount || 0}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
          {t.TotalSessions || 0}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {t.RatePerTutors ? (
          <span className="inline-block px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-bold">
            {Number(t.RatePerTutors).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => setEditingTutor(t)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition">
            <Edit2 className="h-3.5 w-3.5" /> แก้ไข
          </button>
          <button onClick={() => setResetPwdTutor(t)}
            className="p-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition" title="รีเซ็ตรหัสผ่าน">
            <KeyRound className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setDeletingTutor(t)}
            className="p-1.5 text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition" title="ลบ">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTutorsPage() {
  const { toasts, showToast, removeToast } = useToast(); //alert ต่างๆ
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // FIX #7-equivalent

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTutor, setEditingTutor] = useState(null);
  const [deletingTutor, setDeletingTutor] = useState(null);
  const [resetPwdTutor, setResetPwdTutor] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  const fetchTutors = async () => {
    try {
      const res = await axios.get(`${API}/tutors`);
      setTutors(res.data);
    } catch (e) {
      console.error("fetch tutors error:", e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTutors(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);
  useEffect(() => { setCurrentPage(1); }, [search, filterSubject]);

  const handleCreate = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/tutors`, data);
      showToast("success", "เพิ่มข้อมูลติวเตอร์สำเร็จ!");
      setShowAddModal(false);
      fetchTutors();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally { setIsSubmitting(false); }
  };

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.put(`${API}/tutors/${editingTutor.AdminId}`, data);
      showToast("success", "แก้ไขข้อมูลติวเตอร์สำเร็จ!");
      setEditingTutor(null);
      fetchTutors();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally { setIsSubmitting(false); }
  };

  // FIX #7-equivalent: ป้องกัน double submit
  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API}/tutors/${deletingTutor.AdminId}`);
      showToast("success", "ลบข้อมูลติวเตอร์สำเร็จ!");
      setDeletingTutor(null);
      fetchTutors();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally { setIsDeleting(false); }
  };

  // เพิ่มตรงนี้ก่อน filtered
  const allSubjects = [...new Set(
    tutors
      .flatMap(t => (t.Subjects || "").split(",").map(s => s.trim()))
      .filter(Boolean)
  )].sort();

  // แก้ filtered เดิม
  const filtered = tutors.filter(t => {
    const displayName = (t.Nickname || `${t.Firstname} ${t.Lastname}`).toLowerCase();
    const s = search.toLowerCase();
    const matchSearch = !s || displayName.includes(s) || (t.PhoneNo || "").includes(s) ||
      String(t.AdminId).includes(s) || (t.Subjects || "").toLowerCase().includes(s);
    const matchSubject = filterSubject === "all" ||
      (t.Subjects || "").split(",").map(x => x.trim()).includes(filterSubject);
    return matchSearch && matchSubject;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-orange-500">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลติวเตอร์...</p>
    </div>
  );

  return (
    <div className="space-y-6 mt-[90px]">
      {/* ✅ วางบรรทัดแรกสุดใน return ก่อนทุกอย่าง */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* ── Tab Bar ── */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
                    ${activeTab === 'list'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          รายชื่อติวเตอร์
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
                    ${activeTab === 'attendance'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          บันทึกชั่วโมงการสอน
        </button>
      </div>

      {/* ── Attendance Tab ── */}
      {activeTab === 'attendance' && <AdminAttendanceDashboard />}

      {/* ── List Tab ── */}
      {activeTab === 'list' && <>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">จัดการติวเตอร์</h1>
            <p className="text-sm text-slate-500 mt-1">เพิ่ม แก้ไข และจัดการบัญชีติวเตอร์ทั้งหมด</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition text-sm">
            <Plus className="h-4 w-4" /> เพิ่มติวเตอร์ใหม่
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "ติวเตอร์ทั้งหมด", value: tutors.length, color: "bg-orange-500" },
            { label: "นักเรียนรวม", value: tutors.reduce((s, t) => s + Number(t.StudentCount || 0), 0), color: "bg-blue-500" },
            { label: "คาบสอนรวม", value: tutors.reduce((s, t) => s + Number(t.TotalSessions || 0), 0), color: "bg-emerald-500" },
            { label: "มีข้อมูลธนาคาร", value: tutors.filter(t => t.BankName).length, color: "bg-indigo-500" },
          ].map(({ label, value, color }, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-xl font-black text-slate-900">{value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, ชื่อเล่น, เบอร์โทร, วิชา, ID..."
                className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
              />
            </div>
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[180px]"
            >
              <option value="all">ทุกวิชา</option>
              {allSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400 mt-2 pl-1">
            แสดง {filtered.length} จาก {tutors.length} คน
          </p>
        </div>

        {/* Table */}
        {paginated.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="text-6xl mb-3">👩‍🏫</div>
            <p className="text-slate-500 font-medium">ไม่พบติวเตอร์ที่ค้นหา</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ติวเตอร์</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">อาชีพ / วิชา</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ติดต่อ</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ธนาคาร</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">นักเรียน</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">คาบ</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">บาท/ชม.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map(t => (
                    <TutorRow
                      key={t.AdminId}
                      t={t}
                      setEditingTutor={setEditingTutor}
                      setResetPwdTutor={setResetPwdTutor}
                      setDeletingTutor={setDeletingTutor}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              แสดง <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> จาก <span className="font-semibold">{filtered.length}</span> คน
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
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === p ? "bg-orange-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600"}`}>
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

        {/* Modals */}
        {showAddModal && (
          <Modal title="เพิ่มติวเตอร์ใหม่" icon={Plus} onClose={() => setShowAddModal(false)}>
            <TutorForm onSave={handleCreate} onCancel={() => setShowAddModal(false)} isSubmitting={isSubmitting} />
          </Modal>
        )}
        {editingTutor && (
          <Modal title={`แก้ไขติวเตอร์ #${editingTutor.AdminId}`} icon={Edit2} onClose={() => setEditingTutor(null)}>
            <TutorForm initial={editingTutor} onSave={handleUpdate} onCancel={() => setEditingTutor(null)} isSubmitting={isSubmitting} />
          </Modal>
        )}
        {deletingTutor && (
          <ConfirmDelete tutor={deletingTutor} onConfirm={handleDelete} onCancel={() => setDeletingTutor(null)} isDeleting={isDeleting} />
        )}
        {resetPwdTutor && (
          <ResetPasswordModal tutor={resetPwdTutor} onClose={() => setResetPwdTutor(null)} />
        )}
      </>
      }
    </div>
  )
}