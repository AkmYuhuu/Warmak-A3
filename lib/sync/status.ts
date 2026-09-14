"use client";
// Status koneksi kecil: Online / Syncing / Offline (navigator + counter tulis).
import { useEffect, useState } from "react";

export type SyncState = "online" | "syncing" | "offline";

let jobs = 0;
let state: SyncState = "online";
const subs = new Set<(s: SyncState) => void>();
let wired = false;

function current(): SyncState {
  if (typeof window !== "undefined" && !navigator.onLine) return "offline";
  return jobs > 0 ? "syncing" : "online";
}

function emit() {
  const s = current();
  if (s !== state) {
    state = s;
    subs.forEach((cb) => cb(s));
  }
}

function wireOnce() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("online", emit);
  window.addEventListener("offline", emit);
}

export function syncBegin() { jobs++; emit(); }
export function syncEnd() { jobs = Math.max(0, jobs - 1); emit(); }

export async function syncRun<T>(fn: () => Promise<T>): Promise<T> {
  syncBegin();
  try { return await fn(); }
  finally { syncEnd(); }
}

export function subscribeSync(cb: (s: SyncState) => void): () => void {
  wireOnce();
  subs.add(cb);
  cb(current());
  return () => { subs.delete(cb); };
}

export function useSyncStatus(): SyncState {
  const [s, setS] = useState<SyncState>(() => current());
  useEffect(() => subscribeSync(setS), []);
  return s;
}
