/**
 * goalsCoverage (web) — miroir des parties PARTAGÉES du moteur serveur
 * (Supabase edge goals-coverage/core.ts) : signatures, collectGoals,
 * customGoalKey, version. PARITÉ EXACTE avec le mobile
 * (CosmeCheck-App/lib/routine/goalsCoverage.ts) et le core, vérifiée par
 * CosmeCheck-App/lib/__tests__/goalsCoverageParity.test.ts.
 *
 * Le calcul du % vit UNIQUEMENT côté serveur (edge). Ici : lire le résultat
 * persisté + décider de l'état d'affichage / du reload.
 */

import { PROFILE_GOAL_LABEL, type ProfileGoal } from "@/lib/skin/profile";

/** Doit rester égal à GOALS_COVERAGE_VERSION du core (bumper ensemble). */
export const GOALS_COVERAGE_VERSION = 1;
export const MAX_CUSTOM_GOALS = 5;

export type CoverageTone = "vert" | "jaune" | "orange" | "rouge";

export type CoverageItem = {
  key: string;
  label: string;
  isCustom: boolean;
  percent: number;
  tone: CoverageTone;
  relevantCount: number;
};

export type GoalCoverageRow = {
  coverage: CoverageItem[];
  routine_signature: string;
  goals_signature: string;
  model_version: number;
  product_count: number;
  updated_at: string;
};

export type GoalEntry = { key: string; label: string; isCustom: boolean };

type SkinGoalsLike = {
  goals?: readonly string[];
  otherGoals?: string;
  otherGoalsFace?: string;
  otherGoalsBody?: string;
  otherGoalsHair?: string;
  otherGoalsRoutine?: string;
};

/** djb2 — IDENTIQUE au core. */
export function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/** Normalise un texte d'objectif libre — IDENTIQUE au core. */
export function normalizeGoalText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/** Clé cross-user d'un objectif libre — IDENTIQUE au core. */
export function customGoalKey(text: string): string {
  return `free:${djb2(normalizeGoalText(text))}`;
}

/** Rassemble tous les objectifs (prédéfinis + libres) — MÊME logique que le core. */
export function collectGoals(skin: SkinGoalsLike): GoalEntry[] {
  const out: GoalEntry[] = [];
  const seenKeys = new Set<string>();

  for (const g of skin.goals ?? []) {
    if (typeof g !== "string") continue;
    if (!(g in PROFILE_GOAL_LABEL)) continue;
    if (seenKeys.has(g)) continue;
    seenKeys.add(g);
    out.push({ key: g, label: PROFILE_GOAL_LABEL[g as ProfileGoal], isCustom: false });
  }

  const customTexts = [
    skin.otherGoals,
    skin.otherGoalsFace,
    skin.otherGoalsBody,
    skin.otherGoalsHair,
    skin.otherGoalsRoutine,
  ];
  const seenNorm = new Set<string>();
  let count = 0;
  for (const raw of customTexts) {
    if (count >= MAX_CUSTOM_GOALS) break;
    if (typeof raw !== "string") continue;
    const label = raw.trim();
    if (!label) continue;
    const norm = normalizeGoalText(label);
    if (!norm || seenNorm.has(norm)) continue;
    seenNorm.add(norm);
    const key = customGoalKey(label);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    out.push({ key, label: label.slice(0, 120), isCustom: true });
    count++;
  }

  return out;
}

export function hasAnyGoal(skin: SkinGoalsLike): boolean {
  return collectGoals(skin).length > 0;
}

export function goalsSignature(goals: GoalEntry[]): string {
  return goals.map((g) => g.key).sort().join("|");
}

export function goalsSignatureFromSkin(skin: SkinGoalsLike): string {
  return goalsSignature(collectGoals(skin));
}

export function routineSignatureFromItems(
  items: { analysis_id: string; frequency?: string | null }[],
): string {
  return items
    .filter((i) => i && typeof i.analysis_id === "string" && i.analysis_id.length > 0)
    .map((i) => `${i.analysis_id}:${i.frequency ?? "daily"}`)
    .sort()
    .join(",");
}
