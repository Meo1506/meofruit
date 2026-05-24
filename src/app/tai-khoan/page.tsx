"use client";
import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Package, LogOut, ChevronRight, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured()) {
      router.push("/dang-nhap");
    }
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || ""
      });
    }
  }, [user, profile, loading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', user.id);
        
        if (error) throw error;
        await refreshProfile();
        alert("Cập nhật thông tin thành công!");
      } else {
        alert("Đã lưu (Chế độ Demo)");
      }
    } catch (err) {
      alert("Lỗi khi cập nhật hồ sơ");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white font-black text-gray-300 uppercase tracking-widest animate-pulse text-xs">Đang tải...</div>;

  // Final Profile data (Real or Demo)
  const displayProfile = isSupabaseConfigured() ? profile : {
    full_name: "Khách Hàng Demo",
    email: user?.email || "demo@gmail.com",
    phone: "0901234567",
    address: "123 Đường Trái Cây, TP. HCM"
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Sidebar Menu */}
          <div className="md:col-span-4 space-y-4">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
                   {displayProfile?.full_name?.charAt(0) || "U"}
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">{displayProfile?.full_name}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Thành viên</p>
             </div>

             <nav className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <Link href="/tai-khoan" className="flex items-center justify-between p-5 bg-green-50 text-green-600">
                    <div className="flex items-center space-x-3">
                      <User size={20} />
                      <span className="font-black text-xs uppercase tracking-wider">Hồ sơ của tôi</span>
                    </div>
                    <ChevronRight size={16} />
                </Link>
                <Link href="/tai-khoan/don-hang" className="flex items-center justify-between p-5 text-gray-600 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Package size={20} />
                    <span className="font-black text-xs uppercase tracking-wider">Đơn hàng</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
                <button 
                  onClick={() => { signOut(); router.push("/"); }}
                  className="w-full flex items-center space-x-3 p-5 text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50 font-black text-xs uppercase tracking-wider"
                >
                   <LogOut size={20} />
                   <span>Đăng xuất</span>
                </button>
             </nav>
          </div>

          {/* Main Profile Info */}
          <div className="md:col-span-8 space-y-6">
             <form onSubmit={handleUpdateProfile} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tighter">Thông tin cá nhân</h3>
                
                <div className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Họ và tên</label>
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                          required
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold text-gray-900 transition-all"
                        />
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Địa chỉ Email (Cố định)</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                          disabled
                          value={user?.email || "demo@gmail.com"}
                          className="w-full pl-14 pr-5 py-4 bg-gray-100 border-none rounded-2xl text-gray-400 font-bold cursor-not-allowed"
                        />
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Số điện thoại</label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold text-gray-900 transition-all"
                        />
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Địa chỉ giao hàng</label>
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold text-gray-900 transition-all"
                        />
                      </div>
                   </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="mt-10 w-full md:w-auto px-10 py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center"
                >
                   {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                   Lưu tất cả thay đổi
                </button>
             </form>
          </div>

        </div>
      </div>
    </div>
  );
}
