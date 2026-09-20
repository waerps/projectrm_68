import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ExamAnalyticsView } from "../pagetutor/TutorExamAnalytics.jsx";
import { PROGRESS_ORIGINS } from "./progressOrigins";
import { adminExamAnalyticsApi } from "../utils/examShared";

// ─── ภาพรวมพัฒนาการรายวิชา (มุมแอดมิน) ───────────────────────────────────────
// ใช้ ExamAnalyticsView ตัวเดียวกับที่ติวเตอร์ใช้ ไม่ได้ก๊อปโค้ดมาทำใหม่
// เพราะโจทย์คือ "ติวเตอร์เห็นแบบไหน แอดมินต้องเห็นแบบนั้น" ถ้าแยกสองไฟล์
// พอแก้ฝั่งเดียวอีกฝั่งจะค้างอยู่กับของเก่าโดยไม่มีใครรู้
//
// สิ่งที่ต่างออกไปตามบทบาท มีแค่:
//   1) แหล่งข้อมูล — ยิง /api/admin/progress ซึ่งอ่านอย่างเดียว ไม่สร้างแถวข้อสอบ
//      และ backend ตัดข้อความโจทย์ออกก่อนส่งมาเสมอ
//   2) breadcrumb — กลับไปหน้าภาพรวมของแอดมิน ไม่ใช่หน้าคอร์สของติวเตอร์
//   3) ป้ายบอกว่ากำลังดูของติวเตอร์คนไหน และดูได้อย่างเดียวแก้ไม่ได้
//
// ต้องมี tutorId เสมอ เพราะข้อสอบผูกกับติวเตอร์เจ้าของ คอร์ส+วิชาเดียวกัน
// แต่คนละติวเตอร์ = คนละชุดข้อสอบ คนละผลสอบ
export default function AdminExamAnalytics() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const subjectId = searchParams.get("subjectId");
  const tutorId = searchParams.get("tutorId");
  const courseName = searchParams.get("courseName") || "";
  const subjectName = searchParams.get("subjectName") || "";
  const cameFrom = searchParams.get("from");

  const api = useMemo(
    () => (courseId && subjectId && tutorId
      ? adminExamAnalyticsApi({ courseId, subjectId, tutorId })
      : null),
    [courseId, subjectId, tutorId]
  );

  // กลับไปหน้าภาพรวม โดยคงตัวกรองเดิมไว้ ถ้ามาจากการกรองของติวเตอร์คนหนึ่ง
  // กลับไปหน้าภาพรวมโดยคงทั้งตัวกรองและต้นทางเดิมไว้
  const overviewParams = new URLSearchParams();
  if (tutorId) overviewParams.set("tutorId", tutorId);
  if (cameFrom) overviewParams.set("from", cameFrom);
  const qs = overviewParams.toString();
  const backToOverview = `/admin/progress${qs ? `?${qs}` : ""}`;
  const origin = PROGRESS_ORIGINS[cameFrom];

  if (!courseId || !subjectId || !tutorId) {
    return (
      <div className="mt-[90px] text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <div className="text-5xl mb-3">🔎</div>
        <p className="text-slate-500 font-medium">ลิงก์ไม่ครบ ต้องระบุคอร์ส วิชา และติวเตอร์</p>
        <Link to="/admin/progress" className="inline-block mt-3 text-sm font-semibold text-orange-600 hover:underline">
          กลับไปหน้าภาพรวมพัฒนาการ
        </Link>
      </div>
    );
  }

  return (
    <ExamAnalyticsView
      courseId={courseId}
      subjectId={subjectId}
      courseName={courseName}
      subjectName={subjectName}
      api={api}
      breadcrumb={() => (
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm text-slate-400">
          {origin && (
            <>
              <Link to={origin.to} className="hover:text-orange-600 transition font-medium">{origin.label}</Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <Link to={backToOverview} className="hover:text-orange-600 transition font-medium">ภาพรวมพัฒนาการ</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-slate-700">
            {courseName || "คอร์ส"}{subjectName ? ` · ${subjectName}` : ""}
          </span>
        </div>
      )}
    />
  );
}
