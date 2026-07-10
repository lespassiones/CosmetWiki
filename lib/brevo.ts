/**
 * Synchro Brevo — CÔTÉ SERVEUR UNIQUEMENT (ne jamais importer côté client :
 * la clé BREVO_API_KEY est un secret).
 *
 * Modèle à DEUX listes (décidé avec l'utilisateur) :
 *   - « Tous les inscrits » (BREVO_LIST_ALL_ID)  : TOUT LE MONDE, opt-in ou non.
 *     Sert aux communications de SERVICE (panne, info importante) — pas de pub.
 *   - « Newsletter » (BREVO_LIST_NEWSLETTER_ID)  : uniquement les inscrits ayant
 *     coché l'opt-in marketing. Sert aux newsletters / offres.
 *
 * L'attribut booléen Brevo `OPT_IN` reflète le choix marketing (segmentation).
 *
 * Robustesse : tout est FAIL-OPEN. Si la clé est absente, si Brevo répond une
 * erreur ou si le réseau lâche, on log et on renvoie `{ synced: false }` — on
 * ne bloque JAMAIS l'inscription de l'utilisateur pour un souci Brevo.
 */

const API_BASE = "https://api.brevo.com/v3";
const LIST_ALL_NAME = "Cosme Check — Tous les inscrits";
const LIST_NEWSLETTER_NAME = "Cosme Check — Newsletter";
const TIMEOUT_MS = 5000;

export type BrevoSyncInput = {
  email: string;
  firstName?: string | null;
  /** `true` = a coché l'opt-in newsletter ; `false` = inscrit sans opt-in. */
  marketing: boolean;
};

export type BrevoSyncResult = { synced: boolean; reason?: string };

type ResolvedLists = { all: number | null; newsletter: number | null };

/** IDs de listes résolus, mémoïsés par instance serveur. */
let cachedLists: ResolvedLists | undefined;

function apiHeaders(apiKey: string): HeadersInit {
  return {
    "api-key": apiKey,
    accept: "application/json",
    "content-type": "application/json",
  };
}

function parseId(v: string | undefined): number | null {
  return v && /^\d+$/.test(v) ? Number(v) : null;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function safeBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "";
  }
}

/**
 * Résout les IDs des deux listes. Priorité aux variables d'env
 * (BREVO_LIST_ALL_ID / BREVO_LIST_NEWSLETTER_ID) ; à défaut, recherche par nom.
 * Mémoïsé pour ne pas rappeler Brevo à chaque inscription.
 */
async function resolveLists(apiKey: string): Promise<ResolvedLists> {
  if (cachedLists) return cachedLists;

  let all = parseId(process.env.BREVO_LIST_ALL_ID);
  let newsletter = parseId(process.env.BREVO_LIST_NEWSLETTER_ID);

  if (all == null || newsletter == null) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/contacts/lists?limit=50&offset=0`,
        { headers: apiHeaders(apiKey) },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          lists?: { id: number; name: string }[];
        };
        const lists = data.lists ?? [];
        if (all == null) all = lists.find((l) => l.name === LIST_ALL_NAME)?.id ?? null;
        if (newsletter == null)
          newsletter = lists.find((l) => l.name === LIST_NEWSLETTER_NAME)?.id ?? null;
      }
    } catch (e) {
      console.warn("[brevo] resolveLists error:", e);
    }
  }

  cachedLists = { all, newsletter };
  return cachedLists;
}

async function postContact(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetchWithTimeout(`${API_BASE}/contacts`, {
    method: "POST",
    headers: apiHeaders(apiKey),
    body: JSON.stringify(body),
  });
}

/**
 * Crée ou met à jour le contact Brevo d'un inscrit.
 * - Toujours ajouté à la liste « Tous les inscrits ».
 * - Ajouté EN PLUS à la liste « Newsletter » si `marketing === true`.
 * Fail-open : ne lève jamais.
 */
export async function syncBrevoContact(
  input: BrevoSyncInput,
): Promise<BrevoSyncResult> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return { synced: false, reason: "no-api-key" };

    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) return { synced: false, reason: "bad-email" };

    const { all, newsletter } = await resolveLists(apiKey);
    const listIds: number[] = [];
    if (all != null) listIds.push(all);
    if (input.marketing && newsletter != null) listIds.push(newsletter);

    const base: Record<string, unknown> = {
      email,
      updateEnabled: true, // ajoute aux listes / met à jour si déjà présent
      ...(listIds.length ? { listIds } : {}),
    };

    const firstName = (input.firstName ?? "").trim();
    const attributes: Record<string, unknown> = { OPT_IN: input.marketing };
    if (firstName) attributes.PRENOM = firstName;

    let res = await postContact(apiKey, { ...base, attributes });

    // Si un attribut est refusé (400), on réessaie sans attribut pour ne JAMAIS
    // perdre l'inscription à cause d'un souci de champ.
    if (res.status === 400) {
      res = await postContact(apiKey, base);
    }

    if (!res.ok) {
      console.warn("[brevo] contact sync failed:", res.status, await safeBody(res));
      return { synced: false, reason: `http-${res.status}` };
    }

    return { synced: true };
  } catch (e) {
    console.warn("[brevo] contact sync error:", e);
    return { synced: false, reason: "error" };
  }
}
