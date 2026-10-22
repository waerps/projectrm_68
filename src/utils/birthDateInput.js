// ค่าสูงสุดของช่องเลือกวันเกิด = วันนี้ตามเวลาเครื่อง (กันเลือกวันในอนาคตตั้งแต่หน้าฟอร์ม)
// หลังบ้านตรวจซ้ำอีกชั้นด้วยกฎเดียวกัน (utils/birthDate.js ฝั่ง backend)
export function birthDateMax() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
