import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Search, Heart, ShoppingCart, User } from "lucide-react"

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex justify-center pt-6">
      <nav className="mx-6 md:mx-12 flex h-[83px] w-full max-w-[1384px] items-center justify-between gap-8 rounded-2xl bg-white px-6 md:px-8 shadow-lg">
        
        {/* ✅ Logo */}
        <Link to="/" className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center">
              <img
                src="/logo.png"
                alt="ศรเสริมติวเตอร์"
                className="h-auto w-full object-contain"
              />
            </div>
            <div className="hidden flex-col md:flex">
              <span className="font-sans font-bold text-sm leading-tight text-gray-800">
                SORNSERM
              </span>
              <span className="font-sans font-bold text-sm leading-tight text-gray-800">
                TUTOR
              </span>
            </div>
          </div>
        </Link>

        {/* ✅ เมนู + กล่องค้นหา */}
        <div className="flex items-center flex-1 justify-center gap-8">
          {/* เมนูนำทาง */}
          <div className="hidden md:flex items-center gap-8 ml-4"> {/* ← เพิ่ม margin-left */}
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive("/")
                  ? "text-orange-500 border-b-2 border-orange-500 pb-1"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              to="/apply-tutor"
              className={`font-medium transition-colors ${
                isActive("/apply-tutor")
                  ? "text-orange-500 border-b-2 border-orange-500 pb-1"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              สมัครติวเตอร์
            </Link>
          </div>

          {/* ✅ กล่องค้นหา (สั้นลงเล็กน้อย) */}
          <div className="relative flex-1 max-w-sm"> {/* ← เดิม max-w-md */}
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="ค้นหาคอร์สเรียน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* ✅ ปุ่มด้านขวา */}
        <div className="flex items-center gap-2">
          <button
            className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-orange-100 hover:text-orange-500 transition-colors"
            aria-label="รายการโปรด"
          >
            <Heart className="h-5 w-5" />
          </button>

          <button
            className="relative h-11 w-11 flex items-center justify-center rounded-lg hover:bg-orange-100 hover:text-orange-500 transition-colors mr-4"
            aria-label="ตะกร้า"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              0
            </span>
          </button>

          <Link
            to="/login"
            className="hidden md:inline-flex h-11 items-center rounded-lg border border-orange-500 px-6 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
          >
            เข้าสู่ระบบ
          </Link>

          <Link
            to="/register"
            className="hidden md:inline-flex h-11 items-center rounded-lg bg-orange-500 px-6 text-white hover:bg-orange-600 transition-colors"
          >
            ลงทะเบียน
          </Link>
        </div>
      </nav>
    </div>
  )
}
