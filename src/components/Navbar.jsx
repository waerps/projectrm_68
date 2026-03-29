import React, { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Search, Heart, ShoppingCart } from "lucide-react"

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [userData, setUserData] = useState(null) // เก็บข้อมูลผู้ใช้
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  // ดึงข้อมูลผู้ใช้จาก LocalStorage เมื่อ Component โหลด
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUserData(JSON.parse(savedUser))
    }
  }, [])

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
          {/* ... (เมนูและกล่องค้นหาเหมือนเดิม) ... */}
          <div className="hidden md:flex items-center gap-8 ml-4">
             <Link to="/" className={`font-medium transition-colors text-xs ${isActive("/") ? "text-orange-500 border-b-2 border-orange-500 pb-1" : "text-gray-700 hover:text-orange-500"}`}>หน้าแรก</Link>
             <Link to="/apply-tutor" className={`font-medium transition-colors text-xs ${isActive("/apply-tutor") ? "text-orange-500 border-b-2 border-orange-500 pb-1" : "text-gray-700 hover:text-orange-500"}`}>สมัครติวเตอร์</Link>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="ค้นหาชื่อคอร์สเรียน, ระดับชั้นเรียน"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* ปุ่มด้านขวา */}
        <div className="flex items-center gap-2">
          <button className="relative h-11 w-11 flex items-center justify-center rounded-lg hover:bg-orange-100 hover:text-orange-500 transition-colors">
            <Heart className="h-5 w-5" />
            <span className="absolute right-0 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">0</span>
          </button>

          <button className="relative h-11 w-11 flex items-center justify-center rounded-lg hover:bg-orange-100 hover:text-orange-500 transition-colors mr-4">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">0</span>
          </button>

          {/* ตรวจสอบว่า Login หรือยัง */}
          {userData ? (
            <div className="relative group flex items-center gap-2">
              {/* แสดง Nickname จาก DB (ไม่มีรูปแล้ว) */}
              <div
                className={`flex items-center gap-1 cursor-pointer font-bold text-sm transition-colors pb-1 ${
                  isActive("/profile") ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-700 hover:text-orange-500"
                }`}
              >
                <span>{userData.nickname || userData.username}</span>
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                <ul className="py-2 text-sm text-gray-700">
                  <li><Link to="/profile" className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition">ข้อมูลส่วนตัว</Link></li>
                  <li><Link to="/my-courses" className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition">คอร์สเรียนของฉัน</Link></li>
                  <li>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition border-t border-gray-50 mt-1"
                    >
                      ออกจากระบบ
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* ถ้ายังไม่ Login ให้แสดงปุ่มเข้าสู่ระบบ */
            <Link to="/login" className="h-10 items-center rounded-lg bg-orange-500 px-6 text-white text-sm font-bold hover:bg-orange-600 transition-colors flex">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}

