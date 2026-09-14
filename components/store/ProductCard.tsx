"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { rupiah } from "@/lib/wa/template";
import { useCart } from "@/lib/cart/store";
import { useAddConfirm } from "@/lib/shop/sfx";
import { useShopStatus } from "@/lib/shop/useShopStatus";
import { countdownText, descOf, isDiscountActive, isPOActive, priceOf, timeProgress } from "@/lib/shop/product";
import { MAX_HINT } from "@/lib/cart/store";
import { PhotoPlaceholder } from "@/components/store/ui";

export function StockBadge({ stok }: { stok: number }) {
  if (stok === 0) return <span className="rounded-full bg-teks/10 px-2 py-0.5 text-[11px] font-bold text-teks">Habis</span>;
  if (stok <= 10) return <span className="rounded-full bg-aksen px-2 py-0.5 text-[11px] font-bold text-white">Mau Habis</span>;
  return <span className="text-[11px] font-semibold text-primer">Stok Aman</span>;
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function POLine({ p }: { p: Product }) {
  const now = useNow(!!p.poEndAt);
  if (!p.poEndAt) return null;
  const prog = timeProgress(p.poStartAt, p.poEndAt, now);
  return (
    <div className="mt-1.5" aria-live="off">
      <p className="text-[11px] font-bold text-aksen tabular-nums">⏳ {countdownText(p.poEndAt, now)} lagi</p>
      {prog != null && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-garis" aria-hidden>
          <div className="h-full rounded-full bg-aksen anim-300" style={{ width: `${Math.round(prog * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

export function DiskonLine({ p }: { p: Product }) {
  const now = useNow(!!p.discountExpiresAt);
  if (!p.discountExpiresAt) return null;
  const prog = timeProgress(undefined, p.discountExpiresAt, now);
  return (
    <div className="mt-1.5">
      <p className="text-[11px] font-bold text-aksen tabular-nums">🔥 {countdownText(p.discountExpiresAt, now)} lagi</p>
      {prog != null && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-garis" aria-hidden>
          <div className="h-full rounded-full bg-aksen anim-300" style={{ width: `${Math.round(prog * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

export function ProductCard({ p, compact, i = 0 }: { p: Product; compact?: boolean; i?: number }) {
  const { lines, add, hint } = useCart();
  const { masuk, pulse, fire } = useAddConfirm();
  const now = new Date();
  const habis = p.stok === 0;
  const diskon = isDiscountActive(p, now);
  const harga = priceOf(p, now);
  const inCart = lines.find((l) => l.productId === p.id)?.qty ?? 0;
  const mentok = !habis && inCart >= p.stok;
  const tutup = !useShopStatus().open;

  function tambah() {
    if (tutup) return;
    add({ productId: p.id, nama: p.nama, harga, qty: 1, stok: p.stok, isPO: p.isPO });
    fire();
  }

  return (
    <div
      className={`stagger rounded-[18px] border border-garis bg-kartu p-2.5 shadow-card [@media(hover:hover)]:hover:-translate-y-[2px] [@media(hover:hover)]:hover:shadow-float ${habis ? "opacity-55" : ""} ${pulse ? "pulse-once" : ""}`}
      style={{ "--d": `${Math.min(i, 5) * 40}ms` } as React.CSSProperties}
    >
      <Link href={`/produk/${p.slug}`} className="block">
        <div className="aspect-square overflow-hidden rounded-[12px]" aria-hidden>
          {p.foto ? <img src={p.foto} alt="" className="h-full w-full object-cover" loading="lazy" /> : <PhotoPlaceholder />}
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-[13px] font-semibold text-teks">{p.nama}</p>
        <p className="text-[11px] text-teks2">{p.kategori}{p.satuan ? ` • ${p.satuan}` : ""}</p>
        {descOf(p) ? <p className="mt-0.5 line-clamp-1 text-[11px] text-teks2">{descOf(p)}</p> : null}
        {diskon ? (
          <p className="mt-1 text-sm tabular-nums"><span className="mr-1.5 text-xs text-teks2 line-through">{rupiah(p.harga)}</span>
            <span className="font-extrabold text-aksen">{rupiah(harga)}</span></p>
        ) : (
          <p className="mt-1 text-sm font-extrabold text-primer tabular-nums">{rupiah(harga)}</p>
        )}
        <p className="mt-0.5 text-[11px] font-bold text-teks2 tabular-nums">Stok: {p.stok}</p>
        <div className="mt-1 flex items-center gap-1"><StockBadge stok={p.stok} />
          {p.isPO && isPOActive(p, now) && <span className="rounded-full border border-emas px-2 py-0.5 text-[11px] font-bold text-emas">PO</span>}
        </div>
      </Link>
      {p.isPO && isPOActive(p, now) && <POLine p={p} />}
      {diskon && <DiskonLine p={p} />}
      <button
        disabled={habis || mentok || tutup} aria-disabled={tutup} aria-label={`Tambah ${p.nama}`}
        title={tutup ? "Tutup" : mentok ? MAX_HINT : undefined}
        onClick={tambah}
        className={habis || tutup
          ? "pressable mt-2 grid h-10 w-full place-items-center rounded-[14px] bg-garis text-sm font-bold text-teks2 disabled:opacity-40"
          : masuk
            ? "pressable mt-2 grid h-10 w-full place-items-center rounded-[14px] bg-primer text-sm font-extrabold text-white disabled:opacity-40"
            : "pressable btn-lift mt-2 grid h-10 w-full place-items-center rounded-[14px] bg-aksen text-sm font-extrabold text-white disabled:opacity-40"}>
        {tutup ? "Tutup" : habis ? "Habis" : mentok ? MAX_HINT : masuk ? "Masuk ✓" : compact ? "Tambah" : "Tambah"}
      </button>
      {hint && mentok && <p className="mt-1 text-[11px] font-bold text-aksen">{hint}</p>}
    </div>
  );
}
