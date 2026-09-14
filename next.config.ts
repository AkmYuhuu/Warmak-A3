import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Izinkan HMR dev dari HP/perangkat LAN (ganti/tambah IP bila berubah)
  allowedDevOrigins: ["192.168.1.3"],
};
export default nextConfig;
