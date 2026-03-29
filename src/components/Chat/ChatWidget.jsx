import React from "react"
import { useChat } from "./ChatProvider"

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
    isLoading, // 🔴 ดึงค่านี้มาใช้
  } = useChat()

  if (!isOpen && !isFullscreen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-10 z-50 h-16 w-16 rounded-full text-white shadow-2xl flex items-center justify-center transition-transform duration-300 hover:scale-110 animate-botFloat">
        <img src="/chatbot.png" alt="Chatbot" className="h-14 w-14 select-none pointer-events-none" draggable="false" />
      </button>
    )
  }

  if (isFullscreen) return null

  return (
    <>
      <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
      
      <div className="fixed z-50 bg-white rounded-3xl shadow-2xl flex flex-col right-4 bottom-4 w-[calc(100vw-2rem)] max-w-[420px] h-[72vh] max-h-[640px] md:right-6 md:bottom-6 md:h-[470px]">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.sender === "user" ? "bg-orange-500 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* 🔴 Typing Indicator สำหรับ Widget */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                <div className="typing-indicator small">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - โค้ดส่วนเดิม */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
            />
            <button onClick={handleSend} disabled={isLoading} className="w-10 h-10 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center flex-shrink-0">➤</button>
          </div>
        </div>
      </div>
    </>
  )
}