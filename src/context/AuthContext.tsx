"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { getGuestOrderCodes, removeGuestOrders } from '@/lib/guestOrders';

// Gọi RPC server-side để gộp đơn guest về tài khoản đang đăng nhập.
// RPC kiểm tra email server-side → user A không nhận được đơn của user B.
async function mergeGuestOrdersIntoAccount(): Promise<void> {
  try {
    const codes = getGuestOrderCodes();
    if (codes.length === 0) return;
    const { data, error } = await supabase.rpc('merge_guest_orders', { p_codes: codes });
    if (error) {
      console.error('merge_guest_orders failed', error);
      return;
    }
    if (typeof data === 'number' && data > 0) {
      removeGuestOrders(codes);
    }
  } catch (err) {
    console.error('mergeGuestOrdersIntoAccount error', err);
  }
}

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    const initAuth = async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
        if (event === 'SIGNED_IN') {
          // Gộp đơn guest đã đặt trên thiết bị này về tài khoản (chỉ nếu email khớp).
          // RPC kiểm tra email server-side để tránh user A nhận đơn của user B.
          void mergeGuestOrdersIntoAccount();
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error) setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
