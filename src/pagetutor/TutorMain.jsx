import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, ChevronLeft, ChevronRight, Calendar, Tag } from "lucide-react";

const SERVER_URL = "http://localhost:3000";

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
  <div className="text-center mb-8 md:mb-10">
    <h2 className="text-2xl md:text-[32px] font-extrabold text-orange-500">{children}</h2>
    {sub && <p className="mt-2 text-gray-500">{sub}</p>}
  </div>
);

// ── NewsCard — เพิ่ม onClick ──────────────────────────────────────────────────
const NewsCard = ({ item, highlight, onClick }) => (
  <div
    onClick={onClick}
    className="rounded-3xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm
               hover:shadow-md hover:border-orange-200 transition cursor-pointer"
  >
    <div className="flex flex-col md:flex-row gap-4">
      <div className="md:w-[36%]">
        <SafeImg
          src={item.img}
          alt={item.title}
          className="h-40 w-full rounded-2xl object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            {item.tag}
          </span>
          <span className="text-gray-400">{item.date}</span>
          {item.sub && (
            <span className={`rounded-full px-2 py-0.5 ${
              highlight ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {item.sub.length > 50 ? item.sub.substring(0, 50) + "..." : item.sub}
            </span>
          )}
        </div>
        <h4 className="text-[15px] md:text-base font-semibold leading-relaxed">{item.title}</h4>
        <p className="mt-1 text-xs text-orange-500 font-medium">อ่านต่อ →</p>
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
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>

          <img
            src={resolveImg(images[lightbox].ImagePath)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          <button
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
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-16 text-center text-gray-400">กำลังโหลด...</div>
        ) : !detail ? (
          <div className="p-16 text-center text-gray-400">ไม่พบข้อมูล</div>
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

            <div className="p-6 md:p-8">
              {/* Badge + วันที่ */}
              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-3 py-1 font-medium">
                  <Tag className="h-3 w-3" />{detail.tag}
                </span>
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <Calendar className="h-3 w-3" />{detail.date}
                </span>
              </div>

              {/* หัวข้อ */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-4">
                {detail.title}
              </h2>

              {/* เนื้อหา */}
              {detail.sub && (
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{detail.sub}</p>
              )}

              {/* รูปเพิ่มเติม */}
              {detail.extraImages?.length > 0 && (
                <>
                  <hr className="my-5 border-gray-100" />
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    รูปภาพเพิ่มเติม ({detail.extraImages.length} รูป)
                  </p>
                  <ImageGallery images={detail.extraImages} />
                </>
              )}

              {/* ปุ่มปิด */}
              <button
                onClick={onClose}
                className="mt-6 w-full py-2.5 rounded-2xl border border-gray-200 text-sm
                           text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                ปิด
              </button>
            </div>
          </>
        )}

        {/* X button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur rounded-full p-1.5 shadow hover:bg-white transition"
        >
          <X className="h-4 w-4 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TutorMain() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null); // id ที่เปิด modal

  useEffect(() => {
    axios.get(`${SERVER_URL}/api/news?role=tutor`)
      .then((res) => setNews(res.data.map((n) => ({ ...n, img: resolveImg(n.img) }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const publicNews = news.filter((n) => n.type === "public");
  const tutorNews  = news.filter((n) => n.type === "tutor");

  if (loading) return <div className="mt-20 text-center text-gray-500">กำลังโหลดข่าวสาร...</div>;

  return (
    <div className="pb-24">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 mt-20">

        {publicNews.length > 0 && (
          <>
            <SectionTitle sub="ข่าวสารและกิจกรรมล่าสุดของสถาบัน">ข่าวประชาสัมพันธ์</SectionTitle>
            <div className="space-y-4 mb-16">
              {publicNews.map((n) => (
                <NewsCard key={n.id} item={n} onClick={() => setSelectedId(n.id)} />
              ))}
            </div>
          </>
        )}

        {tutorNews.length > 0 && (
          <>
            <SectionTitle sub="ประกาศและข้อมูลสำคัญสำหรับติวเตอร์">ข่าวสำหรับติวเตอร์</SectionTitle>
            <div className="space-y-4">
              {tutorNews.map((n) => (
                <NewsCard key={n.id} item={n} highlight onClick={() => setSelectedId(n.id)} />
              ))}
            </div>
          </>
        )}

        {publicNews.length === 0 && tutorNews.length === 0 && (
          <div className="text-center py-20 text-gray-400">ยังไม่มีข่าวในระบบ</div>
        )}
      </div>

      {/* Modal */}
      {selectedId && (
        <NewsDetailModal newsId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}