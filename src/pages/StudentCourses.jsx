import { useState, useEffect, useRef } from "react";
import { BookOpen, Clock, Video, FileText, Search, Play, Download, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  getStudentCourses,
  getStudentVideos,
  getStudentFiles,
  updateVideoProgress,
} from "../callapi/callusers_student";

/* ───── YouTube Player with progress tracking ───── */

let ytApiPromise = null;

function loadYoutubeApi() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }
  ytApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === "function") previousCallback();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
  });
  return ytApiPromise;
}

function extractYoutubeId(url) {
  if (!url) return url;
  if (url.includes("youtube.com/watch?v=")) {
    return url.split("v=")[1].split("&")[0];
  }
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1].split("?")[0];
  }
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

    const realYoutubeId = extractYoutubeId(youtubeId);

    async function checkAndSendProgress(forceSend = false) {
      if (!player.current || typeof player.current.getCurrentTime !== "function") return;
      const current = player.current.getCurrentTime();
      const duration = player.current.getDuration();
      if (!duration) return;

      const percent = (current / duration) * 100;
      const diff = Math.abs(percent - lastSentPercent.current);

      // ยิง API เฉพาะตอน progress เปลี่ยนจริง (เปลี่ยนอย่างน้อย 1%) ไม่ยิงทุก tick
      if (forceSend || diff >= 1) {
        lastSentPercent.current = percent;
        try {
          await updateVideoProgress(token, videoId, {
            WatchPercent: percent,
            LastWatchTime: current,
          });
        } catch (err) {
          console.error("Failed to update video progress:", err);
        }
      }
    }

    loadYoutubeApi().then(() => {
      if (cancelled) return;

      const el = document.getElementById(elementId);
      if (!el) {
        console.error("YouTube player container not found:", elementId);
        return;
      }

      player.current = new window.YT.Player(elementId, {
        videoId: realYoutubeId,
        playerVars: { autoplay: 0 },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              clearInterval(timer.current);
              // เช็คถี่ขึ้น (ทุก 3 วิ) แต่ "ส่ง" เฉพาะตอน % เปลี่ยนจริง
              timer.current = setInterval(() => {
                checkAndSendProgress();
              }, 3000);
            } else {
              clearInterval(timer.current);
              // pause / end / buffering ก็ส่ง progress ล่าสุดไปด้วยเลย
              checkAndSendProgress(true);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearInterval(timer.current);
      if (player.current && typeof player.current.destroy === "function") {
        player.current.destroy();
        player.current = null;
      }
    };
  }, [videoId, youtubeId, token]);

  return (
    <div className="w-full aspect-video bg-black">
      <div id={elementId} className="w-full h-full"></div>
    </div>
  );
}

/* ───── Main component ───── */

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseContent, setCourseContent] = useState({}); // { courseId: { videos, files, tab } }
  const [selectedVideo, setSelectedVideo] = useState(null);

  const token = localStorage.getItem("student_token");

  useEffect(() => {
    (async () => {
      try {
        const data = await getStudentCourses(token);
        setCourses(data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleCourse(courseId) {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);

    if (!courseContent[courseId]) {
      try {
        const [videos, files] = await Promise.all([
          getStudentVideos(token, courseId),
          getStudentFiles(token, courseId),
        ]);
        setCourseContent((prev) => ({
          ...prev,
          [courseId]: { videos, files, tab: "videos" },
        }));
      } catch {
        setCourseContent((prev) => ({
          ...prev,
          [courseId]: { videos: [], files: [], tab: "videos" },
        }));
      }
    }
  }

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function FileRow({ file }) {
  const [downloading, setDownloading] = useState(false);

  function getFullUrl(path) {
    if (!path) return path;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path; // เผื่อบาง record เก็บ URL เต็มอยู่แล้ว
    }
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  }

  function getFileExtension(path, name) {
    const fromPath = path?.split(".").pop()?.split("?")[0];
    const fromName = name?.split(".").pop();
    const ext = fromPath || fromName || "";
    return ext.length <= 5 ? ext : "";
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const fullUrl = getFullUrl(file.FilePath);
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();

      const ext = getFileExtension(file.FilePath, file.FileName);
      const hasExtAlready = file.FileName?.includes(".");
      const finalName = hasExtAlready
        ? file.FileName
        : ext
        ? `${file.FileName}.${ext}`
        : file.FileName;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = finalName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      window.open(getFullUrl(file.FilePath), "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 p-3 hover:border-blue-300 transition">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 truncate">
          {file.FileName}
        </p>
        <p className="text-xs text-neutral-500">
          {file.SubjectName} · {file.FileSize}
        </p>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition disabled:opacity-60"
      >
        {downloading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
        {downloading ? "กำลังโหลด..." : "ดาวน์โหลด"}
      </button>
    </div>
  );
}

  function setTab(courseId, tab) {
    setCourseContent((prev) => ({
      ...prev,
      [courseId]: { ...prev[courseId], tab },
    }));
  }

  const statusLabel = (c) => {
    const now = new Date();
    const start = c.StartDate ? new Date(c.StartDate) : null;
    const end = c.LastDate ? new Date(c.LastDate) : null;
    if (end && now > end) return "completed";
    if (start && now < start) return "upcoming";
    return "active";
  };

  const statusText = { active: "กำลังเรียน", completed: "เรียนจบแล้ว", upcoming: "ยังไม่เริ่ม" };
  const statusClass = {
    active: "bg-green-100 text-green-700",
    completed: "bg-neutral-200 text-neutral-700",
    upcoming: "bg-blue-100 text-blue-700",
  };

  const filtered = courses.filter((c) => {
    const s = statusLabel(c);
    return (
      (filterStatus === "all" || s === filterStatus) &&
      (search === "" || c.CourseName.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const totalStats = {
    courses: courses.length,
    active: courses.filter((c) => statusLabel(c) === "active").length,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center mt-[90px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-[90px] text-center text-red-500 py-12">{error}</div>
    );
  }

  return (
    <div className="space-y-6 mt-[90px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">คอร์สเรียนของฉัน</h1>
        <p className="text-sm text-neutral-500 mt-1">
          ดูวิดีโอ เอกสาร และติดตามความคืบหน้าการเรียน
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <StatCard icon={BookOpen} label="คอร์สทั้งหมด" value={totalStats.courses} />
        <StatCard icon={Play} label="กำลังเรียน" value={totalStats.active} />
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="ค้นหาคอร์ส..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <select
            className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            <option value="active">กำลังเรียน</option>
            <option value="completed">เรียนจบแล้ว</option>
            <option value="upcoming">ยังไม่เริ่ม</option>
          </select>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-neutral-500 text-sm">ไม่พบคอร์สที่ค้นหา</p>
          </div>
        ) : (
          filtered.map((course) => {
            const status = statusLabel(course);
            const isOpen = expandedCourse === course.CourseID;
            const content = courseContent[course.CourseID];
            const progress =
              course.TotalSessions > 0
                ? Math.round((course.CompletedSessions / course.TotalSessions) * 100)
                : 0;

            return (
              <div
                key={course.CourseID}
                className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-blue-300 transition overflow-hidden"
              >
                {/* Course Header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => toggleCourse(course.CourseID)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-4 flex-1">
                      {/* {course.CourseImage && (
                        <img
                          src={course.CourseImage}
                          alt={course.CourseName}
                          className="h-14 w-14 rounded-xl object-cover shrink-0"
                        />
                      )} */}
                      <div className="flex-1">
                        <h2 className="text-base font-bold text-neutral-900 mb-1">
                          {course.CourseName}
                        </h2>
                        <p className="text-xs text-neutral-500">
                          {course.StartDate
                            ? new Date(course.StartDate).toLocaleDateString("th-TH")
                            : ""}{" "}
                          –{" "}
                          {course.LastDate
                            ? new Date(course.LastDate).toLocaleDateString("th-TH")
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass[status]}`}
                      >
                        {statusText[status]}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-600 font-medium">ความคืบหน้า</span>
                      <span className="font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="flex gap-4 mt-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Video className="h-3.5 w-3.5" /> {course.TotalVideos ?? 0} วิดีโอ
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {course.TotalFiles ?? 0} เอกสาร
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {course.TotalSessions ?? 0} คาบ
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="border-t border-neutral-100">
                    {!content ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <>
                        {/* Tabs */}
                        <div className="flex border-b border-neutral-100 bg-neutral-50">
                          <TabBtn
                            active={content.tab === "videos"}
                            onClick={() => setTab(course.CourseID, "videos")}
                            icon={<Video className="h-4 w-4" />}
                            label={`วิดีโอ (${content.videos.length})`}
                          />
                          <TabBtn
                            active={content.tab === "files"}
                            onClick={() => setTab(course.CourseID, "files")}
                            icon={<FileText className="h-4 w-4" />}
                            label={`เอกสาร (${content.files.length})`}
                          />
                        </div>

                        {/* Videos */}
                        {content.tab === "videos" && (
                          <div className="p-4 space-y-3">
                            {content.videos.length === 0 ? (
                              <p className="text-center text-sm text-neutral-400 py-6">ยังไม่มีวิดีโอ</p>
                            ) : (
                              content.videos.map((v, i) => (
                                <div
                                  key={v.VideoId}
                                  className="flex items-center gap-4 rounded-xl border border-neutral-200 p-3 hover:border-blue-300 transition"
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                                    {i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900 truncate">
                                      {v.VideoTitle}
                                    </p>
                                    {v.SubjectName && (
                                      <p className="text-xs text-neutral-500">{v.SubjectName}</p>
                                    )}
                                  </div>
                                  {/* Progress indicator */}
                                  {v.WatchPercent != null && (
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                                        v.WatchPercent >= 80
                                          ? "bg-green-100 text-green-700"
                                          : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {Math.round(v.WatchPercent)}%
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setSelectedVideo(v)}
                                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
                                  >
                                    <Play className="h-3 w-3" />
                                    ดู
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Files */}
                        {content.tab === "files" && (
                          <div className="p-4 space-y-3">
                            {content.files.length === 0 ? (
                              <p className="text-center text-sm text-neutral-400 py-6">ยังไม่มีเอกสาร</p>
                            ) : (
                              content.files.map((f) => (
                                <FileRow key={f.FileId} file={f} />
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Video Modal — rendered once, outside the course list */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-neutral-200">
              <h2 className="font-bold text-neutral-900 truncate pr-4">
                {selectedVideo.VideoTitle}
              </h2>
              <button
                onClick={() => setSelectedVideo(null)}
                className="shrink-0 text-neutral-500 hover:text-neutral-800 transition"
                aria-label="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <YoutubePlayer
              videoId={selectedVideo.VideoId}
              youtubeId={selectedVideo.VideoUrl}
              token={token}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Sub-components ───── */

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 hover:shadow-md transition">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-neutral-600 font-medium">{label}</p>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-neutral-500 hover:text-neutral-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}