"use client";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Product } from "@/lib/db/schema";
import type { StageFn } from "@/lib/content/draft";
import { compressImage, formatRibuan } from "./shared";
import { useUploadThing } from "@/lib/uploadthing";
import ModalPortal from "@/components/system/ModalPortal";
import { useLockBody } from "@/lib/anim/useLockBody";

// Form tambah/edit produk; di mobile tampil sebagai sheet via portal ke body
// (lepas dari containing-block ancestor ber-transform), di desktop inline.
export default function ProductEditor({ initial, cats = [], stage, leaving, onDone }: { initial?: Product; cats?: string[]; stage: StageFn; leaving?: boolean; onDone: (saved?: Product) => void }) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [harga, setHarga] = useState(String(initial?.harga ?? ""));
  const [stok, setStok] = useState(String(initial?.stok ?? ""));
  const [kategori, setKategori] = useState(initial?.kategori ?? "");
  const [description, setDescription] = useState(initial?.description ?? initial?.deskripsi ?? "");
  const [expiredAt, setExpiredAt] = useState(initial?.expiredAt ?? "");
  const [foto, setFoto] = useState<string | undefined>(initial?.foto);
  const [fotoInfo, setFotoInfo] = useState("");
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("imageUploader");
  const [isPO, setIsPO] = useState(!!initial?.isPO);
  const [poStartAt, setPoStartAt] = useState(initial?.poStartAt ?? "");
  const [poEndAt, setPoEndAt] = useState(initial?.poEndAt ?? "");
  const [isDiscount, setIsDiscount] = useState(!!initial?.isDiscount);
  const [discountPrice, setDiscountPrice] = useState(String(initial?.discountPrice ?? ""));
  const [discountExpiresAt, setDiscountExpiresAt] = useState(initial?.discountExpiresAt ?? "");
  const input = "w-full min-w-0 rounded-2xl border border-garis bg-white px-4 py-3 text-sm outline-none placeholder:text-sm focus:border-primer md:rounded-[14px] md:bg-bg md:px-3 md:py-2.5";
  const saranKategori = Array.from(new Set(["Sembako", ...cats.filter((c) => c !== "Semua"), kategori.trim()].filter(Boolean)));
  // Scroll-lock hanya di mobile (desktop form inline md:static, halaman tetap scroll).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const upd = () => setIsMobile(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);
  useLockBody(isMobile);
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const h = Number(harga), s = Number(stok);
    if (!nama.trim() || !(h > 0) || !(s >= 0)) { alert("Lengkapi nama, harga, stok."); return; }
    if (!expiredAt) { alert("Tanggal expired wajib diisi."); return; }
    const dp = Number(discountPrice);
    if (isDiscount && (!(dp > 0) || dp >= h)) { alert("Harga diskon harus lebih kecil dari harga normal."); return; }
    if (isPO && poStartAt && poEndAt && new Date(poStartAt).getTime() >= new Date(poEndAt).getTime()) { alert("PO mulai harus sebelum PO berakhir."); return; }
    const id = initial?.id ?? "p" + Date.now().toString(36);
    const saved: Product = {
      ...(initial ?? {}),
      id, nama: nama.trim(),
      slug: initial?.slug ?? nama.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      kategori: kategori.trim() || "Sembako", harga: h, stok: Math.floor(s), aktif: initial?.aktif ?? true,
      description: description.trim(), deskripsi: description.trim(), expiredAt, foto,
      isPO, poStartAt: isPO ? poStartAt || undefined : undefined, poEndAt: isPO ? poEndAt || undefined : undefined,
      isDiscount, discountPrice: isDiscount ? dp : undefined,
      discountExpiresAt: isDiscount ? discountExpiresAt || undefined : undefined,
      updatedAt: Date.now(),
    };
    stage("product.upsert", saved);
    onDone(saved);
  }
  const body: ReactNode = (
    <>
      <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-garis md:hidden" aria-hidden />
      <p className="font-display text-lg font-semibold md:col-span-2">{initial ? "Edit produk" : "Produk baru"}</p>
      <p className="rounded-lg border border-aksen/40 bg-aksen/10 p-3 text-xs font-bold leading-snug text-aksen md:col-span-2 md:rounded-none md:border-0 md:bg-transparent md:p-0">Menyimpan sebagai draft — tekan 'Simpan perubahan' di bawah.</p>
      <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama" className={input} aria-label="Nama" />
      <input value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="Kategori" list="kategori-saran" autoComplete="off" className={input} aria-label="Kategori" />
      <input value={formatRibuan(harga)} onChange={(e) => setHarga(e.target.value.replace(/\D/g, ""))} placeholder="Harga" inputMode="numeric" className={input} aria-label="Harga" />
      <input value={stok} onChange={(e) => setStok(e.target.value.replace(/\D/g, ""))} placeholder="Stok" inputMode="numeric" className={input} aria-label="Stok" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi (wajib tampil di toko)" className={`${input} hidden md:col-span-2 md:block`} aria-label="Deskripsi" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi produk (wajib tampil di toko)" rows={4} className={`${input} min-h-[100px] resize-y md:hidden`} aria-label="Deskripsi" />
      <label className="flex flex-col items-start gap-2 text-xs font-bold sm:flex-row sm:items-center"><span className="w-24 shrink-0">Expired*</span><input type="date" value={expiredAt} onChange={(e) => setExpiredAt(e.target.value)} className={`${input} flex-1`} aria-label="Tanggal expired" /></label>
      <div className="rounded-[14px] ring-1 ring-garis">
        <label className="pressable block cursor-pointer px-3 py-2.5 text-xs font-bold">{uploading ? "⏳ Mengunggah…" : "📷 Foto dari album"}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const inputEl = e.currentTarget;
            setUploading(true);
            try {
              const r = await compressImage(f);
              const blob = await (await fetch(r.url)).blob();
              const file = new File([blob], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
              const res = await startUpload([file]);
              const url = res?.[0]?.ufsUrl;
              if (typeof url !== "string" || !url) throw new Error("Upload gagal — URL kosong.");
              setFoto(url);
              setFotoInfo(`${r.w}×${r.h} • ${r.kb} KB`);
            } catch (err) {
              alert(err instanceof Error ? err.message : "Upload foto gagal.");
              inputEl.value = "";
            } finally {
              setUploading(false);
            }
          }} />
        </label>
        {foto && <img src={foto} alt="" className="mx-3 mb-1 aspect-video w-28 rounded-lg object-cover" loading="lazy" />}
        <p className="px-3 pb-2 text-[11px] text-teks2">Sisi panjang maks 1600px, JPG/WebP, hasil &lt;500KB.{fotoInfo ? ` Dipakai: ${fotoInfo}.` : ""}</p>
      </div>
      <label className="flex items-center gap-1.5 text-xs font-bold md:col-span-2">
        <input type="checkbox" checked={isPO} onChange={(e) => setIsPO(e.target.checked)} className="h-4 w-4 accent-primer" /> Jadikan PO Product
      </label>
      {isPO && (
        <>
          <label className="flex flex-col items-start gap-2 text-xs font-bold sm:flex-row sm:items-center"><span className="w-24 shrink-0">PO mulai</span><input type="datetime-local" value={poStartAt} onChange={(e) => setPoStartAt(e.target.value)} className={`${input} flex-1`} /></label>
          <label className="flex flex-col items-start gap-2 text-xs font-bold sm:flex-row sm:items-center"><span className="w-24 shrink-0">PO berakhir</span><input type="datetime-local" value={poEndAt} onChange={(e) => setPoEndAt(e.target.value)} className={`${input} flex-1`} /></label>
        </>
      )}
      <label className="flex items-center gap-1.5 text-xs font-bold md:col-span-2">
        <input type="checkbox" checked={isDiscount} onChange={(e) => setIsDiscount(e.target.checked)} className="h-4 w-4 accent-primer" /> Beri diskon
      </label>
      {isDiscount && (
        <>
          <input value={formatRibuan(discountPrice)} onChange={(e) => setDiscountPrice(e.target.value.replace(/\D/g, ""))} placeholder="Harga diskon" inputMode="numeric" className={input} aria-label="Harga diskon" />
          <label className="flex flex-col items-start gap-2 text-xs font-bold sm:flex-row sm:items-center"><span className="w-24 shrink-0">Diskon s/d</span><input type="datetime-local" value={discountExpiresAt} onChange={(e) => setDiscountExpiresAt(e.target.value)} className={`${input} flex-1`} /></label>
        </>
      )}
      <div className="flex flex-col gap-2 sm:flex-row md:col-span-2">
        <button className="pressable flex-1 rounded-[14px] bg-primer px-3 py-3 text-sm font-extrabold text-white shadow-btn md:flex-none md:px-5">Tampung draft</button>
        <button type="button" onClick={() => onDone()} className="pressable rounded-[14px] px-4 py-3 text-sm font-bold ring-1 ring-garis">Batal</button>
      </div>
    </>
  );
  return (
    <>
      {/* datalist di-hoist sekali (di luar portal) agar id tidak ganda */}
      <datalist id="kategori-saran">{saranKategori.map((c) => <option key={c} value={c} />)}</datalist>
      {/* Mobile: overlay+sheet via portal ke body, lepas dari ancestor ber-transform */}
      <ModalPortal>
        <div className={`${leaving ? "backdrop-out" : "backdrop-in"} fixed inset-0 z-[70] bg-black/40 md:hidden`} onClick={() => onDone()} />
        <form onSubmit={handleSubmit} style={{ maxHeight: "92dvh" }} role="dialog" aria-label="Form produk"
          className={`${leaving ? "sheet-out" : "sheet-in"} fixed inset-x-0 bottom-0 z-[71] mx-auto flex max-h-[92vh] w-full max-w-lg flex-col gap-2.5 overflow-x-hidden overflow-y-auto rounded-t-[24px] bg-kartu p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] shadow-float md:hidden`}>
          {body}
        </form>
      </ModalPortal>
      {/* Desktop: inline, semua class md:* sama persis seperti sebelumnya */}
      <div className="hidden md:block" role="dialog" aria-label="Form produk">
        <form onSubmit={handleSubmit}
          className={`${leaving ? "sheet-out" : "sheet-in"} absolute inset-x-0 bottom-0 mx-auto hidden max-h-[92vh] w-full max-w-lg flex-col gap-2.5 overflow-x-hidden overflow-y-auto rounded-t-[24px] bg-kartu p-4 pb-24 shadow-float md:static md:mx-0 md:mt-2 md:grid md:max-h-none md:w-auto md:max-w-none md:grid-cols-2 md:gap-2 md:overflow-visible md:rounded-[18px] md:border md:border-garis md:p-4 md:shadow-card`}>
          {body}
        </form>
      </div>
    </>
  );
}
