import { Outlet } from "react-router-dom"
import TutorNavbar from "../components/TutorNavbar"

export default function TutorLayout() {
  return (
    <div>
      <TutorNavbar />
      {/* ระยะห่างจาก navbar กำหนดที่นี่ที่เดียว (navbar สูง ~90px + ช่องไฟ 30px) — หน้าในไม่ต้องใส่ mt เอง */}
      <main className="pt-[120px] pb-24 lg:pb-12">
        <Outlet />
      </main>
      {/* ปุ่ม "แจ้งปัญหา" แสดงจาก AppShell แล้ว (student/tutor) — ไม่ใส่ซ้ำที่นี่ */}
    </div>
  )
}
