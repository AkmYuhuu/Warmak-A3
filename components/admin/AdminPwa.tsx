"use client";
import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// PWA khusus admin: daftarkan SW + tombol install. Tidak dipakai di katalog.
export default function AdminPwa() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Tanpa trailing slash: "/admin-sulastri-warmak-A3" mencakup juga versi
    // dengan slash + subpath. Kalau pakai slash, URL tanpa slash dianggap
    // di luar scope → PWA memunculkan bar URL hitam walau lagi di dashboard.
    const SCOPE = "/admin-sulastri-warmak-A3";
    navigator.serviceWorker
      .getRegistrations?.()
      .then((regs) => {
        regs.forEach((r) => {
          // Bersihkan SW lama: nyasar ke /a, atau scope admin versi slash lama.
          if (
            r.scope.endsWith("/a") ||
            r.scope.endsWith("/a/") ||
            r.scope.endsWith("/admin-sulastri-warmak-A3/")
          )
            r.unregister().catch(() => null);
        });
      })
      .catch(() => null)
      .finally(() => {
        navigator.serviceWorker.register("/sw-admin.js", { scope: SCOPE }).catch(() => null);
      });
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* abaikan */
    }
    setDeferred(null);
  }

  if (!deferred || hide) return null;
  return (
    <div role="dialog" aria-label="Install aplikasi admin"
      className="fixed bottom-36 right-4 z-40 flex items-center gap-2 rounded-[14px] border border-garis bg-kartu p-2 pl-3 shadow-float md:bottom-24">
      <p className="text-xs font-extrabold">Install aplikasi admin?</p>
      <button onClick={install} className="pressable rounded-[10px] bg-primer px-3 py-2 text-xs font-extrabold text-white">Install</button>
      <button onClick={() => setHide(true)} aria-label="Tutup" className="pressable px-2 py-2 text-xs font-bold text-teks2">✕</button>
    </div>
  );
}
