// ===================== 2) StudentCourseContent.jsx =====================
// สไตล์เป๊ะจาก TutorCourseManagePage.jsx แต่ตัดปุ่มแก้ไข/ลบ/เพิ่มออก (view-only)
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { ChevronRight, Video, FileText, Download, Loader2, PlayCircle, X } from "lucide-react";
import { getStudentCourses, getStudentVideos, getStudentFiles, updateVideoWatchSegments } from "../callapi/callusers_student";

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

function UploadedVideoPlayer({ video, token, onProgress }) {
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
        const result = await updateVideoWatchSegments(token, video.VideoId, {
          segmentIndexes: indexes,
          duration: element.duration,
          lastWatchTime: element.currentTime,
        });
        onProgress?.(
          video.VideoId,
          Number(result?.data?.watchPercent ?? video.WatchPercent ?? 0),
          Number(result?.data?.lastWatchTime ?? element.currentTime)
        );
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
  }, [token, video.VideoId, onProgress]);

  return (
    <video ref={videoRef} src={video.VideoUrl} controls controlsList="nodownload" playsInline
      className="aspect-video w-full bg-black" preload="metadata">
      เบราว์เซอร์นี้ไม่รองรับการเล่นวิดีโอ
    </video>
  );
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
        <p className="text-xs text-neutral-500">{file.SubjectName} · {file.FileSize}</p>
      </div>
      <button onClick={handleDownload} disabled={downloading}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition disabled:opacity-60">
        {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
        {downloading ? "กำลังโหลด..." : "ดาวน์โหลด"}
      </button>
    </div>
  );
}

export default function StudentCourseContent() {
  const { courseId: routeCourseId } = useParams();
  const [searchParams] = useSearchParams();
  const courseId = routeCourseId || searchParams.get("courseId") || "";
  const token = localStorage.getItem("student_token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseName, setCourseName] = useState(searchParams.get("courseName") || "คอร์สเรียน");
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const handleProgress = useCallback((videoId, watchPercent, lastWatchTime) => {
    setVideos(current => current.map(video => String(video.VideoId) === String(videoId)
      ? { ...video, WatchPercent: watchPercent, LastWatchTime: lastWatchTime }
      : video));
    setSelectedVideo(current => current && String(current.VideoId) === String(videoId)
      ? { ...current, WatchPercent: watchPercent, LastWatchTime: lastWatchTime }
      : current);
  }, []);

  const getVideoThumbnail = (url, type) => {
    if (type === "upload" && /res\.cloudinary\.com/.test(url || "")) {
      return url.replace("/video/upload/", "/video/upload/so_1/").replace(/\.(mp4|mov|webm)$/i, ".jpg");
    }
    const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
  };
  const getVideoType = (url, storedType) => storedType === "upload" || /res\.cloudinary\.com/.test(url || "")
    ? "upload" : (/youtube\.com|youtu\.be/.test(url) ? "youtube" : /drive\.google\.com/.test(url) ? "drive" : "other");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!courseId) { setError("ไม่พบรหัสคอร์ส"); setLoading(false); return; }
      if (!token) { setError("กรุณาเข้าสู่ระบบใหม่"); setLoading(false); return; }
      try {
        setError("");
        const [videoResult, fileResult, courseResult] = await Promise.allSettled([
          getStudentVideos(token, courseId),
          getStudentFiles(token, courseId),
          getStudentCourses(token),
        ]);

        if (cancelled) return;
        if (videoResult.status === "rejected" && fileResult.status === "rejected") {
          throw videoResult.reason;
        }

        const videoPayload = videoResult.status === "fulfilled" ? videoResult.value : [];
        const filePayload = fileResult.status === "fulfilled" ? fileResult.value : [];
        const videoList = Array.isArray(videoPayload) ? videoPayload : videoPayload?.videos ?? videoPayload?.data ?? [];
        const fileList = Array.isArray(filePayload) ? filePayload : filePayload?.files ?? filePayload?.documents ?? filePayload?.data ?? [];

        setVideos(videoList.map((video) => ({
          ...video,
          VideoId: video.VideoId ?? video.videoId ?? video.id,
          VideoTitle: video.VideoTitle ?? video.videoTitle ?? video.title ?? "วิดีโอไม่มีชื่อ",
          VideoUrl: video.VideoUrl ?? video.videoUrl ?? video.url ?? "",
          VideoType: video.VideoType ?? video.videoType ?? "",
          Thumbnail: video.Thumbnail ?? video.thumbnail ?? "",
          Duration: video.Duration ?? video.duration,
          LastWatchTime: Number(video.LastWatchTime ?? video.lastWatchTime ?? 0),
          WatchPercent: Number(video.WatchPercent ?? video.watchPercent ?? 0),
        })));
        setDocuments(fileList.map((file) => ({
          ...file,
          FileId: file.FileId ?? file.fileId ?? file.id,
          FileName: file.FileName ?? file.fileName ?? file.name ?? "เอกสารไม่มีชื่อ",
          FilePath: file.FilePath ?? file.filePath ?? file.url ?? "",
          FileSize: file.FileSize ?? file.fileSize ?? "",
          SubjectName: file.SubjectName ?? file.subjectName ?? "เอกสารประกอบการเรียน",
        })));

        if (courseResult.status === "fulfilled") {
          const payload = courseResult.value;
          const list = Array.isArray(payload) ? payload : payload?.courses ?? payload?.data ?? [];
          const course = list.find((item) => String(item.CourseID ?? item.CourseId ?? item.courseId ?? item.id) === String(courseId));
          if (course) setCourseName(course.CourseName ?? course.courseName ?? course.name ?? "คอร์สเรียน");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(typeof e === "string" ? e : e?.message || "โหลดเนื้อหาคอร์สไม่สำเร็จ");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [courseId, token]);

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
    <div className="min-h-screen mt-[70px] pb-12">
      <div className="mx-auto">
        <div className="py-6">
          <div className="mb-3 flex items-center text-sm text-neutral-500">
            <Link to="/profile/my-courses" className="hover:text-orange-600 transition">คอร์สเรียนของฉัน</Link>
            <ChevronRight className="mx-1.5 h-4 w-4" />
            <span className="text-neutral-800 font-medium">เนื้อหาในคอร์ส</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">{courseName}</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* VIDEOS (view-only) */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col" style={{ maxHeight: "75vh" }}>
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
              <h2 className="flex items-center gap-2 font-bold text-neutral-800">
                <span className="p-1.5 bg-orange-100 rounded-lg"><Video className="h-4 w-4 text-orange-500" /></span>
                คลิปวิดีโอ
                <span className="ml-1 text-sm font-medium text-neutral-400">({videos.length})</span>
              </h2>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
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
                    <div className="flex items-center justify-between mt-2">
                      {getVideoType(video.VideoUrl, video.VideoType) === "upload" && video.WatchPercent != null ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${video.WatchPercent >= 80 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          ดูแล้ว {Math.round(video.WatchPercent)}%
                        </span>
                      ) : <span className="text-[10px] text-neutral-300">ยังไม่ได้ดู</span>}
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

          {/* DOCUMENTS (view-only) */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col" style={{ maxHeight: "75vh" }}>
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
              <h2 className="flex items-center gap-2 font-bold text-neutral-800">
                <span className="p-1.5 bg-blue-100 rounded-lg"><FileText className="h-4 w-4 text-blue-500" /></span>
                เอกสาร
                <span className="ml-1 text-sm font-medium text-neutral-400">({documents.length})</span>
              </h2>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {documents.length > 0 ? documents.map((doc) => <FileRow key={doc.FileId} file={doc} />) : (
                <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                  <FileText className="h-10 w-10 text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-400">ยังไม่มีเอกสารในวิชานี้</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
              <UploadedVideoPlayer video={selectedVideo} token={token} onProgress={handleProgress} />
            ) : (
              <YoutubePlayer videoId={selectedVideo.VideoId} youtubeId={selectedVideo.VideoUrl} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
