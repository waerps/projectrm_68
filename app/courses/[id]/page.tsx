"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Clock, User, Calendar, BookOpen, Award, ArrowLeft, Play } from "lucide-react"

// Mock course data
const courseDetails: Record<string, any> = {
  "1": {
    id: "1",
    title: "คอร์สรวม ป.4",
    description: "เรียนคณิตศาสตร์พื้นฐาน เน้นการคิดวิเคราะห์และแก้โจทย์",
    fullDescription:
      "คอร์สคณิตศาสตร์สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 4 เทอม 1 เน้นการสร้างพื้นฐานที่แข็งแกร่ง พัฒนาทักษะการคิดวิเคราะห์ และการแก้โจทย์อย่างเป็นระบบ ครอบคลุมเนื้อหาตามหลักสูตรแกนกลาง พร้อมเทคนิคพิเศษในการทำข้อสอบ",
    instructor: "อาจารย์สมชาย ใจดี",
    instructorBio: "ประสบการณ์สอนคณิตศาสตร์มากกว่า 15 ปี จบปริญญาโทคณิตศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
    duration: "16 สัปดาห์",
    price: "4,500 บาท",
    image: "/math-classroom-students.jpg",
    videoUrl: "/video-thumbnail-math-lesson.jpg",
    schedule: "ทุกวันเสาร์ 13:00-16:00 น.",
    startDate: "15 พฤษภาคม 2568",
    seats: "25 ที่นั่ง",
    level: "ม.4",
    topics: [
      "เซตและตรรกศาสตร์",
      "จำนวนจริง",
      "เลขยกกำลัง",
      "พหุนาม",
      "สมการและอสมการ",
      "ฟังก์ชัน",
      "เรขาคณิตวิเคราะห์",
      "ตรีโกณมิติ",
    ],
    features: [
      "เอกสารประกอบการสอนครบชุด",
      "แบบฝึกหัดและเฉลยละเอียด",
      "ติวก่อนสอบกลางภาคและปลายภาค",
      "ระบบติดตามผลการเรียน",
      "ปรึกษาอาจารย์ได้ตลอดเวลา",
    ],
  },
  // Add more course details as needed
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const [isFavorite, setIsFavorite] = useState(false)
  const [isInCart, setIsInCart] = useState(false)

  // Get course details or use default
  const course = courseDetails[courseId] || {
    id: courseId,
    title: "คอร์สเรียน",
    description: "รายละเอียดคอร์สเรียน",
    fullDescription: "รายละเอียดเพิ่มเติมเกี่ยวกับคอร์สนี้",
    instructor: "อาจารย์",
    instructorBio: "ประสบการณ์สอนมากกว่า 10 ปี",
    duration: "16 สัปดาห์",
    price: "4,500 บาท",
    image: "/classroom-teaching.png",
    videoUrl: "/video-thumbnail.png",
    schedule: "ทุกวันเสาร์ 13:00-16:00 น.",
    startDate: "15 พฤษภาคม 2568",
    seats: "25 ที่นั่ง",
    level: "ม.4-6",
    topics: ["หัวข้อ 1", "หัวข้อ 2", "หัวข้อ 3"],
    features: ["คุณสมบัติ 1", "คุณสมบัติ 2", "คุณสมบัติ 3"],
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar Placeholder */}
      <div className="h-16 border-b border-border bg-card" />

      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้าหลัก
        </Button>
      </div>

      {/* Course Header */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Course Image & Video */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={course.image || "/placeholder.svg"}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Course Info */}
            <div>
              <Badge className="mb-3 bg-primary text-primary-foreground">{course.level}</Badge>
              <h1 className="mb-4 font-sans text-3xl font-bold text-foreground md:text-4xl text-balance">
                {course.title}
              </h1>
              <p className="mb-6 text-lg leading-relaxed text-muted-foreground text-pretty">{course.fullDescription}</p>

              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{course.instructor}</p>
                    <p className="text-sm text-muted-foreground">{course.instructorBio}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{course.duration}</p>
                    <p className="text-sm text-muted-foreground">{course.schedule}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">เริ่มเรียน</p>
                    <p className="text-sm text-muted-foreground">{course.startDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">จำนวนที่นั่ง</p>
                    <p className="text-sm text-muted-foreground">{course.seats}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">{course.price}</span>
                <span className="text-muted-foreground">/ คอร์ส</span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant={isFavorite ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="shrink-0"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => setIsInCart(!isInCart)}
                  variant={isInCart ? "secondary" : "default"}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isInCart ? "อยู่ในตะกร้าแล้ว" : "เพิ่มลงตะกร้า"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Details */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Topics Covered */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <h2 className="font-sans text-2xl font-bold text-foreground">เนื้อหาที่สอน</h2>
              </div>
              <ul className="space-y-3">
                {course.topics.map((topic: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <span className="leading-relaxed text-foreground">{topic}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Course Features */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                <h2 className="font-sans text-2xl font-bold text-foreground">สิ่งที่คุณจะได้รับ</h2>
              </div>
              <ul className="space-y-3">
                {course.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden mt-20">
                <CardContent className="p-0">
                  <div className="group relative aspect-video cursor-pointer overflow-hidden bg-muted">
                    <img
                      src={course.videoUrl || "/placeholder.svg"}
                      alt="วิดีโอตัวอย่าง"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                        <Play className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-foreground">วิดีโอตัวอย่างคอร์สเรียน</p>
                    <p className="text-xs text-muted-foreground">ดูตัวอย่างการสอนและบรรยากาศในห้องเรียน</p>
                  </div>
                </CardContent>
              </Card>
      </section>

      {/* Footer Placeholder */}
      <div className="h-64 border-t border-border bg-card" />
    </div>
  )
}
