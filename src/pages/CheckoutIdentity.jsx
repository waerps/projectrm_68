import { useState } from "react";
import GoogleSignInButton from "../components/GoogleSignInButton";
const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

export default function CheckoutIdentity({ account, onChange, onAuthenticated, error, busy }) {
  const [googleError, setGoogleError] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);

  const update = (event) => onChange({ ...account, [event.target.name]: event.target.value });

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900">สร้างบัญชีนักเรียน</h3>
        <p className="mt-1 text-xs text-slate-500">กรอกข้อมูลบัญชี แล้วกดดำเนินการต่อด้านล่าง ระบบจะเข้าสู่ระบบให้หลังชำระเงินสำเร็จ</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">ชื่อ <span className="text-orange-600">*</span><input className={inputClass} name="firstname" required value={account.firstname} onChange={update} autoComplete="given-name" /></label>
        <label className="text-sm font-semibold text-slate-700">นามสกุล <span className="text-orange-600">*</span><input className={inputClass} name="lastname" required value={account.lastname} onChange={update} autoComplete="family-name" /></label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">ชื่อผู้ใช้ <span className="text-orange-600">*</span><input className={inputClass} name="username" required minLength={4} maxLength={32} value={account.username} onChange={update} autoComplete="username" /></label>
        <label className="text-sm font-semibold text-slate-700">รหัสผ่าน <span className="text-orange-600">*</span><input className={inputClass} name="password" type="password" required minLength={8} value={account.password} onChange={update} autoComplete="new-password" /></label>
        <label className="text-sm font-semibold text-slate-700">ยืนยันรหัสผ่าน <span className="text-orange-600">*</span><input className={inputClass} name="confirmPassword" type="password" required value={account.confirmPassword} onChange={update} autoComplete="new-password" /></label>
      </div>
      <p className="mt-3 text-xs text-slate-500">หากชื่อผู้ใช้และรหัสผ่านตรงกับบัญชีเดิม ระบบจะใช้บัญชีนั้นโดยอัตโนมัติ</p>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />หรือใช้บัญชี Google ที่มีอยู่แล้ว<span className="h-px flex-1 bg-slate-200" /></div>
      <GoogleSignInButton disabled={busy || googleBusy} onBusyChange={setGoogleBusy} onAuthenticated={(result) => {
        if (result.needsOnboarding) {
          setGoogleError("ยังไม่มีบัญชีที่เชื่อม Google นี้ กรุณากรอกข้อมูลสร้างบัญชีด้านบน");
          return;
        }
        setGoogleError("");
        onAuthenticated(result);
      }} />
      {googleError && <p role="alert" className="mt-2 text-center text-xs text-red-600">{googleError}</p>}
    </section>
  );
}
