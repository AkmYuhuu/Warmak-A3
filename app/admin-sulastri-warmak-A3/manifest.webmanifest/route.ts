// Manifest PWA khusus dashboard admin. Katalog toko tidak memuat manifest ini.
export async function GET() {
  const manifest = {
    id: "/admin-sulastri-warmak-A3",
    name: "Warmak A3 Admin",
    short_name: "Warmak A3",
    description: "Dashboard admin Warmak A3: produk, stok, dan pesanan.",
    start_url: "/admin-sulastri-warmak-A3",
    scope: "/admin-sulastri-warmak-A3",
    display: "standalone",
    dir: "ltr",
    lang: "id",
    background_color: "#faf7ef",
    theme_color: "#0c5b40",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" },
  });
}
