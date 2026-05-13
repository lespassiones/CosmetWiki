import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { compareAnalyses, type CompareSide } from "@/lib/routine/compare";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { GLASS_CARD } from "@/lib/ui/glass";

export const metadata = { title: "Comparer · Cosme Check" };

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>,
  );
}

function scoreTone(s: number | null) {
  if (s === null) return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "—" };
  if (s >= 17) return { bg: "bg-emerald-50", text: "text-emerald-700", label: "Très bien" };
  if (s >= 13) return { bg: "bg-amber-50", text: "text-amber-700", label: "Bien" };
  if (s >= 9) return { bg: "bg-orange-50", text: "text-orange-700", label: "Moyen" };
  return { bg: "bg-rose-50", text: "text-rose-700", label: "À éviter" };
}

const RATING_DOT: Record<string, string> = {
  Vert: "bg-emerald-500",
  Jaune: "bg-amber-400",
  Orange: "bg-orange-500",
  Rouge: "bg-rose-500",
};

type SearchParams = Promise<{ ids?: string }>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const { ids } = await searchParams;
  const user = await getUser();
  if (!user) redirect(`/auth/sign-in?next=/compare?ids=${ids ?? ""}`);

  const list = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length !== 2) notFound();

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, name, product_label, score, result_json")
    .in("id", list);

  const rows = (data ?? []) as {
    id: string;
    name: string | null;
    product_label: string | null;
    score: number | null;
    result_json: AnalyseResponse;
  }[];
  if (rows.length !== 2) notFound();

  // Preserve the URL order
  const ordered = list.map((id) => rows.find((r) => r.id === id)!).filter(Boolean);
  const [a, b]: CompareSide[] = ordered.map((r) => ({
    id: r.id,
    name: r.product_label ?? r.name ?? "Analyse",
    score: r.score,
    result: r.result_json,
  })) as [CompareSide, CompareSide];

  // Collect the user's routine ingredient slugs (excluding A and B) for the
  // cross-routine insight ("ces ingrédients sont déjà dans 4 autres produits").
  const { data: routine } = await sb
    .schema("cosme_check")
    .from("routine_items")
    .select("analyses(id, result_json)");
  const routineSlugs = new Set<string>();
  for (const it of (routine ?? []) as unknown as { analyses: { id: string; result_json: AnalyseResponse } | null }[]) {
    if (!it.analyses) continue;
    if (it.analyses.id === a.id || it.analyses.id === b.id) continue;
    for (const ing of it.analyses.result_json.items) {
      if (ing.slug) routineSlugs.add(ing.slug);
    }
  }

  const diff = compareAnalyses(a, b, { routineIngredientSlugs: routineSlugs });

  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-6 lg:py-10">
      <Link href="/history" className="text-sm text-[#6B7280] hover:text-black inline-flex items-center gap-1 mb-3">
        ← Mon historique
      </Link>
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Comparer 2 analyses</h1>

      {/* Side-by-side hero */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6">
        {[a, b].map((side, idx) => {
          const tone = scoreTone(side.score);
          const isWinner = diff.winner !== "tie" && ((idx === 0 && diff.winner === "a") || (idx === 1 && diff.winner === "b"));
          return (
            <div
              key={side.id}
              className={`rounded-2xl p-5 ${tone.bg} ring-1 ${isWinner ? "ring-2 ring-[#111111]" : "ring-[#E5E7EB]"}`}
            >
              {isWinner && (
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-2 text-[#111111]">
                  Meilleur des deux
                </div>
              )}
              <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">
                {idx === 0 ? "Analyse A" : "Analyse B"}
              </div>
              <h2 className="text-sm font-semibold truncate mb-2">{side.name}</h2>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${tone.text}`}>{side.score?.toFixed(1) ?? "—"}</span>
                <span className="text-sm text-[#6B7280]">/20</span>
              </div>
              <p className={`text-[12px] font-semibold mt-1 ${tone.text}`}>{tone.label}</p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {(["Vert", "Jaune", "Orange", "Rouge"] as const).map((k) => {
                  const v =
                    k === "Vert" ? side.result.counts.vert
                    : k === "Jaune" ? side.result.counts.jaune
                    : k === "Orange" ? side.result.counts.orange
                    : side.result.counts.rouge;
                  return (
                    <div key={k} className="rounded-lg bg-white py-1.5">
                      <div className={`mx-auto h-1.5 w-1.5 rounded-full ${RATING_DOT[k]}`} aria-hidden />
                      <div className="text-sm font-bold mt-0.5">{v}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Differences */}
      <section className={`${GLASS_CARD} p-5 mb-4`}>
        <h2 className="text-[15px] font-semibold mb-3">Différences clés</h2>
        <ul className="space-y-2 text-[14px] leading-relaxed">
          {diff.insights.map((ins, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#F43F5E] shrink-0" aria-hidden />
              <span>{renderBold(ins)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Unique problematic ingredients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <UniqueList
          title={`Uniquement dans ${a.name}`}
          items={diff.uniqueToA}
        />
        <UniqueList
          title={`Uniquement dans ${b.name}`}
          items={diff.uniqueToB}
        />
      </div>
    </div>
  );
}

function UniqueList({
  title,
  items,
}: {
  title: string;
  items: { name: string; slug: string | null; colorRating: string | null }[];
}) {
  return (
    <section className={`${GLASS_CARD} p-5`}>
      <h3 className="text-[14px] font-semibold mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-[12px] text-[#6B7280]">Aucun ingrédient pénalisant exclusif.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-2 text-[13px]">
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${i.colorRating ? RATING_DOT[i.colorRating] : "bg-[#E5E7EB]"}`}
              />
              {i.slug ? (
                <Link href={`/i/${i.slug}`} className="hover:underline">
                  {i.name}
                </Link>
              ) : (
                <span>{i.name}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
