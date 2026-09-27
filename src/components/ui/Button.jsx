import { BTN } from "./tokens";

/* ปุ่มมาตรฐาน: variant = primary | secondary | ghost | danger, size = md | sm */
export default function Button({ variant = "primary", size = "md", icon, className = "", children, type = "button", ...rest }) {
  const Icon = icon;
  return (
    <button type={type} className={`${BTN.base} ${BTN[variant] || BTN.primary} ${BTN[size] || BTN.md} ${className}`} {...rest}>
      {Icon && <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />}
      {children}
    </button>
  );
}
