"use client";
import AdminLayout from "@/components/AdminLayout";
import { Search, Eye, CheckCircle, Clock, Truck, XCircle, CreditCard, Loader2, X, User, Phone, MapPin, StickyNote } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const formatVND = (n: number) => (n ?? 0).toLocaleString("vi-VN") + "₫";
const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // States for bulk order actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  async function handleBulkUpdateStatus(newStatus: string) {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn cập nhật trạng thái của ${selectedOrderIds.length} đơn hàng thành "${
      newStatus === 'new' ? 'Đơn mới' :
      newStatus === 'confirmed' ? 'Đã xác nhận' :
      newStatus === 'shipping' ? 'Đang giao' :
      newStatus === 'delivered' ? 'Đã giao đến' :
      newStatus === 'paid' ? 'Đã thanh toán' : 'Đã hủy'
    }"?`)) return;
    setIsBulkUpdating(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .in('id', selectedOrderIds);
        if (error) throw error;

        // Insert notifications for each of the updated orders in parallel
        const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
        await Promise.all(selectedOrders.map(order => insertNotification(order, newStatus)));

        alert(`Đã cập nhật trạng thái cho ${selectedOrderIds.length} đơn hàng thành công!`);
        fetchOrders();
      } else {
        setOrders(orders.map(o => selectedOrderIds.includes(o.id) ? { ...o, status: newStatus } : o));
        alert(`Đã cập nhật trạng thái cho ${selectedOrderIds.length} đơn hàng (Chế độ Demo)`);
      }
      setSelectedOrderIds([]);
    } catch (err: any) {
      alert("Lỗi khi cập nhật trạng thái hàng loạt: " + (err?.message || err));
    } finally {
      setIsBulkUpdating(false);
    }
  }

  useEffect(() => {
    fetchOrders();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("realtime-admin-orders")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
      } else {
        setOrders([]); 
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function insertNotification(order: any, status: string) {
    const configs: Record<string, { title: string; message: string }> = {
      confirmed: { title: "Đơn hàng đã xác nhận! 🎉", message: "Đơn hàng của bạn đã được shop xác nhận và đang chuẩn bị." },
      shipping:  { title: "Đơn hàng đang giao! 🚚",   message: `Đơn hàng đang trên đường đến: ${order.customer_address}` },
      delivered: { title: "Đã giao thành công! ✅",    message: "Đơn hàng đã được giao thành công. Cảm ơn bạn đã tin tưởng shop!" },
      cancelled: { title: "Đơn hàng đã bị hủy ❌",    message: "Đơn hàng của bạn đã bị hủy. Liên hệ shop nếu cần hỗ trợ." },
    };
    const config = configs[status];
    if (!config) return;
    await supabase.from("notifications").insert([{
      user_id: order.user_id || null,
      guest_token: order.guest_token || null,
      order_id: order.id,
      type: status,
      title: config.title,
      message: config.message,
      is_read: false,
    }]);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId);
        if (error) throw error;
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        const order = orders.find(o => o.id === orderId);
        if (order) await insertNotification(order, newStatus);
      } else {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        alert("Đã cập nhật (Chế độ Demo)");
      }
    } catch (error) {
      alert("Cập nhật trạng thái thất bại");
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new': return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-fit"><Clock size={12} className="mr-1"/> Đơn mới</span>;
      case 'confirmed': return <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-fit"><CheckCircle size={12} className="mr-1"/> Đã xác nhận</span>;
      case 'shipping': return <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-fit"><Truck size={12} className="mr-1"/> Đang giao</span>;
      case 'delivered': return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-fit"><CheckCircle size={12} className="mr-1"/> Đã giao đến</span>;
      case 'paid': return <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-fit"><CreditCard size={12} className="mr-1"/> Đã thanh toán</span>;
      case 'cancelled': return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-fit"><XCircle size={12} className="mr-1"/> Đã hủy</span>;
      default: return <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  const filteredOrders = orders.filter(o => 
    (o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || o.customer_phone.includes(searchTerm)) &&
    (filterStatus === "Tất cả" || (
        filterStatus === "Đơn mới" && o.status === "new" ||
        filterStatus === "Đang giao" && o.status === "shipping" ||
        filterStatus === "Đã thanh toán" && o.status === "paid"
    ))
  );

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Quản lý đơn hàng</h2>
          <div className="flex items-center">
             <span className={`w-2 h-2 rounded-full mr-2 ${isSupabaseConfigured() ? 'bg-green-500' : 'bg-orange-500'}`}></span>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                {isSupabaseConfigured() ? 'Dữ liệu thực' : 'Chế độ Demo'}
             </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm tên hoặc SĐT khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-medium"
              />
           </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
               {['Tất cả', 'Đơn mới', 'Đang giao', 'Đã thanh toán'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setFilterStatus(tab)}
                   className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterStatus === tab ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>
        </div>

        {selectedOrderIds.length > 0 && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in slide-in-from-top-4 duration-200 shadow-sm">
             <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-ping"></span>
                <span className="text-sm font-bold text-green-800">Đang chọn {selectedOrderIds.length} đơn hàng</span>
             </div>
             <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-gray-500 mr-1 uppercase">Cập nhật trạng thái:</span>
                <select
                  disabled={isBulkUpdating}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkUpdateStatus(e.target.value);
                      e.target.value = ""; // Reset
                    }
                  }}
                  className="bg-white border border-gray-200 px-3 py-2 rounded-xl font-bold text-xs focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value="">-- Chọn trạng thái --</option>
                  <option value="new">Đơn mới</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="shipping">Đang giao</option>
                  <option value="delivered">Đã giao đến</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all"
                >
                  Bỏ chọn
                </button>
             </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
           {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                 <Loader2 size={40} className="animate-spin mb-4" />
                 <p className="font-medium">Đang tải đơn hàng...</p>
              </div>
           ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                         <th className="w-10 px-6 py-4">
                            <input 
                              type="checkbox" 
                              checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrderIds(filteredOrders.map(o => o.id));
                                } else {
                                  setSelectedOrderIds([]);
                                }
                              }}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                         </th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Khách hàng</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Ngày đặt</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Tổng tiền</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Chi tiết</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                           <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                checked={selectedOrderIds.includes(order.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedOrderIds(prev => [...prev, order.id]);
                                  } else {
                                    setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                              />
                           </td>
                           <td className="px-6 py-4">
                              <div>
                                 <p className="font-black text-gray-900">{order.customer_name}</p>
                                 <p className="text-xs text-gray-400 font-bold">{order.customer_phone}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-gray-500 font-medium">
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
                           </td>
                           <td className="px-6 py-4 font-black text-red-600">
                              {order.total_price.toLocaleString('vi-VN')}₫
                           </td>
                           <td className="px-6 py-4">
                              <select 
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="bg-transparent border-none p-0 font-bold text-xs focus:ring-0 cursor-pointer text-gray-700"
                              >
                                <option value="new">Đơn mới</option>
                                <option value="confirmed">Đã xác nhận</option>
                                <option value="shipping">Đang giao</option>
                                <option value="delivered">Đã giao đến</option>
                                <option value="paid">Đã thanh toán</option>
                                <option value="cancelled">Đã hủy</option>
                              </select>
                              <div className="mt-1">{getStatusBadge(order.status)}</div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Xem chi tiết">
                                <Eye size={18} />
                              </button>
                           </td>
                        </tr>
                      )) : (
                        <tr>
                           <td colSpan={6} className="py-20 text-center text-gray-400 font-medium italic">
                              Chưa có đơn hàng nào.
                           </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
           )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 rounded-t-3xl">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Đơn hàng</p>
                <p className="font-black text-gray-900 font-mono text-sm truncate">#{selectedOrder.id}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedOrder.status}
                  onChange={(e) => {
                    updateOrderStatus(selectedOrder.id, e.target.value);
                    setSelectedOrder({ ...selectedOrder, status: e.target.value });
                  }}
                  className="bg-white border border-gray-200 px-3 py-2 rounded-xl font-bold text-xs focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value="new">Đơn mới</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="shipping">Đang giao</option>
                  <option value="delivered">Đã giao đến</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Sản phẩm ({selectedOrder.items?.length || 0})</p>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-2xl">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-white overflow-hidden flex-shrink-0 border border-gray-100">
                          <img src={item.image_url || "/images/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold">SL: {item.quantity} × {formatVND(item.price)}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-gray-900 flex-shrink-0">{formatVND(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-start text-sm">
                  <User size={14} className="mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Khách hàng</p>
                    <p className="font-bold text-gray-900">{selectedOrder.customer_name}</p>
                    {selectedOrder.user_id ? (
                      <p className="text-[10px] text-gray-400 font-mono">user: {selectedOrder.user_id.slice(0, 8)}...</p>
                    ) : (
                      <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Guest checkout</p>
                    )}
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Địa chỉ giao hàng</p>
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Phương thức thanh toán</p>
                    <p className="font-bold text-gray-900">{selectedOrder.payment_method === "cod" ? "Thanh toán khi nhận hàng (COD)" : selectedOrder.payment_method === "momo" ? "Chuyển khoản qua MoMo" : "Chuyển khoản ngân hàng"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Tổng tiền</span>
              <span className="text-2xl font-black text-red-600">{formatVND(selectedOrder.total_price)}</span>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
