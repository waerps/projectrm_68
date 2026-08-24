import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, BookOpen, AlertCircle } from "lucide-react";
import axios from "axios";
import { API_URL } from "../config";

export default function TutorExamSubjectSelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const courseId = searchParams.get("courseId");
  const courseNameFromUrl = searchParams.get("courseName") || "";

  const tutorId = JSON.parse(localStorage.getItem("user"))?.id;

  const [courseName, setCourseName] = useState(courseNameFromUrl);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId || !tutorId) {
      setError("ไม่พบข้อมูล Course หรือผู้ใช้งาน");
      setLoading(false);
      return;
    }

    const fetchSubjects = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/courses/${courseId}/subjects?adminId=${tutorId}`
        );
        setSubjects(res.data.subjects || []);
        if (res.data.courseName) setCourseName(res.data.courseName);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError(
          err.response?.data?.message || "ไม่สามารถโหลดรายวิชาได้ กรุณาลองใหม่"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [courseId, tutorId]);

  const handleSelectSubject = (subject) => {
    navigate(
      `/tutor/exam?courseId=${courseId}&subjectId=${subject.subjectId}` +
      `&courseName=${encodeURIComponent(courseName)}` +
      `&subjectName=${encodeURIComponent(subject.subjectName)}`
    );
  };

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm">
        <Link to="/tutor/courses" className="font-medium text-gray-500 hover:text-orange-600 transition">
          คอร์ส
        </Link>
        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-800">เลือกวิชา</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">เลือกวิชาที่ต้องการจัดการข้อสอบ</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {courseName ? `คอร์ส: ${courseName}` : "กรุณาเลือกวิชาที่คุณรับผิดชอบในคอร์สนี้"}
        </p>
      </div>

      {loading && (
        <div className="text-center p-10 font-medium text-neutral-500">กำลังโหลดรายวิชา...</div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200 border-dashed">
          <div className="text-5xl mb-3">📚</div>
          <p className="text-neutral-500 font-medium">ไม่พบวิชาที่คุณสอนในคอร์สนี้</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <button
              key={subject.subjectId}
              onClick={() => handleSelectSubject(subject)}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-400 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 flex-shrink-0">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-neutral-900 truncate">{subject.subjectName}</p>
                <p className="text-xs text-neutral-500 mt-0.5">กดเพื่อจัดการข้อสอบวิชานี้</p>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}