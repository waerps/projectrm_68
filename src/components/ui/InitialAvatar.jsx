import { getFileUrl } from "../../utils/fileUrl";

// ตัวอักษรย่อจากชื่อ — ข้ามสระหน้า (เ แ โ ใ ไ) ให้ได้พยัญชนะตัวแรก เช่น "เทส" → "ท"
export function nameInitial(name) {
  const s = String(name || "").trim();
  const ch = [...s].find((c) => !/[เ-ไ\s]/.test(c));
  return (ch || "?").toUpperCase();
}

// รูปโปรไฟล์: มีรูป = แสดงรูป, ไม่มีรูป = วงสีส้มกับตัวอักษรย่อ (ไม่ใช้รูปตัวอย่างของคนอื่นแทน)
export default function InitialAvatar({ photo, name, className = "", textClassName = "text-sm", alt = "รูปโปรไฟล์" }) {
  const src = photo ? getFileUrl(photo) : null;
  if (src) return <img src={src} alt={alt} className={`object-cover ${className}`} />;
  return (
    <span role="img" aria-label={alt} className={`flex items-center justify-center bg-orange-100 font-bold text-orange-600 select-none ${className}`}>
      <span className={textClassName}>{nameInitial(name)}</span>
    </span>
  );
}
