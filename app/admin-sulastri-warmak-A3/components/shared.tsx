"use client";

// Kompres tajam dari album: sisi panjang maks 1600px (tanpa upscale),
// JPEG quality ~0.85, smoothing high; bila masih >500KB turunkan quality.
export async function compressImage(file: File): Promise<{ url: string; w: number; h: number; kb: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const kbOf = (u: string) => Math.round((u.length * 3) / 4 / 1024);
  let q = 0.85, url = canvas.toDataURL("image/jpeg", q);
  while (kbOf(url) > 500 && q > 0.5) { q -= 0.05; url = canvas.toDataURL("image/jpeg", q); }
  return { url, w: canvas.width, h: canvas.height, kb: kbOf(url) };
}

export async function compressSlideImage(file: File): Promise<{ url: string; w: number; h: number; srcW: number; srcH: number }> {
  const bmp = await createImageBitmap(file);
  const target = 16 / 9;
  let cw = bmp.width, ch = bmp.height;
  if (bmp.width / bmp.height > target) cw = Math.round(ch * target);
  else ch = Math.round(cw / target);
  const sx = Math.round((bmp.width - cw) / 2), sy = Math.round((bmp.height - ch) / 2);
  const scale = Math.min(1, 1600 / cw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cw * scale);
  canvas.height = Math.round(ch * scale);
  canvas.getContext("2d")!.drawImage(bmp, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
  let q = 0.84, url = canvas.toDataURL("image/jpeg", q);
  while (url.length > 200 * 1024 * 1.37 && q > 0.4) { q -= 0.1; url = canvas.toDataURL("image/jpeg", q); }
  return { url, w: canvas.width, h: canvas.height, srcW: bmp.width, srcH: bmp.height };
}

export function Stepper({ stok, onStep }: { stok: number; onStep: (d: number) => void }) {
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={() => onStep(-1)} className="pressable grid h-8 w-8 place-items-center rounded-full bg-bg text-teks ring-1 ring-garis tabular-nums" aria-label="Kurangi stok">−</button>
      <b className="min-w-8 text-center tabular-nums">{stok}</b>
      <button onClick={() => onStep(1)} className="pressable grid h-8 w-8 place-items-center rounded-full bg-primer font-bold text-white tabular-nums" aria-label="Tambah stok">+</button>
    </span>
  );
}

export function TabHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <div className="gold-rule" aria-hidden />
      <h2 className="font-display mt-1 text-xl font-semibold">{title}</h2>
      {sub && <p className="text-xs text-teks2">{sub}</p>}
    </div>
  );
}

// ── helper input admin ──────────────────────────────────────────────────────
// Digit saja (buang pemisah ribuan dkk).
export const onlyDigits = (v: string) => v.replace(/\D/g, "");
// Format ribuan Indonesia untuk tampil: "15000" -> "15.000". State tetap digit.
export function formatRibuan(v: string): string {
  const d = v.replace(/\D/g, "").replace(/^0+/, "");
  if (!d) return "";
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
// Normalisasi nomor WA ke 62xxxxxxxxxx: "0812.." -> "62812..", "812.." -> "62812..".
export function normalizeWa(v: string): string {
  const d = v.replace(/\D/g, "").replace(/^0+/, "");
  if (!d) return "";
  return d.startsWith("62") ? d : "62" + d;
}

