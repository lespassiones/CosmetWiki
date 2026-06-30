import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabaseAnon, type ColorRating } from "@/lib/supabase";
import { SITE_URL } from "@/lib/siteUrl";
import { RATING_DOT } from "@/lib/colors";
import { getAppConfig } from "@/lib/appConfig";
import { computeEssentiel } from "@/lib/essentiel/engine";
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
  // Feature flag (admin Paramètres) : le partage public peut être coupé. Quand
  // il est OFF, les liens partagés répondent comme introuvables. Fail-open.
  const cfg = await getAppConfig();
  if (!cfg.flag_public_share) return null;
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
  const img = r?.imageUrl ?? `${SITE_URL}/pwa/icon.png`;
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

  // Analyse OBJECTIVE (déterministe, sans IA ni profil) : ce qui est bien /
  // à surveiller au niveau de la formule. La lecture PERSONNALISÉE (3 blocs IA
  // selon le profil) reste réservée aux comptes → teaser + CTA plus bas.
  const essentiel = r?.items ? computeEssentiel(r) : null;
  const positives = essentiel?.positives ?? [];
  const concerns = essentiel?.concerns ?? [];
  const TIER_DOT: Record<string, ColorRating> = { jaune: "Jaune", orange: "Orange", rouge: "Rouge" };

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

        {/* Ce qui est bien (objectif, formule) */}
        {positives.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-[13px] font-bold text-[#111111]">Ce qui est bien</p>
            <ul className="space-y-1.5">
              {positives.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${RATING_DOT.Vert}`} aria-hidden />
                  <span className="text-[#111111]">
                    <span className="font-semibold">{p.name}</span>
                    {p.functions?.length ? (
                      <span className="text-ink-subtle"> — {p.functions.join(" · ")}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* À surveiller (objectif, formule) */}
        {concerns.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-[13px] font-bold text-[#111111]">À surveiller</p>
            <ul className="space-y-1.5">
              {concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${RATING_DOT[TIER_DOT[c.tier] ?? "Jaune"]}`}
                    aria-hidden
                  />
                  <span className="text-[#111111]">
                    <span className="font-semibold">{c.family}</span>
                    <span className="text-ink-subtle"> — {c.effect}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Teaser : l'analyse PERSONNALISÉE (3 blocs IA selon le profil) est
          réservée aux comptes → pousse à créer un compte. */}
      <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <div className="relative">
          {/* Aperçu flouté des 3 blocs perso */}
          <div className="space-y-3 p-5 blur-[5px] select-none" aria-hidden>
            {["Correspond à tes objectifs", "Adapté à ta peau", "À surveiller pour toi"].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <span className="h-10 w-10 shrink-0 rounded-full bg-emerald-100" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-[#111111]">{t}</div>
                  <div className="mt-1 h-2.5 w-4/5 rounded-full bg-black/10" />
                </div>
              </div>
            ))}
          </div>
          {/* Voile + cadenas + CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/55 px-5 text-center">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>
            <p className="text-[15px] font-bold text-[#111111]">Ton analyse personnalisée</p>
            <p className="mt-1 max-w-sm text-[13px] text-ink-subtle">
              Crée ton compte pour savoir si ce produit correspond à TES objectifs, ta peau
              et tes restrictions.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center justify-center rounded-full bg-[#111111] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Créer mon compte gratuit
            </Link>
          </div>
        </div>
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
