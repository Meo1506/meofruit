"use client";
import { useCart } from "@/context/CartContext";
import { formatVND, getEffectivePrice, isOnSale } from "@/lib/price";
import Link from "next/link";

export default function CartSidebar() {
  const { cart, removeFromCart, updateQuantity, totalPrice, isCartOpen, setIsCartOpen } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl animate-slide-in-right">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 bg-green-600 text-white flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight">Giỏ hàng</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="text-6xl">🛒</div>
                  <p className="text-gray-500 font-medium">Giỏ hàng đang trống</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-green-600 font-bold hover:underline">
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {cart.map(item => (
                    <div key={item.cartKey} className="flex items-start gap-4">
                      <div className="h-18 w-18 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50" style={{ width: 72, height: 72 }}>
                        <img src={item.image_url || "/images/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{item.name}</h3>
                        <p className="mt-1 text-sm font-bold flex items-baseline gap-2">
                          <span className="text-red-600">{formatVND(getEffectivePrice(item))}</span>
                          {isOnSale(item) && (
                            <span className="text-[11px] font-bold text-gray-400 line-through">{formatVND(item.price)}</span>
                          )}
                        </p>
                        <div className="flex items-center mt-2 gap-3">
                          <div className="flex items-center border rounded-lg bg-gray-50">
                            <button
                              onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                              className="px-2 py-1 text-gray-500 hover:text-green-600"
                            >-</button>
                            <span className="px-2 text-xs font-bold text-gray-700">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                              className="px-2 py-1 text-gray-500 hover:text-green-600"
                            >+</button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.cartKey)}
                            className="text-xs text-gray-400 hover:text-red-500 underline"
                          >Xóa</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-6 space-y-4">
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <span>Tổng tiền:</span>
                  <span className="text-red-600 text-xl">{totalPrice.toLocaleString("vi-VN")}₫</span>
                </div>
                <p className="text-xs text-gray-400">Free ship bán kính 3km · Linh Xuân, Thủ Đức</p>
                <div className="space-y-2 pt-1">
                  <Link
                    href="/thanh-toan"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full flex items-center justify-center py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-lg shadow-green-100 uppercase tracking-widest text-sm transition-all"
                  >
                    Tiến hành thanh toán
                  </Link>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full text-center py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                  >
                    Tiếp tục mua hàng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
