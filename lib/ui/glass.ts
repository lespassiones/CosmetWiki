/**
 * Shared liquid-glass / pill design tokens.
 *
 * The app's visual vocabulary: translucent white surfaces sitting on top of
 * the pastel `BackgroundGlow` orbs, with a soft outer drop shadow, a thin
 * white ring, and an inner top highlight that fakes a curved reflection.
 *
 * Compose these as tailwind class strings - append your own spacing/sizing
 * utilities (`p-5`, `mt-4`, etc.) at the call site.
 */

/** Big surface - dashboard cards, panels, modal containers. */
export const GLASS_CARD =
  "rounded-3xl bg-white/70 ring-1 ring-black/[0.06] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_10px_-2px_rgba(15,23,42,0.08),0_32px_64px_-16px_rgba(15,23,42,0.30),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.04)]";

/** Append to GLASS_CARD when the surface is interactive (Link/button). */
export const GLASS_CARD_HOVER =
  "hover:bg-white/80 hover:shadow-[0_6px_14px_-2px_rgba(15,23,42,0.10),0_38px_72px_-18px_rgba(15,23,42,0.34),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.05)] transition";

/**
 * Pill-shaped list card - softer corners (closer to a pill), translucent
 * white, double drop shadow for a clear neumorphic lift, white ring + inner
 * top highlight. Best for list rows (history, coherence analyses, routine
 * products) where each row should feel "floating" rather than embedded.
 */
export const GLASS_PILL_CARD =
  "rounded-[28px] bg-white/80 ring-1 ring-white/80 backdrop-blur-xl backdrop-saturate-150 shadow-[0_18px_38px_-14px_rgba(15,23,42,0.18),0_4px_10px_-2px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.04)]";

/** Hover counterpart of GLASS_PILL_CARD - lifts the shadow further so the
 *  row visibly rises on hover/active. */
export const GLASS_PILL_CARD_HOVER =
  "hover:bg-white/90 hover:shadow-[0_24px_48px_-14px_rgba(15,23,42,0.22),0_6px_14px_-2px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.05)] transition";

/** Smaller pill - chips, mini-buttons, secondary actions. */
export const GLASS_PILL =
  "rounded-full bg-white/65 ring-1 ring-white/80 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_22px_-8px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white/85 transition";

/** Dark glass - for the primary CTA or accent panels (advisor, hero buttons). */
export const GLASS_CARD_DARK =
  "rounded-3xl bg-gradient-to-br from-[#1F2937] via-[#111111] to-[#0A0A0A] text-white ring-1 ring-white/[0.08] shadow-[0_22px_56px_-18px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(0,0,0,0.30)] hover:brightness-110 transition";

/** Dark pill - for primary buttons (e.g. "Analyser un produit"). */
export const GLASS_PILL_DARK =
  "rounded-full bg-gradient-to-br from-[#1F2937] via-[#111111] to-[#0A0A0A] text-white ring-1 ring-white/[0.08] shadow-[0_14px_30px_-12px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(0,0,0,0.30)] hover:brightness-110 transition";

/** Tinted glass surfaces - keep the same vocabulary for status/info cards. */
export const GLASS_CARD_ROSE =
  "rounded-3xl bg-gradient-to-br from-[#FFE4E6]/85 to-[#FFF1F2]/75 ring-1 ring-white/70 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_18px_48px_-16px_rgba(244,63,94,0.18),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(15,23,42,0.04)]";

export const GLASS_CARD_AMBER =
  "rounded-3xl bg-gradient-to-br from-amber-100/80 to-amber-50/70 ring-1 ring-amber-200/70 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_18px_48px_-16px_rgba(202,138,4,0.18),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(15,23,42,0.04)]";

export const GLASS_CARD_EMERALD =
  "rounded-3xl bg-gradient-to-br from-emerald-100/80 to-emerald-50/70 ring-1 ring-emerald-200/70 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_18px_48px_-16px_rgba(5,150,105,0.18),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(15,23,42,0.04)]";

export const GLASS_CARD_ORANGE =
  "rounded-3xl bg-gradient-to-br from-orange-100/80 to-orange-50/70 ring-1 ring-orange-200/70 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_18px_48px_-16px_rgba(234,88,12,0.18),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(15,23,42,0.04)]";

export const GLASS_CARD_VIOLET =
  "rounded-3xl bg-gradient-to-br from-violet-100/80 to-violet-50/70 ring-1 ring-violet-200/70 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_10px_-2px_rgba(124,58,237,0.10),0_28px_60px_-16px_rgba(124,58,237,0.30),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(15,23,42,0.04)]";
