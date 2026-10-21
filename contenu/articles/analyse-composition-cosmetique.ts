import type { Article } from "@/contenu/articles";

/**
 * Publié le 21/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « Cosme Check pratique » (0 sur 10 avant ce jour) : la Search Console montre
 * déjà le site, sans clic, sur « analyse ingrédients cosmétiques » (position
 * 67), « analyse cosmétique » (39) et « analyse composition cosmétique en
 * ligne » (41) ; volumes dans `docs/seo/VOLUMES.md`. Les parts de produits
 * viennent de `cosme_check.catalog_export` (478 190 produits actifs avec une
 * liste INCI, relevé du 21/10/2026, lecture seule).
 */
const article: Article = {
  slug: "analyse-composition-cosmetique",
  titre: "Arrête de lire le devant du pot : 5 étapes pour analyser la composition d'un cosmétique",
  titreSeo: "Analyse composition cosmétique en 5 étapes",
  resume:
    "Analyser la composition d'un cosmétique sans être chimiste : 5 étapes pour lire la liste INCI, repérer le parfum, les allergènes et le vrai dosage des actifs.",
  chapo:
    "Pour analyser la composition d'un cosmétique, retourne le produit : la vérité est dans la **liste INCI**, au dos, pas dans les promesses du devant. Cinq étapes suffisent, et ++la plus utile tient en un seul mot à repérer++.",
  publieLe: "2026-10-21",
  modifieLe: "2026-10-21",
  minutes: 6,
  theme: "analyse composition cosmétique",
  motsCles: [
    "analyse composition cosmétique en ligne",
    "analyse ingrédients cosmétiques",
    "analyse cosmétique",
    "comment analyser un produit cosmétique",
    "lire une liste inci",
    "application analyse composition cosmétique",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/analyse-composition-cosmetique.webp",
    alt: "Deux petits pots de soin ouverts et une cuillère de poudre rose posés sur un fond rose pâle.",
    largeur: 1200,
    hauteur: 801,
    credit: "Shixart1985, via Wikimedia Commons",
    licence: "CC BY 2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Skin_care_products_displayed_on_a_light_pink_background_with_a_spoonful_of_powder_near_jars.jpg",
  },
  blocs: [
    { type: "h2", texte: "Étape 1 : où trouver la vraie composition ?" },
    {
      type: "p",
      texte:
        "La vraie composition, c'est la liste INCI. INCI veut dire « nomenclature internationale des ingrédients cosmétiques » : c'est la liste officielle, avec les mêmes noms dans tous les pays. Elle commence souvent par « Ingredients : » et elle est obligatoire sur tout cosmétique vendu en Europe ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)).",
    },
    {
      type: "p",
      texte:
        "Elle est au dos, sur la boîte ou sur une notice quand le tube est trop petit. Les noms sont en latin ou en anglais : *Aqua* pour l'eau, *Butyrospermum Parkii Butter* pour le beurre de karité. Pas de panique, personne ne les connaît tous par cœur.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Le devant du pot (« à l'aloe vera », « peau sensible », « naturel ») est de la publicité, pas une composition.",
        "Une photo de produit sur un site peut dater : la formule change parfois sans que l'emballage change beaucoup.",
      ],
    },

    { type: "h2", texte: "Étape 2 : pourquoi les cinq premiers ingrédients comptent le plus ?" },
    {
      type: "p",
      texte:
        "Parce que la liste est rangée du plus dosé au moins dosé. Les cinq premiers forment presque tout le produit : c'est la base, la texture. Dans notre base, ==près de deux produits sur trois commencent par de l'eau== (309 585 sur 478 190, relevé du 21/10/2026).",
    },
    {
      type: "p",
      texte:
        "Ensuite viennent souvent la [glycérine](/i/glycerin), qui retient l'eau dans la peau, des huiles ou des beurres, et des silicones comme la [dimethicone](/i/dimethicone), qui rendent la texture glissante. Regarde ce trio de tête : il te dit si la crème est plutôt légère ou riche, bien avant le mot « hydratant » du devant.",
    },

    { type: "h2", texte: "Étape 3 : comment trouver la « ligne du 1 % » ?" },
    {
      type: "p",
      texte:
        "C'est le réflexe que presque personne ne connaît. La loi oblige à ranger par dose les ingrédients au-dessus de 1 %. En dessous de 1 %, l'ordre est libre (règlement 1223/2009, article 19). Il suffit donc de trouver un ingrédient qui ne dépasse jamais 1 %.",
    },
    {
      type: "p",
      texte:
        "Le plus courant est le [phenoxyethanol](/i/phenoxyethanol). C'est un conservateur, un ingrédient qui empêche les microbes de pousser dans le pot. La loi le limite à 1 % (règlement 1223/2009, annexe V), et on le trouve dans ==un produit sur trois== de notre base. Tout ce qui est écrit après lui est dosé à 1 % au plus.",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "L'actif star est écrit après le *Phenoxyethanol* ? Il est là à petite dose. C'est souvent le cas de la [niacinamide](/blog/niacinamide) ou des extraits de plantes vantés sur l'étiquette.",
    },

    { type: "h2", texte: "Étape 4 : parfum et allergènes, que chercher ?" },
    {
      type: "p",
      texte:
        "Cherche le mot [Parfum](/i/parfum) ou *Fragrance*. Derrière ce seul mot se cache un mélange qui peut compter des dizaines de molécules, dont la recette reste secrète. Dans notre base, ==deux produits sur trois en contiennent== (318 072 sur 478 190).",
    },
    {
      type: "p",
      texte:
        "Certaines molécules du parfum doivent pourtant être écrites en clair, parce qu'elles peuvent provoquer une allergie : ce sont les allergènes à déclarer. Les plus fréquents sont [Limonene](/i/limonene), présent dans près d'un produit sur trois chez nous, [Linalool](/i/linalool), [Citral](/i/citral) et [Geraniol](/i/geraniol). Ils sont nommés au-delà de 0,001 % dans un soin qu'on garde sur la peau, 0,01 % dans un produit qu'on rince.",
    },
    {
      type: "p",
      texte:
        "La liste s'allonge : depuis le 31 juillet 2026, les nouveaux produits déclarent environ 80 substances parfumantes au lieu de 26, et tous les produits devront suivre la règle en 2028 ([règlement (UE) 2023/1545](https://eur-lex.europa.eu/eli/reg/2023/1545/oj)). Tu verras donc des noms nouveaux au dos de tes flacons.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Ta peau a déjà réagi à un produit : note les allergènes de sa liste et cherche-les dans le suivant.",
        "Une réaction qui revient, qui gratte fort ou qui gonfle : parles-en à un dermatologue ou à ton pharmacien, qui peut proposer un test.",
      ],
    },

    { type: "h2", texte: "Étape 5 : la promesse colle-t-elle à la formule ?" },
    {
      type: "p",
      texte:
        "Prends la promesse du devant et cherche-la dans la liste. Une crème « à l'aloe vera » dont l'[Aloe Barbadensis Leaf Juice](/i/aloe-barbadensis-leaf-juice) arrive après le phenoxyethanol en contient très peu. Un soin « à la vitamine B3 » doit afficher *Niacinamide*, et de préférence avant la ligne du 1 %.",
    },
    {
      type: "p",
      texte:
        "Un piège fréquent : « sans parfum » sur le devant, et *Limonene* au dos. Ce n'est pas forcément un mensonge. Les huiles essentielles contiennent ces molécules, et certaines marques n'appellent pas ça du parfum. Pour une peau qui réagit, c'est la liste qui compte, pas le mot du devant. Notre décryptage de la [crème Nivea](/blog/creme-nivea-composition) montre cette lecture, ligne par ligne.",
    },
    {
      type: "tableau",
      entetes: ["Tu lis", "Ça veut dire"],
      lignes: [
        ["[Aqua](/i/aqua)", "De l'eau, la base de la plupart des crèmes."],
        ["Parfum, Fragrance", "Un mélange de parfum, recette secrète."],
        ["Limonene, Linalool", "Des molécules du parfum qui peuvent être allergisantes."],
        ["Phenoxyethanol", "Un conservateur, 1 % au plus : ce qui suit est encore moins dosé."],
        ["CI 77891", "Un colorant ou un pigment (ici, le blanc du dioxyde de titane)."],
        ["(nano)", "Un ingrédient en particules très fines, signalé par la loi."],
      ],
    },

    { type: "h2", texte: "Et une application pour analyser la composition ?" },
    {
      type: "p",
      texte:
        "La méthode marche partout, mais elle prend du temps devant un rayon. Plusieurs applications lisent les listes pour toi : INCI Beauty, Yuka ou QuelProduit de l'UFC-Que Choisir donnent une note ou un niveau de risque, le même pour tout le monde. Cosme Check part d'une autre question : ce produit est-il fait pour **ta** peau ? On l'explique dans [« ce cosmétique est-il fait pour toi ? »](/blog/cosmetique-fait-pour-toi).",
    },
    {
      type: "p",
      texte:
        "Concrètement, tu scannes le code-barres, tu colles la liste INCI ou tu cherches le produit par son nom. Chaque ingrédient reçoit une couleur, du vert au rouge, et l'app signale ceux qui touchent ce que tu veux éviter.",
    },
    {
      type: "cta",
      texte:
        "**Pas le temps de chercher la ligne du 1 % en magasin ?** Scanne le code-barres avec Cosme Check : la liste s'affiche ingrédient par ingrédient, en couleurs.",
    },

    { type: "h2", texte: "Le geste bonus : le petit pot ouvert" },
    {
      type: "p",
      texte:
        "Une bonne composition ne sert à rien si le produit a tourné. Cherche le dessin d'un petit pot ouvert avec « 6M » ou « 12M » : c'est le nombre de mois pendant lesquels le produit reste bon après ouverture. Il est obligatoire quand le produit se garde plus de 30 mois ; sinon, une date « à utiliser de préférence avant » le remplace (règlement 1223/2009, article 19).",
    },
    {
      type: "p",
      texte:
        "Le réflexe simple : écris la date d'ouverture au feutre sous le pot. Et une crème qui change d'odeur, de couleur ou de texture part à la poubelle, même avant la date. Pour lire la suite d'une formule, notre article sur [les lip oils](/blog/lip-oils-huiles-levres) fait le même exercice sur un autre produit.",
    },
  ],
  faq: [
    {
      question: "Comment analyser un produit cosmétique ?",
      reponse:
        "Lis la liste INCI au dos, pas le devant. Regarde les cinq premiers ingrédients, qui forment presque tout le produit. Repère le phenoxyethanol, limité à 1 % : ce qui suit est encore moins dosé. Cherche ensuite le parfum et les allergènes, puis vérifie que l'actif promis apparaît assez haut dans la liste.",
    },
    {
      question: "Quel site pour analyser la composition d'un cosmétique ?",
      reponse:
        "Plusieurs outils gratuits lisent une liste INCI : INCI Beauty, Yuka, QuelProduit de l'UFC-Que Choisir et Cosme Check. Les premiers donnent une note ou un niveau de risque identique pour tout le monde. Cosme Check compare la formule à ton profil de peau et signale les ingrédients que tu veux éviter.",
    },
    {
      question: "Comment savoir si un produit cosmétique est encore bon ?",
      reponse:
        "Cherche le dessin du petit pot ouvert avec un nombre suivi de M, par exemple 12M : c'est la durée d'utilisation après ouverture, en mois. Sans ce dessin, une date « à utiliser de préférence avant » est imprimée. Une odeur, une couleur ou une texture qui change sont aussi des signes qu'il faut le jeter.",
    },
    {
      question: "Peut-on faire analyser un produit cosmétique en laboratoire ?",
      reponse:
        "Oui, mais ces analyses s'adressent surtout aux marques : elles vérifient la dose des conservateurs, des allergènes ou des actifs avant la vente. Pour un particulier, la liste INCI suffit presque toujours, car elle est obligatoire et contrôlée. En cas de réaction à un produit, le bon réflexe est de consulter un dermatologue.",
    },
  ],
};

export default article;
