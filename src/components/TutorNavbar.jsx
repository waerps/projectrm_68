import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import React, { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Calendar, ChevronDown, Menu, X, Home, BookOpen, Wallet, Library, TrendingUp, History, UserCircle, LogOut } from "lucide-react"
import { NavLink } from "react-router-dom"
import NotificationBell from "./NotificationBell"


export default function Navbar() {
    const location = useLocation()
    const user = JSON.parse(localStorage.getItem("user"));

    const isActive = (path) => location.pathname === path

    // เมนูบัญชีสำหรับจอ < lg (มือถือ/แท็บเล็ต) — เปิดด้วยการแตะ ไม่ใช่ hover
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)
    useEffect(() => { setMenuOpen(false) }, [location.pathname])
    useEffect(() => {
        if (!menuOpen) return
        const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
        const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false) }
        document.addEventListener("mousedown", onDown)
        document.addEventListener("keydown", onKey)
        return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
    }, [menuOpen])

    const logout = () => {
        localStorage.removeItem("token")
        window.location.href = "/login"
    }

    const mobileItems = [
        { to: ".", end: true, label: "หน้าแรก", icon: Home },
        { to: "courses", label: "คอร์สที่สอน", icon: BookOpen },
        { to: "income", label: "รายรับของฉัน", icon: Wallet },
        { to: "question-bank", label: "คลังข้อสอบ", icon: Library },
        { to: "progress", label: "ภาพรวมพัฒนาการ", icon: TrendingUp },
        { to: "schedule", label: "ตารางสอน", icon: Calendar },
        { to: "incidents", label: "ประวัติการแจ้งเรื่อง", icon: History },
        { to: "profile", label: "ข้อมูลส่วนตัว", icon: UserCircle },
    ]

    return (
        <div className="fixed left-0 right-0 top-0 z-50 flex justify-center pt-4 bg-white lg:bg-transparent">
            {menuOpen && <div className="fixed inset-0 bg-slate-900/30 md:bg-slate-900/10 lg:hidden" aria-hidden="true" />}
            <nav className="relative mx-4 md:mx-12 flex h-[65px] w-full max-w-[1384px] items-center justify-between gap-4 md:gap-8 rounded-2xl bg-white px-4 md:px-8 shadow-lg">

                <div className="flex items-center gap-6">
                    <Link to="/tutor" className="shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center">
                                <img
                                    src="/logo.png"
                                    alt="ศรเสริมติวเตอร์"
                                    className="h-auto w-full object-contain"
                                />
                            </div>
                            <div className="hidden flex-col md:flex">
                                <span className="font-bold text-xs text-gray-800">SORNSERM</span>
                                <span className="font-bold text-xs text-gray-800">TUTOR</span>
                            </div>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center">
                        <NavLink
                            to="."
                            end
                            className={({ isActive }) =>
                                `font-medium text-xs transition-colors pb-1 ${isActive
                                    ? "text-orange-500"
                                    : "text-neutral-700 hover:text-orange-500"
                                }`
                            }
                        >
                            หน้าแรก
                        </NavLink>
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    <NotificationBell role="tutor" pagePath="/tutor/notification" />
                    <Link
                        to="/tutor/schedule"
                        className="relative h-11 w-11 flex items-center justify-center rounded-lg
                       hover:bg-orange-100 hover:text-orange-500 transition-colors mr-0.5 md:mr-2 lg:mr-4"
                        aria-label="ตารางสอน"
                    >
                        <Calendar className="h-5 w-5" />
                    </Link>

                    {/* ── เมนูบัญชีแบบแตะ (< lg) ── */}
                    <div ref={menuRef} className="lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMenuOpen(v => !v)}
                            aria-label="เมนูบัญชี"
                            aria-expanded={menuOpen}
                            className={`flex h-11 items-center gap-2 rounded-full border pl-1 pr-2.5 transition-colors ${menuOpen ? "border-orange-200 bg-orange-50 text-orange-500" : "border-gray-200 text-gray-700 hover:border-orange-200 hover:bg-orange-50"}`}
                        >
                            <img
                                src={getFileUrl(user?.photo) || "/tutor.jpeg"}
                                alt="imgProfile"
                                className="h-8 w-8 shrink-0 rounded-full bg-gray-400 object-cover"
                            />
                            <span className="hidden md:block max-w-[140px] truncate text-sm font-medium">{user?.firstname}</span>
                            {menuOpen ? <X className="h-5 w-5 md:hidden" /> : <Menu className="h-5 w-5 md:hidden" />}
                            <ChevronDown className={`hidden md:block h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {menuOpen && (
                            <div className="navbar-drop fixed inset-x-4 top-[89px] z-[70] flex max-h-[calc(100dvh-105px)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-[calc(100%+12px)] md:w-80 md:max-h-[calc(100dvh-110px)]">
                                <div className="flex items-center gap-3 border-b border-gray-100 bg-orange-50/60 px-4 py-3.5">
                                    <img
                                        src={getFileUrl(user?.photo) || "/tutor.jpeg"}
                                        alt="imgProfile"
                                        className="h-11 w-11 shrink-0 rounded-full bg-gray-400 object-cover ring-2 ring-white"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-bold text-gray-900">{[user?.firstname, user?.lastname].filter(Boolean).join(" ")}</p>
                                        <p className="text-xs font-medium text-orange-600">ติวเตอร์</p>
                                    </div>
                                </div>
                                <ul className="flex-1 overflow-y-auto p-2">
                                    {mobileItems.map((item) => { const { to, end, label } = item; const Icon = item.icon; return (
                                        <li key={to}>
                                            <NavLink
                                                to={to}
                                                end={end}
                                                onClick={() => setMenuOpen(false)}
                                                className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${isActive ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-orange-50 hover:text-orange-500"}`}
                                            >
                                                <Icon className="h-5 w-5 shrink-0" />
                                                <span className="truncate">{label}</span>
                                            </NavLink>
                                        </li>
                                    ); })}
                                </ul>
                                <div className="border-t border-gray-100 p-2">
                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50"
                                    >
                                        <LogOut className="h-5 w-5 shrink-0" />
                                        ออกจากระบบ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div tabIndex={0} className="relative group hidden lg:flex items-center gap-2 outline-none">
                        <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center text-white">
                            <img
                                src={getFileUrl(user?.photo) || "/tutor.jpeg"}
                                alt="imgProfile"
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        </div>

                        <Link
                            to="profile"
                            className={`flex items-center gap-1 cursor-pointer font-medium text-sm transition-colors pb-1 ${isActive("/tutor/profile")
                                ? "text-orange-500"
                                : "text-gray-700 hover:text-orange-500"
                                }`}
                        >
                            <span>{user?.firstname}</span>
                        </Link>

                        <div
                            className="
                absolute right-0 top-full mt-1 w-48
                rounded-xl bg-white shadow-xl
                opacity-0 invisible
                group-hover:opacity-100 group-hover:visible
                group-focus-within:opacity-100 group-focus-within:visible
                transition-all duration-200
                z-50
              "
                        >
                            <ul className="py-2 text-sm text-gray-700 text-right">
                                <li>
                                    <Link
                                        to="courses"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        คอร์สที่สอน
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="income"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        รายรับของฉัน
                                    </Link>
                                </li>

                                {/* คลังข้อสอบไม่ได้ผูกกับคอร์สหรือรอบสอบ เป็นของครูต่อวิชาล้วน ๆ
                                    จึงเข้าตรงจากเมนูได้ ไม่ต้องไล่ผ่านคอร์ส → วิชา → รอบสอบ */}
                                <li>
                                    <Link
                                        to="question-bank"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        คลังข้อสอบ
                                    </Link>
                                </li>

                                {/* หน้าวิเคราะห์ผูกกับคอร์ส+วิชา เมนูนี้จึงพาไปหน้าเลือกก่อน
                                    แล้วค่อยเข้าหน้าวิเคราะห์ ไม่ต้องอ้อมผ่านหน้าจัดการการสอบ */}
                                <li>
                                    <Link
                                        to="progress"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        ภาพรวมพัฒนาการ
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="incidents"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        ประวัติการแจ้งเรื่อง
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="profile"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        ข้อมูลส่วนตัว
                                    </Link>
                                </li>

                                <li>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem("token")
                                            window.location.href = "/login"
                                        }}
                                        className="w-full text-right px-4 py-2 text-red-600 hover:bg-red-50 transition"
                                    >
                                        ออกจากระบบ
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </nav>
        </div>
    )
}
