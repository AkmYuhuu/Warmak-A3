"use client";
import { useEffect, useMemo, useState } from "react";
import { useLive } from "@/lib/db/repos";
import type { Product } from "@/lib/db/schema";
import { ProductCard } from "@/components/store/ProductCard";
import { BottomNav, CategoryChips } from "@/components/store/Nav";
import { CatalogTabs, type CatalogMode } from "@/components/store/CatalogTabs";
import { HeroMobile } from "@/components/store/HeroSlider";
import ShopBadge from "@/components/store/ShopBadge";
import BrandLogo from "@/components/store/BrandLogo";
import SyncBadge from "@/components/system/SyncBadge";
import { CardSkeleton, SectionHead } from "@/components/store/ui";
import { isDiscountActive, isPOActive } from "@/lib/shop/product";

// MOBILE: header ramping ≤132px sticky, promo+tabs tak sticky, slider 16:9, grid 2 kolom
export default function HomeMobile() {
  const { products: allProducts, loading, error } = useLive();
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("Semua");
  const [mode, setMode] = useState<CatalogMode>("product");

  const cats = useMemo(
    () => ["Semua", ...Array.from(new Set(allProducts.filter((p) => p.aktif).map((p) => p.kategori))).sort()],
    [allProducts],
  );

  const products = useMemo(() => {
    let r = allProducts.filter((p) => p.aktif);
    if (q) {
      const qq = q.toLowerCase();
      r = r.filter((p) => p.nama.toLowerCase().includes(qq));
    }
    if (mode === "product" && kat !== "Semua") r = r.filter((p) => p.kategori === kat);
    return r.sort((a, b) => (a.stok === 0 ? 1 : 0) - (b.stok === 0 ? 1 : 0) || a.nama.localeCompare(b.nama));
  }, [allProducts, q, kat, mode]);

  const shown = useMemo(() => {
    const now = new Date();
    if (mode === "po") return products.filter((p) => isPOActive(p, now));
    if (mode === "diskon") return products.filter((p) => isDiscountActive(p, now));
    return products.filter((p) => !p.isPO);
  }, [products, mode]);

  const titles: Record<CatalogMode, string> = { product: "Belanja", po: "PO Product", diskon: "Diskon" };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-bg pb-28">
      <div className="sticky top-0 z-30 max-h-[132px] overflow-hidden border-b border-garis bg-kartu/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4 pt-2.5">
          <BrandLogo />
          <p className="font-display text-xl font-bold text-primer">Warmak A3</p>
          <ShopBadge />
          <SyncBadge />
        </div>
        <div className="flex items-center gap-2 px-4 pb-2.5 pt-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari beras, minyak, telur…"
            className="h-12 w-full rounded-[14px] border border-garis bg-bg px-3.5 text-sm outline-none focus:border-primer" aria-label="Cari produk" />
          {q && <button onClick={() => setQ("")} aria-label="Hapus pencarian"
            className="pressable grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-bg text-teks2 ring-1 ring-garis">✕</button>}
        </div>
      </div>

      <CatalogTabs mode={mode} onPick={setMode} />
      {mode === "product" && <CategoryChips list={cats} aktif={kat} onPick={setKat} />}

      <div className="px-4 pt-1">
        <HeroMobile />
      </div>

      <div className="px-4 pt-4" id="katalog">
        <SectionHead title={titles[mode]} right={<span className="text-[11px] font-semibold text-teks2 tabular-nums">{shown.length} barang</span>} />
      </div>
      {!loading && !error ? (
        mode === "po" && shown.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm font-bold text-teks2">Belum ada barang PO</p>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-2.5 px-4 pt-3 [&>*]:min-w-0" key={mode + kat + q}>
            {shown.map((p, i) => <ProductCard key={p.id} p={p} compact i={i} />)}
          </div>
        )
      ) : null}
      {loading && (
        <div className="grid grid-cols-2 items-stretch gap-2.5 px-4 pt-3 [&>*]:min-w-0">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}
      {error && (
        <p role="alert" className="mx-4 mt-3 rounded-[18px] border border-garis bg-kartu p-6 text-center text-sm font-bold text-[#DC2626]">
          {error}
          <button onClick={() => window.location.reload()} className="mt-2 block w-full rounded-[14px] bg-primer py-2.5 text-sm font-extrabold text-white">Muat ulang</button>
        </p>
      )}
      {!loading && !error && mode !== "po" && shown.length === 0 && <p className="px-4 py-10 text-center text-sm text-teks2">Produk tidak ditemukan.</p>}
      <BottomNav />
    </main>
  );
}
