import { ImageResponse } from "next/og";

// Gambar preview saat link dibagikan (WA/Twitter/dll): 1200x630, dibuat otomatis.
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0d3b2e 0%, #14532d 55%, #0d3b2e 100%)",
          color: "#ffffff",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: 12,
            color: "#d4af37",
            fontFamily: "Arial, sans-serif",
            fontWeight: 700,
          }}
        >
          MINIMARKET RUMAHAN
        </div>
        <div style={{ fontSize: 110, fontWeight: 700, marginTop: 8 }}>Warmak A3</div>
        <div
          style={{
            fontSize: 36,
            marginTop: 16,
            color: "#e7e5df",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Sembako &amp; kebutuhan harian — pesan cepat via WhatsApp
        </div>
        <div
          style={{
            marginTop: 40,
            height: 6,
            width: 220,
            background: "#d4af37",
            borderRadius: 3,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
