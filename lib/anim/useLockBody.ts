"use client";
import { useEffect } from "react";

// Kunci scroll body selama modal terbuka. Counter: aman bila 2 modal tumpuk + cleanup.
let locks = 0;
export function useLockBody(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    locks += 1;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) document.body.style.overflow = prev;
    };
  }, [active]);
}
