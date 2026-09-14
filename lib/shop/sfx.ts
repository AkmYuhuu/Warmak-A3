"use client";
import { useCallback, useEffect, useState } from "react";

const MUTE_KEY = "warmak:sfx-mute";
let ctx: AudioContext | null = null;

// Pop kecil via WebAudio oscillator (tanpa file aset). Hanya dipanggil dari gesture user.
export function playPop(): void {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(MUTE_KEY) === "1") return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.07);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.17);
  } catch { /* abaikan */ }
}

export function useSfxMute(): [boolean, () => void] {
  const [muted, setM] = useState(false);
  useEffect(() => {
    try { setM(localStorage.getItem(MUTE_KEY) === "1"); } catch { /* abaikan */ }
  }, []);
  const toggle = useCallback(() => {
    setM((m) => {
      const n = !m;
      try { localStorage.setItem(MUTE_KEY, n ? "1" : "0"); } catch { /* abaikan */ }
      return n;
    });
  }, []);
  return [muted, toggle];
}

// Feedback tambah: morph "Masuk ✓" 800ms + pulse ring sekali + pop
export function useAddConfirm(): { masuk: boolean; pulse: boolean; fire: () => void } {
  const [masuk, setMasuk] = useState(false);
  const [pulse, setPulse] = useState(false);
  const fire = useCallback(() => {
    playPop();
    setMasuk(true);
    setPulse(true);
    setTimeout(() => setMasuk(false), 800);
    setTimeout(() => setPulse(false), 550);
  }, []);
  return { masuk, pulse, fire };
}
