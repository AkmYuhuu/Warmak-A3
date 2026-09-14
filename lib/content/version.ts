import { CONTENT_VERSION_KEY } from "@/lib/device";

// Versi konten sesi ini (localStorage saja; tanpa database lokal).
export async function getContentVersion(): Promise<number> {
  try {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(CONTENT_VERSION_KEY) ?? "0");
  } catch { return 0; }
}

export async function bumpVersion(): Promise<number> {
  const cur = (await getContentVersion()) + 1;
  try { localStorage.setItem(CONTENT_VERSION_KEY, String(cur)); } catch { /* abaikan */ }
  return cur;
}
