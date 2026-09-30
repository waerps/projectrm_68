import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BookOpen, Facebook, MapPin, Phone } from "lucide-react";

const menuLinks = [
  { label: "หน้าแรก", to: "/" },
  { label: "คอร์สเรียนทั้งหมด", to: "/courses" },
  { label: "คอร์สเดี่ยว", to: "/private-courses" },
  { label: "โปรโมชัน", to: "/promotion" },
  { label: "ข่าวประชาสัมพันธ์", to: "/news" },
  { label: "เกี่ยวกับสถาบัน", to: "/about" },
];

const mapsUrl = "https://maps.app.goo.gl/yTtEz3r45TA1pA7aA";
const facebookUrl = "https://web.facebook.com/SornSerm.tutor";

export default function Footer() {
  return (
    <footer className="mt-16 bg-[#FF7411] text-white" aria-label="ข้อมูลและช่องทางติดต่อศรเสริมติวเตอร์">
      <div className="mx-auto max-w-[1200px] px-4 pb-6 pt-8 sm:px-6 sm:pt-12">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#14213D] px-6 py-7 sm:px-9 sm:py-9 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="pointer-events-none absolute -right-12 -top-28 h-64 w-64 rounded-full border-[34px] border-white/10" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-orange-200">เรียนรู้ไปด้วยกันกับศรเสริม</p>
            <h2 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">เริ่มจากคอร์สที่ใช่ ไปให้ถึงเป้าหมายที่ฝัน</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">คอร์สเรียนที่เข้าใจง่าย พร้อมทีมติวเตอร์ที่ใส่ใจทุกก้าวของนักเรียน</p>
          </div>
          <Link to="/courses" className="relative mt-5 inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-[#14213D] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:w-auto lg:mt-0">
            <BookOpen className="h-5 w-5" aria-hidden="true" /> ดูคอร์สเรียน <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-10 py-11 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1.2fr] lg:gap-14 lg:py-14">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400" aria-label="ศรเสริมติวเตอร์ กลับหน้าแรก">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 ring-1 ring-orange-100"><img src="/logo.png" alt="" className="h-full w-full object-contain" /></span>
              <span className="text-left leading-tight"><strong className="block text-lg">ศรเสริม ติวเตอร์</strong><span className="text-sm text-orange-100">SornSerm Tutor</span></span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-orange-50">พื้นที่เรียนรู้ที่ช่วยให้นักเรียนเข้าใจบทเรียน มั่นใจในการสอบ และเติบโตในแบบของตัวเอง</p>
          </div>

          <nav aria-label="เมนูท้ายเว็บไซต์">
            <h2 className="text-base font-semibold text-white">สำรวจเว็บไซต์</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-1">
              {menuLinks.map(({ label, to }) => (
                <li key={to}><Link to={to} className="inline-flex min-h-9 items-center gap-1.5 py-1 text-sm text-orange-50 transition hover:translate-x-1 hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><ArrowUpRight className="h-3.5 w-3.5 text-white" aria-hidden="true" />{label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-base font-semibold text-white">ติดต่อเรา</h2>
            <div className="mt-4 space-y-3">
              <a href="tel:0826646551" className="group flex min-h-12 items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 transition hover:border-white/60 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><Phone className="h-5 w-5 shrink-0 text-white" aria-hidden="true" /><span className="text-sm">โทร 082 664 6551</span><ArrowUpRight className="ml-auto h-4 w-4 text-orange-100 transition group-hover:text-white" aria-hidden="true" /></a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="group flex min-h-12 items-start gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 transition hover:border-white/60 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden="true" /><span className="text-sm leading-relaxed">ซอยศรีจันทร์ 4 ขอนแก่น<br /><span className="text-xs text-orange-100">เปิดแผนที่ Google Maps</span></span><ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-orange-100 transition group-hover:text-white" aria-hidden="true" /></a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="group flex min-h-12 items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 transition hover:border-white/60 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><Facebook className="h-5 w-5 shrink-0 text-white" aria-hidden="true" /><span className="text-sm">เพจ SornSerm Tutor</span><ArrowUpRight className="ml-auto h-4 w-4 text-orange-100 transition group-hover:text-white" aria-hidden="true" /></a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/25 pt-5 text-xs text-orange-100 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} ศรเสริมติวเตอร์ สงวนลิขสิทธิ์</span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="w-fit rounded-lg py-1 text-left text-orange-50 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400">กลับขึ้นด้านบน ↑</button>
        </div>
      </div>
    </footer>
  );
}
