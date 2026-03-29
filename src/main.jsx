import { GoogleOAuthProvider } from "@react-oauth/google";

import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import AppShell from "./layouts/AppShell.jsx"
import ProfileLayout from "./layouts/ProfileLayout.jsx"

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
import New from "./pages/New.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"

import "./index.css"

import TutorLayout from "./layouts/TutorLayout.jsx"
import TutorMain from "./pagetutor/TutorMain.jsx"
import TutorSchedule from "./pagetutor/TutorSchedule.jsx"
import TutorProfile from "./pagetutor/TutorProfile.jsx"
import TutorCourses from "./pagetutor/TutorCourses.jsx"
import TutorAnalytics from "./pagetutor/TutorAnalytics.jsx"
import TutorStudents from "./pagetutor/TutorStudents.jsx"
import TutorStudentDetail from "./pagetutor/TutorStudentDetail.jsx"   // ✅ เพิ่มบรรทัดนี้
import TutorManage from "./pagetutor/TutorManage.jsx"
import Test from "./pagetutor/Test.jsx"
import TutorIncome from "./pagetutor/TutorIncome.jsx"
import TutorNotification from "./pagetutor/TutorNotification.jsx"
import TutorExam from "./pagetutor/TutorExam.jsx"

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

const router = createBrowserRouter(
  [
    { path: "login", element: <Login /> },
    { path: "register", element: <Register /> },
    {
      path: "/",
      element: <AppShell />,
      children: [
        { index: true, element: <Home /> },
        { path: "schedule", element: <Schedule /> },
        { path: "courses", element: <Courses /> },
        { path: "performance", element: <Performance /> },
        { path: "salary", element: <Salary /> },
        { path: "new", element: <New /> },
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
            { path: "students/detail", element: <TutorStudentDetail /> },  // ✅ เพิ่มบรรทัดนี้
            { path: "manage", element: <TutorManage /> },
            { path: "test", element: <Test /> },
            { path: "income", element: <TutorIncome /> },
            { path: "notification", element: <TutorNotification /> },
            { path: "exam", element: <TutorExam /> },
          ],
        },
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
        { path: "apply-tutor", element: <TutorApply /> },
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_I}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </React.StrictMode>
)