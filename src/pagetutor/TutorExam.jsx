import { useState, useEffect } from "react";
import { BookOpen, Users, Clock, QrCode, Copy, X, Check, AlertCircle, Play, StopCircle, ChevronRight, Download, Video, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export default function TutorExamManagement() {
  const [activeExamType, setActiveExamType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [timer, setTimer] = useState(0);
  const [studentProgress, setStudentProgress] = useState([]);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Mock course data
  const courseInfo = {
    name: "คณิตศาสตร์ ม.3 เทอม 1/2567",
    studentCount: 24,
  };

  // Exam types with status
  const [exams, setExams] = useState([
    {
      type: "pre-test",
      name: "Pre-test",
      fullName: "สอบก่อนเรียน",
      description: "ประเมินความรู้พื้นฐานก่อนเริ่มเรียน",
      status: "inactive",
      sessionId: null,
      startTime: null,
      totalQuestions: 20,
      duration: 60,
    },
    {
      type: "mid-test",
      name: "Mid-test",
      fullName: "สอบกลางเทอม",
      description: "ประเมินความเข้าใจกลางภาคเรียน",
      status: "inactive",
      sessionId: null,
      startTime: null,
      totalQuestions: 30,
      duration: 90,
    },
    {
      type: "post-test",
      name: "Post-test",
      fullName: "สอบหลังเรียน",
      description: "ประเมินผลการเรียนรู้หลังจบคอร์ส",
      status: "inactive",
      sessionId: null,
      startTime: null,
      totalQuestions: 40,
      duration: 120,
    },
  ]);

  // Mock student list
  const mockStudents = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: `นักเรียน ${i + 1}`,
    status: "not-joined",
    joinedAt: null,
  }));

  // Timer effect
  useEffect(() => {
    let interval;
    if (activeExamType) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeExamType]);

  // Simulate real-time student joining
  useEffect(() => {
    let interval;
    if (activeExamType && showModal) {
      interval = setInterval(() => {
        setStudentProgress((prev) => {
          const notJoined = prev.filter((s) => s.status === "not-joined");
          if (notJoined.length > 0 && Math.random() > 0.6) {
            const randomStudent = notJoined[Math.floor(Math.random() * notJoined.length)];
            return prev.map((s) =>
              s.id === randomStudent.id
                ? { ...s, status: "joined", joinedAt: new Date().toLocaleTimeString("th-TH") }
                : s
            );
          }
          return prev;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeExamType, showModal]);

  // Generate session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // Open exam
  const handleOpenExam = (examType) => {
    const sessionId = generateSessionId();
    setExams((prev) =>
      prev.map((exam) =>
        exam.type === examType
          ? { ...exam, status: "active", sessionId, startTime: new Date() }
          : exam
      )
    );
    setActiveExamType(examType);
    setTimer(0);
    setStudentProgress(mockStudents);
    setShowModal(true);
  };

  // Close exam
  const handleCloseExam = () => {
    setExams((prev) =>
      prev.map((exam) =>
        exam.type === activeExamType
          ? { ...exam, status: "closed" }
          : exam
      )
    );
    setShowModal(false);
    setShowConfirmClose(false);
    setActiveExamType(null);
    setTimer(0);
  };

  // Copy URL
  const handleCopyUrl = (sessionId) => {
    navigator.clipboard.writeText(`https://exam.sornserm.com/t/${sessionId}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Format timer
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      inactive: { bg: "bg-neutral-200", text: "text-neutral-700", label: "ยังไม่เปิด" },
      active: { bg: "bg-green-100", text: "text-green-700", label: "กำลังเปิดสอบ" },
      closed: { bg: "bg-neutral-200", text: "text-neutral-700", label: "ปิดแล้ว" },
    };
    const badge = badges[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const joinedCount = studentProgress.filter((s) => s.status === "joined").length;
  const activeExam = exams.find((e) => e.type === activeExamType);

  return (
    <div className="space-y-6 mt-[90px]">
      <div className="">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center text-sm">
          <Link
            to="/tutor/courses"
            className="font-medium text-gray-500 hover:text-orange-600 transition"
          >
            คอร์ส
          </Link>
          <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-800">จัดการการสอบ</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">จัดการการสอบ</h1>
              <p className="text-sm text-neutral-500 mt-1">
                {courseInfo.name} • นักเรียนทั้งหมด {courseInfo.studentCount} คน
              </p>
            </div>
          </div>
        </div>

        {/* Exam Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {exams.map((exam) => (
            <div
              key={exam.type}
              className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 hover:shadow-lg transition overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-neutral-900 mb-1">{exam.name}</h2>
                    <p className="text-xs text-neutral-500">{exam.fullName}</p>
                  </div>
                  {getStatusBadge(exam.status)}
                </div>
                <p className="text-sm text-neutral-600">{exam.description}</p>
              </div>

              {/* Info */}
              <div className="p-4 bg-neutral-50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">จำนวนข้อ</span>
                  <span className="font-semibold text-neutral-900">{exam.totalQuestions} ข้อ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">ระยะเวลา</span>
                  <span className="font-semibold text-neutral-900">{exam.duration} นาที</span>
                </div>
                {exam.status === "active" && exam.sessionId && (
                  <div className="pt-2 border-t border-neutral-200">
                    <p className="text-xs text-neutral-600 mb-1">Session ID</p>
                    <p className="text-sm font-mono font-bold text-orange-600">{exam.sessionId}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-white">
                {exam.status === "inactive" && (
                  <button
                    onClick={() => handleOpenExam(exam.type)}
                    className="w-full bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl py-2.5 font-medium hover:shadow-lg hover:scale-105 transition flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    เปิดสอบ
                  </button>
                )}

                {exam.status === "active" && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveExamType(exam.type);
                        setShowModal(true);
                      }}
                      className="w-full bg-green-500 text-white rounded-xl py-2.5 font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      ดู QR Code
                    </button>
                    <button
                      onClick={() => {
                        setActiveExamType(exam.type);
                        setShowConfirmClose(true);
                      }}
                      className="w-full border-2 border-red-300 text-red-600 rounded-xl py-2.5 font-medium hover:bg-red-50 transition flex items-center justify-center gap-2"
                    >
                      <StopCircle className="h-4 w-4" />
                      ปิดสอบ
                    </button>
                  </div>
                )}

                {exam.status === "closed" && (
                  <div className="text-center py-2">
                    <p className="text-sm font-medium text-neutral-600">การสอบนี้ปิดแล้ว</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exam Control Modal */}
      {showModal && activeExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-linear-to-br from-orange-50 to-amber-50 border-b border-orange-100 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">{activeExam.name}</h2>
                <p className="text-sm text-neutral-600 mt-1">{activeExam.fullName} • กำลังเปิดสอบ</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-10 w-10 rounded-xl hover:bg-white/50 flex items-center justify-center transition"
              >
                <X className="h-6 w-6 text-neutral-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-xs font-semibold text-neutral-700">เวลาที่เปิดสอบ</span>
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{formatTime(timer)}</p>
                </div>

                <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    <span className="text-xs font-semibold text-neutral-700">เข้าสอบแล้ว</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{joinedCount}/{courseInfo.studentCount}</p>
                </div>

                <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="text-xs font-semibold text-neutral-700">ยังไม่ได้เข้า</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{courseInfo.studentCount - joinedCount}</p>
                </div>
              </div>

              {/* QR Code & URL Section */}
              <div className="bg-neutral-50 rounded-2xl border-2 border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-orange-600" />
                  QR Code และลิงก์เข้าสอบ
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-6 rounded-xl border-2 border-neutral-200">
                      <div className="h-[280px] w-[280px] bg-neutral-50 flex items-center justify-center rounded-lg">
                        <div className="text-center">
                          <QrCode className="h-32 w-32 text-neutral-300 mx-auto mb-3" />
                          <p className="text-xs text-neutral-500">QR Code สำหรับนักเรียน</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* URL Info */}
                  <div className="flex flex-col justify-center space-y-4">
                    <div>
                      <label className="text-sm text-neutral-600 font-medium mb-2 block">Session ID</label>
                      <div className="bg-white border-2 border-neutral-200 rounded-xl p-3">
                        <p className="text-xl font-mono font-bold text-orange-600 text-center">
                          {activeExam.sessionId}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-neutral-600 font-medium mb-2 block">ลิงก์เข้าสอบ</label>
                      <div className="bg-white border-2 border-neutral-200 rounded-xl p-3">
                        <p className="text-sm font-mono text-neutral-900 break-all">
                          https://exam.sornserm.com/t/{activeExam.sessionId}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyUrl(activeExam.sessionId)}
                      className="bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl py-3 font-medium hover:shadow-lg hover:scale-105 transition flex items-center justify-center gap-2"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="h-5 w-5" />
                          คัดลอกแล้ว!
                        </>
                      ) : (
                        <>
                          <Copy className="h-5 w-5" />
                          คัดลอก URL
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Student List */}
              <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden">
                <div className="p-5 bg-linear-to-br from-orange-50 to-amber-50 border-b border-orange-100">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    รายชื่อนักเรียน ({joinedCount}/{courseInfo.studentCount})
                  </h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {studentProgress.map((student) => (
                    <div
                      key={student.id}
                      className={`flex justify-between items-center p-4 border-b border-neutral-100 last:border-b-0 transition ${
                        student.status === "joined" ? "bg-green-50" : "bg-white hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white transition ${
                            student.status === "joined" ? "bg-green-500" : "bg-neutral-300"
                          }`}
                        >
                          {student.id}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{student.name}</p>
                          {student.status === "joined" && student.joinedAt && (
                            <p className="text-xs text-green-700">เข้าสอบเมื่อ {student.joinedAt}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                          student.status === "joined"
                            ? "bg-green-500 text-white"
                            : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {student.status === "joined" ? "เข้าแล้ว" : "ยังไม่เข้า"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Close Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmClose(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">ยืนยันการปิดสอบ?</h3>
              <p className="text-sm text-neutral-600">
                เมื่อปิดสอบแล้ว นักเรียนจะไม่สามารถเข้าสอบได้อีก และลิงก์จะใช้งานไม่ได้ทันที
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 border-2 border-neutral-300 text-neutral-700 rounded-xl py-3 font-semibold hover:bg-neutral-100 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCloseExam}
                className="flex-1 bg-red-500 text-white rounded-xl py-3 font-semibold hover:bg-red-600 transition"
              >
                ปิดสอบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}