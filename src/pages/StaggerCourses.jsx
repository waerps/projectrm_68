import { optimizedImage } from "../utils/responsiveImage";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import "./StaggerCourses.css";

const number = new Intl.NumberFormat("th-TH");

const statusLabels = {
  1: "เปิดรับสมัคร",
  2: "กำลังสอน",
  3: "ปิดรับสมัคร",
};

function CourseImage({ src, title }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className="stagger-course-image-fallback" role="img" aria-label={`ภาพประกอบคอร์ส ${title}`}>
        <BookOpen size={52} strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  return <img src={optimizedImage(src, 640)} width={640} height={536} decoding="async" alt={title} className="stagger-course-image" loading="lazy" onError={() => setFailed(true)} />;
}

function StaggerCourseCard({ course, offset, cardWidth, onSelect }) {
  const selected = offset === 0;
  const position = Math.abs(offset);
  const price = Number(course.fullCost ?? 0);
  const originalPrice = Number(course.price ?? 0);
  const hasDiscount = Number(course.discount ?? 0) > 0 && originalPrice > price;

  return (
    <article
      className={`stagger-course-card ${selected ? "is-selected" : ""}`}
      style={{
        width: cardWidth,
        transform: `translate(-50%, -50%) translateX(${offset * cardWidth * 0.73}px) translateY(${selected ? -18 : position % 2 ? 16 : 3}px) rotate(${selected ? 0 : offset * 3}deg) scale(${1 - position * 0.085})`,
        zIndex: 10 - position,
        opacity: position > 2 ? 0 : 1,
      }}
    >
      <div className="stagger-course-art">
        <CourseImage src={course.img} title={course.title} />
        {course.isPromotion && <span className="stagger-course-promo"><Sparkles size={13} aria-hidden="true" /> โปรโมชัน</span>}
        {statusLabels[Number(course.status)] && <span className="stagger-course-status">{statusLabels[Number(course.status)]}</span>}
      </div>
      <div className="stagger-course-body">
        <span className="stagger-course-overline">{course.termName || "คอร์สเรียนศรเสริม"}</span>
        <h3 className="stagger-course-title">{course.title || "คอร์สเรียน"}</h3>
        <div className="stagger-course-meta">
          {course.availabilityName && <span>{course.availabilityName}</span>}
          {course.courseType && <span>{course.courseType === "bundle" ? "คอร์สรวม" : course.courseType === "single" ? "คอร์สเดี่ยว" : course.courseType}</span>}
        </div>
        <div className="stagger-course-bottom">
          <div>
            <span className="stagger-course-price">฿{number.format(price)}</span>
            {hasDiscount && <span className="stagger-course-old-price">฿{number.format(originalPrice)}</span>}
          </div>
          <span className="stagger-course-arrow"><ArrowUpRight size={20} aria-hidden="true" /></span>
        </div>
      </div>
      {selected ? (
        <Link className="stagger-course-hit" to={`/courses/${course.id}`} aria-label={`ดูรายละเอียดคอร์ส ${course.title}`} />
      ) : (
        <button type="button" className="stagger-course-hit" onClick={onSelect} aria-label={`เลือกดูคอร์ส ${course.title}`} />
      )}
    </article>
  );
}

export default function StaggerCourses({ courses }) {
  const [active, setActive] = useState(0);
  const [cardWidth, setCardWidth] = useState(320);
  const [touchStart, setTouchStart] = useState(null);
  const count = courses.length;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setCardWidth(query.matches ? 260 : 320);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (active >= count) setActive(0);
  }, [active, count]);

  const move = (steps) => setActive((index) => (index + steps + count) % count);
  const current = count ? active % count : 0;

  if (!count) return null;

  return (
    <section className="stagger-courses" aria-label="คอร์สเรียนเพิ่มเติม">
      <div className="stagger-courses-toolbar">
        <div className="stagger-courses-count" aria-live="polite">{number.format(current + 1)} <span>/ {number.format(count)}</span></div>
      </div>
      <div
        className="stagger-courses-stage"
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStart == null) return;
          const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
          if (Math.abs(distance) > 45 && count > 1) move(distance < 0 ? 1 : -1);
          setTouchStart(null);
        }}
      >
        {courses.map((course, index) => {
          let offset = (index - current + count) % count;
          if (offset > count / 2) offset -= count;
          if (Math.abs(offset) > 2) return null;
          return (
            <StaggerCourseCard
              key={course.id}
              course={course}
              offset={offset}
              cardWidth={cardWidth}
              onSelect={() => setActive(index)}
            />
          );
        })}
      </div>
      {count > 1 && (
        <div className="stagger-courses-controls">
          <button type="button" onClick={() => move(-1)} aria-label="คอร์สก่อนหน้า"><ChevronLeft size={22} /></button>
          <button type="button" onClick={() => move(1)} aria-label="คอร์สถัดไป"><ChevronRight size={22} /></button>
        </div>
      )}
    </section>
  );
}
