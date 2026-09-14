"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CartLine } from "@/lib/wa/template";

export const MAX_HINT = "Maksimal stok tersedia";

interface CartCtx {
  lines: CartLine[];
  count: number; subtotal: number; hint: string | null;
  add: (l: CartLine) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  setQty: (id: string, qty: number) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "warmak:cart";

const clampQty = (qty: number, stok?: number) =>
  typeof stok === "number" && stok >= 0 ? Math.min(Math.max(0, qty), stok) : Math.max(0, qty);

// Barang habis: tak ada di katalog live ATAU stok <= 0. Murni (perlu daftar produk live).
export function lineHabis(l: CartLine, products: { id: string; stok: number }[]): boolean {
  const p = products.find((x) => x.id === l.productId);
  return !p || p.stok <= 0;
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Render pertama = [] (sama persis dengan SSR, anti hydration-mismatch).
  // localStorage dibaca di effect setelah mount; save ditahan sampai ready agar tak menimpa.
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const hintT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashHint = useCallback(() => {
    setHint(MAX_HINT);
    if (hintT.current) clearTimeout(hintT.current);
    hintT.current = setTimeout(() => setHint(null), 2500);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setLines(arr as CartLine[]);
      }
    } catch { /* abaikan */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* abaikan */ }
  }, [lines, ready]);

  const add = useCallback((l: CartLine) => {
    setLines((prev) => {
      const f = prev.find((x) => x.productId === l.productId);
      const stok = l.stok ?? f?.stok;
      if (f) {
        const next = clampQty(f.qty + l.qty, stok);
        if (next < f.qty + l.qty) flashHint();
        return prev.map((x) => (x.productId === l.productId ? { ...x, qty: next, stok: stok ?? x.stok } : x));
      }
      const next = clampQty(l.qty, stok);
      if (next < l.qty) flashHint();
      if (next <= 0) return prev;
      return [...prev, { ...l, qty: next }];
    });
  }, [flashHint]);
  const dec = useCallback((id: string) => {
    setLines((prev) => prev.map((x) => (x.productId === id ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0));
  }, []);
  const remove = useCallback((id: string) => setLines((prev) => prev.filter((x) => x.productId !== id)), []);
  const clear = useCallback(() => setLines([]), []);
  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) => {
      const f = prev.find((x) => x.productId === id);
      if (!f) return prev;
      const next = clampQty(qty, f.stok);
      if (next < qty) flashHint();
      return next <= 0 ? prev.filter((x) => x.productId !== id) : prev.map((x) => (x.productId === id ? { ...x, qty: next } : x));
    });
  }, [flashHint]);

  const value = useMemo(() => ({
    lines, count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.qty * l.harga, 0),
    hint, add, dec, remove, clear, setQty,
  }), [lines, hint, add, dec, remove, clear, setQty]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart di luar provider");
  return v;
}
