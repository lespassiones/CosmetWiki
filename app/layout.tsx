import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/siteUrl";
import { PWARegister } from "@/components/PWARegister";
import { AppShell } from "@/components/nav/AppShell";
import { ConditionalLandingFooter } from "@/components/ConditionalLandingFooter";
import { getProfile, getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { RestrictionsProvider } from "@/components/restrictions/RestrictionsProvider";
import { loadIngredientFamilies } from "@/lib/restrictions/families";
import { EMPTY_RESTRICTIONS, readUserRestrictions } from "@/lib/restrictions/types";
import { readSkinProfile } from "@/lib/skin/profile";
import "./globals.css";

type InitialCredits = { used: number; limit: number; remaining: number };

// Pages 100 % statiques (landing public). On veut éviter 3-4 round-trips
// Supabase au layout root pour chaque navigation entre ces pages — elles ne
// rendent jamais le dashboard, donc profile / families / credits ne servent
// à rien ici. `signedIn` reste déduit du cookie pour que le LandingFooter
// reste correctement caché aux utilisateurs connectés.
const PUBLIC_LANDING_PREFIXES = [
  "/comment-ca-marche",
  "/fonctionnalites",
  "/faq",
  "/offre",
  "/en-savoir-plus",
  "/equipe",
  "/blog",
  "/contact",
  "/cgu",
  "/confidentialite",
  "/mentions-legales",
];

function isPublicLandingPath(pathname: string): boolean {
  return PUBLIC_LANDING_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function hasAuthCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
      return true;
    }
  }
  return false;
}

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
const DEFAULT_TITLE =
  "CosmeCheck, l'application qui t'aide à choisir les cosmétiques les plus adaptés à tes besoins.";
const DEFAULT_DESCRIPTION =
  "CosmeCheck analyse les ingrédients, vérifie les promesses, compare les produits et te guide grâce à des conseils personnalisés pour t'aider à obtenir de meilleurs résultats avec moins d'essais, moins de déceptions et moins d'argent dépensé inutilement.";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";

  const hideOnPaths = ["/auth", "/scan/photo", "/onboarding"];

  // Fast path : pages landing publiques. AppShell rend juste {children} pour
  // les visiteurs anonymes (ligne 114 du composant), donc profile / families /
  // credits sont inutiles côté layout. Pour les visiteurs connectés naviguant
  // ces mêmes pages, on déduit `signedIn` du cookie pour préserver l'UX
  // (LandingFooter caché) sans payer l'aller-retour Supabase.
  if (isPublicLandingPath(pathname)) {
    const signedIn = hasAuthCookie(cookieStore);
    return (
      <html lang="fr" className={`light ${inter.variable}`} data-theme="light">
        <body className="min-h-screen antialiased">
          <link
            rel="preconnect"
            href={process.env.NEXT_PUBLIC_SUPABASE_URL}
            crossOrigin="anonymous"
          />
          <RestrictionsProvider restrictions={EMPTY_RESTRICTIONS} families={[]}>
            <AppShell signedIn={signedIn} firstName={null} hideOnPaths={hideOnPaths} initialCredits={null}>
              {children}
              <ConditionalLandingFooter signedIn={signedIn} />
            </AppShell>
          </RestrictionsProvider>
          <PWARegister />
          <Analytics />
        </body>
      </html>
    );
  }

  const sb = supabaseServer(cookieStore);

  // Phase 1: resolve identity. getProfile() calls getUser() internally (cached)
  // so it can't start its own DB work until getUser() resolves anyway. There
  // is zero extra sequential cost in awaiting getUser() first.
  const user = await getUser();
  const signedIn = Boolean(user);

  // Phase 2: remaining reads are independent of each other. Skip the credits
  // RPC for anonymous visitors — avoids a needless Supabase round-trip.
  // loadIngredientFamilies() is React-cached so calling it here and inside a
  // page component within the same request is free (deduped automatically).
  const [profile, familiesResult, creditsRaw] = await Promise.all([
    getProfile(),
    loadIngredientFamilies(),
    signedIn
      ? (async () => {
          try {
            return await sb.rpc("cosme_check_get_credits");
          } catch {
            return { data: null };
          }
        })()
      : Promise.resolve({ data: null }),
  ]);
  const firstName = profile?.first_name ?? null;

  const restrictions = signedIn
    ? readUserRestrictions(profile?.preferences ?? null)
    : EMPTY_RESTRICTIONS;
  const families = signedIn ? familiesResult : [];
  const allergiesFreeform = signedIn
    ? (readSkinProfile(profile?.preferences ?? null).allergiesFreeform ?? undefined)
    : undefined;

  const creditsData = (creditsRaw as { data: unknown }).data as {
    ok?: boolean; used?: number; limit?: number; remaining?: number;
  } | null;
  const initialCredits: InitialCredits | null =
    signedIn && creditsData?.ok
      ? { used: creditsData.used ?? 0, limit: creditsData.limit ?? 0, remaining: creditsData.remaining ?? 0 }
      : null;

  return (
    <html lang="fr" className={`light ${inter.variable}`} data-theme="light">
      <body className="min-h-screen antialiased">
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL}
          crossOrigin="anonymous"
        />
        <RestrictionsProvider restrictions={restrictions} families={families} allergiesFreeform={allergiesFreeform}>
          <AppShell signedIn={signedIn} firstName={firstName} hideOnPaths={hideOnPaths} initialCredits={initialCredits}>
            {children}
            <ConditionalLandingFooter signedIn={signedIn} />
          </AppShell>
        </RestrictionsProvider>
        <PWARegister />
        <Analytics />
      </body>
    </html>
  );
}
