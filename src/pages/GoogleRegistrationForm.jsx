import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearGoogleRegistration, finishStudentLogin, postStudentAuth } from "../utils/studentSession";

const emptyGoogleForm = profile => ({
  firstname: profile?.firstname || "",
  lastname: profile?.lastname || "",
  nickname: "", phoneNo: "", schoolName: "", lineId: "", birthOfDate: "",
  gradeLevelId: "", genderId: "",
});

export default function GoogleRegistrationForm({ pending, onCancel, onComplete }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => emptyGoogleForm(pending?.profile));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pdpaAcknowledged, setPdpaAcknowledged] = useState(false);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm(current => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (busy || !pending) return;
    if (!pdpaAcknowledged) {
      setError("กรุณารับทราบเรื่องการเก็บและใช้ข้อมูลก่อนสมัครบัญชี");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await postStudentAuth("/auth/google/register", {
        ...form, registrationToken: pending.registrationToken,
      });
      if (onComplete) onComplete(data);
      else finishStudentLogin(data, navigate, pending);
    } catch (failure) {
      setError(failure.message || "สมัครบัญชีไม่สำเร็จ กรุณาลองใหม่");
      if (failure.code === "REGISTRATION_EXPIRED" || failure.code === "GOOGLE_ACCOUNT_EXISTS") {
        clearGoogleRegistration();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!pending) {
    return (
      <div className="auth-pane-inner auth-google-register-inner">
        <span className="auth-eyebrow">สมัครด้วย Google</span>
        <h1 className="auth-heading">หมดเวลาสมัคร</h1>
        <p className="auth-intro">กรุณาเลือกบัญชี Google อีกครั้งเพื่อเริ่มสมัคร</p>
        <button type="button" className="auth-primary" onClick={onCancel}>กลับไปหน้าเข้าสู่ระบบ</button>
      </div>
    );
  }

  return (
    <div className="auth-pane-inner auth-google-register-inner">
      <span className="auth-eyebrow">ขั้นตอนสุดท้าย</span>
      <h1 className="auth-heading">สมัครด้วย Google</h1>
      <p className="auth-intro auth-google-email">บัญชี <strong>{pending.profile.email}</strong></p>
      <form onSubmit={submit} className="auth-form auth-register-form">
        <div className="auth-two-columns">
          <div><label htmlFor="google-firstname">ชื่อ <span>*</span></label><input id="google-firstname" className="auth-input" name="firstname" value={form.firstname} onChange={change} maxLength={100} required autoComplete="given-name" /></div>
          <div><label htmlFor="google-lastname">นามสกุล <span>*</span></label><input id="google-lastname" className="auth-input" name="lastname" value={form.lastname} onChange={change} maxLength={100} required autoComplete="family-name" /></div>
        </div>
        <details className="auth-optional">
          <summary>ข้อมูลเพิ่มเติม <span>เพิ่มภายหลังได้</span></summary>
          <div className="auth-optional-fields">
            <div className="auth-two-columns">
              <div><label htmlFor="google-nickname">ชื่อเล่น</label><input id="google-nickname" className="auth-input" name="nickname" value={form.nickname} onChange={change} maxLength={50} /></div>
              <div><label htmlFor="google-phone">เบอร์โทรศัพท์</label><input id="google-phone" className="auth-input" name="phoneNo" value={form.phoneNo} onChange={change} maxLength={20} inputMode="tel" autoComplete="tel" /></div>
            </div>
            <div className="auth-two-columns">
              <div><label htmlFor="google-birth">วันเกิด</label><input id="google-birth" className="auth-input" type="date" name="birthOfDate" value={form.birthOfDate} onChange={change} max={new Date().toISOString().slice(0, 10)} /></div>
              <div><label htmlFor="google-gender">เพศ</label><select id="google-gender" className="auth-input" name="genderId" value={form.genderId} onChange={change}><option value="">เลือกเพศ</option><option value="1">ชาย</option><option value="2">หญิง</option><option value="3">ไม่ระบุ</option></select></div>
            </div>
            <div className="auth-two-columns">
              <div><label htmlFor="google-school">โรงเรียน</label><input id="google-school" className="auth-input" name="schoolName" value={form.schoolName} onChange={change} maxLength={150} /></div>
              <div><label htmlFor="google-grade">ระดับชั้น</label><select id="google-grade" className="auth-input" name="gradeLevelId" value={form.gradeLevelId} onChange={change}><option value="">เลือกระดับชั้น</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index < 6 ? "ประถมศึกษาปีที่ " + (index + 1) : "มัธยมศึกษาปีที่ " + (index - 5)}</option>)}</select></div>
            </div>
            <div className="auth-two-columns">
              <div><label htmlFor="google-line">LINE ID</label><input id="google-line" className="auth-input" name="lineId" value={form.lineId} onChange={change} maxLength={100} /></div>
            </div>
          </div>
        </details>
        <div className="auth-pdpa-notice">
          <strong>การเก็บและใช้ข้อมูลส่วนบุคคล</strong>
          <p>สถาบันจะใช้ข้อมูลที่กรอกเพื่อจัดการบัญชีผู้เรียนและการเรียนการสอน ข้อมูลที่กระทบความเป็นส่วนตัวเพิ่มเติม เช่น พฤติกรรมระหว่างทำข้อสอบ ระบบจะขอความยินยอมแยกต่างหากก่อนซื้อคอร์สเรียน</p>
          <label htmlFor="google-register-pdpa"><input id="google-register-pdpa" type="checkbox" checked={pdpaAcknowledged} onChange={event => setPdpaAcknowledged(event.target.checked)} required /><span className="auth-consent-text">ข้าพเจ้ารับทราบเรื่องการเก็บและใช้ข้อมูลข้างต้นแล้ว <span className="text-red-500">*</span></span></label>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy || !pdpaAcknowledged} className="auth-primary">{busy ? "กำลังสร้างบัญชี..." : "สร้างบัญชีและเข้าสู่ระบบ"}</button>
      </form>
      <p className="auth-mobile-switch">มีบัญชีเดิมอยู่แล้ว? <button type="button" onClick={onCancel}>เข้าสู่ระบบ</button></p>
    </div>
  );
}
