import { Outlet } from "react-router-dom"
import RequireRole from "../utils/roleGuard"
import AdminNavbar from "../components/AdminNavbar"

export default function AdminLayout() {
  return (
    <RequireRole role="admin">
    <div>
      <AdminNavbar />
      {/* ระยะห่างจาก navbar กำหนดที่นี่ที่เดียว (navbar สูง ~90px + ช่องไฟ 30px) — หน้าในไม่ต้องใส่ mt เอง */}
      <div className="pt-[120px] pb-12">
        <Outlet />
      </div>
    </div>
    </RequireRole>
  )
}
