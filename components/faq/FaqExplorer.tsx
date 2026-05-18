"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FaqCategory, FaqDot, FaqItem } from "@/app/faq/data";

type Props = {
  items: FaqItem[];
  categories: FaqCategory[];
  defaultOpenId?: string;
};

const DOT_BG: Record<FaqDot, string> = {
  vert: "bg-emerald-500",
  jaune: "bg-amber-400",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
};

const CATEGORY_ALL = "Toutes" as const;
type CategoryFilter = FaqCategory | typeof CATEGORY_ALL;

export function FaqExplorer({ items, categories, defaultOpenId }: Props) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);
  const [category, setCategory] = useState<CategoryFilter>(CATEGORY_ALL);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (category !== CATEGORY_ALL && it.category !== category) return false;
      if (!q) return true;
      return (
        it.question.toLowerCase().includes(q) ||
        it.answer.toLowerCase().includes(q)
      );
    });
  }, [items, category, query]);

  const allCategories: CategoryFilter[] = [CATEGORY_ALL, ...categories];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:gap-10">
      {/* ── Colonne principale : recherche + accordéons ──────────────────── */}
      <div>
        <SearchBar value={query} onChange={setQuery} />

        <ul className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <li className="rounded-3xl bg-white px-6 py-8 text-center text-[14px] text-ink-muted shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
              Aucune question ne correspond à ta recherche.
            </li>
          ) : (
            filtered.map((it) => (
              <FaqRow
                key={it.id}
                item={it}
                open={openId === it.id}
                onToggle={() => setOpenId(openId === it.id ? null : it.id)}
              />
            ))
          )}
        </ul>
      </div>

      {/* ── Sidebar catégories ─────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-3xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
          <h2 className="px-1 text-[15px] font-semibold text-ink">Catégories</h2>

          <div className="mt-4 flex flex-col gap-2">
            {allCategories.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`w-full rounded-2xl px-4 py-2.5 text-left text-[14px] font-medium transition-colors ${
                    active
                      ? "bg-rose-50 text-[#F43F5E] ring-1 ring-rose-100"
                      : "bg-white text-ink/80 ring-1 ring-black/[0.05] hover:bg-black/[0.02] hover:text-ink"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#F43F5E]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher une question…"
        aria-label="Rechercher une question"
        className="w-full rounded-full bg-white py-3.5 pl-14 pr-5 text-[15px] text-ink shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.05] placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-rose-200"
      />
    </div>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-3xl bg-white shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.015] sm:px-6"
      >
        <span className="flex items-center gap-3.5">
          <span
            aria-hidden
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_BG[item.dot]}`}
          />
          <span className="text-[15px] font-semibold text-ink sm:text-[16px]">
            {item.question}
          </span>
        </span>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="px-5 pb-5 pl-[42px] pr-6 sm:px-6 sm:pl-[54px]">
          <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-muted">
            {item.answer}
          </p>
          {item.learnMore ? (
            <Link
              href={item.learnMore.href}
              className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#F43F5E] hover:underline"
            >
              <span aria-hidden>→</span>
              {item.learnMore.label ?? "En savoir plus"}
            </Link>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  );
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
