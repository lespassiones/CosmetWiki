/**
 * Light-blue pastel card with the LLM-written conclusion sentence.
 *
 * Sized to its content (no stretching). Its grid parent uses items-center
 * so the card sits at the vertical centre of the table column — visually
 * floating in the middle of the dense table, never inflating to match.
 *
 * Icon + label sit on top of the body text (stacked) — chosen by the user
 * over a side-by-side layout because it gives the body text full width.
 */
export function ConclusionCard({ conclusion }: { conclusion: string }) {
  if (!conclusion) return null;
  return (
    <article className="rounded-2xl bg-sky-50/70 ring-1 ring-sky-100 p-5 lg:p-6">
      <div className="flex items-center gap-2.5 mb-3">
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white ring-1 ring-sky-100 text-sky-500"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5.9 1.2.9 2v.3h6.2v-.3c0-.8.3-1.5.9-2A7 7 0 0 0 12 2Z" />
          </svg>
        </span>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Conclusion
        </div>
      </div>
      <p className="text-[14px] leading-relaxed text-ink">{conclusion}</p>
    </article>
  );
}
