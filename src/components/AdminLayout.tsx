"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Apple,
  Layout,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    // Demo mode (chưa có Supabase): cho qua kèm banner cảnh báo.
    // Middleware /admin sẽ chặn ở production vì env luôn có.
    if (!isSupabaseConfigured()) {
      setIsAdmin(true);
      setIsVerifying(false);
      return;
    }

    // Defense-in-depth: proxy.ts (server) đã validate token + check is_admin rồi,
    // ở client chỉ cần đọc session từ cache local (KHÔNG hit network như getUser()).
    // Nếu session lệch / admin bị revoke giữa chừng → proxy server-side sẽ chặn ở
    // request tiếp theo. Khỏi double network call mỗi lần navigate.
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        router.replace("/dang-nhap?next=" + encodeURIComponent(pathname));
        return;
      }

      setAdminEmail(session.user.email || null);
      setIsAdmin(true);
      setIsVerifying(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // Không block toàn màn hình nữa — sidebar render luôn, chỉ phần children skeleton.
  // getSession() đọc cache local nên thường resolve trong 1 tick, gần như không thấy.
  if (!isVerifying && !isAdmin) return null;

  const menuItems = [
    { name: "Tổng quan",   icon: LayoutDashboard, href: "/admin" },
    { name: "Sản phẩm",   icon: ShoppingBag,     href: "/admin/san-pham" },
    { name: "Banner",     icon: Layout,          href: "/admin/banner" },
    { name: "Tồn kho quả", icon: Apple,           href: "/admin/trai-cay" },
    { name: "Đơn hàng",   icon: ShoppingCart,    href: "/admin/don-hang" },
    { name: "Tin nhắn",   icon: Mail,            href: "/admin/tin-nhan" },
    { name: "Cài đặt",    icon: Settings,        href: "/admin/cai-dat" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? "w-64" : "w-20"} bg-gray-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <ShieldCheck className="text-green-400 flex-shrink-0" size={24} />
            <h1 className={`${isSidebarOpen ? "block" : "hidden"} font-black text-xl tracking-tighter text-white whitespace-nowrap`}>
              ADMIN
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-800 rounded-lg">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center p-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/20" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon size={22} className={isSidebarOpen ? "mr-3" : "mx-auto"} />
                <span className={`${isSidebarOpen ? "block" : "hidden"} font-bold text-sm`}>
                  {item.name}
                </span>
                {isActive && isSidebarOpen && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-2">
          <Link href="/" className="flex items-center p-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-gray-800">
            <ChevronRight size={22} className={`${isSidebarOpen ? "mr-3" : "mx-auto"} rotate-180`} />
            <span className={`${isSidebarOpen ? "block" : "hidden"} text-sm font-bold`}>Về trang chủ</span>
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center p-3 text-red-400 hover:text-white hover:bg-red-600 transition-colors rounded-xl">
            <LogOut size={22} className={isSidebarOpen ? "mr-3" : "mx-auto"} />
            <span className={`${isSidebarOpen ? "block" : "hidden"} text-sm font-bold`}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300`}>
        <header className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-40">
           <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-xs">Trang quản trị</span>
              <span className="text-gray-300">/</span>
              <span className="font-bold text-gray-900 text-sm">
                {menuItems.find(item => item.href === pathname)?.name || "Dashboard"}
              </span>
           </div>
           <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                 <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{adminEmail || "Demo Admin"}</p>
                 <p className="text-[10px] text-green-600 uppercase tracking-widest font-black">
                   {isSupabaseConfigured() ? "Online" : "Demo Mode"}
                 </p>
              </div>
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-black uppercase">
                {(adminEmail || "A")[0]}
              </div>
           </div>
        </header>

        {!isSupabaseConfigured() && (
          <div className="bg-orange-50 border-b border-orange-200 px-8 py-3 flex items-center text-orange-800">
            <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
            <p className="text-xs font-bold">
              <strong>Demo mode:</strong> chưa kết nối Supabase nên admin không có bảo vệ thật.
              Production cần set <code className="bg-orange-100 px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> để middleware enforce admin role.
            </p>
          </div>
        )}

        <div className="p-8">
          {isVerifying ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 h-24" />
                ))}
              </div>
              <div className="bg-white rounded-[2rem] border border-gray-100 h-64" />
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
