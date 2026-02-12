import { ChevronRight, Video, FileText, Eye, Trash2, Calendar, BarChart3, Edit, Plus, Download, Upload } from "lucide-react";
import { useState } from "react";

export default function CourseManagePage() {
  const [isUploadVideoOpen, setIsUploadVideoOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);

  const courseInfo = {
    id: 1,
    name: "คณิตศาสตร์ ม.3 เทอม 1/2567",
    startDate: "15 พ.ค. 2567",
    studentCount: 24,
  };

  const [videos, setVideos] = useState([
    { id: 1, title: "บทที่ 1: พีชคณิต - เลขยกกำลัง", uploadDate: "20 พ.ค. 2567", duration: "45:32", views: 22, size: "245 MB" },
    { id: 2, title: "บทที่ 2: สมการและอสมการ", uploadDate: "27 พ.ค. 2567", duration: "52:18", views: 20, size: "298 MB" },
    { id: 3, title: "บทที่ 3: ฟังก์ชันเชิงเส้น", uploadDate: "3 มิ.ย. 2567", duration: "48:45", views: 18, size: "267 MB" },
  ]);

  const [documents, setDocuments] = useState([
    { id: 1, title: "แบบฝึกหัดบทที่ 1", uploadDate: "20 พ.ค. 2567", downloads: 24, size: "2.4 MB", type: "PDF" },
    { id: 2, title: "สรุปสูตรพีชคณิต", uploadDate: "20 พ.ค. 2567", downloads: 23, size: "1.8 MB", type: "PDF" },
    { id: 3, title: "ข้อสอบกลางภาค", uploadDate: "10 มิ.ย. 2567", downloads: 22, size: "3.2 MB", type: "PDF" },
  ]);

  const handleDeleteVideo = (id) => {
    if (confirm('ต้องการลบวิดีโอนี้ใช่หรือไม่?')) {
      setVideos(videos.filter(v => v.id !== id));
    }
  };

  const handleDeleteDoc = (id) => {
    if (confirm('ต้องการลบเอกสารนี้ใช่หรือไม่?')) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video);
  };

  const handleEditDoc = (doc) => {
    setEditingDoc(doc);
  };

  const handleSaveVideo = () => {
    if (editingVideo) {
      setVideos(videos.map(v => v.id === editingVideo.id ? editingVideo : v));
      setEditingVideo(null);
    }
  };

  const handleSaveDoc = () => {
    if (editingDoc) {
      setDocuments(documents.map(d => d.id === editingDoc.id ? editingDoc : d));
      setEditingDoc(null);
    }
  };

  return (
    <div className="min-h-screen space-y-6 mt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-6">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center text-sm">
            <a
              href="/tutor/courses"
              className="font-medium text-gray-500 hover:text-orange-600 transition"
            >
              คอร์ส
            </a>
            <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-800">
              จัดการคลิป/เอกสาร
            </span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{courseInfo.name}</h1>
              <p className="mt-1 text-sm text-neutral-500">
                เริ่มเรียน: {courseInfo.startDate} • นักเรียน {courseInfo.studentCount} คน
              </p>
            </div>

          </div>
        </div>

        {/* Video and Document Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Video Section */}
          <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden">
            <div className="p-5 bg-linear-to-br from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
                  <Video className="h-5 w-5 text-orange-600" />
                  คลิปวิดีโอ ({videos.length})
                </h2>

              </div>
            </div>

            <div className="p-5 space-y-3 bg-neutral-50">
              {videos.map((video) => (
                <div key={video.id} className="bg-white rounded-xl p-4 border-2 border-neutral-200 hover:border-orange-300 transition">
                  <h4 className="font-semibold text-neutral-900">{video.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {video.uploadDate}
                    </span>
                    <span>{video.duration}</span>
                    <span>{video.size}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-neutral-900">{video.views}</span>
                      <span className="text-neutral-600">ครั้งที่ดู</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditDoc(doc)}
                        className="flex items-center gap-1 px-2 py-1 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition text-sm"
                      >
                        <Plus className="h-3 w-3" />
                        เพิ่ม
                      </button>
                      <button
                        onClick={() => handleEditVideo(video)}
                        className="flex items-center gap-1 px-2 py-1 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition text-sm"
                      >
                        <Edit className="h-3 w-3" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="flex items-center gap-1 px-2 py-1 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition text-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {videos.length === 0 && (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">ยังไม่มีวิดีโอ</p>
                </div>
              )}
            </div>
          </div>

          {/* Document Section */}
          <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden">
            <div className="p-5 bg-linear-to-br from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
                  <FileText className="h-5 w-5 text-orange-600" />
                  เอกสาร ({documents.length})
                </h2>

              </div>
            </div>

            <div className="p-5 space-y-3 bg-neutral-50">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl p-4 border-2 border-neutral-200 hover:border-orange-300 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs font-medium border border-orange-200">
                      {doc.type}
                    </span>
                    <h4 className="font-semibold text-neutral-900">{doc.title}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {doc.uploadDate}
                    </span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Download className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-neutral-900">{doc.downloads}</span>
                      <span className="text-neutral-600">ดาวน์โหลด</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditDoc(doc)}
                        className="flex items-center gap-1 px-2 py-1 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition text-sm"
                      >
                        <Plus className="h-3 w-3" />
                        เพิ่ม
                      </button>
                      <button
                        onClick={() => handleEditDoc(doc)}
                        className="flex items-center gap-1 px-2 py-1 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition text-sm"
                      >
                        <Edit className="h-3 w-3" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="flex items-center gap-1 px-2 py-1 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition text-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">ยังไม่มีเอกสาร</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Video Modal */}
      {isUploadVideoOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">เพิ่มวิดีโอใหม่</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">ชื่อวิดีโอ</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="บทที่ 4: ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">ไฟล์วิดีโอ</label>
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-orange-500 transition cursor-pointer">
                  <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">คลิกเพื่อเลือกไฟล์</p>
                  <p className="text-xs text-neutral-500 mt-1">รองรับ MP4, MOV (สูงสุด 2GB)</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsUploadVideoOpen(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => setIsUploadVideoOpen(false)}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  อัปโหลด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">เพิ่มเอกสารใหม่</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">ชื่อเอกสาร</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="แบบฝึกหัดบทที่ 4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">ไฟล์เอกสาร</label>
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-orange-500 transition cursor-pointer">
                  <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">คลิกเพื่อเลือกไฟล์</p>
                  <p className="text-xs text-neutral-500 mt-1">รองรับ PDF, DOCX (สูงสุด 50MB)</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsUploadDocOpen(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => setIsUploadDocOpen(false)}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  อัปโหลด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">แก้ไขวิดีโอ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">ชื่อวิดีโอ</label>
                <input
                  type="text"
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingVideo(null)}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveVideo}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">แก้ไขเอกสาร</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">ชื่อเอกสาร</label>
                <input
                  type="text"
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingDoc(null)}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveDoc}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}