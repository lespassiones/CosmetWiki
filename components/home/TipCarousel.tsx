"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const AUTO_ROTATE_MS = 10_000;
const SWIPE_THRESHOLD_PX = 40;

/**
 * Astuce du jour carousel - auto-rotates every 10 s, supports horizontal swipe
 * (touch + drag) and clickable dots. Auto-rotation pauses when the user interacts
 * and resumes on the next idle period.
 */
export function TipCarousel({ tips }: { tips: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const total = tips.length;

  // Auto-rotate
  useEffect(() => {
    if (paused || total <= 1) return;
    timerRef.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % total);
    }, AUTO_ROTATE_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index, paused, total]);

  function go(next: number) {
    setIndex(((next % total) + total) % total);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0].clientX;
    setPaused(true);
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartXRef.current;
    touchStartXRef.current = null;
    if (start === null) return;
    const dx = e.changedTouches[0].clientX - start;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      go(dx < 0 ? index + 1 : index - 1);
    }
    // Resume after a small delay so the user has time to read.
    window.setTimeout(() => setPaused(false), 2000);
  }

  if (total === 0) return null;

  return (
    <div
      className="mt-4 neu p-4 lg:p-5 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center gap-3">
        <div className="text-sm uppercase tracking-wide text-violet-600 font-bold flex-1">Astuce du jour</div>
        <div className="text-[10px] text-violet-700/70 tabular-nums">{index + 1} / {total}</div>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="relative flex-1 min-w-0 overflow-hidden min-h-[3.5em]">
          {tips.map((tip, i) => (
            <p
              key={i}
              aria-hidden={i !== index ? true : undefined}
              className={`text-[13px] text-[#111111] leading-snug text-justify hyphens-auto transition-all duration-500 ${
                i === index
                  ? "relative opacity-100 translate-x-0"
                  : "absolute inset-0 opacity-0 pointer-events-none translate-x-2"
              }`}
            >
              {tip}
            </p>
          ))}
        </div>
        <Image
          src="/image/petiteImage/potion.webp"
          alt=""
          width={72}
          height={72}
          className="shrink-0 h-16 w-16 object-contain drop-shadow-[0_6px_12px_rgba(124,58,237,0.25)]"
        />
      </div>

      {total > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Astuce précédente"
            className="h-7 w-7 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600 hover:bg-violet-200 transition"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 flex-1 justify-center">
            {tips.slice(0, Math.min(total, 8)).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Voir astuce ${i + 1}`}
                aria-current={i === index}
                className={`h-1 rounded-full transition-all ${
                  i === index
                    ? "w-4 bg-violet-500"
                    : "w-1 bg-violet-300/70 hover:bg-violet-400"
                }`}
              />
            ))}
            {total > 8 && <span className="text-[10px] text-violet-400/80 ml-1">…</span>}
          </div>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Astuce suivante"
            className="h-7 w-7 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600 hover:bg-violet-200 transition"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
