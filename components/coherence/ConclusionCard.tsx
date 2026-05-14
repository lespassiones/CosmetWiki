/**
 * Light-blue pastel card with the LLM-written conclusion sentence.
 *
 * The card uses `h-full + flex flex-col + justify-center` so when its grid
 * sibling (the coherence table) is taller, the conclusion stretches to match
 * AND its text stays vertically centred — no sad ghost space at the bottom.
 *
 * The text size scales by conclusion length so a short conclusion fills more
 * of the card visually. We can't measure the sibling card from here without
 * JS, but matching the conclusion's *type size* to its character count is a
 * cheap proxy that works well in practice.
 */
export function ConclusionCard({ conclusion }: { conclusion: string }) {
  if (!conclusion) return null;

  const len = conclusion.length;
  // Short → big & airy ; medium → comfortable ; long → compact.
  const textCls
    = len < 180 ? "text-[16px] lg:text-[18px] leading-[1.6]"
    : len < 320 ? "text-[14px] lg:text-[15px] leading-[1.65]"
    : "text-[13px] lg:text-[14px] leading-[1.6]";

  return (
    <article className="h-full rounded-2xl bg-sky-50/70 ring-1 ring-sky-100 p-5 lg:p-6 flex flex-col">
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
      <div className="flex-1 flex flex-col justify-center">
        <p className={`text-ink ${textCls}`}>{conclusion}</p>
      </div>
    </article>
  );
}
