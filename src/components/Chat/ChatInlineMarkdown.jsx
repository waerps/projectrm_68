import React from "react"
import ReactMarkdown from "react-markdown"
import { useNavigate } from "react-router-dom"
import { useChat } from "./ChatProvider"
import { toInternalPath } from "./chatText"

// แยก react-markdown ออกมาเป็นไฟล์ที่โหลดทีหลัง (lazy) — ไม่ต้องโหลดไลบรารีนี้ตอนเปิดเว็บ
// จะโหลดเมื่อมีข้อความบอตให้แสดงเท่านั้น (ช่วยคะแนน Lighthouse Performance)

const isSafeHref = (href) => /^(https?:|mailto:|tel:|\/(?!\/))/i.test(String(href || "").trim())

function InternalLinkButton({ to, children }) {
  const navigate = useNavigate()
  const chat = useChat()
  const go = () => {
    // ปิดหน้าต่างแชตก่อน (ถ้าอยู่หน้าเดิมแค่เปลี่ยน query แชตจะไม่ปิดเอง แล้วบังฟอร์ม) — ประวัติแชตยังอยู่
    chat?.setIsOpen(false)
    chat?.setIsFullscreen(false)
    navigate(to)
  }
  return (
    <button
      type="button"
      onClick={go}
      className="mx-0.5 my-0.5 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white no-underline shadow-sm transition hover:bg-orange-600 active:scale-95"
    >
      {children} <span aria-hidden="true">→</span>
    </button>
  )
}

const MD_COMPONENTS = {
  p: ({ children }) => <span>{children}</span>,
  a: ({ href, title, children }) => {
    const internal = toInternalPath(href)
    if (internal) return <InternalLinkButton to={internal}>{children}</InternalLinkButton>
    return isSafeHref(href) ? (
      <a href={href} title={title} target="_blank" rel="noopener noreferrer" className="font-semibold text-orange-600 underline underline-offset-2 break-all">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    )
  },
}


export default function InlineMarkdown({ text }) {
  return <ReactMarkdown components={MD_COMPONENTS}>{text}</ReactMarkdown>
}
