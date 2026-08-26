import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Video, FileText, Trophy, ChevronRight, Loader2 } from "lucide-react";
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
        setSubjects(Array.isArray(subjs) ? subjs : []);
      } catch (err) {
        console.error("Error loading subjects:", err);
        if (!cancelled) setError(typeof err === "string" ? err : err?.message || "โหลดรายวิชาไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, token]);

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

  return (
    <div className="space-y-6 mt-[90px] max-w-3xl mx-auto px-4">
      <div>
        <p className="text-sm text-neutral-500">{courseName}</p>
        <h1 className="text-2xl font-bold text-neutral-900">เลือกวิชาที่ต้องการเรียน</h1>
      </div>

      <div className="space-y-3">
        {subjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-neutral-200 text-neutral-400">
            ยังไม่มีวิชาในคอร์สนี้
          </div>
        ) : subjects.map((subj) => {
          const videoPct = subj.totalVideos ? Math.round((subj.watchedVideos / subj.totalVideos) * 100) : 0;
          const attendPct = subj.totalSessions ? Math.round((subj.attendedSessions / subj.totalSessions) * 100) : 0;

          return (
            <button
              key={subj.subjectId}
              onClick={() => navigate(`/profile/course/${courseId}/subject/${subj.subjectId}`)}
              className="w-full flex items-center gap-4 bg-white border-2 border-neutral-200 hover:border-orange-400 rounded-2xl p-5 text-left transition"
            >
              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-neutral-900">{subj.subjectName}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> {subj.watchedVideos}/{subj.totalVideos} คลิป ({videoPct}%)</span>
                  <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {subj.totalFiles} ไฟล์</span>
                  <span>{subj.attendedSessions}/{subj.totalSessions} คาบ ({attendPct}%)</span>
                  {subj.latestExam && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <Trophy className="h-3.5 w-3.5" /> {subj.latestExam.score}/{subj.latestExam.maxScore}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-300 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}