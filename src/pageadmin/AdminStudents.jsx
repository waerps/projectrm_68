import { API_URL } from "../config";
import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  Users, Plus, Search, Edit2, Trash2, X, Check, Eye, EyeOff,
  Phone, BookOpen, ChevronLeft, ChevronRight, Loader2,
  AlertTriangle, KeyRound, GraduationCap, School,
  CheckCircle, XCircle, Video, Calendar, BarChart2,
  PlayCircle, Clock, Shield,
  ChevronDown, ChevronUp, ArrowLeft,
  Award, TrendingUp, TrendingDown, Minus,   // ★ เพิ่ม
} from "lucide-react";

const API = `${API_URL}/api/admin`;
const ITEMS_PER_PAGE = 12;

// ─── FIX #6: ใช้ UserId เป็น seed แทนชื่อ เพื่อไม่ให้ avatar เปลี่ยนเมื่อแก้ชื่อ
const avatarUrl = (userId) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=student_${userId}&backgroundColor=dbeafe`;

// ─── FIX #8: handle format วันที่ที่หลากหลาย
const formatDate = (d) => {
  if (!d) return "—";
  try {
    const date = new Date(d.includes("T") ? d : d + "T00:00:00");
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
  } catch { return "—"; }
};

// ─── FIX #8: handle calcAge ให้ปลอดภัยกว่าเดิม
const calcAge = (dob) => {
  if (!dob) return null;
  try {
    const today = new Date();
    const b = new Date(dob.includes("T") ? dob : dob + "T00:00:00");
    if (isNaN(b.getTime())) return null;
    let age = today.getFullYear() - b.getFullYear();
    if (today.getMonth() < b.getMonth() ||
      (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--;
    return age >= 0 && age < 150 ? age : null;
  } catch { return null; }
};


// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, icon: Icon, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col w-full ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
          <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <Icon className="h-4 w-4 text-white" />
              </span>
            )}
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── StudentForm ───────────────────────────────────────────────────────────────
function StudentForm({ initial = {}, onSave, onCancel, isSubmitting, gradeLevels, genders, showToast }) {
  const isEdit = !!initial.UserId;
  const stripSchool = s => (s || "").replace(/^โรงเรียน\s*/, "");
  const [form, setForm] = useState({
    firstname: initial.Firstname || initial.firstname || "",
    lastname: initial.Lastname || initial.lastname || "",
    nickname: initial.Nickname || initial.nickname || "",
    phoneNo: initial.PhoneNo || initial.phoneNo || "",
    schoolName: stripSchool(initial.SchoolName || initial.schoolName || ""),
    lineId: initial.LineID || initial.lineId || "",
    birthOfDate: initial.BirthOfDate || initial.birthOfDate || "",
    remark: initial.Remark || initial.remark || "",
    gpa: initial.GPA || initial.gpa || "",
    gradeLevelId: initial.GradeLevelId || initial.gradeLevelId || "",
    genderId: initial.GenderId || initial.genderId || "",
    username: initial.Username || initial.username || "",
    password: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.firstname.trim() || !form.lastname.trim()) return alert("กรุณากรอกชื่อ-นามสกุล");
    if (!isEdit && (!form.username.trim() || !form.password.trim())) return alert("กรุณากรอก Username และ Password");
    onSave({
      ...form,
      schoolName: form.schoolName.trim() ? `โรงเรียน${form.schoolName.trim()}` : "",
    });
  };

  const formatGPA = (raw) => {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 3); // เก็บแค่ตัวเลข ไม่เกิน 3 หลัก
    if (digits.length === 0) return "";
    const formatted = digits.length === 1 ? digits : `${digits[0]}.${digits.slice(1)}`;
    if (parseFloat(formatted) > 4) return "4.00"; // กันไม่ให้เกิน 4.00 ตั้งแต่กำลังพิมพ์
    return formatted;
  };

  const formatPhone = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
  };

  const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition";
  const lbl = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  const [courses, setCourses] = useState([]); // ★ ใหม่: คอร์สที่นักเรียนคนนี้ลงทะเบียนอยู่

  const loadCourses = () => {
    if (!isEdit) return;
    axios.get(`${API}/students/${initial.UserId}`).then(r => setCourses(r.data.courses || []));
  };
  useEffect(() => { loadCourses(); }, [initial.UserId]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ชื่อ <span className="text-red-400 normal-case">*</span></label>
          <input className={inp} value={form.firstname} onChange={e => set("firstname", e.target.value)} placeholder="ชื่อจริง" />
        </div>
        <div>
          <label className={lbl}>นามสกุล <span className="text-red-400 normal-case">*</span></label>
          <input className={inp} value={form.lastname} onChange={e => set("lastname", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ชื่อเล่น</label>
          <input className={inp} value={form.nickname || ""} onChange={e => set("nickname", e.target.value)} />
        </div>
        <div>
          <label className={lbl}>เบอร์โทร</label>
          <input
            className={inp}
            value={form.phoneNo || ""}
            onChange={e => set("phoneNo", formatPhone(e.target.value))}
            placeholder="098-xxx-xxxx"
            inputMode="numeric"
          />
        </div>
      </div>
      <div>
        <label className={lbl}>โรงเรียน</label>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-orange-500">
          <span className="pl-3 pr-1 text-sm text-slate-500 select-none">โรงเรียน</span>
          <input className="flex-1 px-1 py-2 bg-transparent text-sm outline-none"
            value={form.schoolName || ""} onChange={e => set("schoolName", e.target.value)}
            placeholder="เทศบาลสวนสนุก" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Line ID</label>
          <input className={inp} value={form.lineId || ""} onChange={e => set("lineId", e.target.value)} />
        </div>
        <div>
          <label className={lbl}>วันเกิด</label>
          <input type="date" className={inp} value={form.birthOfDate?.slice(0, 10) || ""} onChange={e => set("birthOfDate", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={lbl}>ระดับชั้น</label>
          <select className={inp} value={form.gradeLevelId || ""} onChange={e => set("gradeLevelId", e.target.value)}>
            <option value="">ไม่ระบุ</option>
            {gradeLevels.map(g => <option key={g.GradeLevelId} value={g.GradeLevelId}>{g.GradeDetail}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>เพศ</label>
          <select className={inp} value={form.genderId || ""} onChange={e => set("genderId", e.target.value)}>
            <option value="">ไม่ระบุ</option>
            {genders.map(g => <option key={g.GenderId} value={g.GenderId}>{g.GenderName}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>GPA</label>
          <input
            type="text" inputMode="decimal" className={inp}
            value={form.gpa || ""}
            onChange={e => set("gpa", formatGPA(e.target.value))}
            onBlur={e => {
              if (!e.target.value) return;
              let n = parseFloat(e.target.value);
              if (isNaN(n)) return set("gpa", "");
              n = Math.min(4, Math.max(0, n));
              set("gpa", n.toFixed(2));
            }}
            placeholder="0.00"
            maxLength={4}
          />
        </div>
      </div>
      <div>
        <label className={lbl}>หมายเหตุ</label>
        <textarea className={inp} rows={2} value={form.remark || ""} onChange={e => set("remark", e.target.value)} />
      </div>

      {isEdit && (
        <div>
          <label className={lbl}>Username</label>
          <input
            className={inp + " bg-slate-100 text-slate-500 cursor-not-allowed"}
            value={form.username}
            disabled
            readOnly
          />
          <p className="text-[11px] text-slate-400 mt-1">ไม่สามารถแก้ไข Username ได้</p>
        </div>
      )}

      {!isEdit && (
        <div className="border border-orange-100 rounded-xl p-4 space-y-3 bg-orange-50/50">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> ข้อมูลเข้าสู่ระบบ
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Username <span className="text-red-400 normal-case">*</span></label>
              <input className={inp} value={form.username} onChange={e => set("username", e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label className={lbl}>Password <span className="text-red-400 normal-case">*</span></label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} className={inp + " pr-10"}
                  value={form.password} onChange={e => set("password", e.target.value)} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEdit && (
        <div>
          <label className={lbl}>คอร์สที่ลงทะเบียน</label>
          <AddCourseToStudent
            studentId={initial.UserId}
            enrolledCourseIds={new Set(courses.map(c => String(c.CourseID)))}
            onAdded={loadCourses}
            showToast={showToast}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {courses.map(c => (
              <span key={c.CourseID} className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-semibold">
                {c.CourseName}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await axios.delete(`${API}/enroll/${c.EnrollId}`);
                      loadCourses();
                    } catch (err) {
                      alert(err.response?.data?.message || "ลบไม่สำเร็จ");
                    }
                  }}
                  className="text-orange-400 hover:text-red-500 transition"
                  title="นำออกจากคอร์ส"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} disabled={isSubmitting}
          className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
          ยกเลิก
        </button>
        <button onClick={submit} disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition text-sm shadow-sm">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> บันทึก</>}
        </button>
      </div>
    </div>
  );
}

// ─── ResetPasswordModal (FIX #11: เพิ่ม UI รีเซ็ตรหัสผ่านที่หายไป) ───────────
function ResetPasswordModal({ student, onClose }) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const inp = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition";

  const submit = async () => {
    if (!pwd.trim()) return alert("กรุณากรอกรหัสผ่านใหม่");
    setLoading(true);
    try {
      await axios.patch(`${API}/students/${student.UserId}/reset-password`, { newPassword: pwd });
      alert("รีเซ็ตรหัสผ่านสำเร็จ");
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <KeyRound className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">รีเซ็ตรหัสผ่าน</h3>
            <p className="text-xs text-slate-400">{student.Nickname || `${student.Firstname} ${student.Lastname}`}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mb-4">
          <input type={show ? "text" : "password"} value={pwd}
            onChange={e => setPwd(e.target.value)}
            className={inp + " pr-10"} placeholder="รหัสผ่านใหม่" autoComplete="new-password" />
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
            ยกเลิก
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 disabled:opacity-50 transition">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยัน"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCourseToStudent({ studentId, enrolledCourseIds, onAdded, showToast }) {
  const [allCourses, setAllCourses] = useState([]);
  const [adding, setAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { axios.get(`${API}/courses`).then(r => setAllCourses(r.data)); }, []);

  // ★ เพิ่ม: กรองเฉพาะคอร์สที่เปิดรับสมัคร(1) หรือกำลังสอน(2)
  const available = allCourses.filter(c =>
    !enrolledCourseIds.has(String(c.CourseID)) &&
    [1, 2].includes(Number(c.Status_Course_Id))
  );
  const filtered = available.filter(c => !search || c.CourseName?.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const remove = (id) => setSelectedIds(p => p.filter(x => x !== id));
  const toggleAll = () => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(c => String(c.CourseID)));

  const selectedCourses = selectedIds
    .map(id => allCourses.find(c => String(c.CourseID) === id))
    .filter(Boolean);

  const handleAdd = async () => {
    if (!selectedIds.length) return showToast("error", "กรุณาเลือกคอร์สอย่างน้อย 1 คอร์ส");
    setSaving(true);
    try {
      const res = await axios.post(`${API}/enroll/bulk`, { UserIds: [studentId], CourseIDs: selectedIds });
      const { success = [], skipped = [], failed = [] } = res.data;
      let msg = `เพิ่มสำเร็จ ${success.length} คอร์ส`;
      if (skipped.length) msg += ` · ข้าม ${skipped.length} คอร์ส (ลงทะเบียนแล้ว)`;
      if (failed.length) msg += ` · ล้มเหลว ${failed.length} คอร์ส`;
      showToast(failed.length && !success.length ? "error" : "success", msg, failed[0]?.message);
      setSelectedIds([]); setAdding(false); setSearch("");
      onAdded();
    } catch (e) {
      showToast("error", e.response?.data?.message || "เกิดข้อผิดพลาด", e.response?.data?.error);
    } finally {
      setSaving(false);
    }
  };

  if (!adding) {
    return (
      <button onClick={() => setAdding(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition mb-3">
        <Plus className="h-3.5 w-3.5" /> เพิ่มคอร์สให้นักเรียน
      </button>
    );
  }

  return (
    <div className="mb-3 bg-orange-50 border border-orange-100 rounded-xl overflow-hidden">
      {/* ★ ใหม่: รายชื่อคอร์สที่เลือกไว้แล้ว พร้อมปุ่ม X เอาออก */}
      {selectedCourses.length > 0 && (
        <div className="divide-y divide-orange-100 border-b border-orange-200 bg-white">
          {selectedCourses.map(c => (
            <div key={c.CourseID} className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 text-sm font-medium text-slate-800 truncate">{c.CourseName}</span>
              <button
                type="button"
                onClick={() => remove(String(c.CourseID))}
                className="text-red-400 hover:text-red-600 transition shrink-0"
                title="เอาออก"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        <input type="text" placeholder="ค้นหาคอร์ส..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400" />
        <button onClick={toggleAll} className="text-[11px] font-bold text-orange-600 hover:text-orange-700 whitespace-nowrap">
          {selectedIds.length === filtered.length && filtered.length > 0 ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
        </button>
      </div>

      {/* ★ เพิ่ม: บอกให้รู้ว่ากรองอะไรอยู่ */}
      <p className="px-3 -mt-1 pb-1 text-[11px] text-slate-400">แสดงเฉพาะคอร์สที่เปิดรับสมัครหรือกำลังสอนอยู่</p>

      <div className="max-h-48 overflow-y-auto px-3 space-y-1 pb-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">ไม่พบคอร์สที่สามารถเพิ่มได้</p>
        ) : filtered.map(c => {
          const id = String(c.CourseID);
          const checked = selectedIds.includes(id);
          return (
            <label key={id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm transition ${checked ? "bg-orange-100" : "hover:bg-white"}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="accent-orange-500" />
              <span className="flex-1 font-medium text-slate-700 truncate">{c.CourseName}</span>
            </label>
          );
        })}
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-orange-100">
        <span className="text-xs text-slate-500 flex-1">เลือกแล้ว {selectedIds.length} คอร์ส</span>
        <button onClick={handleAdd} disabled={saving || !selectedIds.length}
          className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 disabled:opacity-50 transition flex items-center gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} เพิ่ม
        </button>
        <button onClick={() => { setAdding(false); setSelectedIds([]); setSearch(""); }}
          className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── StudentDetailModal ────────────────────────────────────────────────────────
function StudentDetailModal({ studentId, onClose, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("courses");
  const [error, setError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null); // ★ ใหม่

  const loadDetail = () => {
    setError(null); setLoading(true);
    return axios.get(`${API}/students/${studentId}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSelectedCourseId(null);
    setTab("courses");
    loadDetail();
  }, [studentId]);

  if (loading) return (
    <Modal title="ข้อมูลนักเรียน" icon={Eye} onClose={onClose} wide>
      <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
    </Modal>
  );

  if (error) return (
    <Modal title="เกิดข้อผิดพลาด" icon={AlertTriangle} onClose={onClose}>
      <p className="text-sm text-red-500">{error}</p>
    </Modal>
  );

  if (!data) return null;

  const { student: s, courses, attendance, videoProgress, examScores = [] } = data;
  const displayName = s.Nickname || `${s.Firstname} ${s.Lastname}`;

  // ── ภาพรวมทั้งหมด (ไม่กรองคอร์ส) สำหรับ header การ์ดบนสุด ──────────────
  const totalClasses = attendance.length;
  const attended = attendance.filter(a => a.Status === "1").length;
  const attRate = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;
  const attColor = attRate >= 80 ? "text-emerald-600" : attRate >= 60 ? "text-amber-500" : "text-red-500";
  const attBarColor = attRate >= 80 ? "bg-emerald-500" : attRate >= 60 ? "bg-amber-400" : "bg-red-500";

  const watchedVideos = videoProgress.filter(v => v.WatchPercent >= 100).length;
  const totalVideos = videoProgress.length;

  // ── ข้อมูลกรองตามคอร์สที่เลือก (ใช้ในทุก tab ยกเว้น "courses") ──────────
  const selectedCourse = courses.find(c => String(c.CourseID) === String(selectedCourseId));
  const cAttendance = selectedCourseId ? attendance.filter(a => String(a.CourseID) === String(selectedCourseId)) : [];
  const cVideos = selectedCourseId ? videoProgress.filter(v => String(v.CourseID) === String(selectedCourseId)) : [];
  const cScores = selectedCourseId ? examScores.filter(e => String(e.CourseID) === String(selectedCourseId)) : [];

  const cAttended = cAttendance.filter(a => a.Status === "1").length;
  const cAttRate = cAttendance.length ? Math.round((cAttended / cAttendance.length) * 100) : 0;
  const cWatched = cVideos.filter(v => v.WatchPercent >= 100).length;

  // ── รวมคะแนนสอบเป็นรายวิชา (pre/mid/post = ExamTypeId 1/2/3) ────────────
  const scoresBySubject = {};
  cScores.forEach(e => {
    if (!e.MaxScore || e.MaxScore <= 0) return;
    const key = e.SubjectName || "ไม่ระบุวิชา";
    if (!scoresBySubject[key]) scoresBySubject[key] = { pre: [], mid: [], post: [] };
    const pct = Math.round((e.Score / e.MaxScore) * 100);
    const typeId = String(e.ExamTypeId);
    if (typeId === "1") scoresBySubject[key].pre.push(pct);
    else if (typeId === "2") scoresBySubject[key].mid.push(pct);
    else if (typeId === "3") scoresBySubject[key].post.push(pct);
  });
  const avg = arr => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
  const subjectSummaries = Object.entries(scoresBySubject).map(([subject, v]) => {
    const pre = avg(v.pre), mid = avg(v.mid), post = avg(v.post);
    const improvement = pre !== null && post !== null ? post - pre : null;
    return { subject, pre, mid, post, improvement };
  });

  const trendOf = (imp) => imp > 0 ? "up" : imp < 0 ? "down" : "stable";
  const trendIcon = (t) =>
    t === "up" ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> :
      t === "down" ? <TrendingDown className="h-3.5 w-3.5 text-red-500" /> :
        <Minus className="h-3.5 w-3.5 text-amber-500" />;
  const trendColor = (t) =>
    t === "up" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
      t === "down" ? "bg-red-50 text-red-600 border-red-200" :
        "bg-amber-50 text-amber-700 border-amber-200";

  const TABS = [
    { key: "courses", label: "คอร์สที่ลง", count: courses.length },
    { key: "attendance", label: "ประวัติเรียน", count: cAttendance.length },
    { key: "videos", label: "วิดีโอ", count: cVideos.length },
    { key: "scores", label: "คะแนนสอบ", count: subjectSummaries.length },      // ★ ใหม่
    { key: "overview", label: "ภาพรวม", count: null },                          // ★ ใหม่
  ];

  // ── ข้อความเตือนเมื่อยังไม่เลือกคอร์ส ────────────────────────────────
  const NeedCourseNotice = () => (
    <div className="text-center py-10">
      <p className="text-slate-400 text-sm mb-3">กรุณาเลือกคอร์สก่อน เพื่อดูรายละเอียดของคอร์สนั้น</p>
      <button onClick={() => setTab("courses")}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition">
        <BookOpen className="h-3.5 w-3.5" /> ไปเลือกคอร์ส
      </button>
    </div>
  );

  return (
    <Modal title={`ข้อมูลนักเรียน: ${displayName}`} icon={Eye} onClose={onClose} wide>
      {/* Profile Card */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gradient-to-br from-orange-600 to-amber-700 rounded-2xl text-white">
        {/* เอาเครื่องหมาย / ออกจากท้าย div นี้ และให้ครอบ img แทน */}
        <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-md shrink-0">
          <img src={avatarUrl(s.UserId)} alt={displayName} className="w-full h-full object-contain" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-orange-200">{s.Firstname} {s.Lastname}</p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {s.GradeDetail && <span className="bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">{s.GradeDetail}</span>}
            {s.SchoolName && <span className="bg-white/15 text-orange-100 px-2 py-0.5 rounded-full">{s.SchoolName}</span>}
            {s.PhoneNo && <span className="bg-white/15 text-orange-100 px-2 py-0.5 rounded-full">{s.PhoneNo}</span>}
            {s.GPA && <span className="bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">GPA {s.GPA}</span>}
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
            <p className="text-xs text-orange-200">เข้าเรียน (รวม)</p>
            <p className="text-xl font-black text-white">{attRate}%</p>
            <p className="text-[10px] text-orange-300">{attended}/{totalClasses} คาบ</p>
          </div>
          <div className="bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
            <p className="text-xs text-orange-200">วิดีโอ (รวม)</p>
            <p className="text-xl font-black text-white">{watchedVideos}</p>
            <p className="text-[10px] text-orange-300">/{totalVideos} คลิป</p>
          </div>
        </div>
      </div>


      {/* คอร์สที่เลือกอยู่ (breadcrumb เล็กๆ) */}
      {selectedCourse && tab !== "courses" && (
        <div className="flex items-center gap-2 mb-4 text-xs">
          <span className="text-slate-400">กำลังดูคอร์ส:</span>
          <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-semibold">
            {selectedCourse.CourseName}
          </span>
          <button onClick={() => setTab("courses")}
            className="flex items-center gap-1 text-slate-400 hover:text-orange-600 transition">
            <ArrowLeft className="h-3 w-3" /> เปลี่ยนคอร์ส
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.key ? "bg-white shadow text-orange-600" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
            {t.count !== null && (
              <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-orange-100 text-orange-600" : "bg-slate-200 text-slate-500"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: คอร์สที่ลงทะเบียน — คลิกเพื่อเลือกดูรายละเอียด */}
      {tab === "courses" && (
        <div className="space-y-3">
          <AddCourseToStudent
            studentId={s.UserId}
            enrolledCourseIds={new Set(courses.map(c => String(c.CourseID)))}
            onAdded={loadDetail}
            showToast={showToast}
          />
          {courses.length === 0 ? (
            <p className="text-center text-slate-400 py-8">ยังไม่มีคอร์สที่ลงทะเบียน</p>
          ) : courses.map(c => {
            const rate = c.TotalClassHeld > 0 ? Math.round((c.TotalAttended / c.TotalClassHeld) * 100) : null;
            const rColor = !rate ? "bg-slate-300" : rate >= 80 ? "bg-emerald-500" : rate >= 60 ? "bg-amber-400" : "bg-red-500";
            const isSelected = String(selectedCourseId) === String(c.CourseID);
            return (
              <div key={c.EnrollId}
                onClick={() => { setSelectedCourseId(c.CourseID); setTab("attendance"); }}
                className={`bg-slate-50 rounded-xl p-4 border flex flex-col md:flex-row gap-3 cursor-pointer transition hover:border-orange-300 hover:shadow-sm ${isSelected ? "border-orange-300 ring-1 ring-orange-200" : "border-slate-200"}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{c.CourseName}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full font-semibold border ${c.Status_Course_Name === "กำลังสอน" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      c.Status_Course_Name === "ปิดคอร์ส" ? "bg-slate-100 text-slate-500 border-slate-200" :
                        "bg-amber-100 text-amber-700 border-amber-200"
                      }`}>{c.Status_Course_Name}</span>
                    <span className="bg-white border px-2 py-0.5 rounded-full text-slate-500">
                      {formatDate(c.StartDate)} – {formatDate(c.LastDate)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${c.Status_Enroll_Name === "ชำระเงินแล้ว" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>{c.Status_Enroll_Name}</span>
                  </div>
                </div>
                {rate !== null && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-black ${rate >= 80 ? "text-emerald-600" : rate >= 60 ? "text-amber-500" : "text-red-500"}`}>
                        {rate}%
                      </p>
                      <p className="text-[10px] text-slate-400">{c.TotalAttended}/{c.TotalClassHeld} คาบ</p>
                    </div>
                    <div className="h-10 w-2 bg-slate-200 rounded-full overflow-hidden flex items-end">
                      <div className={`w-full rounded-full ${rColor}`} style={{ height: `${rate}%` }} />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`นำ "${c.CourseName}" ออกจากคอร์สของนักเรียนคนนี้?`)) return;
                    try {
                      await axios.delete(`${API}/enroll/${c.EnrollId}`);
                      loadDetail();
                    } catch (err) {
                      showToast("error", err.response?.data?.message || "ลบไม่สำเร็จ");
                    }
                  }}
                  className="shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="นำออกจากคอร์ส"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: ประวัติเข้าเรียน (กรองตามคอร์ส) */}
      {tab === "attendance" && (
        !selectedCourseId ? <NeedCourseNotice /> : (
          <div>
            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-medium">อัตราการเข้าเรียนในคอร์สนี้</span>
                <span className={`font-black ${cAttRate >= 80 ? "text-emerald-600" : cAttRate >= 60 ? "text-amber-500" : "text-red-500"}`}>
                  {cAttRate}% ({cAttended}/{cAttendance.length} คาบ)
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${cAttRate >= 80 ? "bg-emerald-500" : cAttRate >= 60 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${cAttRate}%` }} />
              </div>
            </div>
            {cAttendance.length === 0 ? (
              <p className="text-center text-slate-400 py-8">ยังไม่มีข้อมูลการเข้าเรียนในคอร์สนี้</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs">
                      <th className="text-left px-4 py-3 font-semibold">วันที่</th>
                      <th className="text-left px-4 py-3 font-semibold">คอร์ส / วิชา</th>
                      <th className="text-left px-4 py-3 font-semibold">เวลา</th>
                      <th className="text-center px-4 py-3 font-semibold">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cAttendance.map(a => (
                      <tr key={a.StudentAttendanceId} className={`border-t border-slate-100 ${a.Status === "0" ? "bg-red-50" : "hover:bg-slate-50"}`}>
                        <td className="px-4 py-3 font-medium text-slate-800 text-xs">
                          {formatDate(a.ClassDate || a.AttendanceDate)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          <span className="font-medium">{a.CourseName}</span>
                          {a.SubjectName && <span className="text-slate-400"> · {a.SubjectName}</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{a.StartTime} – {a.EndTime} น.</td>
                        <td className="px-4 py-3 text-center">
                          {a.Status === "1" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                              <CheckCircle className="h-3 w-3" /> มาเรียน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-[11px] font-bold px-2.5 py-1 rounded-full">
                              <XCircle className="h-3 w-3" /> ขาดเรียน
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {/* Tab: วิดีโอ (กรองตามคอร์ส) */}
      {tab === "videos" && (
        !selectedCourseId ? <NeedCourseNotice /> : (
          <div>
            {cVideos.length === 0 ? (
              <p className="text-center text-slate-400 py-8">ยังไม่มีข้อมูลการดูวิดีโอในคอร์สนี้</p>
            ) : (
              <div className="space-y-2">
                {cVideos.map(v => {
                  const done = v.WatchPercent >= 100;
                  return (
                    <div key={v.StudentVideoProgressId} className={`flex items-center gap-3 p-3 rounded-xl border ${done ? "bg-orange-50 border-orange-100" : "bg-slate-50 border-slate-200"}`}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-orange-600" : "bg-slate-300"}`}>
                        <PlayCircle className={`h-5 w-5 ${done ? "text-white" : "text-slate-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${done ? "text-orange-800" : "text-slate-500"}`}>{v.VideoTitle}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                          <span>{v.CourseName}{v.SubjectName && ` · ${v.SubjectName}`}</span>
                          {v.WatchDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />ดูเมื่อ {formatDate(v.WatchDate)}</span>}
                        </div>
                        {!done && v.WatchPercent > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${v.WatchPercent}%` }} />
                            </div>
                            <span className="text-[10px] text-orange-500 font-medium">{v.WatchPercent}%</span>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {done ? (
                          <span className="inline-flex items-center gap-1 bg-orange-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3" /> ดูแล้ว
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-500">{v.WatchPercent}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* Tab: คะแนนสอบ (ใหม่) — กรองตามคอร์ส แยกตามวิชา */}
      {tab === "scores" && (
        !selectedCourseId ? <NeedCourseNotice /> : (
          <div className="space-y-3">
            {subjectSummaries.length === 0 ? (
              <p className="text-center text-slate-400 py-8">ยังไม่มีข้อมูลคะแนนสอบในคอร์สนี้</p>
            ) : subjectSummaries.map(sub => {
              const t = trendOf(sub.improvement ?? 0);
              return (
                <div key={sub.subject} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold text-sm text-slate-900">{sub.subject}</span>
                    </div>
                    {sub.improvement !== null && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${trendColor(t)}`}>
                        {trendIcon(t)}
                        {sub.improvement > 0 ? `+${sub.improvement}` : sub.improvement}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "ก่อนเรียน", value: sub.pre },
                      { label: "กลางภาค", value: sub.mid },
                      { label: "หลังเรียน", value: sub.post },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white p-2 rounded-lg text-center border border-slate-200">
                        <p className="text-[10px] text-slate-400 mb-1">{label}</p>
                        <p className="text-sm font-black text-slate-800">{value !== null ? `${value}%` : "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tab: ภาพรวม (ใหม่) */}
      {tab === "overview" && (
        !selectedCourseId ? <NeedCourseNotice /> : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "คาบทั้งหมด", value: cAttendance.length, color: "text-slate-700" },
                { label: "มาเรียน", value: `${cAttended} คาบ`, color: "text-emerald-600" },
                { label: "ขาดเรียน", value: `${cAttendance.length - cAttended} คาบ`, color: "text-red-500" },
                { label: "คลิปดูแล้ว", value: `${cWatched}/${cVideos.length}`, color: "text-orange-600" },
              ].map((st, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">{st.label}</p>
                  <p className={`text-xl font-black ${st.color}`}>{st.value}</p>
                </div>
              ))}
            </div>

            {subjectSummaries.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-slate-800 mb-3">พัฒนาการรายวิชา</p>
                <div className="space-y-2">
                  {subjectSummaries.map(sub => (
                    <div key={sub.subject} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-24 truncate shrink-0">{sub.subject}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${sub.post ?? 0}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-10 text-right">{sub.post !== null ? `${sub.post}%` : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </Modal>
  );
}

// ─── ConfirmDelete ─────────────────────────────────────────────────────────────
function ConfirmDelete({ student, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">ยืนยันการลบนักเรียน</h3>
            <p className="text-xs text-slate-400 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
          <p className="text-sm font-semibold text-red-800">
            {student.Nickname || `${student.Firstname} ${student.Lastname}`}
          </p>
          <p className="text-xs text-red-400 mt-0.5">ID: #{student.UserId}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isDeleting}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
            ยกเลิก
          </button>
          {/* FIX #7: ปุ่ม disable + loading ระหว่าง request */}
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 transition text-sm">
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ลบเลย"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── helper: badge ตามคะแนน ──────────────────────────────────────────────────
function calcStudentBadge(score) {
  if (score >= 90) return { label: 'ดีเยี่ยม', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  if (score >= 80) return { label: 'ดีมาก', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
  if (score >= 70) return { label: 'ดี', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  if (score >= 55) return { label: 'พอใช้', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  return { label: 'ต้องพัฒนา', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
}

// ─── Score Ring SVG ───────────────────────────────────────────────────────────
function StudentScoreRing({ score }) {
  const r = 20, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
  return (
    <svg width="56" height="56" className="shrink-0">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`}
        strokeDashoffset={`${(circ / 4).toFixed(1)}`}
        strokeLinecap="round" />
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="600" fill={color}>{score}</text>
    </svg>
  );
}

// ─── Metric Breakdown (expandable detail) ────────────────────────────────────
function StudentMetricBreakdown({ student }) {
  const hasAny = [student.PreTestScore, student.MidTestScore, student.PostTestScore]
    .some(v => v !== null);

  const metrics = [
    {
      name: 'อัตราการเข้าเรียน',
      raw: student.AttendanceRate,
      weight: student.AttendanceWeight,
      contrib: student.AttendanceContrib,
      sub: `${student.TotalAttended ?? 0} / ${student.TotalClasses ?? 0} คาบ`,
    },
    ...(student.PreTestScore !== null ? [{
      name: 'Pre-test',
      raw: student.PreTestScore,
      weight: student.TestWeight,
      contrib: student.PreTestContrib,
      sub: `คะแนนเฉลี่ย ${student.PreTestScore}%  (${student.PreTestCount} ครั้ง)`,
    }] : []),
    ...(student.MidTestScore !== null ? [{
      name: 'Mid-test',
      raw: student.MidTestScore,
      weight: student.TestWeight,
      contrib: student.MidTestContrib,
      sub: `คะแนนเฉลี่ย ${student.MidTestScore}%  (${student.MidTestCount} ครั้ง)`,
    }] : []),
    ...(student.PostTestScore !== null ? [{
      name: 'Post-test',
      raw: student.PostTestScore,
      weight: student.TestWeight,
      contrib: student.PostTestContrib,
      sub: `คะแนนเฉลี่ย ${student.PostTestScore}%  (${student.PostTestCount} ครั้ง)`,
    }] : []),
  ];

  return (
    <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 space-y-2.5">
      {!hasAny && (
        <p className="text-[11px] text-slate-400 italic">
          ยังไม่มีข้อมูลผลสอบ — คำนวณจากการเข้าเรียนเพียงอย่างเดียว
        </p>
      )}
      {metrics.map(m => {
        const val = m.raw ?? 0;
        const barColor = val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-amber-500' : 'bg-red-500';
        const textColor = val >= 80 ? 'text-emerald-700' : val >= 60 ? 'text-amber-700' : 'text-red-700';
        return (
          <div key={m.name}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-36 shrink-0">
                {m.name}
                <span className="text-[10px] ml-1 text-slate-400">(×{m.weight}%)</span>
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${val}%` }} />
              </div>
              <span className={`text-xs font-semibold w-7 text-right ${textColor}`}>{m.contrib}</span>
            </div>
            <p className="text-[10px] text-slate-400 ml-[9.5rem] mt-0.5">{m.sub}</p>
          </div>
        );
      })}
      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
        <span className="text-xs text-slate-500">คะแนนรวม</span>
        <span className="text-base font-semibold text-slate-800">{student.PerformanceScore} / 100</span>
      </div>
    </div>
  );
}

// ─── StudentScoreCard (แถวแบบ expandable ไม่ใช้ modal) ──────────────────────
function StudentScoreCard({ student, index, expanded, onToggle, onView }) {
  const badge = calcStudentBadge(student.PerformanceScore);
  const MEDAL = ['🥇', '🥈', '🥉'];
  const name = student.Nickname || `${student.Firstname} ${student.Lastname}`;

  return (
    <div className={`bg-white rounded-2xl border transition-all
      ${index === 0 ? 'border-amber-300' : 'border-slate-200'}`}>
      {/* แถวหลัก */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        {/* อันดับ */}
        <span className="text-lg w-6 text-center shrink-0">
          {index < 3
            ? MEDAL[index]
            : <span className="text-xs text-slate-400">{index + 1}</span>}
        </span>

        {/* Avatar */}
        <div className="h-9 w-9 rounded-xl overflow-hidden border border-orange-100 shrink-0">
          <img src={avatarUrl(student.UserId)} alt={name} className="w-full h-full object-contain" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
              ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.label}
            </span>
            {student.GradeDetail && (
              <span className="text-[10px] text-slate-400">{student.GradeDetail}</span>
            )}
            <span className="text-[10px] text-slate-400">{student.TotalClasses} คาบ</span>
          </div>
        </div>

        {/* Score Ring */}
        <StudentScoreRing score={student.PerformanceScore} />

        {/* ปุ่มดูข้อมูลนักเรียน (ไม่ใช้ modal) */}
        <button
          onClick={e => { e.stopPropagation(); onView(student.UserId); }}
          className="shrink-0 p-1.5 rounded-lg bg-orange-50 border border-orange-100
                     text-orange-600 hover:bg-orange-100 transition"
          title="ดูข้อมูลนักเรียน"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>

        {/* Chevron */}
        {expanded
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </div>

      {/* Breakdown (ขยาย inline ไม่ใช้ modal) */}
      {expanded && (
        <div className="px-4 pb-4">
          <StudentMetricBreakdown student={student} />
        </div>
      )}
    </div>
  );
}

// ─── StudentPerformanceRanking (แทน TopAttendanceWidget) ────────────────────
const DEFAULT_LIMIT = 5;

function StudentPerformanceRanking({ onViewStudent, gradeLevels = [] }) {
  const [perfData, setPerfData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterScoreRange, setFilterScoreRange] = useState('all'); // ★ เพิ่ม
  const [showLimit, setShowLimit] = useState(DEFAULT_LIMIT);

  // ★ ช่วงคะแนน อ้างอิงเกณฑ์เดียวกับ calcStudentBadge เพื่อให้ label/สีตรงกับ badge ที่โชว์อยู่
  const SCORE_RANGES = [
    { key: 'excellent', label: 'ดีเยี่ยม (90-100)', test: (v) => v >= 90 },
    { key: 'great', label: 'ดีมาก (80-89)', test: (v) => v >= 80 && v < 90 },
    { key: 'good', label: 'ดี (70-79)', test: (v) => v >= 70 && v < 80 },
    { key: 'fair', label: 'พอใช้ (55-69)', test: (v) => v >= 55 && v < 70 },
    { key: 'needs_work', label: 'ต้องพัฒนา (ต่ำกว่า 55)', test: (v) => v < 55 },
  ];

  useEffect(() => {
    axios.get(`${API}/students/performance`)
      .then(r => setPerfData(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // reset limit เมื่อเปลี่ยน filter
  useEffect(() => {
    setShowLimit(DEFAULT_LIMIT);
    setExpandedId(null);
  }, [filterGrade, filterScoreRange]);

  // กรองตามชั้นปี
  const matchGradeFn = (s) => filterGrade === 'all' || String(s.GradeLevelId) === filterGrade;
  // ★ กรองตามช่วงคะแนน
  const matchScoreFn = (s) => {
    if (filterScoreRange === 'all') return true;
    const range = SCORE_RANGES.find(r => r.key === filterScoreRange);
    return range ? range.test(s.PerformanceScore) : true;
  };

  const filtered = perfData.filter(s => matchGradeFn(s) && matchScoreFn(s));

  // ★ นับจำนวนสำหรับ dropdown ช่วงคะแนน (กรองตามชั้นปีที่เลือกไว้ก่อน)
  const baseForScoreCount = perfData.filter(matchGradeFn);
  const scoreRangeCounts = SCORE_RANGES.reduce((acc, r) => {
    acc[r.key] = baseForScoreCount.filter(s => r.test(s.PerformanceScore)).length;
    return acc;
  }, {});

  // ตัดแสดงตาม limit
  const visible = filtered.slice(0, showLimit);
  const hasMore = filtered.length > showLimit;

  const top3 = filtered.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100
                      bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="h-5 w-5 text-white" />
          <h2 className="font-bold text-white text-sm">Performance Score นักเรียน</h2>
        </div>
        <span className="text-[11px] text-orange-100">เข้าเรียน 40% + Pre/Mid/Post-test 60%</span>
      </div>

      <div className="px-5 pt-4 pb-2 flex items-center gap-2 flex-wrap">
        <div className="relative ml-auto">
          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200
                 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-orange-400
                 focus:border-transparent outline-none transition cursor-pointer"
          >
            <option value="all">ทุกระดับชั้น ({baseForScoreCount.length} คน)</option>
            {gradeLevels.map(g => {
              const cnt = perfData.filter(
                s => String(s.GradeLevelId) === String(g.GradeLevelId) && matchScoreFn(s)
              ).length;
              return (
                <option key={g.GradeLevelId} value={String(g.GradeLevelId)}>
                  {g.GradeDetail} ({cnt} คน)
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4
                            text-slate-400 pointer-events-none" />
        </div>

        {/* ★ เพิ่ม: dropdown กรองตามช่วง Performance Score */}
        <div className="relative">
          <select
            value={filterScoreRange}
            onChange={e => setFilterScoreRange(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200
                 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-orange-400
                 focus:border-transparent outline-none transition cursor-pointer"
          >
            <option value="all">ทุกระดับคะแนน ({baseForScoreCount.length} คน)</option>
            {SCORE_RANGES.map(r => (
              <option key={r.key} value={r.key}>
                {r.label} ({scoreRangeCounts[r.key] || 0} คน)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4
                            text-slate-400 pointer-events-none" />
        </div>

        {/* ปุ่มล้างตัวกรอง — แสดงเมื่อมีตัวกรองใดถูกเลือกอยู่ */}
        {(filterGrade !== 'all' || filterScoreRange !== 'all') && (
          <button
            onClick={() => { setFilterGrade('all'); setFilterScoreRange('all'); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                 text-slate-500 bg-white border border-slate-200 rounded-lg
                 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition"
          >
            <X className="h-3.5 w-3.5" />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="px-5 pb-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm">ไม่มีนักเรียนในระดับชั้นนี้</p>
          </div>
        ) : (
          <>
            {/* ── Podium Top 3 (ของ filtered) ────────────────────── */}
            {filtered.length >= 1 && (
              <div className="grid grid-cols-3 gap-3">
                {[top3[1], top3[0], top3[2]].map((s, i) => (
                  s ? (
                    <div
                      key={s.UserId}
                      className={`rounded-xl border p-3 text-center cursor-pointer hover:shadow-md transition
                        ${i === 1 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-slate-50'}`}
                      style={{ marginTop: i === 0 ? 16 : i === 2 ? 32 : 0 }}
                      onClick={() => onViewStudent(s.UserId)}
                    >
                      <div className="text-2xl">{['🥈', '🥇', '🥉'][i]}</div>
                      <div className="h-10 w-10 rounded-xl overflow-hidden border border-orange-100 mx-auto mt-2">
                        <img src={avatarUrl(s.UserId)}
                          alt={s.Nickname || s.Firstname}
                          className="w-full h-full object-contain" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1.5 truncate">
                        {s.Nickname || `${s.Firstname} ${s.Lastname}`}
                      </p>
                      <p className="text-lg font-black text-slate-900 mt-1">{s.PerformanceScore}</p>
                      <p className="text-[10px] text-slate-400">คะแนน</p>
                    </div>
                  ) : (
                    // ★ เพิ่ม: placeholder เมื่อไม่มีคนในอันดับนี้ — คงเลย์เอาต์ไว้ ไม่ปล่อยโล่ง
                    <div
                      key={`empty-${i}`}
                      className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center"
                      style={{ marginTop: i === 0 ? 16 : i === 2 ? 32 : 0 }}
                    >
                      <div className="text-2xl opacity-30">{['🥈', '🥇', '🥉'][i]}</div>
                      <div className="h-10 w-10 rounded-xl bg-slate-200/60 mx-auto mt-2 flex items-center justify-center">
                        <Users className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-xs font-medium text-slate-400 mt-1.5">ยังไม่มี</p>
                      <p className="text-lg font-black text-slate-300 mt-1">—</p>
                      <p className="text-[10px] text-slate-300">คะแนน</p>
                    </div>
                  )
                ))}
              </div>
            )}


            {/* ── Score Card List ─────────────────────────────────── */}
            <div className="space-y-2">
              {visible.map((s, i) => (
                <StudentScoreCard
                  key={s.UserId}
                  student={s}
                  index={i}
                  expanded={expandedId === s.UserId}
                  onToggle={() => setExpandedId(expandedId === s.UserId ? null : s.UserId)}
                  onView={onViewStudent}
                />
              ))}
            </div>

            {/* ── Show More / Show Less ───────────────────────────── */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-400">
                แสดง <span className="font-semibold text-slate-600">{visible.length}</span> จาก{' '}
                <span className="font-semibold text-slate-600">{filtered.length}</span> คน
              </p>
              <div className="flex gap-2">
                {showLimit > DEFAULT_LIMIT && (
                  <button
                    onClick={() => { setShowLimit(DEFAULT_LIMIT); setExpandedId(null); }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition"
                  >
                    แสดงน้อยลง
                  </button>
                )}
                {hasMore && (
                  <button
                    onClick={() => setShowLimit(v => v + DEFAULT_LIMIT)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold
                               text-orange-600 bg-orange-50 border border-orange-200
                               rounded-lg hover:bg-orange-100 transition"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    แสดงเพิ่มอีก {Math.min(DEFAULT_LIMIT, filtered.length - showLimit)} คน
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const { toasts, showToast, removeToast } = useToast(); //alert ต่างๆ
  const [students, setStudents] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [genders, setGenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterEnrolled, setFilterEnrolled] = useState("all"); // ★ เพิ่ม: all | enrolled | not_enrolled
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // FIX #7

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [viewStudentId, setViewStudentId] = useState(null);
  const [resetPwdStudent, setResetPwdStudent] = useState(null); // FIX #11

  const fetchAll = async () => {
    try {
      const [sRes, gRes, genRes] = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/grade-levels`),
        axios.get(`${API}/genders`),
      ]);
      setStudents(sRes.data);
      setGradeLevels(gRes.data);
      setGenders(genRes.data);
    } catch (e) {
      console.error("fetch error:", e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterGrade, filterEnrolled]);

  const handleCreate = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/students`, data);
      showToast("success", "เพิ่มนักเรียนสำเร็จ!");
      setShowAddModal(false);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally { setIsSubmitting(false); }
  };

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.put(`${API}/students/${editingStudent.UserId}`, data);
      showToast("success", "แก้ไขสำเร็จ!", "บันทึกข้อมูลนักเรียนเรียบร้อยแล้ว");
      setEditingStudent(null);
      fetchAll();
    } catch (e) {
      showToast("error", "เกิดข้อผิดพลาด!", e.response?.data?.message);
    } finally { setIsSubmitting(false); }
  };

  // FIX #3: handle GradeLevelId = null อย่างถูกต้อง
  const matchSearchFn = (s) => {
    const name = (s.Nickname || `${s.Firstname} ${s.Lastname}`).toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || (s.SchoolName || "").toLowerCase().includes(q) ||
      String(s.UserId).includes(q) || (s.PhoneNo || "").includes(q);
  };
  const matchGradeFn = (s) => filterGrade === "all" ||
    (s.GradeLevelId != null && String(s.GradeLevelId) === filterGrade);
  const matchEnrolledFn = (s) => filterEnrolled === "all" ||
    (filterEnrolled === "enrolled" ? s.EnrolledCourses > 0 : !s.EnrolledCourses);

  const filtered = students.filter(s => matchSearchFn(s) && matchGradeFn(s) && matchEnrolledFn(s));

  // ★ นับจำนวนสำหรับ dropdown ระดับชั้น (กรองตามค้นหา+สถานะลงทะเบียนที่เลือกไว้ก่อน)
  const baseForGradeCount = students.filter(s => matchSearchFn(s) && matchEnrolledFn(s));
  const allGradeCount = baseForGradeCount.length;
  const gradeCounts = gradeLevels.reduce((acc, g) => {
    acc[g.GradeLevelId] = baseForGradeCount.filter(
      (s) => s.GradeLevelId != null && String(s.GradeLevelId) === String(g.GradeLevelId)
    ).length;
    return acc;
  }, {});

  // ★ นับจำนวนสำหรับ dropdown สถานะลงทะเบียน (กรองตามค้นหา+ระดับชั้นที่เลือกไว้ก่อน)
  const baseForEnrolledCount = students.filter(s => matchSearchFn(s) && matchGradeFn(s));
  const enrolledCount = baseForEnrolledCount.filter(s => s.EnrolledCourses > 0).length;
  const notEnrolledCount = baseForEnrolledCount.filter(s => !s.EnrolledCourses).length;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-orange-600">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลนักเรียน...</p>
    </div>
  );

  // FIX #10: GPA เฉลี่ย คำนวณจากทุก student ที่โหลดมา (client-side ยังโอเคตราบที่ไม่มี server pagination)
  const avgGpa = (() => {
    const g = students.filter(s => s.GPA != null && s.GPA !== "");
    return g.length ? (g.reduce((a, s) => a + Number(s.GPA), 0) / g.length).toFixed(2) : "—";
  })();

  return (
    <div className="space-y-6 mt-[90px]">
      {/* ✅ วางบรรทัดแรกสุดใน return ก่อนทุกอย่าง */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการนักเรียน</h1>
          <p className="text-sm text-slate-500 mt-1">เพิ่ม แก้ไข และดูข้อมูลนักเรียนทั้งหมด</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition text-sm">
          <Plus className="h-4 w-4" /> เพิ่มนักเรียนใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "นักเรียนทั้งหมด", value: students.length, color: "bg-orange-600" },
          { label: "ลงทะเบียนแล้ว", value: students.filter(s => s.EnrolledCourses > 0).length, color: "bg-emerald-500" },
          { label: "ยังไม่ลงทะเบียน", value: students.filter(s => !s.EnrolledCourses).length, color: "bg-amber-500" },

        ].map(({ label, value, color }, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-black text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top 5 Attendance Ranking */}
      <StudentPerformanceRanking
        onViewStudent={(id) => setViewStudentId(id)}
        gradeLevels={gradeLevels}
      />

      {/* Search & Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, ชื่อเล่น, โรงเรียน, เบอร์โทร, ID..."
              className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[160px]">
            <option value="all">ทุกระดับชั้น ({allGradeCount})</option>
            {gradeLevels.map(g => (
              <option key={g.GradeLevelId} value={g.GradeLevelId}>
                {g.GradeDetail} ({gradeCounts[g.GradeLevelId] || 0})
              </option>
            ))}
          </select>
          <select value={filterEnrolled} onChange={e => setFilterEnrolled(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[180px]">
            <option value="all">สถานะลงทะเบียนทั้งหมด ({enrolledCount + notEnrolledCount})</option>
            <option value="enrolled">ลงทะเบียนแล้ว ({enrolledCount})</option>
            <option value="not_enrolled">ยังไม่ลงทะเบียน ({notEnrolledCount})</option>
          </select>
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">แสดง {filtered.length} จาก {students.length} คน</p>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-6xl mb-3">👨‍🎓</div>
          <p className="text-slate-500 font-medium">ไม่พบนักเรียนที่ค้นหา</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">นักเรียน</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">โรงเรียน / ระดับชั้น</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ติดต่อ</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">คอร์ส</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">GPA</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(s => {
                  const displayName = s.Nickname || `${s.Firstname} ${s.Lastname}`;
                  return (
                    <tr key={s.UserId} className="hover:bg-orange-50/40 transition-colors group">
                      {/* คอลัมน์: นักเรียน */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl overflow-hidden bg-orange-50 border border-orange-100 shrink-0">
                            <img src={avatarUrl(s.UserId)} alt={displayName} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{displayName}</p>
                            {s.Nickname && (
                              <p className="text-xs text-slate-400">{s.Firstname} {s.Lastname}</p>
                            )}
                            <p className="text-[10px] text-slate-400">#{s.UserId}</p>
                          </div>
                        </div>
                      </td>

                      {/* คอลัมน์: โรงเรียน / ระดับชั้น */}
                      <td className="px-4 py-3">
                        {s.SchoolName && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                            <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{s.SchoolName}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {s.GradeDetail && (
                            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-semibold">
                              {s.GradeDetail}
                            </span>
                          )}
                          {s.GenderName && (
                            <span className="px-2 py-0.5 bg-pink-50 text-pink-700 border border-pink-200 rounded-full text-[10px] font-semibold">
                              {s.GenderName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* คอลัมน์: ติดต่อ */}
                      <td className="px-4 py-3">
                        {s.PhoneNo && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{s.PhoneNo}</span>
                          </div>
                        )}
                      </td>

                      {/* คอลัมน์: คอร์ส */}
                      <td className="px-4 py-3 text-center">
                        {s.EnrolledCourses > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            <BookOpen className="h-3 w-3" /> {s.EnrolledCourses} คอร์ส
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      {/* คอลัมน์: GPA */}
                      <td className="px-4 py-3 text-center">
                        {s.GPA ? (
                          <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                            {s.GPA}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      {/* คอลัมน์: ปุ่มจัดการ */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewStudentId(s.UserId)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> ดูข้อมูล
                          </button>
                          <button
                            onClick={() => setEditingStudent(s)}
                            className="p-1.5 text-amber-600 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 transition"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setResetPwdStudent(s)}
                            className="p-1.5 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                            title="รีเซ็ตรหัสผ่าน"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(s)}
                            className="p-1.5 text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition"
                            title="ลบ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            แสดง <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> จาก <span className="font-semibold">{filtered.length}</span> คน
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) => p === "..." ? (
                <span key={`d${idx}`} className="flex h-9 w-9 items-center justify-center text-slate-400 text-sm">…</span>
              ) : (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === p ? "bg-orange-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600"}`}>
                  {p}
                </button>
              ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <Modal title="เพิ่มนักเรียนใหม่" icon={Plus} onClose={() => setShowAddModal(false)}>
          <StudentForm onSave={handleCreate} onCancel={() => setShowAddModal(false)}
            isSubmitting={isSubmitting} gradeLevels={gradeLevels} genders={genders} showToast={showToast} />
        </Modal>
      )}
      {editingStudent && (
        <Modal title={`แก้ไขข้อมูลนักเรียน #${editingStudent.UserId}`} icon={Edit2} onClose={() => setEditingStudent(null)}>
          <StudentForm initial={editingStudent} onSave={handleUpdate} onCancel={() => setEditingStudent(null)}
            isSubmitting={isSubmitting} gradeLevels={gradeLevels} genders={genders} showToast={showToast} />
        </Modal>
      )}
      {deletingStudent && (
        <ConfirmDelete student={deletingStudent} onConfirm={handleDelete} onCancel={() => setDeletingStudent(null)} isDeleting={isDeleting} />
      )}
      {viewStudentId && (
        <StudentDetailModal studentId={viewStudentId} onClose={() => setViewStudentId(null)} showToast={showToast} />
      )}
      {/* FIX #11: Reset Password Modal */}
      {resetPwdStudent && (
        <ResetPasswordModal student={resetPwdStudent} onClose={() => setResetPwdStudent(null)} />
      )}
    </div>
  );
}