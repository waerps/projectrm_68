import React, { useEffect, useMemo, useRef, useState } from "react"

/**
 * FloatingChatbot
 * - ปุ่มวงกลมลอยมุมขวาล่าง (ทุกหน้า)
 * - กดแล้วเปิดหน้าต่างแชต
 * - มีปุ่มขยายเป็น Fullscreen (ซ้าย: ประวัติ/ New Chat, ขวา: แชต)
 * - รองรับหลายบทสนทนา (Threads)
 *
 * ต่อ API จริง:
 * - แก้ function askBot() ให้เรียก backend ของคุณแล้ว return ข้อความตอบกลับ
 */

// ---- mock bot (เปลี่ยนเป็นเรียก API จริงได้) ----
const N8N_CHAT_WEBHOOK =
  "https://cpkku.app.n8n.cloud/webhook/488ca9d1-0cb9-4a10-93df-3b8fb52fc2c8/chat"

// helper: แปลง response ให้เป็นรูปแบบมาตรฐาน
function normalizeN8nResponse(data) {
  // 1) reply ตรง ๆ
  const reply =
    data?.reply ??
    data?.answer ??
    data?.message ??
    data?.output ??
    data?.data?.reply ??
    null

  // 2) history/messages (เป็น array)
  const history =
    data?.history ??
    data?.messages ??
    data?.data?.history ??
    data?.data?.messages ??
    null

  return { reply, history }
}

async function askBotViaN8n({ text, sessionId, threadId }) {
  const res = await fetch(N8N_CHAT_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatInput: text,   // ✅ เปลี่ยนจาก message → chatInput
      sessionId,         // สำหรับจำบทสนทนา
      threadId,          // แยกห้องแชต
      ts: Date.now(),
      source: "web",
    }),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`n8n error ${res.status}: ${t}`)
  }

  const data = await res.json().catch(() => ({}))
  return normalizeN8nResponse(data)
}



const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16)

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

const Bubble = ({ role, text, time }) => {
  const isUser = role === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-4 py-2 shadow-sm",
          isUser
            ? "bg-orange-500 text-white rounded-br-md"
            : "bg-white border border-gray-100 text-gray-800 rounded-bl-md",
        ].join(" ")}
      >
        <div className="whitespace-pre-wrap text-[14px] leading-relaxed">{text}</div>
        <div className={`mt-1 text-[11px] ${isUser ? "text-white/80" : "text-gray-400"}`}>
          {time}
        </div>
      </div>
    </div>
  )
}

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)

  // threads: [{id, title, createdAt, messages:[{id, role, text, ts}]}]
  const [threads, setThreads] = useState(() => {
    // เริ่มต้นมี 1 ห้อง
    const firstId = uid()
    return [
      {
        id: firstId,
        title: "แชตใหม่",
        createdAt: Date.now(),
        messages: [
          {
            id: uid(),
            role: "bot",
            text: "สวัสดีครับ 👋 ถามเกี่ยวกับคอร์สเรียน/ตารางเรียน/โปรโมชั่น ได้เลย",
            ts: Date.now(),
          },
        ],
      },
    ]
  })
  const [activeId, setActiveId] = useState(() => (threads?.[0]?.id ? threads[0].id : null))

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || threads[0],
    [threads, activeId]
  )

  // keep active thread id valid
  useEffect(() => {
    if (!activeId && threads.length) setActiveId(threads[0].id)
  }, [activeId, threads])

  // close on ESC (เฉพาะตอนเปิด)
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) {
        setFullscreen(false)
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

const [sessionId] = useState(() => {
  // คงค่า session ในเครื่อง เพื่อให้คุยต่อเนื่อง
  const key = "sornsirm_chat_session_id"
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const fresh = (Math.random().toString(16).slice(2) + Date.now().toString(16))
  localStorage.setItem(key, fresh)
  return fresh
})


  const listRef = useRef(null)
  useEffect(() => {
    // scroll ไปท้ายสุดเมื่อเปิด/ส่งข้อความ
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [open, fullscreen, activeId, activeThread?.messages?.length])

  function newChat() {
    const id = uid()
    const now = Date.now()
    const t = {
      id,
      title: `แชตใหม่ (${formatTime(now)})`,
      createdAt: now,
      messages: [
        { id: uid(), role: "bot", text: "เริ่มแชตใหม่แล้วครับ 😊 อยากถามเรื่องอะไรดี?", ts: now },
      ],
    }
    setThreads((prev) => [t, ...prev])
    setActiveId(id)
  }

  function pickThread(id) {
    setActiveId(id)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setInput("")

    const now = Date.now()
    const userMsg = { id: uid(), role: "user", text, ts: now }

    // 1) ใส่ข้อความ user ลง thread ก่อน
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, messages: [...t.messages, userMsg] } : t
      )
    )

try {
  const { reply, history } = await askBotViaN8n({
    text,
    sessionId,
    threadId: activeId,
  })

  // ถ้า n8n ส่ง history/messages กลับมา ให้เอามาแทน (หรือ merge)
  // รูปแบบ history ที่รองรับ:
  // [{role:"user"/"bot", text:"...", ts:...}] หรือ [{type:"human"/"ai", content:"..."}]
  if (Array.isArray(history) && history.length) {
    const mapped = history.map((m) => {
      const role =
        m.role ??
        (m.type === "human" ? "user" : m.type === "ai" ? "bot" : "bot")

      const text =
        m.text ?? m.content ?? m.message ?? m.answer ?? ""

      const ts = m.ts ?? m.createdAt ?? Date.now()

      return { id: uid(), role, text, ts }
    })

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, messages: mapped }
          : t
      )
    )
  }

  // ถ้า n8n ส่ง reply กลับมา ให้ append เป็นข้อความ bot
  if (reply) {
    const botMsg = { id: uid(), role: "bot", text: String(reply), ts: Date.now() }
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, messages: [...t.messages, botMsg] } : t
      )
    )
  } else if (!history) {
    // ไม่ได้ทั้ง reply และ history
    const botMsg = {
      id: uid(),
      role: "bot",
      text: "บอท: ได้รับแล้ว แต่ webhook ไม่ส่งข้อความตอบกลับมา (ลองเช็ก output ของ n8n)",
      ts: Date.now(),
    }
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, messages: [...t.messages, botMsg] } : t
      )
    )
  }
} catch (e) {
  const botMsg = {
    id: uid(),
    role: "bot",
    text: "ขอโทษครับ ตอนนี้เชื่อมต่อแชตบอตไม่ได้ ลองใหม่อีกครั้งนะ",
    ts: Date.now(),
  }
  setThreads((prev) =>
    prev.map((t) =>
      t.id === activeId ? { ...t, messages: [...t.messages, botMsg] } : t
    )
  )
} finally {
  setSending(false)
}

  }

  function onSubmit(e) {
    e.preventDefault()
    sendMessage()
  }

  // ---------- UI pieces ----------
  const FloatingButton = (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-6 right-6 z-[60] grid h-14 w-14 place-items-center rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 active:scale-95 transition"
      aria-label="Open chatbot"
      title="แชตบอต"
    >
      <span className="text-2xl">💬</span>
    </button>
  )

  const Overlay = (
    <div
      className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-[1px]"
      onClick={() => {
        setFullscreen(false)
        setOpen(false)
      }}
    />
  )

  const CompactChat = (
    <div className="fixed bottom-6 right-6 z-[60] w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500 text-white shadow">
          💬
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-gray-900 leading-tight">Chatbot</div>
          <div className="text-xs text-gray-500 truncate">
            {activeThread?.title || "แชต"}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white hover:bg-gray-50"
            title="ขยายเต็มจอ"
            onClick={() => setFullscreen(true)}
            type="button"
          >
            ⤢
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white hover:bg-gray-50"
            title="ปิด"
            onClick={() => {
              setFullscreen(false)
              setOpen(false)
            }}
            type="button"
          >
            ✕
          </button>
        </div>
      </div>

      {/* messages */}
      <div ref={listRef} className="h-[360px] overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
        {activeThread?.messages?.map((m) => (
          <Bubble key={m.id} role={m.role} text={m.text} time={formatTime(m.ts)} />
        ))}
        {sending ? (
          <div className="text-xs text-gray-400">กำลังพิมพ์...</div>
        ) : null}
      </div>

      {/* input */}
      <form onSubmit={onSubmit} className="p-3 border-t bg-white">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500"
          >
            ส่ง
          </button>
        </div>
      </form>
    </div>
  )

  const FullscreenChat = (
    <div className="fixed inset-0 z-[60] bg-white">
      {/* topbar */}
      <div className="h-[64px] border-b bg-white px-4 md:px-6 flex items-center">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500 text-white shadow">
            💬
          </div>
          <div>
            <div className="font-extrabold text-gray-900 leading-tight">Chatbot</div>
            <div className="text-xs text-gray-500">ถาม-ตอบได้ทันที</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            onClick={newChat}
            type="button"
          >
            + New chat
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white hover:bg-gray-50"
            title="ย่อหน้าต่าง"
            onClick={() => setFullscreen(false)}
            type="button"
          >
            ⤡
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white hover:bg-gray-50"
            title="ปิด"
            onClick={() => {
              setFullscreen(false)
              setOpen(false)
            }}
            type="button"
          >
            ✕
          </button>
        </div>
      </div>

      {/* body */}
      <div className="h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-12">
        {/* left: threads */}
        <div className="md:col-span-4 lg:col-span-3 border-r bg-gray-50">
          <div className="p-4">
            <div className="text-sm font-extrabold text-gray-900">ประวัติการคุย</div>
            <div className="mt-2 text-xs text-gray-500">
              เลือกห้องแชตทางซ้าย หรือกด New chat
            </div>
          </div>

          <div className="px-3 pb-4 space-y-2 overflow-y-auto h-[calc(100vh-64px-84px)]">
            {threads.map((t) => {
              const active = t.id === activeId
              const last = t.messages?.[t.messages.length - 1]
              return (
                <button
                  key={t.id}
                  onClick={() => pickThread(t.id)}
                  className={[
                    "w-full text-left rounded-2xl px-4 py-3 border transition",
                    active
                      ? "bg-white border-orange-200 shadow-sm"
                      : "bg-white/60 border-gray-100 hover:bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-900 truncate">{t.title}</div>
                    <div className="ml-auto text-[11px] text-gray-400">
                      {formatTime(last?.ts || t.createdAt)}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 line-clamp-1">
                    {last?.text || "—"}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* right: chat */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col">
          <div className="px-4 md:px-6 py-4 border-b">
            <div className="font-extrabold text-gray-900">{activeThread?.title}</div>
            <div className="text-xs text-gray-500">พิมพ์คำถามได้เลย</div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3 bg-gray-50">
            {activeThread?.messages?.map((m) => (
              <Bubble key={m.id} role={m.role} text={m.text} time={formatTime(m.ts)} />
            ))}
            {sending ? <div className="text-xs text-gray-400">กำลังพิมพ์...</div> : null}
          </div>

          <form onSubmit={onSubmit} className="px-4 md:px-6 py-4 border-t bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                className="flex-1 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm outline-none focus:border-orange-400"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500"
              >
                ส่ง
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {!open ? FloatingButton : null}

      {open ? (
        <>
          {/* overlay เฉพาะตอนเปิดแบบเล็ก (fullscreen ไม่ต้อง) */}
          {!fullscreen ? Overlay : null}

          {/* compact vs fullscreen */}
          {!fullscreen ? CompactChat : FullscreenChat}
        </>
      ) : null}
    </>
  )
}

