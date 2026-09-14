import type { Product } from "@/lib/db/schema";

export const priceOf = (p: Product, now = new Date()): number =>
  p.isDiscount && p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.harga &&
  (!p.discountExpiresAt || new Date(p.discountExpiresAt).getTime() > now.getTime())
    ? p.discountPrice : p.harga;

export const isDiscountActive = (p: Product, now = new Date()): boolean => priceOf(p, now) < p.harga;

export function isPOActive(p: Product, now = new Date()): boolean {
  if (!p.isPO) return false;
  const t = now.getTime();
  if (p.poStartAt && new Date(p.poStartAt).getTime() > t) return false;
  if (p.poEndAt && new Date(p.poEndAt).getTime() < t) return false;
  return true;
}

// progress sisa waktu 0..1 (1 = baru mulai)
export function timeProgress(start?: string, end?: string, now = new Date()): number | null {
  if (!end) return null;
  const e = new Date(end).getTime(), t = now.getTime();
  if (!start) return e > t ? 1 : 0;
  const s = new Date(start).getTime();
  if (e <= s) return e > t ? 1 : 0;
  return Math.min(1, Math.max(0, (e - t) / (e - s)));
}

export function countdownText(end: string, now = new Date()): string {
  const ms = Math.max(0, new Date(end).getTime() - now.getTime());
  const h = Math.floor(ms / 3600000), d = Math.floor(h / 24);
  const hh = h % 24, mm = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d} hari ${hh} jam`;
  if (h > 0) return `${h} jam ${mm} mnt`;
  return `${Math.max(1, Math.floor(ms / 60000))} mnt`;
}

export const descOf = (p: Product): string => p.description ?? p.deskripsi ?? "";
