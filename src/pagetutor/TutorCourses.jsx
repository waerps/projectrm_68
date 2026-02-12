import { BookOpen, Users, Clock, Video, FileText, Search, PenTool, ClipboardCheck, FileCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom"

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const courses = [
    {
      id: 1,
      name: "คณิตศาสตร์ ม.3 เทอม 1/2567",
      startDate: "15 พ.ค. 2567",
      totalHours: 48,
      studentCount: 24,
      status: "active",
      progress: 65,
    },
    {
      id: 2,
      name: "ภาษาไทย ม.3 เทอม 1/2567",
      startDate: "15 พ.ค. 2567",
      totalHours: 48,
      studentCount: 24,
      status: "active",
      progress: 55,
    },
    {
      id: 3,
      name: "ภาษาไทย ม.4 เทอม 1/2567",
      startDate: "1 มิ.ย. 2567",
      totalHours: 48,
      studentCount: 15,
      status: "active",
      progress: 80,
    },
    {
      id: 4,
      name: "คณิต ม.4 เทอม 2/2566",
      startDate: "1 พ.ย. 2566",
      totalHours: 48,
      studentCount: 22,
      status: "completed",
      progress: 100,
    },
    {
      id: 5,
      name: "ภาษาไทย ม.6 เทอม 1/2568",
      startDate: "20 มิ.ย. 2567",
      totalHours: 40,
      studentCount: 20,
      status: "upcoming",
      progress: 0,
    },
  ];

  const stats = [
    { label: "คอร์สทั้งหมด", value: "5", icon: BookOpen },
    { label: "นักเรียนรวม", value: "127", icon: Users },
    { label: "ชั่วโมงสอน", value: "432", icon: Clock },
  ];

  // 🔍 Filter & Search Logic
  const filteredCourses = courses.filter((course) => {
    // Filter by status
    const statusMatch = filterStatus === "all" || course.status === filterStatus;

    // Search by name
    const searchMatch = search === "" ||
      course.name.toLowerCase().includes(search.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Navigate to TutorManage (mock function)
  const handleManageCourse = (courseId) => {
    console.log(`Navigate to TutorManage for course ${courseId}`);
    // In real app: navigate('/tutor-manage', { state: { courseId } })
  };

  return (
    <div className="space-y-6 mt-[90px]">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">คอร์สเรียนทั้งหมด</h1>
          <p className="text-sm text-neutral-500 mt-1">
            จัดการและติดตามความคืบหน้าของคอร์สเรียน
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex items-center gap-4 p-5 bg-linear-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 hover:shadow-md transition">
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

        {/* Search & Filter Bar */}
        <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="ค้นหาคอร์ส..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            {/* Filter Status */}
            <select
              className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[180px]"
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
            <div className="col-span-2 text-center py-12">
              <div className="text-5xl mb-3">📚</div>
              <p className="text-neutral-500 text-sm">ไม่พบคอร์สที่ค้นหา</p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 hover:shadow-lg transition overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-neutral-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-neutral-900 mb-1">
                        {course.name}
                      </h2>
                      <p className="text-xs text-neutral-500">
                        เริ่มเรียน: {course.startDate}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${course.status === "active"
                        ? "bg-green-100 text-green-700"
                        : course.status === "completed"
                          ? "bg-neutral-200 text-neutral-700"
                          : "bg-blue-100 text-blue-700"
                        }`}
                    >
                      {course.status === "active"
                        ? "กำลังสอน"
                        : course.status === "completed"
                          ? "สอนจบแล้ว"
                          : "ยังไม่เริ่ม"}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-600 font-medium">ความคืบหน้า</span>
                      <span className="font-bold text-orange-600">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-orange-500 to-orange-600 transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-50">
                  <div className="text-center">
                    <Clock className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                    <p className="font-bold text-neutral-900">{course.totalHours}</p>
                    <p className="text-xs text-neutral-600">ชั่วโมง</p>
                  </div>
                  <div className="text-center">
                    <Users className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                    <p className="font-bold text-neutral-900">{course.studentCount}</p>
                    <p className="text-xs text-neutral-600">นักเรียน</p>
                  </div>
                  <div className="text-center">
                    <Video className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                    <p className="font-bold text-neutral-900">24</p>
                    <p className="text-xs text-neutral-600">คลิป</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 p-4 bg-white">
                  <button className="flex-1 border-2 border-neutral-300 text-neutral-700 rounded-xl py-2.5 hover:bg-neutral-100 transition flex items-center justify-center gap-2 font-medium">
                    <Users className="h-4 w-4" />
                    <Link to="/tutor/students">
                      <span className="text-sm">ดูนักเรียน</span>
                    </Link>
                  </button>
                  <button
                    onClick={() => handleManageCourse(course.id)}
                    className="flex-1 border-2 border-neutral-300 text-neutral-700 rounded-xl py-2.5 hover:bg-neutral-100 transition flex items-center justify-center gap-2 font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    <Link to="/tutor/manage">
                      <span className="text-sm">จัดการคลิป/เอกสาร</span>
                    </Link>
                  </button>
                  <button className="flex-1 border-2 border-neutral-300 text-neutral-700 rounded-xl py-2.5 hover:bg-neutral-100 transition flex items-center justify-center gap-2 font-medium">
                    <ClipboardCheck className="h-4 w-4" />
                    <Link to="/tutor/exam">
                      <span className="text-sm">จัดการการสอบ</span>
                    </Link>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}