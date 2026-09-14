import type { ShopSettings } from "@/lib/db/schema";

export interface ShopStatus { open: boolean; label: string; openHour: string; closeHour: string }
export type OpenOverride = "auto" | "buka" | "tutup";

const pretty = (hhmm: string) => hhmm.replace(":", ".");
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };

export function computeStatus(openHour: string, closeHour: string, override: OpenOverride, now = new Date()): ShopStatus {
  const range = `${pretty(openHour)}-${pretty(closeHour)}`;
  if (override === "buka") return { open: true, label: `Toko: Buka ${range}`, openHour, closeHour };
  if (override === "tutup") return { open: false, label: `Toko: Tutup ${range}`, openHour, closeHour };
  const t = now.getHours() * 60 + now.getMinutes();
  const open = toMin(openHour) <= toMin(closeHour)
    ? t >= toMin(openHour) && t < toMin(closeHour)
    : t >= toMin(openHour) || t < toMin(closeHour);
  return { open, label: `Toko: ${open ? "Buka" : "Tutup"} ${range}`, openHour, closeHour };
}

export async function getShopStatus(settings: ShopSettings, now = new Date()): Promise<ShopStatus> {
  const o = settings.openHour ?? "08:00";
  const c = settings.closeHour ?? "19:00";
  const ov = (settings.openOverride as OpenOverride) ?? "auto";
  return computeStatus(o, c, ov, now);
}
