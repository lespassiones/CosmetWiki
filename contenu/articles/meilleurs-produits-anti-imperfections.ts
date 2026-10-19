import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/meilleurs-produits-anti-imperfections/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. L'encadré
 * « En bref » qui ouvrait la page devient le chapeau, et les quatre cartes
 * « situation » deviennent des `h3`. Le format de ce fichier est décrit en
 * tête de `contenu/articles.ts`.
 */
const article: Article = {
  slug: "meilleurs-produits-anti-imperfections",
  titre: "Meilleurs produits anti-imperfections : comment choisir (peau à boutons)",
  titreSeo: "Meilleurs produits anti-imperfections (boutons)",
  resume:
    "Boutons, points noirs, pores dilatés : les actifs qui marchent (BHA, niacinamide, zinc, acide azélaïque), les erreurs à éviter et comment bien choisir.",
  chapo:
    "Contre les imperfections, quatre actifs font le gros du travail : ==acide salicylique (BHA)== pour les pores et les points noirs, ==peroxyde de benzoyle== pour les boutons inflammatoires, ==niacinamide + zinc== pour réguler, et ==acide azélaïque== comme option douce et polyvalente. Mais « le meilleur produit » dépend de ++ta peau++ : un soin efficace sur une peau grasse peut irriter une peau sensible. La bonne question n'est pas « quel est le meilleur produit », c'est « lequel est fait pour moi ».",
  publieLe: "2026-07-20",
  modifieLe: "2026-07-20",
  minutes: 4,
  theme: "meilleurs produits anti-imperfections",
  motsCles: [
    "meilleurs produits anti-imperfections",
    "produits contre les boutons",
    "acide salicylique boutons",
    "niacinamide imperfections",
    "acide azélaïque",
    "peau grasse à boutons",
    "points noirs pores dilatés",
    "routine anti-imperfections",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/anti-imperfections/hero.webp",
    alt: "De profil, une femme dépose quelques gouttes de sérum sur sa joue avec une pipette, à côté de deux flacons ambrés.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "1. D'où viennent les imperfections" },
    {
      type: "p",
      texte:
        "Un bouton, c'est presque toujours la même mécanique : un pore qui se bouche (excès de sébum + cellules mortes), une bactérie naturelle de la peau (*Cutibacterium acnes*) qui prolifère, et une inflammation. Chaque actif efficace agit sur **un ou plusieurs de ces leviers**. C'est pour ça qu'on ne choisit pas au hasard : on choisit selon le type d'imperfection.",
    },

    { type: "h2", texte: "2. Les actifs qui marchent vraiment" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Acide salicylique (BHA, *Salicylic Acid*)** : liposoluble, il pénètre dans le pore et le désincruste. La référence contre les ==points noirs et microkystes==.",
        "**Peroxyde de benzoyle** : antibactérien, cible les ==boutons rouges inflammatoires==. Efficace mais desséchant, on commence à faible concentration. En France, c'est un médicament vendu en pharmacie, pas un cosmétique : demande conseil à ton pharmacien.",
        "**Niacinamide** (vitamine B3) : régule le sébum, resserre l'aspect des pores, apaise les rougeurs. Très bien tolérée, elle se glisse dans presque toutes les routines.",
        "**Zinc (*Zinc PCA*)** : séborégulateur et apaisant, souvent associé à la niacinamide.",
        "**Acide azélaïque** : le couteau suisse. Il agit sur les imperfections, les rougeurs et les marques post-boutons, tout en étant ==doux pour les peaux sensibles==.",
        "**Rétinoïdes** (*Retinol*, rétinaldéhyde) : accélèrent le renouvellement cellulaire et débouchent les pores sur le long terme. À introduire progressivement, le soir. À éviter pendant la grossesse.",
      ],
    },

    { type: "h2", texte: "3. Ce qu'il vaut mieux éviter" },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Le sur-nettoyage.** Décaper la peau matin et soir avec des produits agressifs stimule le sébum et empire les imperfections.",
        "**Les huiles très comédogènes** (ex. *Coconut Oil* sur peau grasse) : elles peuvent boucher davantage les pores.",
        "**Empiler tous les actifs d'un coup.** BHA + peroxyde de benzoyle + rétinoïde + AHA le même soir, c'est la recette de l'irritation. On y va un actif à la fois.",
        "**Le parfum et les huiles essentielles** sur une peau réactive : ce ne sont pas des anti-boutons, et ils peuvent déclencher des réactions.",
      ],
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "Acné modérée à sévère",
      texte:
        "Si les boutons sont nombreux, douloureux, kystiques ou laissent des marques, aucun cosmétique ne remplace un ++avis dermatologique++. Les soins ci-dessus accompagnent, ils ne soignent pas une acné médicale.",
    },

    { type: "h2", texte: "4. Selon ta situation" },
    { type: "h3", texte: "Peau grasse à boutons : gel nettoyant doux + BHA" },
    {
      type: "p",
      texte:
        "Un nettoyant sans savon, un sérum à l'acide salicylique ou à la niacinamide, une hydratation légère non comédogène. On n'oublie jamais l'hydratation, même sur peau grasse.",
    },
    { type: "h3", texte: "Points noirs / pores visibles : BHA en cure régulière" },
    {
      type: "p",
      texte:
        "L'acide salicylique 2 à 3 fois par semaine, complété par la niacinamide au quotidien. Pas de gommage à grains agressif, qui irrite sans déboucher.",
    },
    { type: "h3", texte: "Peau sensible + imperfections : acide azélaïque + minimalisme" },
    {
      type: "p",
      texte:
        "L'azélaïque et la niacinamide plutôt que le peroxyde de benzoyle. Formules courtes, sans parfum ni huiles essentielles. ==Moins d'ingrédients = mieux toléré.==",
    },
    { type: "h3", texte: "Boutons inflammatoires : traitement localisé ciblé" },
    {
      type: "p",
      texte:
        "Peroxyde de benzoyle en local sur le bouton, en commençant à faible concentration. On hydrate autour pour limiter le dessèchement.",
    },

    { type: "h2", texte: "5. Le « meilleur » produit, c'est celui fait pour toi" },
    {
      type: "p",
      texte:
        "Deux personnes avec des « boutons » n'ont souvent pas besoin du même produit : peau grasse contre peau sensible, points noirs contre boutons inflammatoires, ingrédients à éviter différents. C'est pour ça qu'un classement universel « top 10 des produits anti-boutons » est trompeur. Ce qui compte, c'est la ++compatibilité entre le produit et ta peau++.",
    },
    {
      type: "p",
      texte:
        "C'est exactement ce que fait Cosme Check : tu scannes ou tu cherches un produit, et l'app calcule un **score de compatibilité** avec ton profil, vérifie si ses promesses tiennent, et signale les ingrédients que tu veux éviter.",
    },
    {
      type: "cta",
      texte:
        "**Vérifie si un produit anti-imperfections est fait pour toi.** Scanne ton produit ou colle sa liste INCI : Cosme Check calcule ta compatibilité, analyse la formule réelle derrière les promesses et repère les ingrédients à éviter selon ton profil.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Actifs qui marchent : **BHA, peroxyde de benzoyle, niacinamide, zinc, acide azélaïque, rétinoïdes**.",
        "On choisit selon le **type d'imperfection** (points noirs, boutons inflammatoires, peau sensible), pas au hasard.",
        "On évite le sur-nettoyage, l'empilement d'actifs forts et les huiles comédogènes.",
        "Acné importante ou douloureuse : ==direction le dermatologue==.",
        "Le meilleur produit est celui **compatible avec ta peau** : vérifie-le sur Cosme Check.",
      ],
    },
  ],
  faq: [
    {
      question: "Quel actif choisir contre les boutons ?",
      reponse:
        "L'acide salicylique (BHA) désincruste les pores et cible points noirs et microkystes. Le peroxyde de benzoyle agit sur les boutons inflammatoires. La niacinamide et le zinc régulent le sébum et apaisent. L'acide azélaïque est le plus polyvalent (imperfections, rougeurs, marques) et convient aux peaux sensibles.",
    },
    {
      question: "Peut-on cumuler plusieurs actifs anti-imperfections ?",
      reponse:
        "Oui, avec prudence. On évite de superposer plusieurs exfoliants forts le même soir, et on introduit un seul actif nouveau à la fois pour repérer ce que la peau tolère. Niacinamide et acide azélaïque sont doux et se combinent facilement ; le peroxyde de benzoyle et les rétinoïdes s'utilisent plutôt en alternance.",
    },
    {
      question: "Comment savoir si un produit anti-imperfections est fait pour ma peau ?",
      reponse:
        "Un produit bien noté dans l'absolu peut ne pas te convenir selon ton type de peau, tes sensibilités et ce que tu veux éviter. Cosme Check calcule un score de compatibilité entre ton profil et la formule réelle du produit, et signale les ingrédients qui touchent tes restrictions.",
    },
  ],
};

export default article;
