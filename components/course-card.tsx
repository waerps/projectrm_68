"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Clock, User, Calendar, Armchair } from "lucide-react"


interface Course {
  id: string
  title: string
  description: string
  instructor: string
  duration: string
  price: string
  promotion?: string
  schedule?: {
    weekdays?: string
    saturday?: string
    sunday?: string
    online?: string
  }
  capacity?: number
  currentSeats?: number
  image: string
}

interface CourseCardProps {
  course: Course
  isFavorite: boolean
  isInCart: boolean
  onToggleFavorite: (courseId: string) => void
  onToggleCart: (courseId: string) => void
}

export default function CourseCard({
  course,
  isFavorite,
  isInCart,
  onToggleFavorite,
  onToggleCart,
}: CourseCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all hover:shadow-lg">
      {/* รูปภาพหลัก */}
      <Link href={`/courses/${course.id}`} className="relative h-48 overflow-hidden">
        <img
          src={course.image || "/placeholder.svg"}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* เนื้อหาหลัก */}
      <CardContent className="flex-1 p-5">
        <Link href={`/courses/${course.id}`}>
          <h3 className="mb-2 font-sans text-lg font-semibold leading-tight text-foreground transition-colors hover:text-primary text-balance">
            {course.title}
          </h3>
        </Link>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground text-pretty">{course.description}</p>

        <div className="space-y-2 text-sm text-muted-foreground">
          {/* <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span>{course.instructor}</span>
          </div> */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{course.duration}</span>
          </div>

          {/* ตารางเรียน */}
          {course.schedule && (
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2 font-medium text-primary">
                <Calendar className="h-4 w-4" />
                <span>ตารางเรียน</span>
              </div>
              <div className="pl-5 space-y-1">
                {course.schedule.weekdays && <p>- {course.schedule.weekdays}</p>}
                {course.schedule.saturday && <p>- เสาร์ {course.schedule.saturday}</p>}
                {course.schedule.sunday && <p>- อาทิตย์ {course.schedule.sunday}</p>}
                {course.schedule.online && <p>- ออนไลน์ {course.schedule.online}</p>}
              </div>
            </div>
          )}

          {/* จำนวนที่นั่ง */}
          {course.capacity && (
            <div className="mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium">
              <Armchair className="h-4 w-4 text-primary" />
                <span>
                  ที่นั่งทั้งหมด: {course.capacity} ที่ | จองแล้ว: {course.currentSeats ?? 0} ที่
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ราคา + โปรโมชั่น */}
        <div className="mt-4">
          <div className="font-bold text-primary line-through">{course.price}</div>
          {course.promotion && (
            <div className="text-green-600 text-2xl font-medium">
              {course.promotion}
            </div>
          )}
        </div>
      </CardContent>

      {/* ปุ่มด้านล่าง */}
      <CardFooter className="flex gap-2 border-t border-border p-4">
        <Button
          variant={isFavorite ? "default" : "outline"}
          size="icon"
          onClick={() => onToggleFavorite(course.id)}
          className="shrink-0"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current text-red-500" : ""}`} />
        </Button>
        <Button
          variant={isInCart ? "default" : "outline"}
          className="flex-1"
          onClick={() => onToggleCart(course.id)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isInCart ? "อยู่ในตะกร้า" : "เพิ่มลงตะกร้า"}
        </Button>
      </CardFooter>
    </Card>
  )
}
