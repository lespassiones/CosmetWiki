import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { SearchBar } from "@/components/SearchBar";
import { MobileMenu } from "@/components/MobileMenu";
import { supabaseAnon, type SearchHit } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

const DOT: Record<SearchHit["color_rating"], string> = {
  Vert: "bg-emerald-500",
  Jaune: "bg-amber-400",
  Orange: "bg-orange-500",
  Rouge: "bg-rose-500",
};

async function search(q: string): Promise<SearchHit[]> {
  if (!q) return [];
  const { data, error } = await supabaseAnon().rpc("cosmetwiki_search", {
    q,
    result_limit: 50,
  });
  if (error) return [];
  return (data ?? []) as SearchHit[];
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const hits = await search(q);

  return (
    <div className="relative flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-6">
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
        </nav>
        <MobileMenu />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <div className="mb-8">
          <SearchBar size="lg" />
        </div>

        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold text-ink">
            Résultats pour <span className="text-violet-700">« {q || "—"} »</span>
          </h1>
          <p className="text-sm text-ink-muted">
            {hits.length} ingrédient{hits.length > 1 ? "s" : ""}
          </p>
        </div>

        {hits.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-black/[0.05]">
            <p className="text-base text-ink-muted">
              Aucun résultat pour <strong className="text-ink">{q}</strong>.
            </p>
            <p className="mt-2 text-sm text-ink-subtle">
              Essaie avec un nom INCI complet, une traduction, ou un numéro CAS.
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.05]">
            {hits.map((h, i) => (
              <li
                key={h.id}
                className={i > 0 ? "border-t border-black/[0.04]" : ""}
              >
                <Link
                  href={`/i/${h.slug}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-violet-50/40"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[h.color_rating]}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">
                      {prettyName(h.name)}
                    </span>
                    {h.translation_fr ? (
                      <span className="block truncate text-[13px] text-ink-muted">
                        {h.translation_fr}
                      </span>
                    ) : null}
                  </span>
                  {h.cas_number ? (
                    <span className="shrink-0 font-mono text-xs text-ink-muted">
                      {h.cas_number}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}

function prettyName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Denat\./i, "Denat.");
}
