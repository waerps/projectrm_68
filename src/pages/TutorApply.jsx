// src/pages/TutorApply.jsx
import { useState } from "react"

export default function TutorApply() {
  const [form, setForm] = useState({
    fullname: "",
    nickname: "",
    phone: "",
    line: "",
    resume: null,
  })
  const [submitting, setSubmitting] = useState(false)

  const onChange = (e) => {
    const { name, value, files } = e.target
    if (name === "resume") {
      setForm((p) => ({ ...p, resume: files?.[0] ?? null }))
    } else {
      setForm((p) => ({ ...p, [name]: value }))
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullname || !form.phone) {
      alert("กรุณากรอก ชื่อจริง-นามสกุล และ เบอร์โทรศัพท์")
      return
    }
    setSubmitting(true)
    // จุดเชื่อมต่อ API จริง (FormData) — ใส่ตามระบบของคุณ
    // const fd = new FormData()
    // Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""))
    // await fetch("/api/apply-tutor", { method: "POST", body: fd })

    setTimeout(() => {
      setSubmitting(false)
      alert("ส่งใบสมัครเรียบร้อย! ✅")
    }, 700)
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 pb-16 pt-28 mt-15">
      <h1 className="mb-10 text-center text-4xl font-extrabold text-neutral-900">
        สมัครเป็นติวเตอร์
      </h1>

      <form
        onSubmit={onSubmit}
        className="mx-auto rounded-3xl bg-white p-6 shadow-sm sm:p-10"
      >
        {/* Fullname */}
        <div className="mb-5">
          <input
            name="fullname"
            value={form.fullname}
            onChange={onChange}
            placeholder="ชื่อจริง นามสกุล"
            className="w-full rounded-2xl bg-neutral-100 px-5 py-4 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Nickname */}
        <div className="mb-5">
          <input
            name="nickname"
            value={form.nickname}
            onChange={onChange}
            placeholder="ชื่อเล่น"
            className="w-full rounded-2xl bg-neutral-100 px-5 py-4 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Phone */}
        <div className="mb-5">
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="เบอร์โทรติดต่อ"
            className="w-full rounded-2xl bg-neutral-100 px-5 py-4 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Line */}
        <div className="mb-8">
          <input
            name="line"
            value={form.line}
            onChange={onChange}
            placeholder="ID Line"
            className="w-full rounded-2xl bg-neutral-100 px-5 py-4 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Upload */}
        <label className="mb-2 block text-sm font-medium text-neutral-600">
          อัปโหลด Resume
        </label>
        <div className="mb-8 rounded-2xl bg-neutral-100 p-6">
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-12">
            <div className="text-4xl">☁️⬆️</div>
            <div className="text-sm text-neutral-500">ลากไฟล์มาวาง หรือกดเพื่อเลือกไฟล์</div>
            <input
              name="resume"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={onChange}
              className="mt-2 text-sm"
            />
            {form.resume && (
              <div className="mt-2 text-xs text-neutral-600">
                เลือกไฟล์: <span className="font-medium">{form.resume.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="mx-auto block w-full rounded-2xl bg-orange-500 py-4 text-center text-white shadow-lg transition hover:bg-orange-700 disabled:opacity-60 sm:w-2/3"
        >
          {submitting ? "กำลังส่งใบสมัคร..." : "ยืนยันการสมัคร"}
        </button>
      </form>
    </div>
  )
}
