import Link from "next/link";
import { IngredientBlob, type BlobCounts } from "@/components/blob/IngredientBlob";

function exposureFg(label: string): string {
  if (label === "Faible") return "text-emerald-700";
  if (label === "Modérée") return "text-amber-700";
  if (label === "Élevée") return "text-orange-700";
  return "text-rose-700";
}

interface Props {
  exposureScore: number;
  exposureLabel: string;
  colorCounts: BlobCounts;
  /** Si fourni, la carte devient un lien vers le détail (chevron « › »). */
  href?: string;
}

/**
 * Carte « Exposition cumulée » (score /20 + label + jauge). Partagée entre la
 * page routine (carte du haut, cliquable + chevron « › » → /routine/exposition)
 * et la page détail /routine/exposition (rappel en tête, sans lien). Un seul
 * rendu → parité. Twin mobile : components/routine/ExposureSummaryCard.tsx.
 */
export function ExposureSummaryCard({ exposureScore, exposureLabel, colorCounts, href }: Props) {
  const fg = exposureFg(exposureLabel);
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide text-black mb-1">Exposition cumulée</div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold tabular-nums ${fg}`}>{exposureScore.toFixed(1)}</span>
          <span className="text-sm text-[#6B7280]">/20</span>
        </div>
        <div className={`mt-1 text-[12px] font-semibold ${fg}`}>{exposureLabel}</div>
      </div>
      <div className="w-[120px] shrink-0">
        <IngredientBlob counts={colorCounts} variant="md" neumorphic />
      </div>
      {href && (
        <span aria-hidden className="absolute top-3 right-3 text-lg leading-none text-[#9CA3AF]">
          ›
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Voir le détail de l'exposition cumulée"
        className="neu p-5 flex items-center gap-4 relative transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
      >
        {body}
      </Link>
    );
  }
  return <div className="neu p-5 flex items-center gap-4 relative">{body}</div>;
}
