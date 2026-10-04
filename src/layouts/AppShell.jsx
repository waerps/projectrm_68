import React, { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar.jsx"
import Footer from "../components/footer.jsx"
import ChatWidget from "../components/Chat/ChatWidget"
import ChatFullscreen from "../components/Chat/ChatFullscreen"
import IncidentReportButton from "../components/IncidentReportButton.jsx"
import {
  readExamActive, markExamActive, clearExamActive,
  fetchActiveExam, EXAM_ACTIVE_CHANGED_EVENT,
} from "../utils/studentExamShared"

export default function AppShell() {
  const location = useLocation()
  // role ที่เป็นไปได้: null (guest) | 'student' | 'tutor' | 'admin'
  let currentRole = null
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null")
    const roleId = Number(storedUser?.roleId ?? localStorage.getItem("user_role"))
    currentRole = storedUser?.role || (roleId === 1 ? "admin" : roleId === 2 ? "tutor" : roleId === 3 ? "student" : null)
  } catch {
    currentRole = null
  }

  // ปุ่มแจ้งปัญหา: เฉพาะ student และ tutor
  const canReportIncident = currentRole === "student" || currentRole === "tutor"

  // หน้าทำข้อสอบ (/exam/:token) — ซ่อนแชตบอตทั้งหมด ไม่ให้มีผู้ช่วยลอยอยู่ขณะสอบ
  const isExamPage = location.pathname.startsWith("/exam/")
  const isTourPage = location.pathname === "/virtual-tour"

  // ยังมีการสอบค้างอยู่ไหม (เข้าสอบแล้วแต่ยังไม่กดส่ง และยังไม่หมดเวลา)
  // ถ้ามี = ซ่อนแชตบอต "ทุกหน้า" ไม่ใช่แค่หน้าสอบ เพราะนักเรียนออกจากหน้าสอบไปหน้าแรก
  // แล้วกลับเข้ามาทำต่อได้ถ้ายังไม่หมดเวลา จึงต้องไม่มีช่องให้ไปถามบอตระหว่างนั้น
  const [examInProgress, setExamInProgress] = useState(() => !!readExamActive())

  useEffect(() => {
    const sync = () => setExamInProgress(!!readExamActive())
    sync()
    // เปลี่ยนธงในแท็บนี้ (เริ่มสอบ/กดส่ง) และเปลี่ยนจากแท็บอื่นของเบราว์เซอร์เดียวกัน
    window.addEventListener(EXAM_ACTIVE_CHANGED_EVENT, sync)
    window.addEventListener("storage", sync)
    // เผื่อผู้ใช้ค้างอยู่หน้าอื่นจนข้อสอบหมดเวลาไปเอง — ธงจะหมดอายุและแชตบอตกลับมา
    const iv = setInterval(sync, 30000)
    return () => {
      window.removeEventListener(EXAM_ACTIVE_CHANGED_EVENT, sync)
      window.removeEventListener("storage", sync)
      clearInterval(iv)
    }
  }, [])

  // ยืนยันกับ backend ตอนโหลดหน้าใหม่ — กันเคสเปลี่ยนเบราว์เซอร์/ล้าง localStorage
  // แล้วธงฝั่ง client หายไป ทั้งที่จริงๆ ยังมีข้อสอบค้างอยู่
  useEffect(() => {
    if (currentRole !== "student") return
    let cancelled = false
    fetchActiveExam()
      .then((data) => {
        if (cancelled) return
        if (data?.active) markExamActive({ examJoinId: data.examJoinId, deadlineAt: data.deadlineAt })
        else clearExamActive()
      })
      .catch(() => { /* เช็คไม่ได้ก็ใช้ธงฝั่ง client ไปก่อน ไม่ต้องรบกวนผู้ใช้ */ })
    return () => { cancelled = true }
  }, [currentRole])

  // แชตบอต: เฉพาะ guest (ยังไม่ล็อกอิน) และ student — และต้องไม่ใช่หน้าทำข้อสอบ
  // และต้องไม่มีข้อสอบค้างอยู่ (ยังไม่กดส่ง)
  // เผื่ออนาคตอยากเปิดให้ tutor/admin ด้วย ปรับตรงนี้:
  //   const canUseChat = !isExamPage && !examInProgress                            // เปิดทั้ง 4 บทบาท
  //   const canUseChat = currentRole !== "admin" && !isExamPage && !examInProgress  // เปิดทุกคนยกเว้นแอดมิน
  // ล็อกการเลื่อนหน้าหลังเมื่อมี popup (พื้นหลังดำ) เปิดอยู่ — ครอบคลุม popup ที่ยังไม่ได้ใช้ ModalShell ด้วย
  useEffect(() => {
    const SELECTOR = '.fixed.inset-0[class*="bg-black/"], [aria-modal="true"]'
    const sync = () => {
      const open = !!document.querySelector(SELECTOR)
      if (document.body.style.overflow !== (open ? "hidden" : "")) document.body.style.overflow = open ? "hidden" : ""
    }
    let raf = 0
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; sync() }) }
    const mo = new MutationObserver(schedule)
    mo.observe(document.body, { childList: true, subtree: true })
    sync()
    return () => { mo.disconnect(); cancelAnimationFrame(raf); document.body.style.overflow = "" }
  }, [])

  const canUseChat =
    (currentRole === null || currentRole === "student") && !isExamPage && !examInProgress

  return (
    <>
      {/* flex แนวตั้งเต็มความสูงจอ → footer ติดล่างเสมอแม้หน้ามีเนื้อหาน้อย */}
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 w-full">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
        {!isTourPage && <Footer role={currentRole} />}
      </div>

      {canUseChat && !isTourPage && (
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

      {canReportIncident && !isTourPage && <IncidentReportButton role={currentRole} />}
    </>
  )
}
