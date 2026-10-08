import { getFileUrl } from "./fileUrl";

// ดาวน์โหลดไฟล์จาก Cloudinary/backend ให้ได้ "ชื่อไฟล์ + นามสกุล" ที่เปิดได้จริง
// - แอตทริบิวต์ download ของ <a> ใช้กับลิงก์ข้ามโดเมนไม่ได้ จึงต้อง fetch เป็น blob ก่อน
// - ไฟล์เก่าบน Cloudinary (raw) ไม่มีนามสกุลใน URL และถูกส่งมาเป็น application/octet-stream
//   จึงเดานามสกุลจาก URL → MIME → ลายเซ็นไฟล์ (magic bytes) ตามลำดับ
const MIME_EXT = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const extOf = (name) => (String(name || "").match(/\.([A-Za-z0-9]{1,8})$/) || [])[1]?.toLowerCase() || "";

async function sniffExt(blob) {
  const head = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const hex = Array.from(head, (b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.startsWith("25504446")) return "pdf";            // %PDF
  if (hex.startsWith("d0cf11e0")) return "doc";            // Office 97-2003
  if (hex.startsWith("504b0304")) return "docx";           // zip (docx/pptx/xlsx) — เอกสารในระบบส่วนใหญ่เป็น docx
  return "";
}

export async function downloadFile(path, displayName) {
  const url = getFileUrl(path);
  if (!url) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const name = String(displayName || "").trim() || "document";
    let ext = extOf(name);
    if (!ext) {
      let urlExt = "";
      try { urlExt = extOf(new URL(url).pathname); } catch { /* ignore */ }
      ext = urlExt || MIME_EXT[blob.type] || (await sniffExt(blob));
    }
    const fileName = ext && !name.toLowerCase().endsWith(`.${ext}`) ? `${name}.${ext}` : name;
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    console.error("[downloadFile]", err);
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
