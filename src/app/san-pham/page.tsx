"use client";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import productsData from "@/data/products.json";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import { supabase, isSupabaseConfigured, autoSeedIfEmpty } from "@/lib/supabase";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center text-gray-400 font-bold">Đang tải...</div>}>
      <ProductsPageInner />
    </Suspense>
  );
}

function ProductsPageInner() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [filter, setFilter] = useState("Tất cả");
  const [sortOrder, setSortOrder] = useState("default");
  const [isLoading, setIsLoading] = useState(true);

  // Sync filter từ ?category= URL param khi load
  useEffect(() => {
    if (categoryParam) setFilter(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured()) {
          // Tự động seed nếu database rỗng trước khi load
          await autoSeedIfEmpty();

          // Fetch only products that are in categories set to show_on_storefront
          const { data: catData } = await supabase.from('categories').select('name').eq('show_on_storefront', true);
          const visibleCatNames = catData?.map(c => c.name) || ["Trái cây"];
          setActiveCategories(["Tất cả", ...visibleCatNames]);

          const { data: prodData } = await supabase
              .from('products')
              .select('*')
              .in('category', visibleCatNames)
              .order('created_at', { ascending: false });

          if (prodData) setProducts(prodData);
        } else {
          // Local Demo Fallback
          setActiveCategories(["Tất cả", "Trái cây"]);
          setProducts((productsData as Product[]).filter(p => p.category === "Trái cây"));
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("realtime-products-storefront")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => {
            fetchData();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "categories" },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filter !== "Tất cả") {
      result = result.filter(p => p.category === filter);
    }

    if (queryParam) {
      const q = queryParam.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }

    if (sortOrder === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOrder === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, filter, sortOrder, queryParam]);

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20 text-gray-900">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
            {queryParam ? (
              <>Kết quả tìm "<span className="text-green-600">{queryParam}</span>"</>
            ) : (
              <>Danh Mục <span className="text-green-600">Sản Phẩm</span></>
            )}
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto font-medium">
            {queryParam
              ? `Tìm thấy ${filteredProducts.length} sản phẩm khớp.`
              : "Tổng hợp những loại trái cây tươi ngon nhất, cam kết chất lượng sạch và nguồn gốc rõ ràng."}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {activeCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  filter === cat
                    ? "bg-green-600 text-white shadow-lg shadow-green-200"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Sắp xếp:</span>
            <select 
              className="bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-green-500 p-2 w-full md:w-48 cursor-pointer"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id || index} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white py-20 rounded-3xl text-center border-2 border-dashed border-gray-100">
            <div className="text-6xl mb-4">🍎</div>
            <h3 className="text-xl font-bold text-gray-900">Đang cập nhật sản phẩm</h3>
            <p className="text-gray-500 mt-2">Vui lòng quay lại sau hoặc chọn danh mục khác.</p>
          </div>
        )}
      </div>
    </div>
  );
}
