import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Video, FileText, Trophy, ChevronRight, Loader2, X } from "lucide-react";
import { getCourseBasic, getStudentSubjectsProgress } from "../callapi/callusers_student";

export default function SubjectList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("student_token");

  const [courseName, setCourseName] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) { setError("กรุณาเข้าสู่ระบบใหม่"); setLoading(false); return; }
      if (!courseId) { setError("ไม่พบรหัสคอร์ส"); setLoading(false); return; }
      try {
        setError("");
        const [course, subjs] = await Promise.all([
          getCourseBasic(courseId),
          getStudentSubjectsProgress(token, courseId),
        ]);
        if (cancelled) return;
        setCourseName(course?.CourseName || "คอร์สเรียน");
        const subjectList = Array.isArray(subjs) ? subjs : [];
        setSubjects(subjectList);
        // A course with one subject does not need an extra selection step.
        if (subjectList.length === 1) {
          navigate(`/profile/course/${courseId}/subject/${subjectList[0].subjectId}`, { replace: true });
          return;
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
        if (!cancelled) setError(typeof err === "string" ? err : err?.message || "โหลดรายวิชาไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, token, navigate]);

  if (loading) {
    return (
      <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        กำลังโหลดรายวิชา...
      </div>
    );
  }

  if (error) {
    return <div className="mt-[90px] rounded-xl bg-red-50 p-10 text-center font-medium text-red-600">{error}</div>;
  }

  const closeSubjectPicker = () => navigate(-1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="ปิดหน้าต่างเลือกวิชา"
        className="absolute inset-0 cursor-default bg-neutral-900/50 backdrop-blur-sm"
        onClick={closeSubjectPicker}
      />

      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-neutral-100 px-6 pb-5 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <BookOpen size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900">เลือกวิชา</h1>
                <p className="mt-0.5 text-xs text-neutral-500">เลือกวิชาที่ต้องการเรียน</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeSubjectPicker}
              aria-label="ปิด"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-neutral-50 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-neutral-500">คอร์ส</p>
            <p className="text-sm font-semibold leading-relaxed text-neutral-800">{courseName}</p>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">วิชาในคอร์ส</p>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
              {subjects.length} วิชา
            </span>
          </div>

          <div className="space-y-2.5">
            {subjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400">
                ยังไม่มีวิชาในคอร์สนี้
              </div>
            ) : subjects.map((subj, index) => {
          const videoPct = subj.totalVideos ? Math.round((subj.watchedVideos / subj.totalVideos) * 100) : 0;
          const attendPct = subj.totalSessions ? Math.round((subj.attendedSessions / subj.totalSessions) * 100) : 0;

          return (
            <button
              key={subj.subjectId}
              onClick={() => navigate(`/profile/course/${courseId}/subject/${subj.subjectId}`)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50/50 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-sm font-bold text-neutral-600 transition group-hover:bg-orange-100 group-hover:text-orange-600">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-800 group-hover:text-orange-700">{subj.subjectName || "ไม่ระบุชื่อวิชา"}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1"><Video className="h-3 w-3" /> {subj.watchedVideos}/{subj.totalVideos} คลิป ({videoPct}%)</span>
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {subj.totalFiles} ไฟล์</span>
                  <span>{subj.attendedSessions}/{subj.totalSessions} คาบ ({attendPct}%)</span>
                  {subj.latestExam && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <Trophy className="h-3 w-3" /> {subj.latestExam.score}/{subj.latestExam.maxScore}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-orange-500" />
            </button>
          );
            })}
          </div>
        </div>

        <div className="border-t border-neutral-100 bg-neutral-50/70 px-6 py-4">
          <button
            type="button"
            onClick={closeSubjectPicker}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
