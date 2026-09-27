import { Link } from "react-router-dom";
import { ArrowRight, Phone, UserRoundCheck } from "lucide-react";
import PrivateCourseOrbit from "./PrivateCourseOrbit";
import { PRIVATE_CONTACT as C, PRIVATE_STARTING_PRICE } from "../config/privateCourses";

/* แถบแนะนำคอร์สเดี่ยวในหน้าแรก — แยกจากรายการคอร์สรวม เพราะคอร์สเดี่ยวไม่มีปุ่มซื้อ */
export default function PrivateCourseTeaser() {
  return (
    <section className="mt-14 overflow-hidden rounded-[28px] border shadow-sm"
      style={{ borderColor: "rgba(20,33,61,.06)", background: "linear-gradient(160deg,#ffffff 0%,#FFF3E8 100%)" }}>
      <div className="relative grid items-center gap-4 px-5 py-7 sm:px-8 md:grid-cols-[1.2fr_1fr] md:px-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl animate-pulse" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
            <UserRoundCheck className="h-3.5 w-3.5" /> คอร์สเดี่ยว · เรียนตัวต่อตัว
          </span>
          <h2 className="mt-3 text-[22px] font-extrabold leading-tight md:text-[28px]" style={{ color: "#14213D" }}>
            อยากให้น้องเรียน<span className="text-orange-500">ตัวต่อตัว</span>กับครูที่ใช่?
          </h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-gray-600">
            {C.name}จะประเมินพื้นฐานน้องก่อน แล้วจับคู่ครูที่เหมาะ · เริ่มต้น{" "}
            <b className="whitespace-nowrap text-orange-500">{PRIVATE_STARTING_PRICE} บาท/ชม.</b>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/private-courses"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(249,115,22,0.55)] transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#FB923C 0%,#F97316 55%,#EA580C 100%)" }}>
              ดูรายละเอียดคอร์สเดี่ยว <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={C.tel}
              className="inline-flex items-center gap-2 rounded-2xl border bg-white px-5 py-3 text-[14px] font-bold transition-all duration-300 hover:-translate-y-0.5"
              style={{ borderColor: "rgba(20,33,61,.15)", color: "#14213D" }}>
              <Phone className="h-4 w-4 text-orange-500" /> {C.phone}
            </a>
          </div>
        </div>
        <div className="relative hidden sm:block">
          <PrivateCourseOrbit compact />
        </div>
      </div>
    </section>
  );
}
