"use client"

import { useState } from "react"
import NewsSection from "@/components/news-section"
import CourseCard from "@/components/course-card"
import ChatbotButton from "@/components/chatbot-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for courses
const courses = {
  term1: [
    {
      id: "1",
      title: "คอร์สรวม ป.4",
      description: "รวม 5 วิชาหลัก: คณิตศาสตร์, วิทยาศาสตร์, ภาษาไทย, อังกฤษ, สังคมศึกษา ครอบคลุมทุกเนื้อหาตามหลักสูตร พร้อมติวเข้มและเสริมความเข้าใจทุกบทเรียน",
      instructor: "อาจารย์สมชาย",
      duration: "16 สัปดาห์",
      price: "ปกติ 9,350 บาท",
      promotion: "ลดเหลือ 8,300 บาท",
      schedule: {
        weekdays: "จันทร์-ศุกร์ 17:00-18:30",
        saturday: "09:00-15:00",
        sunday: "09:00-12:00"
      },
      capacity: 30,
      currentSeats: 8,
      image: "/math-classroom-students.jpg"
    },
    {
      id: "2",
      title: "คอร์สรวม ป.5",
      description: "รวม 5 วิชาหลัก: คณิตศาสตร์, วิทยาศาสตร์, ภาษาไทย, อังกฤษ, สังคมศึกษา เสริมความเข้าใจ พร้อมติวเข้มทุกเนื้อหาเพื่อความมั่นใจในห้องเรียน",
      instructor: "อาจารย์สมชาย",
      duration: "16 สัปดาห์",
      price: "ปกติ 9,350 บาท",
      promotion: "ลดเหลือ 8,300 บาท",
      schedule: {
        weekdays: "จันทร์-ศุกร์ 17:00-18:30",
        saturday: "09:00-15:00",
        sunday: "09:00-12:00"
      },
      capacity: 30,
      currentSeats: 5,
      image: "/math-classroom-students.jpg"
    },
    {
      id: "3",
      title: "คอร์สรวม ป.6",
      description: "รวม 5 วิชาหลัก: คณิตศาสตร์, วิทยาศาสตร์, ภาษาไทย, อังกฤษ, สังคมศึกษา เตรียมสอบปลายภาคและเสริมความเข้าใจเชิงลึก",
      instructor: "อาจารย์สมชาย",
      duration: "16 สัปดาห์",
      price: "ปกติ 9,350 บาท",
      promotion: "ลดเหลือ 8,300 บาท",
      schedule: {
        weekdays: "จันทร์-ศุกร์ 17:00-18:30",
        saturday: "09:00-15:00",
        sunday: "09:00-12:00"
      },
      capacity: 30,
      currentSeats: 20,
      image: "/math-classroom-students.jpg"
    },
    {
      id: "4",
      title: "คอร์สรวม ม.1",
      description: "คณิตศาสตร์, วิทยาศาสตร์, ภาษาไทย, อังกฤษ ครอบคลุมทุกบทเรียน พร้อมกิจกรรมเสริมความเข้าใจและฝึกทำโจทย์เชิงลึก",
      instructor: "อาจารย์สมชาย",
      duration: "16 สัปดาห์",
      price: "ปกติ 9,350 บาท",
      promotion: "ลดเหลือ 8,300 บาท",
      schedule: {
        weekdays: "จันทร์-ศุกร์ 17:00-18:30",
        saturday: "09:00-16:00"
      },
      capacity: 30,
      currentSeats: 12,
      image: "/math-classroom-students.jpg"
    },
    {
      id: "5",
      title: "คอร์สรวม ม.2",
      description: "คณิตศาสตร์, วิทยาศาสตร์, ภาษาไทย, อังกฤษ พร้อมติวเข้มเทอมนี้และเสริมเทคนิคการสอบ",
      instructor: "อาจารย์สมชาย",
      duration: "16 สัปดาห์",
      price: "ปกติ 9,350 บาท",
      promotion: "ลดเหลือ 8,300 บาท",
      schedule: {
        weekdays: "จันทร์-ศุกร์ 17:00-18:30",
        sunday: "09:00-16:00"
      },
      capacity: 30,
      currentSeats: 22,
      image: "/math-classroom-students.jpg"
    },
    {
      id: "6",
      title: "คอร์สรวม ม.3",
      description: "คณิตศาสตร์, วิทยาศาสตร์, ภาษาไทย, อังกฤษ พร้อมสรุปเนื้อหาทั้งปี และเทคนิคการสอบเข้า ม.4",
      instructor: "อาจารย์สมชาย",
      duration: "16 สัปดาห์",
      price: "ปกติ 9,350 บาท",
      promotion: "ลดเหลือ 8,300 บาท",
      schedule: {
        weekdays: "จันทร์-ศุกร์ 17:00-18:30",
        sunday: "09:00-16:00"
      },
      capacity: 30,
      currentSeats: 4,
      image: "/math-classroom-students.jpg"
    },
    {
      id: "7",
      title: "คอร์สรวม ม.4",
      description: "คณิตศาสตร์, อังกฤษ, ฟิสิกส์, เคมี, ชีววิทยา ครบทุกวิชา พร้อมเทคนิคทำโจทย์และการสอบเข้ามหาวิทยาลัย",
      instructor: "อาจารย์สมชาย",
      duration: "16 สัปดาห์",
      price: "ปกติ 9,350 บาท",
      promotion: "ลดเหลือ 8,300 บาท",
      schedule: {
        weekdays: "จันทร์-ศุกร์ 17:00-18:30"
      },
      capacity: 30,
      currentSeats: 16,
      image: "/math-classroom-students.jpg"
    },
    {
      id: "8",
      title: "คอร์ส Netsat (ม.5-ม.6)",
      description: "เน้นเนื้อหา Netsat: ฟิสิกส์, เคมี, ชีวะ, คณิต, วิทย์เทคโนโลยี, ไทย สำหรับนักเรียนที่ต้องการต่อยอดสู่ A-Level พร้อมกิจกรรมพิเศษและติวออนไลน์",
      instructor: "อาจารย์สมชาย",
      duration: "16 สัปดาห์",
      price: "ปกติ 9,350 บาท",
      promotion: "ลดเหลือ 8,300 บาท",
      schedule: {
        weekdays: "จันทร์-ศุกร์ 17:00-18:30",
        saturday: "09:00-12:00",
        online: "19:00-20:30"
      },
      capacity: 30,
      currentSeats: 3,
      image: "/math-classroom-students.jpg"
    }  
  ],
  shortBreak: [
    {
      id: "9",
      title: "คณิตศาสตร์ติวเข้ม ปิดเทอมเล็ก",
      description: "ทบทวนเนื้อหาเทอม 1 และเตรียมความพร้อมเทอม 2",
      instructor: "อาจารย์สมชาย",
      duration: "4 สัปดาห์",
      price: "2,000 บาท",
      image: "/intensive-study-tutoring.jpg",
    },
    {
      id: "10",
      title: "ภาษาอังกฤษ TOEIC ปิดเทอมเล็ก",
      description: "เตรียมสอบ TOEIC เน้นเทคนิคการทำข้อสอบ",
      instructor: "อาจารย์จอห์น",
      duration: "4 สัปดาห์",
      price: "3,000 บาท",
      image: "/english-language-learning.png",
    },
  ],
  term2: [
    {
      id: "11",
      title: "คณิตศาสตร์ ม.4 เทอม 2",
      description: "ต่อยอดจากเทอม 1 เน้นเนื้อหาขั้นสูง",
      instructor: "อาจารย์สมชาย",
      duration: "16 สัปดาห์",
      price: "4,500 บาท",
      image: "/advanced-mathematics-teaching.jpg",
    },
    {
      id: "12",
      title: "ชีววิทยา ม.5 เทอม 2",
      description: "ชีววิทยาเชิงลึก เน้นการทำความเข้าใจระบบต่างๆ",
      instructor: "อาจารย์ประภา",
      duration: "16 สัปดาห์",
      price: "4,800 บาท",
      image: "/biology-microscope-cells.png",
    },
    {
      id: "13",
      title: "สังคมศึกษา ม.6 เทอม 2",
      description: "สังคมศึกษาเตรียมสอบเข้ามหาวิทยาลัย",
      instructor: "อาจารย์มานะ",
      duration: "16 สัปดาห์",
      price: "4,200 บาท",
      image: "/social-studies-classroom.jpg",
    },
  ],
  summerBreak: [
    {
      id: "14",
      title: "คอร์สติวเข้ามหาวิทยาลัย ปิดเทอมใหญ่",
      description: "ติวเข้มทุกวิชาเตรียมสอบเข้ามหาวิทยาลัย",
      instructor: "ทีมอาจารย์",
      duration: "8 สัปดาห์",
      price: "12,000 บาท",
      image: "/university-entrance-exam-preparation.jpg",
    },
    {
      id: "15",
      title: "คณิตศาสตร์ขั้นสูง ปิดเทอมใหญ่",
      description: "คณิตศาสตร์ระดับโอลิมปิก เน้นการแข่งขัน",
      instructor: "อาจารย์สมชาย",
      duration: "8 สัปดาห์",
      price: "6,000 บาท",
      image: "/advanced-math-olympiad.jpg",
    },
    {
      id: "16",
      title: "วิทยาศาสตร์ครบวงจร ปิดเทอมใหญ่",
      description: "ฟิสิกส์ เคมี ชีววิทยา ครบทุกวิชา",
      instructor: "ทีมอาจารย์",
      duration: "8 สัปดาห์",
      price: "10,000 บาท",
      image: "/science-comprehensive-course.jpg",
    },
  ],
}

export default function HomePage() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [cart, setCart] = useState<Set<string>>(new Set())

  const toggleFavorite = (courseId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(courseId)) {
        newFavorites.delete(courseId)
      } else {
        newFavorites.add(courseId)
      }
      return newFavorites
    })
  }

  const toggleCart = (courseId: string) => {
    setCart((prev) => {
      const newCart = new Set(prev)
      if (newCart.has(courseId)) {
        newCart.delete(courseId)
      } else {
        newCart.add(courseId)
      }
      return newCart
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar Placeholder */}

      {/* News Section */}
      <NewsSection />

      {/* Courses Section */}
      <section className="container mx-auto px-4 py-12 md:py-3">
        <div className="mb-8 text-center">
          <h2 className="mb-3 font-sans text-3xl font-bold text-foreground md:text-4xl">คอร์สเรียนทั้งหมด</h2>
          <p className="text-muted-foreground">เลือกคอร์สที่เหมาะกับคุณจากช่วงเวลาต่างๆ ตลอดปีการศึกษา</p>
        </div>

        <Tabs defaultValue="term1" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-2 gap-2 bg-secondary p-1 md:grid-cols-4">
            <TabsTrigger
              value="term1"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-white md:text-base"
            >
              เปิดเทอม 1
            </TabsTrigger>
            <TabsTrigger
              value="shortBreak"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-white md:text-base"
            >
              ปิดเทอมเล็ก
            </TabsTrigger>
            <TabsTrigger
              value="term2"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-white md:text-base"
            >
              เปิดเทอม 2
            </TabsTrigger>
            <TabsTrigger
              value="summerBreak"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-white md:text-base"
            >
              ปิดเทอมใหญ่
            </TabsTrigger>
          </TabsList>

          <TabsContent value="term1">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.term1.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isFavorite={favorites.has(course.id)}
                  isInCart={cart.has(course.id)}
                  onToggleFavorite={toggleFavorite}
                  onToggleCart={toggleCart}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shortBreak">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.shortBreak.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isFavorite={favorites.has(course.id)}
                  isInCart={cart.has(course.id)}
                  onToggleFavorite={toggleFavorite}
                  onToggleCart={toggleCart}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="term2">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.term2.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isFavorite={favorites.has(course.id)}
                  isInCart={cart.has(course.id)}
                  onToggleFavorite={toggleFavorite}
                  onToggleCart={toggleCart}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summerBreak">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.summerBreak.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isFavorite={favorites.has(course.id)}
                  isInCart={cart.has(course.id)}
                  onToggleFavorite={toggleFavorite}
                  onToggleCart={toggleCart}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer Placeholder */}
      <div className="h-64  border-border bg-card" />

      {/* Chatbot Button */}
      <ChatbotButton />
    </div>
  )
}
