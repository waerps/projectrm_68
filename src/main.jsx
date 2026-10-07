

// ★ เพิ่ม: บังคับใช้ "จำฉันไว้ในระบบ" — รันครั้งเดียวตอนแอปเริ่มโหลด ก่อน React จะ render อะไรเลย
//   ถ้าตอน login ไม่ได้ติ๊ก "จำฉันไว้ในระบบ" (remember_me === "false") แล้วเบราว์เซอร์/แท็บถูกปิด
//   ไปจริง ๆ (sessionStorage ของแท็บนั้นหายไป) เมื่อเปิดใหม่จะเจอว่า session_active ไม่มีอยู่แล้ว
//   → เคลียร์ข้อมูลล็อกอินทิ้ง ถือว่า session หมดอายุ (ถ้าเป็นแค่ refresh หน้า/เปลี่ยนหน้าในแท็บเดิม
//   sessionStorage ยังอยู่ตามปกติ จึงไม่ถูกเคลียร์)
(function enforceRememberMe() {
  try {
    const rememberMe = localStorage.getItem("remember_me");
    const sessionActive = sessionStorage.getItem("session_active");
    if (rememberMe === "false" && !sessionActive) {
      localStorage.removeItem("student_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user");
      localStorage.removeItem("remember_me");
    }
    sessionStorage.setItem("session_active", "1");
  } catch {
    // localStorage/sessionStorage อาจใช้ไม่ได้ (เช่น private mode) — ไม่ทำให้แอปพัง
  }
})();

import React from "react"

// หลัง deploy เวอร์ชันใหม่ ไฟล์ JS ของเวอร์ชันเก่าจะถูกลบ แท็บที่เปิดค้างไว้จึงเปิดหน้าใหม่ไม่ได้
// ("Failed to fetch dynamically imported module") → โหลดหน้าใหม่ 1 ครั้งเพื่อรับเวอร์ชันล่าสุด
// (กันวนรีโหลดไม่จบ: ถ้าเพิ่งรีโหลดไปไม่ถึง 10 วินาที จะไม่รีโหลดซ้ำ แล้วปล่อยให้แสดง error ตามปกติ)
const CHUNK_RELOAD_KEY = "chunk_reload_at"
function reloadForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    if (Date.now() - last < 10000) return false
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    // sessionStorage ใช้ไม่ได้ — ยังรีโหลดได้ตามปกติ
  }
  window.location.reload()
  return true
}
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewVersion()) event.preventDefault()
})
const lazyPage = (load) => React.lazy(() => load().catch((err) => {
  if (reloadForNewVersion()) return new Promise(() => {})
  throw err
}))
import { installAdminApiAuth } from "./utils/adminApiAuth.js"

// แนบ token ให้คำขอ /api/admin ทั้งหมด (backend ตรวจสิทธิ์แอดมินแล้ว)
installAdminApiAuth()
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"

import AppShell from "./layouts/AppShell.jsx"
const ProfileLayout = lazyPage(() => import("./layouts/ProfileLayout.jsx"));

// Pages Imports
import Home from "./pages/Home.jsx"
const VirtualTour = lazyPage(() => import("./pages/VirtualTour.jsx"));
const Schedule = lazyPage(() => import("./pages/Schedule.jsx"));
const CourseDetail = lazyPage(() => import("./pages/Courses.jsx"));
const Profile = lazyPage(() => import("./pages/Profile.jsx"));

const Notifications = lazyPage(() => import("./pages/Notifications.jsx"));
const StudentExamOverview = lazyPage(() => import("./pages/StudentExamOverview.jsx"));
const StudentCourses = lazyPage(() => import("./pages/StudentCourses.jsx"));
const Attendance = lazyPage(() => import("./pages/Attendance.jsx"));
const New = lazyPage(() => import("./pages/New.jsx"));
const News = lazyPage(() => import("./pages/News.jsx"));
const MyIncidents = lazyPage(() => import("./pages/MyIncidents.jsx"));
const Login = lazyPage(() => import("./pages/Login.jsx"));
const Register = lazyPage(() => import("./pages/Register.jsx"));
const GoogleRegister = lazyPage(() => import("./pages/GoogleRegister.jsx"));
const ForgotPassword = lazyPage(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazyPage(() => import("./pages/ResetPassword.jsx"));
const ThaiExam = lazyPage(() => import("./pages/thai_exam.jsx"));
const About = lazyPage(() => import("./pages/About.jsx"));
const Promotion = lazyPage(() => import("./pages/Promotion.jsx"));
const CourseSearch = lazyPage(() => import("./pages/CourseSearch.jsx"));
const PrivateCourses = lazyPage(() => import("./pages/PrivateCourses.jsx"));
const StudentCourseContent = lazyPage(() => import("./pages/StudentCourseContent.jsx"));
const StudentCourseDetail = lazyPage(() => import("./pages/StudentCourseDetail.jsx"));
const StudentExam = lazyPage(() => import("./pages/StudentExam.jsx"));
const SubjectList = lazyPage(() => import("./pages/SubjectList.jsx"));
const StudentSubjectDetail = lazyPage(() => import("./pages/StudentSubjectDetail.jsx"));

// CSS
import "./index.css"

// Tutor Layouts
const TutorLayout = lazyPage(() => import("./layouts/TutorLayout.jsx"));
const TutorMain = lazyPage(() => import("./pagetutor/TutorMain.jsx"));
const TutorSchedule = lazyPage(() => import("./pagetutor/TutorSchedule.jsx"));
const TutorProfile = lazyPage(() => import("./pagetutor/TutorProfile.jsx"));
const TutorCourses = lazyPage(() => import("./pagetutor/TutorCourses.jsx"));
// const TutorAnalytics = lazyPage(() => import("./pagetutor/TutorAnalytics.jsx"));
const TutorStudents = lazyPage(() => import("./pagetutor/TutorStudents.jsx"));
const TutorStudentDetail = lazyPage(() => import("./pagetutor/TutorStudentDetail.jsx"));
const TutorVideoQuestions = lazyPage(() => import("./pagetutor/TutorVideoQuestions.jsx"));
const TutorManage = lazyPage(() => import("./pagetutor/TutorManage.jsx"));
const TutorIncome = lazyPage(() => import("./pagetutor/TutorIncome.jsx"));
const TutorNotification = lazyPage(() => import("./pagetutor/TutorNotification.jsx"));
const TutorExam = lazyPage(() => import("./pagetutor/TutorExam.jsx"));
const TutorExamAnalytics = lazyPage(() => import("./pagetutor/TutorExamAnalytics.jsx"));
const TutorExamDetail = lazyPage(() => import("./pagetutor/TutorExamDetail.jsx"));
const TutorQuestionBank = lazyPage(() => import("./pagetutor/TutorQuestionBank.jsx"));
const TutorProgressOverview = lazyPage(() => import("./pagetutor/TutorProgressOverview.jsx"));
const TutorIncidents = lazyPage(() => import("./pagetutor/TutorIncidents.jsx"));

// Admin Layouts
const AdminLayout = lazyPage(() => import("./layouts/AdminLayout.jsx"));
const AdminDashboard = lazyPage(() => import("./pageadmin/AdminDashboard.jsx"));
const AdminCourses = lazyPage(() => import("./pageadmin/AdminCourses.jsx"));
const AdminSchedule = lazyPage(() => import("./pageadmin/AdminSchedule.jsx"));
const AdminStudents = lazyPage(() => import("./pageadmin/AdminStudents.jsx"));
const AdminTutors = lazyPage(() => import("./pageadmin/AdminTutors.jsx"));
const AdminFinance = lazyPage(() => import("./pageadmin/AdminFinance.jsx"));
const AdminAnnouncements = lazyPage(() => import("./pageadmin/AdminAnnouncements.jsx"));
const AdminNotification = lazyPage(() => import("./pageadmin/AdminNotification.jsx"));
const AdminRooms = lazyPage(() => import("./pageadmin/AdminRooms.jsx"));
const AdminCommonFacilities = lazyPage(() => import("./pageadmin/AdminCommonFacilities.jsx"));
const AdminAttendanceDashboard = lazyPage(() => import("./pageadmin/AdminAttendanceDashboard.jsx"));
const AdminManagement = lazyPage(() => import("./pageadmin/AdminManagement.jsx"));
const AdminProfile = lazyPage(() => import("./pageadmin/AdminProfile.jsx"));
const AdminIncidents = lazyPage(() => import("./pageadmin/AdminIncidents.jsx"));
const AdminProgressOverview = lazyPage(() => import("./pageadmin/AdminProgressOverview.jsx"));
const AdminExamAnalytics = lazyPage(() => import("./pageadmin/AdminExamAnalytics.jsx"));

import ChatProvider from "./components/Chat/ChatProvider.jsx"
import { ShopProvider } from "./context/ShopContext"
const Cart = lazyPage(() => import("./pages/Cart.jsx"));
const Favorites = lazyPage(() => import("./pages/Favorites.jsx"));

const router = createBrowserRouter(
  [
    { path: "login", element: <Login /> },
    { path: "register", element: <Register /> },
    { path: "register/google", element: <GoogleRegister /> },
    { path: "forgot-password", element: <ForgotPassword /> },
    { path: "reset-password", element: <ResetPassword /> },
    { path: "setup-credentials", element: <ResetPassword setupRoute /> },
    { path: "tour-preview", element: <VirtualTour embedded /> },
    {
      path: "/",
      element: (
        <ChatProvider>
          <AppShell />
        </ChatProvider>
      ),
      children: [
        { index: true, element: <Home /> },
        { path: "virtual-tour", element: <VirtualTour /> },
        { path: "schedule", element: <Schedule /> },
        { path: "courses", element: <CourseSearch /> },
        { path: "courses/:id", element: <CourseDetail /> },
        { path: "private-courses", element: <PrivateCourses /> },
        { path: "new", element: <New /> },
        { path: "news", element: <News /> },
        { path: "cart", element: <Cart /> },
        { path: "favorites", element: <Favorites /> },
        { path: "about", element: <About /> },
        { path: "promotion", element: <Promotion /> },
        { path: "apply-tutor", element: <Navigate to="/login?apply=tutor" replace /> },
        { path: "exam/:token", element: <StudentExam /> }, //เป้วทำ

        // เส้นทาง Profile (Nested Layout)
        {
          path: "profile",
          element: <ProfileLayout />,
          children: [
            { index: true, element: <Profile /> },
            { path: "schedule", element: <Schedule /> },
            { path: "notifications", element: <Notifications /> },
            { path: "my-courses", element: <StudentCourses /> },
            { path: "course/:courseId/exams", element: <StudentExamOverview /> },
            { path: "incidents", element: <MyIncidents /> },
            { path: "course-detail/:courseId", element: <StudentCourseDetail /> },
            { path: "course-content/:courseId", element: <StudentCourseContent /> },
            { path: "course/:courseId/subjects", element: <SubjectList /> }, //เป้วเพิ่ม
            { path: "course/:courseId/subject/:subjectId", element: <StudentSubjectDetail /> },
            { path: "attendance", element: <Attendance /> },
          ],
        },

        // === เส้นทางสำหรับติวเตอร์ (Tutor) ===
        {
          path: "tutor",
          element: <TutorLayout />,
          children: [
            { index: true, element: <TutorMain /> },
            { path: "schedule", element: <TutorSchedule /> },
            { path: "profile", element: <TutorProfile /> },
            { path: "courses", element: <TutorCourses /> },
            { path: "students", element: <TutorStudents /> },
            { path: "students/detail", element: <TutorStudentDetail /> },
            { path: "incidents", element: <TutorIncidents /> },
            { path: "income", element: <TutorIncome /> },
            { path: "notification", element: <TutorNotification /> },
            { path: "exam", element: <TutorExam /> },
            { path: "exam-analytics", element: <TutorExamAnalytics /> },
            { path: "manage", element: <TutorManage /> },
            { path: "video-questions/:videoId", element: <TutorVideoQuestions /> },
            { path: "exam-detail", element: <TutorExamDetail /> },
            { path: "question-bank", element: <TutorQuestionBank /> },   // คลังข้อสอบของติวเตอร์ เข้าตรงจากเมนู
            { path: "progress", element: <TutorProgressOverview /> },   // เลือกคอร์ส+วิชา แล้วเข้าหน้าวิเคราะห์พัฒนาการ
          ],
        },

        // === เส้นทางสำหรับผู้ดูแลระบบ (Admin) ===
        {
          path: "admin",
          element: <AdminLayout />,
          children: [
            { index: true, element: <AdminDashboard /> },
            { path: "dashboard", element: <AdminDashboard /> },
            { path: "courses", element: <AdminCourses /> },
            { path: "private-courses", element: <Navigate to="/admin/courses?type=single" replace /> }, // ย้ายไปเป็นแท็บในหน้าคอร์สแล้ว
            { path: "schedule", element: <AdminSchedule /> },
            { path: "students", element: <AdminStudents /> },
            { path: "tutors", element: <AdminTutors /> },
            { path: "finance", element: <AdminFinance /> },
            { path: "announcements", element: <AdminAnnouncements /> },
            { path: "notification", element: <AdminNotification /> },
            { path: "rooms", element: <AdminRooms /> },
            { path: "common-facilities", element: <AdminCommonFacilities /> },
            { path: "management", element: <AdminManagement /> },
            { path: "profile", element: <AdminProfile /> }, // ← เพิ่ม → path เต็ม = /admin/profile
            { path: "incidents", element: <AdminIncidents /> },
            { path: "progress", element: <AdminProgressOverview /> },   // ภาพรวมพัฒนาการ คอร์ส x วิชา (อ่านอย่างเดียว)
            { path: "exam-analytics", element: <AdminExamAnalytics /> },   // หน้าวิเคราะห์ตัวเดียวกับติวเตอร์ แต่มุมแอดมิน
          ],
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <React.Suspense fallback={<div role="status" className="min-h-screen p-8 text-center text-slate-600">กำลังโหลดหน้า…</div>}>
      <ShopProvider>
        <RouterProvider router={router} />
      </ShopProvider>
    </React.Suspense>
  </React.StrictMode>
)
