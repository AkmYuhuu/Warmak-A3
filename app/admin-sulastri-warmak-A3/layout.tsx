import type { Metadata, Viewport } from "next";
import AdminPwa from "@/components/admin/AdminPwa";

// Layout khusus dashboard admin: manifest, theme-color, dan PWA hanya di sini.
// Katalog toko tidak memuat apa pun dari file ini.
export const metadata: Metadata = {
  title: "Admin Warmak A3",
  manifest: "/admin-sulastri-warmak-A3/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Warmak A3 Admin", statusBarStyle: "default" },
  icons: { apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
};

export const viewport: Viewport = { themeColor: "#0c5b40", width: "device-width", initialScale: 1 };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AdminPwa />
    </>
  );
}
