"use client";
import { useEffect, useState } from "react";
import type { Product, Transaction } from "@/lib/db/schema";
import { setMeta } from "@/lib/db/repos";
import type { aggregate } from "@/lib/analytics/aggregate";
import { rupiah } from "@/lib/wa/template";
import { TabHead } from "./shared";
import { addMonths, fmtBulan, thisMonthKey } from "./hari";

type Agg = Awaited<ReturnType<typeof aggregate>> | null;

const JAM_CLS = "rounded-[14px] border border-garis bg-bg px-3 py-2.5 text-sm outline-none focus:border-primer";

// Dropdown jam 00-23 + menit 00-59 (tampilan selalu 24 jam: 13:00 dst).
// Sengaja tidak pakai input type="time" karena tampilannya ikut locale
// OS/browser (di Windows EN jadi AM/PM). Nilai tetap "JJ:MM", simpan saat dipilih.
function parseJam(v: string): [string, string] {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v.trim());
  if (!m) return ["08", "00"];
  return [m[1], m[2]];
}
const JAM_LIST = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MENIT_LIST = Array.from({ length: 60 }, (_, m) => String(m).padStart(2, "0"));
function JamInput({ label, value, onCommit }: { label: string; value: string; onCommit: (v: string) => void }) {
  const [hh, mm] = parseJam(value);
  const commit = (nh: string, nm: string) => {
    const v = `${nh}:${nm}`;
    if (v !== value) onCommit(v);
  };
  return (
    <span className="text-xs font-bold">{label}{" "}
      <select value={hh} onChange={(e) => commit(e.target.value, mm)} aria-label={`Jam ${label}`}
        className={`${JAM_CLS} ml-1 w-20 tabular-nums`}>
        {JAM_LIST.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="mx-1 font-extrabold" aria-hidden>:</span>
      <select value={mm} onChange={(e) => commit(hh, e.target.value)} aria-label={`Menit ${label}`}
        className={`${JAM_CLS} w-20 tabular-nums`}>
        {MENIT_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </span>
  );
}

export default function DashboardTab({ agg, low, txns, openHour, setOpenHour, closeHour, setCloseHour, override, setOverride, auto }: {
  agg: Agg; low: Product[]; txns: Transaction[];
  openHour: string; setOpenHour: (v: string) => void;
  closeHour: string; setCloseHour: (v: string) => void;
  override: string; setOverride: (v: string) => void;
  auto: (okMsg: string, fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const input = "rounded-[14px] border border-garis bg-bg px-3 py-2.5 text-sm outline-none focus:border-primer";
  const [bulan, setBulan] = useState(() => thisMonthKey());
  const nowM = thisMonthKey();
  const isNow = bulan === nowM;
  const r = agg?.riwayatBulan.find((x) => x.month === bulan);
  const hist = txns.filter((t) => t.tanggal.slice(0, 7) === bulan).slice(0, 6);
  const pill = (on: boolean) =>
    `pressable h-9 rounded-full px-4 text-[13px] font-bold ${on ? "bg-primer text-white" : "bg-kartu text-teks ring-1 ring-garis"}`;
  const cards: [string, string][] = [
    ...(isNow ? [["Omzet hari ini", rupiah(agg?.omzetHari ?? 0)] as [string, string]] : []),
    [isNow ? "Omzet bulan ini" : `Omzet ${fmtBulan(bulan)}`, rupiah(r?.omzet ?? 0)],
    ["Barang laku (pcs)", String(r?.pcs ?? 0)],
    ["Keluar + bersih", `${rupiah(r?.keluar ?? 0)} • ${rupiah(r?.bersih ?? 0)}`],
  ];
  return (
    <div className="fade-up">
      <TabHead title="Dashboard" sub={isNow ? "Ringkasan hari ini" : `Ringkasan ${fmtBulan(bulan)}`} />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter bulan">
        <button onClick={() => setBulan(nowM)} aria-pressed={isNow} className={pill(isNow)}>Bulan ini</button>
        <button onClick={() => setBulan(addMonths(nowM, -1))} aria-pressed={bulan === addMonths(nowM, -1)} className={pill(bulan === addMonths(nowM, -1))}>Bulan lalu</button>
        <input type="month" value={bulan} onChange={(e) => { if (e.target.value) setBulan(e.target.value); }}
          className={`${input} tabular-nums`} aria-label="Pilih bulan" />
      </div>
      <p className="mb-3 mt-1 text-xs text-teks2 tabular-nums">{fmtBulan(bulan)}</p>
      {low.length > 0 && (
        <div role="status" className="mb-3 rounded-[18px] border border-aksen/40 bg-aksen/10 p-3 text-sm shadow-card">
          <b>Stok menipis:</b> {low.map((p) => `${p.nama} (${p.stok})`).join(", ")}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className="rounded-[18px] border border-garis bg-kartu p-4 shadow-card">
            <div className="gold-rule" aria-hidden />
            <p className="mt-1 text-[11px] font-bold text-teks2">{l}</p>
            <p className="mt-1 text-lg font-extrabold tabular-nums text-primer">{v}</p>
          </div>
        ))}
      </div>

      <h3 className="mb-2 mt-5 text-sm font-extrabold">Jam toko</h3>
      <div className="flex flex-wrap items-end gap-2 rounded-[18px] border border-garis bg-kartu p-3 shadow-card">
        <JamInput label="Buka" value={openHour} onCommit={(v) => { setOpenHour(v); auto("Tersimpan", () => setMeta("openHour", v)); }} />
        <JamInput label="Tutup" value={closeHour} onCommit={(v) => { setCloseHour(v); auto("Tersimpan", () => setMeta("closeHour", v)); }} />
        <label className="text-xs font-bold">Override
          <select value={override} onChange={(e) => { setOverride(e.target.value); auto("Tersimpan", () => setMeta("openOverride", e.target.value)); }} className={`${input} ml-1`}>
            <option value="auto">Otomatis</option>
            <option value="buka">Paksa buka</option>
            <option value="tutup">Paksa tutup</option>
          </select>
        </label>
        <span className="text-xs text-teks2">Tersimpan otomatis.</span>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-extrabold">Laku terakhir (6)</h3>
      <div className="space-y-2 md:hidden">
        {hist.map((t) => (
          <div key={t.id ?? `d-${t.createdAt}`} className="rounded-[18px] border border-garis bg-kartu p-3 text-sm shadow-card">
            <p className="font-bold">{t.nama} • <span className="tabular-nums">{rupiah(t.total)}</span></p>
            <p className="text-xs text-teks2 tabular-nums">{t.tanggal} • {t.items.reduce((s, i) => s + i.qty, 0)} pcs • {t.status}</p>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-[18px] border border-garis bg-kartu shadow-card md:block">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-teks2"><th className="p-3">Tanggal</th><th className="p-3">Pembeli</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {hist.map((t) => (
              <tr key={t.id ?? `d-${t.createdAt}`} className="border-t border-garis odd:bg-bg/60">
                <td className="p-3 tabular-nums">{t.tanggal}</td><td className="p-3 font-bold">{t.nama}</td>
                <td className="p-3">{t.items.map((i) => `${i.nama} x${i.qty}`).join(", ")}</td>
                <td className="p-3 font-bold tabular-nums">{rupiah(t.total)}</td><td className="p-3">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

