"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLive } from "@/lib/db/repos";
import type { Product } from "@/lib/db/schema";
import { useCart } from "@/lib/cart/store";
import { MAX_HINT } from "@/lib/cart/store";
import { playPop } from "@/lib/shop/sfx";
import { useShopStatus } from "@/lib/shop/useShopStatus";
import { useMountedTransition } from "@/lib/anim/useMountedTransition";
import { ProductCard } from "@/components/store/ProductCard";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { CatalogTabs, type CatalogMode } from "@/components/store/CatalogTabs";
import { HeroDesktop } from "@/components/store/HeroSlider";
import ShopBadge from "@/components/store/ShopBadge";
import BrandLogo from "@/components/store/BrandLogo";
import SyncBadge from "@/components/system/SyncBadge";
import { CardSkeleton, SectionHead } from "@/components/store/ui";
import { rupiah } from "@/lib/wa/template";
import { isDiscountActive, isPOActive } from "@/lib/shop/product";

const HARGA: { id: string; label: string; min: number; max: number }[] = [
  { id: "semua", label: "Semua harga", min: 0, max: Infinity },
  { id: "hemat", label: "Di bawah 10rb", min: 0, max: 10000 },
  { id: "sedang", label: "10–25rb", min: 10000, max: 25000 },
  { id: "besar", label: "Di atas 25rb", min: 25000, max: Infinity },
];

// DESKTOP: header 1200 2 baris + emas, sidebar 240, slider 21:9, grid 4-5, drawer 400 + modal 560
export default function HomeDesktop() {
  const { products: allProducts, loading, error } = useLive();
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("Semua");
  const [hargaId, setHargaId] = useState("semua");
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<CatalogMode>("product");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { lines, count, subtotal, setQty, remove, hint } = useCart();
  const tutup = !useShopStatus().open;
  const cartT = useMountedTransition(cartOpen, 220);
  const checkoutT = useMountedTransition(checkoutOpen, 220);
  const hintT = useMountedTransition(!!hint, 200);

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

  // Dibuka FloatingCart via CustomEvent open-cart (desktop)
  useEffect(() => {
    const onOpen = (e: Event) => { e.preventDefault(); setCartOpen(true); };
    window.addEventListener("open-cart", onOpen);
    return () => window.removeEventListener("open-cart", onOpen);
  }, []);

  // Kabari FloatingCart saat drawer checkout terbuka (agar sembunyi)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("warmak:checkout", { detail: { open: checkoutOpen } }));
  }, [checkoutOpen]);

  const shown = useMemo(() => {
    const now = new Date();
    const hb = HARGA.find((h) => h.id === hargaId) ?? HARGA[0];
    let r = mode === "po" ? products.filter((p) => isPOActive(p, now))
      : mode === "diskon" ? products.filter((p) => isDiscountActive(p, now))
      : products.filter((p) => !p.isPO);
    r = r.filter((p) => p.harga >= hb.min && p.harga < hb.max);
    if (ready) r = r.filter((p) => p.stok > 0);
    return r;
  }, [products, mode, hargaId, ready]);

  const titles: Record<CatalogMode, string> = { product: "Belanja", po: "PO Product", diskon: "Diskon" };

  return (
    <main className="min-h-screen bg-bg">
      <header className="relative overflow-hidden border-b border-garis bg-kartu">
        <div className="kawung pointer-events-none absolute inset-y-0 right-0 w-96 opacity-[0.05]" aria-hidden />
        <div className="relative mx-auto flex max-w-[1200px] items-center gap-4 px-6 py-3">
          <BrandLogo desktop />
          <p className="shrink-0 whitespace-nowrap font-display text-2xl font-bold text-primer">Warmak A3</p>
          <ShopBadge big />
          <SyncBadge />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari beras, minyak, telur…"
            className="ml-auto h-11 w-[480px] rounded-[14px] border border-garis bg-bg px-4 text-sm outline-none focus:border-primer" aria-label="Cari produk" />
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener"
            className="pressable rounded-[14px] px-4 py-2.5 text-sm font-bold text-primer ring-1 ring-primer">
            WA Toko
          </a>
          <button onClick={() => setCartOpen(true)}
            className="pressable btn-lift relative rounded-[14px] bg-primer px-4 py-2.5 text-sm font-extrabold text-white shadow-btn">
            🛒 Keranjang
            {count > 0 && <span key={count} className="pop absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-aksen px-1.5 text-xs font-bold tabular-nums">{count}</span>}
          </button>
        </div>
        <div className="relative mx-auto flex max-w-[1200px] items-center gap-4 px-6 pb-3">
          <CatalogTabs mode={mode} onPick={setMode} desktop />
          <p className="ml-auto hidden text-xs text-teks2 lg:block">Buka tiap hari • Gratis ongkir radius 1 km</p>
        </div>
        <div className="h-px bg-emas" aria-hidden />
      </header>

      <div className="mx-auto flex max-w-[1200px] gap-6 px-6 py-6">
        {mode === "product" && (
        <aside className="sticky top-6 hidden h-fit w-[240px] shrink-0 rounded-[18px] border border-garis bg-kartu p-4 shadow-card md:block" aria-label="Filter">
          <SideTitle title="Kategori" />
          <div className="mt-2 flex flex-col gap-1">
            {cats.map((c) => (
              <button key={c} onClick={() => setKat(c)}
                className={`pressable rounded-lg px-3 py-2 text-left text-sm font-bold ${kat === c ? "bg-primer text-white" : "text-teks hover:bg-bg"}`}>{c}</button>
            ))}
          </div>
          <SideTitle title="Harga" />
          <div className="mt-2 flex flex-col gap-1">
            {HARGA.map((h) => (
              <button key={h.id} onClick={() => setHargaId(h.id)}
                className={`pressable rounded-lg px-3 py-2 text-left text-sm font-bold ${hargaId === h.id ? "bg-primer text-white" : "text-teks hover:bg-bg"}`}>{h.label}</button>
            ))}
          </div>
          <SideTitle title="Ketersediaan" />
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold hover:bg-bg">
            <input type="checkbox" checked={ready} onChange={(e) => setReady(e.target.checked)} className="h-4 w-4 accent-[#0C5B40]" />
            Ready saja
          </label>
        </aside>
        )}

        <section className="min-w-0 flex-1" id="katalog">
          <HeroDesktop />
          <div className="pt-5"><SectionHead title={titles[mode]} right={<span className="text-xs font-semibold text-teks2 tabular-nums">{shown.length} barang</span>} /></div>
          {!loading && !error ? (
            mode === "po" && shown.length === 0 ? (
              <p className="py-14 text-center text-sm font-bold text-teks2">Belum ada barang PO</p>
            ) : (
              <div className="mt-4 grid grid-cols-4 gap-4 xl:grid-cols-5" key={mode + kat + hargaId + String(ready)}>
                {shown.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
              </div>
            )
          ) : null}
          {loading && (
            <div className="mt-4 grid grid-cols-4 gap-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-[18px] border border-garis bg-kartu p-6 text-center text-sm font-bold text-[#DC2626]">
              {error}
              <button onClick={() => window.location.reload()} className="mx-auto mt-2 block w-64 rounded-[14px] bg-primer py-2.5 text-sm font-extrabold text-white">Muat ulang</button>
            </p>
          )}
          {!loading && !error && mode !== "po" && shown.length === 0 && <p className="py-10 text-center text-sm text-teks2">Produk tidak ditemukan.</p>}
        </section>
      </div>

      {cartT.mounted && (
        <div className="fixed inset-0 z-50" role="dialog" aria-label="Keranjang">
          <div className={`${cartT.leaving ? "backdrop-out" : "backdrop-in"} absolute inset-0 bg-black/40`} onClick={() => setCartOpen(false)} />
          <aside className={`${cartT.leaving ? "drawer-out" : "drawer-in"} absolute right-0 top-0 flex h-full w-[400px] flex-col rounded-l-[20px] bg-kartu p-5 shadow-float`}>
            <div className="flex items-center"><p className="font-display text-lg font-semibold">Keranjang</p>
              <button onClick={() => setCartOpen(false)} className="pressable ml-auto rounded-lg px-2 py-1 text-sm ring-1 ring-garis">Tutup</button></div>
            {hintT.mounted && hint && <p role="status" className={`${hintT.leaving ? "toast-out" : "toast-in"} mt-2 rounded-lg bg-kuning/40 px-2 py-1 text-xs font-bold`}>{hint}</p>}
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
              {lines.length === 0 && <p className="text-sm text-teks2">Keranjang kosong.</p>}
              {lines.map((l) => (
                <div key={l.productId} className="flex items-center gap-2 rounded-[14px] border border-garis bg-bg p-2 text-sm">
                  <div className="min-w-0 flex-1"><p className="truncate font-bold">{l.nama}</p><p className="text-xs text-teks2 tabular-nums">{rupiah(l.harga)}</p></div>
                  <button onClick={() => setQty(l.productId, l.qty - 1)} className="pressable h-7 w-7 rounded-full ring-1 ring-garis" aria-label="Kurangi">−</button>
                  <span className="w-6 text-center font-bold tabular-nums">{l.qty}</span>
                  <button onClick={() => setQty(l.productId, l.qty + 1)} disabled={tutup} aria-disabled={tutup} title={tutup ? "Tutup" : MAX_HINT} className="pressable h-7 w-7 rounded-full bg-primer font-bold text-white disabled:opacity-40" aria-label="Tambah" onPointerDown={playPop}>+</button>
                  <button onClick={() => remove(l.productId)} className="pressable text-xs text-teks2" aria-label="Hapus">✕</button>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-kartu pt-2">
              <p className="flex justify-between font-extrabold tabular-nums"><span>Subtotal</span><span>{rupiah(subtotal)}</span></p>
              <button disabled={!lines.length} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                className="pressable btn-lift mt-2 w-full rounded-[14px] bg-aksen py-3 text-sm font-extrabold text-white disabled:opacity-40">Checkout</button>
              <Link href="/cart" className="mt-2 block text-center text-xs font-bold text-teks2">atau buka halaman keranjang →</Link>
            </div>
          </aside>
        </div>
      )}

      {checkoutT.mounted && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-label="Checkout">
          <div className={`${checkoutT.leaving ? "backdrop-out" : "backdrop-in"} absolute inset-0 bg-black/40`} onClick={() => setCheckoutOpen(false)} />
          <div className={`${checkoutT.leaving ? "modal-out" : "modal-in"} relative w-[560px] max-w-full rounded-[20px] bg-kartu p-5 shadow-float`}>
            <p className="font-display text-lg font-semibold">Checkout</p>
            <div className="mt-3"><CheckoutForm modal onDone={() => setCheckoutOpen(false)} /></div>
          </div>
        </div>
      )}
    </main>
  );
}

function SideTitle({ title }: { title: string }) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="gold-rule" aria-hidden />
      <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wide text-teks2">{title}</p>
    </div>
  );
}
