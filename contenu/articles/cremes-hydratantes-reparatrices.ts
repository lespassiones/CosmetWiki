import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/cremes-hydratantes-reparatrices/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site, et les quatre cartes « type de
 * peau » deviennent des `h3`. Le format de ce fichier est décrit en tête de
 * `contenu/articles.ts`.
 *
 * Retouché le 24/10/2026 par le robot éditorial : titre de résultat sur
 * « crème hydratante ou réparatrice » (pour ne plus disputer « crème
 * hydratante visage » à `meilleures-cremes-hydratantes-visage`), deux
 * sources, liens vers huit articles, termes expliqués, chiffres sans source
 * retirés (« 90 % des bonnes crèmes », « 1 000 fois son poids en eau »).
 */
const article: Article = {
  slug: "cremes-hydratantes-reparatrices",
  titre: "Crèmes hydratantes et réparatrices : le guide pour choisir selon ta peau",
  titreSeo: "Crème hydratante ou réparatrice : que choisir ?",
  resume:
    "Crème hydratante ou réparatrice : l'une apporte de l'eau, l'autre du gras. Les ingrédients qui marchent, à lire dans l'INCI, et la bonne texture pour ta peau.",
  chapo:
    "Une crème **hydratante** apporte de l'eau à la peau, une crème **réparatrice** lui rend le gras qui la protège. La plupart des peaux ont besoin des deux, dans des proportions différentes. ++La bonne crème se lit dans ses cinq premiers ingrédients++, pas sur le pot.",
  publieLe: "2026-05-13",
  modifieLe: "2026-10-24",
  minutes: 6,
  theme: "crème hydratante visage",
  motsCles: [
    "crème hydratante visage",
    "crème réparatrice",
    "crème réparatrice visage",
    "crème hydratante réparatrice",
    "crème pour peau sèche",
    "crème pour peau grasse",
    "crème pour peau sensible",
    "céramides visage",
    "hydratation vs nutrition peau",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/cremes-hydratantes/hero.webp",
    alt: "Une femme en peignoir applique une noisette de crème sur sa pommette, devant un pot ouvert, dans une salle de bain baignée de lumière chaude.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "Hydrater ou réparer : quelle différence ?" },
    {
      type: "p",
      texte:
        "Hydrater, c'est apporter de l'eau. Réparer, ou nourrir, c'est apporter du gras. La couche du dessus de la peau fonctionne comme un mur : des cellules, les briques, tenues par un ciment de graisses. On appelle cet ensemble la **barrière cutanée**. Quand le ciment manque, l'eau s'échappe et la peau tiraille.",
    },
    {
      type: "tableau",
      entetes: ["Ce qui manque", "Ce que tu sens", "Ce qu'il faut chercher"],
      lignes: [
        ["**L'eau.**", "La peau tire, des petites ridules apparaissent, le teint est terne.", "Des humectants : glycérine, acide hyaluronique, urée."],
        ["**Le gras.**", "La peau est rugueuse, pèle par endroits, tire après la douche.", "Des émollients : céramides, squalane, beurre de karité."],
      ],
    },
    {
      type: "p",
      texte:
        "Un humectant, c'est un ingrédient qui attire l'eau et la garde dans la peau. Un émollient, c'est un corps gras qui adoucit et bouche les trous du ciment. Une revue scientifique range ainsi les crèmes en trois familles : les humectants, les émollients et les occlusifs, qui posent un film pour empêcher l'eau de s'évaporer ([Purnamawati et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5849435/)). Une bonne crème mélange souvent les trois.",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "À retenir",
      texte:
        "Une peau peut être ==grasse et déshydratée== en même temps. Le sébum, c'est le gras que fabrique ta peau ; l'eau, c'est autre chose. Une peau qui brille peut quand même manquer d'eau.",
    },

    { type: "h2", texte: "Quels ingrédients marchent vraiment dans une crème ?" },
    {
      type: "p",
      texte:
        "Six reviennent dans les crèmes qui tiennent leurs promesses. Cherche-les dans la liste INCI, la liste officielle des ingrédients, écrite du plus dosé au moins dosé.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**[Glycérine](/i/glycerin)** (*Glycerin*) : l'humectant le plus étudié. Elle aide la peau à garder son eau et sa souplesse ([Fluhr et al., *British Journal of Dermatology*, 2008](https://doi.org/10.1111/j.1365-2133.2008.08643.x)). Souvent dans les cinq premiers ingrédients.",
        "**[Acide hyaluronique](/i/sodium-hyaluronate)** (*Sodium Hyaluronate*) : il retient l'eau à la surface et donne un effet repulpé tout de suite.",
        "**[Céramides](/i/ceramide-np)** (*Ceramide NP*, *AP*, *EOP*) : ce sont des graisses du ciment de la peau. Elles comptent surtout pour les peaux sèches et sensibles.",
        "**[Niacinamide](/blog/niacinamide)** : c'est la vitamine B3. Entre 2 et 5 %, elle aide la barrière à se renforcer et le teint à s'unifier.",
        "**[Panthénol](/i/panthenol)** : la provitamine B5, c'est-à-dire une forme que la peau transforme en vitamine. Il apaise une peau qui tiraille.",
        "**[Squalane](/i/squalane)** : un corps gras léger, proche du sébum, qui ne laisse pas de film collant.",
      ],
    },
    {
      type: "image",
      src: "/image/blog/cremes-hydratantes/image1.webp",
      alt: "Application d'une crème hydratante visage le matin, illustration d'une routine skincare quotidienne",
      largeur: 1915,
      hauteur: 821,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "Quelle crème pour quel type de peau ?" },
    {
      type: "p",
      texte:
        "La texture compte autant que les ingrédients. Tu ne connais pas ton type de peau ? Regarde ton visage deux heures après l'avoir lavé, sans rien mettre : il brille, il tire, ou les deux selon les zones.",
    },
    { type: "h3", texte: "Peau grasse ou mixte : un gel ou un fluide" },
    {
      type: "p",
      texte:
        "Glycérine, acide hyaluronique et niacinamide, dans une texture légère. Évite les beurres lourds et les cires en tête de liste, qui peuvent boucher les pores chez certaines peaux : on t'explique [ce que veut dire « comédogène »](/blog/comedogene).",
    },
    { type: "h3", texte: "Peau sèche : une crème riche ou un baume" },
    {
      type: "p",
      texte:
        "Céramides, squalane, [beurre de karité](/i/butyrospermum-parkii-butter) et glycérine. C'est là qu'une crème réparatrice prend tout son sens, surtout en hiver, de l'air sec de Montréal au chauffage des appartements. Une crème simple comme [la boîte bleue de Nivea](/blog/creme-nivea-composition) peut suffire sur les zones très sèches.",
    },
    { type: "h3", texte: "Peau sensible : une liste courte" },
    {
      type: "p",
      texte:
        "Panthénol, céramides et niacinamide, sans parfum, sans huiles essentielles et sans alcool en tête de liste. ==Moins il y a d'ingrédients, moins il y a de risques qu'un seul te gêne.==",
    },
    { type: "h3", texte: "Peau mature : une crème riche et un actif ciblé" },
    {
      type: "p",
      texte:
        "Céramides, peptides et acide hyaluronique. Les peptides sont de petites chaînes de protéines qu'on ajoute aux crèmes anti-âge. Un rétinol le soir peut compléter, à part et doucement : [notre guide des sérums](/blog/serums-visage-guide) t'aide à choisir.",
    },

    { type: "h2", texte: "Quelles erreurs gâchent une bonne crème ?" },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Ne pas hydrater une peau grasse.** Elle a besoin d'eau comme les autres : choisis juste une texture légère.",
        "**Changer de crème toutes les semaines.** Laisse-lui ==trois à quatre semaines==, le temps que la surface de la peau se renouvelle.",
        "**Empiler les actifs forts.** Une crème simple et un seul sérum ciblé valent mieux que cinq produits qui se battent.",
        "**Oublier la crème solaire le matin.** Aucune crème hydratante ne protège du soleil sans SPF, l'indice de protection : [évite ces 7 erreurs](/blog/spf-50-visage-7-erreurs).",
        "**Une peau qui pèle, rougit ou démange malgré la crème** : ce n'est plus une question de crème. Parles-en à un pharmacien ou à un dermatologue.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Ta crème, elle hydrate ou elle répare ?** Scanne-la avec Cosme Check : tu vois ses ingrédients dans l'ordre, et si elle convient à ta peau.",
    },

    { type: "h2", texte: "Comment lire la liste de ta crème en 30 secondes ?" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Regarde les cinq premiers ingrédients : ce sont eux qui font la crème.",
        "Cherche un humectant (glycérine, acide hyaluronique) : c'est l'hydratation.",
        "Cherche un émollient (céramides, squalane, beurre) : c'est la réparation.",
        "Repère le parfum (*Parfum*) si ta peau est sensible.",
        "Ne te fie pas à l'ingrédient vedette rangé en fin de liste : il est souvent dosé à moins de 1 %. Notre [méthode pour analyser une composition](/blog/analyse-composition-cosmetique) va plus loin.",
      ],
    },
    {
      type: "p",
      texte:
        "Le meilleur test reste le plus simple : ++une bonne crème ne se sent plus dix minutes après++. Si ta peau tire encore, il manque de l'eau ; si elle est rugueuse, il manque du gras. Pour comparer des marques précises, va voir [notre sélection de crèmes hydratantes visage](/blog/meilleures-cremes-hydratantes-visage).",
    },
  ],
  faq: [
    {
      question: "Quelle différence entre hydrater et nourrir la peau ?",
      reponse:
        "Hydrater, c'est apporter de l'eau à la peau, avec des humectants comme la glycérine, l'acide hyaluronique ou l'urée. Nourrir, c'est lui apporter des lipides, avec des émollients comme les céramides, le squalane ou les beurres végétaux. Le manque d'eau tire et ternit le teint, le manque de lipides rend la peau rugueuse.",
    },
    {
      question: "Faut-il hydrater une peau grasse ?",
      reponse:
        "Oui. Une peau peut être grasse et déshydratée en même temps, car le sébum, le gras de la peau, et l'eau sont deux choses différentes. Choisis une texture gel ou fluide, avec glycérine, acide hyaluronique et niacinamide, et évite les beurres lourds et les cires en tête de liste.",
    },
    {
      question: "Quelle crème hydratante pour une peau sensible ?",
      reponse:
        "Une formule courte, à base de panthénol, de céramides et de niacinamide, sans parfum, sans huiles essentielles et sans alcool en tête de liste. En général, plus la liste d'ingrédients est courte, mieux la crème est tolérée par une peau sensible. Teste-la d'abord sur une petite zone pendant quelques jours.",
    },
    {
      question: "Combien de temps pour voir l'effet d'une crème hydratante ?",
      reponse:
        "Compte trois à quatre semaines pour juger une crème, le temps que la surface de la peau se renouvelle. L'effet de confort, lui, se sent dès le premier jour. Changer de produit trop souvent empêche de savoir ce qui marche : garde la même crème un mois avant de décider.",
    },
  ],
};

export default article;
