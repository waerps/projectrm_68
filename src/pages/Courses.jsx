// src/pages/CourseDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, ChevronUp, BadgeCheck, Clock, CreditCard } from "lucide-react";
import { getCourseById } from "../callapi/callusers";

export default function CourseDetail() {
  const { id } = useParams(); 
  const [courseRaw, setCourseRaw] = useState(null);
  const [loading, setLoading] = useState(true);
const formatThaiDate = (date) => {
  if (!date) return "-"

  const formatThaiDate = (date) => {
  if (!date) return ""

  const d = new Date(date)
  if (isNaN(d)) return ""

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}


  const d = new D
  const formatDateRange = (start, end) => {
  if (start && end) {
    return `${formatThaiDate(start)} - ${formatThaiDate(end)}`
  }
  if (start) {
    return `${formatThaiDate(start)} -`
  }
  return "-"
}
ate(date)

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}

  
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getCourseById(id); 
        setCourseRaw(data);
      } catch (err) {
        console.error("Load course error:", err);
        setCourseRaw(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);


  const course = useMemo(() => {
    const c = courseRaw || {};

    return {
      title: c.CourseName ?? "ไม่พบข้อมูลคอร์ส",
      price: c.Price != null ? `${c.Price} บาท` : "-",
startDate: c.StartDate || null,
endDate: c.LastDate || null,
      hero: "/openterm2.jpg", 
      badges: [
        c.Discount ? `ลด ${c.Discount}` : null,
        c.Remark ? "รายละเอียดเพิ่มเติม" : null,
      ].filter(Boolean),
      detail: c.Remark ? [c.Remark] : ["-"],
      outline: [],
      videos: [],  
    };
  }, [courseRaw]);

  const [open, setOpen] = useState([]);
  useEffect(() => {
    setOpen((course.videos || []).map((v) => Boolean(v.open)));
  }, [course.videos]);

  const toggle = (i) => setOpen((prev) => prev.map((x, idx) => (idx === i ? !x : x)));

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-gray-500">กำลังโหลดข้อมูลคอร์ส...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-12 mt-35">
        {/* รูปหลัก */}
        <div className="md:col-span-7">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
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
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <CreditCard className="h-6 w-6 text-orange-600" />
              <div>
                <div className="text-sm text-neutral-500">ค่าเรียน</div>
                <div className="text-lg font-semibold text-neutral-900">{course.price}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <Clock className="h-6 w-6 text-green-600" />
              <div>
                <div className="text-sm text-neutral-500">รอบเรียน</div>
                <div className="text-lg font-semibold text-neutral-900">{formatThaiDate(course.dateText)}</div>
              </div>
            </div>
          </div>

          {/* ปุ่ม CTA */}
          <button className="mt-6 w-full rounded-2xl bg-orange-500 py-4 text-white shadow-md transition hover:bg-orange-600">
            ซื้อคอร์สเรียน
          </button>

          {/* รายละเอียดคอร์ส */}
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">รายละเอียดคอร์ส</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700">
              {course.detail.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          {/* เนื้อหาหลัก */}
          <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">เนื้อหาหลัก</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
              {course.outline.length ? (
                course.outline.map((d, i) => <li key={i}>{d}</li>)
              ) : (
                <li>-</li>
              )}
            </ol>
          </div>
        </div>
      </div>

      {/* วิดีโอเนื้อหาเพิ่มเติม */}
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">คลิปวิดีโอเนื้อหาเพิ่มเติม</h2>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {course.videos.length ? (
            course.videos.map((v, i) => (
              <div key={i} className="">
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
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={v.thumb}
                        alt={v.title}
                        className="aspect-[16/9] w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-5 py-4 text-sm text-neutral-500">ยังไม่มีคลิปเพิ่มเติม</div>
          )}
        </div>
      </section>
    </div>
  );
}
