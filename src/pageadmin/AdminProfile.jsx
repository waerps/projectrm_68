import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  Pencil, Save, X, Camera, ImagePlus, Phone, User, ShieldCheck,
  KeyRound, Eye, EyeOff, Loader2, CalendarDays, AlertTriangle,
} from "lucide-react";

const API = `${API_URL}/api/admin/profile`;

// ─── helper: ดึง AdminId ของคนที่ล็อกอินอยู่ตอนนี้ ─────────────────────────
// pattern เดียวกับ TutorProfile.jsx / AdminManagement.jsx
// เมื่อมี JWT middleware ฝั่ง backend แล้ว ควรเปลี่ยนไปใช้ค่าจาก token แทน
function getCurrentAdminId() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.id ?? null;
  } catch {
    return null;
  }
}

const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });
};

// ─── ChangePasswordModal ────────────────────────────────────────────────────
function ChangePasswordModal({ adminId, onClose, showToast }) {
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const inp = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400 transition";

  const submit = async () => {
    if (!pwd.trim()) return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณากรอกรหัสผ่านใหม่");
    if (pwd.length < 6) return showToast("error", "รหัสผ่านสั้นเกินไป", "ต้องมีอย่างน้อย 6 ตัวอักษร");
    if (pwd !== confirmPwd) return showToast("error", "รหัสผ่านไม่ตรงกัน", "กรุณากรอกยืนยันรหัสผ่านให้ตรงกัน");

    setLoading(true);
    try {
      await axios.patch(`${API}/${adminId}/change-password`, { newPassword: pwd });
      showToast("success", "เปลี่ยนรหัสผ่านสำเร็จ");
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
            <h3 className="font-bold text-slate-900">เปลี่ยนรหัสผ่าน</h3>
            <p className="text-xs text-slate-400">ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              className={inp + " pr-10"}
              placeholder="รหัสผ่านใหม่"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <input
            type={show ? "text" : "password"}
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            className={inp}
            placeholder="ยืนยันรหัสผ่านใหม่"
            autoComplete="new-password"
          />
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

// ─── Section Card (เหมือน TutorProfile.jsx) ────────────────────────────────
function SectionCard({ title, icon, children, isEditing }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm overflow-hidden border-2 transition-all duration-200 ${isEditing ? "border-orange-200 shadow-md" : "border-neutral-100"}`}>
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold text-neutral-800">{title}</h2>
      </div>
      <div className="p-5 space-y-0.5">{children}</div>
    </div>
  );
}

// ─── Info Row (เหมือน TutorProfile.jsx) ────────────────────────────────────
function InfoRow({ label, value, name, isEditing, onChange, editable = true, type = "text" }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-neutral-50 last:border-0 min-h-[52px] gap-4">
      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide shrink-0">{label}</span>
      <div className="flex-1 text-right">
        {isEditing && editable ? (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-right text-sm text-neutral-800 font-medium outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
          />
        ) : (
          <span className="text-sm font-semibold text-neutral-800">
            {value || <span className="text-neutral-300 font-normal">-</span>}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────
export default function AdminProfile() {
  const fileInputRef = useRef(null);
  const { toasts, showToast, removeToast } = useToast();
  const ADMIN_ID = getCurrentAdminId();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);

  const [formData, setFormData] = useState({
    firstname: "", lastname: "", nickname: "", phoneNo: "",
    username: "", photo: null, createdAt: null,
  });
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/${ADMIN_ID}`);
        const d = res.data;
        const mapped = {
          firstname: d.Firstname || "",
          lastname: d.Lastname || "",
          nickname: d.Nickname || "",
          phoneNo: d.PhoneNo || "",
          username: d.Username || "",
          photo: d.Photo || null,
          createdAt: d.Created_at || null,
        };
        setFormData(mapped);
        setOriginalData(mapped);
      } catch (e) {
        console.error(e);
        showToast("error", "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    };
    if (ADMIN_ID) fetchProfile();
  }, [ADMIN_ID]);

  const formatPhone = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "phoneNo" ? formatPhone(value) : value,
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return showToast("error", "อัปโหลดไม่สำเร็จ", "ไฟล์ต้องไม่เกิน 5MB");
    }
    const data = new FormData();
    data.append("profileImage", file);
    try {
      const res = await axios.post(`${API}/${ADMIN_ID}/upload-profile`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData(prev => ({ ...prev, photo: res.data.imageUrl }));
      showToast("success", "อัปโหลดรูปสำเร็จ");
    } catch (e) {
      showToast("error", "อัปโหลดไม่สำเร็จ", e.response?.data?.message);
    }
  };

  const handleSave = async () => {
    if (!formData.firstname.trim() || !formData.lastname.trim()) {
      return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณากรอกชื่อ-นามสกุล");
    }
    setIsSaving(true);
    try {
      await axios.put(`${API}/${ADMIN_ID}`, {
        firstname: formData.firstname,
        lastname: formData.lastname,
        nickname: formData.nickname,
        phoneNo: formData.phoneNo,
      });
      setOriginalData(formData);
      setIsEditing(false);
      showToast("success", "บันทึกข้อมูลสำเร็จ");
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด", e.response?.data?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  if (isLoading) return (
    <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-500">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <div className="space-y-6 mt-[90px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Edit Mode Banner */}
      {isEditing && (
        <div className="flex items-center justify-between rounded-2xl bg-orange-400 px-5 py-3 shadow-md">
          <div className="flex items-center gap-2.5 text-white">
            <Pencil className="h-4 w-4" />
            <span className="font-semibold text-sm">กำลังแก้ไขข้อมูล</span>
            <span className="text-orange-200 text-xs hidden sm:inline">— กรอกข้อมูลให้ครบแล้วกดบันทึก</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-1.5 text-sm text-white font-medium hover:bg-white/20 transition">
              <X className="h-3.5 w-3.5" /> ยกเลิก
            </button>
            <button onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-1.5 text-sm text-orange-600 font-bold hover:bg-orange-50 transition shadow-sm disabled:opacity-60">
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="bg-gradient-to-br from-orange-500 to-orange-300 p-8 md:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">

            {/* รูปโปรไฟล์ */}
            <div className="relative shrink-0 mx-auto md:mx-0">
              <div className="relative h-36 w-36 md:h-40 md:w-40 overflow-hidden rounded-2xl border-4 border-white/80 shadow-2xl bg-white/30 flex items-center justify-center">
                {formData.photo ? (
                  <img src={getFileUrl(formData.photo)} className="h-full w-full object-cover" alt="Admin" />
                ) : (
                  <span className="text-5xl font-bold text-white select-none">
                    {(formData.firstname || "A").charAt(0).toUpperCase()}
                  </span>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
              <button onClick={() => fileInputRef.current.click()}
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-orange-500 shadow-lg hover:scale-110 transition-transform border-2 border-orange-100">
                <ImagePlus className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* ชื่อ + badge */}
            <div className="flex-1 space-y-3 text-center md:text-left text-white">
              <div>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <input name="firstname" value={formData.firstname} onChange={handleChange}
                      placeholder="ชื่อ"
                      className="rounded-xl px-3 py-2 text-neutral-800 text-lg font-semibold w-36 outline-none border-2 border-transparent focus:border-orange-300 bg-white shadow-sm transition" />
                    <input name="lastname" value={formData.lastname} onChange={handleChange}
                      placeholder="นามสกุล"
                      className="rounded-xl px-3 py-2 text-neutral-800 text-lg font-semibold w-40 outline-none border-2 border-transparent focus:border-orange-300 bg-white shadow-sm transition" />
                  </div>
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {formData.firstname} {formData.lastname}
                  </h1>
                )}
                {formData.nickname && <p className="text-lg opacity-80 mt-0.5">({formData.nickname})</p>}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-sm border border-white/30">
                  <ShieldCheck className="h-3.5 w-3.5" /> ผู้ดูแลระบบ
                </span>
                {formData.createdAt && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-sm border border-white/30">
                    <CalendarDays className="h-3.5 w-3.5" /> เป็นสมาชิกตั้งแต่ {formatDate(formData.createdAt)}
                  </span>
                )}
              </div>
            </div>

            {/* ปุ่มแก้ไข */}
            {!isEditing && (
              <button onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-orange-600 font-bold hover:bg-orange-50 shadow-lg transition-all text-sm shrink-0">
                <Pencil className="h-4 w-4" /> แก้ไขข้อมูล
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid gap-5 md:grid-cols-2">

        {/* ข้อมูลส่วนตัว */}
        <SectionCard title="ข้อมูลส่วนตัว" icon={<User className="h-4.5 w-4.5 text-orange-500" />} isEditing={isEditing}>
          <InfoRow label="ชื่อ" name="firstname" value={formData.firstname} isEditing={isEditing} onChange={handleChange} />
          <InfoRow label="นามสกุล" name="lastname" value={formData.lastname} isEditing={isEditing} onChange={handleChange} />
          <InfoRow label="ชื่อเล่น" name="nickname" value={formData.nickname} isEditing={isEditing} onChange={handleChange} />
        </SectionCard>

        {/* ข้อมูลติดต่อ */}
        <SectionCard title="ข้อมูลติดต่อ" icon={<Phone className="h-4.5 w-4.5 text-orange-500" />} isEditing={isEditing}>
          <InfoRow label="เบอร์โทรศัพท์" name="phoneNo" value={formData.phoneNo} isEditing={isEditing} onChange={handleChange} />
        </SectionCard>

        {/* ข้อมูลบัญชี */}
        <SectionCard title="ข้อมูลบัญชี" icon={<ShieldCheck className="h-4.5 w-4.5 text-orange-500" />} isEditing={isEditing}>
          <InfoRow label="Username" value={formData.username} editable={false} />
          <InfoRow label="สมาชิกตั้งแต่" value={formatDate(formData.createdAt)} editable={false} />
          <div className="pt-3 flex justify-end">
            <button onClick={() => setShowPwdModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition">
              <KeyRound className="h-3.5 w-3.5" /> เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </SectionCard>

        {/* หมายเหตุสิทธิ์ */}
        <SectionCard title="สิทธิ์การใช้งาน" icon={<AlertTriangle className="h-4.5 w-4.5 text-amber-500" />}>
          <p className="text-xs text-neutral-500 leading-relaxed py-2">
            บัญชีผู้ดูแลระบบทุกคนมีสิทธิ์การใช้งานเท่ากัน หากต้องการจัดการบัญชีผู้ดูแลระบบคนอื่น
            หรือเปิด/ปิดการใช้งานบัญชี สามารถไปที่เมนู "จัดการผู้ดูแลระบบ"
          </p>
        </SectionCard>
      </div>

      {showPwdModal && (
        <ChangePasswordModal
          adminId={ADMIN_ID}
          onClose={() => setShowPwdModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}