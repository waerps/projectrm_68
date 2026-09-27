import { API_URL } from "../config";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, ChevronLeft, ChevronRight, Calendar, Tag, Newspaper } from "lucide-react";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { PAGE_TITLE, PAGE_SUBTITLE } from "../components/ui/tokens";
import ErrorState from "../components/ui/ErrorState";

const SERVER_URL = API_URL;

function resolveImg(img) {
  if (!img) return null;
  if (img.startsWith("http") || img.startsWith("blob:")) return img;
  return `${SERVER_URL}${img}`;
}

const FALLBACK = "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800";

const SafeImg = ({ src, className, alt }) => (
  <img
    src={src || FALLBACK}
    onError={(e) => { e.currentTarget.src = FALLBACK; }}
    className={className}
    alt={alt}
  />
);

const SectionTitle = ({ children, sub }) => (
  <div className="mb-4">
    <h2 className="text-lg font-bold text-slate-900">{children}</h2>
    {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
  </div>
);

// ── NewsCard — เพิ่ม onClick ──────────────────────────────────────────────────
const NewsCard = ({ item, highlight, onClick }) => (
  <div
    onClick={onClick}
    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm
               hover:shadow-md hover:border-orange-300 transition cursor-pointer"
  >
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="sm:w-48 md:w-56 shrink-0">
        <SafeImg
          src={item.img}
          alt={item.title}
          className="h-40 sm:h-32 w-full rounded-xl bg-slate-100 object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-600">
            {item.tag}
          </span>
          <span className="text-slate-400">{item.date}</span>
          {item.sub && (
            <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${
              highlight ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {item.sub.length > 50 ? item.sub.substring(0, 50) + "..." : item.sub}
            </span>
          )}
        </div>
        <h4 className="text-base font-semibold leading-snug text-slate-900 break-words line-clamp-2">{item.title}</h4>
        <p className="mt-2 text-xs text-orange-600 font-semibold">อ่านต่อ →</p>
      </div>
    </div>
  </div>
);

// ── ImageGallery — แสดงรูปพร้อม lightbox ────────────────────────────────────
function ImageGallery({ images }) {
  const [lightbox, setLightbox] = useState(null); // index ที่เปิดอยู่

  if (!images?.length) return null;

  const prev = () => setLightbox((i) => (i - 1 + images.length) % images.length);
  const next = () => setLightbox((i) => (i + 1) % images.length);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {images.map((img, idx) => (
          <div
            key={img.ImageId}
            onClick={() => setLightbox(idx)}
            className="cursor-zoom-in rounded-xl overflow-hidden aspect-square"
          >
            <SafeImg
              src={resolveImg(img.ImagePath)}
              alt=""
              className="h-full w-full object-cover hover:scale-105 transition duration-200"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button aria-label="ก่อนหน้า"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 sm:left-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>

          <img
            src={resolveImg(images[lightbox].ImagePath)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />

          <button aria-label="ถัดไป"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 sm:right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          <button aria-label="ปิด"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          <span className="absolute bottom-4 text-white/70 text-sm">
            {lightbox + 1} / {images.length}
          </span>
        </div>
      )}
    </>
  );
}

// ── NewsDetailModal ────────────────────────────────────────────────────────────
function NewsDetailModal({ newsId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${SERVER_URL}/api/news/${newsId}`)
      .then((res) => setDetail(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [newsId]);

  // ปิดด้วย Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <Spinner block label="กำลังโหลด..." />
        ) : !detail ? (
          <div className="p-16 text-center text-slate-400">ไม่พบข้อมูล</div>
        ) : (
          <>
            {/* รูปหน้าปก */}
            {detail.img && (
              <div className="relative h-56 md:h-72 w-full">
                <SafeImg
                  src={resolveImg(detail.img)}
                  alt={detail.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            )}

            <div className="p-5 sm:p-6 md:p-8">
              {/* Badge + วันที่ */}
              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-3 py-1 font-medium">
                  <Tag className="h-3 w-3" />{detail.tag}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Calendar className="h-3 w-3" />{detail.date}
                </span>
              </div>

              {/* หัวข้อ */}
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug mb-4 break-words">
                {detail.title}
              </h2>

              {/* เนื้อหา */}
              {detail.sub && (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line break-words">{detail.sub}</p>
              )}

              {/* รูปเพิ่มเติม */}
              {detail.extraImages?.length > 0 && (
                <>
                  <hr className="my-5 border-slate-100" />
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    รูปภาพเพิ่มเติม ({detail.extraImages.length} รูป)
                  </p>
                  <ImageGallery images={detail.extraImages} />
                </>
              )}

              {/* ปุ่มปิด */}
              <button
                onClick={onClose}
                className="mt-6 w-full py-2.5 rounded-2xl border border-slate-200 text-sm
                           text-slate-600 hover:bg-slate-50 transition font-medium"
              >
                ปิด
              </button>
            </div>
          </>
        )}

        {/* X button */}
        <button aria-label="ปิด"
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur rounded-full p-1.5 shadow hover:bg-white transition"
        >
          <X className="h-4 w-4 text-slate-700" />
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TutorMain() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState(null); // id ที่เปิด modal

  useEffect(() => {
    axios.get(`${SERVER_URL}/api/news?role=tutor`)
      .then((res) => setNews(res.data.map((n) => ({ ...n, img: resolveImg(n.img) }))))
      .catch((err) => { console.error(err); setLoadError(true); })
      .finally(() => setLoading(false));
  }, []);

  const publicNews = news.filter((n) => n.type === "public");
  const tutorNews  = news.filter((n) => n.type === "tutor");

  if (loading) return <Spinner block label="กำลังโหลดข่าวสาร..." />;
  if (loadError) return <div className="px-4 lg:px-0"><ErrorState description="โหลดข่าวสารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" /></div>;

  return (
    <div>
      <div className="px-4 lg:px-0 space-y-2">
        <div className="mb-6">
          <h1 className={PAGE_TITLE}>หน้าหลัก</h1>
          <p className={PAGE_SUBTITLE}>ข่าวสาร ประกาศ และกิจกรรมล่าสุดของสถาบัน</p>
        </div>

        {publicNews.length > 0 && (
          <>
            <SectionTitle sub="ข่าวสารและกิจกรรมล่าสุดของสถาบัน">ข่าวประชาสัมพันธ์</SectionTitle>
            <div className="space-y-3 mb-10">
              {publicNews.map((n) => (
                <NewsCard key={n.id} item={n} onClick={() => setSelectedId(n.id)} />
              ))}
            </div>
          </>
        )}

        {tutorNews.length > 0 && (
          <>
            <SectionTitle sub="ประกาศและข้อมูลสำคัญสำหรับติวเตอร์">ข่าวสำหรับติวเตอร์</SectionTitle>
            <div className="space-y-3">
              {tutorNews.map((n) => (
                <NewsCard key={n.id} item={n} highlight onClick={() => setSelectedId(n.id)} />
              ))}
            </div>
          </>
        )}

        {publicNews.length === 0 && tutorNews.length === 0 && (
          <EmptyState icon={Newspaper} title="ยังไม่มีข่าวในระบบ" description="ข่าวและประกาศใหม่จากสถาบันจะแสดงที่นี่" />
        )}
      </div>

      {/* Modal */}
      {selectedId && (
        <NewsDetailModal newsId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}