/**
 * Stacked horizontal bar showing the proportion of vert/jaune/orange/rouge
 * ingredients in a product. Replaces the half-donut on the compare page so
 * the two products can be eyeballed side by side without dominating the
 * screen. Each segment carries a tooltip with the absolute count.
 */
export type ExposureCounts = {
  vert: number;
  jaune: number;
  orange: number;
  rouge: number;
};

export function ExposureBar({ counts }: { counts: ExposureCounts }) {
  const total = counts.vert + counts.jaune + counts.orange + counts.rouge;
  if (total === 0) {
    return (
      <div className="h-3 w-full rounded-full bg-gray-100 ring-1 ring-black/[0.04]" aria-hidden />
    );
  }
  const pct = (n: number) => (n / total) * 100;

  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full ring-1 ring-black/[0.04]"
      role="img"
      aria-label={`Répartition des ingrédients : ${counts.vert} sans pénalité, ${counts.jaune} pénalité faible, ${counts.orange} pénalité moyenne, ${counts.rouge} pénalité forte.`}
    >
      {counts.vert > 0 && (
        <span
          style={{ width: `${pct(counts.vert)}%` }}
          className="block bg-emerald-500"
          title={`${counts.vert} sans pénalité`}
        />
      )}
      {counts.jaune > 0 && (
        <span
          style={{ width: `${pct(counts.jaune)}%` }}
          className="block bg-yellow-400"
          title={`${counts.jaune} pénalité faible`}
        />
      )}
      {counts.orange > 0 && (
        <span
          style={{ width: `${pct(counts.orange)}%` }}
          className="block bg-orange-500"
          title={`${counts.orange} pénalité moyenne`}
        />
      )}
      {counts.rouge > 0 && (
        <span
          style={{ width: `${pct(counts.rouge)}%` }}
          className="block bg-rose-500"
          title={`${counts.rouge} pénalité forte`}
        />
      )}
    </div>
  );
}

/** Compact "7v · 5j · 1o · 0r" line shown right under the bar. Dots inherit
 *  the colour from the bar so a quick glance ties number to segment. */
export function ExposureCountsRow({ counts }: { counts: ExposureCounts }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-subtle">
      <CountChip color="emerald" value={counts.vert} label="sans pénalité" />
      <CountChip color="yellow" value={counts.jaune} label="pénalité faible" />
      <CountChip color="orange" value={counts.orange} label="pénalité moyenne" />
      <CountChip color="rose" value={counts.rouge} label="pénalité forte" />
    </div>
  );
}

function CountChip({
  color,
  value,
  label,
}: {
  color: "emerald" | "yellow" | "orange" | "rose";
  value: number;
  label: string;
}) {
  const dotClass =
    color === "emerald"
      ? "bg-emerald-500"
      : color === "yellow"
        ? "bg-yellow-400"
        : color === "orange"
          ? "bg-orange-500"
          : "bg-rose-500";
  return (
    <span
      className={value === 0 ? "inline-flex items-center gap-1 text-ink-subtle/50" : "inline-flex items-center gap-1"}
      title={label}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="tabular-nums font-semibold text-ink">{value}</span>
    </span>
  );
}
