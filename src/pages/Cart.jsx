import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { getCourseById, getCourseSchedule, getCourseSubjects } from "../callapi/callusers";
import { getConsentCatalog, saveConsents, getMyConsents, getStudentProfile, getParentProfileTypes, submitParentProfile, updateParentProfile, updateStudentProfile } from "../callapi/callusers_student";
import CheckoutIdentity from "./CheckoutIdentity";
import { getFileUrl } from "../utils/fileUrl";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  Loader2,
  LockKeyhole,
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
    image: (() => {
      const image = item.img ?? item.image ?? (item.CourseImage ? getFileUrl(item.CourseImage) : null);
      return image === "/gray.jpg" ? null : image;
    })(),
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

/**
 * รูปคอร์ส + fallback เมื่อไม่มีรูป/โหลดไม่สำเร็จ
 * สำคัญ: ขนาดของ fallback ต้องมาจาก className ที่ส่งเข้ามาเท่านั้น
 * (ถ้าไม่ส่งมาค่อยใช้ h-full w-full) — ห้ามฮาร์ดโค้ด w-full ปนกับ className
 * ไม่งั้น w-full จะชนะ w-20 แล้วกล่องรูปขยายเต็มแถวจนเนื้อหาข้างๆ ถูกบีบ
 */
function CourseArtwork({ src, alt, className = "", iconClassName = "h-14 w-14" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100",
          className || "h-full w-full"
        )}
      >
        <BookOpen className={cn("text-orange-300", iconClassName)} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

function CourseCard({ item, onRemove }) {
  const saved = item.price - item.salePrice;

  return (
    <article className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_50px_-32px_rgba(15,23,42,.35)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_22px_55px_-28px_rgba(234,88,12,.24)]">
      <div className="grid sm:grid-cols-[210px_1fr]">
        <div className="relative min-h-44 overflow-hidden bg-orange-50 sm:min-h-full">
          <CourseArtwork
            src={item.image}
            alt={item.title}
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
            {item.isPromotion && <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"><Sparkles className="h-3 w-3" />โปรโมชัน</span>}
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
            {React.createElement(Icon, { className: "mx-auto mb-1.5 h-4 w-4 text-orange-500" })}{label}
          </div>
        ))}
      </div>
    </aside>
  );
}

const PAYMENT_STEPS = ["คอร์สและการชำระ", "ข้อมูลผู้ซื้อ", "ชำระเงิน", "สำเร็จ"];

function Stepper({ step, maxReached, onSelect }) {
  return (
    <div className="flex items-start justify-between px-5 pb-4 pt-5 sm:px-8">
      {PAYMENT_STEPS.map((label, index) => (
        <React.Fragment key={label}>
          <button type="button" onClick={() => onSelect(index)} disabled={step === 3 || index > maxReached || index === 3} aria-current={index === step ? "step" : undefined} className="flex min-w-0 flex-col items-center gap-1.5 disabled:cursor-not-allowed">
            <span className={cn(
              "grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-black transition",
              index < step && "border-orange-500 bg-orange-500 text-white",
              index === step && "border-orange-500 bg-orange-50 text-orange-600",
              index > step && "border-slate-200 text-slate-300"
            )}>
              {index < step ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={cn("text-[10px] font-bold sm:text-xs", index <= maxReached ? "text-slate-700" : "text-slate-300")}>{label}</span>
          </button>
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
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", active ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500")}>{React.createElement(Icon, { className: "h-5 w-5" })}</span>
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

export function CheckoutModal({ items, total, onClose, onEnrollmentComplete }) {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [checkoutToken, setCheckoutToken] = useState(() => localStorage.getItem("student_token"));
  const [pendingUser, setPendingUser] = useState(null);
  const [checkoutAccount, setCheckoutAccount] = useState({ firstname: "", lastname: "", username: "", password: "", confirmPassword: "" });
  const [studentForm, setStudentForm] = useState({ firstname: "", lastname: "", phoneNo: "", schoolName: "" });
  const [purchaseNotes, setPurchaseNotes] = useState({});
  const [payPlan, setPayPlan] = useState("full");
  const [slipFile, setSlipFile] = useState(null);
  const [slipName, setSlipName] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [purchaseNoteWarning, setPurchaseNoteWarning] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [checkingSlip, setCheckingSlip] = useState(false);
  const [paymentIndex, setPaymentIndex] = useState(0);
  const [activeInstallment, setActiveInstallment] = useState(null);
  const [lineLoading, setLineLoading] = useState(false);
  const [lineLinked, setLineLinked] = useState(false);
  const [slipToast, setSlipToast] = useState(null); // { type: 'success' | 'error', message: string }
  const fileRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0, behavior: "auto" }); }, [step]);

  // ── PDPA: ข้อมูลผู้ปกครอง + ความยินยอมบันทึกพฤติกรรมระหว่างสอบ — ทั้งสองอย่างเก็บ "ครั้งเดียวต่อนักเรียน"
  // ไม่ถามซ้ำทุกครั้งที่ซื้อคอร์ส: ข้อมูลผู้ปกครองถามเฉพาะตอนยังไม่มีผู้ปกครองผูกไว้ (ParentId ว่าง)
  // ส่วนความยินยอมสอบถามเฉพาะตอนยังไม่เคยตอบ (not_answered) — เคยตอบแล้วไม่ว่ายินยอมหรือไม่ยินยอม
  // ก็ไม่ถามซ้ำอีก มีแอดมินเท่านั้นที่แก้ไขให้ทีหลังได้ (ดู admin.students.routes.js)
  const [profileLoading, setProfileLoading] = useState(true);
  const [studentParentId, setStudentParentId] = useState(undefined);
  const [parentSubmitted, setParentSubmitted] = useState(false);
  const [parentTypes, setParentTypes] = useState([]);
  const [parentForm, setParentForm] = useState({
    firstname: "", lastname: "", nickname: "", phoneNo: "", lineId: "",
    birthOfDate: "", parentProfilesTypeId: "",
  });
  const [parentAcknowledged, setParentAcknowledged] = useState(false);

  const [enrollConsentItems, setEnrollConsentItems] = useState([]);
  const [enrollConsentLoading, setEnrollConsentLoading] = useState(true);
  // ยินยอมผูกกับ "คอร์สที่กำลังจะซื้อ" แยกกันทีละคอร์ส ไม่ใช่ครั้งเดียวใช้กับทุกคอร์สแบบเดิม
  // { [courseId]: { status: 'granted' | 'denied' | 'not_answered', granted: boolean (ค่าที่กำลังติ๊ก) }
  const [examConsentByCourse, setExamConsentByCourse] = useState({});

  const [savingStep1, setSavingStep1] = useState(false);
  const [step1Error, setStep1Error] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = checkoutToken;
    (async () => {
      try {
        const [catalog, profile, types] = await Promise.all([
          getConsentCatalog(),
          token ? getStudentProfile(token) : Promise.resolve(null),
          getParentProfileTypes().catch(() => []),
        ]);
        if (cancelled) return;

        const askKeys = new Set(catalog?.askAtEnroll || []);
        const catalogItems = (catalog?.items || []).filter((it) => askKeys.has(it.key));
        setEnrollConsentItems(catalogItems);

        // ต้องรู้สถานะความยินยอมของ "แต่ละคอร์สที่กำลังจะซื้อรอบนี้" แยกกัน เพราะยินยอมผูกกับ
        // คอร์สแล้ว ไม่ใช่ครั้งเดียวใช้กับทุกคอร์สแบบเดิม
        const consentKey = catalogItems[0]?.key;
        const statusEntries = await Promise.all(
          items.map(async (courseItem) => {
            if (!token || !consentKey) return [courseItem.id, "not_answered"];
            try {
              const res = await getMyConsents(token, courseItem.id);
              return [courseItem.id, res?.consents?.[consentKey] || "not_answered"];
            } catch {
              return [courseItem.id, "not_answered"];
            }
          })
        );
        if (!cancelled) {
          setExamConsentByCourse((previous) =>
            Object.fromEntries(statusEntries.map(([courseId, status]) => [courseId, {
              status,
              granted: status === "not_answered" ? !!previous[courseId]?.granted : status === "granted",
            }]))
          );
        }

        setStudentParentId(profile ? (profile.parentId ?? null) : null);
        if (profile) {
          setStudentForm((current) => ({ firstname: current.firstname || profile.firstname || "", lastname: current.lastname || profile.lastname || "", phoneNo: current.phoneNo || profile.phoneNo || "", schoolName: current.schoolName || profile.schoolName || "" }));
          setParentForm((current) => ({ firstname: current.firstname || profile.parent?.firstname || "", lastname: current.lastname || profile.parent?.lastname || "", nickname: current.nickname || profile.parent?.nickname || "", phoneNo: current.phoneNo || profile.parent?.phoneNo || "", lineId: current.lineId || profile.parent?.lineId || "", birthOfDate: current.birthOfDate || profile.parent?.birthOfDate || "", parentProfilesTypeId: current.parentProfilesTypeId || profile.parent?.parentProfilesTypeId || "" }));
        }
        setParentTypes(Array.isArray(types) ? types : []);
      } catch (err) {
        console.error("โหลดข้อมูลก่อนชำระเงินไม่สำเร็จ:", err);
        // ไม่บล็อกการซื้อคอร์สเพราะ API เหล่านี้ล่ม — ปล่อยให้ซื้อต่อได้ตามปกติ (ถือว่ายังไม่มีผู้ปกครองผูก)
        setStudentParentId(null);
      } finally {
        if (!cancelled) {
          setEnrollConsentLoading(false);
          setProfileLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [items, checkoutToken]);

  const handleCheckoutAuthenticated = (data) => {
    if (!data?.token || data.user?.role !== "student") {
      setStep1Error("เข้าสู่ระบบนักเรียนไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }
    setPendingUser(data.user);
    setProfileLoading(true);
    setCheckoutToken(data.token);
    setStep1Error("");
  };

  const examConsentItem = enrollConsentItems[0] || null;
  const needsParentForm = !profileLoading;
  // คอร์สไหนในตะกร้ารอบนี้ที่ยังไม่เคยตอบความยินยอมบ้าง ต้องบันทึกให้ครบก่อนไปขั้นตอนถัดไป
  const coursesNeedingExamConsent = examConsentItem
    ? items.filter((item) => (examConsentByCourse[item.id]?.status || "not_answered") === "not_answered")
    : [];

  const handleContinueFromStep1 = async () => {
    const buyer = checkoutToken ? studentForm : checkoutAccount;
    if (!buyer.firstname.trim() || !buyer.lastname.trim()) {
      setStep1Error("กรุณากรอกชื่อและนามสกุลนักเรียน");
      return;
    }
    if (!checkoutToken && (!checkoutAccount.username.trim() || !checkoutAccount.password || checkoutAccount.password !== checkoutAccount.confirmPassword)) {
      setStep1Error("กรุณากรอกชื่อผู้ใช้ รหัสผ่าน และยืนยันรหัสผ่านให้ตรงกัน");
      return;
    }
    if (!checkoutToken && checkoutAccount.password.length < 8) {
      setStep1Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (checkoutToken && studentParentId === null && (!parentForm.firstname.trim() || !parentForm.lastname.trim() || !parentAcknowledged)) {
      setStep1Error("กรุณากรอกชื่อผู้ปกครองและรับทราบการเก็บข้อมูลก่อน");
      return;
    }

    setSavingStep1(true);
    setStep1Error("");
    try {
      let token = checkoutToken;
      if (!token) {
        const credentials = { username: checkoutAccount.username.trim(), password: checkoutAccount.password };
        const login = () => fetch(`${API_BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
        let response = await login();
        if (response.status === 401) {
          const registration = new FormData();
          for (const key of ["firstname", "lastname", "username", "password"]) registration.append(key, checkoutAccount[key].trim());
          const registered = await fetch(`${API_BASE}/auth/register`, { method: "POST", body: registration });
          const registeredBody = await registered.json().catch(() => ({}));
          if (!registered.ok) throw new Error(registeredBody.message?.includes("ถูกใช้งานแล้ว") ? "ชื่อผู้ใช้นี้มีอยู่แล้ว แต่รหัสผ่านไม่ตรง กรุณาตรวจสอบอีกครั้ง" : registeredBody.message || "สร้างบัญชีไม่สำเร็จ");
          response = await login();
        }
        const session = await response.json().catch(() => ({}));
        if (!response.ok || !session.token || session.user?.role !== "student") throw new Error(session.message || "เตรียมบัญชีนักเรียนไม่สำเร็จ");
        token = session.token;
        setPendingUser(session.user);
        setCheckoutToken(token);
      }
      const profile = await getStudentProfile(token);
      const parentId = profile?.parentId ?? null;
      setStudentParentId(parentId);
      if (parentId === null && (!parentForm.firstname.trim() || !parentForm.lastname.trim() || !parentAcknowledged)) {
        throw new Error("กรุณากรอกชื่อผู้ปกครองและรับทราบการเก็บข้อมูลก่อน");
      }
      await updateStudentProfile(token, {
        firstname: buyer.firstname.trim(),
        lastname: buyer.lastname.trim(),
        phoneNo: studentForm.phoneNo || profile.phoneNo || "",
        schoolName: studentForm.schoolName || profile.schoolName || "",
      });
      if (parentForm.firstname.trim() && parentForm.lastname.trim()) {
        if (parentId === null && !parentSubmitted) await submitParentProfile(token, { ...parentForm, acknowledged: true });
        else await updateParentProfile(token, parentForm);
        setParentSubmitted(true);
      } else if (parentId === null) {
        throw new Error("กรุณากรอกชื่อและนามสกุลผู้ปกครองก่อน");
      }
      if (token && examConsentItem && coursesNeedingExamConsent.length) {
        // ถามแยกเป็นรายคอร์ส — บันทึกทีละคอร์สที่ยังไม่เคยตอบ ใช้ค่าที่ติ๊กไว้ของคอร์สนั้น
        // (ไม่ติ๊ก = ไม่ยินยอม เหมือนพฤติกรรมเดิม)
        const unanswered = (await Promise.all(coursesNeedingExamConsent.map(async (courseItem) => {
          const current = await getMyConsents(token, courseItem.id);
          return (current?.consents?.[examConsentItem.key] || "not_answered") === "not_answered" ? courseItem : null;
        }))).filter(Boolean);
        await Promise.all(
          unanswered.map((courseItem) =>
            saveConsents(
              token,
              courseItem.id,
              [{ consentKey: examConsentItem.key, isGranted: !!examConsentByCourse[courseItem.id]?.granted }],
              { grantedByRole: "student" }
            )
          )
        );
        setExamConsentByCourse((prev) => {
          const next = { ...prev };
          unanswered.forEach((courseItem) => {
            const granted = !!prev[courseItem.id]?.granted;
            next[courseItem.id] = { status: granted ? "granted" : "denied", granted };
          });
          return next;
        });
      }
      setStep(2);
      setMaxReached((value) => Math.max(value, 2));
    } catch (err) {
      setStep1Error(typeof err === "string" ? err : (err?.message || "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
    } finally {
      setSavingStep1(false);
    }
  };
  const promptPayAccountName = import.meta.env.VITE_PROMPTPAY_ACCOUNT_NAME || "บัญชี PromptPay ของสถาบัน";
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

  useEffect(() => {
    const token = checkoutToken;
    if (!token) return;
    fetch(`${API_BASE}/api/line/login/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => setLineLinked(Boolean(result.linked)))
      .catch(() => setLineLinked(false));
  }, [API_BASE, checkoutToken]);

  const installmentEnabled = items.some((item) => item.installmentEligible);
  const installmentCount = installmentRows.length;
  const paymentItem = items[paymentIndex];
  const dueNow = activeInstallment?.amount ?? (payPlan === "full"
    ? paymentItem?.salePrice ?? total
    : paymentItem?.installmentAmounts?.[0] ?? paymentItem?.salePrice ?? total);

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
    if (step !== 2 || !paymentItem) return () => { active = false; };

    const createQr = async () => {
      setQrDataUrl("");
      setQrError("");
      setQrLoading(true);
      try {
        const token = checkoutToken;
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
        let orderId;
        const orderResponse = await fetch(`${API_BASE}/api/payments/orders`, {
          method: "POST", headers,
          body: JSON.stringify({
            courseId: paymentItem.id,
            purchaseNote: (purchaseNotes[paymentItem.id] || "").trim(),
            paymentPlan: payPlan === "installment" && paymentItem.installmentEligible ? "installment" : "full",
          }),
        });
        const orderResult = await orderResponse.json().catch(() => ({}));
        if (orderResult.purchaseNoteSaved === false && active) {
          setPurchaseNoteWarning("หมายเหตุการเรียนยังบันทึกไม่ได้ในขณะนี้ กรุณาแจ้งเจ้าหน้าที่โดยตรงหากต้องการให้ติวเตอร์ทราบ");
        } else if (active) {
          setPurchaseNoteWarning("");
        }
        if (orderResponse.ok) {
          orderId = orderResult.orderId;
        } else if (orderResponse.status === 409) {
          orderId = orderResult.data?.OrderId;
        } else {
          throw new Error(orderResult.message || "สร้างรายการชำระเงินไม่สำเร็จ");
        }
        const ordersResponse = await fetch(`${API_BASE}/api/payments/orders`, { headers: { Authorization: `Bearer ${token}` } });
        const orders = await ordersResponse.json().catch(() => []);
        if (!ordersResponse.ok) throw new Error(orders?.message || "โหลดงวดชำระเงินไม่สำเร็จ");
        const installment = orders.find((row) => Number(row.orderId) === Number(orderId) && Number(row.installmentNo) === 1);
        if (!installment) throw new Error("ไม่พบข้อมูลงวดแรกของคอร์สนี้");
        if (installment.installmentStatus === "paid") throw new Error("งวดแรกของคอร์สนี้ชำระแล้ว");
        const qrResponse = await fetch(`${API_BASE}/api/payments/installments/${installment.installmentId}/qr`, { headers: { Authorization: `Bearer ${token}` } });
        const qrResult = await qrResponse.json().catch(() => ({}));
        if (!qrResponse.ok) throw new Error(qrResult.message || "สร้าง QR ไม่สำเร็จ");
        if (active) {
          setActiveInstallment({ ...installment, amount: qrResult.amount });
          setQrDataUrl(qrResult.qrUrl);
        }
      } catch (error) {
        if (active) setQrError(error?.message || "ไม่สามารถสร้าง PromptPay QR ได้");
      } finally {
        if (active) setQrLoading(false);
      }
    };

    createQr();
    return () => { active = false; };
  }, [API_BASE, checkoutToken, payPlan, paymentIndex, paymentItem, purchaseNotes, step]);

  const downloadQr = async () => {
    if (!activeInstallment) return;
    try {
      const response = await fetch(`${API_BASE}/api/payments/installments/${activeInstallment.installmentId}/qr-download`, {
        headers: { Authorization: `Bearer ${checkoutToken}` },
      });
      if (!response.ok) throw new Error("ดาวน์โหลด QR ไม่สำเร็จ");
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `promptpay-${activeInstallment.installmentId}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch (error) {
      setSlipToast({ type: "error", message: error.message || "ดาวน์โหลด QR ไม่สำเร็จ" });
    }
  };

  const handleSlipFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSlipFile(file);
    setSlipName(file?.name || "");
    setSlipToast(null); // เลือกไฟล์ใหม่ ล้าง toast เก่าทิ้ง
  };

  const connectLine = async () => {
    try {
      setLineLoading(true);
      setSlipToast(null);
      const token = checkoutToken;
      const response = await fetch(`${API_BASE}/api/line/login/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnPath: "/cart" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.authorizationUrl) throw new Error(result.message || "เริ่มเชื่อม LINE ไม่สำเร็จ");
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setSlipToast({ type: "error", message: error.message || "เริ่มเชื่อม LINE ไม่สำเร็จ" });
    } finally {
      setLineLoading(false);
    }
  };

  // ยิงไปเช็คสลิปกับ backend (ต่อ SlipOK) ก่อนตัดสินใจว่าจะไป step สำเร็จหรือไม่
  const handleConfirmPayment = async () => {
    if (!slipFile || !activeInstallment || checkingSlip) return;

    setCheckingSlip(true);
    setSlipToast(null);

    try {
      const token = checkoutToken;

      const formData = new FormData();
      formData.append("slipImage", slipFile);
      formData.append("installmentId", activeInstallment.installmentId);

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

      // Backend เป็นผู้สร้าง enrollment หลังตรวจสลิปผ่าน จากนั้นชำระคอร์สถัดไปในตะกร้า
      setTimeout(() => {
        if (paymentIndex < items.length - 1) {
          setPaymentIndex((value) => value + 1);
          setActiveInstallment(null);
          setQrDataUrl("");
          setSlipFile(null);
          setSlipName("");
        } else {
          if (pendingUser && checkoutToken) {
            localStorage.setItem("student_token", checkoutToken);
            localStorage.setItem("user_role", "student");
            localStorage.setItem("user", JSON.stringify(pendingUser));
            window.dispatchEvent(new Event("student-profile-updated"));
          }
          onEnrollmentComplete(items.map((item) => item.id));
          setStep(3);
          setMaxReached(3);
        }
      }, 900);

    } catch (error) {
      setSlipToast({
        type: "error",
        message: error?.message || "เชื่อมต่อระบบตรวจสอบสลิปไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
      });
    } finally {
      setCheckingSlip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-[#0B1224]/65 p-0 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-label="ขั้นตอนชำระเงิน">
      <button className="fixed inset-0 cursor-default" onClick={onClose} aria-label="ปิดหน้าต่าง" />

      <SlipToast toast={slipToast} onClose={() => setSlipToast(null)} />

      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[90dvh] sm:max-w-4xl sm:rounded-[24px]">
        <div className="border-b border-slate-100">
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-4 text-white sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20"><ShoppingBag className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="truncate text-base font-bold sm:text-lg">ซื้อคอร์สเรียน</p><p className="text-xs text-white/85">ตรวจสอบข้อมูลและชำระเงินอย่างปลอดภัย</p></div>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 hover:bg-white/30" aria-label="ปิด"><X className="h-5 w-5" /></button>
          </div>
          <Stepper step={step} maxReached={maxReached} onSelect={(index) => {
            if (index > maxReached || index >= 3) return;
            if (step === 1 && index === 2) handleContinueFromStep1();
            else setStep(index);
          }} />
        </div>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:px-9 lg:py-7">
          {step === 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">คอร์สที่เลือก</h2>
              <p className="mt-1 text-sm text-slate-500">ตรวจสอบคอร์สและยอดชำระก่อนดำเนินการต่อ</p>
              <div className="mt-5 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <CourseArtwork
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-20 shrink-0 rounded-xl object-cover"
                      iconClassName="h-7 w-7"
                    />
                    <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold text-[#14213D]">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.termName || "ไม่ระบุเทอม"} · ชั่วโมงรวม {item.lessons}</p></div>
                    <strong className="shrink-0 text-sm text-orange-600">{money(item.salePrice)}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between rounded-xl border border-orange-100 bg-orange-50 p-4 text-slate-900">
                <span><b className="block text-sm">ยอดรวมสุทธิ</b><small className="text-slate-500">{items.length} คอร์สเรียน</small></span>
                <strong className="text-2xl text-orange-600">{money(total)}</strong>
              </div>
            </section>
          )}

          {step === 0 && (
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">รูปแบบการชำระ</h2>
              <p className="mt-1 text-sm text-slate-500">เลือกชำระเต็มจำนวนหรือผ่อนตามแผนคอร์ส</p>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                <PaymentChoice icon={Banknote} active={payPlan === "full"} title="ชำระเต็มจำนวน" price={money(total)} detail="ชำระครั้งเดียว เริ่มดำเนินการลงทะเบียนทันทีหลังตรวจสอบยอด" badge="แนะนำ" onClick={() => setPayPlan("full")} />
                {installmentEnabled && <PaymentChoice icon={WalletCards} active={payPlan === "installment"} title="ผ่อนชำระตามแผนคอร์ส" price={`งวดแรก ${money(installmentRows[0]?.amount ?? total)}`} detail={`รวมแผนผ่อนที่ผู้ดูแลกำหนด สูงสุด ${installmentCount} งวด`} onClick={() => setPayPlan("installment")} />}
              </div>

              {payPlan === "installment" && (
                <div className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-5 lg:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-sm text-slate-900">ตารางผ่อนชำระ</strong><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{installmentCount} งวด</span></div>
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
                </div>
              )}

            </section>
          )}

          {step === 0 && (
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              {/* ── PDPA: ยินยอมบันทึกพฤติกรรมระหว่างสอบ — ถามแยกเป็นรายคอร์สที่กำลังซื้อรอบนี้ ── */}
              <div>
                <strong className="text-base text-slate-900">ความยินยอมด้านข้อมูลส่วนบุคคล (PDPA)</strong>
                {enrollConsentLoading ? (
                  <p className="mt-3 text-sm text-slate-400">กำลังโหลด...</p>
                ) : examConsentItem ? (
                  <div className="mt-4 space-y-4">
                    {items.map((courseItem) => {
                      const state = examConsentByCourse[courseItem.id] || { status: "not_answered", granted: false };
                      const needsAnswer = state.status === "not_answered";
                      return (
                        <div key={courseItem.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                          <p className="text-sm font-bold text-[#14213D]">{courseItem.title}</p>
                          {needsAnswer ? (
                            <>
                              <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{examConsentItem.summary}</p>
                              {examConsentItem.reassurance && (
                                <p className="mt-2 text-sm text-emerald-600 leading-relaxed">{examConsentItem.reassurance}</p>
                              )}
                              <label className="mt-3 flex items-start gap-2.5 cursor-pointer rounded-xl bg-white px-3 py-2.5 border border-slate-200">
                                <input
                                  type="checkbox"
                                  checked={state.granted}
                                  onChange={(e) =>
                                    setExamConsentByCourse((prev) => ({
                                      ...prev,
                                      [courseItem.id]: { ...(prev[courseItem.id] || state), granted: e.target.checked },
                                    }))
                                  }
                                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                />
                                <span className="text-sm font-semibold text-slate-700">
                                  ยินยอมให้บันทึกพฤติกรรมการใช้อุปกรณ์ระหว่างทำข้อสอบของคอร์สนี้
                                </span>
                              </label>
                              {!state.granted && (
                                <p className="mt-2 text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                                  {examConsentItem.ifDenied}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                              เคยตอบเรื่องนี้ไว้แล้วสำหรับคอร์สนี้ ({state.status === "granted" ? "ยินยอม" : "ไม่ยินยอม"}) — เปลี่ยนใจภายหลังติดต่อเจ้าหน้าที่ได้
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {step1Error && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{step1Error}</p>
                )}
              </div>
            </section>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">ข้อมูลผู้ซื้อ</h2>
              <p className="mt-1 text-sm text-slate-500">ข้อมูลนี้ใช้ติดต่อเรื่องการเรียนและการชำระเงิน</p>
              {!checkoutToken ? <CheckoutIdentity account={checkoutAccount} onChange={setCheckoutAccount} onAuthenticated={handleCheckoutAuthenticated} error={step1Error} busy={savingStep1} /> : (
                <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3"><h3 className="font-bold text-slate-900">ข้อมูลนักเรียน</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{pendingUser ? "ยืนยันตัวตนแล้ว" : "เข้าสู่ระบบแล้ว"}</span></div>
                  <p className="mt-3 text-xs text-slate-500">ตรวจสอบและแก้ไขข้อมูลติดต่อก่อนชำระเงิน</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">ชื่อ <span className="text-orange-600">*</span><input value={studentForm.firstname} onChange={(e) => setStudentForm((f) => ({ ...f, firstname: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none" /></label>
                    <label className="text-sm font-semibold text-slate-700">นามสกุล <span className="text-orange-600">*</span><input value={studentForm.lastname} onChange={(e) => setStudentForm((f) => ({ ...f, lastname: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none" /></label>
                    <label className="text-sm font-semibold text-slate-700">เบอร์โทรศัพท์<input type="tel" value={studentForm.phoneNo} onChange={(e) => setStudentForm((f) => ({ ...f, phoneNo: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none" /></label>
                    <label className="text-sm font-semibold text-slate-700">โรงเรียน<input value={studentForm.schoolName} onChange={(e) => setStudentForm((f) => ({ ...f, schoolName: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none" /></label>
                  </div>
                </section>
              )}
              {!profileLoading && needsParentForm && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="border-b border-slate-100 pb-3"><strong className="text-base text-slate-900">ข้อมูลผู้ปกครอง</strong><p className="mt-1 text-xs text-slate-500">ใช้ติดต่อเรื่องการเรียนและการชำระเงิน ข้อมูลนี้เก็บไว้ใช้กับคอร์สถัดไป</p></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">ชื่อผู้ปกครอง <span className="text-orange-600">*</span><input
                      value={parentForm.firstname}
                      onChange={(e) => setParentForm((f) => ({ ...f, firstname: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
                    /></label>
                    <label className="text-sm font-semibold text-slate-700">นามสกุลผู้ปกครอง <span className="text-orange-600">*</span><input
                      value={parentForm.lastname}
                      onChange={(e) => setParentForm((f) => ({ ...f, lastname: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
                    /></label>
                    <label className="text-sm font-semibold text-slate-700">ชื่อเล่น<input
                      value={parentForm.nickname}
                      onChange={(e) => setParentForm((f) => ({ ...f, nickname: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
                    /></label>
                    <label className="text-sm font-semibold text-slate-700">เบอร์โทรศัพท์<input type="tel"
                      value={parentForm.phoneNo}
                      onChange={(e) => setParentForm((f) => ({ ...f, phoneNo: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
                    /></label>
                    <label className="text-sm font-semibold text-slate-700">LINE ID<input
                      value={parentForm.lineId}
                      onChange={(e) => setParentForm((f) => ({ ...f, lineId: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
                    /></label>
                    <label className="text-sm font-semibold text-slate-700">วันเกิด<input
                      type="date"
                      value={parentForm.birthOfDate}
                      onChange={(e) => setParentForm((f) => ({ ...f, birthOfDate: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-orange-400 focus:outline-none"
                    /></label>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">ความสัมพันธ์กับนักเรียน<select
                      value={parentForm.parentProfilesTypeId}
                      onChange={(e) => setParentForm((f) => ({ ...f, parentProfilesTypeId: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-orange-400 focus:outline-none"
                    >
                      <option value="">ความสัมพันธ์กับนักเรียน</option>
                      {parentTypes.map((t) => (
                        <option key={t.ParentProfilesType_Id} value={t.ParentProfilesType_Id}>{t.ParentProfilesType_Name}</option>
                      ))}
                    </select></label>
                  </div>
                  <label className="mt-3 flex items-start gap-2.5 cursor-pointer rounded-xl bg-slate-50 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={parentAcknowledged}
                      onChange={(e) => setParentAcknowledged(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      รับทราบเรื่องการเก็บข้อมูลผู้ปกครองตามที่แจ้งไว้ข้างต้น
                    </span>
                  </label>
                </div>
              )}

              <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div><h3 className="text-sm font-bold text-[#14213D]">สิ่งที่อยากให้เน้นในการเรียน</h3><p className="mt-1 text-xs text-slate-500">ระบุแยกตามคอร์ส เช่น วิชาหรือเรื่องที่อยากเตรียมสอบเป็นพิเศษ</p></div>
                {items.map((item) => <label key={item.id} className="block text-sm font-semibold text-slate-700">{item.title}
                  <textarea rows={2} maxLength={1000} value={purchaseNotes[item.id] || ""} onChange={(e) => setPurchaseNotes((notes) => ({ ...notes, [item.id]: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-orange-400" />
                </label>)}
              </div>
              {step1Error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{step1Error}</p>}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">Secure payment</p>
              <h2 className="mt-1 text-2xl font-black text-[#14213D]">ชำระ {money(dueNow)}</h2>
              <p className="mt-2 text-sm text-slate-500">คอร์ส {paymentIndex + 1}/{items.length}: {paymentItem?.title} · {payPlan === "full" || !paymentItem?.installmentEligible ? "ยอดชำระเต็มจำนวน" : "งวดแรก"}</p>
              {purchaseNoteWarning && <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{purchaseNoteWarning}</p>}
              <div className="mt-4 rounded-2xl border border-slate-200 p-5 text-center">
                  <>
                    <div className="mx-auto grid h-52 w-52 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-md sm:h-64 sm:w-64">
                      {qrLoading && <div className="text-xs font-semibold text-slate-400">กำลังสร้าง PromptPay QR…</div>}
                      {!qrLoading && qrDataUrl && <img src={qrDataUrl} alt={`PromptPay QR ยอด ${money(dueNow)}`} className="h-full w-full object-contain" />}
                      {!qrLoading && qrError && <div className="px-4 text-center text-xs font-semibold leading-relaxed text-red-600">{qrError}</div>}
                    </div>
                    <p className="mt-4 text-sm font-bold text-[#14213D]">สแกนด้วยแอปธนาคาร · ล็อกยอด {money(dueNow)}</p>
                    <p className="mt-1 text-xs text-slate-500">{promptPayAccountName}</p>
                    <p className="mt-1 text-[10px] text-slate-400">กรุณาตรวจสอบชื่อผู้รับในแอปธนาคารก่อนยืนยันทุกครั้ง</p>
                    <button type="button" onClick={downloadQr} disabled={!qrDataUrl} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-40">
                      บันทึก QR เป็นรูปภาพ
                    </button>
                  </>
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
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">ระบบตรวจสอบสลิปและเพิ่มคอร์สให้คุณเรียบร้อยแล้ว ดูคอร์สที่ซื้อแล้วได้จากหน้าโปรไฟล์ ในเมนู “คอร์สเรียนของฉัน”</p>
              <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-slate-200 p-4 text-left text-sm"><div className="flex justify-between"><span className="text-slate-500">ยอดที่ตรวจสอบผ่าน</span><b className="text-orange-600">{money(dueNow)}</b></div><div className="mt-3 flex justify-between"><span className="text-slate-500">สถานะ</span><b className="text-emerald-600">ตรวจสอบสลิปผ่านแล้ว</b></div></div>
              {payPlan === "installment" && (
                <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-green-200 bg-green-50 p-4 text-left">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <b className="text-sm text-green-900">{lineLinked ? "เชื่อม LINE อยู่แล้ว" : "รับ QR และแจ้งเตือนงวดถัดไปทาง LINE"}</b>
                      <p className="mt-1 text-xs leading-relaxed text-green-700">{lineLinked ? "กดเชื่อมอีกครั้งเพื่อยืนยันบัญชีและรับข้อความทักทายสำหรับคอร์สที่เพิ่งซื้อ" : "เชื่อม LINE หลังชำระงวดแรก เพื่อไม่พลาดกำหนดชำระงวดถัดไป"}</p>
                    </div>
                    <button type="button" onClick={connectLine} disabled={lineLoading} className="shrink-0 rounded-xl bg-[#06C755] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{lineLoading ? "กำลังเปิด LINE..." : lineLinked ? "เชื่อม LINE อีกครั้ง" : "เชื่อมบัญชีกับ LINE"}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-8">
          {step > 0 && step < 3 ? <button onClick={() => setStep((value) => value - 1)} className="flex items-center gap-2 px-2 py-3 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />ย้อนกลับ</button> : <span />}
          {step < 2 && (
            <button
              onClick={step === 1 ? handleContinueFromStep1 : () => { setStep(1); setMaxReached((value) => Math.max(value, 1)); }}
              disabled={savingStep1 || (step === 1 && !!checkoutToken && profileLoading)}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {step === 1 && savingStep1 ? "กำลังบันทึก..." : "ดำเนินการต่อ"} <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {step === 2 && (
            <button
              disabled={!slipFile || !activeInstallment || checkingSlip || qrLoading}
              onClick={handleConfirmPayment}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {checkingSlip && <Loader2 className="h-4 w-4 animate-spin" />}
              {checkingSlip ? "กำลังตรวจสอบสลิป..." : "ยืนยันการชำระเงิน"}
            </button>
          )}
          {step === 3 && <Link to="/" onClick={onClose} className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600">กลับไปหน้าแรก</Link>}
        </div>
      </div>
    </div>
  );
}

export function CourseCheckoutModal({ course, onClose }) {
  const item = useMemo(() => normalizeCartItem(course), [course]);
  return (
    <CheckoutModal
      items={[item]}
      total={item.salePrice}
      onClose={onClose}
      // Do not close the direct-purchase modal here. CheckoutModal advances to
      // the success screen after this callback; closing it hid step 4 for full payment.
      onEnrollmentComplete={() => {}}
    />
  );
}

export default function Cart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, removeFromCart, removeManyFromCart } = useShop();
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
  const requestCheckout = (total) => {
    setCheckoutTotal(total);
  };

  useEffect(() => {
    if (!location.state?.openCheckout || !items.length) return;
    const total = items.reduce((sum, item) => sum + item.salePrice, 0);
    requestCheckout(total);
    navigate(location.pathname, { replace: true, state: {} });
  }, [items, location.pathname, location.state?.openCheckout, navigate]);

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
    <main className="min-h-screen bg-white pb-20 pt-28 text-slate-900" style={{ fontFamily: "'Kanit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h1 className="mt-1 text-3xl font-black text-orange-600 sm:text-4xl" style={{ fontFamily: "'Kanit', sans-serif" }}>ตะกร้าคอร์สเรียน</h1><p className="mt-2 text-sm text-slate-500">ตรวจสอบรายละเอียด ตารางเรียน และรูปแบบการชำระก่อนยืนยัน</p></div>
        </div>

        <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">{items.length ? items.map((item) => <CourseCard key={item.id} item={item} onRemove={removeFromCart} />) : <EmptyCart />}</section>
          <Summary items={items} onCheckout={requestCheckout} />
        </div>

        <div className="mt-8 rounded-[26px] border border-orange-100 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600"><CreditCard className="h-5 w-5" /></span><div><h2 className="text-sm font-extrabold text-[#14213D]">ยังไม่แน่ใจเรื่องการชำระ?</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">ปรึกษาเจ้าหน้าที่เรื่องรอบเรียน การผ่อนชำระ หรือการออกใบเสร็จก่อนตัดสินใจได้</p></div></div>
          <button className="mt-4 w-full rounded-xl border border-orange-300 px-4 py-3 text-xs font-bold text-orange-600 transition hover:bg-orange-50 sm:mt-0 sm:w-auto">คุยกับเจ้าหน้าที่ผ่าน LINE</button>
        </div>
      </div>

      {checkoutTotal !== null && <CheckoutModal items={items} total={checkoutTotal} onClose={() => setCheckoutTotal(null)} onEnrollmentComplete={removeManyFromCart} />}
    </main>
  );
}