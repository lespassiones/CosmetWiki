type Props = {
  vert: number;
  jaune: number;
  orange: number;
  rouge: number;
  size?: number;
  thickness?: number;
};

/**
 * Demi-camembert (180°) qui visualise la répartition des ingrédients
 * par couleur de score (vert / jaune / orange / rouge) - sans note
 * numérique. C'est le langage visuel propre à Cosme Check.
 *
 * Les angles vont de 180° (gauche) à 0° (droite) en sens horaire.
 */
export function HalfDonut({
  vert,
  jaune,
  orange,
  rouge,
  size = 160,
  thickness = 18,
}: Props) {
  const total = vert + jaune + orange + rouge;
  if (total <= 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;

  const segments = [
    { value: vert, color: "#10B981" },
    { value: jaune, color: "#FBBF24" },
    { value: orange, color: "#F97316" },
    { value: rouge, color: "#F43F5E" },
  ];

  let acc = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = (acc / total) * 180;
      acc += s.value;
      const end = (acc / total) * 180;
      const startAngle = 180 - start;
      const endAngle = 180 - end;
      const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
      const y1 = cy - r * Math.sin((startAngle * Math.PI) / 180);
      const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
      const y2 = cy - r * Math.sin((endAngle * Math.PI) / 180);
      const large = end - start > 180 ? 1 : 0;
      const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
      return { d, color: s.color, value: s.value };
    });

  return (
    <div className="inline-flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size / 2 + thickness / 2}`}
        width={size}
        height={size / 2 + thickness / 2}
        aria-hidden
      >
        {/* Track */}
        <path
          d={`M ${thickness / 2} ${cy} A ${r} ${r} 0 0 1 ${size - thickness / 2} ${cy}`}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        {arcs.map((a, i) => (
          <path
            key={i}
            d={a.d}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted">
        <Dot color="#10B981" count={vert} />
        <Dot color="#FBBF24" count={jaune} />
        <Dot color="#F97316" count={orange} />
        <Dot color="#F43F5E" count={rouge} />
      </div>
    </div>
  );
}

function Dot({ color, count }: { color: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="font-semibold tabular-nums text-ink">{count}</span>
    </span>
  );
}
