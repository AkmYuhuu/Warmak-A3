"use client";
import { useEffect, useState } from "react";
import { setMeta, useLive } from "@/lib/db/repos";
import type { HeroSlide } from "@/components/store/HeroSlider";
import { compressSlideImage } from "./shared";
import { useUploadThing } from "@/lib/uploadthing";

export default function HeroEditor({ auto }: {
  auto: (okMsg: string, fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [judul, setJudul] = useState("");
  const [warn, setWarn] = useState("");
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("imageUploader");
  const { settings } = useLive();
  useEffect(() => {
    const raw = settings.heroSlides;
    if (!raw) return;
    try { const a = JSON.parse(raw); if (Array.isArray(a)) setSlides(a); } catch { /* abaikan */ }
  }, [settings.heroSlides]);
  function save(next: HeroSlide[]) {
    setSlides(next);
    auto("Tersimpan", () => setMeta("heroSlides", JSON.stringify(next)));
  }
  const input = "rounded-[14px] border border-garis bg-bg px-3 py-2.5 text-sm outline-none focus:border-primer";
  return (
    <div className="mt-2">
      <p className="text-[11px] text-teks2">Rasio 16:9, saran 1600×900 (min 1280×720), JPG/WebP &lt;200KB. Upload otomatis di-crop tengah 16:9.</p>
      <ul className="mt-1 space-y-1.5 text-sm">
        {slides.map((s, i) => (
          <li key={i} className="flex items-center gap-2 rounded-[14px] bg-bg px-3 py-2">
            {s.imageUrl
              ? <img src={s.imageUrl} alt="" className="aspect-video h-10 shrink-0 rounded-lg object-cover" loading="lazy" />
              : <span className="grid aspect-video h-10 shrink-0 place-items-center rounded-lg bg-garis text-xs">16:9</span>}
            <span className="min-w-0 flex-1 truncate"><b>{s.judul}</b></span>
            <button onClick={() => save(slides.filter((_, k) => k !== i))} className="pressable shrink-0 text-xs text-teks2" aria-label="Hapus slide">✕</button>
          </li>
        ))}
        {slides.length === 0 && <li className="text-xs text-teks2">Memakai 3 slide default.</li>}
      </ul>
      {warn && <p role="status" className="mt-1 text-[11px] font-bold text-aksen">{warn}</p>}
      {slides.length < 8 && (
        <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault();
          if (!judul.trim()) { alert("Isi judul slide."); return; }
          if (uploading) { alert("Tunggu upload selesai."); return; }
          if (typeof pendingUrl !== "string" || !pendingUrl) { alert("Pilih foto dari album dan tunggu upload selesai."); return; }
          save([...slides, { judul: judul.trim(), imageUrl: pendingUrl }]);
          setJudul(""); setPendingUrl(null);
          const pick = document.getElementById("hero-pick") as HTMLInputElement | null;
          if (pick) pick.value = "";
          setWarn("");
        }}>
          <input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul slide" className={`${input} min-w-40 flex-1`} aria-label="Judul slide" />
          <label className="pressable cursor-pointer rounded-[14px] px-3 py-2.5 text-xs font-bold ring-1 ring-garis">{uploading ? "⏳ Mengunggah…" : "📷 Foto dari album"}
            <input id="hero-pick" type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const inputEl = e.currentTarget;
              setUploading(true);
              try {
                const r = await compressSlideImage(f);
                const blob = await (await fetch(r.url)).blob();
                const file = new File([blob], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
                const res = await startUpload([file]);
                const url = res?.[0]?.ufsUrl;
                if (typeof url !== "string" || !url) throw new Error("Upload gagal — URL kosong.");
                setPendingUrl(url);
                setWarn(`Siap: ${r.w}×${r.h}${r.srcW < 1280 || r.srcH < 720 ? ` — gambar asli ${r.srcW}×${r.srcH} di bawah saran 1280×720, kualitas mungkin kurang` : ""} — tekan + Slide.`);
              } catch (err) {
                alert(err instanceof Error ? err.message : "Upload slide gagal.");
                inputEl.value = "";
                setPendingUrl(null);
              } finally {
                setUploading(false);
              }
            }} />
          </label>
          <button className="pressable rounded-[14px] bg-primer px-4 py-2.5 text-xs font-extrabold text-white shadow-btn">+ Slide</button>
        </form>
      )}
    </div>
  );
}

