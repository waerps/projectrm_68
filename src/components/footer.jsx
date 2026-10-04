import { Link } from "react-router-dom";
import { ArrowUpRight, Facebook, MapPin, Phone } from "lucide-react";

const navigationByRole = {
  guest: [
    { label: "หน้าแรก", to: "/" },
    { label: "คอร์สเรียน", to: "/courses" },
    { label: "ข่าวประชาสัมพันธ์", to: "/news" },
    { label: "เกี่ยวกับสถาบัน", to: "/about" },
  ],
  student: [
    { label: "หน้าแรก", to: "/" },
    { label: "คอร์สเรียน", to: "/courses" },
    { label: "คอร์สของฉัน", to: "/profile/my-courses" },
    { label: "ข่าวประชาสัมพันธ์", to: "/news" },
  ],
  tutor: [
    { label: "หน้าหลักติวเตอร์", to: "/tutor" },
    { label: "ตารางสอน", to: "/tutor/schedule" },
    { label: "คอร์สที่สอน", to: "/tutor/courses" },
    { label: "นักเรียน", to: "/tutor/students" },
  ],
  admin: [
    { label: "แดชบอร์ด", to: "/admin" },
    { label: "ตารางสอน", to: "/admin/schedule" },
    { label: "จัดการคอร์ส", to: "/admin/courses" },
    { label: "ข่าวและประกาศ", to: "/admin/announcements" },
  ],
};

const mapsUrl = "https://maps.app.goo.gl/yTtEz3r45TA1pA7aA";
const facebookUrl = "https://web.facebook.com/SornSerm.tutor";

export default function Footer({ role }) {
  const currentRole = navigationByRole[role] ? role : "guest";
  const menuLinks = navigationByRole[currentRole];
  const homePath = menuLinks[0].to;

  return (
    <footer className="mt-12 bg-[#FF7411] text-white" aria-label="ข้อมูลและช่องทางติดต่อศรเสริมติวเตอร์">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-10">
          <div>
            <Link to={homePath} className="inline-flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400" aria-label="ศรเสริมติวเตอร์ กลับหน้าหลัก">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-orange-100"><img src="/logo.png" alt="" className="h-full w-full object-contain" /></span>
              <span className="text-left leading-tight"><strong className="block text-base">ศรเสริม ติวเตอร์</strong><span className="text-xs text-orange-100">SornSerm Tutor</span></span>
            </Link>
            <p className="mt-4 hidden max-w-xs text-sm leading-6 text-orange-50 sm:block">พื้นที่เรียนรู้ที่ช่วยให้นักเรียนเข้าใจบทเรียนและเติบโตในแบบของตัวเอง</p>
          </div>

          <nav aria-label="เมนูท้ายเว็บไซต์">
            <h2 className="text-sm font-bold text-white">สำรวจเว็บไซต์</h2>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-1">
              {menuLinks.map(({ label, to }) => (
                <li key={to}><Link to={to} className="inline-flex min-h-8 items-center py-1 text-sm text-orange-50 transition hover:text-white hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400">{label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold text-white">ติดต่อเรา</h2>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a href="tel:0826646551" className="inline-flex items-center gap-2 text-orange-50 hover:text-white hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" />082 664 6551</a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-50 hover:text-white hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />ซอยศรีจันทร์ 4 ขอนแก่น<ArrowUpRight className="h-3 w-3" aria-hidden="true" /></a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-50 hover:text-white hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><Facebook className="h-4 w-4 shrink-0" aria-hidden="true" />เพจ SornSerm Tutor<ArrowUpRight className="h-3 w-3" aria-hidden="true" /></a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/25 pt-4 text-xs text-orange-100">
          <span>© {new Date().getFullYear()} ศรเสริมติวเตอร์</span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="shrink-0 rounded-lg text-orange-50 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400">กลับขึ้นบน ↑</button>
        </div>
      </div>
    </footer>
  );
}
