// src/pages/Home.jsx
import React from "react"
import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="w-full">
      {/* ========== FOOTER TOP (ABOUT) ========== */}
      <div className="mt-16 bg-orange-500/95 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm sm:text-base lg:text-lg leading-relaxed">
              เราคือสถาบันติวเตอร์ที่มุ่งพัฒนาศักยภาพของนักเรียนทุกคน ด้วยหลักสูตรที่เข้าใจง่าย
              เนื้อหากระชับ และทีมติวเตอร์คุณภาพ เพื่อให้ทุกการเรียนรู้
              “ใกล้เป้าหมายมากขึ้นทุกวัน”
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link to="/courses" className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-full bg-white px-5 py-2 text-orange-600 shadow">
                ดูคอร์สเรียนทั้งหมด
              </Link>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_1.2fr] gap-6 sm:gap-8">
            {/* logo + social */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-orange-600 font-bold">
                    <img
                        src="/logo.png"
                        alt="ศรเสริมติวเตอร์"
                        className="h-auto w-full object-contain"
                    />
                </div>
                <div className="leading-tight">
                  <div className="font-bold -mb-1">ศรเสริม ติวเตอร์</div>
                  <div className="text-orange-100">SornSerm Tutor</div>
                </div>
              </div>
            </div>

            {/* menu */}
            <div>
              <div className="font-bold mb-3"><Link to="/" className="inline-flex min-h-11 items-center py-2 hover:underline">เมนู</Link></div>
              <ul className="space-y-1 text-orange-50">
                <li><Link to="/promotion" className="inline-flex min-h-11 items-center py-2 hover:underline">โปรโมชัน</Link></li>
                <li><Link to="/about" className="inline-flex min-h-11 items-center py-2 hover:underline">เกี่ยวกับสถาบัน</Link></li>
                <li><Link to="/news" className="inline-flex min-h-11 items-center py-2 hover:underline">ข่าวประชาสัมพันธ์</Link></li>
              </ul>
            </div>

            {/* contact */}
            <div>
              <div className="font-bold mb-3">ติดต่อเรา</div>
              <div className="space-y-1 min-w-0 break-words text-sm sm:text-base leading-relaxed text-orange-50">
                <div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("ศรเสริม ติวเตอร์ ซอยศรีจันทร์ 4 ขอนแก่น")}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center py-2 hover:underline">ซอยศรีจันทร์ 4 (ซอย ยืนครู่), Khon Kaen, Thailand, Khon Kaen</a></div>
                <div><a href="tel:0826646551" className="inline-flex min-h-11 items-center py-2 hover:underline">082 664 6551</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== COPYRIGHT ========== */}
      <div className="bg-orange-50 text-orange-700">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-5 text-center text-xs sm:text-sm">
          © 2025 ศรเสริมติวเตอร์. สงวนลิขสิทธิ์ทุกประการ
        </div>
      </div>
    </footer>
  )
}
