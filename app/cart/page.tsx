"use client";
import Link from "next/link";
import { useCart, lineHabis } from "@/lib/cart/store";
import { rupiah } from "@/lib/wa/template";
import { useLive } from "@/lib/db/repos";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { useMountedTransition } from "@/lib/anim/useMountedTransition";
import { useShopStatus } from "@/lib/shop/useShopStatus";
import { useState } from "react";

// Keranjang: kartu hangat, ringkasan tabular, sheet radius 24
export default function CartPage() {
  const { lines, subtotal, setQty, remove, hint } = useCart();
  const { products, loading, error } = useLive();
  // Cek stok live; fail-open bila data belum siap agar tak blokir salah.
  const isLive = !loading && !error;
  const deadIds = new Set(isLive ? lines.filter((l) => lineHabis(l, products)).map((l) => l.productId) : []);
  const [open, setOpen] = useState(false);
  const tutup = !useShopStatus().open;
  const sheetT = useMountedTransition(open, 220);
  const hintT = useMountedTransition(!!hint, 200);
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-bg px-4 pb-10 pt-4 md:max-w-2xl">
      <Link href="/" className="text-sm font-bold text-primer">← Belanja</Link>
      <h1 className="font-display mt-1 text-2xl font-semibold">Keranjang</h1>
      {hintT.mounted && hint && <p role="status" className={`${hintT.leaving ? "toast-out" : "toast-in"} mt-2 rounded-[14px] bg-kuning/40 px-3 py-2 text-xs font-bold`}>{hint}</p>}
      <div className="mt-3 space-y-2">
        {lines.length === 0 && <p className="rounded-[18px] border border-garis bg-kartu p-6 text-center text-sm text-teks2 shadow-card">Keranjang kosong. Yuk belanja sembako!</p>}
        {lines.map((l) => {
          const habis = deadIds.has(l.productId);
          return (
          <div key={l.productId} className={`flex items-center gap-2 rounded-[18px] border p-3 shadow-card ${habis ? "border-[#DC2626] bg-[#DC2626]/5" : "border-garis bg-kartu"}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{l.nama}</p>
              <p className="text-xs text-teks2 tabular-nums">{rupiah(l.harga)} • {rupiah(l.harga * l.qty)}</p>
              {habis && <p role="alert" className="mt-1 text-[11px] font-extrabold text-[#DC2626]">Stok habis — hapus barang ini untuk checkout.</p>}
            </div>
            <button onClick={() => setQty(l.productId, l.qty - 1)} className="pressable h-8 w-8 rounded-full ring-1 ring-garis" aria-label="Kurangi">−</button>
            <span className="w-6 text-center text-sm font-extrabold tabular-nums">{l.qty}</span>
            <button onClick={() => setQty(l.productId, l.qty + 1)} disabled={tutup} aria-disabled={tutup} title={tutup ? "Tutup" : undefined} className="pressable h-8 w-8 rounded-full bg-primer font-bold text-white disabled:opacity-40" aria-label="Tambah">+</button>
            <button onClick={() => remove(l.productId)} className="pressable px-1 text-xs text-teks2" aria-label="Hapus">✕</button>
          </div>
          );
        })}
      </div>
      {lines.length > 0 && (
        <div className="sticky bottom-4 mt-4 rounded-[18px] border border-garis bg-kartu p-4 shadow-float">
          <p className="flex justify-between font-extrabold tabular-nums"><span>Subtotal</span><span>{rupiah(subtotal)}</span></p>
          {deadIds.size > 0 && <p role="alert" className="mt-2 rounded-xl bg-[#DC2626]/10 px-3 py-2 text-xs font-bold text-[#DC2626]">Ada barang habis — hapus dulu untuk checkout.</p>}
          <button onClick={() => setOpen(true)} disabled={deadIds.size > 0} className="pressable btn-lift mt-2 w-full rounded-[14px] bg-aksen py-3 text-sm font-extrabold text-white disabled:opacity-40">Checkout</button>
        </div>
      )}
      {sheetT.mounted && (
        <div className="fixed inset-0 z-50" role="dialog" aria-label="Checkout">
          <div className={`${sheetT.leaving ? "backdrop-out" : "backdrop-in"} absolute inset-0 bg-black/40`} onClick={() => setOpen(false)} />
          <div className={`${sheetT.leaving ? "sheet-out" : "sheet-in"} absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[24px] bg-kartu p-5 shadow-float md:inset-0 md:m-auto md:h-fit md:max-w-[520px] md:rounded-[20px]`}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-garis md:hidden" aria-hidden />
            <div className="flex items-center"><p className="font-display text-lg font-semibold">Checkout</p>
              <button onClick={() => setOpen(false)} className="pressable ml-auto rounded-lg px-2 py-1 text-sm ring-1 ring-garis">Tutup</button></div>
            <div className="mt-3"><CheckoutForm onDone={() => setOpen(false)} /></div>
          </div>
        </div>
      )}
    </main>
  );
}
