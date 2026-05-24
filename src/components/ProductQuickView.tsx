"use client";
import { useState, useEffect } from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SettingsContext";
import { formatVND, getEffectivePrice, isOnSale, getDiscountPercent } from "@/lib/price";
import { X, Plus, Minus, ShoppingCart, Check, Sliders, Copy } from "lucide-react";

const FRUIT_OPTIONS = [
  { name: "Xoài",    emoji: "🥭" },
  { name: "Ổi",      emoji: "🍏" },
  { name: "Mận",     emoji: "🍑" },
  { name: "Dưa hấu", emoji: "🍉" },
  { name: "Quýt",    emoji: "🍊" },
];

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl transition-all text-left w-full group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-sm font-black text-gray-900 truncate">{value}</p>
      </div>
      <div className="flex-shrink-0">
        {copied
          ? <Check size={14} className="text-green-600" strokeWidth={3} />
          : <Copy size={13} className="text-gray-300 group-hover:text-green-500 transition-colors" />
        }
      </div>
    </button>
  );
}

interface Props {
  product: Product;
  onClose: () => void;
  outOfStockFruitNames?: string[];
}

export default function ProductQuickView({ product, onClose, outOfStockFruitNames = [] }: Props) {
  const { addToCart } = useCart();
  const settings = useSiteSettings();
  const [quantity, setQuantity] = useState(1);
  const [selectedFruits, setSelectedFruits] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  const isCustomMix = product.product_type === "custom_mix";
  const unitPrice   = getEffectivePrice(product);
  const onSale      = isOnSale(product);
  const discountPct = getDiscountPercent(product);
  const canConfirm  = isCustomMix ? selectedFruits.length >= 2 : quantity >= 1;
  const totalPrice  = unitPrice * (isCustomMix ? 1 : quantity);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const toggleFruit = (name: string) =>
    setSelectedFruits(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );

  const handleAdd = (openSidebar: boolean) => {
    if (!canConfirm) return;
    addToCart(
      { ...product, price: unitPrice, price_formatted: formatVND(unitPrice) },
      isCustomMix ? 1 : quantity,
      !openSidebar,
      isCustomMix ? selectedFruits : undefined
    );
    setAdded(true);
    setTimeout(() => { setAdded(false); if (openSidebar) onClose(); }, 1100);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/*
        Chiều cao tự co giãn theo nội dung, không được vượt 92vh (mobile) / 90vh (desktop).
        Layout: mobile = stack dọc | sm+ = 2 cột ngang.
      */}
      <div className="
        relative z-10 bg-white shadow-2xl overflow-hidden
        w-full sm:max-w-[680px]
        rounded-t-[2rem] sm:rounded-[2rem]
        animate-slide-up-sheet sm:animate-none
        flex flex-col sm:flex-row
        max-h-[92vh] sm:max-h-[90vh]
      ">

        {/* ══ LEFT: Image (full height, no scroll) ══ */}
        <div className="relative sm:w-[40%] flex-shrink-0 h-[210px] sm:h-auto sm:min-h-full">
          <img
            src={product.image_url || "/images/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Category + unit */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <span className="bg-white/90 backdrop-blur-sm text-green-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
              {product.category}
            </span>
            <span className="bg-white/90 backdrop-blur-sm text-gray-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
              Hộp 750ml
            </span>
          </div>
          {onSale && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">
              -{discountPct}%
            </span>
          )}
          {isCustomMix && (
            <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-green-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow">
              <Sliders size={9} /> Tự chọn
            </span>
          )}
        </div>

        {/* ══ RIGHT: Info + Controls + Payment ══ */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">

          {/* — Name / Price / Close — */}
          <div className="px-5 pt-4 pb-3 flex-shrink-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="font-black text-gray-900 text-base sm:text-lg leading-tight line-clamp-2 tracking-tight flex-1">
                {product.name}
              </h2>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            {product.description && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                {product.description}
              </p>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-red-600">{formatVND(unitPrice)}</span>
              {onSale && (
                <span className="text-xs text-gray-400 line-through">{formatVND(product.price)}</span>
              )}
              <span className="text-[10px] text-gray-400 font-bold uppercase">/hộp</span>
            </div>
          </div>

          <div className="mx-5 h-px bg-gray-100 flex-shrink-0" />

          {/* — Controls (qty hoặc fruit picker) — */}
          <div className="px-5 py-3 flex-shrink-0">
            {isCustomMix ? (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                  <Sliders size={10} /> Chọn trái cây
                  <span className={`ml-1 font-bold ${selectedFruits.length >= 2 ? "text-green-600" : "text-orange-400"}`}>
                    ({selectedFruits.length}/5 · tối thiểu 2)
                  </span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
                  {FRUIT_OPTIONS.map(({ name, emoji }) => {
                    const sel = selectedFruits.includes(name);
                    const oos = outOfStockFruitNames.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => !oos && toggleFruit(name)}
                        disabled={oos}
                        className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl border-2 transition-all ${
                          oos
                            ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                            : sel
                            ? "border-green-500 bg-green-50 shadow-sm"
                            : "border-gray-100 bg-gray-50 hover:border-gray-200"
                        }`}
                      >
                        <span className="text-xl leading-none">{emoji}</span>
                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-tight leading-none">{name}</span>
                        {oos
                          ? <span className="text-[8px] text-red-400 font-bold">Hết</span>
                          : sel && <Check size={10} className="text-green-500" strokeWidth={3} />
                        }
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">Số lượng</p>
                  <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <Minus size={13} strokeWidth={3} />
                    </button>
                    <span className="w-9 text-center font-black text-gray-900 text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <Plus size={13} strokeWidth={3} />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Tổng</p>
                  <p className="text-lg font-black text-red-600 leading-tight">{formatVND(totalPrice)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mx-5 h-px bg-gray-100 flex-shrink-0" />

          {/* — Thông tin thanh toán nhanh — */}
          <div className="px-5 py-3 flex-shrink-0 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Thanh toán nhanh</p>
            <div className="grid grid-cols-2 gap-2">
              <CopyChip label={`STK · ${settings.bankAccount.bank}`} value={settings.bankAccount.number} />
              <CopyChip label="Zalo liên hệ" value={settings.contact.zalo} />
            </div>
            <p className="text-[9px] text-gray-400 leading-relaxed">
              Chủ TK: <span className="font-bold text-gray-600">{settings.bankAccount.owner}</span>
              &nbsp;·&nbsp;Nội dung: <span className="font-bold text-gray-600">SĐT + tên SP</span>
            </p>
          </div>

          {/* — CTA — luôn pinned dưới cùng — */}
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => handleAdd(false)}
                disabled={!canConfirm || added}
                title="Thêm vào giỏ (không mở sidebar)"
                className={`p-3 rounded-xl border-2 transition-all flex-shrink-0 ${
                  added
                    ? "bg-green-600 border-green-600 text-white"
                    : canConfirm
                    ? "border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-600"
                    : "border-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                {added ? <Check size={18} strokeWidth={3} /> : <ShoppingCart size={18} strokeWidth={2} />}
              </button>

              <button
                onClick={() => handleAdd(true)}
                disabled={!canConfirm}
                className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                  canConfirm
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-100 active:scale-95"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isCustomMix && !canConfirm
                  ? `Chọn thêm ${2 - selectedFruits.length} loại`
                  : added ? "✓ Đã thêm!" : "Mua ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
