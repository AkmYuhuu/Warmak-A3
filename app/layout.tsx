import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart/store";
import OfflineBanner from "@/components/store/OfflineBanner";
import FloatingCart from "@/components/store/FloatingCart";

const display = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-fraunces", fallback: ["Georgia", "serif"] });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const siteTitle = "Warmak A3 — Minimarket Rumahan";
const siteDesc = "Minimarket Rumahan A3: sembako & kebutuhan harian, pesan cepat via WhatsApp.";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: siteTitle,
  description: siteDesc,
  openGraph: {
    title: siteTitle,
    description: siteDesc,
    type: "website",
    locale: "id_ID",
    siteName: "Warmak A3",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDesc,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <CartProvider>
          <OfflineBanner />
          <FloatingCart />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
