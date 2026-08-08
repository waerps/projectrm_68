import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

const ChatContext = createContext(null)
export const useChat = () => useContext(ChatContext)

const BOT_GREETING =
  "สวัสดีครับ! ผมคือแชตบอตของศรเสริมติวเตอร์ มีคำถามอะไรสอบถามไหมครับ?"

const N8N_CHAT_WEBHOOK =
  "https://cpkku.app.n8n.cloud/webhook/b42b005c-977e-47c2-8512-d29e5b7ae11d/chat"


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
  const [isLoading, setIsLoading] = useState(false)

  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      title: "การสนทนาวันนี้",
      messages: [{ id: 1, text: BOT_GREETING, sender: "bot" }],
      date: new Date(),
    },
  ])
  const [currentChatId, setCurrentChatId] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)

  // sessionId จำบทสนทนา
  const [sessionId] = useState(() => {
    const key = "sornsirm_chat_session_id"
    const saved = localStorage.getItem(key)
    if (saved) return saved
    const fresh = Math.random().toString(16).slice(2) + Date.now().toString(16)
    localStorage.setItem(key, fresh)
    return fresh
  })

  const audioCtxRef = useRef(null)
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  useEffect(() => {
    setIsOpen(false)
    setIsFullscreen(false)
  }, [location.pathname])

  const messagesEndRef = useRef(null)

  const isOpenRef = useRef(isOpen)
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const isFullscreenRef = useRef(isFullscreen)
  useEffect(() => {
    isFullscreenRef.current = isFullscreen
  }, [isFullscreen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen, isFullscreen, currentChatId])

  const openChat = () => {
    setIsOpen(true)
    setUnreadCount(0)
  }

  const playNotifSound = () => {
    try {
      const ctx = getAudioContext()
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.001, startTime)
        gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      playTone(988, ctx.currentTime, 0.18)
      playTone(1318, ctx.currentTime + 0.1, 0.3)
    } catch (e) {
      console.error("Notif sound error:", e)
    }
  }

  const playSendSound = () => {
    try {
      const ctx = getAudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.setValueAtTime(700, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch (e) {
      console.error("Send sound error:", e)
    }
  }

  // เสียงพิมพ์แบบ Messenger — นุ่มกว่าเดิม ไม่ใช้ square wave (เสียงแหลมกร้าน)
  const playKeyClick = () => {
    try {
      const ctx = getAudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.setValueAtTime(420 + Math.random() * 60, ctx.currentTime)
      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
      osc.start()
      osc.stop(ctx.currentTime + 0.09)
    } catch (e) {
      console.error("Key click error:", e)
    }
  }

  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => {
      playKeyClick()
    }, 130) // ความถี่การคลิก ปรับเร็ว/ช้าได้ตรงนี้
    return () => clearInterval(interval)
  }, [isLoading])

  const syncHistory = (chatId, nextMessages) => {
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, messages: nextMessages, date: new Date() } : chat
      )
    )
  }

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? inputValue).trim()
    if (!text) return

    const userMessage = {
      id: messages.length + 1,
      text,
      sender: "user",
    }

    const afterUser = [...messages, userMessage]
    setMessages(afterUser)
    setInputValue("")
    playSendSound()
    setIsLoading(true)

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
        playNotifSound()
        if (!isOpenRef.current && !isFullscreenRef.current) {
          setUnreadCount((c) => c + 1)
        }
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
      playNotifSound()
      if (!isOpenRef.current && !isFullscreenRef.current) {
        setUnreadCount((c) => c + 1)
      }
    } catch (err) {
      console.error("Webhook error:", err)
      const failMsg = {
        id: afterUser.length + 1,
        text: "ขอโทษครับ ตอนนี้เชื่อมต่อน้องบอตไม่ได้ ลองใหม่อีกครั้งนะ 😢",
        sender: "bot",
      }
      const finalMessages = [...afterUser, failMsg]
      setMessages(finalMessages)
      syncHistory(currentChatId, finalMessages)
    } finally {
      setIsLoading(false)
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

  const deleteChat = (chatId) => {
    setChatHistory((prev) => {
      const filtered = prev.filter((c) => c.id !== chatId)
      if (currentChatId === chatId) {
        if (filtered.length) {
          setCurrentChatId(filtered[0].id)
          setMessages(filtered[0].messages)
        } else {
          handleNewChat()
        }
      }
      return filtered
    })
  }

  const renameChat = (chatId, newTitle) => {
    setChatHistory((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
    )
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
      unreadCount,
      openChat,
      isLoading,

      setIsOpen,
      setIsFullscreen,
      setInputValue,
      handleSend,
      handleNewChat,
      loadChat,
      formatDate,
      deleteChat,
      renameChat,
    }),
    [isOpen, isFullscreen, messages, inputValue, chatHistory, currentChatId, isLoading, unreadCount, deleteChat, renameChat]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
