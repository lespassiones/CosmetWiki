"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchHit } from "@/lib/supabase";

type Props = {
  autoFocus?: boolean;
  placeholder?: string;
  size?: "lg" | "md";
};

export function SearchBar({
  autoFocus = false,
  placeholder = "Ex : Glycerin, Phenoxyethanol, 122-99-6…",
  size = "lg",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hpField, setHpField] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const listboxId = useId();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }
    // If the user pasted a list (multiple ingredients separated), don't query autocomplete.
    if (looksLikeIngredientList(trimmed)) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const t = setTimeout(async () => {
      try {
        const url = `/api/search?q=${encodeURIComponent(trimmed)}${
          hpField ? `&hp=${encodeURIComponent(hpField)}` : ""
        }`;
        const r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) {
          setResults([]);
          setIsOpen(false);
          return;
        }
        const data = (await r.json()) as { hits: SearchHit[] };
        setResults(data.hits ?? []);
        setIsOpen(true);
        setHighlight(0);
      } catch (err) {
        if ((err as DOMException).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, hpField]);

  const wrapperBase =
    size === "lg"
      ? "h-16 rounded-full pl-6 pr-5"
      : "h-12 rounded-full pl-4 pr-4";
  const inputCls =
    size === "lg" ? "text-lg" : "text-sm";
  const iconSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  function go(hit: SearchHit) {
    router.push(`/i/${hit.slug}`);
    setIsOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
      setIsOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = query.trim();
      // List → analyse it
      if (looksLikeIngredientList(trimmed)) {
        const blob = encodeURIComponent(trimmed.slice(0, 6000));
        router.push(`/analyser?inci=${blob}`);
        setIsOpen(false);
        return;
      }
      if (results[highlight]) go(results[highlight]);
      else if (trimmed) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  const hasResults = results.length > 0;
  const isList = looksLikeIngredientList(query);
  const showDropdown = !isList && isOpen && (hasResults || (query.trim().length > 0 && !loading));

  return (
    <div className="relative w-full">
      {/* honeypot */}
      <input
        type="text"
        name="email_confirm"
        autoComplete="off"
        tabIndex={-1}
        value={hpField}
        onChange={(e) => setHpField(e.target.value)}
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
      />

      <div
        className={`relative flex w-full items-center bg-white ${wrapperBase} transition-all duration-200 ${
          focused
            ? "ring-2 ring-violet-200 shadow-[0_18px_50px_-12px_rgba(139,92,246,0.28),0_8px_24px_-6px_rgba(15,23,42,0.10)]"
            : "ring-1 ring-black/[0.06] shadow-[0_14px_40px_-12px_rgba(15,23,42,0.16),0_4px_18px_-4px_rgba(15,23,42,0.08)]"
        }`}
      >
        <SearchIcon className={`shrink-0 text-ink-subtle ${iconSize}`} />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown ? "true" : "false"}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (results.length > 0) setIsOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setIsOpen(false), 150);
          }}
          onKeyDown={onKeyDown}
          className={`ml-3 w-full bg-transparent ${inputCls} font-normal text-ink placeholder:text-ink-subtle outline-none`}
        />
        {isList ? (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              const blob = encodeURIComponent(query.trim().slice(0, 6000));
              router.push(`/analyser?inci=${blob}`);
            }}
            className="ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-violet-600 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(139,92,246,0.6)] transition-all hover:bg-violet-700 hover:shadow-[0_8px_22px_-6px_rgba(139,92,246,0.7)]"
          >
            Analyser
            <span aria-hidden>→</span>
          </button>
        ) : loading ? (
          <Spinner className={`ml-2 shrink-0 text-ink-subtle ${iconSize}`} />
        ) : query ? (
          <button
            type="button"
            aria-label="Effacer"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              inputRef.current?.focus();
            }}
            className="ml-2 grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-subtle hover:bg-black/[0.04] hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-3xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.04] animate-fade-in">
          {hasResults ? (
            <>
              <ul
                id={listboxId}
                role="listbox"
                className="max-h-[60vh] overflow-y-auto scrollbar-soft"
              >
                {results.map((hit, idx) => (
                  <li
                    key={hit.id}
                    role="option"
                    aria-selected={idx === highlight ? "true" : "false"}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(hit);
                    }}
                    className={`flex w-full cursor-pointer items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                      idx === highlight ? "bg-violet-50/60" : "hover:bg-black/[0.02]"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor(hit.color_rating)}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">
                        <Highlight text={prettyName(hit.name)} q={query} />
                      </span>
                      {hit.translation_fr ? (
                        <span className="block truncate text-[13px] text-ink-muted">
                          {hit.translation_fr}
                        </span>
                      ) : null}
                    </span>
                    {hit.cas_number ? (
                      <span className="shrink-0 font-mono text-xs text-ink-muted">
                        {hit.cas_number}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="border-t border-black/[0.05]">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm font-medium text-violet-700 hover:bg-violet-50/60"
                >
                  Voir tous les résultats pour « {query.trim()} »
                  <span aria-hidden>→</span>
                </button>
              </div>
            </>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">
              Aucun ingrédient trouvé pour <span className="font-semibold text-ink">{query}</span>.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Heuristic: does this look like a pasted INCI list rather than a single ingredient?
 * Conditions (any of):
 *   - 2+ commas
 *   - line breaks
 *   - more than ~50 characters (likely several names)
 *   - 3+ separators (semicolons, dashes between words)
 */
export function looksLikeIngredientList(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (/\n/.test(trimmed)) return true;
  const commaCount = (trimmed.match(/,/g) || []).length;
  if (commaCount >= 2) return true;
  if (commaCount === 1 && trimmed.length > 30) return true;
  // Lots of bullet-style separators
  const sepCount = (trimmed.match(/[;•·]| - /g) || []).length;
  if (sepCount >= 2) return true;
  return false;
}

function dotColor(rating: SearchHit["color_rating"]): string {
  switch (rating) {
    case "Vert":
      return "bg-emerald-500";
    case "Jaune":
      return "bg-amber-400";
    case "Orange":
      return "bg-orange-500";
    case "Rouge":
      return "bg-rose-500";
  }
}

function prettyName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Denat\./i, "Denat.");
}

function Highlight({ text, q }: { text: string; q: string }) {
  const norm = q.trim().toLowerCase();
  if (!norm) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(norm);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-semibold text-violet-700">
        {text.slice(idx, idx + norm.length)}
      </mark>
      {text.slice(idx + norm.length)}
    </>
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
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`${className ?? ""} animate-spin`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
