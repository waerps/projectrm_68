import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Tag, BookOpen, ShoppingCart, Heart, Loader2, Sparkles } from "lucide-react"
import { getCourses } from "../callapi/callusers"
import { useShop } from "../context/ShopContext"

export default function Promotion() {
  const [allCourses, setAllCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const { cart, favorites, addToCart, toggleFavorite } = useShop()

  useEffect(() => {
    getCourses()
      .then((data) => setAllCourses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  // ── เงื่อนไข: มีส่วนลดเท่านั้น ──
  // Discount ในตาราง courses อาจเก็บเป็นตัวเลข (เช่น 500) หรือ string ("500 บาท")
  // เช็คทั้งสองแบบไว้ก่อน ถ้ารูปแบบจริงไม่ตรง (เช่นเก็บเป็น % ไว้คนละ field) รบกวนบอกด้วย
  const discountedCourses = allCourses.filter((c) => {
    const raw = c.Discount
    if (raw == null || raw === "" || raw === "0") return false
    const num = parseFloat(String(raw).replace(/[^0-9.]/g, ""))
    return !isNaN(num) && num > 0
  })

  const calcDiscountPercent = (price, discount) => {
    const p = Number(price) || 0
    const d = parseFloat(String(discount).replace(/[^0-9.]/g, "")) || 0
    if (!p) return null
    return Math.round((d / p) * 100)
  }

  return (
    <div className="mt-[110px] max-w-6xl mx-auto px-6 pb-16">
      {/* Header */}
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 text-white overflow-hidden relative">
        <Sparkles className="absolute -right-4 -top-4 h-32 w-32 text-white/10" />
        <div className="relative flex items-center gap-2 mb-2">
          <Tag className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-widest text-orange-100">Promotion</span>
        </div>
        <h1 className="relative text-3xl font-bold mb-2">โปรโมชั่นคอร์สเรียน</h1>
        <p className="relative text-orange-50 text-sm">
          {loading ? "กำลังโหลด..." : `พบ ${discountedCourses.length} คอร์สที่มีส่วนลดพิเศษตอนนี้`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-orange-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : discountedCourses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Tag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">ยังไม่มีคอร์สที่มีโปรโมชั่นในขณะนี้</p>
          <p className="text-xs text-gray-400 mt-1">โปรดติดตามโปรโมชั่นใหม่ ๆ เร็ว ๆ นี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {discountedCourses.map((c) => {
            const id = c.CourseID
            const isFav = favorites.some((f) => f.id === id)
            const inCart = cart.some((f) => f.id === id)
            const percent = calcDiscountPercent(c.Price, c.Discount)
            const courseData = {
              id,
              title: c.CourseName,
              price: c.Price != null ? `${c.Price} บาท` : "-",
            }
            return (
              <div key={id} className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col relative">
                {percent != null && percent > 0 && (
                  <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                    <Tag className="h-3 w-3" /> ลด {percent}%
                  </span>
                )}
                <Link to={`/courses/${id}`} className="block">
                  <div className="aspect-[16/10] bg-orange-50 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-orange-300" />
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <Link to={`/courses/${id}`}>
                    <p className="font-semibold text-sm text-gray-900 line-clamp-2 hover:text-orange-500 transition">
                      {c.CourseName}
                    </p>
                  </Link>

                  <div className="mt-1.5 flex items-baseline gap-2">
                    {c.FullCost != null && Number(c.FullCost) > Number(c.Price) && (
                      <span className="text-xs text-gray-400 line-through">
                        {Number(c.FullCost).toLocaleString()} บาท
                      </span>
                    )}
                    {c.Price != null && (
                      <span className="text-orange-500 font-bold text-sm">
                        {Number(c.Price).toLocaleString()} บาท
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-3 flex items-center gap-2">
                    <button
                      onClick={() => addToCart(courseData)}
                      disabled={inCart}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {inCart ? "อยู่ในตะกร้าแล้ว" : "เพิ่มลงตะกร้า"}
                    </button>
                    <button
                      onClick={() => toggleFavorite(courseData)}
                      className={`p-2 rounded-lg border transition ${
                        isFav ? "bg-red-50 border-red-200 text-red-500" : "bg-white border-gray-200 text-gray-400 hover:text-red-400"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isFav ? "fill-red-400" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}