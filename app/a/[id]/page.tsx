import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabaseAnon, type ColorRating } from "@/lib/supabase";
import { SITE_URL } from "@/lib/siteUrl";
import { RATING_DOT } from "@/lib/colors";
import type { AnalyseResponse } from "@/lib/analyseTypes";

// Page publique d'une analyse PARTAGÉE (lien envoyé depuis l'app mobile).
// Lecture seule, SANS connexion : la RPC `cosme_check_get_public_analysis`
// ne renvoie la ligne que si l'utilisateur l'a flaggée `shared = true`.
// Rendu volontairement LÉGER (aperçu + CTA), on ne réutilise pas le panel
// d'analyse complet (interactif + auth). SSR pour que l'aperçu WhatsApp marche.
export const dynamic = "force-dynamic";

type PublicAnalysis = {
  id: string;
  product_label: string | null;
  name: string | null;
  brand: string | null;
  product_type: string | null;
  category: string | null;
  score: number | string | null;
  result_json: AnalyseResponse;
  created_at: string;
};

async function fetchShared(id: string): Promise<PublicAnalysis | null> {
  // UUID basique : évite un appel DB sur une URL malformée.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabaseAnon().rpc(
    "cosme_check_get_public_analysis",
    { p_id: id },
  );
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as PublicAnalysis | undefined) ?? null;
}

function displayName(a: PublicAnalysis): string {
  return a.product_label ?? a.name ?? "Analyse cosmétique";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const a = await fetchShared(id);
  if (!a) return { title: "Analyse introuvable · Cosme Check" };

  const name = displayName(a);
  const r = a.result_json;
  const desc = r?.synthesis
    ? r.synthesis.slice(0, 160)
    : `Décryptage de la composition INCI${a.brand ? ` — ${a.brand}` : ""} par Cosme Check.`;
  const img = r?.imageUrl ?? `${SITE_URL}/logoCC.png`;
  const url = `${SITE_URL}/a/${id}`;

  return {
    title: `${name} · Analyse Cosme Check`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} · Cosme Check`,
      description: desc,
      url,
      type: "article",
      images: [{ url: img }],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: desc,
      images: [img],
    },
  };
}

const COUNT_META: { key: keyof AnalyseResponse["counts"]; label: string; rating: ColorRating }[] = [
  { key: "vert", label: "sûrs", rating: "Vert" },
  { key: "jaune", label: "à surveiller", rating: "Jaune" },
  { key: "orange", label: "pénalisés", rating: "Orange" },
  { key: "rouge", label: "à éviter", rating: "Rouge" },
];

export default async function PublicAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await fetchShared(id);
  if (!a) notFound();

  const name = displayName(a);
  const r = a.result_json;
  const top5: (ColorRating | null)[] = r?.spectrum?.top5 ?? [];
  const counts = r?.counts;
  const imageUrl = r?.imageUrl ?? null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* En-tête produit */}
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06] sm:p-7">
        <div className="flex items-start gap-4">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-black/[0.06]"
            />
          ) : null}
          <div className="min-w-0">
            {a.brand ? (
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">
                {a.brand}
              </p>
            ) : null}
            <h1 className="text-[20px] font-bold leading-tight text-[#111111] sm:text-[24px]">
              {name}
            </h1>
          </div>
        </div>

        {/* Verdict : 5 pastilles (cohérent avec l'app, pas de note chiffrée) */}
        {top5.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-[12px] font-semibold text-ink-subtle">
              Aperçu des 5 premiers ingrédients
            </p>
            <div className="flex items-center gap-2">
              {top5.map((rating, i) => (
                <span
                  key={i}
                  className={`h-5 w-5 rounded-full ${
                    rating ? RATING_DOT[rating] : "bg-black/10"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Compteurs par couleur */}
        {counts ? (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COUNT_META.map(({ key, label, rating }) => (
              <div
                key={key}
                className="rounded-2xl bg-black/[0.025] px-3 py-2 ring-1 ring-black/[0.05]"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${RATING_DOT[rating]}`} aria-hidden />
                  <span className="text-[16px] font-bold text-[#111111]">
                    {counts[key] ?? 0}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-ink-subtle">{label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Synthèse */}
        {r?.synthesis ? (
          <div className="mt-5 rounded-2xl bg-black/[0.025] p-4 ring-1 ring-black/[0.05]">
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#222222]">
              {r.synthesis}
            </p>
          </div>
        ) : null}
      </div>

      {/* CTA vers le web twin (fonctionnel) — l'app mobile arrive bientôt */}
      <div className="mt-5 rounded-3xl bg-gradient-to-br from-rose-50 to-white p-5 text-center ring-1 ring-rose-200/60 sm:p-7">
        <p className="text-[15px] font-semibold text-[#111111]">
          Analysez vos propres produits
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-ink-subtle">
          Scannez ou collez une composition INCI et obtenez le même décryptage,
          gratuitement.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-[#F43F5E] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#E11D48]"
        >
          Découvrir Cosme Check
        </Link>
      </div>

      <p className="mt-4 px-2 text-center text-[11px] leading-relaxed text-ink-subtle">
        Analyse indépendante basée sur la composition INCI déclarée. Information à
        visée éducative, ne remplace pas un avis médical.
      </p>
    </main>
  );
}
