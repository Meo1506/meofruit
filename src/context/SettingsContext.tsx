"use client";
import { createContext, useContext } from "react";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/types";

const SettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

export function SettingsProvider({
  value,
  children,
}: {
  value: SiteSettings;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSiteSettings = () => useContext(SettingsContext);
