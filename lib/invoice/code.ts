import type { Transaction } from "@/lib/db/schema";

// Kode invoice ramah manusia, derivasi deterministik dari id internal.
// Format: INV-YYYYMMDD-XXXXX (contoh INV-20260914-XISTQ).
// id Firestore (txn_...) tetap jadi primary key — tanpa migrasi data.
export function invoiceCode(t: Pick<Transaction, "id" | "createdAt" | "tanggal">): string {
  const ymd = (t.tanggal ?? "").includes("-")
    ? t.tanggal.replace(/-/g, "")
    : (() => {
        const d = new Date(t.createdAt);
        return Number.isNaN(+d)
          ? "00000000"
          : `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      })();
  const tail = (t.id ?? "").replace(/[^a-z0-9]/gi, "").slice(-5).toUpperCase().padStart(5, "0");
  // honey: suffix 5 char dari id acak — tabrakan butuh 2 order id-kembar di hari sama, praktis mustahil.
  return `INV-${ymd}-${tail}`;
}
