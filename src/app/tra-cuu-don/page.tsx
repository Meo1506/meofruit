"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search, Loader2, AlertTriangle, Package, Clock, CheckCircle,
  Truck, XCircle, CreditCard, Phone, MapPin, User as UserIcon, StickyNote,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { addGuestOrder } from "@/lib/guestOrders";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_address: string;
  customer_note?: string | null;
  total_price: number;
  status: string;
  payment_method: string;
  items: OrderItem[];
  created_at: string;
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  new:        { label: "Đơn mới",       color: "bg-blue-50 text-blue-600",     icon: Clock },
  pending:    { label: "Chờ xác nhận",  color: "bg-blue-50 text-blue-600",     icon: Clock },
  confirmed:  { label: "Đã xác nhận",   color: "bg-purple-50 text-purple-600", icon: CheckCircle },
  shipping:   { label: "Đang giao",     color: "bg-orange-50 text-orange-600", icon: Truck },
  delivered:  { label: "Đã giao",       color: "bg-green-50 text-green-600",   icon: CheckCircle },
  paid:       { label: "Đã thanh toán", color: "bg-teal-50 text-teal-600",     icon: CreditCard },
  cancelled:  { label: "Đã hủy",        color: "bg-red-50 text-red-600",       icon: XCircle },
};

function formatVND(n: number): string {
  return (n ?? 0).toLocaleString("vi-VN") + "₫";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, color: "bg-gray-100 text-gray-500", icon: Package };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${meta.color}`}>
      <Icon size={12} className="mr-1.5" />
      {meta.label}
    </span>
  );
}

export default function TrackOrderPage() {
  const [orderCode, setOrderCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setNotFound(false);

    const code = orderCode.trim().toUpperCase();
    const emailTrim = email.trim();
    if (!code || !emailTrim) {
      setError("Vui lòng nhập đầy đủ mã đơn và email.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Hệ thống chưa kết nối Supabase. Liên hệ shop để tra cứu.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc("lookup_orders_public", {
        p_codes: [code],
        p_email: emailTrim,
      });
      if (rpcErr) throw rpcErr;

      const rows = Array.isArray(data) ? (data as Order[]) : [];
      if (rows.length === 0) {
        setNotFound(true);
        return;
      }

      const order = rows[0];
      setResult(order);

      addGuestOrder({
        order_code: order.order_code,
        email: emailTrim,
        created_at: order.created_at,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tra cứu thất bại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center justify-center gap-3">
            <Search size={28} className="text-green-600" />
            Tra cứu đơn hàng
          </h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2">
            Nhập mã đơn và email để xem trạng thái
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6"
        >
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
              Mã đơn hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="VD: FW-AB12-CD34"
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-mono font-bold uppercase tracking-wider"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
              Email đã dùng khi đặt đơn <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-bold"
            />
            <p className="text-[10px] text-gray-400 font-medium mt-2 ml-1">
              Mã đơn không lộ thông tin nếu thiếu email khớp.
            </p>
          </div>

          {error && (
            <div className="flex items-start p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
              <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 bg-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-100 uppercase tracking-widest text-xs transition-all ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700 hover:-translate-y-1"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-3" size={20} />
                Đang tra cứu...
              </span>
            ) : (
              "Tra cứu trạng thái"
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/don-cua-toi"
              className="text-xs font-black text-green-600 uppercase hover:underline"
            >
              ← Quay lại danh sách đơn của tôi
            </Link>
          </div>
        </form>

        {notFound && (
          <div className="mt-6 p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={28} />
            </div>
            <p className="font-black text-gray-900 mb-2">Không tìm thấy đơn nào</p>
            <p className="text-sm text-gray-500">
              Kiểm tra lại mã đơn và email đã nhập. Hai trường phải khớp đúng với lúc đặt hàng.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-6 p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6 gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                  Mã đơn
                </p>
                <p className="font-black text-gray-900 font-mono text-lg">{result.order_code}</p>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <div className="space-y-3 pb-6 border-b border-gray-100">
              {(result.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full text-[10px] font-black flex items-center justify-center">
                      {item.quantity}
                    </span>
                    <span className="text-sm text-gray-700 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                    {formatVND(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 py-6 border-b border-gray-100 text-sm">
              <div className="flex items-start">
                <UserIcon size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <p className="font-bold text-gray-900">{result.customer_name}</p>
              </div>
              <div className="flex items-start">
                <Phone size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <a href={`tel:${result.customer_phone}`} className="font-bold text-gray-900 hover:text-green-600">
                  {result.customer_phone}
                </a>
              </div>
              <div className="flex items-start">
                <MapPin size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <p className="font-bold text-gray-900">{result.customer_address}</p>
              </div>
              {result.customer_note && (
                <div className="flex items-start">
                  <StickyNote size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-700">{result.customer_note}</p>
                </div>
              )}
              <div className="flex items-start">
                <Clock size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <p className="text-gray-700">{formatDate(result.created_at)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6">
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Tổng cộng</span>
              <span className="text-2xl font-black text-red-600">{formatVND(result.total_price)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
