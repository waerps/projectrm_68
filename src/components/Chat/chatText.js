/* ─────────────────────────────────────────────────────────────────────────
   ตัดข้อความภายในของ n8n "[Used tools: Tool: ..., Input: ..., Result: ...]" ออกจากคำตอบบอต
   (AI เลียนแบบรูปแบบนี้จากประวัติใน memory) — กันชั้นที่สองต่อจาก Answer Validator ฝั่ง n8n
   ───────────────────────────────────────────────────────────────────────── */
export function stripToolTrace(text) {
  if (!text) return text;
  const START = /\[\s*(?:used\s*tools?\s*:|tool\s*:)/gi;
  let out = '';
  let i = 0;
  for (;;) {
    START.lastIndex = i;
    const m = START.exec(text);
    if (!m) { out += text.slice(i); break; }
    out += text.slice(i, m.index);
    let depth = 0, j = m.index, inStr = false, esc = false, closed = false;
    for (; j < text.length; j++) {
      const ch = text[j];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') { inStr = true; continue; }
      if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') {
        depth--;
        if (depth === 0) { j++; closed = true; break; }
      }
    }
    if (!closed) {
      // วงเล็บไม่ปิด (ข้อความถูกตัด) → ตัดถึงย่อหน้าถัดไปเท่านั้น ไม่ลบคำตอบทั้งหมด
      const para = text.indexOf('\n\n', m.index);
      j = para === -1 ? text.length : para;
    }
    i = j;
  }
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

// ลิงก์ที่พาไปหน้าในเว็บนี้เอง → แสดงเป็นปุ่ม และเปลี่ยนหน้าในแท็บเดิม (ประวัติแชตยังอยู่)
// รับทั้งแบบ "/courses/123" และ URL เต็มของเว็บนี้ เฉพาะหน้าที่ผู้ใช้ทั่วไปเข้าได้
const SITE_HOSTS = ["sornserm-tutor.vercel.app"]
const INTERNAL_PREFIXES = ["/courses", "/private-courses", "/promotion", "/cart", "/news", "/about", "/virtual-tour", "/favorites"]
export function toInternalPath(href) {
  const raw = String(href || "").trim()
  let path = null
  if (/^\/(?!\/)/.test(raw)) path = raw
  else {
    try {
      const url = new URL(raw)
      const sameHost = url.host === window.location.host || SITE_HOSTS.includes(url.host)
      if (sameHost && /^https?:$/.test(url.protocol)) path = url.pathname + url.search + url.hash
    } catch { /* ไม่ใช่ URL */ }
  }
  if (!path) return null
  const pathname = path.split(/[?#]/)[0]
  return INTERNAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) || pathname === "/" ? path : null
}

// URL เปล่า ๆ ในคำตอบบอต (ไม่ได้อยู่ในรูป [ข้อความ](ลิงก์)) → แปลงเป็นลิงก์ Markdown ให้กดได้
// ลิงก์ในเว็บนี้ได้ชื่อปุ่มที่อ่านรู้เรื่อง ลิงก์เว็บอื่นแสดง URL ตามเดิม
const BARE_URL_RE = /(^|(?<!\])\(|[^[\](<"'\w/])(https?:\/\/[^\s<>()\]]+[^\s<>()\].,!?;:'"])/g
export function autolinkBareUrls(text) {
  if (!text || !/https?:\/\//i.test(text)) return text
  return text.replace(BARE_URL_RE, (whole, before, url) => {
    const internal = toInternalPath(url)
    let label = url
    if (internal) {
      if (internal.startsWith("/private-courses")) label = "ไปหน้าคอร์สเดี่ยว"
      else if (internal.startsWith("/courses/")) label = "ดูรายละเอียดคอร์ส"
      else if (internal.startsWith("/promotion")) label = "ดูโปรโมชัน"
      else label = "ไปที่หน้านี้"
    }
    return `${before}[${label}](${url})`
  })
}
