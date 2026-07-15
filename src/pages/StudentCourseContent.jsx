// ===================== 2) StudentCourseContent.jsx =====================
// สไตล์เป๊ะจาก TutorCourseManagePage.jsx แต่ตัดปุ่มแก้ไข/ลบ/เพิ่มออก (view-only)
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronRight, Video, FileText, Calendar, Download, Loader2, PlayCircle, X, Clock } from "lucide-react";
import { getStudentVideos, getStudentFiles, updateVideoProgress } from "../callapi/callusers_student";

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

function YoutubePlayer({ videoId, youtubeId, token }) {
  const player = useRef(null);
  const timer = useRef(null);
  const lastSentPercent = useRef(0);
  const elementId = `player-${videoId}`;

  useEffect(() => {
    let cancelled = false;
    lastSentPercent.current = 0;
    const realId = extractYoutubeId(youtubeId);

    async function sendProgress(force = false) {
      if (!player.current || typeof player.current.getCurrentTime !== "function") return;
      const current = player.current.getCurrentTime();
      const duration = player.current.getDuration();
      if (!duration) return;
      const percent = (current / duration) * 100;
      if (force || Math.abs(percent - lastSentPercent.current) >= 1) {
        lastSentPercent.current = percent;
        try { await updateVideoProgress(token, videoId, { WatchPercent: percent, LastWatchTime: current }); }
        catch (e) { console.error(e); }
      }
    }

    loadYoutubeApi().then(() => {
      if (cancelled) return;
      const el = document.getElementById(elementId);
      if (!el) return;
      player.current = new window.YT.Player(elementId, {
        videoId: realId,
        playerVars: { autoplay: 0 },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              clearInterval(timer.current);
              timer.current = setInterval(() => sendProgress(), 3000);
            } else {
              clearInterval(timer.current);
              sendProgress(true);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearInterval(timer.current);
      if (player.current?.destroy) player.current.destroy();
    };
  }, [videoId, youtubeId, token]);

  return <div className="w-full aspect-video bg-black"><div id={elementId} className="w-full h-full" /></div>;
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
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId") || "";
  const courseName = searchParams.get("courseName") || "คอร์สเรียน";
  const token = localStorage.getItem("student_token");

  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const getVideoThumbnail = (url) => {
    const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
  };
  const getVideoType = (url) => (/youtube\.com|youtu\.be/.test(url) ? "youtube" : /drive\.google\.com/.test(url) ? "drive" : "other");

  useEffect(() => {
    (async () => {
      if (!courseId) { setLoading(false); return; }
      try {
        const [v, f] = await Promise.all([getStudentVideos(token, courseId), getStudentFiles(token, courseId)]);
        setVideos(v || []);
        setDocuments(f || []);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    })();
  }, [courseId]);

  if (loading) {
    return (
      <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        กำลังดึงข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-[70px] pb-12">
      <div className="mx-auto">
        <div className="py-6">
          <div className="mb-3 flex items-center text-sm text-neutral-500">
            <Link to="/student/courses" className="hover:text-orange-600 transition">คอร์สเรียนของฉัน</Link>
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
                    {getVideoThumbnail(video.VideoUrl) ? (
                      <img src={getVideoThumbnail(video.VideoUrl)} alt="" className="w-28 h-full object-cover" />
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
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getVideoType(video.VideoUrl) === "youtube" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                          {getVideoType(video.VideoUrl) === "youtube" ? "▶ YouTube" : "📁 Drive"}
                        </span>
                        {video.Duration && <span className="text-[10px] text-neutral-400">{video.Duration}</span>}
                      </div>
                      <p className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">{video.VideoTitle}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {video.WatchPercent != null ? (
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
            <YoutubePlayer videoId={selectedVideo.VideoId} youtubeId={selectedVideo.VideoUrl} token={token} />
          </div>
        </div>
      )}
    </div>
  );
}