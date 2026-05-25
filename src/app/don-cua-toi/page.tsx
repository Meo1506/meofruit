"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package, Clock, CheckCircle, Truck, XCircle, CreditCard,
  ShoppingBag, Loader2, AlertTriangle, RefreshCw, Search, Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getGuestOrders, type GuestOrderEntry } from "@/lib/guestOrders";

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

const LAST_SEEN_KEY = "fw_last_seen_status";

function readLastSeen(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LAST_SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function writeLastSeen(map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

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

function NewUpdateBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 animate-pulse">
      <Sparkles size={10} />
      Có cập nhật mới
    </span>
  );
}

function groupByEmail(entries: GuestOrderEntry[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const e of entries) {
    const key = e.email.toLowerCase();
    const list = map.get(key) || [];
    list.push(e.order_code);
    map.set(key, list);
  }
  return map;
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});

  const guestEntries = useMemo<GuestOrderEntry[]>(
    () => (user ? [] : getGuestOrders()),
    [user]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        setOrders([]);
        return;
      }

      if (user) {
        const { data, error: err } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (err) throw err;
        setOrders((data || []) as Order[]);
        return;
      }

      const grouped = groupByEmail(guestEntries);
      if (grouped.size === 0) {
        setOrders([]);
        return;
      }

      const results: Order[] = [];
      for (const [email, codes] of grouped.entries()) {
        const { data, error: err } = await supabase.rpc("lookup_orders_public", {
          p_codes: codes,
          p_email: email,
        });
        if (err) {
          console.error("lookup_orders_public failed", err);
          continue;
        }
        if (Array.isArray(data)) {
          results.push(...(data as Order[]));
        }
      }

      results.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setOrders(results);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không tải được đơn hàng.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, guestEntries]);

  useEffect(() => {
    if (authLoading) return;
    setLastSeen(readLastSeen());
    fetchOrders();
  }, [authLoading, fetchOrders]);

  useEffect(() => {
    if (loading || orders.length === 0) return;
    const next: Record<string, string> = { ...readLastSeen() };
    let changed = false;
    for (const o of orders) {
      if (!o.order_code) continue;
      if (next[o.order_code] !== o.status) {
        next[o.order_code] = o.status;
        changed = true;
      }
    }
    if (changed) writeLastSeen(next);
  }, [orders, loading]);

  const hasUpdate = useCallback(
    (o: Order): boolean => {
      const seen = lastSeen[o.order_code];
      if (seen === undefined) return false;
      return seen !== o.status;
    },
    [lastSeen]
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <ShoppingBag size={28} className="text-green-600" />
              Đơn của tôi
            </h1>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">
              {user ? "Lịch sử mua hàng của tài khoản" : "Đơn đã đặt trên thiết bị này"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tra-cuu-don"
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 text-xs font-black rounded-full uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all"
            >
              <Search size={14} /> Tra cứu bằng mã đơn
            </Link>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all disabled:opacity-50"
              title="Tải lại"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {!user && guestEntries.length > 0 && (
          <div className="mb-6 flex items-start p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700">
            <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-bold leading-relaxed">
              Bạn đang xem ở chế độ khách. Đăng nhập bằng email đã dùng để đặt đơn — lịch sử guest sẽ tự gộp vào tài khoản.
            </p>
          </div>
        )}

        {!isSupabaseConfigured() && (
          <div className="mb-6 flex items-start p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-700">
            <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-bold leading-relaxed">
              Demo mode: chưa kết nối Supabase. Sau khi cấu hình env + chạy SQL schema, đơn hàng thật của bạn sẽ hiện ở đây.
            </p>
          </div>
        )}

        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p className="text-sm font-bold uppercase tracking-widest">Đang tải đơn hàng...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle size={28} />
              </div>
              <p className="text-red-600 font-bold">{error}</p>
              <button
                onClick={fetchOrders}
                className="px-6 py-2 bg-gray-900 text-white text-xs font-black rounded-full uppercase tracking-widest"
              >
                Thử lại
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="text-5xl">📦</div>
              <p className="text-gray-400 font-bold">
                {user
                  ? "Tài khoản của bạn chưa có đơn nào"
                  : "Thiết bị này chưa có đơn guest nào"}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/san-pham"
                  className="inline-block px-8 py-3 bg-green-600 text-white font-black rounded-full text-xs uppercase tracking-widest"
                >
                  Mua sắm ngay
                </Link>
                <Link
                  href="/tra-cuu-don"
                  className="inline-block px-8 py-3 bg-white border border-gray-200 text-gray-700 font-black rounded-full text-xs uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all"
                >
                  Tra cứu bằng mã đơn
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-green-200 transition-all"
                >
                  <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Mã đơn hàng
                      </p>
                      <p className="font-black text-gray-900 font-mono text-sm">
                        {order.order_code || `#${order.id.slice(0, 8)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasUpdate(order) && <NewUpdateBadge />}
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-gray-200/50 gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">
                        Ngày đặt: {formatDate(order.created_at)}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        {Array.isArray(order.items) ? order.items.length : 0} sản phẩm
                        {" • "}
                        {order.payment_method === "cod" ? "COD" : "Chuyển khoản"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Tổng
                      </p>
                      <p className="text-lg font-black text-red-600">{formatVND(order.total_price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
