import { AlertTriangle } from "lucide-react";

export default function ExamRightsNotice({ standaloneBank = false }) {
  return (
    <div role="note" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold">สิทธิ์การใช้ข้อสอบ{standaloneBank ? "สำหรับคอร์สเดี่ยว" : "ในคอร์สเดี่ยว"}</p>
        <p className="mt-1 text-sm leading-relaxed">
          ข้อสอบที่นำมาใช้ควรเป็นข้อสอบที่ติวเตอร์สร้างขึ้นเอง หรือเป็นข้อสอบที่สามารถนำมาใช้ได้อย่างถูกต้องตามสิทธิ์
          โดยควรประยุกต์แนวข้อสอบและไม่คัดลอกข้อสอบต้นฉบับที่มีลิขสิทธิ์มาใช้โดยตรง
        </p>
      </div>
    </div>
  );
}
