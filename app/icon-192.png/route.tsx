import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZE = 192;

// Chromium installability requires BOTH a 192×192 and a 512×512 PNG icon
// declared in the manifest. This route serves the 192 variant.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #8B5CF6 100%)",
          borderRadius: 36,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 3h6" />
          <path d="M10 3v7.5L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 10.5V3" />
          <path d="M7.5 14h9" />
        </svg>
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
}
