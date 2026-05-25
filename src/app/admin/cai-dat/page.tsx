"use client";
import AdminLayout from "@/components/AdminLayout";
import { Save, Building2, Phone, MapPin, CreditCard, User, Share2, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSiteSettings } from "@/context/SettingsContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AdminSettings() {
  const router = useRouter();
  const initialSettings = useSiteSettings(); // đã được layout fetch sẵn từ DB
  const [config, setConfig] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const isValidUrl = (value: string) => {
    if (!value.trim()) return true;
    try {
      const u = new URL(value.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    const urlFields: Array<[string, string]> = [
      ["Facebook", config.social.facebook],
      ["Instagram", config.social.instagram],
      ["YouTube", config.social.youtube],
    ];
    const invalid = urlFields.find(([, v]) => !isValidUrl(v));
    if (invalid) {
      alert(`URL "${invalid[0]}" không hợp lệ. Phải bắt đầu bằng http:// hoặc https://`);
      return;
    }
    const zaloPhone = config.social.zalo.trim();
    if (zaloPhone && !/^\d{8,15}$/.test(zaloPhone)) {
      alert("Số Zalo không hợp lệ. Chỉ nhập số (8-15 chữ số), không có dấu cách hay ký tự khác.");
      return;
    }
    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({
            id: 1,
            web_name: config.webName,
            owner_name: config.ownerName,
            contact_phone: config.contact.phone,
            contact_zalo: config.contact.zalo,
            contact_email: config.contact.email,
            contact_address: config.contact.address,
            bank_number: config.bankAccount.number,
            bank_owner: config.bankAccount.owner,
            bank_name: config.bankAccount.bank,
            social_facebook: config.social.facebook,
            social_instagram: config.social.instagram,
            social_youtube: config.social.youtube,
            social_zalo: config.social.zalo,
            shipping_policy: config.shipping.policy,
            hero_images: config.heroImages,
            show_categories_section: config.showCategoriesSection,
          });
        if (error) throw error;
        alert("Đã lưu lên Supabase thành công!");
        // Re-render server layout để footer/navbar/policies hiện giá trị mới
        router.refresh();
      } else {
        alert("Đã lưu tạm thời (Chế độ Demo). Khi connect Supabase, các thay đổi sẽ áp lên toàn site.");
      }
    } catch (err: any) {
      alert("Lưu thất bại: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-8 pb-20">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Cài đặt hệ thống</h2>
          <div className="flex items-center mt-1">
             <span className={`w-2 h-2 rounded-full mr-2 ${isSupabaseConfigured() ? 'bg-green-500' : 'bg-orange-500'}`}></span>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                {isSupabaseConfigured() ? 'Dữ liệu thực từ Supabase' : 'Chế độ Demo'}
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* General Settings */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                 <Building2 size={20} className="mr-2 text-green-600" />
                 Thông tin cửa hàng
              </h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tên Website</label>
                    <input 
                       type="text" 
                       value={config.webName}
                       onChange={(e) => setConfig({...config, webName: e.target.value})}
                       className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Hotline hỗ trợ</label>
                    <input 
                       type="text" 
                       value={config.contact.phone}
                       onChange={(e) => setConfig({...config, contact: {...config.contact, phone: e.target.value}})}
                       className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Địa chỉ shop</label>
                    <input 
                       type="text" 
                       value={config.contact.address}
                       onChange={(e) => setConfig({...config, contact: {...config.contact, address: e.target.value}})}
                       className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold"
                    />
                 </div>
              </div>
           </div>

           {/* Social Media Settings */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                 <Share2 size={20} className="mr-2 text-green-600" />
                 Mạng xã hội
              </h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Link Facebook</label>
                    <input 
                       type="text" 
                       value={config.social.facebook}
                       onChange={(e) => setConfig({...config, social: {...config.social, facebook: e.target.value}})}
                       className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-medium"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Link Instagram</label>
                    <input 
                       type="text" 
                       value={config.social.instagram}
                       onChange={(e) => setConfig({...config, social: {...config.social, instagram: e.target.value}})}
                       className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-medium"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Link Youtube</label>
                    <input
                       type="url"
                       inputMode="url"
                       placeholder="https://youtube.com/..."
                       value={config.social.youtube}
                       onChange={(e) => setConfig({...config, social: {...config.social, youtube: e.target.value}})}
                       className={`w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 font-medium ${isValidUrl(config.social.youtube) ? 'focus:ring-green-500' : 'ring-2 ring-red-400'}`}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Số Zalo (SĐT)</label>
                    <input
                       type="tel"
                       inputMode="numeric"
                       placeholder="0916297232"
                       value={config.social.zalo}
                       onChange={(e) => setConfig({...config, social: {...config.social, zalo: e.target.value.replace(/\D/g, "")}})}
                       className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-medium"
                    />
                    <p className="text-[10px] font-bold text-gray-400 mt-1">Chỉ nhập số. FE sẽ tự build link zalo.me/&lt;số&gt; khi user bấm.</p>
                 </div>
              </div>
           </div>

           {/* Payment Settings */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                 <CreditCard size={20} className="mr-2 text-green-600" />
                 Tài khoản ngân hàng
              </h3>
              <div className="space-y-4">
                 <input 
                    type="text" 
                    placeholder="Số tài khoản"
                    value={config.bankAccount.number}
                    onChange={(e) => setConfig({...config, bankAccount: {...config.bankAccount, number: e.target.value}})}
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold"
                 />
                 <input 
                    type="text" 
                    placeholder="Chủ tài khoản"
                    value={config.bankAccount.owner}
                    onChange={(e) => setConfig({...config, bankAccount: {...config.bankAccount, owner: e.target.value}})}
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold uppercase"
                 />
                 <input 
                    type="text" 
                    placeholder="Ngân hàng"
                    value={config.bankAccount.bank}
                    onChange={(e) => setConfig({...config, bankAccount: {...config.bankAccount, bank: e.target.value}})}
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold"
                 />
              </div>
           </div>

           {/* Homepage Configuration Settings */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                 <span className="mr-2 text-green-600">🏠</span>
                 Cấu hình Trang chủ
              </h3>
              
              <div className="space-y-6">
                 {/* Category Show/Hide Toggle */}
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div>
                       <p className="font-bold text-sm text-gray-900">Hiển thị thẻ danh mục trang chủ</p>
                       <p className="text-xs text-gray-400 font-bold">Chỉ hiển thị khi có từ 2 danh mục trở lên trên storefront</p>
                    </div>
                    <button
                       type="button"
                       onClick={() => setConfig({...config, showCategoriesSection: !config.showCategoriesSection})}
                       className={`w-14 h-8 flex items-center rounded-full p-1 transition-all ${config.showCategoriesSection ? "bg-green-600 justify-end" : "bg-gray-300 justify-start"}`}
                    >
                       <span className="w-6 h-6 bg-white rounded-full shadow-md"></span>
                    </button>
                 </div>

                 {/* Slideshow Manager */}
                 <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Ảnh nền Banner đầu trang (Hero Slideshow)</label>
                    
                    {/* List of current slides */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                       {(config.heroImages || []).map((imgUrl, idx) => (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group">
                             <img src={imgUrl} className="w-full h-full object-cover" alt={`Slide ${idx + 1}`} />
                             <button
                                type="button"
                                onClick={() => {
                                   const updated = (config.heroImages || []).filter((_, i) => i !== idx);
                                   setConfig({...config, heroImages: updated});
                                }}
                                className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                             >
                                <X size={14} strokeWidth={3} />
                             </button>
                          </div>
                       ))}
                    </div>

                    {/* Add slide form */}
                    <div className="flex items-center space-x-2">
                       <input
                          type="text"
                          placeholder="Dán URL ảnh Unsplash mới tại đây..."
                          id="new-hero-image-url"
                          className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold text-xs"
                          onKeyDown={(e) => {
                             if (e.key === "Enter") {
                                e.preventDefault();
                                const input = e.currentTarget;
                                const url = input.value.trim();
                                if (url) {
                                   setConfig({...config, heroImages: [...(config.heroImages || []), url]});
                                   input.value = "";
                                 }
                             }
                          }}
                       />
                       <button
                          type="button"
                          onClick={() => {
                             const input = document.getElementById("new-hero-image-url") as HTMLInputElement;
                             const url = input?.value.trim();
                             if (url) {
                                setConfig({...config, heroImages: [...(config.heroImages || []), url]});
                                input.value = "";
                             }
                          }}
                          className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xs uppercase tracking-widest"
                       >
                          Thêm ảnh
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex justify-end">
           <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-10 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black shadow-xl transition-all uppercase tracking-widest text-sm"
           >
              {isSaving ? "Đang lưu..." : (
                <>
                  <Save size={20} className="mr-2" />
                  Lưu tất cả thay đổi
                </>
              )}
           </button>
        </div>
      </div>
    </AdminLayout>
  );
}
