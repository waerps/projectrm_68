// src/pages/CourseDetail.jsx
import { useState, useMemo } from "react"
import { useParams } from "react-router-dom"
import { ChevronDown, ChevronUp, BadgeCheck, Clock, CreditCard } from "lucide-react"

const COURSE_DB = {
  "netsat-intensive": {
    title: "คอร์สติวเข้ม NETSAT",
    price: "5,900 บาท",
    dateText: "17 มีนาคม - 4 เมษายน",
    hero: "gray.jpg", // ใส่ไฟล์ใน public
    badges: ["รับจำนวนจำกัด", "โปรโมชั่นพิเศษ"],
    detail: [
      "รูปแบบเรียน: คลาสสดออนไลน์ (Zoom) + วีดีโอย้อนหลัง + เอกสาร + ชุดข้อสอบจริง",
      "ผู้สอน: อาจารย์ติวเตอร์ผู้เชี่ยวชาญ NETSAT (ประสบการณ์ติวเฉพาะสาย NETSAT มากกว่า 5 ปี)",
      "จำนวนที่นั่ง: จำกัด 25 ที่นั่งต่อรอบ",
    ],
    outline: [
      "พื้นฐานเซลล์พืช & เซลล์สัตว์ — โครงสร้าง ออร์แกเนลล์ หน้าที่",
      "การสร้างโปรตีน & การถ่ายทอดลักษณะทางพันธุกรรม",
      "ระบบร่างกายและสรีรวิทยา — โครงโมเลกุล ยีน พันธุกรรมเชิงปริมาณ",
      "พันธุวิศวกรรมชีวภาพ & เทคนิคชีวโมเลกุล NETSAT",
      "สอบย่อย (Mock Test) + วิเคราะห์ผลละเอียด",
    ],
    videos: [
      { title: "NETSAT ชีววิทยา: คณิตศาสตร์เรื่องจำนวนเชิงซ้อน (ตัวอย่าง)", thumb: "gray.jpg" },
      { title: "NETSAT ภาษาไทย: คำยืม คำซ้ำ (ตัวอย่าง)", thumb: "gray.jpg" },
      { title: "NETSAT ชีววิทยา: เซลล์ (ตัวอย่าง)", thumb: "gray.jpg", open: true },
    ],
  },
}

export default function CourseDetail() {
  const { slug } = useParams()
  const course = useMemo(() => COURSE_DB[slug] ?? COURSE_DB["netsat-intensive"], [slug])
  const [open, setOpen] = useState(
    course.videos.map((v) => Boolean(v.open)) // แถวสุดท้ายเปิดอยู่ตามตัวอย่าง
  )

  const toggle = (i) =>
    setOpen((prev) => prev.map((x, idx) => (idx === i ? !x : x)))

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb แบบง่าย */}
      {/* <div className="mb-4 text-sm text-neutral-500">
        หน้าแรก / คอร์สเรียน / <span className="text-neutral-900 font-medium">{course.title}</span>
      </div> */}

      <div className="grid gap-8 md:grid-cols-12 mt-35">
        {/* รูปหลัก */}
        <div className="md:col-span-7">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <img
              src={course.hero}
              alt={course.title}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        </div>

        {/* ข้อมูลหลัก */}
        <div className="md:col-span-5">
          <h1 className="text-3xl font-bold text-neutral-900">{course.title}</h1>

          {/* badges */}
          <div className="mt-3 flex flex-wrap gap-2">
            {course.badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
              >
                <BadgeCheck className="h-4 w-4 text-orange-500" />
                {b}
              </span>
            ))}
          </div>

          {/* กล่องราคา / วัน-เวลา */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
              <CreditCard className="h-6 w-6 text-orange-600" />
              <div>
                <div className="text-sm text-neutral-500">ค่าเรียน</div>
                <div className="text-lg font-semibold text-neutral-900">{course.price}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
              <Clock className="h-6 w-6 text-green-600" />
              <div>
                <div className="text-sm text-neutral-500">รอบเรียน</div>
                <div className="text-lg font-semibold text-neutral-900">{course.dateText}</div>
              </div>
            </div>
          </div>

          {/* ปุ่ม CTA */}
          <button className="mt-6 w-full rounded-2xl bg-orange-500 py-4 text-white shadow-md transition hover:bg-orange-600">
            ซื้อคอร์สเรียน
          </button>

          {/* รายละเอียดคอร์ส */}
          <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">รายละเอียดคอร์ส</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700">
              {course.detail.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          {/* เนื้อหาหลัก */}
          <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">เนื้อหาหลัก</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
              {course.outline.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* วิดีโอเนื้อหาเพิ่มเติม */}
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">คลิปวิดีโอเนื้อหาเพิ่มเติม</h2>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {course.videos.map((v, i) => (
            <div key={i} className="border-b last:border-b-0">
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-neutral-50"
              >
                <span className="text-sm font-medium text-neutral-800">{v.title}</span>
                {open[i] ? (
                  <ChevronUp className="h-5 w-5 text-neutral-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-500" />
                )}
              </button>

              {open[i] && (
                <div className="px-5 pb-5">
                  <div className="overflow-hidden rounded-xl border">
                    <img
                      src={v.thumb}
                      alt={v.title}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
