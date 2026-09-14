import type { ReactNode } from "react";
import type { Transaction } from "@/lib/db/schema";
import { invoiceCode } from "@/lib/invoice/code";
import { rupiah } from "@/lib/wa/template";

// Template invoice khusus capture html2canvas.
// ATURAN: semua INLINE STYLE, warna HEX, layout static/relative (flex/table normal).
// Tanpa class Tailwind, CSS var, oklch, gradient, shadow, absolute/fixed di subtree ini.
export default function InvoiceTemplate({ txn, wa }: { txn: Transaction; wa: string }) {
  const GREEN = "#0B4D2E";
  const INK = "#000000";
  const MUT = "#555555";
  const LINE = "#E5E5E5";

  // Tanpa kotak abu-abu: label teks bold + value flex-item sendiri (aman html2canvas).
  const field = (l: string, v: string) => (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 8 }}>
      <span style={{ width: 72, flexShrink: 0, fontSize: 13, lineHeight: "20px", color: MUT, fontWeight: 700 }}>
        {l}:
      </span>
      <span style={{ marginLeft: 8, fontSize: 13, lineHeight: "20px", color: INK, flex: 1, minWidth: 0, overflowWrap: "break-word" }}>
        {v}
      </span>
    </div>
  );

  const th = (t: string, align: "left" | "center" | "right"): ReactNode => (
    <th style={{ background: LINE, color: "#333333", fontSize: 12, padding: "10px 12px", textAlign: align }}>{t}</th>
  );
  const cellB = "1px solid " + LINE;

  return (
    <div id="invoice-capture" style={{ width: 800, boxSizing: "border-box", background: "#FFFFFF", padding: 40, color: INK, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: GREEN }}>Warmak A3</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>INVOICE</div>
          <div style={{ fontSize: 13, color: "#333333", marginTop: 4 }}>{invoiceCode(txn)}</div>
          <div style={{ fontSize: 12, color: MUT, marginTop: 2 }}>{txn.tanggal}</div>
        </div>
      </div>

      <div style={{ height: 1, background: GREEN, marginTop: 16, marginBottom: 16 }} />

      <div style={{ display: "flex" }}>
        <div style={{ width: "50%", paddingRight: 12 }}>
          {field("Name", txn.nama)}
          {field("Type", `${txn.metode === "antar" ? "Antar" : "Ambil"} • via ${txn.via ?? "WA"}`)}
        </div>
        <div style={{ width: "50%", paddingLeft: 12 }}>
          {txn.alamat ? field("Alamat", txn.alamat) : null}
          {txn.catatan ? field("Catatan", txn.catatan) : null}
        </div>
      </div>

      <table style={{ width: "100%", marginTop: 16, borderSpacing: 0 }}>
        <thead>
          <tr>
            {th("ITEM", "left")}
            {th("QTY", "center")}
            {th("PRICE", "right")}
          </tr>
        </thead>
        <tbody>
          {txn.items.map((it, k) => (
            <tr key={k}>
              <td style={{ fontSize: 13, padding: "10px 12px", borderBottom: cellB }}>
                {it.nama}
                {it.isPO ? <span style={{ fontSize: 11, color: MUT }}> (PO)</span> : null}
              </td>
              <td style={{ fontSize: 13, padding: "10px 12px", textAlign: "center", borderBottom: cellB }}>{it.qty}</td>
              <td style={{ fontSize: 13, padding: "10px 12px", textAlign: "right", borderBottom: cellB }}>
                {rupiah(it.subtotal ?? it.harga * it.qty)}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={{ fontSize: 13, color: MUT, padding: "10px 12px", borderBottom: cellB }}>Ongkir</td>
            <td style={{ fontSize: 13, padding: "10px 12px", textAlign: "right", borderBottom: cellB }}>
              {txn.ongkir > 0 ? rupiah(txn.ongkir) : "Gratis"}
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ fontSize: 20, fontWeight: 800, color: GREEN, padding: "14px 12px" }}>Total</td>
            <td style={{ fontSize: 20, fontWeight: 800, color: GREEN, padding: "14px 12px", textAlign: "right" }}>
              {rupiah(txn.total)}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: "1px solid " + LINE, marginTop: 30, paddingTop: 16, textAlign: "center", fontSize: 12, color: MUT }}>
        Terima kasih! Pesan ulang via WA {wa || "6281234567890"}
      </div>
    </div>
  );
}
