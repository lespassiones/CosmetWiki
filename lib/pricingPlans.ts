/**
 * Source unique des offres Premium affichées sur le site public.
 *
 * Pourquoi un module de données plutôt que du JSX en dur : l'abonnement se
 * prend aujourd'hui UNIQUEMENT dans l'app (App Store / Google Play), donc les
 * CTA de la section tarifs renvoient vers le téléchargement. On veut pouvoir
 * ouvrir plus tard un achat directement sur le site (voir la note ci-dessous)
 * sans réécrire la section : il suffira de donner un `checkoutPath` au plan et
 * de brancher le bouton dessus.
 *
 * FONDATIONS POUR L'ACHAT WEB (prévu, PAS encore actif)
 * ------------------------------------------------------
 * Objectif : laisser l'utilisateur payer sur cosme-check.com pour éviter la
 * commission des stores (15 à 30 %), puis retrouver son Premium quand il se
 * connecte dans l'app. Ce que ce module pose déjà :
 *   - `id` stable par plan, aligné sur les identifiants produits RevenueCat,
 *     pour que les deux canaux (store et web) désignent la même offre.
 *   - `priceCents` + `currency` en données, pas en texte : un futur checkout
 *     Stripe a besoin du montant, pas de la chaîne « 49,99 € ».
 *   - `stripePriceEnv` : nom de la variable d'environnement qui portera le
 *     `price_id` Stripe. Rien à deviner le jour où on l'active.
 *   - `checkoutPath` : `null` aujourd'hui (le CTA renvoie au téléchargement).
 *     Le jour où on active, on le renseigne et `LandingPricing` change de
 *     comportement tout seul.
 * Ce qui restera à faire ce jour-là (hors périmètre ici) : rattacher le
 * paiement à une identité (email de paiement + code d'activation dans l'app,
 * ou magic link), et déclarer l'achat à RevenueCat par son API afin que
 * `user_profiles.tier` et l'entitlement `premium` restent la seule vérité.
 */

export type BillingPeriod = "yearly" | "monthly";

export type PricingPlan = {
  /** Identifiant stable, aligné sur le produit RevenueCat correspondant. */
  id: string;
  period: BillingPeriod;
  /** Libellé du plan tel qu'affiché sur la carte. */
  name: string;
  /** Prix formaté pour l'affichage, en français. */
  priceLabel: string;
  /** Montant en centimes : c'est cette valeur qu'un checkout consommerait. */
  priceCents: number;
  currency: "EUR";
  /** Ligne secondaire sous le prix (équivalent mensuel, périodicité). */
  subLabel: string;
  /** Pastille d'accroche, ou `null` si le plan n'en porte pas. */
  badge: string | null;
  /** Plan mis en avant visuellement (un seul à la fois). */
  featured: boolean;
  /** Nom de la variable d'environnement du `price_id` Stripe (achat web). */
  stripePriceEnv: string;
  /**
   * Destination d'achat sur le site. `null` = pas d'achat web, le CTA renvoie
   * vers le téléchargement de l'app. Voir l'en-tête du fichier.
   */
  checkoutPath: string | null;
};

/**
 * 59,99 €/an et 9,99 €/mois : ce sont les prix facturés par l'App Store en
 * France (table `storePrices.generated.ts` de l'app, fiche App Store). Google
 * Play facture le mensuel 9,49 € : le site affiche le prix le plus haut pour ne
 * jamais annoncer moins que ce que le store facture. Ils doivent rester
 * alignés, sinon le site annonce un tarif que le store ne facture pas.
 */
export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: "cosmecheck_premium_yearly",
    period: "yearly",
    name: "Annuel",
    priceLabel: "59,99 €",
    priceCents: 5999,
    currency: "EUR",
    subLabel: "soit 5,00 €/mois",
    badge: "Économise 50 %",
    featured: true,
    stripePriceEnv: "STRIPE_PRICE_PREMIUM_YEARLY",
    checkoutPath: null,
  },
  {
    id: "cosmecheck_premium_monthly",
    period: "monthly",
    name: "Mensuel",
    priceLabel: "9,99 €",
    priceCents: 999,
    currency: "EUR",
    subLabel: "par mois",
    badge: null,
    featured: false,
    stripePriceEnv: "STRIPE_PRICE_PREMIUM_MONTHLY",
    checkoutPath: null,
  },
] as const;

/** Ce que Premium débloque. Repris mot pour mot du paywall de l'app. */
export const PREMIUM_BENEFITS: readonly string[] = [
  "Analyse de chaque produit personnalisée à ton profil",
  "Alternatives plus propres choisies pour toi",
  "Suggestions et conseils adaptés à ta peau",
  "Analyse des promesses produit selon ton profil",
  "Amélioration de ta routine, sur-mesure",
  "50 crédits par jour pour trouver les produits faits pour toi",
] as const;

/** Ce que le plan gratuit couvre, pour que la comparaison soit honnête. */
export const FREE_BENEFITS: readonly string[] = [
  "Scan du code-barres, photo, lien ou liste INCI",
  "Note de la formule et détail ingrédient par ingrédient",
  "Alertes sur tes ingrédients évités",
  "Crédits quotidiens offerts",
] as const;

export const TRIAL_LABEL = "Essai gratuit 3 jours";
export const BILLING_NOTICE =
  "Renouvellement automatique sauf annulation avant la fin de la période. Sans engagement, annulable en un tap depuis les réglages de ton téléphone.";

/**
 * `true` dès qu'un plan expose un `checkoutPath`. Tant que c'est `false`, la
 * section tarifs renvoie vers les stores : un seul test à faire côté UI.
 */
export function hasWebCheckout(plans: readonly PricingPlan[] = PRICING_PLANS): boolean {
  return plans.some((p) => p.checkoutPath !== null);
}
