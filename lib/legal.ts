/**
 * Informations légales centralisées, utilisées par les pages /mentions-legales,
 * /confidentialite et /cgu. Mets à jour ce fichier si l'identité juridique de
 * Cosme Check change (création société, changement d'adresse, etc.).
 */

export const LEGAL = {
  siteName: "Cosme Check",
  siteUrl: "https://www.cosme-check.com",
  contactEmail: "contact@cosme-check.com",

  // Éditeur du site - à compléter avec ta situation réelle.
  publisher: {
    name: "Brian Biendou",
    status: "Particulier", // ex: "Auto-entrepreneur", "SAS Cosme Check", etc.
    address: "À compléter", // adresse postale obligatoire
    director: "Brian Biendou",
    siret: null as string | null, // mets ton SIRET ici si tu es immatriculé
  },

  // Hébergeur - déclaration obligatoire (LCEN, art. 6).
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
    website: "https://vercel.com",
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
      role: "Analyse OCR des photos et génération de résumés (les images ne sont pas stockées par OpenAI)",
      location: "États-Unis",
      website: "https://openai.com/policies/privacy-policy",
    },
  ],

  lastUpdated: "16 mai 2026",
} as const;
