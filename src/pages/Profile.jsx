import React, { useState } from "react"

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    firstname: "กมลทิพย์",
    lastname: "กงเพชร",
    nickname: "เป้ว",
    phone: "081-234-5678",
    occupation: "นักเรียนดี",
    birthdate: "1985-05-15",
    emergencyName: "สมหญิง ใจดี",
    emergencyPhone: "081-987-6543",
    lineId: "somchai.teacher",
    remark: "ครูสอนดี มีประสบการณ์ 10 ปี",
    createdAt: "2020-01-15",
  })

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border p-6 flex items-center justify-between mt-40">
        <div>
          <h1 className="text-2xl font-bold">ข้อมูลส่วนตัว</h1>
          <p className="text-neutral-600">จัดการข้อมูลส่วนตัวและการติดต่อ</p>
        </div>
        <button
          className={`px-6 py-2 rounded-xl font-medium ${
            isEditing ? "bg-primary-orange text-white" : "border"
          }`}
          onClick={() => setIsEditing((v) => !v)}
        >
          <i className={`fas ${isEditing ? "fa-save" : "fa-edit"} mr-2`} />
          {isEditing ? "บันทึก" : "แก้ไข"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border p-6 text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-primary-orange to-orange-600 rounded-full overflow-hidden mx-auto mb-4">
            <img src="/img/tutor.png" alt="tutor" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {form.firstname} {form.lastname}
          </h3>
          <p className="text-neutral-600 mb-1">{form.nickname}</p>
          <p className="text-neutral-500 mb-4">{form.occupation}</p>
          {isEditing && <button className="px-4 py-2 border rounded-xl">เปลี่ยนรูป</button>}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border p-6">
          <h3 className="text-lg font-bold mb-6">ข้อมูลทั่วไป</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="ชื่อ" value={form.firstname} onChange={(v) => onChange("firstname", v)} disabled={!isEditing} />
            <Input label="นามสกุล" value={form.lastname} onChange={(v) => onChange("lastname", v)} disabled={!isEditing} />
            <Input label="ชื่อเล่น" value={form.nickname} onChange={(v) => onChange("nickname", v)} disabled={!isEditing} />
            <Input label="เบอร์โทรศัพท์" value={form.phone} onChange={(v) => onChange("phone", v)} disabled={!isEditing} />
            <Input label="อาชีพ" value={form.occupation} onChange={(v) => onChange("occupation", v)} disabled={!isEditing} />
            <Input type="date" label="วันเกิด" value={form.birthdate} onChange={(v) => onChange("birthdate", v)} disabled={!isEditing} />
            <Input label="ชื่อผู้ติดต่อฉุกเฉิน" value={form.emergencyName} onChange={(v) => onChange("emergencyName", v)} disabled={!isEditing} />
            <Input label="เบอร์ผู้ติดต่อฉุกเฉิน" value={form.emergencyPhone} onChange={(v) => onChange("emergencyPhone", v)} disabled={!isEditing} />
            <Input label="Line ID" value={form.lineId} onChange={(v) => onChange("lineId", v)} disabled={!isEditing} />
            <Input type="date" label="วันที่เริ่มงาน" value={form.createdAt} disabled />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">หมายเหตุ</label>
              <textarea
                rows="3"
                className="w-full border rounded-xl px-4 py-3 disabled:bg-neutral-50"
                value={form.remark}
                onChange={(e) => onChange("remark", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, disabled, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        className="w-full border rounded-xl px-4 py-3 disabled:bg-neutral-50"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      />
    </div>
  )
}
