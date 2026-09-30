import { useState } from "react";
import { KeyRound, MailCheck } from "lucide-react";
import { postStudentAuth } from "../utils/studentSession";

export default function CredentialSetupButton({ available }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function requestLink() {
    if (busy || !available) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("student_token");
      const result = await postStudentAuth("/auth/account/credentials/setup/request", {}, undefined, token);
      setMessage(result.message);
    } catch (failure) {
      setError(failure.message || "ส่งลิงก์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <button
        type="button"
        onClick={requestLink}
        disabled={!available || busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {message ? <MailCheck size={18} aria-hidden="true" /> : <KeyRound size={18} aria-hidden="true" />}
        {busy ? "กำลังส่งลิงก์..." : message ? "ส่งลิงก์แล้ว" : "ตั้งชื่อผู้ใช้และรหัสผ่าน"}
      </button>
      {!available && <p className="mt-2 text-center text-xs text-neutral-500">เชื่อมอีเมล Google ที่ยืนยันแล้วก่อนใช้วิธีนี้</p>}
      {message && <p role="status" className="mt-2 text-center text-xs text-green-700">{message}</p>}
      {error && <p role="alert" className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
