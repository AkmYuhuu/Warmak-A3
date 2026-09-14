"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  useLive, seedIfEmpty,
} from "@/lib/db/repos";
import { useDrafts } from "@/lib/content/draft";
import { useMountedTransition } from "@/lib/anim/useMountedTransition";
import ConfirmDialog from "@/components/system/ConfirmDialog";
import SyncBadge from "@/components/system/SyncBadge";
import { aggregate } from "@/lib/analytics/aggregate";
import type { Expense, Product, Transaction } from "@/lib/db/schema";
import DashboardTab from "./components/DashboardTab";
import ProdukTab from "./components/ProdukTab";
import PesananTab from "./components/PesananTab";
import LakuTab from "./components/LakuTab";
import KeluarTab from "./components/KeluarTab";
import GrafikTab from "./components/GrafikTab";
import PengaturanTab from "./components/PengaturanTab";

const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), { ssr: false, loading: () => <div className="skeleton mt-3 h-40 rounded-[18px]" /> });
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), { ssr: false, loading: () => <div className="skeleton mt-3 h-40 rounded-[18px]" /> });

type Tab = "dashboard" | "produk" | "pesanan" | "laku" | "keluar" | "grafik" | "pengaturan";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" }, { id: "produk", label: "Produk & Stok" },
  { id: "pesanan", label: "Pesanan" },
  { id: "laku", label: "Laku" }, { id: "keluar", label: "Keluar" },
  { id: "grafik", label: "Grafik" }, { id: "pengaturan", label: "Pengaturan" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const { products: liveProducts, txns: liveTxns, exps: liveExps, settings, loading, error } = useLive();
  // Optimistis lokal di atas data live (langsung terasa, realtime mengonfirmasi).
  const [localProducts, setLocalProducts] = useState<Product[] | null>(null);
  const [localTxns, setLocalTxns] = useState<Transaction[] | null>(null);
  const [localExps, setLocalExps] = useState<Expense[] | null>(null);
  const products = localProducts ?? liveProducts;
  const txns = localTxns ?? liveTxns;
  const exps = localExps ?? liveExps;
  // Selaraskan lagi saat cloud berubah (tanpa menimpa edit yang masih ber-draft? realtime menang).
  useEffect(() => { setLocalProducts(null); }, [liveProducts]);
  useEffect(() => { setLocalTxns(null); }, [liveTxns]);
  useEffect(() => { setLocalExps(null); }, [liveExps]);
  const [agg, setAgg] = useState<Awaited<ReturnType<typeof aggregate>> | null>(null);
  // Day-tick: string YYYY-MM-DD lokal, refresh tiap 30 dtk agar omzet hari/bulan
  // + tanggal header berganti otomatis lewat tengah malam tanpa reload.
  const localDay = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const [today, setToday] = useState(localDay);
  useEffect(() => {
    const id = setInterval(() => setToday(localDay()), 30000);
    return () => clearInterval(id);
  }, []);
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("Semua");
  const [menipis, setMenipis] = useState(false);
  const [wa, setWa] = useState("");
  const [openHour, setOpenHour] = useState("08:00");
  const [closeHour, setCloseHour] = useState("19:00");
  const [override, setOverride] = useState("auto");
  const [grafik, setGrafik] = useState<"harian" | "bulanan" | "tahunan">("harian");
  const [isDesktopChart, setIsDesktopChart] = useState(false);
  const [editorFor, setEditorFor] = useState<Product | "baru" | null>(null);
  const { count: draftCount, stage, discard, commit, saving } = useDrafts();
  const draftT = useMountedTransition(draftCount > 0, 200);
  const [confirmHapus, setConfirmHapus] = useState<Product | null>(null);
  const [confirmBuang, setConfirmBuang] = useState(false);

  useEffect(() => {
    seedIfEmpty().catch(() => null);
    setIsDesktopChart(window.matchMedia("(min-width: 768px)").matches);
    import("chart.js").then(({ Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);
    }).catch(() => null);
  }, []);
  // Isi form pengaturan dari cloud sekali saat data tiba.
  const settingsInit = useRef(false);
  useEffect(() => {
    if (loading || settingsInit.current) return;
    settingsInit.current = true;
    setWa(settings.shopWaNumber);
    setOpenHour(settings.openHour);
    setCloseHour(settings.closeHour);
    setOverride(settings.openOverride);
  }, [loading, settings]);
  useEffect(() => { aggregate(txns, exps).then(setAgg).catch(() => null); }, [txns, exps, today]);
  // Ping pesanan baru bila tab Pesanan tak aktif (badge + toast kecil).
  const seenMax = useRef(0);
  const seenInit = useRef(false);
  const [orderPing, setOrderPing] = useState(false);
  useEffect(() => {
    if (!txns.length) return;
    const mx = txns.reduce((m, t) => Math.max(m, t.createdAt), 0);
    if (!seenInit.current) { seenInit.current = true; seenMax.current = mx; return; }
    if (mx > seenMax.current) {
      seenMax.current = mx;
      if (tab !== "pesanan") {
        setOrderPing(true);
        setTimeout(() => setOrderPing(false), 4000);
      }
    }
  }, [txns, tab]);
  useEffect(() => {
    if (tab === "pesanan" && txns.length) {
      seenMax.current = txns.reduce((m, t) => Math.max(m, t.createdAt), seenMax.current);
      setOrderPing(false);
    }
  }, [tab, txns]);

  const cats = useMemo(() => ["Semua", ...Array.from(new Set(products.map((p) => p.kategori)))], [products]);
  const filtered = useMemo(() => {
    let r = [...products];
    if (q) r = r.filter((p) => p.nama.toLowerCase().includes(q.toLowerCase()));
    if (kat !== "Semua") r = r.filter((p) => p.kategori === kat);
    if (menipis) r = r.filter((p) => p.stok >= 0 && p.stok <= 10);
    return r.sort((a, b) => (a.stok === 0 ? 1 : 0) - (b.stok === 0 ? 1 : 0) || a.nama.localeCompare(b.nama));
  }, [products, q, kat, menipis]);
  const low = useMemo(() => products.filter((p) => p.aktif && p.stok <= 10), [products]);

  function reload() { window.location.reload(); }

  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Tulis otomatis langsung (tanpa draft): toast kecil ok/err. true = ok.
  async function auto(okMsg: string, fn: () => Promise<unknown>): Promise<boolean> {
    try {
      await fn();
      setToast({ kind: "ok", msg: okMsg });
      return true;
    } catch (e) {
      setToast({ kind: "err", msg: e instanceof Error ? e.message : "Gagal menyimpan." });
      return false;
    }
  }

  async function simpan() {
    const r = await commit();
    if (r.ok) setToast({ kind: "ok", msg: "Tersimpan & tersinkron" });
    else setToast({ kind: "err", msg: `Gagal menyimpan ${r.failed} perubahan — cek internet/rules, draft dipertahankan.` });
  }

  function stepper(p: Product, d: number) {
    const stok = Math.max(0, p.stok + d);
    stage("product.stock", { id: p.id, stok });
    setLocalProducts((prev) => (prev ?? liveProducts).map((x) => (x.id === p.id ? { ...x, stok } : x)));
  }

  function hapus(p: Product) {
    setConfirmHapus(p);
  }

  function doHapus() {
    const p = confirmHapus;
    setConfirmHapus(null);
    if (!p) return;
    stage("product.delete", { id: p.id });
    setLocalProducts((prev) => (prev ?? liveProducts).filter((x) => x.id !== p.id));
    if (editorFor !== "baru" && editorFor?.id === p.id) setEditorFor(null);
  }

  const tanggal = new Date(`${today}T12:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-garis bg-kartu">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="text-sm font-bold text-primer">← Toko</Link>
          <div>
            <h1 className="font-display text-xl font-semibold leading-tight">Admin Warmak A3</h1>
            <p className="text-[11px] text-teks2 tabular-nums">{tanggal}</p>
          </div>
          <p className="ml-auto hidden text-xs text-teks2 md:block">Draft aman → tekan Simpan perubahan</p>
          <SyncBadge />
        </div>
        <div className="h-px bg-emas" aria-hidden />
      </header>

      <div className="mx-auto flex max-w-[1100px] gap-6 px-4 pb-40 pt-5 md:px-6">
        <aside className="sticky top-6 hidden h-fit w-[220px] shrink-0 rounded-[18px] border border-garis bg-kartu p-3 shadow-card md:block" aria-label="Menu admin">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`pressable mt-1 flex w-full items-center gap-2 rounded-[14px] px-3 py-2.5 text-left text-sm font-bold first:mt-0 ${tab === t.id ? "bg-primer text-white shadow-btn" : "text-teks hover:bg-bg"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tab === t.id ? "bg-emas" : "bg-garis"}`} aria-hidden />
              {t.label}
              {t.id === "pesanan" && orderPing && <span className="ml-auto h-2 w-2 rounded-full bg-aksen" aria-label="Pesanan baru" />}
            </button>
          ))}
        </aside>

        <section className="min-w-0 flex-1">
          {tab === "dashboard" && (
            <DashboardTab agg={agg} low={low} txns={txns}
              openHour={openHour} setOpenHour={setOpenHour} closeHour={closeHour} setCloseHour={setCloseHour}
              override={override} setOverride={setOverride} auto={auto} />
          )}
          {tab === "produk" && (
            <ProdukTab filtered={filtered} cats={cats} q={q} setQ={setQ} kat={kat} setKat={setKat}
              menipis={menipis} setMenipis={setMenipis} editorFor={editorFor} setEditorFor={setEditorFor}
              stage={stage} stepper={stepper} hapus={hapus}
              onEditorDone={(saved) => {
                setEditorFor(null);
                if (saved) setLocalProducts((prev) => {
                  const arr = prev ?? liveProducts;
                  const i = arr.findIndex((x) => x.id === saved.id);
                  return i >= 0 ? arr.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...arr];
                });
              }} />
          )}
          {tab === "pesanan" && (
            <PesananTab txns={txns} wa={wa} auto={auto} />
          )}
          {tab === "laku" && (
            <LakuTab txns={txns} products={products} auto={auto}
              onAdd={(t) => setLocalTxns((prev) => [t, ...(prev ?? liveTxns)])} />
          )}
          {tab === "keluar" && (
            <KeluarTab exps={exps} auto={auto} onAdd={(e) => setLocalExps((prev) => [e, ...(prev ?? liveExps)])} />
          )}
          {tab === "grafik" && (
            <GrafikTab agg={agg} grafik={grafik} setGrafik={setGrafik} isDesktopChart={isDesktopChart} Bar={Bar} Line={Line} />
          )}
          {tab === "pengaturan" && (
            <PengaturanTab wa={wa} setWa={setWa} auto={auto} />
          )}
        </section>
      </div>

      {loading && (
        <div className="mx-auto max-w-[1100px] px-4 md:px-6" aria-label="Memuat data">
          <div className="skeleton h-24 rounded-[18px]" />
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-[18px]" />)}
          </div>
        </div>
      )}
      {error && (
        <div className="mx-auto max-w-[1100px] px-4 md:px-6">
          <p role="alert" className="rounded-[18px] border border-garis bg-kartu p-6 text-center text-sm font-bold text-[#DC2626]">
            {error}
            <button onClick={() => window.location.reload()} className="mx-auto mt-2 block w-64 rounded-[14px] bg-primer py-2.5 text-sm font-extrabold text-white">Muat ulang</button>
          </p>
        </div>
      )}

      {draftT.mounted && (
        <div className={`${draftT.leaving ? "toast-out" : "toast-in"} fixed inset-x-0 bottom-16 z-40 border-t border-garis bg-kartu/95 px-4 py-3 backdrop-blur md:bottom-0`} role="status">
          <div className="mx-auto flex max-w-[1100px] items-center gap-2">
            <p className="text-sm font-bold tabular-nums">{draftCount} draft</p>
            <button onClick={() => setConfirmBuang(true)}
              className="pressable ml-auto rounded-[14px] px-4 py-2.5 text-sm font-bold ring-1 ring-garis">Buang</button>
            <button onClick={simpan} disabled={saving}
              className="pressable rounded-[14px] bg-primer px-5 py-2.5 text-sm font-extrabold text-white shadow-btn disabled:opacity-40">
              {saving ? "Menyimpan…" : `Simpan perubahan (${draftCount})`}
            </button>
          </div>
        </div>
      )}

      {orderPing && tab !== "pesanan" && (
        <button onClick={() => setTab("pesanan")} role="status"
          className="toast-in fixed bottom-32 left-1/2 z-40 -translate-x-1/2 rounded-full bg-teks px-4 py-2.5 text-xs font-extrabold text-white shadow-float md:bottom-8">
          Pesanan baru masuk — lihat
        </button>
      )}
      {toast && (
        <p role="status"
          className={`toast-in fixed bottom-32 left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2.5 text-xs font-extrabold text-white shadow-float md:bottom-8 ${toast.kind === "ok" ? "bg-primer" : "bg-[#DC2626]"}`}>
          {toast.msg}
        </p>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-garis bg-kartu/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Menu admin">
        <div className="grid h-16 grid-cols-7">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`pressable relative flex flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-bold ${tab === t.id ? "text-primer" : "text-teks2"}`}>
              {t.label.split(" ")[0]}
              {t.id === "pesanan" && orderPing && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-aksen" aria-label="Pesanan baru" />}
              {tab === t.id && <span className="h-1 w-1 rounded-full bg-emas" aria-hidden />}
            </button>
          ))}
        </div>
      </nav>
      <ConfirmDialog open={confirmHapus != null} title="Hapus produk?"
        message={confirmHapus ? `"${confirmHapus.nama}" akan hilang dari katalog setelah Simpan perubahan.` : ""}
        confirmLabel="Hapus" onConfirm={doHapus} onCancel={() => setConfirmHapus(null)} />
      <ConfirmDialog open={confirmBuang} title="Buang semua draft?"
        message={`${draftCount} perubahan yang belum disimpan akan hilang.`}
        confirmLabel="Buang" onConfirm={() => { setConfirmBuang(false); discard(); }} onCancel={() => setConfirmBuang(false)} />
    </main>
  );
}

