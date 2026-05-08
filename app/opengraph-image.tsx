import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CosmetWiki — moteur de recherche d'ingrédients cosmétiques";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
          background:
            "linear-gradient(135deg, #faf6ff 0%, #fdf6fb 50%, #fef6fa 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background:
                "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
            }}
          />
          <div style={{ fontSize: 36, fontWeight: 700, color: "#1a0f2e" }}>
            CosmetWiki
          </div>
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: "#1a0f2e",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: 980,
          }}
        >
          Le moteur de recherche public d'ingrédients cosmétiques
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 30,
            color: "#6b5d80",
            maxWidth: 900,
          }}
        >
          15 000+ ingrédients · classification couleur · analyse INCI
        </div>
      </div>
    ),
    { ...size },
  );
}
