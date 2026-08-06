import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import generatePromptPayPayload from "promptpay-qr";
import QRCode from "qrcode";
import { useShop } from "../context/ShopContext";
import { getCourseById, getCourseSchedule, getCourseSubjects } from "../callapi/callusers";
import { getFileUrl } from "../utils/fileUrl";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  Landmark,
  Loader2,
  LockKeyhole,
  QrCode,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  UploadCloud,
  WalletCards,
  X,
} from "lucide-react";

/**
 * Cart UI เชื่อมรายการกับ ShopContext และเติมรายละเอียดคอร์สจาก API ตาม id
 * ส่วน QR และการส่งสลิปเชื่อมกับ SlipOK ผ่าน backend แล้ว (ยังไม่บันทึกผลลง DB)
 */

const parseMoney = (value, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const formatDateRange = (start, end) => {
  const format = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date);
  };
  const first = format(start);
  const last = format(end);
  return first && last ? `${first} – ${last}` : first || last || null;
};

const distributeInstallments = (fullCost, count) => {
  if (count <= 0) return [];
  const base = Math.floor((fullCost / count) * 100) / 100;
  const amounts = Array(count).fill(base);
  const remainder = Math.round((fullCost - base * count) * 100) / 100;
  amounts[count - 1] = Math.round((amounts[count - 1] + remainder) * 100) / 100;
  return amounts;
};

const parseInstallmentAmounts = (raw, fullCost, count) => {
  let values = raw;
  if (typeof values === "string") {
    try {
      values = JSON.parse(values);
    } catch {
      values = values.split(",");
    }
  }
  if (Array.isArray(values) && values.length === count) {
    const parsed = values.map((value) => parseMoney(value, Number.NaN));
    if (parsed.every(Number.isFinite)) return parsed;
  }
  return distributeInstallments(fullCost, count);
};

const DAY_LABELS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const readableText = (value, preferredKeys = []) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text && text !== "[object Object]" ? text : null;
  }
  if (typeof value === "object") {
    for (const key of preferredKeys) {
      const text = readableText(value[key]);
      if (text) return text;
    }
  }
  return null;
};

const normalizeCartItem = (item) => {
  const price = parseMoney(item.price ?? item.Price);
  const discount = parseMoney(item.discount ?? item.Discount);
  const explicitSalePrice = parseMoney(item.fullCost ?? item.FullCost, Number.NaN);
  const salePrice = Number.isFinite(explicitSalePrice)
    ? explicitSalePrice
    : Math.max(0, price - discount);
  const subjects = Array.isArray(item.subjects)
    ? item.subjects
    : String(item.Subjects || "")
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean);
  const subjectDetails = Array.isArray(item._subjects) ? item._subjects : [];
  const scheduleDetails = Array.isArray(item._schedule) ? item._schedule : [];
  const subjectNames = subjectDetails
    .map((subject) => readableText(subject, ["SubjectName", "name", "label"]))
    .filter(Boolean);
  const tutorNames = [...new Set(subjectDetails.map((subject) =>
    subject.Nickname || `${subject.Firstname || ""} ${subject.Lastname || ""}`.trim()
  ).filter(Boolean))];
  const totalHours = parseMoney(
    item.TotalCourseHours ?? item.totalCourseHours,
    subjectDetails.reduce((sum, subject) => sum + parseMoney(subject.TotalHours), 0)
  );
  const scheduleLabels = [...new Set(scheduleDetails.map((entry) => {
    const day = DAY_LABELS[Number(entry.DayOfWeek)];
    const time = entry.StartTime && entry.EndTime ? `${entry.StartTime}–${entry.EndTime} น.` : "";
    return [day, time].filter(Boolean).join(" ");
  }).filter(Boolean))];
  const maxStudents = parseMoney(item.MaxStudents ?? item.maxStudents ?? item.capacity ?? item.Capacity, Number.NaN);
  const studentCount = parseMoney(item.StudentCount ?? item.studentCount, 0);
  const availableSeats = Number.isFinite(maxStudents)
    ? Math.max(0, maxStudents - studentCount)
    : null;
  const installmentCount = Math.max(1, Math.trunc(parseMoney(item.Installments ?? item.installments, 1)));
  const installmentAmounts = parseInstallmentAmounts(
    item.InstallmentAmounts ?? item.installmentAmounts,
    salePrice,
    installmentCount
  );

  return {
    ...item,
    id: item.id ?? item.CourseID,
    title: item.title ?? item.CourseName ?? "คอร์สเรียน",
    subject: subjectNames[0] ?? readableText(subjects[0], ["SubjectName", "name", "label"]) ?? readableText(item.subject) ?? readableText(item.SubjectName) ?? "คอร์สเรียน",
    subjects: (subjectNames.length ? subjectNames : subjects.map((subject) => readableText(subject, ["SubjectName", "name", "label"]))).filter(Boolean),
    tutor: tutorNames.length ? tutorNames.join(", ") : item.tutor ?? item.TutorName ?? "ยังไม่ระบุผู้สอน",
    schedule: scheduleLabels.length ? scheduleLabels.join(" · ") : item.schedule ?? item.ScheduleText ?? "ยังไม่กำหนดรอบเรียน",
    dateRange: item.dateRange ?? formatDateRange(item.StartDate, item.LastDate) ?? "วันเรียนตามรอบที่เลือก",
    lessons: totalHours > 0 ? `${totalHours.toLocaleString("th-TH")} ชั่วโมง` : item.lessons ?? item.DurationText ?? "ยังไม่ระบุจำนวนชั่วโมง",
    studentCount,
    seatsLeft: item.AvailableSeats ?? availableSeats,
    capacity: Number.isFinite(maxStudents) ? maxStudents : null,
    image:
      item.img ??
      item.image ??
      (item.CourseImage ? getFileUrl(item.CourseImage) : null) ??
      "/gray.jpg",
    price,
    salePrice,
    installments: installmentCount,
    installmentAmounts,
    installmentEligible: installmentCount > 1,
    termName: readableText(item.Term_Name ?? item.termName, ["Term_Name", "name", "label"]),
    courseType: readableText(item.Course_Type ?? item.courseType, ["Course_Type", "value", "name"]),
    availabilityName: readableText(item.Course_Availability_Name ?? item.availabilityName, ["Course_Availability_Name", "name", "label"]),
    isPromotion: Number(item.Is_Promotion ?? item.isPromotion ?? 0) === 1 || item.Is_Promotion === true || item.isPromotion === true,
    videosFree: parseMoney(item.VideosFree ?? item.videosFree, 0),
  };
};

const money = (value) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);

const cn = (...classes) => classes.filter(Boolean).join(" ");

function CourseCard({ item, onRemove }) {
  const saved = item.price - item.salePrice;

  return (
    <article className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_50px_-32px_rgba(15,23,42,.35)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_22px_55px_-28px_rgba(234,88,12,.24)]">
      <div className="grid sm:grid-cols-[210px_1fr]">
        <div className="relative min-h-44 overflow-hidden bg-orange-50 sm:min-h-full">
          <img
            src={item.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
          {saved > 0 && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
              <Sparkles className="h-3 w-3" /> ประหยัด {money(saved)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">{item.subject}</span>
              <h2 className="mt-1.5 text-lg font-extrabold leading-snug text-[#14213D] sm:text-xl">{item.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label={`ลบ ${item.title} ออกจากตะกร้า`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-2 text-[13px] text-slate-600 sm:grid-cols-2">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-500" />{item.dateRange}</span>
            <span className="flex items-center gap-2 font-semibold text-slate-700"><FileText className="h-4 w-4 text-orange-500" />ชั่วโมงรวม {item.lessons}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.isPromotion && <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"><Sparkles className="h-3 w-3" />โปรโมชั่น</span>}
            {item.termName && <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-700">{item.termName}</span>}
            {item.courseType && <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{item.courseType === "bundle" ? "คอร์สรวม" : "คอร์สเดี่ยว"}</span>}
            {item.availabilityName && <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-700">{item.availabilityName}</span>}
            {item.videosFree > 0 && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">ฟรี {item.videosFree} คลิป</span>}
            {item.subjects.map((subject) => <span key={subject} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{subject}</span>)}
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <p className="text-[11px] text-slate-400">ราคาสุทธิ</p>
              <div className="flex items-baseline gap-2">
                <strong className="text-2xl font-black text-[#14213D]">{money(item.salePrice)}</strong>
                {saved > 0 && <span className="text-xs text-slate-400 line-through">{money(item.price)}</span>}
              </div>
            </div>
            {item.installmentEligible && (
              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                ผ่อนได้ {item.installments} งวด
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyCart() {
  return (
    <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-orange-500">
        <ShoppingBag className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-extrabold text-[#14213D]">ยังไม่มีคอร์สในตะกร้า</h2>
      <p className="mt-2 text-sm text-slate-500">เลือกคอร์สที่เหมาะกับเป้าหมาย แล้วกลับมาชำระเงินได้ทุกเมื่อ</p>
      <Link to="/courses" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600">เลือกดูคอร์สเรียน</Link>
    </div>
  );
}

function Summary({ items, onCheckout }) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const total = items.reduce((sum, item) => sum + item.salePrice, 0);
  const discount = subtotal - total;

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_-38px_rgba(15,23,42,.5)]">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <h2 className="mt-1 text-xl font-extrabold text-[#14213D]">สรุปรายการสั่งซื้อ</h2>
        </div>
        <div className="space-y-3 p-5 text-sm sm:p-6">
          <div className="flex justify-between text-slate-500"><span>คอร์สเรียน ({items.length})</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between text-emerald-700"><span>ส่วนลดทั้งหมด</span><span>−{money(discount)}</span></div>
          <div className="flex justify-between text-slate-500"><span>ค่าธรรมเนียมระบบ</span><span className="font-bold text-emerald-700">ฟรี</span></div>
          <div className="mt-4 flex items-end justify-between border-t border-dashed border-slate-200 pt-4">
            <div><p className="font-bold text-[#14213D]">ยอดสุทธิ</p><p className="text-[11px] text-slate-400">รวมภาษีแล้ว (ถ้ามี)</p></div>
            <strong className="text-3xl font-black text-orange-600">{money(total)}</strong>
          </div>
          <button
            type="button"
            disabled={!items.length}
            onClick={() => onCheckout(total)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 text-sm font-extrabold text-white shadow-[0_15px_32px_-14px_rgba(234,88,12,.8)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ชำระเงิน <ChevronRight className="h-4 w-4" />
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <LockKeyhole className="h-3.5 w-3.5" /> ข้อมูลการชำระเงินได้รับการปกป้อง
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
        {[
          [ShieldCheck, "ตรวจสอบสลิป"],
          [ReceiptText, "ออกใบเสร็จ"],
          [CircleHelp, "มีเจ้าหน้าที่ดูแล"],
        ].map(([Icon, label]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-2 py-3">
            <Icon className="mx-auto mb-1.5 h-4 w-4 text-orange-500" />{label}
          </div>
        ))}
      </div>
    </aside>
  );
}

const PAYMENT_STEPS = ["ตรวจสอบ", "รูปแบบชำระ", "ชำระเงิน", "สำเร็จ"];

function Stepper({ step }) {
  return (
    <div className="flex items-start justify-between px-5 pb-4 pt-5 sm:px-8">
      {PAYMENT_STEPS.map((label, index) => (
        <React.Fragment key={label}>
          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <span className={cn(
              "grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-black transition",
              index < step && "border-orange-500 bg-orange-500 text-white",
              index === step && "border-orange-500 bg-orange-50 text-orange-600",
              index > step && "border-slate-200 text-slate-300"
            )}>
              {index < step ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={cn("hidden text-[10px] font-bold sm:block", index <= step ? "text-[#14213D]" : "text-slate-300")}>{label}</span>
          </div>
          {index < PAYMENT_STEPS.length - 1 && <span className={cn("mt-4 h-0.5 flex-1", index < step ? "bg-orange-500" : "bg-slate-200")} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function PaymentChoice({ icon: Icon, active, title, price, detail, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full rounded-2xl border-2 p-4 text-left transition",
        active ? "border-orange-500 bg-orange-50/60 shadow-[0_12px_30px_-24px_rgba(234,88,12,.8)]" : "border-slate-200 hover:border-orange-200"
      )}
    >
      {badge && <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">{badge}</span>}
      <div className="flex items-start gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", active ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500")}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3"><strong className="text-sm text-[#14213D]">{title}</strong><strong className="shrink-0 text-sm text-orange-600">{price}</strong></div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p>
        </div>
      </div>
    </button>
  );
}

/**
 * Toast แจ้งผลตรวจสอบสลิป ลอยอยู่มุมบนของ modal
 * type: "success" | "error"
 */
function SlipToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, toast.type === "success" ? 2200 : 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  const isSuccess = toast.type === "success";

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto fixed left-1/2 top-5 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border p-4 shadow-2xl backdrop-blur transition-all animate-[toast-in_.25s_ease-out]",
        isSuccess ? "border-emerald-200 bg-emerald-50/95" : "border-red-200 bg-red-50/95"
      )}
    >
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
      <div className="flex items-start gap-3">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", isSuccess ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
          {isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-extrabold", isSuccess ? "text-emerald-800" : "text-red-800")}>
            {isSuccess ? "ตรวจสอบสลิปสำเร็จ" : "ตรวจสอบสลิปไม่ผ่าน"}
          </p>
          <p className={cn("mt-0.5 text-xs leading-relaxed", isSuccess ? "text-emerald-700" : "text-red-700")}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={cn("shrink-0 rounded-full p-1 transition", isSuccess ? "text-emerald-500 hover:bg-emerald-100" : "text-red-500 hover:bg-red-100")}
          aria-label="ปิดการแจ้งเตือน"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CheckoutModal({ items, total, onClose }) {
  const [step, setStep] = useState(0);
  const [payPlan, setPayPlan] = useState("full");
  const [channel, setChannel] = useState("promptpay");
  const [slipFile, setSlipFile] = useState(null);
  const [slipName, setSlipName] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [checkingSlip, setCheckingSlip] = useState(false);
  const [slipToast, setSlipToast] = useState(null); // { type: 'success' | 'error', message: string }
  const fileRef = useRef(null);
  const promptPayId = String(import.meta.env.VITE_PROMPTPAY_ID || "").replace(/\D/g, "");
  const promptPayAccountName = import.meta.env.VITE_PROMPTPAY_ACCOUNT_NAME || "บัญชี PromptPay ของสถาบัน";
  const bankName = import.meta.env.VITE_BANK_NAME || "";
  const bankAccountName = import.meta.env.VITE_BANK_ACCOUNT_NAME || "";
  const bankAccountNumber = import.meta.env.VITE_BANK_ACCOUNT_NUMBER || "";
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const installmentRows = useMemo(() => {
    const maxInstallments = Math.max(...items.map((item) => item.installments), 1);
    return Array.from({ length: maxInstallments }, (_, index) => {
      const courseParts = items
        .map((item) => ({
          id: item.id,
          title: item.title,
          amount: item.installmentAmounts[index] ?? 0,
        }))
        .filter((course) => course.amount > 0);
      return {
        no: index + 1,
        amount: courseParts.reduce((sum, course) => sum + course.amount, 0),
        due: index === 0 ? "ชำระพร้อมยืนยันคำสั่งซื้อ" : "วันครบกำหนดรอเชื่อมข้อมูลการชำระ",
        courseParts,
      };
    });
  }, [items]);

  const installmentEnabled = items.some((item) => item.installmentEligible);
  const installmentCount = installmentRows.length;
  const dueNow = payPlan === "full" ? total : installmentRows[0]?.amount ?? total;

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    if (channel !== "promptpay" || step !== 2) return () => { active = false; };

    const createQr = async () => {
      setQrDataUrl("");
      setQrError("");
      if (![10, 13, 15].includes(promptPayId.length)) {
        setQrError("ยังไม่ได้ตั้งค่า VITE_PROMPTPAY_ID หรือรูปแบบไม่ถูกต้อง");
        return;
      }
      if (!Number.isFinite(dueNow) || dueNow <= 0) {
        setQrError("ยอดชำระไม่ถูกต้อง จึงยังสร้าง QR ไม่ได้");
        return;
      }

      setQrLoading(true);
      try {
        const lockedAmount = Math.round(dueNow * 100) / 100;
        const payload = generatePromptPayPayload(promptPayId, { amount: lockedAmount });
        const dataUrl = await QRCode.toDataURL(payload, {
          width: 420,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#14213D", light: "#FFFFFF" },
        });
        if (active) setQrDataUrl(dataUrl);
      } catch (error) {
        if (active) setQrError(error?.message || "ไม่สามารถสร้าง PromptPay QR ได้");
      } finally {
        if (active) setQrLoading(false);
      }
    };

    createQr();
    return () => { active = false; };
  }, [channel, dueNow, promptPayId, step]);

  const handleSlipFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSlipFile(file);
    setSlipName(file?.name || "");
    setSlipToast(null); // เลือกไฟล์ใหม่ ล้าง toast เก่าทิ้ง
  };

  // ยิงไปเช็คสลิปกับ backend (ต่อ SlipOK) ก่อนตัดสินใจว่าจะไป step สำเร็จหรือไม่
  const handleConfirmPayment = async () => {
    if (!slipFile || checkingSlip) return;

    setCheckingSlip(true);
    setSlipToast(null);

    try {
      const token = localStorage.getItem("student_token"); // ปรับ key ให้ตรงกับที่ระบบ auth ของคุณเก็บไว้จริง

      const formData = new FormData();
      formData.append("slipImage", slipFile);
      formData.append("expectedAmount", dueNow);

      const res = await fetch(`${API_BASE}/api/payments/check-slip`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        setSlipToast({
          type: "error",
          message: result?.message || "ตรวจสอบสลิปไม่ผ่าน กรุณาตรวจสอบสลิปแล้วลองใหม่อีกครั้ง",
        });
        return;
      }

      setSlipToast({
        type: "success",
        message: `ยอดโอน ${money(result.data?.amount ?? dueNow)} ตรงกับยอดที่ต้องชำระ กำลังไปขั้นตอนถัดไป…`,
      });

      // โชว์ toast สำเร็จให้เห็นสักครู่ก่อนเด้งไป step 3
      setTimeout(() => setStep(3), 900);

    } catch (error) {
      setSlipToast({
        type: "error",
        message: "เชื่อมต่อระบบตรวจสอบสลิปไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
      });
    } finally {
      setCheckingSlip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#0B1224]/70 p-2 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-label="ขั้นตอนชำระเงิน">
      <button className="fixed inset-0 cursor-default" onClick={onClose} aria-label="ปิดหน้าต่าง" />

      <SlipToast toast={slipToast} onClose={() => setSlipToast(null)} />

      <div className="relative flex h-[96dvh] w-full max-w-[1440px] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl sm:h-[92dvh] sm:rounded-[30px]">
        <div className="border-b border-slate-100">
          <Stepper step={step} />
          <button onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="ปิด"><X className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8 lg:px-12 lg:py-9">
          {step === 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">Review order</p>
              <h2 className="mt-1 text-2xl font-black text-[#14213D]">ตรวจสอบรายการก่อนชำระ</h2>
              <div className="mt-5 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <img src={item.image} alt="" className="h-16 w-20 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold text-[#14213D]">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.termName || "ไม่ระบุเทอม"} · ชั่วโมงรวม {item.lessons}</p></div>
                    <strong className="text-sm text-orange-600">{money(item.salePrice)}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between rounded-2xl bg-[#14213D] p-4 text-white">
                <span><b className="block text-sm">ยอดรวมสุทธิ</b><small className="text-white/55">{items.length} คอร์สเรียน</small></span>
                <strong className="text-2xl">{money(total)}</strong>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">Payment plan</p>
              <h2 className="mt-1 text-2xl font-black text-[#14213D]">เลือกรูปแบบการชำระ</h2>
              <p className="mt-2 text-sm text-slate-500">เห็นยอดที่ต้องจ่ายและกำหนดชำระครบถ้วนก่อนยืนยัน</p>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <PaymentChoice icon={Banknote} active={payPlan === "full"} title="ชำระเต็มจำนวน" price={money(total)} detail="ชำระครั้งเดียว เริ่มดำเนินการลงทะเบียนทันทีหลังตรวจสอบยอด" badge="แนะนำ" onClick={() => setPayPlan("full")} />
                {installmentEnabled && <PaymentChoice icon={WalletCards} active={payPlan === "installment"} title="ผ่อนชำระตามแผนคอร์ส" price={`งวดแรก ${money(installmentRows[0]?.amount ?? total)}`} detail={`รวมแผนผ่อนที่ผู้ดูแลกำหนด สูงสุด ${installmentCount} งวด`} onClick={() => setPayPlan("installment")} />}
              </div>

              {!installmentEnabled && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">คอร์สทั้งหมดในคำสั่งซื้อนี้กำหนดให้ชำระครั้งเดียวจากหน้า Admin Courses</div>}

              {payPlan === "installment" && (
                <div className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-5 lg:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-sm text-[#14213D]">ตารางผ่อนจาก Admin Courses</strong><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{installmentCount} งวด</span></div>
                  <div className="mt-4 divide-y divide-slate-100">
                    {installmentRows.map((row) => (
                      <div key={row.no} className="py-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-3"><b className="grid h-8 w-8 place-items-center rounded-full bg-orange-50 text-xs text-orange-600">{row.no}</b><span><b className="block text-xs text-[#14213D]">งวดที่ {row.no}</b><small className="text-slate-400">{row.due}</small></span></span>
                          <strong className="text-base text-[#14213D]">{money(row.amount)}</strong>
                        </div>
                        {items.length > 1 && (
                          <div className="ml-11 mt-3 grid gap-1.5 text-[11px] text-slate-500 sm:grid-cols-2">
                            {row.courseParts.map((course) => (
                              <div key={course.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                                <span className="line-clamp-1">{course.title}</span>
                                <b className="shrink-0 text-slate-700">{money(course.amount)}</b>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">ระบบไม่ได้หารยอดใหม่ แต่รวม InstallmentAmounts ของแต่ละคอร์สตามลำดับงวดโดยตรง คอร์สที่กำหนดชำระครั้งเดียวจะอยู่ในงวดแรก ส่วนคอร์สที่มีจำนวนงวดน้อยกว่าจะสิ้นสุดก่อน</div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">Secure payment</p>
              <h2 className="mt-1 text-2xl font-black text-[#14213D]">ชำระ {money(dueNow)}</h2>
              <p className="mt-2 text-sm text-slate-500">{payPlan === "full" ? "ยอดชำระเต็มจำนวน" : `งวดแรกจากแผนรวมทั้งหมด ${installmentCount} งวด`}</p>
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                <button onClick={() => setChannel("promptpay")} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold", channel === "promptpay" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500")}><QrCode className="h-4 w-4" />พร้อมเพย์</button>
                <button onClick={() => setChannel("transfer")} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold", channel === "transfer" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500")}><Landmark className="h-4 w-4" />โอนธนาคาร</button>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 p-5 text-center">
                {channel === "promptpay" ? (
                  <>
                    <div className="mx-auto grid h-52 w-52 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-md sm:h-64 sm:w-64">
                      {qrLoading && <div className="text-xs font-semibold text-slate-400">กำลังสร้าง PromptPay QR…</div>}
                      {!qrLoading && qrDataUrl && <img src={qrDataUrl} alt={`PromptPay QR ยอด ${money(dueNow)}`} className="h-full w-full object-contain" />}
                      {!qrLoading && qrError && <div className="px-4 text-center text-xs font-semibold leading-relaxed text-red-600">{qrError}</div>}
                    </div>
                    <p className="mt-4 text-sm font-bold text-[#14213D]">สแกนด้วยแอปธนาคาร · ล็อกยอด {money(dueNow)}</p>
                    <p className="mt-1 text-xs text-slate-500">{promptPayAccountName}</p>
                    <p className="mt-1 text-[10px] text-slate-400">กรุณาตรวจสอบชื่อผู้รับในแอปธนาคารก่อนยืนยันทุกครั้ง</p>
                  </>
                ) : (
                  <>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Landmark className="h-6 w-6" /></span>
                    {bankName && bankAccountName && bankAccountNumber ? (
                      <><p className="mt-4 text-sm font-bold text-[#14213D]">{bankName} · {bankAccountName}</p><p className="mt-2 text-xl font-black tracking-wider text-blue-700">{bankAccountNumber}</p></>
                    ) : (
                      <p className="mt-4 text-sm font-semibold text-red-600">ยังไม่ได้ตั้งค่าข้อมูลบัญชีธนาคารใน Environment</p>
                    )}
                  </>
                )}
                <div className="mx-auto mt-4 max-w-sm rounded-xl bg-orange-50 px-4 py-3"><span className="text-xs text-slate-500">ยอดที่ต้องชำระ</span><strong className="ml-2 text-lg text-orange-600">{money(dueNow)}</strong></div>
              </div>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSlipFileChange} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={checkingSlip}
                className={cn(
                  "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
                  slipName ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-600 hover:border-orange-300 hover:bg-orange-50"
                )}
              >
                {slipName ? <Check className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}{slipName || "แนบหลักฐานการชำระเงิน"}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-400">รองรับ JPG, PNG · ไม่เกิน 10 MB</p>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700"><BadgeCheck className="h-10 w-10" /></span>
              <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Payment submitted</p>
              <h2 className="mt-2 text-2xl font-black text-[#14213D]">ตรวจสอบสลิปสำเร็จ</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">ระบบตรวจสอบสลิปและยืนยันยอดชำระเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการยืนยันสิทธิ์เรียนในระบบต่อไป</p>
              <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-slate-200 p-4 text-left text-sm"><div className="flex justify-between"><span className="text-slate-500">ยอดที่ตรวจสอบผ่าน</span><b className="text-orange-600">{money(dueNow)}</b></div><div className="mt-3 flex justify-between"><span className="text-slate-500">สถานะ</span><b className="text-emerald-600">ตรวจสอบสลิปผ่านแล้ว</b></div></div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-8">
          {step > 0 && step < 3 ? <button onClick={() => setStep((value) => value - 1)} className="flex items-center gap-2 px-2 py-3 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />ย้อนกลับ</button> : <span />}
          {step < 2 && <button onClick={() => setStep((value) => value + 1)} className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600">ดำเนินการต่อ <ChevronRight className="h-4 w-4" /></button>}
          {step === 2 && (
            <button
              disabled={!slipFile || checkingSlip}
              onClick={handleConfirmPayment}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {checkingSlip && <Loader2 className="h-4 w-4 animate-spin" />}
              {checkingSlip ? "กำลังตรวจสอบสลิป..." : "ยืนยันการชำระเงิน"}
            </button>
          )}
          {step === 3 && <button onClick={onClose} className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600">กลับไปหน้าคอร์สของฉัน</button>}
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { cart, removeFromCart } = useShop();
  const [courseDetails, setCourseDetails] = useState({});
  const items = useMemo(
    () =>
      cart.map((cartItem) => {
        const detail = courseDetails[cartItem.id];
        return normalizeCartItem(
          detail
            ? {
                ...cartItem,
                ...detail,
                price: detail.Price,
                discount: detail.Discount,
                fullCost: detail.FullCost,
              }
            : cartItem
        );
      }),
    [cart, courseDetails]
  );
  const [checkoutTotal, setCheckoutTotal] = useState(null);

  useEffect(() => {
    let active = true;
    const missingIds = cart
      .map((item) => item.id)
      .filter((id) => id != null && !courseDetails[id]);

    if (!missingIds.length) return () => { active = false; };

    Promise.all(
      missingIds.map(async (id) => {
        try {
          const [course, subjects, schedule] = await Promise.all([
            getCourseById(id),
            getCourseSubjects(id).catch(() => []),
            getCourseSchedule(id).catch(() => []),
          ]);
          return [id, { ...course, _subjects: subjects, _schedule: schedule }];
        } catch {
          return [id, null];
        }
      })
    ).then((entries) => {
      if (!active) return;
      const validEntries = entries.filter(([, detail]) => detail);
      if (!validEntries.length) return;
      setCourseDetails((current) => ({ ...current, ...Object.fromEntries(validEntries) }));
    });

    return () => { active = false; };
  }, [cart, courseDetails]);

  return (
    <main className="min-h-screen bg-white pb-20 pt-28 text-slate-900" style={{ fontFamily: "'Sarabun', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=Sarabun:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h1 className="mt-1 text-3xl font-black text-orange-600 sm:text-4xl" style={{ fontFamily: "'Kanit', sans-serif" }}>ตะกร้าคอร์สเรียน</h1><p className="mt-2 text-sm text-slate-500">ตรวจสอบรายละเอียด ตารางเรียน และรูปแบบการชำระก่อนยืนยัน</p></div>
        </div>

        <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">{items.length ? items.map((item) => <CourseCard key={item.id} item={item} onRemove={removeFromCart} />) : <EmptyCart />}</section>
          <Summary items={items} onCheckout={setCheckoutTotal} />
        </div>

        <div className="mt-8 rounded-[26px] border border-orange-100 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600"><CreditCard className="h-5 w-5" /></span><div><h2 className="text-sm font-extrabold text-[#14213D]">ยังไม่แน่ใจเรื่องการชำระ?</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">ปรึกษาเจ้าหน้าที่เรื่องรอบเรียน การผ่อนชำระ หรือการออกใบเสร็จก่อนตัดสินใจได้</p></div></div>
          <button className="mt-4 w-full rounded-xl border border-orange-300 px-4 py-3 text-xs font-bold text-orange-600 transition hover:bg-orange-50 sm:mt-0 sm:w-auto">คุยกับเจ้าหน้าที่ผ่าน LINE</button>
        </div>
      </div>

      {checkoutTotal !== null && <CheckoutModal items={items} total={checkoutTotal} onClose={() => setCheckoutTotal(null)} />}
    </main>
  );
}