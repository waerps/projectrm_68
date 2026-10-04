import { useRef, useState } from "react";
import {
  ArrowRight, BadgeCheck, BriefcaseBusiness, ClipboardList,
  FileText, GraduationCap, Phone, ShieldCheck, UploadCloud, UserRound,
} from "lucide-react";
import { applyTutor } from "../callapi/callusers";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import PublicPageHero from "../components/PublicPageHero";

const initialForm = {
  firstname: "",
  lastname: "",
  nickname: "",
  phone: "",
  line: "",
  occupation: "",
  resume: null,
  consent: false,
};

const fieldClass = "mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100";
const labelClass = "block text-sm font-semibold text-neutral-700";

function formatPhone(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isValidPhone(value) {
  return /^0\d{2}-\d{3}-\d{4}$/.test(value);
}

export default function TutorApply() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const { toasts, showToast, removeToast } = useToast();

  const onChange = (event) => {
    const { name, value, files, type, checked } = event.target;
    if (name === "resume") {
      setForm((previous) => ({ ...previous, resume: files?.[0] ?? null }));
    } else if (name === "phone") {
      setForm((previous) => ({ ...previous, phone: formatPhone(value) }));
    } else if (type === "checkbox") {
      setForm((previous) => ({ ...previous, [name]: checked }));
    } else {
      setForm((previous) => ({ ...previous, [name]: value }));
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.firstname.trim() || !form.lastname.trim() || !form.phone) {
      showToast("error", "กรอกข้อมูลไม่ครบ", "กรุณากรอกชื่อจริง นามสกุล และเบอร์โทรศัพท์");
      return;
    }
    if (!isValidPhone(form.phone)) {
      showToast("error", "เบอร์โทรไม่ถูกต้อง", "รูปแบบเบอร์โทรไม่ถูกต้อง (ตัวอย่าง 098-888-8888)");
      return;
    }
    if (!form.consent) {
      showToast("error", "ต้องยินยอม PDPA ก่อน", "กรุณายินยอมให้เก็บข้อมูลส่วนบุคคลก่อนส่งใบสมัคร");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("firstname", form.firstname);
      fd.append("lastname", form.lastname);
      fd.append("nickname", form.nickname);
      fd.append("phone", form.phone);
      fd.append("line", form.line);
      fd.append("occupation", form.occupation);
      fd.append("consent", form.consent ? "true" : "false");
      if (form.resume) fd.append("resume", form.resume);

      await applyTutor(fd);
      showToast("success", "ส่งใบสมัครเรียบร้อย!", "ทีมงานจะติดต่อกลับหากผ่านการพิจารณาเบื้องต้น");
      setForm(initialForm);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || "เกิดข้อผิดพลาดในการส่งใบสมัคร กรุณาลองใหม่อีกครั้ง";
      showToast("error", "ส่งใบสมัครไม่สำเร็จ", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white pb-16 pt-[110px] text-neutral-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <PublicPageHero
          eyebrow="ร่วมเป็นส่วนหนึ่งของศรเสริมติวเตอร์"
          title="ส่งต่อความรู้"
          highlight="ในแบบของคุณ"
          description="สนใจร่วมสอนกับเรา? ฝากข้อมูลติดต่อและประวัติของคุณไว้ เพื่อให้ทีมงานพิจารณาใบสมัครและติดต่อกลับ"
          icon={GraduationCap}
          action={<a href="#tutor-application" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">กรอกใบสมัคร <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>}
        />

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_310px]">
          <form id="tutor-application" onSubmit={onSubmit} className="min-w-0 rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_16px_48px_-35px_rgba(234,88,12,0.3)] sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 border-b border-neutral-100 pb-7">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><ClipboardList className="h-6 w-6" aria-hidden="true" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">APPLICATION FORM</p>
                <h2 className="mt-1 text-2xl font-bold text-neutral-900 sm:text-3xl">สมัครเป็นติวเตอร์</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">กรอกข้อมูลให้ครบถ้วนเพื่อให้เราติดต่อกลับได้สะดวก</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><UserRound className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="text-lg font-bold text-neutral-900">ข้อมูลส่วนตัว</h3>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass} htmlFor="tutor-firstname">ชื่อจริง <span className="text-orange-600">*</span>
                  <input id="tutor-firstname" name="firstname" autoComplete="given-name" required value={form.firstname} onChange={onChange} placeholder="กรอกชื่อจริง" className={fieldClass} />
                </label>
                <label className={labelClass} htmlFor="tutor-lastname">นามสกุล <span className="text-orange-600">*</span>
                  <input id="tutor-lastname" name="lastname" autoComplete="family-name" required value={form.lastname} onChange={onChange} placeholder="กรอกนามสกุล" className={fieldClass} />
                </label>
                <label className={`${labelClass} sm:col-span-2`} htmlFor="tutor-nickname">ชื่อเล่น <span className="font-normal text-neutral-400">(ถ้ามี)</span>
                  <input id="tutor-nickname" name="nickname" value={form.nickname} onChange={onChange} placeholder="ชื่อที่อยากให้เราเรียก" className={fieldClass} />
                </label>
              </div>
            </div>

            <div className="mt-9 border-t border-neutral-100 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Phone className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="text-lg font-bold text-neutral-900">ช่องทางติดต่อ</h3>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass} htmlFor="tutor-phone">เบอร์โทรศัพท์ <span className="text-orange-600">*</span>
                  <input id="tutor-phone" name="phone" type="tel" autoComplete="tel" inputMode="numeric" required value={form.phone} onChange={onChange} placeholder="098-888-8888" className={fieldClass} />
                </label>
                <label className={labelClass} htmlFor="tutor-line">LINE ID <span className="font-normal text-neutral-400">(ถ้ามี)</span>
                  <input id="tutor-line" name="line" autoComplete="off" value={form.line} onChange={onChange} placeholder="กรอก LINE ID" className={fieldClass} />
                </label>
              </div>
            </div>

            <div className="mt-9 border-t border-neutral-100 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><BriefcaseBusiness className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="text-lg font-bold text-neutral-900">ประสบการณ์และเอกสาร</h3>
              </div>
              <label className={labelClass} htmlFor="tutor-occupation">อาชีพปัจจุบัน <span className="font-normal text-neutral-400">(ถ้ามี)</span>
                <input id="tutor-occupation" name="occupation" value={form.occupation} onChange={onChange} placeholder="เช่น ครู นักศึกษา หรืออาชีพอื่น ๆ" className={fieldClass} />
              </label>
              <label htmlFor="tutor-resume" className="mt-5 block cursor-pointer rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/60 p-5 transition hover:border-orange-400 hover:bg-orange-50 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100 sm:p-6">
                <span className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm"><UploadCloud className="h-6 w-6" aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block font-bold text-neutral-900">แนบประวัติหรือ Resume <span className="font-normal text-neutral-400">(ถ้ามี)</span></span>
                    <span className="mt-1 block text-sm leading-6 text-neutral-500">แตะเพื่อเลือกไฟล์ PDF, DOC หรือ DOCX</span>
                    <span className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                      {form.resume ? <><FileText className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{form.resume.name}</span></> : <><UploadCloud className="h-4 w-4" aria-hidden="true" /> เลือกไฟล์</>}
                    </span>
                  </span>
                </span>
                <input ref={fileInputRef} id="tutor-resume" name="resume" type="file" accept=".pdf,.doc,.docx" onChange={onChange} className="sr-only" />
              </label>
            </div>

            <div className="mt-9 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
              <label htmlFor="tutor-consent" className="flex cursor-pointer items-start gap-3">
                <input id="tutor-consent" name="consent" type="checkbox" required checked={form.consent} onChange={onChange} className="mt-1 h-5 w-5 shrink-0 accent-orange-600" />
                <span className="text-sm leading-7 text-neutral-600">ข้าพเจ้ายินยอมให้บริษัทเก็บ รวบรวม และใช้ข้อมูลส่วนบุคคลที่ให้ไว้ข้างต้น เพื่อพิจารณาใบสมัคร ตามนโยบายความเป็นส่วนตัวของบริษัท</span>
              </label>
            </div>

            <button type="submit" disabled={submitting || !form.consent} className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-base font-bold text-white shadow-[0_12px_24px_-12px_rgba(234,88,12,0.7)] transition hover:from-orange-600 hover:to-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg">
              {submitting ? "กำลังส่งใบสมัคร..." : "ส่งใบสมัครติวเตอร์"} {!submitting && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
            </button>
            <p className="mt-4 text-center text-xs leading-5 text-neutral-500">กรอกข้อมูลที่มีเครื่องหมาย * และยินยอมการใช้ข้อมูลก่อนส่งใบสมัคร</p>
          </form>

          <aside className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-32 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-orange-100 bg-[#fff7ed] p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm"><GraduationCap className="h-6 w-6" aria-hidden="true" /></span>
              <h2 className="mt-5 text-xl font-bold text-neutral-900">เริ่มต้นง่าย ๆ</h2>
              <p className="mt-2 text-sm leading-7 text-neutral-600">เตรียมข้อมูลติดต่อของคุณ แล้วแนบประวัติการสอนหรือ Resume หากมี</p>
              <div className="mt-5 space-y-4 border-t border-orange-200/70 pt-5 text-sm text-neutral-700">
                <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">1</span><span>กรอกข้อมูลและช่องทางติดต่อ</span></div>
                <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">2</span><span>แนบเอกสารประกอบ (ถ้ามี)</span></div>
                <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">3</span><span>ส่งใบสมัครให้ทีมงานพิจารณา</span></div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-neutral-900"><ShieldCheck className="h-5 w-5 text-orange-600" aria-hidden="true" /><h2 className="font-bold">ส่งข้อมูลอย่างมั่นใจ</h2></div>
              <p className="mt-3 text-sm leading-7 text-neutral-600">ข้อมูลที่กรอกจะใช้ประกอบการพิจารณาใบสมัครและการติดต่อกลับจากทีมงาน</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-orange-700"><BadgeCheck className="h-4 w-4" aria-hidden="true" /> ตรวจสอบข้อมูลก่อนกดส่งได้</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
