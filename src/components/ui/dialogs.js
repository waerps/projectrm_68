import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { DialogHost } from "./ConfirmDialog";
import { getDialogState, emitDialog } from "./dialogStore";

/* ─────────────────────────────────────────────────────────────────────────
   แทน alert() / confirm() ของเบราว์เซอร์ด้วย UI ของระบบ
   - toast(msg, type?)            → แจ้งเตือนมุมขวาบน (หน้าตาเดียวกับ useToast)
   - await confirmDialog(msg, opts?) → กล่องยืนยัน คืนค่า true/false
   ไม่ต้องวางคอมโพเนนต์ในหน้า — ระบบสร้าง host ให้เองครั้งแรกที่เรียกใช้
   ────────────────────────────────────────────────────────────────────── */

const ERROR_RE = /(ไม่สำเร็จ|ผิดพลาด|ไม่สามารถ|ล้มเหลว|error)/i;
const WARN_RE = /^(กรุณา|ไม่พบ|ต้อง)|ต้องมาก่อน|ต้องมีขนาด/;


function ensureHost() {
  if (typeof document === "undefined" || ensureHost.done) return;
  ensureHost.done = true;
  const el = document.createElement("div");
  el.id = "app-dialog-host";
  document.body.appendChild(el);
  createRoot(el).render(createElement(DialogHost));
}

export function toast(message, type) {
  ensureHost();
  const text = String(message ?? "");
  const t = type || (ERROR_RE.test(text) ? "error" : WARN_RE.test(text) ? "warning" : "success");
  const [title, ...rest] = text.split("\n");
  const id = Date.now() + Math.random();
  emitDialog({ toasts: [...getDialogState().toasts, { id, type: t, title, message: rest.join("\n").trim() }] });
  setTimeout(() => emitDialog({ toasts: getDialogState().toasts.filter((x) => x.id !== id) }), t === "error" ? 5000 : 3500);
}

export function confirmDialog(message, { title = "ยืนยันการทำรายการ", confirmText = "ยืนยัน", cancelText = "ยกเลิก", danger } = {}) {
  ensureHost();
  const isDanger = danger ?? /(ลบ|ยกเลิก|ถอด|นำ.*ออก)/.test(String(message));
  return new Promise((resolve) => {
    emitDialog({ confirm: { message, title, confirmText, cancelText, danger: isDanger, resolve } });
  });
}
