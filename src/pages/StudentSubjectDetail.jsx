import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Video, FileText, Download, Loader2, PlayCircle, X,
  ClipboardList, BookOpen, ChevronRight, RefreshCw,
} from "lucide-react";
import {
  getCourseBasic,
  getStudentSubjectVideos,
  getStudentSubjectFiles,
  getStudentSubjectsProgress,
  getVideoLearningState,
  updateVideoWatchSegments,
} from "../callapi/callusers_student";
import { fetchExamEntry, fetchExamSchedule, getCurrentUserId } from "../utils/studentExamShared";
import { useToast } from "../components/useToast";
import InteractiveVideoPlayer from "../components/InteractiveVideoPlayer";
import Breadcrumb from "../components/ui/Breadcrumb";
import { ToastContainer } from "../components/Toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let ytApiPromise = null;
function loadYoutubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (typeof prev === "function") prev(); resolve(); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    }
  });
  return ytApiPromise;
}
function extractYoutubeId(url) {
  if (!url) return url;
  if (url.includes("youtube.com/watch?v=")) return url.split("v=")[1].split("&")[0];
  if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0];
  return url;
}
function getVideoType(url, storedType) {
  if (storedType === "upload" || /res\.cloudinary\.com/.test(url || "")) return "upload";
  if (/youtube\.com|youtu\.be/.test(url || "")) return "youtube";
  if (/drive\.google\.com/.test(url || "")) return "drive";
  return "other";
}
function getVideoThumbnail(url, type) {
  if (type === "upload" && /res\.cloudinary\.com/.test(url || "")) {
    return url.replace("/video/upload/", "/video/upload/so_1/").replace(/\.(mp4|mov|webm)$/i, ".jpg");
  }
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

function WatchProgressRing({ percent }) {
  const value = Math.max(0, Math.min(100, Math.round(Number(percent || 0))));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  const color = value >= 80 ? "#16a34a" : value > 0 ? "#f97316" : "#94a3b8";

  return (
    <div className="relative h-12 w-12 shrink-0" title={`ดูแล้ว ${value}%`} aria-label={`ดูแล้ว ${value}%`}>
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[10px] font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function YoutubePlayer({ videoId, youtubeId }) {
  const player = useRef(null);
  const elementId = `player-${videoId}`;

  useEffect(() => {
    let cancelled = false;
    const realId = extractYoutubeId(youtubeId);

    loadYoutubeApi().then(() => {
      if (cancelled) return;
      const el = document.getElementById(elementId);
      if (!el) return;
      player.current = new window.YT.Player(elementId, {
        videoId: realId,
        playerVars: { autoplay: 0 },
      });
    });

    return () => {
      cancelled = true;
      if (player.current?.destroy) player.current.destroy();
    };
  }, [videoId, youtubeId, elementId]);

  return <div className="w-full aspect-video bg-black"><div id={elementId} className="w-full h-full" /></div>;
}

function UploadedVideoPlayer({ video, token }) {
  const videoRef = useRef(null);
  const progressRef = useRef(video.WatchPercent);
  progressRef.current = video.WatchPercent;
  const pendingSegments = useRef(new Set());
  const watchedSeconds = useRef(new Map());
  const lastSample = useRef(null);
  const flushTimer = useRef(null);
  const furthestAllowed = useRef(0);
  const correctingSeek = useRef(false);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return undefined;

    const flush = async () => {
      if (!element.duration || !Number.isFinite(element.duration)) return;
      const indexes = [...pendingSegments.current];
      if (!indexes.length) return;
      pendingSegments.current.clear();
      try {
        await updateVideoWatchSegments(token, video.VideoId, {
          segmentIndexes: indexes,
          duration: element.duration,
          lastWatchTime: element.currentTime,
        });
      } catch (error) {
        indexes.forEach(index => pendingSegments.current.add(index));
        console.error("บันทึกช่วงการรับชมไม่สำเร็จ", error);
      }
    };

    const resetSample = () => { lastSample.current = null; };
    const sample = () => {
      const now = performance.now();
      const current = element.currentTime;
      const previous = lastSample.current;
      lastSample.current = { current, now };
      if (!previous || element.paused || element.seeking || document.hidden) return;

      const mediaDelta = current - previous.current;
      const wallDelta = (now - previous.now) / 1000;
      if (mediaDelta <= 0 || mediaDelta > 1.5 || wallDelta > 2 || Math.abs(mediaDelta - wallDelta * element.playbackRate) > 0.75) return;

      const segmentIndex = Math.floor(previous.current / 10);
      if (Math.floor(current / 10) !== segmentIndex) return;
      const next = Math.min(10, (watchedSeconds.current.get(segmentIndex) || 0) + mediaDelta);
      watchedSeconds.current.set(segmentIndex, next);
      furthestAllowed.current = Math.max(furthestAllowed.current, current);
      const segmentLength = Math.min(10, element.duration - segmentIndex * 10);
      if (next >= Math.max(1, segmentLength * 0.8)) pendingSegments.current.add(segmentIndex);
    };

    const resume = () => {
      const saved = Number(video.LastWatchTime || 0);
      const verifiedSeconds = Math.max(0, Math.min(element.duration, element.duration * Number(progressRef.current || 0) / 100));
      furthestAllowed.current = Math.min(saved, verifiedSeconds);
      if (furthestAllowed.current > 0 && furthestAllowed.current < element.duration - 3) element.currentTime = furthestAllowed.current;
    };
    const guardSeeking = () => {
      resetSample();
      if (correctingSeek.current) return;
      if (element.currentTime > furthestAllowed.current + 1) {
        correctingSeek.current = true;
        element.currentTime = furthestAllowed.current;
        queueMicrotask(() => { correctingSeek.current = false; });
      }
    };
    const onPause = () => { resetSample(); flush(); };
    const onVisibility = () => { resetSample(); if (document.hidden) flush(); };

    element.addEventListener("loadedmetadata", resume, { once: true });
    element.addEventListener("timeupdate", sample);
    element.addEventListener("seeking", guardSeeking);
    element.addEventListener("seeked", resetSample);
    element.addEventListener("pause", onPause);
    element.addEventListener("ended", flush);
    document.addEventListener("visibilitychange", onVisibility);
    flushTimer.current = setInterval(flush, 10000);

    return () => {
      clearInterval(flushTimer.current);
      flush();
      element.removeEventListener("timeupdate", sample);
      element.removeEventListener("seeking", guardSeeking);
      element.removeEventListener("seeked", resetSample);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("ended", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [token, video.VideoId, video.LastWatchTime]);

  return (
    <video ref={videoRef} src={video.VideoUrl} controls controlsList="nodownload" playsInline
      className="aspect-video w-full bg-black" preload="metadata">
      เบราว์เซอร์นี้ไม่รองรับการเล่นวิดีโอ
    </video>
  );
}

function FileRow({ file }) {
  const [downloading, setDownloading] = useState(false);
  const getFullUrl = (p) => (!p ? p : p.startsWith("http") ? p : `${API_BASE_URL}${p.startsWith("/") ? "" : "/"}${p}`);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(getFullUrl(file.FilePath));
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.FileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(getFullUrl(file.FilePath), "_blank", "noopener,noreferrer");
    } finally { setDownloading(false); }
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 p-3 hover:border-blue-300 transition">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 truncate">{file.FileName}</p>
        <p className="text-xs text-neutral-500">{file.FileSize}</p>
      </div>
      <button onClick={handleDownload} disabled={downloading || !file.FilePath}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition disabled:opacity-60">
        {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
        {downloading ? "กำลังโหลด..." : "ดาวน์โหลด"}
      </button>
    </div>
  );
}

export default function StudentSubjectDetail() {
  const { courseId, subjectId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("student_token");
  const userId = getCurrentUserId();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [courseName, setCourseName] = useState("คอร์สเรียน");
  const [subjectName, setSubjectName] = useState("");
  const [videos, setVideos] = useState([]);
  const [files, setFiles] = useState([]);
  const location = useLocation();
  // กลับมาจาก breadcrumb ของหน้าสอบ → เปิดแท็บ "ข้อสอบ" ค้างไว้เหมือนตอนกดออกไป
  const [activeTab, setActiveTab] = useState(() =>
    ["videos", "files", "exam"].includes(location.state?.tab) ? location.state.tab : "videos"
  );
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [examLoading, setExamLoading] = useState(false);
  const [examSchedule, setExamSchedule] = useState([]);
  const [examScheduleError, setExamScheduleError] = useState(false);
  const [examScheduleReloadKey, setExamScheduleReloadKey] = useState(0);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) { setError("กรุณาเข้าสู่ระบบใหม่"); setLoading(false); return; }
      if (!courseId || !subjectId) { setError("ไม่พบรหัสคอร์สหรือวิชา"); setLoading(false); return; }
      try {
        setLoading(true);
        setError("");
        const [course, subjectList, videoList, fileList] = await Promise.all([
          getCourseBasic(courseId, token).catch(() => null),
          getStudentSubjectsProgress(token, courseId),
          getStudentSubjectVideos(token, courseId, subjectId),
          getStudentSubjectFiles(token, courseId, subjectId),
        ]);
        if (cancelled) return;

        const courseTitle = course?.CourseName ?? course?.courseName ?? course?.data?.CourseName;
        if (courseTitle) setCourseName(courseTitle);
        const subjectPayload = Array.isArray(subjectList) ? subjectList : subjectList?.subjects ?? subjectList?.data?.subjects ?? subjectList?.data;
        const selectedSubject = (Array.isArray(subjectPayload) ? subjectPayload : []).find(
          (subject) => String(subject.subjectId ?? subject.SubjectId) === String(subjectId)
        );
        setSubjectName(selectedSubject?.subjectName ?? selectedSubject?.SubjectName ?? "ไม่ระบุชื่อวิชา");

        const videoPayload = Array.isArray(videoList) ? videoList : videoList?.videos ?? videoList?.data?.videos ?? videoList?.data;
        const normalizedVideos = (Array.isArray(videoPayload) ? videoPayload : []).map((v) => ({
          VideoId: v.VideoId ?? v.videoId ?? v.id,
          VideoTitle: v.VideoTitle ?? v.videoTitle ?? v.title ?? "วิดีโอไม่มีชื่อ",
          VideoUrl: v.VideoUrl ?? v.videoUrl ?? v.url ?? "",
          VideoType: v.VideoType ?? v.videoType ?? "",
          Thumbnail: v.Thumbnail ?? v.thumbnail ?? "",
          Duration: v.Duration ?? v.duration,
          LastWatchTime: Number(v.LastWatchTime ?? v.lastWatchTime ?? 0),
          WatchPercent: Number(v.WatchPercent ?? v.watchPercent ?? v.progress ?? 0),
        }));
        const videosWithLearning = await Promise.all(normalizedVideos.map(async video => {
          if (getVideoType(video.VideoUrl, video.VideoType) !== "upload") return video;
          try {
            const state = await getVideoLearningState(token, video.VideoId);
            const questions = state?.questions ?? state?.data?.questions ?? [];
            return { ...video, CorrectCount: questions.filter(question => question.isCorrect).length, TotalQuestions: questions.length };
          } catch { return { ...video, CorrectCount: 0, TotalQuestions: 0 }; }
        }));
        if (!cancelled) setVideos(videosWithLearning);

        const filePayload = Array.isArray(fileList) ? fileList : fileList?.files ?? fileList?.data?.files ?? fileList?.data;
        const fList = Array.isArray(filePayload) ? filePayload : [];
        setFiles(fList.map((f) => ({
          FileId: f.FileId ?? f.fileId ?? f.id,
          FileName: f.FileName ?? f.fileName ?? f.name ?? "เอกสารไม่มีชื่อ",
          FilePath: f.FilePath ?? f.filePath ?? f.url ?? "",
          FileSize: f.FileSize ?? f.fileSize ?? "",
        })));
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(typeof e === "string" ? e : e?.message || "โหลดเนื้อหาวิชาไม่สำเร็จ");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [courseId, subjectId, token, reloadKey]);

  // กำหนดสอบล่วงหน้า (Pre/Mid/Post ที่ยังไม่เปิด แต่ติวเตอร์ตั้งวันที่ไว้แล้ว) — โชว้ให้เห็นเฉยๆ
  // ไม่เกี่ยวกับปุ่ม "เข้าสอบ" ด้านล่าง ถ้าไม่มีอันไหนตั้งวันที่ไว้เลยก็ไม่ต้องโชว์อะไร
  useEffect(() => {
    if (!courseId || !subjectId || !token) return;
    let cancelled = false;
    setExamScheduleError(false);
    fetchExamSchedule(courseId, subjectId)
      .then((data) => { if (!cancelled) setExamSchedule(Array.isArray(data?.schedule) ? data.schedule : []); })
      .catch((err) => {
        console.error("Fetch exam schedule failed:", err);
        if (!cancelled) setExamScheduleError(true);
      });
    return () => { cancelled = true; };
  }, [courseId, subjectId, token, examScheduleReloadKey]);

  const handleEnterExam = async () => {
    if (!userId) return navigate("/login");
    setExamLoading(true);
    try {
      const data = await fetchExamEntry(courseId, userId, subjectId);
      // ส่งชื่อคอร์ส/วิชาไปด้วย ให้ breadcrumb หน้าสอบพากลับมาที่วิชานี้ได้
      if (data.token) navigate(`/exam/${data.token}`, { state: { from: { courseId, courseName, subjectId, subjectName } } });
    } catch (err) {
      showToast("error", "เข้าสอบไม่ได้", err.response?.data?.message || "ยังไม่มีข้อสอบที่เปิดอยู่ตอนนี้");
    } finally {
      setExamLoading(false);
    }
  };

  const handleProgress = (videoId, watchPercent, lastWatchTime) => {
    setVideos(current => current.map(video => String(video.VideoId) === String(videoId) ? { ...video, WatchPercent: watchPercent, LastWatchTime: lastWatchTime } : video));
    setSelectedVideo(current => current && String(current.VideoId) === String(videoId) ? { ...current, WatchPercent: watchPercent, LastWatchTime: lastWatchTime } : current);
  };
  const handleLearningChange = (videoId, result) => {
    setVideos(current => current.map(video => String(video.VideoId) === String(videoId) ? { ...video, CorrectCount: result.correctCount, TotalQuestions: result.totalQuestions } : video));
    setSelectedVideo(current => current && String(current.VideoId) === String(videoId) ? { ...current, CorrectCount: result.correctCount, TotalQuestions: result.totalQuestions } : current);
  };

  if (loading) {
    return (
      <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        กำลังดึงข้อมูล...
      </div>
    );
  }

  if (error) {
    const canRetry = Boolean(token && courseId && subjectId);
    return (
      <div className="mt-[90px] rounded-xl bg-red-50 p-10 text-center font-medium text-red-600" role="alert">
        {error}
        {canRetry && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4" /> ลองใหม่
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto mt-[90px] min-h-screen min-w-0 w-full max-w-[1400px] pb-12 md:px-8">
      <div className="py-6">
        <div className="mb-3 flex items-center text-sm text-neutral-500 flex-wrap">
          <Link to="/profile/my-courses" className="hover:text-orange-600 transition">คอร์สเรียนของฉัน</Link>
          <ChevronRight className="mx-1.5 h-4 w-4" />
          <Link to={`/profile/course/${courseId}/subjects`} className="hover:text-orange-600 transition">{courseName}</Link>
          <ChevronRight className="mx-1.5 h-4 w-4" />
          <span className="text-neutral-800 font-medium">{subjectName || "รายวิชา"}</span>
        </div>
        <h1 className="flex items-center gap-3 break-words text-2xl font-bold text-neutral-900 sm:text-3xl">
          <BookOpen className="h-8 w-8 text-orange-500" /> {subjectName || "รายวิชา"}
        </h1>
        <p className="mt-2 text-base text-neutral-500">{courseName} · เนื้อหาสำหรับรายวิชานี้</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
        {[
          { key: "videos", label: `คลิปวิดีโอ (${videos.length})`, icon: <Video className="h-4 w-4" /> },
          { key: "files", label: `เอกสาร (${files.length})`, icon: <FileText className="h-4 w-4" /> },
          { key: "exam", label: "ข้อสอบ", icon: <ClipboardList className="h-4 w-4" /> },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-3 text-xs font-semibold transition sm:gap-2 sm:px-6 sm:text-base ${
              activeTab === tab.key ? "bg-white shadow text-orange-600" : "text-neutral-500 hover:text-neutral-700"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "videos" && (
        <div className="min-h-[380px] bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="space-y-3 p-2 sm:p-6">
            {videos.length > 0 ? videos.map((video) => (
              <div key={video.VideoId} className="relative rounded-xl border border-neutral-200 hover:border-orange-200 hover:shadow-sm transition bg-white overflow-hidden flex items-stretch gap-0 pb-2">
                <button onClick={() => setSelectedVideo(video)} className="group relative w-20 flex-shrink-0 bg-neutral-100 sm:w-28">
                  {(video.Thumbnail || getVideoThumbnail(video.VideoUrl, video.VideoType)) ? (
                    <img src={video.Thumbnail || getVideoThumbnail(video.VideoUrl, video.VideoType)} alt="" className="h-full w-20 object-cover sm:w-28" />
                  ) : (
                    <span className="flex h-full min-h-[72px] w-20 items-center justify-center sm:w-28"><span className="text-2xl">📁</span></span>
                  )}
                  <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </span>
                </button>
                <div className="flex min-w-0 flex-1 flex-col justify-between px-2 py-3 sm:px-3">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getVideoType(video.VideoUrl, video.VideoType) === "upload" ? "bg-purple-50 text-purple-600" : "bg-neutral-100 text-neutral-500"}`}>
                        {getVideoType(video.VideoUrl, video.VideoType) === "upload" ? "🎬 วิดีโอระบบ" : "คลิปเดิม · ไม่นับความคืบหน้า"}
                      </span>
                      {video.Duration && <span className="text-[10px] text-neutral-400">{video.Duration}</span>}
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">{video.VideoTitle}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
                    {getVideoType(video.VideoUrl, video.VideoType) === "upload" ? (
                      <div className="mr-auto flex items-center gap-3"><span className="text-[11px] font-semibold text-orange-600">ดูแล้ว {Math.round(video.WatchPercent || 0)}%</span>{video.TotalQuestions > 0 && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">ตอบถูก {video.CorrectCount || 0}/{video.TotalQuestions} ข้อ</span>}</div>
                    ) : <span className="mr-auto text-[10px] text-neutral-300">คลิปนี้ไม่บันทึกความคืบหน้า</span>}
                    <button onClick={() => setSelectedVideo(video)}
                      className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700">
                      <PlayCircle className="h-3.5 w-3.5" /> ดู
                    </button>
                  </div>
                </div>
                {getVideoType(video.VideoUrl, video.VideoType) === "upload" && <div className="absolute inset-x-0 bottom-0 h-2 bg-neutral-100"><div className="h-full rounded-r-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, video.WatchPercent || 0))}%` }} /></div>}
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                <Video className="h-10 w-10 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">ยังไม่มีวิดีโอในวิชานี้</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <div className="min-h-[380px] bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="p-6 space-y-3">
            {files.length > 0 ? files.map((f) => <FileRow key={f.FileId} file={f} />) : (
              <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                <FileText className="h-10 w-10 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">ยังไม่มีเอกสารในวิชานี้</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "exam" && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 text-center">
          <ClipboardList className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h2 className="font-bold text-neutral-900 mb-1">ข้อสอบประจำวิชา</h2>
          <p className="text-sm text-neutral-500 mb-5">กดปุ่มด้านล่างเพื่อเข้าสอบวิชานี้</p>
          <button
            onClick={handleEnterExam}
            disabled={examLoading}
            className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 transition"
          >
            <ClipboardList className="h-4 w-4" /> {examLoading ? "กำลังตรวจสอบ…" : "เข้าสอบ"}
          </button>

          {examScheduleError && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              โหลดกำหนดการสอบไม่สำเร็จ
              <button
                type="button"
                onClick={() => setExamScheduleReloadKey((k) => k + 1)}
                className="ml-3 inline-flex items-center gap-1 font-semibold underline hover:text-red-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> ลองใหม่
              </button>
            </div>
          )}

          {!examScheduleError && examSchedule.length > 0 && (
            <div className="mt-6 space-y-2 text-left">
              {examSchedule.map((s) => {
                const d = new Date(s.examDate);
                const dateLabel = d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
                const timeLabel = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={s.examId} className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-sm font-semibold text-amber-800">{s.examName}: กำหนดสอบ {dateLabel} เวลา {timeLabel} น.</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {s.openMode === "auto"
                        ? "ระบบจะเปิดสอบให้อัตโนมัติเมื่อถึงเวลานี้"
                        : "เป็นกำหนดการที่ติวเตอร์ตั้งไว้ ติวเตอร์จะเป็นคนกดเปิดสอบเอง เวลานี้อาจเปลี่ยนแปลงได้"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-neutral-200">
              <h2 className="font-bold text-neutral-900 truncate pr-4">{selectedVideo.VideoTitle}</h2>
              <button onClick={() => setSelectedVideo(null)} className="shrink-0 text-neutral-500 hover:text-neutral-800 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            {getVideoType(selectedVideo.VideoUrl, selectedVideo.VideoType) === "upload" ? (
              <InteractiveVideoPlayer video={selectedVideo} token={token} onProgress={handleProgress} onLearningChange={handleLearningChange} />
            ) : getVideoType(selectedVideo.VideoUrl, selectedVideo.VideoType) === "youtube" ? (
              <YoutubePlayer videoId={selectedVideo.VideoId} youtubeId={selectedVideo.VideoUrl} />
            ) : (
              <div className="p-6 text-center"><a href={selectedVideo.VideoUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-orange-600 underline">เปิดวิดีโอในแท็บใหม่</a></div>
            )}
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
