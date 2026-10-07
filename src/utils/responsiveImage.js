// Keep originals untouched; request an appropriately sized Cloudinary variant.
export function optimizedImage(src, width = 640) {
  if (typeof src !== "string") return src;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || !url.pathname.includes("/image/upload/")) return src;
    const size = Math.max(64, Math.min(1920, Math.round(width)));
    return src.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_limit,w_" + size + "/");
  } catch { return src; }
}
