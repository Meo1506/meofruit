"use client";
import AdminLayout from "@/components/AdminLayout";
import { ShoppingBag, Users, TrendingUp, CreditCard } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const stats = [
    { name: "Tổng doanh thu", value: "45,200,000₫", icon: TrendingUp, color: "bg-blue-500" },
    { name: "Đơn hàng mới", value: "12", icon: ShoppingBag, color: "bg-green-500" },
    { name: "Khách hàng", value: "156", icon: Users, color: "bg-purple-500" },
    { name: "Chờ thanh toán", value: "5", icon: CreditCard, color: "bg-orange-500" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.name}</p>
                <p className="text-xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts / Tables Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[400px]">
              <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">Doanh thu gần đây</h2>
              <div className="h-full flex items-center justify-center text-gray-300 italic">
                (Biểu đồ doanh thu sẽ hiển thị ở đây)
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[400px]">
              <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">Đơn hàng mới nhất</h2>
              <div className="space-y-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">K</div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">Khách hàng #{i}</p>
                            <p className="text-[10px] text-gray-400">Vừa xong • COD</p>
                         </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900">1,250,000₫</p>
                   </div>
                 ))}
                 <Link href="/admin/don-hang" className="block w-full py-3 text-sm font-bold text-green-600 hover:bg-green-50 rounded-xl transition-colors text-center">
                    Xem tất cả đơn hàng →
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
