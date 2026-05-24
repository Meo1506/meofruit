"use client";
import { useState, useEffect } from "react";

const sections = [
  { id: "hop-mix-san", label: "Hộp Mix Sẵn", emoji: "🎁" },
  { id: "hop-tu-chon", label: "Hộp Tự Chọn", emoji: "✨" },
  { id: "hop-nguyen-ban", label: "Hộp Nguyên Bản", emoji: "🍎" },
];

export default function SectionNav() {
  const [active, setActive] = useState("hop-mix-san");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 120;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="sticky top-[56px] md:top-[64px] z-[70] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center overflow-x-auto gap-1 py-2 no-scrollbar">
          {sections.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                active === id
                  ? "bg-green-600 text-white shadow-md shadow-green-100"
                  : "bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
