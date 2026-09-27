import { Outlet } from "react-router-dom"
import TutorNavbar from "../components/TutorNavbar"
import IncidentReportButton from "../components/IncidentReportButton.jsx"

export default function TutorLayout() {
  return (
    <div className="min-h-screen">
      <TutorNavbar />
      {/* ระยะห่างจาก navbar กำหนดที่นี่ที่เดียว (navbar สูง ~90px + ช่องไฟ 30px) — หน้าในไม่ต้องใส่ mt เอง */}
      <main className="pt-[120px]">
        <Outlet />
      </main>
      <IncidentReportButton role="tutor" />
    </div>
  )
}
