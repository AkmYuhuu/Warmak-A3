"use client";
import { useShopStatus } from "@/lib/shop/useShopStatus";

export default function ShopBadge({ big }: { big?: boolean }) {
  const s = useShopStatus();
  return (
    <span role="status"
      className={`anim-200 inline-flex items-center gap-1 rounded-full font-bold text-white ${big ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]"}`}
      style={{ background: s.open ? "#16A34A" : "#DC2626" }}>
      <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
      {s.label}
    </span>
  );
}
