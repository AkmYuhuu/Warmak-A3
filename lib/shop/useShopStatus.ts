"use client";
import { useEffect, useState } from "react";
import { computeStatus, type OpenOverride, type ShopStatus } from "@/lib/shop/status";
import { useLive } from "@/lib/db/repos";

export function useShopStatus(): ShopStatus {
  const { settings } = useLive();
  // Tick tiap 30 detik: status flip otomatis tepat waktu tanpa refresh.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const fallback: ShopStatus = { open: true, label: "Toko: Buka 08.00-19.00", openHour: "08:00", closeHour: "19:00" };
  try {
    return computeStatus(settings.openHour, settings.closeHour, (settings.openOverride as OpenOverride) ?? "auto", new Date(now));
  } catch { return fallback; }
}
