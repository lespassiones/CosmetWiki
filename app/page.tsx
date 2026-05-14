import { Suspense } from "react";
import { cookies } from "next/headers";
import { HomeShell } from "@/components/HomeShell";
import { LandingHero } from "@/components/LandingHero";
import { HomeDashboard, type DashboardData } from "@/components/home/HomeDashboard";
import { DailyPicksCard } from "@/components/home/DailyPicksCard";
import { getProfile, getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { tipsForCarousel } from "@/lib/tips";
import type { AnalyseResponse } from "@/lib/analyseTypes";

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
  // Reuse the request-cached `getUser()` so this dashboard doesn't trigger a
  // second `auth.getUser()` round-trip (the layout already resolved it).
  const user = await getUser();

  let lastAnalysis: DashboardData["lastAnalysis"] = null;
  let routineCount = 0;
  let routineAvgScore: number | null = null;
  let routineCounts: DashboardData["routineCounts"] = null;

  if (user) {
    const [lastResult, routineResult] = await Promise.all([
      sb
        .schema("cosme_check")
        .from("analyses")
        .select("id, name, product_label, score, created_at, result_json")
        .order("created_at", { ascending: false })
        .limit(1),
      sb
        .schema("cosme_check")
        .from("routine_items")
        .select("analyses(score, result_json)"),
    ]);

    const lastRow = lastResult.data?.[0] as
      | { id: string; name: string | null; product_label: string | null; score: number | null; created_at: string; result_json: AnalyseResponse | null }
      | undefined;
    if (lastRow) {
      lastAnalysis = {
        id: lastRow.id,
        name: lastRow.name,
        product_label: lastRow.product_label,
        score: lastRow.score,
        created_at: lastRow.created_at,
        counts: lastRow.result_json
          ? {
              vert: lastRow.result_json.counts.vert,
              jaune: lastRow.result_json.counts.jaune,
              orange: lastRow.result_json.counts.orange,
              rouge: lastRow.result_json.counts.rouge,
            }
          : null,
      };
    }

    const routine = (routineResult.data ?? []) as unknown as {
      analyses: { score: number | null; result_json: AnalyseResponse | null } | null;
    }[];
    const scores = routine
      .map((r) => r.analyses?.score)
      .filter((s): s is number => typeof s === "number");
    routineCount = routine.length;
    routineAvgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

    // Aggregate counts across all routine products so the routine card blob
    // reflects the cumulative composition (matches "exposition cumulée").
    const agg = { vert: 0, jaune: 0, orange: 0, rouge: 0 };
    let any = false;
    for (const r of routine) {
      const c = r.analyses?.result_json?.counts;
      if (!c) continue;
      any = true;
      agg.vert += c.vert ?? 0;
      agg.jaune += c.jaune ?? 0;
      agg.orange += c.orange ?? 0;
      agg.rouge += c.rouge ?? 0;
    }
    routineCounts = any ? agg : null;
  }

  return {
    firstName,
    lastAnalysis,
    routineCount,
    routineAvgScore,
    routineCounts,
    tips: tipsForCarousel(12),
  };
}

// Streamed dashboard — renders inside a Suspense boundary so the rest of the
// page (HomeShell, analyse panel, footer chrome) doesn't wait on the two
// Supabase queries below. Saves ~150-300 ms of perceived TTFB on signed-in
// home loads.
async function DashboardSection({ firstName }: { firstName: string | null }) {
  const data = await loadDashboard(firstName);
  return <HomeDashboard data={data} trendingSlot={<DailyPicksCard />} />;
}

function DashboardSkeleton({ firstName }: { firstName: string | null }) {
  const greeting = firstName ? `Bonjour ${firstName} 👋` : "Bienvenue 👋";
  return (
    <section
      aria-label="Tableau de bord"
      aria-busy
      className="mx-auto w-full max-w-6xl px-5 lg:px-8 mt-2 lg:mt-6"
    >
      <h1 className="text-[26px] lg:text-[36px] leading-tight font-bold tracking-tight">
        {greeting}
      </h1>
      <div className="mt-3 -mx-5 h-[2px] bg-black/30 lg:mx-0 lg:mt-4 lg:h-px lg:bg-black/[0.08]" />
      <div className="mt-3 lg:mt-4 h-4 w-2/3 max-w-md rounded bg-black/[0.06] animate-pulse" />
      <div className="mt-4 h-16 rounded-2xl bg-black/[0.04] animate-pulse" />
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <div className="h-44 rounded-2xl bg-black/[0.04] animate-pulse" />
        <div className="h-44 rounded-2xl bg-black/[0.04] animate-pulse" />
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <div className="h-28 rounded-2xl bg-black/[0.04] animate-pulse" />
        <div className="h-28 rounded-2xl bg-black/[0.04] animate-pulse" />
      </div>
    </section>
  );
}

export default async function Home({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const initialInci = (params?.inci ?? "").slice(0, 6000);
  const initialMode = params?.mode ? MODE_MAP[params.mode] : undefined;

  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  const signedIn = Boolean(user);
  // Signed-in users see the dashboard. When an analysis is in flight (via
  // ?inci=…) HomeShell takes over rendering on top — it knows how to hide the
  // dashboard chrome itself.
  const showDashboard = signedIn && !initialInci;
  const firstName = profile?.first_name ?? null;

  // ─── Guest path ───────────────────────────────────────────────────────
  // Single-section image landing — no header / footer / chrome on top.
  // The CTA inside <LandingHero /> sends the user to /auth/sign-in.
  // (If a guest somehow lands on /?inci=... we still want HomeShell to
  // gate-and-redirect them through its existing AuthGate logic, so that
  // path falls through below.)
  if (!signedIn && !initialInci) {
    return <LandingHero />;
  }

  return (
    <div
      className={`relative isolate flex flex-col bg-bg ${
        showDashboard ? "" : "min-h-screen"
      }`}
    >
      {showDashboard && (
        <Suspense fallback={<DashboardSkeleton firstName={firstName} />}>
          <DashboardSection firstName={firstName} />
        </Suspense>
      )}

      <HomeShell
        initialInci={initialInci}
        initialMode={initialMode}
        signedIn={signedIn}
      />
    </div>
  );
}
