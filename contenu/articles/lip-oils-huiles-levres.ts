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
  titreSeo: "Lip oil ou gloss ? Avis et INCI décryptés",
  resume:
    "Lip oil ou gloss ? Ce qui les sépare vraiment, les 3 ingrédients à chercher dans la liste, et les lip oils du moment passés à la loupe.",
  chapo:
    "Les **lip oils** sont devenus viraux sur TikTok, et ont propulsé Dior, Rhode et Clarins en tête des ventes lèvres. Promesse : la brillance d'un gloss avec le soin d'un baume. ++Vrai sur le papier++, mais à condition de bien choisir.",
  publieLe: "2026-05-14",
  modifieLe: "2026-10-20",
  minutes: 4,
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
        "**Effet plump léger :** certaines formules ajoutent de la *menthe poivrée* ou un extrait de piment ([Capsicum Annuum Fruit Extract](/i/capsicum-annuum-fruit-extract)) pour gonfler temporairement la lèvre. Joli sur Instagram, parfois irritant.",
      ],
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "À retenir",
      texte:
        "Le lip oil ==remplace souvent le baume== au quotidien. Mais sur des lèvres gercées profondes, rien ne vaut un baume très occlusif (qui forme un film épais pour garder l'eau), type Cicaplast. Pour ces lèvres-là, lis notre [guide des crèmes réparatrices](/blog/cremes-hydratantes-reparatrices).",
    },

    { type: "h2", texte: "3. Liste INCI : que regarder ?" },
    {
      type: "p",
      texte:
        "La liste INCI, c'est la liste officielle des ingrédients au dos du produit, du plus dosé au moins dosé. Les trois premiers noms font l'essentiel de la formule : c'est là que tout se joue. Pour t'entraîner sur d'autres produits, suis notre méthode [« ce cosmétique est-il fait pour toi ? »](/blog/cosmetique-fait-pour-toi).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Premiers ingrédients = vraies huiles :** [Helianthus Annuus Seed Oil](/i/helianthus-annuus-seed-oil) (tournesol), [Ricinus Communis Seed Oil](/i/ricinus-communis-seed-oil) (ricin), [Simmondsia Chinensis Seed Oil](/i/simmondsia-chinensis-seed-oil) (jojoba), [Squalane](/i/squalane), [Butyrospermum Parkii Butter](/i/butyrospermum-parkii-butter) (karité).",
        "**Pas que des esters :** certains lip oils ne contiennent que [Polybutene](/i/polybutene) et [Hydrogenated Polyisobutene](/i/hydrogenated-polyisobutene), des huiles synthétiques qui imitent les vraies. Brillant, mais pas nourrissant.",
        "**Vitamine E ([Tocopherol](/i/tocopherol)) :** bon indicateur de qualité, antioxydant qui protège les huiles de l'oxydation.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Parfums forts** et arômes (cannelle, [huile de menthe poivrée](/i/mentha-piperita-oil)) : risque d'allergie ou de tiraillement.",
        "**Colorants** ([CI 15850](/i/ci-15850), CI 15985) : ils sont autorisés en Europe, listés à l'annexe IV du [règlement (CE) 1223/2009](https://eur-lex.europa.eu/eli/reg/2009/1223/oj). Mais si tes lèvres réagissent facilement, une version transparente est plus sûre.",
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
        "**Bourjois Healthy Mix Lip Oil :** alternative accessible, INCI correct, avec de l'huile minérale (*Paraffinum Liquidum*) en première position. Elle protège bien les lèvres, sans danger connu sur la peau : [on l'a décryptée dans la crème Nivea](/blog/creme-nivea-composition).",
      ],
    },
    {
      type: "cta",
      texte:
        "**Vérifie tes huiles à lèvres en 10 secondes.** Scanne ton lip oil avec Cosme Check : note ingrédient par ingrédient, alerte sur les parfums irritants et les huiles synthétiques.",
    },

    { type: "h2", texte: "Un lip oil protège-t-il du soleil ?" },
    {
      type: "p",
      texte:
        "Presque jamais. Les lèvres ont très peu de mélanine, le pigment qui protège un peu la peau du soleil : elles brûlent vite. Un lip oil n'a pas de filtre, sauf si un SPF (l'indice de protection solaire) est écrit sur le tube.",
    },
    {
      type: "p",
      texte:
        "Au ski, à la plage, ou sous le soleil des Antilles et de La Réunion, choisis un stick à lèvres avec SPF, et garde ton lip oil pour le soir. Les mêmes réflexes que pour ton visage : [les 7 erreurs de la crème solaire](/blog/spf-50-visage-7-erreurs).",
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
