/**
 * Consentement utilisateur capturé à l'inscription.
 *
 * Stocké dans cosme_check.user_profiles.preferences.consent (racine, à côté de
 * `skin` et `onboardingShown`) :
 *   { cgu: true, marketing: bool, acceptedAt: ISO, version: number }
 *
 * Note RGPD : l'opt-in marketing (newsletter / offres) est SÉPARÉ de
 * l'acceptation obligatoire des CGU + politique de confidentialité, et doit
 * rester DÉCOCHÉ par défaut (pas de case pré-cochée). Seuls les inscrits avec
 * `marketing: true` sont synchronisés vers Brevo (cf. lib/brevo.ts).
 */

/** Version du texte de consentement. À incrémenter si les CGU changent et
 *  qu'on veut re-solliciter les utilisateurs existants. */
export const CONSENT_VERSION = 1;

export type Consent = {
  /** CGU + politique de confidentialité - obligatoire pour s'inscrire. */
  cgu: boolean;
  /** E-mails marketing (newsletter / offres) - opt-in optionnel. */
  marketing: boolean;
  /** Horodatage ISO du recueil du consentement. */
  acceptedAt: string;
  /** Version du texte de consentement acceptée. */
  version: number;
};

/**
 * Lit le consentement stocké. Renvoie `null` tant que les CGU obligatoires
 * n'ont pas été acceptées - un objet sans `cgu: true` n'est pas un
 * consentement valide.
 */
export function readConsent(
  prefs: Record<string, unknown> | null | undefined,
): Consent | null {
  if (!prefs || typeof prefs !== "object") return null;
  const raw = (prefs as { consent?: unknown }).consent;
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.cgu !== true) return null;
  return {
    cgu: true,
    marketing: r.marketing === true,
    acceptedAt: typeof r.acceptedAt === "string" ? r.acceptedAt : "",
    version: typeof r.version === "number" ? r.version : CONSENT_VERSION,
  };
}

/** `true` dès que l'utilisateur a accepté les CGU obligatoires. Utilisé par
 *  l'onboarding pour décider s'il faut afficher le modal de consentement avant
 *  les questions de profil (cas des inscriptions Google). */
export function hasConsent(
  prefs: Record<string, unknown> | null | undefined,
): boolean {
  return readConsent(prefs) !== null;
}

/** Construit l'objet consentement à persister (horodaté maintenant). */
export function buildConsent(marketing: boolean): Consent {
  return {
    cgu: true,
    marketing,
    acceptedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
}
