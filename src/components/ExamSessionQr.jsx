import { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Download, Loader2, QrCode } from "lucide-react";
import { API_URL } from "../config";

export default function ExamSessionQr({ examId, sessionId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(""); setLoading(true); setCopied(false);
    axios.get(`${API_URL}/api/exam/${examId}/session/qr`, { params: { origin: window.location.origin }, headers: { Authorization: `Bearer ${localStorage.getItem("student_token")}` }, signal: controller.signal, timeout: 15000 })
      .then(response => setData(response.data))
      .catch(err => { if (!axios.isCancel(err)) setError(err.response?.data?.message || "สร้าง QR ไม่สำเร็จ"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [examId, sessionId, retry]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(data.joinUrl); setCopied(true); }
    catch { setError("คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกลิงก์ด้านล่าง"); }
  };
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><QrCode className="h-4 w-4 text-slate-400" />สแกน QR เพื่อเข้าสอบ</h3>
    {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500" aria-label="กำลังสร้าง QR" /></div> : data && <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <img src={data.qrDataUrl} alt="QR สำหรับเข้าสอบรอบนี้" width={224} height={224} className="h-56 w-56 shrink-0 rounded-xl border border-slate-100 bg-white" />
      <div className="min-w-0 flex-1 space-y-3"><p className="text-sm font-semibold text-slate-800">ให้นักเรียนเปิดกล้องแล้วสแกน QR นี้</p><p className="text-sm leading-relaxed text-slate-500">เข้าสู่ระบบด้วยบัญชีนักเรียนก่อน แล้วระบบจะพาไปหน้าข้อสอบรอบนี้ทันที เฉพาะนักเรียนที่ลงทะเบียนคอร์สนี้จึงเข้าสอบได้</p><input readOnly aria-label="ลิงก์เข้าสอบ" value={data.joinUrl} onFocus={event => event.target.select()} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600" /><div className="flex flex-wrap gap-2"><button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"><Copy size={14} />{copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</button><a href={data.qrDataUrl} download={`exam-${examId}-qr.png`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"><Download size={14} />ดาวน์โหลด QR</a></div>{/localhost|127\.0\.0\.1/.test(data.joinUrl) && <p className="text-xs text-amber-700">ลิงก์ localhost ใช้ได้เฉพาะเครื่องนี้ เมื่อต้องให้นักเรียนสแกนจากมือถือให้เปิดหน้าเว็บที่เผยแพร่แล้ว</p>}</div>
    </div>}
    {error && <div role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}{!data && <button type="button" onClick={() => setRetry(value => value + 1)} className="ml-2 underline">ลองอีกครั้ง</button>}</div>}
  </section>;
}
