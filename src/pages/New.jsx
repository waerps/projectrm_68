// src/pages/News.jsx
import React from "react"

/** ---------- mock data (ยกจาก Home) ---------- */
const newsList = [
  {
    id: 1,
    tag: "นักเรียนศิษย์เก่ามหาวิทยาลัยชั้นนำ",
    title:
      "ยินดีกับน้องๆ ศิษย์เก่าศรเสริม ติดคณะเเพทยศาสตร์ จุฬาฯ หลายรายต่อเนื่อง ด้วยคะแนน GAT-PAT 95%",
    date: "15/12/2567",
    sub: "ประกาศ — อัปเดตล่าสุด",
    img: "/gray.jpg",
  },
  {
    id: 2,
    tag: "รีวิวจากนักเรียน",
    title:
      "เรียนเนื้อหากระชับ เข้าใจง่าย สรุปดีมาก ทำให้เกรดขึ้นจาก 2.5 → 3.6 ภายในเทอมเดียว",
    date: "10/12/2567",
    sub: "ประสบการณ์ตรง",
    img: "/gray.jpg",
  },
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

const NewsCard = ({ item }) => (
  <div className="rounded-3xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition">
    <div className="flex flex-col md:flex-row gap-4">
      <div className="md:w-[36%]">
        <SafeImg
          src={item.img}
          alt={item.title}
          className="h-40 md:h-[160px] w-full rounded-2xl object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            {item.tag}
          </span>
          <span className="text-gray-400">{item.date}</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
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

export default function News() {
  return (
    <div className="pb-24">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 mt-[108px]">
        <SectionTitle sub="รวมข่าวสารและกิจกรรมล่าสุดจากสถาบัน เพื่อให้นักเรียนและผู้ปกครองไม่พลาดทุกโอกาสการเรียนรู้">
          ข่าวประชาสัมพันธ์
        </SectionTitle>

        <div className="space-y-4">
          {newsList.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <button className="rounded-full bg-orange-500 px-6 py-2 text-white shadow hover:bg-orange-600">
            โหลดเพิ่มเติม
          </button>
        </div>
      </div>
    </div>
  )
}
