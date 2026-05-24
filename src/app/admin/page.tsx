"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { ShoppingBag, Users, TrendingUp, CreditCard } from "lucide-react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RecentOrder {
  id: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

interface DashboardStats {
  revenue: number;
  newOrders: number;
  customers: number;
  pendingPayment: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ revenue: 0, newOrders: 0, customers: 0, pendingPayment: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const [ordersRes, customersRes, pendingRes, recentRes] = await Promise.all([
        supabase.from("orders").select("total_amount, status"),
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "user"),
        supabase.from("orders").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("orders").select("id, customer_name, total_amount, payment_method, created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      const orders = ordersRes.data || [];
      const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setStats({
        revenue,
        newOrders: orders.length,
        customers: customersRes.count || 0,
        pendingPayment: pendingRes.count || 0,
      });
      setRecentOrders(recentRes.data || []);
    }
    fetchStats();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("realtime-admin-dashboard")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            fetchStats();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            fetchStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const statCards = [
    { name: "Tổng doanh thu", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "bg-blue-500" },
    { name: "Tổng đơn hàng", value: stats.newOrders.toString(), icon: ShoppingBag, color: "bg-green-500" },
    { name: "Khách hàng", value: stats.customers.toString(), icon: Users, color: "bg-purple-500" },
    { name: "Chờ thanh toán", value: stats.pendingPayment.toString(), icon: CreditCard, color: "bg-orange-500" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
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

        {/* Bottom section */}
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
              {recentOrders.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm italic">
                  Chưa có đơn hàng nào
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold uppercase">
                        {(order.customer_name || "K")[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{order.customer_name || "Khách"}</p>
                        <p className="text-[10px] text-gray-400">{order.payment_method || "COD"}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                  </div>
                ))
              )}
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
