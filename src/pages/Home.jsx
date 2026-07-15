// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Percent,
  GraduationCap,
  X,
  Calendar,
  Tag,
  Sparkles,
  Heart,
  Star,
  Award,
  Shield,
} from "lucide-react";
import { getCourses } from "../callapi/callusers";

const API_URL = import.meta.env.VITE_API_URL;

/** ---------- ค่าคงที่อ้างอิงจาก DB (status_course, term) ----------
 * ⚠️ ค่าพวกนี้อิงจากข้อมูลในตารางที่ส่งมาให้ดู ถ้าใน DB จริงมีการเพิ่ม/แก้ค่า
 * Status_Course_Id หรือ Term_Id เพิ่มเติม ต้องมาปรับ mapping ตรงนี้ให้ตรงด้วย
 */
const STATUS = {
  OPEN: 1,        // เปิดรับสมัคร
  TEACHING: 2,    // กำลังสอน
  CLOSED_REG: 3,  // ปิดรับสมัคร
  CLOSED_COURSE: 4, // ปิดคอร์ส -> ไม่แสดง
};

const TERM_LABELS = {
  1: "เปิดเทอม 1 (4 เดือน)",
  2: "ตุลาคม (ปิดเทอมเล็ก)",
  3: "เปิดเทอม 2",
  4: "ปิดเทอมใหญ่ (ซัมเมอร์)",
};


/** ---------- helpers ---------- */
const SafeImg = ({ src, className, alt }) => (
  <img
    src={src}
    onError={(e) => {
      e.currentTarget.src =
        "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1400&auto=format&fit=crop";
    }}
    className={className}
    alt={alt}
  />
);

const resolveCourseImg = (c) =>
  c.CourseImage
    ? c.CourseImage.startsWith("http")
      ? c.CourseImage
      : `${API_URL}${c.CourseImage}`
    : "/gray.jpg";

const resolveNewsImg = (img) => {
  if (!img) return "/gray.jpg";
  return img.startsWith("http") || img.startsWith("blob:") ? img : `${API_URL}${img}`;
};

const resolveImg = (img) => {
  if (!img) return null;
  if (img.startsWith("http") || img.startsWith("blob:")) return img;
  return `${API_URL}${img}`;
};

const formatPrice = (price) =>
  price != null ? `${new Intl.NumberFormat("th-TH").format(price)} บาท` : "-";

const formatThaiDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d)) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
};

const formatDateRange = (start, end) => {
  if (start && end) return `${formatThaiDate(start)} - ${formatThaiDate(end)}`;
  if (start) return `เริ่ม ${formatThaiDate(start)}`;
  return "ยังไม่กำหนดวันเรียน";
};

/** ---------- components ---------- */

const SectionTitle = ({ children, sub }) => (
  <div className="text-center mb-8 md:mb-10">
    <h2 className="text-2xl md:text-[32px] font-extrabold text-orange-500">{children}</h2>
    {sub ? <p className="mt-2 text-gray-500">{sub}</p> : null}
  </div>
);

// การ์ดคอร์ส — รูปลอยทับขอบบนของการ์ดเล็กน้อย พร้อม badge สถานะ/ส่วนลด
const CourseCard = ({ item }) => (
<div className="relative h-full pt-6">

  {/* การ์ด */}
  <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white shadow-sm">

    {/* รูป */}
    <div className="-mt-6 px-2">
      <div className="relative aspect-[4/4] overflow-hidden rounded-2xl">
        <SafeImg
          src={item.img}
          alt={item.title}
          className="h-full w-full object-cover"
        />

        {item.status === STATUS.TEACHING && (
          <span className="absolute top-3 right-3 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
            กำลังสอน
          </span>
        )}
      </div>
    </div>

    {/* เนื้อหา */}
    <div className="flex flex-1 flex-col p-3">
      <div className="line-clamp-2 min-h-[2.75rem] font-semibold leading-snug">
        {item.title}
      </div>
      {/* <div className="mt-1 text-xs text-gray-400">
        {item.dateRange}
      </div> */}

      <div className="mt-auto flex items-center justify-between pt-2">
        <div>
            <div className="flex items-center gap-2">
                <span className="font-bold text-orange-600 text-m">฿</span>
                <span className="text-lg font-bold text-orange-600">
                    {new Intl.NumberFormat("th-TH").format(
                        item.discount
                            ? item.price - item.discount
                            : item.price
                    )} บาท
                </span>

                {item.discount ? (
                    <span className="text-sm text-gray-400 line-through">
                        {new Intl.NumberFormat("th-TH").format(item.price)} บาท
                    </span>
                ) : null}

            </div>

            {item.discount ? (
                <div className="text-[9px] text-gray-400">
                    ราคาพิเศษประหยัดไป {new Intl.NumberFormat("th-TH").format(item.discount)} บาท
                </div>
            ) : null}
        </div>
        </div>
      </div>
    </div>
  </div>
);

// การ์ดข่าว — ดีไซน์เดียวกับ news.jsx
const NewsCard = ({ item, onClick }) => (
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
            <span className="rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700">
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
  const [lightbox, setLightbox] = useState(null);

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

// ── NewsDetailModal ──────────────────────────────────────────────────────
function NewsDetailModal({ newsId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/news/${newsId}`)
      .then((res) => setDetail(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [newsId]);

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
              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-3 py-1 font-medium">
                  <Tag className="h-3 w-3" />{detail.tag}
                </span>
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <Calendar className="h-3 w-3" />{detail.date}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-4">
                {detail.title}
              </h2>

              {detail.sub && (
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{detail.sub}</p>
              )}

              {detail.extraImages?.length > 0 && (
                <>
                  <hr className="my-5 border-gray-100" />
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    รูปภาพเพิ่มเติม ({detail.extraImages.length} รูป)
                  </p>
                  <ImageGallery images={detail.extraImages} />
                </>
              )}

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


/** ---------- main page ---------- */

export default function Home() {
  const [data, setData] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const courses = await getCourses();
        setData(Array.isArray(courses) ? courses : []);
      } catch (err) {
        console.error("Error loading courses:", err);
        setData([]);
      }
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/news`, { params: { role: "public" } })
      .then((res) => setNewsItems(Array.isArray(res.data) ? res.data.slice(0, 2) : []))
      .catch((err) => {
        console.error("Error loading news:", err);
        setNewsItems([]);
      });
  }, []);

  // คอร์สที่ไม่ถูกซ่อน (ไม่ใช่ Status = ปิดคอร์ส)
  const visibleCourses = useMemo(
    () => data.filter((c) => c.Status_Course_Id !== STATUS.CLOSED_COURSE),
    [data]
  );

  // สไลด์ hero — หยิบคอร์สที่ยังแสดงอยู่มาทำเป็นประกาศคอร์สเรียน
  const heroSlides = useMemo(() => visibleCourses.slice(0, 6), [visibleCourses]);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const goPrev = () => setHeroIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length);
  const goNext = () => setHeroIndex((i) => (i + 1) % heroSlides.length);
  const activeSlide = heroSlides[heroIndex];

  // จัดกลุ่มคอร์สตามเทอมจริงจาก DB — เทอมไหนไม่มีคอร์ส ไม่แสดงหัวข้อนั้น
  const termGroups = useMemo(() => {
    const known = [1, 2, 3, 4]
      .map((tid) => ({
        id: tid,
        label: TERM_LABELS[tid],
        courses: visibleCourses.filter((c) => c.Term_Id === tid),
      }))
      .filter((g) => g.courses.length > 0);

    // กันคอร์สที่ Term_Id ไม่ตรงกับ 1-4 (หรือไม่มีค่า) หายไปเงียบๆ
    const others = visibleCourses.filter((c) => ![1, 2, 3, 4].includes(c.Term_Id));
    if (others.length) known.push({ id: "other", label: "คอร์สอื่นๆ", courses: others });

    return known;
  }, [visibleCourses]);

const toCourseCardItem = (c) => ({
    title: c.CourseName,
    price: Number(c.Price),
    discount: Number(c.Discount || 0),
    dateRange: formatDateRange(c.StartDate, c.LastDate),
    status: c.Status_Course_Id,
    img: resolveCourseImg(c),
});

  return (
    <div className="pb-24">
      
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* ========== HERO — ประกาศคอร์สเรียนแบบสไลด์ ========== */}
        <div className="mt-[108px]">
          <div className="relative overflow-hidden rounded-[28px] shadow-sm">
            <div className="relative aspect-[16/5] w-full bg-gray-100">
              {activeSlide ? (
                <Link
                  to={`/courses/${activeSlide.CourseID}`}
                  className="group absolute inset-0 block"
                >
                  <SafeImg
                    src={resolveCourseImg(activeSlide)}
                    alt={activeSlide.CourseName}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
                    <h3 className="mt-3 max-w-xl text-base font-bold text-white line-clamp-2 md:text-2xl">
                      {activeSlide.CourseName}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-white/90 md:text-base">
                      {formatPrice(activeSlide.Price)}
                    </p>
                  </div>
                </Link>
              ) : (
                <SafeImg src="/one.jpg" alt="hero" className="h-full w-full object-cover" />
              )}

              {/* ปุ่มเลื่อนซ้าย/ขวา */}
              {heroSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="คอร์สก่อนหน้า"
                    className="absolute left-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-orange-500 transition md:left-4 md:h-11 md:w-11"
                  >
                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="คอร์สถัดไป"
                    className="absolute right-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-orange-500 transition md:right-4 md:h-11 md:w-11"
                  >
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                  </button>

                  <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                    {heroSlides.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === heroIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* เมนูลัด: โปรโมชั่น / สมัครติวเตอร์ — ทับมุมขวาบนของประกาศ */}
              <div className="absolute right-2 top-2 z-20 flex flex-col gap-2 md:right-5 md:top-5 md:gap-3">
                <Link
                  to="/courses"
                  className="flex w-12 flex-col items-center justify-center gap-1 rounded-2xl bg-white/95 py-2 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl sm:w-14 md:w-20 md:rounded-3xl md:py-3"
                >
                  <Percent className="h-4 w-4 text-orange-500 md:h-5 md:w-5" />
                  <span className="text-[8px] font-semibold text-gray-700 sm:text-[9px] md:text-[11px]">
                    โปรโมชั่น
                  </span>
                </Link>
                <Link
                  to="/apply-tutor"
                  className="flex w-12 flex-col items-center justify-center gap-1 rounded-2xl bg-white/95 py-2 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl sm:w-14 md:w-20 md:rounded-3xl md:py-3"
                >
                  <GraduationCap className="h-4 w-4 text-orange-500 md:h-5 md:w-5" />
                  <span className="text-center text-[8px] font-semibold leading-tight text-gray-700 sm:text-[9px] md:text-[11px]">
                    สมัครติวเตอร์
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>


        {/* ========== ABOUT ========== */}
        <div className="mt-10">
          <h2 className="text-[28px] font-extrabold text-orange-500 md:text-[34px]">
            ศรเสริมติวเตอร์
          </h2>
          <p className="mt-3 text-gray-700 leading-relaxed">
            "ติวจริง ติวตรง มีผลงาน ใส่ใจทุกๆพัฒนาการของนักเรียน"
          </p>
          <p className="mt-2 text-gray-600 leading-relaxed">
            รับติวตั้งแต่ระดับ ม.1 - ม.6 ทั้งเพิ่มเกรด / สอบเข้า / สอบแข่งขัน /
            สอบสนามเฉพาะ โดยทีมสอนที่จบคณะครุศาตร์อันดับต้น ๆ
            จากมหาวิทยาลัยขอนแก่น (3 ปีซ้อน)
          </p>
        </div>

        {/* ========== COURSES แยกตามเทอมจริงจาก DB ========== */}
        {termGroups.length > 0 ? (
          termGroups.map((group) => (
            <section key={group.id} className="mt-12">
              <div className="flex items-center justify-between">
                <h3 className="text-[22px] font-extrabold md:text-[24px]">
                  คอร์สเรียน {group.label}
                </h3>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 pt-4 sm:grid-cols-3 md:gap-x-6 lg:grid-cols-5">
                {group.courses.map((c) => (
                  <Link
                    key={c.CourseID}
                    to={`/courses/${c.CourseID}`}
                    className="block h-full transition-all duration-300 hover:-translate-y-1"
                  >
                    <CourseCard item={toCourseCardItem(c)} />
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="mt-12 rounded-3xl bg-white p-10 text-center text-gray-400 shadow-sm">
            ยังไม่มีคอร์สเรียนเปิดสอนในขณะนี้
          </div>
        )}

        {/* ========== NEWS — ดีไซน์เดียวกับ news.jsx ดึงข้อมูลจริงจาก API ========== */}
        <div className="mt-16">
          <SectionTitle sub="รวมข่าวสารและกิจกรรมล่าสุดจากสถาบัน เพื่อให้นักเรียนและผู้ปกครองไม่พลาดทุกโอกาสการเรียนรู้">
            ข่าวประชาสัมพันธ์
          </SectionTitle>

          {newsItems.length > 0 ? (
            <div className="space-y-4">
            {newsItems.map((n) => (
              <NewsCard
                key={n.id}
                item={{
                  tag: n.tag,
                  date: n.date,
                  sub: n.sub,
                  title: n.title,
                  img: resolveNewsImg(n.img),
                }}
                onClick={() => setSelectedId(n.id)}
              />
            ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center text-gray-400 shadow-sm">
              ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้
            </div>
          )}
        </div>

        {/* ========== CTA ========== */}
        <div className="mt-8 text-center">
          <Link
            to="/news"
            className="inline-block rounded-full bg-orange-500 px-6 py-2 text-white shadow transition hover:bg-orange-600"
          >
            อ่านเพิ่มเติม
          </Link>
        </div>
      </div>
          {selectedId && (
      <NewsDetailModal
        newsId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    )}
    </div>
  );
}