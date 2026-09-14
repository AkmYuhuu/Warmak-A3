"use client";
import { useOnlineStatus } from "@/lib/shop/useOnlineStatus";
import { useMountedTransition } from "@/lib/anim/useMountedTransition";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  const t = useMountedTransition(!online, 200);
  if (!t.mounted) return null;
  return (
    <div role="alert" className={`${t.leaving ? "banner-out" : "banner-in"} fixed inset-x-0 top-0 z-[90] bg-[#DC2626] px-4 py-2.5 text-center text-sm font-extrabold text-white`}>
      Wajib online — hubungkan internet
    </div>
  );
}
