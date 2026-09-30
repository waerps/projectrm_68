/* ─────────────────────────────────────────────────────────────────────────
   การ์ด 3D ชุดกลาง: เอียงตามเมาส์ + แสงเรือง + ไอคอน/ป้ายลอยนูน
   ใช้คู่กับคลาสใน index.css:
     .sa-card3d   = ตัวการ์ด (ตอนไม่ชี้จะโยกเบาๆ เอง ตอนชี้จะเอียงตามเมาส์)
     .sa-glow3d   = <span> แสงเรืองตามตำแหน่งเมาส์ (ใส่เป็นลูกตัวแรกของการ์ด)
     .sa-pop3d    = ของที่ลอยนูนออกมาตอนชี้ (ไอคอน / ป้าย)
     .sa-parallax = รูปพื้นหลังที่เลื่อนสวนทางเล็กน้อย
   ตัวอย่าง: <div className="sa-card3d ..." {...cardTiltHandlers} style={cardIdleDelay(id)}>
   ───────────────────────────────────────────────────────────────────────── */

export const cardTiltHandlers = {
  onMouseMove(e) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - py) * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * 12).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--mx", ((px - 0.5) * 2).toFixed(3));
    el.style.setProperty("--my", ((py - 0.5) * 2).toFixed(3));
  },
  onMouseLeave(e) {
    ["--rx", "--ry", "--mx", "--my"].forEach((k) => e.currentTarget.style.removeProperty(k));
  },
};

// เหลื่อมจังหวะการโยกของแต่ละใบ ไม่ให้ทั้งแถวโยกพร้อมกัน
export const cardIdleDelay = (seed) => {
  const n = typeof seed === "number" ? seed : String(seed ?? "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return { animationDelay: `-${((n * 1.37) % 8).toFixed(2)}s` };
};
