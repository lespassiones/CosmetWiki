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

// ─── Programme BÊTA ─────────────────────────────────────────────────────────
// Liste dédiée « Cosme Check — Bêta testeurs » + email transactionnel d'accès.
// L'attribut BETA_FEEDBACK (booléen) sert de drapeau « retour donné » : laissé
// absent à l'inscription (= relance possible) puis passé à true quand le
// testeur remplit /beta/retour → le scénario d'automatisation Brevo lit ce
// drapeau pour arrêter les relances. Tout est fail-open.

const LIST_BETA_NAME = "Cosme Check — Bêta testeurs";
let cachedBetaListId: number | null | undefined;

function betaSender(): { name: string; email: string } {
  return {
    name: "Cosme Check",
    email: process.env.BREVO_SENDER_EMAIL ?? "contact@cosme-check.com",
  };
}

async function resolveBetaListId(apiKey: string): Promise<number | null> {
  if (cachedBetaListId !== undefined) return cachedBetaListId;
  let id = parseId(process.env.BREVO_BETA_LIST_ID);
  if (id == null) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/contacts/lists?limit=50&offset=0`,
        { headers: apiHeaders(apiKey) },
      );
      if (res.ok) {
        const data = (await res.json()) as { lists?: { id: number; name: string }[] };
        id = data.lists?.find((l) => l.name === LIST_BETA_NAME)?.id ?? null;
      }
    } catch (e) {
      console.warn("[brevo] resolveBetaListId error:", e);
    }
  }
  cachedBetaListId = id;
  return cachedBetaListId;
}

/** Ajoute (ou met à jour) le contact dans la liste « Bêta testeurs ».
 *  On NE touche PAS BETA_FEEDBACK ici → il reste absent = éligible aux relances
 *  (ne réinitialise pas un testeur ayant déjà répondu s'il se réinscrit). */
export async function addBetaContact(input: {
  email: string;
  firstName?: string | null;
  /** Lien de retour personnalisé (avec token) → stocké dans l'attribut
   *  BETA_URL pour que l'email de relance Brevo puisse l'injecter via
   *  {{ contact.BETA_URL }}. */
  feedbackUrl?: string | null;
}): Promise<BrevoSyncResult> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return { synced: false, reason: "no-api-key" };

    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) return { synced: false, reason: "bad-email" };

    const listId = await resolveBetaListId(apiKey);
    const base: Record<string, unknown> = {
      email,
      updateEnabled: true,
      ...(listId != null ? { listIds: [listId] } : {}),
    };
    const firstName = (input.firstName ?? "").trim();
    const attributes: Record<string, unknown> = {};
    if (firstName) attributes.PRENOM = firstName;
    if (input.feedbackUrl) attributes.BETA_URL = input.feedbackUrl;
    const hasAttrs = Object.keys(attributes).length > 0;
    const withAttrs = hasAttrs ? { ...base, attributes } : base;

    let res = await postContact(apiKey, withAttrs);
    if (res.status === 400 && hasAttrs) res = await postContact(apiKey, base);

    if (!res.ok) {
      console.warn("[brevo] beta contact failed:", res.status, await safeBody(res));
      return { synced: false, reason: `http-${res.status}` };
    }
    return { synced: true };
  } catch (e) {
    console.warn("[brevo] beta contact error:", e);
    return { synced: false, reason: "error" };
  }
}

/** Passe BETA_FEEDBACK=true sur le contact → coupe les relances Brevo. */
export async function setBetaFeedbackDone(email: string): Promise<BrevoSyncResult> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return { synced: false, reason: "no-api-key" };
    const em = email.trim().toLowerCase();
    const res = await fetchWithTimeout(
      `${API_BASE}/contacts/${encodeURIComponent(em)}`,
      {
        method: "PUT",
        headers: apiHeaders(apiKey),
        body: JSON.stringify({ attributes: { BETA_FEEDBACK: true } }),
      },
    );
    if (!res.ok) {
      console.warn("[brevo] setBetaFeedbackDone failed:", res.status, await safeBody(res));
      return { synced: false, reason: `http-${res.status}` };
    }
    return { synced: true };
  } catch (e) {
    console.warn("[brevo] setBetaFeedbackDone error:", e);
    return { synced: false, reason: "error" };
  }
}

// IDs des templates transactionnels Brevo du programme bêta. Le CONTENU des
// emails vit dans Brevo (modifiable dans l'UI sans redéploiement) ; le code ne
// fait qu'envoyer par templateId. La personnalisation ({{contact.PRENOM}},
// {{contact.BETA_URL}}) est résolue par Brevo depuis les attributs du contact —
// addBetaContact doit donc avoir été appelé AVANT tout envoi.
const BETA_TEMPLATES = {
  /** 1. Accès — invitation au lancement d'une phase. */
  access: () => parseId(process.env.BREVO_TPL_BETA_ACCESS) ?? 1,
  /** 2. Relance « pas encore testé » (pas ouvert / pas cliqué / pas de compte). */
  relance: () => parseId(process.env.BREVO_TPL_BETA_RELANCE) ?? 2,
  /** 3. Demande de retour (compte créé, pas encore de feedback). */
  feedback: () => parseId(process.env.BREVO_TPL_BETA_FEEDBACK) ?? 3,
  /** 4. Merci (formulaire rempli). */
  merci: () => parseId(process.env.BREVO_TPL_BETA_MERCI) ?? 4,
} as const;

export type BetaTemplateKind = keyof typeof BETA_TEMPLATES;

/** Envoie un email transactionnel bêta via son template Brevo. Fail-open. */
export async function sendBetaTemplateEmail(
  kind: BetaTemplateKind,
  input: { email: string; firstName?: string | null },
): Promise<BrevoSyncResult> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return { synced: false, reason: "no-api-key" };

    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) return { synced: false, reason: "bad-email" };
    const firstName = (input.firstName ?? "").trim();

    const res = await fetchWithTimeout(`${API_BASE}/smtp/email`, {
      method: "POST",
      headers: apiHeaders(apiKey),
      body: JSON.stringify({
        templateId: BETA_TEMPLATES[kind](),
        to: [{ email, ...(firstName ? { name: firstName } : {}) }],
        tags: [`beta-${kind}`],
      }),
    });

    if (!res.ok) {
      console.warn(`[brevo] beta ${kind} email failed:`, res.status, await safeBody(res));
      return { synced: false, reason: `http-${res.status}` };
    }
    return { synced: true };
  } catch (e) {
    console.warn(`[brevo] beta ${kind} email error:`, e);
    return { synced: false, reason: "error" };
  }
}

/** Email d'INVITATION (envoyé au lancement d'une phase) via le template Brevo
 *  « Bêta — 1. Accès ». Le lien de retour (BETA_URL) et le prénom (PRENOM)
 *  sont lus depuis les attributs du contact. Fail-open. */
export async function sendBetaInvitationEmail(input: {
  email: string;
  firstName?: string | null;
  /** Conservés pour compat : les URLs vivent désormais dans le template /
   *  les attributs du contact (BETA_URL). */
  accessUrl?: string;
  feedbackUrl?: string;
}): Promise<BrevoSyncResult> {
  return sendBetaTemplateEmail("access", input);
}
