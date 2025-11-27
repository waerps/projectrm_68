import React, { useState } from "react"

export default function Schedule() {
  const [showModal, setShowModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)

  const timeSlots = [
    "08:00-09:30",
    "09:30-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:30",
    "14:30-16:00",
    "16:00-17:30",
    "17:30-19:00",
  ]
  const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"]
  const today = "อังคาร"

  const scheduleData = {
    อังคาร: {
      "09:30-11:00": { subject: "คณิตศาสตร์", students: "ป.5", needsRecording: true },
    },
    พฤหัสบดี: {
      "09:30-11:00": { subject: "คณิตศาสตร์", students: "ป.5", needsRecording: false },
    },
  }

  const handleClick = (day, time, data) => {
    if (!data || time === "12:00-13:00") return
    setSelectedClass({ day, time, ...data })
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 mt-35">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">ตารางสอน</h1>
          <div className="bg-primary-orange text-white px-4 py-2 rounded-xl text-sm font-medium">
            <i className="fas fa-calendar-day mr-2" />
            วันนี้: อังคารที่ 28 ตุลาคม 2568
          </div>
        </div>

        <div className="bg-neutral-50 rounded-2xl p-4 overflow-x-auto">
          <div className="grid grid-cols-8 gap-2 min-w-[800px]">
            <div className="text-center font-semibold text-neutral-700 py-3">เวลา</div>
            {days.map((d) => (
              <div
                key={d}
                className={`text-center font-semibold py-3 rounded-xl ${
                  d === today ? "bg-primary-orange text-white" : "text-neutral-700"
                }`}
              >
                {d}
              </div>
            ))}

            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="text-center text-sm text-neutral-600 py-4 font-medium">{time}</div>
                {days.map((d) => {
                  const cls = scheduleData[d]?.[time]
                  const isLunch = time === "12:00-13:00"
                  let cn =
                    "min-h-[80px] p-3 rounded-xl border-2 transition-all duration-200 " +
                    (isLunch
                      ? "bg-neutral-100 border-neutral-200"
                      : cls
                      ? "bg-white border-neutral-200 hover:shadow-md cursor-pointer"
                      : "bg-neutral-50 border-neutral-200")
                  if (cls?.needsRecording) cn = "bg-red-50 border-red-200 ring-2 ring-red-100 " + cn

                  return (
                    <div key={d + time} className={cn} onClick={() => handleClick(d, time, cls)}>
                      {isLunch ? (
                        <div className="text-center text-neutral-500">
                          <i className="fas fa-utensils text-lg mb-1" />
                          <div className="text-xs">พักเที่ยง</div>
                        </div>
                      ) : cls ? (
                        <div>
                          <div className="font-semibold text-sm text-neutral-900">{cls.subject}</div>
                          <div className="text-xs text-neutral-500">{cls.students}</div>
                          {cls.needsRecording && (
                            <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-lg font-medium inline-block mt-1">
                              ต้องบันทึก
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {showModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">บันทึกการสอน</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-neutral-100">
                <i className="fas fa-times text-neutral-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-neutral-600 mb-1">วิชา</div>
                  <div className="bg-neutral-50 rounded-xl p-3 font-medium">{selectedClass.subject}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">วัน</div>
                  <div className="bg-neutral-50 rounded-xl p-3 font-medium">{selectedClass.day}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">เวลา</div>
                  <div className="bg-neutral-50 rounded-xl p-3 font-medium">{selectedClass.time}</div>
                </div>
              </div>
              <textarea
                rows="3"
                placeholder="เนื้อหาที่สอนวันนี้…"
                className="w-full border border-neutral-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
              />
            </div>
            <div className="p-6 border-t border-neutral-200 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-xl">
                ยกเลิก
              </button>
              <button className="px-6 py-2 bg-primary-orange text-white rounded-xl">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
