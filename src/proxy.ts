// Next.js 16 proxy (kế nhiệm middleware) — bảo vệ /admin/* ở server-side trước khi page render.
// Quy tắc:
//   1. Supabase chưa cấu hình → cho qua (local dev demo mode). AdminLayout sẽ hiện banner cảnh báo.
//   2. Supabase đã cấu hình + chưa login → redirect /dang-nhap?next=<path>
//   3. Supabase đã cấu hình + đã login + profiles.is_admin = false → redirect / với toast lỗi
//   4. Supabase đã cấu hình + đã login + profiles.is_admin = true → cho qua

import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient, isSupabaseConfigured } from "@/lib/supabase-server";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // Demo mode: không có Supabase, cho qua. AdminLayout phía client sẽ hiện banner.
  if (!isSupabaseConfigured()) {
    return res;
  }

  const supabase = createMiddlewareClient(req, res);

  // Lấy user — getUser() validate token với Supabase Auth, an toàn hơn getSession() (đọc cookie thô).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/dang-nhap", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin role qua DB
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) {
    const homeUrl = new URL("/", req.url);
    homeUrl.searchParams.set("error", "admin_required");
    return NextResponse.redirect(homeUrl);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
