"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";
import { formatVND } from "@/lib/price";
import { ShoppingCart, RefreshCw } from "lucide-react";

// ─── Config ──────────────────────────────────────────────────────────────────
const SLOT_H  = 44;
const VISIBLE = 3;
const REPS    = 24;
const SPIN_MS = 1200;
const GAP_MS  = 250;
const STOP_MS = 580;

const FRUITS = [
  { name: "Xoài",    emoji: "🥭", img: "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400", slug: "xoai-cat-san" },
  { name: "Ổi",      emoji: "🍏", img: "https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?q=80&w=400", slug: "oi-cat-san" },
  { name: "Mận",     emoji: "🍑", img: "https://images.unsplash.com/photo-1571680322279-a226e6a4cc2a?q=80&w=400", slug: "man-cat-san" },
  { name: "Dưa hấu", emoji: "🍉", img: "https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?q=80&w=400", slug: "dua-hau-cat-san" },
  { name: "Quýt",    emoji: "🍊", img: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?q=80&w=400", slug: "quyt-boc-san" },
];

const SPEEDS  = [9, 10, 9.5, 10, 9];
const INIT_YS = FRUITS.map((_, i) => (1 - (3 * 5 + i)) * SLOT_H);

// ─── Sound ────────────────────────────────────────────────────────────────────
function playTick() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 200 + Math.random() * 80; o.type = "square";
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    o.start(); o.stop(ctx.currentTime + 0.05);
    setTimeout(() => ctx.close(), 300);
  } catch { /* no audio permission */ }
}

function playTing(pitch: number) {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.value = pitch;
    g.gain.setValueAtTime(0.35, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 700);
  } catch { }
}

function playTadaa() {
  try {
    const ctx = new AudioContext();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.08;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      o.start(t); o.stop(t + 0.7);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { }
}

// ─── Product mapping ──────────────────────────────────────────────────────────
function mapResult(reels: number[]): { product: Product; customFruits?: string[] } {
  const unique = [...new Set(reels.map(i => FRUITS[i].name))];
  const has = (...names: string[]) => names.every(n => unique.includes(n));
  const mk = (id: string, name: string, img: string, cat = "Hộp Mix Sẵn"): Product => ({
    id, slug: id, name, price: 30000, price_formatted: "30.000₫",
    image_url: img, category: cat, is_in_stock: true, product_type: "standard",
  });

  if (unique.length === 1) {
    const f = FRUITS.find(x => x.name === unique[0])!;
    return { product: mk(f.slug, `${f.name} cắt sẵn`, f.img, "Hộp Nguyên Bản") };
  }
  if (unique.length === 5)
    return { product: mk("hop-ngu-sac", "Hộp Ngũ Sắc", "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop") };
  if (unique.length === 2 && has("Dưa hấu", "Quýt"))
    return { product: mk("hop-giai-nhiet", "Hộp Giải Nhiệt", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop") };
  if (unique.length === 3 && has("Ổi", "Mận", "Xoài"))
    return { product: mk("hop-gion-tan", "Hộp Giòn Tan", "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?q=80&w=800&auto=format&fit=crop") };
  if (unique.length === 2)
    return { product: mk("hop-2-vi-tuy-y", `Hộp ${unique.join(" & ")}`, "https://images.unsplash.com/photo-1546548970-71785318a17b?q=80&w=800&auto=format&fit=crop") };

  return {
    product: { ...mk("hop-tu-chon-mix", `Hộp Mix ${unique.join(" + ")}`, "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=800&auto=format&fit=crop", "Hộp Tự Chọn"), product_type: "custom_mix" },
    customFruits: unique,
  };
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const C_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#fbbf24", "#f9a8d4"];
function Dot({ i }: { i: number }) {
  return (
    <div
      className="absolute top-0 pointer-events-none animate-confetti-fall"
      style={{
        left: `${(i * 41 + 5) % 92}%`,
        width: i % 2 ? 7 : 5, height: i % 2 ? 7 : 5,
        borderRadius: i % 3 ? "50%" : "2px",
        backgroundColor: C_COLORS[i % C_COLORS.length],
        animationDelay: `${(i * 0.09) % 1.1}s`,
        animationDuration: `${1.4 + (i % 5) * 0.22}s`,
      }}
    />
  );
}

// ─── Single Reel ──────────────────────────────────────────────────────────────
const STRIP = Array(REPS).fill(null).flatMap(() => FRUITS);

function Reel({ onMount }: { onMount: (el: HTMLDivElement | null) => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg bg-black border border-gray-700 flex-1"
      style={{ height: SLOT_H * VISIBLE }}
    >
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
      <div
        className="absolute inset-x-0 z-10 pointer-events-none border-y border-yellow-500/40 bg-yellow-400/5"
        style={{ top: SLOT_H, height: SLOT_H }}
      />
      <div ref={onMount} className="will-change-transform">
        {STRIP.map((f, i) => (
          <div key={i} className="flex items-center justify-center select-none"
               style={{ height: SLOT_H, fontSize: 22, lineHeight: 1 }}>
            {f.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Phase = "idle" | "spinning" | "result";

interface JackpotCardProps {
  outOfStockSlugs?: string[];
  onPhaseChange?: (phase: Phase) => void;
}

export default function JackpotCard({ outOfStockSlugs = [], onPhaseChange }: JackpotCardProps) {
  const { addToCart } = useCart();
  const [phase, setPhase]             = useState<Phase>("idle");
  const [result, setResult]           = useState<number[] | null>(null);
  const [added, setAdded]             = useState(false);
  const [leverActive, setLeverActive] = useState(false);

  const activeFruits = FRUITS.filter(f => !outOfStockSlugs.includes(f.slug));

  const strips  = useRef<(HTMLDivElement | null)[]>(Array(5).fill(null));
  const ys      = useRef<number[]>([...INIT_YS]);
  const animIds = useRef<number[]>(Array(5).fill(0));
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Expose phase to parent on change
  useEffect(() => {
    if (onPhaseChange) onPhaseChange(phase);
  }, [phase, onPhaseChange]);


  useEffect(() => {
    strips.current.forEach((el, i) => {
      if (el) el.style.transform = `translateY(${INIT_YS[i]}px)`;
    });
  }, []);

  const spin = useCallback(() => {
    if (phase === "spinning") return; // chặn khi đang quay, cho phép respin từ result

    setPhase("spinning");
    setResult(null);
    setAdded(false);
    setLeverActive(true);
    setTimeout(() => setLeverActive(false), 500);

    const targets = Array(5).fill(0).map(() => {
      const pick = activeFruits[Math.floor(Math.random() * activeFruits.length)];
      return FRUITS.findIndex(f => f.slug === pick.slug);
    });

    // Clear transitions còn sót lại từ lần result trước để loop chạy mượt
    strips.current.forEach((el, i) => {
      if (!el) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${INIT_YS[i]}px)`;
    });
    ys.current = [...INIT_YS];

    tickRef.current = setInterval(playTick, 90);

    function loop(i: number) {
      ys.current[i] -= SPEEDS[i];
      if (ys.current[i] < -(REPS * 5 * SLOT_H * 0.5)) {
        ys.current[i] += REPS * 5 * SLOT_H * 0.35;
      }
      const el = strips.current[i];
      if (el) el.style.transform = `translateY(${ys.current[i]}px)`;
      animIds.current[i] = requestAnimationFrame(() => loop(i));
    }

    for (let i = 0; i < 5; i++) loop(i);

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        cancelAnimationFrame(animIds.current[i]);
        playTing(880 + i * 110);

        const el = strips.current[i];
        if (!el) return;

        const curY  = ys.current[i];
        const fi    = targets[i];
        const kMin  = Math.ceil((1 - curY / SLOT_H)) + 5;
        const off   = ((fi - (kMin % 5)) + 5) % 5;
        const kLand = kMin + off;
        const landY = (1 - kLand) * SLOT_H;

        el.style.transition = "none";
        el.style.transform  = `translateY(${curY}px)`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = `transform ${STOP_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
          el.style.transform  = `translateY(${landY}px)`;
        }));
      }, SPIN_MS + i * GAP_MS);
    }

    const totalMs = SPIN_MS + 4 * GAP_MS + STOP_MS + 200;
    setTimeout(() => {
      if (tickRef.current) clearInterval(tickRef.current);
      for (let i = 0; i < 5; i++) cancelAnimationFrame(animIds.current[i]);
      setResult(targets);
      setPhase("result");
      playTadaa();
    }, totalMs);
  }, [phase, activeFruits]);

  // Trigger spin via custom window event
  useEffect(() => {
    const handleTrigger = () => {
      if (phase === "idle" && activeFruits.length >= 2) {
        spin();
      }
    };
    window.addEventListener("trigger-jackpot-spin", handleTrigger);
    return () => window.removeEventListener("trigger-jackpot-spin", handleTrigger);
  }, [phase, activeFruits, spin]);

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setAdded(false);
    strips.current.forEach((el, i) => {
      if (!el) return;
      el.style.transition = "none";
      el.style.transform  = `translateY(${INIT_YS[i]}px)`;
    });
    ys.current = [...INIT_YS];
  }, []);

  const handleAdd = () => {
    if (!result) return;
    const { product, customFruits } = mapResult(result);
    addToCart(product, 1, false, customFruits);
    setAdded(true);
  };

  const mapped = result ? mapResult(result) : null;

  return (
    /* Standalone card — no col-span, used as a section element */
    <div className="relative rounded-2xl overflow-visible w-full">
      {/* Physical Lever/Handle on the right side - Vertical pull-down action! */}
      {activeFruits.length >= 2 && (
        <div className="absolute -right-5 top-[22%] w-10 h-32 z-30 select-none hidden sm:block">
          {/* Base socket sticking to the card - centered to match rod */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-5 h-5 bg-gradient-to-r from-gray-800 to-gray-700 rounded shadow-md border border-gray-600/30 z-20 shadow-md shadow-black/50" />
          
          {/* Lever Arm & Red Knob Container - centered above socket */}
          <div
            onClick={phase !== "spinning" ? spin : undefined}
            className="absolute left-1/2 -translate-x-1/2 bottom-2 w-8 h-28 cursor-pointer z-30"
          >
            {/* Metal Rod - Scales down vertically from bottom-2 */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-500 rounded-t-full origin-bottom shadow-inner"
              style={{
                height: "64px",
                bottom: "2px",
                transform: leverActive ? "scaleY(0.2)" : "scaleY(1)",
                transition: leverActive ? "transform 140ms ease-in" : "transform 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              }}
            />
            {/* Glowing Red Ball (Knob) - Moves straight down from top to bottom */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-red-400 via-red-500 to-red-700 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.85)] border border-red-400/30 hover:scale-110 active:scale-95 transition-all"
              style={{
                bottom: leverActive ? "10px" : "60px",
                transition: leverActive ? "bottom 140ms ease-in" : "bottom 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              }}
            />
          </div>
        </div>
      )}

      {/* Card body */}
      <div className="relative bg-gray-900 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 overflow-visible z-10 border border-gray-800 shadow-2xl shadow-black/50">

        {/* Header row: title + frog */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-yellow-400 jackpot-pulse">
              🎰 Vòng Quay May Mắn
            </p>
            <p className="text-[8px] text-gray-500 font-medium mt-0.5">Để vũ trụ chọn hộ bạn hôm nay</p>
          </div>
          <span className={`text-3xl leading-none select-none ${phase === "spinning" ? "animate-bounce" : ""}`}>🐸</span>
        </div>

        {/* 5 Reels — full width */}
        <div className="flex gap-1">
          {[0,1,2,3,4].map(i => (
            <Reel key={i} onMount={el => { strips.current[i] = el; }} />
          ))}
        </div>

        {/* Mobile-only "Gạt cần ngay thôi" spin button inside JackpotCard */}
        {activeFruits.length >= 2 && (
          <button
            onClick={spin}
            disabled={phase === "spinning"}
            className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs select-none lg:hidden bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg animate-glow-pulse active:scale-95 disabled:opacity-80 transition-all cursor-pointer disabled:cursor-not-allowed mt-1"
          >
            {phase === "spinning" ? "Đang quay..." : "Gạt cần ngay thôi"}
          </button>
        )}

        {/* Spin button status when suspended */}
        {activeFruits.length < 2 && (
          <div className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-center">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Tạm ngừng</p>
            <p className="text-[9px] text-gray-500 mt-0.5">Không đủ trái cây trong kho</p>
          </div>
        )}

        {/* Result overlay - covers entire card so title stays inside the frame */}
        {phase === "result" && mapped && (
          <div className="absolute inset-0 rounded-2xl bg-gray-900/98 backdrop-blur-sm flex flex-col items-center justify-center px-5 py-6 sm:px-6 sm:py-7 z-30 border border-gray-800">
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {Array(16).fill(0).map((_, i) => <Dot key={i} i={i} />)}
            </div>

            <div className="relative z-10 text-center w-full space-y-2 flex flex-col items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">✨ Vũ trụ gọi tên</p>

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-yellow-400/20 shadow-md">
                <img src={mapped.product.image_url} alt={mapped.product.name} className="w-full h-full object-cover" />
              </div>

              <p className="text-sm sm:text-base font-black text-white leading-tight break-words px-2 max-w-full text-center">
                {mapped.product.name}
              </p>

              {mapped.customFruits && (
                <p className="text-[8px] sm:text-[9px] text-gray-400 font-medium leading-none">{mapped.customFruits.join(" · ")}</p>
              )}

              <p className="text-sm sm:text-base font-black text-yellow-400 leading-none">{formatVND(mapped.product.price)}</p>

              <div className="flex gap-2 pt-1 w-full max-w-[240px]">
                <button
                  onClick={handleAdd}
                  disabled={added}
                  className={`flex-1 py-2 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all active:scale-95 ${
                    added
                      ? "bg-green-600 text-white"
                      : "bg-green-500 hover:bg-green-400 text-white shadow-md shadow-green-500/30"
                  }`}
                >
                  {added
                    ? "✓ Đã thêm!"
                    : <span className="flex items-center justify-center gap-1"><ShoppingCart size={10} /> Thêm giỏ</span>
                  }
                </button>
                <button
                  onClick={spin}
                  title="Quay lại"
                  className="px-2.5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                >
                  <RefreshCw size={11} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
