import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronRight, FileQuestion, Users, Clock } from "lucide-react";

import {
  EXAM_TYPES,
  TYPE_BADGE,
  STATUS_BADGE,
  deriveStatus,
  fetchExams,
} from "../utils/examShared";

function Badge({ className, children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
// Responsibility: show the 3 Exams (Pre/Mid/Post) that belong to the selected
// Subject, and let the tutor jump into TutorExamDetail.jsx to manage one.
// This page never creates a new Exam — Pre/Mid/Post already exist by design;
// the backend seeds the DB rows the first time this Subject is opened.

export default function TutorExam() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const courseId = searchParams.get("courseId");
  const subjectId = searchParams.get("subjectId");
  const courseName = searchParams.get("courseName") || "";
  const subjectName = searchParams.get("subjectName") || "";

  const adminId = JSON.parse(localStorage.getItem("user") || "null")?.id;

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId || !subjectId || !adminId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchExams({ courseId, subjectId, adminId })
      .then((data) => { if (!cancelled) setExams(data); })
      .catch((err) => { console.error("Error fetching exams:", err); if (!cancelled) setError("โหลดข้อมูลการสอบไม่สำเร็จ"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId, subjectId, adminId]);

  const handleManage = (exam) => {
    const params = new URLSearchParams({
      courseId: courseId || "",
      subjectId: subjectId || "",
      courseName,
      subjectName,
      examId: exam.id,
    });
    navigate(`/tutor/exam-detail?${params.toString()}`);
  };

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm flex-wrap gap-y-1">
        <Link to="/tutor/courses" className="font-medium text-gray-500 hover:text-orange-600 transition">
          คอร์ส
        </Link>
        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-800">{subjectName || "จัดการการสอบ"}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          จัดการการสอบ{subjectName ? ` — ${subjectName}` : ""}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {courseName} {subjectName ? `• ${subjectName}` : ""}
        </p>
      </div>

      {loading && <p className="text-sm text-neutral-400">กำลังโหลดข้อมูลการสอบ...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Exam Cards — Pre / Mid / Post, always exist for this Subject */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const meta = EXAM_TYPES.find((t) => t.value === exam.type);
            const status = deriveStatus(exam);
            const sb = STATUS_BADGE[status];
            const qCount = exam.questionCount || 0;

            return (
              <button
                key={exam.id}
                onClick={() => handleManage(exam)}
                className={`text-left bg-white rounded-2xl border-2 p-5 transition hover:shadow-md ${status === "active" ? "border-green-300" : "border-neutral-200 hover:border-orange-200"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge className={TYPE_BADGE[exam.type]}>{meta?.label}</Badge>
                  <Badge className={sb.cls}>
                    {status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                    {sb.label}
                  </Badge>
                </div>

                <p className="text-sm text-neutral-400 mb-4">{meta?.sub}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <FileQuestion className="h-4 w-4 text-neutral-400" />
                    {qCount} ข้อ
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    {exam.settings?.duration || 0} นาที
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 col-span-2">
                    <Users className="h-4 w-4 text-neutral-400" />
                    {status === "active" || status === "closed" ? "ดูรายชื่อในหน้าจัดการ" : "ยังไม่เปิดสอบ"}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                  <span className="text-sm font-semibold text-orange-600">
                    {qCount > 0 ? "จัดการข้อสอบ" : "เริ่มเพิ่มข้อสอบ"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-orange-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}