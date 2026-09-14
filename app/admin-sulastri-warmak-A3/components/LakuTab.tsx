"use client";
import { useMemo, useState } from "react";
import type { Product, Transaction } from "@/lib/db/schema";
import { addTransactionWithStock } from "@/lib/db/repos";
import { rupiah } from "@/lib/wa/template";
import { TabHead, formatRibuan } from "./shared";
import { addDays, fmtHari, todayKey } from "./hari";
import { PhotoPlaceholder } from "@/components/store/ui";

export default function LakuTab({ txns, products, auto, onAdd }: {
  txns: Transaction[]; products: Product[];
  auto: (okMsg: string, fn: () => Promise<unknown>) => Promise<boolean>;
  onAdd: (t: Transaction) => void;
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [nama, setNama] = useState("");
  const [qty, setQty] = useState("1");
  const [total, setTotal] = useState("");
  const [hari, setHari] = useState(() => todayKey());
  const input = "rounded-[14px] border border-garis bg-kartu px-3 py-2.5 text-sm outline-none focus:border-primer";
  const picked = products.find((p) => p.id === productId) ?? null;

  // Laku per-produk hari terpilih dari order done (manual done ikut; sent/process/cancel tidak).
  const rows = useMemo(() => {
    const map = new Map<string, { nama: string; qty: number }>();
    for (const t of txns) {
      if (t.status !== "done" || t.tanggal !== hari) continue;
      for (const it of t.items) {
        const key = it.productId || it.nama;
        const cur = map.get(key) ?? { nama: it.nama, qty: 0 };
        cur.qty += it.qty;
        map.set(key, cur);
      }
    }
    return [...map.entries()]
      .map(([key, v]) => ({ key, ...v, foto: products.find((p) => p.id === key)?.foto }))
      .sort((a, b) => b.qty - a.qty);
  }, [txns, hari, products]);
  const max = rows[0]?.qty ?? 0;
  const today = todayKey();
  const pill = (on: boolean) =>
    `pressable h-9 rounded-full px-4 text-[13px] font-bold ${on ? "bg-primer text-white" : "bg-kartu text-teks ring-1 ring-garis"}`;
  const isToday = hari === today;

  function pickProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    const q = Math.max(1, Number(qty) || 1);
    if (p) setTotal(String(p.harga * q));
  }
  function changeQty(v: string) {
    const d = v.replace(/\D/g, "");
    setQty(d);
    const p = products.find((x) => x.id === productId);
    const q = Math.max(1, Number(d) || 1);
    if (p) setTotal(String(p.harga * q));
  }

  return (
    <div className="fade-up">
      <TabHead title="Catat Laku" sub="Pemasukan manual + laku per-produk" />
      {!open ? (
        <button onClick={() => setOpen(true)} className="pressable rounded-[14px] bg-primer px-4 py-2.5 text-sm font-extrabold text-white shadow-btn">+ Catat Laku</button>
      ) : (
        <form className="flex flex-wrap gap-2 rounded-[18px] border border-garis bg-kartu p-3 shadow-card" onSubmit={async (e) => {
          e.preventDefault();
          const t = Number(total);
          const q = Math.max(1, Number(qty) || 1);
          if (!(t > 0)) { alert("Isi nominal & jumlah."); return; }
          const pid = picked?.id ?? "manual";
          const nm = picked?.nama ?? nama.trim();
          if (!nm) { alert("Pilih produk atau isi nama barang."); return; }
          const unit = Math.max(1, Math.round(t / q));
          const txn: Transaction = {
            id: `txn_m_${Date.now().toString(36)}`,
            tanggal: new Date().toISOString().slice(0, 10), nama: nm, alamat: "", metode: "ambil",
            items: [{ productId: pid, nama: nm, harga: unit, qty: q, subtotal: unit * q }],
            total: unit * q, ongkir: 0, via: "Manual", status: "done", createdAt: Date.now(),
          };
          const ok = await auto("Tersimpan", () => addTransactionWithStock(txn));
          if (!ok) return;
          setOpen(false); setNama(""); setTotal(""); setQty("1"); onAdd(txn);
        }}>
          <select value={productId} onChange={(e) => pickProduct(e.target.value)} className={`${input} min-w-0 flex-1`} aria-label="Produk">
            <option value="">— Lainnya —</option>
            {[...products].sort((a, b) => a.nama.localeCompare(b.nama)).map((p) => (
              <option key={p.id} value={p.id}>{p.nama} • stok {p.stok}</option>
            ))}
          </select>
          {productId === "" && (
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama barang" className={`${input} min-w-0 flex-1`} aria-label="Nama barang" />
          )}
          <input value={qty} onChange={(e) => changeQty(e.target.value)} placeholder="Qty" inputMode="numeric" className={`${input} w-20 tabular-nums`} aria-label="Jumlah" />
          <input value={formatRibuan(total)} onChange={(e) => setTotal(e.target.value.replace(/\D/g, ""))} placeholder="Total" inputMode="numeric" className={`${input} w-28 tabular-nums`} aria-label="Total" />
          <button className="pressable rounded-[14px] bg-primer px-4 py-2.5 text-sm font-extrabold text-white shadow-btn">Simpan</button>
          <button type="button" onClick={() => setOpen(false)} className="pressable rounded-[14px] px-3 py-2.5 text-sm ring-1 ring-garis">Batal</button>
        </form>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter hari">
        <button onClick={() => setHari(today)} aria-pressed={isToday} className={pill(isToday)}>Hari ini</button>
        <button onClick={() => setHari(addDays(today, -1))} aria-pressed={hari === addDays(today, -1)} className={pill(hari === addDays(today, -1))}>Kemarin</button>
        <input type="date" value={hari} onChange={(e) => { if (e.target.value) setHari(e.target.value); }}
          className={`${input} tabular-nums`} aria-label="Pilih tanggal" />
      </div>
      <p className="mt-1 text-xs text-teks2 tabular-nums">{fmtHari(hari)}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {rows.map((r) => (
          <li key={r.key} className="rounded-[14px] border border-garis bg-kartu px-3 py-2 shadow-card">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-bg" aria-hidden>
                {r.foto ? <img src={r.foto} alt="" className="h-full w-full object-cover" loading="lazy" /> : <PhotoPlaceholder />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{r.nama}</p>
                <p className="text-xs text-teks2 tabular-nums">{r.qty} pcs laku</p>
              </div>
              <b className="shrink-0 text-sm tabular-nums">{r.qty}</b>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-garis" aria-hidden>
              <div className="h-full rounded-full bg-primer" style={{ width: `${max ? Math.round((r.qty / max) * 100) : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="py-6 text-center text-sm text-teks2">{isToday ? "Belum ada laku hari ini." : "Belum ada laku pada tanggal ini."}</p>}
    </div>
  );
}

