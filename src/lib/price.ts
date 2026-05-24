// Helpers giá tiền + sale logic.

export const formatVND = (n: number) => (n ?? 0).toLocaleString("vi-VN") + "₫";

interface PriceFields {
  price: number;
  sale_price?: number | null;
}

/** Giá đang bán — sale_price nếu hợp lệ (> 0 và < price), ngược lại là price thường. */
export function getEffectivePrice(p: PriceFields): number {
  const sp = p.sale_price;
  if (typeof sp === "number" && sp > 0 && sp < p.price) return sp;
  return p.price;
}

/** True nếu sản phẩm đang sale (sale_price hợp lệ và thấp hơn giá gốc). */
export function isOnSale(p: PriceFields): boolean {
  const sp = p.sale_price;
  return typeof sp === "number" && sp > 0 && sp < p.price;
}

/** % giảm giá (làm tròn) — 0 nếu không sale. */
export function getDiscountPercent(p: PriceFields): number {
  if (!isOnSale(p)) return 0;
  return Math.round((1 - (p.sale_price as number) / p.price) * 100);
}
