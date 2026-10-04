import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowUpRight } from "lucide-react";
import { API_URL } from "../config";
import { NewsExpanded, NewsTile } from "./News";
import "./NewsMarqueeArchive.css";

export default function NewsMarqueeArchive({ role = "public", items = null, embedded = false }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

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

  return (
    <div className={`archive-news-page ${embedded ? "is-embedded" : ""}`}>
      <div className="archive-news-page-inner">
        {items === null && loading ? (
          <div className="archive-news-page-state">กำลังโหลดข่าวสาร...</div>
        ) : items === null && error ? (
          <div className="archive-news-page-state">โหลดข่าวไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</div>
        ) : visibleNews.length === 0 ? (
          <div className="archive-news-page-state">ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้</div>
        ) : (
          <section className="news-feed" aria-label="ข่าวประชาสัมพันธ์ล่าสุด">
            <div className="archive-news-feed-heading">
              <div>
                <span className="archive-news-feed-line" />
                <h2>อัปเดตล่าสุด</h2>
                <span className="archive-news-feed-total">{visibleNews.length} เรื่อง</span>
              </div>
              {embedded && selectedId === null && (
                <Link to="/news" className="archive-news-more-link">
                  อ่านเพิ่มเติม <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
            {selectedId !== null ? (
              <NewsExpanded item={visibleNews.find((item) => item.id === selectedId)} onClose={() => changeSelection(null)} />
            ) : (
              <div className="news-grid">
                {visibleNews.map((item, index) => <NewsTile key={item.id} item={item} index={index} onOpen={changeSelection} />)}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
