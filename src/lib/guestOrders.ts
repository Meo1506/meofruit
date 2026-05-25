// Lưu danh sách đơn guest đã đặt trên thiết bị này vào cookie (client-readable).
// Schema: [{ order_code, email, created_at }]
// - httpOnly=false (cần đọc/ghi từ client để render /don-cua-toi và /tra-cuu-don)
// - SameSite=Lax, Path=/
// - Max-Age=180 ngày
//
// Lưu ý bảo mật: order_code KHÔNG phải bí mật. RLS + RPC `lookup_orders_public`
// yêu cầu kèm email khớp mới trả về đơn.
//
// Callers:
// - src/app/thanh-toan/page.tsx        (addGuestOrder sau khi insert thành công)
// - src/app/don-cua-toi/page.tsx       (getGuestOrders để liệt kê)
// - src/app/tra-cuu-don/page.tsx       (addGuestOrder khi tra cứu khớp)
// - src/context/AuthContext.tsx        (getGuestOrderCodes + removeGuestOrders khi merge)
const COOKIE_NAME = "fw_guest_orders";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days
const MAX_ENTRIES = 50; // tránh cookie phình > 4KB

export interface GuestOrderEntry {
  order_code: string;
  email: string;
  created_at: string; // ISO 8601
}

function readCookieRaw(name: string): string | null {
  if (typeof document === "undefined") return null;
  const all = document.cookie ? document.cookie.split("; ") : [];
  for (const part of all) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (decodeURIComponent(part.slice(0, eq)) === name) {
      return decodeURIComponent(part.slice(eq + 1));
    }
  }
  return null;
}

function writeCookieRaw(name: string, value: string, maxAgeSec: number): void {
  if (typeof document === "undefined") return;
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=/`,
    `Max-Age=${maxAgeSec}`,
    `SameSite=Lax`,
  ];
  if (isHttps) parts.push("Secure");
  document.cookie = parts.join("; ");
}

export function getGuestOrders(): GuestOrderEntry[] {
  const raw = readCookieRaw(COOKIE_NAME);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is GuestOrderEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as GuestOrderEntry).order_code === "string" &&
        typeof (e as GuestOrderEntry).email === "string" &&
        typeof (e as GuestOrderEntry).created_at === "string"
    );
  } catch {
    return [];
  }
}

export function addGuestOrder(entry: GuestOrderEntry): void {
  const list = getGuestOrders();
  const deduped = list.filter((e) => e.order_code !== entry.order_code);
  deduped.unshift(entry);
  const trimmed = deduped.slice(0, MAX_ENTRIES);
  writeCookieRaw(COOKIE_NAME, JSON.stringify(trimmed), MAX_AGE_SECONDS);
}

export function removeGuestOrders(codes: string[]): void {
  if (codes.length === 0) return;
  const set = new Set(codes);
  const remaining = getGuestOrders().filter((e) => !set.has(e.order_code));
  if (remaining.length === 0) {
    writeCookieRaw(COOKIE_NAME, "", 0);
    return;
  }
  writeCookieRaw(COOKIE_NAME, JSON.stringify(remaining), MAX_AGE_SECONDS);
}

export function getGuestOrderCodes(): string[] {
  return getGuestOrders().map((e) => e.order_code);
}
