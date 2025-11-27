// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'
// import { createBrowserRouter } from "react-router";
// import { RouterProvider } from "react-router/dom";


// import Index from './index.jsx';
// import Dash from './dash.jsx';
// import Nav from './nav.jsx';


// const router = createBrowserRouter([
//   {
//     path: "/", //router
//     element: <div>Hello World</div>,
//   },
//   {
//     path: "/p",
//     element: <App />,
//   },

//   {
//     path: "/testk",
//     element: <div>"/index"Test Github ja</div>,
//   },
//   {
//     path: "/index",
//     element: <Index />,
//   },
//     {
//     path: "/dash",
//     element: <Dash />,
//   },
//   {
//     path: "/nav",
//     element: <Nav />,
//   }
// ]);



// createRoot(document.getElementById('root')).render(
//   // <StrictMode>
//   //   <App />
//   //   <App />
//   // </StrictMode>,
//   <RouterProvider router={router} />,
// )





import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import AppShell from "./layouts/AppShell.jsx"
import Home from "./pages/Home.jsx"
import Schedule from "./pages/Schedule.jsx"
import Courses from "./pages/Courses.jsx"
import Performance from "./pages/Performance.jsx"
import Salary from "./pages/Salary.jsx"
import Profile from "./pages/Profile.jsx"
import TutorApply from "./pages/TutorApply.jsx" 
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: "schedule", element: <Schedule /> },
      { path: "courses", element: <Courses /> },
      { path: "performance", element: <Performance /> },
      { path: "salary", element: <Salary /> },
      { path: "profile", element: <Profile /> },
      { path: "apply-tutor", element: <TutorApply /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
