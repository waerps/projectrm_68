import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import {
  BookOpen, Plus, Search, Edit2, Trash2, X, Check,
  Calendar, DollarSign, Users, Tag, Filter,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2, ImagePlus,
  ToggleLeft, ToggleRight, Info, AlertTriangle, Sparkles, Copy,
  Pencil, Eye, Youtube, FolderOpen, UploadCloud, Video, PlayCircle, Link as LinkIcon,
  BadgeCheck,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = `${API_URL}/api/admin`;
const ITEMS_PER_PAGE = 9;

const STATUS_MAP = {
  1: { label: "เปิดรับสมัคร", color: "bg-blue-100 text-blue-700 border-blue-200" },
  2: { label: "กำลังสอน", color: "bg-green-100 text-green-700 border-green-200" },
  3: { label: "ปิดรับสมัคร", color: "bg-amber-100 text-amber-700 border-amber-200" },
  4: { label: "ปิดคอร์ส", color: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

// ★ Mapping ตัวกรองเทอม อ้างอิงตาราง term จริง:
// 1 = เปิดเทอม 1 (4 เดือน) | 2 = ตุลาคม (ปิดเทอมเล็ก) | 3 = เปิดเทอม 2 | 4 = ปิดเทอมใหญ่
const TERM_FILTERS = [
  { key: "all", label: "ทุกเทอม", termId: null },
  { key: "term1", label: "เทอม 1", termId: 1 },
  { key: "term2", label: "เทอม 2", termId: 3 },
  { key: "smallbreak", label: "ปิดเทอมเล็ก", termId: 2 },
  { key: "bigbreak", label: "ปิดเทอมใหญ่", termId: 4 },
];

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

// ★ แปลงชั่วโมงทศนิยม (เช่น 24.5) เป็นข้อความอ่านง่าย เช่น "24 ชม. 30 นาที"
const formatHoursLabel = (decimalHours) => {
  const total = Number(decimalHours || 0);
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  if (m === 0) return `${h} ชม.`;
  return `${h} ชม. ${m} นาที`;
};

// ★ helper: แปลง input ที่มี comma กลับเป็นตัวเลขดิบ + กันค่าติดลบ
const sanitizeMoneyInput = (raw) => {
  const cleaned = String(raw).replace(/,/g, "").replace(/[^0-9]/g, "");
  return cleaned;
};
const blockNegativeKeys = (e) => {
  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

// ─── Modal Overlay ────────────────────────────────────────────────────────────
function Modal({ onClose, children, title, icon: Icon }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0 bg-gradient-to-r from-orange-50 to-amber-50">
          <h3 className="flex items-center gap-2.5 text-base font-bold text-neutral-800 truncate pr-4">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 shadow-sm shrink-0">
                <Icon className="h-4 w-4 text-white" />
              </span>
            )}
            <span className="truncate">{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:bg-white hover:text-neutral-600 transition shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ course, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900">ยืนยันการลบคอร์ส</h3>
            <p className="text-xs text-neutral-400 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
          <p className="text-sm font-semibold text-red-800 truncate">{course?.CourseName}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 transition text-sm"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition text-sm"
          >
            ลบเลย
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
  // รองรับทั้งแบบ .../file/d/FILE_ID/view และ .../open?id=FILE_ID
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
    // upload (Cloudinary) — ไฟล์วิดีโอตรงๆ เล่นด้วย <video> ได้เลย
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
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900">
          <p className="text-sm font-bold text-white truncate pr-4">{VideoTitle}</p>
          <button onClick={onClose} className="p-1.5 rounded-xl text-neutral-400 hover:bg-white/10 hover:text-white transition shrink-0">
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
    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
      <p className="text-sm text-neutral-400">{message}</p>
    </div>
  );
}

// ─── Preview มุมมองนักเรียน (Modal) ───────────────────────────────────────────
function StudentPreviewModal({ course, onClose }) {
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [openIdx, setOpenIdx] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null); // ★ เพิ่ม

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
      // ถ้าเป็น URL เต็ม (http...) ใช้ตรงๆ, ถ้าเป็น path ที่อัปโหลดเอง ให้ผ่าน getFileUrl
      return /^https?:\/\//.test(v.Thumbnail) ? v.Thumbnail : getFileUrl(v.Thumbnail);
    }
    // fallback เผื่อข้อมูลเก่าที่ยังไม่มี Thumbnail
    if (v.VideoType === "youtube") {
      const m = v.VideoUrl?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
    }
    return null;
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-50 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 shrink-0">
              <Eye className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-sm font-bold text-neutral-800 leading-tight">พรีวิวมุมมองนักเรียน</p>
              <p className="text-[11px] text-neutral-400 leading-tight">แสดงตัวอย่างเท่านั้น ปุ่มบางส่วนใช้งานไม่ได้จริง</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="grid gap-5 md:grid-cols-12">
            {/* รูปหลัก */}
            <div className="md:col-span-5">
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-neutral-100">
                {course.CourseImage ? (
                  <img src={getFileUrl(course.CourseImage)} alt={course.CourseName} className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/10] w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
                    <BookOpen className="h-14 w-14 text-orange-300" />
                  </div>
                )}
              </div>
            </div>

            {/* ข้อมูลหลัก */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 leading-snug">{course.CourseName}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {course.Term_Name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
                      <BadgeCheck className="h-3.5 w-3.5 text-orange-500" /> {course.Term_Name}
                    </span>
                  )}
                  {Number(course.Discount) > 0 && (
                    <span className="rounded-full bg-red-50 text-red-600 px-2.5 py-1 text-[11px] font-bold">
                      ลด {formatPrice(course.Discount)} บาท
                    </span>
                  )}
                  {course.VideosFree > 0 && (
                    <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-[11px] font-bold">
                      ฟรี {course.VideosFree} คลิป
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-sm border border-neutral-100">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 font-bold">฿</span>
                  <div>
                    <div className="text-[11px] text-neutral-500">ค่าเรียน</div>
                    <div className="text-sm font-bold text-neutral-900">{formatPrice(course.FullCost || course.Price)} บาท</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-sm border border-neutral-100">
                  <Calendar className="h-5 w-5 text-orange-500 shrink-0" />
                  <div>
                    <div className="text-[11px] text-neutral-500">รอบเรียน</div>
                    <div className="text-sm font-bold text-neutral-900">{dateRange}</div>
                  </div>
                </div>
              </div>

              {/* ปุ่ม CTA — พรีวิว กดไม่ได้ */}
              <button
                type="button"
                disabled
                title="ปุ่มนี้ใช้งานไม่ได้ในโหมดพรีวิว"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-300 py-3 text-white font-bold cursor-not-allowed shadow-sm"
              >
                ซื้อคอร์สเรียน
                <span className="text-[10px] font-normal bg-white/25 px-2 py-0.5 rounded-full">พรีวิว</span>
              </button>
            </div>
          </div>

          {/* รายละเอียดคอร์ส */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
            <h3 className="mb-2.5 text-sm font-bold text-neutral-800">รายละเอียดคอร์ส</h3>
            <p className="text-sm text-neutral-600 whitespace-pre-line">
              {course.Remark?.trim() || "ไม่มีรายละเอียดเพิ่มเติม"}
            </p>
          </div>

          {/* คลิปวิดีโอเนื้อหาเพิ่มเติม */}
          {/* คลิปวิดีโอเนื้อหาเพิ่มเติม */}
          <div className="rounded-2xl bg-white shadow-sm border border-neutral-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-800">คลิปวิดีโอเนื้อหาเพิ่มเติม</h3>
            </div>
            {loadingVideos ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
              </div>
            ) : videos.length === 0 ? (
              <div className="px-5 py-4 text-sm text-neutral-500">ยังไม่มีคลิปเพิ่มเติม</div>
            ) : (
              videos.map((v, i) => (
                <div key={v.VideoId}>
                  <button
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                  >
                    <span className="text-sm font-medium text-neutral-800">{v.VideoTitle}</span>
                    {openIdx === i ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                  </button>
                  {openIdx === i && (
                    <div className="px-5 pb-4">
                      <button
                        type="button"
                        onClick={() => setPlayingVideo(v)}
                        className="relative w-full overflow-hidden rounded-xl bg-neutral-100 aspect-[16/9] flex items-center justify-center group cursor-pointer"
                      >
                        {getThumbnail(v) ? (
                          <img src={getThumbnail(v)} alt={v.VideoTitle} className="w-full h-full object-cover" />
                        ) : (
                          <PlayCircle className="h-10 w-10 text-neutral-300" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition">
                          <PlayCircle className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition" />
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
          ${uploading ? "border-orange-300 bg-orange-50" : value ? "border-green-300 bg-green-50" : "border-neutral-200 bg-neutral-50 hover:border-orange-300 hover:bg-orange-50"}`}
      >
        {value && !uploading && (
          <img src={getFileUrl(value)} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-25" onError={() => { }} />
        )}
        <div className="relative z-10 flex flex-col items-center gap-1 text-center">
          {uploading
            ? <><Loader2 className="h-7 w-7 text-orange-500 animate-spin" /><p className="text-xs text-orange-500 font-medium">กำลังอัปโหลด...</p></>
            : value
              ? <><Check className="h-7 w-7 text-green-600" /><p className="text-xs text-green-600 font-medium">อัปโหลดแล้ว</p></>
              : <><ImagePlus className="h-7 w-7 text-neutral-400" /><p className="text-xs text-neutral-500 font-medium">คลิกหรือลากไฟล์มาวาง</p><p className="text-[10px] text-neutral-400">JPG, PNG, WEBP · ไม่เกิน 5MB</p></>
          }
        </div>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      {value && !uploading && (
        <button type="button" onClick={() => onChange("")}
          className="text-xs text-neutral-400 hover:text-red-500 transition flex items-center gap-1">
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
        className="w-14 px-2 py-1 bg-white border border-orange-300 rounded-lg text-xs text-right focus:ring-2 focus:ring-orange-400 outline-none"
        autoFocus
      />
      <span className="text-xs text-neutral-400">ชม.</span>
      <input
        type="number" min="0" max="59" step="1" value={minutes}
        onChange={handleMinutesChange} onKeyDown={blockNegativeKeys}
        className="w-14 px-2 py-1 bg-white border border-orange-300 rounded-lg text-xs text-right focus:ring-2 focus:ring-orange-400 outline-none"
      />
      <span className="text-xs text-neutral-400">นาที</span>
      <button onClick={save} disabled={saving} className="p-1 text-green-500 hover:text-green-700 transition">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
      <button onClick={onCancel} disabled={saving} className="p-1 text-neutral-400 hover:text-red-500 transition">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function CourseSubjects({ courseId, showToast }) {
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newRow, setNewRow] = useState({ SubjectId: "", AdminId: "", TotalHours: "" });

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

  const handleAdd = async () => {
    if (!newRow.SubjectId || !newRow.AdminId) {
      return showToast("error", "กรุณาเลือกวิชาและติวเตอร์");
    }
    try {
      await axios.post(`${API_BASE}/courses/${courseId}/subjects`, newRow);
      setNewRow({ SubjectId: "", AdminId: "", TotalHours: "" });
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
      fetchSubjects();
    } catch (e) {
      showToast("error", e.response?.data?.message || "แก้ไขชั่วโมงไม่สำเร็จ");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/tutorcoursedetails/${id}`);
      fetchSubjects();
    } catch (e) { showToast("error", e.response?.data?.message || "ลบไม่สำเร็จ"); }
  };

  const inp = "px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none transition";

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">วิชาในคอร์สนี้</p>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition">
            <Plus className="h-3.5 w-3.5" /> เพิ่มวิชา
          </button>
        )}
      </div>

      {subjects.length === 0 && !adding && (
        <p className="text-xs text-neutral-400 text-center py-6">ยังไม่มีวิชาในคอร์สนี้</p>
      )}

      {subjects.map((s) => (
        <div key={s.TutorCourseDetailId} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-100 last:border-0">
          <span className="flex-1 text-sm font-semibold text-neutral-800">{s.SubjectName}</span>
          <span className="text-xs text-neutral-500">{s.Nickname || `${s.Firstname} ${s.Lastname}`}</span>
          {editingId === s.TutorCourseDetailId ? (
            <HoursInlineEdit
              value={s.TotalHours}
              onSave={(hours) => handleUpdateHours(s.TutorCourseDetailId, hours)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <span className="text-xs text-neutral-400 w-24 text-right">{formatHoursLabel(s.TotalHours)}</span>
              <button onClick={() => setEditingId(s.TutorCourseDetailId)}
                className="text-neutral-300 hover:text-orange-500 transition" title="แก้ไขชั่วโมง">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleDelete(s.TutorCourseDetailId)}
                className="text-red-400 hover:text-red-600 transition" title="ลบ">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      ))}

      {adding && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border-t border-orange-100">
          <select value={newRow.SubjectId} onChange={e => setNewRow(r => ({ ...r, SubjectId: e.target.value }))}
            className={inp + " flex-1"}>
            <option value="">เลือกวิชา</option>
            {allSubjects.map(s => <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>)}
          </select>
          <select value={newRow.AdminId} onChange={e => setNewRow(r => ({ ...r, AdminId: e.target.value }))}
            className={inp + " flex-1"}>
            <option value="">เลือกติวเตอร์</option>
            {allTutors.map(t => <option key={t.AdminId} value={t.AdminId}>{t.Nickname || `${t.Firstname} ${t.Lastname}`}</option>)}
          </select>
          <input
            type="number" min="0" step="1" placeholder="ชม." value={newRow.TotalHours}
            onKeyDown={blockNegativeKeys}
            onChange={e => {
              const v = e.target.value;
              if (v === "" || (/^\d*$/.test(v) && Number(v) >= 0)) setNewRow(r => ({ ...r, TotalHours: v }));
            }}
            className={inp + " w-20"} />
          <button onClick={handleAdd}
            className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setAdding(false)}
            className="px-3 py-2 bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-300 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function CourseStudents({ courseId, courseStatusId, showToast }) {
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

  const inp = "px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none transition";

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">นักเรียนในคอร์สนี้ ({students.length})</p>
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
        <p className="text-xs text-neutral-400 text-center py-6">ยังไม่มีนักเรียนในคอร์สนี้</p>
      )}

      {students.map(s => (
        <div key={s.EnrollId} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-100 last:border-0">
          <span className="flex-1 text-sm font-semibold text-neutral-800">
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
            className="text-red-400 hover:text-red-600 transition"
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
              <p className="text-xs text-neutral-400 text-center py-3">ไม่พบนักเรียนที่สามารถเพิ่มได้</p>
            ) : filtered.map(s => {
              const id = String(s.UserId);
              const checked = selectedIds.includes(id);
              return (
                <label key={id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm transition ${checked ? "bg-orange-100" : "hover:bg-white"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="accent-orange-500" />
                  <span className="flex-1 font-medium text-neutral-700">{s.Nickname || `${s.Firstname} ${s.Lastname}`}</span>
                </label>
              );
            })}
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-orange-100">
            <span className="text-xs text-neutral-500 flex-1">เลือกแล้ว {selectedIds.length} คน</span>
            <button onClick={handleAdd} disabled={saving || !selectedIds.length}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-50 transition flex items-center gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} เพิ่ม
            </button>
            <button onClick={() => { setAdding(false); setSelectedIds([]); setSearch(""); }}
              className="px-3 py-2 bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-300 transition">
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
  const [playingVideo, setPlayingVideo] = useState(null); // ★ เพิ่ม
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
    if (!confirm("ต้องการลบคลิปตัวอย่างนี้?")) return;
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

  const inp = "w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none";

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">
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
        <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-orange-400" /></div>
      ) : videos.length === 0 && !adding ? (
        <p className="text-xs text-neutral-400 text-center py-6">ยังไม่มีคลิปตัวอย่าง</p>
      ) : (
        videos.map(v => (
          <div key={v.VideoId} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-100 last:border-0">
            <button
              type="button"
              onClick={() => setPlayingVideo(v)}
              className="relative w-14 h-9 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0 group cursor-pointer"
              title="เล่นวิดีโอ"
            >
              {getThumbnail(v) ? (
                <img src={getThumbnail(v)} className="w-full h-full object-cover" />
              ) : (
                <PlayCircle className="h-5 w-5 text-neutral-300" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition">
                <PlayCircle className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-800 truncate">{v.VideoTitle}</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5
                ${v.VideoType === "youtube" ? "bg-red-50 text-red-500" : v.VideoType === "drive" ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"}`}>
                {v.VideoType === "youtube" ? <><Youtube className="h-3 w-3" /> YouTube</> : v.VideoType === "drive" ? <><FolderOpen className="h-3 w-3" /> Drive</> : <><Video className="h-3 w-3" /> ไฟล์อัปโหลด</>}
              </span>
            </div>
            <button onClick={() => startEdit(v)} className="text-neutral-300 hover:text-orange-500 transition shrink-0" title="แก้ไข">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => handleDelete(v.VideoId)} className="text-red-400 hover:text-red-600 transition shrink-0" title="ลบ">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))
      )}

      {adding && (
        <div className="p-4 bg-orange-50 border-t border-orange-100 space-y-3">
          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1">ชื่อคลิป</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inp} placeholder="เช่น ตัวอย่างการสอน EP.1" disabled={saving} />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1.5">แหล่งที่มาของวิดีโอ</label>
            <div className="flex gap-2">
              {[
                { key: "youtube", label: "YouTube", icon: Youtube },
                { key: "drive", label: "Google Drive", icon: FolderOpen },
                { key: "upload", label: "อัปโหลดไฟล์", icon: UploadCloud },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} type="button"
                  onClick={() => setForm(f => ({ ...f, mode: key, url: key !== f.mode ? "" : f.url }))}
                  disabled={saving}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition
                    ${form.mode === key ? "bg-orange-500 text-white border-orange-500" : "bg-white text-neutral-600 border-neutral-200 hover:border-orange-300"}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {form.mode === "upload" ? (
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1">ไฟล์วิดีโอ (ไม่เกิน 200MB)</label>
              <input ref={fileInputRef} type="file" accept="video/*" disabled={uploading || saving}
                onChange={e => handleUploadFile(e.target.files[0])}
                className="block w-full text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-orange-100 file:text-orange-600 hover:file:bg-orange-200 transition cursor-pointer" />
              {uploading && <p className="mt-1.5 text-xs text-orange-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> กำลังอัปโหลด...</p>}
              {!uploading && form.url && form.mode === "upload" && <p className="mt-1.5 text-xs text-green-600">✅ อัปโหลดไฟล์แล้ว</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1">
                ลิงก์ {form.mode === "youtube" ? "YouTube" : "Google Drive"}
              </label>
              <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className={inp} placeholder="https://..." disabled={saving} />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1">ความยาวคลิป (ไม่บังคับ)</label>
            <input type="text" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              className={inp} placeholder="เช่น 5 นาที" disabled={saving} />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1.5">
              ภาพปกคลิป (ไม่บังคับ)
            </label>
            <p className="text-[11px] text-neutral-400 mb-2">
              หากไม่เลือกภาพ ระบบจะดึงภาพหน้าปกจากเนื้อหาในวิดีโอให้อัตโนมัติ
            </p>
            <ImageUpload value={form.thumbnail} onChange={(path) => setForm(f => ({ ...f, thumbnail: path }))} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={resetForm} disabled={saving}
              className="flex-1 py-2 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-200 transition">
              ยกเลิก
            </button>
            <button onClick={handleSave} disabled={saving || uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-50 transition">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5" /> บันทึก</>}
            </button>
          </div>
        </div>
      )}

      {playingVideo && <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>
  );
}

// ─── Course Form ─────────────────────────────────────────────────────────────
function CourseForm({ initial = {}, onSave, onCancel, isSubmitting, statusOptions, termOptions, yearOptions = [], availabilityOptions = [], showToast }) {
  const [form, setForm] = useState({
    CourseName: "",
    StartDate: "",
    LastDate: "",
    Price: "",
    Discount: "0",
    Installments: "1",
    Remark: "",
    Status_Course_Id: 1,
    Term_Id: 1,
    Course_Availability_Id: "",
    CourseImage: "",
    YearId: "",
    ...initial,
  });

  const [pendingSubjects, setPendingSubjects] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [showPreview, setShowPreview] = useState(false); // ★ เพิ่ม

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const fullCost = Math.max(0, Number(form.Price || 0) - Number(form.Discount || 0));

  const handleMoneyChange = (key) => (e) => {
    const cleaned = sanitizeMoneyInput(e.target.value);
    set(key, cleaned);
  };
  const moneyDisplay = (v) => (v === "" || v === null || v === undefined ? "" : formatPrice(v));

  const handleSubmit = () => {
    if (!form.CourseName.trim()) return alert("กรุณากรอกชื่อคอร์ส");
    if (!form.StartDate || !form.LastDate) return alert("กรุณากรอกวันเริ่มและวันสิ้นสุด");
    if (new Date(form.StartDate) >= new Date(form.LastDate)) return alert("วันเริ่มสอนต้องมาก่อนวันสิ้นสุด");
    if (!form.Price || Number(form.Price) <= 0) return alert("กรุณากรอกราคาคอร์สให้ถูกต้อง (มากกว่า 0)");
    if (!form.YearId) return alert("กรุณากรอกปีการศึกษา");
    onSave({
      ...form,
      FullCost: fullCost,
      pendingSubjects,
      pendingStudents,
    });
  };

  const inputCls =
    "w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
  const labelCls = "block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>ชื่อคอร์ส <span className="text-red-400 normal-case">*</span></label>
        <input
          type="text"
          value={form.CourseName}
          onChange={(e) => set("CourseName", e.target.value)}
          className={inputCls}
          placeholder="เช่น คอร์สรวม (แพ็กเกจ) ป.3 ทั้งหมด 4 วิชา"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>วันเริ่มสอน <span className="text-red-400 normal-case">*</span></label>
          <input type="date" value={form.StartDate?.slice(0, 10) || ""} onChange={(e) => set("StartDate", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>วันสิ้นสุด <span className="text-red-400 normal-case">*</span></label>
          <input type="date" value={form.LastDate?.slice(0, 10) || ""} onChange={(e) => set("LastDate", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>ราคาเต็ม (บาท) <span className="text-red-400 normal-case">*</span></label>
          <input
            type="text" inputMode="numeric" value={moneyDisplay(form.Price)}
            onChange={handleMoneyChange("Price")} onKeyDown={blockNegativeKeys}
            className={inputCls} placeholder="5,900" />
        </div>
        <div>
          <label className={labelCls}>ส่วนลด (บาท)</label>
          <input
            type="text" inputMode="numeric" value={moneyDisplay(form.Discount)}
            onChange={handleMoneyChange("Discount")} onKeyDown={blockNegativeKeys}
            className={inputCls} placeholder="0" />
        </div>
        <div>
          <label className={labelCls}>ราคาสุทธิ</label>
          <div className="px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm font-bold text-orange-600">
            ฿{formatPrice(fullCost)}
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>จำนวนงวดผ่อนชำระ</label>
        <input
          type="number" min="0" step="1" value={form.Installments}
          onKeyDown={blockNegativeKeys}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || (/^\d*$/.test(v) && Number(v) >= 0)) set("Installments", v);
          }}
          className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>สถานะคอร์ส</label>
          <select value={form.Status_Course_Id} onChange={(e) => set("Status_Course_Id", Number(e.target.value))} className={inputCls}>
            {statusOptions.map((s) => <option key={s.Status_Course_Id} value={s.Status_Course_Id}>{s.Status_Course_Name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>เทอม</label>
          <select value={form.Term_Id} onChange={(e) => set("Term_Id", Number(e.target.value))} className={inputCls}>
            {termOptions.map((t) => <option key={t.Term_Id} value={t.Term_Id}>{t.Term_Name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>ปีการศึกษา (พ.ศ.) <span className="text-red-400 normal-case">*</span></label>
          <select value={form.YearId} onChange={(e) => set("YearId", e.target.value)} className={inputCls}>
            <option value="">เลือกปีการศึกษา</option>
            {yearOptions.map((y) => <option key={y.YearId} value={y.YearId}>{y.YearName}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>รูปแบบการเรียน</label>
          <select value={form.Course_Availability_Id} onChange={(e) => set("Course_Availability_Id", e.target.value)} className={inputCls}>
            <option value="">ไม่ระบุ</option>
            {availabilityOptions.map((a) => (
              <option key={a.Course_Availability_Id} value={a.Course_Availability_Id}>
                {a.Course_Availability_Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>รูปภาพคอร์ส</label>
        <ImageUpload value={form.CourseImage || ""} onChange={(path) => set("CourseImage", path)} />
      </div>

      <div>
        <label className={labelCls}>หมายเหตุ / รายละเอียดเพิ่มเติม</label>
        <textarea
          value={form.Remark || ""}
          onChange={(e) => set("Remark", e.target.value)}
          className={inputCls}
          rows={3}
          placeholder="รายละเอียดคอร์ส เวลาเรียน ฯลฯ"
        />
      </div>

      <div>
        <label className={labelCls}>วิชาและติวเตอร์</label>
        {initial.CourseID
          ? <CourseSubjects courseId={initial.CourseID} showToast={showToast} />
          : <PendingSubjectPicker items={pendingSubjects} onChange={setPendingSubjects} showToast={showToast} />}
      </div>

      <div>
        <label className={labelCls}>นักเรียนในคอร์ส</label>
        {initial.CourseID
          ? <CourseStudents courseId={initial.CourseID} courseStatusId={initial.Status_Course_Id} showToast={showToast} />
          : <PendingStudentPicker items={pendingStudents} onChange={setPendingStudents} statusCourseId={form.Status_Course_Id} showToast={showToast} />}
      </div>

      <div>
        <label className={labelCls}>คลิปตัวอย่าง</label>
        {initial.CourseID ? (
          <CoursePreviewVideos courseId={initial.CourseID} showToast={showToast} />
        ) : (
          <div className="border border-dashed border-neutral-200 rounded-xl p-4 text-center">
            <p className="text-xs text-neutral-400">บันทึกคอร์สก่อน จึงจะสามารถเพิ่มคลิปตัวอย่างได้</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 disabled:opacity-50 transition text-sm"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition text-sm shadow-sm"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> บันทึก</>}
        </button>
      </div>

      {initial.CourseID && (
        <>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center gap-2 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl font-bold hover:border-orange-300 hover:text-orange-600 transition text-sm w-full"
          >
            <Eye className="h-4 w-4" /> Preview หน้าคอร์ส (มุมมองนักเรียน)
          </button>
          {showPreview && <StudentPreviewModal course={initial} onClose={() => setShowPreview(false)} />}
        </>
      )}
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
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
        <p className="text-xs font-bold text-neutral-600 uppercase">นักเรียนที่จะเพิ่ม ({items.length})</p>
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
        <div className="divide-y divide-neutral-100 border-b border-neutral-200">
          {selectedStudents.map(s => (
            <div key={s.UserId} className="flex items-center gap-3 px-4 py-2 bg-orange-50/50">
              <span className="flex-1 text-sm font-medium text-neutral-800">
                {s.Nickname || `${s.Firstname} ${s.Lastname}`}
              </span>
              <button
                type="button"
                onClick={() => remove(String(s.UserId))}
                className="text-red-400 hover:text-red-600 transition"
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
          className="flex-1 px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400"
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
          <p className="text-xs text-neutral-400 text-center py-3">ไม่พบนักเรียน</p>
        ) : (
          filtered.map(s => {
            const id = String(s.UserId);
            const checked = items.includes(id);
            return (
              <label
                key={id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm transition ${checked ? "bg-orange-100" : "hover:bg-neutral-50"
                  }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="accent-orange-500" />
                <span className="flex-1 font-medium text-neutral-700">
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
function PendingSubjectPicker({ items, onChange, showToast }) {
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [newRow, setNewRow] = useState({ SubjectId: "", AdminId: "", TotalHours: "" });
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/subjects`),
      axios.get(`${API_BASE}/tutors`),
    ]).then(([sRes, tRes]) => {
      setAllSubjects(sRes.data);
      setAllTutors(tRes.data);
    });
  }, []);

  const add = () => {
    if (!newRow.SubjectId || !newRow.AdminId) {
      if (showToast) return showToast("error", "กรุณาเลือกวิชาและติวเตอร์");
      return alert("กรุณาเลือกวิชาและติวเตอร์");
    }
    onChange([...items, newRow]);
    setNewRow({ SubjectId: "", AdminId: "", TotalHours: "" });
  };

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateHours = (index, hours) => {
    onChange(items.map((it, i) => i === index ? { ...it, TotalHours: hours } : it));
    setEditingIndex(null);
  };

  const inp = "px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-sm outline-none";

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
        <p className="text-xs font-bold text-neutral-600 uppercase">วิชาที่จะเพิ่ม ({items.length})</p>
      </div>

      {items.map((it, idx) => {
        const subj = allSubjects.find(s => String(s.SubjectId) === String(it.SubjectId));
        const tut = allTutors.find(t => String(t.AdminId) === String(it.AdminId));
        return (
          <div key={idx} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-100 last:border-0">
            <span className="flex-1 text-sm font-semibold text-neutral-800">
              {subj ? subj.SubjectName : `วิชา (ไม่พบข้อมูล)`}
            </span>
            <span className="text-xs text-neutral-500">
              {tut ? (tut.Nickname || `${tut.Firstname} ${tut.Lastname}`) : `ติวเตอร์ (ไม่พบข้อมูล)`}
            </span>
            {editingIndex === idx ? (
              <HoursInlineEdit
                value={it.TotalHours}
                onSave={(hours) => updateHours(idx, hours)}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <>
                <span className="text-xs text-neutral-400 w-24 text-right">{formatHoursLabel(it.TotalHours || 0)}</span>
                <button onClick={() => setEditingIndex(idx)} className="text-neutral-300 hover:text-orange-500 transition" title="แก้ไขชั่วโมง">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 transition" title="ลบ">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2 px-4 py-3 bg-orange-50">
        <select
          value={newRow.SubjectId}
          onChange={e => setNewRow(r => ({ ...r, SubjectId: e.target.value }))}
          className={inp + " flex-1"}
        >
          <option value="">เลือกวิชา</option>
          {allSubjects.map(s => <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>)}
        </select>

        <select
          value={newRow.AdminId}
          onChange={e => setNewRow(r => ({ ...r, AdminId: e.target.value }))}
          className={inp + " flex-1"}
        >
          <option value="">เลือกติวเตอร์</option>
          {allTutors.map(t => <option key={t.AdminId} value={t.AdminId}>{t.Nickname || `${t.Firstname} ${t.Lastname}`}</option>)}
        </select>

        <input
          type="number" min="0" step="1"
          placeholder="ชม."
          value={newRow.TotalHours}
          onKeyDown={blockNegativeKeys}
          onChange={e => {
            const v = e.target.value;
            if (v === "" || (/^\d*$/.test(v) && Number(v) >= 0)) setNewRow(r => ({ ...r, TotalHours: v }));
          }}
          className={inp + " w-20"}
        />

        <button onClick={add} className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────
function CourseCard({ course, onEdit, onDelete, onStatusChange, statusOptions, onDuplicate }) {
  const status = STATUS_MAP[course.Status_Course_Id] || STATUS_MAP[4];
  const [imgErr, setImgErr] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // ★ เพิ่ม

  return (
    <div className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Cover Image */}
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
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-black border cursor-pointer ${status.color}`}
          onClick={(e) => e.stopPropagation()}
        >
          {statusOptions.map((s) => (
            <option key={s.Status_Course_Id} value={s.Status_Course_Id}>
              {s.Status_Course_Name}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-neutral-900 text-sm leading-snug mb-3 line-clamp-2">
          {course.CourseName}
        </h3>

        <div className="space-y-1.5 text-xs text-neutral-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-orange-400" />
            <span>{formatDate(course.StartDate)} – {formatDate(course.LastDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-green-500 text-sm">฿</span>
            <span className="font-bold text-green-700 text-sm">{formatPrice(course.FullCost || course.Price)} บาท</span>
            {Number(course.Discount) > 0 && (
              <span className="line-through text-neutral-400">{formatPrice(course.Price)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span>{course.StudentCount || 0} นักเรียน</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {course.Term_Name && (
            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-semibold">
              {course.Term_Name}
            </span>
          )}
          {course.Course_Availability_Name && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-semibold">
              {course.Course_Availability_Name}
            </span>
          )}
          {course.VideosFree > 0 && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-semibold">
              ฟรี {course.VideosFree} คลิป
            </span>
          )}
          {course.Subjects && course.Subjects.split(",").map((s) => (
            <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-semibold">
              {s.trim()}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-neutral-100">
          <button
            onClick={() => onEdit(course)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 hover:border-orange-200 transition"
          >
            <Edit2 className="h-3.5 w-3.5" /> แก้ไข
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center px-3 py-2 text-xs font-bold text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-xl hover:bg-neutral-100 hover:border-neutral-200 transition"
            title="Preview มุมมองนักเรียน"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
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

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [availabilityOptions, setAvailabilityOptions] = useState([]);

  const fetchAll = async () => {
    try {
      const [cRes, sRes, tRes, yRes, aRes] = await Promise.all([
        axios.get(`${API_BASE}/courses`),
        axios.get(`${API_BASE}/status-course`),
        axios.get(`${API_BASE}/term`),
        axios.get(`${API_BASE}/year`),
        axios.get(`${API_BASE}/course-availability`),
      ]);
      setCourses(cRes.data);
      setStatusOptions(sRes.data);
      setTermOptions(tRes.data);
      setYearOptions(yRes.data);
      setAvailabilityOptions(aRes.data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, filterTerm]);

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

      let enrollFailed = 0;
      let studentsSkippedDueToStatus = false;
      const isEnrollAllowed = [1, 2].includes(Number(courseData.Status_Course_Id));

      if (pendingStudents.length) {
        if (isEnrollAllowed) {
          const enrollRes = await axios.post(`${API_BASE}/enroll/bulk`, {
            UserIds: pendingStudents,
            CourseID,
          });
          enrollFailed = enrollRes.data.failed?.length || 0;
        } else {
          studentsSkippedDueToStatus = true;
        }
      }

      if (studentsSkippedDueToStatus) {
        showToast(
          "error",
          "สร้างคอร์สสำเร็จ แต่ยังไม่ได้เพิ่มนักเรียน",
          "เนื่องจากสถานะคอร์สไม่ใช่เปิดรับสมัคร/กำลังสอน กรุณาเปลี่ยนสถานะก่อนแล้วเพิ่มนักเรียนภายหลัง"
        );
      } else if (subjectFailed > 0 || enrollFailed > 0) {
        showToast(
          "error",
          "สร้างคอร์สสำเร็จ แต่มีบางรายการเพิ่มไม่สำเร็จ",
          `วิชาที่ล้มเหลว: ${subjectFailed} · นักเรียนที่ล้มเหลว: ${enrollFailed}`
        );
      } else {
        showToast("success", "สร้างคอร์สสำเร็จ พร้อมครูและนักเรียนที่เลือกไว้!");
      }
      setShowAddModal(false);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE}/courses/${editingCourse.CourseID}`, data)
      showToast("success", "แก้ไขข้อมูลคอร์สสำเร็จ!");
      setEditingCourse(null);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/courses/${deletingCourse.CourseID}`);
      showToast("success", "ลบข้อมูลคอร์สสำเร็จ!");
      setDeletingCourse(null);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    }
  };

  const handleDuplicate = async (course) => {
    try {
      await axios.post(`${API_BASE}/courses/${course.CourseID}/duplicate`);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    }
  };

  const activeTermFilter = TERM_FILTERS.find(t => t.key === filterTerm) || TERM_FILTERS[0];

  const filtered = courses.filter((c) => {
    const matchSearch =
      search === "" ||
      c.CourseName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || String(c.Status_Course_Id) === filterStatus;
    const matchTerm = activeTermFilter.termId === null || Number(c.Term_Id) === activeTermFilter.termId;
    return matchSearch && matchStatus && matchTerm;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalStudents = [...new Map(courses.map((c) => [c.CourseID, c])).values()]
    .reduce((s, c) => s + Number(c.StudentCount || 0), 0);
  const activeCourses = courses.filter((c) => c.Status_Course_Id === 2).length;

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) pages.push(i);
      else if (i === 2 && currentPage > 3) pages.push("...");
      else if (i === totalPages - 1 && currentPage < totalPages - 2) pages.push("...");
    }
    return pages.filter((p, idx) => pages.indexOf(p) === idx);
  };

  if (loading)
    return (
      <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm font-medium text-neutral-500">กำลังโหลดข้อมูลคอร์ส...</p>
      </div>
    );

  return (
    <div className="space-y-6 mt-[90px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">จัดการคอร์สเรียน</h1>
          <p className="text-sm text-neutral-500 mt-1">เพิ่ม แก้ไข และจัดการคอร์สทั้งหมดในสถาบัน</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition text-sm"
        >
          <Plus className="h-4 w-4" /> เพิ่มคอร์สใหม่
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "คอร์สทั้งหมด", value: courses.length, icon: BookOpen, color: "bg-orange-500" },
          { label: "คอร์สที่กำลังสอน", value: activeCourses, icon: Check, color: "bg-green-500" },
          { label: "นักเรียนที่ลงทะเบียน", value: totalStudents, icon: Users, color: "bg-blue-500" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-neutral-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter ── */}
      {/* ── Search & Filter ── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อคอร์ส..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[160px]"
          >
            <option value="all">สถานะทั้งหมด</option>
            {statusOptions.map((s) => (
              <option key={s.Status_Course_Id} value={s.Status_Course_Id}>{s.Status_Course_Name}</option>
            ))}
          </select>
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[160px]"
          >
            {TERM_FILTERS.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-neutral-400 mt-2 pl-1">
          แสดง {filtered.length} จาก {courses.length} คอร์ส
        </p>
      </div>

      {/* ── Course Grid ── */}
      {paginated.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
          <div className="text-6xl mb-3">📚</div>
          <p className="text-neutral-500 font-medium">ไม่พบคอร์สเรียนที่ค้นหา</p>
          <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
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

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            แสดง{" "}
            <span className="font-semibold text-neutral-700">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
            </span>{" "}
            จาก <span className="font-semibold text-neutral-700">{filtered.length}</span> คอร์ส
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={`dots-${idx}`} className="flex h-9 w-9 items-center justify-center text-neutral-400 text-sm">…</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === page
                    ? "bg-orange-500 text-white shadow-sm"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600"
                    }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Add ── */}
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
            showToast={showToast}
          />
        </Modal>
      )}

      {/* ── Modal: Edit ── */}
      {editingCourse && (
        <Modal title={editingCourse.CourseName || "แก้ไขคอร์ส"} icon={Edit2} onClose={() => setEditingCourse(null)}>
          <CourseForm
            initial={editingCourse}
            onSave={handleUpdate}
            onCancel={() => setEditingCourse(null)}
            isSubmitting={isSubmitting}
            statusOptions={statusOptions}
            termOptions={termOptions}
            yearOptions={yearOptions}
            availabilityOptions={availabilityOptions}
            showToast={showToast}
          />
        </Modal>
      )}

      {/* ── Confirm Delete ── */}
      {deletingCourse && (
        <ConfirmDialog
          course={deletingCourse}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCourse(null)}
        />
      )}
    </div>
  );
}