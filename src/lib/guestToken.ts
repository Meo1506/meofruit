const KEY = "fw_guest_token";

export function getOrCreateGuestToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(KEY, token);
  }
  return token;
}

export function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}
