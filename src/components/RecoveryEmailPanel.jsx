import { useState } from "react";
import GoogleSignInButton from "./GoogleSignInButton";

function maskEmail(email) {
  if (typeof email !== "string") return "";
  const at = email.indexOf("@");
  if (at < 1) return email;
  const name = email.slice(0, at);
  return `${name.slice(0, Math.min(2, name.length))}***@${email.slice(at + 1)}`;
}

export default function RecoveryEmailPanel({ authMethods, onGoogleLinked }) {
  const [googleBusy, setGoogleBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const connected = Boolean(authMethods.google);
  const sameEmail = Boolean(authMethods.googleRecoverySame);
  const hasRecovery = Boolean(authMethods.recoveryEmailVerified);
  const displayEmail = sameEmail
    ? maskEmail(authMethods.googleEmail)
    : hasRecovery
      ? authMethods.recoveryEmail
      : connected
        ? maskEmail(authMethods.googleEmail)
        : "ยังไม่ได้เชื่อม";

  async function linked() {
    try {
      await onGoogleLinked();
      setError("");
      setMessage("บันทึกอีเมลแล้ว");
    } catch {
      setError("เชื่อมสำเร็จแล้ว แต่โหลดข้อมูลใหม่ไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
    }
  }

  const description = sameEmail
    ? "อีเมลนี้ใช้เข้าสู่ระบบด้วย Google และรับลิงก์กู้คืนรหัสผ่าน"
    : connected && hasRecovery
      ? "อีเมลกู้คืนเดิมยังใช้ได้ เลือก Google อีกบัญชีเพื่อรวมเป็นอีเมลเดียวกัน"
      : connected
        ? "ใช้ Google เข้าสู่ระบบได้ แต่ยังใช้กู้คืนรหัสผ่านไม่ได้"
        : hasRecovery
          ? "อีเมลนี้ใช้กู้คืนรหัสผ่าน เชื่อม Google เพื่อใช้เข้าสู่ระบบด้วย"
          : "เชื่อม Google เพื่อใช้เข้าสู่ระบบและกู้คืนรหัสผ่าน";

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-4">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-400">อีเมล</span>
        <span className="min-w-0 break-all text-right text-sm font-semibold text-neutral-800">{displayEmail}</span>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-neutral-500">{description}</p>
      <div className="mt-3 flex justify-center" title={connected ? "เลือกบัญชี Google เพื่อเปลี่ยนอีเมล" : "เลือกบัญชี Google เพื่อเชื่อมอีเมล"}>
        <GoogleSignInButton mode="link" disabled={googleBusy} onBusyChange={setGoogleBusy} onAuthenticated={linked} />
      </div>
      {message && <p role="status" className="mt-2 text-center text-sm text-green-700">{message}</p>}
      {error && <p role="alert" className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
