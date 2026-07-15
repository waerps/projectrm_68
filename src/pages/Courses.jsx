// src/pages/Course.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronDown, ChevronUp, BadgeCheck, Clock, CreditCard, Heart,
  Calendar, Users, PlayCircle, X, AlertTriangle, BookOpen, Loader2,
  Youtube, FolderOpen, Video, Sparkles, ShieldCheck, ArrowRight, ArrowLeft,
  Tag, Check,
} from "lucide-react";
import {
  getCourseById,
  getCourseSubjects,
  getCoursePreviewVideos,
  getCourseSchedule,
} from "../callapi/callusers";
import { getFileUrl } from "../utils/fileUrl";
import { useShop } from "../context/ShopContext";

// ─── Constants — เหมือนกับ AdminCoursesPage.jsx เป๊ะๆ เพื่อให้ badge/label ตรงกัน ───
const STATUS_MAP = {
  1: { label: "เปิดรับสมัคร", color: "bg-blue-500/15 text-blue-100 border-blue-300/30", solid: "bg-blue-500", canEnroll: true },
  2: { label: "กำลังสอน", color: "bg-green-500/15 text-green-100 border-green-300/30", solid: "bg-green-500", canEnroll: true },
  3: { label: "ปิดรับสมัคร", color: "bg-amber-500/15 text-amber-100 border-amber-300/30", solid: "bg-amber-500", canEnroll: false },
  4: { label: "ปิดคอร์ส", color: "bg-neutral-500/15 text-neutral-200 border-neutral-300/30", solid: "bg-neutral-400", canEnroll: false },
};

const DAY_LABELS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const formatPrice = (p) =>
  Number(p || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const formatHoursLabel = (decimalHours) => {
  const total = Number(decimalHours || 0);
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  if (m === 0) return `${h} ชม.`;
  return `${h} ชม. ${m} นาที`;
};

const formatThaiDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(d);
};

const formatDateRange = (start, end) => {
  const s = formatThaiDate(start);
  const e = formatThaiDate(end);
  if (s && e) return `${s} - ${e}`;
  if (s) return `${s} เป็นต้นไป`;
  return "ไม่ระบุ";
};

// ─── Video URL helpers — ตรรกะเดียวกับ AdminCoursesPage.jsx ทุกตัวอักษร เพื่อให้คลิป
// ที่แอดมินพรีวิวแล้วเล่นได้ เล่นได้เหมือนกันเป๊ะๆ ในหน้านักเรียนจริง ───────────
function getYoutubeEmbedUrl(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : null;
}
function getDriveEmbedUrl(url) {
  const m = url?.match(/\/file\/d\/([^/]+)/) || url?.match(/[?&]id=([^&]+)/);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
}

function ErrorState({ message }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
      <p className="text-sm text-neutral-400">{message}</p>
    </div>
  );
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
      return <iframe src={embedUrl} title={VideoTitle} className="w-full h-full" allow="autoplay" allowFullScreen />;
    }
    return <video src={VideoUrl} controls autoPlay className="w-full h-full bg-black" />;
  };

  return (
    <div
      className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center z-[70] p-2 sm:p-4"
      style={{ animation: "fadeIn .2s ease-out" }}
      role="dialog"
      aria-modal="true"
      aria-label={VideoTitle}
    >
      <div
        className="bg-black rounded-2xl w-full max-w-3xl shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] overflow-hidden ring-1 ring-white/10"
        style={{ animation: "scaleIn .25s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/95 border-b border-white/5">
          <p className="text-sm font-bold text-white truncate pr-4">{VideoTitle}</p>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="p-1.5 rounded-xl text-neutral-400 hover:bg-white/10 hover:text-white transition-colors duration-150 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="aspect-video w-full">{renderPlayer()}</div>
      </div>
    </div>
  );
}

// ─── Loading state — mirrors the new architecture, not the old one ──────────
function CourseSkeleton() {
  return (
    <div className="animate-pulse pt-28 md:pt-36">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="h-[60vh] md:h-[65vh] min-h-[440px] w-full rounded-3xl bg-neutral-200" />
        <div className="relative z-10 -mt-10 md:-mt-14 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-24 rounded-2xl bg-white shadow-md ${i === 0 ? "col-span-2 md:col-span-1" : ""}`} />
          ))}
        </div>
        <div className="mt-10 h-40 rounded-2xl bg-neutral-100" />
        <div className="mt-10 space-y-3">
          <div className="h-16 rounded-2xl bg-neutral-100" />
          <div className="h-16 rounded-2xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function CourseDetail() {
  const { id } = useParams();
  const [courseRaw, setCourseRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [openIdx, setOpenIdx] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [schedule, setSchedule] = useState([]);

  // Presentation-only: toggles the "add to cart" button between its two
  // labelled states, as requested. Does not remove/alter cart logic itself.
  const [addedToCart, setAddedToCart] = useState(false);

  const { addToCart, toggleFavorite, favorites } = useShop();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getCourseById(id);
        setCourseRaw(data);
      } catch (err) {
        console.error("Load course error:", err);
        setCourseRaw(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingVideos(true);
        const data = await getCoursePreviewVideos(id);
        setVideos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Load preview videos error:", err);
        setVideos([]);
      } finally {
        setLoadingVideos(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingSubjects(true);
        const data = await getCourseSubjects(id);
        setSubjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Load subjects error:", err);
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCourseSchedule(id);
        setSchedule(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Load schedule error:", err);
        setSchedule([]);
      }
    })();
  }, [id]);

  const course = useMemo(() => {
    const c = courseRaw || {};
    return {
      id: c.CourseID ?? id,
      title: c.CourseName ?? "ไม่พบข้อมูลคอร์ส",
      price: c.Price != null ? Number(c.Price) : 0,
      discount: Number(c.Discount || 0),
      fullCost: c.FullCost != null ? Number(c.FullCost) : Math.max(0, Number(c.Price || 0) - Number(c.Discount || 0)),
      startDate: c.StartDate || null,
      endDate: c.LastDate || null,
      image: c.CourseImage ? getFileUrl(c.CourseImage) : "/openterm2.jpg",
      remark: c.Remark?.trim() || "ไม่มีรายละเอียดเพิ่มเติม",
      statusId: c.Status_Course_Id ?? null,
      termName: c.Term_Name || null,
      videosFree: Number(c.VideosFree || 0),
      availabilityName: c.Course_Availability_Name || null,
    };
  }, [id, courseRaw]);

  const status = STATUS_MAP[course.statusId] || null;
  const canEnroll = status ? status.canEnroll : true; // ไม่รู้สถานะ = ไม่บล็อกไว้ก่อน

  const isFav = favorites.some((c) => c.id === course.id);
  const courseData = { id: course.id, title: course.title, price: course.price };

  const toggleOpen = (i) => setOpenIdx((prev) => (prev === i ? null : i));

  const handleAddToCart = () => {
    if (!canEnroll) return;
    if (!addedToCart) {
      addToCart(courseData);
    }
    setAddedToCart((prev) => !prev);
  };

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

  // ★ StartTime/EndTime จาก backend มาเป็น 'HH:MM' อยู่แล้ว (TIME_FORMAT '%H:%i') ไม่ต้อง slice ซ้ำ
  const scheduleBySubject = useMemo(() => {
    const map = {};
    for (const s of schedule) {
      const key = s.SubjectId;
      if (!map[key]) map[key] = [];
      const day = DAY_LABELS[Number(s.DayOfWeek)] ?? null;
      const time = s.StartTime && s.EndTime ? `${s.StartTime}-${s.EndTime}` : null;
      map[key].push([day, time].filter(Boolean).join(" "));
    }
    return map;
  }, [schedule]);

  if (loading) {
    return <CourseSkeleton />;
  }

  const scrollToVideo = (i) => {
    toggleOpen(i);
    document.getElementById(`clip-${i}`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  // Real, dynamically-pulled highlight badges — every value here comes
  // straight from `course`, nothing is hardcoded.
  const highlightBadges = [
    course.discount > 0 && { key: "promo", label: "โปรโมชั่น", icon: Sparkles, solid: true },
    course.termName && { key: "term", label: course.termName, icon: BadgeCheck, tone: "text-blue-100" },
    course.availabilityName && { key: "avail", label: course.availabilityName, icon: BadgeCheck, tone: "text-blue-100" },
    course.discount > 0 && { key: "discount", label: `ลด ${formatPrice(course.discount)} บาท`, icon: Tag, tone: "text-red-200" },
    course.videosFree > 0 && { key: "free", label: `ฟรี ${course.videosFree} คลิป`, icon: Sparkles, tone: "text-purple-200" },
  ].filter(Boolean);

  return (
    <div className="bg-white">
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(.96) translateY(6px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
        .snap-x-mandatory { scroll-snap-type: x mandatory; }
        .snap-center { scroll-snap-align: center; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ─── Cinematic hero — contained, rounded, pulled clear of the navbar ─── */}
      <div className="pt-28 md:pt-36 container mx-auto max-w-6xl px-4">
        <div className="relative w-full h-[60vh] md:h-[65vh] min-h-[440px] max-h-[760px] rounded-3xl overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]">
          <img
            src={course.image}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover scale-105"
            onError={(e) => { e.currentTarget.src = "/openterm2.jpg"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          <div className="absolute inset-x-0 bottom-0 pb-14 md:pb-20 px-6 md:px-10">
            <div className="max-w-2xl" style={{ animation: "riseIn .5s cubic-bezier(0.16,1,0.3,1)" }}>
              {/* status tag, immediately followed by the real highlight badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {status && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full backdrop-blur-md border px-3 py-1 text-xs font-bold ${status.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.solid}`} />
                    {status.label}
                  </span>
                )}
                {highlightBadges.map((b) => {
                  const Icon = b.icon;
                  return (
                    <span
                      key={b.key}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border backdrop-blur-md
                        ${b.solid
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-transparent shadow-sm shadow-orange-500/30"
                          : `bg-white/15 border-white/25 ${b.tone}`}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {b.label}
                    </span>
                  );
                })}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight drop-shadow-sm">
                {course.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bento strip — overlaps the bottom edge of the hero image ─── */}
      <div className="container mx-auto max-w-6xl px-4">
        <div
          className="relative z-10 -mt-10 md:-mt-14 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
          style={{ animation: "riseIn .5s .1s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          {/* price — orange hero tile */}
          <div className="col-span-2 md:col-span-1 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 shadow-[0_20px_50px_-16px_rgba(234,88,12,0.55)] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-orange-100 text-xs font-medium">
              <CreditCard className="h-3.5 w-3.5" /> ค่าเรียน
            </div>
            <div>
              <div className="text-2xl font-bold mt-2">{formatPrice(course.fullCost)}<span className="text-sm font-normal text-orange-100 ml-1">บาท</span></div>
              {course.discount > 0 && (
                <div className="text-xs text-orange-100/80 line-through mt-0.5">{formatPrice(course.price)} บาท</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.15)] ring-1 ring-neutral-900/5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
              <Calendar className="h-3.5 w-3.5" /> รอบเรียน
            </div>
            <div className="text-sm font-semibold text-neutral-900 mt-2 leading-snug">
              {formatDateRange(course.startDate, course.endDate)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.15)] ring-1 ring-neutral-900/5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium">
              <Users className="h-3.5 w-3.5" /> วิชาในคอร์ส
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">{subjects.length || "—"}</div>
          </div>
        </div>

        {!canEnroll && status && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              คอร์สนี้อยู่ในสถานะ "{status.label}" ขณะนี้ยังไม่สามารถเพิ่มลงตะกร้าได้
            </p>
          </div>
        )}

        {/* ─── รายละเอียดคอร์ส — the prominent action section: bold heading +
             purchase actions live here ─── */}
        <section className="mt-14 md:mt-10">
          <div className="rounded-3xl bg-gradient-to-br from-orange-50 via-white to-white ring-1 ring-orange-900/5 shadow-[0_10px_40px_-18px_rgba(234,88,12,0.25)] overflow-hidden">
            <div className="grid md:grid-cols-12">
              {/* left — prominent heading + purchase actions */}
              <div className="md:col-span-4 p-6 md:p-8 md:border-r border-orange-900/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <h2 className="text-2xl md:text-[28px] font-extrabold text-neutral-900 tracking-tight leading-none">
                    รายละเอียด<br className="hidden md:block" />คอร์ส
                  </h2>
                </div>

                <div className="mt-6 space-y-2.5">
                  <button
                    onClick={handleAddToCart}
                    disabled={!canEnroll}
                    title={!canEnroll ? `คอร์สนี้ ${status?.label || "ไม่เปิดรับสมัคร"}` : undefined}
                    aria-pressed={addedToCart}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold shadow-lg transition-all duration-200 active:scale-[0.98]
                      ${!canEnroll
                        ? "bg-neutral-300 text-white cursor-not-allowed"
                        : addedToCart
                          ? "bg-white text-orange-600 border-2 border-orange-500"
                          : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:shadow-orange-500/30"}`}
                  >
                    {!canEnroll ? (
                      status?.label || "ไม่เปิดรับสมัคร"
                    ) : addedToCart ? (
                      <>
                        <Check className="h-4 w-4" /> อยู่ในตะกร้าแล้ว
                      </>
                    ) : (
                      "เพิ่มลงตะกร้า"
                    )}
                  </button>

                  <button
                    onClick={() => toggleFavorite(courseData)}
                    aria-pressed={isFav}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold border transition-all duration-200 active:scale-[0.98]
                      ${isFav ? "bg-red-50 border-red-200 text-red-500" : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"}`}
                  >
                    <Heart className={`h-4 w-4 transition-transform duration-200 ${isFav ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                    {isFav ? "อยู่ในรายการโปรดแล้ว" : "เพิ่มรายการโปรด"}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> ชำระเงินปลอดภัย และติดต่อทีมงานได้ตลอดการเรียน
                </div>
              </div>

              {/* right — organized, smaller detail text */}
              <div className="md:col-span-8 p-6 md:p-8 bg-white/60">
                <p className="text-sm text-neutral-600 leading-[1.9] whitespace-pre-line">
                  {course.remark}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Curriculum — vertical editorial timeline ─── */}
        <section className="mt-16 md:mt-24">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">หลักสูตร</h2>
            <span className="text-sm text-neutral-400">{subjects.length ? `${subjects.length} วิชา` : ""}</span>
          </div>

          {loadingSubjects ? (
            <div className="space-y-4 animate-pulse">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-neutral-100" />)}
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center rounded-2xl bg-neutral-50 border border-dashed border-neutral-200">
              <BookOpen className="h-8 w-8 text-neutral-300" />
              <p className="text-sm text-neutral-500">ยังไม่มีวิชาระบุในคอร์สนี้</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] md:left-[19px] top-2 bottom-2 w-px bg-neutral-200" />
              <div className="space-y-2">
                {subjects.map((s) => {
                  const days = scheduleBySubject[s.SubjectId];
                  return (
                    <div
                      key={s.TutorCourseDetailId || s.SubjectId}
                      className="relative flex gap-4 md:gap-6 pl-0 py-4 group"
                    >
                      <div className="relative z-10 shrink-0 flex items-start pt-1">
                        <span className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-white ring-2 ring-orange-500 text-orange-600 shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-colors duration-200">
                          <BookOpen className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 rounded-2xl px-4 py-3 -my-1 group-hover:bg-orange-50/50 transition-colors duration-200">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <h3 className="text-base font-semibold text-neutral-900">{s.SubjectName}</h3>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                            <Clock className="h-3 w-3" /> {formatHoursLabel(s.TotalHours)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          ติวเตอร์: {s.Nickname || `${s.Firstname || ""} ${s.Lastname || ""}`.trim() || "ไม่ระบุ"}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {days?.length ? (
                            days.map((d, di) => (
                              <span key={di} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                                {d}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-neutral-400">ยังไม่กำหนดวันเรียน</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ─── Video filmstrip — horizontal snap gallery ─── */}
        <section className="mt-16 md:mt-24 pb-32 md:pb-24">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">คลิปวิดีโอเนื้อหาเพิ่มเติม</h2>
            {videos.length > 2 && (
              <span className="hidden md:flex items-center gap-1 text-xs text-neutral-400">
                <ArrowLeft className="h-3 w-3" /> เลื่อนดูทั้งหมด <ArrowRight className="h-3 w-3" />
              </span>
            )}
          </div>

          {loadingVideos ? (
            <div className="flex gap-4 overflow-hidden animate-pulse">
              {[0, 1, 2].map((i) => <div key={i} className="h-48 w-72 shrink-0 rounded-2xl bg-neutral-100" />)}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center rounded-2xl bg-neutral-50 border border-dashed border-neutral-200">
              <Video className="h-8 w-8 text-neutral-300" />
              <p className="text-sm text-neutral-500">ยังไม่มีคลิปเพิ่มเติม</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto snap-x-mandatory no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {videos.map((v, i) => (
                <button
                  key={v.VideoId}
                  id={`clip-${i}`}
                  onClick={() => scrollToVideo(i)}
                  onDoubleClick={() => setPlayingVideo(v)}
                  aria-pressed={openIdx === i}
                  className={`group relative shrink-0 w-64 md:w-72 snap-center rounded-2xl overflow-hidden bg-neutral-900 text-left shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] ring-2 transition-all duration-200 focus:outline-none
                    ${openIdx === i ? "ring-orange-500 scale-[1.02]" : "ring-transparent hover:ring-neutral-200"}`}
                >
                  <div className="relative aspect-[4/3] w-full">
                    {getThumbnail(v) ? (
                      <img src={getThumbnail(v)} alt={v.VideoTitle} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <PlayCircle className="h-10 w-10 text-neutral-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPlayingVideo(v); }}
                      aria-label={`เล่น ${v.VideoTitle}`}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <PlayCircle className="h-12 w-12 text-white/90 scale-90 opacity-80 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 drop-shadow-lg" />
                    </button>
                    <div className="absolute top-2 left-2">
                      {v.VideoType === "youtube" ? <Youtube className="h-4 w-4 text-red-400" />
                        : v.VideoType === "drive" ? <FolderOpen className="h-4 w-4 text-blue-400" />
                        : <Video className="h-4 w-4 text-purple-400" />}
                    </div>
                    <p className="absolute bottom-2 left-3 right-3 text-sm font-semibold text-white truncate">
                      {v.VideoTitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {playingVideo && <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />}

      {/* ─── Mobile — thumb-reach floating dock ─── */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40" style={{ animation: "riseIn .3s ease-out" }}>
        <div className="flex items-center gap-2 rounded-2xl bg-neutral-900/95 backdrop-blur-xl px-3 py-3 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => toggleFavorite(courseData)}
            aria-label={isFav ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
            aria-pressed={isFav}
            className={`rounded-xl p-3 shrink-0 transition-colors duration-150 active:scale-90 ${isFav ? "bg-red-500 text-white" : "bg-white/10 text-white/70"}`}
          >
            <Heart className={`h-5 w-5 ${isFav ? "fill-white" : ""}`} />
          </button>
          <div className="flex-1 min-w-0 px-1">
            <div className="text-[10px] text-neutral-400 leading-none">ค่าเรียน</div>
            <div className="text-sm font-bold text-white truncate">{formatPrice(course.fullCost)} บาท</div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canEnroll}
            aria-pressed={addedToCart}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold shrink-0 transition-all duration-200 active:scale-95
              ${!canEnroll
                ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                : addedToCart
                  ? "bg-white/10 text-white border border-white/30"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 text-white"}`}
          >
            {!canEnroll ? (
              status?.label || "ปิดรับ"
            ) : addedToCart ? (
              <>
                <Check className="h-4 w-4" /> อยู่ในตะกร้า
              </>
            ) : (
              "เพิ่มลงตะกร้า"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}