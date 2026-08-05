/**
 * categoryResolve — résolution ROBUSTE de la catégorie servant à chercher des
 * « alternatives » (produits similaires) sur l'écran d'analyse.
 *
 * POURQUOI CE MODULE (bug bêta « alternatives sans rapport avec le visage », juil 2026) :
 * un nettoyant visage (« Gel de Limpeza Facial CeraVe ») affichait comme alternatives
 * un savon pour les mains, un gel gingival bébé, un gel pour les jambes, des lingettes…
 * Cause : la colonne `catalog.category` MÉLANGE deux taxonomies :
 *   - une taxonomie propre, hiérarchique (95 % des produits) :
 *       « soin-du-corps-et-visage/nettoyant-visage/gel-nettoyant-visage »
 *   - des catégories POUBELLE mono-token / labels bruts (5 % ≈ 23 k produits) :
 *       « gel », « coiffure », « Crème solaire adulte », « sunscreen », null…
 * Le produit fautif était rangé dans le bucket « gel » → l'appariement exact par
 * catégorie renvoyait TOUT ce qui contient « gel », toutes fonctions confondues.
 *
 * STRATÉGIE (du plus fiable au moins fiable), qui garantit qu'on ne pivote JAMAIS
 * sur un bucket dénué de sens :
 *   1. Catégorie catalogue SI c'est un slug SPÉCIFIQUE (≥ 2 niveaux `a/b`) → match EXACT.
 *      Les buckets poubelle (mono-token, labels, null) sont REJETÉS.
 *   2. `product_type` (fonction décrite par l'analyseur) → préfixe de taxonomie `l1/l2/%`
 *      → recherche LIKE (large mais cohérente). Robuste aux noms marketing.
 *   3. Nom du produit → mêmes règles, mais UNIQUEMENT sur mot-clé fonctionnel fort
 *      (jamais le fourre-tout « crème ») → dernier recours pour les produits sans
 *      signal fiable (ex. produit étranger hors catalogue, product_type null).
 *   4. Aucun signal fiable → ABSTENTION (`null`) : on préfère n'afficher AUCUNE
 *      alternative plutôt qu'une reco hors-sujet. C'est la garantie « plus jamais ».
 *
 * Tout est PUR (aucune dépendance réseau/DB) → testable en Vitest
 * (tests/alternativesCategory.test.ts). Miroir du module mobile
 * `lib/catalog/productTypeCategory.ts` : garder les deux cohérents lors d'un
 * ajout de catégorie.
 */

/** Enlève les diacritiques + minuscule (comparaison insensible casse/accents). */
const COMBINING = /[̀-ͯ]/g;

export function normalizeType(v: string | null | undefined): string {
  return (v ?? "").normalize("NFD").replace(COMBINING, "").toLowerCase().trim();
}

/**
 * Une catégorie est « spécifique » (utilisable en match EXACT pour les
 * alternatives) SEULEMENT si c'est un slug hiérarchique d'au moins 2 niveaux
 * (« a/b » ou « a/b/c »). Ce simple test élimine tous les buckets poubelle
 * observés en prod : mono-token (« gel », « coiffure », « sunscreen »), labels
 * bruts (« Crème solaire adulte »), top-level seul (« soin-du-corps-et-visage »),
 * et null — tout en gardant les 95 % de produits correctement catégorisés.
 */
export function isSpecificCategorySlug(
  category: string | null | undefined,
): boolean {
  if (!category) return false;
  const c = category.trim();
  // Un slug propre ne contient pas d'espace ; il a ≥ 1 séparateur `/` avec des
  // segments non vides de part et d'autre.
  if (c.includes(" ")) return false;
  const parts = c.split("/").filter((s) => s.length > 0);
  return parts.length >= 2;
}

/**
 * Règles ORDONNÉES nom/product_type → préfixe de taxonomie `l1[/l2]`.
 *
 * L'ORDRE EST CRITIQUE : règles les plus spécifiques d'abord (sinon le fourre-tout
 * « crème/soin » capture tout). `catchAll: true` marque les règles trop génériques
 * pour servir de classification par NOM (utilisées seulement via product_type).
 */
interface Rule {
  re: RegExp;
  target: string;
  /** Trop générique pour classer un NOM marketing (fourre-tout crème/soin). */
  catchAll?: boolean;
}

const RULES: Rule[] = [
  // ── Hygiène dentaire ───────────────────────────────────────────────────────
  { re: /bain de bouche|mouthwash|haleine|rince bouche/, target: "hygiene-dentaire/bain-de-bouche" },
  { re: /dentifrice|toothpaste|dentaire|blanchiment dent|dents? blanches?/, target: "hygiene-dentaire/dentifrice-adulte" },

  // ── Ongles ───────────────────────────────────────────────────────────────
  { re: /vernis|nail polish|dissolvant|base ongle|top coat/, target: "manucure-et-pedicure/vernis-et-base-ongles" },
  { re: /ongles?|cuticule|durcisseur/, target: "manucure-et-pedicure/soin-et-traitement-des-ongles" },

  // ── Déodorant ──────────────────────────────────────────────────────────────
  { re: /deodorant|anti-?transpirant|anti transpirant|antiperspirant/, target: "hygiene-du-corps/deodorant" },

  // ── Parfum (AVANT cheveux : « brume parfumée corps & cheveux » = parfum) ─────
  { re: /parfum|eau de toilette|eau de parfum|cologne|brume parfum|fragrance|body mist|brume corps/, target: "parfum" },

  // ── Cheveux / coiffure ───────────────────────────────────────────────────
  { re: /coloration|teinture/, target: "coiffure/coloration-capillaire" },
  { re: /coiffant|laque|gel coiffant|cire coiffante|mousse coiffante|spray coiffant|fixation/, target: "coiffure/produits-coiffants" },
  { re: /apres-?shampo|apres shampo|conditioner|conditionneur|demelant|masque capillaire|soin capillaire|leave.?in|hair ?mask|hair ?oil|hair ?serum|hair ?repair/, target: "coiffure/soin-capillaire" },
  { re: /shampo|shampoo/, target: "coiffure/shampooing" },
  { re: /capillaire|cheveux|\bhair\b|boucles?|sans rincage|defrisant|permanente/, target: "coiffure/soin-capillaire" },

  // ── Solaire ─────────────────────────────────────────────────────────────
  { re: /autobronzant|self.?tan|bronzage/, target: "produit-solaire/autobronzant" },
  { re: /apres-?soleil|apres soleil|after.?sun/, target: "produit-solaire/apres-soleil" },
  { re: /solaire|sun.?screen|spf|protection soleil|ecran solaire|protetor solar|protector solar/, target: "produit-solaire/creme-solaire" },

  // ── Rasage / épilation ───────────────────────────────────────────────────
  { re: /apres-?rasage|apres rasage|after.?shave|baume.*rasage/, target: "rasage-et-epilation/apres-rasage" },
  { re: /barbe|beard/, target: "rasage-et-epilation/soin-de-la-barbe" },
  { re: /rasage|shaving|rasoir|razor|mousse a raser|gel a raser/, target: "rasage-et-epilation/mousse-et-gel-de-rasage" },
  { re: /epilation|cire|wax/, target: "rasage-et-epilation/epilation-et-cire" },

  // ── Hygiène intime ─────────────────────────────────────────────────────────
  { re: /intime|intimate|intima/, target: "hygiene-du-corps/hygiene-intime" },

  // ── Lavant corps (AVANT nettoyant visage : « gel lavant » corps ≠ visage) ──
  { re: /gel douche|gel-douche|shower gel|body wash|huile de douche|creme de douche|creme lavante|bain moussant|produit de bain|savon|soap|jabon|sabonete|pain surgras|syndet|lavant mains|gel lavant/, target: "hygiene-du-corps/produit-de-bain" },

  // ── Nettoyant visage (AVANT gommage : le nettoyant/micellaire prime) ───────
  // Termes multilingues (« limpeza/limpiador/facial cleanser ») pour rattraper
  // les produits étrangers hors catalogue (ex. CeraVe « Gel de Limpeza Facial »
  // qui n'avait ni catégorie propre ni product_type).
  { re: /nettoyant|cleanser|cleansing|face wash|facial wash|eau micellaire|micellaire|micelar|demaquill|makeup remover|mousse nettoyante|gelee nettoyante|gel nettoyant|nettoyant en poudre|lait nettoyant|cleansing milk|limpeza facial|gel de limpeza|limpiador facial|nettoyant visage/, target: "soin-du-corps-et-visage/nettoyant-visage" },

  // ── Gommage / masque visage ────────────────────────────────────────────────
  { re: /gommage|exfoliant|exfoliating|scrub|peeling|masque|mask|argile|ghassoul|clay/, target: "soin-du-corps-et-visage/masque-et-gommage" },

  // ── Zones ciblées visage/corps ─────────────────────────────────────────────
  { re: /levres?|lip ?balm|baume a levres|lipbalm/, target: "soin-du-corps-et-visage/soin-des-levres" },
  { re: /contour des yeux|contour yeux|soin des yeux|eye ?cream|eye ?contour|\byeux\b/, target: "soin-du-corps-et-visage/soin-des-yeux" },
  { re: /mains?|hand ?cream|hand ?balm/, target: "soin-du-corps-et-visage/soin-des-mains" },
  { re: /pieds?|jambes?|foot|talons?/, target: "soin-du-corps-et-visage/soin-des-pieds-et-jambes" },
  { re: /acne|imperfection|bouton|blemish|point noir/, target: "soin-du-corps-et-visage/soin-acne-et-imperfection" },
  { re: /cellulite|minceur|slimming|amincissant/, target: "soin-du-corps-et-visage/soin-anti-cellulite" },
  { re: /vergeture|stretch.?mark/, target: "soin-du-corps-et-visage/soin-anti-vergetures" },
  { re: /eau thermale|thermal/, target: "soin-du-corps-et-visage/eaux-thermales-brumes" },

  // ── Soin anti-âge / sérum (AVANT le fourre-tout crème) ─────────────────────
  { re: /anti-?age|anti age|anti-?ride|anti ride|rides|serum|bakuchiol|retinol|vitamine c|firming|raffermissant|eclat|eclairciss|brightening|anti-?tache|taches?/, target: "soin-du-corps-et-visage/soin-anti-age" },

  // ── Corps : lait / baume / beurre corporel ─────────────────────────────────
  { re: /corporel|corps|body ?lotion|body ?milk|body ?butter|beurre|relipidant|emollient/, target: "soin-du-corps-et-visage/creme-hydratante", catchAll: true },

  // ── Maquillage ─────────────────────────────────────────────────────────────
  { re: /maquillage|fond de teint|foundation|mascara|rouge a levres|lipstick|fard|eyeliner|correcteur|concealer|blush|highlighter|palette|khol|crayon/, target: "maquillage" },

  // ── Huile essentielle ────────────────────────────────────────────────────
  { re: /huile essentielle|essential oil/, target: "bien-etre/huile-essentielle" },

  // ── Fourre-tout hydratation visage/corps (crème, baume, sérum, gelée…) ─────
  { re: /creme|cream|hydratant|moisturi|gel-?creme|fluide|gelee|pommade|lotion|baume|soin visage|soin du visage|face oil|huile.*visage|jour|nuit/, target: "soin-du-corps-et-visage/creme-hydratante", catchAll: true },
];

/**
 * Mappe un `product_type` (texte libre de l'analyseur, ex. « Nettoyant visage »)
 * vers un préfixe `l1[/l2]/%` (LIKE). `null` si aucun mot-clé ne matche.
 */
export function productTypeToCategoryPrefix(
  productType: string | null | undefined,
): string | null {
  const t = normalizeType(productType);
  if (t.length < 3) return null;
  for (const rule of RULES) {
    if (rule.re.test(t)) return `${rule.target}/%`;
  }
  return null;
}

/**
 * Classe un NOM de produit vers un préfixe `l1[/l2]/%` — DERNIER recours quand ni
 * la catégorie catalogue ni le product_type ne sont exploitables.
 *
 * Plus prudent que `productTypeToCategoryPrefix` : les règles FOURRE-TOUT
 * (`catchAll`) sont IGNORÉES, car un nom marketing (« Nouvelle Peau », « Éclat
 * Divin »…) sans mot-clé fonctionnel tomberait à tort dans « crème hydratante ».
 * Sans mot-clé fort → `null` (abstention).
 */
export function productNameToCategoryPrefix(
  name: string | null | undefined,
): string | null {
  const t = normalizeType(name);
  if (t.length < 3) return null;
  for (const rule of RULES) {
    if (rule.catchAll) continue;
    if (rule.re.test(t)) return `${rule.target}/%`;
  }
  return null;
}

export type AltQueryKind = "exact" | "prefix";
export type AltQuerySource = "catalog-category" | "product-type" | "product-name";

export interface AlternativesQuery {
  kind: AltQueryKind;
  /** slug exact (kind='exact') OU préfixe LIKE terminé par `/%` (kind='prefix'). */
  value: string;
  source: AltQuerySource;
}

/**
 * Décide la requête catégorie à utiliser pour chercher des alternatives.
 * Retourne `null` (abstention) quand aucun signal fiable n'existe → l'appelant
 * n'affiche AUCUNE alternative (préférable à une reco hors-sujet).
 */
export function resolveAlternativesQuery(signals: {
  /** Catégorie issue du catalogue (EAN direct ou vote recherche). */
  catalogCategory?: string | null;
  /** product_type de l'analyseur. */
  productType?: string | null;
  /** Nom commercial du produit (dernier recours). */
  productName?: string | null;
}): AlternativesQuery | null {
  // 1. Catégorie catalogue SPÉCIFIQUE → match exact (le plus précis : niveau feuille).
  if (isSpecificCategorySlug(signals.catalogCategory)) {
    return {
      kind: "exact",
      value: (signals.catalogCategory as string).trim(),
      source: "catalog-category",
    };
  }

  // 2. product_type → préfixe fonctionnel.
  const ptPrefix = productTypeToCategoryPrefix(signals.productType);
  if (ptPrefix) return { kind: "prefix", value: ptPrefix, source: "product-type" };

  // 3. Nom → préfixe (mot-clé fort uniquement).
  const namePrefix = productNameToCategoryPrefix(signals.productName);
  if (namePrefix) return { kind: "prefix", value: namePrefix, source: "product-name" };

  // 4. Rien de fiable → abstention.
  return null;
}
