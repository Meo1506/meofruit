"use client";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SettingsProvider } from "@/context/SettingsContext";
import type { SiteSettings } from "@/types";

export default function Providers({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider value={settings}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
