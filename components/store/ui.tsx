"use client";

// Ikon garis + "Foto menyusul" (pengganti emoji besar)
export function PhotoPlaceholder({ label = "Foto menyusul", tall }: { label?: string; tall?: boolean }) {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-1.5 bg-bg text-teks2 ${tall ? "py-10" : ""}`} aria-hidden>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="1.6" />
        <path d="m21 15-4.5-4.5L6 21" />
      </svg>
      <span className="text-[11px] font-semibold">{label}</span>
    </div>
  );
}

// Judul seksi: garis emas 24x2 + teks
export function SectionHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div>
        <div className="gold-rule" aria-hidden />
        <h2 className="font-display mt-1 text-lg font-semibold text-teks">{title}</h2>
      </div>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

// Skeleton blok produk (ganti "Memuat…")
export function CardSkeleton() {
  return (
    <div className="rounded-[18px] border border-garis bg-kartu p-2.5" aria-hidden>
      <div className="skeleton aspect-square rounded-[12px]" />
      <div className="skeleton mt-2 h-3.5 rounded-full" />
      <div className="skeleton mt-1.5 h-3.5 w-2/3 rounded-full" />
      <div className="skeleton mt-2 h-10 rounded-[14px]" />
    </div>
  );
}
