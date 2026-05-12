import Link from "next/link";

export type DashboardData = {
  firstName: string | null;
  lastAnalysis: {
    id: string;
    name: string | null;
    product_label: string | null;
    score: number | null;
    created_at: string;
  } | null;
  routineCount: number;
  routineAvgScore: number | null;
  tipOfTheDay: string;
  trendingIngredients: {
    slug: string;
    name: string;
    color_rating: "Vert" | "Jaune" | "Orange" | "Rouge" | null;
    translation_fr: string | null;
  }[];
};

const CATEGORIES = [
  { emoji: "🧴", label: "Crème visage", q: "crème visage" },
  { emoji: "🧼", label: "Shampooing", q: "shampooing" },
  { emoji: "☀️", label: "Solaire", q: "solaire" },
  { emoji: "💄", label: "Maquillage", q: "maquillage" },
  { emoji: "🧴", label: "Corps", q: "corps" },
  { emoji: "👶", label: "Bébé", q: "bébé" },
];

const RATING_COLOR: Record<NonNullable<DashboardData["trendingIngredients"][number]["color_rating"]>, string> = {
  Vert: "#10B981",
  Jaune: "#F59E0B",
  Orange: "#FB923C",
  Rouge: "#EF4444",
};

function scoreTone(s: number | null) {
  if (s === null) return { bg: "bg-[#F3F4F6]", fg: "text-[#6B7280]", label: "—" };
  if (s >= 17) return { bg: "bg-emerald-50", fg: "text-emerald-700", label: "Très bien" };
  if (s >= 13) return { bg: "bg-amber-50", fg: "text-amber-700", label: "Bien" };
  if (s >= 9) return { bg: "bg-orange-50", fg: "text-orange-700", label: "Moyen" };
  return { bg: "bg-rose-50", fg: "text-rose-700", label: "À éviter" };
}

export function HomeDashboard({ data }: { data: DashboardData }) {
  const greeting = data.firstName ? `Bonjour ${data.firstName} 👋` : "Bienvenue 👋";

  return (
    <section aria-label="Tableau de bord" className="mx-auto w-full max-w-6xl px-5 lg:px-8 mt-2 lg:mt-6">
      <h1 className="text-[26px] lg:text-[36px] leading-tight font-bold tracking-tight">{greeting}</h1>
      <p className="mt-1 lg:mt-2 text-sm lg:text-base text-[#6B7280]">
        Décrypte tes cosmétiques en{" "}
        <span className="relative inline-block font-medium text-[#111111]">
          3 secondes
          <span aria-hidden className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#F43F5E] rounded-full" />
        </span>
        .
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <LastAnalysisCard last={data.lastAnalysis} />
        <RoutineCard count={data.routineCount} avgScore={data.routineAvgScore} />
      </div>

      <TipCard text={data.tipOfTheDay} />

      <Link
        href="/advisor"
        className="mt-4 block rounded-2xl bg-gradient-to-r from-[#111111] to-[#1F2937] text-white p-5 hover:brightness-110 transition group"
      >
        <div className="flex items-center gap-4">
          <span aria-hidden className="text-2xl">✨</span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Skin advisor</div>
            <p className="text-[12px] text-white/70 mt-1 leading-snug">
              Pose tes questions sur ta routine. L&apos;assistant s&apos;appuie sur ton profil et tes analyses.
            </p>
          </div>
          <span aria-hidden className="opacity-60 group-hover:translate-x-1 transition">→</span>
        </div>
      </Link>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <CategoriesCard />
        <TrendingCard items={data.trendingIngredients} />
      </div>
    </section>
  );
}

function LastAnalysisCard({ last }: { last: DashboardData["lastAnalysis"] }) {
  if (!last) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <div className="text-[11px] text-[#6B7280] uppercase tracking-wide">Dernière analyse</div>
        <div className="mt-2 text-sm text-[#6B7280]">
          Aucune analyse pour le moment. Lance ta première analyse via le bouton scan.
        </div>
      </div>
    );
  }
  const tone = scoreTone(last.score);
  const title = last.product_label ?? last.name ?? "Analyse";
  return (
    <Link
      href={`/history/${last.id}`}
      className="block rounded-2xl border border-[#E5E7EB] bg-white p-5 hover:border-[#111111] transition"
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-[#6B7280] uppercase tracking-wide">Dernière analyse</div>
        <span className="text-[11px] text-[#F43F5E] font-medium">Voir →</span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className={`h-14 w-14 shrink-0 rounded-xl flex flex-col items-center justify-center ${tone.bg} ${tone.fg}`}>
          <span className="text-base font-bold leading-none">
            {last.score !== null ? last.score.toFixed(1) : "—"}
          </span>
          <span className="text-[10px] mt-0.5">/20</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#111111] truncate">{title}</div>
          <div className="text-[12px] text-[#6B7280]">{tone.label}</div>
        </div>
      </div>
    </Link>
  );
}

function RoutineCard({ count, avgScore }: { count: number; avgScore: number | null }) {
  if (count === 0) {
    return (
      <Link
        href="/routine"
        className="block rounded-2xl border border-[#E5E7EB] bg-white p-5 hover:border-[#111111] transition"
      >
        <div className="text-[11px] text-[#6B7280] uppercase tracking-wide">Ta routine</div>
        <div className="mt-3 text-sm text-[#6B7280]">
          Crée ta routine pour suivre ton exposition cumulée.
        </div>
        <div className="mt-2 text-[11px] text-[#F43F5E] font-medium">Commencer →</div>
      </Link>
    );
  }
  const tone = scoreTone(avgScore);
  return (
    <Link
      href="/routine"
      className="block rounded-2xl border border-[#E5E7EB] bg-white p-5 hover:border-[#111111] transition"
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-[#6B7280] uppercase tracking-wide">Ta routine</div>
        <span className="text-[11px] text-[#F43F5E] font-medium">Voir →</span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className={`h-14 w-14 shrink-0 rounded-xl flex flex-col items-center justify-center ${tone.bg} ${tone.fg}`}>
          <span className="text-base font-bold leading-none">
            {avgScore !== null ? avgScore.toFixed(1) : "—"}
          </span>
          <span className="text-[10px] mt-0.5">/20</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#111111]">
            {count} produit{count > 1 ? "s" : ""} dans ta routine
          </div>
          <div className="text-[12px] text-[#6B7280]">Exposition moyenne {tone.label.toLowerCase()}</div>
        </div>
      </div>
    </Link>
  );
}

function TipCard({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-2xl bg-[#FFF1F2] p-4 lg:p-5 flex items-start gap-3">
      <div className="text-xl shrink-0" aria-hidden>💡</div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-[#F43F5E] font-semibold">Astuce du jour</div>
        <p className="mt-1 text-sm text-[#111111] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function CategoriesCard() {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <h2 className="text-[15px] font-semibold mb-3">Catégories populaires</h2>
      <ul className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((c) => (
          <li key={c.label}>
            <Link
              href={`/?mode=search&q=${encodeURIComponent(c.q)}`}
              className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm hover:border-[#111111] transition"
            >
              <span aria-hidden className="text-base">{c.emoji}</span>
              <span className="font-medium">{c.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendingCard({ items }: { items: DashboardData["trendingIngredients"] }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <h2 className="text-[15px] font-semibold mb-3">Ingrédients tendance cette semaine</h2>
      {items.length === 0 ? (
        <p className="text-sm text-[#6B7280]">Pas encore de tendance — reviens bientôt.</p>
      ) : (
        <ul className="divide-y divide-[#F0F0F0]">
          {items.map((it) => (
            <li key={it.slug}>
              <Link
                href={`/i/${it.slug}`}
                className="flex items-center gap-3 py-2.5 hover:bg-[#FAFAFA] -mx-2 px-2 rounded-lg transition"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: it.color_rating ? RATING_COLOR[it.color_rating] : "#E5E7EB" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{it.name}</div>
                  {it.translation_fr && (
                    <div className="text-[11px] text-[#6B7280] truncate">{it.translation_fr}</div>
                  )}
                </div>
                <span aria-hidden className="text-[#9CA3AF]">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
