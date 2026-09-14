"use client";
import { useSyncStatus } from "@/lib/sync/status";

// Indikator kecil: Online (hijau) / Syncing (emas) / Offline (merah).
export default function SyncBadge() {
  const s = useSyncStatus();
  const dot = s === "online" ? "#16A34A" : s === "syncing" ? "#C9A227" : "#DC2626";
  const label = s === "online" ? "Online" : s === "syncing" ? "Syncing" : "Offline";
  return (
    <span role="status" title={`Sync: ${label}`}
      className="inline-flex items-center gap-1 rounded-full bg-kartu px-2 py-0.5 text-[11px] font-bold text-teks2 ring-1 ring-garis">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} aria-hidden />
      {label}
    </span>
  );
}
