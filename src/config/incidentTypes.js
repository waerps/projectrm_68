// src/config/incidentTypes.js
// ★ ฐานร่วมของระบบ Incident Report — ใช้ทั้งฝั่ง Report Form (student/tutor)
// และ Admin Incident Center ห้าม hardcode severity/สี/label ซ้ำที่อื่น
// ★ ฝั่ง backend มี mirror เป็น CommonJS (routes/config/incidentTypes.js) ต้อง sync คู่กัน

export const SEVERITY = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };
  
  export const SEVERITY_RANK = {
    [SEVERITY.CRITICAL]: 0,
    [SEVERITY.HIGH]: 1,
    [SEVERITY.MEDIUM]: 2,
    [SEVERITY.LOW]: 3,
  };
  
  export const SEVERITY_META = {
    [SEVERITY.CRITICAL]: {
      label: "Critical", labelTh: "วิกฤต", emoji: "🔴",
      bg: "bg-red-50", text: "text-red-700", border: "border-red-200",
      solidBg: "bg-red-600", ring: "ring-red-200", requiresImmediateWarning: true,
    },
    [SEVERITY.HIGH]: {
      label: "High", labelTh: "สูง", emoji: "🟠",
      bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200",
      solidBg: "bg-orange-600", ring: "ring-orange-200", requiresImmediateWarning: false,
    },
    [SEVERITY.MEDIUM]: {
      label: "Medium", labelTh: "ปานกลาง", emoji: "🟡",
      bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200",
      solidBg: "bg-amber-500", ring: "ring-amber-200", requiresImmediateWarning: false,
    },
    [SEVERITY.LOW]: {
      label: "Low", labelTh: "ทั่วไป", emoji: "🟢",
      bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",
      solidBg: "bg-emerald-500", ring: "ring-emerald-200", requiresImmediateWarning: false,
    },
  };
  
  export const INCIDENT_CATEGORIES = [
    {
      key: "safety", label: "ความปลอดภัย", severity: SEVERITY.CRITICAL,
      types: [
        { id: "assault", label: "ทำร้ายร่างกาย" },
        { id: "harassment_sexual", label: "ลวนลาม / คุกคามทางเพศ" },
        { id: "threat", label: "ข่มขู่ / คุกคามความปลอดภัย" },
      ],
    },
    {
      key: "serious_conduct", label: "พฤติกรรมร้ายแรง", severity: SEVERITY.HIGH,
      types: [
        { id: "bullying", label: "กลั่นแกล้ง" },
        { id: "inappropriate_speech", label: "พูดจาไม่เหมาะสม" },
        { id: "harassment_general", label: "การคุกคาม (ไม่ใช่ทางเพศ)" },
      ],
    },
    {
      key: "learning_service", label: "การเรียน / บริการ", severity: SEVERITY.MEDIUM,
      types: [
        { id: "tutor_no_show", label: "ติวเตอร์ไม่มาตามนัด" },
        { id: "teaching_issue", label: "การสอนมีปัญหา / สอนไม่เข้าใจ" },
        { id: "service_issue", label: "ปัญหาการให้บริการอื่นๆ" },
      ],
    },
    {
      key: "suggestion", label: "ข้อเสนอแนะ", severity: SEVERITY.LOW,
      types: [
        { id: "room_request", label: "ขอปรับห้องเรียน" },
        { id: "feature_request", label: "ขอเพิ่มฟีเจอร์ในระบบ" },
        { id: "general_feedback", label: "ข้อเสนอแนะทั่วไป" },
      ],
    },
  ];
  
  export const INCIDENT_TYPES = INCIDENT_CATEGORIES.flatMap((cat) =>
    cat.types.map((t) => ({ ...t, categoryKey: cat.key, categoryLabel: cat.label, severity: cat.severity }))
  );
  
  export const getIncidentTypeById = (id) => INCIDENT_TYPES.find((t) => t.id === id) || null;
  export const getSeverityMeta = (severity) => SEVERITY_META[severity] || SEVERITY_META[SEVERITY.LOW];
  
  export const sortBySeverityThenTime = (list, dateKey = "Created_at") =>
    [...list].sort((a, b) => {
      const rankDiff = SEVERITY_RANK[a.Severity] - SEVERITY_RANK[b.Severity];
      if (rankDiff !== 0) return rankDiff;
      return new Date(b[dateKey]) - new Date(a[dateKey]);
    });
  
  export const CRITICAL_SAFETY_NOTICE =
    "⚠️ เรื่องนี้เกี่ยวข้องกับความปลอดภัยและควรได้รับการดูแลโดยผู้รับผิดชอบโดยเร็ว หากมีอันตรายเกิดขึ้นในขณะนี้ กรุณาติดต่อผู้ปกครอง/ผู้ดูแลสถาบันหรือหน่วยฉุกเฉินที่เหมาะสมทันที";