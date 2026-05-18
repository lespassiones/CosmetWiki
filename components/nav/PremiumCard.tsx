import Link from "next/link";
import { DiamondIcon } from "./NavIcons";

/**
 * Pinky Premium upsell card - used in both the desktop sidebar and the mobile
 * burger drawer, slotted just above the Profil entry. Always links to
 * `/offre` so we have one entry point for the upsell.
 *
 * Hidden on the /offre page itself (no use trying to convert someone who's
 * already there) - the parent renders it conditionally based on pathname.
 */
export function PremiumCard() {
  return (
    <Link
      href="/offre"
      className="group block rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100/80 ring-1 ring-rose-200/70 p-4 transition hover:from-rose-100 hover:to-pink-100"
    >
      <div className="flex items-center gap-2 mb-1">
        <DiamondIcon className="h-4 w-4 text-[#F43F5E]" />
        <span className="text-[13px] font-bold text-[#F43F5E]">Passez Premium</span>
      </div>
      <p className="text-[11px] text-[#9F1239]/80 leading-snug">
        Analyses illimitées et fonctionnalités avancées.
      </p>
      <span
        className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-500 px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_6px_14px_-4px_rgba(244,63,94,0.45),inset_0_1px_0_rgba(255,255,255,0.30)] transition group-hover:brightness-110"
      >
        Découvrir
      </span>
    </Link>
  );
}
