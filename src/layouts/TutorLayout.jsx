import { Outlet } from "react-router-dom"
import TutorNavbar from "../components/TutorNavbar"

export default function TutorLayout() {
  return (
    <div className="min-h-screen">
      <TutorNavbar />
      <main className="pt-[30px]">
        <Outlet />
      </main>
    </div>
  )
}
