// src/components/IncidentReportForm.jsx
// ★ ฟอร์มแจ้งเหตุการณ์ — ใช้ร่วมกันทั้ง student และ tutor (แยกด้วย prop `role`)
// ยังไม่มี dropdown เลือกติวเตอร์/คอร์สที่เกี่ยวข้อง (relatedTutorId/relatedCourseId)
// เพราะยังไม่มี endpoint ที่ยืนยันได้ว่าดึงรายชื่อติวเตอร์ของนักเรียนคนนั้นจากไหน — TODO ต่อยอด
import { useState } from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { getStudentCourses } from "../callapi/callusers_student";
import { getCourseSubjects } from "../callapi/callusers";
import {
  AlertTriangle, ShieldAlert, Loader2, Check, EyeOff, Eye, ChevronLeft,
} from "lucide-react";
import {
  INCIDENT_CATEGORIES, getIncidentTypeById, getSeverityMeta, CRITICAL_SAFETY_NOTICE,
} from "../config/incidentTypes";

const API = `${API_URL}/api/incidents`;

// ★ แก้ 401: route นี้บังคับ authRequired ต้องแนบ token เอง
// (ต่างจากหน้าอื่นที่ backend ยังไม่บังคับ auth) ใช้ key เดียวกับทั้งระบบ
const getAuthConfig = () => {
  const token = localStorage.getItem("student_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export default function IncidentReportForm({ role, onClose, showToast }) {
  const [step, setStep] = useState(1); // 1 = เลือกหมวดหมู่, 2 = เลือกประเภทย่อย + กรอกรายละเอียด
  const [categoryKey, setCategoryKey] = useState(null);
  const [incidentTypeId, setIncidentTypeId] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]); // File[] ที่ผู้ใช้เลือก (ยังไม่อัปโหลด)
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { severity } หลังส่งสำเร็จ

  const token = localStorage.getItem("student_token");

  const [relatedCourseId, setRelatedCourseId] = useState("");
  const [relatedTutorId, setRelatedTutorId] = useState("");
  const [relatedStudentId, setRelatedStudentId] = useState("");

  const [myCourses, setMyCourses] = useState([]);           // student: คอร์สที่ลงทะเบียน
  const [courseTutors, setCourseTutors] = useState([]);      // student: ติวเตอร์ในคอร์สที่เลือก
  const [tutorData, setTutorData] = useState({ courses: [], students: [] }); // tutor: คอร์ส+นักเรียนของตัวเอง

  useEffect(() => {
    if (role === "student") {
      getStudentCourses(token).then(setMyCourses).catch(() => setMyCourses([]));
    } else if (role === "tutor") {
      axios.get(`${API_URL}/api/incidents/my-students`, getAuthConfig())
        .then(res => setTutorData(res.data))
        .catch(() => setTutorData({ courses: [], students: [] }));
    }
  }, [role]);

  // student เลือกคอร์สแล้ว → โหลดติวเตอร์ที่สอนคอร์สนั้น
  useEffect(() => {
    if (role !== "student" || !relatedCourseId) { setCourseTutors([]); return; }
    getCourseSubjects(relatedCourseId).then(rows => {
      const seen = new Set();
      const unique = rows.filter(r => r.AdminId && !seen.has(r.AdminId) && seen.add(r.AdminId));
      setCourseTutors(unique);
    }).catch(() => setCourseTutors([]));
    setRelatedTutorId("");
  }, [relatedCourseId, role]);

  const selectedCategory = INCIDENT_CATEGORIES.find(c => c.key === categoryKey);
  const selectedType = incidentTypeId ? getIncidentTypeById(incidentTypeId) : null;
  const previewSeverityMeta = selectedCategory ? getSeverityMeta(selectedCategory.severity) : null;

  const pickCategory = (key) => {
    setCategoryKey(key);
    setIncidentTypeId(null);
    setStep(2);
  };

  const MAX_FILES = 5;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFilesSelected = (fileList) => {
    const incoming = Array.from(fileList);
    const oversized = incoming.find(f => f.size > MAX_SIZE);
    if (oversized) {
      return showToast("error", "ไฟล์ใหญ่เกินไป", `${oversized.name} เกิน 10MB`);
    }
    const combined = [...files, ...incoming].slice(0, MAX_FILES);
    setFiles(combined);
  };

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!incidentTypeId) return showToast("error", "กรุณาเลือกประเภทเหตุการณ์");
    if (description.trim().length < 10) return showToast("error", "กรุณาอธิบายรายละเอียดอย่างน้อย 10 ตัวอักษร");

    setSubmitting(true);
    try {
      const res = await axios.post(API, {
        incidentTypeId,
        isAnonymous,
        description: description.trim(),
        relatedTutorId: relatedTutorId || undefined,
        relatedStudentId: relatedStudentId || undefined,
        relatedCourseId: relatedCourseId || undefined,
      }, getAuthConfig());

      const incidentId = res.data.incidentId;

      if (files.length && incidentId) {
        try {
          const form = new FormData();
          files.forEach(f => form.append("files", f));
          await axios.post(`${API}/${incidentId}/attachments`, form, {
            ...getAuthConfig(),
            headers: { ...getAuthConfig().headers, "Content-Type": "multipart/form-data" },
          });
        } catch (attachErr) {
          // เคสถูกสร้างสำเร็จแล้ว แค่แนบไฟล์ไม่สำเร็จ — แจ้งเตือนแต่ไม่บล็อกผู้ใช้
          showToast("error", "ส่งเรื่องสำเร็จ แต่แนบไฟล์ไม่สำเร็จ", attachErr.response?.data?.message);
        }
      }

      setResult({ severity: res.data.severity || selectedType?.severity });
    } catch (err) {
      showToast("error", "ส่งเรื่องไม่สำเร็จ", err.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── หน้าจอหลังส่งสำเร็จ ──────────────────────────────────────────────────
  if (result) {
    const meta = getSeverityMeta(result.severity);
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center gap-2 py-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="font-bold text-slate-900">ส่งเรื่องแจ้งเหตุการณ์เรียบร้อยแล้ว</h3>
          <p className="text-sm text-slate-500">ทีมงานจะดำเนินการตรวจสอบและติดตามเรื่องนี้ให้</p>
        </div>

        {meta.requiresImmediateWarning && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 leading-relaxed">{CRITICAL_SAFETY_NOTICE}</p>
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition text-sm">
          ปิดหน้าต่าง
        </button>
      </div>
    );
  }

  // ── Step 1: เลือกหมวดหมู่ ────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">เลือกหมวดหมู่ที่ใกล้เคียงกับสิ่งที่ต้องการแจ้งมากที่สุด</p>
        {INCIDENT_CATEGORIES.map(cat => {
          const meta = getSeverityMeta(cat.severity);
          const Icon = meta.icon;
          return (
            <button key={cat.key} onClick={() => pickCategory(cat.key)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition hover:shadow-sm ${meta.bg} ${meta.border} hover:ring-2`}>
              <div className={`h-10 w-10 rounded-xl ${meta.solidBg} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${meta.text}`}>{cat.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {cat.types.map(t => t.label).join(" · ")}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Step 2: เลือกประเภทย่อย + กรอกรายละเอียด ────────────────────────────
  return (
    <div className="space-y-5">
      <button onClick={() => setStep(1)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-600 transition">
        <ChevronLeft className="h-3.5 w-3.5" /> เปลี่ยนหมวดหมู่
      </button>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${previewSeverityMeta.bg} ${previewSeverityMeta.border} border`}>
        <previewSeverityMeta.icon className={`h-4 w-4 ${previewSeverityMeta.text}`} />
        <span className={`text-xs font-bold ${previewSeverityMeta.text}`}>{selectedCategory.label}</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
          ประเภทเหตุการณ์ <span className="text-red-400 normal-case">*</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {selectedCategory.types.map(t => (
            <button key={t.id} onClick={() => setIncidentTypeId(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${incidentTypeId === t.id
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300"
                }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
          รายละเอียด <span className="text-red-400 normal-case">*</span>
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="อธิบายเหตุการณ์ที่เกิดขึ้น วันเวลา และรายละเอียดที่เกี่ยวข้อง..."
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition resize-none"
        />
        <p className="text-[11px] text-slate-400 mt-1">{description.trim().length}/10 ตัวอักษรขั้นต่ำ</p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
          เกี่ยวข้องกับใคร/คอร์สไหน (ถ้ามี)
        </label>

        {role === "student" && (
          <>
            <select
              value={relatedCourseId}
              onChange={e => setRelatedCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">ไม่ระบุคอร์ส</option>
              {myCourses.map(c => {
                const id = c.courseId ?? c.CourseId ?? c.CourseID ?? c.id;
                const name = c.courseName ?? c.CourseName ?? c.name;
                return <option key={id} value={id}>{name}</option>;
              })}
            </select>

            {relatedCourseId && (
              <select
                value={relatedTutorId}
                onChange={e => setRelatedTutorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">ไม่ระบุติวเตอร์</option>
                {courseTutors.map(t => (
                  <option key={t.AdminId} value={t.AdminId}>
                    {t.Nickname || `${t.Firstname} ${t.Lastname}`}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        {role === "tutor" && (
          <>
            <select
              value={relatedCourseId}
              onChange={e => {
                setRelatedCourseId(e.target.value);
                setRelatedStudentId("");
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">ไม่ระบุคอร์ส</option>
              {tutorData.courses.map(c => (
                <option key={c.CourseID} value={c.CourseID}>
                  {c.CourseName}
                </option>
              ))}
            </select>

            <select
              value={relatedStudentId}
              onChange={e => setRelatedStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">ไม่ระบุนักเรียน</option>
              {tutorData.students
                .filter(s => !relatedCourseId || String(s.CourseID) === String(relatedCourseId))
                .map(s => (
                  <option key={`${s.UserId}-${s.CourseID}`} value={s.UserId}>
                    {s.Nickname || `${s.Firstname} ${s.Lastname}`}
                  </option>
                ))}
            </select>
          </>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
          แนบหลักฐาน (ถ้ามี)
        </label>

        <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition">
          <span className="text-xs text-slate-500 font-medium">
            คลิกเพื่อเลือกไฟล์ หรือลากมาวาง
          </span>

          <span className="text-[10px] text-slate-400 mt-0.5">
            JPG, PNG, WEBP, PDF · สูงสุด {MAX_FILES} ไฟล์ · ไม่เกิน 10MB/ไฟล์
          </span>

          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={(e) =>
              e.target.files.length && handleFilesSelected(e.target.files)
            }
          />
        </label>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <span className="truncate max-w-[140px] text-slate-600">
                  {f.name}
                </span>

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <ChevronLeft className="hidden" />
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
        <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-orange-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            {isAnonymous ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            แจ้งแบบไม่เปิดเผยตัวตน
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            {role === "tutor" ? "นักเรียน" : "ติวเตอร์/คู่กรณี"}จะไม่เห็นว่าใครเป็นผู้แจ้ง
            แต่ทีมแอดมินจะยังเห็นข้อมูลของคุณเสมอเพื่อใช้ติดตามเคส
          </p>
        </div>
      </label>

      {previewSeverityMeta.requiresImmediateWarning && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-3 flex gap-2.5">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">
            เรื่องนี้จัดอยู่ในระดับความปลอดภัย ระบบจะแจ้งเตือนทีมงานให้ตรวจสอบโดยด่วน
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={onClose} disabled={submitting}
          className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition text-sm">
          ยกเลิก
        </button>
        <button onClick={submit} disabled={submitting || !incidentTypeId}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition text-sm shadow-sm">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> ส่งเรื่อง</>}
        </button>
      </div>
    </div>
  );
}