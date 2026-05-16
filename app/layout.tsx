import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/siteUrl";
import { PWARegister } from "@/components/PWARegister";
import { AppShell } from "@/components/nav/AppShell";
import { getProfile, getUser } from "@/lib/auth";
import "./globals.css";

// Self-host Inter on the Vercel edge: zero FOUT, no fonts.googleapis.com
// round-trip on first visit. We expose it as a CSS variable so the existing
// Tailwind `font-sans` / `font-display` chain (and globals.css) can reference
// it via `var(--font-inter)`.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_NAME = "Cosme Check";
const DEFAULT_TITLE = "Cosme Check — Une beauté consciente, au-delà des simples notes";
const DEFAULT_DESCRIPTION =
  "L'application qui décode tes cosmétiques : composition, promesses marketing, ingrédients clefs. Une beauté consciente, vraiment.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s · Cosme Check",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  keywords: [
    "INCI",
    "ingrédients cosmétiques",
    "composition cosmétique",
    "analyse INCI",
    "décoder cosmétiques",
    "perturbateurs endocriniens",
    "parabens",
    "silicones",
    "sulfates",
  ],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    // OG image is generated dynamically by app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  formatDetection: { telephone: false, email: false, address: false },
  manifest: "/manifest.webmanifest",
  verification: {
    google: "10RWq8WwaV_uRyXbnsrotJlbtInqhUfnha8-FkqKZc4",
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAFAFA",
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  const signedIn = Boolean(user);
  const firstName = profile?.first_name ?? null;
  // Hide the shell on full-screen flows that need their own chrome.
  const hideOnPaths = ["/auth", "/scan/photo"];

  return (
    <html lang="fr" className={`light ${inter.variable}`} data-theme="light">
      <body className="min-h-screen antialiased">
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL}
          crossOrigin="anonymous"
        />
        <AppShell signedIn={signedIn} firstName={firstName} hideOnPaths={hideOnPaths}>
          {children}
        </AppShell>
        <PWARegister />
        <Analytics />
      </body>
    </html>
  );
}
