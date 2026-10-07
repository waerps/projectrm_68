import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProfileLayout() {
  const { pathname, search } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  if (!localStorage.getItem("student_token")) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(pathname + search)}`} replace />;
  }
  return (

    <div className="min-h-screen min-w-0 px-4 sm:px-6 lg:px-0">
        <div className="min-w-0 pt-[30px]">
          <Outlet />
        </div>
    </div>
  );
}
