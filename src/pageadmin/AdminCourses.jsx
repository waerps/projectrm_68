import { API_URL } from "../config";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFileUrl } from "../utils/fileUrl";
import {
  BookOpen, Plus, Search, Trash2, X, Check,
  Calendar, DollarSign, Users, Tag, Filter,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2, ImagePlus,
  ToggleLeft, ToggleRight, Info, AlertTriangle, Sparkles, Copy,
  Pencil, Eye, Youtube, FolderOpen, UploadCloud, Video, PlayCircle, Link as LinkIcon,
  BadgeCheck, Clock, ChevronsUpDown, TrendingUp,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import UIModal from "../components/ui/Modal";
import { confirmDialog, toast } from "../components/ui/dialogs";
import UIPagination from "../components/ui/Pagination";
import { PAGE_TITLE, PAGE_SUBTITLE } from "../components/ui/tokens";
import { AlertTriangle as LuAlertTriangle, BookOpen as LuBookOpen, CheckCircle2 as LuCheckCircle2 } from "lucide-react";
import UIErrorState from "../components/ui/ErrorState";
import { BTN, INPUT, BADGE_BASE, BADGE_TONE, CALLOUT, CALLOUT_ICON } from "../components/ui/tokens";
import { STAT_LABEL, STAT_VALUE, STAT_UNIT } from "../components/ui/tokens";
import Spinner from "../components/ui/Spinner";
import ClearFiltersButton from "../components/ui/ClearFiltersButton";
import SegmentedControl from "../components/ui/SegmentedControl";
import PageHeader from "../components/ui/PageHeader";
import { UsersRound as LuUsersRound, UserRoundCheck as LuUserRoundCheck } from "lucide-react";
import PrivateCoursesPanel from "./AdminPrivateCourses";

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = `${API_URL}/api/admin`;
const ITEMS_PER_PAGE = 12;

// ─── การ์ดเอียงตามเมาส์ + แสงเรือง (ชุดเดียวกับ Dashboard/การเงิน) ─────────────
const tiltMove = (e) => {
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  el.style.setProperty("--gx", `${px * 100}%`);
  el.style.setProperty("--gy", `${py * 100}%`);
  el.style.transform = `perspective(700px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-2px)`;
};
const tiltLeave = (e) => { e.currentTarget.style.transform = ""; };

function StatTile({ label, value, color, icon: Icon, unit }) {
  return (
    <div
      onMouseMove={tiltMove}
      onMouseLeave={tiltLeave}
      className="sa-tilt relative overflow-hidden flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-200 transition"
    >
      <span className="sa-glow" />
      {Icon && <Icon className="absolute -right-3 -top-3 h-14 w-14 text-slate-50 pointer-events-none" />}
      <div className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${color} shrink-0 shadow-sm`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="relative min-w-0">
        <p className={STAT_LABEL}>{label}</p>
        <p className={STAT_VALUE}>{value}{unit && <span className={STAT_UNIT}>{unit}</span>}</p>
      </div>
    </div>
  );
}

const STATUS_MAP = {
  1: { label: "เปิดรับสมัคร", color: "bg-blue-100 text-blue-700 border-blue-200" },
  2: { label: "กำลังสอน", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  3: { label: "ปิดรับสมัคร", color: "bg-amber-100 text-amber-700 border-amber-200" },
  4: { label: "ปิดคอร์ส", color: "bg-slate-100 text-slate-500 border-slate-200" },
};


const formatDate = (d) => {
  if (!d) return "ไม่ระบุ";
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-").map(Number);
  const date = new Date(y, m - 1, day);
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
};

// ★ ใช้กับข้อมูลจำนวนเงินทุกจุด — คั่นหลักพันเสมอ
const formatPrice = (p) =>
  Number(p || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ★ moneyDisplay อยู่ระดับโมดูล (ไม่ผูกกับ CourseForm) เพื่อให้ component แยก เช่น
// InstallmentAmountsEditor เรียกใช้ได้โดยตรง — เดิมเคยประกาศซ้อนใน CourseForm ทำให้ใช้นอก scope ไม่ได้
const moneyDisplay = (v) => (v === "" || v === null || v === undefined ? "" : formatPrice(v));

// ★ แปลงชั่วโมงทศนิยม (เช่น 24.5) เป็นข้อความอ่านง่าย เช่น "24 ชม. 30 นาที"
const formatHoursLabel = (decimalHours) => {
  const total = Number(decimalHours || 0);
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  if (m === 0) return `${h} ชม.`;
  return `${h} ชม. ${m} นาที`;
};

// ★ แก้: เดิมแสดง "เฉลี่ย 17.3 ชม./เดือน" เป็นทศนิยม อ่านแล้วงงว่าคือกี่นาที
// เปลี่ยนไปใช้ formatHoursLabel แปลงเป็น ชม./นาที ที่อ่านง่ายแทน
const formatAvgPerMonth = (hours, monthsSpanned) => {
  if (!hours || !monthsSpanned || monthsSpanned <= 0) return null;
  const avg = Number(hours) / monthsSpanned;
  return `เฉลี่ย ${formatHoursLabel(avg)}/เดือน`;
};

// ★ แก้ (ข้อ 7): แปลง input ที่มี comma กลับเป็นตัวเลขดิบ + กันค่าติดลบ + รองรับทศนิยมสูงสุด 2 ตำแหน่ง
// เดิมตัดจุดทศนิยมทิ้งหมด (\/[^0-9]\/g) ทำให้พิมพ์ "1999.80" ไม่ได้เลย
const sanitizeMoneyInput = (raw) => {
  let cleaned = String(raw).replace(/,/g, "").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
  const [intPart, decPart] = cleaned.split(".");
  return decPart !== undefined ? `${intPart}.${decPart.slice(0, 2)}` : cleaned;
};

const blockNegativeKeys = (e) => {
  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

// ★ กันตั้งราคาขายต่ำกว่าค่าติวเตอร์ (ใช้ตรงกับ backend logic)
const isValidRatePair = (tutorRate, studentRate) => {
  const t = Number(tutorRate || 0);
  const s = Number(studentRate || 0);
  if (t > 0 && s > 0 && s < t) return false;
  return true;
};

// ★ แบ่งยอดผ่อนเท่า ๆ กัน ปัดเศษไปรวมที่งวดสุดท้ายเสมอ ผลรวมตรงราคาสุทธิ 100%
function distributeInstallments(fullCost, count) {
  if (count <= 0) return [];
  const base = Math.floor((fullCost / count) * 100) / 100;
  const amounts = Array(count).fill(base);
  const remainder = Math.round((fullCost - base * count) * 100) / 100;
  amounts[count - 1] = Math.round((amounts[count - 1] + remainder) * 100) / 100;
  return amounts;
}

function calcMonthsSpanned(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const s = new Date(String(startDate).slice(0, 10));
  const e = new Date(String(endDate).slice(0, 10));
  if (isNaN(s) || isNaN(e) || e < s) return 0;
  const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  return Math.max(1, months);
}

const AVATAR_COLORS = [
  "bg-orange-500", "bg-amber-500", "bg-rose-500", "bg-pink-500",
  "bg-fuchsia-500", "bg-violet-500", "bg-indigo-500", "bg-blue-500",
  "bg-cyan-500", "bg-teal-500", "bg-emerald-500", "bg-lime-600",
];
const colorForSeed = (seed) => {
  const s = String(seed ?? "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const initialsOf = (name) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] || "";
  const second = parts.length > 1 ? parts[1][0] : "";
  return (first + second).toUpperCase();
};

function Avatar({ photo, size = "w-6 h-6", name, seed }) {
  if (photo) {
    return <img src={getFileUrl(photo)} className={`${size} rounded-full object-cover shrink-0 bg-slate-100`} />;
  }
  if (name) {
    return (
      <div className={`${size} rounded-full flex items-center justify-center font-bold text-white shrink-0 ${colorForSeed(seed ?? name)}`}>
        <span className="text-[11px] leading-none">{initialsOf(name)}</span>
      </div>
    );
  }
  return <span className={`${size} rounded-full bg-slate-200 shrink-0`} />;
}

// ─── AvatarSelect: dropdown แบบ custom พร้อมรูปโปรไฟล์ (ใช้กับติวเตอร์) ───────
function AvatarSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selected = options.find(o => String(o.id) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-[140px]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-left hover:border-orange-300 transition"
      >
        <Avatar photo={selected?.Photo} />
        <span className={`flex-1 truncate ${selected ? "text-slate-700" : "text-slate-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">ไม่พบข้อมูล</p>
          ) : (
            options.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(String(o.id)); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-orange-50 text-[13px] text-left transition ${String(o.id) === String(value) ? "bg-orange-50" : ""}`}
              >
                <Avatar photo={o.Photo} name={o.label} seed={o.id} />
                <span className="truncate text-slate-700">{o.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal Overlay ────────────────────────────────────────────────────────────
function Modal({ title, icon, onClose, children, wide }) {
  // ใช้ Modal กลางของระบบ (components/ui/Modal) — คงชื่อ/props เดิมไว้ให้จุดที่เรียกใช้ไม่ต้องแก้
  return <UIModal title={title} icon={icon} onClose={onClose} size={wide ? '2xl' : 'xl'}>{children}</UIModal>;
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ course, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl p-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-7 w-7 text-red-600" /></div>
          <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบคอร์ส</h3>
          <p className="text-sm text-slate-500 mt-1">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
          <p className="text-sm font-semibold text-red-800 truncate">{course?.CourseName}</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            onClick={onCancel}
            className={`${BTN.secondary} flex-1 py-2.5 rounded-xl font-bold transition text-sm`}
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition text-sm"
          >
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Duplicate Course Modal (ให้แก้วันที่ก่อนทำสำเนา) ─────────────────────────
function DuplicateCourseModal({ course, onConfirm, onCancel, isSubmitting }) {
  const [startDate, setStartDate] = useState(course.StartDate?.slice(0, 10) || "");
  const [lastDate, setLastDate] = useState(course.LastDate?.slice(0, 10) || "");

  const handleConfirm = () => {
    if (!startDate || !lastDate) return toast("กรุณากรอกวันเริ่มและวันสิ้นสุด");
    if (new Date(startDate) >= new Date(lastDate)) return toast("วันเริ่มสอนต้องมาก่อนวันสิ้นสุด");
    onConfirm({ StartDate: startDate, LastDate: lastDate });
  };

  const inputCls = "w-full px-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none transition";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl p-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 -mx-6 -mt-6 px-6 sticky -top-6 z-10 mb-4 py-4 bg-gradient-to-r from-orange-500 to-amber-500">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Copy className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">ทำสำเนาคอร์ส</h3>
            <p className="text-xs text-white/80 truncate">{course.CourseName}</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className={labelCls}>วันเริ่มสอนใหม่</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>วันสิ้นสุดใหม่</label>
            <input type="date" value={lastDate} onChange={(e) => setLastDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isSubmitting}
            className={`${BTN.secondary} flex-1 py-2.5 rounded-xl font-bold disabled:opacity-50 transition text-sm`}>
            ยกเลิก
          </button>
          <button onClick={handleConfirm} disabled={isSubmitting}
            className={`${BTN.primary} flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold disabled:opacity-50 transition text-sm`}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> ยืนยันทำสำเนา</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Video Player Modal (เล่นคลิปจริง — ใช้ร่วมกันทั้งแอดมินและพรีวิว) ─────────
function getYoutubeEmbedUrl(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : null;
}

function getDriveEmbedUrl(url) {
  const m = url?.match(/\/file\/d\/([^/]+)/) || url?.match(/[?&]id=([^&]+)/);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
}

function VideoPlayerModal({ video, onClose }) {
  const { VideoUrl, VideoType, VideoTitle } = video;

  const renderPlayer = () => {
    if (VideoType === "youtube") {
      const embedUrl = getYoutubeEmbedUrl(VideoUrl);
      if (!embedUrl) return <ErrorState message="ลิงก์ YouTube ไม่ถูกต้อง เล่นไม่ได้" />;
      return (
        <iframe
          src={embedUrl}
          title={VideoTitle}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    if (VideoType === "drive") {
      const embedUrl = getDriveEmbedUrl(VideoUrl);
      if (!embedUrl) return <ErrorState message="ลิงก์ Google Drive ไม่ถูกต้อง เล่นไม่ได้" />;
      return (
        <iframe
          src={embedUrl}
          title={VideoTitle}
          className="w-full h-full"
          allow="autoplay"
          allowFullScreen
        />
      );
    }
    return (
      <video
        src={VideoUrl}
        controls
        autoPlay
        className="w-full h-full bg-black"
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-black rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
          <p className="text-sm font-bold text-white truncate pr-4">{VideoTitle}</p>
          <button aria-label="ปิด" onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition shrink-0 min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="aspect-video w-full">
          {renderPlayer()}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ─── Preview มุมมองนักเรียน (Modal) ───────────────────────────────────────────
function StudentPreviewModal({ course, onClose }) {
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [openIdx, setOpenIdx] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE}/courses/${course.CourseID}/preview-videos`)
      .then(r => { if (active) setVideos(r.data); })
      .finally(() => { if (active) setLoadingVideos(false); });
    return () => { active = false; };
  }, [course.CourseID]);

  const formatThaiDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d)) return null;
    return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(d);
  };

  const dateRange = (() => {
    const s = formatThaiDate(course.StartDate);
    const e = formatThaiDate(course.LastDate);
    if (s && e) return `${s} - ${e}`;
    if (s) return `${s} เป็นต้นไป`;
    return "ไม่ระบุ";
  })();

  const getThumbnail = (v) => {
    if (v.Thumbnail) {
      return /^https?:\/\//.test(v.Thumbnail) ? v.Thumbnail : getFileUrl(v.Thumbnail);
    }
    if (v.VideoType === "youtube") {
      const m = v.VideoUrl?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-50 rounded-t-2xl sm:rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 shrink-0">
              <Eye className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-base font-bold text-white leading-tight">พรีวิวมุมมองนักเรียน</p>
              <p className="text-xs text-white/80 leading-tight">แสดงตัวอย่างเท่านั้น ปุ่มบางส่วนใช้งานไม่ได้จริง</p>
            </div>
          </div>
          <button aria-label="ปิด" onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="grid gap-5 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
                {course.CourseImage ? (
                  <img src={getFileUrl(course.CourseImage)} alt={course.CourseName} className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/10] w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
                    <BookOpen className="h-14 w-14 text-orange-300" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">{course.CourseName}</h2>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Number(course.Is_Promotion) === 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2.5 py-0.5 text-xs font-semibold shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" /> โปรโมชัน
                    </span>
                  )}
                  {course.Term_Name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      <BadgeCheck className="h-3.5 w-3.5 text-orange-500" /> {course.Term_Name}
                    </span>
                  )}
                  {course.Course_Type && (
                    <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-semibold">
                      {course.Course_Type === "bundle" ? "คอร์สรวม" : "คอร์สเดี่ยว"}
                    </span>
                  )}
                  {course.Course_Availability_Name && (
                    <span className="rounded-full bg-purple-50 text-purple-700 px-2.5 py-0.5 text-xs font-semibold">
                      {course.Course_Availability_Name}
                    </span>
                  )}
                  {Number(course.Discount) > 0 && (
                    <span className="rounded-full bg-red-50 text-red-600 px-2.5 py-0.5 text-xs font-semibold">
                      ลด {formatPrice(course.Discount)} บาท
                    </span>
                  )}
                  {course.VideosFree > 0 && (
                    <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-semibold">
                      ฟรี {course.VideosFree} คลิป
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-sm border border-slate-100">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 font-bold">฿</span>
                  <div>
                    <div className="text-[11px] text-slate-500">ค่าเรียน</div>
                    <div className="text-sm font-bold text-slate-900">{formatPrice(course.FullCost || course.Price)} บาท</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-sm border border-slate-100">
                  <Calendar className="h-5 w-5 text-orange-500 shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-500">รอบเรียน</div>
                    <div className="text-sm font-bold text-slate-900">{dateRange}</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled
                title="ปุ่มนี้ใช้งานไม่ได้ในโหมดพรีวิว"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-300 py-3 text-white font-bold cursor-not-allowed shadow-sm"
              >
                ซื้อคอร์สเรียน
                <span className="text-[11px] font-normal bg-white/25 px-2 py-0.5 rounded-full">พรีวิว</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <h3 className="mb-2.5 text-sm font-bold text-slate-800">รายละเอียดคอร์ส</h3>
            <p className="text-sm text-slate-600 whitespace-pre-line">
              {course.Remark?.trim() || "ไม่มีรายละเอียดเพิ่มเติม"}
            </p>
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">คลิปวิดีโอเนื้อหาเพิ่มเติม</h3>
            </div>
            {loadingVideos ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              </div>
            ) : videos.length === 0 ? (
              <div className="px-5 py-4 text-sm text-slate-500">ยังไม่มีคลิปเพิ่มเติม</div>
            ) : (
              videos.map((v, i) => (
                <div key={v.VideoId}>
                  <button aria-label="ย่อ"
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-sm font-medium text-slate-800">{v.VideoTitle}</span>
                    {openIdx === i ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  {openIdx === i && (
                    <div className="px-5 pb-4">
                      <button
                        type="button"
                        onClick={() => setPlayingVideo(v)}
                        className="relative w-full overflow-hidden rounded-xl bg-slate-100 aspect-[16/9] flex items-center justify-center group cursor-pointer"
                      >
                        {getThumbnail(v) ? (
                          <img src={getThumbnail(v)} alt={v.VideoTitle} className="w-full h-full object-cover" />
                        ) : (
                          <PlayCircle className="h-10 w-10 text-slate-300" />
                        )}
                        <div className="absolute inset-0 bg-black/20 lg:bg-black/0 lg:group-hover:bg-black/40 flex items-center justify-center transition">
                          <PlayCircle className="h-12 w-12 text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {playingVideo && <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>
  );
}

function ImageUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setErr("ไฟล์ต้องไม่เกิน 5MB");
    setErr(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await axios.post(`${API_URL}/api/admin/upload/image`, fd);
      onChange(res.data.path);
    } catch {
      setErr("อัปโหลดไม่สำเร็จ");
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        className={`relative flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed cursor-pointer transition
          ${uploading ? "border-orange-300 bg-orange-50" : value ? "border-green-300 bg-green-50" : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50"}`}
      >
        {value && !uploading && (
          <img src={getFileUrl(value)} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-25" onError={() => { }} />
        )}
        <div className="relative z-10 flex flex-col items-center gap-1 text-center">
          {uploading
            ? <><Loader2 className="h-7 w-7 text-orange-500 animate-spin" /><p className="text-xs text-orange-500 font-medium">กำลังอัปโหลด...</p></>
            : value
              ? <><Check className="h-7 w-7 text-green-600" /><p className="text-xs text-green-600 font-medium">อัปโหลดแล้ว</p></>
              : <><ImagePlus className="h-7 w-7 text-slate-400" /><p className="text-xs text-slate-500 font-medium">คลิกหรือลากไฟล์มาวาง</p><p className="text-[11px] text-slate-500">JPG, PNG, WEBP · ไม่เกิน 5MB</p></>
          }
        </div>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      {value && !uploading && (
        <button type="button" onClick={() => onChange("")}
          className="text-xs text-slate-500 hover:text-red-500 transition flex items-center gap-1">
          <X className="h-3.5 w-3.5" /> ลบรูปภาพ
        </button>
      )}
    </div>
  );
}

function HoursInlineEdit({ value, onSave, onCancel }) {
  const initial = Number(value || 0);
  const [hours, setHours] = useState(String(Math.floor(initial)));
  const [minutes, setMinutes] = useState(String(Math.round((initial - Math.floor(initial)) * 60)));
  const [saving, setSaving] = useState(false);

  const handleHoursChange = (e) => {
    const v = e.target.value;
    if (v === "" || (/^\d*$/.test(v) && Number(v) >= 0)) setHours(v);
  };
  const handleMinutesChange = (e) => {
    const v = e.target.value;
    if (v === "" || (/^\d*$/.test(v) && Number(v) >= 0 && Number(v) < 60)) setMinutes(v);
  };

  const save = async () => {
    setSaving(true);
    const decimal = Number(hours || 0) + Number(minutes || 0) / 60;
    await onSave(decimal);
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number" min="0" step="1" value={hours}
        onChange={handleHoursChange} onKeyDown={blockNegativeKeys}
        className="w-14 px-2 py-1 bg-white border border-orange-300 rounded-xl text-xs text-right focus:ring-2 focus:ring-orange-400 outline-none"
        autoFocus
      />
      <span className="text-xs text-slate-500">ชม.</span>
      <input
        type="number" min="0" max="59" step="1" value={minutes}
        onChange={handleMinutesChange} onKeyDown={blockNegativeKeys}
        className="w-14 px-2 py-1 bg-white border border-orange-300 rounded-xl text-xs text-right focus:ring-2 focus:ring-orange-400 outline-none"
      />
      <span className="text-xs text-slate-500">นาที</span>
      <button aria-label="ยืนยัน" onClick={save} disabled={saving} className="p-1 text-green-500 hover:text-green-700 transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
      <button aria-label="ปิด" onClick={onCancel} disabled={saving} className="p-1 text-slate-400 hover:text-red-500 transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ★ แก้ไขราคาต้นทุน/ขาย ต่อวิชาในคอร์ส
function RateInlineEdit({ tutorRate, studentRate, onSave, onCancel }) {
  const [t, setT] = useState(String(tutorRate || ""));
  const [st, setSt] = useState(String(studentRate || ""));
  const [saving, setSaving] = useState(false);
  const invalid = Number(t || 0) > 0 && Number(st || 0) > 0 && Number(st) < Number(t);

  const originalTutor = String(tutorRate || "");
  const originalStudent = String(studentRate || "");

  const save = async () => {
    setSaving(true);
    const tutorChanged = t !== originalTutor;
    const studentChanged = st !== originalStudent;
    const ok = await onSave(
      tutorChanged ? t : undefined,
      studentChanged ? st : undefined
    );
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <input type="number" min="0" value={t} onChange={e => setT(e.target.value)}
          onFocus={e => e.target.select()}
          placeholder="เรทปัจจุบัน" className="w-20 px-1.5 py-1 bg-white border border-orange-300 rounded-xl text-xs text-right outline-none" autoFocus />
        <span className="text-[11px] text-slate-500">/ชม.</span>
        <input type="number" min="0" value={st} onChange={e => setSt(e.target.value)}
          onFocus={e => e.target.select()}
          placeholder="ใหม่" className="w-20 px-1.5 py-1 bg-white border border-orange-300 rounded-xl text-xs text-right outline-none" />
        <span className="text-[11px] text-slate-500">/ชม.</span>
        <button aria-label="ยืนยัน" onClick={save} disabled={saving || invalid} className="p-1 text-green-500 hover:text-green-700 disabled:opacity-30 min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button aria-label="ปิด" onClick={onCancel} disabled={saving} className="p-1 text-slate-400 hover:text-red-500 min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* ★ แก้ (ข้อ 1): ระบุชัดว่าเป็นค่าสอนของติวเตอร์ที่ลดลง ไม่ใช้คำว่า "ขาดทุน" เฉย ๆ */}
      {invalid && (
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5" /> เรทใหม่ต่ำกว่าเรทปัจจุบัน ติวเตอร์จะได้รับค่าสอนลดลงเหลือ {Number(st).toFixed(0)} บาท/ชม.
        </p>
      )}
    </div>
  );
}

function CourseSubjects({ courseId, showToast, onTotalCostChange, onTotalRevenueChange, onTotalHoursChange, onSubjectCountChange, totalCourseHours, monthsSpanned }) {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ SubjectId: "", AdminId: "", TotalHours: "", TutorRatePerHourOverride: "", StudentRatePerHourOverride: "" });
  const [editingId, setEditingId] = useState(null);
  const [editingRateId, setEditingRateId] = useState(null);
  const [manualIds, setManualIds] = useState(new Set());
  const [applyingAll, setApplyingAll] = useState(false);

  const fetchSubjects = async () => {
    const res = await axios.get(`${API_BASE}/courses/${courseId}/subjects`);
    setSubjects(res.data);
  };

  useEffect(() => {
    fetchSubjects();
    Promise.all([
      axios.get(`${API_BASE}/subjects`),
      axios.get(`${API_BASE}/tutors`),
    ]).then(([sRes, tRes]) => {
      setAllSubjects(sRes.data);
      setAllTutors(tRes.data);
    });
  }, [courseId]);

  useEffect(() => {
    if (!onTotalCostChange) return;
    const totalCost = subjects.reduce((sum, s) => {
      const rate = Number(
        s.StudentRatePerHourOverride || s.TutorRatePerHourOverride || s.RatePerTutors || 0
      );
      return sum + Number(s.TotalHours || 0) * rate;
    }, 0);
    onTotalCostChange(totalCost);
  }, [subjects, onTotalCostChange]);

  useEffect(() => {
    if (!onTotalHoursChange) return;
    const totalHours = subjects.reduce((sum, s) => sum + Number(s.TotalHours || 0), 0);
    onTotalHoursChange(totalHours);
  }, [subjects, onTotalHoursChange]);

  useEffect(() => {
    if (!onSubjectCountChange) return;
    onSubjectCountChange(subjects.length);
  }, [subjects, onSubjectCountChange]);

  const nonManualSubjects = subjects.filter(s => !manualIds.has(s.TutorCourseDetailId));
  const manualHoursSum = subjects
    .filter(s => manualIds.has(s.TutorCourseDetailId))
    .reduce((sum, s) => sum + Number(s.TotalHours || 0), 0);
  const remainingForSuggestion = Number(totalCourseHours || 0) - manualHoursSum;
  const suggestedPerSubject = totalCourseHours && nonManualSubjects.length > 0
    ? remainingForSuggestion / nonManualSubjects.length
    : null;
  const hasSuggestion = suggestedPerSubject !== null && nonManualSubjects.length > 0 &&
    nonManualSubjects.some(s => Number(s.TotalHours || 0).toFixed(2) !== Number(suggestedPerSubject).toFixed(2));

  const applySuggestedToAll = async () => {
    if (suggestedPerSubject === null) return;
    setApplyingAll(true);
    try {
      await Promise.allSettled(
        nonManualSubjects.map(s =>
          axios.put(`${API_BASE}/tutorcoursedetails/${s.TutorCourseDetailId}`, { TotalHours: suggestedPerSubject })
        )
      );
      fetchSubjects();
      showToast("success", `ใช้ค่าที่แนะนำ (${suggestedPerSubject.toFixed(1)} ชม./วิชา) กับ ${nonManualSubjects.length} วิชาแล้ว`);
    } catch (e) {
      showToast("error", "ใช้ค่าที่แนะนำไม่สำเร็จ");
    } finally {
      setApplyingAll(false);
    }
  };

  const handleAdd = async () => {
    if (!newRow.SubjectId || !newRow.AdminId) {
      return showToast("error", "กรุณาเลือกวิชาและติวเตอร์");
    }
    if (!isValidRatePair(newRow.TutorRatePerHourOverride, newRow.StudentRatePerHourOverride)) {
      return showToast("error", "ราคาขายต่อชั่วโมงต้องไม่น้อยกว่าค่าติวเตอร์ต่อชั่วโมง (จะขาดทุน)");
    }
    try {
      const payload = { ...newRow };
      const willBeManual = newRow.TotalHours !== "" && newRow.TotalHours !== null;
      if (!willBeManual && totalCourseHours) {
        const futureNonManualCount = nonManualSubjects.length + 1;
        const suggestion = (Number(totalCourseHours) - manualHoursSum) / futureNonManualCount;
        payload.TotalHours = suggestion > 0 ? suggestion : 0;
      }
      const res = await axios.post(`${API_BASE}/courses/${courseId}/subjects`, payload);
      setNewRow({ SubjectId: "", AdminId: "", TotalHours: "", TutorRatePerHourOverride: "", StudentRatePerHourOverride: "" });
      setAdding(false);
      fetchSubjects();
    } catch (e) {
      showToast("error", e.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleUpdateHours = async (tutorCourseDetailId, hours) => {
    try {
      await axios.put(`${API_BASE}/tutorcoursedetails/${tutorCourseDetailId}`, { TotalHours: hours });
      setEditingId(null);
      setManualIds(prev => new Set(prev).add(tutorCourseDetailId));
      fetchSubjects();
    } catch (e) {
      showToast("error", e.response?.data?.message || "แก้ไขชั่วโมงไม่สำเร็จ");
    }
  };

  const handleUpdateRates = async (tutorCourseDetailId, tutorRate, studentRate) => {
    const current = subjects.find(s => s.TutorCourseDetailId === tutorCourseDetailId);
    const effectiveTutor = tutorRate !== undefined ? tutorRate : current?.TutorRatePerHourOverride;
    const effectiveStudent = studentRate !== undefined ? studentRate : current?.StudentRatePerHourOverride;

    if (!isValidRatePair(effectiveTutor, effectiveStudent)) {
      showToast("error", "ราคาขายต่อชั่วโมงต้องไม่น้อยกว่าค่าติวเตอร์ต่อชั่วโมง (จะขาดทุน)");
      return false;
    }

    const payload = {};
    if (tutorRate !== undefined) payload.TutorRatePerHourOverride = tutorRate || null;
    if (studentRate !== undefined) payload.StudentRatePerHourOverride = studentRate || null;

    if (Object.keys(payload).length === 0) {
      return true;
    }

    try {
      await axios.put(`${API_BASE}/tutorcoursedetails/${tutorCourseDetailId}`, payload);
      setEditingRateId(null);
      fetchSubjects();
      return true;
    } catch (e) {
      showToast("error", e.response?.data?.message || "แก้ไขราคาไม่สำเร็จ");
      return false;
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/tutorcoursedetails/${id}`);
      setManualIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      fetchSubjects();
    } catch (e) { showToast("error", e.response?.data?.message || "ลบไม่สำเร็จ"); }
  };

  const inp = "px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-orange-400 outline-none transition";

  // ★ options สำหรับ AvatarSelect (ข้อ 4) — ใช้ฟิลด์ Photo จาก admin table
  const tutorOptions = allTutors.map(t => ({
    id: t.AdminId,
    label: t.Nickname || `${t.Firstname} ${t.Lastname}`,
    Photo: t.Photo,
  }));

  return (
    <div className="border border-slate-200 rounded-xl overflow-visible">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 rounded-t-xl">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">วิชาในคอร์สนี้</p>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition">
            <Plus className="h-3.5 w-3.5" /> เพิ่มวิชา
          </button>
        )}
      </div>

      {/* ★ แก้ (ข้อ 6): ย่อข้อความแนะนำแบ่งชั่วโมงให้สั้นแต่ยังสื่อความ */}
      {hasSuggestion && (
        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
          <p className="text-[11px] text-blue-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            แบ่งชั่วโมงที่เหลือ ({formatHoursLabel(remainingForSuggestion)}) เท่า ๆ กันอัตโนมัติ —
            วิชาละ <span className="font-bold">{formatHoursLabel(suggestedPerSubject)}</span>
          </p>
          <button onClick={applySuggestedToAll} disabled={applyingAll}
            className={`${BTN.primary} shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold disabled:opacity-50 transition flex items-center gap-1`}>
            {applyingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} ใช้ค่าที่แนะนำทั้งหมด
          </button>
        </div>
      )}

      {subjects.length === 0 && !adding && (
        <p className="text-xs text-slate-500 text-center py-6">ยังไม่มีวิชาในคอร์สนี้</p>
      )}

      {subjects.map((s) => {
        const avgPerMonthLabel = formatAvgPerMonth(s.TotalHours, monthsSpanned);
        const isManual = manualIds.has(s.TutorCourseDetailId);
        return (
          <div key={s.TutorCourseDetailId} className="border-b border-slate-100 last:border-0 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2">
                {/* ★ เพิ่ม (ข้อ 4): รูปโปรไฟล์ติวเตอร์คู่กับชื่อ */}
                <Avatar photo={s.Photo} size="w-8 h-8" name={s.Nickname || `${s.Firstname} ${s.Lastname}`} seed={s.AdminId} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{s.SubjectName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.Nickname || `${s.Firstname} ${s.Lastname}`}</p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {/* ทางลัดดูพัฒนาการของวิชานี้ในคอร์สนี้ — อ่านอย่างเดียว */}
                <button type="button"
                  onClick={() => navigate(`/admin/progress?courseId=${courseId}&subjectId=${s.SubjectId}&from=courses`)}
                  className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center"
                  title="ดูภาพรวมพัฒนาการของวิชานี้">
                  <TrendingUp className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(s.TutorCourseDetailId)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center" title="ลบ">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {editingRateId === s.TutorCourseDetailId ? (
                <RateInlineEdit
                  tutorRate={s.TutorRatePerHourOverride}
                  studentRate={s.StudentRatePerHourOverride}
                  onSave={(t, st) => handleUpdateRates(s.TutorCourseDetailId, t, st)}
                  onCancel={() => setEditingRateId(null)}
                />
              ) : (
                <button type="button" onClick={() => setEditingRateId(s.TutorCourseDetailId)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 hover:border-orange-300 hover:text-orange-600 transition">
                  เรทปัจจุบัน {s.TutorRatePerHourOverride || s.RatePerTutors || "-"}/ชม. · ใหม่ {s.StudentRatePerHourOverride || "-"}/ชม.
                  <Pencil className="h-3 w-3" />
                </button>
              )}

              <div className="shrink-0 ml-auto">
                {editingId === s.TutorCourseDetailId ? (
                  <HoursInlineEdit
                    value={s.TotalHours}
                    onSave={(hours) => handleUpdateHours(s.TutorCourseDetailId, hours)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">
                        {formatHoursLabel(s.TotalHours)} {!isManual && totalCourseHours ? <span className="text-blue-400">(ค่าเริ่มต้น)</span> : null}
                      </span>
                      {avgPerMonthLabel && <span className="text-[11px] text-slate-500 block">{avgPerMonthLabel}</span>}
                    </div>
                    <button onClick={() => setEditingId(s.TutorCourseDetailId)}
                      className="p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center" title="แก้ไขชั่วโมง">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {adding && (
        <div className="px-4 py-3 bg-orange-50 border-t border-orange-100 space-y-2 rounded-b-xl">
          <div className="flex flex-wrap items-center gap-2">
            <select value={newRow.SubjectId} onChange={e => setNewRow(r => ({ ...r, SubjectId: e.target.value }))}
              className={inp + " flex-1"}>
              <option value="">เลือกวิชา</option>
              {allSubjects.map(s => <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>)}
            </select>
            {/* ★ แก้ (ข้อ 4): ใช้ AvatarSelect แทน select ธรรมดา เพื่อโชว์รูปติวเตอร์ */}
            <AvatarSelect
              options={tutorOptions}
              value={newRow.AdminId}
              placeholder="เลือกติวเตอร์"
              onChange={(adminId) => {
                const tutor = allTutors.find(t => String(t.AdminId) === adminId);
                setNewRow(r => ({
                  ...r,
                  AdminId: adminId,
                  TutorRatePerHourOverride: r.TutorRatePerHourOverride || (tutor?.RatePerTutors ?? ""),
                }));
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number" min="0" step="1" placeholder="ชม. (เว้นว่าง = ให้ระบบแนะนำ)" value={newRow.TotalHours}
              onKeyDown={blockNegativeKeys}
              onChange={e => {
                const v = e.target.value;
                if (v === "" || (/^\d*$/.test(v) && Number(v) >= 0)) setNewRow(r => ({ ...r, TotalHours: v }));
              }}
              className={inp + " w-44"} />
            <input
              type="number" min="0" placeholder="เรทปัจจุบัน/ชม."
              value={newRow.TutorRatePerHourOverride}
              onKeyDown={blockNegativeKeys}
              onChange={e => setNewRow(r => ({ ...r, TutorRatePerHourOverride: e.target.value }))}
              className={inp + " w-28"} />
            <input
              type="number" min="0" placeholder="ใหม่/ชม."
              value={newRow.StudentRatePerHourOverride}
              onKeyDown={blockNegativeKeys}
              onChange={e => setNewRow(r => ({ ...r, StudentRatePerHourOverride: e.target.value }))}
              className={inp + " w-28"} />
            <button aria-label="ยืนยัน" onClick={handleAdd}
              className={`${BTN.primary} px-3 py-2 rounded-xl text-xs font-bold transition`}>
              <Check className="h-3.5 w-3.5" />
            </button>
            <button aria-label="ปิด" onClick={() => setAdding(false)}
              className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-300 transition">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {totalCourseHours > 0 && newRow.TotalHours === "" && (
            <p className="text-[11px] text-blue-500 flex items-center gap-1">
              <Info className="h-3 w-3" /> เว้นว่างไว้ ระบบจะแบ่งชั่วโมงที่เหลือให้เท่า ๆ กันโดยอัตโนมัติ (แก้ไขภายหลังได้เสมอ)
            </p>
          )}
          {!isValidRatePair(newRow.TutorRatePerHourOverride, newRow.StudentRatePerHourOverride) && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> ราคาขายต่ำกว่าค่าติวเตอร์ — จะขาดทุน{" "}
              {(Number(newRow.TutorRatePerHourOverride || 0) - Number(newRow.StudentRatePerHourOverride || 0)).toFixed(0)} บาท/ชม.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CourseStudents({ courseId, courseStatusId, showToast, onCountChange }) {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [adding, setAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const canAddStudents = [1, 2].includes(Number(courseStatusId));

  const fetchStudents = async () => {
    const res = await axios.get(`${API_BASE}/courses/${courseId}/students`);
    setStudents(res.data);
  };

  useEffect(() => {
    fetchStudents();
    axios.get(`${API_BASE}/students`).then(r => setAllStudents(r.data));
  }, [courseId]);

  useEffect(() => {
    if (onCountChange) onCountChange(students.length);
  }, [students, onCountChange]);

  const enrolledIds = new Set(students.map(s => String(s.UserId)));
  const available = allStudents.filter(s => !enrolledIds.has(String(s.UserId)));
  const filtered = available.filter(s => {
    const name = (s.Nickname || `${s.Firstname} ${s.Lastname}`).toLowerCase();
    return !search || name.includes(search.toLowerCase()) || String(s.UserId).includes(search);
  });

  const toggle = (id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(s => String(s.UserId)));

  const handleAdd = async () => {
    if (!selectedIds.length) return showToast("error", "กรุณาเลือกนักเรียนอย่างน้อย 1 คน");
    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/enroll/bulk`, { UserIds: selectedIds, CourseID: courseId });
      const { success = [], skipped = [], failed = [] } = res.data;
      let msg = `เพิ่มสำเร็จ ${success.length} คน`;
      if (skipped.length) msg += ` · ข้าม ${skipped.length} คน (ลงทะเบียนแล้ว)`;
      if (failed.length) msg += ` · ล้มเหลว ${failed.length} คน`;
      showToast(failed.length && !success.length ? "error" : "success", msg, failed[0]?.message);
      setSelectedIds([]); setAdding(false); setSearch("");
      fetchStudents();
    } catch (e) {
      showToast("error", e.response?.data?.message || "เกิดข้อผิดพลาด", e.response?.data?.error);
    } finally {
      setSaving(false);
    }
  };

  const inp = "px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none transition";

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">นักเรียนในคอร์สนี้ ({students.length})</p>
        {!adding && canAddStudents && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition">
            <Plus className="h-3.5 w-3.5" /> เพิ่มนักเรียน
          </button>
        )}
      </div>

      {!canAddStudents && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            คอร์สนี้ปิดรับสมัคร/ปิดคอร์สแล้ว จึงไม่สามารถเพิ่มนักเรียนใหม่ได้ (นำนักเรียนออกได้ตามปกติ)
          </p>
        </div>
      )}

      {students.length === 0 && !adding && (
        <p className="text-xs text-slate-500 text-center py-6">ยังไม่มีนักเรียนในคอร์สนี้</p>
      )}

      {students.map(s => (
        <div key={s.EnrollId} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0">
          {/* ★ เพิ่ม (ข้อ 4): รูปโปรไฟล์นักเรียน */}
          <Avatar photo={s.Photo} size="w-7 h-7" name={s.Nickname || `${s.Firstname} ${s.Lastname}`} seed={s.UserId} />
          <span className="flex-1 text-sm font-semibold text-slate-800">
            {s.Nickname || `${s.Firstname} ${s.Lastname}`}
          </span>
          <button
            onClick={async () => {
              try {
                await axios.delete(`${API_BASE}/enroll/${s.EnrollId}`);
                showToast("success", "นำนักเรียนออกจากคอร์สแล้ว");
                fetchStudents();
              } catch (e) {
                showToast("error", e.response?.data?.message || "ลบไม่สำเร็จ");
              }
            }}
            className="p-1.5 lg:p-0 text-red-400 hover:text-red-600 transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center"
            title="นำออกจากคอร์ส"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {adding && (
        <div className="bg-orange-50 border-t border-orange-100">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <input type="text" placeholder="ค้นหานักเรียน..." value={search}
              onChange={e => setSearch(e.target.value)} className={inp + " flex-1"} />
            <button onClick={toggleAll} className="text-[11px] font-bold text-orange-600 hover:text-orange-700 whitespace-nowrap">
              {selectedIds.length === filtered.length && filtered.length > 0 ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto px-4 space-y-1 pb-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">ไม่พบนักเรียนที่สามารถเพิ่มได้</p>
            ) : filtered.map(s => {
              const id = String(s.UserId);
              const checked = selectedIds.includes(id);
              return (
                <label key={id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm transition ${checked ? "bg-orange-100" : "hover:bg-white"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="accent-orange-500" />
                  {/* ★ เพิ่ม (ข้อ 4): รูปโปรไฟล์นักเรียนในรายการให้เลือก */}
                  <Avatar photo={s.Photo} name={s.Nickname || `${s.Firstname} ${s.Lastname}`} seed={s.UserId} />
                  <span className="flex-1 font-medium text-slate-700">{s.Nickname || `${s.Firstname} ${s.Lastname}`}</span>
                </label>
              );
            })}
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-orange-100">
            <span className="text-xs text-slate-500 flex-1">เลือกแล้ว {selectedIds.length} คน</span>
            <button onClick={handleAdd} disabled={saving || !selectedIds.length}
              className={`${BTN.primary} px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition flex items-center gap-1.5`}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} เพิ่ม
            </button>
            <button aria-label="ปิด" onClick={() => { setAdding(false); setSelectedIds([]); setSearch(""); }}
              className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-300 transition">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── คลิปตัวอย่าง (จัดการโดยแอดมิน ระดับคอร์ส) ────────────────────────────────
function CoursePreviewVideos({ courseId, showToast }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const fileInputRef = useRef(null);

  const emptyForm = { title: "", mode: "youtube", url: "", duration: "", thumbnail: "" };
  const [form, setForm] = useState(emptyForm);
  const adminId = (() => {
    try { return JSON.parse(localStorage.getItem("user"))?.id; } catch { return null; }
  })();

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${API_BASE}/courses/${courseId}/preview-videos`);
      setVideos(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchVideos(); }, [courseId]);

  const getThumbnail = (url, type) => {
    if (type === "youtube") {
      const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
    }
    return null;
  };

  const validateUrl = (url, mode) => {
    if (mode === "youtube") return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
    if (mode === "drive") return /drive\.google\.com/.test(url);
    return true;
  };

  const handleUploadFile = async (file) => {
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) return showToast("error", "ไฟล์วิดีโอต้องไม่เกิน 200MB");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("video", file);
      const res = await axios.post(`${API_BASE}/upload/video`, fd);
      setForm(f => ({ ...f, url: res.data.path, mode: "upload" }));
      if (!form.title) setForm(f => ({ ...f, title: file.name.replace(/\.[^/.]+$/, "") }));
    } catch {
      showToast("error", "อัปโหลดวิดีโอไม่สำเร็จ");
    } finally { setUploading(false); }
  };

  const resetForm = () => { setForm(emptyForm); setAdding(false); setEditingId(null); };

  const handleSave = async () => {
    if (!form.title.trim()) return showToast("error", "กรุณาระบุชื่อคลิป");
    if (!form.url) return showToast("error", "กรุณาใส่ลิงก์หรืออัปโหลดไฟล์วิดีโอ");
    if (form.mode !== "upload" && !validateUrl(form.url, form.mode)) {
      return showToast("error", form.mode === "youtube" ? "ลิงก์ YouTube ไม่ถูกต้อง" : "ลิงก์ Google Drive ไม่ถูกต้อง");
    }
    setSaving(true);
    try {
      const payload = {
        VideoTitle: form.title.trim(),
        VideoUrl: form.url,
        VideoType: form.mode,
        Thumbnail: form.thumbnail || null,
        Duration: form.duration || null,
        AdminId: adminId,
      };
      if (editingId) {
        await axios.put(`${API_BASE}/preview-videos/${editingId}`, payload);
        showToast("success", "แก้ไขคลิปตัวอย่างสำเร็จ");
      } else {
        await axios.post(`${API_BASE}/courses/${courseId}/preview-videos`, payload);
        showToast("success", "เพิ่มคลิปตัวอย่างสำเร็จ");
      }
      resetForm();
      fetchVideos();
    } catch (e) {
      showToast("error", e.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!await confirmDialog("ต้องการลบคลิปตัวอย่างนี้?")) return;
    try {
      await axios.delete(`${API_BASE}/preview-videos/${id}`);
      fetchVideos();
    } catch (e) { showToast("error", e.response?.data?.message || "ลบไม่สำเร็จ"); }
  };

  const startEdit = (v) => {
    setEditingId(v.VideoId);
    setForm({
      title: v.VideoTitle,
      mode: v.VideoType || "youtube",
      url: v.VideoUrl,
      duration: v.Duration || "",
      thumbnail: v.Thumbnail || "",
    });
    setAdding(true);
  };

  const inp = "w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none";

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
          คลิปตัวอย่าง (นับอัตโนมัติ: {videos.length} คลิป)
        </p>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition">
            <Plus className="h-3.5 w-3.5" /> เพิ่มคลิปตัวอย่าง
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-orange-500" /></div>
      ) : videos.length === 0 && !adding ? (
        <p className="text-xs text-slate-500 text-center py-6">ยังไม่มีคลิปตัวอย่าง</p>
      ) : (
        videos.map(v => (
          <div key={v.VideoId} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0">
            <button
              type="button"
              onClick={() => setPlayingVideo(v)}
              className="relative w-14 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 group cursor-pointer"
              title="เล่นวิดีโอ"
            >
              {getThumbnail(v) ? (
                <img src={getThumbnail(v)} className="w-full h-full object-cover" />
              ) : (
                <PlayCircle className="h-5 w-5 text-slate-300" />
              )}
              <div className="absolute inset-0 bg-black/20 lg:bg-black/0 lg:group-hover:bg-black/40 flex items-center justify-center transition">
                <PlayCircle className="h-5 w-5 text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition" />
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{v.VideoTitle}</p>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full mt-0.5
                ${v.VideoType === "youtube" ? "bg-red-50 text-red-500" : v.VideoType === "drive" ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"}`}>
                {v.VideoType === "youtube" ? <><Youtube className="h-3 w-3" /> YouTube</> : v.VideoType === "drive" ? <><FolderOpen className="h-3 w-3" /> Drive</> : <><Video className="h-3 w-3" /> ไฟล์อัปโหลด</>}
              </span>
            </div>
            <button onClick={() => startEdit(v)} className="p-1.5 lg:p-0 text-slate-300 hover:text-orange-500 transition shrink-0 min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center" title="แก้ไข">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => handleDelete(v.VideoId)} className="p-1.5 lg:p-0 text-red-400 hover:text-red-600 transition shrink-0 min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center" title="ลบ">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))
      )}

      {adding && (
        <div className="p-4 bg-orange-50 border-t border-orange-100 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อคลิป</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inp} placeholder="เช่น ตัวอย่างการสอน EP.1" disabled={saving} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">แหล่งที่มาของวิดีโอ</label>
            <div className="flex gap-2">
              {[
                { key: "youtube", label: "YouTube", icon: Youtube },
                { key: "drive", label: "Google Drive", icon: FolderOpen },
                { key: "upload", label: "อัปโหลดไฟล์", icon: UploadCloud },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} type="button"
                  onClick={() => setForm(f => ({ ...f, mode: key, url: key !== f.mode ? "" : f.url }))}
                  disabled={saving}
                  className={`flex-1 min-w-0 lg:min-w-auto flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1 lg:px-0 py-2 rounded-xl text-xs font-bold border transition
                    ${form.mode === key ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {form.mode === "upload" ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">ไฟล์วิดีโอ (ไม่เกิน 200MB)</label>
              <input ref={fileInputRef} type="file" accept="video/*" disabled={uploading || saving}
                onChange={e => handleUploadFile(e.target.files[0])}
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-orange-100 file:text-orange-600 hover:file:bg-orange-200 transition cursor-pointer" />
              {uploading && <p className="mt-1.5 text-xs text-orange-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> กำลังอัปโหลด...</p>}
              {!uploading && form.url && form.mode === "upload" && <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1"><LuCheckCircle2 className="h-3.5 w-3.5" /> อัปโหลดไฟล์แล้ว</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                ลิงก์ {form.mode === "youtube" ? "YouTube" : "Google Drive"}
              </label>
              <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className={inp} placeholder="https://..." disabled={saving} />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">ความยาวคลิป (ไม่บังคับ)</label>
            <input type="text" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              className={inp} placeholder="เช่น 5 นาที" disabled={saving} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              ภาพปกคลิป (ไม่บังคับ)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              หากไม่เลือกภาพ ระบบจะดึงภาพหน้าปกจากเนื้อหาในวิดีโอให้อัตโนมัติ
            </p>
            <ImageUpload value={form.thumbnail} onChange={(path) => setForm(f => ({ ...f, thumbnail: path }))} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={resetForm} disabled={saving}
              className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition">
              ยกเลิก
            </button>
            <button onClick={handleSave} disabled={saving || uploading}
              className={`${BTN.primary} flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition`}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5" /> บันทึก</>}
            </button>
          </div>
        </div>
      )}

      {playingVideo && <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>
  );
}

function PricingCalculator({ tutorCost, currentPrice, currentStudentCount, maxStudents, onApplyPrice }) {
  const [mode, setMode] = useState("price"); // 'profit' | 'percent' | 'price'
  const [profitInput, setProfitInput] = useState("");
  const [percentInput, setPercentInput] = useState("");
  const [priceInput, setPriceInput] = useState(String(currentPrice || ""));

  const cost = Number(tutorCost || 0);
  const actualStudentCount = Number(currentStudentCount || 0);
  const maxCount = Number(maxStudents || 0);
  // ★ แก้ใหม่: ใช้ "จำนวนที่รับสูงสุด" เป็นฐานคำนวณเสมอ (สมมติว่ารับนักเรียนเต็มจำนวน)
  // ถ้ายังไม่ได้กรอกจำนวนที่รับสูงสุด ให้ fallback ไปใช้จำนวนนักเรียนที่มีอยู่จริงแทน
  const capacityCount = maxCount > 0 ? maxCount : actualStudentCount;

  // ★ ทุกโหมดคำนวณระดับ "ทั้งคอร์ส" ก่อน แล้วค่อยหารด้วย capacityCount เพื่อได้ราคาต่อคน
  let pricePerStudent = 0, totalRevenue = 0, totalProfit = 0, resultMargin = 0;

  if (mode === "profit") {
    // กำไรเป้าหมายของทั้งคอร์ส (บาท) -> คิดย้อนกลับหารายได้ที่ต้องมี แล้วหารเป็นราคาต่อคน
    totalProfit = Number(profitInput || 0);
    totalRevenue = cost + totalProfit;
    pricePerStudent = capacityCount > 0 ? totalRevenue / capacityCount : 0;
    resultMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  } else if (mode === "percent") {
    // % กำไรของทั้งคอร์ส -> คิดย้อนกลับหารายได้ที่ต้องมี แล้วหารเป็นราคาต่อคน
    resultMargin = Number(percentInput || 0);
    totalRevenue = resultMargin < 100 ? cost / (1 - resultMargin / 100) : 0;
    totalProfit = totalRevenue - cost;
    pricePerStudent = capacityCount > 0 ? totalRevenue / capacityCount : 0;
  } else {
    // กรอกราคาขายต่อคน -> คำนวณไปข้างหน้าเป็นรายได้รวม กำไรรวม และ %
    pricePerStudent = Number(priceInput || 0);
    totalRevenue = pricePerStudent * capacityCount;
    totalProfit = totalRevenue - cost;
    resultMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  }

  const isLoss = totalProfit < 0;

  return (
    <div className={`rounded-2xl border overflow-hidden ${isLoss ? "border-amber-200" : "border-emerald-200"}`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${isLoss ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"}`}>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${isLoss ? "bg-amber-400" : "bg-emerald-500"}`}>
          <DollarSign className="h-4 w-4 text-white" />
        </span>
        <p className={`text-xs font-bold uppercase tracking-wide ${isLoss ? "text-amber-700" : "text-emerald-700"}`}>
          วิเคราะห์กำไร (Pricing Calculator)
        </p>
      </div>

      <div className="p-4 space-y-3 bg-white">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          กรอกกำไรเป้าหมาย, % กำไร หรือราคาขายต่อคน — ระบบจะคำนวณให้ครบทั้ง 3 อย่างพร้อมกัน โดยอิงต้นทุนติวเตอร์รวม <span className="font-semibold text-slate-500">฿{formatPrice(cost)}</span> {maxCount > 0
            ? <>และจำนวนที่รับสูงสุด <span className="font-semibold text-slate-500">{capacityCount} คน</span> (คำนวณจากกรณีนักเรียนสมัครครบตามจำนวนที่รับสูงสุดเท่านั้น)</>
            : <>และนักเรียนปัจจุบัน <span className="font-semibold text-slate-500">{capacityCount} คน</span></>}
          {capacityCount === 0 && (
            <span className="block mt-1 text-amber-600 font-semibold"><LuAlertTriangle className="inline h-3.5 w-3.5 -mt-0.5" /> ยังไม่ได้กรอก "จำนวนที่รับสูงสุด" และยังไม่มีนักเรียนในคอร์ส โหมด "กำไรเป้าหมาย" และ "% กำไร" จะยังคำนวณราคาต่อคนไม่ได้ — กรุณากรอกจำนวนที่รับสูงสุดก่อน หรือใช้โหมด "กรอกราคาขาย" แทน</span>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          {[
            { key: "profit", label: "กำไรเป้าหมายของทั้งคอร์ส (บาท)" },
            { key: "percent", label: "กรอก % กำไร (ทั้งคอร์ส)" },
            { key: "price", label: "กรอกราคาขาย (สุทธิต่อคน)" },
          ].map(opt => (
            <button key={opt.key} type="button" onClick={() => {
              setMode(opt.key);
              // ★ seed ค่าจากราคาต่อคนปัจจุบัน (currentPrice) x capacityCount = รายได้รวมปัจจุบัน (สมมติขายเต็มจำนวนที่รับสูงสุด)
              // แล้วคำนวณย้อนกลับเป็นกำไรรวม/เปอร์เซ็นต์ ให้ทุกโหมดอ้างอิงชุดข้อมูลเดียวกัน
              const seedTotalRevenue = currentPrice * capacityCount;
              const seedTotalProfit = seedTotalRevenue - cost;
              if (opt.key === "profit") {
                setProfitInput(String(Math.round(seedTotalProfit)));
              } else if (opt.key === "percent") {
                setPercentInput(seedTotalRevenue > 0 ? ((seedTotalProfit / seedTotalRevenue) * 100).toFixed(1) : "");
              } else if (opt.key === "price") {
                setPriceInput(String(currentPrice));
              }
            }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition
                ${mode === opt.key ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300"}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {mode === "profit" && (
          <input type="number" min="0" value={profitInput} onChange={e => setProfitInput(e.target.value)}
            placeholder="กำไรเป้าหมายที่ต้องการทั้งคอร์ส (บาท)" onKeyDown={blockNegativeKeys}
            className="w-full px-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400" />
        )}
        {mode === "percent" && (
          <input type="number" min="0" max="99" value={percentInput} onChange={e => setPercentInput(e.target.value)}
            placeholder="% กำไรที่ต้องการของทั้งคอร์ส" onKeyDown={blockNegativeKeys}
            className="w-full px-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400" />
        )}
        {mode === "price" && (
          <input type="number" min="0" value={priceInput} onChange={e => setPriceInput(e.target.value)}
            placeholder="ราคาขายสุทธิต่อคนที่ต้องการ" onKeyDown={blockNegativeKeys}
            className="w-full px-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400" />
        )}

        <div className="rounded-2xl border border-black/5 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-black/5">
            <div className="p-3 text-center bg-slate-50">
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">ราคาสุทธิคอร์สต่อคน</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">฿{formatPrice(pricePerStudent)}</p>
            </div>
            <div className="p-3 text-center bg-slate-50">
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">รายได้รวม</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">฿{formatPrice(totalRevenue)}</p>
            </div>
            <div className={`p-3 text-center ${isLoss ? "bg-red-50" : "bg-emerald-50"}`}>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">กำไร/ขาดทุน</p>
              <p className={`text-base font-bold mt-0.5 ${isLoss ? "text-red-600" : "text-emerald-700"}`}>฿{formatPrice(totalProfit)}</p>
            </div>
            <div className={`p-3 text-center ${isLoss ? "bg-red-50" : "bg-emerald-50"}`}>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">อัตรากำไร (%)</p>
              <p className={`text-base font-bold mt-0.5 ${isLoss ? "text-red-600" : "text-emerald-700"}`}>{resultMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <button type="button" onClick={() => onApplyPrice(Math.round(pricePerStudent))} disabled={pricePerStudent <= 0}
          className={`${BTN.primary} w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold disabled:opacity-40 transition text-sm`}>
          <Check className="h-4 w-4" /> ใช้ราคานี้
        </button>
      </div>
    </div>
  );
}

function BreakEvenAnalysis({ tutorCost, fullCost, currentStudentCount, maxStudents }) {
  const cost = Number(tutorCost || 0);
  const pricePerStudent = Number(fullCost || 0);
  const breakEvenStudents = pricePerStudent > 0 ? Math.ceil(cost / pricePerStudent) : 0;

  const currentRevenue = pricePerStudent * Number(currentStudentCount || 0);
  const currentProfit = currentRevenue - cost;
  const isProfitable = currentProfit >= 0;

  const maxCount = maxStudents ? Number(maxStudents) : null;
  const maxRevenue = maxCount !== null ? pricePerStudent * maxCount : null;
  const maxProfit = maxRevenue !== null ? maxRevenue - cost : null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${isProfitable ? "border-emerald-200" : "border-amber-200"}`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${isProfitable ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${isProfitable ? "bg-emerald-500" : "bg-amber-400"}`}>
          <TrendingUp className="h-4 w-4 text-white" />
        </span>
        <p className={`text-xs font-bold uppercase tracking-wide ${isProfitable ? "text-emerald-700" : "text-amber-700"}`}>
          วิเคราะห์ความคุ้มทุน (Break-even)
        </p>
      </div>

      <div className="p-4 space-y-3 bg-white">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          ต้องมีนักเรียนกี่คนจึงจะคุ้มทุน โดยอิงราคาสุทธิคอร์สต่อคน <span className="font-semibold text-slate-500">฿{formatPrice(pricePerStudent)}</span>
        </p>

        <div className="grid grid-cols-3 divide-x divide-black/5 rounded-2xl border border-black/5 overflow-hidden">
          <div className="p-2 sm:p-3 text-center bg-slate-50">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">จุดคุ้มทุน</p>
            <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">≥ {breakEvenStudents} คน</p>
          </div>
          <div className="p-2 sm:p-3 text-center bg-slate-50">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">นักเรียนปัจจุบัน</p>
            <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">{currentStudentCount || 0} คน</p>
          </div>
          <div className={`p-2 sm:p-3 text-center ${isProfitable ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">กำไร/ขาดทุน</p>
            <p className={`text-sm sm:text-base font-bold mt-0.5 ${isProfitable ? "text-emerald-700" : "text-red-600"}`}>
              {isProfitable ? "+" : ""}฿{formatPrice(currentProfit)}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${isProfitable ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
          {isProfitable ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
          <span>
            {isProfitable
              ? `เกินจุดคุ้มทุนแล้ว — กำไรประมาณ ฿${formatPrice(currentProfit)}`
              : `ยังไม่ถึงจุดคุ้มทุน — ต้องมีนักเรียนเพิ่มอีก ${Math.max(0, breakEvenStudents - Number(currentStudentCount || 0))} คน เพื่อให้ถึงจุดคุ้มทุน`}
          </span>
        </div>

        {maxCount !== null && (
          <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 bg-slate-50 border-slate-200 text-xs">
            <span className="text-slate-500">หากมีนักเรียนเป้าหมายเต็มจำนวนนักเรียนสูงสุด ({maxCount} คน)</span>
            <span className={`font-bold ${maxProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {maxProfit >= 0 ? "เกินจุดคุ้มทุน" : "ยังไม่ถึงจุดคุ้มทุน"} (฿{formatPrice(maxProfit)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ★ เพิ่ม: input แยกสำหรับกรอกยอดผ่อนแต่ละงวด แยก local state ออกจาก parent
// เหตุผล: ถ้าใช้ moneyDisplay/formatPrice ใน value ทุกครั้งที่พิมพ์ ".", toLocaleString จะปัดจุดทิ้งทันทีตอน re-render
// จึงต้องเก็บข้อความดิบไว้เองระหว่างโฟกัส แล้วค่อย sync กับ parent ตอนไม่ได้โฟกัส (เช่น ถูกงวดอื่นคำนวณแทน)
function InstallmentAmountInput({ value, onChange }) {
  const [text, setText] = useState(value === "" || value === null || value === undefined ? "" : String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(value === "" || value === null || value === undefined ? "" : String(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const cleaned = sanitizeMoneyInput(e.target.value); // เก็บจุดทศนิยมไว้ตามที่พิมพ์จริง ไม่ตัดทิ้ง
    setText(cleaned);
    onChange(cleaned);
  };

  return (
    <input
      type="text" inputMode="decimal" value={text}
      onFocus={() => { focusedRef.current = true; }}
      onBlur={() => {
        focusedRef.current = false;
        setText(value === "" || value === null || value === undefined ? "" : String(value));
      }}
      onChange={handleChange} onKeyDown={blockNegativeKeys}
      className="flex-1 min-w-0 lg:min-w-auto px-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400"
    />
  );
}

function InstallmentAmountsEditor({ installments, fullCost, value, onChange }) {
  const count = Number(installments || 1);
  const amounts = value && value.length === count ? value : distributeInstallments(fullCost, count);
  const sum = amounts.reduce((s, v) => s + Number(v || 0), 0);
  const diff = Math.round((fullCost - sum) * 100) / 100;
  const ok = Math.abs(diff) < 0.01;

  // ★ เพิ่ม: จำว่างวดไหนแอดมิน "กำหนดเอง" แล้ว เพื่อคำนวณงวดที่เหลือให้อัตโนมัติจากยอดคงเหลือ
  const [manualIndices, setManualIndices] = useState(new Set());

  // รีเซ็ต manual flags เมื่อจำนวนงวดเปลี่ยน เพราะ index เดิมไม่มีความหมายกับ array ขนาดใหม่แล้ว
  useEffect(() => {
    setManualIndices(new Set());
  }, [count]);

  const updateAt = (idx, raw) => {
    const manualSet = new Set(manualIndices);
    manualSet.add(idx);

    const next = [...amounts];
    next[idx] = raw; // ★ raw ผ่าน sanitize มาจาก InstallmentAmountInput แล้ว ไม่ต้อง sanitize ซ้ำ

    const manualSum = [...manualSet].reduce((s, i) => s + Number(next[i] || 0), 0);
    const nonManualIndices = next.map((_, i) => i).filter((i) => !manualSet.has(i));

    if (nonManualIndices.length > 0) {
      // ★ หัวใจของข้อ 1-3: ยอดงวดที่เหลือ = ราคาสุทธิ - ยอดที่กำหนดเองไปแล้ว หารเท่า ๆ กันในงวดที่เหลือ
      const remaining = Math.max(0, fullCost - manualSum);
      const base = Math.floor((remaining / nonManualIndices.length) * 100) / 100;
      nonManualIndices.forEach((i) => { next[i] = base; });
      // ปัดเศษไปรวมงวดสุดท้ายที่ยังไม่ manual เสมอ กันปัญหา floating point ผลรวมไม่ตรงเป๊ะ
      const lastIdx = nonManualIndices[nonManualIndices.length - 1];
      const roundedSum = manualSum + base * nonManualIndices.length;
      const remainder = Math.round((fullCost - roundedSum) * 100) / 100;
      next[lastIdx] = Math.round((next[lastIdx] + remainder) * 100) / 100;
    }

    setManualIndices(manualSet);
    onChange(next);
  };

  const resetToEqual = () => {
    setManualIndices(new Set()); // ★ กด "แบ่งเท่า ๆ กันใหม่" ต้องล้าง manual flags ด้วย ไม่งั้นครั้งถัดไปจะยังล็อกงวดเดิมอยู่
    onChange(distributeInstallments(fullCost, count));
  };

  return (
    <div className="rounded-2xl border border-orange-200 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-orange-50 border-b border-orange-100">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 shrink-0">
            <Tag className="h-4 w-4 text-white" />
          </span>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            กำหนดยอดผ่อนแต่ละงวด
          </p>
        </div>
        <button type="button" onClick={resetToEqual}
          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition shrink-0">
          แบ่งเท่า ๆ กันใหม่
        </button>
      </div>

      <div className="p-4 space-y-2 bg-white">
        {amounts.map((amt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-14 sm:w-16 text-xs text-slate-500 shrink-0">งวดที่ {idx + 1}</span>
            <InstallmentAmountInput value={amt} onChange={(v) => updateAt(idx, v)} />
            <span className="text-xs text-slate-500 shrink-0">บาท</span>
          </div>
        ))}
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center gap-2">
            {ok ? <Check className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
            <span className={`text-xs font-semibold ${ok ? "text-emerald-700" : "text-red-600"}`}>รวมทุกงวด ฿{formatPrice(sum)}</span>
          </div>
          <span className={`text-xs font-bold ${ok ? "text-emerald-700" : "text-red-600"}`}>
            {ok ? "ครบตามราคาสุทธิคอร์ส" : diff > 0 ? `ขาดอีก ฿${formatPrice(diff)}` : `เกินไป ฿${formatPrice(Math.abs(diff))}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── ฟอร์มสร้าง/แก้ไขคอร์สรวม — แบบทีละขั้น (Stepper) ─────────────────────────
// ขั้นตอน: ข้อมูลคอร์ส → วิชาและติวเตอร์ → ราคาและที่นั่ง → นักเรียน → สื่อประกอบ → ตรวจสอบและบันทึก
// ทุกขั้นยัง mount อยู่ตลอด (ซ่อนด้วย hidden) เพื่อให้คอมโพเนนต์ลูก เช่น CourseSubjects
// ส่งต้นทุน/ชั่วโมงกลับมาคำนวณได้แม้ผู้ใช้ยังไม่ได้เปิดขั้นนั้น
const COURSE_FORM_STEPS = [
  { key: "basic", label: "ข้อมูลคอร์ส", icon: BookOpen, desc: "ชื่อคอร์ส ช่วงเวลาเรียน ปีการศึกษา และการตั้งค่าพื้นฐาน" },
  { key: "subjects", label: "วิชาและติวเตอร์", icon: Tag, desc: "กำหนดวิชา ติวเตอร์ และจำนวนชั่วโมงเรียน" },
  { key: "pricing", label: "ราคาและที่นั่ง", icon: DollarSign, desc: "ราคาขาย ส่วนลด จำนวนที่นั่ง และการผ่อนชำระ" },
  { key: "students", label: "นักเรียน", icon: Users, desc: "เพิ่มนักเรียนเข้าคอร์สล่วงหน้า" },
  { key: "media", label: "สื่อประกอบ", icon: ImagePlus, desc: "รูปปก รูปประกาศ และคลิปตัวอย่าง" },
  { key: "review", label: "ตรวจสอบและบันทึก", icon: BadgeCheck, desc: "ตรวจสอบข้อมูลทั้งหมดก่อนบันทึก" },
];
// ช่องที่มีข้อผิดพลาดแต่ละช่องอยู่ในขั้นไหน (ใช้พาผู้ใช้กลับไปแก้)
const COURSE_ERROR_STEP = { CourseName: 0, StartDate: 0, LastDate: 0, YearId: 0, hours: 1, Price: 2, Discount: 2, installments: 2 };
const COURSE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function FormField({ label, required, optional, hint, error, children, className = "" }) {
  return (
    <div className={className}>
      <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500" aria-hidden="true">*</span>}
        {optional && <span className="text-xs font-normal text-slate-400">(ไม่บังคับ)</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

function FormSection({ title, subtitle, children }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {(title || subtitle) && (
        <header>
          {title && <h4 className="text-sm font-bold text-slate-800">{title}</h4>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

function CourseForm({ initial = {}, onSave, onCancel, isSubmitting, statusOptions, termOptions, yearOptions = [], availabilityOptions = [], gradeLevelOptions = [], showToast }) {
  const [form, setForm] = useState({
    CourseName: "",
    StartDate: "",
    LastDate: "",
    Price: "",
    Discount: "0",
    Installments: "1",
    TotalCourseHours: "",
    MaxStudents: "",
    InstallmentAmounts: null, // ★ แก้: array รายงวด แทน InstallmentAmountOverride เดิม
    Remark: "",
    Status_Course_Id: 1,
    Term_Id: 1,
    Course_Type: "bundle",
    Course_Availability_Id: "",
    CourseImage: "",
    YearId: "",
    GradeLevelId: "",
    ...initial,
  });

  const [pendingSubjects, setPendingSubjects] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [existingSubjectsCost, setExistingSubjectsCost] = useState(0);
  const [existingSubjectsHours, setExistingSubjectsHours] = useState(0);
  const [existingStudentCount, setExistingStudentCount] = useState(0);
  const [existingTutorCount, setExistingTutorCount] = useState(0);

  const isEdit = !!initial.CourseID;
  const lastStep = COURSE_FORM_STEPS.length - 1;
  const [step, setStep] = useState(0);
  // ขั้นไกลสุดที่ไปถึงแล้ว — โหมดแก้ไขเปิดได้ทุกขั้นทันที
  const [maxReached, setMaxReached] = useState(isEdit ? lastStep : 0);
  // ขั้นที่ผู้ใช้กด "ถัดไป"/"บันทึก" แล้ว — จึงเริ่มแสดงข้อความเตือนใต้ช่อง
  const [touchedSteps, setTouchedSteps] = useState(() => new Set());
  const [showHelper, setShowHelper] = useState(false);
  const rootRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const fullCost = Math.max(0, Number(form.Price || 0) - Number(form.Discount || 0));

  const monthsSpanned = calcMonthsSpanned(form.StartDate, form.LastDate);
  const avgHoursPerMonth = form.TotalCourseHours && monthsSpanned > 0
    ? Number(form.TotalCourseHours) / monthsSpanned
    : null;

  const installmentsCount = Number(form.Installments || 1);
  const isInstallmentEnabled = installmentsCount > 1;
  const calculatedInstallmentAmount = isInstallmentEnabled ? fullCost / installmentsCount : fullCost;

  const pendingTotalCost = pendingSubjects.reduce((sum, it) => {
    const rate = Number(it.StudentRatePerHourOverride || it.TutorRatePerHourOverride || 0);
    return sum + Number(it.TotalHours || 0) * rate;
  }, 0);
  const totalTutorCost = isEdit ? existingSubjectsCost : pendingTotalCost;
  const currentStudentCount = isEdit ? existingStudentCount : pendingStudents.length;
  const tutorCount = isEdit ? existingTutorCount : pendingSubjects.length;
  const addedSubjectHours = isEdit
    ? existingSubjectsHours
    : pendingSubjects.reduce((sum, it) => sum + Number(it.TotalHours || 0), 0);
  const targetCourseHours = Number(form.TotalCourseHours || 0);
  const hoursDiff = targetCourseHours - addedSubjectHours;
  const hoursMismatch = targetCourseHours > 0 && Math.abs(hoursDiff) > 0.01;

  // ★ แก้ (ข้อ 2): เช็กยอดผ่อนรายงวดรวมต้องเท่ากับราคาสุทธิพอดี (แทน logic เดิมที่เช็กยอดเดียว×จำนวนงวด)
  const currentInstallmentAmounts = isInstallmentEnabled
    ? (form.InstallmentAmounts && form.InstallmentAmounts.length === installmentsCount
      ? form.InstallmentAmounts
      : distributeInstallments(fullCost, installmentsCount))
    : [];
  const installmentSum = currentInstallmentAmounts.reduce((s, v) => s + Number(v || 0), 0);
  const installmentMismatch = isInstallmentEnabled && Math.abs(fullCost - installmentSum) > 0.01;

  // ── ช่องที่ยังไม่ครบ/ไม่ถูกต้อง (กติกาเดียวกับตอนบันทึกและฝั่ง backend) ──
  const errors = {};
  if (!String(form.CourseName || "").trim()) errors.CourseName = "กรุณากรอกชื่อคอร์ส";
  if (!form.StartDate) errors.StartDate = "กรุณาเลือกวันเริ่มสอน";
  if (!form.LastDate) errors.LastDate = "กรุณาเลือกวันสิ้นสุด";
  if (form.StartDate && form.LastDate) {
    if (!COURSE_DATE_RE.test(String(form.StartDate).slice(0, 10)) || !COURSE_DATE_RE.test(String(form.LastDate).slice(0, 10))) {
      errors.LastDate = "รูปแบบวันที่ไม่ถูกต้อง กรุณาลบแล้วเลือกวันที่ใหม่จากปฏิทิน";
    } else if (new Date(form.StartDate) >= new Date(form.LastDate)) {
      errors.LastDate = "วันสิ้นสุดต้องมาหลังวันเริ่มสอน";
    }
  }
  if (!form.YearId) errors.YearId = "กรุณาเลือกปีการศึกษา";
  if (hoursMismatch) {
    errors.hours = `จำนวนชั่วโมงรายวิชา${hoursDiff > 0 ? "ยังไม่ครบ" : "เกินชั่วโมงรวมของคอร์ส"} (${hoursDiff > 0 ? "ขาด" : "เกิน"} ${formatHoursLabel(Math.abs(hoursDiff))})`;
  }
  if (!form.Price || Number(form.Price) <= 0) errors.Price = "กรุณากรอกราคาเต็มให้มากกว่า 0";
  if (form.Discount !== "" && Number(form.Discount || 0) > Number(form.Price || 0) && Number(form.Price) > 0) {
    errors.Discount = "ส่วนลดต้องไม่มากกว่าราคาเต็ม";
  }
  if (installmentMismatch) {
    errors.installments = `ยอดผ่อนรวม ฿${formatPrice(installmentSum)} ต้องเท่ากับราคาสุทธิ ฿${formatPrice(fullCost)}`;
  }
  const errorKeys = Object.keys(errors);
  const stepErrorKeys = (i) => errorKeys.filter((k) => COURSE_ERROR_STEP[k] === i);
  const stepHasError = (i) => stepErrorKeys(i).length > 0;
  const firstErrorStep = errorKeys.length ? Math.min(...errorKeys.map((k) => COURSE_ERROR_STEP[k])) : -1;
  // แสดงข้อความเตือนใต้ช่องเมื่อผู้ใช้เคยพยายามผ่านขั้นนั้นแล้ว หรืออยู่ในโหมดแก้ไข
  const errOf = (k) => (isEdit || touchedSteps.has(COURSE_ERROR_STEP[k]) ? errors[k] : undefined);

  const markTouched = (idxs) => setTouchedSteps((s) => new Set([...s, ...idxs]));

  const goTo = (i) => {
    const target = Math.max(0, Math.min(lastStep, i));
    setStep(target);
    setMaxReached((m) => Math.max(m, target));
    const scroller = rootRef.current?.closest(".overflow-y-auto");
    if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    markTouched([step]);
    if (stepHasError(step)) {
      return showToast("error", "ยังไปขั้นถัดไปไม่ได้", errors[stepErrorKeys(step)[0]]);
    }
    goTo(step + 1);
  };

  const handleMoneyChange = (key) => (e) => {
    const cleaned = sanitizeMoneyInput(e.target.value);
    set(key, cleaned);
  };

  const handleSubmit = () => {
    // แสดงข้อความเตือนทุกขั้น และพาไปยังขั้นแรกที่ยังไม่ครบ
    markTouched(COURSE_FORM_STEPS.map((_, i) => i));
    if (firstErrorStep >= 0) goTo(firstErrorStep);

    if (!form.CourseName.trim()) return toast("กรุณากรอกชื่อคอร์ส");
    if (!form.StartDate || !form.LastDate) return toast("กรุณากรอกวันเริ่มและวันสิ้นสุด");
    if (!COURSE_DATE_RE.test(String(form.StartDate).slice(0, 10)) || !COURSE_DATE_RE.test(String(form.LastDate).slice(0, 10))) {
      return showToast(
        "error",
        "รูปแบบวันที่ไม่ถูกต้อง",
        "กรุณาลบข้อมูลในช่องวันเริ่มสอน/วันสิ้นสุด แล้วเลือกวันที่ใหม่จากปฏิทินอีกครั้ง"
      );
    }
    if (new Date(form.StartDate) >= new Date(form.LastDate)) return toast("วันเริ่มสอนต้องมาก่อนวันสิ้นสุด");
    if (!form.Price || Number(form.Price) <= 0) return toast("กรุณากรอกราคาคอร์สให้ถูกต้อง (มากกว่า 0)");
    if (!form.YearId) return toast("กรุณากรอกปีการศึกษา");
    if (errors.Discount) return toast(errors.Discount);

    if (hoursMismatch) {
      return showToast(
        "error",
        hoursDiff > 0 ? "จำนวนชั่วโมงรายวิชายังไม่ครบ" : "จำนวนชั่วโมงรายวิชาเกินกว่าชั่วโมงรวมของคอร์ส",
        `กรุณาตรวจสอบอีกครั้ง (${hoursDiff > 0 ? "ขาด" : "เกิน"} ${formatHoursLabel(Math.abs(hoursDiff))})`
      );
    }

    // ★ แก้ (ข้อ 2): บล็อกบันทึกถ้ายอดผ่อนรายงวดรวมกันไม่เท่ากับราคาสุทธิ
    if (installmentMismatch) {
      return showToast(
        "error",
        "ยอดผ่อนรายงวดรวมกันไม่เท่ากับราคาสุทธิ",
        `รวม ฿${formatPrice(installmentSum)} ต้องเท่ากับราคาสุทธิ ฿${formatPrice(fullCost)}`
      );
    }

    onSave({
      ...form,
      FullCost: fullCost,
      // ★ แปลงเป็น Number ให้ชัวร์ก่อนส่ง กันกรณีมีข้อความดิบค้าง เช่น "8." หลุดเข้ามาตอนยังไม่ blur
      InstallmentAmounts: isInstallmentEnabled ? currentInstallmentAmounts.map(v => Number(v || 0)) : null,
      pendingSubjects,
      pendingStudents,
    });
  };

  const inputCls = (err) => `${INPUT}${err ? " border-red-300 bg-red-50/40 focus:ring-red-300" : ""}`;
  const current = COURSE_FORM_STEPS[step];
  const progressPct = Math.round(((step + 1) / COURSE_FORM_STEPS.length) * 100);
  const hasAnyError = errorKeys.length > 0;

  // ── ค่าที่ใช้ในหน้าสรุป ──
  const findName = (list, idKey, nameKey, id) =>
    list.find((o) => String(o[idKey]) === String(id))?.[nameKey];
  const dash = <span className="text-slate-400">ไม่ระบุ</span>;
  const summaryGroups = [
    {
      step: 0, title: "ข้อมูลคอร์ส", rows: [
        { label: "ชื่อคอร์ส", value: String(form.CourseName || "").trim() || null, err: errors.CourseName },
        { label: "ช่วงเวลาเรียน", value: form.StartDate && form.LastDate ? `${formatDate(form.StartDate)} – ${formatDate(form.LastDate)}` : null, err: errors.StartDate || errors.LastDate },
        { label: "ปีการศึกษา", value: findName(yearOptions, "YearId", "YearName", form.YearId), err: errors.YearId },
        { label: "เทอม/ช่วงเวลา", value: findName(termOptions, "Term_Id", "Term_Name", form.Term_Id) },
        { label: "ระดับชั้น", value: form.GradeLevelId ? findName(gradeLevelOptions, "GradeLevelId", "GradeDetail", form.GradeLevelId) : "ทุกระดับชั้น" },
        { label: "รูปแบบการเรียน", value: form.Course_Availability_Id ? findName(availabilityOptions, "Course_Availability_Id", "Course_Availability_Name", form.Course_Availability_Id) : null },
        { label: "สถานะ", value: findName(statusOptions, "Status_Course_Id", "Status_Course_Name", form.Status_Course_Id) },
        { label: "ประเภท", value: `${form.Course_Type === "single" ? "คอร์สเดี่ยว" : "คอร์สรวม"}${form.Is_Promotion ? " · โปรโมชัน" : ""}` },
      ],
    },
    {
      step: 1, title: "วิชาและติวเตอร์", rows: [
        { label: "จำนวนวิชา", value: tutorCount > 0 ? `${tutorCount} วิชา` : null },
        { label: "ชั่วโมงรายวิชารวม", value: addedSubjectHours > 0 ? formatHoursLabel(addedSubjectHours) : null },
        { label: "ชั่วโมงรวมของคอร์ส", value: targetCourseHours > 0 ? formatHoursLabel(targetCourseHours) : null, err: errors.hours },
      ],
    },
    {
      step: 2, title: "ราคาและที่นั่ง", rows: [
        { label: "ราคาเต็ม", value: Number(form.Price) > 0 ? `฿${formatPrice(form.Price)}` : null, err: errors.Price },
        { label: "ส่วนลด", value: `฿${formatPrice(form.Discount)}`, err: errors.Discount },
        { label: "ราคาสุทธิ", value: `฿${formatPrice(fullCost)}` },
        { label: "จำนวนที่นั่ง", value: form.MaxStudents ? `${form.MaxStudents} คน` : "ไม่จำกัด" },
        { label: "การชำระเงิน", value: isInstallmentEnabled ? `ผ่อน ${installmentsCount} งวด` : "จ่ายครั้งเดียว", err: errors.installments },
      ],
    },
    {
      step: 3, title: "นักเรียน", rows: [
        { label: "นักเรียนในคอร์ส", value: currentStudentCount > 0 ? `${currentStudentCount} คน` : "ยังไม่มี" },
      ],
    },
    {
      step: 4, title: "สื่อประกอบ", rows: [
        { label: "รูปปกคอร์ส", value: form.CourseImage ? "อัปโหลดแล้ว" : null },
        { label: "รูปประกาศ", value: form.AnnouncementImage ? "อัปโหลดแล้ว" : null },
        { label: "หมายเหตุ", value: String(form.Remark || "").trim() ? `${form.Remark.trim().length} ตัวอักษร` : null },
      ],
    },
  ];

  return (
    <div ref={rootRef} className="flex flex-col gap-5">
      {/* ═══ Stepper (ติดด้านบนขณะเลื่อน) ═══ */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 bg-white border-b border-slate-100">
        {/* มือถือ: ขั้นที่ x/n · ชื่อ + แถบความคืบหน้า */}
        <div className="md:hidden">
          <div className="flex items-center justify-between gap-2 text-sm">
            <p className="font-bold text-slate-800 truncate">
              <span className="text-orange-600">ขั้นที่ {step + 1}/{COURSE_FORM_STEPS.length}</span> · {current.label}
            </p>
            {stepHasError(step) && touchedSteps.has(step) && (
              <span className={`${BADGE_BASE} ${BADGE_TONE.danger}`}>ยังไม่ครบ</span>
            )}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* จอกว้าง: แสดงทุกขั้น */}
        <ol className="hidden md:flex items-center gap-1">
          {COURSE_FORM_STEPS.map((s, i) => {
            const reachable = i <= maxReached;
            const active = i === step;
            const warn = stepHasError(i) && (touchedSteps.has(i) || isEdit);
            const done = !active && i < maxReached && !stepHasError(i);
            return (
              <li key={s.key} className="flex items-center flex-1 min-w-0 last:flex-none">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goTo(i)}
                  aria-current={active ? "step" : undefined}
                  className={`group flex items-center gap-2 min-w-0 rounded-xl px-1.5 py-1 transition
                    ${reachable ? "cursor-pointer hover:bg-orange-50" : "cursor-not-allowed opacity-50"}`}
                >
                  <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition
                    ${active ? "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/30"
                      : warn ? "bg-red-50 border-red-300 text-red-600"
                        : done ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white border-slate-200 text-slate-500"}`}>
                    {done && !warn ? <Check className="h-3.5 w-3.5" /> : warn && !active ? "!" : i + 1}
                  </span>
                  <span className={`text-xs font-semibold truncate ${active ? "text-orange-700" : warn ? "text-red-600" : "text-slate-600"}`}>
                    {s.label}
                  </span>
                </button>
                {i < lastStep && <span className={`mx-1 h-0.5 flex-1 min-w-[8px] rounded-full ${i < maxReached ? "bg-orange-200" : "bg-slate-200"}`} />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* หัวข้อขั้นปัจจุบัน + คำอธิบายเครื่องหมายช่องบังคับ */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900">{current.label}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{current.desc}</p>
        </div>
        {step !== lastStep && (
          <p className="text-xs text-slate-500 shrink-0"><span className="text-red-500 font-bold">*</span> จำเป็น</p>
        )}
      </div>

      {/* ═══ ขั้นที่ 1: ข้อมูลคอร์ส ═══ */}
      <div className={step === 0 ? "space-y-4" : "hidden"}>
        <FormSection title="ข้อมูลหลัก" subtitle="ต้องกรอกให้ครบก่อนไปขั้นถัดไป">
          <FormField label="ชื่อคอร์ส" required error={errOf("CourseName")}>
            <input
              type="text"
              value={form.CourseName}
              onChange={(e) => set("CourseName", e.target.value)}
              className={inputCls(errOf("CourseName"))}
              placeholder="เช่น คอร์สรวม (แพ็กเกจ) ป.3 ทั้งหมด 4 วิชา"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="วันเริ่มสอน" required error={errOf("StartDate")}>
              <input type="date" value={form.StartDate?.slice(0, 10) || ""} onChange={(e) => set("StartDate", e.target.value)} className={inputCls(errOf("StartDate"))} />
            </FormField>
            <FormField
              label="วันสิ้นสุด" required
              error={errOf("LastDate") || (form.StartDate && form.LastDate && new Date(form.LastDate) < new Date(form.StartDate) ? "วันสิ้นสุดต้องมาหลังวันเริ่มสอน" : undefined)}
              hint={monthsSpanned > 0 ? `ระยะเวลาเรียนประมาณ ${monthsSpanned} เดือน` : undefined}
            >
              <input type="date" value={form.LastDate?.slice(0, 10) || ""} onChange={(e) => set("LastDate", e.target.value)} className={inputCls(errOf("LastDate"))} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="ปีการศึกษา (พ.ศ.)" required error={errOf("YearId")}>
              <select value={form.YearId} onChange={(e) => set("YearId", e.target.value)} className={inputCls(errOf("YearId"))}>
                <option value="">เลือกปีการศึกษา</option>
                {yearOptions.map((y) => <option key={y.YearId} value={y.YearId}>{y.YearName}</option>)}
              </select>
            </FormField>
            <FormField label="เทอม/ช่วงเวลา" required hint="มีค่าเริ่มต้นให้แล้ว เปลี่ยนได้ตามช่วงที่เปิดสอน">
              <select value={form.Term_Id} onChange={(e) => set("Term_Id", Number(e.target.value))} className={inputCls()}>
                {termOptions.map((t) => <option key={t.Term_Id} value={t.Term_Id}>{t.Term_Name}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="สถานะคอร์ส" required hint="นักเรียนจะเพิ่มเข้าคอร์สได้เมื่อสถานะเป็น เปิดรับสมัคร หรือ กำลังสอน">
            <select value={form.Status_Course_Id} onChange={(e) => set("Status_Course_Id", Number(e.target.value))} className={inputCls()}>
              {statusOptions.map((s) => <option key={s.Status_Course_Id} value={s.Status_Course_Id}>{s.Status_Course_Name}</option>)}
            </select>
          </FormField>
        </FormSection>

        <FormSection title="รายละเอียดเพิ่มเติม" subtitle="ไม่บังคับ — ข้ามได้และกลับมาแก้ไขภายหลัง">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="ระดับชั้นของเนื้อหา" optional hint="ใช้เป็นตัวกรองเริ่มต้นตอนจัดชุดข้อสอบจากคลัง ไม่จำกัดชั้นของนักเรียนที่สมัคร">
              <select
                value={form.GradeLevelId ?? ""}
                onChange={(e) => set("GradeLevelId", e.target.value === "" ? "" : Number(e.target.value))}
                className={inputCls()}
              >
                <option value="">ไม่ระบุ (ใช้ได้ทุกระดับชั้น)</option>
                {gradeLevelOptions.map((g) => (
                  <option key={g.GradeLevelId} value={g.GradeLevelId}>{g.GradeDetail}</option>
                ))}
              </select>
            </FormField>
            <FormField label="รูปแบบการเรียน" optional>
              <select value={form.Course_Availability_Id} onChange={(e) => set("Course_Availability_Id", e.target.value)} className={inputCls()}>
                <option value="">ไม่ระบุ</option>
                {availabilityOptions.map((a) => (
                  <option key={a.Course_Availability_Id} value={a.Course_Availability_Id}>
                    {a.Course_Availability_Name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="ประเภทคอร์ส" hint="คอร์สเดี่ยว = ตัวต่อตัว 1 คน ไม่แสดงหน้าเว็บ · แนะนำให้สร้างจากแท็บ “คอร์สเดี่ยว”">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "bundle", label: "คอร์สรวม" },
                  { value: "single", label: "คอร์สเดี่ยว" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("Course_Type", opt.value)}
                    className={`h-10 rounded-xl text-sm font-semibold border transition
                    ${form.Course_Type === opt.value
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label="คอร์สโปรโมชัน" optional>
              <button
                type="button"
                onClick={() => set("Is_Promotion", !form.Is_Promotion)}
                className={`w-full h-10 flex items-center justify-between px-3 rounded-xl border transition
                ${form.Is_Promotion
                    ? "bg-amber-50 border-amber-300"
                    : "bg-white border-slate-200 hover:border-amber-200"}`}
              >
                <span className={`flex items-center gap-1.5 text-sm font-semibold ${form.Is_Promotion ? "text-amber-600" : "text-slate-500"}`}>
                  <Sparkles className={`h-4 w-4 ${form.Is_Promotion ? "text-amber-500" : "text-slate-400"}`} />
                  {form.Is_Promotion ? "เป็นโปรโมชัน" : "ไม่ใช่โปรโมชัน"}
                </span>
                {form.Is_Promotion
                  ? <ToggleRight className="h-6 w-6 text-amber-500 shrink-0" />
                  : <ToggleLeft className="h-6 w-6 text-slate-300 shrink-0" />}
              </button>
            </FormField>
          </div>

          <FormField label="หมายเหตุ / รายละเอียดเพิ่มเติม" optional>
            <textarea
              value={form.Remark || ""}
              onChange={(e) => set("Remark", e.target.value)}
              className={`${INPUT} h-auto py-2`}
              rows={3}
              placeholder="รายละเอียดคอร์ส เวลาเรียน ฯลฯ"
            />
            {form.Remark?.trim() && (
              <p className="flex items-center justify-end gap-1 text-[11px] text-slate-500 mt-1">
                {form.Remark.trim().length} ตัวอักษร
              </p>
            )}
          </FormField>
        </FormSection>
      </div>

      {/* ═══ ขั้นที่ 2: วิชาและติวเตอร์ ═══ */}
      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <div className={`${CALLOUT.box} ${CALLOUT.info}`}>
          <Info className={`h-5 w-5 shrink-0 ${CALLOUT_ICON.info}`} />
          <p>ขั้นนี้ไม่บังคับ แต่หากกรอก <b>ชั่วโมงรวมของคอร์ส</b> ชั่วโมงของทุกวิชารวมกันต้องเท่ากับค่านี้จึงจะบันทึกได้</p>
        </div>

        <FormSection>
          <FormField
            label="ชั่วโมงรวมของคอร์ส (ชม.)" optional
            error={errOf("hours")}
            hint={!monthsSpanned
              ? "ระบบช่วยแบ่งชั่วโมงต่อวิชาให้อัตโนมัติ"
              : !form.TotalCourseHours
                ? `ระยะเวลาเรียนประมาณ ${monthsSpanned} เดือน`
                : `เฉลี่ยประมาณ ${formatHoursLabel(avgHoursPerMonth)}/เดือน (ระยะเวลา ${monthsSpanned} เดือน)`}
          >
            <input
              type="number" min="0" step="0.5" value={form.TotalCourseHours}
              onKeyDown={blockNegativeKeys}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (/^\d*\.?\d*$/.test(v) && Number(v) >= 0)) set("TotalCourseHours", v);
              }}
              className={`${inputCls(errOf("hours"))} sm:max-w-xs`} placeholder="เช่น 120"
            />
          </FormField>
        </FormSection>

        <FormSection title="วิชาและติวเตอร์" subtitle="เลือกวิชา ติวเตอร์ และจำนวนชั่วโมงของแต่ละวิชา">
          {isEdit
            ? <CourseSubjects
              courseId={initial.CourseID}
              showToast={showToast}
              onTotalCostChange={setExistingSubjectsCost}
              onTotalHoursChange={setExistingSubjectsHours}
              onSubjectCountChange={setExistingTutorCount}
              totalCourseHours={Number(form.TotalCourseHours || 0)}
              monthsSpanned={monthsSpanned}
            />
            : <PendingSubjectPicker
              items={pendingSubjects}
              onChange={setPendingSubjects}
              showToast={showToast}
              totalCourseHours={Number(form.TotalCourseHours || 0)}
              monthsSpanned={monthsSpanned}
            />}

          {targetCourseHours > 0 && (
            <div className={`${CALLOUT.box} ${hoursMismatch ? (hoursDiff > 0 ? CALLOUT.warning : CALLOUT.danger) : CALLOUT.success}`}>
              {hoursMismatch
                ? <AlertTriangle className={`h-5 w-5 shrink-0 ${hoursDiff > 0 ? CALLOUT_ICON.warning : CALLOUT_ICON.danger}`} />
                : <Check className={`h-5 w-5 shrink-0 ${CALLOUT_ICON.success}`} />}
              <span>
                {hoursMismatch
                  ? `จำนวนชั่วโมงรายวิชา${hoursDiff > 0 ? "ยังไม่ครบ" : "เกินกว่าชั่วโมงรวมของคอร์ส"} กรุณาตรวจสอบอีกครั้ง (${hoursDiff > 0 ? "ขาด" : "เกิน"} ${formatHoursLabel(Math.abs(hoursDiff))})`
                  : "จำนวนชั่วโมงครบถ้วน"}
              </span>
            </div>
          )}
        </FormSection>

        {totalTutorCost > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-black/5 px-4 py-3">
              <div className="pr-3">
                <p className={STAT_LABEL}>ต้นทุนติวเตอร์รวม</p>
                <p className="text-sm font-bold text-slate-700">฿{formatPrice(totalTutorCost)}</p>
              </div>
              <div className="pl-3">
                <p className={STAT_LABEL}>ต้นทุนติวเตอร์เฉลี่ยต่อคน</p>
                <p className="text-sm font-bold text-slate-700">
                  ฿{formatPrice(tutorCount > 0 ? totalTutorCost / tutorCount : 0)}
                </p>
              </div>
            </div>
            <p className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-200/60 leading-relaxed">
              คำนวณจากค่าติวเตอร์รวมเท่านั้น ยังไม่รวมค่าใช้จ่ายดำเนินงานอื่นของสถาบัน — ดูกำไร/จุดคุ้มทุนได้ในขั้น “ราคาและที่นั่ง”
            </p>
          </div>
        )}
      </div>

      {/* ═══ ขั้นที่ 3: ราคาและที่นั่ง ═══ */}
      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <FormSection title="ราคาและที่นั่ง">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="ราคาเต็ม (บาท)" required error={errOf("Price")}>
              <input
                type="text" inputMode="decimal" value={moneyDisplay(form.Price)}
                onChange={handleMoneyChange("Price")} onKeyDown={blockNegativeKeys}
                className={inputCls(errOf("Price"))} placeholder="5,900" />
            </FormField>
            <FormField label="ส่วนลด (บาท)" optional error={errOf("Discount") || errors.Discount}>
              <input
                type="text" inputMode="decimal" value={moneyDisplay(form.Discount)}
                onChange={handleMoneyChange("Discount")} onKeyDown={blockNegativeKeys}
                className={inputCls(errors.Discount)} placeholder="0" />
            </FormField>
            <FormField label="ราคาสุทธิ" hint="คำนวณอัตโนมัติ (ราคาเต็ม − ส่วนลด)">
              <div className="h-10 flex items-center px-3 bg-orange-50 border border-orange-200 rounded-xl text-sm font-bold text-orange-600 tabular-nums">
                ฿{formatPrice(fullCost)}
              </div>
            </FormField>
          </div>

          <FormField label="จำนวนที่รับสูงสุด (คน)" optional hint="เว้นว่าง = ไม่จำกัดจำนวน">
            <input
              type="number" min="0" step="1" value={form.MaxStudents}
              onKeyDown={blockNegativeKeys}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (/^\d*$/.test(v) && Number(v) >= 0)) set("MaxStudents", v);
              }}
              className={`${inputCls()} sm:max-w-xs`} placeholder="ไม่จำกัด" />
          </FormField>
        </FormSection>

        <FormSection title="การผ่อนชำระ" subtitle="ไม่บังคับ — ค่าเริ่มต้นคือจ่ายครั้งเดียว">
          <FormField label="จำนวนงวด" optional>
            <input
              type="number" min="0" step="1" value={form.Installments}
              onKeyDown={blockNegativeKeys}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (/^\d*$/.test(v) && Number(v) >= 0)) {
                  set("Installments", v);
                  // ★ เมื่อจำนวนงวดเปลี่ยน ล้างยอดผ่อนเดิมทิ้ง (ให้ระบบแบ่งเท่า ๆ กันใหม่ ป้องกัน mismatch)
                  set("InstallmentAmounts", null);
                }
              }}
              className={`${inputCls()} sm:max-w-xs`} />
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className={`${BADGE_BASE} ${isInstallmentEnabled ? BADGE_TONE.info : BADGE_TONE.neutral}`}>
                {isInstallmentEnabled ? `ผ่อน ${installmentsCount} งวด` : "จ่ายครั้งเดียว"}
              </span>
              {isInstallmentEnabled && (
                <span className="text-[11px] text-slate-500">
                  ฿{formatPrice(calculatedInstallmentAmount)}/งวด (ค่าเริ่มต้น)
                </span>
              )}
            </div>
            {/* ★ เพิ่ม (ข้อ 5): แนะนำจำนวนงวดผ่อนสูงสุดที่เหมาะสมจากระยะเวลาคอร์ส แสดงเฉพาะตอนเปิดผ่อน */}
            {isInstallmentEnabled && monthsSpanned > 0 && (
              <p className="text-[11px] text-blue-600 mt-1.5 flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" />
                ระยะเวลาคอร์สประมาณ {monthsSpanned} เดือน แนะนำผ่อนได้ไม่เกิน {monthsSpanned} งวด
              </p>
            )}
          </FormField>

          {isInstallmentEnabled && (
            <FormField label="ยอดผ่อนแต่ละงวด" required error={errOf("installments")} hint="ยอดรวมทุกงวดต้องเท่ากับราคาสุทธิ">
              <InstallmentAmountsEditor
                installments={installmentsCount}
                fullCost={fullCost}
                value={form.InstallmentAmounts}
                onChange={(v) => set("InstallmentAmounts", v)}
              />
            </FormField>
          )}
        </FormSection>

        {/* เครื่องมือช่วยคำนวณ — แยกออกจากช่องกรอกข้อมูลชัดเจน ไม่มีผลต่อการบันทึก */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setShowHelper((v) => !v)}
            aria-expanded={showHelper}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200">
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-700">เครื่องมือช่วยตั้งราคา <span className="text-xs font-normal text-slate-400">(ไม่บังคับ)</span></span>
                <span className="block text-xs text-slate-500">วิเคราะห์กำไรและจุดคุ้มทุนจากต้นทุนติวเตอร์ — ไม่มีผลต่อการบันทึก</span>
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${showHelper ? "rotate-180" : ""}`} />
          </button>
          {showHelper && (
            <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4">
              {totalTutorCost > 0 ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">วิเคราะห์กำไร</p>
                    <PricingCalculator
                      tutorCost={totalTutorCost}
                      currentPrice={fullCost}
                      currentStudentCount={currentStudentCount}
                      maxStudents={form.MaxStudents}
                      onApplyPrice={(targetNetPrice) => {
                        const discount = Number(form.Discount || 0);
                        set("Price", String(targetNetPrice + discount));
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">วิเคราะห์ความคุ้มทุน (Break-even)</p>
                    <BreakEvenAnalysis
                      tutorCost={totalTutorCost}
                      fullCost={fullCost}
                      currentStudentCount={currentStudentCount}
                      maxStudents={form.MaxStudents}
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  เพิ่มวิชาและติวเตอร์ในขั้น “วิชาและติวเตอร์” ก่อน จึงจะคำนวณกำไรและจุดคุ้มทุนได้
                  <button type="button" onClick={() => goTo(1)} className="ml-1 font-semibold text-orange-600 hover:underline">ไปที่ขั้นนั้น</button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ ขั้นที่ 4: นักเรียน ═══ */}
      <div className={step === 3 ? "space-y-4" : "hidden"}>
        <div className={`${CALLOUT.box} ${CALLOUT.info}`}>
          <Info className={`h-5 w-5 shrink-0 ${CALLOUT_ICON.info}`} />
          <p>ขั้นนี้ไม่บังคับ — เพิ่มนักเรียนภายหลังได้ นักเรียนจะถูกเพิ่มเข้าคอร์สเมื่อสถานะเป็น เปิดรับสมัคร หรือ กำลังสอน</p>
        </div>
        <FormSection title="นักเรียนในคอร์ส">
          {isEdit
            ? <CourseStudents courseId={initial.CourseID} courseStatusId={form.Status_Course_Id} showToast={showToast} onCountChange={setExistingStudentCount} />
            : <PendingStudentPicker items={pendingStudents} onChange={setPendingStudents} statusCourseId={form.Status_Course_Id} showToast={showToast} />}
        </FormSection>
      </div>

      {/* ═══ ขั้นที่ 5: สื่อประกอบ ═══ */}
      <div className={step === 4 ? "space-y-4" : "hidden"}>
        <FormSection title="รูปภาพ" subtitle="ไม่บังคับ — แนะนำให้ใส่รูปปกเพื่อแสดงบนหน้าเว็บไซต์">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="รูปปกคอร์ส" optional>
              <ImageUpload value={form.CourseImage || ""} onChange={(path) => set("CourseImage", path)} />
            </FormField>
            <FormField label="รูปประกาศ" optional hint="ใช้สำหรับแบนเนอร์/ประกาศ แยกจากรูปปกคอร์ส">
              <ImageUpload value={form.AnnouncementImage || ""} onChange={(path) => set("AnnouncementImage", path)} />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="คลิปตัวอย่าง" subtitle="ไม่บังคับ">
          {isEdit ? (
            <CoursePreviewVideos courseId={initial.CourseID} showToast={showToast} />
          ) : (
            <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500">บันทึกคอร์สก่อน จึงจะเพิ่มคลิปตัวอย่างได้ (เปิดแก้ไขคอร์สภายหลัง)</p>
            </div>
          )}
        </FormSection>
      </div>

      {/* ═══ ขั้นที่ 6: ตรวจสอบและบันทึก ═══ */}
      <div className={step === lastStep ? "space-y-4" : "hidden"}>
        {hasAnyError ? (
          <div className={`${CALLOUT.box} ${CALLOUT.danger}`}>
            <AlertTriangle className={`h-5 w-5 shrink-0 ${CALLOUT_ICON.danger}`} />
            <div className="min-w-0 space-y-1.5">
              <p className="font-semibold">ยังบันทึกไม่ได้ — มีข้อมูลที่ต้องแก้ไข {errorKeys.length} รายการ</p>
              <ul className="space-y-1">
                {errorKeys.map((k) => (
                  <li key={k} className="flex flex-wrap items-center gap-x-2 text-xs">
                    <span>• {errors[k]}</span>
                    <button type="button" onClick={() => goTo(COURSE_ERROR_STEP[k])} className="font-semibold underline hover:no-underline">
                      แก้ไขที่ขั้น “{COURSE_FORM_STEPS[COURSE_ERROR_STEP[k]].label}”
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className={`${CALLOUT.box} ${CALLOUT.success}`}>
            <Check className={`h-5 w-5 shrink-0 ${CALLOUT_ICON.success}`} />
            <p>ข้อมูลที่จำเป็นครบถ้วนแล้ว ตรวจสอบรายละเอียดด้านล่าง แล้วกด “{isEdit ? "บันทึกการแก้ไข" : "สร้างคอร์ส"}”</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summaryGroups.map((g) => (
            <section key={g.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <header className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-slate-800">{g.title}</h4>
                <button type="button" onClick={() => goTo(g.step)} className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                  <Pencil className="h-3 w-3" /> แก้ไข
                </button>
              </header>
              <dl className="divide-y divide-slate-100">
                {g.rows.map((r) => (
                  <div key={r.label} className="flex items-start justify-between gap-3 py-1.5 text-xs">
                    <dt className="text-slate-500 shrink-0">{r.label}</dt>
                    <dd className={`text-right font-medium min-w-0 break-words ${r.err ? "text-red-600" : "text-slate-800"}`}>
                      {r.err ? r.err : (r.value ?? dash)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        {isEdit && (
          <>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`${BTN.base} ${BTN.secondary} ${BTN.md} w-full`}
            >
              <Eye className="h-4 w-4" /> ดูตัวอย่างหน้าคอร์ส (มุมมองนักเรียน)
            </button>
            {showPreview && <StudentPreviewModal course={initial} onClose={() => setShowPreview(false)} />}
          </>
        )}
      </div>

      {/* ═══ แถบปุ่มด้านล่าง (ติดด้านล่างขณะเลื่อน) ═══ */}
      <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2">
          {step === 0 ? (
            <button type="button" onClick={onCancel} disabled={isSubmitting} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>
              ยกเลิก
            </button>
          ) : (
            <button type="button" onClick={() => goTo(step - 1)} disabled={isSubmitting} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>
              <ChevronLeft className="h-4 w-4" /> ย้อนกลับ
            </button>
          )}

          <span className="flex-1 text-center text-xs text-slate-500 tabular-nums">
            ขั้นที่ {step + 1} จาก {COURSE_FORM_STEPS.length}
          </span>

          {isEdit && step !== lastStep && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || hasAnyError}
              title={hasAnyError ? "ยังมีข้อมูลที่ต้องแก้ไข" : "บันทึกการแก้ไขทั้งหมดโดยไม่ต้องไปขั้นสุดท้าย"}
              className={`${BTN.base} ${BTN.secondary} ${BTN.md} hidden sm:inline-flex`}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="h-4 w-4" />} บันทึกทันที
            </button>
          )}

          {step !== lastStep ? (
            <button type="button" onClick={handleNext} disabled={isSubmitting} className={`${BTN.base} ${BTN.primary} ${BTN.md}`}>
              ถัดไป <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || hasAnyError}
              className={`${BTN.base} ${BTN.primary} ${BTN.md}`}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> {isEdit ? "บันทึกการแก้ไข" : "สร้างคอร์ส"}</>}
            </button>
          )}
        </div>
        {isEdit && step !== lastStep && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || hasAnyError}
            className={`${BTN.base} ${BTN.ghost} ${BTN.sm} w-full mt-2 sm:hidden`}
          >
            <Check className="h-3.5 w-3.5" /> บันทึกทันที (ไม่ต้องไปขั้นสุดท้าย)
          </button>
        )}
        {stepHasError(step) && touchedSteps.has(step) && step !== lastStep && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> กรอกช่องที่มีเครื่องหมาย * ในขั้นนี้ให้ครบก่อนไปขั้นถัดไป
          </p>
        )}
      </div>
    </div>
  );
}

function PendingStudentPicker({ items, onChange, statusCourseId, showToast }) {
  const [allStudents, setAllStudents] = useState([]);
  const [search, setSearch] = useState("");
  const willBeBlocked = ![1, 2].includes(Number(statusCourseId));

  useEffect(() => {
    axios.get(`${API_BASE}/students`).then(r => setAllStudents(r.data));
  }, []);

  const filtered = allStudents.filter(s => {
    const name = (s.Nickname || `${s.Firstname} ${s.Lastname}`).toLowerCase();
    return !search || name.includes(search.toLowerCase()) || String(s.UserId).includes(search);
  });

  const toggle = (id) => {
    onChange(items.includes(id) ? items.filter(x => x !== id) : [...items, id]);
  };

  const remove = (id) => {
    onChange(items.filter(x => x !== id));
  };

  const toggleAll = () => {
    const filteredIds = filtered.map(s => String(s.UserId));
    const allSelected = filteredIds.every(id => items.includes(id));
    onChange(
      allSelected
        ? items.filter(id => !filteredIds.includes(id))
        : [...new Set([...items, ...filteredIds])]
    );
  };

  const selectedStudents = items
    .map(id => allStudents.find(s => String(s.UserId) === id))
    .filter(Boolean);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <p className="text-xs font-bold text-slate-600 uppercase">นักเรียนที่จะเพิ่ม ({items.length})</p>
      </div>

      {willBeBlocked && items.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            สถานะคอร์สที่เลือกไม่ใช่ "เปิดรับสมัคร/กำลังสอน" นักเรียนที่เลือกไว้จะยังไม่ถูกเพิ่มจนกว่าจะเปลี่ยนสถานะภายหลัง
          </p>
        </div>
      )}

      {selectedStudents.length > 0 && (
        <div className="divide-y divide-slate-100 border-b border-slate-200">
          {selectedStudents.map(s => (
            <div key={s.UserId} className="flex items-center gap-3 px-4 py-2 bg-orange-50/50">
              {/* ★ เพิ่ม (ข้อ 4): รูปโปรไฟล์นักเรียน */}
              <Avatar photo={s.Photo} />
              <span className="flex-1 text-sm font-medium text-slate-800">
                {s.Nickname || `${s.Firstname} ${s.Lastname}`}
              </span>
              <button
                type="button"
                onClick={() => remove(String(s.UserId))}
                className="p-1.5 lg:p-0 text-red-400 hover:text-red-600 transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center"
                title="เอาออก"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50">
        <input
          type="text"
          placeholder="ค้นหานักเรียน..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-2.5 h-10 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={toggleAll}
          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 whitespace-nowrap"
        >
          {filtered.length > 0 && filtered.every(s => items.includes(String(s.UserId)))
            ? "ยกเลิกทั้งหมด"
            : "เลือกทั้งหมด"}
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto px-4 space-y-1 py-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-3">ไม่พบนักเรียน</p>
        ) : (
          filtered.map(s => {
            const id = String(s.UserId);
            const checked = items.includes(id);
            return (
              <label
                key={id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm transition ${checked ? "bg-orange-100" : "hover:bg-slate-50"
                  }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="accent-orange-500" />
                {/* ★ เพิ่ม (ข้อ 4): รูปโปรไฟล์นักเรียนในรายการให้เลือก */}
                <Avatar photo={s.Photo} name={s.Nickname || `${s.Firstname} ${s.Lastname}`} seed={s.UserId} />
                <span className="flex-1 font-medium text-slate-700">
                  {s.Nickname || `${s.Firstname} ${s.Lastname}`}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Pending Subject Picker (สำหรับเลือกวิชาก่อนสร้างคอร์ส) ───────────────────
function PendingSubjectPicker({ items, onChange, showToast, totalCourseHours, monthsSpanned }) {
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ SubjectId: "", AdminId: "", TotalHours: "", TutorRatePerHourOverride: "", StudentRatePerHourOverride: "" });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingRateIndex, setEditingRateIndex] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/subjects`),
      axios.get(`${API_BASE}/tutors`),
    ]).then(([sRes, tRes]) => {
      setAllSubjects(sRes.data);
      setAllTutors(tRes.data);
    });
  }, []);

  const manualItems = items.filter(it => it.HoursIsManual);
  const nonManualItems = items.filter(it => !it.HoursIsManual);
  const manualHoursSum = manualItems.reduce((sum, it) => sum + Number(it.TotalHours || 0), 0);
  const remainingForSuggestion = Number(totalCourseHours || 0) - manualHoursSum;
  const suggestedPerItem = totalCourseHours && nonManualItems.length > 0
    ? remainingForSuggestion / nonManualItems.length
    : null;
  const hasSuggestion = suggestedPerItem !== null && nonManualItems.length > 0 &&
    nonManualItems.some(it => Number(it.TotalHours || 0).toFixed(2) !== Number(suggestedPerItem).toFixed(2));

  const applySuggestedToAll = () => {
    if (suggestedPerItem === null) return;
    onChange(items.map(it => it.HoursIsManual ? it : { ...it, TotalHours: suggestedPerItem }));
    if (showToast) showToast("success", `ใช้ค่าที่แนะนำ (${suggestedPerItem.toFixed(1)} ชม./วิชา) กับ ${nonManualItems.length} วิชาแล้ว`);
  };

  const add = () => {
    if (!newRow.SubjectId || !newRow.AdminId) {
      if (showToast) return showToast("error", "กรุณาเลือกวิชาและติวเตอร์");
      return toast("กรุณาเลือกวิชาและติวเตอร์");
    }
    if (!isValidRatePair(newRow.TutorRatePerHourOverride, newRow.StudentRatePerHourOverride)) {
      const msg = "ราคาขายต่อชั่วโมงต้องไม่น้อยกว่าค่าติวเตอร์ต่อชั่วโมง (จะขาดทุน)";
      if (showToast) return showToast("error", msg);
      return toast(msg);
    }
    const willBeManual = newRow.TotalHours !== "" && newRow.TotalHours !== null;
    let hoursToUse = willBeManual ? Number(newRow.TotalHours) : 0;
    if (!willBeManual && totalCourseHours) {
      const futureNonManualCount = nonManualItems.length + 1;
      const suggestion = (Number(totalCourseHours) - manualHoursSum) / futureNonManualCount;
      hoursToUse = suggestion > 0 ? suggestion : 0;
    }
    onChange([...items, { ...newRow, TotalHours: hoursToUse, HoursIsManual: willBeManual }]);
    setNewRow({ SubjectId: "", AdminId: "", TotalHours: "", TutorRatePerHourOverride: "", StudentRatePerHourOverride: "" });
  };

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateHours = (index, hours) => {
    onChange(items.map((it, i) => i === index ? { ...it, TotalHours: hours, HoursIsManual: true } : it));
    setEditingIndex(null);
  };

  const updateRate = (index, tutorRate, studentRate) => {
    const current = items[index];
    const effectiveTutor = tutorRate !== undefined ? tutorRate : current.TutorRatePerHourOverride;
    const effectiveStudent = studentRate !== undefined ? studentRate : current.StudentRatePerHourOverride;
    if (!isValidRatePair(effectiveTutor, effectiveStudent)) {
      if (showToast) showToast("error", "ราคาขายต่อชั่วโมงต้องไม่น้อยกว่าค่าติวเตอร์ต่อชั่วโมง (จะขาดทุน)");
      return false;
    }
    onChange(items.map((it, i) => i === index ? {
      ...it,
      TutorRatePerHourOverride: tutorRate !== undefined ? tutorRate : it.TutorRatePerHourOverride,
      StudentRatePerHourOverride: studentRate !== undefined ? studentRate : it.StudentRatePerHourOverride,
    } : it));
    setEditingRateIndex(null);
    return true;
  };

  const inp = "px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] outline-none";

  // ★ options สำหรับ AvatarSelect (ข้อ 4)
  const tutorOptions = allTutors.map(t => ({
    id: t.AdminId,
    label: t.Nickname || `${t.Firstname} ${t.Lastname}`,
    Photo: t.Photo,
  }));

  return (
    <div className="border border-slate-200 rounded-xl overflow-visible">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center rounded-t-xl">
        <p className="text-xs font-bold text-slate-600 uppercase">วิชาที่จะเพิ่ม ({items.length})</p>
      </div>

      {/* ★ แก้ (ข้อ 6): ย่อข้อความแนะนำแบ่งชั่วโมงให้สั้นแต่ยังสื่อความ */}
      {hasSuggestion && (
        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
          <p className="text-[11px] text-blue-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            แบ่งชั่วโมงที่เหลือ ({formatHoursLabel(remainingForSuggestion)}) เท่า ๆ กันอัตโนมัติ —
            วิชาละ <span className="font-bold">{formatHoursLabel(suggestedPerItem)}</span>
          </p>
          <button onClick={applySuggestedToAll}
            className={`${BTN.primary} shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1`}>
            <Check className="h-3 w-3" /> ใช้ค่าที่แนะนำทั้งหมด
          </button>
        </div>
      )}

      {items.map((it, idx) => {
        const subj = allSubjects.find(s => String(s.SubjectId) === String(it.SubjectId));
        const tut = allTutors.find(t => String(t.AdminId) === String(it.AdminId));
        const avgPerMonthLabel = formatAvgPerMonth(it.TotalHours, monthsSpanned);
        return (
          <div key={idx} className="border-b border-slate-100 last:border-0 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2">
                {/* ★ เพิ่ม (ข้อ 4): รูปโปรไฟล์ติวเตอร์ */}
                <Avatar photo={tut?.Photo} size="w-8 h-8" name={tut ? (tut.Nickname || `${tut.Firstname} ${tut.Lastname}`) : undefined} seed={tut?.AdminId} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {subj ? subj.SubjectName : "วิชา (ไม่พบข้อมูล)"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tut ? (tut.Nickname || `${tut.Firstname} ${tut.Lastname}`) : "ติวเตอร์ (ไม่พบข้อมูล)"}
                  </p>
                </div>
              </div>
              <button onClick={() => remove(idx)}
                className="shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center" title="ลบ">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {editingRateIndex === idx ? (
                <RateInlineEdit
                  tutorRate={it.TutorRatePerHourOverride}
                  studentRate={it.StudentRatePerHourOverride}
                  onSave={(t, st) => updateRate(idx, t, st)}
                  onCancel={() => setEditingRateIndex(null)}
                />
              ) : (
                <button type="button" onClick={() => setEditingRateIndex(idx)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 hover:border-orange-300 hover:text-orange-600 transition shrink-0">
                  เรทปัจจุบัน {it.TutorRatePerHourOverride || "-"}/ชม. · ใหม่ {it.StudentRatePerHourOverride || "-"}/ชม.
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              <div className="shrink-0 ml-auto">
                {editingIndex === idx ? (
                  <HoursInlineEdit
                    value={it.TotalHours}
                    onSave={(hours) => updateHours(idx, hours)}
                    onCancel={() => setEditingIndex(null)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">
                        {formatHoursLabel(it.TotalHours || 0)} {!it.HoursIsManual && totalCourseHours ? <span className="text-blue-400">(ค่าเริ่มต้น)</span> : null}
                      </span>
                      {avgPerMonthLabel && <span className="text-[11px] text-slate-500 block">{avgPerMonthLabel}</span>}
                    </div>
                    <button onClick={() => setEditingIndex(idx)}
                      className="p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center" title="แก้ไขชั่วโมง">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-orange-50 rounded-b-xl">
        <select
          value={newRow.SubjectId}
          onChange={e => setNewRow(r => ({ ...r, SubjectId: e.target.value }))}
          className={inp + " flex-1"}
        >
          <option value="">เลือกวิชา</option>
          {allSubjects.map(s => <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>)}
        </select>

        {/* ★ แก้ (ข้อ 4): ใช้ AvatarSelect แทน select ธรรมดา เพื่อโชว์รูปติวเตอร์ */}
        <AvatarSelect
          options={tutorOptions}
          value={newRow.AdminId}
          placeholder="เลือกติวเตอร์"
          onChange={(adminId) => {
            const tutor = allTutors.find(t => String(t.AdminId) === adminId);
            setNewRow(r => ({
              ...r,
              AdminId: adminId,
              TutorRatePerHourOverride: r.TutorRatePerHourOverride || (tutor?.RatePerTutors ?? ""),
            }));
          }}
        />

        <input
          type="number" min="0" step="1"
          placeholder="ชม. (ว่าง=แนะนำอัตโนมัติ)"
          value={newRow.TotalHours}
          onKeyDown={blockNegativeKeys}
          onChange={e => {
            const v = e.target.value;
            if (v === "" || (/^\d*$/.test(v) && Number(v) >= 0)) setNewRow(r => ({ ...r, TotalHours: v }));
          }}
          className={inp + " w-40"}
        />
        <input
          type="number" min="0" step="1"
          placeholder="เรทปัจจุบัน/ชม."
          value={newRow.TutorRatePerHourOverride}
          onKeyDown={blockNegativeKeys}
          onChange={e => setNewRow(r => ({ ...r, TutorRatePerHourOverride: e.target.value }))}
          className={inp + " w-24"}
        />
        <input
          type="number" min="0" step="1"
          placeholder="ใหม่/ชม."
          value={newRow.StudentRatePerHourOverride}
          onKeyDown={blockNegativeKeys}
          onChange={e => setNewRow(r => ({ ...r, StudentRatePerHourOverride: e.target.value }))}
          className={inp + " w-24"}
        />

        <button aria-label="เพิ่ม" onClick={add} className={`${BTN.primary} px-3 py-2 rounded-xl text-xs font-bold transition`}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {totalCourseHours > 0 && newRow.TotalHours === "" && (
        <p className="px-4 pb-2 text-[11px] text-blue-500 flex items-center gap-1">
          <Info className="h-3 w-3" /> เว้นว่างไว้ ระบบจะแบ่งชั่วโมงที่เหลือให้เท่า ๆ กันโดยอัตโนมัติ (แก้ไขภายหลังได้เสมอ)
        </p>
      )}

      {!isValidRatePair(newRow.TutorRatePerHourOverride, newRow.StudentRatePerHourOverride) && (
        <p className="px-4 pb-2 text-[11px] text-red-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> ราคาขายต่ำกว่าค่าติวเตอร์ — คอร์สนี้จะขาดทุน{" "}
          {(Number(newRow.TutorRatePerHourOverride || 0) - Number(newRow.StudentRatePerHourOverride || 0)).toFixed(0)} บาท/ชม.
        </p>
      )}
    </div>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────
function CourseCard({ course, onEdit, onDelete, onStatusChange, statusOptions, onDuplicate }) {
  const status = STATUS_MAP[course.Status_Course_Id] || STATUS_MAP[4];
  const [imgErr, setImgErr] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative h-36 bg-gradient-to-br from-orange-50 to-amber-100 overflow-hidden">
        {course.CourseImage && !imgErr ? (
          <img
            src={getFileUrl(course.CourseImage)}
            alt={course.CourseName}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-14 w-14 text-orange-300" />
          </div>
        )}

        <select
          value={course.Status_Course_Id}
          onChange={async (e) => {
            await axios.patch(`${API_BASE}/courses/${course.CourseID}/status`, {
              Status_Course_Id: Number(e.target.value)
            });
            onStatusChange();
          }}
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer ${status.color}`}
          onClick={(e) => e.stopPropagation()}
        >
          {statusOptions.map((s) => (
            <option key={s.Status_Course_Id} value={s.Status_Course_Id}>
              {s.Status_Course_Name}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-3 line-clamp-2">
          {course.CourseName}
        </h3>

        <div className="space-y-1.5 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-orange-400" />
            <span>{formatDate(course.StartDate)} – {formatDate(course.LastDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-green-500 text-sm">฿</span>
            <span className="font-bold text-green-700 text-sm">{formatPrice(course.FullCost || course.Price)} บาท</span>
            {Number(course.Discount) > 0 && (
              <span className="line-through text-slate-400">{formatPrice(course.Price)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span>{course.StudentCount || 0} นักเรียน</span>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {Number(course.Is_Promotion) === 1 && (
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-xs font-semibold shadow-sm">
              <Sparkles className="h-3 w-3" /> โปรโมชัน
            </span>
          )}
          {course.Term_Name && (
            <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-semibold">
              {course.Term_Name}
            </span>
          )}
          {course.Course_Type && (
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
              {course.Course_Type === "bundle" ? "คอร์สรวม" : "คอร์สเดี่ยว"}
            </span>
          )}
          {course.Course_Availability_Name && (
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
              {course.Course_Availability_Name}
            </span>
          )}
          {course.VideosFree > 0 && (
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
              ฟรี {course.VideosFree} คลิป
            </span>
          )}
          {course.Subjects && course.Subjects.split(",").map((s) => (
            <span key={s} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
              {s.trim()}
            </span>
          ))}
        </div>

        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
          <button
            onClick={() => onEdit(course)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 hover:border-orange-200 transition"
          >
            <Pencil className="h-3.5 w-3.5" /> แก้ไข
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center px-3 py-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition"
            title="Preview มุมมองนักเรียน"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button aria-label="ลบ"
            onClick={() => onDelete(course)}
            className="flex items-center justify-center px-3 py-2 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 hover:border-red-200 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDuplicate(course)}
            className="flex items-center justify-center px-3 py-2 text-xs font-bold text-blue-500 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition"
            title="ทำสำเนาคอร์ส"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>

        {showPreview && <StudentPreviewModal course={course} onClose={() => setShowPreview(false)} />}
      </div>
    </div >
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCoursesPage() {
  const { toasts, showToast, removeToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [termOptions, setTermOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);

  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all"); // "all" | Term_Id
  const [filterGrade, setFilterGrade] = useState("all"); // "all" | "none" | GradeLevelId
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [availabilityOptions, setAvailabilityOptions] = useState([]);
  const [gradeLevelOptions, setGradeLevelOptions] = useState([]);
  const [duplicatingCourse, setDuplicatingCourse] = useState(null);

  // แท็บบนสุด: คอร์สรวม (เรียนกลุ่ม) | คอร์สเดี่ยว (ตัวต่อตัว) — จำไว้ใน URL (?type=single)
  const [searchParams, setSearchParams] = useSearchParams();
  const courseTab = searchParams.get("type") === "single" ? "single" : "bundle";
  const setCourseTab = (t) => setSearchParams(t === "single" ? { type: "single" } : {}, { replace: true });
  const [dataVersion, setDataVersion] = useState(0);

  const fetchAll = async () => {
    try {
      const [cRes, sRes, tRes, yRes, aRes, gRes] = await Promise.all([
        axios.get(`${API_BASE}/courses`),
        axios.get(`${API_BASE}/status-course`),
        axios.get(`${API_BASE}/term`),
        axios.get(`${API_BASE}/year`),
        axios.get(`${API_BASE}/course-availability`),
        axios.get(`${API_BASE}/grade-levels`),
      ]);
      setCourses(cRes.data);
      setStatusOptions(sRes.data);
      setTermOptions(tRes.data);
      setYearOptions(yRes.data);
      setAvailabilityOptions(aRes.data);
      setGradeLevelOptions(gRes.data);
      setLoadError(false);
      setDataVersion((v) => v + 1);
    } catch (e) {
      console.error("Fetch error:", e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, filterTerm, filterGrade, filterAvailability]);

  const handleCreate = async (data) => {
    setIsSubmitting(true);
    const { pendingSubjects = [], pendingStudents = [], ...courseData } = data;
    try {
      const res = await axios.post(`${API_BASE}/courses`, courseData);
      const CourseID = res.data.CourseID;

      const subjectResults = await Promise.allSettled(
        pendingSubjects.map(s => axios.post(`${API_BASE}/courses/${CourseID}/subjects`, s))
      );
      const subjectFailed = subjectResults.filter(r => r.status === "rejected").length;

      const canEnrollNow = [1, 2].includes(Number(courseData.Status_Course_Id));
      const studentsSkippedDueToStatus = !canEnrollNow && pendingStudents.length > 0;
      let enrollFailed = 0;
      if (canEnrollNow && pendingStudents.length > 0) {
        const enrollRes = await axios.post(`${API_BASE}/enroll/bulk`, {
          UserIds: pendingStudents,
          CourseID,
        });
        enrollFailed = (enrollRes.data?.failed || []).length;
      }

      if (studentsSkippedDueToStatus) {
        showToast(
          "error",
          "สร้างคอร์สสำเร็จ แต่ยังไม่ได้เพิ่มนักเรียน",
          "เนื่องจากสถานะคอร์สไม่ใช่เปิดรับสมัคร/กำลังสอน กรุณาเปลี่ยนสถานะก่อนแล้วเพิ่มนักเรียนภายหลัง"
        );
      } else if (subjectFailed > 0 || enrollFailed > 0) {
        showToast("error", "สร้างคอร์สสำเร็จ แต่มีบางรายการเพิ่มไม่สำเร็จ",
          `วิชาที่ล้มเหลว: ${subjectFailed} · นักเรียนที่ล้มเหลว: ${enrollFailed}`
        );
      } else {
        showToast("success", "สร้างคอร์สสำเร็จ พร้อมครูและนักเรียนที่เลือกไว้");
      }
      setShowAddModal(false);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด", e.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    const { pendingSubjects, pendingStudents, ...courseData } = data;
    try {
      await axios.put(`${API_BASE}/courses/${editingCourse.CourseID}`, courseData)
      showToast("success", "แก้ไขข้อมูลคอร์สสำเร็จ");
      setEditingCourse(null);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด", e.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/courses/${deletingCourse.CourseID}`);
      showToast("success", "ลบข้อมูลคอร์สสำเร็จ");
      setDeletingCourse(null);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด", e.response?.data?.message);
    }
  };

  const handleDuplicate = (course) => {
    setDuplicatingCourse(course);
  };

  const confirmDuplicate = async ({ StartDate, LastDate }) => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE}/courses/${duplicatingCourse.CourseID}/duplicate`, { StartDate, LastDate });
      showToast("success", "ทำสำเนาคอร์สสำเร็จ");
      setDuplicatingCourse(null);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด", e.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // แท็บคอร์สรวมแสดงเฉพาะคอร์สเรียนกลุ่ม (คอร์สเดี่ยวอยู่อีกแท็บ)
  const groupCourses = courses.filter((c) => c.Course_Type !== "single");
  const singleCount = courses.length - groupCourses.length;
  const openManageCourse = (id) => {
    const c = courses.find((x) => Number(x.CourseID) === Number(id));
    if (c) setEditingCourse(c);
    else showToast("error", "ไม่พบคอร์สนี้", "ลองรีเฟรชหน้าอีกครั้ง");
  };

  // ตัวกรองรายการคอร์สรวม — นับจำนวนในแต่ละตัวเลือกโดยคิดจากตัวกรองอื่นที่เลือกอยู่
  const matchesFilters = (c, skip = "") => {
    const matchSearch = search === "" || c.CourseName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = skip === "status" || filterStatus === "all" || String(c.Status_Course_Id) === filterStatus;
    const matchTerm = skip === "term" || filterTerm === "all" || String(c.Term_Id) === filterTerm;
    const matchGrade = skip === "grade" || filterGrade === "all"
      || (filterGrade === "none" ? (c.GradeLevelId === null || c.GradeLevelId === undefined || c.GradeLevelId === "") : String(c.GradeLevelId) === filterGrade);
    const matchAvailability = filterAvailability === "all" || String(c.Course_Availability_Id) === filterAvailability;
    return matchSearch && matchStatus && matchTerm && matchGrade && matchAvailability;
  };

  const baseForStatusCount = groupCourses.filter((c) => matchesFilters(c, "status"));
  const allStatusCount = baseForStatusCount.length;
  const statusCounts = statusOptions.reduce((acc, s) => {
    acc[s.Status_Course_Id] = baseForStatusCount.filter(
      (c) => Number(c.Status_Course_Id) === Number(s.Status_Course_Id)
    ).length;
    return acc;
  }, {});

  // ช่วงเวลา/เทอม: ใช้ข้อมูลเทอมจริงจาก /term + เติมเทอมที่มีในคอร์สแต่ไม่อยู่ในรายการ (กันตกหล่น)
  const baseForTermCount = groupCourses.filter((c) => matchesFilters(c, "term"));
  const termFilterOptions = [...termOptions.map((t) => ({ id: String(t.Term_Id), name: t.Term_Name }))];
  groupCourses.forEach((c) => {
    if (c.Term_Id != null && !termFilterOptions.some((t) => t.id === String(c.Term_Id))) {
      termFilterOptions.push({ id: String(c.Term_Id), name: c.Term_Name || `เทอม ${c.Term_Id}` });
    }
  });
  const termCountOf = (id) => baseForTermCount.filter((c) => String(c.Term_Id) === id).length;

  // ระดับชั้น: ใช้รายการจาก /grade-levels + เติมระดับที่มีในคอร์สแต่ไม่อยู่ในรายการ
  const baseForGradeCount = groupCourses.filter((c) => matchesFilters(c, "grade"));
  const gradeFilterOptions = [...gradeLevelOptions.map((g) => ({ id: String(g.GradeLevelId), name: g.GradeDetail }))];
  groupCourses.forEach((c) => {
    if (c.GradeLevelId != null && c.GradeLevelId !== "" && !gradeFilterOptions.some((g) => g.id === String(c.GradeLevelId))) {
      gradeFilterOptions.push({ id: String(c.GradeLevelId), name: c.GradeLevelDetail || `ระดับชั้น ${c.GradeLevelId}` });
    }
  });
  const gradeCountOf = (id) => baseForGradeCount.filter((c) => String(c.GradeLevelId) === id).length;
  const noGradeCount = baseForGradeCount.filter((c) => c.GradeLevelId === null || c.GradeLevelId === undefined || c.GradeLevelId === "").length;

  const filtered = groupCourses.filter((c) => matchesFilters(c));

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalStudents = [...new Map(groupCourses.map((c) => [c.CourseID, c])).values()]
    .reduce((s, c) => s + Number(c.StudentCount || 0), 0);

  const activeStatusId = statusOptions.find((s) => s.Status_Course_Name === "กำลังสอน")?.Status_Course_Id;
  const closedStatusId = statusOptions.find((s) => s.Status_Course_Name === "ปิดคอร์ส")?.Status_Course_Id;

  const activeCourses = groupCourses.filter((c) => Number(c.Status_Course_Id) === Number(activeStatusId)).length;
  const closedCourses = groupCourses.filter((c) => Number(c.Status_Course_Id) === Number(closedStatusId)).length;

  if (loading)
    return (
      <Spinner block label="กำลังโหลดข้อมูลคอร์ส..." />
    );
  if (loadError && courses.length === 0) return <div className="px-4 lg:px-0"><UIErrorState description="โหลดข้อมูลคอร์สไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" onRetry={() => { setLoading(true); fetchAll(); }} /></div>;

  return (
    <div className="space-y-6 px-4 lg:px-0">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* ── Header: ชื่อหน้า (ซ้าย) + ตัวสลับประเภทคอร์ส/ปุ่มหลัก (ขวา) — รูปแบบเดียวกับหน้าการเงิน ── */}
      <PageHeader title="จัดการคอร์สเรียน" subtitle="จัดการคอร์สรวมและคอร์สเดี่ยวของสถาบัน">
        <SegmentedControl stretchMobile value={courseTab} onChange={setCourseTab} options={[
          { id: "bundle", label: "คอร์สรวม", icon: LuUsersRound, count: groupCourses.length },
          { id: "single", label: "คอร์สเดี่ยว", icon: LuUserRoundCheck, count: singleCount },
        ]} />
        {courseTab === "bundle" && (
          <button
            onClick={() => setShowAddModal(true)}
            className={`${BTN.primary} flex items-center justify-center gap-2 px-4 h-10 rounded-xl font-bold transition text-sm shadow-lg shadow-orange-500/20`}
          >
            <Plus className="h-4 w-4" /> เพิ่มคอร์ส
          </button>
        )}
      </PageHeader>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50/60 to-white border border-orange-100 p-5 sm:p-6">
        <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-700 px-2.5 py-1 text-[11px] font-bold">
            <BookOpen className="h-3.5 w-3.5" /> คลังคอร์สเรียน
          </span>
          <h2 className="mt-2 text-lg font-bold text-slate-900">{courseTab === "single" ? "คอร์สเดี่ยว" : "คอร์สรวม"}</h2>
          <p className={PAGE_SUBTITLE}>
            {courseTab === "single"
              ? "เรียนตัวต่อตัว 1 วิชาต่อนักเรียน 1 คน ไม่เปิดจำหน่ายบนเว็บไซต์ ผู้สนใจต้องติดต่อสถาบันเพื่อประเมินก่อน"
              : "คอร์สเรียนกลุ่มที่เปิดจำหน่ายบนเว็บไซต์ เพิ่ม แก้ไข และจัดการคอร์สได้ที่หน้านี้"}
          </p>
        </div>
      </div>

      {courseTab === "single" ? (
        <PrivateCoursesPanel onManageCourse={openManageCourse} version={dataVersion} onDataChanged={fetchAll} />
      ) : (<>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "คอร์สรวมทั้งหมด", value: groupCourses.length, icon: BookOpen, color: "bg-orange-500" },
          { label: "คอร์สที่กำลังสอน", value: activeCourses, icon: Check, color: "bg-green-500" },
          { label: "คอร์สที่เลิกสอน", value: closedCourses, icon: X, color: "bg-slate-400" },
        ].map(({ label, value, icon, color }, i) => (
          <StatTile key={i} label={label} value={value} icon={icon} color={color} unit="คอร์ส" />
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:flex-wrap gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อคอร์ส..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[160px] max-w-full md:max-w-[240px] truncate"
          >
            <option value="all">สถานะทั้งหมด ({allStatusCount})</option>
            {statusOptions.map((s) => (
              <option key={s.Status_Course_Id} value={s.Status_Course_Id}>
                {s.Status_Course_Name} ({statusCounts[s.Status_Course_Id] || 0})
              </option>
            ))}
          </select>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            aria-label="กรองตามระดับชั้น"
            className="px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[160px] max-w-full md:max-w-[240px] truncate"
          >
            <option value="all">ทุกระดับชั้น ({baseForGradeCount.length})</option>
            {gradeFilterOptions.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({gradeCountOf(g.id)})</option>
            ))}
            {noGradeCount > 0 && <option value="none">ไม่ระบุระดับชั้น ({noGradeCount})</option>}
          </select>
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            aria-label="กรองตามช่วงเวลา/เทอม"
            className="px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[160px] max-w-full md:max-w-[240px] truncate"
          >
            <option value="all">ทุกช่วงเวลา ({baseForTermCount.length})</option>
            {termFilterOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({termCountOf(t.id)})</option>
            ))}
          </select>
        </div>
        <div className="mt-2 pl-1 flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">แสดง {filtered.length} จาก {groupCourses.length} คอร์ส</p>
          <ClearFiltersButton show={!!search || filterStatus !== "all" || filterTerm !== "all" || filterGrade !== "all" || filterAvailability !== "all"}
            onClick={() => { setSearch(""); setFilterStatus("all"); setFilterTerm("all"); setFilterGrade("all"); setFilterAvailability("all"); }} />
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-6 py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50"><LuBookOpen className="h-7 w-7 text-orange-400" /></div>
          <p className="text-base font-semibold text-slate-700">ไม่พบคอร์สเรียนที่ค้นหา</p>
          <p className="mt-1 text-sm text-slate-500">โปรดปรับคำค้นหาหรือตัวกรอง</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {paginated.map((course) => (
            <CourseCard
              key={course.CourseID}
              course={course}
              onEdit={(c) => setEditingCourse(c)}
              onDelete={(c) => setDeletingCourse(c)}
              onStatusChange={fetchAll}
              statusOptions={statusOptions}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      <UIPagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={ITEMS_PER_PAGE} unit="คอร์ส" onChange={setCurrentPage} />
      </>)}

      {showAddModal && (
        <Modal title="เพิ่มคอร์สใหม่" icon={Plus} onClose={() => setShowAddModal(false)}>
          <CourseForm
            onSave={handleCreate}
            onCancel={() => setShowAddModal(false)}
            isSubmitting={isSubmitting}
            statusOptions={statusOptions}
            termOptions={termOptions}
            yearOptions={yearOptions}
            availabilityOptions={availabilityOptions}
            gradeLevelOptions={gradeLevelOptions}
            showToast={showToast}
          />
        </Modal>
      )}

      {editingCourse && (
        <Modal title={editingCourse.CourseName || "แก้ไขคอร์ส"} icon={Pencil} onClose={() => setEditingCourse(null)}>
          <CourseForm
            initial={editingCourse}
            onSave={handleUpdate}
            onCancel={() => setEditingCourse(null)}
            isSubmitting={isSubmitting}
            statusOptions={statusOptions}
            termOptions={termOptions}
            yearOptions={yearOptions}
            availabilityOptions={availabilityOptions}
            gradeLevelOptions={gradeLevelOptions}
            showToast={showToast}
          />
        </Modal>
      )}

      {deletingCourse && (
        <ConfirmDialog
          course={deletingCourse}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCourse(null)}
        />
      )}

      {duplicatingCourse && (
        <DuplicateCourseModal
          course={duplicatingCourse}
          onConfirm={confirmDuplicate}
          onCancel={() => setDuplicatingCourse(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}