import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import {
  BookOpen, Plus, Search, Edit2, Trash2, X, Check,
  Calendar, DollarSign, Users, Tag, Filter,
  ChevronLeft, ChevronRight, Loader2, ImagePlus,
  ToggleLeft, ToggleRight, Info, AlertTriangle, Sparkles, Copy,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = `${API_URL}/api/admin`;
const ITEMS_PER_PAGE = 9;

const STATUS_MAP = {
  1: { label: "เปิดรับสมัคร", color: "bg-blue-100 text-blue-700 border-blue-200" },
  2: { label: "กำลังสอน", color: "bg-green-100 text-green-700 border-green-200" },
  3: { label: "ปิดรับสมัคร", color: "bg-amber-100 text-amber-700 border-amber-200" },
  4: { label: "ปิดคอร์ส", color: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

const formatDate = (d) => {
  if (!d) return "ไม่ระบุ";
  const s = String(d).slice(0, 10); // ตัดเอาแค่ "2026-03-15"
  const [y, m, day] = s.split("-").map(Number);
  const date = new Date(y, m - 1, day); // สร้างเป็น local time ไม่มี timezone shift
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
};

const formatPrice = (p) =>
  Number(p).toLocaleString("th-TH", { minimumFractionDigits: 0 });

// ─── Modal Overlay ────────────────────────────────────────────────────────────
function Modal({ onClose, children, title, icon: Icon }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0 bg-gradient-to-r from-orange-50 to-amber-50">
          <h3 className="flex items-center gap-2.5 text-base font-bold text-neutral-800">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 shadow-sm">
                <Icon className="h-4 w-4 text-white" />
              </span>
            )}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:bg-white hover:text-neutral-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ course, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900">ยืนยันการลบคอร์ส</h3>
            <p className="text-xs text-neutral-400 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
          <p className="text-sm font-semibold text-red-800 truncate">{course?.CourseName}</p>
          <p className="text-xs text-red-400 mt-0.5">ID: #{course?.CourseID}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 transition text-sm"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition text-sm"
          >
            ลบเลย
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setErr("ไฟล์ต้องไม่เกิน 5MB");
    setErr(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await axios.post(`${API_URL}/api/admin/upload/image`, fd);
      onChange(res.data.path);
    } catch {
      setErr("อัปโหลดไม่สำเร็จ");
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        className={`relative flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed cursor-pointer transition
          ${uploading ? "border-orange-300 bg-orange-50" : value ? "border-green-300 bg-green-50" : "border-neutral-200 bg-neutral-50 hover:border-orange-300 hover:bg-orange-50"}`}
      >
        {value && !uploading && (
          <img src={getFileUrl(value)} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-25" onError={() => { }} />
        )}
        <div className="relative z-10 flex flex-col items-center gap-1 text-center">
          {uploading
            ? <><Loader2 className="h-7 w-7 text-orange-500 animate-spin" /><p className="text-xs text-orange-500 font-medium">กำลังอัปโหลด...</p></>
            : value
              ? <><Check className="h-7 w-7 text-green-600" /><p className="text-xs text-green-600 font-medium">อัปโหลดแล้ว</p><p className="text-[10px] text-green-400 truncate max-w-[200px]">{value}</p></>
              : <><ImagePlus className="h-7 w-7 text-neutral-400" /><p className="text-xs text-neutral-500 font-medium">คลิกหรือลากไฟล์มาวาง</p><p className="text-[10px] text-neutral-400">JPG, PNG, WEBP · ไม่เกิน 5MB</p></>
          }
        </div>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      {value && !uploading && (
        <button type="button" onClick={() => onChange("")}
          className="text-xs text-neutral-400 hover:text-red-500 transition flex items-center gap-1">
          <X className="h-3.5 w-3.5" /> ลบรูปภาพ
        </button>
      )}
    </div>
  );
}

function CourseSubjects({ courseId, showToast }) {
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ SubjectId: "", AdminId: "", TotalHours: "" });

  const fetchSubjects = async () => {
    const res = await axios.get(`${API_BASE}/courses/${courseId}/subjects`);
    setSubjects(res.data);
  };

  useEffect(() => {
    fetchSubjects();
    Promise.all([
      axios.get(`${API_BASE}/subjects`),
      axios.get(`${API_BASE}/tutors`),
    ]).then(([sRes, tRes]) => {
      setAllSubjects(sRes.data);
      setAllTutors(tRes.data);
    });
  }, [courseId]);

  const handleAdd = async () => {
    if (!newRow.SubjectId || !newRow.AdminId) {
      return showToast("error", "กรุณาเลือกวิชาและติวเตอร์");
    }
    try {
      await axios.post(`${API_BASE}/courses/${courseId}/subjects`, newRow);
      setNewRow({ SubjectId: "", AdminId: "", TotalHours: "" });
      setAdding(false);
      fetchSubjects();
    } catch (e) {
      showToast(
        "error",
        e.response?.data?.message || "เกิดข้อผิดพลาด"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/tutorcoursedetails/${id}`);
      fetchSubjects();
    } catch (e) { alert(e.response?.data?.message || "ลบไม่สำเร็จ"); }
  };

  const inp = "px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none transition";

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">วิชาในคอร์สนี้</p>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition">
            <Plus className="h-3.5 w-3.5" /> เพิ่มวิชา
          </button>
        )}
      </div>

      {subjects.length === 0 && !adding && (
        <p className="text-xs text-neutral-400 text-center py-6">ยังไม่มีวิชาในคอร์สนี้</p>
      )}

      {subjects.map((s) => (
        <div key={s.TutorCourseDetailId} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-100 last:border-0">
          <span className="flex-1 text-sm font-semibold text-neutral-800">{s.SubjectName}</span>
          <span className="text-xs text-neutral-500">{s.Nickname || `${s.Firstname} ${s.Lastname}`}</span>
          <span className="text-xs text-neutral-400 w-16 text-right">{s.TotalHours} ชม.</span>
          <button onClick={() => handleDelete(s.TutorCourseDetailId)}
            className="text-red-400 hover:text-red-600 transition">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {adding && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border-t border-orange-100">
          <select value={newRow.SubjectId} onChange={e => setNewRow(r => ({ ...r, SubjectId: e.target.value }))}
            className={inp + " flex-1"}>
            <option value="">เลือกวิชา</option>
            {allSubjects.map(s => <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>)}
          </select>
          <select value={newRow.AdminId} onChange={e => setNewRow(r => ({ ...r, AdminId: e.target.value }))}
            className={inp + " flex-1"}>
            <option value="">เลือกติวเตอร์</option>
            {allTutors.map(t => <option key={t.AdminId} value={t.AdminId}>{t.Nickname || `${t.Firstname} ${t.Lastname}`}</option>)}
          </select>
          <input type="number" placeholder="ชม." value={newRow.TotalHours}
            onChange={e => setNewRow(r => ({ ...r, TotalHours: e.target.value }))}
            className={inp + " w-20"} />
          <button onClick={handleAdd}
            className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setAdding(false)}
            className="px-3 py-2 bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-300 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function CourseStudents({ courseId, showToast }) {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [adding, setAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    const res = await axios.get(`${API_BASE}/courses/${courseId}/students`);
    setStudents(res.data);
  };

  useEffect(() => {
    fetchStudents();
    axios.get(`${API_BASE}/students`).then(r => setAllStudents(r.data));
  }, [courseId]);

  const enrolledIds = new Set(students.map(s => String(s.UserId)));
  const available = allStudents.filter(s => !enrolledIds.has(String(s.UserId)));

  const handleAdd = async () => {
    if (!selectedUserId) return alert("กรุณาเลือกนักเรียน");
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/enroll`, { UserId: selectedUserId, CourseID: courseId });
      setSelectedUserId(""); setAdding(false);
      fetchStudents(); // อัปเดตรายชื่อในคอร์สทันที ไม่ต้อง refresh
    } catch (e) {
      const msg = e.response?.data?.message || "เกิดข้อผิดพลาด";
      const detail = e.response?.data?.error;
      showToast("error", msg, detail); // ★ ใช้ showToast แทน alert ให้สอดคล้อง UX เดิมของหน้าอื่น ๆ ในระบบ
    }
  };

  const inp = "px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none transition";

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">นักเรียนในคอร์สนี้ ({students.length})</p>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition">
            <Plus className="h-3.5 w-3.5" /> เพิ่มนักเรียน
          </button>
        )}
      </div>

      {students.length === 0 && !adding && (
        <p className="text-xs text-neutral-400 text-center py-6">ยังไม่มีนักเรียนในคอร์สนี้</p>
      )}

      {students.map(s => (
        <div key={s.EnrollId} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-100 last:border-0">
          <span className="flex-1 text-sm font-semibold text-neutral-800">
            {s.Nickname || `${s.Firstname} ${s.Lastname}`}
          </span>
          <span className="text-xs text-neutral-400">#{s.UserId}</span>
        </div>
      ))}

      {adding && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border-t border-orange-100">
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className={inp + " flex-1"}>
            <option value="">เลือกนักเรียน</option>
            {available.map(s => (
              <option key={s.UserId} value={s.UserId}>
                {(s.Nickname || `${s.Firstname} ${s.Lastname}`)} (#{s.UserId})
              </option>
            ))}
          </select>
          <button onClick={handleAdd} disabled={saving}
            className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-50 transition">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => { setAdding(false); setSelectedUserId(""); }}
            className="px-3 py-2 bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-300 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Course Form ─────────────────────────────────────────────────────────────
function CourseForm({ initial = {}, onSave, onCancel, isSubmitting, statusOptions, termOptions, showToast }) {
  const [form, setForm] = useState({
    CourseName: "",
    StartDate: "",
    LastDate: "",
    Price: "",
    Discount: "0",
    Installments: "1",
    VideosFree: "0",
    Remark: "",
    Status_Course_Id: 1,
    Term_Id: 1,
    CourseImage: "",
    ...initial,
  });

  // ★ ใหม่: state สำหรับ pending list เมื่อยังไม่มี CourseID (โหมดสร้างใหม่)
  const [pendingSubjects, setPendingSubjects] = useState([]); // [{SubjectId, AdminId, TotalHours}]
  const [pendingStudents, setPendingStudents] = useState([]); // [UserId, ...]

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const fullCost = Math.max(0, Number(form.Price || 0) - Number(form.Discount || 0));

  const handleSubmit = () => {
    if (!form.CourseName.trim()) return alert("กรุณากรอกชื่อคอร์ส");
    if (!form.StartDate || !form.LastDate) return alert("กรุณากรอกวันเริ่มและวันสิ้นสุด");
    if (new Date(form.StartDate) >= new Date(form.LastDate)) return alert("วันเริ่มสอนต้องมาก่อนวันสิ้นสุด");
    if (Number(form.Price) <= 0) return alert("กรุณากรอกราคาคอร์ส");
    onSave({
      ...form,
      FullCost: fullCost,
      pendingSubjects,
      pendingStudents,
    });
  };

  const inputCls =
    "w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition";
  const labelCls = "block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>ชื่อคอร์ส <span className="text-red-400 normal-case">*</span></label>
        <input
          type="text"
          value={form.CourseName}
          onChange={(e) => set("CourseName", e.target.value)}
          className={inputCls}
          placeholder="เช่น คอร์สรวม (แพ็กเกจ) ป.3 ทั้งหมด 4 วิชา"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>วันเริ่มสอน <span className="text-red-400 normal-case">*</span></label>
          <input type="date" value={form.StartDate?.slice(0, 10) || ""} onChange={(e) => set("StartDate", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>วันสิ้นสุด <span className="text-red-400 normal-case">*</span></label>
          <input type="date" value={form.LastDate?.slice(0, 10) || ""} onChange={(e) => set("LastDate", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>ราคาเต็ม (บาท) <span className="text-red-400 normal-case">*</span></label>
          <input type="number" min="0" value={form.Price}
            onChange={(e) => set("Price", e.target.value)} className={inputCls} placeholder="5900" />
        </div>
        <div>
          <label className={labelCls}>ส่วนลด (บาท)</label>
          <input type="number" min="0" value={form.Discount}
            onChange={(e) => set("Discount", e.target.value)} className={inputCls} placeholder="0" />
        </div>
        <div>
          <label className={labelCls}>ราคาสุทธิ</label>
          <div className="px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm font-bold text-orange-600">
            ฿{formatPrice(fullCost)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>จำนวนงวดผ่อนชำระ</label>
          <input type="number" min="1" value={form.Installments}
            onChange={(e) => set("Installments", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>จำนวนคลิปฟรี</label>
          <input type="number" min="0" value={form.VideosFree}
            onChange={(e) => set("VideosFree", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>สถานะคอร์ส</label>
          <select value={form.Status_Course_Id} onChange={(e) => set("Status_Course_Id", Number(e.target.value))} className={inputCls}>
            {statusOptions.map((s) => <option key={s.Status_Course_Id} value={s.Status_Course_Id}>{s.Status_Course_Name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>เทอม</label>
          <select value={form.Term_Id} onChange={(e) => set("Term_Id", Number(e.target.value))} className={inputCls}>
            {termOptions.map((t) => <option key={t.Term_Id} value={t.Term_Id}>{t.Term_Name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>รูปภาพคอร์ส</label>
        <ImageUpload value={form.CourseImage || ""} onChange={(path) => set("CourseImage", path)} />
      </div>

      <div>
        <label className={labelCls}>หมายเหตุ / รายละเอียดเพิ่มเติม</label>
        <textarea
          value={form.Remark || ""}
          onChange={(e) => set("Remark", e.target.value)}
          className={inputCls}
          rows={3}
          placeholder="รายละเอียดคอร์ส เวลาเรียน ฯลฯ"
        />
      </div>

      <div>
        <label className={labelCls}>วิชาและติวเตอร์</label>
        {initial.CourseID
          ? <CourseSubjects courseId={initial.CourseID} showToast={showToast} />
          : <PendingSubjectPicker items={pendingSubjects} onChange={setPendingSubjects} />}
      </div>

      <div>
        <label className={labelCls}>นักเรียนในคอร์ส</label>
        {initial.CourseID
          ? <CourseStudents courseId={initial.CourseID} showToast={showToast} />
          : <PendingStudentPicker items={pendingStudents} onChange={setPendingStudents} showToast={showToast}/>}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 disabled:opacity-50 transition text-sm"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition text-sm shadow-sm"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> บันทึก</>}
        </button>
      </div>
    </div>
  );
}

function PendingStudentPicker({ items, onChange, showToast}) {
  const [allStudents, setAllStudents] = useState([]);
  const [selected, setSelected] = useState("");
  useEffect(() => { axios.get(`${API_BASE}/students`).then(r => setAllStudents(r.data)); }, []);
  const available = allStudents.filter(s => !items.includes(String(s.UserId)));

  const add = () => {
    if (!selected) {
      return showToast("error", "กรุณาเลือกนักเรียน");
    }
    onChange([...items, selected]);
    setSelected("");
  };
  const remove = (id) => onChange(items.filter(i => i !== id));

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
        <p className="text-xs font-bold text-neutral-600 uppercase">นักเรียนที่จะเพิ่ม ({items.length})</p>
      </div>
      {items.map(id => {
        const st = allStudents.find(s => String(s.UserId) === id);
        return (
          <div key={id} className="flex items-center gap-3 px-4 py-2 border-b border-neutral-100 last:border-0">
            <span className="flex-1 text-sm">{st ? (st.Nickname || `${st.Firstname} ${st.Lastname}`) : `#${id}`}</span>
            <button onClick={() => remove(id)} className="text-red-400 hover:text-red-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      <div className="flex items-center gap-2 px-4 py-3 bg-orange-50">
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="flex-1 px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-sm outline-none">
          <option value="">เลือกนักเรียน</option>
          {available.map(s => <option key={s.UserId} value={String(s.UserId)}>{s.Nickname || `${s.Firstname} ${s.Lastname}`}</option>)}
        </select>
        <button onClick={add} className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────
function CourseCard({ course, onEdit, onDelete, onStatusChange, statusOptions, onDuplicate }) {
  const status = STATUS_MAP[course.Status_Course_Id] || STATUS_MAP[4];
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Cover Image */}
      <div className="relative h-36 bg-gradient-to-br from-orange-50 to-amber-100 overflow-hidden">
        {course.CourseImage && !imgErr ? (
          <img
            src={getFileUrl(course.CourseImage)}
            alt={course.CourseName}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-14 w-14 text-orange-300" />
          </div>
        )}

        <select
          value={course.Status_Course_Id}
          onChange={async (e) => {
            await axios.patch(`${API_BASE}/courses/${course.CourseID}/status`, {
              Status_Course_Id: Number(e.target.value)
            });
            onStatusChange();
          }}
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-black border cursor-pointer ${status.color}`}
          onClick={(e) => e.stopPropagation()}
        >
          {statusOptions.map((s) => (
            <option key={s.Status_Course_Id} value={s.Status_Course_Id}>
              {s.Status_Course_Name}
            </option>
          ))}
        </select>

        {/* Course ID */}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 text-white text-[10px] font-bold rounded-full backdrop-blur-sm">
          #{course.CourseID}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-neutral-900 text-sm leading-snug mb-3 line-clamp-2">
          {course.CourseName}
        </h3>

        <div className="space-y-1.5 text-xs text-neutral-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-orange-400" />
            <span>{formatDate(course.StartDate)} – {formatDate(course.LastDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-green-500 text-sm">฿</span>
            <span className="font-bold text-green-700 text-sm">{formatPrice(course.FullCost || course.Price)} บาท</span>
            {Number(course.Discount) > 0 && (
              <span className="line-through text-neutral-400">{formatPrice(course.Price)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span>{course.StudentCount || 0} นักเรียน</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {course.Term_Name && (
            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-semibold">
              {course.Term_Name}
            </span>
          )}
          {course.VideosFree > 0 && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-semibold">
              ฟรี {course.VideosFree} คลิป
            </span>
          )}
          {course.Subjects && course.Subjects.split(",").map((s) => (
            <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-semibold">
              {s.trim()}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-neutral-100">
          <button
            onClick={() => onEdit(course)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 hover:border-orange-200 transition"
          >
            <Edit2 className="h-3.5 w-3.5" /> แก้ไข
          </button>
          <button
            onClick={() => onDelete(course)}
            className="flex items-center justify-center px-3 py-2 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 hover:border-red-200 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDuplicate(course)}
            className="flex items-center justify-center px-3 py-2 text-xs font-bold text-blue-500 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition"
            title="ทำสำเนาคอร์ส"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCoursesPage() {
  const { toasts, showToast, removeToast } = useToast(); //alert ต่างๆ
  const [courses, setCourses] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [termOptions, setTermOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);

  const fetchAll = async () => {
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        axios.get(`${API_BASE}/courses`),
        axios.get(`${API_BASE}/status-course`),
        axios.get(`${API_BASE}/term`),
      ]);
      setCourses(cRes.data);
      setStatusOptions(sRes.data);
      setTermOptions(tRes.data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterStatus]);

  const handleCreate = async (data) => {
    setIsSubmitting(true);
    const { pendingSubjects = [], pendingStudents = [], ...courseData } = data;
    try {
      const res = await axios.post(`${API_BASE}/courses`, courseData);
      const CourseID = res.data.CourseID;
  
      // ★ ผูกวิชา/นักเรียนที่เลือกไว้ทั้งหมดในรอบเดียว ไม่ต้องเปิด modal ใหม่
      await Promise.all([
        ...pendingSubjects.map(s => axios.post(`${API_BASE}/courses/${CourseID}/subjects`, s)),
        ...pendingStudents.map(UserId => axios.post(`${API_BASE}/enroll`, { UserId, CourseID })),
      ]);
  
      showToast("success", "สร้างคอร์สสำเร็จ พร้อมครูและนักเรียนที่เลือกไว้!");
      setShowAddModal(false);
      fetchAll(); // ปิด modal ทันที ไม่เปิด edit ต่ออัตโนมัติแล้ว เพราะข้อมูลครบในรอบเดียว
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE}/courses/${editingCourse.CourseID}`, data)
      showToast("success", "แก้ไขข้อมูลคอร์สสำเร็จ!");
      setEditingCourse(null);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/courses/${deletingCourse.CourseID}`);
      showToast("success", "ลบข้อมูลคอร์สสำเร็จ!");
      setDeletingCourse(null);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    }
  };

  const handleDuplicate = async (course) => {
    try {
      await axios.post(`${API_BASE}/courses/${course.CourseID}/duplicate`);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    }
  };

  const filtered = courses.filter((c) => {
    const matchSearch =
      search === "" ||
      c.CourseName?.toLowerCase().includes(search.toLowerCase()) ||
      String(c.CourseID).includes(search);
    const matchStatus = filterStatus === "all" || String(c.Status_Course_Id) === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalStudents = [...new Map(courses.map((c) => [c.CourseID, c])).values()]
    .reduce((s, c) => s + Number(c.StudentCount || 0), 0);
  const activeCourses = courses.filter((c) => c.Status_Course_Id === 2).length;

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) pages.push(i);
      else if (i === 2 && currentPage > 3) pages.push("...");
      else if (i === totalPages - 1 && currentPage < totalPages - 2) pages.push("...");
    }
    return pages.filter((p, idx) => pages.indexOf(p) === idx);
  };

  if (loading)
    return (
      <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm font-medium text-neutral-500">กำลังโหลดข้อมูลคอร์ส...</p>
      </div>
    );

  return (
    <div className="space-y-6 mt-[90px]">
      {/* ✅ วางบรรทัดแรกสุดใน return ก่อนทุกอย่าง */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">จัดการคอร์สเรียน</h1>
          <p className="text-sm text-neutral-500 mt-1">เพิ่ม แก้ไข และจัดการคอร์สทั้งหมดในสถาบัน</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition text-sm"
        >
          <Plus className="h-4 w-4" /> เพิ่มคอร์สใหม่
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "คอร์สทั้งหมด", value: courses.length, icon: BookOpen, color: "bg-orange-500" },
          { label: "คอร์สที่กำลังสอน", value: activeCourses, icon: Check, color: "bg-green-500" },
          { label: "นักเรียนที่ลงทะเบียน", value: totalStudents, icon: Users, color: "bg-blue-500" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-neutral-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อคอร์ส หรือ รหัส ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[160px]"
          >
            <option value="all">สถานะทั้งหมด</option>
            {statusOptions.map((s) => (
              <option key={s.Status_Course_Id} value={s.Status_Course_Id}>{s.Status_Course_Name}</option>
            ))}
          </select>

        </div>
        <p className="text-xs text-neutral-400 mt-2 pl-1">
          แสดง {filtered.length} จาก {courses.length} คอร์ส
        </p>
      </div>

      {/* ── Course Grid ── */}
      {paginated.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
          <div className="text-6xl mb-3">📚</div>
          <p className="text-neutral-500 font-medium">ไม่พบคอร์สเรียนที่ค้นหา</p>
          <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {paginated.map((course) => (
            <CourseCard
              key={course.CourseID}
              course={course}
              onEdit={(c) => setEditingCourse(c)}
              onDelete={(c) => setDeletingCourse(c)}
              onStatusChange={fetchAll}
              statusOptions={statusOptions}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            แสดง{" "}
            <span className="font-semibold text-neutral-700">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
            </span>{" "}
            จาก <span className="font-semibold text-neutral-700">{filtered.length}</span> คอร์ส
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={`dots-${idx}`} className="flex h-9 w-9 items-center justify-center text-neutral-400 text-sm">…</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === page
                    ? "bg-orange-500 text-white shadow-sm"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600"
                    }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Add ── */}
      {showAddModal && (
        <Modal title="เพิ่มคอร์สใหม่" icon={Plus} onClose={() => setShowAddModal(false)}>
          <CourseForm
            onSave={handleCreate}
            onCancel={() => setShowAddModal(false)}
            isSubmitting={isSubmitting}
            statusOptions={statusOptions}
            termOptions={termOptions}
            showToast={showToast}
          />
        </Modal>
      )}

      {/* ── Modal: Edit ── */}
      {editingCourse && (
        <Modal title={`แก้ไขคอร์ส #${editingCourse.CourseID}`} icon={Edit2} onClose={() => setEditingCourse(null)}>
          <CourseForm
            initial={editingCourse}
            onSave={handleUpdate}
            onCancel={() => setEditingCourse(null)}
            isSubmitting={isSubmitting}
            statusOptions={statusOptions}
            termOptions={termOptions}
            showToast={showToast}
          />
        </Modal>
      )}

      {/* ── Confirm Delete ── */}
      {deletingCourse && (
        <ConfirmDialog
          course={deletingCourse}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCourse(null)}
        />
      )}
    </div>
  );
}