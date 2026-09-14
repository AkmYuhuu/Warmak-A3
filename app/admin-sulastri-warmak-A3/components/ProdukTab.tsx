"use client";
import type { Product } from "@/lib/db/schema";
import type { StageFn } from "@/lib/content/draft";
import { rupiah } from "@/lib/wa/template";
import { Stepper, TabHead } from "./shared";
import ProductEditor from "./ProductEditor";
import { useMountedTransition } from "@/lib/anim/useMountedTransition";

function FotoMini({ p, size }: { p: Product; size: string }) {
  if (p.foto) return <img src={p.foto} alt="" className={`${size} shrink-0 rounded-full object-cover`} loading="lazy" />;
  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-bg text-teks2`} aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-4.5-4.5L6 21" />
      </svg>
    </span>
  );
}

function Badge({ p }: { p: Product }) {
  if (p.stok === 0) return <span className="rounded-full bg-teks/10 px-2 py-0.5 text-[11px] font-bold">Habis</span>;
  if (p.stok <= 10) return <span className="rounded-full bg-aksen px-2 py-0.5 text-[11px] font-bold text-white">Mau Habis</span>;
  return <span className="text-[11px] font-semibold text-primer">Stok Aman</span>;
}

export default function ProdukTab({ filtered, cats, q, setQ, kat, setKat, menipis, setMenipis, editorFor, setEditorFor, stage, stepper, hapus, onEditorDone }: {
  filtered: Product[]; cats: string[];
  q: string; setQ: (v: string) => void; kat: string; setKat: (v: string) => void;
  menipis: boolean; setMenipis: (v: boolean) => void;
  editorFor: Product | "baru" | null; setEditorFor: (v: Product | "baru" | null) => void;
  stage: StageFn; stepper: (p: Product, d: number) => void; hapus: (p: Product) => void;
  onEditorDone: (saved?: Product) => void;
}) {
  const input = "rounded-[14px] border border-garis bg-kartu px-3 py-2.5 text-sm outline-none focus:border-primer";
  const edT = useMountedTransition(!!editorFor, 220);
  return (
    <div className="fade-up">
      <TabHead title="Produk & Stok" sub={`${filtered.length} barang`} />
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk…"
          className={`${input} min-w-40 flex-1`} aria-label="Cari" />
        <select value={kat} onChange={(e) => setKat(e.target.value)} className={`${input} hidden md:block`} aria-label="Kategori">
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setEditorFor("baru")} className="pressable rounded-[14px] bg-primer px-4 py-2.5 text-sm font-extrabold text-white shadow-btn">+ Produk</button>
      </div>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto md:hidden" role="tablist" aria-label="Kategori">
        {cats.map((c) => (
          <button key={c} role="tab" aria-selected={kat === c} onClick={() => setKat(c)}
            className={`pressable h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold ${kat === c ? "bg-primer text-white" : "bg-kartu text-teks ring-1 ring-garis"}`}>{c}</button>
        ))}
      </div>
      <label className="mt-2 hidden items-center gap-1.5 text-sm md:inline-flex">
        <input type="checkbox" checked={menipis} onChange={(e) => setMenipis(e.target.checked)} className="h-4 w-4 accent-[#0C5B40]" /> Hanya menipis
      </label>

      {edT.mounted && editorFor && (
        <ProductEditor
          key={editorFor === "baru" ? "baru" : editorFor.id}
          initial={editorFor === "baru" ? undefined : editorFor}
          stage={stage}
          leaving={edT.leaving}
          onDone={onEditorDone}
        />
      )}

      <div className="mt-3 space-y-2 md:hidden">
        {filtered.map((p) => (
          <div key={p.id} className={`flex items-center gap-2.5 rounded-[18px] border border-garis bg-kartu p-3 text-sm shadow-card ${p.stok === 0 ? "opacity-55" : ""}`}>
            <FotoMini p={p} size="h-12 w-12" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{p.nama}</p>
              <p className="text-xs text-teks2 tabular-nums">{rupiah(p.harga)} • Stok: {p.stok}</p>
              <Badge p={p} />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Stepper stok={p.stok} onStep={(d) => stepper(p, d)} />
              <span className="flex gap-1">
                <button onClick={() => setEditorFor(p)} className="pressable rounded-lg px-2 py-1 text-xs ring-1 ring-garis">Edit</button>
                <button onClick={() => hapus(p)} className="pressable rounded-lg px-2 py-1 text-xs font-bold text-[#DC2626] ring-1 ring-garis">Hapus</button>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 hidden overflow-hidden rounded-[18px] border border-garis bg-kartu shadow-card md:block">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-teks2"><th className="p-3">Foto</th><th className="p-3">Produk</th><th className="p-3">Harga</th><th className="p-3">Stok</th><th className="p-3">Aksi</th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className={`border-t border-garis odd:bg-bg/60 ${p.stok === 0 ? "opacity-60" : ""}`}>
                <td className="p-3"><FotoMini p={p} size="h-10 w-10" /></td>
                <td className="p-3"><b>{p.nama}</b> <span className="text-xs text-teks2">{p.kategori}</span> <Badge p={p} /></td>
                <td className="p-3 tabular-nums">{rupiah(p.harga)}</td>
                <td className="p-3"><Stepper stok={p.stok} onStep={(d) => stepper(p, d)} /></td>
                <td className="p-3">
                  <span className="flex gap-1">
                    <button onClick={() => setEditorFor(p)} className="pressable rounded-lg px-2 py-1 text-xs ring-1 ring-garis">Edit</button>
                    <button onClick={() => hapus(p)} className="pressable rounded-lg px-2 py-1 text-xs font-bold text-[#DC2626] ring-1 ring-garis">Hapus</button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

