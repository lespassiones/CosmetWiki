import Link from "next/link";
import { cookies } from "next/headers";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { MobileMenu } from "@/components/MobileMenu";
import { HomeShell } from "@/components/HomeShell";
import { InstallPWAButton } from "@/components/InstallPWAButton";
import { HomeDashboard, type DashboardData } from "@/components/home/HomeDashboard";
import { getProfile, getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { tipsForCarousel } from "@/lib/tips";

type Props = {
  searchParams?: Promise<{ inci?: string; mode?: string }>;
};

const MODE_MAP: Record<string, "inci" | "product" | "barcode" | undefined> = {
  paste: "inci",
  search: "product",
  barcode: "barcode",
};

async function loadDashboard(firstName: string | null): Promise<DashboardData> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();

  let lastAnalysis: DashboardData["lastAnalysis"] = null;
  let routineCount = 0;
  let routineAvgScore: number | null = null;

  if (user) {
    const [lastResult, routineResult] = await Promise.all([
      sb
        .schema("cosme_check")
        .from("analyses")
        .select("id, name, product_label, score, created_at")
        .order("created_at", { ascending: false })
        .limit(1),
      sb
        .schema("cosme_check")
        .from("routine_items")
        .select("analyses(score)"),
    ]);
    lastAnalysis = (lastResult.data?.[0] ?? null) as DashboardData["lastAnalysis"];
    const routine = (routineResult.data ?? []) as unknown as {
      analyses: { score: number | null } | null;
    }[];
    const scores = routine
      .map((r) => r.analyses?.score)
      .filter((s): s is number => typeof s === "number");
    routineCount = routine.length;
    routineAvgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
  }

  const { data: trendingData } = await sb.rpc("cosme_check_trending_ingredients", {
    p_days: 7,
    p_limit: 5,
  });

  return {
    firstName,
    lastAnalysis,
    routineCount,
    routineAvgScore,
    tips: tipsForCarousel(12),
    trendingIngredients: (trendingData ?? []) as DashboardData["trendingIngredients"],
  };
}

export default async function Home({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const initialInci = (params?.inci ?? "").slice(0, 6000);
  const initialMode = params?.mode ? MODE_MAP[params.mode] : undefined;

  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  const dashboard = await loadDashboard(profile?.first_name ?? null);
  const signedIn = Boolean(user);
  // Signed-in users see the dashboard. When an analysis is in flight (via
  // ?inci=…) HomeShell takes over rendering on top — it knows how to hide the
  // dashboard chrome itself.
  const showDashboard = signedIn && !initialInci;

  return (
    <div
      className={`relative isolate flex flex-col bg-bg ${
        showDashboard ? "" : "min-h-screen"
      }`}
    >
      {/* AppShell paints its own BackgroundGlow + chrome (sidebar / bottom nav)
          for signed-in users — we only render the public landing chrome
          (BackgroundGlow + header) for guests. */}
      {!signedIn && (
        <>
          <BackgroundGlow />
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <Logo size="md" />
            <nav className="hidden items-center gap-1 text-sm text-ink-muted sm:flex">
              <Link
                href="/comment-ca-marche"
                className="rounded-full px-3 py-1.5 transition-colors hover:text-ink"
              >
                Comment ça marche
              </Link>
              <Link
                href="/about"
                className="rounded-full px-3 py-1.5 transition-colors hover:text-ink"
              >
                À propos
              </Link>
              <InstallPWAButton className="ml-2" />
              <Link
                href="/auth/sign-in"
                className="ml-2 rounded-full px-3 py-1.5 font-medium text-ink transition-colors hover:bg-black/[0.04]"
              >
                Se connecter
              </Link>
            </nav>
            <MobileMenu />
          </header>
        </>
      )}

      {showDashboard && <HomeDashboard data={dashboard} />}

      <HomeShell
        initialInci={initialInci}
        initialMode={initialMode}
        signedIn={signedIn}
      />

      {!signedIn && <Footer />}
    </div>
  );
}
