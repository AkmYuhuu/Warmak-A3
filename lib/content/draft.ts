"use client";
import { useCallback, useEffect, useState } from "react";
import {
  upsertProductFit, setProductStock, deleteProduct,
} from "@/lib/db/repos";
import type { Product } from "@/lib/db/schema";
import { bumpVersion } from "./version";

// Jenis operasi draft: HANYA produk & stok (tambah/edit/hapus produk, ubah stok).
// Status/hapus pesanan, jam/WA/slides, laku/keluar manual -> tulis langsung.
export type PendingKind = "product.upsert" | "product.stock" | "product.delete";

export interface DraftOp { op: PendingKind; payload: unknown }
export type StageFn = (op: PendingKind, payload: unknown) => void;

const KEY = "warmak:drafts";

// Kunci koalescing: draft baru menggantikan draft lama untuk entitas yang sama
function draftKey(d: DraftOp): string | null {
  const p = d.payload as Record<string, unknown> | null;
  if (!p) return null;
  if (d.op === "product.stock" || d.op === "product.upsert" || d.op === "product.delete")
    return p.id != null ? `product:${String(p.id)}` : null;
  return null;
}

function productIdOf(d: DraftOp): string | null {
  if (!d.op.startsWith("product.")) return null;
  const p = d.payload as Record<string, unknown> | null;
  return p?.id != null ? String(p.id) : null;
}

function load(): DraftOp[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch { return []; }
}

async function applyDraft(d: DraftOp): Promise<void> {
  const p = d.payload as Record<string, unknown>;
  switch (d.op) {
    case "product.upsert": {
      const prod = p as unknown as Product;
      if (!prod?.id || !prod.nama || typeof prod.harga !== "number") throw new Error("Produk tidak valid");
      await upsertProductFit(prod);
      break;
    }
    case "product.stock": {
      if (p.id == null || typeof p.stok !== "number" || (p.stok as number) < 0) throw new Error("Stok tidak valid");
      await setProductStock(String(p.id), Math.floor(p.stok as number));
      break;
    }
    case "product.delete": {
      if (p.id == null) throw new Error("Produk tidak valid");
      await deleteProduct(String(p.id));
      break;
    }
    default: throw new Error("Operasi tak dikenal");
  }
}

// Semua edit admin ditampung sebagai DRAFT lokal (persist localStorage).
// commit() menulis LANGSUNG ke Firestore (realtime membuat reload tak perlu).
// Gagal -> draft dipertahankan + dilaporkan (tanpa fallback diam).
export function useDrafts() {
  const [drafts, setDrafts] = useState<DraftOp[]>(load);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(drafts)); } catch { /* abaikan */ }
  }, [drafts]);

  const stage: StageFn = useCallback((op, payload) => {
    setDrafts((prev) => {
      const k = draftKey({ op, payload });
      if (!k) return [...prev, { op, payload }];
      let next = prev.filter((d) => draftKey(d) !== k);
      if (op === "product.delete") {
        // hapus menggantikan semua draft produk lain untuk id yang sama
        const id = productIdOf({ op, payload });
        if (id) next = next.filter((d) => productIdOf(d) !== id);
      }
      return [...next, { op, payload }];
    });
  }, []);

  const discard = useCallback(() => setDrafts([]), []);

  const commit = useCallback(async (): Promise<{ ok: boolean; failed: number }> => {
    setSaving(true);
    try {
      const cur = load();
      let failed = 0;
      for (const d of cur) {
        try { await applyDraft(d); }
        catch { failed++; }
      }
      if (failed > 0) return { ok: false, failed };
      setDrafts([]);
      await bumpVersion().catch(() => null);
      return { ok: true, failed: 0 };
    } finally { setSaving(false); }
  }, []);

  return { drafts, count: drafts.length, stage, discard, commit, saving };
}
