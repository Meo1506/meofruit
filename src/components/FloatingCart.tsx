"use client";
import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";

export default function FloatingCart() {
  const { totalItems, totalPrice, setIsCartOpen } = useCart();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="fixed bottom-6 right-4 sm:right-6 z-[90] flex items-center gap-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl px-4 py-3 shadow-2xl shadow-green-900/30 transition-all duration-200"
      aria-label="Mở giỏ hàng"
    >
      <div className="relative">
        <ShoppingCart size={20} strokeWidth={2.5} />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] font-bold uppercase tracking-widest text-green-200">Giỏ hàng</span>
        <span className="text-sm font-black tracking-tight">
          {totalPrice.toLocaleString("vi-VN")}₫
        </span>
      </div>
    </button>
  );
}
