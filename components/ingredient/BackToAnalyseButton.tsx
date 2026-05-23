"use client";

import { useRouter } from "next/navigation";

/**
 * Real "Retour" back button shown at the top of an ingredient detail page
 * when the user came from an analysis. Uses `router.back()` so it lands on
 * the EXACT analyse the user clicked from — be it `/analyse?inci=…`,
 * `/history/[id]`, or any other page — with the ingredients modal restored
 * (the analyse panel persists its UI flags in sessionStorage so a back-nav
 * re-opens the modal automatically).
 *
 * Falls back to the source URL passed via `?from=<url>` when there is no
 * history (e.g. the user opened the ingredient page via a shared link in a
 * new tab), and ultimately to `/` if neither is available.
 */
export function BackToAnalyseButton({ fromUrl }: { fromUrl?: string | null }) {
  const router = useRouter();

  function onClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    if (fromUrl) {
      router.push(fromUrl);
      return;
    }
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retour à la page précédente"
      className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-[13px] font-semibold text-ink ring-1 ring-black/[0.08] shadow-[0_4px_14px_-4px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md transition hover:bg-white hover:ring-black/20"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      Retour
    </button>
  );
}
