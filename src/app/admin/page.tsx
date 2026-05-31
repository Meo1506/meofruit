"use client";
import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Users, TrendingUp, Clock, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Period = "today" | "week" | "month" | "year";

interface Order {
  id: string;
  customer_name: string;
  total_price: number;
  payment_method: string;
  status: string;
  created_at: string;
}

function getPeriodStart(period: Period, now: Date): Date {
  const d = new Date(now);
  if (period === "today") { d.setHours(0, 0, 0, 0); return d; }
  if (period === "week") { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }
  if (period === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
  d.setMonth(0, 1); d.setHours(0, 0, 0, 0); return d;
}

function getPrevPeriodStart(period: Period, now: Date): Date {
  const d = new Date(now);
  if (period === "today") { d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d; }
  if (period === "week") { d.setDate(d.getDate() - d.getDay() - 7); d.setHours(0, 0, 0, 0); return d; }
  if (period === "month") { d.setMonth(d.getMonth() - 1, 1); d.setHours(0, 0, 0, 0); return d; }
  d.setFullYear(d.getFullYear() - 1, 0, 1); d.setHours(0, 0, 0, 0); return d;
}

function buildChartData(period: Period, orders: Order[], now: Date): { label: string; value: number }[] {
  if (period === "today") {
    return ["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"].map((label, i) => ({
      label,
      value: orders
        .filter(o => { const h = new Date(o.created_at).getHours(); return h >= i * 4 && h < (i + 1) * 4; })
        .reduce((s, o) => s + (o.total_price || 0), 0),
    }));
  }
  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((label, i) => {
      const s = new Date(start); s.setDate(s.getDate() + i);
      const e = new Date(s); e.setDate(e.getDate() + 1);
      return {
        label,
        value: orders
          .filter(o => { const d = new Date(o.created_at); return d >= s && d < e; })
          .reduce((sum, o) => sum + (o.total_price || 0), 0),
      };
    });
  }
  if (period === "month") {
    const weeks = Math.ceil(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7);
    return Array.from({ length: weeks }, (_, i) => {
      const s = new Date(now.getFullYear(), now.getMonth(), 1 + i * 7);
      const e = new Date(now.getFullYear(), now.getMonth(), 1 + (i + 1) * 7);
      return {
        label: `T${i + 1}`,
        value: orders
          .filter(o => { const d = new Date(o.created_at); return d >= s && d < e; })
          .reduce((sum, o) => sum + (o.total_price || 0), 0),
      };
    });
  }
  return ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"].map((label, i) => ({
    label,
    value: orders
      .filter(o => { const d = new Date(o.created_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === i; })
      .reduce((sum, o) => sum + (o.total_price || 0), 0),
  }));
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const fmt = (v: number) =>
    v === 0 ? "0₫" : v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M₫` : `${(v / 1000).toFixed(0)}K₫`;

  return (
    <div className="flex items-end gap-1.5 pt-6" style={{ height: 170 }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center justify-end flex-1 h-full group/bar relative">
          {d.value > 0 && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {fmt(d.value)}
            </div>
          )}
          <div className="w-full flex flex-col justify-end" style={{ height: 130 }}>
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${d.value > 0 ? "bg-green-400 group-hover/bar:bg-green-500" : "bg-gray-100"}`}
              style={{ height: `${d.value > 0 ? Math.max((d.value / max) * 100, 5) : 2}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-400 font-bold mt-1.5 whitespace-nowrap">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

const STATUS_CONFIG = [
  { key: "new",       label: "Đơn mới",   bar: "bg-blue-500",   text: "text-blue-600"   },
  { key: "confirmed", label: "Xác nhận",  bar: "bg-purple-500", text: "text-purple-600" },
  { key: "shipping",  label: "Đang giao", bar: "bg-orange-500", text: "text-orange-600" },
  { key: "delivered", label: "Đã giao",   bar: "bg-green-500",  text: "text-green-600"  },
  { key: "paid",      label: "Đã TT",     bar: "bg-teal-500",   text: "text-teal-600"   },
  { key: "cancelled", label: "Đã hủy",    bar: "bg-red-400",    text: "text-red-500"    },
];

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Hôm nay" },
  { id: "week",  label: "Tuần này" },
  { id: "month", label: "Tháng này" },
  { id: "year",  label: "Năm nay" },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const [ordersRes, customersRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, customer_name, total_price, payment_method, status, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "user"),
      ]);
      setAllOrders(ordersRes.data || []);
      setCustomers(customersRes.count || 0);
    }
    fetchData();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("realtime-admin-dashboard")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData)
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchData)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  const { stats, statusDist, chartData } = useMemo(() => {
    const now = new Date();
    const periodStart = getPeriodStart(period, now);
    const prevPeriodStart = getPrevPeriodStart(period, now);

    const notCancelled = (o: Order) => o.status !== "cancelled";
    const periodOrders = allOrders.filter(o => new Date(o.created_at) >= periodStart && notCancelled(o));
    const prevOrders = allOrders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevPeriodStart && d < periodStart && notCancelled(o);
    });

    const revenue = periodOrders.reduce((s, o) => s + (o.total_price || 0), 0);
    const prevRevenue = prevOrders.reduce((s, o) => s + (o.total_price || 0), 0);
    const revenueChange = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

    const orderCount = periodOrders.length;
    const prevOrderCount = prevOrders.length;
    const orderCountChange = prevOrderCount > 0 ? Math.round(((orderCount - prevOrderCount) / prevOrderCount) * 100) : null;

    const pendingOrders = allOrders.filter(o => o.status === "new" || o.status === "confirmed").length;

    const statusDist: Record<string, number> = { new: 0, confirmed: 0, shipping: 0, delivered: 0, paid: 0, cancelled: 0 };
    allOrders.forEach(o => { if (o.status in statusDist) statusDist[o.status]++; });

    return {
      stats: { revenue, revenueChange, orderCount, orderCountChange, pendingOrders },
      statusDist,
      chartData: buildChartData(period, periodOrders, now),
    };
  }, [allOrders, period]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  const totalOrders = Object.values(statusDist).reduce((a, b) => a + b, 0);

  const chartLabel =
    period === "today" ? "Theo khung giờ" :
    period === "week"  ? "Theo ngày" :
    period === "month" ? "Theo tuần" : "Theo tháng";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Tổng quan</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Theo dõi hiệu suất kinh doanh</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${period === p.id ? "bg-gray-900 text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="col-span-2 lg:col-span-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
              <TrendingUp size={20} />
            </div>
            {stats.revenueChange !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-black px-2 py-1 rounded-lg ${stats.revenueChange >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                {stats.revenueChange >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                {Math.abs(stats.revenueChange)}%
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doanh thu</p>
          <p className="text-lg font-black text-gray-900 mt-1 break-words">{formatCurrency(stats.revenue)}</p>
          <p className="text-[9px] text-gray-400 mt-1 font-medium">So với kỳ trước</p>
        </div>

        {/* Orders */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500 p-3 rounded-2xl text-white shadow-lg shadow-green-100">
              <ShoppingBag size={20} />
            </div>
            {stats.orderCountChange !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-black px-2 py-1 rounded-lg ${stats.orderCountChange >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                {stats.orderCountChange >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                {Math.abs(stats.orderCountChange)}%
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đơn hàng</p>
          <p className="text-xl font-black text-gray-900 mt-1">{stats.orderCount}</p>
          <p className="text-[9px] text-gray-400 mt-1 font-medium">Trong kỳ (trừ hủy)</p>
        </div>

        {/* Pending */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="mb-4">
            <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-100 w-fit">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cần xử lý</p>
          <p className="text-xl font-black text-gray-900 mt-1">{stats.pendingOrders}</p>
          <p className="text-[9px] text-gray-400 mt-1 font-medium">Đơn mới & chờ xác nhận</p>
        </div>

        {/* Customers */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="mb-4">
            <div className="bg-purple-500 p-3 rounded-2xl text-white shadow-lg shadow-purple-100 w-fit">
              <Users size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Khách hàng</p>
          <p className="text-xl font-black text-gray-900 mt-1">{customers}</p>
          <p className="text-[9px] text-gray-400 mt-1 font-medium">Tài khoản đã đăng ký</p>
        </div>
      </div>

      {/* Chart + Status + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-3 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Biểu đồ doanh thu</h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{chartLabel}</span>
          </div>
          <BarChart data={chartData} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Status Distribution */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex-1">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Trạng thái đơn</h3>
              <span className="text-[10px] text-gray-400 font-bold">{totalOrders} đơn</span>
            </div>
            <div className="space-y-3">
              {STATUS_CONFIG.map(({ key, label, bar, text }) => {
                const count = statusDist[key] ?? 0;
                const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${text}`}>{label}</span>
                      <span className="text-[10px] font-black text-gray-600">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bar} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Đơn mới nhất</h3>
              <Link href="/admin/don-hang" className="text-[10px] font-black text-green-600 hover:text-green-700 uppercase tracking-wider">
                Xem tất cả →
              </Link>
            </div>
            <div className="space-y-3">
              {allOrders.length === 0 ? (
                <p className="text-center text-gray-300 text-xs italic py-4">Chưa có đơn hàng nào</p>
              ) : (
                allOrders.slice(0, 4).map(order => (
                  <div key={order.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-black text-xs uppercase flex-shrink-0">
                        {(order.customer_name || "K")[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{order.customer_name || "Khách"}</p>
                        <p className="text-[9px] text-gray-400 font-medium">
                          {new Date(order.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-black text-gray-800 flex-shrink-0 whitespace-nowrap">
                      {formatCurrency(order.total_price)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
