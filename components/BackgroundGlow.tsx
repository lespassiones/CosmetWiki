/**
 * Soft pastel orbs in the background, behind the page content.
 * Requires the closest positioned ancestor to be a stacking context (use
 * `relative isolate` on the page wrapper) so `-z-10` can paint above the
 * wrapper's solid background.
 */
export function BackgroundGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(100vh,900px)] overflow-hidden"
    >
      {/* Violet/fuchsia orb - left half, behind the search bar */}
      <div className="absolute top-[6%] left-[-8%] h-[60vh] w-[55vw] rounded-full bg-gradient-to-br from-violet-200/35 via-fuchsia-100/25 to-pink-100/15 blur-3xl" />

      {/* Peach/rose orb - right half, behind the search bar */}
      <div className="absolute top-[10%] right-[-8%] h-[55vh] w-[55vw] rounded-full bg-gradient-to-bl from-orange-100/35 via-rose-100/25 to-pink-100/15 blur-3xl" />

      {/* Tiny lavender breathing accent - bottom-left, subtle */}
      <div className="absolute bottom-[-10%] left-[8%] h-[30vh] w-[30vw] rounded-full bg-gradient-to-tr from-purple-100/20 via-violet-50/12 to-transparent blur-3xl" />
    </div>
  );
}
