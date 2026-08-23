import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  Users, Plus, Search, Edit2, Trash2, X, Check, Eye, EyeOff,
  Phone, KeyRound, Loader2, AlertTriangle, ImagePlus,
  UserCheck, UserX, ShieldCheck, Info,
} from "lucide-react";

const API = `${API_URL}/api/admin`;

// ─── helper: ดึง AdminId ของคนที่ล็อกอินอยู่ตอนนี้ ─────────────────────────
// ระบบยังไม่มี auth middleware ที่แนบข้อมูลคนล็อกอินมาให้ทุก request
// ตอนนี้จึงอ่านจาก localStorage (pattern เดียวกับที่ TutorProfile.jsx ใช้อยู่)
// เมื่อมี JWT middleware ฝั่ง backend แล้ว ควรเปลี่ยนไปใช้ค่าจาก token แทน
function getCurrentAdminId() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Modal wrapper (โครงเดียวกับหน้าอื่นในระบบ) ────────────────────────────
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

// ─── ImageUpload (pattern เดียวกับ TutorForm/StudentForm) ──────────────────
function ImageUpload({ value, onChange, showToast }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErr("ไฟล์ต้องไม่เกิน 5MB");
      showToast?.("error", "อัปโหลดไม่สำเร็จ", "ไฟล์ต้องไม่เกิน 5MB");
      return;
    }
    setErr(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await axios.post(`${API}/upload/image`, fd);
      onChange(res.data.path);
    } catch {
      setErr("อัปโหลดไม่สำเร็จ");
      showToast?.("error", "อัปโหลดรูปไม่สำเร็จ");
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

// ─── ฟอร์มเพิ่ม/แก้ไขผู้ดูแลระบบ — ฟิลด์พื้นฐานเท่านั้น ───────────────────
function AdminForm({ initial = {}, onSave, onCancel, isSubmitting, showToast }) {
  const isEdit = !!initial.AdminId;
  const [form, setForm] = useState({
    firstname: initial.Firstname || "",
    lastname: initial.Lastname || "",
    nickname: initial.Nickname || "",
    phoneNo: initial.PhoneNo || "",
    username: initial.Username || "",
    password: "",
    photo: initial.Photo || "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const formatPhone = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
  };

  const submit = () => {
    if (!form.firstname.trim() || !form.lastname.trim())
      return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณากรอกชื่อ-นามสกุล");
    if (!isEdit && (!form.username.trim() || !form.password.trim()))
      return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณากรอก Username และ Password");
    onSave(form);
  };

  const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
  const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>รูปโปรไฟล์</label>
        <ImageUpload value={form.photo || ""} onChange={(path) => set("photo", path)} showToast={showToast} />
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
          <label className={lbl}>ชื่อเล่น</label>
          <input className={inp} value={form.nickname || ""} onChange={e => set("nickname", e.target.value)} placeholder="เช่น กวาง" />
        </div>
        <div>
          <label className={lbl}>เบอร์โทร</label>
          <input
            className={inp}
            value={form.phoneNo || ""}
            onChange={e => set("phoneNo", formatPhone(e.target.value))}
            placeholder="098-888-8888"
            inputMode="numeric"
          />
        </div>
      </div>

      {isEdit ? (
        <div>
          <label className={lbl}>Username</label>
          <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium select-text">
            {form.username || "—"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ไม่สามารถแก้ไข Username ได้ · เปลี่ยนรหัสผ่านได้จากปุ่ม "รีเซ็ตรหัสผ่าน" ในตาราง</p>
        </div>
      ) : (
        <div className="border border-orange-100 rounded-xl p-4 space-y-3 bg-orange-50/40">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> ข้อมูลเข้าสู่ระบบ
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

// ─── ResetPasswordModal ─────────────────────────────────────────────────────
function ResetPasswordModal({ admin, onClose, showToast }) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const inp = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400 transition";

  const submit = async () => {
    if (!pwd.trim()) return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณากรอกรหัสผ่านใหม่");
    setLoading(true);
    try {
      await axios.patch(`${API}/admins/${admin.AdminId}/reset-password`, { newPassword: pwd });
      showToast("success", "รีเซ็ตรหัสผ่านสำเร็จ");
      onClose();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด", e.response?.data?.message);
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
            <p className="text-xs text-slate-400">{admin.Nickname || `${admin.Firstname} ${admin.Lastname}`}</p>
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

// ─── ConfirmStatusModal — ยืนยันก่อนเปิด/ปิดบัญชี ───────────────────────────
function ConfirmStatusModal({ admin, nextIsActive, onConfirm, onCancel, isSubmitting }) {
  const displayName = admin.Nickname || `${admin.Firstname} ${admin.Lastname}`;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${nextIsActive ? "bg-emerald-100" : "bg-red-100"}`}>
            {nextIsActive ? <UserCheck className="h-6 w-6 text-emerald-500" /> : <UserX className="h-6 w-6 text-red-500" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              {nextIsActive ? "เปิดใช้งานบัญชี" : "ปิดใช้งานบัญชี"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{displayName}</p>
          </div>
        </div>
        {!nextIsActive && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              บัญชีนี้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งานอีกครั้ง ข้อมูลทั้งหมดยังคงอยู่ ไม่ถูกลบ
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isSubmitting}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
            ยกเลิก
          </button>
          <button onClick={onConfirm} disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition text-sm ${nextIsActive ? "bg-emerald-500" : "bg-red-500"}`}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (nextIsActive ? "เปิดใช้งาน" : "ปิดใช้งาน")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────
function AdminAvatar({ admin, className = "h-10 w-10 rounded-xl" }) {
  const displayName = admin.Nickname || `${admin.Firstname} ${admin.Lastname}`;
  if (admin.Photo) {
    return (
      <div className={`overflow-hidden bg-orange-50 border border-orange-100 shrink-0 ${className}`}>
        <img src={getFileUrl(admin.Photo)} alt={displayName} className="w-full h-full object-cover" />
      </div>
    );
  }
  const initial = (admin.Firstname || "?").charAt(0).toUpperCase();
  return (
    <div className={`flex items-center justify-center font-bold text-white bg-orange-500 shrink-0 ${className}`}>
      {initial}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────
export default function AdminManagement() {
  const { toasts, showToast, removeToast } = useToast();
  const currentAdminId = getCurrentAdminId();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [resetPwdAdmin, setResetPwdAdmin] = useState(null);
  const [statusChange, setStatusChange] = useState(null); // { admin, nextIsActive }

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API}/admins`);
      setAdmins(res.data);
    } catch (e) {
      console.error("fetch admins error:", e);
      showToast("error", "โหลดข้อมูลผู้ดูแลระบบไม่สำเร็จ");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/admins`, data);
      showToast("success", "เพิ่มผู้ดูแลระบบสำเร็จ!");
      setShowAddModal(false);
      fetchAdmins();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally { setIsSubmitting(false); }
  };

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.put(`${API}/admins/${editingAdmin.AdminId}`, data);
      showToast("success", "แก้ไขข้อมูลสำเร็จ!");
      setEditingAdmin(null);
      fetchAdmins();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally { setIsSubmitting(false); }
  };

  const handleConfirmStatus = async () => {
    if (!statusChange) return;
    setIsSubmitting(true);
    try {
      await axios.patch(`${API}/admins/${statusChange.admin.AdminId}/status`, {
        isActive: statusChange.nextIsActive,
        currentAdminId, // ★ ใช้เช็คฝั่ง backend ว่าห้ามปิดบัญชีตัวเอง
      });
      showToast("success", statusChange.nextIsActive ? "เปิดใช้งานบัญชีสำเร็จ" : "ปิดใช้งานบัญชีสำเร็จ");
      setStatusChange(null);
      fetchAdmins();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally { setIsSubmitting(false); }
  };

  const matchSearchFn = (a) => {
    const displayName = (a.Nickname || `${a.Firstname} ${a.Lastname}`).toLowerCase();
    const s = search.toLowerCase();
    return !s || displayName.includes(s) || (a.PhoneNo || "").includes(s) || (a.Username || "").toLowerCase().includes(s);
  };

  const filtered = admins.filter(matchSearchFn);
  const activeCount = admins.filter(a => a.IsActive).length;
  const inactiveCount = admins.length - activeCount;

  if (loading) return (
    <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-500">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลผู้ดูแลระบบ...</p>
    </div>
  );

  return (
    <div className="space-y-6 mt-[90px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการผู้ดูแลระบบ</h1>
          <p className="text-sm text-slate-500 mt-1">ผู้ดูแลระบบทุกคนมีสิทธิ์เท่ากัน แต่ละคนมีบัญชีของตัวเอง</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition text-sm">
          <Plus className="h-4 w-4" /> เพิ่มผู้ดูแลระบบ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "ผู้ดูแลระบบทั้งหมด", value: admins.length, color: "bg-orange-500" },
          { label: "ใช้งานอยู่", value: activeCount, color: "bg-emerald-500" },
          { label: "ปิดใช้งาน", value: inactiveCount, color: "bg-slate-500" },
        ].map(({ label, value, color }, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-black text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, ชื่อเล่น, เบอร์โทร, Username..."
            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {admins.length} คน</p>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">ไม่พบผู้ดูแลระบบที่ค้นหา</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ผู้ดูแลระบบ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ติดต่อ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Username</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานะ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(a => {
                  const displayName = a.Nickname || `${a.Firstname} ${a.Lastname}`;
                  const isSelf = String(a.AdminId) === String(currentAdminId);
                  return (
                    <tr key={a.AdminId} className={`hover:bg-orange-50/40 transition-colors ${!a.IsActive ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AdminAvatar admin={a} className="h-10 w-10 rounded-xl text-sm" />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                              {displayName}
                              {isSelf && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-[10px] font-bold">
                                  คุณ
                                </span>
                              )}
                            </p>
                            {a.Nickname && (
                              <p className="text-xs text-slate-400">{a.Firstname} {a.Lastname}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {a.PhoneNo && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{a.PhoneNo}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600 font-mono">{a.Username}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${a.IsActive
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-slate-200 text-slate-600 border-slate-300"}`}>
                          {a.IsActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          {a.IsActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingAdmin(a)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition">
                            <Edit2 className="h-3.5 w-3.5" /> แก้ไข
                          </button>
                          <button
                            onClick={() => setResetPwdAdmin(a)}
                            className="p-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition"
                            title="รีเซ็ตรหัสผ่าน">
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setStatusChange({ admin: a, nextIsActive: !a.IsActive })}
                            disabled={isSelf && a.IsActive}
                            title={isSelf && a.IsActive ? "ไม่สามารถปิดบัญชีของตัวเองได้" : (a.IsActive ? "ปิดใช้งานบัญชี" : "เปิดใช้งานบัญชี")}
                            className={`p-1.5 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${a.IsActive
                              ? "text-red-500 bg-red-50 border-red-100 hover:bg-red-100"
                              : "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100"}`}>
                            {a.IsActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
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

      {/* Modals */}
      {showAddModal && (
        <Modal title="เพิ่มผู้ดูแลระบบ" icon={Plus} onClose={() => setShowAddModal(false)}>
          <AdminForm onSave={handleCreate} onCancel={() => setShowAddModal(false)}
            isSubmitting={isSubmitting} showToast={showToast} />
        </Modal>
      )}
      {editingAdmin && (
        <Modal title={`แก้ไขข้อมูล #${editingAdmin.AdminId}`} icon={Edit2} onClose={() => setEditingAdmin(null)}>
          <AdminForm initial={editingAdmin} onSave={handleUpdate} onCancel={() => setEditingAdmin(null)}
            isSubmitting={isSubmitting} showToast={showToast} />
        </Modal>
      )}
      {resetPwdAdmin && (
        <ResetPasswordModal admin={resetPwdAdmin} onClose={() => setResetPwdAdmin(null)} showToast={showToast} />
      )}
      {statusChange && (
        <ConfirmStatusModal
          admin={statusChange.admin}
          nextIsActive={statusChange.nextIsActive}
          onConfirm={handleConfirmStatus}
          onCancel={() => setStatusChange(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}