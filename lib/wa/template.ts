export interface CartLine { productId: string; nama: string; harga: number; qty: number; stok?: number; isPO?: boolean }
export interface CheckoutInfo { nama: string; alamat: string; metode: "ambil" | "antar"; ongkir: number; catatan?: string; lat?: number; lng?: number; mapsUrl?: string }

export const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

export function digitsOnly(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

// cart -> string (satu body, encodeURIComponent sekali oleh pemanggil)
// Template user: sapaan + daftar bernomor + pilihan antar/ambil + catatan.
export function cartToMessage(lines: CartLine[], info: CheckoutInfo, _total: number): string {
  const items = lines.map((l, i) => `${i + 1}. ${l.nama} x${l.qty} ${rupiah(l.harga * l.qty)}`).join("\n");
  const cara = info.metode === "antar" ? "di antar" : "di ambil";
  // Alamat tulisan: pakai ketikan customer; bila kosong tapi ada titik map, pakai koordinat sebagai teks.
  const alamatTeks = info.alamat?.trim()
    || (info.lat != null && info.lng != null ? `${info.lat}, ${info.lng}` : "")
    || "-";
  return (
    `Nama : ${info.nama?.trim() || "-"}\n\n` +
    `Halo saya ingin membeli barang terkait:\n\n` +
    `${items}\n\n` +
    `saya memilih barang belian saya untuk ${cara}\n\n` +
    `Catatan saya: ${info.catatan?.trim() || "-"}\n\n` +
    `Alamat saya: ${alamatTeks}`
  );
}

export function waLink(phone: string, body: string): string {
  return `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(body)}`;
}
