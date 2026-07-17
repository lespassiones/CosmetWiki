/**
 * WeeklyPicksCard (web) — « Pépites du jour » sur le dashboard.
 *
 * Server component (twin du mobile hooks/useWeeklyPicks + WeeklyPicksCard) :
 * sélection QUOTIDIENNE de produits catalogue adaptés au profil, DÉTERMINISTE
 * (0 IA, 0 crédit). Tout le calcul est fait ici côté serveur ; le rendu
 * interactif (carrousel + lancement d'analyse) est délégué au client
 * WeeklyPicksCarousel.
 *
 * Pipeline : profil -> needs dominants (pickNeedsForUser) -> RPC batch
 * cosme_check_weekly_picks_candidates -> familles restreintes en noms INCI ->
 * exclusion (restrictions + freeform) + PLANCHER SANTÉ (pastille verte ≥13)
 * + tri tiers + round-robin + diversité (selectWeeklyPicks) -> 6 picks.
 *
 * Robuste : toute erreur (pas d'user, RPC KO) -> `null` (la carte disparaît,
 * le dashboard n'est jamais cassé). Gate via `flag_weekly_picks` chez l'appelant.
 */

import Link from "next/link";

import { getProfile, getUser } from "@/lib/auth";
import { supabaseAnon } from "@/lib/supabase";
import { isProfileStarted, readSkinProfile } from "@/lib/skin/profile";
import { readUserRestrictions } from "@/lib/restrictions/types";
import { buildExclusionSet } from "@/lib/alternatives/filter";
import { colorCapScore, scoreColor } from "@/lib/essentiel/engine";
import { pickNeedsForUser } from "@/lib/weeklyPicks/needsMap";
import {
  buildWeeklyPicksSeed,
  dayKey,
  restrictionsCanonical,
  scoreLabelFromScore,
  selectWeeklyPicks,
  type WeeklyPickCandidate,
} from "@/lib/weeklyPicks/select";
import {
  WeeklyPicksCarousel,
  type WeeklyPickView,
} from "@/components/home/WeeklyPicksCarousel";

/** Plancher santé : pastille VERTE uniquement (note plafonnée ≥ 13). */
const HEALTHY_MIN_CAPPED_SCORE = 13;

interface RpcRow {
  need: string;
  ean: string;
  brand: string | null;
  name: string | null;
  image_url: string | null;
  score: number | null;
  family: string | null;
  sub_category: string | null;
  ingredients_text: string | null;
  count_orange: number | null;
  count_rouge: number | null;
  count_total: number | null;
}

function toCandidate(r: RpcRow): WeeklyPickCandidate {
  return {
    ean: String(r.ean),
    brand: r.brand,
    name: r.name,
    imageUrl: r.image_url,
    score: r.score,
    ingredientsText: r.ingredients_text,
    countOrange: r.count_orange ?? 0,
    countRouge: r.count_rouge ?? 0,
    need: r.need,
    subCategory: r.sub_category,
    family: r.family,
  };
}

function Header() {
  return (
    <div className="px-0.5">
      <div className="flex items-center gap-1.5">
        <SparklesIcon />
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-violet-600">
          Pépites du jour
        </span>
      </div>
      <p className="mt-0.5 text-[13px] text-ink-muted">Sélectionnées pour toi</p>
    </div>
  );
}

export async function WeeklyPicksCard() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;

  const skin = readSkinProfile(profile.preferences);

  // Profil vide -> CTA « complète ton profil » (comme le mobile).
  if (!isProfileStarted(skin)) {
    return (
      <section aria-label="Pépites du jour">
        <Header />
        <Link
          href="/profile/beauty"
          className="mt-3 flex flex-col items-center gap-2 rounded-2xl bg-white/60 ring-1 ring-black/[0.06] px-4 py-4 text-center transition hover:bg-white/80"
        >
          <span className="text-[13px] text-ink-muted leading-snug">
            Complète ton profil beauté pour découvrir tes pépites personnalisées.
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-violet-600">
            Compléter mon profil <span aria-hidden>›</span>
          </span>
        </Link>
      </section>
    );
  }

  try {
    const restrictions = readUserRestrictions(profile.preferences);
    const dk = dayKey();
    const needs = pickNeedsForUser(skin, dk, 3);
    if (needs.length === 0) return null;

    const sb = supabaseAnon();

    // p_per_need = 40 = tout le pool précalculé par besoin (matière au tirage seedé).
    const { data, error } = await sb.rpc("cosme_check_weekly_picks_candidates", {
      p_needs: needs,
      p_per_need: 40,
    });
    if (error) return null;
    const candidates = ((data as RpcRow[] | null) ?? []).map(toCandidate);
    if (candidates.length === 0) return null;

    // Familles restreintes -> noms INCI (même RPC que /api/alternatives/families).
    let familyNames: string[] = [];
    if (restrictions.families.length > 0) {
      const { data: fam } = await sb.rpc("cosme_check_get_family_ingredient_names", {
        p_family_slugs: restrictions.families,
      });
      familyNames = ((fam ?? []) as Array<{ name: string }>).map((f) => f.name);
    }

    const exclusion = buildExclusionSet(
      [...restrictions.ingredients.map((i) => i.name), ...familyNames],
      skin.allergiesFreeform,
    );

    const picks = selectWeeklyPicks({
      candidates,
      exclusion,
      seed: buildWeeklyPicksSeed(user.id, dk, restrictionsCanonical(restrictions)),
      max: 6,
      maxPerSubCategory: 2,
      minCappedScore: HEALTHY_MIN_CAPPED_SCORE,
    });

    const views: WeeklyPickView[] = picks
      .filter((p) => p.ingredientsText && p.ingredientsText.trim().length > 0)
      .map((p) => {
        const capped = colorCapScore(p.score ?? 0, {
          orange: p.countOrange,
          rouge: p.countRouge,
        });
        return {
          ean: p.ean,
          brand: p.brand,
          name: p.name,
          imageUrl: p.imageUrl,
          ingredientsText: p.ingredientsText as string,
          score: capped,
          label: scoreLabelFromScore(capped),
          tone: scoreColor(capped) ?? "green",
        };
      });

    return (
      <section aria-label="Pépites du jour">
        <Header />
        {views.length > 0 ? (
          <div className="mt-3">
            <WeeklyPicksCarousel picks={views} />
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-ink-muted">
            Pas de pépites compatibles avec tes restrictions aujourd&apos;hui. Reviens
            demain.
          </p>
        )}
      </section>
    );
  } catch {
    return null;
  }
}

function SparklesIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 text-violet-500"
    >
      <path d="M12 2l1.6 4.6L18 8.2l-4.4 1.6L12 14.4l-1.6-4.6L6 8.2l4.4-1.6L12 2z" />
      <path d="M19 13l.8 2.3L22 16l-2.2.7L19 19l-.8-2.3L16 16l2.2-.7L19 13z" />
    </svg>
  );
}
