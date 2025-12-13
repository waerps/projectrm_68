"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp } from "lucide-react"
import { useKeenSlider } from "keen-slider/react"
import "keen-slider/keen-slider.min.css"

const newsItems = [
  {
    id: 1,
    title: "เปิดรับสมัครคอร์สเตรียมสอบเข้ามหาวิทยาลัย ปี 2568",
    description: "เปิดรับสมัครนักเรียนชั้น ม.6 เข้าร่วมคอร์สติวเข้มเตรียมสอบเข้ามหาวิทยาลัย พร้อมอาจารย์ผู้เชี่ยวชาญและเทคนิคพิเศษ",
    date: "15 มกราคม 2568",
    badge: "ข่าวสำคัญ",
    image: "/university-entrance-exam-announcement.jpg",
  },
  {
    id: 2,
    title: "ผลงานนักเรียน: ติดมหาวิทยาลัยชั้นนำ 95%",
    description: "ขอแสดงความยินดีกับนักเรียนรุ่น 2567 ที่สอบติดมหาวิทยาลัยชั้นนำทั่วประเทศ รวมถึง จุฬาฯ ธรรมศาสตร์ และมหิดล",
    date: "10 มกราคม 2568",
    badge: "ความสำเร็จ",
    image: "/successful-students-graduation.jpg",
  },
  {
    id: 3,
    title: "เปิดคอร์สใหม่: วิทยาศาสตร์ข้อมูล และ AI",
    description: "เตรียมพร้อมสำหรับอนาคต ด้วยคอร์สวิทยาศาสตร์ข้อมูลและปัญญาประดิษฐ์ สำหรับนักเรียนที่สนใจด้านเทคโนโลยี",
    date: "5 มกราคม 2568",
    badge: "คอร์สใหม่",
    image: "/data-science-ai-technology.jpg",
  },
]

export default function NewsSlider() {
  const [sliderRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      slides: {
        perView: 1, // จำนวน slide ต่อหน้า
        spacing: 15, // ระยะห่างระหว่าง slide
      },
    },
    [
      // Autoplay plugin
      (slider) => {
        let timeout: ReturnType<typeof setTimeout>
        let mouseOver = false

        function clearNextTimeout() {
          clearTimeout(timeout)
        }

        function nextTimeout() {
          clearTimeout(timeout)
          if (mouseOver) return
          timeout = setTimeout(() => {
            slider.next()
          }, 3000) // 3 วินาทีต่อ slide
        }

        slider.on("created", () => {
          slider.container.addEventListener("mouseover", () => {
            mouseOver = true
            clearNextTimeout()
          })
          slider.container.addEventListener("mouseout", () => {
            mouseOver = false
            nextTimeout()
          })
          nextTimeout()
        })
        slider.on("dragStarted", clearNextTimeout)
        slider.on("animationEnded", nextTimeout)
        slider.on("updated", nextTimeout)
      },
    ]
  )

  return (
    <section className="py-12 md:py-10">
      <div className="container mx-auto px-4">
        <div ref={sliderRef} className="keen-slider">
          {newsItems.map((news) => (
            <div key={news.id} className="keen-slider__slide">
              <Card className="group overflow-hidden transition-all hover:shadow-lg">
                <div className="relative h-85 overflow-hidden">
                  <img
                    src={news.image || "/placeholder.svg"}
                    alt={news.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">{news.badge}</Badge>
                </div>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{news.date}</span>
                  </div>
                  <h3 className="mb-2 font-sans text-lg font-semibold leading-tight text-foreground text-balance">
                    {news.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{news.description}</p>
                  <button className="mt-4 flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                    อ่านเพิ่มเติม
                    <TrendingUp className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
