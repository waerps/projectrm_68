import React from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar.jsx"
import Footer from "../components/footer.jsx"

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()

  const current = location.pathname === "/" ? "home" : location.pathname.slice(1)

  const handleMenu = (id) => {
    if (id === "home") navigate("/")
    else navigate("/" + id)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
        <Navbar />
      <main className=" ">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
        <Footer />
    </div>
  )
}
