"use client";

import { useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";

type AtRiskProduct = {
  name: string;
  category: string | null;
  score: number;
};

type Alternative = {
  ean: string;
  name: string | null;
  brand: string | null;
  score: number;
  score_label: string;
  score_tone: string;
  category: string | null;
};

type Suggestion = {
  product: string;
  category: string | null;
  alternative: Alternative | null;
};

type Props = {
  products: AtRiskProduct[];
};

const TONE_BADGE: Record<string, { bg: string; text: string }> = {
  green:  { bg: "bg-emerald-100", text: "text-emerald-700" },
  amber:  { bg: "bg-green-100",   text: "text-green-700" },
  orange: { bg: "bg-amber-100",   text: "text-amber-700" },
  rose:   { bg: "bg-rose-100",    text: "text-rose-700" },
};

export function CatalogAlternatives({ products }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error" | "credits">("idle");

  if (products.length === 0) return null;

  async function load() {
    setStatus("loading");
    try {
      const r = await fetch("/api/routine/catalog-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: products.slice(0, 5) }),
      });
      if (r.status === 429) {
        setStatus("credits");
        return;
      }
      if (!r.ok) {
        setStatus("error");
        return;
      }
      const d = (await r.json()) as { suggestions: Suggestion[] };
      setSuggestions((d.suggestions ?? []).filter((s) => s.alternative !== null));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const found = suggestions ?? [];

  return (
    <section className={`${GLASS_CARD} px-5 py-4`}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
        Alternatives mieux notees
      </h2>
      <p className="text-[12px] text-ink-muted mb-4">
        Pour tes produits penalisants, on cherche un remplacant mieux note dans la meme categorie.
      </p>

      {status === "idle" && (
        <button
          type="button"
          onClick={load}
          className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-white hover:bg-ink/80 transition"
        >
          Trouver des alternatives mieux notees
        </button>
      )}

      {status === "loading" && (
        <p className="text-[12px] text-ink-subtle">Recherche en cours...</p>
      )}

      {status === "credits" && (
        <p className="text-[12px] text-rose-600">
          Tu as utilise tous tes credits du jour. Reviens demain pour de nouvelles suggestions.
        </p>
      )}

      {status === "error" && (
        <p className="text-[12px] text-ink-subtle">
          Impossible de charger les alternatives pour le moment.
        </p>
      )}

      {status === "done" && found.length === 0 && (
        <p className="text-[12px] text-ink-subtle">
          Aucune alternative nettement mieux notee trouvee dans le catalogue.
        </p>
      )}

      {status === "done" && found.length > 0 && (
        <ul className="space-y-3">
          {found.map((s, i) => {
            const alt = s.alternative!;
            const badge = TONE_BADGE[alt.score_tone] ?? TONE_BADGE.orange;
            return (
              <li key={`${s.product}-${i}`}>
                <p className="text-[11px] text-ink-subtle mb-1">
                  Au lieu de <span className="font-medium text-ink">{s.product}</span>
                </p>
                <div className="flex items-center gap-3 rounded-2xl bg-white/50 ring-1 ring-black/[0.04] px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink truncate">
                      {alt.name ?? alt.ean}
                    </div>
                    {alt.brand ? (
                      <div className="text-[11px] text-ink-subtle truncate">{alt.brand}</div>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}
                  >
                    {alt.score_label}
                  </span>
                  <a
                    href={`/?ean=${encodeURIComponent(alt.ean)}`}
                    className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-ink/80 transition"
                  >
                    Scanner
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
