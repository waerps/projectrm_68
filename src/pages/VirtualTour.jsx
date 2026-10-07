import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { mountWelcomeScene } from "./virtualTour/welcomeScene";
import { mountClassroomScene } from "./virtualTour/classroomScene";
import { rooms } from "./virtualTour/roomData";
import "./VirtualTour.css";

let threeLoader;

function loadThree() {
  if (window.THREE) return Promise.resolve();
  if (!threeLoader) {
    threeLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/tour/vendor/three.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("โหลดโมเดล 3D ไม่สำเร็จ"));
      document.head.appendChild(script);
    });
  }
  return threeLoader;
}

function FloorNavigation({ floor, classroom }) {
  return (
    <nav className="floor-links" aria-label="เลือกชั้น">
      {[1, 2, 3].map((number) =>
        number === floor ? (
          <button
            key={number}
            type="button"
            className="active"
            aria-current="page"
            onClick={() => document.getElementById(classroom ? "lobby" : "reset")?.click()}
          >
            ชั้น {number}
          </button>
        ) : (
          <Link key={number} to={`/virtual-tour?floor=${number}`}>
            ชั้น {number}
          </Link>
        )
      )}
    </nav>
  );
}

function WelcomeTour() {
  return (
    <>
      <div id="room" aria-label="โมเดลสามมิติพื้นที่ต้อนรับของศรเสริม ติวเตอร์" />
      <aside className="intro">
        <FloorNavigation floor={1} classroom={false} />
        <div className="eyebrow"><span /> ชั้น 1 / ยินดีต้อนรับ</div>
        <h1>ทุกมุมพร้อม<br /><em>ให้คุณเรียนรู้</em></h1>
        <p>มารู้จักศรเสริมให้มากขึ้น<br />ตั้งแต่มุมต้อนรับ จนพร้อมขึ้นห้องเรียน</p>
        <button className="primary" id="tour" type="button">เริ่มพาชมทีละมุม <span aria-hidden="true">↗</span></button>
        <div className="intro-divider" />
        <span className="section-label">เลือกมุมที่อยากรู้จัก</span>
        <nav className="dock" id="dock" aria-label="เลือกพื้นที่" />
        <nav className="first-floor-rooms" aria-label="ห้องเรียนชั้น 1">
          <span className="section-label">ห้องเรียนชั้น 1</span>
          <Link to="/virtual-tour?room=1"><span>ห้อง 1 <small>8 ที่นั่ง</small></span><span aria-hidden="true">→</span></Link>
        </nav>
        <Link className="course-link" to="/courses">ดูคอร์สเรียนของเรา <span aria-hidden="true">→</span></Link>
        <Link className="back-home" to="/#virtual-tour"><span aria-hidden="true">←</span> กลับหน้าแรก</Link>
      </aside>

      <div className="scene-label"><span className="live-dot" /> พื้นที่ต้อนรับ <span className="scene-label-muted">/ ชั้น 1</span></div>
      <div id="hotspots" />
      <div className="toolbar" role="group" aria-label="ควบคุมมุมมอง">
        <button id="minus" aria-label="ซูมออก" title="ซูมออก">−</button>
        <button id="plus" aria-label="ซูมเข้า" title="ซูมเข้า">+</button>
        <span className="toolbar-separator" />
        <button id="reset" aria-label="มุมมองรวม" title="มุมมองรวม">↺ <span>มุมเริ่มต้น</span></button>
        <button id="top" aria-label="มองจากด้านบน" title="มองจากด้านบน">⊞ <span>ผังด้านบน</span></button>
        <button id="rotate" aria-label="หมุนห้องอัตโนมัติ" aria-pressed="false" title="หมุนห้องอัตโนมัติ">↻</button>
        <button id="labels" aria-label="แสดงหรือซ่อนชื่อพื้นที่" aria-pressed="true" title="แสดงหรือซ่อนชื่อพื้นที่">ⓘ</button>
      </div>
      <div className="hint">ลากเพื่อหมุน · เลื่อนหรือใช้สองนิ้วเพื่อซูม · แตะจุดเพื่อสำรวจ</div>
      <div className="model-note">ภาพจำลองเพื่อแนะนำบรรยากาศของสถาบัน</div>

      <aside className="panel" id="panel" aria-label="รายละเอียดพื้นที่" inert>
        <button className="close" id="close" aria-label="ปิดรายละเอียด">×</button>
        <div className="panel-head"><div className="eyebrow" id="category" /><h2 id="title" /><p id="description" /></div>
        <div className="photo" id="photo" />
        <div className="panel-details"><div id="features" /></div>
      </aside>
    </>
  );
}

function ClassroomTour({ floor }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasGuide = floor === 2 || floor === 3;
  useEffect(() => {
    const page = document.getElementById("virtual-tour-page");
    page?.classList.toggle("room-details-open", detailsOpen);
    return () => page?.classList.remove("room-details-open");
  }, [detailsOpen]);
  return (
    <>
      <div id="canvas" aria-label="โมเดลสามมิติห้องเรียนของศรเสริม ติวเตอร์" />
      <aside className="sidebar">
        <FloorNavigation floor={floor} classroom />
        <div className="eyebrow" id="eyebrow" />
        <h1 id="title" /><p className="desc" id="desc" />
        <span className="section-label">เลือกพื้นที่ที่อยากชม</span>
        <nav className="rooms" id="rooms" aria-label="เลือกห้องเรียน" />
        {hasGuide && <>
          <button className="primary guide-start" id="guideTour" type="button">เริ่มพาชมทีละจุด <span aria-hidden="true">↗</span></button>
          <span className="section-label guide-label">จุดแนะนำชั้น {floor}</span>
          <nav className="dock guide-dock" id="guideDock" aria-label={`เลือกจุดแนะนำชั้น ${floor}`} />
        </>}
        <button className="details-toggle secondary" id="detailsToggle" aria-expanded={detailsOpen} aria-controls="roomDetails" onClick={() => setDetailsOpen(!detailsOpen)}>ข้อมูลพื้นที่และอุปกรณ์ ⓘ</button>
        <div className="details-container" id="roomDetails">
          <button className="details-close" id="detailsClose" aria-label="ปิดข้อมูลพื้นที่" onClick={() => setDetailsOpen(false)}>×</button>
          <div className="details" id="details" />
        </div>
        <button className="lobby secondary" id="lobby" hidden>{floor === 1 ? "← กลับพื้นที่ต้อนรับ" : "← กลับโถงหน้าห้อง"}</button>
        <Link className="course-link" to="/courses">ดูคอร์สเรียนของเรา <span aria-hidden="true">→</span></Link>
        <Link className="back-home" to="/#virtual-tour"><span aria-hidden="true">←</span> กลับหน้าแรก</Link>
      </aside>

      <div className="scene-label"><span className="live-dot" /> สำรวจพื้นที่การเรียนรู้ <span className="scene-label-muted">/ 3D</span></div>
      {hasGuide && <div id="guideHotspots" aria-label={`จุดแนะนำบนโมเดลชั้น ${floor}`} />}
      <div className="toolbar controls" role="group" aria-label="ควบคุมมุมมอง">
        <button id="minus" aria-label="ซูมออก">−</button><button id="plus" aria-label="ซูมเข้า">+</button>
        <span className="toolbar-separator" />
        <button id="reset" aria-label="มุมเริ่มต้น">↺ <span>มุมเริ่มต้น</span></button>
        <button id="top" aria-label="ผังด้านบน">⊞ <span>ผังด้านบน</span></button>
        {hasGuide && <><button id="rotate" aria-label="หมุนโถงอัตโนมัติ" aria-pressed="false" title="หมุนโถงอัตโนมัติ">↻</button><button id="labels" aria-label="แสดงหรือซ่อนจุดแนะนำ" aria-pressed="true" title="แสดงหรือซ่อนจุดแนะนำ">ⓘ</button></>}
      </div>
      <div className="hint note">ลากเพื่อหมุน · เลื่อนหรือใช้สองนิ้วเพื่อซูม · แตะประตูเพื่อเลือกห้อง</div>
      <div className="model-note">ภาพจำลองห้องเรียน ตำแหน่งและขนาดโดยประมาณ</div>
      {hasGuide && <aside className="panel classroom-guide-panel" id="guidePanel" aria-label="รายละเอียดจุดแนะนำ" inert>
        <button className="close" id="guideClose" type="button" aria-label="ปิดรายละเอียด">×</button>
        <div className="panel-head"><div className="eyebrow" id="guideCategory" /><h2 id="guideTitle" /><p id="guideDescription" /></div>
        <div className="photo" id="guidePhoto" />
        <div className="panel-details" id="guideDetails" />
      </aside>}
    </>
  );
}

function TourScene({ floor, classroom, embedded = false }) {
  const [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    let cleanup;
    loadThree().then(() => {
      if (disposed) return;
      try { cleanup = classroom ? mountClassroomScene() : mountWelcomeScene({ embedded }); }
      catch (cause) { console.error("เปิดทัวร์ไม่สำเร็จ", cause); setError("ยังเปิดภาพ 3D บนอุปกรณ์นี้ไม่ได้"); }
    }).catch(() => { if (!disposed) setError("โหลดภาพ 3D ไม่สำเร็จ"); });
    return () => { disposed = true; cleanup?.(); };
  }, [classroom, floor, embedded]);

  return (
    <div className={`virtual-tour-page ${classroom ? "classroom-tour" : "welcome-tour"} ${embedded ? "is-embedded" : ""}`} id="virtual-tour-page">
      {classroom ? <ClassroomTour floor={floor} /> : <WelcomeTour />}
      <div className="toast" id="toast" role="status" />
      <div className="loading" id="loading" hidden={Boolean(error)}><span className="loader" /><strong>กำลังเตรียมพื้นที่…</strong><small>สำรวจศรเสริมในมุมมอง 3D</small></div>
      {error && <div className="tour-fallback"><strong>{error}</strong><a href="/tour/photos/welcome-0.jpg">ดูภาพสถานที่จริง</a><Link to="/#virtual-tour">กลับหน้าแรก</Link></div>}
    </div>
  );
}

export default function VirtualTour({ embedded = false }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const room = rooms.find((item) => item.id === Number(params.get("room")));
  const requestedFloor = Number(params.get("floor"));
  const floor = room?.floor ?? ([2, 3].includes(requestedFloor) ? requestedFloor : 1);
  const classroom = Boolean(room) || floor !== 1;
  return <TourScene key={`${floor}-${room?.id ?? "lobby"}-${classroom}`} floor={floor} classroom={classroom} embedded={embedded} />;
}
