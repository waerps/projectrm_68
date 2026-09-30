/* แท็บมาตรฐานของทั้งระบบ — แคปซูลเทา ปุ่มที่เลือกเป็นพื้นขาวตัวส้ม
   options: [{ id, label, short?, icon?, count? }]
   short = ชื่อสั้นที่ใช้บนมือถือ · stretchMobile = บนมือถือเต็มความกว้างและแบ่งปุ่มเท่ากัน */
export default function SegmentedControl({ options, value, onChange, size = "md", fullWidth = false, stretchMobile = false, className = "" }) {
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-3 sm:px-4 py-2 text-sm";
  return (
    <div className={`${fullWidth ? "flex w-full" : stretchMobile ? "flex w-full sm:inline-flex sm:w-fit" : "inline-flex w-fit"} max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 ${className}`}>
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.id;
        return (
          <button key={o.id} type="button" onClick={() => onChange(o.id)}
            className={`${fullWidth ? "flex-1" : stretchMobile ? "flex-1 sm:flex-none" : ""} flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition ${pad} ${active ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {Icon && <Icon className="h-4 w-4" />}
            {o.short ? (<><span className="sm:hidden">{o.short}</span><span className="hidden sm:inline">{o.label}</span></>) : o.label}
            {o.count != null && (
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${active ? "bg-orange-100 text-orange-600" : "bg-slate-200 text-slate-500"}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
