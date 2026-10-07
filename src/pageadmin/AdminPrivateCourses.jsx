import { API_URL } from "../config";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  UserRoundCheck, Plus, Search, Wallet, UserPlus, Settings2, Pencil, Trash2, Eye, EyeOff,
  BookOpen, Calculator as CalcIcon, CheckCircle2, Layers, Info,
} from "lucide-react";
import SegmentedControl from "../components/ui/SegmentedControl";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import UIErrorState from "../components/ui/ErrorState";
import { BTN, INPUT } from "../components/ui/tokens";
import { STAT_LABEL, STAT_VALUE, STAT_UNIT, STAT_SUB } from "../components/ui/tokens";
import { toast, confirmDialog } from "../components/ui/dialogs";
import { PRIVATE_ICONS, PRIVATE_GRADE_GROUPS, PRIVATE_PRICING, privateIconOf } from "../config/privateCourses";

/* ─────────────────────────────────────────────────────────────────────────
   แอดมิน · คอร์สเดี่ยว (1–2 นักเรียนต่อคลาส) — แท็บ "คอร์สเดี่ยว" ในหน้าจัดการคอร์ส (/admin/courses?type=single)
   แท็บ 1  คอร์สของนักเรียน   : สร้างคอร์สให้นักเรียนหลังพี่กวางประเมินแล้ว → ลงทะเบียน → บันทึกรับเงิน
   แท็บ 2  รายวิชาที่โชว์หน้าเว็บ : สิ่งที่คนทั่วไปเห็นในหน้า /private-courses (ไม่มีปุ่มซื้อ)
   แท็บ 3  คำขอจากนักเรียน : ข้อมูลที่ผู้สนใจฝากไว้เพื่อให้สถาบันติดต่อกลับ
   คอร์สที่สร้างเป็นคอร์สปกติ (Course_Type = single) จัดตารางสอน/เช็กอิน/ข้อสอบ ที่หน้าคอร์สและตารางเรียนได้ตามเดิม
   ───────────────────────────────────────────────────────────────────────── */

const API = `${API_URL}/api/admin`;
const auth = () => {
  const token = localStorage.getItem("student_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};
const money = (v) => `฿${Number(v || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
const personName = (p, prefix = "") =>
  p?.[`${prefix}Nickname`] || [p?.[`${prefix}Firstname`], p?.[`${prefix}Lastname`]].filter(Boolean).join(" ") || "—";
const fullName = (p) => [p?.Nickname && `${p.Nickname} ·`, p?.Firstname, p?.Lastname].filter(Boolean).join(" ");
const todayStr = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
const errMsg = (e, fallback) => e?.response?.data?.message || fallback;
const card = "bg-white rounded-2xl border border-slate-200 shadow-sm";
const labelCls = "mb-1 block text-xs font-semibold text-slate-600";

/* ═════════ หน้า ═════════ */
// onManageCourse(courseId) : เปิดฟอร์มจัดการคอร์สเต็มของหน้าคอร์ส (วิชา/นักเรียน/ตาราง/คลิป)
// version                  : เปลี่ยนเมื่อหน้าคอร์สโหลดข้อมูลใหม่ → แท็บนี้โหลดตาม
// onDataChanged()          : แจ้งหน้าคอร์สว่ามีการสร้าง/ลงทะเบียน/รับเงิน
export default function PrivateCoursesPanel({ onManageCourse, version = 0, onDataChanged }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") === "inquiries" ? "inquiries" : searchParams.get("tab") === "offers" ? "offers" : "courses";
  const [tab, setTab] = useState(requestedTab);
  useEffect(() => { setTab(requestedTab); }, [requestedTab]);
  const changeTab = (next) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    params.set("type", "single");
    params.set("tab", next);
    if (next !== "inquiries") params.delete("inquiry");
    setSearchParams(params, { replace: true });
  };
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState([]);
  const [offers, setOffers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [inquiryError, setInquiryError] = useState("");
  const [lookups, setLookups] = useState({ subjects: [], tutors: [], students: [], years: [], availability: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // { type: 'create'|'payment'|'enroll'|'offer', data }

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, o] = await Promise.all([
        axios.get(`${API}/private-courses`, auth()),
        axios.get(`${API}/private-courses/offers`, auth()),
      ]);
      setCourses(c.data || []);
      setOffers(o.data || []);
      try {
        const response = await axios.get(`${API}/private-courses/inquiries`, auth());
        setInquiries(response.data || []);
        setInquiryError("");
      } catch (inquiryLoadError) {
        setInquiryError(errMsg(inquiryLoadError, "โหลดคำขอคอร์สเดี่ยวไม่สำเร็จ"));
      }
    } catch (e) {
      setError(errMsg(e, "โหลดข้อมูลคอร์สเดี่ยวไม่สำเร็จ"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, version]);
  useEffect(() => {
    // ตัวเลือกในฟอร์ม — ถ้าตัวใดโหลดไม่ได้ ให้หน้ายังใช้งานส่วนอื่นได้
    const get = (url) => axios.get(`${API}${url}`, auth()).then((r) => r.data || []).catch(() => []);
    Promise.all([get("/subjects"), get("/tutors"), get("/students"), get("/year"), get("/course-availability")])
      .then(([subjects, tutors, students, years, availability]) => setLookups({ subjects, tutors, students, years, availability }));
  }, []);

  const stats = useMemo(() => {
    const active = courses.filter((c) => [1, 2].includes(Number(c.Status_Course_Id))).length;
    const outstanding = courses.reduce((sum, course) => sum + (course.Students || []).reduce((studentSum, student) =>
      studentSum + Math.max(0, Number(student.OrderId ? student.TotalAmount : course.FullCost || 0) - Number(student.PaidAmount || 0)), 0), 0);
    return { active, outstanding, shownOffers: offers.filter((o) => o.IsActive).length };
  }, [courses, offers]);

  const close = () => setModal(null);
  const markContacted = async (id) => {
    try {
      await axios.patch(`${API}/private-courses/inquiries/${id}/contacted`, {}, auth());
      setInquiries((current) => current.map((item) => item.InquiryId === id
        ? { ...item, Status: "contacted", ContactedAt: new Date().toISOString() } : item));
      toast("บันทึกว่าติดต่อแล้ว");
    } catch (error) {
      toast(errMsg(error, "บันทึกสถานะไม่สำเร็จ"));
    }
  };
  const done = async (msg) => {
    toast(msg);
    close();
    if (onDataChanged) onDataChanged(); // หน้าคอร์สโหลดใหม่ → version เปลี่ยน → แท็บนี้โหลดตาม
    else await load();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <Stat icon={BookOpen} color="bg-orange-500" label="กำลังเรียน" value={stats.active} unit="คอร์ส" sub={`ทั้งหมด ${courses.length} คอร์ส`} />
        <Stat icon={Layers} color="bg-blue-500" label="วิชาที่แสดงบนเว็บไซต์" value={stats.shownOffers} unit="วิชา" sub={`ซ่อนอยู่ ${offers.length - stats.shownOffers} วิชา`} />
        <Stat icon={Wallet} color="bg-amber-500" label="ยอดค้างชำระ" value={money(stats.outstanding)} sub="รวมทุกคอร์สเดี่ยว" className="col-span-2 md:col-span-1" />
      </div>

      {/* แถวเดียว: สลับแท็บ (ซ้าย) · ค้นหา (กลาง ใช้ได้ทั้งสองแท็บ) · ปุ่มเพิ่ม (ขวา) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SegmentedControl size="sm" stretchMobile value={tab} onChange={changeTab} className="shrink-0" options={[
          { id: "courses", label: "คอร์สของนักเรียน", short: "คอร์สนักเรียน", count: courses.length },
          { id: "offers", label: "รายวิชาบนเว็บไซต์", short: "รายวิชาบนเว็บ", count: offers.length },
          { id: "inquiries", label: "คำขอจากนักเรียน", short: "คำขอ", count: inquiries.filter((item) => item.Status === "pending").length },
        ]} />
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="ค้นหา"
            placeholder={tab === "courses" ? "ค้นหาชื่อนักเรียน ติวเตอร์ หรือวิชา" : tab === "offers" ? "ค้นหาชื่อรายวิชา ระดับชั้น หรือคำอธิบาย" : "ค้นหาชื่อนักเรียน วิชา หรือเบอร์โทร"}
            className={`${INPUT} pl-9`} />
        </div>
        {tab === "courses"
          ? <button type="button" onClick={() => setModal({ type: "create" })} className={`${BTN.base} ${BTN.primary} ${BTN.md} w-full shrink-0 lg:w-auto`}><Plus className="h-4 w-4" />สร้างคอร์สให้นักเรียน</button>
          : tab === "offers" ? <button type="button" onClick={() => setModal({ type: "offer" })} className={`${BTN.base} ${BTN.primary} ${BTN.md} w-full shrink-0 lg:w-auto`}><Plus className="h-4 w-4" />เพิ่มรายวิชา</button> : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : error ? (
        <UIErrorState description={error} onRetry={load} />
      ) : tab === "courses" ? (
        <CoursesTab courses={courses} search={search} onManage={onManageCourse} onCreate={() => setModal({ type: "create" })} onChanged={load}
          onPay={(c) => setModal({ type: "payment", data: c })} onEnroll={(c) => setModal({ type: "enroll", data: c })} />
      ) : tab === "offers" ? (
        <OffersTab offers={offers} search={search} subjects={lookups.subjects} onAdd={() => setModal({ type: "offer" })}
          onEdit={(o) => setModal({ type: "offer", data: o })} onChanged={load} />
      ) : (
        <InquiriesTab inquiries={inquiries} search={search} focusedId={Number(searchParams.get("inquiry"))} error={inquiryError} onRetry={load} onContacted={markContacted}
          onCreateCourse={(item) => setModal({ type: "create", data: item })} />
      )}

      {modal?.type === "create" && <CreateCourseModal offers={offers} lookups={lookups} inquiry={modal.data} onClose={close} onDone={done} />}
      {modal?.type === "payment" && <PaymentModal course={modal.data} onClose={close} onDone={done} />}
      {modal?.type === "enroll" && <EnrollModal course={modal.data} students={lookups.students} onClose={close} onDone={done} />}
      {modal?.type === "offer" && <OfferModal offer={modal.data} subjects={lookups.subjects} onClose={close} onDone={done} />}
    </div>
  );
}

function InquiriesTab({ inquiries, search, focusedId, error, onRetry, onContacted, onCreateCourse }) {
  useEffect(() => {
    if (focusedId && inquiries.some((item) => Number(item.InquiryId) === focusedId)) {
      document.getElementById(`private-inquiry-${focusedId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusedId, inquiries]);
  if (error) return <UIErrorState description={error} onRetry={onRetry} />;
  const query = search.trim().toLowerCase();
  const list = inquiries.filter((item) => !query || [item.SubjectName, item.StudentName, item.StudentNickname, item.SchoolName, item.ContactName, item.ContactPhone, item.GradeLevel, item.GradeOther]
    .some((value) => String(value || "").toLowerCase().includes(query)));
  if (!list.length) return <EmptyState icon={UserRoundCheck} title={query ? "ไม่พบคำขอที่ค้นหา" : "ยังไม่มีคำขอคอร์สเดี่ยว"} />;
  const format = { online: "ออนไลน์", onsite: "ออนไซต์", either: "ได้ทั้งสองแบบ" };
  return <div className="space-y-3">
    {list.map((item) => <article key={item.InquiryId} id={`private-inquiry-${item.InquiryId}`} className={`${card} p-4 sm:p-5 ${Number(item.InquiryId) === focusedId ? "ring-2 ring-orange-400" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-bold text-slate-900">{item.SubjectName} · {item.StudentName}{item.StudentNickname && <span className="font-medium text-slate-500"> ({item.StudentNickname})</span>}</h3><p className="mt-1 text-xs text-slate-500">{item.GradeLevel}{item.GradeOther && `: ${item.GradeOther}`} · {item.LearnerCount || 1} คน · อยากเริ่ม {item.DesiredStartDate} · {format[item.LearningFormat] || item.LearningFormat}</p>{item.SchoolName && <p className="mt-1 text-xs text-slate-500">โรงเรียน {item.SchoolName}</p>}</div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.Status === "pending" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}>{item.Status === "pending" ? "รอติดต่อ" : "ติดต่อแล้ว"}</span>
      </div>
      <p className="mt-3 text-sm text-slate-700"><b>เป้าหมาย:</b> {item.Goal}</p>
      {Number(item.LearnerCount) === 2 && <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">ต้องการเรียนคู่: เลือกนักเรียนทั้งสองบัญชีตอนสร้างคลาส ราคาและยอดชำระจะแยกต่อคน ส่วนตารางเรียนเป็นคลาสเดียวกัน</p>}
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700"><b>สิ่งที่ต้องการ:</b> {item.LearningNeeds}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-sm">
        <span className="text-slate-600">ผู้ติดต่อ {item.ContactName}</span>
        <a href={`tel:${item.ContactPhone}`} className="font-bold text-orange-600 hover:underline">{item.ContactPhone}</a>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={() => onCreateCourse(item)} className={`${BTN.base} ${BTN.secondary} ${BTN.sm}`}><Plus className="h-3.5 w-3.5" />สร้างคอร์สจากคำขอนี้</button>
          {item.Status === "pending" && <button type="button" onClick={() => onContacted(item.InquiryId)} className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white">บันทึกว่าติดต่อแล้ว</button>}
        </div>
      </div>
      <MatchedStudents matches={item.MatchedStudents} phone={item.ContactPhone} />
    </article>)}
  </div>;
}

// บัญชีที่เบอร์ตรงกับเบอร์ผู้ติดต่อ — แค่เสนอให้เลือก ไม่ได้ผูกกับคำขอจริง
const matchVia = { student: "เบอร์นักเรียน", parent: "เบอร์ผู้ปกครอง" };
function MatchedStudents({ matches = [], phone, selected = [], onPick }) {
  if (!matches.length) return <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">ไม่พบบัญชีที่เบอร์ {phone} ตรงกัน — ถ้ายังไม่มีบัญชี ให้สมัครให้ที่หน้านักเรียนก่อนสร้างคอร์ส</p>;
  return <div className="mt-3 rounded-xl bg-emerald-50/70 px-3 py-2">
    <p className="text-xs font-semibold text-emerald-800">บัญชีที่เบอร์ตรงกับคำขอ{onPick ? " (กดเพื่อเลือก)" : ""}</p>
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {matches.map((m) => {
        const picked = selected.map(String).includes(String(m.UserId));
        const label = <>{fullName(m)} <span className="font-normal text-slate-500">· {matchVia[m.via]}</span></>;
        return onPick
          ? <button key={m.UserId} type="button" onClick={() => onPick(m.UserId)} disabled={picked}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${picked ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100"}`}>
              {picked && <CheckCircle2 className="h-3.5 w-3.5" />}{label}</button>
          : <span key={m.UserId} className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700">{label}</span>;
      })}
    </div>
  </div>;
}

function Stat({ icon, color, label, value, unit, sub, className = "" }) {
  const Icon = icon;
  return (
    <div className={`${card} flex items-center gap-3 p-3 sm:gap-4 sm:p-4 ${className}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5 text-white" /></span>
      <div className="min-w-0">
        <p className={STAT_LABEL}>{label}</p>
        <p className={STAT_VALUE}>{value}{unit && <span className={STAT_UNIT}>{unit}</span>}</p>
        {sub && <p className={`truncate ${STAT_SUB}`}>{sub}</p>}
      </div>
    </div>
  );
}

/* ═════════ แท็บ 1 · คอร์สของนักเรียน ═════════ */
function CoursesTab({ courses, search = "", onManage, onCreate, onPay, onEnroll, onChanged }) {
  const list = courses.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [c.CourseName, c.SubjectName, personName(c, "Student"), personName(c, "Tutor"), c.StudentFirstname, c.TutorFirstname,
      ...(c.Students || []).flatMap((student) => [student.Firstname, student.Lastname, student.Nickname])]
      .filter(Boolean).some((t) => String(t).toLowerCase().includes(q));
  });

  if (!courses.length) {
    return (
      <EmptyState icon={UserRoundCheck} title="ยังไม่มีคอร์สเดี่ยว"
        description="สร้างคอร์สหลังประเมินนักเรียนและตกลงราคาแล้ว ระบบจะลงทะเบียนนักเรียนให้ในขั้นตอนเดียวกัน"
        action={<button type="button" onClick={onCreate} className={`${BTN.base} ${BTN.primary} ${BTN.md}`}><Plus className="h-4 w-4" />สร้างคอร์สให้นักเรียน</button>} />
    );
  }

  const Actions = ({ c }) => (
    <div className="flex flex-wrap gap-2">
      {(!c.IsPublished || Number(c.PendingDraftActions) > 0) && <button type="button" onClick={async () => {
        try {
          if (!await confirmDialog(`เผยแพร่คอร์ส "${c.CourseName}" ให้ผู้เรียนและติวเตอร์เห็นตอนนี้?`)) return;
          await axios.post(`${API}/courses/${c.CourseID}/publish`, {}, auth());
          toast('เผยแพร่คอร์สแล้ว');
          onChanged();
        } catch (e) { toast(errMsg(e, 'เผยแพร่คอร์สไม่สำเร็จ')); if (e.response?.data?.applied) onChanged(); }
      }} className={`${BTN.base} ${BTN.primary} ${BTN.sm}`}>เผยแพร่คอร์ส</button>}
      {(c.Students || []).length < Number(c.MaxStudents || 1) &&
        <button type="button" onClick={() => onEnroll(c)} className={`${BTN.base} ${BTN.primary} ${BTN.sm}`}><UserPlus className="h-3.5 w-3.5" />ลงทะเบียนนักเรียน</button>}
      {(c.Students || []).some((student) => Number(student.PaidAmount || 0) < Number(student.OrderId ? student.TotalAmount : c.FullCost || 0)) &&
        <button type="button" onClick={() => onPay(c)} className={`${BTN.base} ${BTN.primary} ${BTN.sm}`}><Wallet className="h-3.5 w-3.5" />บันทึกรับเงิน</button>}
      {onManage && (
        <button type="button" onClick={() => onManage(c.CourseID)} title="วิชา นักเรียน ตารางเรียน คลิป และสถานะคอร์ส" className={`${BTN.base} ${BTN.secondary} ${BTN.sm}`}>
          <Settings2 className="h-3.5 w-3.5" />จัดการคอร์ส
        </button>
      )}
    </div>
  );
  const PayCell = ({ c }) => {
    return (
      <div className="min-w-[190px] space-y-1.5">
        {(c.Students || []).length ? c.Students.map((student) => {
          const total = Number(student.OrderId ? student.TotalAmount : c.FullCost || 0);
          const paid = Number(student.PaidAmount || 0);
          const label = paid >= total && total > 0 ? "ครบ" : paid > 0 ? "บางส่วน" : "ยังไม่ชำระ";
          return <div key={student.EnrollId} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 text-xs">
            <span className="max-w-[80px] truncate font-medium text-slate-700" title={fullName(student)}>{student.Nickname || student.Firstname}</span>
            <span className="tabular-nums text-slate-600">{money(paid)} / {money(total)}</span>
            <span className={paid >= total && total > 0 ? "text-emerald-700" : "text-amber-700"}>{label}</span>
          </div>;
        }) : <Badge tone="neutral">ยังไม่ลงทะเบียน</Badge>}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* จอใหญ่: ตาราง */}
      <div className={`${card} hidden overflow-hidden lg:block`}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">นักเรียน · วิชา</th>
              <th className="px-4 py-3">ติวเตอร์</th>
              <th className="px-4 py-3 text-right">ชั่วโมง</th>
              <th className="px-4 py-3 text-right">ราคาขาย / ค่าติวเตอร์ ต่อชม.</th>
              <th className="px-4 py-3">การชำระ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((c) => (
              <tr key={c.CourseID} className="align-middle hover:bg-orange-50/30">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{(c.Students || []).length ? c.Students.map((student) => student.Nickname || `${student.Firstname} ${student.Lastname}`).join(" + ") : <span className="text-slate-400">ยังไม่มีนักเรียน</span>}</p>
                  <p className="text-[11px] text-orange-600">{(c.Students || []).length}/{c.MaxStudents || 1} คน · {money(c.FullCost)}/คน</p>
                  <p className="text-xs text-slate-500">{c.SubjectName || "—"} · {c.Status_Course_Name || ""} · {c.IsPublished ? Number(c.PendingDraftActions) ? `มีร่าง ${c.PendingDraftActions} รายการ` : 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{personName(c, "Tutor")}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.TotalHours ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className="font-semibold text-slate-800">{money(c.StudentRate)}</span>
                  <span className="text-slate-400"> / {money(c.TutorRate)}</span>
                </td>
                <td className="px-4 py-3"><PayCell c={c} /></td>
                <td className="px-4 py-3"><div className="flex justify-end"><Actions c={c} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="py-8 text-center text-sm text-slate-500">ไม่พบคอร์สที่ตรงกับคำค้นหา</p>}
      </div>

      {/* จอเล็ก: การ์ด */}
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {list.map((c) => (
          <div key={c.CourseID} className={`${card} space-y-3 p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">{(c.Students || []).length ? c.Students.map((student) => student.Nickname || `${student.Firstname} ${student.Lastname}`).join(" + ") : "ยังไม่มีนักเรียน"}</p>
                <p className="text-xs text-orange-600">{(c.Students || []).length}/{c.MaxStudents || 1} คน · {money(c.FullCost)}/คน</p>
                <p className="text-xs text-slate-500">{c.SubjectName || "—"} · ครู{personName(c, "Tutor")} · {c.IsPublished ? Number(c.PendingDraftActions) ? `มีร่าง ${c.PendingDraftActions} รายการ` : 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</p>
              </div>
              <Badge tone="brand">{c.TotalHours ?? "—"} ชม.</Badge>
            </div>
            <p className="text-xs text-slate-500">ราคาขาย <b className="text-slate-800">{money(c.StudentRate)}</b>/ชม. · ค่าติวเตอร์ {money(c.TutorRate)}/ชม.</p>
            <PayCell c={c} />
            <Actions c={c} />
          </div>
        ))}
        {!list.length && <p className="py-8 text-center text-sm text-slate-500 sm:col-span-2">ไม่พบคอร์สที่ตรงกับคำค้นหา</p>}
      </div>
    </div>
  );
}

/* ═════════ แท็บ 2 · รายวิชาที่โชว์หน้าเว็บ ═════════ */
function OffersTab({ offers, search = "", subjects, onAdd, onEdit, onChanged }) {
  const toggle = async (o) => {
    try {
      if (o.IsActive && !o.HasDraft) {
        await axios.post(`${API}/private-courses/offers/${o.OfferId}/unpublish`, {}, auth());
      } else {
        await axios.post(`${API}/private-courses/offers/${o.OfferId}/publish`, {}, auth());
      }
      toast(o.IsActive && !o.HasDraft ? "ซ่อนจากหน้าเว็บแล้ว" : "เผยแพร่บนหน้าเว็บแล้ว");
      onChanged();
    } catch (e) { toast(errMsg(e, "บันทึกไม่สำเร็จ")); }
  };
  const remove = async (o) => {
    if (!(await confirmDialog(`ลบรายวิชา "${o.Title}" ออกจากหน้าเว็บ?\nคอร์สเดี่ยวที่สร้างจากรายวิชานี้แล้วจะไม่ได้รับผลกระทบ`, { tone: "danger", confirmText: "ลบ" }))) return;
    try {
      await axios.delete(`${API}/private-courses/offers/${o.OfferId}`, auth());
      toast("ลบรายวิชาแล้ว");
      onChanged();
    } catch (e) { toast(errMsg(e, "ลบไม่สำเร็จ")); }
  };

  if (!offers.length) {
    return (
      <EmptyState icon={Layers} title="ยังไม่มีรายวิชาที่แสดงบนเว็บไซต์"
        description="หน้าคอร์สเดี่ยวจะแสดงเฉพาะแบนเนอร์และช่องทางติดต่อ จนกว่าจะเพิ่มรายวิชา"
        action={<button type="button" onClick={onAdd} className={`${BTN.base} ${BTN.primary} ${BTN.md}`}><Plus className="h-4 w-4" />เพิ่มรายวิชา</button>} />
    );
  }
  const subjectName = (id) => subjects.find((s) => Number(s.SubjectId) === Number(id))?.SubjectName;
  const q = search.trim().toLowerCase();
  const list = !q ? offers : offers.filter((o) =>
    [o.Title, o.Note, subjectName(o.SubjectId), ...(o.Levels || [])]
      .filter(Boolean).some((t) => String(t).toLowerCase().includes(q)));
  if (!list.length) return <p className={`${card} py-8 text-center text-sm text-slate-500`}>ไม่พบรายวิชาที่ตรงกับคำค้นหา</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((o) => {
        const Icon = privateIconOf(o.IconKey);
        return (
          <div key={o.OfferId} className={`${card} flex flex-col p-4 ${o.IsActive ? "" : "opacity-60"}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{o.Title}</p>
                <p className="truncate text-xs text-slate-500">{o.Note || "—"}</p>
              </div>
              <Badge tone={o.HasDraft || !o.IsActive ? "neutral" : "success"}>{o.HasDraft ? 'มีฉบับร่าง' : o.IsActive ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {o.Levels.map((l) => <Badge key={l} tone="info">{l}</Badge>)}
              {subjectName(o.SubjectId) && <Badge tone="neutral">วิชาในระบบ: {subjectName(o.SubjectId)}</Badge>}
            </div>
            <p className="mt-3 text-xs text-slate-400">ลำดับการแสดง {o.SortOrder}</p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => onEdit(o)} className={`${BTN.base} ${BTN.secondary} ${BTN.sm}`}><Pencil className="h-3.5 w-3.5" />แก้ไข</button>
              <button type="button" onClick={() => toggle(o)} className={`${BTN.base} ${BTN.secondary} ${BTN.sm}`}>
                {o.IsActive && !o.HasDraft ? <><EyeOff className="h-3.5 w-3.5" />ซ่อน</> : <><Eye className="h-3.5 w-3.5" />เผยแพร่</>}
              </button>
              <button type="button" onClick={() => remove(o)} className={`${BTN.base} ${BTN.ghost} ${BTN.sm} text-red-600 hover:bg-red-50`}><Trash2 className="h-3.5 w-3.5" />ลบ</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═════════ Modal · สร้างคอร์สให้นักเรียน ═════════ */
// กล่องค้นหาแบบ autocomplete: พิมพ์แล้วเห็นผลลัพธ์โผล่ทันทีใต้ช่อง ไม่ต้องไปกด select แยก
function Combobox({ label, required, options, value, onChange, idKey, labelOf, placeholder, emptyLabel = "— เลือก —" }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = options.find((o) => String(o[idKey]) === String(value));

  useEffect(() => {
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = options.filter((o) => !q || labelOf(o).toLowerCase().includes(q.toLowerCase())).slice(0, 100);

  const pick = (o) => { onChange(o ? String(o[idKey]) : ""); setQ(""); setOpen(false); };

  return (
    <div ref={wrapRef} className="relative">
      {label && <label className={labelCls}>{label}</label>}
      <input
        value={open ? q : (selected ? labelOf(selected) : "")}
        onChange={(e) => { setQ(e.target.value); setOpen(true); if (value) onChange(""); }}
        onFocus={() => { setQ(""); setOpen(true); }}
        placeholder={placeholder}
        className={INPUT}
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {!required && (
            <button type="button" onClick={() => pick(null)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-orange-50">{emptyLabel}</button>
          )}
          {filtered.length
            ? filtered.map((o) => (
              <button key={o[idKey]} type="button" onClick={() => pick(o)}
                className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-orange-50">
                {labelOf(o) || `#${o[idKey]}`}
              </button>
            ))
            : <p className="px-3 py-2 text-sm text-slate-400">ไม่พบรายการที่ตรงกัน</p>}
        </div>
      )}
    </div>
  );
}

function CreateCourseModal({ offers, lookups, inquiry, onClose, onDone }) {
  const latestYear = lookups.years[lookups.years.length - 1]?.YearId || "";
  const inquiryOffer = inquiry?.OfferId ? offers.find((o) => String(o.OfferId) === String(inquiry.OfferId)) : null;
  const inquiryLearners = Number(inquiry?.LearnerCount) === 2 ? 2 : 1;
  const inquiryMatches = inquiry?.MatchedStudents || [];
  const [f, setF] = useState({
    OfferId: inquiryOffer ? String(inquiryOffer.OfferId) : "", SubjectId: inquiryOffer?.SubjectId ? String(inquiryOffer.SubjectId) : "",
    // เบอร์ตรงแค่บัญชีเดียว → เลือกให้เลย (แอดมินเปลี่ยนได้)
    UserId: inquiryMatches.length === 1 ? String(inquiryMatches[0].UserId) : "", SecondUserId: "", LearnerCount: inquiryLearners, AdminId: "", TotalHours: 10, StudentRatePerHour: PRIVATE_PRICING.find((group) => group.learners === inquiryLearners)?.modes[0].starting || PRIVATE_PRICING[0].modes[0].starting, TutorRatePerHour: 140,
    customPrice: false, Price: "", StartDate: todayStr(), LastDate: addMonths(todayStr(), 3), YearId: latestYear,
    Course_Availability_Id: "", Remark: "", enrollNow: true,
  });
  const [saving, setSaving] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => { if (!f.YearId && latestYear) set("YearId", latestYear); }, [latestYear, f.YearId]);

  const hours = Number(f.TotalHours) || 0;
  const autoPrice = Math.round(hours * (Number(f.StudentRatePerHour) || 0) * 100) / 100;
  const price = f.customPrice ? Number(f.Price) || 0 : autoPrice;
  const tutorCost = Math.round(hours * (Number(f.TutorRatePerHour) || 0) * 100) / 100;
  const margin = price * f.LearnerCount - tutorCost;
  const lossRate = price > 0 && margin < 0;

  const pickOffer = (id) => {
    const o = offers.find((x) => String(x.OfferId) === String(id));
    setF((p) => ({ ...p, OfferId: id, SubjectId: o?.SubjectId ? String(o.SubjectId) : p.SubjectId }));
  };
  const pickTutor = (id) => {
    const t = lookups.tutors.find((x) => String(x.AdminId) === String(id));
    setF((p) => ({ ...p, AdminId: id, TutorRatePerHour: t?.RatePerTutors ? Number(t.RatePerTutors) : p.TutorRatePerHour }));
  };

  const submit = async () => {
    if (!f.UserId) return toast("กรุณาเลือกนักเรียน");
    if (f.LearnerCount === 2 && (!f.SecondUserId || String(f.UserId) === String(f.SecondUserId))) return toast("กรุณาเลือกนักเรียนคนที่สองโดยไม่ซ้ำกับคนแรก");
    setSaving(true);
    try {
      const res = await axios.post(`${API}/private-courses`, {
        OfferId: f.OfferId || null, SubjectId: f.SubjectId, UserIds: [f.UserId, ...(f.LearnerCount === 2 ? [f.SecondUserId] : [])], LearnerCount: f.LearnerCount, EnrollNow: f.enrollNow, AdminId: f.AdminId,
        TotalHours: f.TotalHours, StudentRatePerHour: f.StudentRatePerHour, TutorRatePerHour: f.TutorRatePerHour,
        Price: f.customPrice ? f.Price : undefined, StartDate: f.StartDate, LastDate: f.LastDate, YearId: f.YearId,
        Course_Availability_Id: f.Course_Availability_Id || null, Remark: f.Remark,
      }, auth());
      let msg = `บันทึก "${res.data.CourseName}" เป็นฉบับร่างแล้ว`;
      if (f.enrollNow) msg += ` และลงทะเบียนนักเรียน ${f.LearnerCount} คนแล้ว`;
      await onDone(msg);
    } catch (e) {
      toast(errMsg(e, "สร้างคอร์สเดี่ยวไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="สร้างคอร์สเดี่ยวให้นักเรียน" subtitle={inquiry ? `จากคำขอของ ${inquiry.StudentName || inquiry.ContactName} · ${inquiry.SubjectName}` : "สร้างหลังประเมินนักเรียนและตกลงราคาแล้ว"} icon={UserRoundCheck} size="lg" onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>ยกเลิก</button>
        <button type="button" onClick={submit} disabled={saving || lossRate} className={`${BTN.base} ${BTN.primary} ${BTN.md}`}>{saving ? "กำลังบันทึก…" : "สร้างคอร์ส"}</button>
      </>}>
      <div className="space-y-5">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>สร้างจากรายวิชาบนเว็บไซต์ (ไม่บังคับ)</label>
            <select value={f.OfferId} onChange={(e) => pickOffer(e.target.value)} className={INPUT}>
              <option value="">— ไม่ระบุ —</option>
              {offers.map((o) => <option key={o.OfferId} value={o.OfferId}>{o.Title}</option>)}
            </select>
          </div>
          <div>
            <Combobox required label="วิชา *" options={lookups.subjects} idKey="SubjectId" labelOf={(s) => s.SubjectName}
              value={f.SubjectId} onChange={(v) => set("SubjectId", v)} placeholder="พิมพ์ชื่อวิชาเพื่อค้นหา" />
          </div>
          <div>
            <label className={labelCls}>รูปแบบการเรียน</label>
            <select value={f.Course_Availability_Id} onChange={(e) => set("Course_Availability_Id", e.target.value)} className={INPUT}>
              <option value="">— ไม่ระบุ —</option>
              {lookups.availability.map((a) => <option key={a.Course_Availability_Id} value={a.Course_Availability_Id}>{a.Course_Availability_Name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>จำนวนผู้เรียน *</label>
            <select value={f.LearnerCount} onChange={(e) => {
              const count = Number(e.target.value);
              setSelectedPackage("");
              setF((current) => ({ ...current, LearnerCount: count, SecondUserId: "", enrollNow: count === 2 ? true : current.enrollNow, StudentRatePerHour: PRIVATE_PRICING.find((group) => group.learners === count)?.modes[0].starting || current.StudentRatePerHour, customPrice: false, Price: "" }));
            }} className={INPUT}>
              <option value={1}>เรียน 1 คน</option><option value={2}>เรียน 2 คนในคลาสเดียว</option>
            </select>
          </div>
          {inquiry && <div className="sm:col-span-2 -mb-2"><MatchedStudents matches={inquiryMatches} phone={inquiry.ContactPhone} selected={[f.UserId, f.SecondUserId].filter(Boolean)}
            onPick={(id) => setF((current) => (!current.UserId || current.LearnerCount === 1
              ? { ...current, UserId: String(id) }
              : { ...current, SecondUserId: String(current.UserId) === String(id) ? current.SecondUserId : String(id) }))} /></div>}
          <Combobox required label="นักเรียนคนที่ 1 *" options={lookups.students} idKey="UserId" labelOf={fullName} value={f.UserId} onChange={(v) => setF((current) => ({ ...current, UserId: v, SecondUserId: String(current.SecondUserId) === String(v) ? "" : current.SecondUserId }))} placeholder="พิมพ์ชื่อเพื่อค้นหา" />
          {f.LearnerCount === 2 && <Combobox required label="นักเรียนคนที่ 2 *" options={lookups.students.filter((student) => String(student.UserId) !== String(f.UserId))} idKey="UserId" labelOf={fullName} value={f.SecondUserId} onChange={(v) => set("SecondUserId", v)} placeholder="พิมพ์ชื่อเพื่อค้นหา" />}
          <Combobox required label="ติวเตอร์ *" options={lookups.tutors} idKey="AdminId" labelOf={fullName} value={f.AdminId} onChange={pickTutor} placeholder="พิมพ์ชื่อเพื่อค้นหา" />
        </section>

        <section className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-800"><CalcIcon className="h-4 w-4 text-orange-500" />ราคาที่ตกลง</p>
          <label className={labelCls}>ใช้ราคาแพ็กเกจที่แสดงหน้าเว็บ</label>
          <select value={selectedPackage} onChange={(e) => {
            setSelectedPackage(e.target.value);
            const [learners, modeKey, hours] = e.target.value.split(":");
            const group = PRIVATE_PRICING.find((entry) => entry.learners === Number(learners));
            const mode = group?.modes.find((entry) => entry.key === modeKey);
            const pack = mode?.packages.find((entry) => entry.hours === Number(hours));
            if (pack) setF((current) => ({ ...current, LearnerCount: group.learners, SecondUserId: group.learners === 1 ? "" : current.SecondUserId, enrollNow: group.learners === 2 ? true : current.enrollNow, TotalHours: pack.hours, StudentRatePerHour: Number((pack.price / pack.hours).toFixed(2)), customPrice: true, Price: String(pack.price) }));
          }} className={`${INPUT} mb-3`}>
            <option value="">— เลือกแพ็กเกจ หรือกรอกราคาที่ตกลงเอง —</option>
            {PRIVATE_PRICING.flatMap((group) => group.modes.flatMap((mode) => mode.packages.map((pack) => <option key={`${group.learners}:${mode.key}:${pack.hours}`} value={`${group.learners}:${mode.key}:${pack.hours}`}>{group.label} · {mode.label} · {pack.hours} ชม. · {money(pack.price)}{group.learners === 2 ? "/คน" : ""}</option>)))}
          </select>
          <p className="mb-3 text-xs text-slate-500">ราคาที่กรอกเป็นราคาต่อคน นักเรียนแต่ละคนมียอดชำระของตนเอง ตารางสอนและค่าติวเตอร์นับเป็นคลาสเดียว</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>ชั่วโมงเรียนรวม *</label>
              <input type="number" min="0" step="0.5" value={f.TotalHours} onChange={(e) => set("TotalHours", e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={labelCls}>ราคาขาย / ชม. *</label>
              <input type="number" min="0" value={f.StudentRatePerHour} onChange={(e) => set("StudentRatePerHour", e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={labelCls}>ค่าติวเตอร์ / ชม. *</label>
              <input type="number" min="0" value={f.TutorRatePerHour} onChange={(e) => set("TutorRatePerHour", e.target.value)} className={`${INPUT} ${lossRate ? "border-red-300 ring-2 ring-red-200" : ""}`} />
            </div>
          </div>
          {lossRate && <p className="mt-2 text-xs font-semibold text-red-600">รายรับรวมของคลาสต่ำกว่าค่าติวเตอร์</p>}

          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={f.customPrice} onChange={(e) => setF((p) => ({ ...p, customPrice: e.target.checked, Price: e.target.checked ? String(autoPrice) : "" }))} className="accent-orange-500" />
            กำหนดราคาคอร์สเอง (เช่น เหมาจ่าย)
          </label>
          {f.customPrice && <input type="number" min="0" value={f.Price} onChange={(e) => set("Price", e.target.value)} className={`${INPUT} mt-2 sm:max-w-xs`} placeholder="ราคาคอร์สรวม" />}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-slate-100 bg-white px-2 py-2">
              <p className="text-[11px] text-slate-500">ราคาต่อคน</p>
              <p className="font-bold text-slate-900 tabular-nums">{money(price)}</p>
              {!f.customPrice && <p className="text-[10px] text-slate-400">{hours} ชม. × {money(f.StudentRatePerHour)}</p>}
            </div>
            <div className="rounded-xl border border-slate-100 bg-white px-2 py-2">
              <p className="text-[11px] text-slate-500">ค่าติวเตอร์รวม</p>
              <p className="font-bold text-slate-900 tabular-nums">{money(tutorCost)}</p>
            </div>
            <div className={`rounded-xl border px-2 py-2 ${margin >= 0 ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}>
              <p className="text-[11px] text-slate-500">สถาบันได้ ({f.LearnerCount} คน)</p>
              <p className={`font-bold tabular-nums ${margin >= 0 ? "text-emerald-700" : "text-red-600"}`}>{money(margin)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>วันเริ่มเรียน *</label>
            <input type="date" value={f.StartDate} onChange={(e) => set("StartDate", e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={labelCls}>วันสิ้นสุด *</label>
            <input type="date" value={f.LastDate} onChange={(e) => set("LastDate", e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={labelCls}>ปีการศึกษา *</label>
            <select value={f.YearId} onChange={(e) => set("YearId", e.target.value)} className={INPUT}>
              <option value="">— เลือก —</option>
              {lookups.years.map((y) => <option key={y.YearId} value={y.YearId}>{y.YearName}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>หมายเหตุ</label>
            <textarea rows={2} value={f.Remark} onChange={(e) => set("Remark", e.target.value)} className={`${INPUT} h-auto py-2`} placeholder="เช่น เป้าหมายการเรียน วันเวลาที่สะดวก" />
          </div>
        </section>

        <label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <input type="checkbox" checked={f.enrollNow} disabled={f.LearnerCount === 2} onChange={(e) => set("enrollNow", e.target.checked)} className="mt-0.5 accent-orange-500" />
          <span>ลงทะเบียนนักเรียนเข้าคอร์สทันที<span className="block text-xs text-slate-500">{f.LearnerCount === 2 ? "คอร์สเรียนคู่ลงทะเบียนทั้งสองคนพร้อมกันในคลาสเดียว" : "คอร์สจะแสดงในหน้า 'คอร์สเรียนของฉัน' ของนักเรียน และจัดตารางสอนได้ที่หน้าตารางเรียน"}</span></span>
        </label>
      </div>
    </Modal>
  );
}

/* ═════════ Modal · ลงทะเบียน (ใช้ API ลงทะเบียนเดิม) ═════════ */
function EnrollModal({ course, students, onClose, onDone }) {
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!userId) return toast("กรุณาเลือกนักเรียน");
    setSaving(true);
    try {
      await axios.post(`${API}/enroll`, { UserId: userId, CourseID: course.CourseID }, auth());
      await onDone("ลงทะเบียนนักเรียนแล้ว");
    } catch (e) { toast(errMsg(e, "ลงทะเบียนไม่สำเร็จ")); } finally { setSaving(false); }
  };
  return (
    <Modal title="ลงทะเบียนนักเรียน" subtitle={course.CourseName} icon={UserPlus} onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>ยกเลิก</button>
        <button type="button" onClick={submit} disabled={saving} className={`${BTN.base} ${BTN.primary} ${BTN.md}`}>{saving ? "กำลังบันทึก…" : "ลงทะเบียน"}</button>
      </>}>
      <Combobox required label="นักเรียน" options={students.filter((student) => !(course.Students || []).some((enrolled) => Number(enrolled.UserId) === Number(student.UserId)))} idKey="UserId" labelOf={fullName} value={userId} onChange={setUserId} placeholder="พิมพ์ชื่อเพื่อค้นหา" />
    </Modal>
  );
}

/* ═════════ Modal · บันทึกรับเงิน ═════════ */
function PaymentModal({ course, onClose, onDone }) {
  const [selectedUserId, setSelectedUserId] = useState(String((course.Students || []).find((student) => Number(student.PaidAmount || 0) < Number(student.OrderId ? student.TotalAmount : course.FullCost || 0))?.UserId || ""));
  const selectedStudent = (course.Students || []).find((student) => String(student.UserId) === selectedUserId);
  const total = Number(selectedStudent?.OrderId ? selectedStudent.TotalAmount : course.FullCost || 0);
  const paid = Number(selectedStudent?.PaidAmount || 0);
  const remaining = Math.max(0, total - paid);
  const [f, setF] = useState({ Amount: "", PaidDate: todayStr(), Note: "" });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!selectedUserId) return toast("กรุณาเลือกนักเรียน");
    if (!Number(f.Amount) || Number(f.Amount) > remaining) return toast("กรุณาระบุยอดรับเงินไม่เกินยอดค้างของนักเรียนคนนี้");
    setSaving(true);
    try {
      const res = await axios.post(`${API}/private-courses/${course.CourseID}/payments`, { ...f, UserId: Number(selectedUserId) }, auth());
      await onDone(res.data.message);
    } catch (e) { toast(errMsg(e, "บันทึกรับเงินไม่สำเร็จ")); } finally { setSaving(false); }
  };
  return (
    <Modal title="บันทึกรับเงิน" subtitle={`${course.CourseName} · ${course.SubjectName || ""}`} icon={Wallet} onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>ยกเลิก</button>
        <button type="button" onClick={submit} disabled={saving} className={`${BTN.base} ${BTN.primary} ${BTN.md}`}>{saving ? "กำลังบันทึก…" : "บันทึก"}</button>
      </>}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>นักเรียนที่ชำระ *</label>
          <select value={selectedUserId} onChange={(e) => { setSelectedUserId(e.target.value); setF((current) => ({ ...current, Amount: "" })); }} className={INPUT}>
            <option value="">— เลือกนักเรียน —</option>
            {(course.Students || []).map((student) => <option key={student.UserId} value={student.UserId}>{fullName(student)} · ค้าง {money(Math.max(0, Number(student.OrderId ? student.TotalAmount : course.FullCost || 0) - Number(student.PaidAmount || 0)))}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["ราคาต่อคน", total, "text-slate-900"], ["รับแล้ว", paid, "text-emerald-700"], ["ค้างชำระ", remaining, "text-amber-600"]].map(([l, v, cls]) => (
            <div key={l} className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2">
              <p className="text-[11px] text-slate-500">{l}</p>
              <p className={`font-bold tabular-nums ${cls}`}>{money(v)}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>ยอดที่รับ (บาท)</label>
            <input type="number" min="0" max={remaining} value={f.Amount} onChange={(e) => setF((p) => ({ ...p, Amount: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className={labelCls}>วันที่รับเงิน</label>
            <input type="date" value={f.PaidDate} onChange={(e) => setF((p) => ({ ...p, PaidDate: e.target.value }))} className={INPUT} />
          </div>
        </div>
        <div>
          <label className={labelCls}>หมายเหตุ</label>
          <input value={f.Note} onChange={(e) => setF((p) => ({ ...p, Note: e.target.value }))} className={INPUT} placeholder="เช่น โอนเข้าบัญชีสถาบัน งวดแรก" />
        </div>
        <p className="flex items-start gap-1.5 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />ยอดนี้จะขึ้นในหน้าการเงินและแดชบอร์ดตามวันที่รับเงิน แบ่งบันทึกหลายครั้งได้</p>
      </div>
    </Modal>
  );
}

/* ═════════ Modal · เพิ่ม/แก้รายวิชาที่โชว์ ═════════ */
function OfferModal({ offer, subjects, onClose, onDone }) {
  const [f, setF] = useState(() => ({
    Title: offer?.Title || "", SubjectId: offer?.SubjectId ? String(offer.SubjectId) : "", IconKey: offer?.IconKey || "math",
    Levels: offer?.Levels || [], Note: offer?.Note || "",
    SortOrder: offer?.SortOrder ?? 0, IsActive: false,
  }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleLevel = (l) => set("Levels", f.Levels.includes(l) ? f.Levels.filter((x) => x !== l) : [...f.Levels, l]);
  // ปุ่ม "ทั้งหมด" ของแต่ละกลุ่ม: กดครั้งเดียวเลือก/ยกเลิกทุกชั้นในกลุ่มนั้น ส่วนชั้นแต่ละชั้นยังเลือกแยกได้ตามใจ
  const toggleGroup = (group) => {
    const allSelected = group.grades.every((g) => f.Levels.includes(g));
    set("Levels", allSelected
      ? f.Levels.filter((x) => !group.grades.includes(x))
      : [...new Set([...f.Levels, ...group.grades])]);
  };

  const submit = async () => {
    setSaving(true);
    const body = { ...f, SubjectId: f.SubjectId || null };
    try {
      if (offer) await axios.put(`${API}/private-courses/offers/${offer.OfferId}`, body, auth());
      else await axios.post(`${API}/private-courses/offers`, body, auth());
      await onDone("บันทึกฉบับร่างแล้ว กดเผยแพร่เมื่อพร้อม");
    } catch (e) { toast(errMsg(e, "บันทึกรายวิชาไม่สำเร็จ")); } finally { setSaving(false); }
  };

  return (
    <Modal title={offer ? "แก้ไขรายวิชา" : "เพิ่มรายวิชาบนเว็บไซต์"} subtitle="แสดงในหน้าคอร์สเดี่ยว · ไม่มีปุ่มซื้อ" icon={Layers} size="lg" onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>ยกเลิก</button>
        <button type="button" onClick={submit} disabled={saving} className={`${BTN.base} ${BTN.primary} ${BTN.md}`}>{saving ? "กำลังบันทึก…" : "บันทึก"}</button>
      </>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>ชื่อวิชาที่แสดง *</label>
            <input value={f.Title} onChange={(e) => set("Title", e.target.value)} className={INPUT} placeholder="เช่น คณิตศาสตร์" />
          </div>
          <div>
            <label className={labelCls}>ผูกกับวิชาในระบบ (ใช้ตอนสร้างคอร์ส)</label>
            <select value={f.SubjectId} onChange={(e) => set("SubjectId", e.target.value)} className={INPUT}>
              <option value="">— ไม่ระบุ —</option>
              {subjects.map((s) => <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>คำอธิบายสั้น</label>
          <input value={f.Note} onChange={(e) => set("Note", e.target.value)} className={INPUT} maxLength={255} placeholder="เช่น ปูพื้นฐาน · เพิ่มเกรด · เตรียมสอบ" />
        </div>
        <div>
          <label className={labelCls}>ไอคอน</label>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {Object.entries(PRIVATE_ICONS).map(([key, opt]) => { const { label } = opt; const Icon = opt.Icon; return (
              <button key={key} type="button" title={label} onClick={() => set("IconKey", key)}
                className={`flex h-11 items-center justify-center rounded-xl border transition ${f.IconKey === key ? "border-orange-400 bg-orange-50 text-orange-500 ring-2 ring-orange-200" : "border-slate-200 text-slate-500 hover:border-orange-300"}`}>
                <Icon className="h-5 w-5" />
              </button>
            ); })}
          </div>
        </div>
        <div>
          <label className={labelCls}>ระดับชั้น</label>
          <p className="mb-2 text-[11px] text-slate-500">กดชื่อกลุ่มเพื่อเลือก/ยกเลิกทั้งกลุ่ม หรือกดเลือกทีละชั้นก็ได้ เช่น เปิดสอนเฉพาะ ม.6</p>
          <div className="space-y-2.5">
            {PRIVATE_GRADE_GROUPS.map((group) => {
              const allSelected = group.grades.every((g) => f.Levels.includes(g));
              const someSelected = !allSelected && group.grades.some((g) => f.Levels.includes(g));
              return (
                <div key={group.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                  <button type="button" onClick={() => toggleGroup(group)}
                    className={`mb-2 rounded-full border px-3 py-1 text-xs font-bold transition ${allSelected ? "border-orange-500 bg-orange-500 text-white" : someSelected ? "border-orange-300 bg-orange-50 text-orange-600" : "border-slate-300 bg-white text-slate-600 hover:border-orange-300"}`}>
                    {allSelected && <CheckCircle2 className="mr-1 inline h-3 w-3" />}{group.label} (ทั้งหมด)
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {group.grades.map((l) => (
                      <button key={l} type="button" onClick={() => toggleLevel(l)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${f.Levels.includes(l) ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-orange-300"}`}>
                        {f.Levels.includes(l) && <CheckCircle2 className="mr-1 inline h-3 w-3" />}{l}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="sm:max-w-[200px]">
          <label className={labelCls}>ลำดับการแสดง</label>
          <input type="number" value={f.SortOrder} onChange={(e) => set("SortOrder", e.target.value)} className={INPUT} />
        </div>
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">บันทึกแล้วจะเป็นฉบับร่าง กด “เผยแพร่” จากการ์ดรายวิชาเมื่อตรวจเรียบร้อย</p>
        <p className="flex items-start gap-1.5 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />การ์ดรายวิชาไม่แสดงราคา ผู้ปกครองติดต่อแอดมินเพื่อสอบถามราคา ราคาจริงของนักเรียนแต่ละคนกำหนดตอนสร้างคอร์ส</p>
      </div>
    </Modal>
  );
}
