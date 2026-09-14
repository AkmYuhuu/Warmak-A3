import Image from "next/image";

// Logo mark Warmak A3 di header (persegi membulat, 48px mobile / 56px desktop).
// Selalu berdampingan dengan teks "Warmak A3" di header, jadi alt dikosongkan.
export default function BrandLogo({ desktop }: { desktop?: boolean }) {
  return (
    <Image
      src="/icons/logo-256.png"
      alt=""
      aria-hidden
      width={256}
      height={256}
      priority
      className={desktop ? "h-14 w-14 shrink-0 rounded-2xl" : "h-12 w-12 shrink-0 rounded-xl"}
    />
  );
}
