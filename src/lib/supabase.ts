// Browser Supabase client — lưu session trong cookies để middleware đọc được server-side.
// Server-side cần dùng createServerClient từ ./supabase-server.
import { createBrowserClient } from "@supabase/ssr";
import productsData from "@/data/products.json";

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

// Tự động seed sản phẩm và danh mục lên Supabase nếu rỗng
export async function autoSeedIfEmpty() {
  if (!isSupabaseConfigured()) return;
  try {
    const { count, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    if (count === 0) {
      console.log("Supabase products table is empty. Auto-seeding from products.json...");

      // 1. Lấy danh sách các danh mục duy nhất từ file JSON và seed vào categories table
      const uniqueCategories = Array.from(new Set(productsData.map((p) => p.category)));
      const categoryRows = uniqueCategories.map((name) => ({
        name,
        show_on_storefront: true,
      }));

      const { error: catError } = await supabase
        .from("categories")
        .upsert(categoryRows, { onConflict: "name" });

      if (catError) {
        console.error("Auto-seeding categories failed:", catError);
      } else {
        console.log(`Auto-seeded ${categoryRows.length} categories to Supabase.`);
      }

      // 2. Seed toàn bộ sản phẩm vào products table
      const rows = productsData.map((p) => ({
        slug: p.slug || p.id,
        name: p.name,
        price: p.price,
        price_formatted: p.price_formatted,
        image_url: p.image_url,
        category: p.category,
        description: p.description ?? null,
        is_in_stock: p.is_in_stock ?? true,
        product_type: p.product_type ?? "standard",
        fruits: (p as { fruits?: string[] }).fruits ?? [],
      }));

      const { error: prodError } = await supabase
        .from("products")
        .upsert(rows, { onConflict: "slug" });

      if (prodError) {
        console.error("Auto-seeding products failed:", prodError);
      } else {
        console.log(`Auto-seeded ${rows.length} products to Supabase successfully!`);
      }
    }
  } catch (err) {
    console.error("Error auto-seeding Supabase:", err);
  }
}

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
