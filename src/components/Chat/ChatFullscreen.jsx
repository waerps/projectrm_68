import React from "react"
import { useChat } from "./ChatProvider"

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
  } = useChat()

  if (!isFullscreen) return null

  return (
    <div className="fixed inset-0 bg-gray-50 z-40 pt-25">
      <div className="h-full max-w-[1200px] mx-auto px-4 pb-4">
        <div className="flex gap-4 h-full">
          {/* Sidebar */}
          <div className="w-80 bg-white rounded-3xl shadow-lg p-4 flex flex-col">
            <button
              onClick={handleNewChat}
              className="w-full bg-orange-500 text-white rounded-2xl py-3 font-semibold hover:bg-orange-600 transition-colors mb-4 flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span>
              New Chat
            </button>

            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="text-xs font-semibold text-gray-400 px-3 py-2">
                ประวัติการสนทนา
              </div>

              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                    currentChatId === chat.id
                      ? "bg-orange-50 border border-orange-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-sm truncate">{chat.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{formatDate(chat.date)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white rounded-3xl shadow-lg flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                  ศร
                </div>
                <div>
                  <div className="font-semibold">ศรเสริมติวเตอร์ Bot</div>
                  <div className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    ออนไลน์
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsFullscreen(false)
                  setIsOpen(true) // กลับไปโหมด popup
                }}
                className="w-10 h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                title="ย่อหน้าต่าง"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-orange-500 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="พิมพ์ข้อความ..."
                  className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  onClick={handleSend}
                  className="w-12 h-12 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center"
                  title="ส่ง"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
