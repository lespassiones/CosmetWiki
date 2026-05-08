/**
 * Soft pastel orbs in the background, behind the page content.
 * Two main blobs (violet on the left, peach on the right) framing the search
 * area, plus a tiny lavender accent in the corner. Kept soft with `blur-3xl`
 * and low opacities so they don't fight with the foreground.
 */
export function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Violet/fuchsia orb — left half, behind the search bar */}
      <div className="absolute top-[15%] left-[-12%] h-[60vh] w-[55vw] rounded-full bg-gradient-to-br from-violet-300/55 via-fuchsia-200/40 to-pink-200/20 blur-3xl" />

      {/* Peach/rose orb — right half, behind the search bar */}
      <div className="absolute top-[18%] right-[-12%] h-[55vh] w-[55vw] rounded-full bg-gradient-to-bl from-orange-200/50 via-rose-200/40 to-pink-200/25 blur-3xl" />

      {/* Tiny lavender breathing accent — bottom-left, very subtle */}
      <div className="absolute bottom-[5%] left-[10%] h-[30vh] w-[30vw] rounded-full bg-gradient-to-tr from-purple-200/30 via-violet-100/20 to-transparent blur-3xl" />
    </div>
  );
}
