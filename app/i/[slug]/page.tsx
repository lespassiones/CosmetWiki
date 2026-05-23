import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { SearchTrigger } from "@/components/SearchTrigger";
import { ProductRow } from "@/components/ProductRow";
import { MobileMenu } from "@/components/MobileMenu";
import { Reveal } from "@/components/Reveal";
import { ExplainIngredient } from "@/components/ingredient/ExplainIngredient";
import { BackToAnalyseButton } from "@/components/ingredient/BackToAnalyseButton";
import { SITE_URL } from "@/lib/siteUrl";
import {
  supabaseAnon,
  type ColorRating,
  type Ingredient,
  type ProductHit,
} from "@/lib/supabase";

// Forcé dynamique : on utilise `Promise.race` pour borner les RPCs Supabase
// (cf. lib/glossary.ts) et Next.js refuse de cacher une page ISR dont les
// fetchs ne complètent pas tous → `DYNAMIC_SERVER_USAGE`. Le cache CDN
// optimisera ça plus tard via `Cache-Control`.
export const dynamic = "force-dynamic";

/** Timeout dur par RPC : sous le timeout serverless Vercel Hobby (10 s)
 *  avec marge pour le rendering. Ingrédient + produits = 2 RPCs séquentielles
 *  donc max 2 × 4 s = 8 s. */
const RPC_TIMEOUT_MS = 4000;

type RpcResult<T> = { data: T | null; error: string | null };

async function rpcWithTimeout<T>(
  rpc: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  ms: number,
): Promise<RpcResult<T>> {
  const timeout = new Promise<RpcResult<T>>((resolve) =>
    setTimeout(() => resolve({ data: null, error: "client_timeout" }), ms),
  );
  const wrapped = Promise.resolve(rpc).then<RpcResult<T>>((r) => ({
    data: r.data ?? null,
    error: r.error ? r.error.message : null,
  }));
  return Promise.race([wrapped, timeout]);
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ from?: string }>;
};

const RATING_CHIP: Record<ColorRating, string> = {
  Vert: "bg-emerald-50/80 text-emerald-700 ring-emerald-200/70",
  Jaune: "bg-amber-50/80 text-amber-700 ring-amber-200/70",
  Orange: "bg-orange-50/80 text-orange-700 ring-orange-200/70",
  Rouge: "bg-rose-50/80 text-rose-700 ring-rose-200/70",
};
const RATING_DOT: Record<ColorRating, string> = {
  Vert: "bg-emerald-500",
  Jaune: "bg-amber-400",
  Orange: "bg-orange-500",
  Rouge: "bg-rose-500",
};
const RATING_LABEL: Record<ColorRating, string> = {
  Vert: "Sans risque connu",
  Jaune: "Pénalité légère",
  Orange: "Pénalité moyenne",
  Rouge: "Pénalité forte",
};
const RATING_BAR: Record<ColorRating, string> = {
  Vert: "from-emerald-400 to-emerald-500",
  Jaune: "from-amber-300 to-amber-500",
  Orange: "from-orange-400 to-orange-600",
  Rouge: "from-rose-400 to-rose-600",
};

const PRODUCTS_VISIBLE = 3;

// `cache()` partage l'appel entre `generateMetadata` et le render de la page
// dans la MÊME requête : sans ça on payait 2 RPCs par hit (la metadata d'abord,
// puis le composant page) pour les mêmes données.
const loadIngredient = cache(async (slug: string): Promise<Ingredient | null> => {
  const { data, error } = await rpcWithTimeout<Ingredient[]>(
    supabaseAnon().rpc("cosme_check_get_ingredient", { p_slug: slug }),
    RPC_TIMEOUT_MS,
  );
  if (error) {
    console.warn(`[ingredient] get_ingredient slug=${slug} failed:`, error);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0] ?? null;
});

async function loadProducts(ingredientId: number): Promise<ProductHit[]> {
  const { data, error } = await rpcWithTimeout<ProductHit[]>(
    supabaseAnon().rpc("cosme_check_products_for_ingredient", {
      p_ingredient_id: ingredientId,
      p_limit: 12,
    }),
    RPC_TIMEOUT_MS,
  );
  if (error || !data) return [];
  return data;
}

const RATING_META_LABEL: Record<ColorRating, string> = {
  Vert: "sans risque connu",
  Jaune: "pénalité légère",
  Orange: "pénalité moyenne",
  Rouge: "pénalité forte",
};

function buildMetaDescription(ing: Ingredient): string {
  const name = prettyName(ing.name);
  const rating = RATING_META_LABEL[ing.color_rating];
  const fr = ing.translations?.fr ? ` (${ing.translations.fr})` : "";
  const fns =
    ing.functions && ing.functions.length > 0
      ? ` Fonctions : ${ing.functions
          .slice(0, 3)
          .map((f) => f.name)
          .join(", ")}.`
      : "";
  const prev =
    ing.prevalence_pct != null
      ? ` Présent dans ${Number(ing.prevalence_pct).toFixed(2)}% des produits.`
      : "";
  const desc = ing.description ? ` ${ing.description.slice(0, 120)}` : "";
  return `${name}${fr} - ingrédient cosmétique INCI, ${rating}.${fns}${prev}${desc}`.slice(
    0,
    300,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ing = await loadIngredient(slug);
  if (!ing) {
    return {
      title: "Ingrédient introuvable",
      robots: { index: false, follow: true },
    };
  }
  const name = prettyName(ing.name);
  const description = buildMetaDescription(ing);
  const path = `/i/${ing.slug}`;
  return {
    title: name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${name} · Cosme Check`,
      description,
      url: path,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} · Cosme Check`,
      description,
    },
  };
}

function buildIngredientJsonLd(ing: Ingredient): object {
  const name = prettyName(ing.name);
  const url = `${SITE_URL}/i/${ing.slug}`;
  const sameAs: string[] = [];

  const chemical: Record<string, unknown> = {
    "@type": "ChemicalSubstance",
    "@id": url,
    name,
    url,
    description: ing.description ?? buildMetaDescription(ing),
    inLanguage: "fr",
  };
  if (ing.cas_number) chemical.identifier = `CAS:${ing.cas_number}`;
  if (ing.translations?.fr) chemical.alternateName = ing.translations.fr;
  if (sameAs.length > 0) chemical.sameAs = sameAs;

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name,
        item: url,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [chemical, breadcrumb],
  };
}

export default async function IngredientPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;
  // `?from=` carries either the literal "analyser"/"home" flag (legacy) OR the
  // exact source URL (new pattern, set by AnalyseResultPanel via usePathname).
  // When we have a real URL we can populate the breadcrumb's "Analyse" link
  // so clicking it brings the user back to THEIR analysis, not the home page.
  const fromRaw = sp?.from ?? null;
  const fromUrl =
    fromRaw && fromRaw.startsWith("/") ? decodeURIComponent(fromRaw) : null;
  const fromAnalyser = fromUrl !== null || fromRaw === "analyser" || fromRaw === "home";
  const ing = await loadIngredient(slug);
  if (!ing) notFound();

  const products = await loadProducts(ing.id);
  const visibleProducts = products.slice(0, PRODUCTS_VISIBLE);
  const moreProductsCount = Math.max(products.length - PRODUCTS_VISIBLE, 0);

  const name = prettyName(ing.name);
  const subtitle = inferSubtitle(ing);
  const breakdown = ing.category_breakdown
    ? Object.entries(ing.category_breakdown)
        .map(([k, v]) => [k, Number(v)] as [string, number])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const hasFunctions = (ing.functions?.length ?? 0) > 0;
  const hasPrevalence = ing.prevalence_pct !== null && ing.prevalence_pct !== undefined;
  const hasDescription = !!ing.description && ing.description.trim().length > 4;
  const hasRegulated = (ing.regulated_zones?.length ?? 0) > 0;
  const hasBreakdown = breakdown.length > 0;
  const hasOtherTranslations =
    ing.translations &&
    Object.keys(ing.translations).filter((k) => k !== "fr").length > 0;

  const jsonLd = buildIngredientJsonLd(ing);

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <script
        type="application/ld+json"
        // Escape `<` (and `>` for symmetry) so an ingredient name like
        // "Foo </script><x>" can't break out of the JSON-LD script tag.
        // Standard mitigation - JSON.stringify alone does not escape these.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
        }}
      />
      <BackgroundGlow />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <Link
            href="/comment-ca-marche"
            className="hidden rounded-full px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink sm:inline"
          >
            Comment ça marche
          </Link>
          <SearchTrigger />
          <MobileMenu />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        {/* Real back button at the very top — preferred entry point when the
            user comes from an analyse (ingredients modal). The breadcrumb
            still appears further down for navigational context, but the
            primary "leave this page" affordance is this prominent button. */}
        {fromAnalyser ? (
          <div className="mb-5">
            <BackToAnalyseButton fromUrl={fromUrl} />
          </div>
        ) : null}

        {/* Hero */}
        <Reveal delayMs={0}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-[40px] sm:leading-tight">
                  {name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 backdrop-blur-md ${RATING_CHIP[ing.color_rating]}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${RATING_DOT[ing.color_rating]}`}
                    aria-hidden
                  />
                  {RATING_LABEL[ing.color_rating]}
                </span>
              </div>
              {subtitle ? (
                <p className="mt-1.5 text-base text-ink-muted">{subtitle}</p>
              ) : null}
            </div>

            {ing.cas_number ? (
              <div className="text-right">
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
                  CAS
                </p>
                <p className="mt-0.5 font-mono text-[15px] text-ink">
                  {ing.cas_number}
                </p>
              </div>
            ) : null}
          </div>
        </Reveal>

        {/* Stats cards */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal delayMs={200}>
            <StatCard
              label="Niveau de tolérance"
              cta="En savoir plus"
              href="/comment-ca-marche"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${RATING_DOT[ing.color_rating]}`}
                  aria-hidden
                />
                <span className="text-lg font-semibold text-ink">
                  {ing.color_rating}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {RATING_LABEL[ing.color_rating]}
              </p>
            </StatCard>
          </Reveal>

          {hasPrevalence ? (
            <Reveal delayMs={350}>
              <StatCard label="Prévalence" cta="Méthodologie" href="/comment-ca-marche">
                <p className="text-2xl font-semibold tracking-tight text-ink">
                  {Number(ing.prevalence_pct).toFixed(2)}
                  <span className="ml-0.5 text-base font-medium text-ink-muted">
                    %
                  </span>
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  des cosmétiques contiennent cet ingrédient
                </p>
              </StatCard>
            </Reveal>
          ) : null}

          {hasFunctions ? (
            <Reveal delayMs={500}>
              <StatCard label="Fonctions principales">
                <ul className="space-y-0.5">
                  {ing.functions!.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-base font-medium text-ink">
                      {f.name}
                    </li>
                  ))}
                </ul>
              </StatCard>
            </Reveal>
          ) : null}

          {hasRegulated ? (
            <Reveal delayMs={650}>
              <StatCard label="Statut réglementaire">
                <p className="text-sm leading-relaxed text-ink">
                  Réglementé dans&nbsp;: {ing.regulated_zones!.join(", ")}.
                </p>
              </StatCard>
            </Reveal>
          ) : (
            <Reveal delayMs={650}>
              <StatCard label="Statut réglementaire">
                <p className="text-sm leading-relaxed text-ink">
                  Aucune restriction connue dans nos données.
                </p>
              </StatCard>
            </Reveal>
          )}
        </div>

        {/* About + Products */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal delayMs={850}>
            {hasDescription ? (
              <section>
                <SectionTitle>À savoir</SectionTitle>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">
                  {ing.description}
                </p>
              </section>
            ) : (
              <section>
                <SectionTitle>À savoir</SectionTitle>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                  {RATING_DESCRIPTION[ing.color_rating](name)}{" "}
                  <Link
                    href="/comment-ca-marche"
                    className="font-medium text-violet-700 hover:text-violet-900"
                  >
                    Comprendre la classification.
                  </Link>
                </p>
              </section>
            )}

            <ExplainIngredient slug={ing.slug} />

            {hasFunctions ? (
              <section className="mt-10 border-t border-black/[0.06] pt-8">
                <SectionTitle>Fonctions INCI</SectionTitle>
                <ul className="mt-4 space-y-2.5">
                  {ing.functions!.map((f, i) => (
                    <li
                      key={i}
                      className="rounded-2xl bg-white/60 p-3.5 ring-1 ring-white/60 backdrop-blur-md"
                    >
                      <p className="text-[15px] font-semibold text-ink">
                        {f.name}
                      </p>
                      {f.description ? (
                        <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">
                          {f.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasBreakdown ? (
              <section className="mt-10 border-t border-black/[0.06] pt-8">
                <SectionTitle>Répartition par catégorie de produit</SectionTitle>
                <ul className="mt-4 space-y-2.5">
                  {breakdown.map(([cat, val]) => {
                    const pct = val * 100;
                    return (
                      <li
                        key={cat}
                        className="flex items-center gap-3 rounded-xl bg-white/50 px-3.5 py-2 ring-1 ring-white/60 backdrop-blur-md"
                      >
                        <span className="w-44 shrink-0 truncate text-sm text-ink">
                          {cat}
                        </span>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/[0.05]">
                          <span
                            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${RATING_BAR[ing.color_rating]}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums text-ink-muted">
                          {pct.toFixed(2)}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <TechSection ing={ing} />

            {hasOtherTranslations ? (
              <section className="mt-10 border-t border-black/[0.06] pt-8">
                <SectionTitle>Autres langues</SectionTitle>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(ing.translations!)
                    .filter(([k]) => k !== "fr")
                    .map(([lang, v]) => {
                      const showLangLabel = !lang.startsWith("alt_");
                      return (
                        <li
                          key={lang}
                          className="rounded-full bg-white/60 px-3 py-1 text-sm text-ink ring-1 ring-white/60 backdrop-blur-md"
                        >
                          {showLangLabel ? (
                            <>
                              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-subtle">
                                {lang}
                              </span>{" "}
                              · {v}
                            </>
                          ) : (
                            <span>{v}</span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </section>
            ) : null}
          </Reveal>

          {/* Products column */}
          <Reveal delayMs={1000} className="lg:sticky lg:top-6 lg:self-start">
            <aside>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">
                {products.length > 0
                  ? `Présent dans ${products.length} produit${products.length > 1 ? "s" : ""}`
                  : "Produits"}
              </h2>
            </div>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/40 p-8 text-center backdrop-blur-md">
                <p className="text-sm text-ink-muted">
                  {ing.details_scraped
                    ? "Aucun produit indexé pour cet ingrédient."
                    : "Les produits seront indexés quand le pipeline aura enrichi cette fiche."}
                </p>
              </div>
            ) : (
              <>
                <ul className="space-y-2.5">
                  {visibleProducts.map((p) => (
                    <ProductRow
                      key={p.product_id}
                      product={p}
                      ratingDot={RATING_DOT[ing.color_rating]}
                    />
                  ))}
                </ul>

                {moreProductsCount > 0 ? (
                  <p className="mt-3 text-center text-[12px] text-ink-subtle">
                    +{moreProductsCount} autre{moreProductsCount > 1 ? "s" : ""} produit
                    {moreProductsCount > 1 ? "s" : ""} dans notre base
                  </p>
                ) : null}
              </>
            )}
            </aside>
          </Reveal>
        </div>

        {/* Breadcrumb at the bottom of the page (after content). The "Analyse"
            link uses the `?from=` URL when present so the user lands back on
            THEIR analysis instead of being dumped on the home page. */}
        <nav
          aria-label="Fil d'ariane"
          className="mt-10 flex items-center gap-1.5 text-[12px] text-ink-subtle"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <ChevronIcon className="h-3.5 w-3.5" />
          {fromAnalyser ? (
            <>
              <Link href={fromUrl ?? "/"} className="hover:text-ink">
                Analyse
              </Link>
              <ChevronIcon className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <span>Ingrédients</span>
              <ChevronIcon className="h-3.5 w-3.5" />
            </>
          )}
          <span className="text-ink">{name}</span>
        </nav>
      </main>

      <Footer />
    </div>
  );
}

const RATING_DESCRIPTION: Record<ColorRating, (n: string) => string> = {
  Vert: (n) =>
    `${n} ne présente pas de pénalité connue. Considéré comme sûr aux usages cosmétiques courants.`,
  Jaune: (n) =>
    `${n} présente une tolérance variable selon la concentration ou le profil cutané. Souvent réglementé en Annexe III pour limiter sa concentration. À surveiller en cas de peau sensible.`,
  Orange: (n) =>
    `${n} fait l'objet d'une pénalité moyenne. Souvent issu de la pétrochimie ou de la chimie lourde, avec un impact non négligeable sur l'environnement. Préférer des alternatives quand la formule le permet.`,
  Rouge: (n) =>
    `${n} est fortement déconseillé ou réglementé. Une controverse sérieuse existe autour de cet ingrédient - à éviter dans la mesure du possible.`,
};

function StatCard({
  label,
  cta,
  href,
  external = false,
  children,
}: {
  label: string;
  cta?: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const linkCls =
    "mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-violet-700 hover:text-violet-900";
  const showLink = Boolean(cta && href);
  return (
    <article className="flex flex-col rounded-2xl bg-white/70 p-5 shadow-[0_2px_24px_-6px_rgba(15,23,42,0.06)] ring-1 ring-white/70 backdrop-blur-xl">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
        <PinIcon className="h-3 w-3" />
        {label}
      </p>
      <div className="mt-3 flex-1">{children}</div>
      {showLink && external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
          {cta} <span aria-hidden>→</span>
        </a>
      ) : showLink ? (
        <Link href={href!} className={linkCls}>
          {cta} <span aria-hidden>→</span>
        </Link>
      ) : null}
    </article>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-ink">{children}</h2>;
}

function TechRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value || (typeof value === "string" && value.trim().length === 0)) {
    return null;
  }
  return (
    <>
      <dt className="text-ink-subtle">{label}</dt>
      <dd className={`text-ink ${mono ? "font-mono" : ""}`}>{value}</dd>
    </>
  );
}

function TechSection({ ing }: { ing: Ingredient }) {
  const rows: { label: string; value: string | null | undefined; mono?: boolean }[] = [
    { label: "Nom INCI", value: ing.name },
    { label: "CAS", value: ing.cas_number, mono: true },
    { label: "EINECS", value: ing.einecs_number, mono: true },
    { label: "Origine", value: ing.origin },
    { label: "Classification", value: ing.classification?.join(", ") },
    { label: "Français", value: ing.translations?.fr },
  ];
  const visible = rows.filter(
    (r) => r.value && (typeof r.value !== "string" || r.value.trim().length > 0),
  );
  if (visible.length === 0) return null;

  return (
    <section className="mt-10 border-t border-black/[0.06] pt-8">
      <SectionTitle>Informations techniques</SectionTitle>
      <dl className="mt-4 grid grid-cols-[140px_1fr] gap-y-2.5 text-sm sm:grid-cols-[160px_1fr]">
        {visible.map((r) => (
          <TechRow key={r.label} label={r.label} value={r.value} mono={r.mono} />
        ))}
      </dl>
    </section>
  );
}

function inferSubtitle(ing: Ingredient): string | null {
  if (ing.functions && ing.functions.length > 0) {
    return ing.functions
      .slice(0, 3)
      .map((f) => f.name)
      .join(", ");
  }
  if (ing.classification && ing.classification.length > 0) {
    return ing.classification.slice(0, 3).join(", ");
  }
  return null;
}

function prettyName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Denat\./i, "Denat.");
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 11.5L12.5 3 11 4.5l1.5 1.5-5 5L6 9.5 4.5 11l8.5 8.5L14.5 18 13 16.5l5-5L19.5 13z" />
      <line x1="3" y1="21" x2="9" y2="15" />
    </svg>
  );
}
