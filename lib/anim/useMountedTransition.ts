"use client";
import { useEffect, useState } from "react";

// Mount-aware open/close: saat open=false, tetap mount selama ms (animasi exit), lalu unmount.
// reduced-motion -> tunggu 1ms (tampil langsung). Hanya gaya; tanpa logika bisnis.
export function useMountedTransition(open: boolean, ms = 220): { mounted: boolean; leaving: boolean } {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    let wait = ms;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) wait = 1;
    } catch { /* abaikan */ }
    const t = setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, wait);
    return () => clearTimeout(t);
  }, [open, ms]);
  return { mounted, leaving };
}
