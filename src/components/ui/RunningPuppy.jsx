// น้องหมาวิ่ง — ใช้แทนแถบโหลดตอนรอ AI ประมวลผล (วาดเอง ไม่ใช้ตัวการ์ตูนลิขสิทธิ์)
// วิ่งไป-กลับในราง: ขาสลับ หางกระดิก ตัวเด้งเบาๆ · ผู้ใช้ที่ตั้งค่าลดภาพเคลื่อนไหวจะเห็นน้องหมานั่งนิ่งตรงกลาง
export default function RunningPuppy({ className = "" }) {
  return (
    <div className={`puppy-track relative h-10 w-full overflow-hidden ${className}`} aria-hidden="true">
      {/* พื้น */}
      <div className="absolute inset-x-0 bottom-1 border-b-2 border-dashed border-orange-200" />
      <div className="puppy-runner absolute bottom-1 left-0 w-full">
        <div className="puppy-face w-11">
          <svg viewBox="0 0 44 32" className="puppy-bob h-8 w-11">
            {/* หาง */}
            <path className="puppy-tail" d="M8 15 Q3 10 5 5" stroke="#d99a5b" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* ขาหลัง/หน้า (สลับจังหวะ) */}
            <rect className="puppy-leg-a" x="10" y="20" width="3.2" height="8" rx="1.6" fill="#d99a5b" />
            <rect className="puppy-leg-b" x="14.5" y="20" width="3.2" height="8" rx="1.6" fill="#e8b07a" />
            <rect className="puppy-leg-b" x="22" y="20" width="3.2" height="8" rx="1.6" fill="#d99a5b" />
            <rect className="puppy-leg-a" x="26.5" y="20" width="3.2" height="8" rx="1.6" fill="#e8b07a" />
            {/* ตัว */}
            <ellipse cx="19" cy="18" rx="12" ry="7" fill="#f5c48a" />
            <ellipse cx="18" cy="20" rx="7" ry="3.5" fill="#fde7c8" />
            {/* หัว */}
            <circle cx="31" cy="11" r="8" fill="#f5c48a" />
            <ellipse className="puppy-ear" cx="27" cy="8" rx="3" ry="5.5" fill="#b97a45" transform="rotate(-25 27 8)" />
            <ellipse cx="36" cy="13.5" rx="4" ry="3" fill="#fde7c8" />
            <circle cx="33" cy="9.5" r="1.4" fill="#334155" />
            <circle cx="33.4" cy="9" r="0.45" fill="#fff" />
            <circle cx="39.3" cy="12.3" r="1.5" fill="#334155" />
            <path d="M35.5 16 q1.2 2.6 2.6 0" fill="#fb7185" />
            <circle cx="30.5" cy="14" r="1.5" fill="#fda4af" opacity=".7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
