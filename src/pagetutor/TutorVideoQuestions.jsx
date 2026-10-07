import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import Breadcrumb from "../components/ui/Breadcrumb";
import Spinner from "../components/ui/Spinner";
import TutorVideoQuestionEditor from "../components/TutorVideoQuestionEditor";

export default function TutorVideoQuestions() {
  const { videoId } = useParams();
  const token = localStorage.getItem("student_token");
  const [video, setVideo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setVideo(null);
    axios.get(`${API_URL}/api/tutor/videos/${videoId}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, timeout: 15000 })
      .then(({ data }) => setVideo(data))
      .catch(err => { if (!axios.isCancel(err)) setError(err.response?.data?.message || "โหลดข้อมูลวิดีโอไม่สำเร็จ"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [videoId, token, retry]);
  const manageUrl = video ? `/tutor/manage?${new URLSearchParams({ courseId: video.CourseID, subjectId: video.SubjectId, courseName: video.CourseName || "", subjectName: video.SubjectName || "" })}` : "/tutor/courses";
  return <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
    <Breadcrumb items={[{ label: "หน้าแรก", to: "/tutor" }, { label: "คอร์สที่สอน", to: "/tutor/courses" }, { label: video?.SubjectName || "จัดการเนื้อหา", to: manageUrl }, { label: "คำถามระหว่างวิดีโอ" }]} />
    {loading ? <Spinner /> : error ? <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700"><p>{error}</p><div className="mt-4 flex gap-4"><button onClick={() => setRetry(value => value + 1)} className="font-semibold underline">ลองอีกครั้ง</button><Link to="/tutor/courses" className="underline">กลับคอร์สที่สอน</Link></div></div> : video && <TutorVideoQuestionEditor key={video.VideoId} video={video} token={token} />}
  </div>;
}
