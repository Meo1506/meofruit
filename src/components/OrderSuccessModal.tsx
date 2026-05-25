"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Home, Package } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Props {
  customerName: string;
  totalPrice: number;
  items: OrderItem[];
  isLoggedIn: boolean;
  orderCode?: string | null;
}

/* Confetti piece — random position & colour via inline style */
function ConfettiPiece({ index }: { index: number }) {
  const colors = ["#22c55e", "#86efac", "#bbf7d0", "#fbbf24", "#fb923c", "#f9a8d4", "#a5f3fc"];
  const color = colors[index % colors.length];
  const left   = `${(index * 37 + 5) % 95}%`;
  const delay  = `${(index * 0.13) % 1.4}s`;
  const size   = index % 2 === 0 ? 8 : 6;
  const shape  = index % 3 === 0 ? "rounded-full" : index % 3 === 1 ? "rounded-sm rotate-45" : "rounded-none rotate-12";

  return (
    <div
      className={`absolute top-0 ${shape} animate-confetti-fall pointer-events-none`}
      style={{
        left,
        width: size,
        height: size,
        backgroundColor: color,
        animationDelay: delay,
        animationDuration: `${1.8 + (index % 5) * 0.25}s`,
      }}
    />
  );
}

export default function OrderSuccessModal({ customerName, totalPrice, items, isLoggedIn, orderCode }: Props) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    // slight delay so animation triggers after mount
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [visible, countdown]);

  const firstName = customerName?.split(" ").pop() || "bạn";

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/95 via-green-800/95 to-emerald-900/95 backdrop-blur-md" />

      {/* Confetti layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 28 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      {/* Card */}
      <div
        className={`relative z-10 bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transition-all duration-500 ${
          visible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
        }`}
      >
        {/* Green top bar */}
        <div className="bg-green-600 px-6 py-8 text-center relative overflow-hidden">
          {/* Glow ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 rounded-full bg-white/10 animate-ping-slow" />
          </div>

          {/* Check icon */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-xl mb-4 animate-pop-in">
            <CheckCircle2 size={44} className="text-green-600" strokeWidth={2} />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Cảm ơn {firstName}! 🎉
          </h2>
          <p className="text-green-200 text-sm font-medium mt-1">
            Đơn hàng của bạn đã được ghi nhận
          </p>
        </div>

        {/* Order summary */}
        <div className="px-6 py-5 space-y-4">
          {/* Order code (quan trọng nhất cho guest) */}
          {orderCode && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-dashed border-green-300 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-1">
                Mã đơn hàng của bạn
              </p>
              <p className="text-2xl font-black text-green-700 font-mono tracking-tight">
                {orderCode}
              </p>
              {!isLoggedIn && (
                <p className="text-[11px] text-gray-600 font-medium mt-2 leading-relaxed">
                  Lưu lại mã này để tra cứu trạng thái đơn tại{" "}
                  <Link href="/tra-cuu-don" className="text-green-700 font-bold underline">
                    /tra-cuu-don
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Items */}
          <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-700 rounded-full text-[9px] font-black flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <span className="text-gray-700 font-medium truncate">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 flex-shrink-0 ml-2">
                  {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Tổng cộng</span>
            <span className="text-xl font-black text-green-600">
              {totalPrice.toLocaleString("vi-VN")}₫
            </span>
          </div>

          {/* Note */}
          <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
            <span className="text-xl flex-shrink-0 mt-0.5">📞</span>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Shop đã nhận được đơn hàng và sẽ nhanh chóng xử lý để giao tận nơi cho bạn. Cảm ơn bạn đã tin tưởng! 🚀
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
            >
              <Home size={14} /> Trang chủ
            </Link>
            <Link
              href="/don-cua-toi"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 text-xs uppercase tracking-widest"
            >
              <Package size={14} /> Đơn của tôi
            </Link>
          </div>

          {/* Auto-redirect hint */}
          {countdown > 0 && (
            <p className="text-center text-[10px] text-gray-400 font-medium">
              Tự chuyển về trang chủ sau{" "}
              <span className="font-black text-green-600">{countdown}s</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
