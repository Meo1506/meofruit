// Browser Supabase client — lưu session trong cookies để middleware đọc được server-side.
// Server-side cần dùng createServerClient từ ./supabase-server.
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
  );
};

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Trích message từ bất kỳ kiểu lỗi nào (Error, Supabase PostgrestError, hoặc object lạ)
export function getErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const e = err as { message?: string; error_description?: string; details?: string; hint?: string; code?: string };
    if (e.message) return e.code ? `${e.message} (${e.code})` : e.message;
    if (e.error_description) return e.error_description;
    if (e.details) return e.details;
    try { return JSON.stringify(err); } catch { return String(err); }
  }
  return String(err);
}
