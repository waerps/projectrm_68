import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, Loader2, MessageCircle, QrCode, Unlink, UploadCloud, WalletCards } from "lucide-react";
import {
  disconnectLine,
  getInstallmentQr,
  getLineLoginStatus,
  getPaymentOrders,
  startLineLogin,
  verifyInstallmentSlip,
} from "../callapi/callusers_student";

const money = (value) => new Intl.NumberFormat("th-TH", {
  style: "currency", currency: "THB", minimumFractionDigits: 2,
}).format(Number(value || 0));

const thaiDate = (value) => value
  ? new Date(`${value}T00:00:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
  : "-";

const STATUS = {
  scheduled: ["ยังไม่ถึงกำหนด", "bg-slate-100 text-slate-600"],
  due: ["รอชำระ", "bg-amber-100 text-amber-700"],
  overdue_grace: ["ค้างชำระ (ยังไม่ตัดสิทธิ์)", "bg-orange-100 text-orange-700"],
  overdue_suspended: ["ถูกพักสิทธิ์", "bg-red-100 text-red-700"],
  paid: ["ชำระแล้ว", "bg-emerald-100 text-emerald-700"],
};

export default function CoursePaymentsTab({ courseId }) {
  const token = localStorage.getItem("student_token");
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [lineLinked, setLineLinked] = useState(false);
  const [activeInstallment, setActiveInstallment] = useState(null);
  const [qr, setQr] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [slipLoading, setSlipLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [data, lineStatus] = await Promise.all([
        getPaymentOrders(token),
        getLineLoginStatus(token),
      ]);
      setRows(data.filter((row) => String(row.courseId) === String(courseId)));
      setLineLinked(Boolean(lineStatus.linked));
    } catch (err) {
      setError(typeof err === "string" ? err : "โหลดข้อมูลการชำระเงินไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const summary = useMemo(() => ({
    total: rows[0]?.totalAmount || 0,
    paid: rows.filter((row) => row.installmentStatus === "paid").reduce((sum, row) => sum + Number(row.amount || 0), 0),
  }), [rows]);

  const connectLine = async () => {
    try {
      setLinkLoading(true);
      setNotice(null);
      const returnPath = `${window.location.pathname}${window.location.search}`;
      const result = await startLineLogin(token, returnPath);
      window.location.assign(result.authorizationUrl);
    } catch (err) {
      setNotice({ type: "error", text: typeof err === "string" ? err : "เริ่มเชื่อม LINE ไม่สำเร็จ" });
    } finally { setLinkLoading(false); }
  };

  const unlinkLine = async () => {
    try {
      setLinkLoading(true);
      await disconnectLine(token);
      setLineLinked(false);
      setNotice({ type: "success", text: "ยกเลิกการเชื่อม LINE แล้ว" });
    } catch (err) {
      setNotice({ type: "error", text: typeof err === "string" ? err : "ยกเลิกการเชื่อม LINE ไม่สำเร็จ" });
    } finally { setLinkLoading(false); }
  };

  const openQr = async (row) => {
    try {
      setActiveInstallment(row);
      setQr(null);
      setQrLoading(true);
      setNotice(null);
      setQr(await getInstallmentQr(token, row.installmentId));
    } catch (err) {
      setNotice({ type: "error", text: typeof err === "string" ? err : "สร้าง QR ไม่สำเร็จ" });
    } finally { setQrLoading(false); }
  };

  const submitSlip = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeInstallment) return;
    try {
      setSlipLoading(true);
      setNotice(null);
      await verifyInstallmentSlip(token, activeInstallment.installmentId, file);
      setNotice({ type: "success", text: "ตรวจสอบสลิปสำเร็จ สถานะการชำระได้รับการอัปเดตแล้ว" });
      setQr(null);
      setActiveInstallment(null);
      await loadOrders();
    } catch (err) {
      setNotice({ type: "error", text: typeof err === "string" ? err : "ตรวจสอบสลิปไม่สำเร็จ" });
    } finally { setSlipLoading(false); }
  };

  if (loading) return <div className="rounded-2xl border bg-white p-10 text-center text-orange-600"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />กำลังโหลดค่าชำระคอร์ส...</div>;

  return (
    <div className="space-y-4">
      {notice && <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{notice.text}</div>}

      <section className="rounded-2xl border border-green-200 bg-green-50/60 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-neutral-900"><MessageCircle className="h-5 w-5 text-green-600" />{lineLinked ? "เชื่อมบัญชีกับ LINE แล้ว" : "เชื่อมบัญชีกับ LINE"}</h2>
            <p className="mt-1 text-sm text-neutral-600">{lineLinked ? "ระบบพร้อมส่ง QR และแจ้งเตือนค่างวดให้บัญชีนี้" : "กดปุ่มเดียวเพื่อรับ QR งวดถัดไป การแจ้งเตือนค้างชำระ และการคืนสิทธิ์อัตโนมัติ"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lineLinked ? <button onClick={unlinkLine} disabled={linkLoading} className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-bold text-neutral-600 disabled:opacity-50"><Unlink className="h-4 w-4" />ยกเลิกการเชื่อม</button> : <button onClick={connectLine} disabled={linkLoading} className="inline-flex items-center gap-1.5 rounded-xl bg-[#06C755] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{linkLoading && <Loader2 className="h-4 w-4 animate-spin" />}เชื่อมบัญชีกับ LINE</button>}
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!error && rows.length === 0 && <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center"><WalletCards className="mx-auto h-8 w-8 text-neutral-300" /><p className="mt-2 font-semibold text-neutral-600">ยังไม่พบ order การชำระของคอร์สนี้</p><p className="mt-1 text-sm text-neutral-400">รายการที่ซื้อผ่านระบบใหม่จะแสดงที่นี่</p></div>}

      {rows.length > 0 && <>
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4"><p className="text-xs text-neutral-500">ราคาคอร์ส</p><p className="mt-1 text-xl font-bold text-neutral-900">{money(summary.total)}</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-xs text-neutral-500">ชำระแล้ว</p><p className="mt-1 text-xl font-bold text-emerald-600">{money(summary.paid)}</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-xs text-neutral-500">ยอดคงเหลือ</p><p className="mt-1 text-xl font-bold text-orange-600">{money(summary.total - summary.paid)}</p></div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="border-b p-4"><h2 className="flex items-center gap-2 font-bold"><WalletCards className="h-5 w-5 text-orange-600" />รายการชำระรายงวด</h2></div>
          <div className="divide-y">
            {rows.map((row) => {
              const status = STATUS[row.installmentStatus] || [row.installmentStatus, "bg-slate-100 text-slate-600"];
              const payable = ["due", "overdue_grace", "overdue_suspended"].includes(row.installmentStatus);
              return <div key={row.installmentId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-50 font-bold text-orange-600">{row.installmentNo}</div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b>งวดที่ {row.installmentNo}</b><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status[1]}`}>{status[0]}</span></div><p className="mt-1 text-xs text-neutral-500">ชำระวันที่ {thaiDate(row.dueStartDate)}–{thaiDate(row.dueDate)} · พักสิทธิ์วันที่ {thaiDate(row.suspendDate)}</p></div>
                <b className="text-orange-600">{money(row.amount)}</b>
                {payable && <button onClick={() => openQr(row)} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white"><QrCode className="h-4 w-4" />ชำระงวดนี้</button>}
                {row.installmentStatus === "paid" && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                {row.installmentStatus === "scheduled" && <Clock3 className="h-6 w-6 text-slate-300" />}
              </div>;
            })}
          </div>
        </section>
      </>}

      {(activeInstallment || qrLoading) && <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5 text-center">
        <h3 className="font-bold">ชำระงวดที่ {activeInstallment?.installmentNo}</h3>
        {qrLoading ? <Loader2 className="mx-auto mt-5 h-8 w-8 animate-spin text-orange-500" /> : qr?.qrUrl && <img src={qr.qrUrl} alt="PromptPay QR" className="mx-auto mt-4 h-64 w-64 rounded-xl border bg-white object-contain p-2" />}
        {qr && <><p className="mt-3 font-bold text-orange-600">ยอด {money(qr.amount)}</p><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={submitSlip} /><button onClick={() => fileRef.current?.click()} disabled={slipLoading} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{slipLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{slipLoading ? "กำลังตรวจสลิป..." : "แนบสลิปและตรวจสอบ"}</button></>}
      </div>}
    </div>
  );
}
