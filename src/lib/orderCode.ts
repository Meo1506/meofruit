// Sinh order_code công khai dạng FW-XXXX-YYYY (X,Y = chữ in hoa hoặc chữ số 0-9).
// Dùng crypto.getRandomValues để tránh trùng. Không phải mã bí mật — kết hợp với
// email mới tra được đơn (xem RLS policy + RPC lookup_orders_public trong DB).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ I, O, 0, 1 cho dễ đọc

function randomSegment(len: number): string {
  const buf = new Uint8Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < len; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

export function generateOrderCode(): string {
  return `FW-${randomSegment(4)}-${randomSegment(4)}`;
}
