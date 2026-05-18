import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
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
    // AVIF first (best compression, ~50% smaller than WebP on photos), then
    // WebP fallback for browsers that don't support AVIF (<5% in 2026).
    formats: ["image/avif", "image/webp"],
  },
  compress: true,
  experimental: {
    // Tree-shake barrel exports of these packages so we only ship the
    // functions actually imported, not the whole module. @supabase/* is the
    // big one client-side ; openai is server-only here but tagging it
    // doesn't hurt and protects against future client imports.
    // Doc: https://nextjs.org/docs/app/api-reference/next-config-js/optimizePackageImports
    optimizePackageImports: [
      "@supabase/supabase-js",
      "@supabase/ssr",
      "openai",
      "@vercel/analytics",
    ],
  },
  // Silence the "Serializing big strings (Nkib) impacts deserialization
  // performance" webpack cache warning. The big strings come from bundled
  // vendor SDKs (Supabase, OpenAI) - we can't refactor third-party code and
  // it's a perf hint about dev cache only, not a runtime issue.
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      /Serializing big strings/,
    ];
    return config;
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Service worker must not be HTTP-cached, or updates ship slowly.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy : the standalone /analyser page was merged into the home - keep
      // existing links and bookmarks working.
      { source: "/analyser", destination: "/", permanent: true },
    ];
  },
};

export default config;
