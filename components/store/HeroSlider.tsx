"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useLive } from "@/lib/db/repos";
import { useEffect } from "react";

export interface HeroSlide { imageUrl: string; judul: string }

const DEFAULT_SLIDES: HeroSlide[] = [
  { imageUrl: "", judul: "Sembako lengkap, harga bersahabat" },
  { imageUrl: "", judul: "Gratis ongkir radius 1 km" },
  { imageUrl: "", judul: "Pesan via WA, bayar tunai atau transfer" },
];

export function useHeroSlides(): HeroSlide[] {
  const { settings } = useLive();
  const raw = settings.heroSlides;
  if (!raw) return DEFAULT_SLIDES;
  try {
    const arr = JSON.parse(raw) as HeroSlide[];
    if (Array.isArray(arr) && arr.length) return arr.slice(0, 4);
  } catch { /* abaikan */ }
  return DEFAULT_SLIDES;
}

function useSwipe(go: (d: number) => void) {
  const x = useRef<number | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => { x.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      if (x.current == null) return;
      const dx = e.changedTouches[0].clientX - x.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      x.current = null;
    },
  };
}

// Autoplay 5 detik + loop ke awal, jeda 10 detik setelah interaksi manual, mati saat reduced-motion
function useAutoplay(len: number, go: (d: number) => void) {
  const goRef = useRef(go);
  goRef.current = go;
  const timer = useRef<number | null>(null);
  const resume = useRef<number | null>(null);
  const start = (n: number) => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if (n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setInterval(() => goRef.current(1), 5000);
  };
  useEffect(() => {
    start(len);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      if (resume.current) window.clearTimeout(resume.current);
    };
  }, [len]);
  return () => { // panggil tiap interaksi manual (swipe/dots/panah)
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if (resume.current) window.clearTimeout(resume.current);
    resume.current = window.setTimeout(() => start(len), 10000);
  };
}

// MOBILE: 16:9 radius 18, gradient teks, dots emas, swipe + autoplay 5 detik
export function HeroMobile() {
  const slides = useHeroSlides();
  const [idx, setIdx] = useState(0);
  const go = (d: number) => setIdx((i) => (i + d + slides.length) % slides.length);
  const interact = useAutoplay(slides.length, go);
  const goUser = (d: number) => { interact(); go(d); };
  const swipe = useSwipe(goUser);
  return (
    <section aria-roledescription="carousel" aria-label="Promo toko"
      className="hero-leaf relative overflow-hidden rounded-[18px] text-white shadow-card" {...swipe}>
      <div className="flex anim-300" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {slides.map((s, i) => (
          <div key={i} aria-hidden={i !== idx} className="relative aspect-video w-full shrink-0 overflow-hidden">
            {s.imageUrl ? <img src={s.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden />
            <p className="font-display absolute inset-x-0 bottom-0 p-4 text-[20px] font-semibold leading-snug">{s.judul}</p>
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1.5 pb-0" role="tablist" aria-label="Pilih slide">
          {slides.map((_, i) => (
            <button key={i} role="tab" aria-selected={i === idx} aria-label={`Slide ${i + 1}`} onClick={() => { interact(); setIdx(i); }}
              className={`pressable h-1.5 rounded-full ${i === idx ? "w-5 bg-emas" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

// DESKTOP: 21:9, 220-260px, teks kiri + CTA, kawung
export function HeroDesktop() {
  const slides = useHeroSlides();
  const [idx, setIdx] = useState(0);
  const go = (d: number) => setIdx((i) => (i + d + slides.length) % slides.length);
  const interact = useAutoplay(slides.length, go);
  const goUser = (d: number) => { interact(); go(d); };
  const swipe = useSwipe(goUser);
  return (
    <section aria-roledescription="carousel" aria-label="Promo toko"
      className="hero-leaf relative overflow-hidden rounded-[18px] text-white shadow-card" {...swipe}>
      <div className="kawung pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.05]" aria-hidden />
      <div className="flex anim-300" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {slides.map((s, i) => (
          <div key={i} aria-hidden={i !== idx} className="relative aspect-[21/9] max-h-[260px] min-h-[220px] w-full shrink-0 overflow-hidden">
            {s.imageUrl ? <img src={s.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" loading="lazy" /> : null}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" aria-hidden />
            <div className="relative flex h-full max-w-md flex-col justify-center p-8">
              <div className="gold-rule" aria-hidden />
              <p className="font-display mt-2 text-3xl font-semibold leading-tight">{s.judul}</p>
              <Link href="#katalog" className="pressable mt-4 w-fit rounded-[14px] bg-aksen px-5 py-2.5 text-sm font-extrabold text-white">
                Belanja
              </Link>
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <button onClick={() => goUser(-1)} aria-label="Slide sebelumnya"
            className="pressable absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/30 font-bold">‹</button>
          <button onClick={() => goUser(1)} aria-label="Slide berikutnya"
            className="pressable absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/30 font-bold">›</button>
          <div className="absolute bottom-3 left-8 flex gap-1.5" role="tablist" aria-label="Pilih slide">
            {slides.map((_, i) => (
              <button key={i} role="tab" aria-selected={i === idx} aria-label={`Slide ${i + 1}`} onClick={() => { interact(); setIdx(i); }}
                className={`pressable h-1.5 rounded-full ${i === idx ? "w-5 bg-emas" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
      <div className="h-px bg-emas" aria-hidden />
    </section>
  );
}
