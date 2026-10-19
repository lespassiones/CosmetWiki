import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/lip-oils-huiles-levres/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site, et l'article change de rubrique
 * (Routines → Tendances). Le format de ce fichier est décrit en tête de
 * `contenu/articles.ts`.
 */
const article: Article = {
  slug: "lip-oils-huiles-levres",
  titre: "Lip oils : la vraie différence avec un gloss (et lesquels choisir)",
  titreSeo: "Lip oil ou gloss : la vraie différence",
  resume:
    "Les huiles à lèvres ont explosé sur les réseaux. Ce qui les distingue d'un gloss, comment lire leur INCI et les références qui tiennent leurs promesses.",
  chapo:
    "Les **lip oils** sont devenus viraux sur TikTok, et ont propulsé Dior, Rhode et Clarins en tête des ventes lèvres. Promesse : la brillance d'un gloss avec le soin d'un baume. ++Vrai sur le papier++, mais à condition de bien choisir.",
  publieLe: "2026-05-14",
  modifieLe: "2026-05-14",
  minutes: 2,
  theme: "lip oil",
  motsCles: [
    "huile à lèvres",
    "lip oil avis",
    "Dior lip glow oil",
    "lip oil teinté",
    "meilleur lip oil",
    "gloss vs huile lèvres",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/lip-oils/hero.webp",
    alt: "Une jeune femme sourit à son reflet dans le miroir de la salle de bains, un flacon d'huile à lèvres à la main.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "1. Différence avec un gloss classique" },
    {
      type: "tableau",
      entetes: ["Critère", "Gloss", "Lip oil"],
      lignes: [
        ["**Base**", "Polymères + silicones", "Huiles végétales (jojoba, ricin...)"],
        ["**Texture**", "Collante, épaisse", "Fluide, légère, non collante"],
        ["**Effet**", "Brillance pure", "Brillance + nutrition"],
        ["**Tenue**", "2-3 h", "1-2 h (à réappliquer)"],
      ],
    },

    { type: "h2", texte: "2. Ce que ça apporte vraiment" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Nutrition immédiate :** les huiles végétales colmatent les micro-fissures des lèvres et limitent l'évaporation de l'eau.",
        "**Confort durable :** les versions sérieuses comprennent du beurre de karité, du squalane végétal ou de l'huile de jojoba.",
        "**Effet plump léger :** certaines formules ajoutent de la *menthe poivrée* ou un dérivé de capsicum pour gonfler temporairement la lèvre. Joli sur Instagram, parfois irritant.",
      ],
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "À retenir",
      texte:
        "Le lip oil ==remplace souvent le baume== au quotidien, mais ne remplace pas un baume très occlusif type Cicaplast en cas de lèvres gercées profondes.",
    },

    { type: "h2", texte: "3. Que regarder dans l'INCI" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Premiers ingrédients = vraies huiles :** *Helianthus annuus oil, Ricinus communis oil, Jojoba esters, Squalane, Butyrospermum parkii butter*.",
        "**Pas que des esters :** certains lip oils ne contiennent que *Polybutene, Hydrogenated Polyisobutene* (huiles synthétiques imitatrices). Brillant, mais pas nourrissant.",
        "**Vitamine E (*Tocopherol*) :** bon indicateur de qualité, antioxydant qui protège les huiles de l'oxydation.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Parfums forts** et arômes (*cinnamon, peppermint oil*) : risque d'allergie ou de tiraillement.",
        "**Colorants alimentaires douteux** (*CI 15850, CI 15985*) : préfère des pigments minéraux ou des nacres si tu veux une version teintée.",
      ],
    },
    {
      type: "image",
      src: "/image/blog/lip-oils/image1.webp",
      alt: "Application d'une huile à lèvres teintée avec applicateur, mise en avant de la texture brillante et fluide",
      largeur: 1915,
      hauteur: 821,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "4. Les marques du moment (et notre lecture INCI)" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Dior Addict Lip Glow Oil :** base d'huile de cerise + ricin. INCI propre, parfum présent. ==La référence luxe.==",
        "**Clarins Lip Comfort Oil :** huile de noisette, de tournesol. Confortable, INCI cohérent avec la promesse.",
        "**Kosas LipFuel Hyaluronic :** huile + acide hyaluronique. Effet plus aqueux. Bonne option clean.",
        "**Rhode Peptide Lip Tint :** huile + peptides. Tendance, formule INCI très soignée.",
        "**Bourjois Healthy Mix Lip Oil :** alternative accessible, INCI correct mais avec des huiles minérales (*Mineral oil*) en première position.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Vérifie tes huiles à lèvres en 10 secondes.** Scanne ton lip oil avec Cosme Check : note ingrédient par ingrédient, alerte sur les parfums irritants et les huiles synthétiques.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Gloss** = brillance pure. **Lip oil** = brillance + nutrition.",
        "Cherche ==une vraie huile végétale== dans les 3 premiers ingrédients de l'INCI.",
        "Évite les arômes forts (menthe, cannelle) si tu as les lèvres sensibles.",
        "Tenue 1-2 h : c'est normal, on réapplique. Pas un défaut produit.",
      ],
    },
  ],
  faq: [
    {
      question: "Quelle est la différence entre un lip oil et un gloss ?",
      reponse:
        "Le gloss repose sur des polymères et des silicones : texture collante et épaisse, brillance pure, tenue de 2 à 3 heures. Le lip oil repose sur des huiles végétales comme le jojoba ou le ricin : texture fluide et non collante, brillance plus nutrition, mais tenue de 1 à 2 heures seulement.",
    },
    {
      question: "Un lip oil peut-il remplacer un baume à lèvres ?",
      reponse:
        "Au quotidien, souvent oui : ses huiles végétales colmatent les micro-fissures des lèvres et limitent l'évaporation de l'eau. En revanche, il ne remplace pas un baume très occlusif, type Cicaplast, quand les lèvres sont profondément gercées. Dans ce cas, le baume reste le bon choix.",
    },
    {
      question: "Comment choisir un bon lip oil en lisant l'INCI ?",
      reponse:
        "Cherche une vraie huile végétale dans les trois premiers ingrédients, comme Helianthus annuus oil, Ricinus communis oil ou Jojoba esters. Méfie-toi des formules faites seulement de Polybutene ou d'Hydrogenated Polyisobutene, brillantes mais pas nourrissantes. La vitamine E (Tocopherol) est un bon indicateur de qualité.",
    },
    {
      question: "Pourquoi mon lip oil ne tient-il pas longtemps ?",
      reponse:
        "C'est normal : un lip oil tient en général 1 à 2 heures, contre 2 à 3 heures pour un gloss. Sa texture est fluide, légère et non collante, et la brillance vient d'huiles végétales qui nourrissent la lèvre. Ce n'est pas un défaut du produit : on le réapplique simplement dans la journée.",
    },
  ],
};

export default article;
