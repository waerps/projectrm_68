// src/components/IncidentReportButton.jsx
// ★ ปุ่มลอย "แจ้งปัญหา" — ฝังใน AppShell.jsx (student) และ TutorLayout.jsx (tutor)
// ตัวอย่างการฝัง: <IncidentReportButton role="student" /> วางไว้นอก <Outlet /> ระดับเดียวกับ Navbar
import { useState } from "react";
import { AlertOctagon, X } from "lucide-react";
import { useToast } from "./useToast";
import { ToastContainer } from "./Toast";
import IncidentReportForm from "./IncidentReportForm";

export default function IncidentReportButton({ role }) {
  const [open, setOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 pl-3.5 pr-4 py-3 rounded-full
                   bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/20
                   hover:shadow-xl hover:scale-[1.03] transition-all"
        title="แจ้งปัญหา / ร้องเรียน"
      >
        <AlertOctagon className="h-5 w-5" />
        <span className="text-sm font-bold hidden sm:inline">แจ้งปัญหา</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-red-500 to-orange-500 shrink-0">
              <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                  <AlertOctagon className="h-4 w-4 text-white" />
                </span>
                แจ้งปัญหา / ร้องเรียน
              </h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <IncidentReportForm role={role} onClose={() => setOpen(false)} showToast={showToast} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}