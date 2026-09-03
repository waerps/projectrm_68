import React from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar.jsx"
import Footer from "../components/footer.jsx"
import ChatWidget from "../components/Chat/ChatWidget"
import ChatFullscreen from "../components/Chat/ChatFullscreen"
import IncidentReportButton from "../components/IncidentReportButton.jsx"

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()

  const current = location.pathname === "/" ? "home" : location.pathname.slice(1)

  const handleMenu = (id) => {
    if (id === "home") navigate("/")
    else navigate("/" + id)
  }

  // อ่าน role ของ user ที่ล็อกอินอยู่จริง (เก็บไว้ตอน login ทั้ง student และ admin/tutor)
  let currentRole = null
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null")
    currentRole = storedUser?.role || null // 'student' | 'tutor' | 'admin'
  } catch {
    currentRole = null
  }

  const canReportIncident = currentRole === "student" || currentRole === "tutor"

  return (
    <>
      <div className="min-h-screen ">
        <Navbar />
        <main className=" ">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
      <ChatWidget />
      <ChatFullscreen />
      {canReportIncident && <IncidentReportButton role={currentRole} />}
    </>
  )
}