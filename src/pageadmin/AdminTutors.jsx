import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  Users, Plus, Search, Edit2, Trash2, X, Check, Eye, EyeOff,
  Phone, BookOpen, ChevronLeft, ChevronRight, Loader2,
  AlertTriangle, KeyRound, CreditCard, Briefcase, Shield, ImagePlus,
  UserCog, UserCheck, UserX, Info, ChevronDown, ChevronUp, BarChart2,
} from "lucide-react";
import AdminAttendanceDashboard from './AdminAttendanceDashboard';

const API = `${API_URL}/api/admin`;
const ITEMS_PER_PAGE = 12;

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

const formatBankAccount = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 4) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}-${d.slice(3, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 4)}-${d.slice(4, 9)}-${d.slice(9, 10)}`;
};
const isValidBankAccount = (v) => !v || /^\d{3}-\d{1}-\d{5}-\d{1}$/.test(v);

// ★ เพิ่ม: format จำนวนเงิน เหมือนหน้าคอร์ส (Price/Discount) — comma คั่นหลักพัน ไม่มีทศนิยม
const formatMoney = (p) =>
  Number(p || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ★ เพิ่ม: helper แปลง input ที่มี comma กลับเป็นตัวเลขดิบ + กันค่าติดลบ
const sanitizeMoneyInput = (raw) => {
  const cleaned = String(raw).replace(/,/g, "").replace(/[^0-9]/g, "");
  return cleaned;
};
// ★ เพิ่ม: แปลงชั่วโมงทศนิยม (24.5) เป็น "24 ชม. 30 นาที" — เหมือนหน้าคอร์ส
const formatHoursLabel = (decimalHours) => {
  const total = Number(decimalHours || 0);
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  if (m === 0) return `${h} ชม.`;
  return `${h} ชม. ${m} นาที`;
};

// ★ เพิ่ม: inline edit ชั่วโมงสอน (เหมือน HoursInlineEdit ในหน้าคอร์ส)
function HoursInlineEdit({ value, onSave, onCancel }) {
  const initial = Number(value || 0);
  const [hours, setHours] = useState(String(Math.floor(initial)));
  const [minutes, setMinutes] = useState(String(Math.round((initial - Math.floor(initial)) * 60)));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const decimal = Number(hours || 0) + Number(minutes || 0) / 60;
    await onSave(decimal);
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <input type="number" min="0" step="1" value={hours}
        onChange={e => /^\d*$/.test(e.target.value) && setHours(e.target.value)}
        className="w-12 px-1.5 py-1 bg-white border border-orange-300 rounded-lg text-xs text-right outline-none" autoFocus />
      <span className="text-[11px] text-slate-400">ชม.</span>
      <input type="number" min="0" max="59" step="1" value={minutes}
        onChange={e => /^\d*$/.test(e.target.value) && Number(e.target.value) < 60 && setMinutes(e.target.value)}
        className="w-12 px-1.5 py-1 bg-white border border-orange-300 rounded-lg text-xs text-right outline-none" />
      <span className="text-[11px] text-slate-400">นาที</span>
      <button onClick={save} disabled={saving} className="p-1 text-green-500 hover:text-green-700">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
      <button onClick={onCancel} disabled={saving} className="p-1 text-slate-400 hover:text-red-500">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const blockNegativeKeys = (e) => {
  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

const TUTOR_STATUS = {
  1: { label: "กำลังสอน", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  2: { label: "ลาพัก", bg: "bg-slate-200", text: "text-slate-600", border: "border-slate-300" },
};
const statusOf = (id) => TUTOR_STATUS[id] || TUTOR_STATUS[1];

const APPLICATION_STATUS = {
  1: { label: "รอตรวจสอบ", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  2: { label: "อนุมัติแล้ว", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  3: { label: "ปฏิเสธ", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
};
const appStatusOf = (id) => APPLICATION_STATUS[id] || APPLICATION_STATUS[1];

const AVATAR_COLORS = [
  "bg-orange-500", "bg-amber-500", "bg-rose-500", "bg-pink-500",
  "bg-fuchsia-500", "bg-violet-500", "bg-indigo-500", "bg-blue-500",
  "bg-cyan-500", "bg-teal-500", "bg-emerald-500", "bg-lime-600",
];
const colorForSeed = (seed) => {
  const s = String(seed ?? "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const initialsOf = (name) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] || "";
  const second = parts.length > 1 ? parts[1][0] : "";
  return (first + second).toUpperCase();
};
function InitialsAvatar({ name, seed, className = "" }) {
  return (
    <div className={`flex items-center justify-center font-bold text-white select-none ${colorForSeed(seed ?? name)} ${className}`}>
      {initialsOf(name)}
    </div>
  );
}
// รูปโปรไฟล์ติวเตอร์: ถ้ามีรูป → แสดงรูป, ถ้าไม่มี/โหลดพัง → fallback เป็นตัวอักษรแรกของชื่อ
function TutorAvatar({ tutor, className = "h-10 w-10 rounded-xl" }) {
  const [imgErr, setImgErr] = useState(false);
  const displayName = tutor.Nickname || `${tutor.Firstname} ${tutor.Lastname}`;
  if (tutor.Photo && !imgErr) {
    return (
      <div className={`overflow-hidden bg-orange-50 border border-orange-100 shrink-0 ${className}`}>
        <img
          src={getFileUrl(tutor.Photo)}
          alt={displayName}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <InitialsAvatar
      name={displayName}
      seed={tutor.AdminId}
      className={`shrink-0 border border-orange-100 ${className}`}
    />
  );
}

function RejectApplicationModal({ application, onClose, onSaved, showToast }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณาระบุเหตุผลการปฏิเสธ");
    setLoading(true);
    try {
      await onSaved(application.ApplicationId, reason.trim());
      onClose();
    } finally { setLoading(false); }
  };

  const displayName = application.Nickname || `${application.Firstname} ${application.Lastname}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <UserX className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">ปฏิเสธใบสมัคร</h3>
            <p className="text-xs text-slate-400">{displayName}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
          เหตุผลการปฏิเสธ <span className="text-red-400 normal-case">*</span>
        </label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none transition mb-4"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="เช่น คุณสมบัติไม่ตรงตามที่ต้องการ / เอกสารไม่ครบ..."
        />

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 disabled:opacity-50 transition">
            ยกเลิก
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 disabled:opacity-50 transition">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันปฏิเสธ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApproveApplicationModal({ application, onClose, onApprove, isSubmitting, showToast, allTutors, allSubjects }) {
  return (
    <Modal
      title={`อนุมัติใบสมัคร: ${application.Nickname || `${application.Firstname} ${application.Lastname}`}`}
      icon={UserCheck}
      onClose={onClose}
    >
      {/* แจ้งเตือน: ชื่อ/เบอร์/LINE/อาชีพ ดึงมาจากใบสมัคร แก้ไม่ได้ตรงนี้ */}
      <div className="mb-5 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          ชื่อ-นามสกุล, ชื่อเล่น, เบอร์โทร, LINE ID และอาชีพ ดึงมาจากใบสมัครโดยตรง หากต้องการแก้ไขข้อมูลเหล่านี้ กรุณาแก้ไขที่หน้ารายชื่อติวเตอร์หลังอนุมัติแล้ว
          {application.ResumePath && (
            <>
              {" · "}
              <a href={getFileUrl(application.ResumePath)} target="_blank" rel="noreferrer"
                className="underline font-semibold text-blue-800">ดูไฟล์ Resume</a>
            </>
          )}
        </p>
      </div>

      <TutorForm
        initial={{
          Firstname: application.Firstname,
          Lastname: application.Lastname,
          Nickname: application.Nickname,
          PhoneNo: application.PhoneNo,
          LineID: application.LineID,
          Occupation: application.Occupation,
        }}
        onSave={(form) => onApprove(application.ApplicationId, {
          username: form.username,
          password: form.password,
          ratePerTutors: form.ratePerTutors,
          subjectIds: form.subjectIds,
          bankName: form.bankName,
          bankAccountNumber: form.bankAccountNumber,
          bankAccountName: form.bankAccountName,
          emergencyContactName: form.emergencyContactName,
          emergencyContactPhoneNo: form.emergencyContactPhoneNo,
        })}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        showToast={showToast}
        allTutors={allTutors}
        allSubjects={allSubjects}
      />
    </Modal>
  );
}

function TutorApplicationList({ applications, onRefresh, showToast, allTutors, allSubjects }) {
  const [filterStatus, setFilterStatus] = useState("1");
  const [approvingApp, setApprovingApp] = useState(null);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = applications.filter(a => filterStatus === "all" || String(a.Status) === filterStatus);
  const countOf = (status) => applications.filter(a => status === "all" || String(a.Status) === status).length;

  const handleApprove = async (applicationId, data) => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/tutor-applications/${applicationId}/approve`, data);
      showToast("success", "อนุมัติและสร้างบัญชีติวเตอร์สำเร็จ!");
      setApprovingApp(null);
      onRefresh();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally { setIsSubmitting(false); }
  };

  // ★ เพิ่มกลับเข้ามาตรงนี้ — เป็นคนละตัวกับที่ลบออกจาก AdminTutorsPage
  const handleReject = async (applicationId, reason) => {
    try {
      await axios.patch(`${API}/tutor-applications/${applicationId}/reject`, { reason });
      showToast("success", "ปฏิเสธใบสมัครสำเร็จ");
      onRefresh();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ผู้สมัครเป็นติวเตอร์</h1>
        <p className="text-sm text-slate-500 mt-1">ตรวจสอบ อนุมัติ หรือปฏิเสธใบสมัครติวเตอร์ใหม่</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "1", label: "รอตรวจสอบ" },
          { key: "2", label: "อนุมัติแล้ว" },
          { key: "3", label: "ปฏิเสธ" },
          { key: "all", label: "ทั้งหมด" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition
              ${filterStatus === f.key ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {f.label} ({countOf(f.key)})
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-6xl mb-3">📋</div>
          <p className="text-slate-500 font-medium">ไม่พบใบสมัครในสถานะนี้</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {filtered.map(a => {
            const status = appStatusOf(a.Status);
            const displayName = a.Nickname || `${a.Firstname} ${a.Lastname}`;
            return (
              <div key={a.ApplicationId} className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50/40 transition-colors">
                <InitialsAvatar name={displayName} seed={a.ApplicationId} className="h-10 w-10 rounded-xl text-sm shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{displayName}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5 text-xs text-slate-500">
                    {a.PhoneNo && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.PhoneNo}</span>}
                    {a.Occupation && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{a.Occupation}</span>}
                    <span className="text-slate-400">{formatDate(a.Created_at)}</span>
                  </div>
                  {a.Status === 3 && a.RejectReason && (
                    <p className="text-[11px] text-red-500 mt-1">เหตุผล: {a.RejectReason}</p>
                  )}
                </div>

                {a.ResumePath && (
                  <a href={getFileUrl(a.ResumePath)} target="_blank" rel="noreferrer"
                    className="p-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition shrink-0" title="ดู Resume">
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                )}

                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${status.bg} ${status.text} ${status.border}`}>
                  {status.label}
                </span>

                {a.Status === 1 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setApprovingApp(a)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition">
                      อนุมัติ
                    </button>
                    <button onClick={() => setRejectingApp(a)}
                      className="px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition">
                      ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {approvingApp && (
        <ApproveApplicationModal
          application={approvingApp}
          onClose={() => setApprovingApp(null)}
          onApprove={handleApprove}
          isSubmitting={isSubmitting}
          showToast={showToast}
          allTutors={allTutors}
          allSubjects={allSubjects}
        />
      )}
      {rejectingApp && (
        <RejectApplicationModal
          application={rejectingApp}
          onClose={() => setRejectingApp(null)}
          onSaved={handleReject}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, icon: Icon, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
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

// ─── ★ ใหม่: เลือกวิชาที่สอนได้หลายวิชา (Multi-select แบบ checkbox + ค้นหา) ──
function SubjectMultiSelect({ allSubjects, selectedIds, onChange }) {
  const [search, setSearch] = useState("");
  const filtered = allSubjects.filter(s => !search || (s.SubjectName || "").toLowerCase().includes(search.toLowerCase()));
  const toggle = (id) => {
    const idStr = String(id);
    onChange(selectedIds.includes(idStr) ? selectedIds.filter(x => x !== idStr) : [...selectedIds, idStr]);
  };
  const selectedItems = allSubjects.filter(s => selectedIds.includes(String(s.SubjectId)));

  return (
    <div>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedItems.map(s => (
            <span key={s.SubjectId} className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[11px] font-semibold">
              {s.SubjectName}
              <button type="button" onClick={() => toggle(s.SubjectId)} className="text-orange-400 hover:text-red-500 transition">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาวิชา..."
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div className="mt-2 max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
        {allSubjects.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">ยังไม่มีรายวิชาในระบบ</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">ไม่พบวิชาที่ค้นหา</p>
        ) : filtered.map(s => {
          const checked = selectedIds.includes(String(s.SubjectId));
          return (
            <label key={s.SubjectId} className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition ${checked ? "bg-orange-50" : "hover:bg-slate-50"}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(s.SubjectId)} className="accent-orange-500" />
              <span className="flex-1 text-slate-700">{s.SubjectName}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── ★ ใหม่: เลือกผู้ติดต่อฉุกเฉินแบบค้นหาจากรายชื่อติวเตอร์ในระบบ (Searchable Select) ──
// พิมพ์ค้นหาชื่อได้อิสระ (ไม่บังคับต้องมีในระบบ) แต่ถ้าเลือกจากรายการ จะดึงเบอร์โทรมาเติมให้อัตโนมัติ (ยังแก้เองได้)
function EmergencyContactSelect({ allTutors, excludeId, value, onSelectName, onSelectPhone }) {
  const [open, setOpen] = useState(false);
  const query = value || "";

  const candidates = allTutors.filter(t => String(t.AdminId) !== String(excludeId));
  const displayNameOf = (t) => t.Nickname || `${t.Firstname} ${t.Lastname}`;
  const filtered = query
    ? candidates.filter(t => {
      const q = query.toLowerCase();
      return displayNameOf(t).toLowerCase().includes(q) || `${t.Firstname} ${t.Lastname}`.toLowerCase().includes(q);
    }).slice(0, 8)
    : candidates.slice(0, 8);

  const pick = (t) => {
    onSelectName(displayNameOf(t));
    if (t.PhoneNo) onSelectPhone(t.PhoneNo);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
        value={query}
        onChange={e => { onSelectName(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="พิมพ์ชื่อ หรือเลือกจากติวเตอร์ในระบบ"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.map(t => (
            <button
              type="button"
              key={t.AdminId}
              onMouseDown={() => pick(t)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition"
            >
              <TutorAvatar tutor={t} className="h-6 w-6 rounded-full text-[10px]" />
              <span className="flex-1 truncate">{displayNameOf(t)}</span>
              {t.PhoneNo && <span className="text-[11px] text-slate-400 shrink-0">{t.PhoneNo}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ★ ใหม่: ผูกติวเตอร์เข้าคอร์ส พร้อมเลือกวิชาที่จะสอนในคอร์สนั้น (แอดมินเลือกวิชาเอง)
// รองรับให้ติวเตอร์สอนได้มากกว่า 1 วิชาในคอร์สเดียวกัน — คลิกคอร์สซ้ำได้เพื่อเพิ่มแถววิชาใหม่
function AddCourseToTutor({ tutorId, assignedCourses, onAdded, allSubjects, showToast }) {
  const [allCourses, setAllCourses] = useState([]);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState([]); // [{ localId, CourseID, SubjectId }]
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { axios.get(`${API}/courses`).then(r => setAllCourses(r.data)); }, []);

  const available = allCourses.filter(c => [1, 2].includes(Number(c.Status_Course_Id)));
  const filtered = available.filter(c => !search || c.CourseName?.toLowerCase().includes(search.toLowerCase()));

  // วิชาที่ผูกกับคอร์สนี้อยู่แล้วใน DB
  const assignedSubjectIdsOf = (courseId) =>
    assignedCourses.filter(c => String(c.CourseID) === String(courseId)).map(c => String(c.SubjectId));

  // วิชาที่ถูกเลือกไว้แล้วในฟอร์มนี้ (แถวอื่นของคอร์สเดียวกัน) — กันเลือกซ้ำในรอบเดียวกัน
  const selectedSubjectIdsOf = (courseId, excludeLocalId) =>
    selected
      .filter(x => String(x.CourseID) === String(courseId) && x.localId !== excludeLocalId)
      .map(x => String(x.SubjectId));

  const addRow = (courseId) => {
    setSelected(p => [...p, { localId: `${courseId}-${Date.now()}-${Math.random()}`, CourseID: courseId, SubjectId: "" }]);
  };
  const removeRow = (localId) => setSelected(p => p.filter(x => x.localId !== localId));
  const setSubjectFor = (localId, subjectId) =>
    setSelected(p => p.map(x => x.localId === localId ? { ...x, SubjectId: subjectId } : x));

  const selectedRows = selected
    .map(sel => ({ ...sel, course: allCourses.find(c => String(c.CourseID) === String(sel.CourseID)) }))
    .filter(x => x.course);

  const handleAdd = async () => {
    if (!selected.length) return showToast("error", "กรุณาเลือกคอร์สอย่างน้อย 1 รายการ");
    if (selected.some(x => !x.SubjectId)) return showToast("error", "กรุณาเลือกวิชาให้ครบทุกรายการ");

    // กันเลือกคอร์ส+วิชาซ้ำกันเองภายในรอบเดียวกัน
    const seen = new Set();
    for (const x of selected) {
      const key = `${x.CourseID}-${x.SubjectId}`;
      if (seen.has(key)) return showToast("error", "มีคอร์สและวิชาที่เลือกซ้ำกันในรายการ กรุณาตรวจสอบ");
      seen.add(key);
    }

    setSaving(true);
    try {
      const res = await axios.post(`${API}/tutor-courses/bulk`, {
        AdminId: tutorId,
        Assignments: selected.map(x => ({ CourseID: x.CourseID, SubjectId: x.SubjectId })),
      });
      const { success = [], skipped = [], failed = [] } = res.data;
      let msg = `เพิ่มสำเร็จ ${success.length} รายการ`;
      if (skipped.length) msg += ` · ข้าม ${skipped.length} รายการ (มีอยู่แล้ว)`;
      if (failed.length) msg += ` · ล้มเหลว ${failed.length} รายการ`;
      showToast(failed.length && !success.length ? "error" : "success", msg, failed[0]?.message);
      setSelected([]); setAdding(false); setSearch("");
      onAdded();
    } catch (e) {
      showToast("error", e.response?.data?.message || "เกิดข้อผิดพลาด", e.response?.data?.error);
    } finally {
      setSaving(false);
    }
  };

  if (!adding) {
    return (
      <button onClick={() => setAdding(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition mb-3">
        <Plus className="h-3.5 w-3.5" /> เพิ่มคอร์สให้ติวเตอร์
      </button>
    );
  }

  return (
    <div className="mb-3 bg-orange-50 border border-orange-100 rounded-xl overflow-hidden">
      {selectedRows.length > 0 && (
        <div className="divide-y divide-orange-100 border-b border-orange-200 bg-white">
          {selectedRows.map(({ localId, course, SubjectId, CourseID }) => {
            const excludeIds = [...assignedSubjectIdsOf(CourseID), ...selectedSubjectIdsOf(CourseID, localId)];
            const subjectOptions = allSubjects.filter(
              s => !excludeIds.includes(String(s.SubjectId)) || String(s.SubjectId) === String(SubjectId)
            );
            return (
              <div key={localId} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1 text-sm font-medium text-slate-800 truncate">{course.CourseName}</span>
                <select
                  value={SubjectId}
                  onChange={e => setSubjectFor(localId, e.target.value)}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">เลือกวิชา...</option>
                  {subjectOptions.map(s => (
                    <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>
                  ))}
                </select>
                <button type="button" onClick={() => removeRow(localId)}
                  className="text-red-400 hover:text-red-600 transition shrink-0" title="เอาออก">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        <input type="text" placeholder="ค้นหาคอร์ส..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400" />
      </div>

      <p className="px-3 -mt-1 pb-1 text-[11px] text-slate-400">
        แสดงเฉพาะคอร์สที่เปิดรับสมัครหรือกำลังสอนอยู่ · คลิกคอร์สเดิมซ้ำได้เพื่อเพิ่มวิชาที่สอง
      </p>

      <div className="max-h-48 overflow-y-auto px-3 space-y-1 pb-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">ไม่พบคอร์สที่สามารถเพิ่มได้</p>
        ) : filtered.map(c => {
          const id = String(c.CourseID);
          const dbCount = assignedSubjectIdsOf(id).length;
          const pendingCount = selected.filter(x => String(x.CourseID) === id).length;
          return (
            <button
              type="button"
              key={id}
              onClick={() => addRow(id)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition hover:bg-white text-left"
            >
              <Plus className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              <span className="flex-1 font-medium text-slate-700 truncate">{c.CourseName}</span>
              {(dbCount + pendingCount) > 0 && (
                <span className="text-[10px] text-orange-500 font-semibold shrink-0">
                  {dbCount} วิชาแล้ว{pendingCount ? ` +${pendingCount}` : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-orange-100">
        <span className="text-xs text-slate-500 flex-1">เลือกแล้ว {selected.length} รายการ</span>
        <button onClick={handleAdd} disabled={saving || !selected.length}
          className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-50 transition flex items-center gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} เพิ่ม
        </button>
        <button onClick={() => { setAdding(false); setSelected([]); setSearch(""); }}
          className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── helper: จัดกลุ่มคอร์สที่สอนตาม CourseID (1 คอร์สอาจมีหลายวิชา) ──────────
function groupCoursesByCourseId(courses) {
  const map = new Map();
  for (const c of courses) {
    if (!map.has(c.CourseID)) {
      map.set(c.CourseID, {
        CourseID: c.CourseID,
        CourseName: c.CourseName,
        StartDate: c.StartDate,
        LastDate: c.LastDate,
        Status_Course_Name: c.Status_Course_Name,
        subjects: [],
      });
    }
    map.get(c.CourseID).subjects.push({
      TutorCourseDetailId: c.TutorCourseDetailId,
      SubjectId: c.SubjectId,
      SubjectName: c.SubjectName,
      TotalHours: c.TotalHours,
    });
  }
  return Array.from(map.values());
}

// แก้ GroupedTutorCourseList ให้แสดง + แก้ไขชั่วโมงได้
function GroupedTutorCourseList({ courses, onRemoveSubject, onUpdateHours, compact = false }) {
  const [editingId, setEditingId] = useState(null); // ★ เพิ่ม
  const grouped = groupCoursesByCourseId(courses);
  if (grouped.length === 0) {
    return <p className="text-center text-slate-400 py-6 text-sm">ยังไม่มีคอร์สที่สอน</p>;
  }
  return (
    <div className={compact ? "mt-2 space-y-2" : "space-y-2"}>
      {grouped.map(g => (
        <div key={g.CourseID} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="font-semibold text-sm text-slate-900 truncate">{g.CourseName}</p>
          {!compact && (
            <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-500">
              <span>{formatDate(g.StartDate)} – {formatDate(g.LastDate)}</span>
              {g.Status_Course_Name && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{g.Status_Course_Name}</span>
              )}
            </div>
          )}
          <div className="flex flex-col gap-1.5 mt-2">
            {g.subjects.map(s => (
              <div key={s.TutorCourseDetailId} className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[11px] font-semibold">
                  {s.SubjectName || "ไม่ระบุวิชา"}
                  <button
                    type="button"
                    onClick={() => onRemoveSubject(s.TutorCourseDetailId, `${g.CourseName} · ${s.SubjectName || "ไม่ระบุวิชา"}`)}
                    className="text-orange-400 hover:text-red-500 transition"
                    title="ถอดออกจากคอร์ส"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>

                {editingId === s.TutorCourseDetailId ? (
                  <HoursInlineEdit
                    value={s.TotalHours}
                    onSave={async (hours) => { await onUpdateHours(s.TutorCourseDetailId, hours); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingId(s.TutorCourseDetailId)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-orange-600 transition"
                    title="แก้ไขชั่วโมงสอน"
                  >
                    {formatHoursLabel(s.TotalHours)} <Edit2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TutorForm ─────────────────────────────────────────────────────────────────
function TutorForm({ initial = {}, onSave, onCancel, isSubmitting, showToast, allTutors, allSubjects }) {
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
    photo: initial.Photo || initial.photo || "",
    // ★ เพิ่ม: วิชาที่สอน (multi-select) — เก็บเป็น array ของ SubjectId (string)
    subjectIds: (initial.TeachingSubjectIds ? String(initial.TeachingSubjectIds).split(",") : []).filter(Boolean),
  });
  const [showPwd, setShowPwd] = useState(false);
  const isEdit = !!initial.AdminId;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [courses, setCourses] = useState([]); // ★ ใหม่: คอร์สที่ติวเตอร์คนนี้สอนอยู่

  const loadCourses = () => {
    if (!isEdit) return;
    axios.get(`${API}/tutors/${initial.AdminId}/courses-students`).then(r => setCourses(r.data.courses || []));
  };
  useEffect(() => { loadCourses(); }, [initial.AdminId]);

  // ★ เพิ่ม: helper สำหรับช่องเงิน (เหมือนหน้าคอร์ส — comma คั่นหลักพัน)
  const handleMoneyChange = (key) => (e) => set(key, sanitizeMoneyInput(e.target.value));
  const moneyDisplay = (v) => (v === "" || v === null || v === undefined ? "" : formatMoney(v));

  const submit = () => {
    if (!form.firstname.trim() || !form.lastname.trim())
      return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณากรอกชื่อ-นามสกุล");
    if (!isEdit && (!form.username.trim() || !form.password.trim()))
      return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณากรอก Username และ Password");
    if (form.ratePerTutors !== "" && Number(form.ratePerTutors) < 0)
      return showToast("error", "ข้อมูลไม่ถูกต้อง", "อัตราค่าสอนต้องเป็นตัวเลขไม่ติดลบ");
    if (form.bankAccountNumber && !isValidBankAccount(form.bankAccountNumber))
      return showToast("error", "ข้อมูลไม่ถูกต้อง", "เลขบัญชีต้องอยู่ในรูปแบบ xxx-x-xxxxx-x");
    onSave(form);   // ← ต้องอยู่บรรทัดสุดท้าย
  };

  const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
  const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <div className="space-y-5">
      {/* รูปโปรไฟล์ */}
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
          <label className={lbl}>ชื่อเล่น / ชื่อที่ใช้เรียก</label>
          <input className={inp} value={form.nickname || ""} onChange={e => set("nickname", e.target.value)} placeholder="เช่น ครูเป้ว" />
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

      {/* ★ เพิ่ม: วิชาที่สอน (เลือกได้หลายวิชา แก้ไขภายหลังได้) */}
      <div>
        <label className={lbl}>วิชาที่สอน</label>
        <SubjectMultiSelect
          allSubjects={allSubjects}
          selectedIds={form.subjectIds}
          onChange={(ids) => set("subjectIds", ids)}
        />
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
            <input className={inp} value={form.bankAccountNumber || ""} onChange={e => set("bankAccountNumber", formatBankAccount(e.target.value))} placeholder="xxx-x-xxxxx-x" />
          </div>
          <div>
            <label className={lbl}>ชื่อบัญชี</label>
            <input className={inp} value={form.bankAccountName || ""} onChange={e => set("bankAccountName", e.target.value)} placeholder="ชื่อ-นามสกุลบัญชี" />
          </div>
        </div>
      </div>

      {/* ผู้ติดต่อฉุกเฉิน — ★ แก้: เลือกชื่อจากรายชื่อติวเตอร์ในระบบได้ (Searchable Select), เบอร์เติมอัตโนมัติแต่แก้เองได้ */}
      <div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>ชื่อผู้ติดต่อฉุกเฉิน</label>
            <EmergencyContactSelect
              allTutors={allTutors}
              excludeId={initial.AdminId}
              value={form.emergencyContactName}
              onSelectName={(name) => set("emergencyContactName", name)}
              onSelectPhone={(phone) => set("emergencyContactPhoneNo", formatPhone(phone))}
            />
          </div>
          <div>
            <label className={lbl}>เบอร์ผู้ติดต่อฉุกเฉิน</label>
            <input
              className={inp}
              value={form.emergencyContactPhoneNo || ""}
              onChange={e => set("emergencyContactPhoneNo", formatPhone(e.target.value))}
              placeholder="098-888-8888"
              inputMode="numeric"
            />
          </div>
        </div>
      </div>

      <div>
        <label className={lbl}>หมายเหตุ</label>
        <textarea className={inp} rows={2} value={form.remark || ""} onChange={e => set("remark", e.target.value)} />
      </div>

      {/* ★ แก้: แสดง Username แบบอ่านอย่างเดียวตอนแก้ไข ต้องโชว์ค่าปัจจุบันเสมอ (เดิมหน้านี้ไม่มีบล็อกนี้เลย) */}
      {isEdit && (
        <div>
          <label className={lbl}>Username</label>
          <input
            className={inp + " bg-slate-50 text-slate-900 font-medium cursor-default"}
            value={form.username}
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

      {isEdit && (
        <div>
          <label className={lbl}>คอร์สที่สอน</label>
          <AddCourseToTutor
            tutorId={initial.AdminId}
            assignedCourses={courses}
            onAdded={loadCourses}
            allSubjects={allSubjects}
            showToast={showToast}
          />
          <GroupedTutorCourseList
            courses={courses}
            compact
            onRemoveSubject={async (tutorCourseDetailId) => {
              try {
                await axios.delete(`${API}/tutor-courses/${tutorCourseDetailId}`);
                loadCourses();
              } catch (err) {
                showToast("error", err.response?.data?.message || "ถอดไม่สำเร็จ");
              }
            }}
            onUpdateHours={async (tutorCourseDetailId, hours) => {
              try {
                await axios.put(`${API}/tutorcoursedetails/${tutorCourseDetailId}`, { TotalHours: hours });
                loadCourses();
              } catch (err) {
                showToast("error", err.response?.data?.message || "แก้ไขชั่วโมงไม่สำเร็จ");
              }
            }}
          />
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

// ─── ResetPasswordModal — ★ แก้: alert() → showToast() ─────────────────────────
function ResetPasswordModal({ tutor, onClose, showToast }) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const inp = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400 transition";

  const submit = async () => {
    if (!pwd.trim()) return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณากรอกรหัสผ่านใหม่");
    setLoading(true);
    try {
      await axios.patch(`${API}/tutors/${tutor.AdminId}/reset-password`, { newPassword: pwd });
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

// ─── ★ ใหม่: TutorStatusModal — เปลี่ยนสถานะ กำลังสอน / เลิกสอน พร้อมเหตุผล ──
// ไม่ลบ User ออกจากระบบ เพื่อเก็บประวัติ (ยังคงดูข้อมูลย้อนหลัง / ประวัติค่าสอนได้ตามปกติ)
function TutorStatusModal({ tutor, onClose, onSaved, showToast }) {
  const currentStatus = tutor.Status_Tutor_Id || 1;
  const [statusTutorId, setStatusTutorId] = useState(currentStatus);
  const [reason, setReason] = useState(tutor.ResignReason || "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (statusTutorId === 2 && !reason.trim())
      return showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณาระบุเหตุผลการเลิกสอน");
    setLoading(true);
    try {
      await axios.patch(`${API}/tutors/${tutor.AdminId}/status`, {
        statusTutorId,
        resignReason: statusTutorId === 2 ? reason.trim() : null,
      });
      showToast("success", "อัปเดตสถานะสำเร็จ");
      onSaved();
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
            <UserCog className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">เปลี่ยนสถานะติวเตอร์</h3>
            <p className="text-xs text-slate-400">{tutor.Nickname || `${tutor.Firstname} ${tutor.Lastname}`}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setStatusTutorId(1)}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-bold transition
              ${statusTutorId === 1 ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            <UserCheck className="h-5 w-5" /> กำลังสอน
          </button>
          <button
            onClick={() => setStatusTutorId(2)}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-bold transition
              ${statusTutorId === 2 ? "bg-slate-100 border-slate-400 text-slate-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            <UserX className="h-5 w-5" /> เลิกสอน
          </button>
        </div>

        {statusTutorId === 2 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
              เหตุผลการเลิกสอน <span className="text-red-400 normal-case">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none transition"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="เช่น ย้ายที่อยู่ / ปรับตารางเรียน / ลาออก..."
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Info className="h-3 w-3" /> ข้อมูลติวเตอร์และประวัติค่าสอนจะยังถูกเก็บไว้ตามเดิม ไม่มีการลบผู้ใช้ออกจากระบบ
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
            ยกเลิก
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-50 transition">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึก"}
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
function TutorRow({ t, setEditingTutor, setResetPwdTutor, setDeletingTutor, setStatusTutor, setViewTutor }) {
  const displayName = t.Nickname || `${t.Firstname} ${t.Lastname}`;
  const fullName = `${t.Firstname} ${t.Lastname}`;
  const status = statusOf(t.Status_Tutor_Id);
  const isInactive = Number(t.Status_Tutor_Id) === 2;

  return (
    <tr className={`hover:bg-orange-50/40 transition-colors ${isInactive ? "opacity-60" : ""}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <TutorAvatar tutor={t} className="h-10 w-10 rounded-xl text-sm" />
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
        {/* ★ แก้: แสดงวิชาที่สอน (จากรายการที่เลือกโดยตรง) แทนวิชาที่คำนวณจากคอร์สเดิม */}
        {(t.TeachingSubjects || t.Subjects) && (
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <BookOpen className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1 max-w-[160px]">{t.TeachingSubjects || t.Subjects}</span>
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
      {/* ★ เพิ่ม: คอลัมน์สถานะ */}
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.bg} ${status.text} ${status.border}`}>
          {isInactive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
          {t.StudentCount || 0}
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
          {/* ★ เพิ่ม: ปุ่มดูข้อมูล วางไว้เป็นปุ่มแรกสุด เหมือนหน้านักเรียน */}
          <button onClick={() => setViewTutor(t)}
            className="p-1.5 text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition" title="ดูข้อมูลติวเตอร์">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setEditingTutor(t)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition">
            <Edit2 className="h-3.5 w-3.5" /> แก้ไข
          </button>
          <button onClick={() => setStatusTutor(t)}
            className="p-1.5 text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition" title="เปลี่ยนสถานะ">
            <UserCog className="h-3.5 w-3.5" />
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

// ─── ★ ใหม่: Performance Score helpers (ย้ายมาจาก AdminAttendanceDashboard) ──
function calcBadge(score) {
  if (score === null || score === undefined) return { label: 'ยังไม่มีคะแนน', bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200' };
  if (score >= 90) return { label: 'ดีเด่น', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  if (score >= 80) return { label: 'เยี่ยม', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  if (score >= 70) return { label: 'ดี', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  if (score >= 55) return { label: 'พอใช้', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  return { label: 'ต้องปรับปรุง', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
}

// ★ เพิ่ม: จัดกลุ่มตามคะแนนที่เท่ากัน แล้วเอาแค่ 3 "กลุ่มคะแนน" สูงสุด (ไม่ใช่ 3 คนแรก)
function topScoreGroups(sortedList, groupCount = 3) {
  const groups = [];
  for (const item of sortedList) {
    const last = groups[groups.length - 1];
    if (last && last.score === item.PerformanceScore) {
      last.members.push(item);
    } else {
      if (groups.length >= groupCount) break;
      groups.push({ score: item.PerformanceScore, members: [item] });
    }
  }
  return groups;
}

function ScoreRing({ score }) {
  const r = 20, circ = 2 * Math.PI * r;
  const isNA = score === null || score === undefined;
  const safeScore = score ?? 0;
  const dash = (safeScore / 100) * circ;
  const color = isNA ? '#94A3B8' : safeScore >= 80 ? '#1D9E75' : safeScore >= 60 ? '#BA7517' : '#E24B4A';
  return (
    <svg width="56" height="56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`}
        strokeDashoffset={`${(circ / 4).toFixed(1)}`}
        strokeLinecap="round" />
      <text x="28" y="33" textAnchor="middle" fontSize="14" fontWeight="500" fill={color}>
        {isNA ? '–' : score}
      </text>
    </svg>
  );
}

function MetricBreakdown({ tutor, minWeeksForConsistency = 3 }) {
  // ★ เพิ่ม: ถ้าข้อมูลไม่พอ (สัปดาห์น้อยกว่าเกณฑ์) ConsistencyScore ที่ backend ส่งมาคือค่ากลาง (50) ไม่ใช่ค่าที่วัดได้จริง
  const isConsistencyDefault = typeof tutor.WeeksWithData === 'number' && tutor.WeeksWithData < minWeeksForConsistency;

  const noSchedule = tutor.ScheduledHours === null || tutor.ScheduledHours === undefined;

  const metrics = [
    {
      name: 'อัตราเช็กอิน', val: tutor.CheckinRate, weight: 35,
      sub: `${tutor.TotalCheckin} / ${tutor.TotalScheduled} คาบ`,
      warn: false,
    },
    {
      name: 'ปฏิบัติหน้าที่ตามภาระงาน', val: noSchedule ? 0 : tutor.ResponsibilityScore, weight: 45,
      sub: noSchedule
        ? 'เดือนนี้ไม่มีชั่วโมงสอนตามตาราง — ไม่มีข้อมูลเปรียบเทียบ (N/A)'
        : `${tutor.ActualHours} ชม. / ตารางสอน ${tutor.ScheduledHours} ชม.`,
      warn: noSchedule,
    },
    {
      name: 'ความสม่ำเสมอ', val: tutor.ConsistencyScore, weight: 20,
      sub: isConsistencyDefault
        ? `ข้อมูลมีแค่ ${tutor.WeeksWithData ?? 0} สัปดาห์ (ต้องมีอย่างน้อย ${minWeeksForConsistency} สัปดาห์) จึงให้คะแนนกลางแทนค่าจริง`
        : 'วัดจาก stddev การสอนต่อสัปดาห์',
      warn: isConsistencyDefault,
    },
  ];

  return (
    <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 space-y-2">
      {/* ★ เพิ่ม: เตือนรวมด้านบนถ้าคาบสอนน้อยกว่าเกณฑ์ขึ้นโพเดียม */}
      {tutor.LowDataWarning && (
        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1">
          <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            ติวเตอร์คนนี้มีคาบสอนสะสมน้อย ({tutor.TotalScheduled} คาบ) คะแนนนี้จึงอาจยังไม่สะท้อนผลงานจริง และจะไม่ถูกนำไปจัดอันดับบนโพเดียม
          </p>
        </div>
      )}
      {metrics.map(m => {
        const contrib = Math.round(m.val * m.weight / 100);
        const barColor = m.warn ? 'bg-amber-400' : m.val >= 80 ? 'bg-emerald-500'
          : m.val >= 60 ? 'bg-amber-500' : 'bg-red-500';
        const textColor = m.warn ? 'text-amber-600' : m.val >= 80 ? 'text-emerald-700'
          : m.val >= 60 ? 'text-amber-700' : 'text-red-700';
        return (
          <div key={m.name}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-36 shrink-0">
                {m.name}
                <span className="text-[10px] ml-1">(×{m.weight}%)</span>
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${m.val}%` }} />
              </div>
              <span className={`text-xs font-semibold w-6 text-right ${textColor}`}>
                {contrib}
              </span>
            </div>
            <p className={`text-[10px] ml-[9.5rem] mt-0.5 ${m.warn ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
              {m.warn && <Info className="inline h-2.5 w-2.5 mr-0.5 -mt-0.5" />}{m.sub}
            </p>
          </div>
        );
      })}

      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
        <span className="text-xs text-slate-500">คะแนนรวม</span>
        <span className="text-base font-semibold">
          {tutor.PerformanceScore === null ? 'ยังไม่มีข้อมูล (ไม่มีตารางสอนเดือนนี้)' : `${tutor.PerformanceScore} / 100`}
        </span>
      </div>
    </div>
  );
}

function TutorScoreCard({ tutor, index, expanded, onToggle, onView, minWeeksForConsistency }) {
  {/* ★ เพิ่ม onView */ }
  const badge = calcBadge(tutor.PerformanceScore);
  const MEDAL = ['🥇', '🥈', '🥉'];
  return (
    <div className={`bg-white rounded-2xl border transition-all
      ${index === 0 ? 'border-amber-300' : 'border-slate-200'}`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggle}>
        {/* rank */}
        <span className="text-lg w-6 text-center shrink-0">
          {index < 3 ? MEDAL[index] : <span className="text-xs text-slate-400">{index + 1}</span>}
        </span>
        {/* avatar */}
        <TutorAvatar tutor={tutor} className="h-9 w-9 rounded-xl text-xs shrink-0" />
        {/* info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{tutor.Nickname}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.label}
            </span>
            {/* ★ เพิ่ม: badge เตือนข้อมูลยังไม่พอ — ยังโชว์ในลิสต์ได้ แต่ไม่ขึ้นโพเดียม */}
            {tutor.LowDataWarning && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-200">
                <Info className="h-2.5 w-2.5" /> ข้อมูลยังไม่พอ
              </span>
            )}
            <span className="text-[10px] text-slate-400">{tutor.TotalScheduled} คาบ</span>
          </div>
        </div>
        {/* score ring */}
        <ScoreRing score={tutor.PerformanceScore} />

        {/* ★ เพิ่ม: ปุ่มดวงตา — วางตรงนี้ ระหว่าง ScoreRing กับ chevron */}
        <button
          onClick={e => { e.stopPropagation(); onView(tutor); }}
          className="shrink-0 p-1.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-100 transition"
          title="ดูข้อมูลติวเตอร์"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>

        {/* chevron */}
        {expanded
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </div>
      {expanded && <div className="px-4 pb-3"><MetricBreakdown tutor={tutor} minWeeksForConsistency={minWeeksForConsistency} /></div>}
    </div>
  );
}

// ─── ★ ใหม่: Performance Score ประจำเดือน ของติวเตอร์ (ย้ายมาจากหน้า Attendance) ──
const DEFAULT_TUTOR_LIMIT = 5;

function TutorPerformanceRanking({ onViewTutor, allSubjects = [] }) {
  const [perfData, setPerfData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterSubject, setFilterSubject] = useState('all'); // ★ เพิ่ม
  const [filterScoreRange, setFilterScoreRange] = useState('all'); // ★ เพิ่ม
  const [showLimit, setShowLimit] = useState(DEFAULT_TUTOR_LIMIT);
  // ★ เพิ่ม: เกณฑ์จาก backend ใช้บอกผู้ใช้ว่าทำไมบางคนไม่ขึ้นโพเดียม / คะแนนความสม่ำเสมอเป็นค่ากลาง
  const [minWeeksForConsistency, setMinWeeksForConsistency] = useState(3);
  const [minSessionsForRanking, setMinSessionsForRanking] = useState(5);
  const [minScoreForPodium, setMinScoreForPodium] = useState(70); // ★ เพิ่ม

  // ★ ช่วงคะแนน อ้างอิงเกณฑ์เดียวกับ calcBadge เพื่อให้ label ตรงกับ badge ที่โชว์อยู่
  const SCORE_RANGES = [
    { key: 'excellent', label: 'ดีเด่น', test: (v) => v >= 90 },
    { key: 'great', label: 'เยี่ยม', test: (v) => v >= 80 && v < 90 },
    { key: 'good', label: 'ดี', test: (v) => v >= 70 && v < 80 },
    { key: 'fair', label: 'พอใช้', test: (v) => v >= 55 && v < 70 },
    { key: 'needs_work', label: 'ต้องปรับปรุง', test: (v) => v < 55 },
  ];
  const allSubjectNames = [...new Set(allSubjects.map(s => s.SubjectName))].sort();

  useEffect(() => {
    axios.get(`${API}/tutors/performance`)
      .then(r => {
        setPerfData(r.data.tutors || []);
        // ★ เพิ่ม: เก็บเกณฑ์ขั้นต่ำที่ backend ส่งมา ไว้ใช้แสดงคำอธิบายในหน้านี้
        if (r.data.minWeeksForConsistency) setMinWeeksForConsistency(r.data.minWeeksForConsistency);
        if (r.data.minSessionsForRanking) setMinSessionsForRanking(r.data.minSessionsForRanking);
        if (r.data.minScoreForPodium) setMinScoreForPodium(r.data.minScoreForPodium);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setShowLimit(DEFAULT_TUTOR_LIMIT);
    setExpandedId(null);
  }, [filterSubject, filterScoreRange]); // ★ เพิ่มทั้ง useEffect นี้

  const matchSubjectFn = (t) => filterSubject === 'all' ||
    (t.TeachingSubjects || '').split(',').map(x => x.trim()).includes(filterSubject);

  const matchScoreFn = (t) => {
    if (filterScoreRange === 'all') return true;
    if (t.PerformanceScore === null || t.PerformanceScore === undefined) return false;
    const range = SCORE_RANGES.find(r => r.key === filterScoreRange);
    return range ? range.test(t.PerformanceScore) : true;
  };

  const filtered = perfData.filter(t => matchSubjectFn(t) && matchScoreFn(t));

  // ★ นับจำนวนสำหรับ dropdown วิชา
  const baseForScoreCount = perfData.filter(matchSubjectFn);
  const allSubjectPerfCount = perfData.filter(matchScoreFn).length;
  const subjectPerfCounts = allSubjectNames.reduce((acc, sub) => {
    acc[sub] = perfData.filter(t =>
      (t.TeachingSubjects || '').split(',').map(x => x.trim()).includes(sub) && matchScoreFn(t)
    ).length;
    return acc;
  }, {});

  // ★ นับจำนวนสำหรับ dropdown ช่วงคะแนน
  const scoreRangeCounts = SCORE_RANGES.reduce((acc, r) => {
    acc[r.key] = baseForScoreCount.filter(t =>
      t.PerformanceScore !== null && t.PerformanceScore !== undefined && r.test(t.PerformanceScore)
    ).length;
    return acc;
  }, {});

  const visible = filtered.slice(0, showLimit);
  const hasMore = filtered.length > showLimit;
  // ★ แก้: โพเดียมเอาเฉพาะคนที่ข้อมูลพอ (!LowDataWarning) มาจัดกลุ่ม — คนข้อมูลน้อยยังอยู่ในลิสต์ด้านล่างได้ แต่ไม่ขึ้นโพเดียม
  const podiumEligible = filtered.filter(t => t.EligibleForRanking);
  const podiumGroups = topScoreGroups(podiumEligible, 3); // ★ แก้: จัดกลุ่มตามคะแนนเท่ากัน แทน slice(0,3)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100
                      bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="h-5 w-5 text-white" />
          <h2 className="font-bold text-white text-sm">Performance Score ติวเตอร์ประจำเดือน</h2>
        </div>
        <span className="text-[11px] text-orange-100">เช็กอิน 35% + ปฏิบัติหน้าที่ตามภาระงาน 45% + ความสม่ำเสมอ 20%</span>
      </div>

      {/* ★ เพิ่ม: บอกชัดว่าคำนวณจากเดือนปัจจุบันเท่านั้น ไม่ใช่ช่วงเวลาเดียวกับหน้า Attendance */}
      <div className="px-5 pt-3">
        <p className="flex items-center gap-1 text-[11px] text-slate-400">
          <Info className="h-3 w-3 shrink-0" />
          คำนวณจากคาบสอนในเดือนปัจจุบันเท่านั้น (ไม่อ้างอิงตามช่วงวันที่ที่เลือกในหน้าบันทึกชั่วโมงการสอน)
        </p>
      </div>

      {/* ★ เพิ่ม: แถบตัวกรอง วิชา + ช่วงคะแนน */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2 flex-wrap">
        <div className="relative ml-auto">
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200
                 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-orange-400
                 focus:border-transparent outline-none transition cursor-pointer"
          >
            <option value="all">ทุกวิชา ({allSubjectPerfCount} คน)</option>
            {allSubjectNames.map(sub => (
              <option key={sub} value={sub}>{sub} ({subjectPerfCounts[sub] || 0} คน)</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterScoreRange}
            onChange={e => setFilterScoreRange(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200
                 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-orange-400
                 focus:border-transparent outline-none transition cursor-pointer"
          >
            <option value="all">ทุกระดับคะแนน ({baseForScoreCount.length} คน)</option>
            {SCORE_RANGES.map(r => (
              <option key={r.key} value={r.key}>{r.label} ({scoreRangeCounts[r.key] || 0} คน)</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        {(filterSubject !== 'all' || filterScoreRange !== 'all') && (
          <button
            onClick={() => { setFilterSubject('all'); setFilterScoreRange('all'); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                 text-slate-500 bg-white border border-slate-200 rounded-lg
                 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition"
          >
            <X className="h-3.5 w-3.5" /> ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="px-5 pb-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm">ไม่พบติวเตอร์ที่ตรงกับตัวกรอง</p>
          </div>
        ) : (
          <>
            {filtered.length >= 1 && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[podiumGroups[1], podiumGroups[0], podiumGroups[2]].map((group, i) => {
                    const medalIdx = i === 0 ? 1 : i === 1 ? 0 : 2; // 0=ทอง 1=เงิน 2=ทองแดง
                    const MEDALS = ['🥇', '🥈', '🥉'];

                    if (!group) {
                      return (
                        <div key={`empty-${i}`}
                          className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center"
                          style={{ marginTop: medalIdx === 0 ? 0 : medalIdx === 1 ? 16 : 32 }}
                        >
                          <div className="text-2xl opacity-30">{MEDALS[medalIdx]}</div>
                          <div className="h-10 w-10 rounded-xl bg-slate-200/60 mx-auto mt-2 flex items-center justify-center">
                            <Users className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="text-xs font-medium text-slate-400 mt-1.5">ยังไม่มี</p>
                          <p className="text-lg font-black text-slate-300 mt-1">—</p>
                          <p className="text-[10px] text-slate-300">คะแนน</p>
                        </div>
                      );
                    }

                    return (
                      <div key={group.score}
                        className={`rounded-xl border p-3 text-center transition-all duration-200 cursor-pointer
                        hover:-translate-y-1.5 hover:shadow-lg hover:scale-[1.03]
                        ${medalIdx === 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-slate-50'}`}
                        style={{ marginTop: medalIdx === 0 ? 0 : medalIdx === 1 ? 16 : 32 }}
                      >
                        <div className="text-2xl">{MEDALS[medalIdx]}</div>
                        <div className="flex justify-center -space-x-2 mt-2">
                          {group.members.slice(0, 4).map(t => (
                            <button key={t.AdminId} onClick={() => onViewTutor(t)}
                              className="h-10 w-10 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:z-10 hover:scale-105 transition"
                              title={t.Nickname}>
                              <TutorAvatar tutor={t} className="h-10 w-10 rounded-xl text-xs" />
                            </button>
                          ))}
                          {group.members.length > 4 && (
                            <span className="h-10 w-10 rounded-xl border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                              +{group.members.length - 4}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-800 mt-1.5 truncate">
                          {group.members.length === 1
                            ? group.members[0].Nickname
                            : `${group.members.length} คนเสมอกัน`}
                        </p>
                        <p className="text-lg font-black text-slate-900 mt-1">{group.score}</p>
                        <p className="text-[10px] text-slate-400">คะแนน</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="space-y-2">
              {visible.map((t, i) => (
                <TutorScoreCard
                  key={t.AdminId}
                  tutor={t}
                  index={i}
                  expanded={expandedId === t.AdminId}
                  onToggle={() => setExpandedId(expandedId === t.AdminId ? null : t.AdminId)}
                  onView={onViewTutor}
                  minWeeksForConsistency={minWeeksForConsistency}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-400">
                แสดง <span className="font-semibold text-slate-600">{visible.length}</span> จาก{' '}
                <span className="font-semibold text-slate-600">{filtered.length}</span> คน
              </p>
              <div className="flex gap-2">
                {showLimit > DEFAULT_TUTOR_LIMIT && (
                  <button onClick={() => { setShowLimit(DEFAULT_TUTOR_LIMIT); setExpandedId(null); }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition">
                    แสดงน้อยลง
                  </button>
                )}
                {hasMore && (
                  <button onClick={() => setShowLimit(v => v + DEFAULT_TUTOR_LIMIT)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold
                               text-orange-600 bg-orange-50 border border-orange-200
                               rounded-lg hover:bg-orange-100 transition">
                    <ChevronDown className="h-3.5 w-3.5" />
                    แสดงเพิ่มอีก {Math.min(DEFAULT_TUTOR_LIMIT, filtered.length - showLimit)} คน
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ★ เพิ่ม: คำอธิบายที่มาของ Performance Score */}
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
        {/* <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-600">Performance ของติวเตอร์</span> เป็นคะแนนประเมินแบบละเอียด
          คำนวณจากหลายปัจจัย ได้แก่ การเช็กอินการสอน 35% · การปฏิบัติหน้าที่ตามภาระงาน 45% · ความสม่ำเสมอในการปฏิบัติงาน 20%
          ดังนั้นสถานะ Performance ไม่ได้พิจารณาจากจำนวนครั้งที่เช็กอินเพียงอย่างเดียว แต่เป็นคะแนนภาพรวมที่สะท้อนคุณภาพและความรับผิดชอบของติวเตอร์
          จึงอาจแตกต่างจากสถานะในหน้าบันทึกชั่วโมงการสอนได้
        </p> */}
        {/* ★ เพิ่ม: คำอธิบายเกณฑ์ขึ้นโพเดียม ให้แอดมินเข้าใจว่าทำไมบางคนไม่ขึ้น */}
        <p className="flex items-center gap-1 text-[11px] text-slate-400">
          <Info className="h-3 w-3 shrink-0" />
          ขึ้นโพเดียมได้เฉพาะติวเตอร์ที่มีคาบสอนอย่างน้อย {minSessionsForRanking} คาบ และ Performance Score ตั้งแต่ {minScoreForPodium} คะแนนขึ้นไป ({podiumEligible.length} คนเข้าเกณฑ์)
        </p>
      </div>
    </div>
  );
}

function TutorDetailModal({ tutor, onClose, showToast, allSubjects }) {
  const [data, setData] = useState(null);
  const [perf, setPerf] = useState(null);   // ★ เพิ่ม
  const [minWeeksForConsistency, setMinWeeksForConsistency] = useState(3); // ★ เพิ่ม
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const loadDetail = () => {
    setLoading(true);
    return Promise.all([
      axios.get(`${API}/tutors/${tutor.AdminId}/courses-students`),
      axios.get(`${API}/tutors/performance`),
    ])
      .then(([csRes, perfRes]) => {
        setData(csRes.data);
        const found = (perfRes.data.tutors || []).find(t => t.AdminId === tutor.AdminId);
        setPerf(found || null);
        if (perfRes.data.minWeeksForConsistency) setMinWeeksForConsistency(perfRes.data.minWeeksForConsistency); // ★ เพิ่ม
      })
      .catch(e => {
        console.error('[TutorDetailModal]', e);
        setData({ courses: [], students: [] });
        setPerf(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDetail(); }, [tutor.AdminId]);

  const displayName = tutor.Nickname || `${tutor.Firstname} ${tutor.Lastname}`;
  const badge = calcBadge(perf?.PerformanceScore ?? 0);

  const uniqueCourseCount = new Set((data?.courses || []).map(c => c.CourseID)).size;

  const TABS = [
    { key: 'overview', label: 'ภาพรวม' },
    { key: 'courses', label: 'คอร์สที่สอน', count: uniqueCourseCount },
    { key: 'students', label: 'นักเรียน', count: data?.students.length },
  ];

  return (
    <Modal title={`ข้อมูลติวเตอร์: ${displayName}`} icon={Eye} onClose={onClose} wide>
      {/* Profile card */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl text-white">
        <TutorAvatar tutor={tutor} className="h-16 w-16 rounded-2xl text-lg border-2 border-white/30" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg">{displayName}</p>
          <p className="text-sm text-orange-100">{tutor.Firstname} {tutor.Lastname}</p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {tutor.TeachingSubjects && <span className="bg-white/20 px-2 py-0.5 rounded-full">{tutor.TeachingSubjects}</span>}
            <span className={`px-2 py-0.5 rounded-full font-semibold ${badge.bg} ${badge.text}`}>{badge.label}</span>
            {/* ★ เพิ่ม: บอกด้วยว่าถ้าข้อมูลยังไม่พอ จะไม่ถูกจัดอันดับโพเดียม */}
            {perf?.LowDataWarning && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-white/20">
                <Info className="h-3 w-3" /> ข้อมูลยังไม่พอสำหรับจัดอันดับ
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <p className="text-xl font-black">{data?.students.length ?? tutor.StudentCount ?? 0}</p>
            <p className="text-[10px] text-orange-100">นักเรียน</p>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <p className="text-xl font-black">{tutor.TotalSessions ?? 0}</p>
            <p className="text-[10px] text-orange-100">คาบสะสม</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.key ? 'bg-white shadow text-orange-600' : 'text-slate-500'}`}>
            {t.label}{t.count !== undefined && ` (${t.count})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
      ) : (
        <>
          {tab === 'courses' && (
            <div className="space-y-3">
              <AddCourseToTutor
                tutorId={tutor.AdminId}
                assignedCourses={data.courses}
                onAdded={loadDetail}
                allSubjects={allSubjects}
                showToast={showToast}
              />
              <GroupedTutorCourseList
                courses={data.courses}
                onRemoveSubject={async (tutorCourseDetailId, label) => {
                  if (!confirm(`ถอด "${label}" ออกจากคอร์สที่ติวเตอร์คนนี้สอนอยู่?`)) return;
                  try {
                    await axios.delete(`${API}/tutor-courses/${tutorCourseDetailId}`);
                    loadDetail();
                  } catch (err) {
                    showToast("error", err.response?.data?.message || "ถอดไม่สำเร็จ");
                  }
                }}
                onUpdateHours={async (tutorCourseDetailId, hours) => {
                  try {
                    await axios.put(`${API}/tutorcoursedetails/${tutorCourseDetailId}`, { TotalHours: hours });
                    loadDetail();
                  } catch (err) {
                    showToast("error", err.response?.data?.message || "แก้ไขชั่วโมงไม่สำเร็จ");
                  }
                }}
              />
            </div>
          )}

          {tab === 'students' && (
            data.students.length === 0
              ? <p className="text-center text-slate-400 py-8">ยังไม่มีนักเรียน</p>
              : <div className="space-y-1">
                {data.students.map(s => (
                  <div key={`${s.UserId}-${s.CourseID}`} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50">
                    <span className="text-sm text-slate-700">{s.Nickname || `${s.Firstname} ${s.Lastname}`}</span>
                    <span className="text-[11px] text-slate-400">{s.CourseName}</span>
                  </div>
                ))}
              </div>
          )}

          {tab === 'overview' && (
            perf
              ? <MetricBreakdown tutor={perf} minWeeksForConsistency={minWeeksForConsistency} />
              : <p className="text-center text-slate-400 py-8">ยังไม่มีข้อมูล Performance เดือนนี้</p>
          )}
        </>
      )}
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTutorsPage() {
  const { toasts, showToast, removeToast } = useToast(); //alert ต่างๆ
  const [tutors, setTutors] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]); // ★ เพิ่ม: รายวิชาทั้งหมดในระบบ สำหรับ multi-select
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // ★ เพิ่ม: กรองตามสถานะ
  const [filterHasStudents, setFilterHasStudents] = useState("all"); // ★ เพิ่ม: all | has | none
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // FIX #7-equivalent

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTutor, setEditingTutor] = useState(null);
  const [deletingTutor, setDeletingTutor] = useState(null);
  const [resetPwdTutor, setResetPwdTutor] = useState(null);
  const [statusTutor, setStatusTutor] = useState(null); // ★ เพิ่ม
  const [viewTutor, setViewTutor] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [applications, setApplications] = useState([]);

  const fetchTutors = async () => {
    try {
      const res = await axios.get(`${API}/tutors`);
      setTutors(res.data);
    } catch (e) {
      console.error("fetch tutors error:", e);
      showToast("error", "โหลดข้อมูลติวเตอร์ไม่สำเร็จ");
    } finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API}/subjects`);
      setAllSubjects(res.data || []);
    } catch (e) {
      console.error("fetch subjects error:", e);
      // ไม่ต้อง toast error ตรงนี้ ป้องกันรบกวนถ้า endpoint ยังไม่พร้อมใช้งาน
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${API}/tutor-applications`);
      setApplications(res.data);
    } catch (e) {
      console.error("fetch applications error:", e);
    }
  };

  useEffect(() => { fetchTutors(); fetchSubjects(); fetchApplications(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterSubject, filterStatus, filterHasStudents]);

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

  const allSubjectNames = [...allSubjects.map(s => s.SubjectName)].sort();

  const matchSearchFn = (t) => {
    const displayName = (t.Nickname || `${t.Firstname} ${t.Lastname}`).toLowerCase();
    const s = search.toLowerCase();
    return !s || displayName.includes(s) || (t.PhoneNo || "").includes(s) ||
      String(t.AdminId).includes(s) || (t.TeachingSubjects || t.Subjects || "").toLowerCase().includes(s);
  };
  const matchSubjectFn = (t) => filterSubject === "all" ||
    (t.TeachingSubjects || t.Subjects || "").split(",").map(x => x.trim()).includes(filterSubject);
  const matchStatusFn = (t) => filterStatus === "all" || String(t.Status_Tutor_Id || 1) === filterStatus;
  const matchHasStudentsFn = (t) => filterHasStudents === "all" ||
    (filterHasStudents === "has" ? Number(t.StudentCount) > 0 : !Number(t.StudentCount));

  const filtered = tutors.filter(t =>
    matchSearchFn(t) && matchSubjectFn(t) && matchStatusFn(t) && matchHasStudentsFn(t)
  );

  // ★ นับจำนวนสำหรับ dropdown วิชา (กรองไขว้กับตัวกรองอื่นที่เลือกไว้ก่อน)
  const baseForSubjectCount = tutors.filter(t => matchSearchFn(t) && matchStatusFn(t) && matchHasStudentsFn(t));
  const allSubjectCount = baseForSubjectCount.length;
  const subjectCounts = allSubjectNames.reduce((acc, sub) => {
    acc[sub] = baseForSubjectCount.filter(t =>
      (t.TeachingSubjects || t.Subjects || "").split(",").map(x => x.trim()).includes(sub)
    ).length;
    return acc;
  }, {});

  // ★ นับจำนวนสำหรับ dropdown สถานะ
  const baseForStatusCount = tutors.filter(t => matchSearchFn(t) && matchSubjectFn(t) && matchHasStudentsFn(t));
  const allStatusCount = baseForStatusCount.length;
  const activeStatusCount = baseForStatusCount.filter(t => String(t.Status_Tutor_Id || 1) === "1").length;
  const inactiveStatusCount = baseForStatusCount.filter(t => String(t.Status_Tutor_Id || 1) === "2").length;

  // ★ นับจำนวนสำหรับ dropdown มี/ไม่มีนักเรียน
  const baseForHasStudentsCount = tutors.filter(t => matchSearchFn(t) && matchSubjectFn(t) && matchStatusFn(t));
  const hasStudentsCount = baseForHasStudentsCount.filter(t => Number(t.StudentCount) > 0).length;
  const noStudentsCount = baseForHasStudentsCount.filter(t => !Number(t.StudentCount)).length;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-orange-500">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลติวเตอร์...</p>
    </div>
  );

  const activeTutorCount = tutors.filter(t => Number(t.Status_Tutor_Id || 1) === 1).length;
  const inactiveTutorCount = tutors.length - activeTutorCount;

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
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
                    ${activeTab === 'applications'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          สมัครเป็นติวเตอร์
        </button>
      </div>

      {/* ── Attendance Tab ── */}
      {activeTab === 'attendance' && <AdminAttendanceDashboard />}

      {activeTab === 'applications' && (
        <TutorApplicationList
          applications={applications}
          onRefresh={() => { fetchApplications(); fetchTutors(); }}   // ← แก้ตรงนี้
          showToast={showToast}
          allTutors={tutors}
          allSubjects={allSubjects}
        />
      )}

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

        {/* Stats — ★ เพิ่มคำอธิบายที่มาของตัวเลข + แยกนับเฉพาะติวเตอร์ที่ "กำลังสอน" สำหรับนักเรียนรวม/คาบสอนรวม */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "ติวเตอร์ทั้งหมด", value: tutors.length, color: "bg-orange-500", hint: "รวมทุกสถานะ (กำลังสอน + เลิกสอน)" },
            { label: "ติวเตอร์ที่กำลังสอน", value: activeTutorCount, color: "bg-emerald-500" },
            { label: "ติวเตอร์ที่เลิกสอน", value: inactiveTutorCount, color: "bg-slate-500" },
          ].map(({ label, value, color, hint }, i) => (
            <div key={i} title={hint} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  {label}
                  {hint && <Info className="h-3 w-3 text-slate-300" />}
                </p>
                <p className="text-xl font-black text-slate-900">{value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ★ ใหม่: Performance Ranking (ย้ายมาจากหน้าบันทึกชั่วโมงการสอน) */}
        <TutorPerformanceRanking onViewTutor={setViewTutor} allSubjects={allSubjects} />

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
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[160px]"
            >
              <option value="all">ทุกวิชา ({allSubjectCount})</option>
              {allSubjectNames.map(sub => (
                <option key={sub} value={sub}>{sub} ({subjectCounts[sub] || 0})</option>
              ))}
            </select>
            {/* ★ เพิ่ม: filter สถานะ */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[150px]"
            >
              <option value="all">ทุกสถานะ ({allStatusCount})</option>
              <option value="1">กำลังสอน ({activeStatusCount})</option>
              <option value="2">เลิกสอน ({inactiveStatusCount})</option>
            </select>
            {/* ★ เพิ่ม: filter มี/ไม่มีนักเรียน */}
            <select
              value={filterHasStudents}
              onChange={e => setFilterHasStudents(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[170px]"
            >
              <option value="all">นักเรียนทั้งหมด ({hasStudentsCount + noStudentsCount})</option>
              <option value="has">มีนักเรียน ({hasStudentsCount})</option>
              <option value="none">ยังไม่มีนักเรียน ({noStudentsCount})</option>
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
            <p className="text-slate-500 font-medium">
              {filterSubject !== "all"
                ? `ไม่พบติวเตอร์ที่สอนวิชา "${filterSubject}"`
                : "ไม่พบติวเตอร์ที่ค้นหา"}
            </p>
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
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานะ</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">นักเรียน</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">เรทค่าสอน (บาท/ชม.)</th>
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
                      setStatusTutor={setStatusTutor}
                      setViewTutor={setViewTutor}   // ★ เพิ่ม
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
            <TutorForm
              onSave={handleCreate}
              onCancel={() => setShowAddModal(false)}
              isSubmitting={isSubmitting}
              showToast={showToast}
              allTutors={tutors}
              allSubjects={allSubjects}
            />
          </Modal>
        )}
        {editingTutor && (
          <Modal title={`แก้ไขติวเตอร์ #${editingTutor.AdminId}`} icon={Edit2} onClose={() => setEditingTutor(null)}>
            <TutorForm
              initial={editingTutor}
              onSave={handleUpdate}
              onCancel={() => setEditingTutor(null)}
              isSubmitting={isSubmitting}
              showToast={showToast}
              allTutors={tutors}
              allSubjects={allSubjects}
            />
          </Modal>
        )}
        {deletingTutor && (
          <ConfirmDelete tutor={deletingTutor} onConfirm={handleDelete} onCancel={() => setDeletingTutor(null)} isDeleting={isDeleting} />
        )}
        {resetPwdTutor && (
          <ResetPasswordModal tutor={resetPwdTutor} onClose={() => setResetPwdTutor(null)} showToast={showToast} />
        )}
        {statusTutor && (
          <TutorStatusModal
            tutor={statusTutor}
            onClose={() => setStatusTutor(null)}
            onSaved={fetchTutors}
            showToast={showToast}
          />
        )}
        {viewTutor && (
          <TutorDetailModal
            tutor={viewTutor}
            onClose={() => setViewTutor(null)}
            showToast={showToast}
            allSubjects={allSubjects}
          />
        )}
      </>
      }
    </div>
  )
}