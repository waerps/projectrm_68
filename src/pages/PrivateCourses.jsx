import { useEffect, useRef, useState } from "react";
import {
  UserRoundCheck, UserRound, ClipboardCheck, HeartHandshake, LineChart, PhoneCall, UsersRound, Rocket,
  Phone, Copy, MessageCircle, MessageCircleQuestion, ExternalLink, MessageSquareText, ChevronDown, X,
  BookOpen,
} from "lucide-react";
import axios from "axios";
import { API_URL } from "../config";
import PrivateCourseOrbit from "../components/PrivateCourseOrbit";
import PrivateSubjectStack from "../components/PrivateSubjectStack";
import { cardTiltHandlers, cardIdleDelay } from "../utils/cardTilt";
import {
  PRIVATE_CONTACT as C, PRIVATE_STARTING_PRICE, PRIVATE_LEVELS, privateIconOf, privateInquiryMessage,
} from "../config/privateCourses";

/* ─────────────────────────────────────────────────────────────────────────
   หน้าคอร์สเดี่ยว (เรียนตัวต่อตัว 1:1) — ไม่มีปุ่มซื้อ ฝากข้อมูลให้แอดมินติดต่อกลับได้
   ภาษาดีไซน์เดียวกับหน้าแรก: การ์ดขาว→ครีม #FFF3E8, หัวข้อกรมท่า #14213D, ส้มเป็นจุดเน้น
   ───────────────────────────────────────────────────────────────────────── */

const NAVY = "#14213D";
const ORANGE_GRAD = "linear-gradient(135deg,#FB923C 0%,#F97316 55%,#EA580C 100%)";
const TILE_GRAD = "linear-gradient(135deg,#FDBA74,#F97316)";
const CREAM = "linear-gradient(160deg,#ffffff 0%,#FFF3E8 100%)";
const SOFT_CARD = { border: "1px solid rgba(20,33,61,.07)", background: "linear-gradient(160deg,#ffffff,#FFFBF6)" };

const iconOf = (s) => privateIconOf(s?.icon);
const GENERAL_INQUIRY = { generic: true, name: "ปรึกษาคอร์สเดี่ยว", levels: [], price: null, icon: "other" };

// รายวิชาที่แอดมินเพิ่มไว้ (private_course_offers) → รูปแบบที่หน้านี้ใช้
const toSubject = (o) => ({
  key: o.OfferId,
  name: o.Title,
  icon: o.IconKey,
  levels: Array.isArray(o.Levels) ? o.Levels : [],
  price: o.StartingPrice ?? null,
  note: o.Note || "",
});

function usePrivateOffers() {
  const [state, setState] = useState({ loading: true, error: false, subjects: [] });
  useEffect(() => {
    let alive = true;
    axios.get(`${API_URL}/api/private-courses/offers`)
      .then((res) => { if (alive) setState({ loading: false, error: false, subjects: (Array.isArray(res.data) ? res.data : []).map(toSubject) }); })
      .catch(() => { if (alive) setState({ loading: false, error: true, subjects: [] }); });
    return () => { alive = false; };
  }, []);
  return state;
}

const FEATURES = [
  { icon: UserRound, t: "ครู 1 : นักเรียน 1", d: "ครูโฟกัสน้องคนเดียวตลอดคาบ ถามได้ทุกจุดที่ไม่เข้าใจ" },
  { icon: ClipboardCheck, t: "ประเมินก่อนเรียน", d: "รู้พื้นฐานน้องก่อน แล้ววางแผนการสอนให้ตรงจุด" },
  { icon: HeartHandshake, t: "เลือกครูได้", d: "ให้พี่กวางแนะนำ หรือบอกชื่อครูที่อยากเรียนด้วย" },
  { icon: LineChart, t: "ติดตามผลในระบบ", d: "ตารางเรียน การเข้าเรียน และคะแนนสอบ ดูได้ในบัญชีน้อง" },
];
const STEPS = [
  { icon: PhoneCall, t: "ฝากข้อมูลหรือโทรปรึกษา", d: "บอกวิชา ระดับชั้น และเป้าหมาย" },
  { icon: ClipboardCheck, t: "ประเมินพื้นฐาน", d: "คุยและประเมินระดับของน้อง" },
  { icon: UsersRound, t: "จับคู่ครู", d: "แนะนำครูที่เหมาะ หรือเลือกเอง" },
  { icon: Rocket, t: "เริ่มเรียน", d: "ตกลงราคา–เวลา โอนแล้วคอร์สขึ้นในบัญชี" },
];
const FAQS = [
  { q: "ราคาคอร์สเดี่ยวคิดอย่างไร?", a: `เริ่มต้น ${PRIVATE_STARTING_PRICE} บาท/ชั่วโมง ราคาจริงขึ้นกับวิชา ระดับความยาก และจำนวนชั่วโมง ${C.name}จะแจ้งหลังประเมินน้อง` },
  { q: "ทำไมกดซื้อในเว็บไม่ได้?", a: "ต้องประเมินน้องและเลือกครูที่เหมาะก่อน ราคาและเวลาเรียนจึงตกลงกันเป็นรายคน หลังตกลงแล้วสถาบันจะเปิดคอร์สเข้าบัญชีของน้องให้" },
  { q: "ชำระเงินอย่างไร?", a: `โอนเข้าบัญชีของสถาบัน บัญชีเดียวกับคอร์สปกติ ${C.name}จะแจ้งยอดให้หลังตกลงรายละเอียดกันแล้ว` },
  { q: "เลือกครูเองได้ไหม?", a: `ได้ บอกชื่อครูที่อยากเรียนด้วย หรือให้${C.name}แนะนำครูที่เหมาะกับพื้นฐานและสไตล์ของน้องก็ได้` },
];

/* ─── atoms ─── */
export function FacebookIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
    </svg>
  );
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}
function Reveal({ as = "section", className = "", style, children }) {
  const Tag = as;
  const [ref, visible] = useReveal();
  return (
    <Tag ref={ref} className={className}
      style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(18px)", transition: "opacity .7s ease, transform .8s cubic-bezier(.16,1,.3,1)" }}>
      {children}
    </Tag>
  );
}

const Eyebrow = ({ children, light }) => (
  <div className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: light ? "#FDBA74" : "#F97316" }}>
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: light ? "#FDBA74" : "#F97316" }} />
    {children}
  </div>
);

function PriceLine({ price, size = "sm" }) {
  if (!price) {
    return (
      <div className="flex items-center gap-1 text-sm font-bold text-orange-500">
        <MessageCircleQuestion className="h-4 w-4" />สอบถามราคา
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[11px] text-neutral-500">เริ่มต้น</span>
      <span className={`${size === "lg" ? "text-base" : "text-sm"} font-bold tabular-nums text-green-700`}>{price}</span>
      <span className="text-[11px] font-semibold text-green-700">บาท/ชม.</span>
    </div>
  );
}

export function PrivateContactButtons({ className = "", compact = false }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <a href={C.tel}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold text-white shadow-[0_8px_24px_-8px_rgba(249,115,22,0.55)] transition-all duration-300 hover:-translate-y-0.5 ${compact ? "px-4 py-2.5 text-[13px]" : "px-5 py-3 text-[14px]"}`}
        style={{ background: ORANGE_GRAD }}>
        <Phone className="h-4 w-4" /> โทรหา{C.name}
        {!compact && <span className="hidden font-semibold tabular-nums opacity-90 sm:inline">{C.phone}</span>}
      </a>
      <a href={C.facebookUrl} target="_blank" rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 rounded-2xl border bg-white font-bold transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 ${compact ? "px-4 py-2.5 text-[13px]" : "px-5 py-3 text-[14px]"}`}
        style={{ borderColor: "rgba(20,33,61,.15)", color: NAVY }}>
        <span className="grid h-5 w-5 place-items-center rounded-md bg-[#1877F2] text-white"><FacebookIcon className="h-3.5 w-3.5" /></span> ทักแฟนเพจ
      </a>
    </div>
  );
}

/* ─── Modal ติดต่อ ─── */
function ContactModal({ subject, onClose }) {
  const [msg, setMsg] = useState(() => privateInquiryMessage(subject?.generic ? "" : subject?.name));
  const [copied, setCopied] = useState(false);
  const [inquiry, setInquiry] = useState({
    subjectName: subject?.generic ? "" : subject?.name || "",
    studentName: "", gradeLevel: "", goal: "", desiredStartDate: "",
    learningFormat: "", learningNeeds: "", contactName: "", contactPhone: "",
    privacyAcknowledged: false,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch { /* ข้ามได้ถ้าเบราว์เซอร์ไม่อนุญาต */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const Icon = iconOf(subject);
  const updateInquiry = (event) => {
    const { name, value, type, checked } = event.target;
    setInquiry((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  const sendInquiry = async (event) => {
    event.preventDefault();
    setSending(true);
    setSendError("");
    try {
      await axios.post(`${API_URL}/api/private-courses/inquiries`, {
        ...inquiry,
        offerId: subject?.generic ? null : subject?.key,
      });
      setSent(true);
    } catch (error) {
      setSendError(error?.response?.data?.message || "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSending(false);
    }
  };
  const inputClass = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-orange-400";

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pc-modal-title" onClick={onClose}>
      <div className="sa-rise relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative overflow-hidden px-6 pb-5 pt-6" style={{ background: CREAM }}>
          <Icon className="absolute -bottom-8 -right-6 h-32 w-32 text-orange-100" />
          <button type="button" onClick={onClose} className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="ปิด">
            <X className="h-5 w-5" />
          </button>
          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: TILE_GRAD }}><Icon className="h-6 w-6" /></span>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold text-gray-400">คอร์สเดี่ยว · 1 : 1</p>
              <h3 id="pc-modal-title" className="text-xl font-extrabold" style={{ color: NAVY }}>{subject.name}</h3>
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-between gap-3">
            <PriceLine price={subject.price} size="lg" />
            <span className="text-[11px] text-gray-400">{subject.levels.join(" · ")}</span>
          </div>
        </div>

        <div className="space-y-3 p-5">
          {sent ? (
            <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              ส่งข้อมูลให้สถาบันแล้ว เจ้าหน้าที่จะติดต่อกลับตามเบอร์ที่ระบุ
            </div>
          ) : (
            <form onSubmit={sendInquiry} className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
              <h4 className="font-bold text-[#14213D]">ฝากข้อมูลคอร์สเดี่ยว</h4>
              <p className="text-xs text-gray-600">ระบุความต้องการไว้ก่อน เจ้าหน้าที่จะติดต่อกลับเพื่อประเมินและนัดเรียน</p>
              <label className="block text-xs font-semibold text-gray-700">วิชา *<input name="subjectName" required maxLength={150} value={inquiry.subjectName} onChange={updateInquiry} readOnly={!subject?.generic} className={inputClass} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700">ชื่อนักเรียน *<input name="studentName" required maxLength={120} value={inquiry.studentName} onChange={updateInquiry} className={inputClass} /></label>
                <label className="block text-xs font-semibold text-gray-700">ระดับชั้น *<input name="gradeLevel" required maxLength={50} placeholder="เช่น ม.3" value={inquiry.gradeLevel} onChange={updateInquiry} className={inputClass} /></label>
              </div>
              <label className="block text-xs font-semibold text-gray-700">เป้าหมายการเรียน *<textarea name="goal" required maxLength={500} rows={2} placeholder="เช่น เพิ่มเกรด หรือเตรียมสอบเข้า" value={inquiry.goal} onChange={updateInquiry} className={inputClass} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700">วันที่อยากเริ่มเรียน *<input type="date" name="desiredStartDate" required value={inquiry.desiredStartDate} onChange={updateInquiry} className={inputClass} /></label>
                <label className="block text-xs font-semibold text-gray-700">รูปแบบเรียน *<select name="learningFormat" required value={inquiry.learningFormat} onChange={updateInquiry} className={inputClass}><option value="">เลือกรูปแบบ</option><option value="online">ออนไลน์</option><option value="onsite">ออนไซต์</option><option value="either">ได้ทั้งสองแบบ</option></select></label>
              </div>
              <label className="block text-xs font-semibold text-gray-700">สิ่งที่ต้องการให้ช่วยเป็นพิเศษ *<textarea name="learningNeeds" required maxLength={1000} rows={2} placeholder="เรื่องที่ยังไม่เข้าใจหรือสิ่งที่อยากให้ติวเตอร์เน้น" value={inquiry.learningNeeds} onChange={updateInquiry} className={inputClass} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700">ชื่อผู้ติดต่อ *<input name="contactName" required maxLength={120} value={inquiry.contactName} onChange={updateInquiry} className={inputClass} /></label>
                <label className="block text-xs font-semibold text-gray-700">เบอร์โทรติดต่อ *<input type="tel" name="contactPhone" required inputMode="numeric" pattern="0[0-9]{9}" title="เบอร์โทร 10 หลัก" placeholder="08xxxxxxxx" value={inquiry.contactPhone} onChange={updateInquiry} className={inputClass} /></label>
              </div>
              <label className="flex items-start gap-2 text-xs text-gray-600"><input type="checkbox" name="privacyAcknowledged" required checked={inquiry.privacyAcknowledged} onChange={updateInquiry} className="mt-0.5" />รับทราบว่าสถาบันจะใช้ข้อมูลนี้เพื่อติดต่อกลับเรื่องคอร์สเดี่ยว</label>
              {sendError && <p role="alert" className="text-xs font-semibold text-red-600">{sendError}</p>}
              <button type="submit" disabled={sending} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{sending ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลให้สถาบัน"}</button>
            </form>
          )}
          <a href={C.tel} className="flex items-center gap-3 rounded-2xl border-2 border-gray-100 p-3 transition hover:border-orange-300">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: ORANGE_GRAD }}><Phone className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[11px] text-gray-500">โทรหา{C.name} ({C.role})</span>
              <span className="text-lg font-bold tabular-nums" style={{ color: NAVY }}>{C.phone}</span>
            </span>
            <button type="button" onClick={(e) => { e.preventDefault(); copy(C.phone.replace(/-/g, "")); }} title="คัดลอกเบอร์"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-orange-300 hover:text-orange-500">
              <Copy className="h-4 w-4" />
            </button>
          </a>
          <a href={C.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border-2 border-gray-100 p-3 transition hover:border-blue-300">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#1877F2] text-white"><FacebookIcon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[11px] text-gray-500">ทักแฟนเพจ Facebook</span>
              <span className="block truncate font-bold" style={{ color: NAVY }}>{C.facebookName}</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-gray-300" />
          </a>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1 text-[11px] font-semibold text-gray-500"><MessageSquareText className="h-3.5 w-3.5 text-orange-400" />ข้อความสำเร็จรูป (แก้ได้ก่อนส่ง)</p>
              <button type="button" onClick={() => copy(msg)}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${copied ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-500"}`}>
                <Copy className="h-3 w-3" />{copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── หน้า ─── */
export default function PrivateCourses() {
  const [level, setLevel] = useState("ทั้งหมด");
  const [selected, setSelected] = useState(null);
  const { loading, error, subjects } = usePrivateOffers();
  const list = subjects.filter((s) => level === "ทั้งหมด" || s.levels.includes(level));
  // แสดงเฉพาะระดับชั้นที่มีรายวิชาจริง
  const levels = PRIVATE_LEVELS.filter((l) => subjects.some((s) => s.levels.includes(l)));

  return (
    <div className="pb-28 lg:pb-16">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">

        {/* ═══ HERO ═══ */}
        <section className="sa-rise relative mt-[108px] overflow-hidden rounded-[28px] border shadow-sm" style={{ borderColor: "rgba(20,33,61,.06)", background: CREAM }}>
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="relative grid items-center gap-4 px-5 py-8 sm:px-8 md:grid-cols-[1fr_1.05fr] md:gap-6 md:px-10 md:py-8">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                <UserRoundCheck className="h-3.5 w-3.5" /> เรียนตัวต่อตัว 1 : 1
              </span>
              <h1 className="mt-4 text-[28px] font-extrabold leading-tight md:text-[36px]" style={{ color: NAVY }}>
                <span className="text-orange-500">คอร์สเดี่ยว</span><br className="sm:hidden" /> เรียนกับครูที่ใช่
              </h1>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-600">
                ครูหนึ่งคนดูแลน้องหนึ่งคน {C.name}จะประเมินพื้นฐานน้องก่อน แล้วแนะนำครูที่เหมาะ หรือเลือกครูที่อยากเรียนด้วยก็ได้
              </p>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-gray-500">ราคาเริ่มต้น</span>
                  <span className="text-[26px] font-extrabold tabular-nums text-orange-500">{PRIVATE_STARTING_PRICE}</span>
                  <span className="text-sm font-semibold" style={{ color: NAVY }}>บาท / ชม.</span>
                </div>
                <span className="text-[11px] text-gray-400">ราคาจริงขึ้นกับวิชาและจำนวนชั่วโมง · สอบถามราคาได้</span>
              </div>
              <PrivateContactButtons className="mt-6" />
              <button type="button" onClick={() => setSelected(GENERAL_INQUIRY)} className="mt-3 rounded-2xl border border-orange-300 bg-white px-5 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-50">ฝากข้อมูลคอร์สเดี่ยวให้ติดต่อกลับ</button>
            </div>
            <PrivateCourseOrbit variant="hero" orbitCoin>
              <PrivateSubjectStack subjects={subjects} iconOf={iconOf} onSelect={setSelected} className="relative h-[214px] w-[244px] sm:w-[272px]" />
            </PrivateCourseOrbit>
          </div>
        </section>

        {/* ═══ จุดเด่น ═══ */}
        <Reveal className="mt-12">
          <Eyebrow>ทำไมต้องคอร์สเดี่ยว</Eyebrow>
          <h2 className="text-[24px] font-extrabold leading-tight md:text-[30px]" style={{ color: NAVY }}>
            ออกแบบการเรียนเฉพาะน้อง<br className="sm:hidden" /> ตั้งแต่วันแรก
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.t} className="group h-full rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1.5" style={SOFT_CARD}>
                <div className="grid h-11 w-11 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110" style={{ background: TILE_GRAD }}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[15px] font-bold" style={{ color: NAVY }}>{f.t}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{f.d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ═══ ขั้นตอน (แถบกรมท่าแบบ Stats หน้าแรก) ═══ */}
        <Reveal className="mt-12 overflow-hidden rounded-[32px] px-5 py-10 md:px-10" style={{ background: NAVY }}>
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: "#FDBA74" }}>เริ่มยังไง</p>
            <h2 className="mt-1 text-[22px] font-extrabold text-white md:text-[26px]">4 ขั้นตอนก่อนเริ่มเรียน</h2>
            <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,.6)" }}>คอร์สเดี่ยวไม่มีปุ่มซื้อในเว็บ เพราะต้องคุยและประเมินน้องก่อนทุกครั้ง</p>
          </div>
          <ol className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.t} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <span className="absolute left-[calc(50%+36px)] right-[calc(-50%+36px)] top-7 hidden h-px md:block" style={{ background: "rgba(253,186,116,.3)" }}>
                    <span className="sa-flow" style={{ background: "#FDBA74", animationDelay: `${i * 0.6}s` }} />
                  </span>
                )}
                <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(253,186,116,.35)" }}>
                  <s.icon className="h-6 w-6" style={{ color: "#FDBA74" }} />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-[11px] font-bold text-white">{i + 1}</span>
                </div>
                <p className="mt-3 font-bold text-white">{s.t}</p>
                <p className="mt-1 text-[12.5px]" style={{ color: "rgba(255,255,255,.6)" }}>{s.d}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* ═══ วิชา ═══ */}
        <Reveal className="mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>วิชาที่เปิดสอน</Eyebrow>
              <h2 className="text-[24px] font-extrabold md:text-[30px]" style={{ color: NAVY }}>เลือกวิชาที่สนใจ</h2>
            </div>
            {levels.length > 1 && <div className="flex flex-wrap gap-2">
              {["ทั้งหมด", ...levels].map((l) => (
                <button key={l} type="button" onClick={() => setLevel(l)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${l === level ? "border-[#14213D] bg-[#14213D] text-white" : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-500"}`}>
                  {l}
                </button>
              ))}
            </div>}
          </div>
          {!loading && !list.length && (
            <div className="flex flex-col items-center gap-3 rounded-3xl px-6 py-10 text-center" style={SOFT_CARD}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: TILE_GRAD }}><BookOpen className="h-6 w-6" /></span>
              <p className="font-bold" style={{ color: NAVY }}>{error ? "โหลดรายวิชาไม่สำเร็จ" : "สอนได้ทุกวิชาตามที่น้องต้องการ"}</p>
              <p className="max-w-md text-[13px] leading-relaxed text-gray-500">
                บอกวิชา ระดับชั้น และเป้าหมายของน้องกับ{C.name}ได้เลย แล้วเราจะหาครูที่เหมาะให้
              </p>
              <PrivateContactButtons compact className="justify-center" />
              <button type="button" onClick={() => setSelected(GENERAL_INQUIRY)} className="rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-sm font-bold text-orange-600">ฝากข้อมูลให้ติดต่อกลับ</button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {loading && [0, 1, 2, 3].map((i) => <div key={i} className="h-[260px] animate-pulse rounded-2xl bg-gray-100" />)}
            {list.map((s, i) => {
              const Icon = iconOf(s);
              return (
                <button key={s.key} type="button" onClick={() => setSelected(s)} {...cardTiltHandlers}
                  className="sa-card3d group flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 border-gray-100 bg-white text-left shadow-sm hover:border-orange-300 hover:shadow-xl"
                  style={cardIdleDelay(i)}>
                  <span className="sa-glow3d" />
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100">
                    <Icon className="sa-parallax absolute -bottom-5 -right-4 h-28 w-28 text-orange-200/70" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2"><span className="sa-pop3d grid h-12 w-12 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm"><Icon className="h-6 w-6" /></span></span>
                    <span className="sa-pop3d absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-orange-100 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-orange-600"><UserRound className="h-3 w-3" />1 : 1</span>
                  </div>
                  <div className="flex flex-1 flex-col p-3.5">
                    <h3 className="text-[13.5px] font-bold leading-snug text-neutral-800">คอร์สเดี่ยว · {s.name}</h3>
                    {s.note && <p className="mt-1 line-clamp-1 text-[11px] text-neutral-500">{s.note}</p>}
                    <div className="mt-2"><PriceLine price={s.price} /></div>
                    <div className="mb-3 mt-2.5 flex flex-wrap gap-1.5">
                      {s.levels.map((l) => <span key={l} className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">{l}</span>)}
                    </div>
                    <div className="mt-auto border-t border-neutral-100 pt-3">
                      <span className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-[11px] font-bold text-white transition group-hover:bg-orange-600">
                        <MessageCircle className="h-3.5 w-3.5" />ฝากข้อมูล / ติดต่อสอบถาม
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* ═══ FAQ ═══ */}
        <Reveal className="mt-12">
          <Eyebrow>คำถามที่พบบ่อย</Eyebrow>
          <h2 className="text-[24px] font-extrabold md:text-[30px]" style={{ color: NAVY }}>สงสัยตรงไหน ถามได้</h2>
          {/* การ์ดติดต่อ (ซ้าย) สูงเท่ารายการคำถาม (ขวา) เสมอ */}
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <div className="flex min-w-0 flex-col">
            <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl p-5" style={SOFT_CARD}>
              <MessageCircle className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-orange-100/70" />
              <div className="relative flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold text-white" style={{ background: TILE_GRAD }}>{C.name.replace(/^พี่/, "").charAt(0)}</span>
                <div className="leading-tight">
                  <p className="font-bold" style={{ color: NAVY }}>{C.name}</p>
                  <p className="text-xs text-gray-500">{C.role} · ดูแลคอร์สเดี่ยว</p>
                </div>
              </div>
              <div className="relative mt-4 space-y-2">
                <a href={C.tel} className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white/80 px-3 py-2.5 transition hover:border-orange-300">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-500"><Phone className="h-4 w-4" /></span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-[11px] text-gray-500">โทรศัพท์</span>
                    <span className="font-bold tabular-nums" style={{ color: NAVY }}>{C.phone}</span>
                  </span>
                </a>
                <a href={C.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white/80 px-3 py-2.5 transition hover:border-blue-300">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1877F2]"><FacebookIcon className="h-4 w-4" /></span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-[11px] text-gray-500">แฟนเพจ Facebook</span>
                    <span className="block truncate font-bold" style={{ color: NAVY }}>{C.facebookName}</span>
                  </span>
                </a>
              </div>
              <p className="relative mt-4 text-[13px] leading-relaxed text-gray-500">
                บอกวิชา ระดับชั้น และเป้าหมายของน้องมาได้เลย {C.name}จะช่วยประเมินและแนะนำครูที่เหมาะให้
              </p>
              <PrivateContactButtons compact className="relative mt-auto pt-5 [&>a]:flex-1" />
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-between gap-3">
            {FAQS.map((f, i) => (
              <details key={f.q} className="group rounded-2xl px-5 py-4 transition open:shadow-md" style={SOFT_CARD} open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold" style={{ color: NAVY }}>
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange-50 text-xs font-bold text-orange-500">Q</span>{f.q}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 pl-9 text-sm leading-relaxed text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
          </div>
        </Reveal>
      </div>

      {/* แถบติดต่อลอยบนมือถือ/แท็บเล็ต */}
      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <div className="flex gap-2 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl backdrop-blur">
          <a href={C.tel} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-white" style={{ background: ORANGE_GRAD }}>
            <Phone className="h-4 w-4" />โทรหา{C.name}
          </a>
          <a href={C.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-bold" style={{ borderColor: "rgba(20,33,61,.15)", color: NAVY }}>
            <FacebookIcon className="h-4 w-4 text-[#1877F2]" />ทักแฟนเพจ
          </a>
        </div>
      </div>

      {selected && <ContactModal subject={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
