import { useEffect, useState } from "react";
import axios from "axios";
import { BookOpenText, RefreshCw } from "lucide-react";
import { API_URL } from "../config";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import { BTN } from "../components/ui/tokens";

export default function AdminTeachingPlanModal({ course, onClose }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    axios.get(`${API_URL}/api/admin/courses/${course.CourseID}/subjects`, { signal: controller.signal })
      .then(({ data }) => setSubjects(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.response?.data?.message || "โหลดแผนการสอนไม่สำเร็จ");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [course.CourseID, reloadKey]);

  const ready = subjects.filter((subject) => subject.TeachingTopics?.length).length;
  const topicCount = subjects.reduce((total, subject) => total + (subject.TeachingTopics?.length || 0), 0);

  return (
    <Modal title="แผนหัวข้อการสอน" subtitle={course.CourseName} icon={BookOpenText} onClose={onClose} size="xl"
      footer={<button type="button" onClick={onClose} className={`${BTN.base} ${BTN.secondary} ${BTN.md}`}>ปิด</button>}>
      {loading ? <Spinner block label="กำลังโหลดแผนการสอน..." /> : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 inline-flex items-center gap-2 font-bold text-red-700 hover:underline">
            <RefreshCw className="h-4 w-4" />ลองใหม่
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 sm:flex sm:items-center sm:justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">หัวข้อที่ติวเตอร์เตรียมสอนตลอดคอร์ส</h4>
              <p className="mt-1 text-sm text-slate-600">แสดงแยกตามวิชาและผู้สอน</p>
            </div>
            <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-sm font-bold text-orange-700 sm:mt-0">
              {ready}/{subjects.length} วิชาระบุแล้ว · {topicCount} หัวข้อ
            </span>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">คอร์สนี้ยังไม่ได้กำหนดวิชาและติวเตอร์</div>
          ) : subjects.map((subject) => {
            const topics = subject.TeachingTopics || [];
            const tutorName = subject.Nickname || [subject.Firstname, subject.Lastname].filter(Boolean).join(" ") || "ยังไม่ระบุติวเตอร์";
            return <section key={subject.TutorCourseDetailId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
                <div>
                  <h5 className="text-base font-bold text-slate-900">{subject.SubjectName || "ยังไม่ระบุวิชา"}</h5>
                  <p className="mt-0.5 text-sm text-slate-600">ติวเตอร์: {tutorName}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${topics.length ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {topics.length ? `${topics.length} หัวข้อ` : "รอติวเตอร์ระบุ"}
                </span>
              </div>
              {topics.length ? <ol className="space-y-2 p-4 sm:p-5">
                {topics.map((topic, index) => <li key={topic.id || index} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-700">{index + 1}</span>
                  <span className="min-w-0 break-words pt-0.5">{topic.title}</span>
                </li>)}
              </ol> : <p className="px-4 py-5 text-sm text-slate-500 sm:px-5">ยังไม่มีหัวข้อการสอนที่บันทึกสำหรับวิชานี้</p>}
            </section>;
          })}
        </div>
      )}
    </Modal>
  );
}
