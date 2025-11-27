// src/pages/Home.jsx
import React from "react"

export default function Footer() {
  return (
    <div className="pb-24">
      {/* ========== FOOTER TOP (ABOUT) ========== */}
      <div className="mt-16 bg-orange-500/95 text-white">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-lg leading-relaxed">
              เราคือสถาบันติวเตอร์ที่มุ่งพัฒนาศักยภาพของนักเรียนทุกคน ด้วยหลักสูตรที่เข้าใจง่าย
              เนื้อหากระชับ และทีมติวเตอร์คุณภาพ เพื่อให้ทุกการเรียนรู้
              “ใกล้เป้าหมายมากขึ้นทุกวัน”
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button className="rounded-full bg-white px-5 py-2 text-orange-600 shadow">
                ดูคอร์สเรียนทั้งหมด
              </button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* logo + social */}
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-orange-600 font-bold">
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
              <div className="font-bold mb-3">เมนู</div>
              <ul className="space-y-2 text-orange-50">
                <li><a href="#" className="hover:underline">โปรโมชั่น</a></li>
                <li><a href="#" className="hover:underline">ผลลัพธ์ยอดครูเสริม</a></li>
                <li><a href="#" className="hover:underline">ข่าวประชาสัมพันธ์</a></li>
              </ul>
            </div>

            {/* contact */}
            <div>
              <div className="font-bold mb-3">ติดต่อเรา</div>
              <div className="space-y-2 text-orange-50">
                <div>ซอยศรีจันทร์ 4 (ซอย ยืนครู่), Khon Kaen, Thailand, Khon Kaen</div>
                <div>082 664 6551</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== COPYRIGHT ========== */}
      <div className="bg-orange-50 text-orange-700">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-5 text-center text-sm">
          © 2025 ศรเสริมติวเตอร์. สงวนลิขสิทธิ์ทุกประการ
        </div>
      </div>
    </div>
  )
}
