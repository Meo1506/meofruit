"use client";
import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import productsData from "@/data/products.json";
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";

const FRUIT_DEFS = [
  { slug: "xoai-cat-san",    name: "Xoài",    emoji: "🥭", combos: ["Hộp Ngũ Sắc", "Hộp Giòn Tan"] },
  { slug: "oi-cat-san",      name: "Ổi",      emoji: "🍏", combos: ["Hộp Ngũ Sắc", "Hộp Giòn Tan"] },
  { slug: "man-cat-san",     name: "Mận",      emoji: "🍑", combos: ["Hộp Ngũ Sắc", "Hộp Giòn Tan"] },
  { slug: "dua-hau-cat-san", name: "Dưa hấu", emoji: "🍉", combos: ["Hộp Ngũ Sắc", "Hộp Giải Nhiệt"] },
  { slug: "quyt-boc-san",    name: "Quýt",    emoji: "🍊", combos: ["Hộp Ngũ Sắc", "Hộp Giải Nhiệt"] },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function FruitStockPage() {
  const [stockMap, setStockMap]     = useState<Record<string, boolean>>({});
  const [loading, setLoading]       = useState(true);
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});

  useEffect(() => {
    fetchStock();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("realtime-admin-fruit-stock")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => {
            fetchStock();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function fetchStock() {
    setLoading(true);
    try {
      const slugs = FRUIT_DEFS.map(f => f.slug);
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from("products")
          .select("slug, is_in_stock")
          .in("slug", slugs);
        if (error) throw error;
        const map: Record<string, boolean> = {};
        (data || []).forEach((p: { slug: string; is_in_stock: boolean }) => {
          map[p.slug] = p.is_in_stock !== false;
        });
        setStockMap(map);
      } else {
        const map: Record<string, boolean> = {};
        (productsData as { slug: string; is_in_stock?: boolean }[])
          .filter(p => slugs.includes(p.slug))
          .forEach(p => { map[p.slug] = p.is_in_stock !== false; });
        setStockMap(map);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggle(slug: string, newValue: boolean) {
    setStockMap(prev => ({ ...prev, [slug]: newValue }));
    setSaveStatus(prev => ({ ...prev, [slug]: "saving" }));
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from("products")
          .update({ is_in_stock: newValue })
          .eq("slug", slug);
        if (error) throw error;
      }
      setSaveStatus(prev => ({ ...prev, [slug]: "saved" }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [slug]: "idle" })), 2000);
    } catch {
      setStockMap(prev => ({ ...prev, [slug]: !newValue }));
      setSaveStatus(prev => ({ ...prev, [slug]: "error" }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [slug]: "idle" })), 3000);
    }
  }

  const outOfStockCount = FRUIT_DEFS.filter(f => stockMap[f.slug] === false).length;

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              Tồn kho trái cây
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Bật/tắt từng loại — combo và jackpot tự động cập nhật theo.
            </p>
            <div className="flex items-center mt-1.5">
              <span className={`w-2 h-2 rounded-full mr-2 ${isSupabaseConfigured() ? "bg-green-500" : "bg-orange-500"}`} />
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                {isSupabaseConfigured() ? "Supabase · Lưu ngay" : "Demo mode · Không lưu thật"}
              </p>
            </div>
          </div>
          <button
            onClick={fetchStock}
            disabled={loading}
            className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
          >
            <RefreshCw size={15} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Warning if any out-of-stock */}
        {!loading && outOfStockCount > 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-700">
                {outOfStockCount} loại trái cây đang hết hàng
              </p>
              <p className="text-xs text-red-500 font-medium mt-0.5">
                Combo và vòng quay jackpot chứa những loại này đã tự vô hiệu hoá trên storefront.
              </p>
            </div>
          </div>
        )}

        {/* Fruit grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={36} className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {FRUIT_DEFS.map(fruit => {
              const inStock = stockMap[fruit.slug] !== false;
              const status  = saveStatus[fruit.slug] ?? "idle";

              return (
                <div
                  key={fruit.slug}
                  className={`bg-white rounded-2xl border-2 p-5 transition-all ${
                    inStock ? "border-green-100 shadow-sm" : "border-red-200 bg-red-50/40"
                  }`}
                >
                  {/* Emoji + name */}
                  <div className="text-center mb-4">
                    <div className={`text-5xl mb-2 leading-none transition-all duration-300 ${!inStock ? "grayscale opacity-40" : ""}`}>
                      {fruit.emoji}
                    </div>
                    <p className="font-black text-gray-900">{fruit.name}</p>
                  </div>

                  {/* Toggle row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${inStock ? "text-green-600" : "text-red-500"}`}>
                      {inStock ? "Còn hàng" : "Hết hàng"}
                    </span>
                    <button
                      onClick={() => toggle(fruit.slug, !inStock)}
                      disabled={status === "saving"}
                      aria-label={`Toggle ${fruit.name}`}
                      className={`
                        relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 flex-shrink-0
                        ${inStock ? "bg-green-500" : "bg-gray-300"}
                        ${status === "saving" ? "opacity-60 cursor-wait" : "cursor-pointer hover:opacity-90"}
                      `}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${inStock ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {/* Save indicator */}
                  <div className="h-4 flex items-center justify-center mb-3">
                    {status === "saving" && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                        <Loader2 size={10} className="animate-spin" /> Đang lưu...
                      </span>
                    )}
                    {status === "saved" && (
                      <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                        <CheckCircle2 size={10} /> Đã lưu
                      </span>
                    )}
                    {status === "error" && (
                      <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                        <AlertTriangle size={10} /> Lỗi, thử lại
                      </span>
                    )}
                  </div>

                  {/* Affected combos */}
                  <div className="border-t border-gray-100 pt-3 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                      Ảnh hưởng:
                    </p>
                    {fruit.combos.map(combo => (
                      <div key={combo} className={`flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2 py-1 ${!inStock ? "bg-red-100 text-red-600" : "bg-gray-50 text-gray-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${!inStock ? "bg-red-400" : "bg-gray-300"}`} />
                        {combo}
                      </div>
                    ))}
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2 py-1 ${!inStock ? "bg-red-100 text-red-600" : "bg-gray-50 text-gray-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${!inStock ? "bg-red-400" : "bg-gray-300"}`} />
                      Hộp Tự Chọn · Jackpot
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">Cách hoạt động</p>
          <ul className="space-y-1.5 text-xs text-blue-700 font-medium leading-relaxed">
            <li>• Tắt 1 loại → combo chứa nó tự hiện <strong>"Hết hàng"</strong> trên storefront</li>
            <li>• Jackpot không quay ra loại đó nữa; nếu còn &lt; 2 loại thì jackpot tạm ngừng</li>
            <li>• Hộp Tự Chọn ẩn loại đó khỏi danh sách chọn của khách</li>
            <li>• Bật lại → mọi thứ khôi phục tự động, không cần chỉnh combo thủ công</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
