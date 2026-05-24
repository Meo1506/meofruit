"use client";
import { useSiteSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ContactPage() {
  const settings = useSiteSettings();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", subject: "Hỏi về sản phẩm trái cây", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isSupabaseConfigured()) {
        const { error: err } = await supabase.from("contact_messages").insert([{
          name: form.name,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
          user_id: user?.id || null,
          status: "new",
        }]);
        if (err) throw err;
      } else {
        // Demo mode — giả lập thành công
        await new Promise(r => setTimeout(r, 800));
      }
      setSubmitted(true);
    } catch (e: any) {
      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("row-level security") || msg.includes("policy") || e?.code === "42501") {
        setError("Gửi bị chặn bởi RLS. Admin cần thêm INSERT policy cho bảng contact_messages.");
      } else if (msg.includes("does not exist") || msg.includes("relation")) {
        setError("Bảng contact_messages chưa được tạo trong DB. Xem _PENDING_MIGRATIONS.md.");
      } else {
        setError(e?.message || "Gửi tin nhắn thất bại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 uppercase tracking-tight">
            Liên Hệ <span className="text-green-600">Với Chúng Tôi</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy gửi tin nhắn hoặc gọi trực tiếp cho chúng tôi nếu bạn có bất kỳ thắc mắc nào.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-green-50 p-10 rounded-[3rem] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-100 rounded-full opacity-50"></div>
              
              <h2 className="text-2xl font-black text-gray-900 mb-8 relative z-10">Thông tin liên hệ</h2>
              
              <div className="space-y-8 relative z-10">
                <div className="flex items-start space-x-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Địa chỉ</p>
                    <p className="text-gray-600">{settings.contact.address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Hotline</p>
                    <a href={`tel:${settings.contact.phone}`} className="text-gray-600 text-lg font-bold hover:text-green-600">{settings.contact.phone}</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 01-2 2v10a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Email</p>
                    <a href={`mailto:${settings.contact.email}`} className="text-gray-600 hover:text-green-600">{settings.contact.email}</a>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-green-100 relative z-10">
                <p className="text-sm font-bold text-gray-900 mb-4 italic">Quý khách cần thanh toán đơn hàng gấp?</p>
                <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50">
                  <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">{settings.bankAccount.bank}</p>
                  <p className="text-lg font-black text-gray-900">{settings.bankAccount.number}</p>
                  <p className="text-xs text-gray-500">{settings.bankAccount.owner}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gửi tin nhắn thành công!</h3>
                <p className="text-gray-500 mb-8">Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi lại bạn sớm nhất có thể.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", phone: "", subject: "Hỏi về sản phẩm trái cây", message: "" }); }}
                  className="px-8 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-all"
                >
                  Gửi thêm tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-8">Gửi tin nhắn cho chúng tôi</h2>

                {error && (
                  <div className="mb-6 flex items-start p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
                    <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[10px]">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[10px]">Số điện thoại</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[10px]">Chủ đề</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-bold text-gray-700"
                  >
                    <option>Hỏi về sản phẩm trái cây</option>
                    <option>Phản ánh dịch vụ</option>
                    <option>Hợp tác kinh doanh</option>
                    <option>Khác</option>
                  </select>
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[10px]">Nội dung tin nhắn</label>
                  <textarea
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all resize-none font-bold"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-5 bg-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-100 uppercase tracking-widest transition-all ${isSubmitting ? 'opacity-70' : 'hover:bg-green-700 hover:-translate-y-1'}`}
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi tin nhắn ngay"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-20 max-w-6xl mx-auto h-[450px] bg-gray-100 rounded-[3rem] overflow-hidden shadow-inner flex items-center justify-center border-4 border-white shadow-xl relative group">
           <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000" />
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mb-4 animate-bounce shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full font-bold text-gray-900 shadow-xl border border-white">
                Cửa hàng: {settings.contact.address}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
