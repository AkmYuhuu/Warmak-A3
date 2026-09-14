"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart/store";

function Icon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const ICONS: Record<string, string> = {
  Beranda: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  Keranjang: "M3 4h2l2.4 12h10.4l2-8H6M10 20a1 1 0 1 0 0 .01M18 20a1 1 0 1 0 0 .01",
};

export function BottomNav() {
  const { count } = useCart();
  const path = usePathname();
  const items = [
    { href: "/", label: "Beranda" },
    { href: "/cart", label: "Keranjang", badge: count },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-garis bg-kartu/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Navigasi bawah">
      <div className="grid h-16 grid-cols-2">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path === it.href;
          return (
            <Link key={it.label} href={it.href}
              className={`pressable relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? "text-primer" : "text-teks2"}`}>
              <span className="relative" aria-hidden>
                <Icon d={ICONS[it.label]} active={active} />
                {!!it.badge && <span key={it.badge} className="pop absolute -right-2 -top-1 rounded-full bg-aksen px-1 text-[10px] font-bold tabular-nums text-white">{it.badge}</span>}
              </span>
              {it.label}
              {active && <span className="h-1 w-1 rounded-full bg-emas" aria-hidden />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PromoStrip() {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto whitespace-nowrap px-4 py-2 text-[12px] font-semibold" aria-label="Promo">
      <span className="rounded-full border border-emas px-3 py-1 text-emas">Gratis ongkir radius 1 km</span>
      <span className="rounded-full bg-kartu px-3 py-1 text-teks ring-1 ring-garis">Beras &amp; minyak harga grosir</span>
      <span className="rounded-full bg-kartu px-3 py-1 text-teks ring-1 ring-garis">Bayar tunai / transfer</span>
    </div>
  );
}

export function CategoryChips({ list, aktif, onPick }: { list: string[]; aktif: string; onPick: (c: string) => void }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2" role="tablist" aria-label="Kategori">
      {list.map((c) => (
        <button key={c} role="tab" aria-selected={aktif === c} onClick={() => onPick(c)}
          className={`pressable h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold ${aktif === c ? "bg-primer text-white" : "bg-kartu text-teks ring-1 ring-garis"}`}>
          {c}
        </button>
      ))}
    </div>
  );
}
