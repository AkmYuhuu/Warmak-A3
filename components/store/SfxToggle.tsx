"use client";
import { playPop, useSfxMute } from "@/lib/shop/sfx";

export default function SfxToggle() {
  const [muted, toggle] = useSfxMute();
  return (
    <div className="flex items-center gap-2">
      <div>
        <p className="font-extrabold">Suara tombol</p>
        <p className="mt-0.5 text-xs text-teks2">Bunyi pop kecil setiap Tambah ditekan.</p>
      </div>
      <button onClick={() => { toggle(); if (muted) setTimeout(playPop, 50); }} aria-pressed={!muted}
        className={`pressable ml-auto rounded-[14px] px-4 py-2.5 text-sm font-extrabold ${muted ? "text-teks ring-1 ring-garis" : "bg-primer text-white shadow-btn"}`}>
        {muted ? "Bisu" : "Bunyi"}
      </button>
    </div>
  );
}
