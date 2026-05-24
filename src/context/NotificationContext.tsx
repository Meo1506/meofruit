"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getOrCreateGuestToken } from "@/lib/guestToken";

export interface AppNotification {
  id: string;
  order_id: string;
  type: "confirmed" | "shipping" | "delivered" | "cancelled";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markRead: async () => {},
  markAllRead: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      const token = getOrCreateGuestToken();
      if (!token) return;
      query = (query as any).eq("guest_token", token).is("user_id", null);
    }

    const { data } = await query;
    if (data) setNotifications(data as AppNotification[]);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime: new notification pushed from admin
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const filter = user
      ? `user_id=eq.${user.id}`
      : `guest_token=eq.${getOrCreateGuestToken()}`;

    const channel = supabase
      .channel(`notif-${user?.id ?? "guest"}`)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "notifications", filter },
        (payload: any) => {
          setNotifications(prev => [payload.new as AppNotification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    if (isSupabaseConfigured()) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (isSupabaseConfigured() && unreadIds.length) {
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
