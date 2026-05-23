import type { ReactNode } from "react";
import {
  blobPath,
  ringSectorPath,
  straightRadialEdge,
  wavyRadialEdge,
} from "@/lib/blob/path";

export type BlobCounts = {
  vert: number;
  jaune: number;
  orange: number;
  rouge: number;
};

type Variant = "lg" | "md" | "sm";
type ColorKey = keyof BlobCounts;

/** All four colours sit in the half-ring (no detached shape). */
const ARC_ORDER: ReadonlyArray<ColorKey> = ["vert", "jaune", "orange", "rouge"];

const BLOB_COLORS: Record<ColorKey, string> = {
  vert: "#A3D26C",
  jaune: "#F6CE5A",
  orange: "#F49B43",
  rouge: "#E0432A",
};

/**
 * Per-colour shadow tints for the neumorphic variant. Instead of a single
 * neutral grey shadow under the whole donut, each slice casts a drop-shadow in
 * its OWN colour (a slightly darker take on BLOB_COLORS) - so the shadow under
 * the green arc is green, the one under the amber arc amber, etc. (rouge is
 * already covered for when a red slice is present).
 */
const BLOB_SHADOW: Record<ColorKey, string> = {
  vert: "rgba(123, 176, 67, 0.7)",
  jaune: "rgba(214, 165, 44, 0.68)",
  orange: "rgba(214, 118, 40, 0.68)",
  rouge: "rgba(190, 52, 28, 0.68)",
};

const BLOB_TEXT: Record<ColorKey, string> = {
  vert: "text-[#84B043]",
  jaune: "text-[#D4A017]",
  orange: "text-[#E07F2C]",
  rouge: "text-[#C73523]",
};

// Penalty labels - same wording as the mobile CountsStrip strips so the
// vocabulary stays consistent between mobile (pill bento) and desktop (blob
// legend). Colour info is already conveyed by the mini-blob swatch + the
// number's text colour above, so we use the slot for the *meaning* instead.
const BLOB_LABEL: Record<ColorKey, string> = {
  vert: "sans pénalité",
  jaune: "pénalité faible",
  orange: "pénalité moyenne",
  rouge: "pénalité forte",
};

const BLOB_PLURAL: Record<ColorKey, string> = {
  vert: "verts",
  jaune: "jaunes",
  orange: "oranges",
  rouge: "rouges",
};

const SEEDS: Record<ColorKey, number> = {
  vert: 8721,
  jaune: 4193,
  orange: 6504,
  rouge: 2876,
};

/**
 * Stable seeds per *junction* (between two adjacent colours), so the wavy
 * radial boundary always looks the same regardless of the count distribution.
 */
const JUNCTION_SEEDS = [10133, 24517, 38981];

type Geom = {
  width: number;
  height: number;
  /** Centre of the half-ring (sits at the bottom; the ring bulges upward). */
  cx: number;
  cy: number;
  rOuter: number;
  rInner: number;
  /** Angular jitter on the radial boundaries (radians). */
  jitter: number;
  /** Sample count for each radial boundary. */
  edgeSegments: number;
  /**
   * Same-colour stroke with rounded line joins/caps - heavily smooths every
   * corner so each slice reads as a soft "blob" rather than a sharp angular
   * sector. Set generously: with a gap between slices, the stroke can spill
   * outwards without bleeding into a neighbour.
   */
  roundStroke: number;
  /**
   * Angular gap between adjacent slices (radians). Each internal junction
   * loses `gapAngle` total - half taken from each side - leaving a clean
   * background-coloured groove between coloured sectors.
   */
  gapAngle: number;
  /**
   * CSS drop-shadow applied per slice - gives every blob its own soft
   * "claymorphism" lift (now possible because slices no longer share radial
   * edges, so the shadows don't double-up at junctions).
   */
  shadow: string;
};

const GEOMETRY: Record<Variant, Geom> = {
  lg: {
    width: 520,
    height: 290,
    cx: 240,
    cy: 240,
    rOuter: 220,
    rInner: 90,
    jitter: 0.07,
    edgeSegments: 16,
    roundStroke: 18,
    gapAngle: 0.11,
    shadow: "drop-shadow(0 6px 10px rgba(15,23,42,0.10)) drop-shadow(0 2px 3px rgba(15,23,42,0.06))",
  },
  md: {
    width: 280,
    height: 152,
    cx: 128,
    cy: 124,
    rOuter: 116,
    rInner: 46,
    jitter: 0.06,
    edgeSegments: 12,
    roundStroke: 9,
    gapAngle: 0.10,
    shadow: "drop-shadow(0 3px 5px rgba(15,23,42,0.10)) drop-shadow(0 1px 2px rgba(15,23,42,0.06))",
  },
  sm: {
    width: 64,
    height: 38,
    cx: 28,
    cy: 32,
    rOuter: 28,
    rInner: 12,
    jitter: 0.04,
    edgeSegments: 8,
    roundStroke: 3,
    gapAngle: 0.10,
    shadow: "drop-shadow(0 1px 2px rgba(15,23,42,0.10))",
  },
};

/**
 * Offset + blur (in viewBox units) of the per-slice colour shadow used by the
 * neumorphic variant. Kept small enough to stay inside each variant's viewBox
 * so the shadow is never clipped by the SVG bounds.
 */
const NEU_SLICE_SHADOW: Record<Variant, { dx: number; dy: number; blur: number }> = {
  lg: { dx: 3, dy: 9, blur: 13 },
  md: { dx: 1.5, dy: 5, blur: 7 },
  sm: { dx: 0.5, dy: 1.8, blur: 2.5 },
};

/**
 * Distribute the half-circle's 180° among the colours that actually have at
 * least one ingredient.
 *
 *  - Colours with `count === 0` are **excluded** from the ring entirely (the
 *    legend below still shows them at 0/N).
 *  - All-zero counts (total === 0) → equal split across the 4 categories so
 *    the ring isn't empty.
 *  - Present-but-tiny slices get a `minAngle` floor so they stay visible in
 *    the ring; the surplus is taken pro-rata from the bigger slices.
 */
function computeSlices(counts: BlobCounts): {
  color: ColorKey;
  start: number;
  end: number;
}[] {
  const total = counts.vert + counts.jaune + counts.orange + counts.rouge;
  const minAngle = Math.PI * 0.04; // ~7° minimum per *present* colour

  let raw: { color: ColorKey; angle: number }[];
  if (total === 0) {
    const equal = Math.PI / ARC_ORDER.length;
    raw = ARC_ORDER.map((c) => ({ color: c, angle: equal }));
  } else {
    const present = ARC_ORDER.filter((c) => counts[c] > 0);
    raw = present.map((c) => ({
      color: c,
      angle: (counts[c] / total) * Math.PI,
    }));
    const small = raw.filter((s) => s.angle < minAngle);
    if (small.length > 0 && small.length < raw.length) {
      const reserved = small.length * minAngle;
      const bigSum = raw
        .filter((s) => s.angle >= minAngle)
        .reduce((a, b) => a + b.angle, 0);
      const remain = Math.PI - reserved;
      raw = raw.map((s) =>
        s.angle < minAngle
          ? { ...s, angle: minAngle }
          : { ...s, angle: (s.angle / bigSum) * remain },
      );
    }
  }

  let cursor = -Math.PI;
  return raw.map((s) => {
    const start = cursor;
    cursor += s.angle;
    return { color: s.color, start, end: cursor };
  });
}

export function IngredientBlob({
  counts,
  variant = "lg",
  showLegend = false,
  legendVariant = "below",
  showCenter = false,
  className = "",
  animate = false,
  subtitle,
  neumorphic = false,
}: {
  counts: BlobCounts;
  variant?: Variant;
  showLegend?: boolean;
  /**
   * Where to render the colour legend when `showLegend` is true.
   *  - "below" (default): 4 swatches in a row under the SVG (compact).
   *  - "around": labels positioned at the 4 corners of the donut. The
   *    top-left/right slots align with the arched jaune/orange segments and
   *    the bottom-left/right slots align with the flat-base vert/rouge ends.
   */
  legendVariant?: "below" | "around";
  showCenter?: boolean;
  className?: string;
  /**
   * When true, the SVG plays a "pop-in" animation on mount (scale + fade with
   * a small overshoot). Off by default so list/row variants don't all animate
   * on every render - only the big card on the analyse page opts in.
   */
  animate?: boolean;
  /**
   * Optional slot rendered BETWEEN the SVG and the legend. Useful for an
   * inline metric like "64 % sans pénalité" that should sit right under the
   * centre count but above the colour legend.
   */
  subtitle?: ReactNode;
  /**
   * When true, swaps the per-slice "claymorphism" drop-shadow for a single
   * neumorphic dual shadow on the whole half-ring: a dark shadow toward the
   * bottom-right and a white highlight toward the top-left, so the donut reads
   * as gently extruded from the surrounding `.neu` card surface.
   */
  neumorphic?: boolean;
}) {
  const geom = GEOMETRY[variant];
  const neuSliceShadow = NEU_SLICE_SHADOW[variant];
  const total = counts.vert + counts.jaune + counts.orange + counts.rouge;
  const slices = computeSlices(counts);

  // Apply the inter-slice gap: each internal junction loses `gapAngle` total,
  // half from each side. The far-left and far-right ends of the half-ring
  // stay on the flat base (no gap there - there's no neighbour).
  const half = geom.gapAngle / 2;
  const gappedSlices = slices.map((s, i) => ({
    color: s.color,
    start: i === 0 ? s.start : s.start + half,
    end: i === slices.length - 1 ? s.end : s.end - half,
  }));

  // Each slice gets its OWN pair of radial edges (left + right). Adjacent
  // slices no longer share an edge - that's what creates the visible gap.
  // We seed the two edges of the same junction with the same JUNCTION_SEED
  // so their wavy silhouettes mirror each other (constant-width groove).
  const sliceEdges = gappedSlices.map((s, i) => {
    const isFirst = i === 0;
    const isLast = i === gappedSlices.length - 1;
    const leftEdge = isFirst
      ? straightRadialEdge(
          geom.cx,
          geom.cy,
          geom.rInner,
          geom.rOuter,
          s.start,
          geom.edgeSegments,
        )
      : wavyRadialEdge(
          geom.cx,
          geom.cy,
          geom.rInner,
          geom.rOuter,
          s.start,
          JUNCTION_SEEDS[i - 1] ?? SEEDS[s.color],
          geom.jitter,
          geom.edgeSegments,
        );
    const rightEdge = isLast
      ? straightRadialEdge(
          geom.cx,
          geom.cy,
          geom.rInner,
          geom.rOuter,
          s.end,
          geom.edgeSegments,
        )
      : wavyRadialEdge(
          geom.cx,
          geom.cy,
          geom.rInner,
          geom.rOuter,
          s.end,
          JUNCTION_SEEDS[i] ?? SEEDS[s.color],
          geom.jitter,
          geom.edgeSegments,
        );
    return { leftEdge, rightEdge };
  });

  const ariaLabel = `${total} ingrédient${total > 1 ? "s" : ""} : ${counts.vert} vert${
    counts.vert > 1 ? "s" : ""
  }, ${counts.jaune} jaune${counts.jaune > 1 ? "s" : ""}, ${counts.orange} orange${
    counts.orange > 1 ? "s" : ""
  }, ${counts.rouge} rouge${counts.rouge > 1 ? "s" : ""}`;

  // Centre text sits in the hollow of the ring, vertically centred in the
  // free space above the ring's centre point.
  const centerY = geom.cy - geom.rInner * 0.55;

  const useAroundLegend = showLegend && legendVariant === "around";

  const svgNode = (
    <svg
      viewBox={`0 0 ${geom.width} ${geom.height}`}
      className={`h-auto w-full ${animate ? "blob-pop-in" : ""}`}
      style={
        neumorphic
          ? {
              // The dark side of the neumorphic shadow is rendered per-slice
              // (each arc casts a shadow in its own colour - see the <path>
              // filter below); only the white top-left highlight is applied
              // to the whole donut here.
              filter: "drop-shadow(-4px -4px 7px var(--neu-shadow-light))",
            }
          : undefined
      }
      role="img"
      aria-label={ariaLabel}
    >
      {/*
        Slice group: each slice now has its own dedicated pair of radial
        edges, so we can apply the claymorphism shadow per-slice without
        the doubled-shadow artefact at junctions.
      */}
      <g style={{ filter: neumorphic ? undefined : geom.shadow }}>
        {gappedSlices.map((s, i) => (
          <path
            key={s.color}
            d={ringSectorPath(
              geom.rInner,
              geom.rOuter,
              sliceEdges[i].leftEdge,
              sliceEdges[i].rightEdge,
            )}
            // Neumorphic variant: each slice casts a soft shadow in its OWN
            // colour, just below the arc - the green section gets a green
            // shadow, the amber one an amber shadow, and so on.
            style={
              neumorphic
                ? {
                    filter: `drop-shadow(${neuSliceShadow.dx}px ${neuSliceShadow.dy}px ${neuSliceShadow.blur}px ${BLOB_SHADOW[s.color]})`,
                  }
                : undefined
            }
            fill={BLOB_COLORS[s.color]}
            // Same-colour stroke with rounded joins/caps softens every
            // corner (radial-edge ↔ inner/outer arc) and the wavy radial
            // edges themselves - the "pill morphism" rounding. The gap
            // between slices means a wide stroke can spill outwards
            // without bleeding into a neighbour.
            stroke={BLOB_COLORS[s.color]}
            strokeWidth={geom.roundStroke}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </g>

      {showCenter && (
        <g>
          <text
            x={geom.cx}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={variant === "lg" ? 56 : 28}
            fontWeight={700}
            fill="#1F2937"
          >
            {total}
          </text>
          <text
            x={geom.cx}
            y={centerY + (variant === "lg" ? 30 : 18)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={variant === "lg" ? 16 : 11}
            fill="#6B7280"
          >
            ingrédients
          </text>
        </g>
      )}
    </svg>
  );

  return (
    <div className={`flex w-full flex-col items-center ${className}`}>
      {useAroundLegend ? (
        // Around layout: 3-column grid with the SVG in the centre column
        // spanning both rows. Top row holds the jaune/orange labels (arched
        // segments), bottom row holds vert/rouge (flat-base ends).
        <div
          className="grid w-full items-center gap-x-2 sm:gap-x-3 [grid-template-columns:minmax(0,1fr)_auto_minmax(0,1fr)] [grid-template-areas:'jaune_svg_orange''vert_svg_rouge']"
        >
          <div className="flex justify-end min-w-0 [grid-area:jaune]">
            <AroundLabel color="jaune" count={counts.jaune} align="end" />
          </div>
          {/* SVG width is capped tighter on narrow screens so the side labels
              ("pénalité moyenne", etc.) always have enough room to wrap inside
              the card. On desktops there's plenty of space, so the donut can
              still be large. */}
          <div className="w-[48vw] max-w-[260px] sm:w-[60vw] sm:max-w-[300px] lg:w-[380px] [grid-area:svg]">
            {svgNode}
          </div>
          <div className="flex justify-start min-w-0 [grid-area:orange]">
            <AroundLabel color="orange" count={counts.orange} align="start" />
          </div>
          <div className="flex justify-end min-w-0 [grid-area:vert]">
            <AroundLabel color="vert" count={counts.vert} align="end" />
          </div>
          <div className="flex justify-start min-w-0 [grid-area:rouge]">
            <AroundLabel color="rouge" count={counts.rouge} align="start" />
          </div>
        </div>
      ) : (
        svgNode
      )}

      {subtitle ? <div className="mt-2 w-full text-center">{subtitle}</div> : null}

      {showLegend && !useAroundLegend && (
        <div className="mt-2 grid w-full grid-cols-4 gap-2 text-center">
          {ARC_ORDER.map((color) => (
            <div key={color} className="flex flex-col items-center">
              <svg viewBox="0 0 36 24" className="h-5 w-9" aria-hidden>
                <path
                  d={blobPath(18, 12, 10, SEEDS[color])}
                  fill={BLOB_COLORS[color]}
                />
              </svg>
              <div className={`mt-1.5 text-base font-bold ${BLOB_TEXT[color]}`}>
                {counts[color]}
                <span className="text-[#9CA3AF]">/{total}</span>
              </div>
              <div className={`text-[11px] italic leading-tight ${BLOB_TEXT[color]}`}>
                {BLOB_LABEL[color]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AroundLabel({
  color,
  count,
  align,
}: {
  color: ColorKey;
  count: number;
  align: "start" | "end";
}) {
  const alignClass = align === "end" ? "items-end text-right" : "items-start text-left";
  return (
    <div className={`flex flex-col ${alignClass} ${BLOB_TEXT[color]}`}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums leading-none">{count}</span>
        <span className="text-[11px] font-medium italic leading-none">
          {BLOB_PLURAL[color]}
        </span>
      </div>
      <div className="mt-1 text-[10px] italic leading-tight">
        {BLOB_LABEL[color]}
      </div>
    </div>
  );
}
