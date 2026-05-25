// Helpers giá tiền + sale logic.

export const formatVND = (n: number) => (n ?? 0).toLocaleString("vi-VN") + "₫";

interface PriceFields {
  price: number;
  sale_price?: number | null;
  /** ISO timestamptz. Null/undefined = sale không có hạn. */
  sale_until?: string | null;
}

/** True nếu sale_until null/undefined → không hạn; ngược lại check now < sale_until. */
function isSaleWindowActive(sale_until: string | null | undefined, now: number = Date.now()): boolean {
  if (!sale_until) return true;
  const until = Date.parse(sale_until);
  if (Number.isNaN(until)) return true; // dữ liệu xấu → coi như không hạn, đừng phá UX
  return now < until;
}

/** True nếu sản phẩm đang sale (sale_price hợp lệ + chưa hết hạn). */
export function isOnSale(p: PriceFields, now: number = Date.now()): boolean {
  const sp = p.sale_price;
  if (typeof sp !== "number" || sp <= 0 || sp >= p.price) return false;
  return isSaleWindowActive(p.sale_until, now);
}

/** Giá đang bán — sale_price nếu đang sale, ngược lại price gốc (fallback hết hạn). */
export function getEffectivePrice(p: PriceFields, now: number = Date.now()): number {
  return isOnSale(p, now) ? (p.sale_price as number) : p.price;
}

/** % giảm giá (làm tròn) — 0 nếu không sale. */
export function getDiscountPercent(p: PriceFields, now: number = Date.now()): number {
  if (!isOnSale(p, now)) return 0;
  return Math.round((1 - (p.sale_price as number) / p.price) * 100);
}

/** Số ms còn lại tới hạn sale. null nếu không có sale_until hoặc không đang sale. */
export function getSaleTimeRemainingMs(p: PriceFields, now: number = Date.now()): number | null {
  if (!isOnSale(p, now) || !p.sale_until) return null;
  const until = Date.parse(p.sale_until);
  if (Number.isNaN(until)) return null;
  return Math.max(0, until - now);
}

/** Format "X ngày Y giờ" / "Y giờ Z phút" / "Z phút" / "<1 phút" cho countdown sale. */
export function formatSaleCountdown(ms: number): string {
  if (ms <= 0) return "Đã kết thúc";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  if (minutes > 0) return `${minutes} phút`;
  return "<1 phút";
}
