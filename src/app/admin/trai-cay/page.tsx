"use client";
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
  { slug: "nho-cat-san",     name: "Nho",     emoji: "🍇", combos: ["Hộp Thanh Mát"] },
  { slug: "buoi-tach-mui",   name: "Bưởi",    emoji: "🍊", combos: ["Hộp Thanh Mát"] },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function FruitStockPage() {
  // stockMap: slug → số kg còn lại. 0 = hết hàng.
  const [stockMap, setStockMap]     = useState<Record<string, number>>({});
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
          .select("slug, stock_kg")
          .in("slug", slugs);
        if (error) throw error;
        const map: Record<string, number> = {};
        (data || []).forEach((p: { slug: string; stock_kg: number | null }) => {
          map[p.slug] = Number(p.stock_kg ?? 0);
        });
        setStockMap(map);
      } else {
        const map: Record<string, number> = {};
        (productsData as { slug: string; stock_kg?: number; is_in_stock?: boolean }[])
          .filter(p => slugs.includes(p.slug))
          .forEach(p => {
            // Fallback từ is_in_stock cũ nếu data demo chưa có stock_kg
            map[p.slug] = typeof p.stock_kg === "number"
              ? p.stock_kg
              : (p.is_in_stock !== false ? 10 : 0);
          });
        setStockMap(map);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveStockKg(slug: string, newKg: number) {
    const safeKg = Math.max(0, Number(newKg) || 0);
    const prevKg = stockMap[slug] ?? 0;
    setStockMap(prev => ({ ...prev, [slug]: safeKg }));
    setSaveStatus(prev => ({ ...prev, [slug]: "saving" }));
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from("products")
          .update({ stock_kg: safeKg })
          .eq("slug", slug);
        if (error) throw error;
      }
      setSaveStatus(prev => ({ ...prev, [slug]: "saved" }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [slug]: "idle" })), 2000);
    } catch {
      setStockMap(prev => ({ ...prev, [slug]: prevKg }));
      setSaveStatus(prev => ({ ...prev, [slug]: "error" }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [slug]: "idle" })), 3000);
    }
  }

  const outOfStockCount = FRUIT_DEFS.filter(f => (stockMap[f.slug] ?? 0) <= 0).length;

  return (
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
              const kg      = stockMap[fruit.slug] ?? 0;
              const inStock = kg > 0;
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

                  {/* Kg input row */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-black uppercase tracking-widest ${inStock ? "text-green-600" : "text-red-500"}`}>
                        {inStock ? "Còn hàng" : "Hết hàng"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">kg trong kho</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => saveStockKg(fruit.slug, Math.max(0, kg - 1))}
                        disabled={status === "saving" || kg <= 0}
                        className="w-8 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={kg}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setStockMap(prev => ({ ...prev, [fruit.slug]: isNaN(v) ? 0 : Math.max(0, v) }));
                        }}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          saveStockKg(fruit.slug, isNaN(v) ? 0 : v);
                        }}
                        disabled={status === "saving"}
                        className={`flex-1 h-9 px-2 text-center font-black text-sm rounded-lg border-2 transition-colors ${
                          inStock ? "border-green-200 bg-green-50/50 text-green-700" : "border-red-200 bg-red-50 text-red-600"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => saveStockKg(fruit.slug, kg + 1)}
                        disabled={status === "saving"}
                        className="w-8 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm disabled:opacity-40"
                      >+</button>
                    </div>
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
  );
}
