import { useCallback } from "react";
import { toast } from "./ui/dialogs";

/* ─────────────────────────────────────────────────────────────────────────
   useToast — คง API เดิม (toasts, showToast, removeToast) ไว้ให้หน้าเดิมใช้ต่อได้
   แต่ส่งทุกข้อความไปที่ toast กลางของระบบ (components/ui/dialogs) ที่เดียว
   → toast ทั้งระบบซ้อน/เรียงอยู่ชุดเดียว ไม่มี 2 ระบบแข่งกัน
   ToastContainer ที่หน้าเดิมวางไว้จะได้ toasts = [] จึงไม่แสดงอะไรซ้ำ
   ────────────────────────────────────────────────────────────────────── */
const EMPTY = [];

export function useToast() {
  const showToast = useCallback((type, title, message) => {
    const text = message ? `${title ?? ""}\n${message}` : String(title ?? "");
    toast(text, type);
  }, []);

  const removeToast = useCallback(() => {}, []);

  return { toasts: EMPTY, showToast, removeToast };
}
