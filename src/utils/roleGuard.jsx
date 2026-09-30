import { Navigate, useLocation } from "react-router-dom";

/* ด่านหน้าบ้าน (เพื่อ UX เท่านั้น — ความปลอดภัยจริงตรวจที่ backend ทุก API)
   อ่าน role และเวลาหมดอายุจาก JWT ที่เก็บไว้ ถ้าไม่ตรงพาไปหน้า login */
function readTokenClaims() {
  try {
    const token = localStorage.getItem("student_token");
    if (!token) return null;
    const payload = JSON.parse(decodeURIComponent(escape(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export default function RequireRole({ role, children }) {
  const location = useLocation();
  const claims = readTokenClaims();
  if (!claims || claims.role !== role) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }
  return children;
}
