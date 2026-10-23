import { Navigate, useLocation } from "react-router-dom";
import { readTokenClaims } from "./authSession";

/* ด่านหน้าบ้าน (เพื่อ UX เท่านั้น — ความปลอดภัยจริงตรวจที่ backend ทุก API)
   อ่าน role และเวลาหมดอายุจาก JWT ที่เก็บไว้ ถ้าไม่ตรงพาไปหน้า login */
export default function RequireRole({ role, children }) {
  const location = useLocation();
  const claims = readTokenClaims();
  if (!claims || claims.role !== role) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }
  return children;
}
