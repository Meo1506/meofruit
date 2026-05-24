// Server-side fetch site settings từ Supabase `site_settings` table.
// CHỈ dùng trong server components / route handlers / proxy. KHÔNG import từ "use client".

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/types";
import { cache } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

const isConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co";

// React.cache() dedupe trong cùng 1 request — layout + nhiều page cùng gọi chỉ fetch 1 lần.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isConfigured()) return DEFAULT_SITE_SETTINGS;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
      cookies: {
        getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: () => {}, // read-only context
      },
    });

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return DEFAULT_SITE_SETTINGS;

    // Merge DB values với defaults — field nào DB chưa có / null thì fallback default.
    return {
      webName: data.web_name || DEFAULT_SITE_SETTINGS.webName,
      ownerName: data.owner_name || DEFAULT_SITE_SETTINGS.ownerName,
      bankAccount: {
        number: data.bank_number || DEFAULT_SITE_SETTINGS.bankAccount.number,
        owner: data.bank_owner || DEFAULT_SITE_SETTINGS.bankAccount.owner,
        bank: data.bank_name || DEFAULT_SITE_SETTINGS.bankAccount.bank,
      },
      contact: {
        phone: data.contact_phone || DEFAULT_SITE_SETTINGS.contact.phone,
        zalo: data.contact_zalo || data.contact_phone || DEFAULT_SITE_SETTINGS.contact.zalo,
        email: data.contact_email || DEFAULT_SITE_SETTINGS.contact.email,
        address: data.contact_address || DEFAULT_SITE_SETTINGS.contact.address,
      },
      social: {
        facebook: data.social_facebook || "",
        instagram: data.social_instagram || "",
        youtube: data.social_youtube || "",
      },
      shipping: {
        policy: data.shipping_policy || DEFAULT_SITE_SETTINGS.shipping.policy,
      },
      heroImages: data.hero_images || DEFAULT_SITE_SETTINGS.heroImages,
      showCategoriesSection: data.show_categories_section !== undefined ? data.show_categories_section : DEFAULT_SITE_SETTINGS.showCategoriesSection,
    };
  } catch (err) {
    console.error("[site-settings] fetch failed, falling back to defaults:", err);
    return DEFAULT_SITE_SETTINGS;
  }
});
