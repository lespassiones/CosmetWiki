import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "incibeauty.com" },
      { protocol: "https", hostname: "**.incibeauty.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    formats: ["image/webp"],
  },
  compress: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Legacy : the standalone /analyser page was merged into the home — keep
      // existing links and bookmarks working.
      { source: "/analyser", destination: "/", permanent: true },
    ];
  },
};

export default config;
