import type { Expense, Transaction } from "@/lib/db/schema";
import { getContentVersion } from "@/lib/content/version";

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const monthKey = (d: Date) => d.toISOString().slice(0, 7);

// omzet GROSS = sum total status done SAJA (sent/process/cancel tidak dihitung)
export function gross(txns: Transaction[]): number {
  return txns.filter((t) => t.status === "done").reduce((s, t) => s + t.total, 0);
}

export interface AggregateResult {
  version: number;
  omzetHari: number; omzetBulan: number; pcs: number; pengeluaran: number; bersih: number;
  laku: { nama: string; qty: number }[];
  harian30: { label: string; total: number }[];
  bulanan12: { label: string; total: number }[];
  tahunan: { label: string; total: number }[];
  riwayatBulan: {
    month: string; omzet: number; pcs: number; keluar: number; bersih: number;
    laku: { nama: string; qty: number }[];
    harian: { key: string; label: string; total: number }[];
  }[];
}

export async function aggregate(txns: Transaction[], exps: Expense[], now = new Date()): Promise<AggregateResult> {
  const version = await getContentVersion().catch(() => 0);
  const valid = txns.filter((t) => t.status === "done");
  const today = dayKey(now), month = monthKey(now);
  const omzetHari = valid.filter((t) => t.tanggal === today).reduce((s, t) => s + t.total, 0);
  const omzetBulan = valid.filter((t) => t.tanggal.slice(0, 7) === month).reduce((s, t) => s + t.total, 0);
  const pcs = valid.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0);
  const pengeluaran = exps.filter((e) => e.tanggal.slice(0, 7) === month).reduce((s, e) => s + e.jumlah, 0);

  const map = new Map<string, number>();
  for (const t of valid) for (const i of t.items) map.set(i.nama, (map.get(i.nama) ?? 0) + i.qty);
  const laku = [...map.entries()].map(([nama, qty]) => ({ nama, qty })).sort((a, b) => b.qty - a.qty);

  const harian30 = Array.from({ length: 30 }, (_, k) => {
    const d = new Date(now); d.setDate(d.getDate() - (29 - k));
    const key = dayKey(d);
    return { label: key.slice(5), total: valid.filter((t) => t.tanggal === key).reduce((s, t) => s + t.total, 0) };
  });
  const bulanan12 = Array.from({ length: 12 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - k), 1);
    const key = monthKey(d);
    return { label: key.slice(2), total: valid.filter((t) => t.tanggal.slice(0, 7) === key).reduce((s, t) => s + t.total, 0) };
  });
  const yMap = new Map<string, number>();
  for (const t of valid) { const y = t.tanggal.slice(0, 4); yMap.set(y, (yMap.get(y) ?? 0) + t.total); }
  const tahunan = [...yMap.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => a.label.localeCompare(b.label));

  // Riwayat per bulan (filter bulanan Dashboard/Grafik, terbaru dulu). Tampilan saja.
  const rb = new Map<string, { omzet: number; pcs: number; keluar: number; laku: Map<string, number>; harian: Map<string, number> }>();
  const bucket = (m: string) => {
    let b = rb.get(m);
    if (!b) { b = { omzet: 0, pcs: 0, keluar: 0, laku: new Map(), harian: new Map() }; rb.set(m, b); }
    return b;
  };
  for (const t of valid) {
    const b = bucket(t.tanggal.slice(0, 7));
    b.omzet += t.total;
    b.pcs += t.items.reduce((a, i) => a + i.qty, 0);
    b.harian.set(t.tanggal, (b.harian.get(t.tanggal) ?? 0) + t.total);
    for (const i of t.items) b.laku.set(i.nama, (b.laku.get(i.nama) ?? 0) + i.qty);
  }
  for (const e of exps) bucket(e.tanggal.slice(0, 7)).keluar += e.jumlah;
  const daysIn = (m: string) => new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate();
  const riwayatBulan = [...rb.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([m, b]) => ({
      month: m, omzet: b.omzet, pcs: b.pcs, keluar: b.keluar, bersih: b.omzet - b.keluar,
      laku: [...b.laku.entries()].map(([nama, qty]) => ({ nama, qty })).sort((x, y) => y.qty - x.qty),
      harian: Array.from({ length: daysIn(m) }, (_, k) => {
        const key = `${m}-${String(k + 1).padStart(2, "0")}`;
        return { key, label: String(k + 1), total: b.harian.get(key) ?? 0 };
      }),
    }));

  return { version, omzetHari, omzetBulan, pcs, pengeluaran, bersih: omzetBulan - pengeluaran, laku, harian30, bulanan12, tahunan, riwayatBulan };
}
