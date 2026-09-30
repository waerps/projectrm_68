import { API_URL } from "../config";
import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import { KeyRound, Loader2, Check, Clock, User, Phone, ArrowUpRight } from "lucide-react";
import { PAGE_TITLE } from "../components/ui/tokens";
import EmptyState from "../components/ui/EmptyState";
import { BTN } from "../components/ui/tokens";
import PageHeader from "../components/ui/PageHeader";

// ─── หน้าคำขอ "ลืมรหัสผ่าน" ────────────────────────────────────────────────
// คำขอจาก /auth/forgot-password: เจ้าหน้าที่ตรวจสอบตัวตนกับผู้ใช้ก่อนสร้างลิงก์
// ตั้งรหัสผ่านจากหน้าจัดการนักเรียน ส่งลิงก์ให้ผู้ใช้ แล้วจึงกดดำเนินการแล้ว
const API = `${API_URL}/api/admin`;
const auth = () => {
  const token = localStorage.getItem("student_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export default function AdminPasswordResets() {
  const [searchParams] = useSearchParams();
  const focusedRequestId = Number(searchParams.get("request"));
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
  useEffect(() => {
    if (loading || !focusedRequestId) return;
    document.getElementById(`password-reset-request-${focusedRequestId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loading, focusedRequestId]);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await axios.patch(`${API}/password-reset-requests/${id}/resolve`, {}, auth());
      showToast("success", "บันทึกเรียบร้อย", "ตรวจสอบว่าได้ส่งลิงก์ให้นักเรียนแล้ว");
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
        subtitle={'ตรวจสอบตัวตนผู้ใช้ สร้างลิงก์ตั้งรหัสผ่านที่หน้าจัดการนักเรียน ส่งลิงก์ให้ผู้ใช้ แล้วกด "ดำเนินการแล้ว"'} />

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
                  <div id={`password-reset-request-${r.RequestId}`} key={r.RequestId} className={`rounded-xl border bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3 ${focusedRequestId === r.RequestId ? "border-orange-500 ring-2 ring-orange-200" : "border-amber-200"}`}>
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
                      {r.UserType === "student" && (
                        <Link to={`/admin/students?student=${r.UserId}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:underline">
                          ดูข้อมูลนักเรียนคนนี้ <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
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
