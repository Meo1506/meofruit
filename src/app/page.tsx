"use client";
import { useState, useEffect } from "react";
import productsData from "@/data/products.json";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import SectionNav from "@/components/SectionNav";
import { supabase, isSupabaseConfigured, autoSeedIfEmpty } from "@/lib/supabase";
import Link from "next/link";
import dynamic from "next/dynamic";

const JackpotCard = dynamic<{ outOfStockSlugs?: string[] }>(() => import("@/components/JackpotCard"), { ssr: false });

const GROUP_ORDER = ["Hộp Mix Sẵn", "Hộp Tự Chọn", "Hộp Nguyên Bản"];
const GROUP_IDS: Record<string, string> = {
  "Hộp Mix Sẵn": "hop-mix-san",
  "Hộp Tự Chọn": "hop-tu-chon",
  "Hộp Nguyên Bản": "hop-nguyen-ban",
};
const GROUP_DESCRIPTIONS: Record<string, string> = {
  "Hộp Mix Sẵn": "Shop đã mix sẵn — kích thích chốt đơn ngay, không cần suy nghĩ",
  "Hộp Tự Chọn": "Bạn chọn loại quả, shop mix theo — linh hoạt tuyệt đối",
  "Hộp Nguyên Bản": "Chỉ 1 loại quả duy nhất — dành cho tín đồ thuần vị",
};
const GROUP_EMOJIS: Record<string, string> = {
  "Hộp Mix Sẵn": "🎁",
  "Hộp Tự Chọn": "✨",
  "Hộp Nguyên Bản": "🍎",
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      if (isSupabaseConfigured()) {
        // Tự động seed nếu database rỗng trước khi load
        await autoSeedIfEmpty();
        const { data } = await supabase.from("products").select("*").limit(50);
        if (data && data.length > 0) {
          setProducts(data);
          return;
        }
      }
      setProducts(productsData as Product[]);
    }
    load();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("realtime-products-home")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => {
            load();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Individual fruit product slugs — used to derive combo availability
  const FRUIT_SLUGS = ["xoai-cat-san", "oi-cat-san", "man-cat-san", "dua-hau-cat-san", "quyt-boc-san"];

  const outOfStockFruitSlugs = products
    .filter(p => FRUIT_SLUGS.includes(p.slug || p.id || "") && p.is_in_stock === false)
    .map(p => p.slug || p.id || "");

  // Fruit names for the custom mix selector (maps slug → display name)
  const SLUG_TO_NAME: Record<string, string> = {
    "xoai-cat-san": "Xoài",
    "oi-cat-san": "Ổi",
    "man-cat-san": "Mận",
    "dua-hau-cat-san": "Dưa hấu",
    "quyt-boc-san": "Quýt",
  };
  const outOfStockFruitNames = outOfStockFruitSlugs.map(s => SLUG_TO_NAME[s]).filter(Boolean);

  // Enrich: combo products that include an out-of-stock fruit are also out-of-stock (except hop-ngu-sac)
  const enrichedProducts = products.map(p =>
    p.slug !== "hop-ngu-sac" && p.fruits?.length && p.fruits.some(f => outOfStockFruitSlugs.includes(f))
      ? { ...p, is_in_stock: false }
      : p
  );

  const grouped = GROUP_ORDER.map(cat => ({
    cat,
    items: enrichedProducts.filter(p => p.category === cat),
  }));

  return (
    <div className="text-gray-900">
      {/* Hero */}
      <section className="relative h-[88vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop"
            className="w-full h-full object-cover"
            alt="Hero"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-500/20 backdrop-blur-md text-green-300 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            Hộp 750ml · Cắt sẵn · Tươi mỗi ngày
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-5 tracking-tight leading-tight">
            Trái Cây{" "}
            <span className="text-green-400 italic font-medium">Cắt Sẵn</span>
          </h1>
          <p className="text-base md:text-lg text-gray-200 mb-8 max-w-xl mx-auto leading-relaxed font-medium">
            Freeship hỏa tốc bán kính 3km · Linh Xuân, Thủ Đức
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#hop-mix-san"
              onClick={e => {
                e.preventDefault();
                document.getElementById("hop-mix-san")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl shadow-green-900/30 transition-all uppercase tracking-widest text-xs w-full sm:w-auto"
            >
              Đặt ngay
            </a>
            <Link
              href="/san-pham"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-black rounded-2xl border border-white/20 transition-all uppercase tracking-widest text-xs w-full sm:w-auto"
            >
              Xem tất cả
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/60 animate-bounce">
          <span className="text-[10px] font-bold uppercase tracking-widest">Lướt xuống</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Sticky Section Nav */}
      <SectionNav />

      {/* Feature Pills */}
      <section className="bg-white border-b border-gray-50">
        <div className="container mx-auto px-4 py-4 flex flex-wrap justify-center gap-3 md:gap-6">
          {[
            { icon: "🍱", text: "Hộp 750ml chuẩn" },
            { icon: "⚡", text: "Giao hỏa tốc" },
            { icon: "🚚", text: "Free ship 3km" },
            { icon: "✅", text: "Tươi sạch mỗi ngày" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <span className="text-base">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Jackpot Section */}
      <section className="py-12 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 border-y border-gray-100/80 overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Centered relative wrapper for Jackpot wheel */}
          <div className="relative w-full max-w-sm mx-auto min-h-[380px] flex items-center justify-center">
            
            {/* Desktop-only Universe Signal Promo Text - Positioned exactly to the left of the card boundary */}
            <div className="hidden lg:flex absolute right-[calc(100%+48px)] top-1/2 -translate-y-1/2 flex-col items-start space-y-4 w-[280px] lg:w-[320px] text-left animate-in fade-in slide-in-from-left-6 duration-700">
              <span className="inline-block px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-700 text-[10px] font-black uppercase tracking-wider animate-pulse">
                ✨ Tín hiệu vũ trụ
              </span>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-950 tracking-tight leading-none uppercase">
                Không biết <br />
                <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent italic font-medium">chọn gì?</span>
              </h2>
              
              <style>{`
                @keyframes point-right {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(10px); }
                }
                .animate-point-right {
                  animation: point-right 0.8s infinite ease-in-out;
                }
                @keyframes glow-pulse {
                  0%, 100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.4); }
                  50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); }
                }
                .animate-glow-pulse {
                  animation: glow-pulse 2s infinite ease-in-out;
                }
              `}</style>

              <div className="flex items-center space-x-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg animate-glow-pulse select-none group cursor-pointer hover:scale-105 active:scale-95 transition-all">
                <span>Gạt cần ngay thôi</span>
                <span className="animate-point-right text-lg leading-none">👉</span>
              </div>
            </div>

            {/* Jackpot Slot Machine Card - Stays perfectly centered inside wrapper */}
            <div className="w-full z-10">
              <JackpotCard outOfStockSlugs={outOfStockFruitSlugs} />
            </div>

          </div>
        </div>
      </section>

      {/* Product Sections */}
      <div className="pb-24">
        {grouped.map(({ cat, items }) => (
          <section
            key={cat}
            id={GROUP_IDS[cat]}
            className="scroll-mt-28 py-14 md:py-20"
          >
            <div className="container mx-auto px-4">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{GROUP_EMOJIS[cat]}</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase">
                      {cat}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{GROUP_DESCRIPTIONS[cat]}</p>
                  <div className="h-1 w-12 bg-green-500 mt-3 rounded-full" />
                </div>
                <Link
                  href={`/san-pham?category=${encodeURIComponent(cat)}`}
                  className="text-xs font-black text-green-600 uppercase tracking-widest hover:underline self-start md:self-auto"
                >
                  Xem thêm →
                </Link>
              </div>

              {/* Grid */}
              {items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {items.map((product, i) => (
                    <ProductCard key={product.id || i} product={product} outOfStockFruitNames={outOfStockFruitNames} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm font-medium">
                  Đang cập nhật sản phẩm...
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Promo Banner */}
      <section className="container mx-auto px-4 pb-16">
        <div className="bg-gray-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="relative z-10 space-y-4 max-w-lg text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase tracking-tighter">
              Freeship <span className="text-green-400">3km</span>
            </h2>
            <p className="text-gray-400 font-medium leading-relaxed text-sm md:text-base">
              Giao hàng nhanh chóng, trái cây tươi ngon mỗi ngày trong bán kính 3km quanh Linh Xuân, Thủ Đức.
            </p>
            <Link
              href="/chinh-sach-giao-hang"
              className="inline-block px-8 py-3 bg-white text-gray-900 font-black rounded-2xl hover:bg-green-400 transition-colors uppercase tracking-widest text-[10px]"
            >
              Xem chính sách
            </Link>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-green-500 rounded-full blur-[60px] opacity-20 pointer-events-none" />
            <img
              src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=600&auto=format&fit=crop"
              className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-[2rem] rotate-2 shadow-2xl border-4 border-white/5"
              alt="Giao hàng nhanh"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
