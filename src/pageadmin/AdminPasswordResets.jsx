import { API_URL } from "../config";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import { KeyRound, Loader2, Check, Clock, User, Phone } from "lucide-react";

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
      showToast("success", "บันทึกแล้ว", "แจ้งกลับไปหาผู้ใช้แล้ว");
      load();
    } catch (err) {
      showToast("error", "บันทึกไม่สำเร็จ", err.response?.data?.message || err.message);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-orange-500" /> คำขอลืมรหัสผ่าน
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          ตรวจสอบตัวตนแล้วรีเซ็ตรหัสผ่านให้ผู้ใช้จากหน้าจัดการนักเรียน/จัดการแอดมินตามปกติ แล้วกด "ทำเสร็จแล้ว" เพื่อแจ้งกลับไปหาผู้ใช้
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">รอดำเนินการ ({pending.length})</p>
            {pending.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                ไม่มีคำขอที่รอดำเนินการ
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((r) => (
                  <div key={r.RequestId} className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                          {r.UserType === "admin" ? "แอดมิน/ติวเตอร์" : "นักเรียน"}
                        </span>
                        <span className="font-bold text-slate-800 flex items-center gap-1"><User className="h-3.5 w-3.5" /> {r.Username}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {r.PhoneNo || "ไม่มีเบอร์โทร"}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(r.Created_at).toLocaleString("th-TH")}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolve(r.RequestId)}
                      disabled={resolvingId === r.RequestId}
                      className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      {resolvingId === r.RequestId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      ทำเสร็จแล้ว
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recentlyDone.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">ทำเสร็จแล้วล่าสุด</p>
              <div className="space-y-2">
                {recentlyDone.map((r) => (
                  <div key={r.RequestId} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {r.UserType === "admin" ? "แอดมิน/ติวเตอร์" : "นักเรียน"} · {r.Username}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(r.ResolvedAt).toLocaleString("th-TH")}</span>
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
