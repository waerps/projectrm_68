import { useState } from "react";

const val = (v) => (v === "" || v === undefined ? null : v);

const initialForm = {
  firstname: "",
  lastname: "",
  nickname: "",
  phoneNo: "",
  occupation: "",
  birthOfDate: "",
  remark: "",
  username: "",
  password: "",
  confirmPassword: "",
  ratePerTutors: "",
  emergencyContactName: "",
  emergencyContactPhoneNo: "",
  lineId: "",
  roleId: "2",
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100";

const labelClass = "block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide";

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export default function CreateTutorForm() {
  const [form, setForm] = useState(initialForm);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', msg }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (form.password !== form.confirmPassword) {
      setAlert({ type: "error", msg: "Password ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง" });
      return;
    }
    if (form.password.length < 6) {
      setAlert({ type: "error", msg: "Password ต้องมีอย่างน้อย 6 ตัวอักษร" });
      return;
    }

    setLoading(true);
    try {
      const body = {
        firstname: form.firstname,
        lastname: form.lastname,
        nickname: val(form.nickname),
        phoneNo: val(form.phoneNo),
        occupation: val(form.occupation),
        birthOfDate: val(form.birthOfDate),
        remark: val(form.remark),
        username: form.username,
        password: form.password,
        ratePerTutors: val(form.ratePerTutors),
        emergencyContactName: val(form.emergencyContactName),
        emergencyContactPhoneNo: val(form.emergencyContactPhoneNo),
        lineId: val(form.lineId),
        roleId: Number(form.roleId),
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register-tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");

      setAlert({ type: "success", msg: "สร้างบัญชี Tutor สำเร็จแล้ว!" });
      setForm(initialForm);
    } catch (err) {
      setAlert({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-10 px-4">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <line x1="12" y1="17" x2="12" y2="23" />
              <line x1="9" y1="20" x2="15" y2="20" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">สร้างบัญชี Tutor</h1>
            <p className="text-sm text-gray-500">กรอกข้อมูลให้ครบเพื่อสร้างบัญชีผู้สอน</p>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
              alert.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <span className="text-base">{alert.type === "success" ? "✓" : "✕"}</span>
            {alert.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section: ข้อมูลส่วนตัว */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-orange-500 uppercase tracking-widest">
              <span className="inline-block h-1 w-6 rounded-full bg-orange-400" />
              ข้อมูลส่วนตัว
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="ชื่อ *">
                <input required className={inputClass} placeholder="ชื่อจริง" value={form.firstname} onChange={set("firstname")} />
              </Field>
              <Field label="นามสกุล *">
                <input required className={inputClass} placeholder="นามสกุล" value={form.lastname} onChange={set("lastname")} />
              </Field>
              <Field label="ชื่อเล่น">
                <input className={inputClass} placeholder="ชื่อเล่น" value={form.nickname} onChange={set("nickname")} />
              </Field>
              <Field label="วันเกิด">
                <input type="date" className={inputClass} value={form.birthOfDate} onChange={set("birthOfDate")} />
              </Field>
              <Field label="อาชีพ">
                <input className={inputClass} placeholder="เช่น ครู, นักศึกษา" value={form.occupation} onChange={set("occupation")} />
              </Field>
              <Field label="อัตราค่าสอน (บาท/ชม.)">
                <input type="number" min="0" step="0.01" className={inputClass} placeholder="เช่น 300.00" value={form.ratePerTutors} onChange={set("ratePerTutors")} />
              </Field>
              <Field label="หมายเหตุ">
                <textarea rows={2} className={inputClass + " resize-none"} placeholder="บันทึกเพิ่มเติม..." value={form.remark} onChange={set("remark")} />
              </Field>
            </div>
          </div>

          {/* Section: ช่องทางติดต่อ */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-orange-500 uppercase tracking-widest">
              <span className="inline-block h-1 w-6 rounded-full bg-orange-400" />
              ช่องทางติดต่อ
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="เบอร์โทรศัพท์">
                <input type="tel" className={inputClass} placeholder="08x-xxx-xxxx" value={form.phoneNo} onChange={set("phoneNo")} />
              </Field>
              <Field label="Line ID">
                <input className={inputClass} placeholder="@lineid" value={form.lineId} onChange={set("lineId")} />
              </Field>
              <Field label="ชื่อผู้ติดต่อฉุกเฉิน">
                <input className={inputClass} placeholder="ชื่อ-นามสกุล" value={form.emergencyContactName} onChange={set("emergencyContactName")} />
              </Field>
              <Field label="เบอร์ผู้ติดต่อฉุกเฉิน">
                <input type="tel" className={inputClass} placeholder="08x-xxx-xxxx" value={form.emergencyContactPhoneNo} onChange={set("emergencyContactPhoneNo")} />
              </Field>
            </div>
          </div>

          {/* Section: บัญชีผู้ใช้ */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-orange-500 uppercase tracking-widest">
              <span className="inline-block h-1 w-6 rounded-full bg-orange-400" />
              บัญชีผู้ใช้
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Username *">
                <input required className={inputClass} placeholder="กรอก username" value={form.username} onChange={set("username")} autoComplete="off" />
              </Field>
              <Field label="Role">
                <select className={inputClass} value={form.roleId} onChange={set("roleId")}>
                  <option value="2">Tutor</option>
                  <option value="1">Superadmin</option>
                </select>
              </Field>
              <Field label="Password *">
                <div className="relative">
                  <input
                    required
                    type={showPw ? "text" : "password"}
                    className={inputClass + " pr-10"}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={form.password}
                    onChange={set("password")}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </Field>
              <Field label="ยืนยัน Password *">
                <input
                  required
                  type={showPw ? "text" : "password"}
                  className={`${inputClass} ${
                    form.confirmPassword && form.confirmPassword !== form.password
                      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
                      : ""
                  }`}
                  placeholder="กรอก password อีกครั้ง"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  autoComplete="new-password"
                />
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="mt-1 text-xs text-red-500">Password ไม่ตรงกัน</p>
                )}
              </Field>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pb-4">
            <button
              type="button"
              onClick={() => { setForm(initialForm); setAlert(null); }}
              className="rounded-2xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              รีเซ็ต
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-orange-500 px-8 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชี Tutor"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
