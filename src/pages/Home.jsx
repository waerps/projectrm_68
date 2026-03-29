// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"
import { getCourses } from "../callapi/callusers";

const API_URL = import.meta.env.VITE_API_URL;



const promoCards = [
  {
    title: "โปรโมชั่นคอร์ส",
    icon: "💸",

  },
  {
    title: "ผลลัพธ์ยอดครูเสริม",
    icon: "🎓",

  },
]

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
    <h2 className="text-2xl md:text-[32px] font-extrabold text-orange-500">{children}</h2>
    {sub ? (
      <p className="mt-2 text-gray-500">{sub}</p>
    ) : null}
  </div>
)

const CourseCard = ({ item }) => (
  <div className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm ">
    <div className="relative -mx-1 -mt-15">
      <SafeImg
        src={item.img}
        alt={item.title}
        className="h-55 w-full rounded-2xl object-cover"
      />
      {/* <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold text-orange-500 shadow">
        {item.note}
      </div> */}
    </div>
    <div className="pt-4">
      <div className="line-clamp-2 font-semibold">{item.title}</div>
      <div className="text-orange-600 font-bold">{item.price}</div>
    </div>
  </div>
)

const NewsCard = ({ item }) => (
  <div className="rounded-3xl border-gray-100 bg-white p-4 md:p-5 shadow-sm">
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

const Dots = () => (
  <div className="flex items-center gap-1.5">
    <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
    <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
    <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
  </div>
)

/** ---------- main page ---------- */

export default function Home() {

  const [data, setData] = useState([]);
  useEffect(() => {
    async function fetchData() {
      try {
        const courses = await getCourses();
        console.log("courses:", courses);
        setData(Array.isArray(courses) ? courses : []);
      } catch (err) {
        console.error("Error loading courses:", err);
        setData([]);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="pb-24">
      {/* container */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* ========== HERO ========== */}
        <div className="mt-[108px] rounded-[] bg-white">
          <div className="relative overflow-hidden rounded-[28px]">
            <div className="grid grid-cols-1 md:grid-cols-6">
              {/* slider (fake) */}
              <div className="md:col-span-8 relative">
                <div className="aspect-[16/5] w-full">
                  <SafeImg
                    src="/one.jpg"
                    alt="hero"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* ปุ่มเล็กซ้ายล่าง */}
                <button className="absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-gray-800 shadow">
                  <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
                  ข้อมูลคอร์สเรียน
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* ========== ABOUT + PROMO SHORTCUTS ========== */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          <div className="md:col-span-8">
            <h2 className="text-[28px] md:text-[34px] font-extrabold text-orange-500">
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
          <div className="md:col-span-4 grid grid-cols-1 gap-4">
            {/* {promoCards.map((p, i) => (
              <div
                key={i}
                className={`${p.bg} rounded-[22px] border border-gray-100 p-5 shadow-sm`}
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow">
                    {p.icon}
                  </div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white shadow">
                    <span>💬</span>
                  </div>
                </div>
              </div>
            ))} */}
          </div>
        </div>

        {/* ========== COURSES: เปิดเทอม 1 ========== */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h3 className="text-[22px] md:text-[24px] font-extrabold">
              คอร์สเรียน เปิดเทอม 1
            </h3>
          </div>
          <div className="mt-5 pt-6 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {data.map((c) => (
              <Link
                key={c.CourseID}
                to={`/courses/${c.CourseID}`}
                className="block transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CourseCard
                  item={{
                    id: c.CourseID,
                    title: c.CourseName,
                    price: `${c.Price ?? "-"} บาท`,
                    // note: c.Discount ? `ลด ${c.Discount}` : "เปิดรับสมัคร",
                    img: c.CourseImage
                      ? c.CourseImage.startsWith("http")
                        ? c.CourseImage
                        : `${import.meta.env.VITE_API_URL}${c.CourseImage}`
                      : "/gray.jpg",
                  }}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* ========== COURSES เปิดเทอม 2 ========== */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h3 className="text-[22px] md:text-[24px] font-extrabold">
              คอร์สเรียน เปิดเทอม 2
            </h3>
          </div>
          <div className="mt-5 pt-6 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {data.map((c) => (
              <Link
                key={c.CourseID}
                to={`/courses/${c.CourseID}`}
                className="block transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CourseCard
                  item={{
                    id: c.CourseID,
                    title: c.CourseName,
                    price: `${c.Price ?? "-"} บาท`,
                    note: c.Discount ? `ลด ${c.Discount}` : "เปิดรับสมัคร",
                    img: c.CourseImage
                      ? c.CourseImage.startsWith("http")
                        ? c.CourseImage
                        : `${import.meta.env.VITE_API_URL}${c.CourseImage}`
                      : "/gray.jpg",
                  }}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* ========== COURSES ปิดเทอมเล็ก ========== */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h3 className="text-[22px] md:text-[24px] font-extrabold">
              คอร์สเรียน ปิดเทอมเล็ก
            </h3>
          </div>
          <div className="mt-5 pt-6 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {data.map((c) => (
              <Link
                key={c.CourseID}
                to={`/courses/${c.CourseID}`}
                className="block transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CourseCard
                  item={{
                    id: c.CourseID,
                    title: c.CourseName,
                    price: `${c.Price ?? "-"} บาท`,
                    note: c.Discount ? `ลด ${c.Discount}` : "เปิดรับสมัคร",
                    img: c.CourseImage
                      ? c.CourseImage.startsWith("http")
                        ? c.CourseImage
                        : `${import.meta.env.VITE_API_URL}${c.CourseImage}`
                      : "/gray.jpg",
                  }}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* ========== COURSES ซัมเมอร์ ========== */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h3 className="text-[22px] md:text-[24px] font-extrabold">
              คอร์สเรียน ซัมเมอร์
            </h3>
          </div>
          <div className="mt-5 pt-6 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {data.map((c) => (
              <Link
                key={c.CourseID}
                to={`/courses/${c.CourseID}`}
                className="block transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CourseCard
                  item={{
                    id: c.CourseID,
                    title: c.CourseName,
                    price: `${c.Price ?? "-"} บาท`,
                    note: c.Discount ? `ลด ${c.Discount}` : "เปิดรับสมัคร",
                    img: c.CourseImage
                      ? c.CourseImage.startsWith("http")
                        ? c.CourseImage
                        : `${import.meta.env.VITE_API_URL}${c.CourseImage}`
                      : "/gray.jpg",
                  }}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* ========== NEWS ========== */}
        <div className="mt-16">
          <SectionTitle sub="รวมข่าวสารและกิจกรรมล่าสุดจากสถาบัน เพื่อให้นักเรียนและผู้ปกครองไม่พลาดทุกโอกาสการเรียนรู้">
            ข่าวประชาสัมพันธ์
          </SectionTitle>

          <div className="space-y-4">
            {newsList.map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        </div>

        {/* ========== CTA ========== */}
        <div className="mt-8 text-center">
          <button className="rounded-full bg-orange-500 px-6 py-2 text-white shadow hover:bg-orange-600">
            อ่านเพิ่มเติม
          </button>
        </div>
      </div>

    </div>
  )
}