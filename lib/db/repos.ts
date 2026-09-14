"use client";
// Satu-satunya pintu baca/tulis data — Firestore LANGSUNG, SATU collection `warmak`.
// Dokumen: product_<id>, txn_<...>, exp_<...>, meta_settings. Tanpa collection lain.
// Realtime: SATU onSnapshot koleksi, fan-out ke subscriber (katalog, pesanan, admin).
// Gagal baca/tulis TIDAK pernah diam: error diteruskan ke UI (skeleton -> pesan error).
import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, collection, doc, setDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, query, where, limit, increment, runTransaction, type Firestore, type Unsubscribe,
  type QueryDocumentSnapshot, type DocumentData,
} from "firebase/firestore";
import type { BackupData, Expense, Product, ShopSettings, Transaction } from "./schema";
import { NEXT_STATUS } from "./schema";
import { syncRun } from "@/lib/sync/status";
import seed from "./seed.json";

const COL = "warmak";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCTCdQWnN8zl4_9q2GWfESl3ba43XdwjlI",
  authDomain: "warmak-a3.firebaseapp.com",
  projectId: "warmak-a3",
  storageBucket: "warmak-a3.firebasestorage.app",
  messagingSenderId: "670852697844",
  appId: "1:670852697844:web:2b5b31f2634c638b1f58a1",
};

export const DEFAULT_SETTINGS: ShopSettings = {
  shopWaNumber: "6281234567890", openHour: "08:00", closeHour: "19:00",
  openOverride: "auto", heroSlides: "",
};

export function newCloudId(prefix: "txn" | "exp"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

let fs: Firestore | null = null;
function fsClient(): Firestore {
  if (typeof window === "undefined") throw new Error("Firestore hanya tersedia di client");
  if (!fs) {
    const app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
    fs = getFirestore(app);
  }
  return fs;
}

function friendly(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  if (code === "permission-denied") return "Akses Firestore ditolak — cek rules.";
  if (code === "unavailable" || code === "failed-precondition") return "Firestore tak terjangkau — cek internet.";
  return `Gagal memuat data (${code || "unknown"}) — cek internet/rules.`;
}

// Firestore menolak `undefined` — buang field undefined (1 level + array items) sebelum setDoc.
function clean<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue;
    out[k] = Array.isArray(v)
      ? v.map((it) => (it && typeof it === "object" ? clean(it as Record<string, unknown>) : it))
      : v;
  }
  return out as T;
}

// Foto cloud-fit: ≤700KB apa adanya; lebih besar -> downscale 800px q0.7.
export async function fitPhotoForCloud(dataUrl: string): Promise<string> {
  try {
    if (typeof window === "undefined" || dataUrl.length < 700_000) return dataUrl;
    const img = new Image();
    img.decoding = "async";
    img.src = dataUrl;
    await img.decode();
    const scale = Math.min(1, 800 / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(img.naturalWidth * scale));
    cv.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/jpeg", 0.7);
  } catch { return dataUrl; }
}

// ── live hub ────────────────────────────────────────────────────────────────
export interface LiveState {
  products: Product[]; txns: Transaction[]; exps: Expense[];
  settings: ShopSettings; loading: boolean; error: string | null;
}

const initialLive: LiveState = {
  products: [], txns: [], exps: [], settings: DEFAULT_SETTINGS, loading: true, error: null,
};

let cache: LiveState = initialLive;
const subs = new Set<(s: LiveState) => void>();
let unsub: Unsubscribe | null = null;
let started = false;

function emit() { const s = { ...cache }; subs.forEach((cb) => cb(s)); }

function ensureListen() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    unsub = onSnapshot(
      collection(fsClient(), COL),
      (snap) => {
        const products: Product[] = [];
        const txns: Transaction[] = [];
        const exps: Expense[] = [];
        let settings = DEFAULT_SETTINGS;
        snap.forEach((d) => {
          const id = d.id;
          const data = d.data() as Record<string, unknown>;
          if (id === "meta_settings") {
            settings = {
              shopWaNumber: String(data.shopWaNumber ?? DEFAULT_SETTINGS.shopWaNumber),
              openHour: String(data.openHour ?? DEFAULT_SETTINGS.openHour),
              closeHour: String(data.closeHour ?? DEFAULT_SETTINGS.closeHour),
              openOverride: String(data.openOverride ?? DEFAULT_SETTINGS.openOverride),
              heroSlides: String(data.heroSlides ?? ""),
            };
          } else if (id.startsWith("product_")) {
            products.push({ ...(data as object), id: String((data as { id?: unknown }).id ?? id.slice(8)) } as Product);
          } else if (id.startsWith("txn_")) {
            txns.push({ ...(data as object), id } as Transaction);
          } else if (id.startsWith("exp_")) {
            exps.push({ ...(data as object), id } as Expense);
          }
        });
        txns.sort((a, b) => b.createdAt - a.createdAt);
        exps.sort((a, b) => b.createdAt - a.createdAt);
        cache = { products, txns, exps, settings, loading: false, error: null };
        emit();
      },
      (e) => { cache = { ...cache, loading: false, error: friendly(e) }; emit(); },
    );
  } catch (e) { cache = { ...cache, loading: false, error: friendly(e) }; emit(); }
}

export function subscribeLive(cb: (s: LiveState) => void): () => void {
  ensureListen();
  subs.add(cb);
  cb({ ...cache });
  return () => { subs.delete(cb); };
}

export function useLive(): LiveState {
  const [s, setS] = useState<LiveState>({ ...cache });
  useEffect(() => subscribeLive(setS), []);
  return s;
}

export function stopLive() {
  try { unsub?.(); } catch { /* abaikan */ }
  unsub = null;
  started = false;
  subs.clear();
  cache = initialLive;
}

// ── tulis (langsung ke cloud; gagal -> throw, tanpa fallback diam) ──────────
async function fitProductFoto(p: Product): Promise<Product> {
  if (p.foto?.startsWith("data:")) {
    try { return { ...p, foto: await fitPhotoForCloud(p.foto) }; }
    catch { /* pakai foto apa adanya */ }
  }
  return p;
}

export async function upsertProduct(p: Product): Promise<void> {
  if (!p?.id || !p.nama || typeof p.harga !== "number") throw new Error("Produk tidak valid");
  const fitted = await fitProductFoto(p);
  await syncRun(() => setDoc(doc(fsClient(), COL, `product_${p.id}`), clean({ ...fitted })));
}

export async function setProductStock(id: string, stok: number): Promise<void> {
  if (typeof stok !== "number" || stok < 0) throw new Error("Stok tidak valid");
  await syncRun(() => setDoc(doc(fsClient(), COL, `product_${id}`), { stok: Math.floor(stok), updatedAt: Date.now() }, { merge: true }));
}

export async function toggleProduct(id: string, aktif: boolean): Promise<void> {
  await syncRun(() => setDoc(doc(fsClient(), COL, `product_${id}`), { aktif, updatedAt: Date.now() }, { merge: true }));
}

export async function deleteProduct(id: string): Promise<void> {
  await syncRun(() => deleteDoc(doc(fsClient(), COL, `product_${id}`)));
}

export async function addTransaction(t: Transaction): Promise<string> {
  if (!t?.id || !t.items?.length || typeof t.total !== "number") throw new Error("Transaksi tidak valid");
  await syncRun(() => setDoc(doc(fsClient(), COL, t.id), clean({ ...t })));
  return t.id;
}

// Tulis order + kurangi stok ATOMIK (1 transaksi Firestore).
// Guard: stok cloud dicek ulang; kurang -> seluruh tulis batal + pesan jelas.
// Aman balapan 2 HP (server-side, increment atomik).
export async function addTransactionWithStock(t: Transaction): Promise<string> {
  if (!t?.id || !t.items?.length || typeof t.total !== "number") throw new Error("Transaksi tidak valid");
  const items = t.items.filter((i) => i.productId && i.productId !== "manual");
  await syncRun(() => runTransaction(fsClient(), async (trx) => {
    const cur = new Map<string, number>();
    for (const it of items) {
      const ref = doc(fsClient(), COL, `product_${it.productId}`);
      const snap = await trx.get(ref);
      if (!snap.exists()) throw new Error(`Produk "${it.nama}" sudah tak tersedia — ulangi checkout.`);
      cur.set(it.productId, Number((snap.data() as { stok?: unknown }).stok ?? 0));
    }
    for (const it of items) {
      const sisa = cur.get(it.productId) ?? 0;
      if (sisa < it.qty) throw new Error(`Stok "${it.nama}" sisa ${sisa}, kurang dari ${it.qty} — kurangi jumlah lalu coba lagi.`);
    }
    trx.set(doc(fsClient(), COL, t.id), clean({ ...t }));
    for (const it of items) {
      trx.update(doc(fsClient(), COL, `product_${it.productId}`), { stok: increment(-it.qty), updatedAt: Date.now() });
    }
  }));
  return t.id;
}

export async function setTransactionStatus(id: string, status: Transaction["status"], prev?: Transaction["status"]): Promise<void> {
  // Kunci di sisi data: done/cancel final; selain itu hanya transisi maju yang sah.
  const check = (cur: Transaction["status"]) => {
    if (cur === "done" || cur === "cancel") throw new Error("Pesanan Selesai/Batal terkunci — tak bisa diubah.");
    if (!NEXT_STATUS[cur].includes(status)) throw new Error("Transisi status tak sah — status hanya bisa maju.");
  };
  if (prev) check(prev);
  await syncRun(() => runTransaction(fsClient(), async (trx) => {
    const snap = await trx.get(doc(fsClient(), COL, id));
    if (!snap.exists()) throw new Error("Pesanan tak ditemukan.");
    check((snap.data() as { status?: Transaction["status"] }).status ?? "sent");
    trx.update(doc(fsClient(), COL, id), { status });
  }));
}

export async function deleteTransaction(id: string): Promise<void> {
  await syncRun(() => deleteDoc(doc(fsClient(), COL, id)));
}

export async function addExpense(e: Expense): Promise<void> {
  if (!e?.id || !e.nama || typeof e.jumlah !== "number") throw new Error("Pengeluaran tidak valid");
  await syncRun(() => setDoc(doc(fsClient(), COL, e.id), clean({ ...e })));
}

export async function setMeta(key: keyof ShopSettings, value: string): Promise<void> {
  await syncRun(() => setDoc(doc(fsClient(), COL, "meta_settings"), { [key]: value }, { merge: true }));
}

// upsert butuh foto-fit async sebelum tulis (dipakai commit draft)
export async function upsertProductFit(p: Product): Promise<void> {
  await upsertProduct(p);
}

// ── baca sekali ─────────────────────────────────────────────────────────────
export async function fetchProductBySlug(slug: string): Promise<Product | undefined> {
  const s = await syncRun(() => getDocs(query(collection(fsClient(), COL), where("slug", "==", slug), limit(1))));
  const d = s.docs[0];
  if (!d) return undefined;
  return { ...(d.data() as object), id: String((d.data() as { id?: unknown }).id ?? d.id.slice(8)) } as Product;
}

export async function fetchProduct(id: string): Promise<Product | undefined> {
  const d = await syncRun(() => getDoc(doc(fsClient(), COL, `product_${id}`)));
  if (!d.exists()) return undefined;
  return { ...(d.data() as object), id } as Product;
}

// ── seed + backup lewat cloud ───────────────────────────────────────────────
export async function seedIfEmpty(): Promise<boolean> {
  const s = await syncRun(() => getDocs(query(collection(fsClient(), COL), limit(1))));
  if (!s.empty) return false;
  const now = Date.now();
  await syncRun(async () => {
    await Promise.all((seed as Product[]).map((p) =>
      setDoc(doc(fsClient(), COL, `product_${p.id}`), { ...p, updatedAt: now }),
    ));
    await setDoc(doc(fsClient(), COL, "meta_settings"), { ...DEFAULT_SETTINGS });
  });
  return true;
}

export async function exportBackup() {
  const s = await syncRun(() => getDocs(collection(fsClient(), COL)));
  const products: Product[] = [];
  const transactions: Transaction[] = [];
  const expenses: Expense[] = [];
  let meta: ShopSettings = DEFAULT_SETTINGS;
  const forEachDoc = (cb: (d: QueryDocumentSnapshot<DocumentData>) => void) => s.forEach(cb);
  forEachDoc((d) => {
    const id = d.id;
    const data = d.data() as Record<string, unknown>;
    if (id === "meta_settings") {
      meta = {
        shopWaNumber: String(data.shopWaNumber ?? DEFAULT_SETTINGS.shopWaNumber),
        openHour: String(data.openHour ?? DEFAULT_SETTINGS.openHour),
        closeHour: String(data.closeHour ?? DEFAULT_SETTINGS.closeHour),
        openOverride: String(data.openOverride ?? DEFAULT_SETTINGS.openOverride),
        heroSlides: String(data.heroSlides ?? ""),
      };
    } else if (id.startsWith("product_")) products.push({ ...(data as object), id } as Product);
    else if (id.startsWith("txn_")) transactions.push({ ...(data as object), id } as Transaction);
    else if (id.startsWith("exp_")) expenses.push({ ...(data as object), id } as Expense);
  });
  return { exportedAt: new Date().toISOString(), products, transactions, expenses, meta };
}

export async function importBackup(data: Awaited<ReturnType<typeof exportBackup>>): Promise<void> {
  if (!data || !Array.isArray(data.products)) throw new Error("File backup tidak valid");
  await syncRun(async () => {
    const fsdb = fsClient();
    const cur = await getDocs(collection(fsdb, COL));
    for (const d of cur.docs) {
      if (d.id === "meta_settings") continue;
      await deleteDoc(doc(fsdb, COL, d.id));
    }
    for (const p of data.products ?? []) {
      if (!p?.id) continue;
      await setDoc(doc(fsdb, COL, `product_${p.id}`), { ...p });
    }
    for (const t of data.transactions ?? []) {
      if (!t?.id) continue;
      await setDoc(doc(fsdb, COL, t.id), { ...t });
    }
    for (const e of data.expenses ?? []) {
      if (!e?.id) continue;
      await setDoc(doc(fsdb, COL, e.id), { ...e });
    }
    if (data.meta) await setDoc(doc(fsdb, COL, "meta_settings"), { ...data.meta }, { merge: true });
  });
}
