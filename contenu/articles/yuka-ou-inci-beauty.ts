import type { Article } from "@/contenu/articles";

/**
 * Publié le 21/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « Cosme Check pratique » (`creme-perimee` sortait de la fenêtre des dix
 * derniers) : comparatif honnête des applications qui notent les cosmétiques.
 * Volumes (`VOLUMES.md`) : « application yuka » 1 k à 10 k (neuf zones,
 * 11/11/2026), « yuka cosmétique » 100 à 1 k, « inci beauty » 10 k à 100 k,
 * « inci beauty avis », « inci beauty ou yuka » 100 à 1 k (25/10/2026).
 * Suggestions Google du jour : « qui est le plus fiable yuka ou inci beauty »,
 * « yuka est il fiable pour les cosmétiques », « inci beauty application
 * gratuite », « application comme yuka pour cosmétique ». Premiers résultats :
 * Slate et Tom's Guide (2018), des blogs de parapharmacie ; aucun ne mesure
 * l'effet de la place d'un ingrédient sur la note.
 *
 * Méthodes : aide officielle de Yuka (lue le 21/11/2026) ; page des
 * fonctionnalités et accueil d'INCI Beauty (lus le 21/11/2026) ; Tom's Guide
 * du 05/11/2018 pour l'exemple du déodorant. Aucune note Yuka ou INCI Beauty
 * n'est citée pour un produit, hors l'exemple daté de Tom's Guide.
 *
 * Chiffres : `cosme_check.catalog`, fiches actives, relevé du 21/11/2026.
 * 478 376 produits ; 114 527 avec au moins un ingrédient rouge (57 945 avec
 * un seul, 56 582 avec deux ou plus). Parmi les produits à un seul rouge,
 * 56 440 dont le rouge se retrouve dans la liste découpée sur les virgules :
 * rang 1 à 5 (14 605, note médiane 2,92), milieu jusqu'à 60 % de la liste
 * (16 963, 7,3), 40 % de fin (24 872, 11,13), mêmes zones que le moteur
 * `lib/analysis/pastille.ts`. BHT : rouge unique de 12 649 produits, dont
 * 8 767 en fin de liste. Methylparaben : médiane 2,9 dans les cinq premiers
 * (75 produits), 11,26 en fin de liste (1 726). Les notes citées sont
 * déclarées dans `notes`.
 */
const article: Article = {
  slug: "yuka-ou-inci-beauty",
  titre: "Yuka ou INCI Beauty : pourquoi ta crème n'a pas la même note partout, et l'ingrédient en 30e place qui change tout",
  titreSeo: "Yuka ou INCI Beauty : laquelle est fiable ?",
  resume:
    "Yuka, INCI Beauty, Cosme Check : même liste, notes différentes. Ce que chaque appli regarde, et ce que 56 440 listes disent de la place d'un ingrédient.",
  chapo:
    "Yuka et INCI Beauty sont fiables sur un point : elles lisent la vraie liste d'ingrédients. Elles ne donnent pas la même note parce qu'elles n'appliquent pas la même règle. ++Et une règle compte plus que les autres : la place de l'ingrédient qui fâche.++",
  publieLe: "2026-11-21",
  modifieLe: "2026-11-21",
  minutes: 7,
  theme: "yuka ou inci beauty",
  motsCles: [
    "yuka ou inci beauty",
    "inci beauty ou yuka",
    "yuka cosmétique",
    "yuka cosmétique fiable",
    "application yuka",
    "inci beauty avis",
    "inci beauty application gratuite",
    "application comme yuka pour cosmétique",
    "note yuka cosmétique",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/yuka-ou-inci-beauty.webp",
    alt: "Un rayon de parapharmacie rempli de crèmes, de lotions et de tubes alignés sur des étagères blanches.",
    largeur: 1200,
    hauteur: 930,
    credit: "ArionStar, via Wikimedia Commons",
    licence: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:Skin_care_cosmetics.jpg",
  },
  blocs: [
    { type: "h2", texte: "Yuka ou INCI Beauty : laquelle est la plus fiable ?" },
    {
      type: "p",
      texte:
        "Aucune ne ment, mais elles ne répondent pas à la même question. Les deux partent de la liste INCI, la liste officielle des ingrédients imprimée au dos, rangée du plus dosé au moins dosé. Ensuite, chacune classe les ingrédients avec ses propres sources, puis les transforme en note avec sa propre règle.",
    },
    {
      type: "p",
      texte:
        "Résultat : un même produit peut sortir vert ici et orange là. En 2018, Tom's Guide a scanné un déodorant Ushuaia : ==une note de 11,7 (sur 20) chez INCI Beauty, de 79 (sur 100) chez Yuka== ([Tom's Guide, 2018](https://www.tomsguide.fr/notation-des-cosmetiques-pourquoi-les-applications-donnent-des-resultats-differents/)). Pas une erreur : deux lectures.",
    },
    {
      type: "encadre",
      ton: "indigo",
      titre: "Pour être clair",
      texte:
        "Cosme Check est aussi une application qui lit les listes. On la présente plus bas, avec ce qu'elle fait autrement. Garde ça en tête en lisant ce comparatif.",
    },

    { type: "h2", texte: "Comment Yuka note-t-il un cosmétique ?" },
    {
      type: "p",
      texte:
        "Yuka donne à chaque ingrédient un niveau de risque : rouge (élevé), orange (modéré), jaune (faible) ou vert (aucun). ==La note du produit dépend de l'ingrédient le plus risqué==. Selon son aide officielle, un seul ingrédient rouge fait tomber la note sous 25 sur 100, et un orange au pire la garde sous 50 ([aide Yuka](https://help.yuka.io/l/en/article/2t20ixn5y5-evualuation-cosmetic-products)).",
    },
    {
      type: "p",
      texte:
        "Pour classer un ingrédient, Yuka dit s'appuyer sur des autorités comme le SCCS, l'ECHA ou l'Anses. Le SCCS, c'est le comité scientifique européen pour la sécurité des consommateurs. Yuka regarde aussi l'exposition : quantité utilisée, passage dans la peau, public visé ([aide Yuka](https://help.yuka.io/l/en/article/vt1zfwxjxb-classification-cosmetic-ingredients)). Sa page de méthode ne parle pas de la place de l'ingrédient dans la liste.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Sa force** : une règle simple et stricte. Un rouge, et le produit est rouge.",
        "**Sa limite** : un ingrédient en 2e place et le même en dernière place pèsent pareil dans cette règle.",
      ],
    },

    { type: "h2", texte: "Comment INCI Beauty note-t-il un cosmétique ?" },
    {
      type: "p",
      texte:
        "INCI Beauty donne une note sur 20 et une couleur à chaque ingrédient. On peut scanner un code-barres, mais aussi chercher un produit ou un ingrédient par son nom, sans l'avoir en main ([INCI Beauty](https://incibeauty.com/features)). L'application est gratuite, avec une offre Premium pour, entre autres, retirer la publicité ou travailler hors connexion.",
    },
    {
      type: "p",
      texte:
        "Selon Tom's Guide, sa note tient aussi compte de l'environnement, par exemple d'un ingrédient venu de la pétrochimie dans un produit qu'on ne rince pas. On n'a pas trouvé en ligne le détail de son calcul. INCI Beauty affirme qu'aucune marque ne peut influencer ses notes, et se finance par la publicité, le Premium et un comparateur de prix.",
    },

    { type: "h2", texte: "La place d'un ingrédient change-t-elle la note ?" },
    {
      type: "p",
      texte:
        "Énormément, quand l'application en tient compte. Dans la base Cosme Check, ==près d'un produit sur quatre contient au moins un ingrédient rouge== (114 527 sur 478 376). On a pris les 56 440 produits qui n'en ont qu'un, et regardé où il tombe dans la liste.",
    },
    {
      type: "tableau",
      entetes: ["Place du seul ingrédient rouge", "Produits", "Note médiane Cosme Check, sur 20"],
      lignes: [
        ["Dans les cinq premiers.", "14 605.", "2,92."],
        ["Au milieu de la liste.", "16 963.", "7,3."],
        ["Dans les 40 % de la fin.", "24 872.", "11,13."],
      ],
      legende: "Base Cosme Check, fiches actives, relevé du 21/11/2026. La médiane coupe le groupe en deux moitiés égales.",
    },
    {
      type: "p",
      texte:
        "Pourquoi la place compte : la loi européenne impose l'ordre décroissant des doses. Les ingrédients à 1 % ou moins peuvent venir dans n'importe quel ordre à la fin ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). En fin de liste, un ingrédient est souvent à des traces. ++Cosme Check suit cet ordre et l'intègre dans sa note.++",
    },
    {
      type: "p",
      texte:
        "Deux produits de la même marque le montrent. Le **baume à lèvres Acute Lip Balm d'Eucerin** a un seul ingrédient rouge, le BHT, en 21e et dernière place : 12,44 sur 20. La **crème Hyaluron-Filler Soin de Jour SPF 15 d'Eucerin** a aussi un seul rouge, l'octocrylène, un filtre solaire, mais en 5e place sur 27 : 1,08 sur 20.",
    },
    {
      type: "cta",
      texte:
        "**Ta crème est rouge quelque part ?** Scanne-la avec Cosme Check : tu vois l'ingrédient qui fâche, et sa place dans la liste.",
    },

    { type: "h2", texte: "Quel est l'ingrédient rouge le plus fréquent ?" },
    {
      type: "p",
      texte:
        "Le BHT. C'est un antioxydant, un ingrédient qui empêche les huiles de rancir. Il est le seul rouge de 12 649 produits de notre base, et ==il est en fin de liste dans 8 767 d'entre eux==.",
    },
    {
      type: "p",
      texte:
        "L'Union européenne l'a fait réévaluer pour un soupçon d'effet sur les hormones. En 2021, le SCCS l'a jugé sûr jusqu'à 0,8 % dans les crèmes et les produits rincés. Le plafond est plus bas dans le dentifrice et le bain de bouche ([avis SCCS/1636/21, Commission européenne, 2021](https://health.ec.europa.eu/publications/butylated-hydroxytoluene-bht_en)). Le classer rouge, c'est de la prudence. Sa place dit à quel point il pèse.",
    },

    { type: "h2", texte: "Comment lire une note d'appli en 30 secondes ?" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Ouvre le détail, pas seulement la pastille. Cherche l'ingrédient rouge ou orange qui fait la note.",
        "Regarde sa place. Dans les cinq premiers, il forme une bonne part du produit ; après le *Phenoxyethanol*, limité à 1 %, il est encore moins dosé.",
        "Demande-toi s'il te concerne. Un parfum compte beaucoup pour une peau qui réagit vite, moins pour un shampoing rincé en dix secondes.",
        "Compare dans le même rayon : un déodorant avec un déodorant, une crème avec une crème.",
        "Une grossesse, une peau qui réagit fort, un doute sérieux : demande à ton pharmacien ou à un dermatologue, pas à une pastille.",
      ],
    },
    {
      type: "p",
      texte:
        "Pour aller plus loin, [notre méthode en 5 étapes](/blog/analyse-composition-cosmetique) apprend à lire une liste sans aucune application. Et [les trois questions à se poser](/blog/cosmetique-fait-pour-toi) aident à savoir si un produit bien noté est fait pour toi.",
    },

    { type: "h2", texte: "Quelle application choisir pour tes cosmétiques ?" },
    {
      type: "liste",
      style: "puces",
      items: [
        "**Yuka**, pour une règle simple : le moindre ingrédient à risque élevé suffit à écarter le produit.",
        "**INCI Beauty**, pour chercher un produit par son nom et prendre en compte l'environnement.",
        "**Cosme Check**, pour un verdict qui tient compte de ta peau, de tes objectifs et des ingrédients que tu veux éviter, avec la place de chaque ingrédient dans la note.",
      ],
    },
    {
      type: "p",
      texte:
        "Les trois se trompent moins que l'avant du flacon. La vraie erreur, c'est de jeter une crème pour une pastille sans lire pourquoi. Pense à une crème qui affiche « peau sensible » : [six sur dix sont parfumées](/blog/type-de-peau) dans notre base, et c'est souvent ça qui gêne, bien avant une trace de BHT.",
    },
    {
      type: "p",
      texte:
        "Le chiffre à garder pour la fin : le methylparaben, un conservateur. Dans les cinq premiers ingrédients, la note médiane des produits qui l'ont pour seul rouge est de 2,9. En fin de liste, de 11,26. ++Même ingrédient, même couleur, presque quatre fois plus de points.++",
    },
  ],
  faq: [
    {
      question: "Qui est le plus fiable, Yuka ou INCI Beauty ?",
      reponse:
        "Les deux lisent la vraie liste d'ingrédients, mais avec des règles différentes. Yuka met un produit dans le rouge dès qu'un seul ingrédient est jugé à risque élevé. INCI Beauty note sur 20 et tient aussi compte de l'environnement. Pour trancher, ouvre le détail et regarde la place de l'ingrédient en cause dans la liste.",
    },
    {
      question: "Yuka est-il fiable pour les cosmétiques ?",
      reponse:
        "Yuka classe les ingrédients avec des sources sérieuses, comme le SCCS ou l'Anses. Sa règle est stricte : l'ingrédient le plus risqué décide de la note, même s'il est en toute fin de liste, donc peu dosé. Une note rouge est un signal pour lire le détail, pas un verdict sur la dose réelle.",
    },
    {
      question: "INCI Beauty est-elle une application gratuite ?",
      reponse:
        "Oui, on peut scanner un produit, le chercher par son nom et lire la fiche d'un ingrédient sans payer. Un compte gratuit ajoute des fonctions. L'offre Premium, payante, retire la publicité, permet d'analyser un produit sans code-barres à partir d'une photo, et de travailler hors connexion.",
    },
    {
      question: "Quelle application comme Yuka pour les cosmétiques ?",
      reponse:
        "INCI Beauty et Cosme Check lisent aussi les listes d'ingrédients. INCI Beauty donne une note sur 20 et permet de chercher un produit par son nom. Cosme Check donne un verdict selon ton type de peau et les ingrédients que tu veux éviter, et tient compte de la place de chaque ingrédient.",
    },
  ],
  notes: [
    { produit: "Eucerin, Acute Lip Balm", ean: "0000042172420", note: 12.44, releveeLe: "2026-11-21" },
    { produit: "Eucerin, Hyaluron-Filler Soin de Jour Peau Normale à Mixte SPF 15", ean: "4005800014697", note: 1.08, releveeLe: "2026-11-21" },
  ],
};

export default article;
