import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import RequireRole from "../utils/roleGuard";
import { getAuthenticatedRole } from "../utils/authSession";

export default function ProfileLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const role = getAuthenticatedRole();
  if (role === "admin" || role === "tutor") {
    return <Navigate to={`/${role}`} replace />;
  }
  return (
    <RequireRole role="student">
      <div className="min-h-screen min-w-0 px-4 sm:px-6 lg:px-0">
        <div className="min-w-0 pt-[30px]">
          <Outlet />
        </div>
      </div>
    </RequireRole>
  );
}
