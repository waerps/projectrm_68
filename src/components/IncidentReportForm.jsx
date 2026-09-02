// src/components/IncidentReportForm.jsx
// ★ ฟอร์มแจ้งเหตุการณ์ — ใช้ร่วมกันทั้ง student และ tutor (แยกด้วย prop `role`)
// ยังไม่มี dropdown เลือกติวเตอร์/คอร์สที่เกี่ยวข้อง (relatedTutorId/relatedCourseId)
// เพราะยังไม่มี endpoint ที่ยืนยันได้ว่าดึงรายชื่อติวเตอร์ของนักเรียนคนนั้นจากไหน — TODO ต่อยอด
import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import {
  AlertTriangle, ShieldAlert, Loader2, Check, EyeOff, Eye, ChevronLeft,
} from "lucide-react";
import {
  INCIDENT_CATEGORIES, getIncidentTypeById, getSeverityMeta, CRITICAL_SAFETY_NOTICE,
} from "../config/incidentTypes";

const API = `${API_URL}/api/incidents`;

export default function IncidentReportForm({ role, onClose, showToast }) {
  const [step, setStep] = useState(1); // 1 = เลือกหมวดหมู่, 2 = เลือกประเภทย่อย + กรอกรายละเอียด
  const [categoryKey, setCategoryKey] = useState(null);
  const [incidentTypeId, setIncidentTypeId] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { severity } หลังส่งสำเร็จ

  const selectedCategory = INCIDENT_CATEGORIES.find(c => c.key === categoryKey);
  const selectedType = incidentTypeId ? getIncidentTypeById(incidentTypeId) : null;
  const previewSeverityMeta = selectedCategory ? getSeverityMeta(selectedCategory.severity) : null;

  const pickCategory = (key) => {
    setCategoryKey(key);
    setIncidentTypeId(null);
    setStep(2);
  };

  const submit = async () => {
    if (!incidentTypeId) return showToast("error", "กรุณาเลือกประเภทเหตุการณ์");
    if (description.trim().length < 10) return showToast("error", "กรุณาอธิบายรายละเอียดอย่างน้อย 10 ตัวอักษร");

    setSubmitting(true);
    try {
      const res = await axios.post(API, {
        incidentTypeId,
        isAnonymous,
        description: description.trim(),
        // relatedTutorId / relatedStudentId / relatedCourseId: ยังไม่ส่ง — TODO ต่อยอด
      });
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
          return (
            <button key={cat.key} onClick={() => pickCategory(cat.key)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition hover:shadow-sm ${meta.bg} ${meta.border} hover:${meta.ring} hover:ring-2`}>
              <span className="text-2xl shrink-0">{meta.emoji}</span>
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
        <span>{previewSeverityMeta.emoji}</span>
        <span className={`text-xs font-bold ${previewSeverityMeta.text}`}>{selectedCategory.label}</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
          ประเภทเหตุการณ์ <span className="text-red-400 normal-case">*</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {selectedCategory.types.map(t => (
            <button key={t.id} onClick={() => setIncidentTypeId(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                incidentTypeId === t.id
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