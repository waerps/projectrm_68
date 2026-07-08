import { useState, useEffect } from "react";
import {
  GraduationCap,
  Phone,
  Pencil,
  AlertTriangle,
  Camera,
  BookOpen,
  Star,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { getStudentProfile, updateStudentProfile } from "../callapi/callusers_student";

export default function StudentProfile() {
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    PhoneNo: "",
    SchoolName: "",
    LineID: "",
    Remark: "",
  });

  const token = localStorage.getItem("student_token");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const data = await getStudentProfile(token);
      setProfile(data);
      setEditForm({
        PhoneNo: data.PhoneNo ?? "",
        SchoolName: data.SchoolName ?? "",
        LineID: data.LineID ?? "",
        Remark: data.Remark ?? "",
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updateStudentProfile(token, editForm);
      await fetchProfile();
      setEditOpen(false);
    } catch (err) {
      alert(String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
console.log(localStorage.getItem("token"))
  const displayName = profile
    ? `${profile.Firstname} ${profile.Lastname}`
    : "-";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16 lg:py-20">

        {/* ===== Header ===== */}
        <div className="mb-8 overflow-hidden rounded-xl shadow-xl">
          <div className="bg-gradient-to-br from-blue-600/90 via-blue-400 to-blue-600/80 p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">

              {/* รูปโปรไฟล์ */}
              <div className="relative shrink-0">
                <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-4 border-white shadow-2xl md:h-40 md:w-40">
                  <div className="flex h-full w-full items-center justify-center bg-blue-200 text-5xl font-bold text-blue-700">
                    {profile?.Firstname?.[0] ?? "S"}
                  </div>
                </div>
                <button className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg hover:scale-105 transition-transform">
                  <Camera className="h-5 w-5" />
                </button>
              </div>

              {/* ข้อมูลหลัก */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-white md:text-2xl">
                    {displayName}
                  </h1>
                  {profile?.Nickname && (
                    <p className="mt-1 text-white/90">{profile.Nickname}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile?.GradeDetail && (
                    <span className="inline-block rounded-full bg-white px-3 py-1 text-blue-600 text-sm font-medium">
                      {profile.GradeDetail}
                    </span>
                  )}
                  {profile?.GenderName && (
                    <span className="inline-block rounded-full bg-white/30 px-3 py-1 text-white text-sm font-medium">
                      {profile.GenderName}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm text-white">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {profile?.SchoolName ?? "ไม่ระบุโรงเรียน"}
                  </div>
                  {profile?.GPA != null && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      เกรดเฉลี่ย {Number(profile.GPA).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* ปุ่มแก้ไข */}
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-blue-600 font-medium hover:bg-gray-100 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                แก้ไขข้อมูล
              </button>
            </div>
          </div>
        </div>

        {/* ===== Detail Cards ===== */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* ข้อมูลส่วนตัว */}
          <div className="rounded-xl bg-white shadow-md">
            <div className="border-b px-4 py-3">
              <h2 className="text-lg font-semibold">ข้อมูลส่วนตัว</h2>
            </div>
            <div className="p-4 space-y-2">
              <InfoRow label="ชื่อ" value={profile?.Firstname} />
              <InfoRow label="นามสกุล" value={profile?.Lastname} />
              <InfoRow label="ชื่อเล่น" value={profile?.Nickname ?? "-"} />
              <InfoRow
                label="วันเกิด"
                value={
                  profile?.BirthOfDate
                    ? new Date(profile.BirthOfDate).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"
                }
              />
              <InfoRow label="ระดับชั้น" value={profile?.GradeDetail ?? "-"} />
              <InfoRow label="โรงเรียน" value={profile?.SchoolName ?? "-"} />
              <InfoRow
                label="เกรดเฉลี่ย"
                value={profile?.GPA != null ? Number(profile.GPA).toFixed(2) : "-"}
              />
            </div>
          </div>

          {/* ข้อมูลติดต่อ */}
          <div className="rounded-xl bg-white shadow-md">
            <div className="border-b px-4 py-3 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              <h2 className="text-lg font-semibold">ข้อมูลติดต่อ</h2>
            </div>
            <div className="p-4 space-y-2">
              <InfoRow label="เบอร์โทร" value={profile?.PhoneNo ?? "-"} />
              <InfoRow label="Line ID" value={profile?.LineID ?? "-"} />
              <InfoRow label="Username" value={profile?.Username ?? "-"} />
            </div>
          </div>

          {/* ข้อมูลผู้ปกครอง */}
          <div className="rounded-xl bg-white shadow-md">
            <div className="border-b px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold">ข้อมูลผู้ปกครอง</h2>
            </div>

            <div className="p-4 space-y-2">
              <InfoRow
                label="ชื่อผู้ปกครอง"
                value={
                  profile?.ParentFirstname
                    ? `${profile.ParentFirstname} ${profile.ParentLastname ?? ""}`
                    : "-"
                }
              />

              <InfoRow
                label="ความสัมพันธ์"
                value={profile?.ParentRelationship ?? "-"}
              />

              <InfoRow
                label="เบอร์โทร"
                value={profile?.ParentPhoneNo ?? "-"}
              />
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="rounded-xl bg-white shadow-md">
            <div className="border-b px-4 py-3">
              <h2 className="text-lg font-semibold">หมายเหตุ</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {profile?.Remark ?? "ไม่มีหมายเหตุ"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Edit Modal ===== */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold">แก้ไขข้อมูลส่วนตัว</h3>
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <FieldInput
                label="เบอร์โทรศัพท์"
                value={editForm.PhoneNo}
                onChange={(v) => setEditForm((f) => ({ ...f, PhoneNo: v }))}
              />
              <FieldInput
                label="โรงเรียน"
                value={editForm.SchoolName}
                onChange={(v) => setEditForm((f) => ({ ...f, SchoolName: v }))}
              />
              <FieldInput
                label="Line ID"
                value={editForm.LineID}
                onChange={(v) => setEditForm((f) => ({ ...f, LineID: v }))}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  หมายเหตุ
                </label>
                <textarea
                  rows={3}
                  value={editForm.Remark}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, Remark: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t px-6 py-4">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 rounded-xl border-2 border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Sub-components ───── */

function InfoRow({ label, value }) {
  return (
    <>
      <div className="flex justify-between py-3 text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900">{value ?? "-"}</span>
      </div>
      <div className="border-t border-gray-200" />
    </>
  );
}

function FieldInput({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}