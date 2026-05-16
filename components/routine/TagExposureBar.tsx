import type { CSSProperties } from "react";

const COLOR_HEX: Record<string, string> = {
  Vert: "#10B981",
  Jaune: "#F59E0B",
  Orange: "#F97316",
  Rouge: "#F87171",
};

function buildBarStyle(segments: { color: string; fraction: number }[]): CSSProperties {
  if (segments.length === 0) return { backgroundColor: "#9CA3AF" };
  if (segments.length === 1) return { backgroundColor: COLOR_HEX[segments[0].color] ?? "#9CA3AF" };

  // Distinct segments with a small 1.5% soft blend at each boundary (Option B).
  const BLEND = 1.5;
  const stops: string[] = [];
  let pos = 0;
  for (let i = 0; i < segments.length; i++) {
    const hex = COLOR_HEX[segments[i].color] ?? "#9CA3AF";
    const segEnd = pos + segments[i].fraction * 100;
    const solidStart = i === 0 ? 0 : Math.min(pos + BLEND, (pos + segEnd) / 2);
    const solidEnd = i === segments.length - 1 ? 100 : Math.max(segEnd - BLEND, (pos + segEnd) / 2);
    stops.push(`${hex} ${solidStart.toFixed(1)}%`);
    stops.push(`${hex} ${solidEnd.toFixed(1)}%`);
    pos = segEnd;
  }
  return { background: `linear-gradient(to right, ${stops.join(", ")})` };
}

export function TagExposureBar({
  label,
  count,
  max,
  colorSegments = [],
}: {
  label: string;
  count: number;
  max: number;
  colorSegments?: { color: string; fraction: number }[];
}) {
  const pct = Math.max(6, Math.round((count / Math.max(max, 0.0001)) * 100));
  const barStyle = buildBarStyle(colorSegments);
  return (
    <li>
      <div className="flex items-baseline justify-between text-[12px] mb-1">
        <span className="font-medium text-[#111111]">{label}</span>
        <span className="text-[#6B7280] tabular-nums">{count.toFixed(2)}/j</span>
      </div>
      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, ...barStyle }}
        />
      </div>
    </li>
  );
}
