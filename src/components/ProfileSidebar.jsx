import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/profile", label: "ข้อมูลส่วนตัว" },
  { to: "/profile/schedule", label: "ตารางเรียน" },
  { to: "/profile/notifications", label: "การแจ้งเตือน" },
  { to: "/profile/my-courses", label: "คอร์สเรียนของฉัน" },
  { to: "/profile/attendance", label: "ประวัติการเข้าเรียน" },
];

export default function ProfileSidebar() {
  return (
    <div className="rounded-2xl bg-white shadow-xl p-3">
      <div className="px-3 pt-2 pb-3">
        <p className="text-sm font-semibold text-gray-800">เมนูบัญชี</p>
        <p className="text-xs text-gray-500">จัดการข้อมูลและการเรียนของคุณ</p>
      </div>

      <nav className="space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/profile"}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-2 text-sm transition ${
                isActive
                  ? "bg-orange-50 text-orange-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50 hover:text-orange-500"
              }`
            }
          >
            {it.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
