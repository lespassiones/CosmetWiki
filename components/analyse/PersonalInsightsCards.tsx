"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchPersonalInsights,
  nextStateFromResult,
  type PersonalBlocks,
  type State,
  type Tone,
} from "./personalInsightsState";

/**
 * PersonalInsightsCards (web) — 3 encarts personnalisés (objectifs / peau / à
 * surveiller) via /api/personal-insights. Miroir du composant mobile.
 *   - initialBlocks présents → affichage instantané (aucun appel).
 *   - sinon : appel lazy (shimmer). 0 crédit (429) → blocs floutés + cadenas +
 *     CTA → /offre (aucun appel IA, aucun débit). Débit (1 crédit) SEULEMENT
 *     après une génération réussie côté serveur ; relecture gratuite.
 * La logique fetch + transition d'état vit dans ./personalInsightsState (pure,
 * testable sans DOM).
 */

// Ré-export pour les consommateurs existants (ex : AnalyseResultPanel).
export type { PersonalBlocks };

// DOIT rester synchro avec PERSONAL_PROMPT_VERSION (lib/ai/personalInsights.ts).
// Détecte des blocs persistés périmés → refresh silencieux (gratuit, déjà payé).
// v12 (juil 2026) : + score de compatibilité + objectifs transmis à l'IA.
// v21 : bonus tout actif utile (vert OU jaune), plus de malus « jaune sans lien ».
// v22 : fix affichage « Plafond : 0 orange » (clamp 100% n'est pas un plafond).
// v23 : fix score — plafond 100 AVANT restrictions (100% + restriction = 92).
// v24 : détection profil->risque musclée (against 7 + balayage), plancher retiré.
// v25 : filets déterministes étendus (allergènes/comédogènes/sulfates) + anti-contradiction.
// v26 : tout produit personnalisé si profil rempli (product_only = profil vide).
// v27 : sensibilités probables (inférence) comme indices against.
// v28 : fix anti-double-comptage insensible aux accents (silicone -5 ET -8).
// v29 : produit hors profil → score = qualité, lignes IA informatives (0 pt).
// v30 : sensibilités déduites du profil = -8. v31 : hors profil → positif porté
// par les 3 blocs IA (goals nomme les atouts), plus de liste d'actifs dans le calcul.
const PERSONAL_BLOCKS_VERSION = 31;

const TONE: Record<Tone, { bg: string; text: string }> = {
  vert: { bg: "bg-emerald-100", text: "text-emerald-600" },
  ambre: { bg: "bg-amber-100", text: "text-amber-600" },
  rouge: { bg: "bg-rose-100", text: "text-rose-600" },
  neutre: { bg: "bg-gray-100", text: "text-gray-500" },
};

// Icônes illustrées line-art (PNG line-art dans /public/icons/analyse) rendues
// via CSS mask + background-color:currentColor → elles héritent de la couleur de
// ton du bloc (text-emerald-600, etc.), exactement comme les anciens SVG. Le
// système de couleurs reste inchangé.
function MaskIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
      aria-hidden
    />
  );
}

// Potion = objectifs, silhouette = peau, silhouette + loupe = à surveiller.
const BLOCKS: { key: keyof PersonalBlocks; src: string }[] = [
  { key: "goals", src: "/icons/analyse/potion.png" },
  { key: "skin", src: "/icons/analyse/body.png" },
  { key: "watch", src: "/icons/analyse/bodyloop.png" },
];

export function PersonalInsightsCards({
  analysisId,
  initialBlocks,
  initialBlocksKey,
}: {
  analysisId: string | null;
  initialBlocks?: PersonalBlocks | null;
  initialBlocksKey?: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>(
    initialBlocks ? { status: "ready", blocks: initialBlocks } : { status: "loading" },
  );
  const fetchedRef = useRef(false);

  // Blocs persistés générés sous un ancien prompt → refresh silencieux (gratuit).
  const stale =
    Boolean(initialBlocks) &&
    (!initialBlocksKey || !initialBlocksKey.startsWith(`v${PERSONAL_BLOCKS_VERSION}:`));

  // background = refresh silencieux : pas de shimmer/verrou/erreur, on garde
  // les blocs existants et on swappe uniquement en cas de succès.
  async function run(background = false) {
    if (!analysisId) {
      if (!background) setState({ status: "error" });
      return;
    }
    if (!background) setState({ status: "loading" });
    const result = await fetchPersonalInsights(analysisId);
    const next = nextStateFromResult(result, { background });
    if (!next) return;
    if (next.status === "ready" && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cosmecheck:credits-updated"));
    }
    setState(next);
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    if (!initialBlocks) {
      fetchedRef.current = true;
      run();
      return;
    }
    if (stale) {
      fetchedRef.current = true;
      run(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId]);

  if (state.status === "loading") {
    return (
      <div className="space-y-3">
        {BLOCKS.map(({ key }) => (
          <article key={key} className="card-white p-4">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 shrink-0 rounded-full bg-black/[0.06]" />
              <div className="min-w-0 flex-1">
                <div className="h-3 w-1/2 rounded-full bg-black/[0.06]" />
                <div className="mt-2 h-2.5 w-5/6 rounded-full bg-black/[0.05]" />
              </div>
            </div>
          </article>
        ))}
        <p className="text-center text-[12px] font-medium text-ink-subtle">Personnalisation selon ton profil…</p>
      </div>
    );
  }

  if (state.status === "locked") {
    return (
      <button type="button" onClick={() => router.push("/offre")} className="block w-full text-left">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="space-y-3 blur-[5px] select-none" aria-hidden>
            {BLOCKS.map(({ key }) => (
              <article key={key} className="card-white p-4">
                <div className="flex items-center gap-3">
                  <span className="h-11 w-11 shrink-0 rounded-full bg-emerald-100" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3.5 w-1/2 rounded-full bg-black/10" />
                    <div className="mt-2 h-2.5 w-5/6 rounded-full bg-black/10" />
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/55 px-5 text-center">
            <span className="mb-2 grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <p className="text-[15px] font-bold text-[#111111]">Analyse personnalisée</p>
            <p className="mt-1 max-w-sm text-[13px] text-ink-subtle">
              Découvre si ce produit te correspond vraiment.
            </p>
            <span className="mt-3 inline-flex items-center justify-center rounded-full bg-[#8B5CF6] px-5 py-2 text-[14px] font-semibold text-white">
              Débloquer avec Premium
            </span>
          </div>
        </div>
      </button>
    );
  }

  if (state.status === "error") {
    // Sans analysisId, « Réessayer » ne peut RIEN faire (aucun appel possible) :
    // on le désactive au lieu de laisser un bouton mort qui ne réagit pas.
    const retriable = Boolean(analysisId);
    return (
      <article className="neu p-4 flex items-center justify-between gap-3">
        <span className="text-[13px] text-ink-subtle">Analyse personnalisée indisponible.</span>
        <button
          type="button"
          onClick={() => run()}
          disabled={!retriable}
          className={`text-[13px] font-semibold ${
            retriable ? "text-[#8B5CF6]" : "cursor-not-allowed text-ink-subtle/40"
          }`}
        >
          Réessayer
        </button>
      </article>
    );
  }

  return <PersonalBlocksList blocks={state.blocks} />;
}

/**
 * Rendu PRÉSENTATIONNEL des 3 blocs (sans fetch). Réutilisé dans le modal
 * « Ce qu'il faut retenir » ouvert depuis <CompatibilityCard/>.
 * `hideSkin` : masque le bloc « à quoi sert ce produit » (score < 60).
 */
export function PersonalBlocksList({ blocks, hideSkin }: { blocks: PersonalBlocks; hideSkin?: boolean }) {
  return (
    <div className="space-y-3">
      {BLOCKS.filter(({ key }) => !(hideSkin && key === "skin")).map(({ key, src }) => {
        const b = blocks[key];
        const c = TONE[b.tone] ?? TONE.neutre;
        return (
          <article key={key} className="card-white p-4">
            <div className="flex items-start gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${c.bg}`}>
                <MaskIcon src={src} className={`h-7 w-7 ${c.text}`} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-bold leading-tight text-[#111111]">{b.title}</h3>
                {b.description ? (
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-subtle">{b.description}</p>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
