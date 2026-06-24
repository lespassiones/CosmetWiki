"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SuggestionCard, type DeckAlternative } from "./SuggestionCard";

export type DeckSuggestion = {
  key: string;
  productAnalysisId: string | null;
  productTitle: string;
  productScore: number | null;
  dangerColor: "rouge" | "orange" | null;
  alternative: DeckAlternative;
};

type Props = {
  open: boolean;
  suggestions: DeckSuggestion[];
  keepingKey: string | null;
  keptKeys: Set<string>;
  onClose: () => void;
  onKeep: (s: DeckSuggestion) => void;
  onCompare: (s: DeckSuggestion) => void;
  onOpenAlternative: (s: DeckSuggestion) => void;
};

// ─── Coverflow geometry (mirror mobile SuggestionsDeck) ──────────────────────
const LEAN = 18; // décalage de la carte de devant vers le bord libre (début/fin)
const PEEK = 52; // débordement latéral de la 1ʳᵉ carte du fond
const PEEK_STEP = 16; // débordement supplémentaire de la 2ᵉ carte du fond
const DRAG_PER_CARD = 160; // pixels de glissement pour avancer d'une carte

const REL_IN = [-2, -1, 0, 1, 2];
const TX_OUT = [-(PEEK + PEEK_STEP), -PEEK, 0, PEEK, PEEK + PEEK_STEP];
const SCALE_OUT = [0.84, 0.9, 1, 0.9, 0.84];
const ROT_OUT = [-4.5, -3, 0, 3, 4.5];

/** Interpolation linéaire par morceaux, bornée (clamp aux extrémités). */
function interp(x: number, xs: number[], ys: number[]): number {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 0; i < xs.length - 1; i++) {
    if (x >= xs[i] && x <= xs[i + 1]) {
      const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys[ys.length - 1];
}

export function SuggestionsDeck({
  open,
  suggestions,
  keepingKey,
  keptKeys,
  onClose,
  onKeep,
  onCompare,
  onOpenAlternative,
}: Props) {
  const n = suggestions.length;
  // `scroll` = index fractionnaire (position continue). `animating` active la
  // transition CSS (snap au relâchement) ; pendant le glissement on la coupe.
  const [scroll, setScroll] = useState(0);
  const [animating, setAnimating] = useState(false);
  const index = Math.max(0, Math.min(Math.round(scroll), n - 1));

  const drag = useRef<{
    active: boolean;
    startX: number;
    startScroll: number;
    lastX: number;
    lastT: number;
    vx: number;
    moved: boolean;
  } | null>(null);
  // Bloque le clic « garder/comparer » juste après un vrai glissement.
  const suppressClick = useRef(false);

  useEffect(() => {
    if (open) {
      setAnimating(false);
      setScroll(0);
    }
  }, [open]);

  const snapTo = useCallback(
    (target: number) => {
      const t = Math.max(0, Math.min(target, n - 1));
      setAnimating(true);
      setScroll(t);
    },
    [n],
  );

  // Clavier + scroll-lock pendant l'ouverture.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") snapTo(Math.round(scroll) + 1);
      else if (e.key === "ArrowLeft") snapTo(Math.round(scroll) - 1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, snapTo, scroll]);

  function onPointerDown(e: React.PointerEvent) {
    if (n <= 1) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const now = e.timeStamp;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: scroll,
      lastX: e.clientX,
      lastT: now,
      vx: 0,
      moved: false,
    };
    setAnimating(false);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d?.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 6) d.moved = true;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.vx = (e.clientX - d.lastX) / dt; // px/ms
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;

    let s = d.startScroll - dx / DRAG_PER_CARD;
    if (s < 0) s = s * 0.35; // rubber-band avant la 1ʳᵉ
    else if (s > n - 1) s = n - 1 + (s - (n - 1)) * 0.35; // ni après la dernière
    setScroll(s);
  }

  function onPointerUp() {
    const d = drag.current;
    if (!d?.active) return;
    d.active = false;
    if (d.moved) {
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 80);
    }
    // Projection par la vélocité (px/ms → cartes) puis snap ±1 autour du départ.
    const projected = scroll - (d.vx * 90) / DRAG_PER_CARD;
    const base = Math.round(d.startScroll);
    let target = Math.round(projected);
    if (target > base + 1) target = base + 1;
    if (target < base - 1) target = base - 1;
    snapTo(target);
  }

  const guard = (fn: () => void) => () => {
    if (suppressClick.current) return;
    fn();
  };

  if (!open || n === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Suggestions intelligentes"
    >
      {/* Voile sombre + flou (clic = fermer) */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-[fadeIn_180ms_ease-out]"
      />

      <div className="relative flex flex-col h-full pt-[max(env(safe-area-inset-top),1.25rem)]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-5">
          <div className="flex items-center gap-2 min-w-0">
            <SparklesIcon className="h-[18px] w-[18px] text-white shrink-0" />
            <span className="text-[15px] font-semibold text-white truncate">Suggestions intelligentes</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-ink shrink-0"
          >
            <CloseIcon className="h-[22px] w-[22px]" />
          </button>
        </div>
        <p className="px-5 mt-1 mb-7 text-[12px] text-white/90">
          {index + 1} / {n}
          {n > 1 ? " · glisse horizontalement" : ""}
        </p>

        {/* Deck */}
        <div
          className="relative flex-1 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {suggestions.map((s, i) => {
            if (Math.abs(i - index) > 2) return null;
            const rel = i - scroll;
            const lean =
              -LEAN * Math.max(0, 1 - scroll) + LEAN * Math.max(0, scroll - (n - 2));
            const tx = lean + interp(rel, REL_IN, TX_OUT);
            const scale = interp(rel, REL_IN, SCALE_OUT);
            const rot = interp(rel, REL_IN, ROT_OUT);
            const z = Math.round(interp(Math.abs(rel), [0, 2], [100, 80]));
            const isFront = i === index;
            return (
              <div
                key={s.key}
                className="absolute left-1/2 top-2"
                style={{
                  width: "min(84vw, 360px)",
                  marginLeft: "calc(min(84vw, 360px) / -2)",
                  transform: `translateX(${tx}px) scale(${scale}) rotate(${rot}deg)`,
                  transition: animating ? "transform 320ms cubic-bezier(0.22,1,0.36,1)" : "none",
                  zIndex: z,
                  pointerEvents: isFront ? "auto" : "none",
                }}
              >
                <SuggestionCard
                  productTitle={s.productTitle}
                  productScore={s.productScore}
                  dangerColor={s.dangerColor}
                  alternative={s.alternative}
                  keeping={keepingKey === s.key}
                  kept={keptKeys.has(s.key)}
                  onKeep={guard(() => onKeep(s))}
                  onCompare={guard(() => onCompare(s))}
                  onOpenAlternative={guard(() => onOpenAlternative(s))}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l1.6 4.6L18 8l-4.4 1.4L12 14l-1.6-4.6L6 8l4.4-1.4L12 2zm6 10l.9 2.6L21 16l-2.1.7L18 19l-.9-2.3L15 16l2.1-1.4L18 12zM6 14l.9 2.6L9 17l-2.1.7L6 20l-.9-2.3L3 17l2.1-.4L6 14z" />
    </svg>
  );
}
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
