import React from "react"

export default function Sidebar({ activeMenu, onMenuClick }) {
  const menuItems = [
    { id: "home", label: "หน้าแรก", icon: "fas fa-home" },
    { id: "schedule", label: "ตารางสอน", icon: "fas fa-calendar-alt" },
    { id: "courses", label: "คอร์สเรียน", icon: "fas fa-book-open" },
    // { id: "performance", label: "ผลการเรียน", icon: "fas fa-chart-bar" },
    { id: "salary", label: "สถานะการเงิน", icon: "fas fa-wallet" },
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-neutral-200 z-50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onMenuClick("home")}>
          <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center">
            <img src="/img/logo.png" alt="โลโก้" className="w-full h-full object-cover" />
          </div>
          <div>
            <h6 className="font-bold text-neutral-900 leading-4">SONSERM</h6>
            <h6 className="font-bold text-neutral-900 leading-4">TUTOR</h6>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${
                activeMenu === item.id
                  ? "bg-primary-orange text-white shadow-lg"
                  : "text-neutral-600 hover:text-primary-orange hover:bg-orange-50"
              }`}
            >
              <i className={`${item.icon} w-5`} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Profile */}
      <div className="p-4 border-t border-neutral-200">
        <button
          onClick={() => onMenuClick("profile")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${
            activeMenu === "profile"
              ? "bg-primary-orange text-white shadow-lg"
              : "text-neutral-600 hover:text-primary-orange hover:bg-orange-50"
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-orange to-orange-600 rounded-full overflow-hidden">
            <img src="/img/tutor.png" alt="ติวเตอร์" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-sm font-medium">กมลทิพย์ กงเพชร</div>
            <div className="text-xs opacity-70">ติวเตอร์</div>
          </div>
        </button>
      </div>
    </div>
  )
}
