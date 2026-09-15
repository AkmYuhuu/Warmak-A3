"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProductBySlug } from "@/lib/db/repos";
import type { Product } from "@/lib/db/schema";
import { rupiah } from "@/lib/wa/template";
import { useCart, MAX_HINT } from "@/lib/cart/store";
import { useAddConfirm } from "@/lib/shop/sfx";
import { useShopStatus } from "@/lib/shop/useShopStatus";
import { StockBadge, DiskonLine, POLine } from "@/components/store/ProductCard";
import { PhotoPlaceholder, CardSkeleton } from "@/components/store/ui";
import { descOf, isDiscountActive, isPOActive, priceOf } from "@/lib/shop/product";

// Mobile detail: foto 4:3 bingkai + sticky-bar
export default function DetailMobile({ slug }: { slug: string }) {
  const [p, setP] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const { masuk, pulse, fire } = useAddConfirm();
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const { add } = useCart();
  const shopOpen = useShopStatus().open;
  useEffect(() => {
    fetchProductBySlug(slug)
      .then((r) => {
        if (!r) setLoadErr("Produk tidak ditemukan.");
        else setP(r);
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "Gagal memuat produk."));
  }, [slug]);
  if (loadErr && !p) return <main className="mx-auto max-w-md p-4"><p role="alert" className="rounded-[18px] border border-garis bg-kartu p-6 text-center text-sm font-bold text-[#DC2626]">{loadErr} <Link href="/" className="mt-2 block w-full rounded-[14px] bg-primer py-2.5 text-sm font-extrabold text-white">Kembali belanja</Link></p></main>;
  if (!p) return <main className="mx-auto max-w-md p-4"><CardSkeleton /></main>;
  const habis = p.stok === 0;
  const now = new Date();
  const diskon = isDiscountActive(p, now);
  const harga = priceOf(p, now);
  const mentok = !habis && qty >= p.stok;
  const tutup = !shopOpen;
  function tambah() {
    if (tutup) return;
    add({ productId: p!.id, nama: p!.nama, harga, qty, stok: p!.stok, isPO: p!.isPO });
    fire();
  }
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-bg pb-28">
      <div className="bg-kartu px-4 py-3"><Link href="/" className="text-sm font-bold text-primer">← Belanja</Link></div>
      <div className="px-4">
        <div className="aspect-[4/3] overflow-hidden rounded-[18px] border border-garis bg-kartu shadow-card" aria-hidden>
          {p.foto ? <img src={p.foto} alt="" className="h-full w-full object-cover" /> : <PhotoPlaceholder tall />}
        </div>
      </div>
      <div className={`px-4 pt-3 ${pulse ? "pulse-once rounded-[18px]" : ""}`}>
        <StockBadge stok={p.stok} />
        <h1 className="font-display mt-1 text-xl font-semibold">{p.nama}</h1>
        <p className="text-xs text-teks2 tabular-nums">{p.kategori}{p.satuan ? ` • per ${p.satuan}` : ""} • Stok: {p.stok}</p>
        {diskon ? (
          <p className="mt-2 tabular-nums"><span className="mr-2 text-sm text-teks2 line-through">{rupiah(p.harga)}</span>
            <span className="text-2xl font-extrabold text-aksen">{rupiah(harga)}</span></p>
        ) : (
          <p className="mt-2 text-2xl font-extrabold text-primer tabular-nums">{rupiah(harga)}</p>
        )}
        {p.isPO && isPOActive(p, now) && <POLine p={p} />}
        {diskon && <DiskonLine p={p} />}
        <p className="mt-3 text-sm leading-relaxed">{descOf(p) || "Produk sembako segar dari Warmak A3."}</p>
        {p.expiredAt && <p className="mt-1 text-xs font-bold text-teks2 tabular-nums">Expired: {p.expiredAt}</p>}
        {mentok && <p role="status" className="mt-1 text-xs font-bold text-aksen">{MAX_HINT}</p>}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-md grid-cols-2 gap-2 border-t border-garis bg-kartu p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex min-h-[44px] items-center justify-center gap-1 rounded-[14px] ring-1 ring-garis">
          <button onClick={() => setQty((v) => Math.max(1, v - 1))} className="pressable grid h-11 w-11 place-items-center text-lg tabular-nums" aria-label="Kurangi">−</button>
          <span className="min-w-8 text-center font-extrabold tabular-nums" aria-live="polite">{qty}</span>
          <button onClick={() => setQty((v) => Math.min(Math.max(1, p.stok), v + 1))} className="pressable grid h-11 w-11 place-items-center text-lg tabular-nums" aria-label="Tambah">+</button>
        </div>
        <button disabled={habis || tutup} aria-disabled={tutup} title={tutup ? "Tutup" : undefined} onClick={tambah}
          className={habis || tutup
            ? "pressable rounded-[14px] bg-garis py-3 text-sm font-bold text-teks2 disabled:opacity-40"
            : masuk
              ? "pressable rounded-[14px] bg-primer py-3 text-sm font-extrabold text-white disabled:opacity-40"
              : "pressable btn-lift rounded-[14px] bg-aksen py-3 text-sm font-extrabold text-white disabled:opacity-40"}>
          {tutup ? "Tutup" : habis ? "Habis" : masuk ? "Masuk ✓" : "+ Keranjang"}
        </button>
      </div>
    </main>
  );
}
