"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/store";
import { useMountedTransition } from "@/lib/anim/useMountedTransition";

// Tombol keranjang melayang, satu komponen untuk kedua view.
// Mobile -> link /cart. Desktop -> CustomEvent open-cart (didengar HomeDesktop), fallback /cart.
// Sembunyi di /cart, rute admin, dan saat drawer checkout terbuka.
export default function FloatingCart() {
  const { count } = useCart();
  const path = usePathname();
  const router = useRouter();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const t = useMountedTransition(!(path === "/cart" || path.startsWith("/admin") || checkoutOpen), 200);

  useEffect(() => {
    const onCheckout = (e: Event) => setCheckoutOpen(Boolean((e as CustomEvent).detail?.open));
    window.addEventListener("warmak:checkout", onCheckout);
    return () => window.removeEventListener("warmak:checkout", onCheckout);
  }, []);

  if (!t.mounted) return null;

  function onClick(e: React.MouseEvent) {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      e.preventDefault();
      const ev = new CustomEvent("open-cart", { cancelable: true });
      window.dispatchEvent(ev);
      if (!ev.defaultPrevented) router.push("/cart");
    }
  }

  return (
    <Link href="/cart" onClick={onClick} aria-label={`Keranjang ${count}`}
      className={`pressable btn-lift fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primer text-white shadow-float md:bottom-6 md:right-6 ${t.leaving ? "float-out" : "float-in"}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 4h2l2.4 12h10.4l2-8H6M10 20a1 1 0 1 0 0 .01M18 20a1 1 0 1 0 0 .01" />
      </svg>
      {count > 0 && (
        <span key={count} className="pop absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-aksen px-1.5 text-xs font-bold tabular-nums text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
