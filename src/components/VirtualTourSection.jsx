import { ArrowRight, Box, Building2, MousePointer2, MoveUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./VirtualTourSection.css";

const floors = [
  { number: "01", name: "พื้นที่ต้อนรับ", href: "/virtual-tour?floor=1" },
  { number: "02", name: "ห้องเรียนชั้น 2", href: "/virtual-tour?floor=2" },
  { number: "03", name: "ห้องเรียนชั้น 3", href: "/virtual-tour?floor=3" },
];

export default function VirtualTourSection({ contentReady }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (contentReady && window.location.hash === "#virtual-tour") {
      const frame = requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ block: "start" }));
      return () => cancelAnimationFrame(frame);
    }
  }, [contentReady]);

  return (
    <section ref={sectionRef} id="virtual-tour" className="virtual-tour-section" aria-labelledby="virtual-tour-title">
      <div className="virtual-tour-heading">
        <div>
          <span className="virtual-tour-eyebrow"><Building2 size={15} /> มารู้จักศรเสริมให้มากขึ้น</span>
          <h2 id="virtual-tour-title">พาชมสถาบัน</h2>
        </div>
        <span className="virtual-tour-tag"><Box size={15} /> สำรวจได้ในมุมมอง 3D</span>
      </div>

      <div className="virtual-tour-card">
        <div className="virtual-tour-copy">
          <span className="virtual-tour-kicker"><span /> เปิดประตูสู่พื้นที่การเรียนรู้</span>
          <h3>ลองเดินเล่น<br /><span>ก่อนมาเรียนจริง</span></h3>
          <p>ตั้งแต่มุมต้อนรับแสนคุ้นเคย ไปจนถึงห้องเรียน<br className="virtual-tour-desktop-break" /> สำรวจทุกมุมของศรเสริมได้ด้วยตัวเอง</p>
          <Link className="virtual-tour-start" to="/virtual-tour?floor=1">
            <Box size={19} /> เริ่มพาชมสถาบัน <ArrowRight size={19} />
          </Link>
          <span className="virtual-tour-tip"><MousePointer2 size={14} /> หมุนมุมมอง · ซูมเข้าใกล้ · คลิกสำรวจ</span>
        </div>

        <Link className="virtual-tour-preview" to="/virtual-tour?floor=1" aria-label="เปิดทัวร์ 3D พื้นที่ต้อนรับชั้น 1">
          <span className="virtual-tour-preview-label"><span /> ศรเสริม ติวเตอร์ / ชั้น 1</span>
          <img src="/tour/welcome-preview.png" alt="โมเดลสามมิติพื้นที่ต้อนรับของศรเสริม ติวเตอร์" loading="lazy" width="1200" height="800" />
          <span className="virtual-tour-preview-footer"><span>พื้นที่จริง ในมุมมองใหม่<small>แตะเพื่อเริ่มสำรวจห้อง</small></span><span className="virtual-tour-preview-arrow"><MoveUpRight size={23} /></span></span>
        </Link>

        <nav className="virtual-tour-floors" aria-label="เลือกชั้นที่ต้องการพาชม">
          {floors.map((floor) => (
            <Link key={floor.number} to={floor.href}>
              <span className="virtual-tour-floor-number">{floor.number}</span>
              <span>{floor.name}</span>
              <ArrowRight size={17} />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
