// src/pages/TutorApply.jsx
import { useState } from "react"
import { applyTutor } from "../callapi/callusers"

function formatPhone(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

function isValidPhone(value) {
  return /^0\d{2}-\d{3}-\d{4}$/.test(value)
}

export default function TutorApply() {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    nickname: "",
    phone: "",
    line: "",
    occupation: "",
    resume: null,
    consent: false,
  })
  const [submitting, setSubmitting] = useState(false)

  const onChange = (e) => {
    const { name, value, files, type, checked } = e.target
    if (name === "resume") {
      setForm((p) => ({ ...p, resume: files?.[0] ?? null }))
    } else if (name === "phone") {
      setForm((p) => ({ ...p, phone: formatPhone(value) }))
    } else if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }))
    } else {
      setForm((p) => ({ ...p, [name]: value }))
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstname || !form.lastname || !form.phone) {
      alert("กรุณากรอก ชื่อจริง, นามสกุล และ เบอร์โทรศัพท์")
      return
    }
    if (!isValidPhone(form.phone)) {
      alert("รูปแบบเบอร์โทรไม่ถูกต้อง (ตัวอย่าง 098-888-8888)")
      return
    }
    if (!form.consent) {
      alert("กรุณายินยอมให้เก็บข้อมูลส่วนบุคคล (PDPA) ก่อนส่งใบสมัคร")
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("firstname", form.firstname)
      fd.append("lastname", form.lastname)
      fd.append("nickname", form.nickname)
      fd.append("phone", form.phone)
      fd.append("line", form.line)
      fd.append("occupation", form.occupation)
      fd.append("consent", form.consent ? "true" : "false")
      if (form.resume) fd.append("resume", form.resume)

      await applyTutor(fd)
      alert("ส่งใบสมัครเรียบร้อย! ✅")
    } catch (err) {
      console.error(err)
      const msg = err?.response?.data?.message || "เกิดข้อผิดพลาดในการส่งใบสมัคร กรุณาลองใหม่อีกครั้ง"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 pb-16 pt-28">
      <h1 className="mb-10 text-center text-4xl font-extrabold text-neutral-900 mt-15">
        สมัครเป็นติวเตอร์
      </h1>

      <form
        onSubmit={onSubmit}
        className="mx-auto rounded-3xl bg-white p-6 shadow-sm sm:p-10"
      >
        {/* Firstname / Lastname */}
        <div className="mb-5 flex flex-col gap-5 sm:flex-row">
          <input
            name="firstname"
            value={form.firstname}
            onChange={onChange}
            placeholder="ชื่อจริง"
            className="w-full rounded-2xl bg-neutral-100 px-5 py-4 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            name="lastname"
            value={form.lastname}
            onChange={onChange}
            placeholder="นามสกุล"
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
            placeholder="เบอร์โทรติดต่อ (098-888-8888)"
            inputMode="numeric"
            className="w-full rounded-2xl bg-neutral-100 px-5 py-4 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Line */}
        <div className="mb-5">
          <input
            name="line"
            value={form.line}
            onChange={onChange}
            placeholder="ID Line"
            className="w-full rounded-2xl bg-neutral-100 px-5 py-4 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Occupation */}
        <div className="mb-8">
          <input
            name="occupation"
            value={form.occupation}
            onChange={onChange}
            placeholder="อาชีพ"
            className="w-full rounded-2xl bg-neutral-100 px-5 py-4 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Upload */}
        <label className="mb-2 block text-sm font-medium text-neutral-600">
          อัปโหลด Resume
        </label>
        <div className="mb-6 rounded-2xl bg-neutral-100 p-6">
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-12">
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

        {/* PDPA Consent */}
        <div className="mb-8 flex items-start gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            checked={form.consent}
            onChange={onChange}
            className="mt-1 h-4 w-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-400"
          />
          <label htmlFor="consent" className="text-sm text-neutral-600">
            ข้าพเจ้ายินยอมให้บริษัทเก็บ รวบรวม และใช้ข้อมูลส่วนบุคคลที่ให้ไว้ข้างต้น
            เพื่อวัตถุประสงค์ในการพิจารณาสมัครงาน ตามนโยบายความเป็นส่วนตัวของบริษัท
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !form.consent}
          className="mx-auto block w-full rounded-2xl bg-orange-500 py-4 text-center text-white shadow-lg transition hover:bg-orange-700 disabled:opacity-60 sm:w-2/3"
        >
          {submitting ? "กำลังส่งใบสมัคร..." : "ยืนยันการสมัคร"}
        </button>
      </form>
    </div>
  )
}