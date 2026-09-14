"use client";
import { useState } from "react";
import type { Expense } from "@/lib/db/schema";
import { addExpense } from "@/lib/db/repos";
import { rupiah } from "@/lib/wa/template";
import { TabHead, formatRibuan } from "./shared";

export default function KeluarTab({ exps, auto, onAdd }: {
  exps: Expense[];
  auto: (okMsg: string, fn: () => Promise<unknown>) => Promise<boolean>;
  onAdd: (e: Expense) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [jumlah, setJumlah] = useState("");
  const input = "rounded-[14px] border border-garis bg-bg px-3 py-2.5 text-sm outline-none focus:border-primer";
  return (
    <div className="fade-up">
      <TabHead title="Catat Keluar" sub="Pengeluaran toko" />
      {!open ? (
        <button onClick={() => setOpen(true)} className="pressable rounded-[14px] bg-teks px-4 py-2.5 text-sm font-extrabold text-white">+ Catat Keluar</button>
      ) : (
        <form className="flex flex-wrap gap-2 rounded-[18px] border border-garis bg-kartu p-3 shadow-card" onSubmit={async (e) => {
          e.preventDefault();
          const j = Number(jumlah);
          if (!nama.trim() || !(j > 0)) { alert("Isi nama & jumlah."); return; }
          const exp: Expense = { id: `exp_m_${Date.now().toString(36)}`, tanggal: new Date().toISOString().slice(0, 10), nama: nama.trim(), jumlah: j, createdAt: Date.now() };
          const ok = await auto("Tersimpan", () => addExpense(exp));
          if (!ok) return;
          setOpen(false); setNama(""); setJumlah(""); onAdd(exp);
        }}>
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Keperluan" className={`${input} min-w-0 flex-1`} aria-label="Keperluan" />
          <input value={formatRibuan(jumlah)} onChange={(e) => setJumlah(e.target.value.replace(/\D/g, ""))} placeholder="Jumlah" inputMode="numeric" className={`${input} w-28 tabular-nums`} aria-label="Jumlah" />
          <button className="pressable rounded-[14px] bg-primer px-4 py-2.5 text-sm font-extrabold text-white shadow-btn">Simpan</button>
          <button type="button" onClick={() => setOpen(false)} className="pressable rounded-[14px] px-3 py-2.5 text-sm ring-1 ring-garis">Batal</button>
        </form>
      )}
      <ul className="mt-3 space-y-1.5 text-sm">
        {exps.slice(0, 20).map((e) => (
          <li key={e.id} className="flex justify-between rounded-[14px] border border-garis bg-kartu px-3 py-2 shadow-card">
            <span><b>{e.nama}</b> <span className="text-xs text-teks2 tabular-nums">{e.tanggal}</span></span><b className="tabular-nums">{rupiah(e.jumlah)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

