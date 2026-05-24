"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Package } from "lucide-react";
import { useNotifications, AppNotification } from "@/context/NotificationContext";

const TYPE_CONFIG: Record<AppNotification["type"], { emoji: string; color: string }> = {
  confirmed: { emoji: "🎉", color: "text-purple-600 bg-purple-50" },
  shipping:  { emoji: "🚚", color: "text-orange-600 bg-orange-50" },
  delivered: { emoji: "✅", color: "text-green-600 bg-green-50" },
  cancelled: { emoji: "❌", color: "text-red-600 bg-red-50" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export default function NotificationBell({ opaque = true }: { opaque?: boolean }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Thông báo"
        className={`relative p-2 rounded-full transition-colors ${
          opaque ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-black uppercase tracking-widest text-gray-700">
              Thông báo
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full font-black">
                  {unreadCount}
                </span>
              )}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] text-green-600 font-black hover:text-green-700 uppercase tracking-widest"
              >
                <CheckCheck size={12} /> Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Package size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] ?? { emoji: "📦", color: "text-gray-600 bg-gray-50" };
                return (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.is_read) markRead(n.id); }}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                      !n.is_read ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${cfg.color}`}>
                      {cfg.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs font-black leading-tight ${!n.is_read ? "text-gray-900" : "text-gray-600"}`}>
                          {n.title}
                        </p>
                        {!n.is_read && <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
