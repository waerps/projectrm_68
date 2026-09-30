import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Modal กลางของทั้งระบบ (ติวเตอร์ / แอดมิน / นักเรียน)
   - พื้นหลังดำ 60% + เบลอ
   - มือถือ: แผ่นเลื่อนขึ้นจากด้านล่าง เต็มความกว้าง | sm ขึ้นไป: กล่องกลางจอ
   - หัวแถบส้มไล่สี + ไอคอน + ปุ่มปิด (ModalHeader) — ใช้แยกได้ถ้าหน้าไหนมีหัวเอง
   - เนื้อหาเลื่อนได้ในตัว, footer (ถ้ามี) อยู่ล่างเสมอ
   - ปิดด้วย Esc ได้ (ถ้ามี onClose)
   ────────────────────────────────────────────────────────────────────── */

const SIZES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
  "2xl": "sm:max-w-4xl",
  "3xl": "sm:max-w-5xl",
};

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ModalShell({ onClose, size = "md", closeOnBackdrop = false, className = "", z = "z-50", children }) {
  const panelRef = useRef(null);

  // Esc เพื่อปิด + วน Tab อยู่ในกล่อง (focus trap)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) { onClose(); return; }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // เปิดแล้ว: ย้ายโฟกัสเข้ากล่อง + ล็อกการเลื่อนหน้าหลัง · ปิดแล้ว: คืนโฟกัสเดิม
  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const target = panel.querySelector("[autofocus]") || panel.querySelector(FOCUSABLE) || panel;
      target.focus({ preventScroll: true });
    }
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 ${z} flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4`}
      onClick={closeOnBackdrop && onClose ? onClose : undefined}
    >
      <div
        className={`w-full ${SIZES[size] || SIZES.md} max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden outline-none overscroll-contain bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl ${className}`}
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, subtitle, icon, onClose, children }) {
  const Icon = icon;
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Icon className="h-4 w-4 text-white" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white truncate">{title}</h3>
          {subtitle && <p className="text-xs text-white/80 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {children}
        {onClose && (
          <button type="button" onClick={onClose} aria-label="ปิด"
            className="p-1.5 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ModalFooter({ children, className = "" }) {
  return (
    <div className={`shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-6 py-3 border-t border-slate-100 bg-white ${className}`}>
      {children}
    </div>
  );
}

export default function Modal({
  title, subtitle, icon, onClose, children, footer, size = "md",
  bodyClassName = "p-4 sm:p-6", closeOnBackdrop = false, headerExtra,
}) {
  return (
    <ModalShell onClose={onClose} size={size} closeOnBackdrop={closeOnBackdrop}>
      {title !== undefined && (
        <ModalHeader title={title} subtitle={subtitle} icon={icon} onClose={onClose}>{headerExtra}</ModalHeader>
      )}
      <div className={`flex-1 min-h-0 overflow-y-auto ${bodyClassName}`}>{children}</div>
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </ModalShell>
  );
}
