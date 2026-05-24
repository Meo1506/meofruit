"use client";
import { useState, useEffect } from "react";
import {
  Package, Clock, CheckCircle, Truck, XCircle, CreditCard,
  ChevronRight, ShoppingBag, User, Eye, X, Loader2,
  Phone, MapPin, StickyNote, AlertTriangle, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_note?: string | null;
  total_price: number;
  status: string;
  payment_method: string;
  items: OrderItem[];
  created_at: string;
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  new:       { label: "Đơn mới",       color: "bg-blue-50 text-blue-600",        icon: Clock },
  confirmed: { label: "Đã xác nhận",   color: "bg-purple-50 text-purple-600",    icon: CheckCircle },
  shipping:  { label: "Đang giao",     color: "bg-orange-50 text-orange-600",    icon: Truck },
  delivered: { label: "Đã giao đến",   color: "bg-green-50 text-green-600",      icon: CheckCircle },
  paid:      { label: "Đã thanh toán", color: "bg-teal-50 text-teal-600",        icon: CreditCard },
  cancelled: { label: "Đã hủy",        color: "bg-red-50 text-red-600",          icon: XCircle },
};

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

function formatVND(n: number) {
  return (n ?? 0).toLocaleString("vi-VN") + "₫";
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function OrderHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (authLoading) return;
    // Real mode: bắt buộc login
    if (isSupabaseConfigured() && !user) {
      router.push("/dang-nhap");
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode — không có DB, list rỗng
        setOrders([]);
        return;
      }
      if (!user) return;

      const { data, error: err } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (err) throw err;
      setOrders((data || []) as Order[]);
    } catch (e: any) {
      setError(e?.message || "Không tải được danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-4 space-y-4">
            <nav className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <Link href="/tai-khoan" className="flex items-center justify-between p-5 text-gray-600 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <User size={20} />
                  <span className="font-bold text-sm">Hồ sơ của tôi</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
              <Link href="/tai-khoan/don-hang" className="flex items-center justify-between p-5 bg-green-50 text-green-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <Package size={20} />
                  <span className="font-bold text-sm">Đơn hàng của tôi</span>
                </div>
                <ChevronRight size={16} className="text-green-600" />
              </Link>
            </nav>
          </div>

          {/* Order List */}
          <div className="md:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center">
                  <ShoppingBag size={24} className="mr-2 text-green-600" />
                  Lịch sử mua hàng
                </h3>
                {!loading && (
                  <button
                    onClick={fetchOrders}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                    title="Tải lại"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
              </div>

              {/* Demo mode notice */}
              {!isSupabaseConfigured() && (
                <div className="mb-6 flex items-start p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-700">
                  <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">
                    Demo mode: chưa kết nối Supabase. Sau khi cấu hình env + chạy SQL schema, đơn hàng thật của bạn sẽ hiện ở đây.
                  </p>
                </div>
              )}

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
                  <button onClick={fetchOrders} className="px-6 py-2 bg-gray-900 text-white text-xs font-black rounded-full uppercase tracking-widest">
                    Thử lại
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="text-5xl">📦</div>
                  <p className="text-gray-400 font-bold">Bạn chưa có đơn hàng nào</p>
                  <Link href="/san-pham" className="inline-block px-8 py-3 bg-green-600 text-white font-black rounded-full text-xs uppercase tracking-widest">
                    Mua sắm ngay
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-green-200 transition-all">
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mã đơn hàng</p>
                          <p className="font-black text-gray-900 font-mono text-sm truncate">#{order.id.slice(0, 8)}</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="flex justify-between items-end pt-4 border-t border-gray-200/50 gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs text-gray-500 font-medium">Ngày đặt: {formatDate(order.created_at)}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            Số lượng: {Array.isArray(order.items) ? order.items.length : 0} sản phẩm
                            {" • "}
                            {order.payment_method === "cod" ? "COD" : "Chuyển khoản"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng</p>
                          <p className="text-lg font-black text-red-600">{formatVND(order.total_price)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full mt-6 py-3 bg-white text-gray-900 font-bold text-xs rounded-xl border border-gray-200 hover:bg-gray-900 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center"
                      >
                        <Eye size={14} className="mr-2" />
                        Xem chi tiết đơn hàng
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 rounded-t-3xl">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Chi tiết đơn hàng</p>
                <p className="font-black text-gray-900 font-mono text-sm truncate">#{selectedOrder.id}</p>
                <div className="mt-3"><StatusBadge status={selectedOrder.status} /></div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Items */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Sản phẩm</p>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                          <img src={item.image_url || "/images/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold">SL: {item.quantity} × {formatVND(item.price)}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-gray-900 flex-shrink-0">{formatVND(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact / Address */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-start text-sm">
                  <User size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Người nhận</p>
                    <p className="font-bold text-gray-900">{selectedOrder.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-start text-sm">
                  <Phone size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Điện thoại</p>
                    <a href={`tel:${selectedOrder.customer_phone}`} className="font-bold text-gray-900 hover:text-green-600">{selectedOrder.customer_phone}</a>
                  </div>
                </div>
                <div className="flex items-start text-sm">
                  <MapPin size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Địa chỉ</p>
                    <p className="font-bold text-gray-900">{selectedOrder.customer_address}</p>
                  </div>
                </div>
                {selectedOrder.customer_note && (
                  <div className="flex items-start text-sm">
                    <StickyNote size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Ghi chú</p>
                      <p className="text-gray-700">{selectedOrder.customer_note}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start text-sm">
                  <CreditCard size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Thanh toán</p>
                    <p className="font-bold text-gray-900">{selectedOrder.payment_method === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản ngân hàng"}</p>
                  </div>
                </div>
                <div className="flex items-start text-sm">
                  <Clock size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Đặt lúc</p>
                    <p className="text-gray-700">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer total */}
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Tổng cộng</span>
              <span className="text-2xl font-black text-red-600">{formatVND(selectedOrder.total_price)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
