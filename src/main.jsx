import { GoogleOAuthProvider } from "@react-oauth/google"
import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import AppShell from "./layouts/AppShell.jsx"
import ProfileLayout from "./layouts/ProfileLayout.jsx"

// Pages Imports
import Home from "./pages/Home.jsx"
import Schedule from "./pages/Schedule.jsx"
import Courses from "./pages/Courses.jsx"
import Performance from "./pages/Performance.jsx"
import Salary from "./pages/Salary.jsx"
import Profile from "./pages/Profile.jsx"
import TutorApply from "./pages/TutorApply.jsx"
import Notifications from "./pages/Notifications.jsx"
import Mycourses from "./pages/Mycourses.jsx"
import Attendance from "./pages/Attendance.jsx"
import News from "./pages/News.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import ThaiExam from "./pages/Thai_exam.jsx"

// CSS
import "./index.css"

// Tutor Layouts
import TutorLayout from "./layouts/TutorLayout.jsx"
import TutorMain from "./pagetutor/TutorMain.jsx"
import TutorSchedule from "./pagetutor/TutorSchedule.jsx"
import TutorProfile from "./pagetutor/TutorProfile.jsx"
import TutorCourses from "./pagetutor/TutorCourses.jsx"
import TutorAnalytics from "./pagetutor/TutorAnalytics.jsx"
import TutorStudents from "./pagetutor/TutorStudents.jsx"
import TutorManage from "./pagetutor/TutorManage.jsx"
import Test from "./pagetutor/Test.jsx"
import TutorIncome from "./pagetutor/TutorIncome.jsx"
import TutorNotification from "./pagetutor/TutorNotification.jsx"
import TutorExam from "./pagetutor/TutorExam.jsx"

// Admin Layouts
import AdminLayout from "./layouts/AdminLayout.jsx"
import AdminDashboard from "./pageadmin/AdminDashboard.jsx"
import AdminCourses from "./pageadmin/AdminCourses.jsx"
import AdminSchedule from "./pageadmin/AdminSchedule.jsx"
import AdminStudents from "./pageadmin/AdminStudents.jsx"
import AdminTutors from "./pageadmin/AdminTutors.jsx"
import AdminFinance from "./pageadmin/AdminFinance.jsx"
import AdminAnnouncements from "./pageadmin/AdminAnnouncements.jsx"
import AdminMedia from "./pageadmin/AdminMedia.jsx"
import AdminNotification from "./pageadmin/AdminNotification.jsx"
import CreateTutorForm from "./pageadmin/CreateTutorForm.jsx"

const router = createBrowserRouter([
  // เส้นทางสำหรับ Login/Register (อยู่นอก AppShell เพื่อไม่ให้มี Navbar ซ้อน)
  { path: "login", element: <Login /> },
  { path: "register", element: <Register /> },
  { path: "thai_exam", element: <ThaiExam /> },

  // เส้นทางหลักสำหรับนักเรียน/ผู้ใช้ทั่วไป
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: "schedule", element: <Schedule /> },
      { path: "courses", element: <Courses /> },
      { path: "courses/:id", element: <Courses /> },
      { path: "performance", element: <Performance /> },
      { path: "salary", element: <Salary /> },
      { path: "news", element: <News /> },
      { path: "apply-tutor", element: <TutorApply /> },
      
      // เส้นทาง Profile (Nested Layout)
      {
        path: "profile",
        element: <ProfileLayout />,
        children: [
          { index: true, element: <Profile /> },      
          { path: "schedule", element: <Schedule /> },  
          { path: "notifications", element: <Notifications /> },
          { path: "my-courses", element: <Mycourses /> },       
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
          { path: "analytics", element: <TutorAnalytics /> },
          { path: "students", element: <TutorStudents /> },
          { path: "manage", element: <TutorManage /> },
          { path: "test", element: <Test /> },
          { path: "income", element: <TutorIncome /> },
          { path: "notification", element: <TutorNotification/> },
          { path: "exam", element: <TutorExam/> },
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
          { path: "schedule", element: <AdminSchedule /> },
          { path: "students", element: <AdminStudents /> },
          { path: "tutors", element: <AdminTutors /> },
          { path: "finance", element: <AdminFinance /> },
          { path: "announcements", element: <AdminAnnouncements /> },
          { path: "media", element: <AdminMedia /> },
          { path: "notification", element: <AdminNotification /> },
          { path: "create-tutor", element: <CreateTutorForm /> },
        ],
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </React.StrictMode>
)