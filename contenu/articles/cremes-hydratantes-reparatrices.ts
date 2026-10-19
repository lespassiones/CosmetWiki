import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/cremes-hydratantes-reparatrices/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site, et les quatre cartes « type de
 * peau » deviennent des `h3`. Le format de ce fichier est décrit en tête de
 * `contenu/articles.ts`.
 */
const article: Article = {
  slug: "cremes-hydratantes-reparatrices",
  titre: "Crèmes hydratantes et réparatrices : le guide pour choisir selon ta peau",
  titreSeo: "Crème hydratante visage : choisir selon ta peau",
  resume:
    "Hydratation ou nutrition, actifs qui marchent vraiment et la bonne crème pour chaque type de peau : le guide simple pour ne plus te tromper.",
  chapo:
    "La crème hydratante reste le produit **le plus essentiel** de toute routine skincare. Avant le sérum, avant le rétinol, avant tout marketing. Encore faut-il ++la bonne crème pour la bonne peau++, et savoir ce que veut dire « hydrater » vraiment.",
  publieLe: "2026-05-13",
  modifieLe: "2026-05-13",
  minutes: 2,
  theme: "crème hydratante visage",
  motsCles: [
    "crème hydratante visage",
    "crème réparatrice",
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
    { type: "h2", texte: "1. Hydratation vs nutrition : la confusion classique" },
    { type: "p", texte: "Deux problèmes différents, deux solutions différentes :" },
    {
      type: "tableau",
      entetes: ["Problème", "Symptômes", "Solution"],
      lignes: [
        [
          "**Manque d'eau**",
          "Tiraillements, ridules de déshydratation, teint terne",
          "Humectants : *glycérine, acide hyaluronique, urée*",
        ],
        [
          "**Manque de lipides**",
          "Peau rugueuse, squameuse, qui « tire » après le nettoyage",
          "Émollients : *céramides, squalane, beurres végétaux*",
        ],
      ],
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "À retenir",
      texte:
        "Une peau peut être ==grasse ET déshydratée== en même temps. Sébum et eau sont deux choses différentes. Ne confonds pas brillance et hydratation.",
    },

    { type: "h2", texte: "2. Les actifs qui marchent vraiment" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Glycérine** : l'humectant n°1, présent dans 90 % des bonnes crèmes. Souvent dans les 5 premiers ingrédients.",
        "**Acide hyaluronique (*Sodium Hyaluronate*)** : retient jusqu'à ==1 000 fois son poids en eau==. Effet rebond immédiat.",
        "**Céramides** : réparent la barrière cutanée, indispensables pour les peaux sèches, sensibles ou atopiques.",
        "**Niacinamide** (vitamine B3, 2 à 5 %) : renforce la barrière, anti-rougeurs, anti-taches, polyvalent.",
        "**Panthénol** (provitamine B5) : apaisant, cicatrisant. Star des soins post-procédures (laser, microneedling).",
        "**Squalane** : émollient d'origine végétale, ressemble au sébum naturel, non comédogène.",
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

    { type: "h2", texte: "3. Selon ton type de peau" },
    { type: "h3", texte: "Peau grasse / mixte : texture gel ou fluide" },
    {
      type: "p",
      texte:
        "Glycérine + acide hyaluronique + niacinamide. Mention **« non comédogène »**. Évite les huiles minérales et beurres lourds.",
    },
    { type: "h3", texte: "Peau sèche : texture riche, baume" },
    {
      type: "p",
      texte:
        "Céramides + squalane + beurre de karité + glycérine. Vise les listes courtes type CeraVe, La Roche-Posay Toleriane, Avène Tolérance.",
    },
    { type: "h3", texte: "Peau sensible / réactive : formule minimaliste" },
    {
      type: "p",
      texte:
        "Panthénol + céramides + niacinamide. Sans parfum, sans huiles essentielles, sans alcool dénaturé. ==Plus court = mieux toléré.==",
    },
    { type: "h3", texte: "Peau mature : riche + actifs ciblés" },
    {
      type: "p",
      texte:
        "Céramides + peptides + acide hyaluronique. Si tolérance, ajouter un rétinol le soir (séparément).",
    },

    { type: "h2", texte: "4. Les erreurs fréquentes" },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Ne pas hydrater une peau grasse.** Le manque d'eau accentue justement la production de sébum.",
        "**Changer de crème trop souvent.** Il faut au moins ==3 à 4 semaines== pour voir l'effet réel d'un produit.",
        "**Multiplier les actifs forts.** Une bonne crème hydratante n'a pas besoin de 12 actifs. Mieux vaut un sérum ciblé + une crème simple.",
        "**Oublier le cou et les mains.** Ce sont eux qui vieillissent en premier.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Trouve la bonne crème selon ta peau.** Cosme Check analyse l'INCI de tes crèmes pour identifier les actifs efficaces, vérifier la cohérence avec ton type de peau et signaler les ingrédients potentiellement irritants.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Hydratation** = eau (glycérine, AH). **Nutrition** = lipides (céramides, beurres).",
        "Une peau grasse peut être déshydratée. ==Toujours hydrater.==",
        "Actifs stars : glycérine, acide hyaluronique, céramides, niacinamide, panthénol, squalane.",
        "Texture **fluide** pour peau grasse, **riche** pour peau sèche, **minimaliste** pour peau sensible.",
        "Patience : 3-4 semaines pour juger un produit, pas 3 jours.",
      ],
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
        "Oui. Une peau peut être grasse et déshydratée en même temps, car sébum et eau sont deux choses différentes, et le manque d'eau accentue la production de sébum. Choisis une texture gel ou fluide non comédogène, avec glycérine, acide hyaluronique et niacinamide, sans huiles minérales ni beurres lourds.",
    },
    {
      question: "Quelle crème hydratante pour une peau sensible ?",
      reponse:
        "Une formule minimaliste, à base de panthénol, de céramides et de niacinamide. Elle ne contient ni parfum, ni huiles essentielles, ni alcool dénaturé. En général, plus la liste d'ingrédients est courte, mieux la crème est tolérée par une peau sensible ou réactive.",
    },
    {
      question: "Combien de temps pour voir l'effet d'une crème hydratante ?",
      reponse:
        "Compte au moins 3 à 4 semaines pour voir l'effet réel d'une crème, pas 3 jours. Changer de produit trop souvent empêche de juger. Inutile aussi de chercher une crème à 12 actifs : un sérum ciblé et une crème simple font mieux que l'empilement d'actifs forts.",
    },
  ],
};

export default article;
