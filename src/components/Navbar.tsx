"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SettingsContext";
import { User, ShoppingBag, Search, Menu, X, LogIn, LogOut, Package } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems, setIsCartOpen } = useCart();
  const { user, signOut } = useAuth();
  const settings = useSiteSettings();
  const router = useRouter();

  // Trên các trang không phải trang chủ, hero không phủ navbar → luôn show opaque/chữ tối
  // để tránh chữ trắng trên nền sáng (vô hình).
  const useOpaqueStyle = !isHomePage || isScrolled || isHovered;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/san-pham?q=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };
  
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if at the very top
      setIsScrolled(currentScrollY > 50);

      // Show/Hide logic on scroll
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down - Hide
        setIsVisible(false);
      } else {
        // Scrolling up - Show
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Trang chủ", href: "/" },
    { name: "Sản phẩm", href: "/san-pham" },
    { name: "Liên hệ", href: "/lien-he" },
  ];

  // Final visibility state: Show if scrolled up OR hovered OR at the very top
  const showNavbar = isVisible || isHovered || !isScrolled;

  return (
    <>
      {/*
        Trigger Area: chỉ render khi navbar đang ẩn để bring it back.
        Khi navbar đang hiển thị thì không cần — nếu render sẽ chặn pointer events
        cho các phần tử bên dưới ở vùng 80px trên cùng.
      */}
      {!showNavbar && (
        <div
          className="fixed top-0 left-0 right-0 h-12 z-[70]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}

      <nav
        className={`fixed w-full z-[80] transition-all duration-500 ease-in-out ${
          showNavbar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        } ${
          useOpaqueStyle ? "bg-white shadow-md py-2 text-gray-800" : "bg-transparent py-4 text-white"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 -ml-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} className={useOpaqueStyle ? "text-gray-800" : "text-white"} />
          </button>

          {/* Logo */}
          <Link href="/" className={`text-xl md:text-2xl font-black tracking-tighter transition-colors ${useOpaqueStyle ? "text-green-600" : "text-white"}`}>
            {settings.webName}
          </Link>

          {/* Desktop Menu */}
          <div className={`hidden md:flex space-x-8 font-bold text-sm uppercase tracking-widest ${useOpaqueStyle ? "text-gray-700" : "text-white"}`}>
            {navLinks.map(link => (
              <Link key={link.name} href={link.href} className="hover:text-green-500 transition-colors relative group">
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <button onClick={() => setIsSearchOpen(true)} aria-label="Tìm kiếm" className={`p-2 rounded-full transition-colors hidden sm:block ${useOpaqueStyle ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}>
              <Search size={20} />
            </button>

            <NotificationBell opaque={useOpaqueStyle} />

            <Link
              href="/tai-khoan"
              className={`p-2 rounded-full transition-colors ${useOpaqueStyle ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}
            >
              <User size={20} />
            </Link>

            <button 
              className="relative p-2 rounded-full transition-colors"
              onClick={() => setIsCartOpen(true)}
            >
              <div className={`${useOpaqueStyle ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"} transition-all`}>
                <ShoppingBag size={20} />
              </div>
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center animate-bounce shadow-lg">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer (Same as before) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-[80%] max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-600 text-white">
               <span className="font-black tracking-tighter text-xl">{settings.webName}</span>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-8 px-6 space-y-6">
               <div className="space-y-4">
                  {navLinks.map(link => (
                    <Link 
                      key={link.name} 
                      href={link.href} 
                      className="block text-lg font-bold text-gray-800 hover:text-green-600 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
               </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 space-y-2">
               {user ? (
                 <>
                   <Link
                     href="/tai-khoan"
                     onClick={() => setIsMobileMenuOpen(false)}
                     className="w-full py-3 bg-green-600 text-white font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg"
                   >
                     <User size={18} />
                     <span>Tài khoản</span>
                   </Link>
                   <Link
                     href="/tai-khoan/don-hang"
                     onClick={() => setIsMobileMenuOpen(false)}
                     className="w-full py-3 bg-gray-100 text-gray-900 font-black rounded-2xl flex items-center justify-center space-x-2"
                   >
                     <Package size={18} />
                     <span>Đơn hàng</span>
                   </Link>
                   <button
                     onClick={async () => { await signOut(); setIsMobileMenuOpen(false); router.push("/"); }}
                     className="w-full py-3 text-red-500 font-bold rounded-2xl flex items-center justify-center space-x-2"
                   >
                     <LogOut size={18} />
                     <span>Đăng xuất</span>
                   </button>
                 </>
               ) : (
                 <Link
                   href="/dang-nhap"
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="w-full py-4 bg-green-600 text-white font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg"
                 >
                   <LogIn size={20} />
                   <span>ĐĂNG NHẬP</span>
                 </Link>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-32">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <form onSubmit={handleSearch} className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-2 flex items-center animate-in zoom-in-95 duration-200">
            <Search size={20} className="ml-4 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-4 text-base font-bold bg-transparent border-none focus:ring-0 outline-none"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="px-6 py-3 bg-green-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-green-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Tìm
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="ml-1 p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
