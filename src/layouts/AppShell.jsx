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

  // role ที่เป็นไปได้: null (guest) | 'student' | 'tutor' | 'admin'
  let currentRole = null
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null")
    currentRole = storedUser?.role || null
  } catch {
    currentRole = null
  }

  // ปุ่มแจ้งปัญหา: เฉพาะ student และ tutor
  const canReportIncident = currentRole === "student" || currentRole === "tutor"

  // แชตบอต: เฉพาะ guest (ยังไม่ล็อกอิน) และ student
  // เผื่ออนาคตอยากเปิดให้ tutor/admin ด้วย ปรับตรงนี้:
  //   const canUseChat = true                          // เปิดทั้ง 4 บทบาท
  //   const canUseChat = currentRole !== "admin"        // เปิดทุกคนยกเว้นแอดมิน
  const canUseChat = currentRole === null || currentRole === "student"

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

      {canUseChat && (
        <>
          <ChatWidget />
          <ChatFullscreen />
        </>
      )}

      {/* ปิดไว้ชั่วคราวสำหรับ tutor — ถ้าอยากเปิด ลบ comment แล้วปรับ canUseChat ด้านบนแทน */}
      {/* {currentRole === "tutor" && (
        <>
          <ChatWidget />
          <ChatFullscreen />
        </>
      )} */}

      {/* ปิดไว้ชั่วคราวสำหรับ admin — ถ้าอยากเปิด ลบ comment แล้วปรับ canUseChat ด้านบนแทน */}
      {/* {currentRole === "admin" && (
        <>
          <ChatWidget />
          <ChatFullscreen />
        </>
      )} */}

      {canReportIncident && <IncidentReportButton role={currentRole} />}
    </>
  )
}