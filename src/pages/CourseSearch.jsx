import React, { useEffect, useMemo, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Search, Heart, ShoppingCart, BookOpen, SlidersHorizontal, X, Loader2 } from "lucide-react"
import { getCourses } from "../callapi/callusers"
import { useShop } from "../context/ShopContext"

// ── ต้องตรงกับตัวเลือกใน Navbar.jsx ──
const SUBJECT_OPTIONS = [
  { id: 1, name: "ภาษาไทย" },
  { id: 2, name: "คณิตศาสตร์" },
  { id: 3, name: "วิทยาศาสตร์" },
  { id: 4, name: "ภาษาอังกฤษ" },
  { id: 5, name: "สังคมศึกษา" },
  { id: 6, name: "ฟิสิกส์" },
  { id: 7, name: "เคมี" },
  { id: 8, name: "ชีววิทยา" },
  { id: 9, name: "วิทย์เทคโนโลยี" },
]

const AVAILABILITY_OPTIONS = [
  { id: 1, name: "เรียนออนไซต์" },
  { id: 2, name: "เรียนออนไลน์" },
  { id: 3, name: "เรียนไฮบริด" },
]

const TERM_OPTIONS = [
  { id: 1, name: "เปิดเทอม 1 (4 เดือน)" },
  { id: 2, name: "ตุลาคม (ปิดเทอมเล็ก)" },
  { id: 3, name: "เปิดเทอม 2" },
  { id: 3, name: "ปิดเทอมใหญ่ (ซัมเมอร์)" },
]

const parseIds = (str) =>
  (str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)

// แทนที่ courseMatchesSubject / courseMatchesAvailability / courseMatchesTerm เดิม ด้วย:

function courseMatchesAvailability(course, ids) {
  if (!ids.length) return true
  return ids.includes(Number(course.Course_Availability_Id))
}

function courseMatchesTerm(course, ids) {
  if (!ids.length) return true
  return ids.includes(Number(course.Term_Id))
}

// ★ วิชา: courses table ไม่มี SubjectId ตรงๆ — ต้องรอ endpoint ที่คืนวิชาต่อคอร์สมาด้วย
// ตอนนี้ทำแบบ "ไม่กรองออก" ไปก่อน (แสดงผลถูกต้องสำหรับ availability/term แต่ subject ยังไม่กรองจริง)
function courseMatchesSubject(course, ids) {
  if (!ids.length) return true
  const subjectIds = (course.Subjects || []).map((s) => Number(s.SubjectId))
  if (!subjectIds.length) return true // ยังไม่มีข้อมูล ไม่กรองออก
  return subjectIds.some((id) => ids.includes(id))
}

export default function CourseSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { cart, favorites, addToCart, toggleFavorite } = useShop()

  const [allCourses, setAllCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")

  const search = searchParams.get("search") || ""
  const subjectIds = parseIds(searchParams.get("subject"))
  const availabilityIds = parseIds(searchParams.get("availability"))
  const termIds = parseIds(searchParams.get("term"))

  useEffect(() => {
    setLoading(true)
    getCourses()
      .then((data) => setAllCourses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allCourses.filter((c) => {
      const matchName = !q || (c.CourseName || "").toLowerCase().includes(q)
      return (
        matchName &&
        courseMatchesSubject(c, subjectIds) &&
        courseMatchesAvailability(c, availabilityIds) &&
        courseMatchesTerm(c, termIds)
      )
    })
  }, [allCourses, search, subjectIds, availabilityIds, termIds])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const toggleFilterId = (key, ids, id) => {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    updateParam(key, next.join(","))
  }

  const clearAllFilters = () => {
    setSearchParams(search ? { search } : {})
  }

  const submitSearch = (e) => {
    e.preventDefault()
    updateParam("search", searchInput.trim())
  }

  const activeFilterCount = subjectIds.length + availabilityIds.length + termIds.length

  const removeFilterChip = (key, ids, id) => {
    const next = ids.filter((x) => x !== id)
    updateParam(key, next.join(","))
  }

  const nameOf = (options, id) => options.find((o) => o.id === id)?.name || id

  return (
    <div className="mt-[110px] max-w-6xl mx-auto px-6 pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ผลการค้นหาคอร์สเรียน</h1>
        <p className="text-sm text-gray-500 mb-5">
          {loading ? "กำลังโหลด..." : `พบ ${filteredCourses.length} คอร์สที่ตรงกับเงื่อนไข`}
        </p>

        <form onSubmit={submitSearch} className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ค้นหาชื่อคอร์สเรียน, ระดับชั้นเรียน"
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <SlidersHorizontal className="h-4 w-4 text-orange-500" />
              ตัวกรอง
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">รายวิชา</p>
            <div className="space-y-1.5">
              {SUBJECT_OPTIONS.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-orange-500">
                  <input
                    type="checkbox"
                    checked={subjectIds.includes(s.id)}
                    onChange={() => toggleFilterId("subject", subjectIds, s.id)}
                    className="accent-orange-500"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">เทอม</p>
            <div className="space-y-1.5">
              {TERM_OPTIONS.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-orange-500">
                  <input
                    type="checkbox"
                    checked={termIds.includes(t.id)}
                    onChange={() => toggleFilterId("term", termIds, t.id)}
                    className="accent-orange-500"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">ลักษณะการสอน</p>
            <div className="space-y-1.5">
              {AVAILABILITY_OPTIONS.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-orange-500">
                  <input
                    type="checkbox"
                    checked={availabilityIds.includes(a.id)}
                    onChange={() => toggleFilterId("availability", availabilityIds, a.id)}
                    className="accent-orange-500"
                  />
                  {a.name}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {subjectIds.map((id) => (
                <span key={`s${id}`} className="flex items-center gap-1 pl-3 pr-2 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium">
                  {nameOf(SUBJECT_OPTIONS, id)}
                  <button onClick={() => removeFilterChip("subject", subjectIds, id)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {termIds.map((id) => (
                <span key={`t${id}`} className="flex items-center gap-1 pl-3 pr-2 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium">
                  {nameOf(TERM_OPTIONS, id)}
                  <button onClick={() => removeFilterChip("term", termIds, id)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {availabilityIds.map((id) => (
                <span key={`a${id}`} className="flex items-center gap-1 pl-3 pr-2 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium">
                  {nameOf(AVAILABILITY_OPTIONS, id)}
                  <button onClick={() => removeFilterChip("availability", availabilityIds, id)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64 text-orange-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500 font-medium">ไม่พบคอร์สที่ตรงกับเงื่อนไขที่เลือก</p>
              <p className="text-xs text-gray-400 mt-1">ลองปรับตัวกรอง หรือค้นหาด้วยคำอื่น</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map((c) => {
                const id = c.CourseID
                const isFav = favorites.some((f) => f.id === id)
                const inCart = cart.some((f) => f.id === id)
                const courseData = {
                  id,
                  title: c.CourseName,
                  price: c.Price != null ? `${c.Price} บาท` : "-",
                }
                return (
                  <div key={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
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
                      {c.Price != null && (
                        <p className="text-orange-500 font-bold text-sm mt-1">{Number(c.Price).toLocaleString()} บาท</p>
                      )}
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
      </div>
    </div>
  )
}