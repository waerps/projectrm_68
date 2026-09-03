import { Outlet } from "react-router-dom"
import TutorNavbar from "../components/TutorNavbar"
import IncidentReportButton from "../components/IncidentReportButton.jsx"

export default function TutorLayout() {
  return (
    <div className="min-h-screen">
      <TutorNavbar />
      <main className="pt-[30px]">
        <Outlet />
      </main>
      <IncidentReportButton role="tutor" />
    </div>
  )
}
