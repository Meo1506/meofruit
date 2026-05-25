"use client";
import productsData from "@/data/products.json";
import { Product } from "@/types";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useState, useEffect, use } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSiteSettings } from "@/context/SettingsContext";
import { useCart } from "@/context/CartContext";
import { formatVND, getEffectivePrice, isOnSale, getDiscountPercent } from "@/lib/price";
import SaleCountdown from "@/components/SaleCountdown";
import { ShoppingCart, MessageCircle, Plus, Minus } from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const settings = useSiteSettings();
  const { addToCart } = useCart();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      let currentProduct: Product | null = null;
      let all: Product[] = [];

      if (isSupabaseConfigured()) {
        const { data } = await supabase.from('products').select('*').eq('slug', slug).single();
        if (data) currentProduct = data;
        
        const { data: allData } = await supabase.from('products').select('*').limit(20);
        if (allData) all = allData;
      } else {
        const local = productsData as Product[];
        currentProduct = local.find(p => (p.slug || p.url?.split('/').pop() || encodeURIComponent(p.name)) === slug) || null;
        all = local;
      }

      setProduct(currentProduct);
      setRelatedProducts(all.filter(p => p.name !== currentProduct?.name).slice(0, 4));
      setLoading(false);
    }
    fetchDetail();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel(`realtime-product-detail-${slug}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => {
            fetchDetail();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  if (!product) notFound();

  const imageUrl = product.image_url || `/images/placeholder.svg`;

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-gray-500 mb-8 space-x-2">
          <Link href="/" className="hover:text-green-600">Trang chủ</Link>
          <span>/</span>
          <Link href="/san-pham" className="hover:text-green-600">Sản phẩm</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-inner">
              <img 
                src={imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <span className="text-green-600 font-bold uppercase tracking-widest text-xs mb-4">
              {product.category || "Trái cây sạch"}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center space-x-4 mb-8">
              <span className="text-4xl md:text-5xl font-black text-red-600 tracking-tight">
                {formatVND(getEffectivePrice(product))}
              </span>
              {isOnSale(product) && (
                <>
                  <span className="text-xl font-bold text-gray-400 line-through">
                    {formatVND(product.price)}
                  </span>
                  <span className="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                    -{getDiscountPercent(product)}%
                  </span>
                </>
              )}
            </div>
            {isOnSale(product) && product.sale_until && (
              <div className="-mt-4 mb-8">
                <SaleCountdown
                  saleUntil={product.sale_until}
                  className="text-xs font-black text-red-600 uppercase tracking-widest bg-red-50 border border-red-100 px-3 py-1.5 rounded-full"
                />
              </div>
            )}

            <p className="text-gray-600 leading-relaxed mb-8 text-lg">
              {product.description || `Sản phẩm trái cây tươi ngon ${product.name}, được tuyển chọn kỹ lưỡng từ những trang trại uy tín. Đảm bảo độ tươi, giòn và hàm lượng dinh dưỡng cao nhất cho gia đình bạn.`}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Quy cách</p>
                <p className="font-bold text-gray-900">Hộp 750ml</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tình trạng</p>
                <p className="font-bold text-green-600">Còn hàng</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Giao hàng</p>
                <p className="font-bold text-gray-900">Freeship 3km</p>
              </div>
            </div>

            {/* Quantity + Action Buttons */}
            <div className="mt-auto space-y-4">
              {product.is_in_stock === false ? (
                <div className="p-6 bg-gray-100 rounded-3xl text-center">
                  <p className="font-black text-gray-500 uppercase tracking-widest text-sm">Hết hàng</p>
                </div>
              ) : (
                <>
                  {/* Quantity selector */}
                  <div className="flex items-center space-x-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Số lượng:</label>
                    <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-100 p-1">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-green-600 rounded-xl"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v > 0) setQuantity(v);
                        }}
                        className="w-16 text-center bg-transparent border-none p-0 font-black text-gray-900 focus:ring-0"
                      />
                      <span className="text-[10px] text-gray-400 font-bold mr-2">Hộp</span>
                      <button
                        onClick={() => setQuantity(q => q + 1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-green-600 rounded-xl"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="ml-auto text-lg font-black text-red-600">
                      = {formatVND(getEffectivePrice(product) * quantity)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        addToCart(product, quantity, true);
                      }}
                      className="py-4 bg-white border-2 border-green-600 text-green-600 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-green-50 transition-all flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart size={16} />
                      <span>Thêm giỏ</span>
                    </button>
                    <button
                      onClick={() => {
                        addToCart(product, quantity, false);
                        router.push("/thanh-toan");
                      }}
                      className="py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-green-200 transition-all"
                    >
                      Mua ngay
                    </button>
                  </div>

                  {/* Zalo / Hotline / Bank info */}
                  <div className="border-2 border-green-100 rounded-3xl p-6 bg-green-50/30 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Hoặc đặt hàng nhanh</p>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://zalo.me/${settings.contact.zalo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all"
                      >
                        <MessageCircle size={14} />
                        <span>Zalo</span>
                      </a>
                      <a
                        href={`tel:${settings.contact.phone}`}
                        className="flex items-center justify-center py-3 bg-gray-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all"
                      >
                        Gọi {settings.contact.phone}
                      </a>
                    </div>
                    <div className="pt-3 border-t border-green-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold">STK:</span>
                        <span className="font-black text-gray-900">{settings.bankAccount.number} ({settings.bankAccount.bank})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold">Chủ TK:</span>
                        <span className="font-black text-gray-900 uppercase">{settings.bankAccount.owner}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <section className="border-t border-gray-100 pt-20">
           <h2 className="text-3xl font-black text-gray-900 mb-10 tracking-tight">SẢN PHẨM <span className="text-green-600">LIÊN QUAN</span></h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p, i) => (
                <ProductCard key={i} product={p} />
              ))}
           </div>
        </section>
      </div>
    </div>
  );
}
