"use client";
import { useState } from "react";
import type { aggregate } from "@/lib/analytics/aggregate";
import { rupiah } from "@/lib/wa/template";
import { TabHead } from "./shared";
import { addMonths, fmtBulan, thisMonthKey } from "./hari";

type Agg = Awaited<ReturnType<typeof aggregate>> | null;
type G = "harian" | "bulanan" | "tahunan";

function MiniBars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="no-scrollbar mt-3 flex h-40 items-end gap-1.5 overflow-x-auto" aria-hidden>
      {values.map((v, i) => (
        <div key={i} className="flex h-full w-8 shrink-0 flex-col items-center justify-end gap-1">
          <div className="w-full rounded-t-lg bg-primer" style={{ height: `${Math.max(3, Math.round((v / max) * 100))}%` }} />
          <span className="text-[9px] text-teks2 tabular-nums">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function GrafikTab({ agg, grafik, setGrafik, isDesktopChart, Bar, Line }: {
  agg: Agg; grafik: G; setGrafik: (g: G) => void; isDesktopChart: boolean;
  Bar: React.ComponentType<any>; Line: React.ComponentType<any>;
}) {
  const input = "rounded-[14px] border border-garis bg-kartu px-3 py-2.5 text-sm outline-none focus:border-primer";
  const [bulan, setBulan] = useState(() => thisMonthKey());
  const nowM = thisMonthKey();
  const isNow = bulan === nowM;
  const pill = (on: boolean) =>
    `pressable h-9 rounded-full px-4 text-[13px] font-bold ${on ? "bg-primer text-white" : "text-teks ring-1 ring-garis"}`;

  const riw = agg?.riwayatBulan ?? [];
  const rmap = new Map(riw.map((r) => [r.month, r]));
  const entry = rmap.get(bulan);
  const kosong = !entry || (entry.omzet === 0 && entry.pcs === 0);

  // Jendela 12 bulan berakhir di bulan terpilih (mode bulanan ikut seleksi).
  const win = Array.from({ length: 12 }, (_, k) => addMonths(bulan, k - 11));
  const bul = win.map((mk) => ({ label: mk.slice(2), total: rmap.get(mk)?.omzet ?? 0, keluar: rmap.get(mk)?.keluar ?? 0 }));
  const ymap = new Map<string, number>();
  for (const r of riw) { const y = r.month.slice(0, 4); ymap.set(y, (ymap.get(y) ?? 0) + r.omzet); }
  const thn = [...ymap.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => a.label.localeCompare(b.label));

  const terlaris = entry?.laku.slice(0, 3).map((l) => `${l.nama} (${l.qty})`).join(", ") || "-";

  return (
    <div className="fade-up rounded-[18px] border border-garis bg-kartu p-4 shadow-card">
      <TabHead title="Grafik" sub={isNow ? "Bulan ini" : fmtBulan(bulan)} />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter bulan">
        <button onClick={() => setBulan(nowM)} aria-pressed={isNow} className={pill(isNow)}>Bulan ini</button>
        <button onClick={() => setBulan(addMonths(nowM, -1))} aria-pressed={bulan === addMonths(nowM, -1)} className={pill(bulan === addMonths(nowM, -1))}>Bulan lalu</button>
        <input type="month" value={bulan} onChange={(e) => { if (e.target.value) setBulan(e.target.value); }}
          className={`${input} tabular-nums`} aria-label="Pilih bulan" />
      </div>
      <p className="mt-1 text-xs text-teks2 tabular-nums">{fmtBulan(bulan)}</p>
      <div className="mt-2 flex gap-1" role="tablist" aria-label="Grafik">
        {(["harian", "bulanan", "tahunan"] as const).map((g) => (
          <button key={g} role="tab" aria-selected={grafik === g} onClick={() => setGrafik(g)}
            className={`pressable h-9 rounded-full px-4 text-[13px] font-bold capitalize ${grafik === g ? "bg-primer text-white" : "text-teks ring-1 ring-garis"}`}>{g}</button>
        ))}
      </div>
      {kosong ? (
        <p className="py-10 text-center text-sm text-teks2">Belum ada data pada {fmtBulan(bulan)}.</p>
      ) : !isDesktopChart ? (
        grafik === "harian"
          ? <MiniBars values={(entry?.harian ?? []).map((d) => d.total)} labels={(entry?.harian ?? []).map((d) => d.label)} />
          : grafik === "bulanan"
            ? <MiniBars values={bul.map((d) => d.total)} labels={bul.map((d) => d.label)} />
            : <MiniBars values={thn.map((d) => d.total)} labels={thn.map((d) => d.label)} />
      ) : grafik === "harian" ? (
        <div className="mt-3 h-64"><Line data={{ labels: entry?.harian.map((d) => d.label), datasets: [{ label: `Omzet harian ${fmtBulan(bulan)}`, data: entry?.harian.map((d) => d.total), borderColor: "#0C5B40", backgroundColor: "rgba(12,91,64,.15)", tension: 0.3 }] }} options={{ maintainAspectRatio: false }} /></div>
      ) : grafik === "bulanan" ? (
        <div className="mt-3 h-64"><Bar data={{ labels: bul.map((d) => d.label), datasets: [{ label: "Omzet bulanan", data: bul.map((d) => d.total), backgroundColor: "#0C5B40" }, { label: "Pengeluaran", data: bul.map((d) => d.keluar), backgroundColor: "rgba(220,60,60,.55)" }] }} options={{ maintainAspectRatio: false }} /></div>
      ) : (
        <div className="mt-3 h-64"><Line data={{ labels: thn.map((d) => d.label), datasets: [{ label: "Omzet tahunan", data: thn.map((d) => d.total), borderColor: "#0C5B40", tension: 0.3 }] }} options={{ maintainAspectRatio: false }} /></div>
      )}
      <p className="mt-2 text-[11px] text-teks2 tabular-nums">Omzet {fmtBulan(bulan)} {rupiah(entry?.omzet ?? 0)} • {(entry?.pcs ?? 0)} pcs • Terlaris: {terlaris}</p>
    </div>
  );
}
