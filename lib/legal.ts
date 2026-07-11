/**
 * Informations légales centralisées, utilisées par les pages /mentions-legales,
 * /confidentialite et /cgu. Mets à jour ce fichier si l'identité juridique de
 * Cosme Check change (création société, changement d'adresse, etc.).
 */

export const LEGAL = {
  siteName: "Cosme Check",
  siteUrl: "https://www.cosme-check.com",
  contactEmail: "contact@cosme-check.com",

  // Éditeur du site.
  publisher: {
    name: "Brian-Clarky BIENDOU",
    status: "Entrepreneur individuel (EI)",
    address: "5 Bis rue Vestrepain, 31100 Toulouse, France",
    director: "Brian-Clarky BIENDOU", // directeur de la publication
    siret: "919 153 189 00015" as string | null,
    siren: "919 153 189",
    rcs: "RCS Toulouse 919 153 189",
    tva: "FR33919153189", // TVA intracommunautaire
    ape: "8559B", // code APE / NAF
  },

  // Hébergeurs - déclaration obligatoire (LCEN, art. 6).
  // `host` = hébergeur du site web ; `dbHost` = hébergeur de la base de données.
  host: {
    name: "Vercel Inc.",
    address: "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
    website: "https://vercel.com",
  },
  dbHost: {
    name: "Supabase Inc.",
    address:
      "Base de données et authentification, hébergées sur AWS eu-west-1 (Irlande, Union européenne)",
    website: "https://supabase.com",
  },

  // Base de données / Auth - pour la politique de confidentialité.
  dataProcessors: [
    {
      name: "Supabase Inc.",
      role: "Hébergement de la base de données et gestion des comptes utilisateurs",
      location: "États-Unis / Union européenne (Francfort)",
      website: "https://supabase.com/privacy",
    },
    {
      name: "Vercel Inc.",
      role: "Hébergement du site et analytics anonymes",
      location: "États-Unis",
      website: "https://vercel.com/legal/privacy-policy",
    },
    {
      name: "Google LLC",
      role: "Authentification optionnelle « Se connecter avec Google »",
      location: "États-Unis / Irlande",
      website: "https://policies.google.com/privacy",
    },
    {
      name: "OpenAI, L.L.C.",
      role: "Analyses INCI, assistant beauté et génération de résumés (transfert hors UE encadré par les Clauses Contractuelles Types)",
      location: "États-Unis",
      website: "https://openai.com/policies/privacy-policy",
    },
    {
      name: "Mistral AI SAS",
      role: "Traitement par intelligence artificielle des analyses INCI et de l'assistant (société française, hébergement principalement dans l'Union européenne)",
      location: "Union européenne (France)",
      website: "https://mistral.ai/fr/terms/#privacy-policy",
    },
    {
      name: "Stripe, Inc.",
      role: "Gestion des paiements et abonnements (aucune donnée bancaire complète ne transite ni n'est stockée par nos serveurs ; transfert hors UE encadré par les Clauses Contractuelles Types)",
      location: "États-Unis",
      website: "https://stripe.com/fr/privacy",
    },
    {
      name: "PostHog Inc.",
      role: "Mesure d'audience anonyme (statistiques de fréquentation sans cookie publicitaire ni identifiant nominatif), hébergée dans l'Union européenne (eu.i.posthog.com)",
      location: "Union européenne",
      website: "https://posthog.com/privacy",
    },
    {
      name: "Brevo (Sendinblue SAS)",
      role: "Gestion des contacts inscrits pour les communications de service liées au compte, et envoi de newsletters / emails marketing uniquement aux utilisateurs ayant donné leur consentement explicite (opt-in)",
      location: "Union européenne (France)",
      website: "https://www.brevo.com/fr/legal/privacypolicy/",
    },
  ],

  lastUpdated: "10 juillet 2026",
} as const;
