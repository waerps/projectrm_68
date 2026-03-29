// src/pagetutor/TutorMain.jsx
import React from "react"

/** ---------- ข่าวทั่วไป (เหมือนนักเรียนเห็น) ---------- */
const publicNews = [
  {
    id: 1,
    tag: "ข่าวประชาสัมพันธ์",
    title:
      "ยินดีกับน้อง ๆ ศิษย์เก่าศรเสริม ติดคณะแพทยศาสตร์ จุฬาฯ หลายรายต่อเนื่อง",
    date: "15/12/2567",
    sub: "อัปเดตล่าสุด",
    img: "/news1.jpg",
  },
  {
    id: 2,
    tag: "รีวิวจากนักเรียน",
    title:
      "เรียนเนื้อหากระชับ เข้าใจง่าย ทำให้เกรดเพิ่มขึ้นอย่างเห็นได้ชัด",
    date: "10/12/2567",
    sub: "ประสบการณ์จริง",
    img: "/news3.jpg",
  },
]

/** ---------- ข่าวเฉพาะติวเตอร์ ---------- */
const tutorNews = [
  {
    id: 101,
    tag: "ประกาศภายใน",
    title:
      "แจ้งการประชุมติวเตอร์ประจำเดือนมกราคม 2568 กรุณาเข้าร่วมทุกคน",
    date: "05/01/2568",
    sub: "สำคัญ",
    img: "/news4.jpg",
  }
]

/** ---------- helpers ---------- */
const SafeImg = ({ src, className, alt }) => (
  <img
    src={src}
    onError={(e) => {
      e.currentTarget.src =
        "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1400&auto=format&fit=crop"
    }}
    className={className}
    alt={alt}
  />
)

/** ---------- components ---------- */
const SectionTitle = ({ children, sub }) => (
  <div className="text-center mb-8 md:mb-10">
    <h2 className="text-2xl md:text-[32px] font-extrabold text-orange-500">
      {children}
    </h2>
    {sub ? <p className="mt-2 text-gray-500">{sub}</p> : null}
  </div>
)

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

          <span
            className={`rounded-full px-2 py-0.5 ${
              highlight
                ? "bg-orange-100 text-orange-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {item.sub}
          </span>
        </div>
        <h4 className="text-[15px] md:text-base font-semibold leading-relaxed">
          {item.title}
        </h4>
      </div>
    </div>
  </div>
)

export default function TutorMain() {
  return (
    <div className="pb-24">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 mt-20">

        {/* 🔹 ข่าวทั่วไป */}
        <SectionTitle sub="ข่าวสารและกิจกรรมล่าสุดของสถาบัน">
          ข่าวประชาสัมพันธ์
        </SectionTitle>
        <div className="space-y-4 mb-16">
          {publicNews.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>

        {/* 🔸 ข่าวเฉพาะติวเตอร์ */}
        <SectionTitle sub="ประกาศและข้อมูลสำคัญสำหรับติวเตอร์">
          ข่าวสำหรับติวเตอร์
        </SectionTitle>
        <div className="space-y-4">
          {tutorNews.map((n) => (
            <NewsCard key={n.id} item={n} highlight />
          ))}
        </div>

      </div>
    </div>
  )
}