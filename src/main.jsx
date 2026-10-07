

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
import { installAdminApiAuth } from "./utils/adminApiAuth.js"

// แนบ token ให้คำขอ /api/admin ทั้งหมด (backend ตรวจสิทธิ์แอดมินแล้ว)
installAdminApiAuth()
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"

import AppShell from "./layouts/AppShell.jsx"
const ProfileLayout = React.lazy(() => import("./layouts/ProfileLayout.jsx"));

// Pages Imports
import Home from "./pages/Home.jsx"
const VirtualTour = React.lazy(() => import("./pages/VirtualTour.jsx"));
const Schedule = React.lazy(() => import("./pages/Schedule.jsx"));
const CourseDetail = React.lazy(() => import("./pages/Courses.jsx"));
const Profile = React.lazy(() => import("./pages/Profile.jsx"));

const Notifications = React.lazy(() => import("./pages/Notifications.jsx"));
const StudentExamOverview = React.lazy(() => import("./pages/StudentExamOverview.jsx"));
const StudentCourses = React.lazy(() => import("./pages/StudentCourses.jsx"));
const Attendance = React.lazy(() => import("./pages/Attendance.jsx"));
const New = React.lazy(() => import("./pages/New.jsx"));
const News = React.lazy(() => import("./pages/News.jsx"));
const MyIncidents = React.lazy(() => import("./pages/MyIncidents.jsx"));
const Login = React.lazy(() => import("./pages/Login.jsx"));
const Register = React.lazy(() => import("./pages/Register.jsx"));
const GoogleRegister = React.lazy(() => import("./pages/GoogleRegister.jsx"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword.jsx"));
const ThaiExam = React.lazy(() => import("./pages/thai_exam.jsx"));
const About = React.lazy(() => import("./pages/About.jsx"));
const Promotion = React.lazy(() => import("./pages/Promotion.jsx"));
const CourseSearch = React.lazy(() => import("./pages/CourseSearch.jsx"));
const PrivateCourses = React.lazy(() => import("./pages/PrivateCourses.jsx"));
const StudentCourseContent = React.lazy(() => import("./pages/StudentCourseContent.jsx"));
const StudentCourseDetail = React.lazy(() => import("./pages/StudentCourseDetail.jsx"));
const StudentExam = React.lazy(() => import("./pages/StudentExam.jsx"));
const SubjectList = React.lazy(() => import("./pages/SubjectList.jsx"));
const StudentSubjectDetail = React.lazy(() => import("./pages/StudentSubjectDetail.jsx"));

// CSS
import "./index.css"

// Tutor Layouts
const TutorLayout = React.lazy(() => import("./layouts/TutorLayout.jsx"));
const TutorMain = React.lazy(() => import("./pagetutor/TutorMain.jsx"));
const TutorSchedule = React.lazy(() => import("./pagetutor/TutorSchedule.jsx"));
const TutorProfile = React.lazy(() => import("./pagetutor/TutorProfile.jsx"));
const TutorCourses = React.lazy(() => import("./pagetutor/TutorCourses.jsx"));
// const TutorAnalytics = React.lazy(() => import("./pagetutor/TutorAnalytics.jsx"));
const TutorStudents = React.lazy(() => import("./pagetutor/TutorStudents.jsx"));
const TutorStudentDetail = React.lazy(() => import("./pagetutor/TutorStudentDetail.jsx"));
const TutorVideoQuestions = React.lazy(() => import("./pagetutor/TutorVideoQuestions.jsx"));
const TutorManage = React.lazy(() => import("./pagetutor/TutorManage.jsx"));
const TutorIncome = React.lazy(() => import("./pagetutor/TutorIncome.jsx"));
const TutorNotification = React.lazy(() => import("./pagetutor/TutorNotification.jsx"));
const TutorExam = React.lazy(() => import("./pagetutor/TutorExam.jsx"));
const TutorExamAnalytics = React.lazy(() => import("./pagetutor/TutorExamAnalytics.jsx"));
const TutorExamDetail = React.lazy(() => import("./pagetutor/TutorExamDetail.jsx"));
const TutorQuestionBank = React.lazy(() => import("./pagetutor/TutorQuestionBank.jsx"));
const TutorProgressOverview = React.lazy(() => import("./pagetutor/TutorProgressOverview.jsx"));
const TutorIncidents = React.lazy(() => import("./pagetutor/TutorIncidents.jsx"));

// Admin Layouts
const AdminLayout = React.lazy(() => import("./layouts/AdminLayout.jsx"));
const AdminDashboard = React.lazy(() => import("./pageadmin/AdminDashboard.jsx"));
const AdminCourses = React.lazy(() => import("./pageadmin/AdminCourses.jsx"));
const AdminSchedule = React.lazy(() => import("./pageadmin/AdminSchedule.jsx"));
const AdminStudents = React.lazy(() => import("./pageadmin/AdminStudents.jsx"));
const AdminTutors = React.lazy(() => import("./pageadmin/AdminTutors.jsx"));
const AdminFinance = React.lazy(() => import("./pageadmin/AdminFinance.jsx"));
const AdminAnnouncements = React.lazy(() => import("./pageadmin/AdminAnnouncements.jsx"));
const AdminNotification = React.lazy(() => import("./pageadmin/AdminNotification.jsx"));
const AdminPasswordResets = React.lazy(() => import("./pageadmin/AdminPasswordResets.jsx"));
const AdminRooms = React.lazy(() => import("./pageadmin/AdminRooms.jsx"));
const AdminCommonFacilities = React.lazy(() => import("./pageadmin/AdminCommonFacilities.jsx"));
const AdminAttendanceDashboard = React.lazy(() => import("./pageadmin/AdminAttendanceDashboard.jsx"));
const AdminManagement = React.lazy(() => import("./pageadmin/AdminManagement.jsx"));
const AdminProfile = React.lazy(() => import("./pageadmin/AdminProfile.jsx"));
const AdminIncidents = React.lazy(() => import("./pageadmin/AdminIncidents.jsx"));
const AdminProgressOverview = React.lazy(() => import("./pageadmin/AdminProgressOverview.jsx"));
const AdminExamAnalytics = React.lazy(() => import("./pageadmin/AdminExamAnalytics.jsx"));

import ChatProvider from "./components/Chat/ChatProvider.jsx"
import { ShopProvider } from "./context/ShopContext"
const Cart = React.lazy(() => import("./pages/Cart.jsx"));
const Favorites = React.lazy(() => import("./pages/Favorites.jsx"));

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
            { path: "password-resets", element: <AdminPasswordResets /> }, // ★ เพิ่ม: คำขอลืมรหัสผ่าน
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
