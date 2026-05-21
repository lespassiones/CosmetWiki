"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";
import type { IngredientFamily, RestrictedIngredient } from "@/lib/restrictions/types";
import {
  addRestrictionIngredient,
  removeRestrictionIngredient,
  saveRestrictionsFamilies,
  searchIngredientsForRestrictions,
} from "@/app/profile/restrictions/actions";

type Tab = "families" | "ingredients";

export function RestrictionsExplorer({
  initialFamilies,
  initialIngredients,
  familiesCatalogue,
}: {
  initialFamilies: string[];
  initialIngredients: RestrictedIngredient[];
  familiesCatalogue: IngredientFamily[];
}) {
  const [tab, setTab] = useState<Tab>("families");
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(
    () => new Set(initialFamilies),
  );
  const [ingredients, setIngredients] = useState<RestrictedIngredient[]>(
    initialIngredients,
  );

  return (
    <div>
      <TabsBar
        tab={tab}
        onTab={setTab}
        familiesCount={selectedFamilies.size}
        ingredientsCount={ingredients.length}
      />

      <div className="mt-5">
        {tab === "families" ? (
          <FamiliesPanel
            catalogue={familiesCatalogue}
            selected={selectedFamilies}
            setSelected={setSelectedFamilies}
          />
        ) : (
          <IngredientsPanel
            ingredients={ingredients}
            setIngredients={setIngredients}
          />
        )}
      </div>
    </div>
  );
}

function TabsBar({
  tab,
  onTab,
  familiesCount,
  ingredientsCount,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  familiesCount: number;
  ingredientsCount: number;
}) {
  return (
    <div className="rounded-full bg-black/[0.04] ring-1 ring-black/[0.05] p-1 flex">
      <TabButton
        active={tab === "families"}
        onClick={() => onTab("families")}
        label="Familles"
        count={familiesCount}
      />
      <TabButton
        active={tab === "ingredients"}
        onClick={() => onTab("ingredients")}
        label="Ingrédients"
        count={ingredientsCount}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition "
        + (active
          ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
          : "text-[#6B7280] hover:text-ink")
      }
      aria-pressed={active ? "true" : "false"}
    >
      <span>{label}</span>
      {count > 0 ? (
        <span
          className={
            "inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-[11px] font-semibold "
            + (active ? "bg-violet-600 text-white" : "bg-black/[0.08] text-[#374151]")
          }
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/* ─── Familles ─────────────────────────────────────────────────────────── */

function FamiliesPanel({
  catalogue,
  selected,
  setSelected,
}: {
  catalogue: IngredientFamily[];
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
}) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelected(next);
    setError(null);

    const arr = Array.from(next);
    startTransition(async () => {
      const res = await saveRestrictionsFamilies(arr);
      if (!res.ok) {
        setError(res.error);
        // Revert on failure so the UI stays consistent with the server.
        setSelected(selected);
      }
    });
  }

  // Active first (those with a real tag binding), then the rest. Within each
  // group, keep the table's sort_order. Helps users see what actually works.
  const sorted = useMemo(() => {
    const active = catalogue.filter((f) => f.tagSlug);
    const waiting = catalogue.filter((f) => !f.tagSlug);
    return [...active, ...waiting];
  }, [catalogue]);

  return (
    <div>
      <div className={`${GLASS_CARD} px-4 py-3.5 mb-4`}>
        <p className="text-[12.5px] text-[#6B7280] leading-relaxed">
          Active une famille pour être prévenu(e) à chaque fois qu&apos;un
          produit analysé en contient. Tu peux en activer autant que tu
          veux.
        </p>
      </div>

      {error ? (
        <div className="mb-3 rounded-2xl bg-rose-50 ring-1 ring-rose-100 px-3 py-2 text-[12.5px] text-rose-700">
          {error}
        </div>
      ) : null}

      <ul className={`${GLASS_CARD} divide-y divide-black/[0.06] overflow-hidden`}>
        {sorted.map((fam) => (
          <FamilyRow
            key={fam.slug}
            family={fam}
            on={selected.has(fam.slug)}
            onToggle={() => toggle(fam.slug)}
          />
        ))}
      </ul>
    </div>
  );
}

function FamilyRow({
  family,
  on,
  onToggle,
}: {
  family: IngredientFamily;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-start gap-3 px-4 py-3.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[14.5px] font-semibold text-ink">{family.name}</h3>
          {!family.tagSlug ? (
            <span className="inline-flex items-center rounded-full bg-amber-50 ring-1 ring-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Bientôt actif
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[12.5px] text-[#6B7280] leading-relaxed">
          {family.descriptionSimple}
        </p>
      </div>
      <Toggle on={on} onChange={onToggle} ariaLabel={`Restreindre ${family.name}`} />
    </li>
  );
}

function Toggle({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on ? "true" : "false"}
      aria-label={ariaLabel}
      onClick={onChange}
      className={
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition mt-0.5 "
        + (on
          ? "bg-violet-500 ring-1 ring-violet-600"
          : "bg-black/[0.12] ring-1 ring-black/[0.06]")
      }
    >
      <span
        aria-hidden
        className={
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition "
          + (on ? "translate-x-6" : "translate-x-1")
        }
      />
    </button>
  );
}

/* ─── Ingrédients ──────────────────────────────────────────────────────── */

type SearchResult = { slug: string; name: string; colorRating: string | null };

function IngredientsPanel({
  ingredients,
  setIngredients,
}: {
  ingredients: RestrictedIngredient[];
  setIngredients: (v: RestrictedIngredient[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChangeQuery(value: string) {
    setQuery(value);
    setError(null);

    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debouncedRef.current = setTimeout(async () => {
      try {
        const res = await searchIngredientsForRestrictions(value);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
  }

  async function addIngredient(r: SearchResult) {
    if (ingredients.some((i) => i.slug === r.slug)) return;
    const optimistic = [...ingredients, { slug: r.slug, name: r.name }];
    setIngredients(optimistic);
    setQuery("");
    setResults([]);
    const res = await addRestrictionIngredient({ slug: r.slug, name: r.name });
    if (!res.ok) {
      setError(res.error);
      setIngredients(ingredients);
    }
  }

  async function removeIngredient(slug: string) {
    const previous = ingredients;
    setIngredients(ingredients.filter((i) => i.slug !== slug));
    const res = await removeRestrictionIngredient(slug);
    if (!res.ok) {
      setError(res.error);
      setIngredients(previous);
    }
  }

  const filteredResults = useMemo(
    () => results.filter((r) => !ingredients.some((i) => i.slug === r.slug)),
    [results, ingredients],
  );

  return (
    <div>
      <div className="relative mb-3">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
        <input
          type="search"
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          placeholder="Rechercher un ingrédient…"
          className="w-full rounded-2xl bg-white/85 ring-1 ring-black/[0.06] pl-10 pr-4 py-3 text-[14px] text-ink placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-violet-400/60 transition"
          aria-label="Rechercher un ingrédient à restreindre"
        />
      </div>

      {error ? (
        <div className="mb-3 rounded-2xl bg-rose-50 ring-1 ring-rose-100 px-3 py-2 text-[12.5px] text-rose-700">
          {error}
        </div>
      ) : null}

      {query.trim().length >= 2 ? (
        <div className={`${GLASS_CARD} overflow-hidden mb-4`}>
          {loading ? (
            <p className="px-4 py-3 text-[13px] text-[#6B7280]">Recherche…</p>
          ) : filteredResults.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-[#6B7280]">
              Aucun ingrédient ne correspond à <strong>{query}</strong>.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {filteredResults.map((r) => (
                <li key={r.slug} className="flex items-center gap-3 px-4 py-3">
                  <ColorDot color={r.colorRating} />
                  <span className="flex-1 text-[13.5px] font-medium text-ink truncate">
                    {r.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => addIngredient(r)}
                    className="rounded-full bg-violet-500 px-3 py-1 text-[12px] font-semibold text-white hover:bg-violet-600 transition"
                  >
                    + Ajouter
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div>
        <h3 className="text-[12px] uppercase tracking-wide text-[#6B7280] font-semibold mb-2">
          Ingrédients restreints
          {ingredients.length > 0 ? (
            <span className="ml-1.5 text-[#9CA3AF] normal-case font-normal">
              ({ingredients.length})
            </span>
          ) : null}
        </h3>
        {ingredients.length === 0 ? (
          <div className={`${GLASS_CARD} px-4 py-4`}>
            <p className="text-[12.5px] text-[#6B7280] leading-relaxed">
              Aucun ingrédient ajouté pour le moment. Utilise la recherche
              ci-dessus pour en ajouter.
            </p>
          </div>
        ) : (
          <ul className={`${GLASS_CARD} divide-y divide-black/[0.06] overflow-hidden`}>
            {ingredients.map((i) => (
              <li key={i.slug} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 text-[13.5px] font-medium text-ink truncate">
                  {i.name}
                </span>
                <Toggle
                  on={true}
                  onChange={() => removeIngredient(i.slug)}
                  ariaLabel={`Retirer ${i.name} des restrictions`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ColorDot({ color }: { color: string | null }) {
  const cls =
    color === "Vert"
      ? "bg-emerald-400"
      : color === "Jaune"
        ? "bg-yellow-400"
        : color === "Orange"
          ? "bg-orange-400"
          : color === "Rouge"
            ? "bg-rose-500"
            : "bg-gray-300";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} aria-hidden />;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
