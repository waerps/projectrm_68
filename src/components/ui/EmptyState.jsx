/* หน้าว่างมาตรฐาน — ไอคอน lucide ในวงกลมส้มอ่อน + หัวข้อ + คำอธิบาย + ปุ่ม (ถ้ามี) */
export default function EmptyState({ icon, title, description, action, className = "" }) {
  const Icon = icon;
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center ${className}`}>
      {Icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
          <Icon className="h-7 w-7 text-orange-400" />
        </div>
      )}
      {title && <p className="text-base font-semibold text-slate-700">{title}</p>}
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
