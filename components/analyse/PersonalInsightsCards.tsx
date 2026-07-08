"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * PersonalInsightsCards (web) — 3 encarts personnalisés (objectifs / peau / à
 * surveiller) via /api/personal-insights. Miroir du composant mobile.
 *   - initialBlocks présents → affichage instantané (aucun appel).
 *   - sinon : appel lazy (shimmer). 0 crédit (429) → blocs floutés + cadenas +
 *     CTA → /offre (aucun appel IA, aucun débit). Débit (1 crédit) à la 1ère
 *     génération côté serveur ; relecture gratuite.
 */

type Tone = "vert" | "ambre" | "rouge" | "neutre";
type Block = { title: string; description: string; tone: Tone };
export type PersonalBlocks = { goals: Block; skin: Block; watch: Block };

// DOIT rester synchro avec PERSONAL_PROMPT_VERSION (lib/ai/personalInsights.ts).
// Détecte des blocs persistés périmés → refresh silencieux (gratuit, déjà payé).
const PERSONAL_BLOCKS_VERSION = 7;

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

type State =
  | { status: "loading" }
  | { status: "ready"; blocks: PersonalBlocks }
  | { status: "locked" }
  | { status: "error" };

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
  function run(background = false) {
    if (!analysisId) {
      if (!background) setState({ status: "error" });
      return;
    }
    if (!background) setState({ status: "loading" });
    fetch("/api/personal-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId }),
    })
      .then(async (r) => {
        if (r.status === 429) {
          if (!background) setState({ status: "locked" });
          return;
        }
        if (!r.ok) {
          if (!background) setState({ status: "error" });
          return;
        }
        const j = (await r.json()) as { blocks?: PersonalBlocks };
        if (j.blocks?.goals && j.blocks.skin && j.blocks.watch) {
          if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("cosmecheck:credits-updated"));
          setState({ status: "ready", blocks: j.blocks });
        } else if (!background) {
          setState({ status: "error" });
        }
      })
      .catch(() => {
        if (!background) setState({ status: "error" });
      });
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
          <article key={key} className="neu p-4">
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
              <article key={key} className="neu p-4">
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
    return (
      <article className="neu p-4 flex items-center justify-between gap-3">
        <span className="text-[13px] text-ink-subtle">Analyse personnalisée indisponible.</span>
        <button type="button" onClick={() => run()} className="text-[13px] font-semibold text-[#8B5CF6]">
          Réessayer
        </button>
      </article>
    );
  }

  return (
    <div className="space-y-3">
      {BLOCKS.map(({ key, src }) => {
        const b = state.blocks[key];
        const c = TONE[b.tone] ?? TONE.neutre;
        return (
          <article key={key} className="neu p-4">
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
