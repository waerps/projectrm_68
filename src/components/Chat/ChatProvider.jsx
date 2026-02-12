import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

const ChatContext = createContext(null)
export const useChat = () => useContext(ChatContext)

const BOT_GREETING =
  "สวัสดีครับ! ผมคือแชตบอตของศรเสริมติวเตอร์ มีคำถามอะไรสอบถามไหมครับ?"

const N8N_CHAT_WEBHOOK =
  "https://cpkku.app.n8n.cloud/webhook/488ca9d1-0cb9-4a10-93df-3b8fb52fc2c8/chat"

function extractReply(data) {
  return (
    data?.reply ??
    data?.answer ??
    data?.message ??
    data?.text ??
    data?.output ??
    data?.data?.reply ??
    data?.data?.answer ??
    data?.data?.message ??
    data?.data?.text ??
    null
  )
}

function extractHistory(data) {
  return (
    data?.history ??
    data?.messages ??
    data?.data?.history ??
    data?.data?.messages ??
    null
  )
}

export default function ChatProvider({ children }) {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [messages, setMessages] = useState([
    { id: 1, text: BOT_GREETING, sender: "bot" },
  ])
  const [inputValue, setInputValue] = useState("")

  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      title: "การสนทนาวันนี้",
      messages: [{ id: 1, text: BOT_GREETING, sender: "bot" }],
      date: new Date(),
    },
  ])
  const [currentChatId, setCurrentChatId] = useState(1)

  // sessionId จำบทสนทนา
  const [sessionId] = useState(() => {
    const key = "sornsirm_chat_session_id"
    const saved = localStorage.getItem(key)
    if (saved) return saved
    const fresh = Math.random().toString(16).slice(2) + Date.now().toString(16)
    localStorage.setItem(key, fresh)
    return fresh
  })

    useEffect(() => {
    setIsOpen(false)
    setIsFullscreen(false)
  }, [location.pathname])

  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen, isFullscreen, currentChatId])

  const syncHistory = (chatId, nextMessages) => {
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, messages: nextMessages, date: new Date() } : chat
      )
    )
  }


  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text) return

    const userMessage = {
      id: messages.length + 1,
      text,
      sender: "user",
    }

    const afterUser = [...messages, userMessage]
    setMessages(afterUser)
    setInputValue("")

    try {
      const res = await fetch(N8N_CHAT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatInput: text,
          sessionId: sessionId,
          threadId: currentChatId
        }),
      })

      if (!res.ok) {
        const t = await res.text().catch(() => "")
        throw new Error(`n8n error ${res.status}: ${t}`)
      }

      const data = await res.json().catch(() => ({}))

      const history = extractHistory(data)
      if (Array.isArray(history) && history.length) {
        const mapped = history.map((m, idx) => {
          const role = m.role ?? (m.type === "human" ? "user" : m.type === "ai" ? "bot" : "bot")
          const text = m.text ?? m.content ?? m.message ?? m.answer ?? ""
          return {
            id: idx + 1,
            sender: role === "user" ? "user" : "bot",
            text,
          }
        })

        setMessages(mapped)
        syncHistory(currentChatId, mapped)
        return
      }

      const replyText = extractReply(data)
      const botMessage = {
        id: afterUser.length + 1,
        text: replyText ? String(replyText) : "บอทไม่ได้ส่งข้อความตอบกลับมา (เช็ก output ใน n8n)",
        sender: "bot",
      }

      const finalMessages = [...afterUser, botMessage]
      setMessages(finalMessages)
      syncHistory(currentChatId, finalMessages)
    } catch (err) {
      console.error("Webhook error:", err)
      const failMsg = {
        id: afterUser.length + 1,
        text: "ขอโทษครับ ตอนนี้เชื่อมต่อบอทไม่ได้ ลองใหม่อีกครั้งนะ 😢",
        sender: "bot",
      }
      const finalMessages = [...afterUser, failMsg]
      setMessages(finalMessages)
      syncHistory(currentChatId, finalMessages)
    }
  }

  const handleNewChat = () => {
    const newChatId = chatHistory.length + 1
    const newChat = {
      id: newChatId,
      title: `การสนทนา ${newChatId}`,
      messages: [{ id: 1, text: BOT_GREETING, sender: "bot" }],
      date: new Date(),
    }

    setChatHistory((prev) => [newChat, ...prev])
    setCurrentChatId(newChatId)
    setMessages(newChat.messages)
  }

  const loadChat = (chatId) => {
    const chat = chatHistory.find((c) => c.id === chatId)
    if (!chat) return
    setCurrentChatId(chatId)
    setMessages(chat.messages)
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    if (isToday) return "วันนี้"
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })
  }

  const value = useMemo(
    () => ({
      isOpen,
      isFullscreen,
      messages,
      inputValue,
      chatHistory,
      currentChatId,
      messagesEndRef,

      setIsOpen,
      setIsFullscreen,
      setInputValue,
      handleSend,
      handleNewChat,
      loadChat,
      formatDate,
    }),
    [isOpen, isFullscreen, messages, inputValue, chatHistory, currentChatId]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
