import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/cosmetique-fait-pour-toi/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. L'encadré
 * « En bref » qui ouvrait la page devient le chapeau. Le format de ce fichier
 * est décrit en tête de `contenu/articles.ts`.
 */
const article: Article = {
  slug: "cosmetique-fait-pour-toi",
  titre: "Comment savoir si un cosmétique est fait pour toi (la méthode)",
  titreSeo: "Savoir si un cosmétique est bon pour ta peau",
  resume:
    "Comment savoir si un cosmétique est bon pour ta peau : les 3 questions à te poser, la liste INCI lue pour toi, et les pièges du « naturel ».",
  chapo:
    "Un cosmétique n'est pas « bon » ou « mauvais » dans l'absolu. Il est ==compatible ou non avec toi==. Trois choses décident : **ton profil** (peau, cheveux), **tes objectifs** (ce que tu veux améliorer) et **ce que tu veux éviter** (sensibilités, ingrédients bannis). La bonne question n'est jamais « quelle est sa note », c'est « ++est-il fait pour moi++ ».",
  publieLe: "2026-07-20",
  modifieLe: "2026-10-21",
  minutes: 5,
  theme: "produit fait pour ma peau",
  motsCles: [
    "produit fait pour ma peau",
    "comment savoir si un cosmétique est bon",
    "compatibilité produit cosmétique",
    "quel produit pour ma peau",
    "savoir si un produit me convient",
    "note cosmétique universelle",
    "score de compatibilité",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/cosmetique-fait-pour-toi/hero.webp",
    alt: "Une main tient une loupe au-dessus d'un pot de crème ouvert, d'où sortent des formes colorées, à côté d'un écran « Analyse en cours ».",
    largeur: 1024,
    hauteur: 1536,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "1. Le piège de la note universelle" },
    {
      type: "p",
      texte:
        "La plupart des applications donnent à un produit **une note unique, la même pour tout le monde**. C'est rassurant, mais trompeur : ta peau n'est pas la peau moyenne.",
    },
    {
      type: "p",
      texte:
        "Une huile riche peut être parfaite pour une peau sèche et boucher les pores d'une peau grasse. Une crème notée « très bien » peut contenir un parfum qui fait réagir ta peau sensible. Un actif peut être idéal pour une peau mature et inutile pour une peau jeune. C'est aussi pour ça qu'il n'existe pas de [meilleure crème hydratante](/blog/meilleures-cremes-hydratantes-visage) pour tout le monde. ==Le même produit, deux verdicts opposés selon la personne.==",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "À retenir",
      texte:
        "Une note universelle répond à « ce produit est-il bien formulé ». La vraie question au moment d'acheter, c'est « ce produit est-il bien formulé *pour moi* ». Ce n'est pas la même réponse.",
    },

    { type: "h2", texte: "2. Les 3 questions à te poser" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Quel est mon profil ?** Type de peau (grasse, sèche, mixte, sensible, mature) et de cheveux. C'est le socle : il décide des textures et des actifs qui te conviennent.",
        "**Quels sont mes objectifs ?** Hydrater, atténuer les imperfections, unifier le teint, anti-âge, apaiser les rougeurs... Un produit n'est pertinent que s'il sert ==ton== objectif.",
        "**Qu'est-ce que je veux éviter ?** Allergènes connus, ingrédients que tu ne tolères pas, familles que tu bannis (parfum, certains conservateurs...). Un produit qui contient l'un d'eux est disqualifié, quelle que soit sa note.",
      ],
    },

    { type: "h2", texte: "3. Lire une formule pour toi" },
    {
      type: "p",
      texte:
        "La liste INCI, c'est la liste officielle des ingrédients au dos du produit, rangée du plus dosé au moins dosé et obligatoire en Europe ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Une fois ton profil clair, elle se lit différemment. Tu ne cherches plus « des mauvais ingrédients » en général, mais :",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Les actifs pertinents pour ton objectif** (par exemple l'[acide salicylique](/i/salicylic-acid) si tu cibles les imperfections, l'[acide hyaluronique](/i/sodium-hyaluronate) si tu cibles l'hydratation).",
        "**Les irritants pour TA peau** (le [parfum](/i/parfum) n'est un problème que s'il te fait réagir).",
        "**La cohérence promesse / formule** : le produit tient-il ce que le marketing annonce, ou l'actif vedette est-il en fin de liste, à dose symbolique ? Exemple avec la [niacinamide](/blog/niacinamide), souvent écrite après la « ligne du 1 % ».",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ne te fie pas au packaging « naturel » ou « hypoallergénique » : ce sont des arguments, pas des garanties. La loi demande seulement qu'ils soient honnêtes et prouvés ([règlement (UE) 655/2013](https://eur-lex.europa.eu/eli/reg/2013/655/oj)). ==La formule dit la vérité.==",
        "Un ingrédient « controversé » en fin de liste, à faible dose, ne pèse pas comme le même ingrédient en tête. Le contexte compte.",
      ],
    },
    {
      type: "p",
      texte:
        "Pour la méthode pas à pas (les cinq premiers ingrédients, la « ligne du 1 % », le parfum et les allergènes), suis notre guide pour [analyser la composition d'un cosmétique en 5 étapes](/blog/analyse-composition-cosmetique). Et pour un exemple réel, lis le décryptage de la [crème Nivea](/blog/creme-nivea-composition).",
    },

    { type: "h2", texte: "4. Raisonner routine, pas produit isolé" },
    {
      type: "p",
      texte:
        "Un produit ne vit pas seul. Ce qui compte, c'est ce que **l'ensemble de ta routine** fait pour tes objectifs. Deux questions utiles : mes objectifs sont-ils ++tous couverts++ ? Et quel produit est le ++maillon faible++, celui qu'il faudrait remplacer en priorité ? On progresse plus vite en corrigeant un maillon faible qu'en empilant des produits.",
    },

    { type: "h2", texte: "5. Comment Cosme Check le fait pour toi" },
    {
      type: "p",
      texte:
        "C'est exactement la raison d'être de Cosme Check : répondre à « ce produit est-il fait pour moi », automatiquement.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Un score de compatibilité** entre ton profil et la formule réelle du produit, avec le détail du calcul et les ingrédients qui touchent tes restrictions.",
        "**Promesses vs formule** : ce que la marque promet face à ce que la composition tient vraiment.",
        "**La comparaison** de deux produits côte à côte, pour trancher sans biais commercial.",
        "**La couverture de tes objectifs** sur toute ta routine, pour voir ce qui est bien couvert et ce qui manque.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Vérifie si un produit est fait pour toi.** Scanne un produit ou colle sa liste INCI : Cosme Check calcule ton score de compatibilité, confronte les promesses à la formule réelle et signale les ingrédients à éviter selon ton profil.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Un produit est **compatible ou non avec toi**, pas bon ou mauvais dans l'absolu.",
        "Trois questions : **ton profil**, **tes objectifs**, **ce que tu évites**.",
        "Lis la formule pour TOI : actifs utiles à ton objectif, irritants pour ta peau, cohérence promesse / formule.",
        "Raisonne **routine** : objectifs couverts et maillon faible à remplacer.",
        "Cosme Check automatise tout ça avec un ==score de compatibilité== personnalisé.",
      ],
    },
  ],
  faq: [
    {
      question: "Comment savoir si un cosmétique est bon ?",
      reponse:
        "Un cosmétique est bon s'il convient à ta peau, pas parce qu'il a une bonne note. Pose-toi trois questions : quel est mon type de peau, quel est mon objectif, qu'est-ce que je veux éviter. Puis lis la liste INCI au dos : l'actif promis doit être assez haut, sans ingrédient qui te fait réagir.",
    },
    {
      question: "Un produit bien noté est-il forcément bon pour moi ?",
      reponse:
        "Non. Une note universelle juge la formule dans l'absolu, la même pour tout le monde. Or un produit peut être excellent pour une peau grasse et inadapté à une peau sensible, ou contenir un ingrédient que tu dois éviter. Ce qui compte, c'est la compatibilité entre le produit et ton profil, pas une note unique.",
    },
    {
      question: "Comment savoir si un produit convient à une peau sensible ?",
      reponse:
        "On vérifie trois choses : l'absence d'irritants inutiles (parfum, huiles essentielles, alcool dénaturé en tête de liste), la présence d'apaisants (panthénol, niacinamide, céramides), et une formule plutôt courte. Cosme Check signale automatiquement les ingrédients à risque pour ton profil et calcule ton score de compatibilité.",
    },
    {
      question: "Faut-il un produit différent pour chaque type de peau ?",
      reponse:
        "Les besoins diffèrent (texture, actifs, tolérance), donc oui, le même produit ne convient pas à tout le monde. L'idée n'est pas d'avoir plus de produits, mais les bons : ceux compatibles avec ta peau et tes objectifs.",
    },
  ],
};

export default article;
