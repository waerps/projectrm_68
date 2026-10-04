import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import axios from "axios";
import { ArrowLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Image as ImageIcon, Newspaper, X } from "lucide-react";
import { API_URL } from "../config";
import "./NewsMarqueeArchive.css";
import "./News.css";
import PublicPageHero from "../components/PublicPageHero";

const newsUrl = (path) => {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return `${API_URL.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
};

function NewsImage({ src, alt, className = "", onLoad }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return <div className={`news-image-fallback ${className}`} role="img" aria-label={alt}><Newspaper size={36} strokeWidth={1.4} aria-hidden="true" /></div>;
  }
  return <img className={className} src={src} alt={alt} loading="lazy" onLoad={onLoad} onError={() => setFailed(true)} />;
}

export function NewsTile({ item, index, onOpen, balanced = false, isWide, onImageAspect }) {
  const summary = item.sub?.trim();
  const featured = !balanced && index === 0;
  const wide = !balanced && (isWide ?? (index > 0 && index % 6 === 4));

  const measureImage = (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth && naturalHeight) onImageAspect?.(item.id, naturalWidth / naturalHeight);
  };
  return (
    <button
      type="button"
      className={`archive-news-story-card news-tile ${featured ? "news-tile-featured" : ""} ${wide ? "news-tile-wide" : ""}`}
      onClick={(event) => onOpen(item.id, event.currentTarget)}
      aria-label={`อ่านข่าว ${item.title || "ข่าวประชาสัมพันธ์"}`}
      data-news-id={item.id}
      style={{ "--tile-order": Math.min(index, 9) }}
    >
      <span className="archive-news-story-cover news-tile-photo">
        <NewsImage src={newsUrl(item.img)} alt={item.title || "ภาพข่าว"} className="archive-news-story-image" onLoad={onImageAspect ? measureImage : undefined} />
        <span className="archive-news-story-image-mark"><ImageIcon size={14} aria-hidden="true" /> ดูภาพและรายละเอียด</span>
      </span>
      <span className="archive-news-story-content news-tile-content">
        <span className="archive-news-story-meta">
          <span className="archive-news-story-tag">{item.tag || "ข่าวประชาสัมพันธ์"}</span>
          {item.type === "tutor" && <span className="archive-news-story-tag">สำหรับติวเตอร์</span>}
          {item.date && <span className="archive-news-story-date"><CalendarDays size={13} aria-hidden="true" />{item.date}</span>}
        </span>
        <span className="archive-news-story-title">{item.title || "ข่าวประชาสัมพันธ์"}</span>
        {summary && <span className="archive-news-story-summary">{summary}</span>}
        <span className="archive-news-story-read">อ่านเรื่องนี้ <ArrowUpRight size={16} aria-hidden="true" /></span>
      </span>
    </button>
  );
}

export function NewsExpanded({ item, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const closeRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const token = item.type === "tutor" ? localStorage.getItem("student_token") : null;
    axios.get(`${API_URL}/api/news/${item.id}`, {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => setDetail(response.data))
      .catch((requestError) => { if (requestError.code !== "ERR_CANCELED") setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [item.id]);

  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, []);

  const article = detail || item;
  const images = [
    article.img && { src: newsUrl(article.img), alt: article.title || "ภาพหลักของข่าว" },
    ...(detail?.extraImages || []).map((image, index) => ({ src: newsUrl(image.ImagePath), alt: `ภาพเพิ่มเติม ${index + 1} ของข่าว ${article.title}` })),
  ].filter((image) => image && image.src);
  const imageIndex = Math.min(activeImage, Math.max(images.length - 1, 0));

  return (
    <article className="news-expanded" aria-labelledby={`news-expanded-title-${item.id}`}>
      <div className="news-expanded-top">
        <span className="news-expanded-eyebrow"><Newspaper size={15} aria-hidden="true" /> กำลังอ่านเรื่องนี้</span>
        <button ref={closeRef} type="button" className="news-expanded-close" onClick={onClose}><ArrowLeft size={18} aria-hidden="true" /> กลับไปดูข่าวทั้งหมด</button>
      </div>
      <div className="news-expanded-layout">
        <div className="news-expanded-media">
          {images.length ? (
            <>
              <div className="news-expanded-photo"><NewsImage src={images[imageIndex].src} alt={images[imageIndex].alt} /></div>
              {images.length > 1 && (
                <div className="news-expanded-gallery">
                  <button type="button" className="news-gallery-arrow" onClick={() => setActiveImage((imageIndex - 1 + images.length) % images.length)} aria-label="รูปก่อนหน้า"><ChevronLeft size={19} /></button>
                  <div className="news-gallery-thumbs">{images.map((image, index) => (
                    <button key={`${image.src}-${index}`} type="button" className={`news-gallery-thumb ${index === imageIndex ? "is-active" : ""}`} onClick={() => setActiveImage(index)} aria-label={`ดูรูปที่ ${index + 1}`} aria-pressed={index === imageIndex}><NewsImage src={image.src} alt={image.alt} /></button>
                  ))}</div>
                  <button type="button" className="news-gallery-arrow" onClick={() => setActiveImage((imageIndex + 1) % images.length)} aria-label="รูปถัดไป"><ChevronRight size={19} /></button>
                </div>
              )}
            </>
          ) : <div className="news-expanded-photo"><NewsImage src={null} alt="ไม่มีภาพข่าว" /></div>}
          {images.length > 1 && <span className="news-gallery-count"><ImageIcon size={14} aria-hidden="true" /> {imageIndex + 1} / {images.length} รูป</span>}
        </div>
        <div className="news-expanded-copy">
          <div className="news-expanded-meta"><span className="news-expanded-tag">{article.tag || "ข่าวประชาสัมพันธ์"}</span>{article.date && <span><CalendarDays size={15} aria-hidden="true" />{article.date}</span>}</div>
          <h2 id={`news-expanded-title-${item.id}`}>{article.title || "ข่าวประชาสัมพันธ์"}</h2>
          <div className="news-expanded-rule" />
          {loading ? <p className="news-expanded-status" role="status">กำลังโหลดเนื้อหาข่าว...</p> : error ? <p className="news-expanded-status" role="alert">โหลดรายละเอียดเพิ่มเติมไม่สำเร็จ กรุณาลองเปิดข่าวอีกครั้ง</p> : article.sub ? <p className="news-expanded-body">{article.sub}</p> : <p className="news-expanded-body">ติดตามรายละเอียดข่าวสารจากศรเสริมติวเตอร์ได้ที่นี่</p>}
          <button type="button" className="news-expanded-bottom-close" onClick={onClose}><X size={17} aria-hidden="true" /> ปิดเรื่องนี้</button>
        </div>
      </div>
    </article>
  );
}

export default function News({ role = "public", embedded = false }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setSelectedId(null);
    const token = role === "tutor" ? localStorage.getItem("student_token") : null;
    axios.get(`${API_URL}/api/news`, {
      params: { role },
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => setNews(Array.isArray(response.data) ? response.data : []))
      .catch((requestError) => { if (requestError.code !== "ERR_CANCELED") { setError(true); setNews([]); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [role]);

  const changeSelection = (id, source) => {
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (source) source.style.viewTransitionName = "news-open-card";
      const transition = document.startViewTransition(() => flushSync(() => setSelectedId(id)));
      transition.finished.finally(() => { if (source) source.style.viewTransitionName = ""; });
    } else setSelectedId(id);
    if (id !== null) window.requestAnimationFrame(() => document.querySelector(".news-expanded")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const sections = role === "tutor"
    ? [
        { key: "public", title: "ข่าวประชาสัมพันธ์ทั่วไป", items: news.filter((item) => item.type === "public"), empty: "ยังไม่มีข่าวประชาสัมพันธ์ทั่วไปในขณะนี้" },
        { key: "tutor", title: "ข่าวสำหรับติวเตอร์", items: news.filter((item) => item.type === "tutor"), empty: "ยังไม่มีข่าวสำหรับติวเตอร์ในขณะนี้" },
      ]
    : [{ key: "all", title: selectedId === null ? "อัปเดตล่าสุด" : "ข่าวประชาสัมพันธ์", items: news }];

  return (
    <div className={`news-page${embedded ? " news-page-embedded" : ""}`}>
      <div className="news-page-inner">
        <PublicPageHero
          eyebrow="เรื่องเล่าจากศรเสริม"
          title="ข่าว"
          highlight="ประชาสัมพันธ์"
          description="ข่าวสาร กิจกรรม และเรื่องน่ารู้ล่าสุดจากสถาบัน"
          icon={Newspaper}
        />
        {loading ? <div className="news-page-state" role="status">กำลังโหลดข่าวสาร...</div> : error ? <div className="news-page-state" role="alert">โหลดข่าวไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</div> : news.length === 0 && role !== "tutor" ? <div className="news-page-state">ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้</div> : sections.map((section) => {
          const selectedItem = section.items.find((item) => item.id === selectedId);
          return (
            <section key={section.key} className="news-feed" aria-labelledby={`news-section-${section.key}`}>
              <div className="news-feed-heading"><div><span className="news-feed-line" /><h2 id={`news-section-${section.key}`}>{section.title}</h2><span className="news-feed-total">{section.items.length} เรื่อง</span></div></div>
              {selectedItem ? (
                <NewsExpanded key={selectedItem.id} item={selectedItem} onClose={() => changeSelection(null)} />
              ) : section.items.length > 0 ? (
                <div className={`news-grid${role === "tutor" ? " news-grid-balanced" : ""}`} style={role === "tutor" ? { "--news-columns": section.items.length === 4 ? 2 : Math.min(section.items.length, 3) } : undefined}>
                  {section.items.map((item, index) => <NewsTile key={item.id} item={item} index={index} onOpen={changeSelection} balanced={role === "tutor"} />)}
                </div>
              ) : <div className="news-page-state">{section.empty}</div>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
