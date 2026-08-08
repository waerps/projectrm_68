import React, { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown';
import { useChat } from "./ChatProvider"
import { Pencil, Trash2 } from "lucide-react"

export default function ChatFullscreen() {
  const {
    isFullscreen,
    setIsFullscreen,
    setIsOpen,
    messages,
    inputValue,
    setInputValue,
    handleSend,
    chatHistory,
    currentChatId,
    handleNewChat,
    loadChat,
    formatDate,
    messagesEndRef,
    isLoading, // 🔴 ดึงค่านี้มาใช้
    deleteChat,
    renameChat,
  } = useChat()

  const scrollContainerRef = useRef(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

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

  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!isFullscreen) return null

  return (
    <div className="fixed inset-0 bg-gray-50 z-40 pt-25">
      <div className="h-full max-w-[1200px] mx-auto px-4 pb-4">
        <div className="flex gap-4 h-full">
          {/* Sidebar - โค้ดส่วนเดิม */}
          <div className="w-80 bg-white rounded-3xl shadow-lg p-4 flex flex-col">
            <button
              onClick={handleNewChat}
              className="w-full bg-orange-500 text-white rounded-2xl py-3 font-semibold hover:bg-orange-600 transition-colors mb-4 flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span> แชตใหม่
            </button>
            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="text-xs font-semibold text-gray-400 px-3 py-2">ประวัติการสนทนา</div>
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative rounded-xl transition-colors ${currentChatId === chat.id ? "bg-orange-50 border border-orange-200" : "hover:bg-gray-50"
                    }`}
                >
                  {editingId === chat.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => { renameChat(chat.id, editValue.trim() || chat.title); setEditingId(null) }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { renameChat(chat.id, editValue.trim() || chat.title); setEditingId(null) }
                        if (e.key === "Escape") setEditingId(null)
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-orange-300 text-sm font-medium outline-none"
                    />
                  ) : (
                    <button onClick={() => loadChat(chat.id)} className="w-full text-left px-4 py-3 pr-16">
                      <div className="font-medium text-sm truncate">{chat.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatDate(chat.date)}</div>
                    </button>
                  )}

                  {editingId !== chat.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(chat.id); setEditValue(chat.title) }}
                        className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                        title="แก้ไขชื่อ"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteChat(chat.id) }}
                        className="w-7 h-7 rounded-full hover:bg-red-100 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white rounded-3xl shadow-lg flex flex-col relative">
            {/* Header - โค้ดส่วนเดิม */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/chatbot.png" alt="Chatbot" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold">ศรเสริมแชตบอต</div>
                  <div className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> ออนไลน์
                  </div>
                </div>
              </div>
              <button onClick={() => { setIsFullscreen(false); setIsOpen(true); }} className="w-10 h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative" ref={scrollContainerRef} onScroll={handleScroll}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col gap-2 max-w-[70%]">
                    {msg.sender === "user" ? (
                      <div className="px-4 py-3 rounded-2xl bg-orange-500 text-white rounded-br-sm">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.text.split('\n').filter(line => line.trim() !== '').map((line, index) => (
                        <div key={index} className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-sm">
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

              {/* 🔴 Typing Indicator สำหรับหน้า Fullscreen */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
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
                className="absolute bottom-24 right-8 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
              >
                ↓
              </button>
            )}

            {/* Input - โค้ดส่วนเดิม */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={placeholders[placeholderIndex]}
                  className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500"
                />
                <button onClick={() => handleSend()} disabled={isLoading} className="w-12 h-12 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center">➤</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}