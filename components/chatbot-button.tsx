"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Chatbot Toggle Button */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src="/chatbot.png" // 👉 path ของรูป
          alt="Chat"
          className="h-13 w-13 object-cover"
        />
      </Button>

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 shadow-xl md:w-96">
          <CardHeader className="border-b border-border bg-primary text-primary-foreground">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5" />
              แชทบอทช่วยเหลือ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-4 rounded-lg bg-secondary p-3">
              <p className="text-sm text-foreground">สวัสดีค่ะ! ฉันคือแชทบอทของสถาบันศรเสริม ติวเตอร์</p>
              <p className="mt-2 text-sm text-muted-foreground">มีอะไรให้ช่วยไหมคะ?</p>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm bg-transparent">
                ดูข้อมูลคอร์สเรียน
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm bg-transparent">
                สอบถามเกี่ยวกับการลงทะเบียน
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm bg-transparent">
                ติดต่อเจ้าหน้าที่
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">(Demo - ยังไม่เชื่อมต่อระบบจริง)</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
