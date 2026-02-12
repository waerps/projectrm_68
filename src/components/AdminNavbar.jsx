import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Calendar } from "lucide-react"
import { NavLink } from "react-router-dom"


export default function Navbar() {
    const [searchQuery, setSearchQuery] = useState("")
    const location = useLocation()

    const isActive = (path) => location.pathname === path

    return (
        <div className="fixed left-0 right-0 top-0 z-50 flex justify-center pt-4">
            <nav className="mx-6 md:mx-12 flex h-[65px] w-full max-w-[1384px] items-center justify-between gap-8 rounded-2xl bg-white px-6 md:px-8 shadow-lg">

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
                                <span className="font-bold text-xs text-gray-800">SORNSERM</span>
                                <span className="font-bold text-xs text-gray-800">TUTOR</span>
                            </div>
                        </div>
                    </Link>
                </div>


                <div className="flex items-center gap-2">
                    <div className="relative group flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center text-white">
                            <img
                                src="/admin.jpg"
                                alt="imgProfile"
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        </div>

                        <div
                            className={`flex items-center gap-1 cursor-pointer font-medium text-sm transition-colors pb-1 ${isActive("/profile")
                                ? "text-orange-500 border-b-2 border-orange-500"
                                : "text-gray-700 hover:text-orange-500"
                                }`}
                        >
                            <span>แอดมิน พี่กวาง</span>
                        </div>

                        <div
                            className="
                absolute right-0 top-full mt-1 w-48
                rounded-xl bg-white shadow-xl
                opacity-0 invisible
                group-hover:opacity-100 group-hover:visible
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
                                        คอร์สทั้งหมด
                                    </Link>
                                </li>
                                
                                <li>
                                    <Link
                                        to="schedule"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        ตารางเรียน
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="students"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        นักเรียน
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="tutors"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        ติวเตอร์​
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

                                {/* <li>
                                    <Link
                                        to=""
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        คลิป/เอกสาร
                                    </Link>
                                </li> */}

                                <li>
                                    <Link
                                        to="notification"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        การแจ้งเตือน
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="finance"
                                        className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition"
                                    >
                                        การเงิน
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
