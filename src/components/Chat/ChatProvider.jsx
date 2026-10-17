import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

const ChatContext = createContext(null)
export const useChat = () => useContext(ChatContext)

const BOT_GREETING =
  "สวัสดีครับ! ผมคือแชตบอตของศรเสริมติวเตอร์ มีคำถามอะไรสอบถามไหมครับ?"

const N8N_CHAT_WEBHOOK =
  "https://cpkku.app.n8n.cloud/webhook/b42b005c-977e-47c2-8512-d29e5b7ae11d/chat"

// รอคำตอบนานสุดเท่านี้ แล้วแจ้งให้กด "ลองใหม่" (บอตใช้ tool ค้น DB/เอกสาร ปกติ 2–10 วิ)
const REQUEST_TIMEOUT_MS = 60000

let messageSeq = 1000
const newId = () => ++messageSeq

// sessionId ต่อ 1 แชต — n8n (Simple Memory) จำบทสนทนาตาม sessionId
// เดิมใช้ค่าเดียวใน localStorage ทุกแชต: กด "แชตใหม่" แล้วบอตยังจำเรื่องจากแชตก่อน และหลังรีเฟรช
// หน้าจอว่างแต่บอตยังจำของเก่า → ตอนนี้แต่ละแชตมี sessionId ของตัวเอง ตรงกับที่ผู้ใช้เห็นบนจอ
const newSessionId = () => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  } catch { /* ใช้วิธีสำรองด้านล่าง */ }
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

const greetingMessage = () => ({ id: newId(), text: BOT_GREETING, sender: "bot" })
const createChat = (id, title) => ({
  id,
  title,
  sessionId: newSessionId(),
  messages: [greetingMessage()],
  date: new Date(),
})

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

  const [chatHistory, setChatHistory] = useState(() => [createChat(1, "การสนทนาวันนี้")])
  const [currentChatId, setCurrentChatId] = useState(1)
  const [messages, setMessages] = useState(() => chatHistory[0].messages)
  const [inputValue, setInputValue] = useState("")
  // แชตที่กำลังรอคำตอบ (null = ไม่มี) — ส่งได้ทีละข้อความ แต่สลับไปดูแชตอื่นระหว่างรอได้
  const [pendingChatId, setPendingChatId] = useState(null)
  // true เมื่อข้อความตอบกลับเริ่มไหลเข้ามาแล้ว (streaming) — ใช้ซ่อนจุดรอ/เสียงรอ
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingText, setLoadingText] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const abortRef = useRef(null)

  const isBusy = pendingChatId !== null
  // จุดรอ/สถานะแสดงเฉพาะในแชตที่กำลังรอจริง
  const isLoading = isBusy && pendingChatId === currentChatId

  // ref ของค่าล่าสุด ใช้ใน async callback (คำตอบมาถึงหลังผู้ใช้สลับแชตแล้ว)
  const currentChatIdRef = useRef(currentChatId)
  currentChatIdRef.current = currentChatId
  const chatHistoryRef = useRef(chatHistory)
  chatHistoryRef.current = chatHistory

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isOpen, isFullscreen, currentChatId, isLoading])

  const openChat = () => {
    setIsOpen(true)
    setUnreadCount(0)
  }

  // ─── เสียงแชต (Web Audio ไม่มีไฟล์เสียง) — โทนแบบ Messenger: ส่ง = "ฟึ่บ" สั้น, รับ = "ป๊อป" นุ่ม,
  //     ระหว่างรอ = "ต๊อก ต๊อก" เบา ๆ เป็นจังหวะห่าง ๆ แทนเสียงคลิกรัวทุก 130 ms แบบเดิม
  const audioCtxRef = useRef(null)
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      audioCtxRef.current = new AC()
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {})
    }
    return audioCtxRef.current
  }

  // เล่นโทนสั้นหนึ่งตัว ผ่าน low-pass ให้เสียงนุ่ม ไม่แหลม
  const blip = (ctx, { at, from, to = from, dur, gain, type = "sine", cutoff = 2400 }) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = cutoff
    osc.type = type
    osc.frequency.setValueAtTime(from, at)
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + dur * 0.6)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(gain, at + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    osc.connect(lp)
    lp.connect(g)
    g.connect(ctx.destination)
    osc.start(at)
    osc.stop(at + dur + 0.02)
  }

  const playNotifSound = () => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const t = ctx.currentTime + 0.01
      blip(ctx, { at: t, from: 740, to: 1180, dur: 0.12, gain: 0.14, type: "triangle", cutoff: 3000 })
      blip(ctx, { at: t + 0.09, from: 1180, dur: 0.16, gain: 0.08 })
    } catch (e) {
      console.warn("[chat] notif sound error:", e?.message)
    }
  }

  const playSendSound = () => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      blip(ctx, { at: ctx.currentTime + 0.01, from: 520, to: 980, dur: 0.09, gain: 0.08, cutoff: 2000 })
    } catch (e) {
      console.warn("[chat] send sound error:", e?.message)
    }
  }

  // จังหวะ "กำลังพิมพ์" — ป๊อปเบา 2 ครั้งติดกัน แล้วเว้น ~1.1 วิ (ไม่ดังเมื่อแท็บไม่ได้เปิดดู)
  const playTypingTick = () => {
    try {
      if (document.visibilityState !== "visible") return
      const ctx = getAudioContext()
      if (!ctx) return
      const t = ctx.currentTime + 0.01
      blip(ctx, { at: t, from: 980, to: 860, dur: 0.045, gain: 0.035, cutoff: 1800 })
      blip(ctx, { at: t + 0.11, from: 1040, to: 900, dur: 0.045, gain: 0.03, cutoff: 1800 })
    } catch (e) {
      console.warn("[chat] typing sound error:", e?.message)
    }
  }

  // เสียงรอเล่นเฉพาะช่วงยังไม่มีข้อความเข้ามา และหยุดเองหลัง 20 วิ ไม่ให้รบกวนถ้าบอตตอบช้ามาก
  useEffect(() => {
    if (!isBusy || isStreaming) return
    playTypingTick()
    const startedAt = Date.now()
    const interval = setInterval(() => {
      if (Date.now() - startedAt > 20000) { clearInterval(interval); return }
      playTypingTick()
    }, 1300)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBusy, isStreaming])

  // ข้อความสถานะระหว่างรอ — บอกตามจริงว่ายังรอคำตอบอยู่ ไม่แสร้งว่ากำลังพิมพ์
  useEffect(() => {
    if (!isBusy) { setLoadingText(""); return }
    setLoadingText("น้องศรเสริมกำลังคิด…")
    const t1 = setTimeout(() => setLoadingText("กำลังค้นข้อมูลให้อยู่นะครับ…"), 4000)
    const t2 = setTimeout(() => setLoadingText("ใช้เวลานานกว่าปกติเล็กน้อย รอสักครู่นะครับ…"), 15000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [isBusy])

  // บันทึกข้อความลงแชตนั้น ๆ และแสดงบนจอเฉพาะถ้าผู้ใช้ยังเปิดแชตนั้นอยู่
  const commitMessages = (chatId, nextMessages, { history = true } = {}) => {
    if (currentChatIdRef.current === chatId) setMessages(nextMessages)
    if (history) {
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, messages: nextMessages, date: new Date() } : chat
        )
      )
    }
  }

  // ยกเลิกคำขอที่ค้างอยู่เมื่อ component หายไป
  useEffect(() => () => abortRef.current?.abort(), [])

  // ข้อความแจ้งข้อผิดพลาดแยกจากข้อความตอบปกติ (isError) และมีปุ่ม "ลองใหม่" แทนการให้พิมพ์ซ้ำ
  const errorMessageFor = (kind) => {
    if (kind === "timeout") return "น้องศรเสริมใช้เวลาตอบนานเกินไป ลองกด \"ลองใหม่\" อีกครั้งนะครับ 🙏"
    if (kind === "offline") return "ดูเหมือนอินเทอร์เน็ตจะหลุดอยู่ เช็กการเชื่อมต่อแล้วกด \"ลองใหม่\" ได้เลยครับ"
    return "ตอนนี้ระบบตอบกลับไม่ได้ชั่วคราว ลองกด \"ลองใหม่\" อีกครั้ง หรือโทร 082-664-6551 (ครูกวาง) ได้เลยครับ"
  }

  // อ่านคำตอบแบบ streaming ของ n8n (NDJSON: {"type":"item","content":"..."}) — ใช้เมื่อเปิด
  // Response Mode = Streaming ที่ Chat Trigger แล้วเท่านั้น ตอนนี้ workflow ยังตอบเป็น JSON ก้อนเดียว
  const readStream = async (res, onText) => {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let full = ""
    const handleLine = (line) => {
      const trimmed = line.trim()
      if (!trimmed) return
      let obj
      try { obj = JSON.parse(trimmed) } catch { return }
      if (obj?.type === "item" && typeof obj.content === "string") {
        full += obj.content
        onText(full)
      } else if (obj?.type === "error") {
        throw new Error("stream error")
      }
    }
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop()
      lines.forEach(handleLine)
    }
    buffer += decoder.decode()
    handleLine(buffer)
    return full
  }

  // ส่งข้อความไปบอต — base = รายการข้อความที่มีข้อความผู้ใช้อยู่แล้ว (ใช้ซ้ำตอนกด "ลองใหม่")
  const askBot = async (text, base, chatId) => {
    const chat = chatHistoryRef.current.find((c) => c.id === chatId)
    const sessionId = chat?.sessionId || newSessionId()
    const controller = new AbortController()
    abortRef.current = controller
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; controller.abort() }, REQUEST_TIMEOUT_MS)
    const botId = newId()
    let lastPaint = 0

    // อัปเดต UI ไม่ถี่เกิน ~20 ครั้ง/วิ กันกระตุกตอนข้อความเข้ามาเป็นชิ้นเล็ก ๆ จำนวนมาก
    const paint = (partial) => {
      const now = performance.now()
      if (now - lastPaint < 50) return
      lastPaint = now
      commitMessages(chatId, [...base, { id: botId, text: partial, sender: "bot", streaming: true }], { history: false })
    }
    const notifyArrived = () => {
      playNotifSound()
      if (!isOpenRef.current && !isFullscreenRef.current) setUnreadCount((c) => c + 1)
    }

    setPendingChatId(chatId)
    setIsStreaming(false)
    try {
      const res = await fetch(N8N_CHAT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatInput: text, sessionId, threadId: chatId }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const type = res.headers.get("content-type") || ""
      let replyText = ""
      if (res.body && /ndjson|event-stream|jsonl/i.test(type)) {
        replyText = await readStream(res, (partial) => {
          if (!partial) return
          setIsStreaming(true)
          paint(partial)
        })
      } else {
        const data = await res.json().catch(() => ({}))
        const history = extractHistory(data)
        if (Array.isArray(history) && history.length) {
          const mapped = history.map((m) => {
            const role = m.role ?? (m.type === "human" ? "user" : "bot")
            return { id: newId(), sender: role === "user" ? "user" : "bot", text: String(m.text ?? m.content ?? m.message ?? m.answer ?? "") }
          })
          commitMessages(chatId, mapped)
          notifyArrived()
          return
        }
        replyText = String(extractReply(data) ?? "")
      }

      if (!replyText.trim()) throw new Error("empty reply")
      commitMessages(chatId, [...base, { id: botId, text: replyText, sender: "bot" }])
      notifyArrived()
    } catch (err) {
      const kind = timedOut ? "timeout"
        : (typeof navigator !== "undefined" && navigator.onLine === false) ? "offline"
        : err?.name === "AbortError" ? null // ผู้ใช้ปิด/เปลี่ยนหน้า ไม่ต้องแจ้ง
        : "server"
      // log แค่ชนิดข้อผิดพลาด ไม่ log ข้อความที่ผู้ใช้พิมพ์
      console.warn("[chat] request failed:", kind || "aborted", err?.message)
      if (!kind) return
      commitMessages(chatId, [...base, { id: newId(), text: errorMessageFor(kind), sender: "bot", isError: true, retryText: text }])
    } finally {
      clearTimeout(timer)
      if (abortRef.current === controller) abortRef.current = null
      setPendingChatId(null)
      setIsStreaming(false)
    }
  }

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? inputValue).trim()
    // กันส่งซ้ำ: ระหว่างรอคำตอบ กด Enter/ปุ่มลัดซ้ำจะไม่ส่งเพิ่ม
    if (!text || isBusy) return
    const chatId = currentChatId
    const base = [...messages, { id: newId(), text, sender: "user" }]
    commitMessages(chatId, base)
    setInputValue("")
    playSendSound()
    await askBot(text, base, chatId)
  }

  // กด "ลองใหม่" ใต้ข้อความแจ้งข้อผิดพลาด — ลบข้อความ error แล้วส่งคำถามเดิมซ้ำ (ไม่เพิ่มข้อความผู้ใช้ซ้ำ)
  const retryMessage = async (messageId) => {
    if (isBusy) return
    const target = messages.find((m) => m.id === messageId)
    if (!target?.retryText) return
    const chatId = currentChatId
    const base = messages.filter((m) => m.id !== messageId)
    commitMessages(chatId, base)
    await askBot(target.retryText, base, chatId)
  }

  // id ใหม่ = มากสุด + 1 (เดิมใช้จำนวนแชต + 1 → ลบแชตแล้วสร้างใหม่ได้ id ซ้ำ ข้อความปนกัน)
  const nextChatId = (list) => list.reduce((max, c) => Math.max(max, c.id), 0) + 1

  const handleNewChat = () => {
    const list = chatHistoryRef.current
    const id = nextChatId(list)
    const chat = createChat(id, `การสนทนา ${id}`)
    setChatHistory([chat, ...list])
    setCurrentChatId(id)
    setMessages(chat.messages)
  }

  const deleteChat = (chatId) => {
    // ห้ามลบแชตที่กำลังรอคำตอบ (คำตอบจะไม่มีที่ลง)
    if (chatId === pendingChatId) return
    const remaining = chatHistoryRef.current.filter((c) => c.id !== chatId)
    if (!remaining.length) {
      const chat = createChat(nextChatId(chatHistoryRef.current), "การสนทนาวันนี้")
      setChatHistory([chat])
      setCurrentChatId(chat.id)
      setMessages(chat.messages)
      return
    }
    setChatHistory(remaining)
    if (currentChatIdRef.current === chatId) {
      setCurrentChatId(remaining[0].id)
      setMessages(remaining[0].messages)
    }
  }

  const renameChat = (chatId, newTitle) => {
    setChatHistory((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
    )
  }

  const loadChat = (chatId) => {
    const chat = chatHistoryRef.current.find((c) => c.id === chatId)
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
      isBusy,
      pendingChatId,
      isStreaming,
      loadingText,
      retryMessage,

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, isFullscreen, messages, inputValue, chatHistory, currentChatId, pendingChatId, isStreaming, loadingText, unreadCount]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
