"use client";
import { useMemo, useState } from "react";
import type { Transaction, TxnStatus } from "@/lib/db/schema";
import { NEXT_STATUS } from "@/lib/db/schema";
import { deleteTransaction, setTransactionStatus } from "@/lib/db/repos";
import { rupiah } from "@/lib/wa/template";
import { TabHead } from "./shared";
import ConfirmDialog from "@/components/system/ConfirmDialog";
import ModalPortal from "@/components/system/ModalPortal";
import InvoiceModal from "./InvoiceModal";
import { useMountedTransition } from "@/lib/anim/useMountedTransition";
import { useLockBody } from "@/lib/anim/useLockBody";
import { addDays, fmtHari, todayKey } from "./hari";

const STATUS: { id: TxnStatus; label: string }[] = [
  { id: "sent", label: "Baru" },
  { id: "process", label: "Diproses" },
  { id: "done", label: "Selesai" },
  { id: "cancel", label: "Batal" },
];
const statusLabel = (s: string) => STATUS.find((x) => x.id === s)?.label ?? s;

function StatusBadge({ s }: { s: string }) {
  const cls =
    s === "done" ? "bg-primer text-white" :
    s === "process" ? "bg-aksen text-white" :
    s === "cancel" ? "bg-teks/10 text-teks" :
    "border border-emas text-emas";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{statusLabel(s)}</span>;
}

export default function PesananTab({ txns, wa, auto }: {
  txns: Transaction[]; wa: string;
  auto: (okMsg: string, fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [kind, setKind] = useState<"produk" | "po">("produk");
  const [fStatus, setFStatus] = useState<"semua" | TxnStatus>("semua");
  const [q, setQ] = useState("");
  const [hari, setHari] = useState(() => todayKey());
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<Transaction | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const input = "rounded-[14px] border border-garis bg-kartu px-3 py-2.5 text-sm outline-none focus:border-primer";
  const sheetT = useMountedTransition(sheetId != null, 220);
  useLockBody(sheetT.mounted);
  const sheetTxn = sheetId != null ? txns.find((t) => t.id === sheetId) ?? null : null;
  const next = sheetTxn != null ? NEXT_STATUS[sheetTxn.status][0] ?? null : null;

  async function advance() {
    if (!sheetTxn || !next || busy) return;
    setBusy(true);
    try {
      const ok = await auto("Tersimpan", () => setTransactionStatus(sheetTxn.id, next, sheetTxn.status));
      if (ok) setSheetId(null);
    } finally { setBusy(false); }
  }

  async function doDelete() {
    if (confirmId == null) return;
    const id = confirmId;
    setConfirmId(null);
    setSheetId(null);
    await auto("Terhapus", () => deleteTransaction(id));
  }

  const shown = useMemo(() => {
    return txns
      .filter((t) => t.tanggal === hari)
      .filter((t) => (kind === "po" ? t.items.some((i) => i.isPO) : !t.items.some((i) => i.isPO)))
      .filter((t) => (fStatus === "semua" ? true : t.status === fStatus))
      .filter((t) => (q ? t.nama.toLowerCase().includes(q.toLowerCase()) : true));
  }, [txns, hari, kind, fStatus, q]);
  const today = todayKey();
  const pill = (on: boolean) =>
    `pressable h-9 rounded-full px-4 text-[13px] font-bold ${on ? "bg-primer text-white" : "bg-kartu text-teks ring-1 ring-garis"}`;

  return (
    <div className="fade-up">
      <TabHead title="Pesanan" sub={`${shown.length} pesanan`} />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter hari">
        <button onClick={() => setHari(today)} aria-pressed={hari === today} className={pill(hari === today)}>Hari ini</button>
        <button onClick={() => setHari(addDays(today, -1))} aria-pressed={hari === addDays(today, -1)} className={pill(hari === addDays(today, -1))}>Kemarin</button>
        <input type="date" value={hari} onChange={(e) => { if (e.target.value) setHari(e.target.value); }}
          className={`${input} tabular-nums`} aria-label="Pilih tanggal" />
      </div>
      <p className="mt-1 text-xs text-teks2 tabular-nums">{fmtHari(hari)}</p>
      <div className="flex gap-2" role="tablist" aria-label="Jenis pesanan">
        {(["produk", "po"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
            className={`pressable h-9 rounded-full px-4 text-[13px] font-bold capitalize ${kind === k ? "bg-primer text-white" : "bg-kartu text-teks ring-1 ring-garis"}`}>
            {k === "produk" ? "Produk" : "PO"}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama…"
          className={`${input} min-w-40 flex-1`} aria-label="Cari nama" />
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value as "semua" | TxnStatus)} className={input} aria-label="Filter status">
          <option value="semua">Semua status</option>
          {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <ul className="mt-3 space-y-2">
        {shown.map((t) => (
          <li key={t.id} className="rounded-[18px] border border-garis bg-kartu shadow-card">
            <button onClick={() => setSheetId(t.id)}
              className="pressable flex w-full items-center gap-2 p-3 text-left text-sm">
              <span className="min-w-0 flex-1">
                <b>{t.nama}</b>{" "}
                <span className="text-xs text-teks2 tabular-nums">{t.tanggal} • {rupiah(t.total)}</span>
              </span>
              <StatusBadge s={t.status} />
            </button>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="py-10 text-center text-sm text-teks2">Belum ada pesanan di sini.</p>}

      {sheetT.mounted && sheetTxn && (
        <ModalPortal>
          <div className={`${sheetT.leaving ? "backdrop-out" : "backdrop-in"} fixed inset-0 z-[90] h-screen w-screen bg-black/40 backdrop-blur-sm`} aria-hidden onClick={() => setSheetId(null)} />
          <div className="fixed inset-0 z-[95] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="History pesanan">
          <div className={`${sheetT.leaving ? "modal-out" : "modal-in"} relative mx-auto flex max-h-[92dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-[20px] border border-garis bg-kartu shadow-float`}>
            {/* Header — sticky */}
            <div className="shrink-0 border-b border-garis/70 px-5 pb-3 pt-4">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[15px] font-extrabold leading-snug">{sheetTxn.nama}</p>
                <StatusBadge s={sheetTxn.status} />
                <button onClick={() => setSheetId(null)} aria-label="Tutup"
                  className="pressable ml-1 grid size-8 shrink-0 place-items-center rounded-full text-sm text-teks2 ring-1 ring-garis">✕</button>
              </div>
              <p className="mt-1 text-xs text-teks2 tabular-nums">{sheetTxn.tanggal} • {sheetTxn.metode === "antar" ? "Antar" : "Ambil"} • via {sheetTxn.via ?? "WA"}</p>
            </div>
            {/* Body — scroll */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <section aria-label="Item pesanan">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teks2">Pesanan</p>
                <table className="mt-1.5 w-full text-[13px]">
                  <tbody>
                    {sheetTxn.items.map((it, k) => (
                      <tr key={k} className="border-b border-garis/60 last:border-0">
                        <td className="py-2 pr-3 align-top leading-snug">{it.nama}{it.isPO && <span className="ml-1.5 whitespace-nowrap rounded-full border border-emas px-1.5 py-px text-[10px] font-bold text-emas">PO</span>} <span className="whitespace-nowrap text-teks2 tabular-nums">×{it.qty}</span></td>
                        <td className="whitespace-nowrap py-2 text-right align-top font-semibold tabular-nums">{rupiah(it.subtotal ?? it.harga * it.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section aria-label="Ringkasan biaya" className="rounded-2xl bg-primer/[0.06] px-4 py-3">
                <p className="flex items-baseline justify-between text-[13px] text-teks2"><span>Ongkir</span><span className="font-semibold text-teks tabular-nums">{sheetTxn.ongkir > 0 ? rupiah(sheetTxn.ongkir) : "Gratis"}</span></p>
                <p className="mt-1.5 flex items-baseline justify-between border-t border-garis/70 pt-2 text-base font-extrabold tabular-nums"><span>Total</span><span className="text-primer">{rupiah(sheetTxn.total)}</span></p>
              </section>
              {(sheetTxn.alamat || sheetTxn.catatan) && (
                <section aria-label="Info pengiriman" className="space-y-1.5 text-xs leading-relaxed text-teks2">
                  {sheetTxn.alamat && <p><span className="font-bold text-teks">Alamat: </span>{sheetTxn.alamat}</p>}
                  {sheetTxn.catatan && <p><span className="font-bold text-teks">Catatan: </span>{sheetTxn.catatan}</p>}
                </section>
              )}
              {sheetTxn.lat != null && sheetTxn.lng != null && (
                <div className="overflow-hidden rounded-2xl border border-garis">
                  <iframe title={`Peta ${sheetTxn.nama}`} loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${sheetTxn.lng - 0.01},${sheetTxn.lat - 0.008},${sheetTxn.lng + 0.01},${sheetTxn.lat + 0.008}&layer=mapnik&marker=${sheetTxn.lat},${sheetTxn.lng}`}
                    className="h-36 w-full border-0" />
                  <div className="flex divide-x divide-garis bg-white">
                    <a href={sheetTxn.mapsUrl ?? `https://www.google.com/maps?q=${sheetTxn.lat},${sheetTxn.lng}`} target="_blank" rel="noopener"
                      className="flex-1 px-3 py-2.5 text-center text-xs font-bold text-primer">Buka di Maps</a>
                    <a href={`https://www.openstreetmap.org/?mlat=${sheetTxn.lat}&mlon=${sheetTxn.lng}#map=16/${sheetTxn.lat}/${sheetTxn.lng}`} target="_blank" rel="noopener"
                      className="flex-1 px-3 py-2.5 text-center text-xs font-bold text-teks2">Buka di OSM</a>
                  </div>
                </div>
              )}
            </div>
            {/* Footer — sticky */}
            <div className="shrink-0 border-t border-garis/70 bg-kartu px-5 py-3.5">
              {next != null ? (
                <button onClick={advance} disabled={busy}
                  className="pressable btn-lift w-full rounded-[14px] bg-primer py-3 text-sm font-extrabold text-white shadow-btn disabled:opacity-40">
                  {busy ? "Menyimpan…" : `Lanjut ke: ${statusLabel(next)}`}
                </button>
              ) : (
                <p className="rounded-[14px] bg-teks/[0.06] py-2.5 text-center text-xs font-bold text-teks2">Status final — terkunci.</p>
              )}
              <div className="mt-2 flex gap-2">
                <button onClick={() => { setInvoice(sheetTxn); setSheetId(null); }}
                  className="pressable btn-lift flex-1 rounded-[14px] bg-primer py-2.5 text-xs font-extrabold text-white shadow-btn">Kirim Invoice</button>
                <button onClick={() => { setConfirmId(sheetTxn.id); setSheetId(null); }}
                  className="pressable rounded-[14px] px-4 py-2.5 text-xs font-bold text-[#DC2626] ring-1 ring-garis">Hapus</button>
              </div>
            </div>
          </div>
          </div>
        </ModalPortal>
      )}

      <InvoiceModal txn={invoice} wa={wa} onClose={() => setInvoice(null)} />
      <ConfirmDialog open={confirmId != null} title="Hapus pesanan?"
        message="Pesanan langsung terhapus permanen."
        confirmLabel="Hapus"
        onConfirm={doDelete}
        onCancel={() => setConfirmId(null)} />
    </div>
  );
}

