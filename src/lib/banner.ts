// Helpers cho banner trang chủ: compute window từ schedule mode + check live.
import type { HomeBanner } from "@/types";

export type ScheduleMode =
  | { kind: "hours"; hours: number }
  | { kind: "days"; days: number }
  | { kind: "until_datetime"; endAt: string /* ISO */ };

export interface ScheduleWindow {
  start_at: string | null;
  end_at: string | null;
  duration_hours: number | null;
}

/**
 * Convert schedule mode → DB window.
 * - hours/days: start = now, end = now + N.
 * - until_datetime: start = null (hiển thị ngay), end = endAt do user chọn.
 */
export function computeScheduleWindow(mode: ScheduleMode): ScheduleWindow {
  const now = new Date();

  if (mode.kind === "hours") {
    const end = new Date(now.getTime() + mode.hours * 3600_000);
    return {
      start_at: now.toISOString(),
      end_at: end.toISOString(),
      duration_hours: mode.hours,
    };
  }

  if (mode.kind === "days") {
    const end = new Date(now.getTime() + mode.days * 24 * 3600_000);
    return {
      start_at: now.toISOString(),
      end_at: end.toISOString(),
      duration_hours: mode.days * 24,
    };
  }

  return {
    start_at: null,
    end_at: mode.endAt || null,
    duration_hours: null,
  };
}

/**
 * Check banner có đang trong window hiển thị hay không.
 * is_visible đã được caller filter; hàm này chỉ check time window.
 */
export function isInWindow(banner: HomeBanner, now: Date = new Date()): boolean {
  const t = now.getTime();
  if (banner.start_at) {
    const start = new Date(banner.start_at).getTime();
    if (Number.isFinite(start) && t < start) return false;
  }
  if (banner.end_at) {
    const end = new Date(banner.end_at).getTime();
    if (Number.isFinite(end) && t > end) return false;
  }
  return true;
}

export function isBannerLive(banner: HomeBanner, now: Date = new Date()): boolean {
  return banner.is_visible && isInWindow(banner, now);
}

/** ISO → 'YYYY-MM-DDTHH:mm' local time cho input[type=datetime-local]. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" + pad(d.getMonth() + 1) +
    "-" + pad(d.getDate()) +
    "T" + pad(d.getHours()) +
    ":" + pad(d.getMinutes())
  );
}

export function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}
