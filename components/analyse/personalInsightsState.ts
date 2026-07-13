/**
 * Logique PURE (sans React) des 3 encarts personnalisés — partagée par le
 * composant <PersonalInsightsCards/> et les tests. Isolée ici pour être
 * testable en Node sans DOM :
 *   - fetchPersonalInsights : appelle /api/personal-insights et NORMALISE le
 *     résultat (http / réseau / pas d'analyse) sans jamais throw.
 *   - nextStateFromResult : mappe ce résultat vers l'état d'affichage, en
 *     respectant le mode « background » (refresh silencieux = on ne dégrade
 *     jamais l'UI en cas d'échec).
 */

export type Tone = "vert" | "ambre" | "rouge" | "neutre";
export type Block = { title: string; description: string; tone: Tone };
export type PersonalBlocks = { goals: Block; skin: Block; watch: Block };

export type State =
  | { status: "loading" }
  | { status: "ready"; blocks: PersonalBlocks }
  | { status: "locked" }
  | { status: "error" };

/** Résultat NORMALISÉ d'un appel /api/personal-insights (jamais d'exception). */
export type PersonalInsightsResult =
  | { kind: "http"; status: number; ok: boolean; blocks?: PersonalBlocks | null }
  | { kind: "network-error" }
  | { kind: "no-analysis" };

/** Les 3 encarts sont tous présents. */
export function hasAllBlocks(blocks: PersonalBlocks | null | undefined): blocks is PersonalBlocks {
  return Boolean(blocks?.goals && blocks?.skin && blocks?.watch);
}

/**
 * Appelle /api/personal-insights et renvoie un résultat normalisé. Ne throw
 * JAMAIS : une coupure réseau devient { kind: "network-error" }, un analysisId
 * absent devient { kind: "no-analysis" } (aucun appel émis).
 * `fetchImpl` est injectable pour les tests.
 */
export async function fetchPersonalInsights(
  analysisId: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<PersonalInsightsResult> {
  if (!analysisId) return { kind: "no-analysis" };
  try {
    const r = await fetchImpl("/api/personal-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId }),
    });
    if (!r.ok) return { kind: "http", status: r.status, ok: false };
    const j = (await r.json()) as { blocks?: PersonalBlocks };
    return { kind: "http", status: r.status, ok: true, blocks: j.blocks ?? null };
  } catch {
    return { kind: "network-error" };
  }
}

/**
 * Mappe le résultat vers l'état à afficher. Retourne `null` quand rien ne doit
 * changer — c'est le cas en mode background (refresh silencieux) pour tout ce
 * qui n'est pas un succès : on GARDE les blocs déjà affichés plutôt que de
 * montrer un verrou/une erreur.
 *   - 429                      -> locked (paywall Premium)
 *   - http non-ok (≠ 429)      -> error
 *   - http ok + 3 blocs        -> ready
 *   - http ok mais blocs incomplets / réseau KO / pas d'analyse -> error
 */
export function nextStateFromResult(
  result: PersonalInsightsResult,
  opts: { background: boolean },
): State | null {
  const fail: State | null = opts.background ? null : { status: "error" };
  switch (result.kind) {
    case "no-analysis":
    case "network-error":
      return fail;
    case "http":
      if (result.status === 429) return opts.background ? null : { status: "locked" };
      if (!result.ok) return fail;
      if (hasAllBlocks(result.blocks)) return { status: "ready", blocks: result.blocks };
      return fail;
  }
}
