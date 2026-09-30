import { API_URL } from "../config";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import { KeyRound, Loader2, Check, Clock, User, Phone } from "lucide-react";
import { PAGE_TITLE } from "../components/ui/tokens";
import EmptyState from "../components/ui/EmptyState";
import { BTN } from "../components/ui/tokens";
import PageHeader from "../components/ui/PageHeader";

// ─── หน้าคำขอ "ลืมรหัสผ่าน" ────────────────────────────────────────────────
// ระบบนี้ไม่มี email/SMS ให้ผู้ใช้รีเซ็ตรหัสผ่านเอง (ดู routes/auth.routes.js POST
// /forgot-password และ migrations/20260911_password_reset_requests.sql) ผู้ใช้ที่ลืมรหัสผ่าน
// จึงยืนยันตัวตนด้วยเบอร์โทรแล้วส่งคำขอมาที่นี่ แอดมินรีเซ็ตรหัสผ่านให้เองด้วยหน้าจัดการที่มีอยู่
// แล้ว (จัดการนักเรียน/จัดการแอดมิน) จากนั้นกลับมากด "ทำเสร็จแล้ว" ที่นี่ เพื่อแจ้งกลับไปหาผู้ใช้
const API = `${API_URL}/api/admin`;
const auth = () => {
  const token = localStorage.getItem("student_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export default function AdminPasswordResets() {
  const { toasts, showToast, removeToast } = useToast();
  const [pending, setPending] = useState([]);
  const [recentlyDone, setRecentlyDone] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/password-reset-requests`, auth());
      setPending(res.data.pending || []);
      setRecentlyDone(res.data.recentlyDone || []);
    } catch (err) {
      showToast("error", "โหลดคำขอไม่สำเร็จ", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await axios.patch(`${API}/password-reset-requests/${id}/resolve`, {}, auth());
      showToast("success", "บันทึกเรียบร้อย", "ระบบแจ้งผลไปยังผู้ใช้แล้ว");
      load();
    } catch (err) {
      showToast("error", "บันทึกไม่สำเร็จ", err.response?.data?.message || err.message);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PageHeader className="mb-6" icon={KeyRound} title="คำขอลืมรหัสผ่าน"
        subtitle={'ตรวจสอบตัวตนผู้ใช้ รีเซ็ตรหัสผ่านที่หน้าจัดการนักเรียนหรือผู้ดูแลระบบ แล้วกด "ดำเนินการแล้ว" เพื่อแจ้งผู้ใช้'} />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-8">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">รอดำเนินการ ({pending.length} รายการ)</p>
            {pending.length === 0 ? (
              <EmptyState icon={KeyRound} title="ไม่มีคำขอที่รอดำเนินการ" description="คำขอรีเซ็ตรหัสผ่านใหม่จะแสดงที่นี่" />
            ) : (
              <div className="space-y-3">
                {pending.map((r) => (
                  <div key={r.RequestId} className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          {r.UserType === "admin" ? "แอดมิน/ติวเตอร์" : "นักเรียน"}
                        </span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 break-all"><User className="h-3.5 w-3.5 shrink-0" /> {r.Username}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {r.PhoneNo || "ไม่มีเบอร์โทร"}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(r.Created_at).toLocaleString("th-TH")}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolve(r.RequestId)}
                      disabled={resolvingId === r.RequestId}
                      className={`${BTN.primary} flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-50`}
                    >
                      {resolvingId === r.RequestId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      ดำเนินการแล้ว
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recentlyDone.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">ดำเนินการแล้วล่าสุด</p>
              <div className="space-y-2">
                {recentlyDone.map((r) => (
                  <div key={r.RequestId} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="text-slate-600 break-all">
                      {r.UserType === "admin" ? "แอดมิน/ติวเตอร์" : "นักเรียน"} · {r.Username}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(r.ResolvedAt).toLocaleString("th-TH")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
