import { useState } from "react";
import { ArrowLeft, KeyRound, Send } from "lucide-react";
import { postStudentAuth } from "../utils/studentSession";

export default function ForgotPasswordForm({ onBack }) {
  const [username, setUsername] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await postStudentAuth("/auth/forgot-password", { username: username.trim(), phoneNo: phoneNo.trim(), role: "user" });
      setMessage(data.message);
    } catch (failure) {
      setError(failure.message || "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-pane-inner auth-recovery-inner">
      <span className="auth-recovery-icon" aria-hidden="true"><KeyRound size={26} strokeWidth={1.8} /></span>
      <span className="auth-eyebrow">กลับมาเรียนต่อได้เสมอ</span>
      <h1 className="auth-heading">ลืมรหัสผ่าน?</h1>
      <p className="auth-intro">กรอกชื่อผู้ใช้และเบอร์โทรที่ลงทะเบียนไว้ เพื่อให้เจ้าหน้าที่ตรวจสอบและช่วยตั้งรหัสผ่านใหม่</p>

      {message ? (
        <div className="auth-recovery-result" role="status">
          <strong>รับคำขอแล้ว</strong>
          <p>{message}</p>
          <button type="button" onClick={() => { setMessage(""); setError(""); }} className="auth-recovery-again">ลองใช้ชื่อผู้ใช้อื่น</button>
        </div>
      ) : (
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="recovery-username">ชื่อผู้ใช้</label>
          <input id="recovery-username" className="auth-input" name="username" autoComplete="username" required maxLength={32} value={username} onChange={event => setUsername(event.target.value)} placeholder="กรอกชื่อผู้ใช้ของคุณ" />
          <label htmlFor="recovery-phone">เบอร์โทรที่ลงทะเบียนไว้</label>
          <input id="recovery-phone" className="auth-input" name="phoneNo" type="tel" autoComplete="tel" inputMode="tel" required maxLength={20} value={phoneNo} onChange={event => setPhoneNo(event.target.value)} placeholder="0xx-xxx-xxxx" />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-primary" type="submit" disabled={loading}>{loading ? "กำลังส่งคำขอ..." : "ขอให้เจ้าหน้าที่ช่วยตั้งรหัสผ่าน"} <Send size={17} aria-hidden="true" /></button>
        </form>
      )}
      <button type="button" className="auth-recovery-back" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" /> กลับไปเข้าสู่ระบบ</button>
    </div>
  );
}
