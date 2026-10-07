import { API_URL } from "../config";
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { flushSync } from "react-dom";
import { Newspaper } from "lucide-react";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import PublicPageHero from "../components/PublicPageHero";
import TutorSchedulePreview from "./TutorSchedulePreview";
import { NewsExpanded, NewsTile } from "../pages/News";
import "../pages/NewsMarqueeArchive.css";
import "../pages/News.css";
import ErrorState from "../components/ui/ErrorState";

const SERVER_URL = API_URL;

function resolveImg(img) {
  if (!img) return null;
  if (img.startsWith("http") || img.startsWith("blob:")) return img;
  return `${SERVER_URL}${img}`;
}

// รูปเสีย/ไม่มีรูป → ซ่อนช่องรูปทั้งช่อง (ไม่ดึงรูปสำรองจากเว็บภายนอก และไม่ทิ้งกรอบเทาว่าง)
const SafeImg = ({ src, className, alt }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  return <img src={src} onError={() => setBroken(true)} className={className} alt={alt} loading="lazy" />;
};

function TutorAnnouncementCard({ item, onOpen }) {
  return (
    <button type="button" data-news-id={item.id} onClick={(event) => onOpen(item.id, event.currentTarget)} className="group flex w-full gap-3 rounded-2xl border border-orange-100 bg-white p-3 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
      {/* ใน <button> ใช้ได้แค่ phrasing content (W3C) — จึงใช้ <span> แทน <div>/<h3> แล้วกำหนด display ด้วยคลาส */}
      {item.img && <span className="block h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-orange-50"><SafeImg src={item.img} alt={item.title || "ภาพข่าวสำหรับติวเตอร์"} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></span>}
      <span className="block min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5 text-[11px]"><span className="rounded-full bg-orange-50 px-2 py-0.5 font-bold text-orange-700">{item.tag || "ข่าวสำหรับติวเตอร์"}</span>{item.date && <span className="text-neutral-500">{item.date}</span>}</span>
        <span className="mt-2 line-clamp-2 block text-sm font-bold leading-snug text-neutral-900">{item.title}</span>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-700">อ่านรายละเอียด <span aria-hidden="true">→</span></span>
      </span>
    </button>
  );
}

// Keep one full-width story per group so the two-column feed retains its bento rhythm.
function newsLayoutScore(item, aspectRatio) {
  const titleLength = Array.from((item.title || "").replace(/\s/g, "")).length;
  const summaryLength = Array.from((item.sub || "").replace(/\s/g, "")).length;
  const imageBonus = aspectRatio >= 2 ? 90 + Math.min((aspectRatio - 2) * 25, 40) : 0;
  return Math.min(titleLength, 100) * 2 + Math.min(summaryLength, 350) * 0.45 + imageBonus;
}

function selectWideNews(newsItems, imageAspects) {
  const wideIndices = new Set();
  // The first card stays tall. Candidate positions keep pairs of small cards together.
  for (let firstCandidate = 3; firstCandidate < newsItems.length;) {
    const candidates = [firstCandidate, firstCandidate + 2, firstCandidate + 4]
      .filter((index) => index < newsItems.length);
    const chosen = candidates.reduce((best, index) =>
      newsLayoutScore(newsItems[index], imageAspects[newsItems[index].id]) >
      newsLayoutScore(newsItems[best], imageAspects[newsItems[best].id]) ? index : best
    );
    wideIndices.add(chosen);
    firstCandidate = chosen + 5;
  }
  return wideIndices;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TutorMain() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const lastOpenedId = useRef(null);
  const [imageAspects, setImageAspects] = useState({});

  useEffect(() => {
    setLoadError(false);
    const token = localStorage.getItem("student_token");
    axios.get(`${SERVER_URL}/api/news?role=tutor`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => setNews(res.data.map((n) => ({ ...n, img: resolveImg(n.img) }))))
      .catch((err) => { console.error(err); setLoadError(true); })
      .finally(() => setLoading(false));
  }, []);

  const publicNews = news.filter((n) => n.type === "public");
  const tutorNews  = news.filter((n) => n.type === "tutor");
  const wideNewsIndices = useMemo(() => selectWideNews(publicNews, imageAspects), [publicNews, imageAspects]);
  const handleImageAspect = (id, ratio) => {
    setImageAspects((current) => current[id] === ratio ? current : { ...current, [id]: ratio });
  };

  const selectedNews = news.find((item) => item.id === selectedId);
  const changeSelection = (id, source) => {
    if (id !== null) lastOpenedId.current = id;
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (source) source.style.viewTransitionName = "news-open-card";
      const transition = document.startViewTransition(() => flushSync(() => setSelectedId(id)));
      transition.finished.finally(() => { if (source) source.style.viewTransitionName = ""; });
    } else setSelectedId(id);

    window.requestAnimationFrame(() => {
      if (id !== null) {
        document.querySelector(".tutor-news-page .news-expanded")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        const cards = document.querySelectorAll(".tutor-news-page [data-news-id]");
        const previousCard = Array.from(cards).find((card) => card.dataset.newsId === String(lastOpenedId.current));
        previousCard?.scrollIntoView({ behavior: "smooth", block: "center" });
        previousCard?.focus({ preventScroll: true });
      }
    });
  };

  return (
    <div className="tutor-news-page mx-auto max-w-[1200px] px-4 md:px-6">
      <PublicPageHero
        eyebrow="ข่าวสารสำหรับติวเตอร์"
        title="ข่าวและประกาศ"
        highlight="สำหรับติวเตอร์"
        description="ติดตามข่าวประชาสัมพันธ์ ตารางสอน และข้อมูลสำคัญจากสถาบันได้ที่นี่"
        icon={Newspaper}
      />

      {selectedNews ? (
        <section className="news-feed tutor-news-expanded-feed mt-10" aria-label="รายละเอียดข่าว">
          <div className="news-feed-heading"><div><span className="news-feed-line" /><h2>{selectedNews.type === "tutor" ? "ข่าวสำหรับติวเตอร์" : "ข่าวประชาสัมพันธ์"}</h2><span className="news-feed-total">{selectedNews.type === "tutor" ? tutorNews.length : publicNews.length} เรื่อง</span></div></div>
          <NewsExpanded item={selectedNews} onClose={() => changeSelection(null)} />
        </section>
      ) : (
      <div className="tutor-news-layout mt-10 grid items-start gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="news-feed min-w-0" aria-label="ข่าวประชาสัมพันธ์สำหรับติวเตอร์">
          <div className="news-feed-heading">
            <div><span className="news-feed-line" /><h2>ข่าวประชาสัมพันธ์</h2>{!loading && !loadError && <span className="news-feed-total">{publicNews.length} เรื่อง</span>}</div>
          </div>
          {loading ? <Spinner block label="กำลังโหลดข่าวสาร..." /> : loadError ? <ErrorState description="โหลดข่าวสารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" /> : publicNews.length ? (
            <div className="news-grid tutor-public-news-grid">
              {publicNews.map((item, index) => <NewsTile key={item.id} item={item} index={index} onOpen={changeSelection} isWide={wideNewsIndices.has(index)} onImageAspect={handleImageAspect} />)}
            </div>
          ) : <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-8 text-center text-sm text-neutral-500">ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้</div>}
        </section>

        <aside className="min-w-0 space-y-7" aria-label="ตารางสอนและข่าวสำหรับติวเตอร์">
          <TutorSchedulePreview />
          <section className="news-feed" aria-label="ประกาศสำหรับติวเตอร์">
            <div className="news-feed-heading"><div><span className="news-feed-line" /><h2>ข่าวสำหรับติวเตอร์</h2>{!loading && !loadError && <span className="news-feed-total">{tutorNews.length} เรื่อง</span>}</div></div>
            <p className="mb-4 text-sm text-neutral-500">ประกาศและข้อมูลสำคัญสำหรับติวเตอร์</p>
            {loading ? <Spinner block label="กำลังโหลดข่าวสำหรับติวเตอร์..." /> : loadError ? <ErrorState description="โหลดข่าวสำหรับติวเตอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" /> : tutorNews.length ? (
              <div className="space-y-3">
                {tutorNews.map((item) => <TutorAnnouncementCard key={item.id} item={item} onOpen={changeSelection} />)}
              </div>
            ) : <EmptyState icon={Newspaper} title="ยังไม่มีข่าวสำหรับติวเตอร์" description="ประกาศใหม่จากสถาบันจะแสดงที่นี่" />}
          </section>
        </aside>
      </div>
      )}
    </div>
  );
}
