import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import {
  Phone,
  Pencil,
  Save,
  X,
  AlertTriangle,
  ImagePlus,
  Users,
  Clock,
  BookOpen,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  getStudentProfile,
  updateStudentProfile,
} from "../callapi/callusers_student";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import Spinner from "../components/ui/Spinner";
import { BTN } from "../components/ui/tokens";

import RecoveryEmailPanel from "../components/RecoveryEmailPanel";
import CredentialSetupButton from "../components/CredentialSetupButton";

function maskUsername(username) {
  if (!username) return "";
  if (username.length <= 2) return `${username[0]}*`;
  const visible = username.length <= 4 ? 1 : 2;
  return `${username.slice(0, visible)}${"*".repeat(username.length - visible * 2)}${username.slice(-visible)}`;
}

export default function StudentProfile() {
  const fileInputRef = useRef(null);
  const { toasts, showToast, removeToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [authMethods, setAuthMethods] = useState(null);
  const [alertModal, setAlertModal] = useState({ show: false, fields: [] });

  const token = localStorage.getItem("student_token");
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    nickname: "",
    birthDate: "",
    gradeDetail: "",
    genderName: "",
    schoolName: "",
    gpa: null,
    phone: "",
    lineId: "",
    username: "",
    parentName: "",
    parentRelationship: "",
    parentPhone: "",
    remark: "",
    photo: null,
  });
  const [originalData, setOriginalData] = useState({});

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      const response = await getStudentProfile(token);
      const basicData = response?.profile ?? response?.student ?? response?.data ?? response ?? {};
      setAuthMethods(basicData.authMethods ?? null);
      const resolvedStudentId = basicData.userId ?? basicData.UserId ?? basicData.studentId ?? basicData.StudentId ?? null;
      let detailData = {};
      let parentDetailData = null;
      if (resolvedStudentId) {
        try {
          const detailResponse = await axios.get(`${API_URL}/api/admin/students/${resolvedStudentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          detailData = detailResponse.data?.student ?? detailResponse.data?.data?.student ?? detailResponse.data?.data ?? {};
          // ★ แก้: /api/admin/students/:id ส่งข้อมูลผู้ปกครองแยกไว้ที่ key "parent" ต่างหาก
          //   (ไม่ได้ฝังอยู่ใน "student") เดิมโค้ดนี้อ่านแต่ .student จึงไม่เคยเห็นข้อมูลผู้ปกครองเลย
          parentDetailData = detailResponse.data?.parent ?? detailResponse.data?.data?.parent ?? null;
        } catch (detailError) {
          console.warn("โหลดรูปโปรไฟล์จากข้อมูลนักเรียนไม่สำเร็จ:", detailError);
        }
      }
      const dbData = { ...basicData, ...detailData };
      const mappedData = {
        firstname: dbData.firstname ?? dbData.Firstname ?? "",
        lastname: dbData.lastname ?? dbData.Lastname ?? "",
        nickname: dbData.nickname ?? dbData.Nickname ?? "",

        birthDate: (dbData.birthOfDate ?? dbData.BirthOfDate ?? dbData.birthDate ?? dbData.BirthDate)
          ? String(dbData.birthOfDate ?? dbData.BirthOfDate ?? dbData.birthDate ?? dbData.BirthDate).split("T")[0]
          : "",

        gradeDetail: dbData.gradeDetail ?? dbData.GradeDetail ?? "",
        genderName: dbData.genderName ?? dbData.GenderName ?? "",

        schoolName: dbData.schoolName ?? dbData.SchoolName ?? "",
        gpa: dbData.gpa ?? dbData.GPA ?? dbData.Gpa ?? null,
        phone: dbData.phoneNo ?? dbData.PhoneNo ?? "",
        lineId: dbData.lineId ?? dbData.LineId ?? dbData.LineID ?? "",
        username: dbData.username ?? dbData.Username ?? "",
        remark: dbData.remark ?? dbData.Remark ?? "",

        parentName: parentDetailData
          ? `${parentDetailData.Firstname ?? ""} ${parentDetailData.Lastname ?? ""}`.trim() || (parentDetailData.Nickname ?? "")
          : (dbData.parentName ?? dbData.ParentName ?? ""),
        parentRelationship: parentDetailData
          ? (parentDetailData.ParentProfilesType_Name ?? parentDetailData.Relationship ?? "")
          : (dbData.parentRelationship ?? dbData.ParentRelationship ?? dbData.ParentProfileTypeName ?? ""),
        parentPhone: parentDetailData
          ? (parentDetailData.PhoneNo ?? "")
          : (dbData.parentPhone ?? dbData.ParentPhone ?? dbData.ParentPhoneNo ?? ""),
        photo: dbData.photo ?? dbData.Photo ?? dbData.profileImage ?? dbData.ProfileImage ?? dbData.imageUrl ?? null,
      };
      setStudentId(resolvedStudentId);
      setFormData(mappedData);
      setOriginalData(mappedData);
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (savedUser && mappedData.photo) {
        localStorage.setItem("user", JSON.stringify({ ...savedUser, photo: mappedData.photo }));
        window.dispatchEvent(new Event("student-profile-updated"));
      }
    } catch (error) {
      console.error("Error:", error);
      setLoadError(typeof error === "string" ? error : error?.message || "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "ไฟล์ไม่ถูกต้อง", "กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "ไฟล์ใหญ่เกินไป", "รูปภาพต้องมีขนาดไม่เกิน 5 MB");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const previousPhoto = formData.photo;
    setFormData((prev) => ({ ...prev, photo: previewUrl }));
    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);
      const res = await axios.post(`${API_URL}/api/admin/upload/image`, uploadData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const uploadedPhoto = res.data?.path ?? res.data?.imageUrl ?? res.data?.data?.path;
      if (!uploadedPhoto) throw new Error("เซิร์ฟเวอร์ไม่ส่ง path ของรูปกลับมา");
      if (!studentId) throw new Error("ไม่พบรหัสนักเรียน กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง");
      const putRes = await axios.put(`${API_URL}/api/admin/students/${studentId}`, {
        firstname: formData.firstname,
        lastname: formData.lastname,
        nickname: formData.nickname,
        phoneNo: formData.phone,
        schoolName: formData.schoolName,
        lineId: formData.lineId,
        birthOfDate: formData.birthDate || null,
        remark: formData.remark,
        gpa: formData.gpa,
        photo: uploadedPhoto,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (putRes.data?.photoBlocked) {
        // ไม่ยินยอมเรื่องรูป (เช่น เพิ่งถอนความยินยอมไปในแท็บอื่น) — เซิร์ฟเวอร์ไม่ได้บันทึกรูปใหม่จริง
        // แม้ request จะสำเร็จก็ตาม ต้องคืนค่ารูปเดิมแทนที่จะโชว์เหมือนบันทึกสำเร็จ
        URL.revokeObjectURL(previewUrl);
        setFormData((prev) => ({ ...prev, photo: previousPhoto }));
        showToast(
          "error",
          "อัปโหลดรูปไม่สำเร็จ",
          "มีการปฏิเสธความยินยอมเรื่องภาพถ่ายไว้ก่อนหน้านี้ ระบบจึงไม่บันทึกรูปใหม่ให้ — กรุณาติดต่อเจ้าหน้าที่หากต้องการเปลี่ยนแปลง"
        );
        return;
      }
      setFormData((prev) => ({ ...prev, photo: uploadedPhoto }));
      URL.revokeObjectURL(previewUrl);
      setOriginalData((prev) => ({ ...prev, photo: uploadedPhoto }));
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (savedUser) localStorage.setItem("user", JSON.stringify({ ...savedUser, photo: uploadedPhoto }));
      window.dispatchEvent(new Event("student-profile-updated"));
    } catch (error) {
      console.error(error);
      URL.revokeObjectURL(previewUrl);
      setFormData((prev) => ({ ...prev, photo: previousPhoto }));
      showToast("error", "อัปโหลดไม่สำเร็จ", error.response?.data?.message || error.message || "กรุณาลองใหม่");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const requiredFields = {
      phone: "เบอร์โทรศัพท์",
      schoolName: "โรงเรียน",
      lineId: "Line ID",
    };

    const emptyFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key] || String(formData[key]).trim() === "")
      .map(([, label]) => label);

    if (emptyFields.length > 0) {
      setAlertModal({ show: true, fields: emptyFields });
      return;
    }

    setIsSaving(true);
    try {
      await updateStudentProfile(token, {
        firstname: formData.firstname,
        lastname: formData.lastname,
        nickname: formData.nickname,
        birthOfDate: formData.birthDate || null,
        gpa: formData.gpa === "" ? null : formData.gpa,
        phoneNo: formData.phone,
        schoolName: formData.schoolName,
        lineId: formData.lineId,
        remark: formData.remark,
      });
      await fetchProfile();
      setIsEditing(false);
    } catch (error) {
      alert("บันทึกข้อมูลไม่สำเร็จ: " + (error?.response?.data?.message || error?.message || "กรุณาลองใหม่"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-orange-600 font-medium text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );

  if (loadError) return <div className="mt-[100px] rounded-xl bg-red-50 p-6 text-center text-red-700"><p>{loadError}</p><button type="button" onClick={fetchProfile} className="mt-3 font-semibold underline">ลองใหม่</button></div>;

  return (
    <div className="space-y-6 mt-[100px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="">
        {/* ── Edit Mode Banner ── */}
        {isEditing && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-orange-400 px-4 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5 text-white">
              <Pencil className="h-4 w-4 shrink-0" />
              <span className="font-semibold text-sm">กำลังแก้ไขข้อมูล</span>
              <span className="text-orange-100 text-xs">— กรอกข้อมูลให้ครบแล้วกดบันทึก</span>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-1.5 text-sm text-white font-medium hover:bg-white/20 transition"
              >
                <X className="h-3.5 w-3.5" />
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-1.5 text-sm text-orange-600 font-bold hover:bg-orange-50 transition shadow-sm disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        )}

        {/* ── Profile Header Card ── */}
        <div className="mb-6 overflow-hidden rounded-2xl shadow-sm">
          <div className="bg-gradient-to-br from-orange-500 to-orange-300 p-5 sm:p-8 md:p-10">
            <div className="flex flex-col gap-4 sm:gap-8 md:flex-row md:items-center">
              {/* รูปโปรไฟล์ */}
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div className="relative h-24 w-24 sm:h-36 sm:w-36 md:h-40 md:w-40 overflow-hidden rounded-2xl border-4 border-white/80 shadow-2xl bg-slate-100">
                  <img
                    src={getFileUrl(formData.photo) || "/placeholder-user.jpg"}
                    onError={(event) => { event.currentTarget.src = "/placeholder-user.jpg"; }}
                    className="h-full w-full object-cover"
                    alt="Student"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <button aria-label="เปลี่ยนรูป"
                  onClick={() => fileInputRef.current.click()}
                  disabled={isUploading}
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-orange-500 shadow-lg hover:scale-110 transition-transform border-2 border-orange-100 disabled:cursor-wait disabled:opacity-70"
                >
                  {isUploading ? <Spinner size="sm" /> : <ImagePlus className="h-4.5 w-4.5" />}
                </button>
              </div>

              {/* ชื่อ + สถิติ */}
              <div className="flex-1 space-y-3 text-center md:text-left text-white">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {formData.firstname} {formData.lastname}
                  </h1>
                  {formData.nickname && (
                    <p className="text-lg opacity-80 mt-0.5">({formData.nickname})</p>
                  )}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {formData.gradeDetail && (
                    <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-0.5 text-sm border border-white/30">
                      {formData.gradeDetail}
                    </span>
                  )}
                  {formData.genderName && (
                    <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-0.5 text-sm border border-white/30">
                      {formData.genderName}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-sm font-medium md:justify-start">
                  <div className="flex max-w-full items-center gap-1.5 break-words bg-white/15 rounded-full px-3 py-1">
                    <Users className="h-4 w-4" />
                    {formData.schoolName || "ไม่ระบุโรงเรียน"}
                  </div>
                  {formData.gpa != null && (
                    <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                      <Clock className="h-4 w-4" />
                      เกรดเฉลี่ย {Number(formData.gpa).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* ปุ่มแก้ไข (เฉพาะตอนไม่ได้ edit) */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-orange-600 font-bold hover:bg-orange-50 shadow-lg transition-all text-sm shrink-0"
                >
                  <Pencil className="h-4 w-4" />
                  แก้ไขข้อมูล
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Detail Cards ── */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* ข้อมูลส่วนตัว */}
          <SectionCard
            title="ข้อมูลส่วนตัว"
            icon={<Users className="h-4.5 w-4.5 text-orange-500" />}
            isEditing={isEditing}
          >
            <InfoRow label="ชื่อ" name="firstname" value={formData.firstname} isEditing={isEditing} onChange={handleChange} />
            <InfoRow label="นามสกุล" name="lastname" value={formData.lastname} isEditing={isEditing} onChange={handleChange} />
            <InfoRow label="ชื่อเล่น" name="nickname" value={formData.nickname} isEditing={isEditing} onChange={handleChange} />
            <InfoRow
              label="วันเกิด"
              name="birthDate"
              value={formData.birthDate}
              displayValue={formData.birthDate ? new Date(formData.birthDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : ""}
              isEditing={isEditing}
              onChange={handleChange}
              type="date"
            />
            <InfoRow label="ระดับชั้น" value={formData.gradeDetail} isEditing={false} />
            <InfoRow
              label="เกรดเฉลี่ย"
              name="gpa"
              value={formData.gpa ?? ""}
              displayValue={formData.gpa != null ? Number(formData.gpa).toFixed(2) : ""}
              isEditing={isEditing}
              onChange={handleChange}
              type="number"
            />
          </SectionCard>

          {/* ข้อมูลติดต่อ */}
          <SectionCard
            title="ข้อมูลติดต่อ"
            icon={<Phone className="h-4.5 w-4.5 text-orange-500" />}
            isEditing={isEditing}
          >
            <InfoRow
              label="เบอร์โทรศัพท์"
              name="phone"
              value={formData.phone}
              isEditing={isEditing}
              onChange={handleChange}
            />
            <InfoRow
              label="Line ID"
              name="lineId"
              value={formData.lineId}
              isEditing={isEditing}
              onChange={handleChange}
            />
          </SectionCard>

          {/* โรงเรียนและหมายเหตุ */}
          <SectionCard
            title="โรงเรียนและหมายเหตุ"
            icon={<BookOpen className="h-4.5 w-4.5 text-orange-500" />}
            isEditing={isEditing}
          >
            <InfoRow
              label="โรงเรียน"
              name="schoolName"
              value={formData.schoolName}
              isEditing={isEditing}
              onChange={handleChange}
            />
            <div className="py-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                หมายเหตุ
              </span>
              {isEditing ? (
                <textarea
                  name="remark"
                  rows={3}
                  value={formData.remark}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formData.remark || <span className="text-slate-300 font-normal">ไม่มีหมายเหตุ</span>}
                </p>
              )}
            </div>
          </SectionCard>

          {/* ข้อมูลผู้ปกครอง */}
          <SectionCard
            title="ข้อมูลผู้ปกครอง"
            icon={<AlertTriangle className="h-4.5 w-4.5 text-red-500" />}
            isEditing={isEditing}
          >
            <InfoRow label="ชื่อผู้ปกครอง" value={formData.parentName} isEditing={false} />
            <InfoRow label="ความสัมพันธ์" value={formData.parentRelationship} isEditing={false} />
            <InfoRow label="เบอร์โทร" value={formData.parentPhone} isEditing={false} />
            <p className="mt-4 text-xs text-slate-500 text-center">
              * ข้อมูลผู้ปกครองแก้ไขได้จากฝ่ายบริหารเท่านั้น
            </p>
          </SectionCard>
          {authMethods && (
            <SectionCard title="วิธีเข้าสู่ระบบ" icon={<Users className="h-4.5 w-4.5 text-orange-500" />} isEditing={false}>
              <InfoRow label="ชื่อผู้ใช้" value={authMethods.password && formData.username ? maskUsername(formData.username) : "ไม่ได้ตั้งค่า"} isEditing={false} />
              <RecoveryEmailPanel authMethods={authMethods}
                onGoogleLinked={async () => {
                  const response = await getStudentProfile(localStorage.getItem("student_token"));
                  const profile = response?.profile ?? response?.student ?? response?.data ?? response;
                  setAuthMethods(profile.authMethods);
                }} />
              {authMethods.google && !authMethods.password && (
                <CredentialSetupButton available={authMethods.googleRecoverySame && authMethods.recoveryEmailVerified} />
              )}
            </SectionCard>
          )}
        </div>

      </div>

      {alertModal.show && (
        <ValidationModal
          fields={alertModal.fields}
          onClose={() => setAlertModal({ show: false, fields: [] })}
        />
      )}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────
function SectionCard({ title, icon, children, isEditing }) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-sm overflow-hidden border transition-all duration-200 ${
        isEditing ? "border-orange-300 shadow-md" : "border-slate-200"
      }`}
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      </div>
      <div className="p-5 space-y-0.5">{children}</div>
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────
function InfoRow({ label, value, displayValue, name, isEditing, onChange, type = "text" }) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center py-3 border-b border-slate-50 last:border-0 min-h-[52px] gap-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      <div className="min-w-0 flex-1 break-words text-right">
        {isEditing ? (
          <input
            type={type}
            name={name}
            value={value ?? ""}
            step={type === "number" ? "0.01" : undefined}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 h-10 text-left text-sm text-slate-800 font-medium outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all"
          />
        ) : (
          <span className="break-all text-sm font-semibold text-neutral-800">
            {displayValue || value || <span className="text-neutral-300 font-normal">-</span>}
          </span>
        )}
      </div>
    </div>
  );
}


function ValidationModal({ fields, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden animate-in max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-7 w-7 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">กรอกข้อมูลไม่ครบ</h3>
            <p className="text-sm text-slate-500 mt-1">
              กรุณากรอกข้อมูลในฟิลต่อไปนี้ให้ครบก่อนบันทึก
            </p>
          </div>
          <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 mb-5">
            <ul className="space-y-2">
              {fields.map((field, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-orange-700 font-medium">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-700 text-xs font-bold">
                    {i + 1}
                  </span>
                  {field}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={onClose}
            className={`${BTN.primary} w-full rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-all`}
          >
            รับทราบ แก้ไขต่อ
          </button>
        </div>
      </div>
    </div>
  );
}
