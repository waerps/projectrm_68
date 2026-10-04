import React, { useState, useRef, useEffect } from "react"
import { useChat } from "./ChatProvider"
import ReactMarkdown from 'react-markdown';
import "./ChatWidget.css";

export default function ChatWidget() {
  const {
    isOpen,
    isFullscreen,
    setIsOpen,
    setIsFullscreen,
    messages,
    inputValue,
    setInputValue,
    handleSend,
    messagesEndRef,
    isLoading,
    unreadCount,
    openChat,
  } = useChat()

  const scrollContainerRef = useRef(null)
  const launcherRef = useRef(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [showTooltip, setShowTooltip] = useState(() => !localStorage.getItem("sornserm_tooltip_seen"))

  const placeholders = ["พิมพ์ข้อความ...", "ถามเรื่องคอร์สเรียน...", "ถามค่าเรียน...", "ถามตารางเรียน..."]
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distanceFromBottom > 100)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleLauncherMove = (event) => {
    if (event.pointerType !== "mouse") return
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - left) / width - 0.5) * 2
    const y = ((event.clientY - top) / height - 0.5) * 2
    event.currentTarget.style.setProperty("--chat-tilt-x", `${-y * 13}deg`)
    event.currentTarget.style.setProperty("--chat-tilt-y", `${x * 13}deg`)
    event.currentTarget.style.setProperty("--chat-light-x", `${50 + x * 18}%`)
    event.currentTarget.style.setProperty("--chat-light-y", `${28 + y * 14}%`)
  }

  const resetLauncher = () => {
    if (!launcherRef.current) return
    launcherRef.current.style.removeProperty("--chat-tilt-x")
    launcherRef.current.style.removeProperty("--chat-tilt-y")
    launcherRef.current.style.removeProperty("--chat-light-x")
    launcherRef.current.style.removeProperty("--chat-light-y")
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!isOpen && !isFullscreen) {
    return (
      <div className="chat-launcher-wrap">
        {showTooltip && (
          <div className="chat-launcher-tooltip" aria-hidden="true">
            <span className="chat-launcher-tooltip__dot" />
            มีอะไรให้น้องศรเสริมช่วยไหมครับ 😊
          </div>
        )}
        <button
          ref={launcherRef}
          type="button"
          aria-label={unreadCount > 0 ? `เปิดแชตกับศรเสริม มีข้อความใหม่ ${unreadCount} ข้อความ` : "เปิดแชตกับศรเสริม"}
          onPointerMove={handleLauncherMove}
          onPointerLeave={resetLauncher}
          onClick={() => {
            resetLauncher()
            openChat()
            setShowTooltip(false)
            localStorage.setItem("sornserm_tooltip_seen", "1")
          }}
          className="chat-launcher"
        >
          <span className="chat-launcher__orbit" aria-hidden="true" />
          <span className="chat-launcher__orb" aria-hidden="true">
            <span className="chat-launcher__shine" />
            <svg className="chat-launcher__face" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <path d="M32 8v6M26 8h12" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M20 20h24c7.2 0 12 5 12 12v8c0 7.2-4.8 12-12 12H34l-8 6v-6h-6C12.8 52 8 47.2 8 40v-8c0-7 4.8-12 12-12Z" fill="white" />
              <circle cx="24" cy="35" r="2.4" fill="#F25A18" />
              <circle cx="40" cy="35" r="2.4" fill="#F25A18" />
              <path d="M27 43c2.8 3 7.2 3 10 0" stroke="#F25A18" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="chat-launcher__spark chat-launcher__spark--one" aria-hidden="true" />
          <span className="chat-launcher__spark chat-launcher__spark--two" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="chat-launcher__unread">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  if (isFullscreen) return null

  return (
    <>
      <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

      <div className="fixed z-50 bg-white rounded-3xl shadow-2xl flex flex-col right-4 bottom-4 w-[calc(100vw-2rem)] max-w-[420px] h-[72vh] max-h-[640px] md:right-6 md:bottom-6 md:h-[470px] animate-chatPopIn origin-bottom-right">
        {/* Header - โค้ดส่วนเดิม */}
        <div className="px-5 py-4 border-b border-gray-100 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/chatbot.png" alt="Chatbot" className="h-9 w-9" />
            <div className="font-semibold">ศรเสริมแชตบอต</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setIsFullscreen(true); setIsOpen(false); }} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">⤢</button>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollContainerRef} onScroll={handleScroll}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start items-end gap-2"} mb-4`}>
              {msg.sender === "bot" && (
                <img src="/chatbot.png" alt="" className="h-6 w-6 rounded-full flex-shrink-0" />
              )}
              <div className="flex flex-col gap-2 max-w-[85%]"> {/* เพิ่ม gap ระหว่างก้อนข้อความ */}
                {msg.sender === "user" ? (
                  // ของ User ให้แสดงปกติ
                  <div className="px-4 py-2.5 rounded-2xl text-sm bg-orange-500 text-white rounded-br-sm shadow-sm">
                    <ReactMarkdown>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  // ของ Bot: สแกนข้อความและแบ่งส่วน
                  msg.text.split('\n').filter(line => line.trim() !== '').map((line, index) => (
                    <div
                      key={index}
                      className="px-4 py-2.5 rounded-2xl text-sm bg-gray-100 text-gray-800 rounded-bl-sm shadow-sm animate-fadeIn"
                      style={{ animationDelay: `${index * 0.15}s`, animationFillMode: "both" }} // ให้แต่ละก้อนค่อยๆ เด้งออกมา
                    >
                      {line.startsWith('•') || line.startsWith('-') ? (
                        <span className="flex gap-2">
                          <span className="text-orange-500">•</span>
                          <span>
                            <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                              {line.replace(/^[•-]\s*/, '')}
                            </ReactMarkdown>
                          </span>
                        </span>
                      ) : (
                        <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                          {line}
                        </ReactMarkdown>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 ml-8">
              {["ดูคอร์สเรียน", "ค่าเรียน", "ติดต่อสถาบัน"].map((label) => (
                <button key={label} onClick={() => handleSend(label)}
                  className="px-3 py-1.5 text-xs rounded-full border border-orange-300 text-orange-600 hover:bg-orange-50">
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* 🔴 Typing Indicator สำหรับ Widget */}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-4 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
          >
            ↓
          </button>
        )}

        {/* Input - โค้ดส่วนเดิม */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={placeholders[placeholderIndex]}
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
            />
            <button onClick={() => handleSend()} disabled={isLoading} className="w-10 h-10 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform duration-150">➤</button>
          </div>
        </div>
      </div>
    </>
  )
}
