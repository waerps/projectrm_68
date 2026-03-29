import { useState, useEffect, useContext } from 'react'
import React from 'react'
import axios from 'axios'
import { Users, Camera, CheckCircle, Clock, X } from 'lucide-react'

// ─── ค่าคงที่ ──────────────────────────────────────────────────────
const DAY_THAI  = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์']
const DAYS_GRID = ['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์']

const SUBJECT_COLOR = (name) => {
  if (name?.includes('คณิต'))    return 'bg-orange-500'
  if (name?.includes('วิทย์'))   return 'bg-blue-500'
  if (name?.includes('อังกฤษ'))  return 'bg-purple-500'
  return 'bg-teal-500'
}

// slotKey ใช้ระบุ slot เดียวกันในทุก state
const slotKey = (day, time) => `${day}||${time}`

// ─── Component ──────────────────────────────────────────────────────
export default function TutorSchedule() {
  const tutorId = 1  // TODO: ดึงจาก Auth Context

  // ── ข้อมูลตาราง ────────────────────────────────────────────────
  const [scheduleMap, setScheduleMap] = useState({})
  const [timeSlots,   setTimeSlots]   = useState([])
  const [loading,     setLoading]     = useState(true)

  // ── State ของ slot แต่ละช่อง ────────────────────────────────────
  // รูปแบบ: { [slotKey]: { phase: 'phase1_done' | 'completed', recordId: number } }
  const [slotPhases, setSlotPhases] = useState({})

  // ── Modal ─────────────────────────────────────────────────────
  const [showModal,     setShowModal]     = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [modalPhase,    setModalPhase]    = useState(1)   // 1 = ต้นคาบ, 2 = ท้ายคาบ

  // ── Phase 1 ────────────────────────────────────────────────────
  const [startPhoto,    setStartPhoto]    = useState(null)
  const [remark,        setRemark]        = useState('')
  const [studentsList,  setStudentsList]  = useState([])
  const [attendance,    setAttendance]    = useState({})

  // ── Phase 2 ────────────────────────────────────────────────────
  const [endPhoto, setEndPhoto] = useState(null)

  const [isSaving, setIsSaving] = useState(false)

  // ── วันและเวลาปัจจุบัน ─────────────────────────────────────────
const currentDate   = new Date()
//const currentDate = new Date('2026-03-27')
  const today         = DAY_THAI[currentDate.getDay()]
  const formattedDate = currentDate.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // ── ดึงตารางสอน ────────────────────────────────────────────────
  useEffect(() => {
    if (!tutorId) return
    const fetchSchedule = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/tutor/${tutorId}/schedule`)
        const map = {}
        DAYS_GRID.forEach(d => { map[d] = {} })
        const timeSet = new Set()
        
        // ✅ เพิ่ม — เก็บ phase จาก API
        const phases = {}
        
        res.data.forEach(item => {
          if (map[item.day]) {
            map[item.day][item.time] = item
            timeSet.add(item.time)
          }
          
          // ✅ เพิ่ม — ถ้ามี phase ให้ set ลง slotPhases เลย
          if (item.recordPhase) {
            const key = slotKey(item.day, item.time)
            phases[key] = { phase: item.recordPhase, recordId: item.recordId }
          }
        })
        
        const sorted = [...timeSet].sort((a, b) => {
          const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m }
          return toMin(a.split('-')[0]) - toMin(b.split('-')[0])
        })
        
        setScheduleMap(map)
        setTimeSlots(sorted)
        setSlotPhases(phases) // ✅ เพิ่ม
      } catch (err) {
        console.error('Error fetching schedule', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [tutorId])

  // ── กดเปิด Modal ───────────────────────────────────────────────
  const handleClick = async (day, time, data) => {
    if (day !== today) return

    const key   = slotKey(day, time)
    const phase = slotPhases[key]

    // ถ้าบันทึกครบแล้ว ไม่ต้องทำอะไร
    if (phase?.phase === 'completed') return

    const cId = data.courseId || data.CourseID
    if (!cId) { alert('ไม่พบรหัสคอร์สเรียน'); return }

    setSelectedClass({ day, time, ...data, courseId: cId })
    setEndPhoto(null)

    // ── Phase 2: ถ่ายรูปท้ายคาบ ────────────────────────────────
    if (phase?.phase === 'phase1_done') {
      setModalPhase(2)
      setShowModal(true)
      return
    }

    // ── Phase 1: ต้นคาบ ────────────────────────────────────────
    setModalPhase(1)
    setStartPhoto(null)
    setRemark('')
    setShowModal(true)

    // ดึงรายชื่อนักเรียน
    try {
      const res      = await axios.get(`http://localhost:3000/courses/${cId}/students`)
      const students = res.data.students || []
      setStudentsList(students)
      const init = {}
      students.forEach(s => { init[s.UserId || s.id] = false })
      setAttendance(init)
    } catch {
      setStudentsList([])
    }
  }

  // ── Phase 1: บันทึกต้นคาบ ──────────────────────────────────────
  const handleSavePhase1 = async () => {
    if (!startPhoto) {
      alert('กรุณาถ่ายรูปต้นคาบก่อนบันทึก')
      return
    }
    if (!selectedClass?.courseScheduleDetailId) {
      alert('ไม่พบข้อมูลคาบเรียน')
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('adminId',               tutorId)
      formData.append('courseScheduleDetailId', selectedClass.courseScheduleDetailId)
      formData.append('remark',                remark)
      formData.append('photoStart',            startPhoto)

      const attendanceArray = studentsList.map(s => {
        const id = s.UserId || s.id
        return { userId: id, status: attendance[id] ? 1 : 0 }
      })
      formData.append('attendanceData', JSON.stringify(attendanceArray))

      // API คืน recordId กลับมาเพื่อใช้ในขั้นที่ 2
      const res = await axios.post(
        'http://localhost:3000/api/tutor/record-teaching/start',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      const key = slotKey(selectedClass.day, selectedClass.time)
      setSlotPhases(prev => ({
        ...prev,
        [key]: { phase: 'phase1_done', recordId: res.data.recordId }
      }))

      closeModal()
      // แจ้งผู้ใช้เบาๆ ไม่ใช่ alert แบบ blocking
      // (ใน production อาจใช้ toast แทน)
      alert('บันทึกต้นคาบแล้ว! อย่าลืมถ่ายรูปท้ายคาบด้วยนะ')
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || 'กรุณาลองใหม่'))
    } finally {
      setIsSaving(false)
    }
  }

  // ── Phase 2: ปิดคาบ ────────────────────────────────────────────
  const handleSavePhase2 = async () => {
    if (!endPhoto) {
      alert('กรุณาถ่ายรูปท้ายคาบก่อนปิดคาบ')
      return
    }

    const key      = slotKey(selectedClass.day, selectedClass.time)
    const recordId = slotPhases[key]?.recordId
    if (!recordId) { alert('ไม่พบข้อมูลการบันทึกต้นคาบ'); return }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('recordId',  recordId)
      formData.append('photoEnd',  endPhoto)

      await axios.put(
        `http://localhost:3000/api/tutor/record-teaching/${recordId}/end`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      setSlotPhases(prev => ({
        ...prev,
        [key]: { ...prev[key], phase: 'completed' }
      }))

      closeModal()
      alert('ปิดคาบเรียบร้อย!')
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || 'กรุณาลองใหม่'))
    } finally {
      setIsSaving(false)
    }
  }

  // ── helpers เช็กชื่อ ───────────────────────────────────────────
  const toggleAttendance = (id) => setAttendance(prev => ({ ...prev, [id]: !prev[id] }))
  const markAllPresent   = (checked) => {
    const r = {}
    studentsList.forEach(s => { r[s.UserId || s.id] = checked })
    setAttendance(r)
  }
  const isAllChecked  = studentsList.length > 0 && studentsList.every(s => attendance[s.UserId || s.id])
  const presentCount  = Object.values(attendance).filter(Boolean).length

  const closeModal = () => {
    setShowModal(false)
    setSelectedClass(null)
    setStartPhoto(null)
    setEndPhoto(null)
    setRemark('')
    setStudentsList([])
    setAttendance({})
  }

  // ── badge สถานะของแต่ละ slot ───────────────────────────────────
  const SlotBadge = ({ day, time }) => {
    const key   = slotKey(day, time)
    const phase = slotPhases[key]?.phase

    if (phase === 'completed')
      return (
        <div className="mt-2 text-[9px] font-black py-1 px-2 rounded-md border text-center uppercase tracking-tighter bg-green-50 text-green-600 border-green-100">
          บันทึกครบแล้ว
        </div>
      )

    if (phase === 'phase1_done')
      return (
        <div className="mt-2 text-[9px] font-black py-1 px-2 rounded-md border text-center uppercase tracking-tighter bg-yellow-50 text-yellow-700 border-yellow-200">
          รอถ่ายรูปท้ายคาบ
        </div>
      )

    return (
      <div className="mt-2 text-[9px] font-black py-1 px-2 rounded-md border text-center uppercase tracking-tighter bg-orange-50 text-orange-600 border-orange-100">
        กดเพื่อบันทึกต้นคาบ
      </div>
    )
  }

  if (!tutorId)  return <div className="mt-[90px] text-center p-10 text-red-500">ไม่พบข้อมูลผู้ใช้</div>
  if (loading)   return <div className="mt-[90px] text-center p-10 text-neutral-500">กำลังโหลดตารางสอน...</div>

  return (
    <div className="space-y-6 mt-[90px] px-4 md:px-0 max-w-[1384px] mx-auto pb-10">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">ตารางสอนของฉัน</h1>
            <p className="text-sm text-neutral-500 mt-1">บันทึกชั่วโมงการสอน</p>
          </div>
          <div className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md self-start md:self-center">
            วันนี้: วัน{today}ที่ {formattedDate}
          </div>
        </div>

        {/* คำอธิบาย 2 ขั้นตอน */}
        <div className="mb-4 flex flex-wrap gap-3">
          {[
            { label: 'ต้นคาบ', desc: 'ถ่ายรูป + เช็กชื่อ', color: 'bg-orange-50 border-orange-200 text-orange-700' },
            { label: 'ท้ายคาบ', desc: 'ถ่ายรูปปิดคาบ',    color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'เสร็จ',  desc: 'บันทึกครบแล้ว',     color: 'bg-green-50  border-green-200  text-green-700' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${s.color}`}>
              <span>{s.emoji}</span>
              <span>{s.label}</span>
              <span className="opacity-60">— {s.desc}</span>
            </div>
          ))}
        </div>

        {/* Grid ตาราง */}
        <div className="bg-neutral-50 rounded-2xl p-4 overflow-x-auto border border-neutral-100">
          <div className="grid grid-cols-8 gap-2 min-w-[1000px]">
            <div className="text-center font-bold text-neutral-400 py-2 text-sm uppercase tracking-wider">เวลา</div>
            {DAYS_GRID.map(d => (
              <div key={d} className={`text-center font-bold py-2 rounded-xl text-sm transition-colors
                ${d === today ? 'bg-orange-500 text-white shadow-sm' : 'text-neutral-700'}`}>
                {d}
              </div>
            ))}

            {timeSlots.map(time => (
              <React.Fragment key={time}>
                <div className="text-center text-xs text-neutral-500 py-4 font-bold flex items-center justify-center border-r border-neutral-200/50">
                  {time}
                </div>
                {DAYS_GRID.map(d => {
                  const cls     = scheduleMap[d]?.[time]
                  const isToday = d === today
                  const key     = slotKey(d, time)
                  const phase   = slotPhases[key]?.phase

                  let cn = 'min-h-[100px] p-2.5 rounded-xl border-2 transition-all duration-300 '
                  if (isToday && cls && phase !== 'completed')
                    cn += 'bg-white border-orange-200 hover:border-orange-500 hover:shadow-lg cursor-pointer transform hover:-translate-y-1'
                  else if (cls && phase === 'completed')
                    cn += 'bg-green-50 border-green-200 cursor-default'
                  else if (cls)
                    cn += 'bg-neutral-100 border-neutral-200 opacity-50 grayscale cursor-not-allowed'
                  else
                    cn += 'bg-transparent border-transparent'

                  return (
                    <div key={d + time} className={cn}
                      onClick={() => isToday && cls && handleClick(d, time, cls)}>
                      {cls ? (
                        <div className="space-y-2">
                          <div className={`${SUBJECT_COLOR(cls.subject)} text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm truncate`}>
                            {cls.subject}
                          </div>
                          <div className="text-[11px] text-neutral-700 font-bold px-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> ห้อง: {cls.room}
                          </div>
                          <div className="text-[11px] text-neutral-500 px-1 font-medium italic">
                            เด็ก: {cls.students}/{cls.maxStudents}
                          </div>
                          {isToday && <SlotBadge day={d} time={time} />}
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

      {/* ════════════════ MODAL ════════════════ */}
      {showModal && selectedClass && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  {modalPhase === 1 ? 'บันทึกต้นคาบ' : 'ถ่ายรูปปิดคาบ'}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">คาบเรียนเวลา {selectedClass.time}</p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black
                  ${modalPhase === 1 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                  {modalPhase === 1 ? '1' : '✓'}
                </div>
                <div className="w-6 h-0.5 bg-neutral-200" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black
                  ${modalPhase === 2 ? 'bg-orange-500 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                  2
                </div>
                <button onClick={closeModal} className="ml-3 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ══ PHASE 1 ══════════════════════════════════ */}
            {modalPhase === 1 && (
              <div className="p-6 space-y-5 overflow-y-auto flex-1">

                {/* Course info */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-5 shadow-md">
                  <h3 className="text-lg font-bold">{selectedClass.subject}</h3>
                  <p className="text-sm opacity-90 font-medium">ห้องเรียน: {selectedClass.room}</p>
                </div>

                {/* ถ่ายรูปต้นคาบ — บังคับ */}
                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Camera className="w-3.5 h-3.5" /> รูปถ่ายต้นคาบ
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <input type="file" accept="image/*" capture="environment"
                      onChange={e => setStartPhoto(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className={`h-24 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors
                      ${startPhoto ? 'border-green-500 bg-green-50' : 'border-neutral-200 group-hover:border-orange-400'}`}>
                      <span className="text-sm font-bold text-neutral-500">
                        {startPhoto ? `${startPhoto.name}` : 'กดเพื่อถ่ายรูปต้นคาบ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* สรุปเนื้อหา */}
                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 block">
                    สรุปเนื้อหาที่จะสอน
                  </label>
                  <textarea rows="2"
                    placeholder="วันนี้จะสอนหัวข้ออะไร..."
                    className="w-full border-2 border-neutral-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none transition-all resize-none"
                    value={remark} onChange={e => setRemark(e.target.value)} />
                </div>

                {/* เช็กชื่อ */}
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      <h3 className="font-bold text-neutral-800">เช็กชื่อนักเรียน</h3>
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                      <input type="checkbox" checked={isAllChecked} onChange={e => markAllPresent(e.target.checked)} className="accent-orange-500 w-4 h-4" />
                      <span className="text-orange-600 font-black uppercase">มาครบทุกคน</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {studentsList.length === 0 ? (
                      <div className="text-center py-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-neutral-400 text-sm">
                        ไม่มีข้อมูลรายชื่อนักเรียน
                      </div>
                    ) : studentsList.map(student => {
                      const sId      = student.UserId || student.id
                      const isPresent = attendance[sId]
                      return (
                        <label key={sId} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer
                          ${isPresent ? 'border-green-500 bg-green-50/50' : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                              ${isPresent ? 'bg-green-500 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <span className={`font-bold text-sm ${isPresent ? 'text-green-700' : 'text-neutral-600'}`}>
                              {student.name}
                            </span>
                          </div>
                          <input type="checkbox" checked={isPresent || false} onChange={() => toggleAttendance(sId)} className="accent-green-600 w-5 h-5" />
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══ PHASE 2 ══════════════════════════════════ */}
            {modalPhase === 2 && (
              <div className="p-6 space-y-5 overflow-y-auto flex-1">

                {/* Reminder */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-800 text-sm">บันทึกต้นคาบแล้ว</p>
                    <p className="text-xs text-green-600 mt-0.5">ข้อมูลเช็กชื่อนักเรียนถูกบันทึกเรียบร้อย ตอนนี้แค่ถ่ายรูปท้ายคาบเพื่อปิดคาบ</p>
                  </div>
                </div>

                {/* Course info */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-5 shadow-md">
                  <h3 className="text-lg font-bold">{selectedClass.subject}</h3>
                  <p className="text-sm opacity-90 font-medium">ห้องเรียน: {selectedClass.room}</p>
                </div>

                {/* ถ่ายรูปท้ายคาบ */}
                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Camera className="w-3.5 h-3.5" /> รูปถ่ายท้ายคาบ
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <input type="file" accept="image/*" capture="environment"
                      onChange={e => setEndPhoto(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors
                      ${endPhoto ? 'border-green-500 bg-green-50' : 'border-neutral-200 group-hover:border-orange-400'}`}>
                      <Camera className={`w-8 h-8 ${endPhoto ? 'text-green-500' : 'text-neutral-300'}`} />
                      <span className="text-sm font-bold text-neutral-500">
                        {endPhoto ? `${endPhoto.name}` : 'กดเพื่อถ่ายรูปท้ายคาบ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* แจ้งเตือนถ้ายังไม่ถ่าย — warning ไม่ใช่ error */}
                {!endPhoto && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      รูปท้ายคาบจำเป็นต้องมีเพื่อยืนยันว่าสอนครบชั่วโมง Admin จะตรวจสอบก่อนอนุมัติรายได้
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer ปุ่ม */}
            <div className="p-6 border-t bg-white">
              {modalPhase === 1 ? (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-400 uppercase">มาเรียนแล้ว</span>
                    <span className="text-2xl font-black text-green-600">{presentCount}</span>
                    <span className="text-sm font-bold text-neutral-400">/ {studentsList.length}</span>
                  </div>
                  <button onClick={handleSavePhase1} disabled={isSaving}
                    className={`w-full md:w-auto px-10 py-3.5 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95
                      ${isSaving ? 'bg-neutral-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'}`}>
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกต้นคาบ'}
                  </button>
                </div>
              ) : (
                <button onClick={handleSavePhase2} disabled={isSaving || !endPhoto}
                  className={`w-full py-3.5 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95
                    ${(isSaving || !endPhoto) ? 'bg-neutral-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}>
                  {isSaving ? 'กำลังบันทึก...' : 'ปิดคาบเรียบร้อย'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}