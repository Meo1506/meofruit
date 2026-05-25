"use client";
import { useEffect, useState } from "react";
import { formatSaleCountdown } from "@/lib/price";
import { Clock } from "lucide-react";

interface Props {
  saleUntil: string;
  className?: string;
  /** Tick interval (ms). Mặc định 60s để đỡ tốn render — vẫn đủ mượt cho "ngày/giờ/phút". */
  intervalMs?: number;
}

export default function SaleCountdown({ saleUntil, className = "", intervalMs = 60_000 }: Props) {
  const compute = () => Math.max(0, Date.parse(saleUntil) - Date.now());
  const [remaining, setRemaining] = useState<number>(compute);

  useEffect(() => {
    setRemaining(compute());
    const id = setInterval(() => setRemaining(compute()), intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleUntil, intervalMs]);

  if (remaining <= 0) return null;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Clock size={10} strokeWidth={3} />
      <span>Còn {formatSaleCountdown(remaining)}</span>
    </span>
  );
}
