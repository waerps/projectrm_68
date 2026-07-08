import { useState, useCallback } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  // ✅ ต้องใช้ setToasts แบบ functional เพื่อให้ setTimeout เห็นค่าล่าสุด
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id)); // ✅ ไม่พึ่ง removeToast
    }, 3500);
  }, []);

  return { toasts, showToast, removeToast };
}