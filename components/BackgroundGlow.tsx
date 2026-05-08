/**
 * Soft pastel ambient glow rendered behind the page content.
 * Mirrors the violet → fuchsia → peach gradient palette of the brand.
 * Kept light enough to not interfere with content legibility.
 */
export function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Violet/fuchsia haze, top-left to top-center */}
      <div className="absolute -top-32 -left-20 h-[70vh] w-[70vw] rounded-full bg-gradient-to-br from-violet-300/45 via-fuchsia-200/35 to-pink-200/25 blur-3xl" />

      {/* Pink/peach haze, bottom-right */}
      <div className="absolute -bottom-32 -right-24 h-[65vh] w-[65vw] rounded-full bg-gradient-to-tl from-orange-200/40 via-rose-200/40 to-pink-200/30 blur-3xl" />

      {/* Lavender accent, center-left */}
      <div className="absolute top-1/3 -left-32 h-[55vh] w-[45vw] rounded-full bg-gradient-to-tr from-purple-200/35 via-violet-200/30 to-transparent blur-3xl" />

      {/* Subtle peach accent, top-right */}
      <div className="absolute -top-20 right-0 h-[45vh] w-[50vw] rounded-full bg-gradient-to-bl from-amber-100/35 via-orange-100/30 to-transparent blur-3xl" />
    </div>
  );
}
