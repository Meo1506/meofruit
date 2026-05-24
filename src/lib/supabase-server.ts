// Supabase server clients: dùng trong middleware, route handlers, server components.
// Đọc/ghi session qua cookies (do client đã chuyển sang createBrowserClient).
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co";

/**
 * Supabase client cho middleware — đồng bộ cookies giữa request và response.
 * Sau khi gọi xong, MUST trả `response` về cho Next.js để cookie auth được ghi lại.
 */
export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          req.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        });
      },
    },
  });
}
