import { useEffect, useRef, useState } from "react";
import {
  UserRoundCheck, UserRound, ClipboardCheck, HeartHandshake, LineChart, PhoneCall, UsersRound, Rocket,
  Phone, Copy, MessageCircle, ExternalLink, MessageSquareText, ChevronDown, X,
  BookOpen, ArrowRight, Sparkles, RefreshCw,
} from "lucide-react";
import axios from "axios";
import { API_URL } from "../config";
import PrivateCourseOrbit from "../components/PrivateCourseOrbit";
import PrivateSubjectStack from "../components/PrivateSubjectStack";
import { cardTiltHandlers, cardIdleDelay } from "../utils/cardTilt";
import {
  PRIVATE_CONTACT as C, PRIVATE_PRICING, PRIVATE_GRADE_OPTIONS, PRIVATE_SUBJECT_OPTIONS, PRIVATE_LEVELS, privateIconOf, privateInquiryMessage,
} from "../config/privateCourses";

/* ─────────────────────────────────────────────────────────────────────────
   หน้าคอร์สเดี่ยว (เรียนส่วนตัว 1–2 คน) — ไม่มีปุ่มซื้อ ฝากข้อมูลให้แอดมินติดต่อกลับได้
   ภาษาดีไซน์เดียวกับหน้าแรก: การ์ดขาว→ครีม #FFF3E8, หัวข้อกรมท่า #14213D, ส้มเป็นจุดเน้น
   ───────────────────────────────────────────────────────────────────────── */

const NAVY = "#14213D";
const ORANGE_GRAD = "linear-gradient(135deg,#FB923C 0%,#F97316 55%,#EA580C 100%)";
const TILE_GRAD = "linear-gradient(135deg,#FDBA74,#F97316)";
const CREAM = "linear-gradient(160deg,#ffffff 0%,#FFF3E8 100%)";
const SOFT_CARD = { border: "1px solid rgba(20,33,61,.07)", background: "linear-gradient(160deg,#ffffff,#FFFBF6)" };

const iconOf = (s) => privateIconOf(s?.icon);
const GENERAL_INQUIRY = { generic: true, name: "ปรึกษาคอร์สเดี่ยว", levels: [], icon: "other" };
const ONLINE_START = PRIVATE_PRICING[0].modes.find((mode) => mode.key === "online").starting;
const ONSITE_START = PRIVATE_PRICING[0].modes.find((mode) => mode.key === "onsite").starting;

// รายวิชาที่แอดมินเพิ่มไว้ (private_course_offers) → รูปแบบที่หน้านี้ใช้
const toSubject = (o) => ({
  key: o.OfferId,
  name: o.Title,
  icon: o.IconKey,
  levels: Array.isArray(o.Levels) ? o.Levels : [],
  note: o.Note || "",
});

function usePrivateOffers() {
  const [state, setState] = useState({ loading: true, error: false, subjects: [] });
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((prev) => ({ ...prev, loading: true, error: false }));
    axios.get(`${API_URL}/api/private-courses/offers`)
      .then((res) => { if (alive) setState({ loading: false, error: false, subjects: (Array.isArray(res.data) ? res.data : []).map(toSubject) }); })
      .catch(() => { if (alive) setState({ loading: false, error: true, subjects: [] }); });
    return () => { alive = false; };
  }, [reloadKey]);
  return { ...state, reload: () => setReloadKey((k) => k + 1) };
}

const FEATURES = [
  { icon: UserRound, t: "เรียนส่วนตัว 1–2 คน", d: "ครูดูแลอย่างใกล้ชิด ถามได้ทุกจุดที่ไม่เข้าใจ" },
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
  { q: "ราคาคอร์สเดี่ยวคิดอย่างไร?", a: `เรียน 1 คน ออนไลน์เริ่มต้น ${ONLINE_START} บาท/ชม. ออนไซต์เริ่มต้น ${ONSITE_START} บาท/ชม. หรือเลือกแพ็กเกจ 15, 20, 30 ชั่วโมงได้ ราคาสำหรับเรียน 2 คนแสดงเป็นราคาต่อคน เจ้าหน้าที่จะยืนยันรายละเอียดก่อนเริ่มเรียน` },
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
function Reveal({ as = "section", className = "", style, id, children }) {
  const Tag = as;
  const [ref, visible] = useReveal();
  return (
    <Tag ref={ref} id={id} className={className}
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

const baht = (price) => new Intl.NumberFormat("th-TH").format(price);
const hourlyAverage = (price, hours) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(price / hours);
const phoneMask = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join("-");
};

function PrivatePricing({ onInquire }) {
  return <Reveal className="mt-12" id="private-pricing">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><Eyebrow>แพ็กเกจคอร์สเดี่ยว</Eyebrow><h2 className="text-[26px] font-extrabold md:text-[32px]" style={{ color: NAVY }}>เลือกรูปแบบที่พอดีกับน้อง</h2>
        <p className="mt-2 text-sm text-slate-500">เรียนคนเดียวหรือเรียนคู่ มีทั้งออนไลน์และออนไซต์</p></div>
      <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">แพ็กเกจ 15 · 20 · 30 ชั่วโมง</span>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      {PRIVATE_PRICING.map((group) => <div key={group.learners} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-30px_rgba(20,33,61,.35)]">
        <div className={`relative overflow-hidden p-5 text-white ${group.learners === 1 ? "bg-gradient-to-r from-[#f97316] to-[#fb923c]" : "bg-gradient-to-r from-[#14213D] to-[#334d7a]"}`}>
          <Sparkles className="absolute -right-4 -top-7 h-32 w-32 opacity-15" />
          <p className="relative text-xs font-bold uppercase tracking-[.2em]">PRIVATE LEARNING</p>
          <h3 className="relative mt-1 text-2xl font-extrabold">{group.label}</h3>
          <p className="relative mt-1 text-sm text-white/85">{group.learners === 1 ? "โฟกัสเต็มที่ในแบบตัวต่อตัว" : "เรียนคู่กับเพื่อน ในราคาต่อคน"}</p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {group.modes.map((mode) => <div key={mode.key} className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
            <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-orange-600">{mode.key === "online" ? "เรียนจากที่ไหนก็ได้" : "พบครูที่สถาบัน"}</p><h4 className="text-lg font-extrabold text-[#14213D]">{mode.label}</h4></div>
              {mode.starting && <span className="rounded-xl bg-white px-2 py-1 text-right text-[11px] font-bold text-orange-600 shadow-sm">เริ่ม {baht(mode.starting)}<br />บาท/ชม.</span>}</div>
            <div className="mt-4 space-y-2">{mode.packages.map((pack) => <div key={pack.hours} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700">
              <div className="flex items-baseline justify-between gap-2"><span className="text-sm font-bold">{pack.hours} ชั่วโมง</span><span className="text-right text-base font-extrabold tabular-nums">{baht(pack.price)} <small className="text-[11px] font-semibold">บาท{group.learners === 2 ? "/คน" : ""}</small></span></div>
              <p className="mt-0.5 text-right text-[11px] font-medium text-slate-500">(เฉลี่ย ≈ {hourlyAverage(pack.price, pack.hours)} บาท/{group.learners === 2 ? "คน/" : ""}ชม.)</p>
            </div>)}</div>
          </div>)}
        </div>
      </div>)}
    </div>
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-slate-600">ราคาเริ่มต้นและแพ็กเกจตามข้อมูลสถาบัน · กรุณาฝากข้อมูลเพื่อให้เจ้าหน้าที่ยืนยันวิชา รูปแบบเรียน และรายละเอียดก่อนนัดเรียน</p>
      <button type="button" onClick={onInquire} className="shrink-0 rounded-xl bg-[#14213D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#263b65]">ฝากข้อมูลให้ติดต่อกลับ</button>
    </div>
  </Reveal>;
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
function ContactModal({ subject, subjects, onClose }) {
  const [msg, setMsg] = useState(() => privateInquiryMessage(subject?.generic ? "" : subject?.name));
  const [copied, setCopied] = useState(false);
  const offerNames = new Set(subjects.map((item) => item.name));
  const subjectOptions = [
    ...subjects.map((item) => ({ value: `offer:${item.key}`, name: item.name, offerId: item.key })),
    ...PRIVATE_SUBJECT_OPTIONS.filter((item) => !offerNames.has(item.name)).map((item) => ({ value: `catalog:${item.key}`, name: item.name, offerId: null })),
  ];
  const [inquiry, setInquiry] = useState({
    subjectChoice: subject?.generic ? "" : `offer:${subject.key}`,
    subjectName: subject?.generic ? "" : subject?.name || "", subjectOther: "",
    studentFirstName: "", studentLastName: "", studentNickname: "", gradeLevel: "", gradeOther: "", schoolName: "", learnerCount: "1", goal: "", desiredStartDate: "",
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
    if (name === "subjectChoice") {
      const chosen = subjectOptions.find((item) => item.value === value);
      setInquiry((current) => ({ ...current, subjectChoice: value, subjectName: chosen?.name || "", subjectOther: "" }));
      return;
    }
    if (name === "subjectOther") {
      setInquiry((current) => ({ ...current, subjectOther: value, subjectName: value }));
      return;
    }
    setInquiry((current) => ({ ...current, [name]: type === "checkbox" ? checked : name === "contactPhone" ? phoneMask(value) : value, ...(name === "gradeLevel" && value !== "อื่น ๆ" ? { gradeOther: "" } : {}) }));
  };
  const sendInquiry = async (event) => {
    event.preventDefault();
    if (!inquiry.privacyAcknowledged) return;
    setSending(true);
    setSendError("");
    try {
      const selectedOffer = subjectOptions.find((item) => item.value === inquiry.subjectChoice);
      await axios.post(`${API_URL}/api/private-courses/inquiries`, {
        ...inquiry,
        subjectName: inquiry.subjectName.trim(),
        offerId: selectedOffer?.offerId || null,
      });
      setSent(true);
    } catch (error) {
      setSendError(error?.response?.data?.message || "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSending(false);
    }
  };
  const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pc-modal-title" onClick={onClose}>
      <div className="sa-rise relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative overflow-hidden px-6 pb-5 pt-6" style={{ background: CREAM }}>
          <Icon className="absolute -bottom-8 -right-6 h-32 w-32 text-orange-100" />
          <button type="button" onClick={onClose} className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="ปิด">
            <X className="h-5 w-5" />
          </button>
          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: TILE_GRAD }}><Icon className="h-6 w-6" /></span>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold text-gray-500">คอร์สเดี่ยว · เรียนส่วนตัว 1–2 คน</p>
              <h3 id="pc-modal-title" className="text-xl font-extrabold" style={{ color: NAVY }}>{inquiry.subjectName || "ฝากข้อมูลคอร์สเดี่ยว"}</h3>
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-orange-600">สอบถามราคากับแอดมิน</span>
            <span className="text-[11px] text-gray-400">{subject.levels.join(" · ")}</span>
          </div>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          {sent ? (
            <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              ส่งข้อมูลให้สถาบันแล้ว เจ้าหน้าที่จะติดต่อกลับตามเบอร์ที่ระบุ
            </div>
          ) : (
            <form onSubmit={sendInquiry} className="space-y-5 rounded-2xl border border-orange-100 bg-[#fffaf5] p-4 sm:p-5">
              <div><h4 className="text-lg font-extrabold text-[#14213D]">ฝากข้อมูลคอร์สเดี่ยว</h4><p className="mt-1 text-xs text-gray-600">เล่าความต้องการไว้ก่อน เจ้าหน้าที่จะติดต่อกลับเพื่อประเมินและนัดเรียน</p></div>
              <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                <p className="mb-3 text-sm font-extrabold text-[#14213D]">01 / ข้อมูลนักเรียน</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-gray-700">ชื่อจริง *<input name="studentFirstName" required maxLength={60} autoComplete="given-name" value={inquiry.studentFirstName} onChange={updateInquiry} className={inputClass} /></label>
                  <label className="block text-xs font-semibold text-gray-700">นามสกุล *<input name="studentLastName" required maxLength={60} autoComplete="family-name" value={inquiry.studentLastName} onChange={updateInquiry} className={inputClass} /></label>
                  <label className="block text-xs font-semibold text-gray-700">ชื่อเล่น *<input name="studentNickname" required maxLength={60} value={inquiry.studentNickname} onChange={updateInquiry} className={inputClass} /></label>
                  <label className="block text-xs font-semibold text-gray-700">ระดับชั้น *<select name="gradeLevel" required value={inquiry.gradeLevel} onChange={updateInquiry} className={inputClass}><option value="">เลือกระดับชั้น</option>{PRIVATE_GRADE_OPTIONS.map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select></label>
                  {inquiry.gradeLevel === "อื่น ๆ" && <label className="block text-xs font-semibold text-gray-700 sm:col-span-2">ระบุระดับการศึกษา/สถานะ *<input name="gradeOther" required maxLength={100} placeholder="เช่น เรียน กศน. หรือไม่ได้เรียนในโรงเรียน" value={inquiry.gradeOther} onChange={updateInquiry} className={inputClass} /></label>}
                  <label className="block text-xs font-semibold text-gray-700 sm:col-span-2">ชื่อโรงเรียน{inquiry.gradeLevel !== "อื่น ๆ" && " *"}<input name="schoolName" required={inquiry.gradeLevel !== "อื่น ๆ"} maxLength={150} placeholder={inquiry.gradeLevel === "อื่น ๆ" ? "ถ้ามี" : "โรงเรียนที่กำลังเรียน"} value={inquiry.schoolName} onChange={updateInquiry} className={inputClass} /></label>
                </div>
              </div>
              <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                <p className="mb-3 text-sm font-extrabold text-[#14213D]">02 / แผนการเรียน</p>
                <div className="space-y-3"><label className="block text-xs font-semibold text-gray-700">วิชา *<select name="subjectChoice" required value={inquiry.subjectChoice} onChange={updateInquiry} className={inputClass}><option value="">เลือกวิชา</option>{subjectOptions.map((item) => <option key={item.value} value={item.value}>{item.name}</option>)}<option value="other">อื่น ๆ (ระบุวิชา)</option></select></label>
                {inquiry.subjectChoice === "other" && <label className="block text-xs font-semibold text-gray-700">ระบุวิชา *<input name="subjectOther" required maxLength={150} placeholder="พิมพ์ชื่อวิชาที่ต้องการเรียน" value={inquiry.subjectOther} onChange={updateInquiry} className={inputClass} /></label>}
                <label className="block text-xs font-semibold text-gray-700">จำนวนนักเรียน *<select name="learnerCount" required value={inquiry.learnerCount} onChange={updateInquiry} className={inputClass}><option value="1">เรียน 1 คน</option><option value="2">เรียน 2 คน</option></select></label>
              <label className="block text-xs font-semibold text-gray-700">เป้าหมายการเรียน *<textarea name="goal" required maxLength={500} rows={2} placeholder="เช่น เพิ่มเกรด หรือเตรียมสอบเข้า" value={inquiry.goal} onChange={updateInquiry} className={inputClass} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700">วันที่อยากเริ่มเรียน *<input type="date" name="desiredStartDate" required value={inquiry.desiredStartDate} onChange={updateInquiry} className={inputClass} /></label>
                <label className="block text-xs font-semibold text-gray-700">รูปแบบเรียน *<select name="learningFormat" required value={inquiry.learningFormat} onChange={updateInquiry} className={inputClass}><option value="">เลือกรูปแบบ</option><option value="online">ออนไลน์</option><option value="onsite">ออนไซต์</option><option value="either">ได้ทั้งสองแบบ</option></select></label>
              </div>
              <label className="block text-xs font-semibold text-gray-700">สิ่งที่ต้องการให้ช่วยเป็นพิเศษ *<textarea name="learningNeeds" required maxLength={1000} rows={2} placeholder="เรื่องที่ยังไม่เข้าใจหรือสิ่งที่อยากให้ติวเตอร์เน้น" value={inquiry.learningNeeds} onChange={updateInquiry} className={inputClass} /></label></div></div>
              <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm"><p className="mb-3 text-sm font-extrabold text-[#14213D]">03 / ติดต่อกลับ</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700">ชื่อผู้ติดต่อ *<input name="contactName" required maxLength={120} value={inquiry.contactName} onChange={updateInquiry} className={inputClass} /></label>
                <label className="block text-xs font-semibold text-gray-700">เบอร์โทรติดต่อ *<input type="tel" name="contactPhone" required inputMode="numeric" pattern="0[0-9]{2}-[0-9]{3}-[0-9]{4}" title="เบอร์โทร 10 หลัก เช่น 081-234-5678" placeholder="08x-xxx-xxxx" value={inquiry.contactPhone} onChange={updateInquiry} className={inputClass} /></label>
              </div></div>
              <label className="flex items-start gap-2 text-xs text-gray-600"><input type="checkbox" name="privacyAcknowledged" required checked={inquiry.privacyAcknowledged} onChange={updateInquiry} className="mt-0.5" />รับทราบว่าสถาบันจะใช้ข้อมูลนี้เพื่อติดต่อกลับเรื่องคอร์สเดี่ยว</label>
              {sendError && <p role="alert" className="text-xs font-semibold text-red-600">{sendError}</p>}
              <button type="submit" disabled={sending || !inquiry.privacyAcknowledged} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none">{sending ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลให้สถาบัน"}</button>
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
  const { loading, error, subjects, reload } = usePrivateOffers();
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
                <UserRoundCheck className="h-3.5 w-3.5" /> เรียนส่วนตัว 1–2 คน
              </span>
              <h1 className="mt-4 text-[28px] font-extrabold leading-tight md:text-[36px]" style={{ color: NAVY }}>
                <span className="text-orange-500">คอร์สเดี่ยว</span><br className="sm:hidden" /> เรียนกับครูที่ใช่
              </h1>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-600">
                เลือกเรียนคนเดียวหรือเรียนคู่ {C.name}จะประเมินพื้นฐานก่อน แล้วแนะนำครูที่เหมาะ หรือเลือกครูที่อยากเรียนด้วยก็ได้
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {PRIVATE_PRICING[0].modes.map((mode) => <span key={mode.key} className="rounded-2xl border border-orange-100 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">{mode.label} <b className="text-base text-orange-600">{mode.starting}</b> บาท/ชม.</span>)}
              </div>
              <p className="mt-2 text-xs text-slate-500">แพ็กเกจเรียน 1–2 คน เริ่มที่ 15 ชั่วโมง · ดูรายละเอียดราคาด้านล่าง</p>
              <PrivateContactButtons className="mt-6" />
              <button type="button" onClick={() => setSelected(GENERAL_INQUIRY)} className="group mt-3 inline-flex items-center gap-3 rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-extrabold text-orange-600 shadow-[0_8px_25px_-14px_rgba(249,115,22,.65)] transition hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow-lg">ฝากข้อมูลให้ติดต่อกลับ <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
            </div>
            <PrivateCourseOrbit variant="hero" orbitCoin>
              <PrivateSubjectStack subjects={subjects} iconOf={iconOf} onSelect={setSelected} className="relative h-[214px] w-[244px] sm:w-[272px]" />
            </PrivateCourseOrbit>
          </div>
        </section>

        <PrivatePricing onInquire={() => setSelected(GENERAL_INQUIRY)} />

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
              {error && (
                <button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
                  <RefreshCw className="h-4 w-4" /> ลองใหม่
                </button>
              )}
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
                  <span className="block relative h-28 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100">
                    <Icon className="sa-parallax absolute -bottom-5 -right-4 h-28 w-28 text-orange-200/70" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2"><span className="sa-pop3d grid h-12 w-12 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm"><Icon className="h-6 w-6" /></span></span>
                    <span className="sa-pop3d absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-orange-100 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-orange-600"><UserRound className="h-3 w-3" />1–2 คน</span>
                  </span>
                  <span className="flex flex-1 flex-col p-3.5">
                    <span className="block text-[13.5px] font-bold leading-snug text-neutral-800">คอร์สเดี่ยว · {s.name}</span>
                    {s.note && <span className="mt-1 line-clamp-1 text-[11px] text-neutral-500">{s.note}</span>}
                    <span className="block mt-2 text-[11px] font-semibold text-orange-600">สอบถามราคากับแอดมิน</span>
                    <span className="mb-3 mt-2.5 flex flex-wrap gap-1.5">
                      {s.levels.map((l) => <span key={l} className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">{l}</span>)}
                    </span>
                    <span className="block mt-auto border-t border-neutral-100 pt-3">
                      <span className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-[11px] font-bold text-white transition group-hover:bg-orange-600">
                        <MessageCircle className="h-3.5 w-3.5" />ฝากข้อมูลให้ติดต่อกลับ
                      </span>
                    </span>
                  </span>
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

      {selected && <ContactModal subject={selected} subjects={subjects} onClose={() => setSelected(null)} />}
    </div>
  );
}
