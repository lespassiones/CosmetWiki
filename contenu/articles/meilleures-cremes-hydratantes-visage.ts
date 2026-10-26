import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/meilleures-cremes-hydratantes-visage/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. L'encadré
 * « En bref » qui ouvrait la page devient le chapeau, et les quatre cartes
 * « type de peau » deviennent des `h3`. Le format de ce fichier est décrit en
 * tête de `contenu/articles.ts`.
 *
 * Retouché le 19/10/2026 par le robot éditorial : Google montrait la page sur
 * « meilleure crème hydratante visage » (231 affichages en 28 jours, position
 * 68). Titre de résultat et résumé recentrés sur cette requête exacte, une
 * source scientifique, trois liens internes, « rétinol » expliqué, une
 * question de FAQ. Expérience suivie dans `docs/seo/EXPERIENCES.md`.
 *
 * Retouché le 26/10/2026 (GEO) : deuxième page la plus citée par Copilot
 * (254 citations sur trois mois, Bing), d'abord sur « crème hydratante non
 * comédogène » (113 citations, 1 k à 10 k recherches par mois). Section
 * « non comédogène » sourcée (règlement 655/2013) et reliée à `comedogene`,
 * `h2` en questions, termes expliqués, affirmation sans source sur le sébum
 * retirée, liens vers `peau-seche-visage` et `analyse-composition-cosmetique`.
 */
const article: Article = {
  slug: "meilleures-cremes-hydratantes-visage",
  titre: "Meilleure crème hydratante visage : laquelle choisir pour ta peau ?",
  titreSeo: "Meilleure crème hydratante visage : laquelle ?",
  resume:
    "Meilleure crème hydratante visage : il n'y en a pas une, il y a la tienne. Peau grasse, sèche, sensible ou mature : les formules à repérer avant d'acheter.",
  chapo:
    "Il n'existe pas *une* meilleure crème hydratante, mais la meilleure ==pour ta peau==. Vite dit : texture **fluide non comédogène** (qui ne favorise pas les points noirs) pour peau grasse, **riche aux céramides** pour peau sèche, **minimaliste sans parfum** pour peau sensible. Les références citées ici sont souvent recommandées, mais la seule façon de trancher reste de ++vérifier la compatibilité++ de la formule avec ton profil.",
  publieLe: "2026-07-20",
  modifieLe: "2026-10-26",
  minutes: 5,
  theme: "meilleure crème hydratante visage",
  motsCles: [
    "meilleure crème hydratante visage",
    "crème hydratante peau grasse",
    "crème hydratante peau sèche",
    "crème hydratante peau sensible",
    "meilleure crème visage",
    "crème hydratante non comédogène",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/meilleures-cremes-hydratantes-visage/hero.webp",
    alt: "Une femme en peignoir applique une noisette de crème sur sa pommette, devant un pot ouvert, dans une salle de bain baignée de lumière chaude.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "Qu'est-ce qui fait une bonne crème hydratante ?" },
    {
      type: "p",
      texte:
        "Une formule solide combine trois familles d'ingrédients. C'est le constat d'une [revue scientifique de 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5849435/) sur les crèmes hydratantes : la plupart mélangent ces trois rôles.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Humectants** (ils attirent l'eau dans la peau) : [glycérine](/i/glycerin), acide hyaluronique, urée, [panthénol](/i/panthenol).",
        "**Émollients** (ils lissent et assouplissent) : squalane, céramides, esters, beurres végétaux.",
        "**Occlusifs** (ils posent un film qui limite la perte d'eau) : cires, certaines huiles, silicones. Surtout utiles aux peaux sèches.",
      ],
    },
    {
      type: "p",
      texte:
        "Pour le détail (hydratation vs nutrition, quel actif pour quoi), vois le guide complet : [Crèmes hydratantes et réparatrices, le guide pour choisir](/blog/cremes-hydratantes-reparatrices).",
    },

    { type: "h2", texte: "Quelle crème hydratante pour quel type de peau ?" },
    {
      type: "p",
      texte:
        "Des références fréquemment recommandées, à titre indicatif. Une formule peut évoluer et une même crème ne convient pas à tout le monde : considère-les comme des points de départ, pas comme un verdict.",
    },
    { type: "h3", texte: "Peau grasse / mixte : gel-crème léger, non comédogène" },
    {
      type: "p",
      texte:
        "Cherche glycérine + acide hyaluronique + [niacinamide](/i/niacinamide), texture fluide. Références souvent citées : La Roche-Posay Effaclar, CeraVe lotion hydratante, Bioderma Sébium. Évite les huiles lourdes et beurres occlusifs. Les autres gestes pour cette peau sont dans notre [guide anti-imperfections](/blog/meilleurs-produits-anti-imperfections).",
    },
    { type: "h3", texte: "Et la mention « non comédogène », elle vaut quoi ?" },
    {
      type: "p",
      texte:
        "Une crème **non comédogène**, c'est une crème dont la marque affirme qu'elle ne favorise pas les points noirs et les boutons. En Europe, toute promesse écrite sur un cosmétique doit pouvoir être prouvée ([règlement (UE) 655/2013](https://eur-lex.europa.eu/eli/reg/2013/655/oj)). Mais aucun test commun n'est imposé : chaque marque choisit sa méthode.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Cherche plutôt « testé sur peaux grasses » ou « sur peaux à tendance acnéique » : c'est plus précis.",
        "Regarde le haut de la liste INCI (la liste des ingrédients au dos) : une texture gel ou fluide, avec glycérine et eau en tête, reste légère.",
        "Les listes d'ingrédients « à fuir » viennent de vieux tests sur des oreilles de lapin : [ce que veut vraiment dire « comédogène »](/blog/comedogene).",
      ],
    },
    { type: "h3", texte: "Peau sèche : riche, céramides + beurres" },
    {
      type: "p",
      texte:
        "Céramides, squalane, beurre de karité, glycérine. Références : CeraVe crème hydratante (pot), La Roche-Posay Toleriane Sensible, Avène Hydrance riche, Embryolisse Lait-Crème Concentré. En hiver, une fine couche de vaseline le soir sur les zones qui tirent aide aussi : c'est le [slugging, et nos gestes pour la peau sèche du visage](/blog/peau-seche-visage).",
    },
    { type: "h3", texte: "Peau sensible / réactive : minimaliste, sans parfum" },
    {
      type: "p",
      texte:
        "Panthénol, céramides (les gras qui collent les cellules de la peau entre elles), niacinamide ; sans parfum, sans huiles essentielles, sans alcool dénaturé. Références : La Roche-Posay Cicaplast Baume B5, Avène Tolérance Control, Bioderma Hydrabio. ==Plus court = mieux toléré.==",
    },
    { type: "h3", texte: "Peau mature : riche + actifs ciblés" },
    {
      type: "p",
      texte:
        "Céramides + peptides + acide hyaluronique pour la fermeté et le confort. Si la peau tolère, un rétinol (un dérivé de la vitamine A, à introduire doucement) le soir, séparément. La protection solaire au quotidien reste le premier geste anti-âge : évite [les 7 erreurs qui gâchent ta crème solaire](/blog/spf-50-visage-7-erreurs).",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "« Naturel » ou « hypoallergénique » ne sont pas des garanties : ==la formule seule fait foi==.",
        "Une peau grasse peut être déshydratée. Ne saute jamais l'hydratation en pensant « ma peau brille déjà ».",
      ],
    },

    { type: "h2", texte: "Une crème hydratante chère est-elle meilleure ?" },
    {
      type: "p",
      texte:
        "Peu. Sur une crème hydratante, **le prix ne fait pas la formule**. Des produits abordables (CeraVe, The Ordinary Natural Moisturizing Factors, Nivea, Embryolisse) tiennent tête à des crèmes de luxe sur les actifs qui comptent vraiment. Le marketing et le packaging expliquent souvent l'écart de prix, pas l'efficacité.",
    },
    {
      type: "p",
      texte:
        "L'exemple parlant : [on a lu la composition de la boîte bleue Nivea](/blog/creme-nivea-composition), et 18 de ses 21 ingrédients se retrouvent dans une crème de luxe culte.",
    },

    { type: "h2", texte: "Comment savoir si une crème est faite pour toi ?" },
    {
      type: "p",
      texte:
        "Une liste de « meilleures crèmes » reste générale. Ta peau, elle, est précise. Avant d'acheter, la vraie question est : ++cette crème est-elle compatible avec MON profil++ (type de peau, objectifs, ingrédients que j'évite) ? C'est l'approche détaillée dans notre article pilier : [comment savoir si un cosmétique est fait pour toi](/blog/cosmetique-fait-pour-toi). Pour lire une liste toi-même, suis [notre méthode en cinq étapes](/blog/analyse-composition-cosmetique).",
    },
    {
      type: "cta",
      texte:
        "**Vérifie si une crème est faite pour toi.** Scanne une crème ou colle sa liste INCI : Cosme Check calcule ton score de compatibilité, analyse la formule derrière les promesses et signale les ingrédients à éviter selon ton profil.",
    },

    { type: "h2", texte: "Que retenir avant d'acheter ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Pas de crème miracle universelle : **la meilleure dépend de ta peau**.",
        "Texture **fluide** (peau grasse), **riche** (peau sèche), **minimaliste sans parfum** (peau sensible).",
        "Actifs à repérer : glycérine, acide hyaluronique, céramides, niacinamide, squalane, panthénol.",
        "**Le prix ne fait pas la formule** : des références abordables valent le luxe.",
        "Avant d'acheter, ==vérifie la compatibilité== de la crème avec ton profil sur Cosme Check.",
      ],
    },
  ],
  faq: [
    {
      question: "Quelle est la meilleure crème hydratante visage ?",
      reponse:
        "Il n'y en a pas une seule : la meilleure dépend de ton type de peau. Une bonne crème combine des humectants (glycérine, acide hyaluronique), des émollients (squalane, céramides) et, pour les peaux sèches, des occlusifs. Des références reconnues existent par type de peau (CeraVe, La Roche-Posay Toleriane, Avène, Bioderma), mais la seule façon de trancher est de vérifier la compatibilité de la formule avec ton profil.",
    },
    {
      question: "Une crème hydratante chère est-elle meilleure ?",
      reponse:
        "Non. Le prix ne fait pas la qualité de la formule. Des produits abordables comme CeraVe, The Ordinary ou Nivea rivalisent avec des crèmes de luxe sur les actifs qui comptent. Ce qui compte, c'est la composition, pas le flacon.",
    },
    {
      question: "Quelle crème hydratante pour peau grasse ?",
      reponse:
        "Une texture gel ou fluide, à base de glycérine, d'acide hyaluronique et de niacinamide, sans huiles lourdes ni beurres occlusifs. Même une peau grasse peut manquer d'eau : la sauter laisse souvent la peau tirer après le nettoyage, et ne fait pas briller moins.",
    },
    {
      question: "Quelle est la meilleure crème hydratante pour peau mature ?",
      reponse:
        "Une crème riche qui associe des céramides, de l'acide hyaluronique et des peptides, pour le confort et le rebondi. Le soir, un rétinol peut s'ajouter, à petite dose et séparément, si ta peau le tolère. Le matin, la crème solaire reste le geste qui compte le plus pour une peau qui mûrit.",
    },
    {
      question: "Quelle crème hydratante non comédogène choisir ?",
      reponse:
        "Une crème gel ou fluide, avec de l'eau et de la glycérine en tête de liste, sans beurres ni huiles lourdes. La mention « non comédogène » n'a pas de test officiel commun : préfère « testé sur peaux grasses » ou « sur peaux à tendance acnéique ». Et teste-la deux semaines avant de juger.",
    },
  ],
};

export default article;
