// Tipe data Warmak A3 — murni TypeScript, tanpa database lokal.
// Penyimpanan: Firestore LANGSUNG (collection `warmak`).
// Keranjang = localStorage sesi. Draft admin = localStorage.
export interface Product {
  id: string; nama: string; slug: string; kategori: string;
  harga: number; stok: number; aktif: boolean;
  deskripsi?: string; foto?: string; satuan?: string; updatedAt: number;
  description?: string; expiredAt?: string;
  isPO?: boolean; poStartAt?: string; poEndAt?: string;
  isDiscount?: boolean; discountPrice?: number; discountExpiresAt?: string;
}
export interface TxnItem { productId: string; nama: string; harga: number; qty: number; subtotal: number; isPO?: boolean }
export type TxnStatus = "sent" | "process" | "done" | "cancel";
// Transisi maju yang sah. done/cancel final & terkunci.
export const NEXT_STATUS: Record<TxnStatus, TxnStatus[]> = {
  sent: ["process", "cancel"],
  process: ["done", "cancel"],
  done: [],
  cancel: [],
};
export interface Transaction {
  id: string; tanggal: string; nama: string; alamat: string; catatan?: string;
  lat?: number; lng?: number; mapsUrl?: string;
  metode: "ambil" | "antar"; items: TxnItem[]; total: number; ongkir: number;
  via?: "WA" | "Manual"; status: TxnStatus; createdAt: number;
}
export interface Expense { id: string; tanggal: string; nama: string; jumlah: number; createdAt: number }
export interface ShopSettings {
  shopWaNumber: string; openHour: string; closeHour: string;
  openOverride: string; heroSlides: string;
}
export interface BackupData {
  exportedAt: string; products: Product[]; transactions: Transaction[];
  expenses: Expense[]; meta: ShopSettings;
}
