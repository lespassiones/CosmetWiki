import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/siteUrl";
import { PWARegister } from "@/components/PWARegister";
import { PostHogInit } from "@/components/PostHogInit";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { RecoveryRedirect } from "./RecoveryRedirect";
import { ConditionalLandingFooter } from "@/components/ConditionalLandingFooter";
import { DownloadAppProvider } from "@/components/download/DownloadAppProvider";
import "./globals.css";

/**
 * Layout racine : entièrement statique, aucun appel réseau.
 *
 * Avant le retrait de la web app connectée, ce layout faisait sur CHAQUE
 * navigation, y compris sur une page de blog :
 *   - `getUser()`   : un aller-retour Supabase Auth,
 *   - `getProfile()`: une requête sur `user_profiles`,
 *   - `loadIngredientFamilies()` : une requête sur `ingredient_families`,
 *   - la RPC `cosme_check_get_credits`.
 * Plus la middleware qui rafraîchissait la session par-dessus. Quatre à cinq
 * allers-retours pour afficher une page publique qui n'en lisait aucun.
 *
 * Il n'y a plus de session à lire : la connexion vit dans l'application mobile.
 * Le layout ne fait donc plus rien d'autre que poser le document. Les pages
 * publiques deviennent servables depuis le CDN.
 *
 * `DownloadAppProvider` monte la modale de téléchargement pour tout l'arbre :
 * chaque CTA du site l'ouvre sur ordinateur et redirige vers le bon store sur
 * mobile. `RecoveryRedirect` reste indispensable, il rattrape le lien de
 * réinitialisation de mot de passe envoyé par l'APPLICATION MOBILE, dont
 * l'unique page d'atterrissage est `/auth/reset-password` sur ce site.
 */

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
// Titre de marque validé par le fondateur (2026-07) : le positionnement est
// la personnalisation (cosmétiques adaptés au profil de l'utilisateur), pas
// l'analyse générique. Ne pas remplacer par un titre à mots-clés.
const DEFAULT_TITLE =
  "Cosme Check, l'application qui te dit les cosmétiques faits pour toi.";
const DEFAULT_DESCRIPTION =
  "Cosme Check décode les ingrédients, vérifie les promesses marketing et te dit si le produit te correspond vraiment. Application gratuite sur iOS et Android.";

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
    other: {
      "msvalidate.01": "38151B7223403B53B27A98A0ADCFCDD7",
    },
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/pwa/apple-icon.png", sizes: "180x180", type: "image/png" },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`light ${inter.variable}`} data-theme="light">
      <body className="min-h-screen antialiased">
        <SiteJsonLd />
        <DownloadAppProvider>
          {children}
          <ConditionalLandingFooter />
        </DownloadAppProvider>
        <Suspense fallback={null}>
          <PostHogInit />
        </Suspense>
        <RecoveryRedirect />
        <PWARegister />
        <Analytics />
      </body>
    </html>
  );
}
