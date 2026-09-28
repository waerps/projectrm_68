import { API_URL } from "../config";
import { BookOpen, Users, Clock, Video, FileText, Search, CalendarDays, MapPin, Paperclip, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import SegmentedControl from "../components/ui/SegmentedControl";
import { PAGE_TITLE, PAGE_SUBTITLE } from "../components/ui/tokens";
import { BookOpen as LuBookOpen } from "lucide-react";
import Spinner from "../components/ui/Spinner";
import ErrorState from "../components/ui/ErrorState";
import { ClipboardList } from "lucide-react";
import { BTN } from "../components/ui/tokens";
import ClearFiltersButton from "../components/ui/ClearFiltersButton";

export default function CoursesPage() {
  console.log("USER OBJECT IN LOCALSTORAGE:", localStorage.getItem("user")); // 👈 เพิ่มบรรทัดนี้ชั่วคราว
  const tutorId = JSON.parse(localStorage.getItem("user"))?.id;
  const token = localStorage.getItem('student_token');
  console.log("tutorId ที่ได้:", tutorId); // 👈 เพิ่มบรรทัดนี้ด้วย

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [viewMode, setViewMode] = useState('primary');
  const [acceptedClasses, setAcceptedClasses] = useState([]);

  const navigate = useNavigate();
  const [subjectModal, setSubjectModal] = useState(null); // { course, action } | null

  const navigateToAction = (course, subject, action) => {
    if (action === "content") {
      navigate(`/tutor/manage?courseId=${course.id}&subjectId=${subject.subjectId}&courseName=${encodeURIComponent(course.name)}&subjectName=${encodeURIComponent(subject.subjectName)}`);
    } else if (action === "exam") {
      // ⚠️ ปรับ path ให้ตรงกับ route จริงของหน้า TutorExamManagement ในระบบ router ของคุณ
      navigate(`/tutor/exam?courseId=${course.id}&subjectId=${subject.subjectId}&courseName=${encodeURIComponent(course.name)}&subjectName=${encodeURIComponent(subject.subjectName)}`);
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

    // ★ แก้ตาม audit: id 3 (ปิดรับสมัคร แต่ยังสอนอยู่) กับ id 4 (ปิดคอร์สจริง) ความหมายต่างกัน
    // เดิมรวมเป็น "สอนจบแล้ว" เหมือนกันหมด ทำให้ติวเตอร์เข้าใจผิดว่าคอร์สจบแล้วทั้งที่จริงแค่ปิดรับสมัคร
    if (Number(statusId) === 3) {
      return { id: "closed-registration", text: "ปิดรับสมัคร", colorClass: "bg-amber-100 text-amber-700" };
    }
    if (Number(statusId) === 4 || today > end) {
      return { id: "completed", text: "สอนจบแล้ว", colorClass: "bg-slate-200 text-slate-700" };
    }
    if (today >= start && today <= end) {
      return { id: "active", text: "กำลังสอน", colorClass: "bg-emerald-100 text-emerald-700" };
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
      setLoadError(false);
      try {
        // ยิง API พร้อมพารามิเตอร์ adminId
        // (แก้บั๊ก) เดิมไม่แนบ token เลย ตอนนี้ backend ต้อง login ก่อนแล้ว
        const response = await axios.get(`${API_URL}/coursestutor?adminId=${tutorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
              courseType: row.Course_Type || "bundle",
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
        if (token) {
          const accepted = await axios.get(`${API_URL}/api/tutor/releases/accepted-classes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAcceptedClasses(Array.isArray(accepted.data) ? accepted.data : []);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [tutorId, token]);

  // 4. คำนวณ Stats ด้านบนสุด
  // ✅ ใหม่ (กรองให้เหลือคอร์สละ 1 ก่อน แล้วค่อยรวม)
  const uniqueCourses = [...new Map(courses.map(c => [c.id, c])).values()];
  const totalStudents = uniqueCourses.reduce((sum, c) => sum + Number(c.StudentCount), 0);
  const totalHoursAllCourses = courses.reduce((sum, course) => sum + Number(course.totalHours), 0);

  const stats = [
    { label: "คอร์สทั้งหมด", value: courses.length.toString(), icon: BookOpen, color: "bg-blue-500" },
    { label: "นักเรียนรวม", value: Number(totalStudents || 0).toLocaleString("th-TH"), icon: Users, color: "bg-emerald-500" },
    { label: "ชั่วโมงสอน", value: Number(totalHoursAllCourses || 0).toLocaleString("th-TH", { maximumFractionDigits: 1 }), icon: Clock, color: "bg-amber-500" },
  ];
  
  const visibleStats = viewMode === 'primary' ? stats : [
    { label: 'คลาสที่รับทั้งหมด', value: acceptedClasses.length.toString(), icon: BookOpen, color: "bg-blue-500" },
    { label: 'คลาสที่กำลังจะมาถึง', value: acceptedClasses.filter(item => new Date(item.startDateTime) >= new Date()).length.toString(), icon: CalendarDays, color: "bg-violet-500" },
    { label: 'เอกสารประกอบ', value: acceptedClasses.filter(item => item.attachmentFileId).length.toString(), icon: Paperclip, color: "bg-rose-500" },
  ];

  // 🔍 กรองข้อมูลตามการค้นหา
  const filteredCourses = courses.filter((course) => {
    const statusMatch = filterStatus === "all" || course.statusId === filterStatus;
    const typeMatch = filterType === "all" || course.courseType === filterType;
    const searchMatch = search === "" || course.name.toLowerCase().includes(search.toLowerCase());
    return statusMatch && typeMatch && searchMatch;
  });

  if (loading) return <Spinner block label="กำลังโหลดข้อมูลคอร์ส..." />;
  if (loadError) return <div className="px-4 lg:px-0"><ErrorState description="โหลดข้อมูลคอร์สไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" /></div>;

  return (
    <div className="space-y-6 px-4 lg:px-0">
      <div className="">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className={PAGE_TITLE}>คอร์สและวิชาที่รับผิดชอบ</h1>
            <p className={PAGE_SUBTITLE}>
              {viewMode === 'primary' ? 'ติดตามความคืบหน้าและจัดการข้อมูลในรายวิชาของคุณ' : 'ดูรายละเอียดคลาสที่รับสอนแทน เนื้อหาที่ต้องสอน และเอกสารประกอบ'}
            </p>
          </div>
          <SegmentedControl className="self-start md:self-auto" value={viewMode} onChange={setViewMode} options={[{ id: 'primary', label: 'คอร์สที่สอนหลัก' }, { id: 'accepted', label: 'คลาสที่รับมาสอน' }]} />
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 min-[360px]:[&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
          {visibleStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex min-w-0 items-center gap-3 sm:gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 truncate">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Filter */}
        {viewMode === 'primary' && <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อคอร์ส หรือ รายวิชา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent transition outline-none"
              />
            </div>
            <select
              className="px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[150px] max-w-full md:max-w-[200px] truncate"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">ทุกประเภทคอร์ส</option>
              <option value="bundle">คอร์สรวม</option>
              <option value="single">คอร์สเดี่ยว</option>
            </select>
            <select
              className="px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none md:min-w-[180px] max-w-full md:max-w-[240px] truncate"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">กำลังสอน</option>
              <option value="closed-registration">ปิดรับสมัคร</option>
              <option value="completed">สอนจบแล้ว</option>
              <option value="upcoming">ยังไม่เริ่มสอน</option>
            </select>
            <ClearFiltersButton
              show={Boolean(search) || filterStatus !== 'all' || filterType !== 'all'}
              onClick={() => { setSearch(''); setFilterStatus('all'); setFilterType('all'); }}
            />
          </div>
        </div>}

        {viewMode === 'accepted' && (
          <div className="grid gap-5 md:grid-cols-2">
            {acceptedClasses.length === 0 ? (
              <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium text-slate-500">ยังไม่มีคลาสที่รับมาสอน</p>
              </div>
            ) : acceptedClasses.map(item => (
              <article key={item.releaseId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-blue-600">คลาสที่รับมาสอน</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">{item.courseName}</h2>
                      <p className="text-sm text-slate-500">{item.subjectName}</p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap lg:shrink lg:whitespace-normal rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">รับสอนแล้ว</span>
                  </div>
                </div>
                <div className="space-y-4 p-4 sm:p-5">
                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-500" />{new Date(item.startDateTime).toLocaleDateString('th-TH', { dateStyle: 'medium' })} · {item.startTime}–{item.endTime}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-500" />{item.room || 'ไม่ระบุห้อง'}</p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600">เนื้อหาที่ต้องสอน</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.teachingInstructions || 'ไม่ได้ระบุ'}</p>
                  </div>
                  <p className="text-xs text-slate-500">รับต่อจาก: {item.ownerNickname || [item.ownerFirstname, item.ownerLastname].filter(Boolean).join(' ') || 'ไม่ระบุ'}</p>
                  {item.attachmentFilePath ? (
                    <a href={item.attachmentFilePath} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 hover:bg-orange-100">
                      <span className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0" /><span className="truncate">{item.attachmentFileName}</span></span>
                      <span>เปิดเอกสาร</span>
                    </a>
                  ) : <p className="text-xs text-slate-500">ไม่มีเอกสารแนบสำหรับคลาสนี้</p>}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Course Grid */}
        <div className={`${viewMode === 'primary' ? 'grid' : 'hidden'} gap-5 md:grid-cols-2 lg:grid-cols-2`}>
          {filteredCourses.length === 0 ? (
            <div className="md:col-span-2 flex flex-col items-center justify-center text-center px-6 py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50"><LuBookOpen className="h-7 w-7 text-orange-400" /></div>
              <p className="text-base font-semibold text-slate-700">ไม่พบคอร์สเรียนของคุณ</p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-3 sm:pr-4">
                      <h2 className="text-lg font-bold text-slate-900 leading-tight mb-1 break-words">
                        {course.name}
                      </h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> เริ่มสอน: {course.startDate}
                      </p>

                      {course.subjects && course.subjects.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-semibold">วิชาที่รับผิดชอบ:</span>
                          {course.subjects.map((s) => (
                            <span
                              key={s.subjectId}
                              className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold"
                            >
                              {s.subjectName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm border border-white/50 ${course.statusColor}`}>
                      {course.statusText}
                    </span>
                  </div>

                  {/* ⚡ Progress Bar แบบใหม่ */}
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-bold">
                        ความคืบหน้า <span className="text-slate-400 font-medium ml-1">({course.completedHours}/{course.totalHours} ชม.)</span>
                      </span>
                      <span className="font-bold text-orange-600">{course.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 ease-out"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* สรุปตัวเลข - แบ่งเป็น 3 ส่วนเพื่อให้ดูง่าย */}
                <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50/50 border-y border-slate-100">

                  {/* 1. จำนวนนักเรียน */}
                  <div className="flex items-center gap-2 border-r border-slate-200 pr-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none">{course.StudentCount || 0}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase">นักเรียน</p>
                    </div>
                  </div>

                  {/* 2. จำนวนวิดีโอ */}
                  <div className="flex items-center gap-2 border-r border-slate-200 pr-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none">{course.VideoCount || 0}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase">วิดีโอ</p>
                    </div>
                  </div>

                  {/* 3. จำนวนเอกสาร */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none">{course.FileCount || 0}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase">ไฟล์</p>
                    </div>
                  </div>

                </div>

                {/* ✅ แก้ไขปุ่ม Action (ส่งชื่อคอร์สและวิชาไปใน URL ด้วย) */}
                {/* ปุ่มหลัก 1 ปุ่ม (จัดการเนื้อหา) + ปุ่มรอง 2 ปุ่ม — มือถือ: หลักเต็มแถว รองแบ่งครึ่ง */}
                <div className="grid grid-cols-2 gap-2 p-4 bg-white border-t border-slate-100 lg:flex lg:gap-3">
                  <button
                    onClick={() => handleSubjectAction(course, "content")}
                    className={`${BTN.base} ${BTN.secondary} ${BTN.md} col-span-2 lg:order-3 lg:flex-1`}
                  >
                    <FileText className="h-4 w-4 text-slate-500" /> จัดการเนื้อหา
                  </button>

                  <Link
                    to={`/tutor/students?courseId=${course.id}`}
                    className={`${BTN.base} ${BTN.secondary} ${BTN.md} lg:order-1 lg:flex-1`}
                  >
                    <Users className="h-4 w-4 text-slate-500" /> ดูนักเรียน
                  </Link>

                  <button
                    onClick={() => handleSubjectAction(course, "exam")}
                    className={`${BTN.base} ${BTN.secondary} ${BTN.md} lg:order-2 lg:flex-1`}
                  >
                    <ClipboardList className="h-4 w-4 text-slate-500" /> จัดการข้อสอบ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {subjectModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setSubjectModal(null)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">

              {/* Header */}
              <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white">
                      <BookOpen size={16} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">
                        เลือกวิชา
                      </h3>
                      <p className="mt-0.5 text-xs text-white/80">
                        เลือกวิชาที่ต้องการจัดการ
                      </p>
                    </div>
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => setSubjectModal(null)}
                    aria-label="ปิด" className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 inline-flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Course */}
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    คอร์ส
                  </p>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {subjectModal.course.name}
                  </p>
                </div>
              </div>

              {/* Subjects */}
              <div className="px-5 sm:px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-800">
                    วิชาที่รับผิดชอบ
                  </p>

                  <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
                    {subjectModal.course.subjects.length} วิชา
                  </span>
                </div>

                <div className="space-y-2.5">
                  {subjectModal.course.subjects.map((subject, index) => (
                    <button
                      key={subject.subjectId}
                      onClick={() => {
                        navigateToAction(
                          subjectModal.course,
                          subject,
                          subjectModal.action
                        );
                        setSubjectModal(null);
                      }}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50/50 hover:shadow-md"
                    >
                      {/* Number */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 transition group-hover:bg-orange-100 group-hover:text-orange-600">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      {/* Subject name */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-orange-700">
                          {subject.subjectName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          คลิกเพื่อจัดการวิชานี้
                        </p>
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        size={19}
                        className="shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-orange-500"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 sm:px-6 py-4">
                <button
                  onClick={() => setSubjectModal(null)}
                  className="w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
