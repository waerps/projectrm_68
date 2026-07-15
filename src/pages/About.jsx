import React from "react"
import { Heart, MapPin, Phone, Facebook, Sparkles, Users, Award, BookOpen, MessageCircle } from "lucide-react"

// TODO: ใส่ LINE ID จริงตรงนี้ เช่น "@sornserm" แล้วเอา comment เปิดออกด้านล่าง
const LINE_ID = "" // ← ใส่ LINE ID ตรงนี้ เช่น "@sornserm"

export default function About() {
  return (
    <div className="mt-[110px] pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 px-6 py-16 text-white text-center">
        <Sparkles className="absolute left-10 top-8 h-16 w-16 text-white/15" />
        <Sparkles className="absolute right-16 bottom-6 h-24 w-24 text-white/10" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
          <Heart className="h-3.5 w-3.5 fill-white" /> เกี่ยวกับเรา
        </span>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold">ศรเสริม ติวเตอร์</h1>
        <p className="mt-1 text-sm md:text-base text-orange-50">SornSerm Tutor</p>
        <p className="mt-4 max-w-xl mx-auto text-orange-50 text-sm md:text-base italic">
          "ติวจริง ติดจริง มีผลงาน ใส่ใจทุกพัฒนาการของนักเรียน"
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-8 pt-20">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 text-center">
            <Users className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xl font-black text-gray-900">1,918+</p>
            <p className="text-xs text-gray-500 mt-1">ผู้ติดตามบน Facebook</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 text-center">
            <MapPin className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xl font-black text-gray-900">ขอนแก่น</p>
            <p className="text-xs text-gray-500 mt-1">ที่ตั้งสถาบัน</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 text-center col-span-2 md:col-span-1">
            <Award className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xl font-black text-gray-900">ติวจริง ติดจริง</p>
            <p className="text-xs text-gray-500 mt-1">มีผลงานที่พิสูจน์ได้</p>
          </div>
        </div>

        {/* เกี่ยวกับสถาบัน */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">เราคือใคร</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            ศรเสริม ติวเตอร์ (SornSerm Tutor) สถาบันกวดวิชาในจังหวัดขอนแก่น
            มุ่งเน้นการติวที่ให้ผลลัพธ์จริง พร้อมใส่ใจพัฒนาการของนักเรียนเป็นรายบุคคล
          </p>
        </div>

        {/* ที่ตั้งและติดต่อ */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5">ที่ตั้งและติดต่อ</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">ที่อยู่</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  <a
                    href="https://maps.app.goo.gl/yTtEz3r45TA1pA7aA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-600 hover:text-orange-700 mt-0.5 inline-block"
                  >
                    ซอยศรีจันทร์ 4 (ซอย ยิ้มศิริ) ขอนแก่น ประเทศไทย
                  </a>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">เบอร์โทรศัพท์</p>
                <a href="tel:0826646551" className="text-sm text-orange-600 hover:text-orange-700 mt-0.5 inline-block">
                  082 664 6551
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ติดตามเรา / Social */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5">ติดตามเรา</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            < a
              href="https://web.facebook.com/SornSerm.tutor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 hover:bg-blue-100 transition group flex-1"
            >
              <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Facebook className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 truncate">
                  ศรเสริม ติวเตอร์ - SornSerm Tutor
                </p>
                <p className="text-xs text-gray-500 truncate">web.facebook.com/SornSerm.tutor</p>
              </div>
            </a>

            {/* LINE — เว้นไว้ให้ใส่ LINE ID ทีหลัง */}
            {LINE_ID ? (
              <a
                href={`https://line.me/ti/p/${LINE_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-5 py-4 hover:bg-green-100 transition group flex-1"
              >
                <div className="h-11 w-11 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">LINE Official Account</p>
                  <p className="text-xs text-gray-500 truncate">{LINE_ID}</p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4 flex-1 opacity-60">
                <div className="h-11 w-11 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">LINE Official Account</p>
                  <p className="text-xs text-gray-400">เร็ว ๆ นี้</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}