"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useSiteSettings } from "@/context/SettingsContext";

function StrokeIcon({ size, d }: { size: number; d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function FacebookIcon({ size }: { size: number }) {
  return <StrokeIcon size={size} d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />;
}

function InstagramIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function YoutubeIcon({ size }: { size: number }) {
  return <StrokeIcon size={size} d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM10 15.02V8.48L15.5 11.75z" />;
}

function ZaloIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.5 2C6.7 2 2 6.1 2 11.2c0 2.9 1.5 5.5 3.9 7.1l-.7 2.6c-.1.4.3.7.6.5l2.9-1.7c1.2.4 2.5.6 3.8.6 5.8 0 10.5-4.1 10.5-9.2S18.3 2 12.5 2zm-4.7 9.2c.6 0 1 .5 1 1.1s-.4 1.1-1 1.1-1-.5-1-1.1.4-1.1 1-1.1zm4.7 0c.6 0 1 .5 1 1.1s-.4 1.1-1 1.1-1-.5-1-1.1.4-1.1 1-1.1zm4.7 0c.6 0 1 .5 1 1.1s-.4 1.1-1 1.1-1-.5-1-1.1.4-1.1 1-1.1z" />
    </svg>
  );
}

function ZaloGroupIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.5 2C6.7 2 2 6.1 2 11.2c0 2.9 1.5 5.5 3.9 7.1l-.7 2.6c-.1.4.3.7.6.5l2.9-1.7c1.2.4 2.5.6 3.8.6 5.8 0 10.5-4.1 10.5-9.2S18.3 2 12.5 2z" />
      <circle cx="9" cy="9.5" r="1.5" fill="white" />
      <circle cx="16" cy="9.5" r="1.5" fill="white" />
      <path fill="white" d="M5.5 13.5c0-1.5 1.7-2.5 3.5-2.5s3.5 1 3.5 2.5H5.5z" />
      <path fill="white" d="M12.5 13.5c0-1.5 1.7-2.5 3.5-2.5s3.5 1 3.5 2.5h-7z" />
    </svg>
  );
}

interface SocialItem {
  url: string;
  label: string;
  bg: string;
  render: (size: number) => React.ReactNode;
}

export default function FloatingSocialIcons() {
  const pathname = usePathname();
  const settings = useSiteSettings();
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  const zaloGroupUrl = settings.social.social_zalo_group?.trim() || "";

  const items: SocialItem[] = [
    {
      url: settings.social.facebook,
      label: "Facebook",
      bg: "bg-[#1877F2] hover:bg-[#0d65d9]",
      render: (s: number) => <FacebookIcon size={s} />,
    },
    {
      url: settings.social.instagram,
      label: "Instagram",
      bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:brightness-110",
      render: (s: number) => <InstagramIcon size={s} />,
    },
    {
      url: settings.social.youtube,
      label: "YouTube",
      bg: "bg-[#FF0000] hover:bg-[#cc0000]",
      render: (s: number) => <YoutubeIcon size={s} />,
    },
    {
      url: settings.social.zalo ? `https://zalo.me/${settings.social.zalo.trim()}` : "",
      label: "Zalo",
      bg: "bg-[#0068FF] hover:bg-[#0052cc]",
      render: (s: number) => <ZaloIcon size={s} />,
    },
  ].filter((it) => it.url && it.url.trim().length > 0);

  if (items.length === 0 && !zaloGroupUrl) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-[80] flex flex-col items-end gap-3">
      <div
        className={`flex-col gap-3 ${open ? "flex" : "hidden"} sm:flex`}
        role="group"
        aria-label="Liên hệ qua mạng xã hội"
      >
        {items.map((it) => (
          <a
            key={it.label}
            href={it.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={it.label}
            title={it.label}
            className={`w-12 h-12 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-white shadow-2xl shadow-gray-900/30 active:scale-95 transition-all duration-200 ${it.bg}`}
          >
            {it.render(20)}
          </a>
        ))}
      </div>
      {zaloGroupUrl && (
        <a
          href={zaloGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat nhóm Zalo"
          title="Chat nhóm Zalo"
          className={`${open ? "flex" : "hidden"} sm:flex w-12 h-12 sm:w-11 sm:h-11 items-center justify-center rounded-full text-white shadow-2xl shadow-gray-900/30 active:scale-95 transition-all duration-200 bg-[#0068FF] hover:bg-[#0052cc]`}
        >
          <ZaloGroupIcon size={20} />
        </a>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Đóng menu liên hệ" : "Mở menu liên hệ"}
        className="sm:hidden w-12 h-12 flex items-center justify-center bg-gray-900 text-white rounded-full shadow-2xl shadow-gray-900/40 active:scale-95 transition-all"
      >
        {open ? <X size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
      </button>
    </div>
  );
}
