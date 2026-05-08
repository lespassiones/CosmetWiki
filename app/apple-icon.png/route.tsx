import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZE = 180;

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
            "linear-gradient(135deg, #FB7185 0%, #F472B6 50%, #FB7185 100%)",
        }}
      >
        <svg
          width="112"
          height="112"
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
