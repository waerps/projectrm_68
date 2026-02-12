import React from "react";
import { Outlet } from "react-router-dom";
import ProfileSidebar from "../components/ProfileSidebar";

export default function ProfileLayout() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3">
        <div className="sticky top-24">
          <ProfileSidebar />
        </div>
      </aside>

      <main className="col-span-12 md:col-span-9">
        <Outlet />
      </main>
    </div>
  );
}
