import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

// ─── Breadcrumb กลางของทั้งระบบ ───────────────────────────────────────────────
// ใช้กับหน้าย่อยที่ต้องกดไล่ลงมาจากหน้าอื่น (ไม่ใช่หน้าระดับบนสุดที่อยู่ใน navbar)
// เพื่อให้ผู้ใช้กดย้อนกลับไปชั้นก่อนหน้าได้เสมอ และหน้าตาเหมือนกันทุกหน้า
//
// items = [{ label, to?, state?, onClick?, title? }]
//   - ตัวสุดท้าย = หน้าปัจจุบัน (aria-current="page") ไม่ใช่ลิงก์
//   - ตัวอื่นที่มี to → <Link> (ส่ง state ต่อได้ ถ้าหน้าปลายทางต้องใช้เปิดมุมมองเดิม)
//   - ตัวอื่นที่มี onClick → ปุ่ม (ใช้เมื่อหน้าต้องทำอะไรเพิ่มก่อนย้อนกลับ เช่น รีโหลดข้อมูล)
//   - ไม่มีทั้งสองอย่าง → ข้อความธรรมดา (เช่น ข้อมูลยังโหลดไม่เสร็จ)
// ป้ายยาว ๆ จะถูกตัดด้วย … และแสดงชื่อเต็มเมื่อชี้เมาส์ (title)
export default function Breadcrumb({ items = [], showHomeIcon = true, className = "" }) {
  const list = items.filter((it) => it && it.label != null && it.label !== "");
  if (list.length === 0) return null;

  const linkCls =
    "inline-flex max-w-[11rem] sm:max-w-[16rem] items-center gap-1 truncate font-medium text-slate-500 hover:text-orange-600 transition-colors";
  const textCls = "inline-block max-w-[11rem] sm:max-w-[16rem] truncate";

  return (
    <nav aria-label="breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-500">
        {list.map((it, i) => {
          const isLast = i === list.length - 1;
          const label = String(it.label);
          const tip = it.title || label;
          const icon = showHomeIcon && i === 0
            ? <Home className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            : null;

          let node;
          if (isLast) {
            node = (
              <span aria-current="page" title={tip} className={`${textCls} inline-flex items-center gap-1 font-semibold text-slate-700`}>
                {icon}
                <span className="truncate">{label}</span>
              </span>
            );
          } else if (it.to) {
            node = (
              <Link to={it.to} state={it.state} title={tip} className={linkCls}>
                {icon}
                <span className="truncate">{label}</span>
              </Link>
            );
          } else if (it.onClick) {
            node = (
              <button type="button" onClick={it.onClick} title={tip} className={linkCls}>
                {icon}
                <span className="truncate">{label}</span>
              </button>
            );
          } else {
            node = (
              <span title={tip} className={`${textCls} inline-flex items-center gap-1 font-medium`}>
                {icon}
                <span className="truncate">{label}</span>
              </span>
            );
          }

          return (
            <li key={`${i}-${label}`} className="flex min-w-0 items-center gap-x-1.5">
              {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
              {node}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
