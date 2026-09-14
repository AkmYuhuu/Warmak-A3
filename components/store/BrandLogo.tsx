import Image from "next/image";

// Logo mark Warmak A3 di header (persegi membulat, tinggi 32–40px).
export default function BrandLogo({ desktop }: { desktop?: boolean }) {
  return (
    <Image
      src="/icons/logo-256.png"
      alt="Warmak A3"
      width={256}
      height={256}
      priority
      className={desktop ? "h-10 w-10 shrink-0 rounded-xl" : "h-9 w-9 shrink-0 rounded-[10px]"}
    />
  );
}
