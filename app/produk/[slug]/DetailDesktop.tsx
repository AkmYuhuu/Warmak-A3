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
import { PhotoPlaceholder } from "@/components/store/ui";
import { descOf, isDiscountActive, isPOActive, priceOf } from "@/lib/shop/product";

// Desktop detail: 520 foto + 480 info + tab
export default function DetailDesktop({ slug }: { slug: string }) {
  const [p, setP] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const { masuk, pulse, fire } = useAddConfirm();
  const [tab, setTab] = useState<"deskripsi" | "stok">("deskripsi");
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const { add } = useCart();
  useEffect(() => {
    fetchProductBySlug(slug)
      .then((r) => setP(r ?? null))
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "Gagal memuat produk."));
  }, [slug]);
  if (loadErr && !p) return <main className="mx-auto max-w-[1200px] p-10"><p role="alert" className="rounded-[18px] border border-garis bg-kartu p-6 text-center text-sm font-bold text-[#DC2626]">{loadErr} <button onClick={() => window.location.reload()} className="mt-2 block w-full rounded-[14px] bg-primer py-2.5 text-sm font-extrabold text-white">Muat ulang</button></p></main>;
  if (!p) return <main className="mx-auto max-w-[1200px] p-10 text-sm text-teks2">Memuat…</main>;
  const habis = p.stok === 0;
  const now = new Date();
  const diskon = isDiscountActive(p, now);
  const harga = priceOf(p, now);
  const mentok = !habis && qty >= p.stok;
  const tutup = !useShopStatus().open;
  function tambah() {
    if (tutup) return;
    add({ productId: p!.id, nama: p!.nama, harga, qty, stok: p!.stok, isPO: p!.isPO });
    fire();
  }
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <Link href="/" className="text-sm font-bold text-primer">← Belanja</Link>
        <div className="mt-3 flex gap-6">
          <div className="aspect-[4/3] w-[520px] shrink-0 overflow-hidden rounded-[18px] border border-garis bg-kartu shadow-card" aria-hidden>
            {p.foto ? <img src={p.foto} alt={p.nama} className="h-full w-full object-cover" /> : <PhotoPlaceholder tall />}
          </div>
          <div className={`w-[480px] shrink-0 rounded-[18px] border border-garis bg-kartu p-6 shadow-card ${pulse ? "pulse-once" : ""}`}>
            <StockBadge stok={p.stok} />
            <h1 className="font-display mt-1 text-2xl font-semibold">{p.nama}</h1>
            <p className="text-xs text-teks2 tabular-nums">{p.kategori} • Stok: {p.stok}</p>
            {diskon ? (
              <p className="mt-3 tabular-nums"><span className="mr-2 text-base text-teks2 line-through">{rupiah(p.harga)}</span>
                <span className="text-3xl font-extrabold text-aksen">{rupiah(harga)}</span></p>
            ) : (
              <p className="mt-3 text-3xl font-extrabold text-primer tabular-nums">{rupiah(harga)}</p>
            )}
            {p.isPO && isPOActive(p, now) && <POLine p={p} />}
            {diskon && <DiskonLine p={p} />}
            <div className="mt-4 flex gap-2 border-b border-garis" role="tablist">
              {(["deskripsi", "stok"] as const).map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={`pressable px-3 py-2 text-sm font-bold capitalize ${tab === t ? "border-b-2 border-primer text-primer" : "text-teks2"}`}>{t}</button>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              {tab === "deskripsi" ? (descOf(p) || "Produk sembako dari Warmak A3.") : `Sisa stok ${p.stok} ${p.satuan ?? "pcs"}. ${habis ? "Stok habis, cek kembali besok." : p.stok <= 10 ? "Stok menipis, segera pesan." : "Stok aman."}`}
            </p>
            {p.expiredAt && <p className="mt-1 text-xs font-bold text-teks2 tabular-nums">Expired: {p.expiredAt}</p>}
            {mentok && <p role="status" className="mt-1 text-xs font-bold text-aksen">{MAX_HINT}</p>}
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setQty((v) => Math.max(1, v - 1))} className="pressable h-10 w-10 rounded-[14px] ring-1 ring-garis tabular-nums" aria-label="Kurangi">−</button>
              <span className="w-8 text-center font-extrabold tabular-nums">{qty}</span>
              <button onClick={() => setQty((v) => Math.min(Math.max(1, p.stok), v + 1))} className="pressable h-10 w-10 rounded-[14px] ring-1 ring-garis tabular-nums" aria-label="Tambah">+</button>
              <button disabled={habis || tutup} aria-disabled={tutup} title={tutup ? "Tutup" : undefined} onClick={tambah}
                className={habis || tutup
                  ? "pressable ml-2 flex-1 rounded-[14px] bg-garis py-3 text-sm font-bold text-teks2 disabled:opacity-40"
                  : masuk
                    ? "pressable ml-2 flex-1 rounded-[14px] bg-primer py-3 text-sm font-extrabold text-white disabled:opacity-40"
                    : "pressable btn-lift ml-2 flex-1 rounded-[14px] bg-aksen py-3 text-sm font-extrabold text-white disabled:opacity-40"}>
                {tutup ? "Tutup" : habis ? "Habis" : masuk ? "Masuk ✓" : "Tambah ke Keranjang"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
