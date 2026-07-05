import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { IngredientBlob, type BlobCounts } from "../blob/IngredientBlob";
import { TipCarousel } from "./TipCarousel";

export type DashboardData = {
  firstName: string | null;
  lastAnalysis: {
    id: string;
    name: string | null;
    product_label: string | null;
    score: number | null;
    created_at: string;
    counts: BlobCounts | null;
  } | null;
  routineCount: number;
  routineAvgScore: number | null;
  routineCounts: BlobCounts | null;
  tips: string[];
};

function ChevronCircle({ tone }: { tone: "green" | "pink" | "purple" }) {
  const fg =
    tone === "green"
      ? "text-emerald-700"
      : tone === "pink"
        ? "text-rose-600"
        : "text-violet-700";
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/75 ${fg}`}
      aria-hidden
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </span>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}

/** Tuile carrée de la grille 2×2 : titre + icône/illustration + chevron. */
function Tile({
  href,
  tone,
  title,
  children,
}: {
  href: string;
  tone: "green" | "pink" | "purple";
  title: ReactNode;
  children: ReactNode;
}) {
  const bg =
    tone === "green"
      ? "bg-[#E4F3E9]"
      : tone === "pink"
        ? "bg-[#FCE3EC]"
        : "bg-[#ECE6FA]";
  const fg =
    tone === "green"
      ? "text-emerald-700"
      : tone === "pink"
        ? "text-rose-600"
        : "text-violet-700";
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[150px] flex-col overflow-hidden rounded-3xl p-4 transition ${bg}`}
      style={{ boxShadow: "6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light)" }}
    >
      <div className="flex items-start justify-between">
        <h2 className={`text-[16px] font-bold leading-tight tracking-tight ${fg}`}>{title}</h2>
        <ChevronCircle tone={tone} />
      </div>
      <div className="flex flex-1 items-end justify-center pt-2">{children}</div>
    </Link>
  );
}

export function HomeDashboard({
  data,
  trendingSlot,
}: {
  data: DashboardData;
  trendingSlot: ReactNode;
}) {
  const greeting = data.firstName ? `Bonjour ${data.firstName} 👋` : "Bienvenue 👋";
  const last = data.lastAnalysis;
  const lastCounts = last?.counts ?? { vert: 0, jaune: 0, orange: 0, rouge: 0 };

  return (
    <section aria-label="Tableau de bord" className="mx-auto w-full max-w-6xl px-5 lg:px-8 mt-2 lg:mt-6">
      <h1 className="text-[26px] lg:text-[36px] leading-tight font-bold tracking-tight">{greeting}</h1>

      <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0 lg:mt-4" />

      <p className="mt-3 lg:mt-4 text-sm lg:text-base text-[#6B7280]">
        Décrypte tes cosmétiques{" "}
        <span className="relative inline-block whitespace-nowrap font-medium text-[#111111]">
          en un clin d&apos;œil
          <svg
            aria-hidden
            viewBox="0 -3 200 17"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -bottom-2 left-0 h-2.5 w-full text-violet-500"
          >
            <path d="M5,11 Q100,-3 195,11 Q100,7 5,11 Z" fill="currentColor" />
          </svg>
        </span>
        .
      </p>

      <TipCarousel tips={data.tips} />

      {/* Grille 2×2 — 4 tuiles simples (titre + icône + chevron). */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:gap-4">
        <Tile
          href={last ? `/history/${last.id}` : "/produits"}
          tone="green"
          title={<>Dernière<br />analyse</>}
        >
          {last ? (
            <div className="w-[132px]">
              <IngredientBlob counts={lastCounts} variant="md" neumorphic />
            </div>
          ) : (
            <LeafIcon className="h-12 w-12 text-[#86C99A]" />
          )}
        </Tile>

        <Tile href="/routine" tone="pink" title={<>Ma<br />routine</>}>
          <Image
            src="/image/petiteImage/routine.webp"
            alt=""
            width={440}
            height={280}
            className="h-[82px] w-auto object-contain"
          />
        </Tile>

        <Tile href="/advisor" tone="purple" title={<>Beauty<br />Advisor</>}>
          <Image
            src="/image/petiteImage/advisor.webp"
            alt=""
            width={440}
            height={325}
            className="h-[84px] w-auto object-contain"
          />
        </Tile>

        <Tile href="/promesses" tone="green" title={<>Promesses<br />vs Formule</>}>
          <Image
            src="/image/petiteImage/promesse.webp"
            alt=""
            width={248}
            height={202}
            className="h-[82px] w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,100,0,0.15)]"
          />
        </Tile>
      </div>

      <div className="mt-4">{trendingSlot}</div>
    </section>
  );
}
