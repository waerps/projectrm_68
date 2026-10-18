import React, { Suspense } from "react"
import { autolinkBareUrls } from "./chatText"


/* ─────────────────────────────────────────────────────────────────────────
   เนื้อหาข้อความแชต — ใช้ร่วมกันทั้ง ChatWidget และ ChatFullscreen
   - ข้อความบอต: แตกเป็นก้อนตามบรรทัด (ดีไซน์เดิม) + รองรับ Markdown ในบรรทัด
   - หัวข้อย่อย •, -, * และ 1. แสดงเป็นจุด/ตัวเลข (Gemini มักใช้ "* " ซึ่งเดิมไม่รองรับ)
   - ลิงก์ไปเว็บอื่นเปิดแท็บใหม่ / ลิงก์ไปหน้าในเว็บนี้ (เช่น หน้าคอร์ส) แสดงเป็นปุ่ม กดแล้วเปลี่ยนหน้า แชตไม่หาย
   - ข้อความผู้ใช้แสดงเป็นข้อความธรรมดา (เดิมตีความเป็น Markdown: พิมพ์ "# " กลายเป็นหัวข้อใหญ่)
   - ตัดคำยาว ๆ/URL ไม่ให้ล้นกรอบ
   ───────────────────────────────────────────────────────────────────────── */

const BULLET_RE = /^\s*([•\-*])\s+/
const NUMBER_RE = /^\s*(\d{1,2})[.)]\s+/

const LazyInlineMarkdown = React.lazy(() => import("./ChatInlineMarkdown"))

// ระหว่างรอโหลดตัวแปลง Markdown ให้แสดงข้อความดิบไปก่อน
function InlineMarkdown({ text }) {
  return (
    <Suspense fallback={<span>{text}</span>}>
      <LazyInlineMarkdown text={text} />
    </Suspense>
  )
}

export function UserMessageText({ text }) {
  return <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{text}</span>
}

// lines ของบอต → ก้อนข้อความ (bubbleClass กำหนดหน้าตาจากแต่ละ view)
export function BotMessageBubbles({ text, bubbleClass, animate = true }) {
  const lines = autolinkBareUrls(String(text || "")).split("\n").filter((line) => line.trim() !== "")
  return lines.map((line, index) => {
    const bullet = line.match(BULLET_RE)
    const number = !bullet && line.match(NUMBER_RE)
    return (
      <div
        key={index}
        className={`${bubbleClass} break-words [overflow-wrap:anywhere] ${animate ? "chat-fade-in" : ""}`}
        // หน่วงทีละก้อนแต่ไม่เกิน 0.3 วิ — ข้อความยาวจะไม่ต้องรอนาน
        style={animate ? { animationDelay: `${Math.min(index, 4) * 0.07}s` } : undefined}
      >
        {bullet || number ? (
          <span className="flex gap-2">
            <span className="shrink-0 text-orange-500">{bullet ? "•" : `${number[1]}.`}</span>
            <span className="min-w-0">
              <InlineMarkdown text={line.replace(bullet ? BULLET_RE : NUMBER_RE, "")} />
            </span>
          </span>
        ) : (
          <InlineMarkdown text={line} />
        )}
      </div>
    )
  })
}

export function RetryButton({ onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="self-start px-3 py-1.5 text-xs font-semibold rounded-full border border-orange-300 text-orange-600 bg-white hover:bg-orange-50 disabled:opacity-50">
      ↻ ลองใหม่
    </button>
  )
}

