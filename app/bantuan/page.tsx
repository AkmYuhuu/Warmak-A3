import Link from "next/link";
import SfxToggle from "@/components/store/SfxToggle";

export default function BantuanPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-bg px-4 pb-28 pt-4">
      <Link href="/" className="text-sm font-bold text-primer">← Belanja</Link>
      <div className="pt-2"><div className="gold-rule" aria-hidden /></div>
      <h1 className="font-display mt-1 text-2xl font-semibold">Bantuan</h1>
      <section className="mt-4 space-y-2 text-sm">
        <div className="rounded-[18px] border border-garis bg-kartu p-4 shadow-card">
          <p className="font-extrabold">Cara pesan</p>
          <p className="mt-1 leading-relaxed text-teks2">Pilih barang → Tambah → Checkout → Kirim ke WA. Pilih Ambil atau Antar, lalu tulis nama dan alamat.</p>
        </div>
        <div className="rounded-[18px] border border-garis bg-kartu p-4 shadow-card">
          <p className="font-extrabold">Hubungi warung</p>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener"
            className="pressable mt-2 block rounded-[14px] bg-primer py-3 text-center text-sm font-extrabold text-white shadow-btn">Chat WA Warung</a>
        </div>
        <div className="rounded-[18px] border border-garis bg-kartu p-4 shadow-card">
          <SfxToggle />
        </div>
        <div className="rounded-[18px] border border-garis bg-kartu p-4 shadow-card">
          <p className="font-extrabold">Kelola toko</p>
          <Link href="/admin-sulastri-warmak-A3"
            className="pressable mt-2 block rounded-[14px] py-3 text-center text-sm font-bold text-teks ring-1 ring-garis">Buka Admin</Link>
        </div>
      </section>
    </main>
  );
}
