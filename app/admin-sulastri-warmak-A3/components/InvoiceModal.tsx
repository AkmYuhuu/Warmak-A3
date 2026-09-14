"use client";
import { useState } from "react";
import type { Transaction } from "@/lib/db/schema";
import { useMountedTransition } from "@/lib/anim/useMountedTransition";
import { useLockBody } from "@/lib/anim/useLockBody";
import ModalPortal from "@/components/system/ModalPortal";
import InvoiceTemplate from "./InvoiceTemplate";
import { invoiceCode } from "@/lib/invoice/code";

// Preview = node capture yang sama (800px, scroll horizontal di layar kecil) + Download PNG via html2canvas 2x.
export default function InvoiceModal({ txn, wa, onClose }: {
  txn: Transaction | null; wa: string; onClose: () => void;
}) {
  const t = useMountedTransition(txn != null, 220);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useLockBody(t.mounted);
  if (!t.mounted || !txn) return null;

  async function download() {
    if (busy || !txn) return;
    setBusy(true);
    setErr(null);
    try {
      await document.fonts.ready;
      const el = document.getElementById("invoice-capture");
      if (!el) throw new Error("Template invoice tidak ditemukan.");
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, {
        scale: 2, useCORS: true, backgroundColor: "#ffffff", width: 800, windowWidth: 800,
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `invoice-${invoiceCode(txn)}.png`;
      a.click();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal membuat PNG.");
    } finally { setBusy(false); }
  }

  return (
    <ModalPortal>
    <div className={`${t.leaving ? "backdrop-out" : "backdrop-in"} fixed inset-0 z-[100] h-screen w-screen bg-black/40 backdrop-blur-sm`} aria-hidden onClick={onClose} />
    <div className="fixed inset-0 z-[105] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Invoice">
      <div className={`${t.leaving ? "modal-out" : "modal-in"} relative max-h-[92dvh] w-full max-w-[880px] overflow-y-auto rounded-[20px] border border-garis bg-kartu p-4 shadow-float sm:p-5`}>
        <div className="overflow-x-auto rounded-[12px] border border-garis">
          <InvoiceTemplate txn={txn} wa={wa} />
        </div>
        {err && <p role="alert" className="mt-2 text-center text-xs font-bold text-[#DC2626]">{err}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onClose} className="pressable cursor-pointer rounded-[14px] py-3 text-sm font-bold ring-1 ring-garis">Tutup</button>
          <button onClick={download} disabled={busy}
            className="pressable btn-lift cursor-pointer rounded-[14px] bg-primer py-3 text-sm font-extrabold text-white shadow-btn disabled:opacity-40">
            {busy ? "Menyiapkan…" : "Download PNG"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
