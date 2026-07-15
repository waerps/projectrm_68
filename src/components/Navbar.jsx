import React, { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Search, Heart, ShoppingCart, X, Trash2, BookOpen, ChevronRight, SlidersHorizontal } from "lucide-react"
import { useShop } from "../context/ShopContext"
import { getCourses } from "../callapi/callusers"
import { getFileUrl } from "../utils/fileUrl"

// ── ตัวเลือกฟิลเตอร์: อ้างอิงจากตาราง subjects / course_availability ที่ส่งมา ──
// ⚠️ เทอม ยังไม่มีตารางอ้างอิงให้ดู ใส่ placeholder ไว้ก่อน รอพี่ยืนยันชื่อ table/column
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

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [showSearchDrop, setShowSearchDrop] = useState(false)
  const [showFavDrop, setShowFavDrop] = useState(false)
  const [showCartDrop, setShowCartDrop] = useState(false)
  const [showFilterDrop, setShowFilterDrop] = useState(false)
  const [userData, setUserData] = useState(null)

  // ── state ของฟิลเตอร์ ──
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [selectedAvailability, setSelectedAvailability] = useState([])
  const [selectedTerm, setSelectedTerm] = useState([])

  const location = useLocation()
  const navigate = useNavigate()
  const { cart, favorites, removeFromCart, toggleFavorite } = useShop()

  const searchRef = useRef(null)
  const favRef = useRef(null)
  const cartRef = useRef(null)
  const filterRef = useRef(null)

  const isActive = (path) => location.pathname === path
  const PREVIEW = 5

  useEffect(() => {
    getCourses().then((data) => setAllCourses(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) setUserData(JSON.parse(savedUser))
  }, [])

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      setSearchResults([])
      setShowSearchDrop(false)
      return
    }
    const filtered = allCourses.filter((c) =>
      (c.CourseName || "").toLowerCase().includes(q)
    )
    setSearchResults(filtered)
    setShowSearchDrop(true)
    setShowFavDrop(false)
    setShowCartDrop(false)
    setShowFilterDrop(false)
  }, [searchQuery, allCourses])

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDrop(false)
      if (favRef.current && !favRef.current.contains(e.target)) setShowFavDrop(false)
      if (cartRef.current && !cartRef.current.contains(e.target)) setShowCartDrop(false)
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterDrop(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSelectCourse = (id) => {
    setShowSearchDrop(false)
    setShowFavDrop(false)
    setShowCartDrop(false)
    setShowFilterDrop(false)
    setSearchQuery("")
    navigate(`/courses/${id}`)
  }

  // ── รวม query param ของ search + ฟิลเตอร์ทั้งหมดไว้ที่เดียว ──
  const buildFilterParams = (extra = {}) => {
    const params = new URLSearchParams()
    if (extra.search) params.set("search", extra.search)
    if (selectedSubjects.length) params.set("subject", selectedSubjects.join(","))
    if (selectedAvailability.length) params.set("availability", selectedAvailability.join(","))
    if (selectedTerm.length) params.set("term", selectedTerm.join(","))
    return params
  }

  const handleViewAll = () => {
    setShowSearchDrop(false)
    const params = buildFilterParams({ search: searchQuery })
    navigate(`/courses?${params.toString()}`)
    setSearchQuery("")
  }

  const toggleDrop = (which) => {
    setShowSearchDrop(false)
    setShowFilterDrop(which === "filter" ? !showFilterDrop : false)
    setShowFavDrop(which === "fav" ? !showFavDrop : false)
    setShowCartDrop(which === "cart" ? !showCartDrop : false)
  }

  const toggleInArray = (setter) => (id) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleSubject = toggleInArray(setSelectedSubjects)
  const toggleAvailability = toggleInArray(setSelectedAvailability)
  const toggleTerm = toggleInArray(setSelectedTerm)

  const activeFilterCount = selectedSubjects.length + selectedAvailability.length + selectedTerm.length

  const clearFilters = () => {
    setSelectedSubjects([])
    setSelectedAvailability([])
    setSelectedTerm([])
  }

  // ── ทุกครั้งที่ติ๊กฟิลเตอร์ ให้พาไปหน้าผลการค้นหาทันที ──
  useEffect(() => {
    if (!activeFilterCount) return
    const params = buildFilterParams({ search: searchQuery })
    navigate(`/courses?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjects, selectedAvailability, selectedTerm])

const cartTotal = cart.reduce((sum, item) => {
  let price = 0

  if (typeof item.price === "number") {
    price = item.price
  } else {
    price = parseFloat(
      String(item.price || "").replace(/[^0-9.]/g, "")
    ) || 0
  }

  return sum + price
}, 0)

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex justify-center pt-4">
      <nav className="mx-6 md:mx-12 flex h-[65px] w-full max-w-[1384px] items-center justify-between gap-8 rounded-2xl bg-white px-6 md:px-8 shadow-lg">

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center">
              <img src="/logo.png" alt="ศรเสริมติวเตอร์" className="h-auto w-full object-contain" />
            </div>
            <div className="hidden flex-col md:flex">
              <span className="font-sans font-bold text-xs leading-tight text-gray-800">SORNSERM</span>
              <span className="font-sans font-bold text-xs leading-tight text-gray-800">TUTOR</span>
            </div>
          </div>
        </Link>

        {/* Menu + Search */}
        <div className="flex items-center flex-1 justify-center gap-8">
          <div className="hidden md:flex items-center gap-8 ml-4">
            <Link
              to="/"
              className={`font-medium transition-colors text-xs ${
                isActive("/")
                  ? "text-orange-500 border-b-2 border-orange-500 pb-1"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              to="/apply-tutor"
              className={`font-medium transition-colors text-xs ${
                isActive("/apply-tutor")
                  ? "text-orange-500 border-b-2 border-orange-500 pb-1"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              สมัครติวเตอร์
            </Link>
            <Link
              to="/news"
              className={`font-medium transition-colors text-xs ${
                isActive("/news")
                  ? "text-orange-500 border-b-2 border-orange-500 pb-1"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              ข่าวประชาสัมพันธ์
            </Link>
            <Link
              to="/promotion"
              className={`font-medium transition-colors text-xs ${
                isActive("/promotion")
                  ? "text-orange-500 border-b-2 border-orange-500 pb-1"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              โปรโมชั่น
            </Link>
            <Link
              to="/about"
              className={`font-medium transition-colors text-xs ${
                isActive("/about")
                  ? "text-orange-500 border-b-2 border-orange-500 pb-1"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              เกี่ยวกับสถาบัน
            </Link>
            

            {/* หมวดหมู่
            <div className="relative group">
              <div
                className={`flex items-center gap-1 cursor-pointer font-medium text-xs transition-colors text-gray-700 hover:text-orange-500`}
              >
                <span>หมวดหมู่</span>
                <svg
                  className="w-3 h-3 transition-transform duration-200 group-hover:rotate-90 mt-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </div>

              <div
                className="
                  absolute left-0 mt-3 w-47
                  rounded-xl bg-white shadow-lg
                  opacity-0 invisible
                  group-hover:opacity-100 group-hover:visible
                  transition-all duration-200
                  z-50
                "
              >
                <ul className="py-2 text-xs text-gray-700">
                  <li>
                    <Link to="/promotion" className={`block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition ${isActive("/promotion") ? "text-orange-500 font-semibold" : ""}`}>
                      โปรโมชั่น
                    </Link>
                  </li>
                  <li>
                    <Link to="/news" className={`block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition ${isActive("/news") ? "text-orange-500 font-semibold" : ""}`}>
                      ข่าวประชาสัมพันธ์
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className={`block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition ${isActive("/about") ? "text-orange-500 font-semibold" : ""}`}>
                      เกี่ยวกับเรา
                    </Link>
                  </li>
                </ul>
              </div>
            </div> */}
            
          </div>

          {/* Search Box + ปุ่มฟิลเตอร์ */}
          <div className="flex items-center flex-1 max-w-sm gap-2">
            <div className="relative flex-1" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อคอร์สเรียน"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchDrop(true)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
              />

              {showSearchDrop && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 navbar-drop">
                  {searchResults.length === 0 ? (
                    <div className="px-5 py-6 text-center text-sm text-gray-400">
                      ไม่พบคอร์สที่ตรงกับ &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    <>
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">ผลการค้นหา</span>
                      </div>

                      {searchResults.slice(0, PREVIEW).map((c) => (
                        <button
                          key={c.CourseID}
                          onClick={() => handleSelectCourse(c.CourseID)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-orange-50 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
                              <BookOpen className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-800 group-hover:text-orange-600">
                                {highlightMatch(c.CourseName || "", searchQuery)}
                              </p>
                              {c.Price != null && (
                                <p className="text-xs text-gray-400">{Number(c.Price).toLocaleString()} บาท</p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-orange-400 transition" />
                        </button>
                      ))}

                      <button
                        onClick={handleViewAll}
                        className="flex w-full items-center justify-center gap-2 bg-orange-500 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                      >
                        ดูทั้งหมด ({searchResults.length} คอร์ส)
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── ปุ่มฟิลเตอร์ ── */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => toggleDrop("filter")}
                title="ตัวกรองการค้นหา"
                className={`relative h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg border transition-colors ${
                  activeFilterCount > 0
                    ? "border-orange-400 bg-orange-50 text-orange-500"
                    : "border-gray-200 bg-gray-50 text-gray-400 hover:text-orange-500 hover:border-orange-300"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {showFilterDrop && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 max-h-[420px] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-100 navbar-drop p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">ตัวกรอง</span>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">รายวิชา</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUBJECT_OPTIONS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => toggleSubject(s.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            selectedSubjects.includes(s.id)
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300"
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">เทอม</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TERM_OPTIONS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => toggleTerm(t.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            selectedTerm.includes(t.id)
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300"
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">ลักษณะการสอน</p>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABILITY_OPTIONS.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => toggleAvailability(a.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            selectedAvailability.includes(a.id)
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300"
                          }`}
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ปุ่มด้านขวา */}
        <div className="flex items-center gap-2">

          {/* ── Favorites ── */}
          <div className="relative" ref={favRef}>
            <button
              onClick={() => toggleDrop("fav")}
              className={`relative h-11 w-11 flex items-center justify-center rounded-lg transition-colors ${showFavDrop ? "bg-red-50 text-red-500" : "hover:bg-orange-100 hover:text-orange-500"}`}
            >
              <Heart className={`h-5 w-5 ${showFavDrop ? "fill-red-400 text-red-400" : ""}`} />
              {favorites.length > 0 && (
                <span className="absolute right-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </button>

            {showFavDrop && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-80 overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 navbar-drop">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">รายการโปรด</span>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-400">{favorites.length} รายการ</span>
                </div>

                {favorites.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10">
                    <Heart className="h-12 w-12 text-gray-100" />
                    <p className="text-sm text-gray-400">ยังไม่มีรายการโปรด</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-y-auto">
                      {favorites.slice(0, PREVIEW).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
                            <BookOpen className="h-4 w-4 text-red-400" />
                          </div>
                          <button
                            onClick={() => handleSelectCourse(item.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-medium text-gray-800 group-hover:text-orange-500">{item.title}</p>
                            <p className="text-xs text-orange-400">{item.price}</p>
                          </button>
                          <button
                            onClick={() => toggleFavorite(item)}
                            className="flex-shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Link
                      to="/favorites"
                      onClick={() => setShowFavDrop(false)}
                      className="flex w-full items-center justify-center gap-2 border-t border-gray-50 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      ดูรายการโปรดทั้งหมด ({favorites.length})
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Cart ── */}
          <div className="relative mr-4" ref={cartRef}>
            <button
              onClick={() => toggleDrop("cart")}
              className={`relative h-11 w-11 flex items-center justify-center rounded-lg transition-colors ${showCartDrop ? "bg-orange-50 text-orange-500" : "hover:bg-orange-100 hover:text-orange-500"}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {cart.length > 9 ? "9+" : cart.length}
                </span>
              )}
            </button>

            {showCartDrop && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-80 overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 navbar-drop">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">ตะกร้าสินค้า</span>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-400">{cart.length} รายการ</span>
                </div>

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10">
                    <ShoppingCart className="h-12 w-12 text-gray-100" />
                    <p className="text-sm text-gray-400">ตะกร้าว่างเปล่า</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-y-auto">
                      {cart.slice(0, PREVIEW).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50">
                            <BookOpen className="h-4 w-4 text-orange-400" />
                          </div>
                          <button
                            onClick={() => handleSelectCourse(item.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-medium text-gray-800 group-hover:text-orange-500">{item.title}</p>
                            <p className="text-xs text-orange-400">{item.price}</p>
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex-shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 bg-orange-50/50 px-4 py-2.5">
                      <span className="text-xs text-gray-500">รวมทั้งหมด</span>
                      <span className="text-sm font-bold text-orange-500">{cartTotal.toLocaleString()} บาท</span>
                    </div>

                    <Link
                      to="/cart"
                      onClick={() => setShowCartDrop(false)}
                      className="flex w-full items-center justify-center gap-2 bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      ดูตะกร้าทั้งหมด ({cart.length})
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── User / Login (โชว์รูป + ชื่อเล่นเท่านั้น) ── */}
          {userData ? (
            <div className="relative group flex items-center gap-2">
              <div className={`flex items-center gap-2 cursor-pointer pb-1`}>
                <div className="h-8 w-8 rounded-full overflow-hidden border border-orange-200 bg-orange-50 flex-shrink-0">
                  <img
                    src={
                      userData.photo
                        ? getFileUrl(userData.photo)
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=user_${userData.id || userData.username}&backgroundColor=dbeafe`
                    }
                    alt={userData.nickname || userData.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=user_${userData.id || userData.username}&backgroundColor=dbeafe`
                    }}
                  />
                </div>
                <span className={`font-bold text-sm transition-colors ${isActive("/profile") ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-700 hover:text-orange-500"}`}>
                  {userData.nickname}
                </span>
              </div>
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                <ul className="py-2 text-sm text-gray-700">
                  <li><Link to="/profile" className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition">ข้อมูลส่วนตัว</Link></li>
                  <li><Link to="/profile/schedule" className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition">ตารางเรียน</Link></li>
                  <li><Link to="/profile/notifications" className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition">การแจ้งเตือน</Link></li>
                  <li><Link to="/profile/my-courses" className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition">คอร์สเรียนของฉัน</Link></li>
                  <li>
                    <button
                      onClick={() => { localStorage.clear(); window.location.href = "/login" }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition border-t border-gray-50 mt-1"
                    >
                      ออกจากระบบ
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <Link to="/login" className="h-10 flex items-center rounded-lg bg-orange-500 px-6 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </nav>

      <style>{`
        .navbar-drop {
          animation: navDrop 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top center;
        }
        @keyframes navDrop {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

function highlightMatch(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-orange-500">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}