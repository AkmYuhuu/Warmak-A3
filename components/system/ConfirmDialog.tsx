"use client";
import { useEffect } from "react";
import { useMountedTransition } from "@/lib/anim/useMountedTransition";
import { useLockBody } from "@/lib/anim/useLockBody";
import ModalPortal from "@/components/system/ModalPortal";

// Pengganti window.confirm: modal tengah + backdrop, IN+OUT 200-220ms, gaya v2.
export default function ConfirmDialog({ open, title, message, confirmLabel = "Hapus", onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const t = useMountedTransition(open, 210);
  useLockBody(t.mounted);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!t.mounted) return null;
  return (
    <ModalPortal>
    <div className={`${t.leaving ? "backdrop-out" : "backdrop-in"} fixed inset-0 z-[105] h-screen w-screen bg-black/40 backdrop-blur-sm`} aria-hidden onClick={onCancel} />
    <div className="fixed inset-0 z-[110] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className={`${t.leaving ? "modal-out" : "modal-in"} relative max-h-[92dvh] w-[380px] max-w-full overflow-y-auto rounded-[20px] border border-garis bg-kartu p-5 shadow-float`}>
        <div className="gold-rule" aria-hidden />
        <p className="font-display mt-1.5 text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-teks2">{message}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onCancel} autoFocus
            className="pressable cursor-pointer rounded-[14px] py-3 text-sm font-bold ring-1 ring-garis">Batal</button>
          <button onClick={onConfirm}
            className="pressable btn-lift cursor-pointer rounded-[14px] bg-[#DC2626] py-3 text-sm font-extrabold text-white">{confirmLabel}</button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
