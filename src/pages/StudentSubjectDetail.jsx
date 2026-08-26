import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight, Video, FileText, Download, Loader2, PlayCircle, X,
  ClipboardList, BookOpen,
} from "lucide-react";
import {
  getCourseBasic,
  getStudentSubjectVideos,
  getStudentSubjectFiles,
  getStudentSubjectsProgress,
  updateVideoWatchSegments,
} from "../callapi/callusers_student";
import { fetchExamEntry, getCurrentUserId } from "../utils/studentExamShared";

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
  }, [videoId, youtubeId]);

  return <div className="w-full aspect-video bg-black"><div id={elementId} className="w-full h-full" /></div>;
}

function UploadedVideoPlayer({ video, token }) {
  const videoRef = useRef(null);
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
      const verifiedSeconds = Math.max(0, Math.min(element.duration, element.duration * Number(video.WatchPercent || 0) / 100));
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
      <button onClick={handleDownload} disabled={downloading}
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
  const [courseName, setCourseName] = useState("คอร์สเรียน");
  const [subjectName, setSubjectName] = useState("");
  const [videos, setVideos] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState("videos");
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) { setError("กรุณาเข้าสู่ระบบใหม่"); setLoading(false); return; }
      if (!courseId || !subjectId) { setError("ไม่พบรหัสคอร์สหรือวิชา"); setLoading(false); return; }
      try {
        setError("");
        const [course, subjectList, videoList, fileList] = await Promise.all([
          getCourseBasic(courseId).catch(() => null),
          getStudentSubjectsProgress(token, courseId),
          getStudentSubjectVideos(token, courseId, subjectId),
          getStudentSubjectFiles(token, courseId, subjectId),
        ]);
        if (cancelled) return;

        if (course?.CourseName) setCourseName(course.CourseName);
        const selectedSubject = (Array.isArray(subjectList) ? subjectList : []).find(
          (subject) => String(subject.subjectId) === String(subjectId)
        );
        setSubjectName(selectedSubject?.subjectName || "ไม่ระบุชื่อวิชา");

        setVideos((Array.isArray(videoList) ? videoList : []).map((v) => ({
          VideoId: v.id,
          VideoTitle: v.title || "วิดีโอไม่มีชื่อ",
          VideoUrl: v.url || "",
          VideoType: v.videoType || "",
          Thumbnail: v.thumbnail || "",
          Duration: v.duration,
          LastWatchTime: Number(v.lastWatchTime || 0),
          WatchPercent: Number(v.progress || 0),
        })));

        const fList = Array.isArray(fileList) ? fileList : [];
        setFiles(fList.map((f) => ({
          FileId: f.FileId,
          FileName: f.FileName,
          FilePath: f.FilePath,
          FileSize: f.FileSize,
        })));
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(typeof e === "string" ? e : e?.message || "โหลดเนื้อหาวิชาไม่สำเร็จ");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [courseId, subjectId, token]);

  const handleEnterExam = async () => {
    if (!userId) return navigate("/login");
    setExamLoading(true);
    setExamError("");
    try {
      const data = await fetchExamEntry(courseId, userId, subjectId);
      if (data.token) navigate(`/exam/${data.token}`);
    } catch (err) {
      setExamError(err.response?.data?.message || "ยังไม่มีข้อสอบที่เปิดอยู่ตอนนี้");
    } finally {
      setExamLoading(false);
    }
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
    return <div className="mt-[90px] rounded-xl bg-red-50 p-10 text-center font-medium text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen mt-[70px] pb-12 mx-auto w-full max-w-[1400px] px-5 md:px-8">
      <div className="py-6">
        <div className="mb-3 flex items-center text-sm text-neutral-500 flex-wrap">
          <Link to="/profile/my-courses" className="hover:text-orange-600 transition">คอร์สเรียนของฉัน</Link>
          <ChevronRight className="mx-1.5 h-4 w-4" />
          <Link to={`/profile/course/${courseId}/subjects`} className="hover:text-orange-600 transition">{courseName}</Link>
          <ChevronRight className="mx-1.5 h-4 w-4" />
          <span className="text-neutral-800 font-medium">{subjectName || "รายวิชา"}</span>
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-orange-500" /> {subjectName || "รายวิชา"}
        </h1>
        <p className="mt-2 text-base text-neutral-500">{courseName} · เนื้อหาสำหรับรายวิชานี้</p>
      </div>

      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit flex-wrap mb-6">
        {[
          { key: "videos", label: `คลิปวิดีโอ (${videos.length})`, icon: <Video className="h-4 w-4" /> },
          { key: "files", label: `เอกสาร (${files.length})`, icon: <FileText className="h-4 w-4" /> },
          { key: "exam", label: "ข้อสอบ", icon: <ClipboardList className="h-4 w-4" /> },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold transition ${
              activeTab === tab.key ? "bg-white shadow text-orange-600" : "text-neutral-500 hover:text-neutral-700"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "videos" && (
        <div className="min-h-[380px] bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="p-6 space-y-3">
            {videos.length > 0 ? videos.map((video) => (
              <div key={video.VideoId} className="rounded-xl border border-neutral-200 hover:border-orange-200 hover:shadow-sm transition bg-white overflow-hidden flex items-stretch gap-0">
                <button onClick={() => setSelectedVideo(video)} className="relative flex-shrink-0 w-28 bg-neutral-100 group">
                  {(video.Thumbnail || getVideoThumbnail(video.VideoUrl, video.VideoType)) ? (
                    <img src={video.Thumbnail || getVideoThumbnail(video.VideoUrl, video.VideoType)} alt="" className="w-28 h-full object-cover" />
                  ) : (
                    <div className="w-28 h-full flex items-center justify-center min-h-[72px]"><span className="text-2xl">📁</span></div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </button>
                <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getVideoType(video.VideoUrl, video.VideoType) === "upload" ? "bg-purple-50 text-purple-600" : "bg-neutral-100 text-neutral-500"}`}>
                        {getVideoType(video.VideoUrl, video.VideoType) === "upload" ? "🎬 วิดีโอระบบ" : "คลิปเดิม · ไม่นับความคืบหน้า"}
                      </span>
                      {video.Duration && <span className="text-[10px] text-neutral-400">{video.Duration}</span>}
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">{video.VideoTitle}</p>
                  </div>
                  <div className="flex items-center justify-end gap-3 mt-2">
                    {getVideoType(video.VideoUrl, video.VideoType) === "upload" ? (
                      <WatchProgressRing percent={video.WatchPercent} />
                    ) : <span className="mr-auto text-[10px] text-neutral-300">คลิปนี้ไม่บันทึกความคืบหน้า</span>}
                    <button onClick={() => setSelectedVideo(video)}
                      className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700">
                      <PlayCircle className="h-3.5 w-3.5" /> ดู
                    </button>
                  </div>
                </div>
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
          {examError && <p className="mt-3 text-sm text-red-500">{examError}</p>}
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
              <UploadedVideoPlayer video={selectedVideo} token={token} />
            ) : (
              <YoutubePlayer videoId={selectedVideo.VideoId} youtubeId={selectedVideo.VideoUrl} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
