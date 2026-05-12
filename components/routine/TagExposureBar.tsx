export function TagExposureBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = Math.max(6, Math.round((count / Math.max(max, 0.0001)) * 100));
  // Visual intensity scales with relative weight — warm for high exposure.
  const color = count >= max * 0.8
    ? "bg-rose-400"
    : count >= max * 0.5
      ? "bg-orange-400"
      : count >= max * 0.25
        ? "bg-amber-400"
        : "bg-[#10B981]";
  return (
    <li>
      <div className="flex items-baseline justify-between text-[12px] mb-1">
        <span className="font-medium text-[#111111]">{label}</span>
        <span className="text-[#6B7280] tabular-nums">{count.toFixed(2)}/j</span>
      </div>
      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-[width] duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}
