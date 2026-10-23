import type { Article } from "@/contenu/articles";

/**
 * Publié le 23/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » : « comédogène » pèse 1 k à 10 k recherches par mois avec
 * une concurrence faible, « non comédogène », « crème non comédogène »,
 * « huile non comédogène » et « maquillage non comédogène » 100 à 1 k
 * chacune (`docs/seo/VOLUMES.md`, 20 et 23/10/2026). Les premiers résultats
 * sont des pages de marques et de revendeurs, et des listes recopiées de
 * l'échelle de 0 à 5 sans dire d'où elle vient. Les fréquences d'ingrédients
 * viennent de la base (`cosme_check.ingredients.prevalence_pct`, relevé du
 * 23/10/2026).
 */
const article: Article = {
  slug: "comedogene",
  titre: "Comédogène : pourquoi ta crème « non comédogène » peut quand même boucher tes pores",
  titreSeo: "Comédogène : définition et ingrédients à éviter",
  resume:
    "Comédogène veut dire « qui peut boucher les pores ». D'où vient l'échelle de 0 à 5, ce que vaut la mention « non comédogène » et comment lire la liste INCI.",
  chapo:
    "Un produit **comédogène**, c'est un produit qui peut boucher les pores et faire apparaître des points noirs ou des points blancs. Le mot est partout sur les crèmes. Mais les listes d'ingrédients « à fuir » viennent de vieux tests faits sur des oreilles de lapin, et ++la mention « non comédogène » ne garantit rien pour ta peau à toi++.",
  publieLe: "2026-10-23",
  modifieLe: "2026-10-23",
  minutes: 6,
  theme: "comédogène",
  motsCles: [
    "comédogène",
    "non comédogène",
    "ingrédients comédogènes",
    "crème non comédogène",
    "huile non comédogène",
    "maquillage non comédogène",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/comedogene.webp",
    alt: "Un pot en verre rempli d'huile de coco blanche et solide, avec une petite cuillère en bois posée dessus, sur une table en bois peint.",
    largeur: 960,
    hauteur: 640,
    credit: "Dana Tentis, via StockSnap",
    licence: "CC0",
    source: "https://stocksnap.io/photo/oil-white-BXII7UT7EX",
  },
  blocs: [
    { type: "h2", texte: "Que veut dire « comédogène » ?" },
    {
      type: "p",
      texte:
        "Comédogène veut dire « qui fabrique des comédons ». Un comédon, c'est un pore bouché. Ouvert, il s'oxyde à l'air et devient un **point noir**. Fermé, il reste sous la peau et forme un **point blanc**, ce petit grain qu'on sent sous le doigt.",
    },
    {
      type: "p",
      texte:
        "Le bouchon se forme avec deux choses : le sébum, c'est-à-dire le gras naturel que la peau fabrique, et les cellules mortes de la surface. Certains ingrédients gras ou cireux peuvent s'ajouter au mélange et aider le bouchon à tenir. Un produit **non comédogène**, c'est un produit dont la marque affirme qu'il ne favorise pas ces bouchons.",
    },
    {
      type: "encadre",
      ton: "indigo",
      titre: "À retenir",
      texte:
        "Comédogène ne veut pas dire toxique, ni mauvais. Ça veut dire : ==peut boucher les pores chez certaines peaux, à une certaine dose==.",
    },

    { type: "h2", texte: "D'où vient l'échelle de comédogénicité de 0 à 5 ?" },
    {
      type: "p",
      texte:
        "Elle vient de tests faits à partir des années 1970 sur l'oreille du lapin. Le dermatologue américain Albert Kligman a décrit en 1972 des boutons provoqués par les cosmétiques, puis des équipes ont testé les ingrédients **un par un, souvent purs**, sur cette peau très sensible. Chaque ingrédient a reçu une note : 0 pour « ne bouche pas », 5 pour « bouche beaucoup ».",
    },
    {
      type: "p",
      texte:
        "Ce sont ces notes qui circulent aujourd'hui sur les blogs et les réseaux, dans des tableaux recopiés de site en site. Elles ont un défaut majeur : ++elles notent un ingrédient seul, pas la crème que tu tiens dans la main++.",
    },

    { type: "h2", texte: "Pourquoi une liste d'ingrédients comédogènes ne suffit pas ?" },
    {
      type: "p",
      texte:
        "Parce que la dose et la formule changent tout. Une huile testée pure n'a rien à voir avec la même huile à 2 % dans un gel léger. En 2006, deux chercheurs ont repris la question ([Draelos et DiNardo, *Journal of the American Academy of Dermatology*, 2006](https://doi.org/10.1016/j.jaad.2005.11.1058)). Leur conclusion : un produit fini qui contient un ingrédient réputé comédogène n'est **pas forcément** comédogène. Il faut tester le produit entier, sur de vraies personnes.",
    },
    {
      type: "p",
      texte:
        "Voici les ingrédients qu'on retrouve le plus souvent dans ces listes, et leur place dans notre base. Un ester gras, c'est une huile fabriquée à partir d'un acide gras, qui rend la texture glissante. Un émulsifiant, c'est ce qui permet à l'eau et à l'huile de se mélanger.",
    },
    {
      type: "tableau",
      entetes: ["Ingrédient (nom INCI)", "Ce que c'est", "Présent dans"],
      lignes: [
        ["[Isopropyl Myristate](/i/isopropyl-myristate).", "Un ester gras qui rend la crème glissante.", "3,9 % des produits."],
        ["[Isopropyl Palmitate](/i/isopropyl-palmitate).", "Un ester gras proche du précédent.", "2,7 % des produits."],
        ["[Cocos Nucifera Oil](/i/cocos-nucifera-oil).", "L'huile de coco.", "6,9 % des produits."],
        ["[Lanolin](/i/lanolin).", "La graisse de la laine de mouton.", "1,0 % des produits."],
        ["[Laureth-4](/i/laureth-4).", "Un émulsifiant.", "1,3 % des produits."],
        ["[Myristyl Myristate](/i/myristyl-myristate).", "Une cire qui épaissit la texture.", "0,7 % des produits."],
      ],
      legende:
        "Part des produits de la base Cosme Check qui contiennent l'ingrédient (relevé du 23/10/2026). Être dans la liste ne veut pas dire boucher les pores dans ce produit-là.",
    },

    { type: "h2", texte: "Que garantit la mention « non comédogène » ?" },
    {
      type: "p",
      texte:
        "Elle garantit qu'un test a été fait, pas qu'il a été fait sur une peau comme la tienne. En Europe, toute promesse écrite sur un cosmétique doit être prouvée ([règlement (UE) 655/2013](https://eur-lex.europa.eu/eli/reg/2013/655/oj)). Mais aucun test officiel commun n'est imposé pour dire « non comédogène ». Chaque marque choisit sa méthode.",
    },
    {
      type: "p",
      texte:
        "Le plus souvent, le produit est appliqué sur le dos de quelques volontaires pendant plusieurs semaines, puis on compte les comédons. Le dos n'est pas le visage, et un petit groupe ne représente pas toutes les peaux. La mention reste un **bon indice**, surtout pour une peau grasse. Ce n'est pas une promesse.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Cherche plutôt « testé sur peaux grasses » ou « testé sur peaux à tendance acnéique » : c'est plus précis que « non comédogène » seul.",
        "Lis quand même la liste INCI : la mention ne remplace pas un coup d'œil aux premiers ingrédients.",
        "Méfie-toi de « convient à tous les types de peau » : aucune formule ne convient à tout le monde.",
      ],
    },

    { type: "h2", texte: "Comment repérer un produit à risque dans la liste INCI ?" },
    {
      type: "p",
      texte:
        "La liste INCI, c'est la liste officielle des ingrédients, du plus dosé au moins dosé. Un ingrédient réputé comédogène pèse donc surtout s'il est **dans les cinq premiers**. Placé en fin de liste, il est souvent à moins de 1 %. Notre méthode pour [analyser une composition](/blog/analyse-composition-cosmetique) explique comment repérer cette limite.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Regarde d'abord ce qui reste sur la peau toute la journée : crème, fond de teint, crème solaire. Un nettoyant rincé au bout d'une minute compte beaucoup moins.",
        "Repère les ingrédients du tableau dans les cinq premiers. S'il y en a deux ou trois sur une peau qui fait déjà des points noirs, prends une texture plus légère.",
        "Teste un seul nouveau produit à la fois, pendant au moins quatre semaines. Un comédon met plusieurs semaines à se former : un bouton le lendemain vient rarement de la crème de la veille.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ne bannis pas toutes les huiles. L'huile de [jojoba](/i/simmondsia-chinensis-seed-oil) ou le [squalane](/i/squalane) sont notés très bas sur ces échelles.",
        "Ne confonds pas « occlusif » et « comédogène ». Occlusif veut dire qui forme un film pour garder l'eau dans la peau : la [vaseline](/i/petrolatum) l'est beaucoup, mais elle est notée très bas.",
        "Ne décape pas ta peau pour compenser. Un nettoyant trop fort assèche, et ne débouche rien.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Ta crème, en dix secondes.** Scanne-la ou colle sa liste INCI dans Cosme Check : l'app te montre en couleurs les ingrédients que tu préfères éviter.",
    },

    { type: "h2", texte: "Et si les points noirs ne venaient pas de ta crème ?" },
    {
      type: "p",
      texte:
        "Souvent, ils viennent d'ailleurs. Le sébum varie avec l'âge, les hormones et la saison. Le frottement compte aussi : un casque, une mentonnière, un téléphone collé à la joue. Pour une peau qui marque, la [niacinamide](/blog/niacinamide) aide à limiter le sébum, et notre guide des [produits anti-imperfections](/blog/meilleurs-produits-anti-imperfections) range les actifs selon le type de bouton.",
    },
    {
      type: "p",
      texte:
        "Le suspect qu'on oublie presque toujours : ++les produits pour les cheveux++. Huile, cire, crème coiffante, après-shampooing sans rinçage glissent sur le front, les tempes et le contour du visage pendant la nuit. Si tes points noirs se rangent le long de la ligne des cheveux, lis d'abord la liste de ces flacons-là. Et si les boutons font mal, laissent des marques ou ne partent pas, parles-en à un dermatologue.",
    },
  ],
  faq: [
    {
      question: "Qu'est-ce qu'un produit non comédogène ?",
      reponse:
        "C'est un produit dont la marque affirme qu'il ne bouche pas les pores. En Europe, la promesse doit être prouvée, mais aucun test commun n'est imposé : chaque marque choisit sa méthode, souvent sur le dos de quelques volontaires. C'est un bon indice pour une peau grasse, pas une garantie pour toutes les peaux.",
    },
    {
      question: "L'huile de coco est-elle comédogène ?",
      reponse:
        "Elle est notée haut sur les échelles classiques, testée pure. Sur le visage d'une peau grasse qui fait des points noirs, mieux vaut l'éviter en tête de liste dans une crème qui reste toute la journée. Dans un gel douche rincé, ou en fin de liste, elle pose rarement problème.",
    },
    {
      question: "Quelles huiles ne sont pas comédogènes ?",
      reponse:
        "Aucune huile n'est sans risque pour toutes les peaux, mais certaines sont notées très bas sur les échelles : l'huile de jojoba, le squalane, l'huile de pépins de raisin ou l'huile de chanvre, par exemple. Teste-les une à la fois, quelques semaines, et observe ta peau.",
    },
    {
      question: "La vaseline est-elle comédogène ?",
      reponse:
        "Sur les échelles classiques, la vaseline (Petrolatum) est notée très bas. Elle est très occlusive : elle forme un film qui garde l'eau dans la peau, ce qui n'est pas la même chose que boucher un pore. Sur une peau très grasse, une couche épaisse sur tout le visage reste toutefois lourde.",
    },
  ],
};

export default article;
