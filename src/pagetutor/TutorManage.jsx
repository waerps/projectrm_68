import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import {
  ChevronRight, Video, FileText, Trash2, Calendar, Plus, Download,
  UploadCloud, Loader2, Pencil, X, Check, PlayCircle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";

export default function TutorCourseManagePage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId") || "";
  const subjectId = searchParams.get("subjectId") || "";
  const courseName = searchParams.get("courseName") || "คอร์สรวม (แพ็กเกจ)";
  const adminId = JSON.parse(localStorage.getItem("user"))?.id;
  const token = localStorage.getItem("student_token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editVideoData, setEditVideoData] = useState({ title: "", url: "", type: "", duration: "" });

  const [newVideo, setNewVideo] = useState({ title: "", duration: "" });
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDisplayName, setUploadDisplayName] = useState("");
  const [editDocName, setEditDocName] = useState("");
  const [editDocFile, setEditDocFile] = useState(null);

  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);

  const editFileInputRef = useRef(null);

  const getVideoThumbnail = (url, type) => {
    if (type === "upload" && /res\.cloudinary\.com/.test(url || "")) {
      return url.replace("/video/upload/", "/video/upload/so_1/").replace(/\.(mp4|mov|webm)$/i, ".jpg");
    }
    const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
  };

  const getVideoType = (url, storedType) => {
    if (storedType === "upload" || /res\.cloudinary\.com/.test(url || "")) return "upload";
    if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
    if (/drive\.google\.com/.test(url)) return 'drive';
    return 'other';
  };

  const fetchContent = async () => {
    if (!courseId || !subjectId) { setLoading(false); return; }
    try {
      const res = await axios.get(`${API_URL}/api/tutor-content?courseId=${courseId}&subjectId=${subjectId}`);
      setVideos(res.data.videos || []);
      setDocuments(res.data.files || []);
    } catch (e) {
      console.error("Error fetching content:", e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchContent(); }, [courseId, subjectId]);

  // ===== VIDEO =====
  const handleSaveNewVideo = async () => {
    if (!newVideo.title.trim() || !newVideoFile) return alert("กรุณาระบุชื่อและเลือกไฟล์วิดีโอ");
    if (newVideoFile.size > 500 * 1024 * 1024) return alert("ไฟล์วิดีโอต้องมีขนาดไม่เกิน 500 MB");
    setIsSubmitting(true);
    try {
      const signature = await axios.post(`${API_URL}/api/tutor-content/video/upload-signature`, {}, {
        headers: authHeaders,
      });
      const form = new FormData();
      form.append("file", newVideoFile);
      form.append("api_key", signature.data.apiKey);
      form.append("timestamp", String(signature.data.timestamp));
      form.append("folder", signature.data.folder);
      form.append("signature", signature.data.signature);
      const upload = await axios.post(signature.data.uploadUrl, form);
      await axios.post(`${API_URL}/api/tutor-content/video`, {
        CourseID: courseId, SubjectId: subjectId, AdminId: adminId,
        VideoTitle: newVideo.title.trim(), VideoUrl: upload.data.secure_url,
        VideoType: "upload", Duration: newVideo.duration || upload.data.duration
      }, { headers: authHeaders });
      setIsAddVideoOpen(false);
      setNewVideo({ title: "", duration: "" });
      setNewVideoFile(null);
      fetchContent();
    } catch (error) { alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการอัปโหลดวิดีโอ"); }
    finally { setIsSubmitting(false); }
  };

  const handleSaveEditVideo = async (videoId) => {
    if (!editVideoData.title.trim()) return alert("กรุณาระบุชื่อวิดีโอ");
    setIsSubmitting(true);
    try {
      await axios.put(`${API_URL}/api/tutor-content/video/${videoId}`, {
        VideoTitle: editVideoData.title.trim(), VideoUrl: editVideoData.url,
        VideoType: editVideoData.type, Duration: editVideoData.duration
      }, { headers: authHeaders });
      setEditingVideoId(null);
      fetchContent();
    } catch (error) { alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขวิดีโอ"); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteVideo = async (id) => {
    if (!confirm("ต้องการลบวิดีโอนี้?")) return;
    try {
      await axios.delete(`${API_URL}/api/tutor-content/video/${id}`, { headers: authHeaders });
      setVideos(videos.filter(v => v.VideoId !== id));
    } catch { alert("ลบวิดีโอไม่สำเร็จ"); }
  };

  // ===== UPLOAD DOC =====
  const handleUploadFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    if (!uploadDisplayName) setUploadDisplayName(file.name);
  };

  const handleSaveDoc = async () => {
    if (!uploadFile) return alert("กรุณาเลือกไฟล์");
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("CourseID", courseId);
    formData.append("SubjectId", subjectId);
    formData.append("AdminId", adminId);
    formData.append("DisplayName", uploadDisplayName.trim());
    try {
      await axios.post(`${API_URL}/api/tutor-content/file`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsUploadDocOpen(false);
      setUploadFile(null);
      setUploadDisplayName("");
      fetchContent();
    } catch { alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์"); }
    finally { setIsSubmitting(false); }
  };

  // ===== EDIT DOC =====
  const handleSaveEditDoc = async () => {
    if (!editDocName.trim()) return alert("กรุณาระบุชื่อไฟล์");
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("FileName", editDocName.trim());
      if (editDocFile) formData.append("file", editDocFile);
      await axios.put(`${API_URL}/api/tutor-content/file/${editingDoc.FileId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditingDoc(null);
      fetchContent();
    } catch { alert("เกิดข้อผิดพลาดในการแก้ไขไฟล์"); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm("ต้องการลบเอกสารนี้?")) return;
    try {
      await axios.delete(`${API_URL}/api/tutor-content/file/${id}`);
      setDocuments(documents.filter(d => d.FileId !== id));
    } catch { alert("ลบไฟล์ไม่สำเร็จ"); }
  };

  if (loading) return (
    <div className="mt-[90px] flex flex-col items-center justify-center h-64 text-neutral-500">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
      กำลังดึงข้อมูล...
    </div>
  );

  return (
    <div className="min-h-screen mt-[70px] pb-12">
      <div className="mx-auto">

        {/* Header */}
        <div className="py-6">
          <div className="mb-3 flex items-center text-sm text-neutral-500">
            <Link to="/tutor/courses" className="hover:text-orange-600 transition">คอร์สของฉัน</Link>
            <ChevronRight className="mx-1.5 h-4 w-4" />
            <span className="text-neutral-800 font-medium">จัดการเนื้อหา</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">{courseName}</h1>
        </div>

        {/* ===== GRID ===== */}
        {/* ✅ items-start ทำให้สูงตามเนื้อหาตัวเอง + overflow-hidden + fixed max-height */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* VIDEOS */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col" style={{ maxHeight: '75vh' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
              <h2 className="flex items-center gap-2 font-bold text-neutral-800">
                <span className="p-1.5 bg-orange-100 rounded-lg"><Video className="h-4 w-4 text-orange-500" /></span>
                คลิปวิดีโอ
                <span className="ml-1 text-sm font-medium text-neutral-400">({videos.length})</span>
              </h2>
              <button onClick={() => setIsAddVideoOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition shadow-sm">
                <Plus className="h-4 w-4" /> เพิ่มวิดีโอ
              </button>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {videos.length > 0 ? videos.map((video) => (
                <div key={video.VideoId} className="rounded-xl border border-neutral-200 hover:border-orange-200 hover:shadow-sm transition bg-white overflow-hidden">
                  {editingVideoId === video.VideoId ? (
                    /* Edit Mode */
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-neutral-500 mb-1 block">ชื่อวิดีโอ</label>
                        <input type="text" value={editVideoData.title} onChange={e => setEditVideoData({ ...editVideoData, title: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" disabled={isSubmitting} />
                      </div>
                      <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                        ไฟล์วิดีโอเดิมจะไม่ถูกเปลี่ยน หากต้องการเปลี่ยนไฟล์ให้ลบรายการนี้แล้วอัปโหลดใหม่
                      </p>
                      <div>
                        <label className="text-xs font-bold text-neutral-500 mb-1 block">ความยาวคลิป</label>
                        <input type="text" value={editVideoData.duration} onChange={e => setEditVideoData({ ...editVideoData, duration: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="เช่น 1 ชม. 30 นาที" disabled={isSubmitting} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingVideoId(null)} disabled={isSubmitting}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-neutral-100 text-neutral-600 rounded-lg text-sm font-bold hover:bg-neutral-200 transition">
                          <X className="h-4 w-4" /> ยกเลิก
                        </button>
                        <button onClick={() => handleSaveEditVideo(video.VideoId)} disabled={isSubmitting}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition">
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> บันทึก</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ✅ View Mode — แนวนอน thumbnail เล็ก + ข้อมูลข้างๆ */
                    <div className="flex items-stretch gap-0">
                      {/* Thumbnail */}
                      <a href={video.VideoUrl} target="_blank" rel="noreferrer" className="relative flex-shrink-0 w-28 bg-neutral-100 group">
                        {getVideoThumbnail(video.VideoUrl, video.VideoType) ? (
                          <img src={getVideoThumbnail(video.VideoUrl, video.VideoType)} alt="" className="w-28 h-full object-cover" />
                        ) : (
                          <div className="w-28 h-full flex items-center justify-center min-h-[72px]">
                            <span className="text-2xl">📁</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <PlayCircle className="h-8 w-8 text-white" />
                        </div>
                      </a>

                      {/* Info */}
                      <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getVideoType(video.VideoUrl, video.VideoType) === 'upload' ? 'bg-purple-50 text-purple-600' : 'bg-neutral-100 text-neutral-500'}`}>
                              {getVideoType(video.VideoUrl, video.VideoType) === 'upload' ? '🎬 วิดีโอระบบ' : 'คลิปเดิม'}
                            </span>
                            {video.Duration && <span className="text-[10px] text-neutral-400">{video.Duration}</span>}
                          </div>
                          <p className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">{video.VideoTitle}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                            <Calendar className="h-3 w-3" />{video.date}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => { setEditingVideoId(video.VideoId); setEditVideoData({ title: video.VideoTitle, url: video.VideoUrl, type: video.VideoType || getVideoType(video.VideoUrl), duration: video.Duration || "" }); }}
                              className="p-1.5 text-neutral-300 hover:text-orange-500 transition rounded-lg hover:bg-orange-50">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteVideo(video.VideoId)}
                              className="p-1.5 text-neutral-300 hover:text-red-500 transition rounded-lg hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                  <Video className="h-10 w-10 text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-400">ยังไม่มีวิดีโอในวิชานี้</p>
                </div>
              )}
            </div>
          </div>

          {/* DOCUMENTS */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col" style={{ maxHeight: '75vh' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
              <h2 className="flex items-center gap-2 font-bold text-neutral-800">
                <span className="p-1.5 bg-blue-100 rounded-lg"><FileText className="h-4 w-4 text-blue-500" /></span>
                เอกสาร
                <span className="ml-1 text-sm font-medium text-neutral-400">({documents.length})</span>
              </h2>
              <button onClick={() => setIsUploadDocOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition shadow-sm">
                <UploadCloud className="h-4 w-4" /> อัปโหลด
              </button>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {documents.length > 0 ? documents.map((doc) => (
                <div key={doc.FileId} className="rounded-xl border border-neutral-200 hover:border-blue-200 hover:shadow-sm transition bg-white p-4 flex items-center gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{doc.FileName}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{doc.date}</span>
                      <span>{doc.FileSize}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={getFileUrl(doc.FilePath)} download target="_blank" rel="noreferrer"
                      className="p-1.5 text-neutral-300 hover:text-green-500 transition rounded-lg hover:bg-green-50" title="ดาวน์โหลด">
                      <Download className="h-4 w-4" />
                    </a>
                    <button onClick={() => { setEditingDoc(doc); setEditDocName(doc.FileName); setEditDocFile(null); }}
                      className="p-1.5 text-neutral-300 hover:text-blue-500 transition rounded-lg hover:bg-blue-50" title="แก้ไข">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteDoc(doc.FileId)}
                      className="p-1.5 text-neutral-300 hover:text-red-500 transition rounded-lg hover:bg-red-50" title="ลบ">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                  <FileText className="h-10 w-10 text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-400">ยังไม่มีเอกสารในวิชานี้</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ===== MODAL: ADD VIDEO ===== */}
      {isAddVideoOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-orange-500" /> อัปโหลดวิดีโอบทเรียน
            </h3>
            <div className="space-y-3">
              {[
                { label: "ชื่อวิดีโอ / หัวข้อ", key: "title", type: "text", placeholder: "เช่น EP.1: แนะนำบทเรียน" },
                { label: "ความยาวคลิป (ไม่บังคับ)", key: "duration", type: "text", placeholder: "เช่น 1 ชม. 30 นาที" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
                  <input type={type} value={newVideo[key]} onChange={e => setNewVideo({ ...newVideo, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition"
                    placeholder={placeholder} disabled={isSubmitting} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">เลือกไฟล์วิดีโอ</label>
                <input type="file" accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                  onChange={event => setNewVideoFile(event.target.files?.[0] || null)} disabled={isSubmitting}
                  className="block w-full text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100" />
                <p className="mt-1.5 text-xs text-neutral-400">รองรับ MP4, MOV และ WEBM ขนาดไม่เกิน 500 MB ไม่รองรับลิงก์ YouTube/Drive</p>
                {newVideoFile && <p className="mt-1 text-xs font-medium text-orange-600">ไฟล์: {newVideoFile.name}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setIsAddVideoOpen(false); setNewVideo({ title: "", duration: "" }); setNewVideoFile(null); }} disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 disabled:opacity-50 transition">ยกเลิก</button>
                <button onClick={handleSaveNewVideo} disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "บันทึก"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: UPLOAD DOC ===== */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-blue-500" /> อัปโหลดเอกสาร
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">เลือกไฟล์ (PDF, DOCX, DOC)</label>
                <input type="file" onChange={handleUploadFileChange} accept=".pdf,.doc,.docx" disabled={isSubmitting}
                  className="block w-full text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition cursor-pointer" />
                {uploadFile && <p className="mt-1.5 text-xs text-neutral-400">ไฟล์: {uploadFile.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  ชื่อที่แสดงในระบบ <span className="text-neutral-400 font-normal text-xs">(แก้ได้)</span>
                </label>
                <input type="text" value={uploadDisplayName} onChange={e => setUploadDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
                  placeholder="เช่น เอกสารประกอบบทที่ 1" disabled={isSubmitting} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setIsUploadDocOpen(false); setUploadFile(null); setUploadDisplayName(""); }} disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 disabled:opacity-50 transition">ยกเลิก</button>
                <button onClick={handleSaveDoc} disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "อัปโหลด"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT DOC ===== */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-500" /> แก้ไขเอกสาร
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">ชื่อที่แสดงในระบบ</label>
                <input type="text" value={editDocName} onChange={e => setEditDocName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  disabled={isSubmitting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  เปลี่ยนไฟล์ใหม่ <span className="text-neutral-400 font-normal text-xs">(ไม่บังคับ)</span>
                </label>
                <input ref={editFileInputRef} type="file" onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setEditDocFile(file);
                  if (editDocName === editingDoc?.FileName) setEditDocName(file.name);
                }} accept=".pdf,.doc,.docx" disabled={isSubmitting}
                  className="block w-full text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-neutral-100 file:text-neutral-600 hover:file:bg-neutral-200 transition cursor-pointer" />
                {editDocFile
                  ? <p className="mt-1.5 text-xs text-blue-600">✅ ไฟล์ใหม่: {editDocFile.name}</p>
                  : <p className="mt-1.5 text-xs text-neutral-400">ใช้ไฟล์เดิม: {editingDoc.FileName}</p>
                }
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingDoc(null)} disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 disabled:opacity-50 transition">ยกเลิก</button>
                <button onClick={handleSaveEditDoc} disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="h-4 w-4" /> บันทึก</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
