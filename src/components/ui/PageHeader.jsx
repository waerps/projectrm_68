import { PAGE_TITLE, PAGE_SUBTITLE } from "./tokens";

/* หัวหน้ามาตรฐาน: ชื่อหน้า + คำอธิบาย + ปุ่มด้านขวา (children) */
export default function PageHeader({ title, subtitle, icon, children, className = "" }) {
  const Icon = icon;
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="min-w-0">
        <h1 className={`${PAGE_TITLE} flex items-center gap-2 break-words`}>
          {Icon && <Icon className="h-6 w-6 shrink-0 text-orange-500" />}
          {title}
        </h1>
        {subtitle && <p className={PAGE_SUBTITLE}>{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
