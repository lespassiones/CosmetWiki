"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchHit } from "@/lib/supabase";
import { ProcessingOverlay, randomProcessingTotal } from "./ProcessingOverlay";

type Props = {
  autoFocus?: boolean;
  placeholder?: string;
  size?: "lg" | "md";
  /**
   * Optional callback invoked when the user submits a multi-ingredient list.
   * When provided, the SearchBar does NOT navigate away - the parent owns the
   * processing overlay and the result rendering. This is what HomeShell uses
   * to keep the analyse on the home page.
   */
  onAnalyseList?: (text: string) => void | Promise<void>;
  /**
   * Force "list mode" : tout texte saisi ou collé est traité comme une INCI
   * et routé vers /api/analyser, sans passer par l'autocomplete d'ingrédient
   * unique. Utilisé dans la modal "Coller INCI" où l'intention de l'utilisateur
   * est sans ambiguïté — le backend gère ensuite n'importe quel format
   * (commas, slashes, all-caps, OCR, sans séparateurs…) via parseInciWithAI
   * et splitInciWithGpt.
   */
  alwaysAsList?: boolean;
};

const TEXTAREA_MIN_PX = 28;   // single-line height
const TEXTAREA_MAX_PX = 280;  // before internal scroll kicks in

export function SearchBar({
  autoFocus = false,
  placeholder = "Ex : Glycerin, Phenoxyethanol, 122-99-6…",
  size = "lg",
  onAnalyseList,
  alwaysAsList = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hpField, setHpField] = useState("");
  const [focused, setFocused] = useState(false);
  const [processing, setProcessing] = useState<{ active: boolean; budget: number }>({
    active: false,
    budget: 0,
  });
  /**
   * Sticky "list mode" flag set whenever the user pastes content that's clearly
   * more than a single ingredient (≥ 3 words or > 30 chars). It bypasses the
   * regex heuristic so weird formats (no separators, spaces-only, unusual
   * punctuation) still route to the AI parser instead of the autocomplete.
   * Resets when the user clears the field or shrinks it back to a short
   * single-word search.
   */
  const [pastedAsList, setPastedAsList] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const listboxId = useId();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Auto-resize the textarea : grow up to TEXTAREA_MAX_PX, then internal scroll
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, TEXTAREA_MIN_PX), TEXTAREA_MAX_PX);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > TEXTAREA_MAX_PX ? "auto" : "hidden";
  }, [query]);

  // Drop the sticky paste-list flag when the user clears the field, or when
  // they shrink it back to a short single-word search (so autocomplete kicks
  // back in for normal one-ingredient queries).
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setPastedAsList(false);
    } else if (pastedAsList && trimmed.length < 15 && !/\s/.test(trimmed)) {
      setPastedAsList(false);
    }
  }, [query, pastedAsList]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }
    if (alwaysAsList || pastedAsList || looksLikeIngredientList(trimmed)) {
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
      ? "min-h-[52px] rounded-[22px] pl-4 pr-3 py-2.5 sm:min-h-[64px] sm:rounded-[28px] sm:pl-6 sm:pr-5 sm:py-3"
      : "min-h-[44px] rounded-[20px] pl-3 pr-3 py-2 sm:min-h-[48px] sm:rounded-[24px] sm:pl-4 sm:pr-4";
  const inputCls =
    size === "lg" ? "text-[14px] sm:text-lg" : "text-[13px] sm:text-sm";
  const iconSize = size === "lg" ? "h-4 w-4 sm:h-5 sm:w-5" : "h-4 w-4";

  function startProcessingThen(action: () => void) {
    const budget = randomProcessingTotal();
    setProcessing({ active: true, budget });
    setIsOpen(false);
    setTimeout(() => {
      setProcessing({ active: false, budget: 0 });
      action();
    }, budget);
  }

  function go(hit: SearchHit) {
    startProcessingThen(() => router.push(`/i/${hit.slug}`));
  }

  function submitList(trimmed: string) {
    if (onAnalyseList) {
      // Parent (HomeShell) owns the overlay + result rendering - clear
      // the query and hand off.
      void onAnalyseList(trimmed);
      setQuery("");
      setIsOpen(false);
    } else {
      // Outside the home shell : send the list to the home page, which owns
      // the analyser flow. No local overlay - HomeShell will show its own
      // once mounted, so we avoid playing the animation twice.
      const blob = encodeURIComponent(trimmed.slice(0, 6000));
      setIsOpen(false);
      router.push(`/?inci=${blob}`);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    // Force list mode for any paste that's clearly more than a single
    // ingredient token. The AI parser in /api/analyser then handles the format
    // (commas, periods, no separator, OCR noise, etc.) without us having to
    // guess up-front. We don't preventDefault - the textarea still receives
    // the pasted text normally.
    const pasted = e.clipboardData.getData("text") ?? "";
    const wordCount = pasted.trim().split(/\s+/).filter(Boolean).length;
    if (pasted.length > 30 || wordCount >= 3) {
      setPastedAsList(true);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Shift+Enter / Alt+Enter inserts a newline (default behaviour)
    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      const trimmed = query.trim();
      if (alwaysAsList || pastedAsList || looksLikeIngredientList(trimmed)) {
        submitList(trimmed);
        return;
      }
      if (results[highlight]) go(results[highlight]);
      else if (trimmed) {
        startProcessingThen(() =>
          router.push(`/search?q=${encodeURIComponent(trimmed)}`),
        );
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
      setIsOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  const hasResults = results.length > 0;
  const isList = alwaysAsList || pastedAsList || looksLikeIngredientList(query);
  const showDropdown =
    !isList && isOpen && (hasResults || (query.trim().length > 0 && !loading));

  return (
    <div className="relative w-full">
      {processing.active ? (
        <ProcessingOverlay
          totalMs={processing.budget}
          headline={
            isList ? "On décode la composition…" : "On cherche dans la base…"
          }
        />
      ) : null}

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
        className={`relative bg-white ${wrapperBase} transition-all duration-200 ${
          focused
            ? "ring-2 ring-black/[0.18] shadow-[0_18px_50px_-12px_rgba(15,23,42,0.14),0_8px_24px_-6px_rgba(15,23,42,0.10)]"
            : "ring-1 ring-black/[0.06] shadow-[0_14px_40px_-12px_rgba(15,23,42,0.16),0_4px_18px_-4px_rgba(15,23,42,0.08)]"
        } ${isList ? "" : "flex w-full items-start gap-3"}`}
      >
        {/* In list mode the textarea uses the WHOLE width (icon + field on one
            row, action button on a row below) so a long INCI list doesn't
            squeeze itself into the left half of the card. In single-ingredient
            search mode we keep the compact horizontal layout with the spinner
            / clear button inline on the right. */}
        <div className={isList ? "flex items-start gap-3" : "contents"}>
          <SearchIcon
            className={`mt-1 shrink-0 text-ink-subtle ${iconSize}`}
          />
          <textarea
            ref={inputRef}
            rows={1}
            aria-label="Recherche d'ingrédient ou d'une liste INCI"
            aria-controls={listboxId}
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
            onPaste={onPaste}
            maxLength={6000}
            className={`flex-1 resize-none bg-transparent ${inputCls} font-normal leading-6 text-ink placeholder:text-ink-subtle outline-none scrollbar-soft sm:leading-7`}
          />

          {!isList && (
            <div className="flex shrink-0 items-center gap-1 self-start pt-0.5">
              {loading ? (
                <Spinner className={`text-ink-subtle ${iconSize}`} />
              ) : query ? (
                <button
                  type="button"
                  aria-label="Effacer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full text-ink-subtle hover:bg-black/[0.04] hover:text-ink"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          )}
        </div>

        {isList && (
          <div className="mt-2.5 flex items-center justify-end gap-2">
            {query ? (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-subtle transition hover:bg-black/[0.04] hover:text-ink"
              >
                Effacer
              </button>
            ) : null}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                submitList(query.trim());
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(244,63,94,0.6)] transition-all hover:bg-rose-700 hover:shadow-[0_8px_22px_-6px_rgba(244,63,94,0.7)]"
            >
              Analyser
              <span aria-hidden>→</span>
            </button>
          </div>
        )}
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-3xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.04] animate-fade-in">
          {hasResults ? (
            <>
              <ul
                id={listboxId}
                role="listbox"
                aria-label="Suggestions d'ingrédients"
                className="max-h-[60vh] overflow-y-auto scrollbar-soft"
              >
                {results.map((hit, idx) => (
                  <li
                    key={hit.id}
                    role="option"
                    aria-selected={idx === highlight}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(hit);
                    }}
                    className={`flex w-full cursor-pointer items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                      idx === highlight ? "bg-rose-50/60" : "hover:bg-black/[0.02]"
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
                    startProcessingThen(() =>
                      router.push(`/search?q=${encodeURIComponent(query.trim())}`),
                    );
                  }}
                  className="flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm font-medium text-rose-700 hover:bg-rose-50/60"
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
 *   - 2+ commas
 *   - line breaks
 *   - long single-comma string
 *   - several semicolons / bullets
 *   - several "period + capital" patterns (some labels use periods as separators,
 *     ex: "AQUA. GLYCERIN. PROPANEDIOL.")
 */
export function looksLikeIngredientList(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (/\n/.test(trimmed)) return true;
  const commaCount = (trimmed.match(/,/g) || []).length;
  if (commaCount >= 2) return true;
  if (commaCount === 1 && trimmed.length > 30) return true;
  const sepCount = (trimmed.match(/[;•·]| - /g) || []).length;
  if (sepCount >= 2) return true;
  // Period-separator format: count "<letter or ')'>. <capital>" occurrences.
  // Two or more = the user pasted a list using periods (mirrors the parser).
  const periodSepCount = (trimmed.match(/[A-Za-z)]\.\s+[A-Z]/g) || []).length;
  if (periodSepCount >= 2) return true;
  // Format "tout en majuscules sans virgule" : typique d'un texte OCR ou
  // recopié d'une étiquette physique. Ex : "AQUA / WATER / EAU DIMETHICONE
  // CETEARYL ALCOHOL PHENOXYETHANOL...". On détecte par : longueur > 60 ET
  // >= 5 mots en MAJUSCULES de 4+ lettres. Le parser côté API utilise GPT
  // pour splitter ce format en ingrédients individuels.
  const uppercaseWords = (trimmed.match(/\b[A-Z][A-Z0-9-]{3,}\b/g) || []).length;
  if (trimmed.length > 60 && uppercaseWords >= 5) return true;
  // Format multilingue typique INCI "AQUA / WATER / EAU" : 3+ slashes dans
  // un texte d'au moins 30 chars = quasi certainement une liste.
  const slashCount = (trimmed.match(/\//g) || []).length;
  if (slashCount >= 3 && trimmed.length > 30) return true;
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
      <mark className="bg-transparent font-semibold text-rose-700">
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
