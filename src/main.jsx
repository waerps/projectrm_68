
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
import News from "./pages/News.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"

import "./index.css"

const router = createBrowserRouter([
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
      { path: "news", element: <News /> },
      { path: "/courses/:id", element: <Courses />
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
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
