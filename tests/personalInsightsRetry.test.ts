/**
 * Logique du bouton « Réessayer » et des transitions d'état des 3 encarts perso
 * (module pur components/analyse/personalInsightsState). On teste la MÉCANIQUE
 * réelle déclenchée par le clic : fetch normalisé -> état d'affichage.
 *
 * Reproduit le comportement rapporté :
 *   - erreur transitoire puis re-clic « Réessayer » -> récupération (ready)
 *   - sans analysisId, aucun appel n'est émis (bouton non fonctionnel côté logique)
 */
import { describe, it, expect } from "vitest";
import {
  fetchPersonalInsights,
  nextStateFromResult,
  hasAllBlocks,
  type PersonalBlocks,
} from "@/components/analyse/personalInsightsState";

const fullBlocks = (): PersonalBlocks => ({
  goals: { title: "Cible ton hydratation", description: "d", tone: "vert" },
  skin: { title: "À quoi ça sert", description: "d", tone: "neutre" },
  watch: { title: "Rien à surveiller", description: "d", tone: "vert" },
});

/** Fabrique un fetch factice renvoyant une réponse HTTP donnée. */
function httpFetch(status: number, jsonBody: unknown = {}): typeof fetch {
  return (async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => jsonBody,
  })) as unknown as typeof fetch;
}

/** fetch qui rejette (coupure réseau / offline / timeout). */
const throwingFetch = (async () => {
  throw new Error("network down");
}) as unknown as typeof fetch;

describe("fetchPersonalInsights (normalisation, jamais d'exception)", () => {
  it("succès 200 avec 3 blocs -> http ok + blocs", async () => {
    const r = await fetchPersonalInsights("a1", httpFetch(200, { blocks: fullBlocks() }));
    expect(r).toMatchObject({ kind: "http", status: 200, ok: true });
  });

  it("429 -> http non-ok status 429", async () => {
    const r = await fetchPersonalInsights("a1", httpFetch(429));
    expect(r).toMatchObject({ kind: "http", status: 429, ok: false });
  });

  it("503 -> http non-ok status 503", async () => {
    const r = await fetchPersonalInsights("a1", httpFetch(503));
    expect(r).toMatchObject({ kind: "http", status: 503, ok: false });
  });

  it("coupure réseau -> network-error (pas d'exception)", async () => {
    const r = await fetchPersonalInsights("a1", throwingFetch);
    expect(r).toEqual({ kind: "network-error" });
  });

  it("analysisId null -> no-analysis SANS émettre d'appel", async () => {
    let called = false;
    const spyFetch = (async () => {
      called = true;
      return { ok: true, status: 200, json: async () => ({}) };
    }) as unknown as typeof fetch;
    const r = await fetchPersonalInsights(null, spyFetch);
    expect(r).toEqual({ kind: "no-analysis" });
    expect(called).toBe(false);
  });
});

describe("nextStateFromResult (mode foreground = clic utilisateur)", () => {
  const fg = { background: false };

  it("succès -> ready avec les blocs", async () => {
    const blocks = fullBlocks();
    const next = nextStateFromResult(
      await fetchPersonalInsights("a1", httpFetch(200, { blocks })),
      fg,
    );
    expect(next).toEqual({ status: "ready", blocks });
  });

  it("429 -> locked (paywall Premium, PAS une erreur)", async () => {
    const next = nextStateFromResult(await fetchPersonalInsights("a1", httpFetch(429)), fg);
    expect(next).toEqual({ status: "locked" });
  });

  it("503 -> error", async () => {
    const next = nextStateFromResult(await fetchPersonalInsights("a1", httpFetch(503)), fg);
    expect(next).toEqual({ status: "error" });
  });

  it("200 mais blocs incomplets (watch manquant) -> error", async () => {
    const partial = { goals: fullBlocks().goals, skin: fullBlocks().skin };
    const next = nextStateFromResult(
      await fetchPersonalInsights("a1", httpFetch(200, { blocks: partial })),
      fg,
    );
    expect(next).toEqual({ status: "error" });
  });

  it("coupure réseau -> error", async () => {
    const next = nextStateFromResult(await fetchPersonalInsights("a1", throwingFetch), fg);
    expect(next).toEqual({ status: "error" });
  });

  it("analysisId null -> error (bouton devra être désactivé)", async () => {
    const next = nextStateFromResult(await fetchPersonalInsights(null), fg);
    expect(next).toEqual({ status: "error" });
  });
});

describe("« Réessayer » : récupération après une erreur transitoire", () => {
  it("échec 503 puis re-clic réussi -> ready (le bouton fonctionne)", async () => {
    // 1er appel (chargement initial) : l'IA est indisponible -> 503.
    let call = 0;
    const flakyFetch = (async () => {
      call += 1;
      if (call === 1) return { ok: false, status: 503, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ blocks: fullBlocks() }) };
    }) as unknown as typeof fetch;

    const first = nextStateFromResult(await fetchPersonalInsights("a1", flakyFetch), { background: false });
    expect(first).toEqual({ status: "error" });

    // 2e appel = clic sur « Réessayer », l'IA répond cette fois.
    const second = nextStateFromResult(await fetchPersonalInsights("a1", flakyFetch), { background: false });
    expect(second?.status).toBe("ready");
    expect(call).toBe(2);
  });
});

describe("mode background (refresh silencieux) : on ne dégrade jamais l'UI", () => {
  const bg = { background: true };

  it("503 en background -> null (on garde les blocs affichés)", async () => {
    const next = nextStateFromResult(await fetchPersonalInsights("a1", httpFetch(503)), bg);
    expect(next).toBeNull();
  });

  it("429 en background -> null (pas de verrou pendant un refresh)", async () => {
    const next = nextStateFromResult(await fetchPersonalInsights("a1", httpFetch(429)), bg);
    expect(next).toBeNull();
  });

  it("succès en background -> ready (swap des blocs)", async () => {
    const blocks = fullBlocks();
    const next = nextStateFromResult(
      await fetchPersonalInsights("a1", httpFetch(200, { blocks })),
      bg,
    );
    expect(next).toEqual({ status: "ready", blocks });
  });
});

describe("hasAllBlocks", () => {
  it("true si les 3 blocs sont présents", () => {
    expect(hasAllBlocks(fullBlocks())).toBe(true);
  });
  it("false si un bloc manque ou null/undefined", () => {
    expect(hasAllBlocks(null)).toBe(false);
    expect(hasAllBlocks(undefined)).toBe(false);
    expect(hasAllBlocks({ goals: fullBlocks().goals } as unknown as PersonalBlocks)).toBe(false);
  });
});
