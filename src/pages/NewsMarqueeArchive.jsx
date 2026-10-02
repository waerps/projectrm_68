import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import axios from "axios";
import { ArrowUpRight, CalendarDays, Image as ImageIcon, Newspaper, Pause, Play } from "lucide-react";
import { API_URL } from "../config";
import { newsAuthConfig } from "../utils/newsApi";
import { NewsExpanded } from "./News";
import "./NewsMarqueeArchive.css";

const newsUrl = (path) => {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return `${API_URL.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
};

function NewsImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className={`archive-news-image-fallback ${className}`} role="img" aria-label={alt}>
        <Newspaper size={42} strokeWidth={1.4} aria-hidden="true" />
      </div>
    );
  }

  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

function NewsCard({ item, onOpen, duplicate = false }) {
  const summary = item.sub?.trim();
  return (
    <button
      type="button"
      className="archive-news-story-card"
      onClick={(event) => onOpen(item.id, event.currentTarget)}
      tabIndex={duplicate ? -1 : undefined}
      aria-hidden={duplicate ? "true" : undefined}
      aria-label={`อ่านข่าว ${item.title}`}
    >
      <span className="archive-news-story-cover">
        <NewsImage src={newsUrl(item.img)} alt={item.title || "ภาพข่าว"} className="archive-news-story-image" />
        <span className="archive-news-story-image-mark"><ImageIcon size={14} aria-hidden="true" /> ดูภาพและรายละเอียด</span>
      </span>
      <span className="archive-news-story-content">
        <span className="archive-news-story-meta">
          <span className="archive-news-story-tag">{item.tag || "ข่าวประชาสัมพันธ์"}</span>
          {item.date && <span className="archive-news-story-date"><CalendarDays size={13} aria-hidden="true" />{item.date}</span>}
        </span>
        <span className="archive-news-story-title">{item.title || "ข่าวประชาสัมพันธ์"}</span>
        {summary && <span className="archive-news-story-summary">{summary}</span>}
        <span className="archive-news-story-read">อ่านเรื่องนี้ <ArrowUpRight size={16} aria-hidden="true" /></span>
      </span>
    </button>
  );
}

function MarqueeColumn({ items, index, paused, onOpen }) {
  return (
    <div className={`archive-news-marquee-column archive-news-marquee-column-${index + 1}`}>
      <div
        className={`archive-news-marquee-track ${paused ? "is-paused" : ""}`}
        style={{ "--archive-news-duration": `${Math.max(22, items.length * 8 + index * 3)}s` }}
      >
        <div className="archive-news-marquee-set">
          {items.map((item) => <NewsCard key={item.id} item={item} onOpen={onOpen} />)}
        </div>
        <div className="archive-news-marquee-set" aria-hidden="true">
          {items.map((item) => <NewsCard key={item.id} item={item} onOpen={onOpen} duplicate />)}
        </div>
      </div>
    </div>
  );
}

export default function NewsMarqueeArchive({ role = "public", items = null, embedded = false }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items !== null) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    axios.get(`${API_URL}/api/news`, {
      params: { role },
      signal: controller.signal,
      ...newsAuthConfig(role),
    })
      .then((response) => setNews(Array.isArray(response.data) ? response.data : []))
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setError(true);
          setNews([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [role, items]);

  const visibleNews = items ?? news;
  const changeSelection = (id, source) => {
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (source) source.style.viewTransitionName = "news-open-card";
      const transition = document.startViewTransition(() => flushSync(() => setSelectedId(id)));
      transition.finished.finally(() => { if (source) source.style.viewTransitionName = ""; });
    } else setSelectedId(id);
    if (id !== null) window.requestAnimationFrame(() => document.querySelector(".archive-news-page .news-expanded")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const columnCount = visibleNews.length >= 3 ? 3 : Math.max(1, visibleNews.length);
  const columns = useMemo(() => {
    const result = Array.from({ length: columnCount }, () => []);
    visibleNews.forEach((item, index) => result[index % columnCount].push(item));
    return result;
  }, [visibleNews, columnCount]);
  const animated = visibleNews.length >= 4;

  return (
    <div className={`archive-news-page ${embedded ? "is-embedded" : ""}`}>
      <div className="archive-news-page-inner">
        {!embedded && <header className="archive-news-page-heading">
          <span className="archive-news-page-kicker"><Newspaper size={16} aria-hidden="true" /> เรื่องเล่าจากศรเสริม</span>
          <h1>ข่าว<span>ประชาสัมพันธ์</span></h1>
          <p>ข่าวสาร กิจกรรม และเรื่องน่ารู้ล่าสุดจากสถาบัน</p>
        </header>}

        {items === null && loading ? (
          <div className="archive-news-page-state">กำลังโหลดข่าวสาร...</div>
        ) : items === null && error ? (
          <div className="archive-news-page-state">โหลดข่าวไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</div>
        ) : visibleNews.length === 0 ? (
          <div className="archive-news-page-state">ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้</div>
        ) : (
          <>
            <div className="archive-news-feed-heading">
              <div>
                <span className="archive-news-feed-line" />
                <h2>อัปเดตล่าสุด</h2>
                <span className="archive-news-feed-total">{visibleNews.length} เรื่อง</span>
              </div>
              {animated && selectedId === null && (
                <button type="button" className="archive-news-motion-toggle" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
                  {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
                  {paused ? "เล่นการ์ด" : "หยุดการ์ด"}
                </button>
              )}
            </div>

            {selectedId !== null ? (
              <NewsExpanded item={visibleNews.find((item) => item.id === selectedId)} onClose={() => changeSelection(null)} />
            ) : (
              <>
                {animated ? (
                  <div className={`archive-news-marquee-grid archive-news-marquee-grid-${columnCount}`}>
                    {columns.map((columnItems, index) => (
                      <MarqueeColumn key={index} items={columnItems} index={index} paused={paused} onOpen={changeSelection} />
                    ))}
                  </div>
                ) : (
                  <div className="archive-news-static-grid">
                    {visibleNews.map((item) => <NewsCard key={item.id} item={item} onOpen={changeSelection} />)}
                  </div>
                )}
                {animated && (
                  <div className="archive-news-mobile-feed">
                    {visibleNews.map((item) => <NewsCard key={item.id} item={item} onOpen={changeSelection} />)}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
