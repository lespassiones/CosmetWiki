import { supabaseAnon, type ColorRating } from "./supabase";

/**
 * Item d'ingrédient pour les pages d'index (glossaire + catégories).
 * Volontairement plus léger que le type `Ingredient` complet : on n'a
 * besoin que de quoi rendre la ligne d'une liste.
 */
export type IngredientListItem = {
  slug: string;
  name: string;
  color_rating: ColorRating;
  prevalence_pct: number | null;
};

/** Lettres affichées dans le sommaire du glossaire. `0` = chiffres. */
export const GLOSSARY_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "0",
] as const;

export type GlossaryLetter = (typeof GLOSSARY_LETTERS)[number];

export function isValidLetter(value: string): value is GlossaryLetter {
  return (GLOSSARY_LETTERS as readonly string[]).includes(value);
}

export function letterLabel(letter: GlossaryLetter): string {
  return letter === "0" ? "0-9" : letter;
}

/**
 * Filtre + cast : ne garde que les items dont la forme JSONB correspond.
 */
function asIngredientItems(data: unknown): IngredientListItem[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (it): it is IngredientListItem =>
      typeof it === "object" &&
      it !== null &&
      typeof (it as Record<string, unknown>).slug === "string" &&
      typeof (it as Record<string, unknown>).name === "string",
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exécute une RPC avec retry + backoff exponentiel (1s, 2s, 4s, 8s).
 *
 * Pourquoi : Supabase est derrière Cloudflare. Quand on rebuild Cosme Check,
 * Vercel envoie ~4 workers qui pré-rendent 27 lettres + 13 catégories en
 * rafale depuis la même IP datacenter. Cloudflare prend ça pour une attaque
 * et renvoie une page HTML de challenge à la place du JSON. supabase-js
 * échoue le parse et la page se génère vide — pire, dans certains cas Next.js
 * abandonne le worker après 3 tentatives rapprochées. Le backoff laisse à
 * Cloudflare le temps de relâcher (en général <10 s).
 */
/** Budget total < timeout serverless Vercel Hobby (10 s).
 *  Pire cas : 2 tentatives × 3 s + 1 s backoff = 7 s. Marge ~3 s pour le
 *  rendering. Si Supabase ne répond pas dans ce budget, on accepte une page
 *  vide plutôt qu'un 500 — l'utilisateur peut recharger. */
const RPC_PER_ATTEMPT_TIMEOUT_MS = 3000;

async function rpcWithRetry(
  rpcName: string,
  params: Record<string, unknown>,
  context: string,
): Promise<IngredientListItem[]> {
  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await Promise.race([
        supabaseAnon().rpc(rpcName, params),
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(
            () => resolve({ data: null, error: { message: "client_timeout" } }),
            RPC_PER_ATTEMPT_TIMEOUT_MS,
          ),
        ),
      ]);
      if (!error) return asIngredientItems(data);
      console.warn(
        `[glossary] ${rpcName} ${context} attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
        error.message,
      );
    } catch (err) {
      console.warn(
        `[glossary] ${rpcName} ${context} attempt ${attempt}/${MAX_ATTEMPTS} threw:`,
        err instanceof Error ? err.message : String(err),
      );
    }
    if (attempt < MAX_ATTEMPTS) {
      await sleep(1000);
    }
  }
  return [];
}

/**
 * Récupère tous les ingrédients commençant par une lettre via la RPC
 * `cosme_check_list_ingredients_by_letter` (retourne JSONB pour contourner
 * le cap PostgREST). Retourne [] en cas d'erreur, jamais null.
 */
export async function fetchIngredientsByLetter(
  letter: GlossaryLetter,
): Promise<IngredientListItem[]> {
  return rpcWithRetry(
    "cosme_check_list_ingredients_by_letter",
    { p_letter: letter },
    `letter=${letter}`,
  );
}

/** Récupère tous les ingrédients portant un tag donné (silicone, paraben...). */
export async function fetchIngredientsByTag(
  tag: string,
): Promise<IngredientListItem[]> {
  return rpcWithRetry(
    "cosme_check_list_ingredients_by_tag",
    { p_tag: tag },
    `tag=${tag}`,
  );
}

// ===========================================================================
// Catégories grand public
// ===========================================================================
//
// Chaque catégorie est exposée à l'URL /ingredients/<slug>. Le `tag` est la
// valeur recherchée dans la colonne `cosme_check.ingredients.tags`. La liste
// est éditoriale (ce qu'on veut promouvoir côté SEO/GEO) plutôt qu'une dump
// brute de tous les tags Postgres.

export type Category = {
  slug: string;
  tag: string;
  title: string;
  shortLabel: string;
  description: string;
  /** Phrase d'accroche utilisée dans le H1 / la metadata. */
  intro: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "silicones",
    tag: "silicone",
    title: "Silicones",
    shortLabel: "Silicones",
    description:
      "Tous les silicones référencés dans notre base : diméthicone, cyclopentasiloxane, amodiméthicone et leurs dérivés. Famille de polymères très utilisée pour la texture, mais à l'impact environnemental discuté.",
    intro:
      "La liste complète des silicones cosmétiques, classés par couleur de score et par prévalence dans les produits.",
  },
  {
    slug: "parabens",
    tag: "paraben",
    title: "Parabens",
    shortLabel: "Parabens",
    description:
      "Tous les parabens utilisés comme conservateurs en cosmétique. Methylparaben, ethylparaben, propylparaben, butylparaben : certains font consensus, d'autres restent controversés.",
    intro:
      "La liste des parabens présents dans les cosmétiques, avec leur statut réglementaire actuel.",
  },
  {
    slug: "conservateurs",
    tag: "conservateur",
    title: "Conservateurs",
    shortLabel: "Conservateurs",
    description:
      "Tous les conservateurs cosmétiques répertoriés : indispensables pour empêcher la contamination microbienne, mais variables en tolérance cutanée. Du sorbate de potassium à la méthylisothiazolinone.",
    intro:
      "La liste des conservateurs autorisés en cosmétique, du plus consensuel au plus controversé.",
  },
  {
    slug: "filtres-uv",
    tag: "filtre-uv",
    title: "Filtres UV",
    shortLabel: "Filtres UV",
    description:
      "Filtres minéraux et filtres chimiques utilisés dans les crèmes solaires. Oxyde de zinc, dioxyde de titane, octocrylène, avobenzone, ensulizole et les nouveaux filtres approuvés en Europe.",
    intro:
      "La liste des filtres UV utilisés dans les solaires et soins SPF, avec leur niveau de tolérance.",
  },
  {
    slug: "huiles-essentielles",
    tag: "huile-essentielle",
    title: "Huiles essentielles",
    shortLabel: "Huiles essentielles",
    description:
      "Toutes les huiles essentielles utilisées en cosmétique. Lavande, tea-tree, menthe poivrée, ylang-ylang… naturelles oui, mais souvent allergisantes et toxiques pendant la grossesse.",
    intro:
      "La liste des huiles essentielles en cosmétique, avec leur potentiel allergisant et leurs précautions d'usage.",
  },
  {
    slug: "sulfates",
    tag: "sulfate",
    title: "Sulfates",
    shortLabel: "Sulfates",
    description:
      "Tensioactifs sulfatés utilisés dans shampoings, gels douche et nettoyants. SLS (sodium lauryl sulfate), SLES, ALS… très moussants mais parfois irritants pour les peaux sensibles.",
    intro:
      "La liste des sulfates utilisés en cosmétique, avec leur niveau d'irritation cutanée.",
  },
  {
    slug: "allergenes-parfumants",
    tag: "allergene-parfumant",
    title: "Allergènes parfumants",
    shortLabel: "Allergènes parfumants",
    description:
      "Les 26 allergènes parfumants dont la déclaration est obligatoire sur l'étiquette des cosmétiques en Europe : linalool, limonene, géraniol, citronellol, citral… Source fréquente d'eczéma de contact.",
    intro:
      "Les 26 allergènes parfumants obligatoirement déclarés sur les étiquettes cosmétiques européennes.",
  },
  {
    slug: "colorants-synthese",
    tag: "colorant-synthese",
    title: "Colorants de synthèse",
    shortLabel: "Colorants de synthèse",
    description:
      "Tous les colorants de synthèse utilisés en cosmétique, identifiables par leur numéro CI (Colour Index). Du CI 14700 au CI 77000, leur tolérance varie selon leur composition chimique.",
    intro:
      "La liste des colorants de synthèse (codes CI) utilisés dans les maquillages, soins teintés et shampoings.",
  },
  {
    slug: "huiles-minerales",
    tag: "huile-minerale",
    title: "Huiles minérales",
    shortLabel: "Huiles minérales",
    description:
      "Toutes les huiles minérales issues de la pétrochimie : paraffinum liquidum, cera microcristallina, petrolatum… Très occlusives, leur intérêt cosmétique est réel mais leur impact environnemental discuté.",
    intro:
      "La liste des huiles minérales et dérivés du pétrole utilisés en cosmétique.",
  },
  {
    slug: "parfums-synthese",
    tag: "parfum-synthese",
    title: "Parfums de synthèse",
    shortLabel: "Parfums de synthèse",
    description:
      "Tous les composés parfumants de synthèse cachés derrière la mention « Parfum » ou « Fragrance » sur les étiquettes. Source la plus fréquente d'allergie de contact en cosmétique.",
    intro:
      "La liste des composés parfumants de synthèse utilisés en cosmétique.",
  },
  {
    slug: "ammoniums-quaternaires",
    tag: "ammonium-quaternaire",
    title: "Ammoniums quaternaires",
    shortLabel: "Ammoniums quaternaires",
    description:
      "Tensioactifs cationiques utilisés en soin capillaire (conditionneurs, après-shampoings, masques). Behentrimonium, cetrimonium, polyquaternium… ils gainent la fibre capillaire et facilitent le démêlage.",
    intro:
      "La liste des ammoniums quaternaires utilisés dans les soins capillaires.",
  },
  {
    slug: "ingredients-cmr",
    tag: "cmr",
    title: "Substances CMR (Cancérigène, Mutagène, Reprotoxique)",
    shortLabel: "Substances CMR",
    description:
      "Substances classées CMR (Cancérigène, Mutagène ou Reprotoxique) selon la réglementation européenne CLP. Leur usage en cosmétique est strictement encadré, voire interdit.",
    intro:
      "Les substances classées Cancérigène, Mutagène ou Reprotoxique repérées dans la base.",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/**
 * Compte des ingrédients par lettre, pour l'index /glossaire.
 *
 * Une seule requête Supabase (RPC `cosme_check_letter_counts`) qui renvoie
 * un dictionnaire `{ "A": 1285, "B": 700, … }`. Payload ~270 octets — sans
 * commune mesure avec la version précédente qui tapait 27 RPC en parallèle
 * pour ramener ~1 Mo juste pour compter des items.
 *
 * Robustesse : retry + timeout (cf. `rpcWithRetry` ci-dessus). Si tout
 * échoue, on renvoie les compteurs à zéro — la page rend, le glossaire
 * affiche "Aucun" pour chaque lettre, l'utilisateur peut quand même cliquer
 * et la page enfant se chargera correctement (les liens ne dépendent pas
 * des counts). C'est OK pour une dégradation transitoire.
 */
/** Budget total : 2 tentatives × 3 s + 1 s backoff = 7 s max. Sous le
 *  timeout Vercel Hobby (10 s) avec marge pour le rendering. */
const LETTER_COUNTS_TIMEOUT_MS = 3000;

export async function getLetterCounts(): Promise<Record<GlossaryLetter, number>> {
  const result = {} as Record<GlossaryLetter, number>;
  for (const letter of GLOSSARY_LETTERS) result[letter] = 0;

  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await Promise.race([
        supabaseAnon().rpc("cosme_check_letter_counts"),
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(
            () => resolve({ data: null, error: { message: "client_timeout" } }),
            LETTER_COUNTS_TIMEOUT_MS,
          ),
        ),
      ]);
      if (error) {
        console.warn(
          `[glossary] letter_counts attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
          error.message,
        );
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
          if (isValidLetter(key) && typeof value === "number") {
            result[key] = value;
          }
        }
        return result;
      }
    } catch (err) {
      console.warn(
        `[glossary] letter_counts attempt ${attempt}/${MAX_ATTEMPTS} threw:`,
        err instanceof Error ? err.message : String(err),
      );
    }
    if (attempt < MAX_ATTEMPTS) {
      await sleep(1000);
    }
  }
  return result;
}
