import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart/store";
import OfflineBanner from "@/components/store/OfflineBanner";
import FloatingCart from "@/components/store/FloatingCart";

const display = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-fraunces", fallback: ["Georgia", "serif"] });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "Warmak A3 : Minimarket Rumahan",
  description: "Warung makan & sembako A3: pesan cepat via WhatsApp.",
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
