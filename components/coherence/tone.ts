import type { CoherenceVerdict } from "@/lib/coherence/types";

/**
 * Visual tone for each verdict — kept in one place so all coherence
 * components stay consistent. Aligned with the project's existing rating
 * palette (emerald / amber / orange / rose).
 */
export const VERDICT_TONE: Record<
  CoherenceVerdict,
  {
    label: string;
    /** Solid background swatch (used for dots / fills). */
    bg: string;
    /** Soft pastel background for pills. */
    bgSoft: string;
    /** Ring colour for soft pills. */
    ringSoft: string;
    /** Foreground text colour. */
    text: string;
    /** Hex value for SVG (donut, bar gradients, etc.). */
    hex: string;
  }
> = {
  tenue: {
    label: "Tenue",
    bg: "bg-emerald-500",
    bgSoft: "bg-emerald-50",
    ringSoft: "ring-emerald-200",
    text: "text-emerald-700",
    hex: "#10B981",
  },
  partielle: {
    label: "Partielle",
    bg: "bg-amber-400",
    bgSoft: "bg-amber-50",
    ringSoft: "ring-amber-200",
    text: "text-amber-700",
    hex: "#FBBF24",
  },
  marketing: {
    label: "Marketing",
    bg: "bg-orange-400",
    bgSoft: "bg-orange-50",
    ringSoft: "ring-orange-200",
    text: "text-orange-700",
    hex: "#FB923C",
  },
  non_demontree: {
    label: "Non démontré",
    bg: "bg-rose-500",
    bgSoft: "bg-rose-50",
    ringSoft: "ring-rose-200",
    text: "text-rose-700",
    hex: "#F43F5E",
  },
  // Deeper red than non_demontree — this is "the formula actively contradicts
  // the absence claim", which is a much stronger negative signal than "we
  // couldn't find a documented active". Different hue so the two never blur.
  contredite: {
    label: "Contredite",
    bg: "bg-red-600",
    bgSoft: "bg-red-50",
    ringSoft: "ring-red-300",
    text: "text-red-800",
    hex: "#DC2626",
  },
};

/** Friendly French label for the unverifiable claim "reason" enum. */
export const UNVERIFIABLE_REASON_LABEL: Record<string, string> = {
  composition: "composition",
  certification: "certification",
  sensoriel: "sensoriel",
  marketing_general: "marketing général",
  autre: "autre",
};
