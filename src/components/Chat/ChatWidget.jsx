import React, { useState, useRef, useEffect } from "react"
import { useChat } from "./ChatProvider"
import ReactMarkdown from 'react-markdown';

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

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!isOpen && !isFullscreen) {
    return (
      <div className="fixed bottom-6 right-10 z-50">
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-3 w-48 bg-white text-gray-700 text-xs rounded-2xl rounded-br-sm shadow-lg px-3 py-2 animate-fadeIn">
            มีอะไรให้ช่วยไหมครับ 😊
          </div>
        )}
        <button
          onClick={() => {
            openChat()
            setShowTooltip(false)
            localStorage.setItem("sornserm_tooltip_seen", "1")
          }}
          className="h-16 w-16 rounded-full bg-transparent text-white shadow-2xl flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-6 animate-botFloat relative"
        >
          <img src="/chatbot.png" alt="Chatbot" className="h-14 w-14 select-none pointer-events-none" draggable="false" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
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

      <div className="fixed z-50 bg-white rounded-3xl shadow-2xl flex flex-col right-4 bottom-4 w-[calc(100vw-2rem)] max-w-[420px] h-[72vh] max-h-[640px] md:right-6 md:bottom-6 md:h-[470px] animate-chatPopIn origin-bottom-right relative">
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
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-4`}>
              <div className="flex flex-col gap-2 max-w-[85%]"> {/* เพิ่ม gap ระหว่างก้อนข้อความ */}
                {msg.sender === "bot" && (
                  <img src="/chatbot.png" alt="" className="h-6 w-6 rounded-full flex-shrink-0 mb-1" />
                )}
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
                            <ReactMarkdown components={{ p: ({ node, ...props }) => <span {...props} /> }}>
                              {line.replace(/^[•-]\s*/, '')}
                            </ReactMarkdown>
                          </span>
                        </span>
                      ) : (
                        <ReactMarkdown components={{ p: ({ node, ...props }) => <span {...props} /> }}>
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
            <div className="flex flex-wrap gap-2">
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
            <button onClick={handleSend} disabled={isLoading} className="w-10 h-10 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform duration-150">➤</button>
          </div>
        </div>
      </div>
    </>
  )
}