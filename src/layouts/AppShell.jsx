import React from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar.jsx"
import Footer from "../components/footer.jsx"
import FloatingChatbot from "../components/FloatingChatbot.jsx"
import Chatbot from '../components/Chatbot.jsx'
import ChatProvider from "../components/chat/ChatProvider.jsx"
import ChatWidget from "../components/chat/ChatWidget.jsx"
import ChatFullscreen from "../components/chat/ChatFullscreen.jsx"

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()

  const current = location.pathname === "/" ? "home" : location.pathname.slice(1)

  const handleMenu = (id) => {
    if (id === "home") navigate("/")
    else navigate("/" + id)
  }

  return (
    <ChatProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        <Footer />


        <ChatWidget />
        <ChatFullscreen />
      </div>
    </ChatProvider>
  )
}
