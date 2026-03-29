import React, { useState, useEffect } from "react";
import axios from "axios"; // อย่าลืม npm install axios

// ---------- Components (คงเดิมไว้) ----------
const SafeImg = ({ src, className, alt }) => (
  <img
    src={src} // หาก URL จาก DB ไม่สมบูรณ์ อาจต้องใส่ prefix เช่น `http://localhost:3000/uploads/${src}`
    onError={(e) => {
      e.currentTarget.src =
        "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1400&auto=format&fit=crop";
    }}
    className={className}
    alt={alt}
  />
);

const SectionTitle = ({ children, sub }) => (
  <div className="text-center mb-8 md:mb-10">
    <h2 className="text-2xl md:text-[32px] font-extrabold text-orange-500">
      {children}
    </h2>
    {sub ? <p className="mt-2 text-gray-500">{sub}</p> : null}
  </div>
);

const NewsCard = ({ item, highlight }) => (
  <div className="rounded-3xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition">
    <div className="flex flex-col md:flex-row gap-4">
      <div className="md:w-[36%]">
        <SafeImg
          src={item.img}
          alt={item.title}
          className="h-40 md:h-40 w-full rounded-2xl object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            {item.tag}
          </span>
          <span className="text-gray-400">{item.date}</span>

          {item.sub && (
             <span
             className={`rounded-full px-2 py-0.5 ${
               highlight
                 ? "bg-orange-100 text-orange-700"
                 : "bg-emerald-100 text-emerald-700"
             }`}
           >
             {/* ตัดคำหากยาวเกินไป */}
             {item.sub.length > 50 ? item.sub.substring(0, 50) + "..." : item.sub}
           </span>
          )}
        </div>
        <h4 className="text-[15px] md:text-base font-semibold leading-relaxed">
          {item.title}
        </h4>
      </div>
    </div>
  </div>
);

// ---------- Main Component ----------
export default function TutorMain() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // เปลี่ยน URL ให้ตรงกับ Backend ของคุณ
        const response = await axios.get("http://localhost:3000/api/news");
        setNews(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching news:", error);
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // กรองข้อมูลแยกตามประเภท
  const publicNews = news.filter((n) => n.type === "public");
  const tutorNews = news.filter((n) => n.type === "tutor");

  if (loading) {
    return <div className="mt-20 text-center text-gray-500">กำลังโหลดข่าวสาร...</div>;
  }

  return (
    <div className="pb-24">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 mt-20">
        
        {/* 🔹 ข่าวทั่วไป */}
        {publicNews.length > 0 && (
            <>
                <SectionTitle sub="ข่าวสารและกิจกรรมล่าสุดของสถาบัน">
                ข่าวประชาสัมพันธ์
                </SectionTitle>
                <div className="space-y-4 mb-16">
                {publicNews.map((n) => (
                    <NewsCard key={n.id} item={n} />
                ))}
                </div>
            </>
        )}

        {/* 🔸 ข่าวเฉพาะติวเตอร์ */}
        {tutorNews.length > 0 && (
            <>
                <SectionTitle sub="ประกาศและข้อมูลสำคัญสำหรับติวเตอร์">
                ข่าวสำหรับติวเตอร์
                </SectionTitle>
                <div className="space-y-4">
                {tutorNews.map((n) => (
                    <NewsCard key={n.id} item={n} highlight />
                ))}
                </div>
            </>
        )}

      </div>
    </div>
  );
}