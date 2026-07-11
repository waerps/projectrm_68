// src/pages/CourseDetail.jsx มันคือหน้าคอร์สหลัง
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, ChevronUp, BadgeCheck, Clock, CreditCard, X, Loader2, PlayCircle } from "lucide-react";
import axios from "axios";
import { API_URL } from "../config";
import { getCourseById } from "../callapi/callusers";

// ─── Helper: แปลง URL วิดีโอเป็นรูป thumbnail จากเนื้อหาจริง ───────────────────
function getVideoThumbnail(url, type) {
  if (!url) return null;
  if (type === "youtube") {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
  }
  if (type === "drive") {
    const m = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
    // ★ ใช้ endpoint thumbnail สาธารณะของ Drive — ไฟล์ต้อง share แบบ "ทุกคนที่มีลิงก์ดูได้"
    return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400` : null;
  }
  if (type === "upload") {
    // ★ Cloudinary: ดึงเฟรมจากวินาทีที่ 0 ของวิดีโอมาเป็นรูปภาพจริง
    // .../video/upload/v123/xxx.mp4 → .../video/upload/so_0/v123/xxx.jpg
    if (!/\/video\/upload\//.test(url)) return null;
    return url
      .replace("/video/upload/", "/video/upload/so_0/")
      .replace(/\.\w+$/, ".jpg");
  }
  return null;
}

// ─── Video Player Modal ───────────────────────────────────────────────────────
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
      if (!embedUrl) return <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">ลิงก์ไม่ถูกต้อง</div>;
      return <iframe src={embedUrl} title={VideoTitle} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
    }
    if (VideoType === "drive") {
      const embedUrl = getDriveEmbedUrl(VideoUrl);
      if (!embedUrl) return <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">ลิงก์ไม่ถูกต้อง</div>;
      return <iframe src={embedUrl} title={VideoTitle} className="w-full h-full" allow="autoplay" allowFullScreen />;
    }
    return <video src={VideoUrl} controls autoPlay className="w-full h-full bg-black" />;
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
        <div className="aspect-video w-full">{renderPlayer()}</div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function CourseDetail() {
  const { id } = useParams();
  const [courseRaw, setCourseRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [openIdx, setOpenIdx] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

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
    let active = true;
    setLoadingVideos(true);
    axios.get(`${API_URL}/api/admin/courses/${id}/preview-videos`)
      .then(r => { if (active) setVideos(r.data); })
      .catch(() => { if (active) setVideos([]); })
      .finally(() => { if (active) setLoadingVideos(false); });
    return () => { active = false; };
  }, [id]);

  const course = useMemo(() => {
    const c = courseRaw || {};
    return {
      title: c.CourseName ?? "ไม่พบข้อมูลคอร์ส",
      price: c.Price != null ? `${c.Price} บาท` : "-",
      startDate: c.StartDate || null,
      endDate: c.LastDate || null,
      hero: "/openterm2.jpg",
      badges: [
        c.Discount ? `ลด ${c.Discount}` : null,
        c.Remark ? "รายละเอียดเพิ่มเติม" : null,
      ].filter(Boolean),
      detail: c.Remark ? [c.Remark] : ["-"],
      outline: [],
    };
  }, [courseRaw]);

  const toggle = (i) => setOpenIdx(openIdx === i ? null : i);

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-gray-500">กำลังโหลดข้อมูลคอร์ส...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-12 mt-35">
        <div className="md:col-span-7">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <img src={course.hero} alt={course.title} className="aspect-[16/10] w-full object-cover" />
          </div>
        </div>

        <div className="md:col-span-5">
          <h1 className="text-3xl font-bold text-neutral-900">{course.title}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {course.badges.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                <BadgeCheck className="h-4 w-4 text-orange-500" />
                {b}
              </span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <CreditCard className="h-6 w-6 text-orange-600" />
              <div>
                <div className="text-sm text-neutral-500">ค่าเรียน</div>
                <div className="text-lg font-semibold text-neutral-900">{course.price}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <Clock className="h-6 w-6 text-green-600" />
              <div>
                <div className="text-sm text-neutral-500">รอบเรียน</div>
                <div className="text-lg font-semibold text-neutral-900">{formatDateRange(course.startDate, course.endDate)}</div>
              </div>
            </div>
          </div>

          <button className="mt-6 w-full rounded-2xl bg-orange-500 py-4 text-white shadow-md transition hover:bg-orange-600">
            ซื้อคอร์สเรียน
          </button>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">รายละเอียดคอร์ส</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700">
              {course.detail.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">เนื้อหาหลัก</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
              {course.outline.length ? course.outline.map((d, i) => <li key={i}>{d}</li>) : <li>-</li>}
            </ol>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">คลิปวิดีโอเนื้อหาเพิ่มเติม</h2>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {loadingVideos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
            </div>
          ) : videos.length === 0 ? (
            <div className="px-5 py-4 text-sm text-neutral-500">ยังไม่มีคลิปเพิ่มเติม</div>
          ) : (
            videos.map((v, i) => (
              <div key={v.VideoId}>
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-neutral-50"
                >
                  <span className="text-sm font-medium text-neutral-800">{v.VideoTitle}</span>
                  {openIdx === i ? <ChevronUp className="h-5 w-5 text-neutral-500" /> : <ChevronDown className="h-5 w-5 text-neutral-500" />}
                </button>

                {openIdx === i && (
                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => setPlayingVideo(v)}
                      className="relative w-full overflow-hidden rounded-xl bg-neutral-100 aspect-[16/9] flex items-center justify-center group cursor-pointer"
                    >
                      {getVideoThumbnail(v.VideoUrl, v.VideoType) ? (
                        <img src={getVideoThumbnail(v.VideoUrl, v.VideoType)} alt={v.VideoTitle} className="w-full h-full object-cover" />
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
      </section>

      {playingVideo && <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>
  );
}