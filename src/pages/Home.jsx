// src/pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ShoppingCart,
  Users,
  Trophy,
  BookOpenCheck,
  BadgeCheck,
} from "lucide-react";
import { getCourses } from "../callapi/callusers";
import { getStudentCourses } from "../callapi/callusers_student";
import { useShop } from "../context/ShopContext";
import { CourseCheckoutModal } from "./Cart";

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

// ★ badge สถานะคอร์ส
const STATUS_BADGE = {
  [STATUS.OPEN]: { label: "เปิดรับสมัคร", cls: "bg-blue-50/95 text-blue-600 border border-blue-100" },
  [STATUS.TEACHING]: { label: "กำลังสอน", cls: "bg-emerald-50/95 text-emerald-600 border border-emerald-100" },
  [STATUS.CLOSED_REG]: { label: "ปิดรับสมัคร", cls: "bg-amber-50/95 text-amber-600 border border-amber-100" },
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

const formatNumber = (n) => new Intl.NumberFormat("th-TH").format(Number(n || 0));

const getOptionLabel = (value, keys = []) => {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.length ? getOptionLabel(value[0], keys) : null;
  for (const key of [...keys, "label", "name", "Name", "value"]) {
    const candidate = value?.[key];
    if (typeof candidate === "string" || typeof candidate === "number") return String(candidate);
  }
  return null;
};

const AVAILABILITY_LABELS = {
  1: "เรียนออนไซต์",
  2: "เรียนออนไลน์",
  3: "เรียนไฮบริด",
};

const isTruthyFlag = (value) => {
  if (typeof value === "object" && value !== null) {
    return isTruthyFlag(value.value ?? value.Is_Promotion ?? value.isPromotion);
  }
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
};

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

/** ---------- utility hooks (scroll reveal / count up) ---------- */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function useCountUp(target, active, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

const Reveal = ({ children, className = "", delay = 0 }) => {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity .7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/** ---------- small design atoms ---------- */

const SectionEyebrow = ({ children }) => (
  <div className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-orange-500">
    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
    {children}
  </div>
);

const SectionTitle = ({ children, sub, eyebrow, align = "center" }) => (
  <div className={`mb-8 md:mb-10 ${align === "center" ? "text-center" : ""}`}>
    {eyebrow && (
      <div className={`mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-orange-500 ${align === "center" ? "justify-center" : ""}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        {eyebrow}
      </div>
    )}
    <h2
      className="text-2xl md:text-[32px] font-extrabold text-[#14213D]"
      style={{ fontFamily: "'Kanit', sans-serif" }}
    >
      {children}
    </h2>
    {sub ? <p className="mt-2.5 text-gray-500 max-w-2xl mx-auto leading-relaxed">{sub}</p> : null}
  </div>
);

/**
 * ── AboutFlashcard ───────────────────────────────────────────────────────
 * การ์ดคอร์สแบบหมุนวนข้าง section "ศรเสริมติวเตอร์" — ใช้รูปคอร์สจริง
 * แสดงแค่ รูป / ชื่อคอร์ส / ราคา พร้อม dot indicator ให้คลิกเลือกได้
 */
function AboutFlashcard({ courses }) {
  const [idx, setIdx] = useState(0);

  const slides = useMemo(() => {
    return Array.isArray(courses) ? courses.slice(0, 5) : [];
  }, [courses]);

  useEffect(() => {
    setIdx(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;

    const timer = setInterval(() => {
      setIdx((current) => (current + 1) % slides.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="relative mx-auto h-[250px] w-full max-w-[360px] md:mx-0 md:ml-auto">
      {slides.map((course, i) => {
        const offset = (i - idx + slides.length) % slides.length;
        const isTop = offset === 0;

        const price = Number(course.Price || 0);
        const discount = Number(course.Discount || 0);
        const finalPrice = Math.max(price - discount, 0);

        return (
          <Link
            key={course.CourseID}
            to={`/courses/${course.CourseID}`}
            className={[
              "group absolute inset-0 overflow-hidden rounded-3xl border",
              "bg-white shadow-xl",
              "transition-all duration-700",
              "ease-[cubic-bezier(.16,1,.3,1)]",
              isTop
                ? "pointer-events-auto"
                : "pointer-events-none",
            ].join(" ")}
            style={{
              background:
                "linear-gradient(160deg, #ffffff 0%, #FFF3E8 100%)",
              borderColor: "rgba(20,33,61,0.08)",
              transform: `
                translateY(${offset * 14}px)
                scale(${Math.max(1 - offset * 0.05, 0.8)})
                rotate(${offset === 0 ? 0 : offset * 2}deg)
              `,
              zIndex: slides.length - offset,
              opacity: offset > 2 ? 0 : 1,
              visibility: offset > 2 ? "hidden" : "visible",
            }}
          >
            {/* รูปภาพคอร์ส */}
            <div className="relative h-full overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100">
              <SafeImg
                src={resolveCourseImg(course)}
                alt={course.CourseName || "รูปภาพคอร์ส"}
                className={[
                  "h-full w-full object-cover",
                  "transition-transform duration-700",
                  isTop ? "group-hover:scale-105" : "",
                ].join(" ")}
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

              {course.Subject && (
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-orange-600 shadow-sm backdrop-blur-md">
                  {course.Subject}
                </span>
              )}

              {course.Status_Course_Id === STATUS.TEACHING && (
                <span className="absolute right-4 top-4 rounded-full border border-emerald-100 bg-emerald-50/95 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-600 shadow-sm backdrop-blur-md">
                  กำลังสอน
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5">
                <h3 className="line-clamp-1 pr-20 text-sm font-bold drop-shadow-md md:text-base">
                  {course.CourseName || "ไม่พบชื่อคอร์ส"}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="font-bold text-orange-100">{formatPrice(finalPrice)}</span>
                  {discount > 0 && <span className="text-[10px] text-white/60 line-through">{formatPrice(price)}</span>}
                </div>
              </div>

              {isTop && slides.length > 1 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1">
                  {slides.map((_, dotIndex) => (
                    <button
                      key={dotIndex}
                      type="button"
                      aria-label={`แสดงคอร์สลำดับที่ ${dotIndex + 1}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setIdx(dotIndex);
                      }}
                      className={`h-1.5 rounded-full shadow-sm transition-all ${dotIndex === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* รายละเอียดคอร์ส */}
            {/* <div className="flex h-[10px] flex-col justify-between p-6">
              <h3
                className="line-clamp-2 min-h-[3.2rem] text-[19px] font-bold leading-snug text-[#14213D]"
                style={{ fontFamily: "'Kanit', sans-serif" }}
              >
                {course.CourseName || "ไม่พบชื่อคอร์ส"}
              </h3>

              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="whitespace-nowrap text-2xl font-extrabold text-orange-500">
                    ฿{formatNumber(finalPrice)}
                  </div>

                  {discount > 0 && (
                    <div className="whitespace-nowrap text-xs text-gray-400 line-through">
                      ฿{formatNumber(price)}
                    </div>
                  )}
                </div>

                {isTop && slides.length > 1 && (
                  <div className="flex shrink-0 items-center gap-1">
                    {slides.map((_, dotIndex) => (
                      <button
                        key={dotIndex}
                        type="button"
                        aria-label={`แสดงคอร์สลำดับที่ ${dotIndex + 1}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setIdx(dotIndex);
                        }}
                        className="flex h-5 items-center justify-center px-1"
                      >
                        <span
                          className="block h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: dotIndex === idx ? "18px" : "6px",
                            background:
                              dotIndex === idx
                                ? "#F97316"
                                : "rgba(20,33,61,0.15)",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div> */}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * ── Course card ──────────────────────────────────────────────────────────
 * โครงสร้าง/แท็กยึดตาม CourseCard ใน Admincoures.jsx (ไม่รวมจำนวนนักเรียน)
 * ปุ่มเพิ่มลงตะกร้า/ถูกใจ ใช้สไตล์เดียวกับ CourseSearch.jsx
 */
const CourseCard = ({ item, isFav, inCart, isEnrolled, canEnroll, onBuyNow, onAddToCart, onToggleFavorite }) => {
  const statusBadge = STATUS_BADGE[item.status];
  const actionDisabled = isEnrolled || !canEnroll;
  const actionLabel = isEnrolled ? "มีคอร์สนี้แล้ว" : !canEnroll ? statusBadge?.label || "ไม่เปิดรับสมัคร" : "ซื้อคอร์สเรียน";

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl">
      {/* รูป */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100">
        <SafeImg
          src={item.img}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {statusBadge && (
          <span className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        )}
      </div>

      {/* เนื้อหา */}
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 min-h-[2.6rem] text-[13.5px] font-bold leading-snug text-neutral-800">
          {item.title}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-orange-400" />
          <span className="truncate">{item.dateRange}</span>
        </div>

        {/* ราคาสุทธิ + ราคาก่อนลด — ตรงตาม Admincoures.jsx */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-sm font-bold text-green-500">฿</span>
          <span className="text-sm font-bold text-green-700">{formatNumber(item.fullCost)} บาท</span>
          {item.discount > 0 && (
            <span className="text-[11px] text-neutral-400 line-through">{formatNumber(item.price)} บาท</span>
          )}
        </div>

        {/* แสดงเฉพาะข้อมูลหลักของคอร์ส: โปรโมชัน / เทอม / ประเภท / รูปแบบเรียน */}
        <div className="mb-3 mt-2.5 flex flex-wrap gap-1.5">
          {item.isPromotion && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              <Sparkles className="h-3 w-3" /> โปรโมชัน
            </span>
          )}
          {item.courseType && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              {item.courseType === "bundle" ? "คอร์สรวม" : item.courseType === "single" ? "คอร์สเดี่ยว" : item.courseType}
            </span>
          )}
          {item.availabilityName && (
            <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
              {item.availabilityName}
            </span>
          )}
        </div>

        {/* ปุ่มซื้อหลัก ตามด้วยตะกร้าและรายการโปรดขนาดเท่ากัน */}
        <div className="mt-auto flex items-center gap-2 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBuyNow();
            }}
            disabled={actionDisabled}
            title={!canEnroll ? `คอร์สนี้${statusBadge?.label || "ไม่เปิดรับสมัคร"}` : undefined}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-[11px] font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:opacity-100"
          >
            {actionLabel}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart();
            }}
            disabled={isEnrolled}
            aria-pressed={inCart}
            aria-label={isEnrolled ? "มีคอร์สนี้แล้ว" : inCart ? "นำออกจากตะกร้า" : "เพิ่มลงตะกร้า"}
            title={isEnrolled ? "มีคอร์สนี้แล้ว" : inCart ? "นำออกจากตะกร้า" : "เพิ่มลงตะกร้า"}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
              inCart
                ? "border-orange-300 bg-orange-100 text-orange-600 hover:border-orange-400 hover:bg-orange-100"
                : "border-gray-200 bg-white text-gray-400 hover:border-orange-200 hover:text-orange-400"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={isFav ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
            title={isFav ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${
              isFav
                ? "border-red-200 bg-red-50 text-red-500"
                : "border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400"
            }`}
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-red-400" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * ── CourseCarousel ───────────────────────────────────────────────────────
 * แสดงคอร์สของแต่ละเทอมแบบแถวเดียว เลื่อนซ้าย/ขวาได้
 * กด "ทั้งหมด" เพื่อขยายเป็น grid เต็ม (ดันเนื้อหาถัดไปลงมา)
 */
function CourseCarousel({ group, favorites, cart, enrolledCourseIds, onBuyNow, toggleCart, toggleFavorite, toCourseCardItem }) {
  const scrollRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  const scrollByPage = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.92, behavior: "smooth" });
  };

  const renderCard = (c) => {
    const item = toCourseCardItem(c);
    const isFav = favorites.some((f) => f.id === c.CourseID);
    const inCart = cart.some((f) => f.id === c.CourseID);
    const isEnrolled = enrolledCourseIds.has(String(c.CourseID));
    const canEnroll = ![STATUS.CLOSED_REG, STATUS.CLOSED_COURSE].includes(Number(c.Status_Course_Id));
    const courseData = item;
    return (
      <Link key={c.CourseID} to={`/courses/${c.CourseID}`} className="block h-full">
        <CourseCard
          item={item}
          isFav={isFav}
          inCart={inCart}
          isEnrolled={isEnrolled}
          canEnroll={canEnroll}
          onBuyNow={() => onBuyNow(courseData)}
          onAddToCart={() => toggleCart(courseData)}
          onToggleFavorite={() => toggleFavorite(courseData)}
        />
      </Link>
    );
  };

  return (
    <Reveal>
      <section className="mt-14">
        <div className="flex items-center justify-between gap-3">
          <h3
            className="text-[20px] font-extrabold text-[#14213D] md:text-[24px]"
            style={{ fontFamily: "'Kanit', sans-serif" }}
          >
            คอร์สเรียน {group.label}
          </h3>
          <div className="flex items-center gap-2">
            {!expanded && group.courses.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollByPage(-1)}
                  aria-label="เลื่อนซ้าย"
                  className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-[#14213D] transition hover:border-orange-300 hover:text-orange-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByPage(1)}
                  aria-label="เลื่อนขวา"
                  className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-[#14213D] transition hover:border-orange-300 hover:text-orange-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="whitespace-nowrap rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[12.5px] font-bold text-orange-600 transition hover:bg-orange-100"
            >
              {expanded ? "ย่อกลับ" : "ทั้งหมด"}
            </button>
          </div>
        </div>

        {!expanded ? (
          <div
            ref={scrollRef}
            className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {group.courses.map((c) => (
              <div
                key={c.CourseID}
                className="w-[calc(50%-8px)] shrink-0 snap-start sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)]"
              >
                {renderCard(c)}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
            {group.courses.map((c) => renderCard(c))}
          </div>
        )}
      </section>
    </Reveal>
  );
}

// การ์ดข่าว
const NewsCard = ({ item, onClick }) => (
  <div
    onClick={onClick}
    className="group cursor-pointer rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg md:p-5"
  >
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="overflow-hidden rounded-2xl md:w-[36%]">
        <SafeImg
          src={item.img}
          alt={item.title}
          className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            {item.tag}
          </span>
          <span className="text-gray-400">{item.date}</span>
          {item.sub && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
              {item.sub.length > 50 ? item.sub.substring(0, 50) + "..." : item.sub}
            </span>
          )}
        </div>
        <h4 className="text-[15px] font-semibold leading-relaxed md:text-base">{item.title}</h4>
        <p className="mt-1 text-xs font-medium text-orange-500">อ่านต่อ →</p>
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
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm"
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

/** ---------- trust strip ---------- */
function TrustStrip() {
  const items = [
    { icon: Trophy, label: "อันดับต้น 3 ปีซ้อน", sub: "คณะครุศาสตร์ มข." },
    { icon: Users, label: "ดูแลใกล้ชิดรายบุคคล", sub: "ห้องเรียนขนาดเล็ก" },
    { icon: BookOpenCheck, label: "ติดตามผลผ่าน LINE", sub: "ผู้ปกครองอุ่นใจ" },
    { icon: BadgeCheck, label: "ตรวจสลิปอัตโนมัติ", sub: "ชำระเงินปลอดภัย" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 rounded-3xl border border-gray-100 bg-white/70 p-5 shadow-sm backdrop-blur md:grid-cols-4 md:gap-6 md:p-6">
      {items.map((it, i) => (
        <Reveal key={it.label} delay={i * 80} className="flex items-center gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-orange-50 md:h-11 md:w-11">
            <it.icon className="h-5 w-5 text-orange-500" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-bold text-[#14213D] md:text-[13px]">{it.label}</div>
            <div className="truncate text-[10.5px] text-gray-400 md:text-[11px]">{it.sub}</div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/** ---------- stats — animated counters ---------- */
function Stats() {
  const [ref, visible] = useReveal();
  const stats = [
    { value: 1200, suffix: "+", label: "นักเรียนที่ผ่านการติว" },
    { value: 96, suffix: "%", label: "ผู้ปกครองแนะนำต่อ" },
    { value: 45, suffix: "+", label: "คอร์สเรียนต่อปี" },
    { value: 8, suffix: " ปี", label: "ประสบการณ์การสอน" },
  ];
  return (
    <section ref={ref} className="mt-6 overflow-hidden rounded-[32px] py-14" style={{ background: "#14213D" }}>
      <div className="mx-auto max-w-[1100px] px-5 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => {
            const val = useCountUp(s.value, visible);
            return (
              <div key={s.label} className="text-center">
                <div
                  className="text-[32px] font-extrabold md:text-[40px]"
                  style={{ color: "#FDBA74", fontFamily: "'Kanit', sans-serif" }}
                >
                  {val}
                  <span style={{ color: "#F97316" }}>{s.suffix}</span>
                </div>
                <div className="mt-1 text-[12.5px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** ---------- features / value props ---------- */
function Features() {
  const features = [
    { icon: GraduationCap, title: "ติวเตอร์คุณภาพ", desc: "คัดเลือกจากบัณฑิตครุศาสตร์ มข. อันดับต้น พร้อมอบรมเทคนิคการสอนต่อเนื่อง" },
    { icon: Users, title: "ห้องเรียนขนาดเล็ก", desc: "จำกัดไม่เกิน 8 คนต่อห้อง เพื่อให้ครูดูแลจุดอ่อน-จุดแข็งของนักเรียนแต่ละคน" },
    { icon: BookOpenCheck, title: "ติดตามพัฒนาการ", desc: "รายงานผลการเรียน คะแนนสอบ และการบ้าน ผ่าน LINE Official ทุกสัปดาห์" },
    { icon: BadgeCheck, title: "ชำระเงินปลอดภัย", desc: "ตรวจสอบสลิปโอนเงินอัตโนมัติ พร้อมใบเสร็จอิเล็กทรอนิกส์ทันที" },
  ];
  return (
    <section className="mt-14">
      <Reveal>
        <SectionEyebrow>ทำไมต้องศรเสริม</SectionEyebrow>
        <h2
          className="max-w-lg text-[24px] font-extrabold leading-tight md:text-[32px]"
          style={{ color: "#14213D", fontFamily: "'Kanit', sans-serif" }}
        >
          ออกแบบการเรียนรอบด้าน เพื่อผลลัพธ์ที่วัดได้จริง
        </h2>
      </Reveal>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 90}>
            <div
              className="group h-full rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1.5"
              style={{ borderColor: "rgba(20,33,61,0.07)", background: "linear-gradient(160deg,#ffffff,#FFFBF6)" }}
            >
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ background: "linear-gradient(135deg,#FDBA74,#F97316)" }}
              >
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-5 text-[16px] font-bold" style={{ color: "#14213D" }}>{f.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "#6B7280" }}>{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** ---------- main page ---------- */

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());

  const [selectedId, setSelectedId] = useState(null);

  const { cart, favorites, toggleCart, toggleFavorite } = useShop();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [buyNowCourse, setBuyNowCourse] = useState(null);

  const handleBuyNow = (course) => {
    if (!localStorage.getItem("student_token")) {
      setLoginPromptOpen(true);
      return;
    }
    setBuyNowCourse(course);
  };

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) return;
    getStudentCourses(token)
      .then((courses) => {
        const rows = Array.isArray(courses) ? courses : courses?.courses ?? courses?.data ?? [];
        setEnrolledCourseIds(new Set(rows.map((course) => String(course.CourseID ?? course.courseId ?? course.id))));
      })
      .catch((error) => console.warn("โหลดคอร์สที่ลงทะเบียนแล้วไม่สำเร็จ:", error));
  }, []);

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
        courses: visibleCourses.filter((c) => Number(c.Term_Id) === tid),
      }))
      .filter((g) => g.courses.length > 0);

    // กันคอร์สที่ Term_Id ไม่ตรงกับ 1-4 (หรือไม่มีค่า) หายไปเงียบๆ
    const others = visibleCourses.filter((c) => ![1, 2, 3, 4].includes(Number(c.Term_Id)));
    if (others.length) known.push({ id: "other", label: "คอร์สอื่นๆ", courses: others });

    return known;
  }, [visibleCourses]);

  // ★ รวมทุกฟิลด์ที่การ์ดใหม่ต้องใช้ (ราคา/ส่วนลด/แท็ก ฯลฯ) จากตัวแปรจริงในข้อมูลคอร์ส
  const toCourseCardItem = (c) => ({
    id: c.CourseID,
    title: c.CourseName,
    price: Number(c.Price || 0),
    discount: Number(c.Discount || 0),
    fullCost:
      c.FullCost != null
        ? Number(c.FullCost)
        : Math.max(0, Number(c.Price || 0) - Number(c.Discount || 0)),
    dateRange: formatDateRange(c.StartDate, c.LastDate),
    status: c.Status_Course_Id,
    img: resolveCourseImg(c),
    isPromotion:
      isTruthyFlag(c.Is_Promotion ?? c.isPromotion ?? c.IsPromotion ?? c.is_promotion) ||
      Number(c.Discount || 0) > 0,
    courseType:
      getOptionLabel(c.Course_Type ?? c.CourseType, ["Course_Type", "courseType", "Type_Name"]) ||
      ((Array.isArray(c.Subjects) ? c.Subjects.length : 0) > 1 ? "bundle" : "single"),
    availabilityName:
      getOptionLabel(c.Course_Availability_Name ?? c.CourseAvailability, ["Course_Availability_Name", "availabilityName"]) ||
      AVAILABILITY_LABELS[Number(c.Course_Availability_Id ?? c.courseAvailabilityId)] ||
      "ยังไม่ระบุรูปแบบ",
    videosFree: Number(c.VideosFree || 0),
    maxStudents: c.MaxStudents != null ? Number(c.MaxStudents) : null,
    studentCount: Number(c.StudentCount || 0),
    installments: Number(c.Installments || 1),
    installmentAmounts: c.InstallmentAmounts || null,
    totalCourseHours: Number(c.TotalCourseHours || 0),
    termName: c.Term_Name ?? TERM_LABELS[Number(c.Term_Id)] ?? null,
    Term_Name: c.Term_Name ?? TERM_LABELS[Number(c.Term_Id)] ?? null,
    Term_Id: c.Term_Id,
  });

  return (
    <div className="pb-24" style={{ fontFamily: "'Kanit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700;800&display=swap');
      `}</style>

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
              {/* <div className="absolute right-2 top-2 z-20 flex flex-col gap-2 md:right-5 md:top-5 md:gap-3">
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
              </div> */}
            </div>
          </div>
        </div>

        {/* ========== ABOUT — ดีไซน์ 2 คอลัมน์ พร้อมการ์ดคอร์สหมุนวน ========== */}
        <section className="mt-14">
          <div className="grid items-start gap-10 md:grid-cols-2">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                <BadgeCheck className="h-3.5 w-3.5" /> ทีมสอนจากคณะครุศาสตร์ มข. อันดับต้น 3 ปีซ้อน
              </span>
              <h2
                className="mt-4 text-[28px] font-extrabold text-orange-500 md:text-[34px]"
                style={{ fontFamily: "'Kanit', sans-serif" }}
              >
                ศรเสริมติวเตอร์
              </h2>
              <p className="mt-3 text-[17px] font-bold leading-relaxed text-[#14213D] md:text-[19px]">
                "ติวจริง ติวตรง มีผลงาน ใส่ใจทุกๆพัฒนาการของนักเรียน"
              </p>
              <p className="mt-3 text-gray-600 leading-relaxed">
                รับติวตั้งแต่ระดับ ม.1 - ม.6 ทั้งเพิ่มเกรด / สอบเข้า / สอบแข่งขัน /
                สอบสนามเฉพาะ โดยทีมสอนที่จบคณะครุศาตร์อันดับต้น ๆ
                จากมหาวิทยาลัยขอนแก่น (3 ปีซ้อน)
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => document.getElementById("home-courses")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(249,115,22,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg,#FB923C 0%,#F97316 55%,#EA580C 100%)" }}
                >
                  <GraduationCap className="h-4 w-4" /> ดูคอร์สเรียนทั้งหมด
                </button>
                <Link
                  to="/promotion"
                  className="inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-[14px] font-bold transition-all duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(20,33,61,0.15)", color: "#14213D" }}
                >
                  <Percent className="h-4 w-4" /> โปรโมชันวันนี้
                </Link>
              </div>
            </Reveal>

            <Reveal delay={120} className="md:flex md:justify-end">
              <AboutFlashcard courses={visibleCourses} />
            </Reveal>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <Features />

        {/* ========== COURSES แยกตามเทอมจริงจาก DB — เลื่อนซ้าย/ขวา + กด "ทั้งหมด" เพื่อขยาย ========== */}
        <div id="home-courses" className="scroll-mt-28">
          {termGroups.length > 0 ? (
            termGroups.map((group) => (
              <CourseCarousel
                key={group.id}
                group={group}
                favorites={favorites}
                cart={cart}
                enrolledCourseIds={enrolledCourseIds}
                onBuyNow={handleBuyNow}
                toggleCart={toggleCart}
                toggleFavorite={toggleFavorite}
                toCourseCardItem={toCourseCardItem}
              />
            ))
          ) : (
            <div className="mt-12 rounded-3xl bg-white p-10 text-center text-gray-400 shadow-sm">
              ยังไม่มีคอร์สเรียนเปิดสอนในขณะนี้
            </div>
          )}
        </div>

        {/* ========== TRUST STRIP + STATS — ย้ายมาไว้หลังคอร์สเรียน ก่อนข่าวประชาสัมพันธ์ ========== */}
        <div className="mt-14">
          <TrustStrip />
        </div>
        <Stats />

        {/* ========== NEWS ========== */}
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

      {buyNowCourse && (
        <CourseCheckoutModal
          course={buyNowCourse}
          onClose={() => setBuyNowCourse(null)}
        />
      )}

      {loginPromptOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="login-required-title" onClick={() => setLoginPromptOpen(false)}>
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setLoginPromptOpen(false)} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="ปิด">
              <X className="h-5 w-5" />
            </button>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-500"><Users className="h-7 w-7" /></span>
            <h2 id="login-required-title" className="mt-5 text-xl font-extrabold text-[#14213D]">กรุณาเข้าสู่ระบบก่อนซื้อคอร์ส</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">เข้าสู่ระบบนักเรียนเพื่อดำเนินการชำระเงินและบันทึกคอร์สไว้ในบัญชีของคุณ</p>
            <button type="button" onClick={() => navigate("/login", { state: { returnTo: "/" } })} className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600">ไปหน้าเข้าสู่ระบบ</button>
            <button type="button" onClick={() => setLoginPromptOpen(false)} className="mt-2 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50">เลือกดูคอร์สต่อ</button>
          </div>
        </div>
      )}
    </div>
  );
}
