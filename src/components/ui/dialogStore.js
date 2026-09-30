// สถานะกลางของ toast / กล่องยืนยัน (ใช้ร่วมกันระหว่าง dialogs.js และ DialogHost)
let state = { toasts: [], confirm: null };
const listeners = new Set();

export const getDialogState = () => state;
export const emitDialog = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l(state)); };
export const subscribeDialog = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
