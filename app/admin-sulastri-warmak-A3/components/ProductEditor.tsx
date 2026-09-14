"use client";
import { useState } from "react";
import type { Product } from "@/lib/db/schema";
import type { StageFn } from "@/lib/content/draft";
import { compressImage, formatRibuan } from "./shared";
import { useUploadThing } from "@/lib/uploadthing";

// Form tambah/edit produk; di mobile tampil sebagai sheet
export default function ProductEditor({ initial, stage, leaving, onDone }: { initial?: Product; stage: StageFn; leaving?: boolean; onDone: (saved?: Product) => void }) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [harga, setHarga] = useState(String(initial?.harga ?? ""));
  const [stok, setStok] = useState(String(initial?.stok ?? ""));
  const [kategori, setKategori] = useState(initial?.kategori ?? "Sembako");
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
  const input = "rounded-[14px] border border-garis bg-bg px-3 py-2.5 text-sm outline-none focus:border-primer";
  return (
    <div className="fixed inset-0 z-50 md:static md:z-auto" role="dialog" aria-label="Form produk">
      <div className={`${leaving ? "backdrop-out" : "backdrop-in"} absolute inset-0 bg-black/40 md:hidden`} onClick={() => onDone()} />
      <form className={`${leaving ? "sheet-out" : "sheet-in"} absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[24px] bg-kartu p-4 shadow-float md:static md:mt-2 md:grid md:max-h-none md:grid-cols-2 md:gap-2 md:rounded-[18px] md:border md:border-garis md:p-4 md:shadow-card`}
        onSubmit={async (e) => {
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
            kategori, harga: h, stok: Math.floor(s), aktif: initial?.aktif ?? true,
            description: description.trim(), deskripsi: description.trim(), expiredAt, foto,
            isPO, poStartAt: isPO ? poStartAt || undefined : undefined, poEndAt: isPO ? poEndAt || undefined : undefined,
            isDiscount, discountPrice: isDiscount ? dp : undefined,
            discountExpiresAt: isDiscount ? discountExpiresAt || undefined : undefined,
            updatedAt: Date.now(),
          };
          stage("product.upsert", saved);
          onDone(saved);
        }}>
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-garis md:hidden" aria-hidden />
        <p className="font-display text-lg font-semibold md:col-span-2">{initial ? "Edit produk" : "Produk baru"}</p>
        <p className="text-xs font-bold text-aksen md:col-span-2">Menyimpan menampung ke draft — tekan “Simpan perubahan” di bawah.</p>
        <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama" className={input} aria-label="Nama" />
        <input value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="Kategori" className={input} aria-label="Kategori" />
        <input value={formatRibuan(harga)} onChange={(e) => setHarga(e.target.value.replace(/\D/g, ""))} placeholder="Harga" inputMode="numeric" className={input} aria-label="Harga" />
        <input value={stok} onChange={(e) => setStok(e.target.value.replace(/\D/g, ""))} placeholder="Stok" inputMode="numeric" className={input} aria-label="Stok" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi (wajib tampil di toko)" className={`${input} md:col-span-2`} aria-label="Deskripsi" />
        <label className="flex items-center gap-2 text-xs font-bold">Expired* <input type="date" value={expiredAt} onChange={(e) => setExpiredAt(e.target.value)} className={`${input} flex-1`} aria-label="Tanggal expired" /></label>
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
          <input type="checkbox" checked={isPO} onChange={(e) => setIsPO(e.target.checked)} className="h-4 w-4 accent-[#0C5B40]" /> Jadikan PO Product
        </label>
        {isPO && (
          <>
            <label className="flex items-center gap-2 text-xs font-bold">PO mulai <input type="datetime-local" value={poStartAt} onChange={(e) => setPoStartAt(e.target.value)} className={`${input} flex-1`} /></label>
            <label className="flex items-center gap-2 text-xs font-bold">PO berakhir <input type="datetime-local" value={poEndAt} onChange={(e) => setPoEndAt(e.target.value)} className={`${input} flex-1`} /></label>
          </>
        )}
        <label className="flex items-center gap-1.5 text-xs font-bold md:col-span-2">
          <input type="checkbox" checked={isDiscount} onChange={(e) => setIsDiscount(e.target.checked)} className="h-4 w-4 accent-[#0C5B40]" /> Beri diskon
        </label>
        {isDiscount && (
          <>
            <input value={formatRibuan(discountPrice)} onChange={(e) => setDiscountPrice(e.target.value.replace(/\D/g, ""))} placeholder="Harga diskon" inputMode="numeric" className={input} aria-label="Harga diskon" />
            <label className="flex items-center gap-2 text-xs font-bold">Diskon s/d <input type="datetime-local" value={discountExpiresAt} onChange={(e) => setDiscountExpiresAt(e.target.value)} className={`${input} flex-1`} /></label>
          </>
        )}
        <div className="flex gap-2 md:col-span-2">
          <button className="pressable flex-1 rounded-[14px] bg-primer px-3 py-3 text-sm font-extrabold text-white shadow-btn md:flex-none md:px-5">Tampung draft</button>
          <button type="button" onClick={() => onDone()} className="pressable rounded-[14px] px-4 py-3 text-sm font-bold ring-1 ring-garis">Batal</button>
        </div>
      </form>
    </div>
  );
}

