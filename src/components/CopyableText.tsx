"use client";
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyableTextProps {
  text: string;
  label?: string;
  className?: string;
}

export default function CopyableText({ text, label, className = "" }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={handleCopy}
      className={`group relative cursor-pointer flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-black/5 transition-all ${className}`}
      title={`Bấm để copy ${label || ""}`}
    >
      <span className="truncate">{text}</span>
      <div className="ml-2 flex-shrink-0">
        {copied ? (
          <Check size={14} className="text-green-500 animate-in zoom-in duration-200" />
        ) : (
          <Copy size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      
      {/* Mini Toast */}
      {copied && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 animate-in slide-in-from-bottom-1">
          Đã copy!
        </div>
      )}
    </div>
  );
}
