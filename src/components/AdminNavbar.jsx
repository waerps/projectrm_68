import { API_URL } from "../config";
import { getFileUrl } from "../utils/fileUrl";
import React, { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Calendar } from "lucide-react"
import { NavLink } from "react-router-dom"
import NotificationBell from "./NotificationBell"
import { AlertOctagon, ChevronDown, Menu, X, LayoutDashboard, BookOpen, GraduationCap, Users, TrendingUp, CalendarDays, DoorOpen, Package, Megaphone, Wallet, ShieldCheck, UserCircle, LogOut } from "lucide-react";

export default function Navbar() {
    const user = JSON.parse(localStorage.getItem("user"));
    const location = useLocation()

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

    // เมนูหลักบนเดสก์ท็อป เริ่มจากทางกลับแดชบอร์ด
    const mainNavItems = [
        { to: "dashboard", label: "หน้าแรก" },
        { to: "progress", label: "ภาพรวมพัฒนาการ" },
        { to: "courses", label: "คอร์ส" },
        { to: "tutors", label: "ติวเตอร์" },
        { to: "students", label: "นักเรียน" },
        { to: "finance", label: "การเงิน" },
    ]
    // เมนูเต็ม 13 อย่าง — ใช้กับเมนูแฮมเบอร์เกอร์บนมือถือ/แท็บเล็ต (< lg) เท่านั้น เพราะจอนั้นไม่มีแถบกลางด้านบน
    // ต้องคงครบทุกอย่างไว้ที่นี่ ไม่งั้นมือถือจะเข้าคอร์ส/นักเรียน/ติวเตอร์/การเงินไม่ได้เลย
    const mobileItems = [
        { to: "dashboard", label: "หน้าแรก", icon: LayoutDashboard },
        { to: "progress", label: "ภาพรวมพัฒนาการ", icon: TrendingUp },
        { to: "courses", label: "คอร์ส", icon: BookOpen },
        { to: "students", label: "นักเรียน", icon: GraduationCap },
        { to: "tutors", label: "ติวเตอร์", icon: Users },
        { to: "schedule", label: "ตารางเรียน", icon: CalendarDays },
        { to: "rooms", label: "ห้องเรียน", icon: DoorOpen },
        { to: "common-facilities", label: "คลังอุปกรณ์", icon: Package },
        { to: "announcements", label: "ประชาสัมพันธ์", icon: Megaphone },
        { to: "finance", label: "การเงิน", icon: Wallet },
        { to: "management", label: "ผู้ดูแลระบบ", icon: ShieldCheck },
        { to: "incidents", label: "รับแจ้งเหตุการณ์", icon: AlertOctagon },
        { to: "profile", label: "ข้อมูลส่วนตัว", icon: UserCircle },
    ]

    const avatar = (size) => (
        <div className={`${size} rounded-full overflow-hidden shrink-0`}>
            {user?.photo ? (
                <img src={getFileUrl(user.photo)} alt="imgProfile" className="h-full w-full object-cover" />
            ) : (
                <div className="h-full w-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold select-none">
                        {user?.firstname?.charAt(0)?.toUpperCase() || "A"}
                    </span>
                </div>
            )}
        </div>
    )

    return (
        <div className="fixed left-0 right-0 top-0 z-50 flex justify-center pt-4 bg-white lg:bg-transparent">
            {menuOpen && <div className="fixed inset-0 bg-slate-900/30 md:bg-slate-900/10 lg:hidden" aria-hidden="true" />}
            <nav className="relative mx-4 md:mx-12 flex h-[65px] w-full max-w-[1384px] items-center justify-between gap-4 md:gap-8 rounded-2xl bg-white px-4 md:px-8 shadow-lg">

                <div className="flex items-center gap-6">
                    <Link to="dashboard" className="shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center">
                                <img
                                    src="/logo.png"
                                    alt="ศรเสริมติวเตอร์"
                                    className="h-auto w-full object-contain"
                                />
                            </div>
                            <div className="hidden flex-col md:flex">
                                <span className={`font-bold text-xs transition-colors ${isActive("/admin/dashboard") || isActive("/admin") ? "text-orange-500" : "text-slate-800"}`}>SORNSERM</span>
                                <span className={`font-bold text-xs transition-colors ${isActive("/admin/dashboard") || isActive("/admin") ? "text-orange-500" : "text-slate-800"}`}>TUTOR</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* ── เมนูหลัก 6 อย่าง วางไว้กลาง navbar (>= lg) — ใช้ font/สไตล์เดียวกับ nav ฝั่งนักเรียน (ตัวหนังสือล้วน ไม่มีพื้นหลัง/ไอคอน) ── */}
                <div className="hidden lg:flex items-center gap-4 xl:gap-8 whitespace-nowrap absolute left-1/2 -translate-x-1/2">
                    {mainNavItems.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive: active }) => `font-medium transition-colors text-xs ${active ? "text-orange-500 pb-1" : "text-gray-700 hover:text-orange-500"}`}
                        >
                            {label}
                        </NavLink>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell role="admin" pagePath="/admin/notification" />
                    {/* ── เมนูบัญชีแบบแตะ (< lg) ── */}
                    <div ref={menuRef} className="lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMenuOpen(v => !v)}
                            aria-label="เมนูบัญชี"
                            aria-expanded={menuOpen}
                            className={`flex h-11 items-center gap-2 rounded-full border pl-1 pr-2.5 transition-colors ${menuOpen ? "border-orange-200 bg-orange-50 text-orange-500" : "border-slate-200 text-slate-700 hover:border-orange-200 hover:bg-orange-50"}`}
                        >
                            {avatar("h-8 w-8")}
                            <span className="hidden md:block max-w-[160px] truncate text-sm font-medium">{user?.firstname || "ไม่ทราบชื่อ"}</span>
                            {menuOpen ? <X className="h-5 w-5 md:hidden" /> : <Menu className="h-5 w-5 md:hidden" />}
                            <ChevronDown className={`hidden md:block h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {menuOpen && (
                            <div className="navbar-drop fixed inset-x-4 top-[89px] z-[70] flex max-h-[calc(100dvh-105px)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-[calc(100%+12px)] md:w-[440px] md:max-h-[calc(100dvh-110px)]">
                                <div className="flex items-center gap-3 border-b border-slate-100 bg-orange-50/60 px-4 py-3.5">
                                    {avatar("h-11 w-11 ring-2 ring-white")}
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-bold text-slate-900">{[user?.firstname || "ไม่ทราบชื่อ", user?.lastname].filter(Boolean).join(" ")}</p>
                                        <p className="text-xs font-medium text-orange-600">ผู้ดูแลระบบ</p>
                                    </div>
                                </div>
                                <ul className="flex-1 overflow-y-auto p-2 md:grid md:grid-cols-2 md:gap-x-1 md:content-start">
                                    {mobileItems.map((item) => { const { to, label } = item; const Icon = item.icon; return (
                                        <li key={to}>
                                            <NavLink
                                                to={to}
                                                onClick={() => setMenuOpen(false)}
                                                className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${isActive ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-orange-50 hover:text-orange-500"}`}
                                            >
                                                <Icon className="h-5 w-5 shrink-0" />
                                                <span className="truncate">{label}</span>
                                            </NavLink>
                                        </li>
                                    ); })}
                                </ul>
                                <div className="border-t border-slate-100 p-2">
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
                        <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                            {user?.photo ? (
                                <img
                                    src={getFileUrl(user.photo)}
                                    alt="imgProfile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold select-none">
                                        {user?.firstname?.charAt(0)?.toUpperCase() || "A"}
                                    </span>
                                </div>
                            )}
                        </div>

                        <Link
                            to="profile"
                            className={`flex items-center gap-1 font-medium text-sm transition-colors pb-1 ${isActive("/admin/profile")
                                ? "text-orange-500"
                                : "text-slate-700 hover:text-orange-500"
                                }`}
                        >
                            <span>{user?.firstname || "ไม่ทราบชื่อ"}</span>
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
                            <ul className="py-2 text-sm text-slate-700 text-right">
                                {/* คอร์ส/นักเรียน/ติวเตอร์/ภาพรวมพัฒนาการ/การเงิน ย้ายไปอยู่แถบกลาง navbar แล้ว ไม่ต้องซ้ำในดรอปดาวน์นี้อีก */}
                                <li>
                                    <Link
                                        to="schedule"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        ตารางเรียน
                                    </Link>
                                </li>

                                <li>
                                    <Link to="rooms" className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition">
                                        ห้องเรียน
                                    </Link>
                                </li>

                                <li>
                                    <Link to="common-facilities" className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition">
                                        คลังอุปกรณ์
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="announcements"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        ประชาสัมพันธ์
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="management"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        ผู้ดูแลระบบ
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="incidents"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        รับแจ้งเหตุการณ์
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
