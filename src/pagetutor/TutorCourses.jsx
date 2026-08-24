import { API_URL } from "../config";
import { BookOpen, Users, Clock, Video, FileText, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function CoursesPage() {
  console.log("USER OBJECT IN LOCALSTORAGE:", localStorage.getItem("user")); // 👈 เพิ่มบรรทัดนี้ชั่วคราว
const tutorId = JSON.parse(localStorage.getItem("user"))?.id;
console.log("tutorId ที่ได้:", tutorId); // 👈 เพิ่มบรรทัดนี้ด้วย

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
const [subjectModal, setSubjectModal] = useState(null); // { course, action } | null

const navigateToAction = (course, subject, action) => {
  if (action === "content") {
    navigate(`/tutor/manage?courseId=${course.id}&subjectId=${subject.subjectId}&courseName=${encodeURIComponent(course.name)}&subjectName=${encodeURIComponent(subject.subjectName)}`);
  }
};

const handleSubjectAction = (course, action) => {
  if (course.subjects.length === 1) {
    navigateToAction(course, course.subjects[0], action);
  } else {
    setSubjectModal({ course, action });
  }
};

  // 1. ฟังก์ชันเช็คสถานะคอร์สจากวันที่
  const mapStatus = (statusId, startDate, lastDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(lastDate);

    if (Number(statusId) === 3 || Number(statusId) === 4 || today > end) {
      return { id: "completed", text: "สอนจบแล้ว", colorClass: "bg-neutral-200 text-neutral-700" };
    }
    if (today >= start && today <= end) {
      return { id: "active", text: "กำลังสอน", colorClass: "bg-green-100 text-green-700" };
    }
    return { id: "upcoming", text: "ยังไม่เริ่มสอน", colorClass: "bg-blue-100 text-blue-700" };
  };

  // 2. ฟังก์ชันคำนวณ Progress จากชั่วโมงสอนจริง
  const calculateProgressByHours = (completedHours, totalHours, statusId) => {
    // ✅ ถ้าคอร์สจบแล้ว ให้ progress = 100 เสมอ
    if (statusId === 'completed') return 100;

    if (!totalHours || Number(totalHours) === 0) return 0;
    let percent = (Number(completedHours) / Number(totalHours)) * 100;
    if (percent > 100) return 100;
    if (percent < 0) return 0;
    return Math.round(percent);
  };

  // 3. ดึงข้อมูลจาก API (แบบส่ง adminId ไปด้วย)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // ยิง API พร้อมพารามิเตอร์ adminId
        const response = await axios.get(`${API_URL}/coursestutor?adminId=${tutorId}`);
        console.log("RAW API RESPONSE:", response.data); // 👈 เพิ่มบรรทัดนี้ชั่วคราว

        // ✅ Group ตาม CourseID เพื่อรวมหลายวิชาไว้ใน Course เดียว
const courseMap = new Map();

response.data.forEach(row => {
  const statusInfo = mapStatus(row.Status_Course_Id, row.StartDate, row.LastDate);
  const subjectTotalHours = Number(row.TotalHoursScheduled) || 0;
  const subjectCompletedHours = Number(row.CompletedHours) || 0;

  if (!courseMap.has(row.CourseID)) {
    courseMap.set(row.CourseID, {
      id: row.CourseID,
      name: row.CourseName, // ไม่ต่อชื่อวิชาแล้ว
      startDate: row.StartDate
        ? new Date(row.StartDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
        : "ไม่ระบุ",
      totalHours: 0,
      completedHours: 0,
      StudentCount: row.StudentCount || 0, // ค่าเดียวกันทุกแถวของ Course นี้
      VideoCount: 0,
      FileCount: 0,
      statusId: statusInfo.id,
      statusText: statusInfo.text,
      statusColor: statusInfo.colorClass,
      subjects: [], // รายวิชาที่ติวเตอร์รับผิดชอบใน Course นี้
    });
  }

  const c = courseMap.get(row.CourseID);
  c.totalHours += subjectTotalHours;
  c.completedHours += statusInfo.id === 'completed' ? subjectTotalHours : subjectCompletedHours;
  c.VideoCount += row.VideoCount || 0;
  c.FileCount += row.FileCount || 0;
  c.subjects.push({ subjectId: row.SubjectId, subjectName: row.SubjectName });
});

const formattedData = Array.from(courseMap.values()).map(c => ({
  ...c,
  progress: calculateProgressByHours(c.completedHours, c.totalHours, c.statusId),
}));

setCourses(formattedData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [tutorId]);

  // 4. คำนวณ Stats ด้านบนสุด
  // ✅ ใหม่ (กรองให้เหลือคอร์สละ 1 ก่อน แล้วค่อยรวม)
  const uniqueCourses = [...new Map(courses.map(c => [c.id, c])).values()];
  const totalStudents = uniqueCourses.reduce((sum, c) => sum + Number(c.StudentCount), 0);
  const totalHoursAllCourses = courses.reduce((sum, course) => sum + Number(course.totalHours), 0);

  const stats = [
    { label: "คอร์สทั้งหมด", value: courses.length.toString(), icon: BookOpen },
    { label: "นักเรียนรวม", value: totalStudents.toString(), icon: Users },
    { label: "ชั่วโมงสอน", value: totalHoursAllCourses.toString(), icon: Clock },
  ];

  // 🔍 กรองข้อมูลตามการค้นหา
  const filteredCourses = courses.filter((course) => {
    const statusMatch = filterStatus === "all" || course.statusId === filterStatus;
    const searchMatch = search === "" || course.name.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  if (loading) return <div className="mt-[90px] text-center p-10 font-medium text-neutral-500">กำลังโหลดข้อมูลคอร์ส...</div>;

  return (
    <div className="space-y-6 mt-[90px]">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">คอร์สและวิชาที่รับผิดชอบ</h1>
          <p className="text-sm text-neutral-500 mt-1">
            ติดตามความคืบหน้าและจัดการข้อมูลในรายวิชาของคุณ
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-neutral-600 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อคอร์ส หรือ รายวิชา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none"
              />
            </div>
            <select
              className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none md:min-w-[180px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">กำลังสอน</option>
              <option value="completed">สอนจบแล้ว</option>
              <option value="upcoming">ยังไม่เริ่มสอน</option>
            </select>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
          {filteredCourses.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-white rounded-3xl border border-neutral-200 border-dashed">
              <div className="text-5xl mb-3">📚</div>
              <p className="text-neutral-500 font-medium">ไม่พบคอร์สเรียนของคุณ</p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-neutral-100 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <h2 className="text-lg font-bold text-neutral-900 leading-tight mb-1">
                        {course.name}
                      </h2>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> เริ่มสอน: {course.startDate}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap shadow-sm border border-white/50 ${course.statusColor}`}>
                      {course.statusText}
                    </span>
                  </div>

                  {/* ⚡ Progress Bar แบบใหม่ */}
                  <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-600 font-bold">
                        ความคืบหน้า <span className="text-neutral-400 font-medium ml-1">({course.completedHours}/{course.totalHours} ชม.)</span>
                      </span>
                      <span className="font-black text-orange-600">{course.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 ease-out"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* สรุปตัวเลข - แบ่งเป็น 3 ส่วนเพื่อให้ดูง่าย */}
                <div className="grid grid-cols-3 gap-2 p-4 bg-neutral-50/50 border-y border-neutral-100">

                  {/* 1. จำนวนนักเรียน */}
                  <div className="flex items-center gap-2 border-r border-neutral-200 pr-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 leading-none">{course.StudentCount || 0}</p>
                      <p className="text-[9px] text-neutral-500 font-medium mt-1 uppercase">นักเรียน</p>
                    </div>
                  </div>

                  {/* 2. จำนวนวิดีโอ */}
                  <div className="flex items-center gap-2 border-r border-neutral-200 pr-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 leading-none">{course.VideoCount || 0}</p>
                      <p className="text-[9px] text-neutral-500 font-medium mt-1 uppercase">วิดีโอ</p>
                    </div>
                  </div>

                  {/* 3. จำนวนเอกสาร */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 leading-none">{course.FileCount || 0}</p>
                      <p className="text-[9px] text-neutral-500 font-medium mt-1 uppercase">ไฟล์</p>
                    </div>
                  </div>

                </div>

                {/* ✅ แก้ไขปุ่ม Action (ส่งชื่อคอร์สและวิชาไปใน URL ด้วย) */}
                <div className="flex gap-3 p-4 bg-white border-t border-neutral-100">
                <Link
  to={`/tutor/students?courseId=${course.id}`}
  className="flex-1 border-2 border-neutral-200 text-neutral-700 rounded-xl py-2.5 hover:bg-neutral-50 hover:border-neutral-300 transition flex items-center justify-center gap-2 font-bold text-sm"
>
  <Users className="h-4 w-4 text-neutral-400" /> ดูนักเรียน
</Link>

<button
  onClick={() => handleSubjectAction(course, "content")}
  className="flex-1 bg-orange-50 text-orange-600 border-2 border-orange-100 rounded-xl py-2.5 hover:bg-orange-100 hover:border-orange-200 transition flex items-center justify-center gap-2 font-bold text-sm shadow-sm"
>
  <FileText className="h-4 w-4" /> จัดการเนื้อหา
</button>

                  <Link
                    to={`/tutor/exam-subjects?courseId=${course.id}&courseName=${encodeURIComponent(course.name)}`}
                    className="flex-1 bg-blue-50 text-blue-600 border-2 border-blue-100 rounded-xl py-2.5 hover:bg-blue-100 hover:border-blue-200 transition flex items-center justify-center gap-2 font-bold text-sm shadow-sm"
                  >
                    <FileText className="h-4 w-4" /> จัดการข้อสอบ
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
        {subjectModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <h3 className="text-lg font-bold text-neutral-900 mb-1">เลือกวิชา</h3>
      <p className="text-sm text-neutral-500 mb-4">
        {subjectModal.course.name} — เลือกวิชาที่ต้องการจัดการเนื้อหา
      </p>
      <div className="space-y-2">
        {subjectModal.course.subjects.map((subject) => (
          <button
            key={subject.subjectId}
            onClick={() => {
              navigateToAction(subjectModal.course, subject, subjectModal.action);
              setSubjectModal(null);
            }}
            className="w-full text-left px-4 py-3 rounded-xl border-2 border-neutral-200 hover:border-orange-400 hover:bg-orange-50 transition font-medium text-neutral-700"
          >
            {subject.subjectName}
          </button>
        ))}
      </div>
      <button
        onClick={() => setSubjectModal(null)}
        className="mt-4 w-full text-center py-2 text-sm text-neutral-500 hover:text-neutral-700"
      >
        ยกเลิก
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}