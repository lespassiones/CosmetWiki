"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Status = {
  submitted: boolean;
  promesseCount: number;
};

const PROMESSE_PATH_RE = /^\/promesses\/[^/]+$/;

function eligibleTrigger(count: number): "first_promesse" | "fifth_promesse" | null {
  if (count === 1) return "first_promesse";
  if (count === 5) return "fifth_promesse";
  return null;
}

/**
 * Listens for the user leaving a `/promesses/[id]` result page. If they
 * haven't already submitted a feedback AND their promesse count is 1 or 5,
 * pops a 1-5 star rating modal with an optional comment.
 *
 * "Plus tard" closes silently (we'll re-attempt on the 5th promesse exit
 * if they're still at 1, or never again past 5).
 */
export function FeedbackPromptModal({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname() ?? "/";
  const prevPathRef = useRef<string>(pathname);

  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<"first_promesse" | "fifth_promesse" | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Once we know the user has submitted (in DB or via this session), we stop
  // ever fetching the status again.
  const lockedRef = useRef(false);

  const close = useCallback(() => {
    setOpen(false);
    setRating(0);
    setHoverRating(0);
    setComment("");
    setSubmitted(false);
    setError(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    // Only fire when we LEAVE a `/promesses/[id]` page (not when we land on it).
    if (!PROMESSE_PATH_RE.test(prev)) return;
    if (PROMESSE_PATH_RE.test(pathname)) return; // moving between two promesse ids — wait
    if (lockedRef.current) return;
    if (open) return;

    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/feedback/status", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { ok: boolean } & Partial<Status>;
        if (cancelled) return;
        if (!data.ok) return;
        if (data.submitted) {
          lockedRef.current = true;
          return;
        }
        const t = eligibleTrigger(data.promesseCount ?? 0);
        if (!t) return;
        setTrigger(t);
        setOpen(true);
      } catch {
        /* silent — the popup is non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, signedIn, open]);

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  async function submit() {
    if (rating < 1 || rating > 5 || !trigger) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
          triggerSource: trigger,
        }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Échec de l'envoi.");
        setSubmitting(false);
        return;
      }
      // Lock so we never re-open during this session.
      lockedRef.current = true;
      setSubmitted(true);
      setSubmitting(false);
      // Auto-close after a short confirmation.
      setTimeout(() => close(), 1400);
    } catch {
      setError("Erreur réseau.");
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-prompt-title"
      onClick={close}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-2">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6 text-emerald-600">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-ink">Merci pour ton retour !</p>
            <p className="mt-1 text-[12px] text-[#6B7280]">Ton avis nous aide à améliorer Cosme Check.</p>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-100">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[#F43F5E]">
                <path d="M12 2C6.48 2 2 6.04 2 11c0 2.5 1.13 4.74 2.93 6.32L4 22l4.84-1.5c.99.3 2.05.47 3.16.47 5.52 0 10-4.04 10-9s-4.48-9-10-9z" />
              </svg>
            </div>

            <h2 id="feedback-prompt-title" className="text-center text-[17px] font-semibold tracking-tight text-ink">
              Tu en penses quoi de Cosme Check&nbsp;?
            </h2>
            <p className="mt-1.5 text-center text-[13px] leading-relaxed text-[#6B7280]">
              Ton avis nous aide à améliorer l&apos;app. Note ton expérience en quelques secondes.
            </p>

            {/* Star rating */}
            <div className="mt-4 flex justify-center gap-1.5" role="radiogroup" aria-label="Note sur 5">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hoverRating || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onFocus={() => setHoverRating(n)}
                    onBlur={() => setHoverRating(0)}
                    onClick={() => setRating(n)}
                    className="p-1 transition active:scale-90"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-9 w-9 transition ${
                        filled ? "fill-amber-400" : "fill-[#E5E7EB]"
                      }`}
                      aria-hidden
                    >
                      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                );
              })}
            </div>

            <label htmlFor="feedback-comment" className="mt-4 block text-[12px] font-medium text-[#374151]">
              Un mot à ajouter&nbsp;? <span className="text-[#9CA3AF] font-normal">— optionnel</span>
            </label>
            <textarea
              id="feedback-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="Dis-nous ce qui pourrait être amélioré…"
              className="mt-1.5 w-full rounded-xl bg-white ring-1 ring-[#E5E7EB] px-3 py-2.5 text-[13px] outline-none transition focus:ring-2 focus:ring-rose-300"
            />
            <p className="mt-1 text-right text-[11px] text-[#9CA3AF]">{comment.length} / 1000</p>

            {error && (
              <p role="alert" className="mt-2 text-[12px] text-rose-700 bg-rose-50 ring-1 ring-rose-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-xl bg-white py-2.5 text-center text-sm font-medium text-[#6B7280] ring-1 ring-[#E5E7EB] hover:text-ink hover:ring-[#111111] transition"
              >
                Plus tard
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={rating < 1 || submitting}
                className="flex-1 rounded-xl bg-gradient-to-br from-[#F43F5E] to-[#E11D48] py-2.5 text-center text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(244,63,94,0.45)] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
