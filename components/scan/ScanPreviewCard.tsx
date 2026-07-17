"use client";

/**
 * ScanPreviewCard (web) — carte APERÇU en bas de l'écran de scan dès qu'un produit
 * du catalogue est reconnu, SANS lancer l'analyse. Miroir du mobile
 * (components/scan/ScanPreviewCard.tsx). Reprend le « haut d'analyse » : photo,
 * nom, marque, sous-catégorie, pastilles (VerdictGauge) + Partager + « Voir le
 * produit » (qui, lui, lance l'analyse complète).
 *
 * 100% instantané : toutes les données viennent d'une seule lecture catalogue
 * renvoyée par /api/product-by-barcode (champ `preview`).
 */
import { QualityStarsRow } from "@/components/analyse/QualityStars";
import { verdictToneFromScore, type VerdictTone } from "@/lib/essentiel/engine";
import type { ScanPreview } from "@/lib/productSearch/types";

function subcategoryLabel(category: string | null): string | null {
  if (!category) return null;
  const leaf = category.split("/").filter(Boolean).pop();
  if (!leaf) return null;
  const words = leaf.replace(/-/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toneFor(p: ScanPreview): VerdictTone {
  if (p.countRouge >= 2) return "high-risk";
  return verdictToneFromScore(p.score);
}

export function ScanPreviewCard({
  preview,
  onSeeProduct,
  onClose,
}: {
  preview: ScanPreview;
  onSeeProduct: () => void;
  onClose: () => void;
}) {
  const subcat = subcategoryLabel(preview.category);
  const tone = toneFor(preview);

  function onShare() {
    const title = [preview.brand, preview.name].filter(Boolean).join(" ");
    const text = `${title || "Ce produit"} — analysé sur Cosme Check`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSeeProduct}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSeeProduct();
        }
      }}
      aria-label="Ouvrir l'analyse complète"
      // Ancrée en bas de l'ÉCRAN (fixed), pas au bas de la boîte caméra : la
      // fiche produit ne recouvre plus le champ vidéo, elle occupe l'espace
      // vide sous la caméra. Centrée + largeur max, safe-area iOS respectée.
      className="pointer-events-auto fixed inset-x-3 z-[110] mx-auto max-w-md cursor-pointer rounded-2xl bg-white p-4 text-left shadow-2xl ring-1 ring-black/5"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {preview.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.imageUrl}
              alt={preview.name ?? "Produit"}
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">📦</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {preview.brand && (
            <p className="truncate text-xs text-slate-500">{preview.brand}</p>
          )}
          <p className="line-clamp-2 text-sm font-semibold text-slate-900">
            {preview.name ?? "Produit"}
          </p>
          {subcat && (
            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
              {subcat}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Fermer"
          className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      {/* Étoiles « Qualité de la formule » (remplace les pastilles), pleine largeur. */}
      <QualityStarsRow
        tone={tone}
        idPrefix="scanstar"
        className="mt-3 flex items-center justify-between"
        starClassName="h-12 w-12"
        ariaLabel="Qualité de la formule (aperçu)"
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
        >
          Partager
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSeeProduct();
          }}
          className="flex-1 rounded-full bg-emerald-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Voir le produit
        </button>
      </div>
    </div>
  );
}
