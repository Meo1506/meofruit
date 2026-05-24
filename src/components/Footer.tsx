"use client";
import Link from "next/link";
import { useSiteSettings } from "@/context/SettingsContext";

export default function Footer() {
  const settings = useSiteSettings();

  const handleSocialClick = (e: React.MouseEvent, link: string, platform: string) => {
    if (!link) {
      e.preventDefault();
      alert(`Hiện shop mình chưa hoạt động trên nền tảng ${platform}!`);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-green-600 tracking-tighter">{settings.webName}</h3>
            <p className="text-gray-500 leading-relaxed text-sm font-medium">
              Chuyên cung cấp các loại trái cây nhập khẩu tươi ngon và nước ép nguyên chất. Mang sức khỏe đến mọi nhà. {settings.shipping.policy}.
            </p>
            <div className="flex space-x-4">
              {[
                { name: "Facebook", url: settings.social.facebook, color: "#1877F2", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
                { name: "Instagram", url: settings.social.instagram, color: "#E4405F", path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" },
                { name: "Youtube", url: settings.social.youtube, color: "#FF0000", path: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM10 15.02V8.48L15.5 11.75z" },
              ].map((s) => (
                <a
                  key={s.name}
                  href={s.url || "#"}
                  onClick={(e) => handleSocialClick(e, s.url, s.name)}
                  target={s.url ? "_blank" : undefined}
                  rel={s.url ? "noopener noreferrer" : undefined}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-300"
                  style={s.url ? ({ ["--hover-bg" as any]: s.color }) : undefined}
                  onMouseEnter={(e) => { if (s.url) (e.currentTarget as HTMLElement).style.backgroundColor = s.color; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                  aria-label={s.name}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.path}></path>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-[10px]">Liên kết nhanh</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-bold">
              <li><Link href="/" className="hover:text-green-600 transition-colors">Trang chủ</Link></li>
              <li><Link href="/san-pham" className="hover:text-green-600 transition-colors">Tất cả sản phẩm</Link></li>
              <li><Link href="/lien-he" className="hover:text-green-600 transition-colors">Liên hệ với chúng tôi</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-[10px]">Chính sách</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-bold">
              <li><Link href="/chinh-sach-giao-hang" className="hover:text-green-600 transition-colors">Chính sách giao hàng</Link></li>
              <li><Link href="/chinh-sach-doi-tra" className="hover:text-green-600 transition-colors">Chính sách đổi trả</Link></li>
              <li><Link href="/chinh-sach-bao-mat" className="hover:text-green-600 transition-colors">Chính sách bảo mật</Link></li>
              <li><Link href="/dieu-khoan-dich-vu" className="hover:text-green-600 transition-colors">Điều khoản dịch vụ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-[10px]">Thông tin thanh toán</h4>
            <div className="bg-green-50 p-6 rounded-2xl space-y-3 border border-green-100">
              <p className="text-[10px] text-green-800 font-black uppercase tracking-widest">Chuyển khoản nhanh</p>
              <div className="space-y-1">
                <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{settings.bankAccount.owner}</p>
                <p className="text-lg font-black text-green-600 tracking-tighter">{settings.bankAccount.number}</p>
                <p className="text-xs text-gray-700 font-bold">{settings.bankAccount.bank}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest space-y-4 md:space-y-0">
          <p>{settings.webName}. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
