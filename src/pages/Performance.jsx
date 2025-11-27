import React, { useState } from "react"

export default function Performance() {
  const [selected, setSelected] = useState("")
  const subjects = [
    { name: "คณิตศาสตร์", before: 65, mid: 72, after: 82, weaknesses: ["สมการเชิงเส้น", "เศษส่วน"] },
    { name: "ภาษาอังกฤษ", before: 70, mid: 78, after: 85, weaknesses: ["Past Tense", "Essay"] },
    { name: "วิทยาศาสตร์", before: 68, mid: 75, after: 79, weaknesses: ["กฎของนิวตัน", "สมดุลเคมี"] },
  ]
  const list = selected ? subjects.filter((s) => s.name === selected) : subjects

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ความก้าวหน้าและจุดอ่อนแต่ละวิชา</h1>
        <select className="border rounded-xl px-4 py-2" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">ทุกวิชา</option>
          {subjects.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {list.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border p-6">
            <h3 className="text-xl font-bold mb-6">{s.name}</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <ScoreBox color="blue" label="ก่อนเรียน" score={s.before} />
              <ScoreBox color="yellow" label="กลางเทอม" score={s.mid} />
              <ScoreBox color="orange" label="หลังเรียน" score={s.after} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>ความก้าวหน้า</span>
                <span className="font-semibold text-green-600">+{s.after - s.before} คะแนน</span>
              </div>
              <div className="w-full bg-neutral-200 h-2 rounded-full">
                <div className="bg-primary-orange h-2 rounded-full" style={{ width: `${s.after}%` }} />
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">จุดอ่อน</h4>
              <div className="space-y-2">
                {s.weaknesses.map((w, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
                    • {w}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreBox({ color, label, score }) {
  const map = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    orange: "bg-orange-100 text-primary-orange",
  }
  return (
    <div className="text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${map[color]}`}>
        <span className="text-xl font-bold">{score}</span>
      </div>
      <div className="text-sm text-neutral-700">{label}</div>
    </div>
  )
}
