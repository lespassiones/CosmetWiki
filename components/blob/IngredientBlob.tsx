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

const BLOB_TEXT: Record<ColorKey, string> = {
  vert: "text-[#84B043]",
  jaune: "text-[#D4A017]",
  orange: "text-[#E07F2C]",
  rouge: "text-[#C73523]",
};

const BLOB_LABEL: Record<ColorKey, string> = {
  vert: "ingrédients verts",
  jaune: "ingrédients jaunes",
  orange: "ingrédients oranges",
  rouge: "ingrédients rouges",
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
   * Stroke width drawn in the *same colour as the fill*, with rounded line
   * joins/caps. Cosmetic only: it doesn't change the ring colour, it just
   * smooths every corner where a radial edge meets the inner/outer arc, and
   * smooths the wavy radial edges themselves. Larger variants need a thicker
   * stroke to round the larger corners.
   */
  roundStroke: number;
  /**
   * CSS drop-shadow applied to the slice group — gives the half-ring a soft
   * "claymorphism" lift off the page (matches the reference mock's painted
   * blob look). Tuned per-variant so it stays subtle at every size.
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
    roundStroke: 8,
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
    roundStroke: 4,
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
    roundStroke: 1.5,
    shadow: "drop-shadow(0 1px 2px rgba(15,23,42,0.10))",
  },
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
  showCenter = false,
  className = "",
}: {
  counts: BlobCounts;
  variant?: Variant;
  showLegend?: boolean;
  showCenter?: boolean;
  className?: string;
}) {
  const geom = GEOMETRY[variant];
  const total = counts.vert + counts.jaune + counts.orange + counts.rouge;
  const slices = computeSlices(counts);

  // Pre-compute the radial boundaries:
  //   edges[0]   = far-left  (straight, sits on the half-ring's flat base)
  //   edges[1..] = internal junctions between adjacent colours (wavy)
  //   edges[N]   = far-right (straight, sits on the flat base)
  const edges = [
    straightRadialEdge(
      geom.cx,
      geom.cy,
      geom.rInner,
      geom.rOuter,
      slices[0].start,
      geom.edgeSegments,
    ),
  ];
  for (let i = 0; i < slices.length - 1; i++) {
    edges.push(
      wavyRadialEdge(
        geom.cx,
        geom.cy,
        geom.rInner,
        geom.rOuter,
        slices[i].end,
        JUNCTION_SEEDS[i] ?? SEEDS[slices[i].color],
        geom.jitter,
        geom.edgeSegments,
      ),
    );
  }
  edges.push(
    straightRadialEdge(
      geom.cx,
      geom.cy,
      geom.rInner,
      geom.rOuter,
      slices[slices.length - 1].end,
      geom.edgeSegments,
    ),
  );

  const ariaLabel = `${total} ingrédient${total > 1 ? "s" : ""} : ${counts.vert} vert${
    counts.vert > 1 ? "s" : ""
  }, ${counts.jaune} jaune${counts.jaune > 1 ? "s" : ""}, ${counts.orange} orange${
    counts.orange > 1 ? "s" : ""
  }, ${counts.rouge} rouge${counts.rouge > 1 ? "s" : ""}`;

  // Centre text sits in the hollow of the ring, vertically centred in the
  // free space above the ring's centre point.
  const centerY = geom.cy - geom.rInner * 0.55;

  return (
    <div className={`flex w-full flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${geom.width} ${geom.height}`}
        className="h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {/*
          Slice group: a single CSS drop-shadow on the wrapper produces the
          claymorphism lift. We don't apply it per-slice because adjacent
          slices share a radial edge — a per-slice shadow would visibly
          double-up at every junction.
        */}
        <g style={{ filter: geom.shadow }}>
          {slices.map((s, i) => (
            <path
              key={s.color}
              d={ringSectorPath(geom.rInner, geom.rOuter, edges[i], edges[i + 1])}
              fill={BLOB_COLORS[s.color]}
              // Same-colour stroke with rounded joins/caps softens every corner
              // (radial-edge ↔ inner/outer arc) and the wavy radial edges
              // themselves — the "pill morphism" rounding.
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

      {showLegend && (
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
              <div className="text-[11px] leading-tight text-[#6B7280]">
                {BLOB_LABEL[color]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
