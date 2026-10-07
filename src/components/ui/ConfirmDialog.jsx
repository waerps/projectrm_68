import { useEffect, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { ToastContainer } from "../Toast";
import { ModalShell } from "./Modal";
import { getDialogState, emitDialog, subscribeDialog } from "./dialogStore";

/* กล่องยืนยันมาตรฐานของระบบ + host ที่ใช้โดย toast()/confirmDialog() ใน dialogs.js */

export function ConfirmDialog({ title, message, confirmText = "ยืนยัน", cancelText = "ยกเลิก", danger = false, onConfirm, onCancel }) {
  const Icon = danger ? AlertTriangle : HelpCircle;
  return (
    <ModalShell onClose={onCancel} size="sm" closeOnBackdrop z="z-[70]">
      <div className="p-5 sm:p-6 text-center overflow-y-auto">
        <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${danger ? "bg-red-100" : "bg-orange-100"}`}>
          <Icon className={`h-7 w-7 ${danger ? "text-red-600" : "text-orange-600"}`} />
        </div>
        <h2 className="mb-1 text-lg font-bold text-slate-900">{title}</h2>
        <p className="whitespace-pre-line text-sm text-slate-500">{message}</p>
      </div>
      <div className="flex flex-col-reverse gap-2 px-5 pb-5 sm:flex-row sm:px-6 sm:pb-6">
        {cancelText !== null && (
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            {cancelText}
          </button>
        )}
        <button type="button" onClick={onConfirm} autoFocus
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${danger ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"}`}>
          {confirmText}
        </button>
      </div>
    </ModalShell>
  );
}

export function DialogHost() {
  const [s, setS] = useState(getDialogState);
  useEffect(() => subscribeDialog(setS), []);
  const c = s.confirm;
  const close = (v) => { c?.resolve(v); emitDialog({ confirm: null }); };
  return (
    <>
      <ToastContainer toasts={s.toasts} onRemove={(id) => emitDialog({ toasts: getDialogState().toasts.filter((x) => x.id !== id) })} />
      {c && (
        <ConfirmDialog title={c.title} message={c.message} confirmText={c.confirmText} cancelText={c.cancelText}
          danger={c.danger} onConfirm={() => close(true)} onCancel={() => close(false)} />
      )}
    </>
  );
}
