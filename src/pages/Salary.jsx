import React, { useState } from "react"

export default function Salary() {
  const [period, setPeriod] = useState("current")
  const data = {
    current: { amount: 24750, classes: 35, students: 142 },
    last3: { amount: 72300, classes: 105, students: 426 },
    last6: { amount: 145600, classes: 210, students: 852 },
  }
  const current = data[period]

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 rounded-3xl p-8 text-center shadow-lg">
        <h1 className="text-4xl font-bold mb-2">฿ {current.amount.toLocaleString()}</h1>
        <p className="text-xl opacity-90 mb-6">
          {period === "current" ? "รายได้เดือนปัจจุบัน (ตุลาคม 2568)" : period === "last3" ? "รายได้ 3 เดือนที่แล้ว" : "รายได้ 6 เดือนที่แล้ว"}
        </p>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-2xl font-bold mb-1">{current.classes}</div>
            <div className="text-sm opacity-80">ชั่วโมงสอน</div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-1">{current.students}</div>
            <div className="text-sm opacity-80">นักเรียนทั้งหมด</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">เลือกช่วงเวลา</h2>
          <select className="border rounded-xl px-4 py-2" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="current">เดือนนี้</option>
            <option value="last3">ย้อนหลัง 3 เดือน</option>
            <option value="last6">ย้อนหลัง 6 เดือน</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between relative mt-10">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-neutral-200 -z-10"></div>
          <Step label="ยังไม่ตัดยอด" icon="fa-calculator" ring="border-primary-orange bg-orange-50 text-primary-orange" />
          <Step label="อยู่ระหว่างโอน" icon="fa-clock" ring="border-neutral-300 bg-yellow-50 text-yellow-600" />
          <Step label="ได้รับเงินแล้ว" icon="fa-check-circle" ring="border-neutral-300 bg-green-50 text-green-600" />
        </div>

        <div className="mt-10">
          <div className="w-full bg-neutral-200 rounded-full h-3">
            <div className="bg-primary-orange h-3 rounded-full w-1/3"></div>
          </div>
          <p className="text-sm text-neutral-600 text-right mt-2">สถานะปัจจุบัน: ยังไม่ตัดยอด</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Rates title="อัตราค่าสอน - ระดับประถม" rows={[["1-4 นักเรียน", "180 บาท"], ["5-10 นักเรียน", "210 บาท"], ["11-15 นักเรียน", "240 บาท"], ["16-20 นักเรียน", "270 บาท"], ["21+ นักเรียน", "300 บาท"]]} />
        <Rates title="อัตราค่าสอน - ระดับมัธยม" rows={[["1-4 นักเรียน", "210 บาท"], ["5-10 นักเรียน", "240 บาท"], ["11-15 นักเรียน", "270 บาท"], ["16-20 นักเรียน", "300 บาท"], ["21+ นักเรียน", "330 บาท"]]} />
      </div>
    </div>
  )
}

function Step({ label, icon, ring }) {
  return (
    <div className="flex flex-col items-center text-center md:w-1/3">
      <div className={`w-16 h-16 flex items-center justify-center rounded-full border-4 ${ring}`}>
        <i className={`fas ${icon} text-2xl`} />
      </div>
      <h3 className="text-base font-semibold mt-3 text-neutral-900">{label}</h3>
    </div>
  )
}

function Rates({ title, rows }) {
  return (
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        {rows.map(([range, rate], i) => (
          <div key={i} className="flex justify-between py-2 border-b last:border-b-0">
            <span className="text-neutral-700">{range}</span>
            <span className="font-semibold">{rate}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
