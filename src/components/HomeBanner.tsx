"use client";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isBannerLive } from "@/lib/banner";
import type { HomeBanner as HomeBannerT, BannerSection } from "@/types";

interface Props {
  /** Khi truyền vào: render trực tiếp, bỏ qua fetch + check live (dùng cho preview admin). */
  banner?: HomeBannerT | null;
}

export default function HomeBanner({ banner: bannerProp }: Props) {
  const isPreview = bannerProp !== undefined;
  const [fetched, setFetched] = useState<HomeBannerT | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // Re-evaluate live status mỗi phút.
  useEffect(() => {
    if (isPreview) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [isPreview]);

  useEffect(() => {
    if (isPreview) return;
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("home_banners")
        .select("*")
        .eq("is_visible", true)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (cancelled) return;
      if (error || !data) {
        setFetched(null);
        return;
      }
      const live = (data as HomeBannerT[]).find((b) => isBannerLive(b, new Date()));
      setFetched(live ?? null);
    }
    load();

    const channel = supabase
      .channel("realtime-home-banner")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "home_banners" },
        () => load()
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isPreview]);

  const banner = isPreview ? bannerProp ?? null : fetched;
  if (!banner) return null;
  if (!isPreview && !isBannerLive(banner, now)) return null;

  const sections = (banner.sections || []).slice().sort((a, b) => a.order - b.order);
  if (sections.length === 0 && !banner.title) return null;

  return (
    <section className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-100">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {banner.title && (
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter uppercase mb-4 text-center">
            {banner.title}
          </h2>
        )}
        <div className="space-y-4 max-w-4xl mx-auto">
          {sections.map((s) => (
            <BannerSectionView key={s.id} section={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BannerSectionView({ section }: { section: BannerSection }) {
  if (section.type === "text") {
    if (!section.content.trim()) return null;
    return (
      <p className="text-sm md:text-base font-medium text-gray-700 leading-relaxed whitespace-pre-wrap text-center">
        {section.content}
      </p>
    );
  }
  if (!section.content) return null;
  return (
    <div className="flex justify-center">
      <img
        src={section.content}
        alt=""
        className="max-w-full rounded-2xl shadow-md object-cover"
        loading="lazy"
      />
    </div>
  );
}
