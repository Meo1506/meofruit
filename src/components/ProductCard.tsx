"use client";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { ShoppingCart, Plus, Minus, Check, Sliders } from "lucide-react";
import { formatVND, getEffectivePrice, isOnSale, getDiscountPercent } from "@/lib/price";
import dynamic from "next/dynamic";

const ProductQuickView = dynamic(
  () => import("@/components/ProductQuickView"),
  { ssr: false }
);

interface ProductCardProps {
  product: Product;
  outOfStockFruitNames?: string[];
}

export default function ProductCard({ product, outOfStockFruitNames = [] }: ProductCardProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const isCustomMix = product.product_type === "custom_mix";
  const imageUrl = product.image_url || `/images/placeholder.svg`;

  const unitPrice = getEffectivePrice(product);
  const onSale = isOnSale(product);
  const discountPct = getDiscountPercent(product);
  const totalPrice = unitPrice * quantity;

  const handleAddQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(prev => prev + 1);
  };

  const handleSubQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) setQuantity(val);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCustomMix) {
      setShowQuickView(true);
      return;
    }
    addToCart({ ...product, price: unitPrice, price_formatted: formatVND(unitPrice) }, quantity, true);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCustomMix) {
      // Custom mix cần chọn trái cây trước → mở QuickView
      setShowQuickView(true);
      return;
    }
    // Standard: thêm vào giỏ và mở sidebar luôn
    addToCart({ ...product, price: unitPrice, price_formatted: formatVND(unitPrice) }, quantity, false);
  };

  return (
    <>
      <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">

        {/* Image — bấm mở QuickView */}
        <button
          onClick={() => setShowQuickView(true)}
          className="relative aspect-square overflow-hidden bg-gray-50 w-full text-left focus:outline-none"
          aria-label={`Xem nhanh ${product.name}`}
        >
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-105"
          />
          {/* Quick view hint on hover */}
          <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <span className="opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 bg-white text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              Xem nhanh
            </span>
          </div>

          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <span className="bg-white/90 backdrop-blur-sm text-green-700 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-sm">
              {product.category || "Fresh"}
            </span>
          </div>
          {onSale && (
            <div className="absolute top-2 right-2">
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-md">
                -{discountPct}%
              </span>
            </div>
          )}
          {isCustomMix && (
            <div className="absolute bottom-2 right-2">
              <span className="flex items-center gap-1 bg-green-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md">
                <Sliders size={9} /> Tự chọn
              </span>
            </div>
          )}
          {product.is_in_stock === false && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-gray-900 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">
                Hết hàng
              </span>
            </div>
          )}
        </button>

        {/* Info */}
        <div className="p-3 md:p-4 flex flex-col flex-grow">
          {/* Name — bấm cũng mở QuickView */}
          <button
            onClick={() => setShowQuickView(true)}
            className="block min-h-[40px] mb-2 text-left w-full"
          >
            <h3 className="font-bold text-gray-800 text-sm line-clamp-2 group-hover:text-green-600 transition-colors leading-tight">
              {product.name}
            </h3>
          </button>

          <div className="mt-auto relative min-h-[90px] md:min-h-[100px]">
            {/* Default: price */}
            <div className="transition-all duration-300 md:group-hover:opacity-0 md:group-hover:-translate-y-4 md:absolute md:inset-0 flex flex-col justify-end">
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-base font-black text-red-600">{formatVND(unitPrice)}</span>
                  {onSale && (
                    <span className="text-[11px] font-bold text-gray-400 line-through truncate">{formatVND(product.price)}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase flex-shrink-0">1 hộp</span>
              </div>
            </div>

            {/* Hover / Mobile: controls */}
            <div className="mt-3 md:mt-0 transition-all duration-300 md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:absolute md:inset-0 flex flex-col justify-end space-y-2.5">
              {isCustomMix ? (
                <button
                  onClick={handleBuyNow}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Sliders size={13} /> Chọn trái cây
                </button>
              ) : (
                <>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Tổng ({quantity} hộp):</span>
                    <span className="text-sm font-black text-gray-900">{formatVND(totalPrice)}</span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                      <button onClick={handleSubQuantity} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors">
                        <Minus size={12} strokeWidth={4} />
                      </button>
                      <div className="flex-1 flex items-center justify-center">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={quantity}
                          onChange={handleInputChange}
                          onClick={e => e.stopPropagation()}
                          className="w-10 text-center bg-transparent border-none p-0 text-xs font-black text-gray-900 focus:ring-0"
                        />
                        <span className="text-[9px] text-gray-400 font-bold ml-0.5">hộp</span>
                      </div>
                      <button onClick={handleAddQuantity} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors">
                        <Plus size={12} strokeWidth={4} />
                      </button>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={handleAddToCart}
                        className={`p-2.5 rounded-lg border transition-all ${isAdded ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-green-600"}`}
                      >
                        {isAdded ? <Check size={16} strokeWidth={3} /> : <ShoppingCart size={16} strokeWidth={2.5} />}
                      </button>
                      <button
                        onClick={handleBuyNow}
                        className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-green-700 active:scale-95 transition-all shadow-sm"
                      >
                        Mua
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showQuickView && (
        <ProductQuickView
          product={product}
          onClose={() => setShowQuickView(false)}
          outOfStockFruitNames={outOfStockFruitNames}
        />
      )}
    </>
  );
}
