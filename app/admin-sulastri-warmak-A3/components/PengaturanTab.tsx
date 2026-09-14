"use client";
import { useRef } from "react";
import { exportBackup, importBackup, setMeta } from "@/lib/db/repos";
import { TabHead, normalizeWa } from "./shared";
import HeroEditor from "./HeroEditor";

export default function PengaturanTab({ wa, setWa, auto }: {
  wa: string; setWa: (v: string) => void;
  auto: (okMsg: string, fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const waTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onWa(v: string) {
    const full = normalizeWa(v);
    setWa(full);
    if (waTimer.current) clearTimeout(waTimer.current);
    if (full.length < 10) return;
    waTimer.current = setTimeout(() => { auto("Tersimpan", () => setMeta("shopWaNumber", full)); }, 800);
  }
  const input = "rounded-[14px] border border-garis bg-bg px-3 py-2.5 text-sm outline-none focus:border-primer";
  return (
    <div className="fade-up grid gap-4 md:grid-cols-2">
      <section className="rounded-[18px] border border-garis bg-kartu p-4 shadow-card">
        <TabHead title="WhatsApp" sub="Dipakai di semua link wa.me" />
        <div className="flex">
          <span aria-hidden className="grid shrink-0 place-items-center rounded-l-[14px] border border-r-0 border-garis bg-bg px-3 text-sm font-extrabold text-primer">+62</span>
          <input
            value={wa.startsWith("62") ? wa.slice(2) : wa.replace(/^0+/, "")}
            onChange={(e) => onWa(e.target.value)}
            inputMode="numeric" placeholder="812xxxxxxx"
            className={`${input} w-full rounded-l-none tabular-nums`} aria-label="Nomor WA tanpa +62" />
        </div>
        <p className="mt-1 text-[11px] text-teks2">Awalan +62 terkunci; cukup ketik tanpa 0 (0812 → 812). Tersimpan otomatis saat valid (≥10 digit).</p>
      </section>
      <section className="rounded-[18px] border border-garis bg-kartu p-4 shadow-card">
        <TabHead title="Backup" sub="JSON via cloud" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={async () => {
            try {
              const data = await exportBackup();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `warmak-a3-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
            } catch (e) { alert(e instanceof Error ? e.message : "Export gagal — cek internet/rules."); }
          }} className="pressable rounded-[14px] bg-teks px-4 py-2.5 text-sm font-bold text-white">Export JSON</button>
          <label className="pressable cursor-pointer rounded-[14px] px-4 py-2.5 text-sm font-bold ring-1 ring-garis">
            Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const data = JSON.parse(await f.text());
                await importBackup(data);
                alert("Import berhasil — daftar refresh otomatis.");
              } catch (err) { alert(err instanceof Error ? err.message : "File tidak valid."); }
            }} />
          </label>
        </div>
      </section>
      <section className="rounded-[18px] border border-garis bg-kartu p-4 shadow-card md:col-span-2">
        <TabHead title="Hero slider" sub="Maks 4 tampil • kosong = 3 default" />
        <HeroEditor auto={auto} />
      </section>
    </div>
  );
}

