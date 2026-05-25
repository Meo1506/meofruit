"use client";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SettingsContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import CopyableText from "@/components/CopyableText";
import OrderSuccessModal from "@/components/OrderSuccessModal";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getOrCreateGuestToken } from "@/lib/guestToken";
import { addGuestOrder } from "@/lib/guestOrders";
import { generateOrderCode } from "@/lib/orderCode";
import { Loader2, AlertTriangle } from "lucide-react";
import { getEffectivePrice } from "@/lib/price";

export default function CheckoutPage() {
  const { cart, totalPrice, totalItems, clearCart } = useCart();
  const { user, profile } = useAuth();
  const settings = useSiteSettings();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    paymentMethod: "transfer"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successItems, setSuccessItems] = useState<{ name: string; quantity: number; price: number }[]>([]);
  const [successTotal, setSuccessTotal] = useState(0);
  const [successOrderCode, setSuccessOrderCode] = useState<string | null>(null);

  // Auto-fill form if user is logged in
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.full_name || prev.name,
        phone: profile.phone || prev.phone,
        address: profile.address || prev.address
      }));
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const customerEmail = (user?.email || formData.email || "").trim();
    if (!user && !customerEmail) {
      setSubmitError("Vui lòng nhập email để có thể tra cứu đơn hàng sau này.");
      setIsSubmitting(false);
      return;
    }

    const orderCode = generateOrderCode();
    const createdAt = new Date().toISOString();

    const orderData = {
      order_code: orderCode,
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_email: customerEmail,
      customer_address: formData.address,
      customer_note: formData.note,
      total_price: totalPrice,
      payment_method: formData.paymentMethod,
      items: cart.map(item => ({
        name: item.name,
        price: getEffectivePrice(item),
        quantity: item.quantity,
        image_url: item.image_url
      })),
      user_id: user?.id || null,
      guest_token: user ? null : getOrCreateGuestToken(),
      status: 'new'
    };

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('orders').insert([orderData]);
        if (error) {
          // Phân loại lỗi để hiện thông báo có ích
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("row-level security") || msg.includes("policy") || error.code === "42501") {
            throw new Error(
              "Đặt hàng bị chặn bởi Row-Level Security. " +
              "Admin cần thêm INSERT policy cho bảng orders trong Supabase. " +
              "(Chi tiết: " + error.message + ")"
            );
          }
          throw new Error(error.message || "Lưu đơn thất bại");
        }
      }

      // Guest: ghi vào cookie để /don-cua-toi và /tra-cuu-don nhớ được
      if (!user && customerEmail) {
        addGuestOrder({
          order_code: orderCode,
          email: customerEmail,
          created_at: createdAt,
        });
      }

      setSuccessItems(cart.map(item => ({ name: item.name, quantity: item.quantity, price: getEffectivePrice(item) })));
      setSuccessTotal(totalPrice);
      setSuccessOrderCode(orderCode);
      clearCart();
      setIsSuccess(true);
    } catch (err: any) {
      setSubmitError(err?.message || "Đặt hàng thất bại. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !isSubmitting && !isSuccess) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center">
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Giỏ hàng đang trống</h2>
        <Link href="/san-pham" className="px-8 py-3 bg-green-600 text-white font-black rounded-full hover:bg-green-700 transition-all text-xs uppercase tracking-widest">
          Quay lại mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
           <div>
             <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Thanh toán</h1>
             <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">Vui lòng kiểm tra thông tin nhận hàng</p>
           </div>
           {!user && (
             <Link href="/dang-nhap" className="text-xs font-black text-green-600 uppercase hover:underline">Đã có tài khoản? Đăng nhập để tự điền thông tin &rarr;</Link>
           )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-gray-900">
          {/* Left: Customer Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center uppercase tracking-tight">
                <span className="w-8 h-8 bg-green-600 text-white rounded-xl flex items-center justify-center mr-4 text-xs">1</span>
                Thông tin nhận hàng
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Họ và tên</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-bold"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Số điện thoại</label>
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                      Địa chỉ Email
                      {!user && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="email"
                      name="email"
                      required={!user}
                      placeholder={user ? "" : "Để tra cứu đơn sau này"}
                      value={user?.email || formData.email}
                      readOnly={!!user}
                      onChange={user ? undefined : handleInputChange}
                      className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-bold ${user ? 'text-gray-400 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Địa chỉ giao hàng</label>
                  <input 
                    type="text" 
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Ghi chú thêm</label>
                  <textarea 
                    name="note"
                    rows={3}
                    value={formData.note}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all resize-none font-bold"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center uppercase tracking-tight">
                <span className="w-8 h-8 bg-green-600 text-white rounded-xl flex items-center justify-center mr-4 text-xs">2</span>
                Phương thức thanh toán
              </h2>
              <div className="space-y-4">
                <label className={`flex items-center p-6 rounded-3xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'transfer' ? 'border-green-600 bg-green-50' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="transfer" 
                    checked={formData.paymentMethod === 'transfer'}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-600 focus:ring-green-500"
                  />
                  <div className="ml-5">
                    <p className="font-black text-gray-900 uppercase text-xs tracking-wider">Chuyển khoản ngân hàng</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">Thanh toán qua mã QR hoặc số tài khoản</p>
                  </div>
                </label>
                <label className={`flex items-center p-6 rounded-3xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'momo' ? 'border-pink-500 bg-pink-50' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={formData.paymentMethod === 'momo'}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-pink-500 focus:ring-pink-500"
                  />
                  <div className="ml-5">
                    <p className="font-black text-gray-900 uppercase text-xs tracking-wider">Chuyển khoản qua MoMo</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">Quét QR hoặc chuyển đến số MoMo của shop</p>
                  </div>
                </label>
                <label className={`flex items-center p-6 rounded-3xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-green-600 bg-green-50' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-600 focus:ring-green-500"
                  />
                  <div className="ml-5">
                    <p className="font-black text-gray-900 uppercase text-xs tracking-wider">Thanh toán khi nhận hàng (COD)</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">Kiểm tra hàng trước khi thanh toán</p>
                  </div>
                </label>
              </div>

              {formData.paymentMethod === 'transfer' && (
                <div className="mt-8 p-6 sm:p-8 bg-white border-2 border-dashed border-green-200 rounded-[2rem]">
                  <p className="text-[9px] text-green-600 font-black uppercase tracking-[0.2em] mb-6 text-center">Quét QR hoặc chuyển khoản thủ công</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[260px] aspect-square bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <img
                          src={`https://img.vietqr.io/image/TCB-${settings.bankAccount.number}-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(formData.phone || "Thanh toan don hang")}&accountName=${encodeURIComponent(settings.bankAccount.owner)}`}
                          alt="QR chuyển khoản Techcombank"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 text-center md:text-left">
                      <CopyableText text={settings.bankAccount.owner} label="Chủ tài khoản" className="text-sm font-black text-gray-900 justify-center md:justify-start" />
                      <CopyableText text={settings.bankAccount.number} label="Số tài khoản" className="text-2xl sm:text-3xl font-black text-green-600 justify-center md:justify-start tracking-tighter" />
                      <p className="font-black text-gray-700 text-xs uppercase tracking-widest">{settings.bankAccount.bank}</p>
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Nội dung: <span className="text-gray-900">{formData.phone || "SĐT CỦA BẠN"}</span></p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Số tiền: <span className="text-red-600">{totalPrice.toLocaleString('vi-VN')}₫</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.paymentMethod === 'momo' && (
                <div className="mt-8 p-6 sm:p-8 bg-white border-2 border-dashed border-pink-200 rounded-[2rem]">
                  <p className="text-[9px] text-pink-600 font-black uppercase tracking-[0.2em] mb-6 text-center">Quét QR hoặc chuyển MoMo đến số dưới</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[260px] aspect-square bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center p-4">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=8&data=${encodeURIComponent(`https://nhantien.momo.vn/${settings.contact.phone}`)}`}
                          alt="QR MoMo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 text-center md:text-left">
                      <CopyableText text={settings.bankAccount.owner} label="Chủ tài khoản" className="text-sm font-black text-gray-900 justify-center md:justify-start" />
                      <CopyableText text={settings.contact.phone} label="Số MoMo" className="text-2xl sm:text-3xl font-black text-pink-600 justify-center md:justify-start tracking-tighter" />
                      <p className="font-black text-gray-700 text-xs uppercase tracking-widest">Ví MoMo</p>
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Nội dung: <span className="text-gray-900">{formData.phone || "SĐT CỦA BẠN"}</span></p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Số tiền: <span className="text-red-600">{totalPrice.toLocaleString('vi-VN')}₫</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 sticky top-32">
              <h2 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tight">Đơn hàng ({totalItems})</h2>
              
              <div className="max-h-[300px] overflow-y-auto pr-3 space-y-5 mb-8 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                        <img src={item.image_url || "/images/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900 line-clamp-1 uppercase tracking-tight">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">SL: {item.quantity} hộp</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-gray-900">{(getEffectivePrice(item) * item.quantity).toLocaleString('vi-VN')}₫</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-gray-100">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Tạm tính</span>
                  <span className="text-gray-900">{totalPrice.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Phí ship (bán kính 3km)</span>
                  <span className="text-green-600">MIỄN PHÍ</span>
                </div>
                <div className="flex justify-between items-end pt-6">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">Tổng cộng</span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-red-600 leading-none tracking-tighter">{totalPrice.toLocaleString('vi-VN')}₫</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">Giá đã bao gồm VAT</p>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="mt-6 flex items-start p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
                  <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-6 py-5 bg-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-100 uppercase tracking-widest text-xs transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700 hover:-translate-y-1'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-3" size={20} />
                    Đang xử lý...
                  </span>
                ) : "Xác nhận đặt hàng"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {isSuccess && (
        <OrderSuccessModal
          customerName={formData.name}
          totalPrice={successTotal}
          items={successItems}
          isLoggedIn={!!user}
          orderCode={successOrderCode}
        />
      )}
    </div>
  );
}
