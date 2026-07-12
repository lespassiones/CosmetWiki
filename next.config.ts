import type { NextConfig } from "next";

// Content-Security-Policy — inventaire des origines réelles :
//   Scripts  : 'self' + inline Next.js hydration + Vercel Analytics
//              'unsafe-eval' requis par le runtime webpack de Next.js (module registry)
//   Connect  : Supabase REST + Realtime WS + Vercel Analytics beacon
//   Images   : Supabase Storage, incibeauty.com, data: (canvas), blob: (caméra)
//   Fonts    : 'self' — Inter est self-hosted via next/font
//   Workers  : 'self' + blob: (certaines implémentations SW)
// PostHog (analytics + session replay, région EU) charge dynamiquement des
// scripts depuis eu-assets.i.posthog.com (recorder, autocapture) et envoie ses
// événements vers eu.i.posthog.com. Sans ces origines dans script-src/connect-src,
// la CSP bloque tout et PostHog inonde la console de centaines d'erreurs +
// retries en boucle. Les deux hôtes doivent figurer dans les deux directives.
const POSTHOG_HOSTS = "https://eu.i.posthog.com https://eu-assets.i.posthog.com";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com ${POSTHOG_HOSTS}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://incibeauty.com https://*.incibeauty.com",
  "font-src 'self'",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com ${POSTHOG_HOSTS}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: CSP },
  // HSTS — 1 an. Ajouter preload + soumission au preload list si domaine stable.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
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
