"use client";
import { useState } from "react";
import { lineHabis, useCart } from "@/lib/cart/store";
import { cartToMessage, rupiah, waLink } from "@/lib/wa/template";
import { addTransactionWithStock, newCloudId, useLive } from "@/lib/db/repos";
import { DEFAULT_WA_NUMBER } from "@/lib/device";
import { useOnlineStatus } from "@/lib/shop/useOnlineStatus";
import { useShopStatus } from "@/lib/shop/useShopStatus";

const ONGKIR_ANTAR = 5000;

export function CheckoutForm({ onDone, modal }: { onDone?: () => void; modal?: boolean }) {
  const { lines, subtotal, clear } = useCart();
  const online = useOnlineStatus();
  const shop = useShopStatus();
  const { settings, products, loading: liveLoading, error: liveError } = useLive();
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState("");
  const mapsUrl = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : undefined;
  const [metode, setMetode] = useState<"ambil" | "antar">("ambil");
  const [loading, setLoading] = useState(false);
  const ongkir = metode === "antar" ? ONGKIR_ANTAR : 0;
  const total = subtotal + ongkir;
  const blocked = !online || !shop.open;
  // Cek stok live; fail-open bila data belum siap. kirim() sudah dijaga valid.
  const isLive = !liveLoading && !liveError;
  const dead = isLive ? lines.filter((l) => lineHabis(l, products)) : [];
  const valid = nama.trim().length > 1 && lines.length > 0 && !blocked && dead.length === 0;

  function pakaiLokasi() {
    if (!("geolocation" in navigator)) { setLocErr("Perangkat tak mendukung lokasi."); return; }
    // Geolocation butuh konteks aman (HTTPS/localhost) — di link dev http://IP browser menolak tanpa bertanya.
    if (!window.isSecureContext) {
      setLocErr("Lokasi butuh HTTPS — di link dev HP (http) browser menolak otomatis. Isi alamat manual, atau buka via localhost/HTTPS.");
      return;
    }
    setLocating(true);
    setLocErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false); },
      (err) => {
        setLocErr(err.code === err.PERMISSION_DENIED
          ? "Izin lokasi ditolak — izinkan di pengaturan browser, atau isi alamat manual."
          : "Gagal membaca lokasi — coba lagi atau isi alamat manual.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function kirim() {
    if (!valid || loading) return;
    // Buka tab sinkron dalam gesture klik (SEBELUM await) agar lolos popup-blocker.
    const w = window.open("about:blank", "_blank", "noopener");
    setLoading(true);
    setSendErr(null);
    try {
      const tanggal = new Date().toISOString().slice(0, 10);
      const full = {
        id: newCloudId("txn"), tanggal, nama: nama.trim(), alamat: alamat.trim(), catatan: catatan.trim() || undefined,
        lat: lat ?? undefined, lng: lng ?? undefined, mapsUrl, metode,
        items: lines.map((l) => ({
          productId: l.productId, nama: l.nama, harga: l.harga, qty: l.qty,
          subtotal: l.harga * l.qty, isPO: l.isPO || undefined,
        })),
        total, ongkir, via: "WA" as const, status: "sent" as const, createdAt: Date.now(),
      };
      // Tulis order + kurangi stok ATOMIK (guard stok cloud, anti-balapan).
      await addTransactionWithStock(full);
      const wa = settings.shopWaNumber || DEFAULT_WA_NUMBER;
      const msg = cartToMessage(lines, { nama: nama.trim(), alamat: alamat.trim(), catatan: catatan.trim() || undefined, lat: lat ?? undefined, lng: lng ?? undefined, mapsUrl, metode, ongkir }, total);
      const url = waLink(wa, msg);
      if (w && !w.closed) {
        // Keranjang HANYA dikosongkan bila tab WA benar-benar terbuka.
        w.location.href = url;
        clear();
        onDone?.();
      } else {
        // Blocker ketat: navigasi tab ini langsung (selalu lolos).
        clear();
        window.location.href = url;
      }
    } catch (e) {
      try { w?.close(); } catch { /* abaikan */ }
      setSendErr(e instanceof Error ? e.message : "Gagal menyimpan pesanan — cek internet/rules lalu coba lagi.");
    } finally { setLoading(false); }
  }

  return (
    <div className={modal ? "" : "sheet-in"}>
      {!online && <p role="alert" className="mb-2 rounded-xl bg-[#DC2626] px-3 py-2 text-xs font-extrabold text-white">Wajib online — hubungkan internet untuk checkout.</p>}
      {online && !shop.open && <p role="alert" className="mb-2 rounded-xl bg-[#DC2626]/10 px-3 py-2 text-xs font-bold text-[#DC2626]">Toko sedang tutup ({shop.label.replace("Toko: ", "")}) — checkout dibuka lagi saat jam buka.</p>}
      <label className="block text-xs font-bold text-teks2">NAMA</label>
      <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama penerima"
        className="mt-1 w-full rounded-xl border border-garis bg-white px-3 py-2.5 text-sm outline-none focus:border-primer" />
      <label className="mt-3 block text-xs font-bold text-teks2">ALAMAT</label>
      <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Alamat antar"
        rows={2} className="mt-1 w-full rounded-xl border border-garis bg-white px-3 py-2.5 text-sm outline-none focus:border-primer" />
      <button onClick={pakaiLokasi} disabled={locating}
        className="pressable mt-2 w-full rounded-xl py-2.5 text-xs font-bold text-primer ring-1 ring-primer disabled:opacity-40">
        {locating ? "Mencari lokasi…" : lat != null ? "📍 Lokasi terpasang — perbarui" : "📍 Gunakan lokasi saya"}
      </button>
      {locErr && <p role="status" className="mt-1 text-[11px] font-bold text-aksen">{locErr}</p>}
      {lat != null && lng != null && (
        <div className="mt-2 overflow-hidden rounded-xl border border-garis">
          <iframe title="Peta lokasi antar" loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.008},${lng + 0.01},${lat + 0.008}&layer=mapnik&marker=${lat},${lng}`}
            className="h-44 w-full border-0" />
          <a href={mapsUrl} target="_blank" rel="noopener"
            className="block bg-white px-3 py-2 text-center text-xs font-bold text-primer">Buka di Maps</a>
        </div>
      )}
      <label className="mt-3 block text-xs font-bold text-teks2">CATATAN (OPSIONAL)</label>
      <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Contoh: sambal dipisah"
        className="mt-1 w-full rounded-xl border border-garis bg-white px-3 py-2.5 text-sm outline-none focus:border-primer" />
      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Metode pengambilan">
        {(["ambil", "antar"] as const).map((m) => (
          <button key={m} role="radio" aria-checked={metode === m} onClick={() => setMetode(m)}
            className={`pressable rounded-xl border-2 p-3 text-left ${metode === m ? "border-primer bg-primer/5" : "border-garis bg-white"}`}>
            <p className="text-sm font-extrabold">{m === "ambil" ? "🏃 Ambil" : "🛵 Antar"}</p>
            <p className="text-xs text-teks2">{m === "ambil" ? "Gratis" : rupiah(ONGKIR_ANTAR)}</p>
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-bg p-3 text-sm">
        <div className="flex justify-between text-teks2"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
        <div className="flex justify-between text-teks2"><span>Ongkir</span><span>{ongkir ? rupiah(ongkir) : "Gratis"}</span></div>
        <div className="mt-1 flex justify-between text-base font-extrabold"><span>Total</span><span>{rupiah(total)}</span></div>
      </div>
      {dead.length > 0 && <p role="alert" className="mt-3 rounded-xl bg-[#DC2626]/10 px-3 py-2 text-xs font-bold text-[#DC2626]">Ada {dead.length} barang habis — hapus di keranjang dulu.</p>}
      <button onClick={kirim} disabled={!valid || loading}
        className="pressable mt-3 w-full rounded-xl bg-primer py-3.5 text-sm font-extrabold text-white disabled:opacity-40">
        {loading ? "Mengirim…" : "🟢 Kirim ke WA"}
      </button>
      {sendErr && <p role="alert" className="mt-2 rounded-xl bg-[#DC2626]/10 px-3 py-2 text-xs font-bold text-[#DC2626]">{sendErr}</p>}
    </div>
  );
}
