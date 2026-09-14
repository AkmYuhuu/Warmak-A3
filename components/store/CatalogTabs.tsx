"use client";

export type CatalogMode = "product" | "po" | "diskon";

const LABELS: Record<CatalogMode, string> = { product: "Belanja", po: "PO", diskon: "Diskon" };

export function CatalogTabs({ mode, onPick, desktop }: { mode: CatalogMode; onPick: (m: CatalogMode) => void; desktop?: boolean }) {
  const items: CatalogMode[] = ["product", "po", "diskon"];
  return (
    <div className={desktop ? "flex gap-2" : "no-scrollbar flex gap-2 overflow-x-auto px-4 py-2"} role="tablist" aria-label="Menu katalog">
      {items.map((id) => (
        <button key={id} role="tab" aria-selected={mode === id} onClick={() => onPick(id)}
          className={`pressable shrink-0 rounded-full px-4 py-1.5 text-[13px] font-extrabold ${mode === id ? "bg-primer text-white" : "bg-kartu text-teks ring-1 ring-garis"}`}>
          {LABELS[id]}
        </button>
      ))}
    </div>
  );
}
