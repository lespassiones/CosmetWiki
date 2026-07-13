/**
 * E2E (niveau route) de POST /api/personal-insights — on pilote le VRAI
 * handler, seules les frontières externes (Supabase, IA, profil/restrictions)
 * sont simulées. Objectif central : PROUVER le correctif du bug de crédit.
 *
 * LE BUG REPRODUIT : avant le correctif, le crédit était débité AVANT l'appel
 * IA. Une génération qui échoue (null -> 503, ou exception -> 500) débitait
 * quand même un crédit, et chaque « Réessayer » en rebrûlait un.
 * APRÈS correctif : gate en LECTURE SEULE (0 crédit -> 429 sans IA), puis débit
 * UNIQUEMENT après une génération réussie.
 *
 * Les tests "échec -> aucun débit" ÉCHOUENT sur l'ancien code (qui appelait
 * cosme_check_consume_credit avant la génération) : ils encodent la régression.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Fonctions de frontière, injectées dans les modules mockés (hoisted pour être
// visibles depuis les factories vi.mock).
const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  rpc: vi.fn(),
  generate: vi.fn(),
  loadProfile: vi.fn(),
  loadRestrictions: vi.fn(),
  checkRestrictions: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({}) }));

vi.mock("@/lib/supabase", () => {
  const sb = {
    auth: { getUser: (...a: unknown[]) => h.getUser(...a) },
    schema: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({ single: (...a: unknown[]) => h.single(...a) }),
        }),
        update: (...a: unknown[]) => {
          h.update(...a);
          return { eq: async () => ({ error: null }) };
        },
      }),
    }),
    rpc: (...a: unknown[]) => h.rpc(...a),
  };
  return { supabaseServer: () => sb };
});

// On garde le vrai module (profileSignature réel) et on ne remplace que la
// génération IA.
vi.mock("@/lib/ai/personalInsights", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/personalInsights")>();
  return { ...actual, generatePersonalBlocks: (...a: unknown[]) => h.generate(...a) };
});

vi.mock("@/lib/skin/promptFormat", () => ({
  loadProfileForPrompt: (...a: unknown[]) => h.loadProfile(...a),
}));
vi.mock("@/lib/restrictions/promptFormat", () => ({
  loadRestrictionsContext: (...a: unknown[]) => h.loadRestrictions(...a),
}));
vi.mock("@/lib/restrictions/check", () => ({
  checkRestrictions: (...a: unknown[]) => h.checkRestrictions(...a),
}));
vi.mock("@/lib/log", () => ({ logError: () => {} }));

import { POST } from "@/app/api/personal-insights/route";
import { profileSignature, type PersonalBlocks } from "@/lib/ai/personalInsights";

const PROFILE = "Peau grasse, objectif hydratation";

const fullBlocks = (): PersonalBlocks => ({
  goals: { title: "Cible ton hydratation", description: "d", tone: "vert" },
  skin: { title: "À quoi ça sert", description: "d", tone: "neutre" },
  watch: { title: "Rien à surveiller", description: "d", tone: "vert" },
});

const validRow = () => ({
  id: "a1",
  user_id: "user-1",
  product_label: "Crème X",
  product_type: "crème visage",
  category: "soin",
  score: 15,
  result_json: {
    items: [
      {
        position: 1,
        input: "AQUA",
        slug: "aqua",
        name: "Aqua",
        colorRating: "Vert",
        primaryFunction: "solvant",
        tags: [],
      },
    ],
    counts: { vert: 1, jaune: 0, orange: 0, rouge: 0 },
    scoreLabel: "Bon",
    scoreTone: "green",
  } as Record<string, unknown>,
});

async function call(analysisId = "a1") {
  const req = { json: async () => ({ analysisId }) } as unknown as Parameters<typeof POST>[0];
  return POST(req);
}

const rpcNames = () => h.rpc.mock.calls.map((c) => c[0]);
const consumeCalls = () => h.rpc.mock.calls.filter((c) => c[0] === "cosme_check_consume_credit");

beforeEach(() => {
  vi.clearAllMocks();
  h.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  h.single.mockResolvedValue({ data: validRow(), error: null });
  h.loadProfile.mockResolvedValue(PROFILE);
  h.loadRestrictions.mockResolvedValue({ block: null, restrictions: [], families: [] });
  h.checkRestrictions.mockReturnValue([]);
  h.generate.mockResolvedValue(fullBlocks());
  // Par défaut : utilisateur avec des crédits, débit OK.
  h.rpc.mockImplementation(async (name: string) => {
    if (name === "cosme_check_get_credits") return { data: { ok: true, used: 1, limit: 100, remaining: 99 } };
    if (name === "cosme_check_consume_credit") return { data: { ok: true, used: 2, limit: 100 } };
    return { data: null };
  });
});

describe("POST /api/personal-insights — débit du crédit", () => {
  it("BUG RÉGRESSION : génération indisponible (null -> 503) NE débite PAS de crédit", async () => {
    h.generate.mockResolvedValue(null);
    const res = await call();
    expect(res.status).toBe(503);
    expect(rpcNames()).toContain("cosme_check_get_credits"); // gate lecture seule
    expect(consumeCalls()).toHaveLength(0); // aucun débit
    expect(h.update).not.toHaveBeenCalled(); // rien de persisté
  });

  it("BUG RÉGRESSION : génération qui lève une exception (500) NE débite PAS de crédit", async () => {
    h.generate.mockRejectedValue(new Error("timeout IA"));
    const res = await call();
    expect(res.status).toBe(500);
    expect(consumeCalls()).toHaveLength(0);
    expect(h.update).not.toHaveBeenCalled();
  });

  it("génération réussie -> 200, débit d'EXACTEMENT 1 crédit, blocs persistés", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { blocks: PersonalBlocks };
    expect(body.blocks.goals.title).toBeTruthy();
    expect(consumeCalls()).toHaveLength(1);
    expect(consumeCalls()[0][1]).toEqual({ p_feature: "personal_insights" });
    expect(h.update).toHaveBeenCalledTimes(1);
    // Le débit intervient APRÈS la génération.
    const generateOrder = h.generate.mock.invocationCallOrder[0];
    const consumeOrder = h.rpc.mock.invocationCallOrder[h.rpc.mock.calls.findIndex((c) => c[0] === "cosme_check_consume_credit")];
    expect(consumeOrder).toBeGreaterThan(generateOrder);
  });

  it("0 crédit -> 429, AUCUN appel IA, AUCUN débit", async () => {
    h.rpc.mockImplementation(async (name: string) => {
      if (name === "cosme_check_get_credits") return { data: { ok: true, used: 100, limit: 100, remaining: 0 } };
      return { data: { ok: false } };
    });
    const res = await call();
    expect(res.status).toBe(429);
    expect(h.generate).not.toHaveBeenCalled();
    expect(consumeCalls()).toHaveLength(0);
  });

  it("course rare : crédit épuisé ENTRE le gate et le débit -> 429, rien persisté", async () => {
    h.rpc.mockImplementation(async (name: string) => {
      if (name === "cosme_check_get_credits") return { data: { ok: true, used: 99, limit: 100, remaining: 1 } };
      if (name === "cosme_check_consume_credit") return { data: { ok: false, used: 100, limit: 100 } };
      return { data: null };
    });
    const res = await call();
    expect(res.status).toBe(429);
    expect(h.generate).toHaveBeenCalledTimes(1); // on a généré...
    expect(h.update).not.toHaveBeenCalled(); // ...mais rien n'est persisté ni facturé
  });
});

describe("POST /api/personal-insights — contenu déjà payé", () => {
  it("régénération (clé périmée) -> succès SANS gate ni débit", async () => {
    const row = validRow();
    row.result_json.personalBlocks = fullBlocks();
    row.result_json.personalBlocksKey = "v1:vieille:cle"; // ne matchera pas la signature courante
    h.single.mockResolvedValue({ data: row, error: null });

    const res = await call();
    expect(res.status).toBe(200);
    expect(h.generate).toHaveBeenCalledTimes(1);
    expect(rpcNames()).not.toContain("cosme_check_get_credits");
    expect(consumeCalls()).toHaveLength(0);
  });

  it("relecture gratuite (clé à jour) -> renvoie direct, AUCUNE IA, AUCUN crédit", async () => {
    const sig = profileSignature(PROFILE, null);
    const row = validRow();
    const blocks = fullBlocks();
    row.result_json.personalBlocks = blocks;
    row.result_json.personalBlocksKey = sig;
    h.single.mockResolvedValue({ data: row, error: null });

    const res = await call();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { blocks: PersonalBlocks };
    expect(body.blocks.goals.title).toBe(blocks.goals.title);
    expect(h.generate).not.toHaveBeenCalled();
    expect(rpcNames()).toHaveLength(0);
  });
});

describe("POST /api/personal-insights — garde-fous auth/entrée", () => {
  it("body invalide (JSON KO) -> 400", async () => {
    const req = {
      json: async () => {
        throw new Error("bad json");
      },
    } as unknown as Parameters<typeof POST>[0];
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(h.generate).not.toHaveBeenCalled();
  });

  it("analysisId manquant -> 400", async () => {
    const res = await call("");
    expect(res.status).toBe(400);
  });

  it("non authentifié -> 401, aucune IA, aucun crédit", async () => {
    h.getUser.mockResolvedValue({ data: { user: null } });
    const res = await call();
    expect(res.status).toBe(401);
    expect(h.generate).not.toHaveBeenCalled();
    expect(rpcNames()).toHaveLength(0);
  });

  it("analyse introuvable -> 404", async () => {
    h.single.mockResolvedValue({ data: null, error: { message: "not found" } });
    const res = await call();
    expect(res.status).toBe(404);
    expect(h.generate).not.toHaveBeenCalled();
  });

  it("analyse d'un autre utilisateur -> 403", async () => {
    const row = validRow();
    row.user_id = "someone-else";
    h.single.mockResolvedValue({ data: row, error: null });
    const res = await call();
    expect(res.status).toBe(403);
    expect(h.generate).not.toHaveBeenCalled();
    expect(consumeCalls()).toHaveLength(0);
  });
});
