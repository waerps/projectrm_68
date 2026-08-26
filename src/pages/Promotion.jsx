import React, { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BadgeCheck, BookOpen, Calendar, Heart, Loader2, LockKeyhole, ShoppingCart, Sparkles, Tag, X } from "lucide-react"
import { getCourses } from "../callapi/callusers"
import { useShop } from "../context/ShopContext"

const API_URL = import.meta.env.VITE_API_URL
const STATUS_BADGE = {
  1: { label: "เปิดรับสมัคร", cls: "bg-blue-50/95 text-blue-600 border border-blue-100" },
  2: { label: "กำลังสอน", cls: "bg-emerald-50/95 text-emerald-600 border border-emerald-100" },
  3: { label: "ปิดรับสมัคร", cls: "bg-amber-50/95 text-amber-600 border border-amber-100" },
}
const AVAILABILITY_LABELS = { 1: "เรียนออนไซต์", 2: "เรียนออนไลน์", 3: "เรียนไฮบริด" }
const formatNumber = (value) => new Intl.NumberFormat("th-TH").format(Number(value || 0))
const formatDate = (value) => {
  const date = new Date(value)
  return value && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date)
    : "-"
}
const formatDateRange = (start, end) => start && end ? `${formatDate(start)} - ${formatDate(end)}` : start ? `เริ่ม ${formatDate(start)}` : "ยังไม่กำหนดวันเรียน"
const resolveCourseImg = (course) => !course.CourseImage ? null : course.CourseImage.startsWith("http") ? course.CourseImage : `${API_URL}${course.CourseImage}`

function CourseArtwork({ src, alt }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100" role="img" aria-label={alt}>
        <BookOpen className="h-14 w-14 text-orange-300" />
      </div>
    )
  }

  return <img src={src} alt={alt} onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
}
export const toCardItem = (course) => {
  const price = Number(course.Price || 0)
  const discount = Number(course.Discount || 0)
  return {
    id: course.CourseID,
    title: course.CourseName,
    price,
    discount,
    fullCost: course.FullCost != null ? Number(course.FullCost) : Math.max(0, price - discount),
    discountPercent: price > 0 ? Math.round((discount / price) * 100) : 0,
    dateRange: formatDateRange(course.StartDate, course.LastDate),
    status: course.Status_Course_Id,
    img: resolveCourseImg(course),
    courseType: (Array.isArray(course.Subjects) ? course.Subjects.length : 0) > 1 ? "คอร์สรวม" : "คอร์สเดี่ยว",
    availabilityName: AVAILABILITY_LABELS[Number(course.Course_Availability_Id)] || "ยังไม่ระบุรูปแบบ",
  }
}

export function CourseCard({ item, isFav, inCart, onBuyNow, onAddToCart, onToggleFavorite, showDiscountBadge = false }) {
  const statusBadge = STATUS_BADGE[item.status]
  const canEnroll = [1, 2].includes(Number(item.status))
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100">
        <CourseArtwork src={item.img} alt={item.title} />
        {showDiscountBadge && item.discountPercent > 0 && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
            <Tag className="h-3 w-3" /> ลดราคา {item.discountPercent}%
          </span>
        )}
        {statusBadge && <span className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur ${statusBadge.cls}`}>{statusBadge.label}</span>}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 min-h-[2.6rem] text-[13.5px] font-bold leading-snug text-neutral-800">{item.title}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-orange-400" /><span className="truncate">{item.dateRange}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-sm font-bold text-green-500">฿</span>
          <span className="text-sm font-bold text-green-700">{formatNumber(item.fullCost)} บาท</span>
          {item.discount > 0 && <span className="text-[11px] text-neutral-400 line-through">{formatNumber(item.price)} บาท</span>}
        </div>
        <div className="mb-3 mt-2.5 flex flex-wrap gap-1.5">
          {item.discount > 0 && <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"><Sparkles className="h-3 w-3" /> โปรโมชัน</span>}
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{item.courseType}</span>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">{item.availabilityName}</span>
        </div>
        <div className="mt-auto flex items-center gap-2 border-t border-neutral-100 pt-3">
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (canEnroll) onBuyNow() }} disabled={!canEnroll} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-[11px] font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-neutral-300">
            <BadgeCheck className="h-3.5 w-3.5" />{canEnroll ? "ซื้อคอร์สเรียน" : statusBadge?.label || "ไม่เปิดรับสมัคร"}
          </button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (canEnroll) onAddToCart() }} disabled={inCart || !canEnroll} aria-label={inCart ? "อยู่ในตะกร้าแล้ว" : canEnroll ? "เพิ่มลงตะกร้า" : "ไม่เปิดรับสมัคร"} title={inCart ? "อยู่ในตะกร้าแล้ว" : canEnroll ? "เพิ่มลงตะกร้า" : "ไม่เปิดรับสมัคร"} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-orange-200 bg-orange-50 text-orange-500 transition hover:border-orange-300 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50">
            <ShoppingCart className="h-4 w-4" />
          </button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite() }} aria-label={isFav ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"} title={isFav ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${isFav ? "border-red-200 bg-red-50 text-red-500" : "border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400"}`}>
            <Heart className={`h-4 w-4 ${isFav ? "fill-red-400" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function LoginRequiredModal({ open, onClose, onLogin }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="course-login-title" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="ปิด"><X className="h-5 w-5" /></button>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-500"><LockKeyhole className="h-7 w-7" /></span>
        <h2 id="course-login-title" className="mt-5 text-xl font-extrabold text-[#14213D]">กรุณาเข้าสู่ระบบก่อนซื้อคอร์ส</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">เข้าสู่ระบบนักเรียนเพื่อดำเนินการชำระเงินและบันทึกคอร์สไว้ในบัญชีของคุณ</p>
        <button type="button" onClick={onLogin} className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600">ไปหน้าเข้าสู่ระบบ</button>
        <button type="button" onClick={onClose} className="mt-2 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50">เลือกดูคอร์สต่อ</button>
      </div>
    </div>
  )
}

export default function Promotion() {
  const navigate = useNavigate()
  const [allCourses, setAllCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)
  const { cart, favorites, addToCart, toggleFavorite } = useShop()
  useEffect(() => { getCourses().then((data) => setAllCourses(Array.isArray(data) ? data : [])).finally(() => setLoading(false)) }, [])
  const promotionCourses = useMemo(
    () => allCourses.filter((course) => Number(course.Discount) > 0 && [1, 2].includes(Number(course.Status_Course_Id))),
    [allCourses]
  )
  const buyNow = (item) => {
    if (!localStorage.getItem("student_token")) return setLoginPromptOpen(true)
    addToCart(item)
    navigate("/cart", { state: { openCheckout: true } })
  }

  return (
    <div className="mx-auto mt-[110px] max-w-[1200px] px-4 pb-16 md:px-6">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 text-white">
        <Sparkles className="absolute -right-4 -top-4 h-32 w-32 text-white/10" />
        <div className="relative mb-2 flex items-center gap-2"><Tag className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-widest text-orange-100">Promotion</span></div>
        <h1 className="relative mb-2 text-3xl font-bold">โปรโมชันคอร์สเรียน</h1>
        <p className="relative text-sm text-orange-50">{loading ? "กำลังโหลด..." : `พบ ${promotionCourses.length} คอร์สที่มีส่วนลดพิเศษตอนนี้`}</p>
      </div>
      {loading ? <div className="flex h-64 items-center justify-center text-orange-500"><Loader2 className="h-6 w-6 animate-spin" /></div> : promotionCourses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center"><Tag className="mx-auto mb-3 h-12 w-12 text-gray-200" /><p className="font-medium text-gray-500">ยังไม่มีคอร์สที่มีโปรโมชันในขณะนี้</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {promotionCourses.map((course) => {
            const item = toCardItem(course)
            return <Link key={course.CourseID} to={`/courses/${course.CourseID}`} className="block h-full"><CourseCard item={item} isFav={favorites.some((f) => f.id === item.id)} inCart={cart.some((c) => c.id === item.id)} showDiscountBadge onBuyNow={() => buyNow(item)} onAddToCart={() => addToCart(item)} onToggleFavorite={() => toggleFavorite(item)} /></Link>
          })}
        </div>
      )}
      <LoginRequiredModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} onLogin={() => navigate("/login", { state: { returnTo: "/promotion" } })} />
    </div>
  )
}
