/**
 * Path helpers for the ingredient distribution viz.
 *
 * The viz is a half-ring (donut sliced in half) split into N angular sectors,
 * one per colour category (vert / jaune / orange / rouge). The outer & inner
 * arcs stay clean circles; the **radial boundaries** between adjacent sectors
 * are the ones we deform organically (≈ Paint mockup).
 *
 * Two adjacent sectors must share the *same* radial edge so they meet pixel-
 * tight. So we generate each radial edge once and pass it to both sectors.
 */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const f = (v: number) => v.toFixed(2);

export type Pt = { x: number; y: number };

/**
 * Wavy radial edge from the inner ring to the outer ring at a given angle.
 * Each sample point's *angle* is jittered, with a sin(πt) envelope so the
 * jitter fades to zero at the ring boundaries - the ends always land on the
 * exact unjittered (rInner, angle) and (rOuter, angle) points so the edge
 * meets the inner/outer arcs perfectly.
 */
export function wavyRadialEdge(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  angle: number,
  seed: number,
  jitter = 0.06,
  segments = 14,
): Pt[] {
  const rng = mulberry32(seed);
  const pts: Pt[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const r = rInner + (rOuter - rInner) * t;
    const fade = Math.sin(t * Math.PI);
    const offset = (rng() - 0.5) * 2 * jitter * fade;
    pts.push({
      x: cx + r * Math.cos(angle + offset),
      y: cy + r * Math.sin(angle + offset),
    });
  }
  return pts;
}

/** Straight radial edge - used at the half-ring's left/right ends. */
export function straightRadialEdge(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  angle: number,
  segments = 14,
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const r = rInner + (rOuter - rInner) * t;
    pts.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  return pts;
}

/**
 * Closed path for a ring sector bounded by:
 *   - leftEdge  : list of points from inner→outer (radial boundary on the left)
 *   - outer arc : SVG `A` command sweeping from leftEdge[end] to rightEdge[end]
 *   - rightEdge : list of points from outer→inner (we walk it in reverse)
 *   - inner arc : SVG `A` command sweeping back from rightEdge[0] to leftEdge[0]
 *
 * `endAngle > startAngle` is required (slice sweeps clockwise in SVG y-down).
 */
export function ringSectorPath(
  rInner: number,
  rOuter: number,
  leftEdge: Pt[],
  rightEdge: Pt[],
): string {
  if (leftEdge.length < 2 || rightEdge.length < 2) return "";

  let d = `M ${f(leftEdge[0].x)} ${f(leftEdge[0].y)}`;
  for (let i = 1; i < leftEdge.length; i++) {
    d += ` L ${f(leftEdge[i].x)} ${f(leftEdge[i].y)}`;
  }
  // Outer arc: from leftEdge.last to rightEdge.last, sweeping clockwise.
  const rOut = rightEdge[rightEdge.length - 1];
  d += ` A ${f(rOuter)} ${f(rOuter)} 0 0 1 ${f(rOut.x)} ${f(rOut.y)}`;
  for (let i = rightEdge.length - 2; i >= 0; i--) {
    d += ` L ${f(rightEdge[i].x)} ${f(rightEdge[i].y)}`;
  }
  // Inner arc: back to leftEdge[0], sweeping counter-clockwise.
  const lIn = leftEdge[0];
  d += ` A ${f(rInner)} ${f(rInner)} 0 0 0 ${f(lIn.x)} ${f(lIn.y)}`;
  return d + " Z";
}

/** Smooth closed Catmull-Rom blob - used for legend mini-shapes. */
export function organicBlob(
  cx: number,
  cy: number,
  radius: number,
  seed: number,
  points = 11,
  jitter = 0.18,
): string {
  if (radius <= 0) return "";
  const rng = mulberry32(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * (1 + (rng() - 0.5) * 2 * jitter);
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  const n = pts.length;
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(p2.x)} ${f(p2.y)}`;
  }
  return d + " Z";
}

/** Backwards-compat alias for the legend swatches. */
export const blobPath = organicBlob;
