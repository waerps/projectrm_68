import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, X } from "lucide-react";
import { getMyConsents } from "../callapi/callusers_student";

// แบนเนอร์เตือนนักเรียนเก่าที่ยังไม่เคยตอบความยินยอม PDPA บางรายการ (เฟส 4)
// ไม่บล็อกการใช้งานอะไรทั้งสิ้น — ปิดได้ (จำไว้แค่ตลอดแท็บนี้) แต่จะโผล่ใหม่ทุกเซสชันจนกว่าจะไปตอบจริง
// พฤติกรรมตอนนี้ (ช่วงผ่อนผัน) ถูกคุมด้วย TRANSITION_DEADLINE ใน config/consentTypes.js ฝั่ง backend
const DISMISS_KEY = "pdpa_banner_dismissed_session";

export default function PdpaConsentBanner() {
  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) return;
    let cancelled = false;
    getMyConsents(token)
      .then((res) => {
        if (!cancelled) setPendingCount(res?.pending?.length || 0);
      })
      .catch(() => { /* โหลดไม่ได้ก็ไม่ต้องรบกวนผู้ใช้ — แค่ไม่โชว์แบนเนอร์รอบนี้ */ });
    return () => { cancelled = true; };
  }, []);

  if (dismissed || pendingCount === 0) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm min-w-0">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            มีเรื่องความยินยอมด้านข้อมูลส่วนบุคคล {pendingCount} รายการที่ยังไม่ได้ตอบ — ไม่กระทบการใช้งานตอนนี้ แวะไปตอบเมื่อสะดวกได้เลย
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/profile"
            className="text-xs font-bold text-amber-800 underline underline-offset-2 hover:text-amber-900"
          >
            ไปตอบเลย
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="ปิด"
            className="text-amber-500 hover:text-amber-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
