import { Outlet } from "react-router-dom"
import AdminNavbar from "../components/AdminNavbar"

export default function AdminLayout() {
  return (
    <div className="min-h-screen">
      <AdminNavbar />
      {/* ระยะห่างจาก navbar กำหนดที่นี่ที่เดียว (navbar สูง ~90px + ช่องไฟ 30px) — หน้าในไม่ต้องใส่ mt เอง */}
      <main className="pt-[120px]">
        <Outlet />
      </main>
    </div>
  )
}
