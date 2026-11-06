import type { Article } from "@/contenu/articles";

/**
 * Publié le 06/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « routines » (`peau-seche-visage` sortait de la fenêtre des dix derniers).
 * « eau micellaire » et « huile démaquillante » pèsent chacune 10 k à 100 k
 * recherches par mois, « double nettoyage visage » 1 k à 10 k (06/11/2026,
 * dix zones : France, Belgique, Suisse, Luxembourg, Monaco, Andorre, Canada,
 * Nouvelle-Calédonie, Polynésie française, Saint-Pierre-et-Miquelon ; toutes
 * langues : `docs/seo/VOLUMES.md`). Les premiers résultats sont des marques et
 * des parfumeries, qui disent qu'on ne rince pas sans jamais lire la liste.
 * Les chiffres viennent de `cosme_check.catalog_export` (fiches actives,
 * relevé du 06/11/2026, catégories « eau-micellaire », « huile-demaquillante »,
 * « huile-nettoyante-visage » et « lait-demaquillant »). Les notes citées sont
 * déclarées dans `notes`.
 */
const article: Article = {
  slug: "eau-micellaire-ou-huile-demaquillante",
  titre: "Désolé, mais ton eau micellaire n'est pas de l'eau : on a lu 3 456 listes (et les huiles démaquillantes aussi)",
  titreSeo: "Eau micellaire ou huile démaquillante ?",
  resume:
    "Eau micellaire ou huile démaquillante ? Ce que contiennent vraiment 3 456 eaux micellaires, s'il faut rincer, et laquelle choisir selon ton maquillage.",
  chapo:
    "L'eau micellaire convient à un maquillage léger, l'huile démaquillante à un maquillage longue tenue ou à une crème solaire. Mais une eau micellaire, ce n'est pas de l'eau : ==97 % de celles de notre base contiennent un tensioactif==, un ingrédient qui lave. ++Et c'est le seul nettoyant qu'on te dit de ne pas rincer.++",
  publieLe: "2026-11-06",
  modifieLe: "2026-11-06",
  minutes: 7,
  theme: "démaquillage",
  motsCles: [
    "eau micellaire",
    "huile démaquillante",
    "eau micellaire ou huile démaquillante",
    "eau micellaire faut il rincer",
    "double nettoyage visage",
    "baume démaquillant",
    "eau micellaire danger",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/eau-micellaire-cotons.webp",
    alt: "Trois cotons démaquillants ronds et blancs posés l'un sur l'autre sur un fond noir.",
    largeur: 1200,
    hauteur: 900,
    credit: "Evi Michailidou, via Wikimedia Commons",
    licence: "CC BY-SA 3.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Cotton_pads_-_%CE%94%CE%AF%CF%83%CE%BA%CE%BF%CE%B9_%CE%BD%CF%84%CE%B5%CE%BC%CE%B1%CE%BA%CE%B9%CE%B3%CE%B9%CE%AC%CE%B6.JPG",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, une eau micellaire ?" },
    {
      type: "p",
      texte:
        "Une eau micellaire, c'est de l'eau avec un peu de **tensioactif**, l'ingrédient qui lave dans un savon ou un gel douche. En petite dose, il forme des **micelles** : de minuscules boules qui attrapent le gras et le maquillage. Le coton les emporte.",
    },
    {
      type: "p",
      texte:
        "Sur la liste INCI (la liste officielle des ingrédients, écrite du plus dosé au moins dosé), le tensioactif porte des noms comme [Poloxamer 184](/i/poloxamer-184), [PEG-6 Caprylic/Capric Glycerides](/i/peg-6-caprylic-capric-glycerides) ou [Coco-Glucoside](/i/coco-glucoside). On a lu les 3 456 eaux micellaires de notre base, le 06/11/2026.",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Eaux micellaires avec au moins un tensioactif.", "3 372 sur 3 456, soit 97,6 %."],
        ["Avec un tensioactif dans les trois premiers ingrédients.", "48,3 %."],
        ["Avec un ammonium quaternaire (cetrimonium ou myrtrimonium bromide).", "864, soit 25 %."],
        ["Avec du parfum.", "53,4 %."],
        ["Avec de la glycérine.", "82,6 %."],
      ],
      legende: "Base Cosme Check, fiches actives, relevé du 06/11/2026.",
    },

    { type: "h2", texte: "Faut-il rincer l'eau micellaire ?" },
    {
      type: "p",
      texte:
        "Le flacon dit souvent non, mais un rinçage à l'eau tiède ne fait jamais de mal. Une équipe de Riga a testé 30 eaux micellaires : ==21 sur 30 promettaient une formule sans rinçage==, et leur pH allait de 4,25 à 7,87 ([Skadiņa, Nokalna et Balcere, *Dermato*, 2024](https://doi.org/10.3390/dermato4030009)). Le pH mesure l'acidité ; celui de la peau est autour de 5.",
    },
    {
      type: "p",
      texte:
        "Le point qui compte, c'est l'**ammonium quaternaire**. C'est un tensioactif chargé, qui sert aussi de conservateur. Dans une eau micellaire sur quatre, on trouve du [cetrimonium bromide](/i/cetrimonium-bromide) ou du [myrtrimonium bromide](/i/myrtrimonium-bromide). L'Europe le limite à 0,1 % comme conservateur, car ces ingrédients peuvent irriter la peau, surtout quand on en mélange plusieurs ([règlement (UE) 2014/866](https://eur-lex.europa.eu/eli/reg/2014/866/oj)).",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "Si ta peau tiraille ou rougit après l'eau micellaire, rince à l'eau tiède. Ça prend dix secondes, et ce qui lave ne reste pas sur ta peau toute la nuit.",
    },

    { type: "h2", texte: "Toutes les eaux micellaires se valent-elles ?" },
    {
      type: "p",
      texte:
        "Non, et l'écart est énorme, parfois dans la même marque. Les plus mal notées cumulent un ammonium quaternaire, du parfum et des ingrédients classés rouges. Les mieux notées lavent avec des tensioactifs doux, tirés du sucre ou de la glycérine.",
    },
    {
      type: "tableau",
      entetes: ["Eau micellaire", "Ce qui pèse dans la liste", "Note Cosme Check"],
      lignes: [
        ["Avène, Eau Micellaire Démaquillante.", "tensioactifs doux, parfum.", "16,32 sur 20."],
        ["CeraVe, Eau Micellaire Purifiante.", "céramides (des graisses de la peau), 23 ingrédients.", "15,88 sur 20."],
        ["Caudalie, Eau Micellaire Démaquillante.", "poloxamer, parfum.", "12,25 sur 20."],
        ["Bioderma, Sensibio H2O.", "cetrimonium bromide.", "11,73 sur 20."],
        ["Garnier, Skinactive Eau Micellaire Tout en 1.", "myrtrimonium bromide.", "11,23 sur 20."],
        ["Avène, Lotion Micellaire.", "cetrimonium bromide, parfum.", "6,95 sur 20."],
        ["La Roche-Posay, Eau Micellaire Ultra.", "BHT, quatre tensioactifs, parfum.", "1,34 sur 20."],
        ["Garnier, Eau Micellaire avec Huile d'Argan.", "D5, filtres solaires, parfum.", "1,12 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 06/11/2026.",
    },
    {
      type: "p",
      texte:
        "Les deux Avène le montrent bien : 16,32 pour l'eau démaquillante, 6,95 pour la lotion. La première lave au Coco-Glucoside, la seconde au cetrimonium bromide. Et l'eau micellaire biphasée de Garnier, celle qui se secoue, contient du [cyclopentasiloxane](/i/cyclopentasiloxane), le D5. L'Europe limitera ce silicone à 0,1 % dans les soins sans rinçage à partir de juin 2027 ([règlement (UE) 2024/1328](https://eur-lex.europa.eu/eli/reg/2024/1328/oj)). Pour lire une liste toi-même, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },
    {
      type: "cta",
      texte:
        "**Ton eau micellaire contient-elle un ammonium quaternaire ?** Scanne-la avec Cosme Check : la liste s'affiche avec la couleur de chaque ingrédient, en dix secondes.",
    },

    { type: "h2", texte: "Eau micellaire ou huile démaquillante : laquelle choisir ?" },
    {
      type: "p",
      texte:
        "Ça dépend de ce que tu enlèves. Le maquillage longue tenue, le mascara waterproof (qui résiste à l'eau) et la crème solaire sont faits pour coller à la peau. Une eau ne les dissout pas bien. Une huile, si : le gras dissout le gras.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Peau nue ou maquillage léger : une eau micellaire suffit, puis un rinçage.",
        "Fond de teint, mascara waterproof ou crème solaire : une huile ou un baume démaquillant.",
        "Peau qui tiraille : une huile, ou un lait sans parfum.",
        "Lentilles ou yeux sensibles : un produit testé pour les yeux, et jamais de frottement.",
      ],
    },
    {
      type: "p",
      texte:
        "Une bonne huile démaquillante contient un **émulsionnant**, un ingrédient qui la change en lait au contact de l'eau. C'est lui qui permet de la rincer sans film gras. Dans notre base, 85 % des 897 huiles démaquillantes en contiennent un, souvent le [Polyglyceryl-4 Oleate](/i/polyglyceryl-4-oleate) ou le [Sorbeth-30 Tetraoleate](/i/sorbeth-30-tetraoleate). Les autres sont de simples huiles, qui demandent un deuxième nettoyant.",
    },
    {
      type: "tableau",
      entetes: ["Huile ou baume", "Ce qui pèse dans la liste", "Note Cosme Check"],
      lignes: [
        ["Bioderma, Créaline Huile Micellaire.", "huiles et émulsionnant, sans parfum.", "20 sur 20."],
        ["SVR, Huile Démaquillante Physiopure.", "huiles végétales, parfum en dernier.", "16,75 sur 20."],
        ["Caudalie, Huile de Soin Démaquillante.", "huile de tournesol, parfum.", "16,66 sur 20."],
        ["DHC, Deep Cleansing Oil.", "huile d'olive, Sorbeth-30 Tetraoleate.", "11,93 sur 20."],
        ["Clinique, Take The Day Off Baume.", "polyéthylène, deux PEG.", "11,38 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 06/11/2026.",
    },
    {
      type: "p",
      texte:
        "Et la peau grasse ? Une huile ne la rend pas plus grasse si elle se rince bien. Le mot **comédogène** (qui bouche les pores) vient de vieux tests sur des oreilles de lapin : notre article sur [le mot comédogène](/blog/comedogene) explique pourquoi il faut s'en méfier.",
    },

    { type: "h2", texte: "Le double nettoyage, c'est utile ?" },
    {
      type: "p",
      texte:
        "Oui, les jours de maquillage ou de crème solaire. Le **double nettoyage** vient de la routine coréenne : une huile ou un baume d'abord, pour le gras, puis un gel ou une crème lavante, pour l'eau et la sueur. Les autres soirs, un seul nettoyant doux suffit.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Sur peau sèche, masse l'huile une minute avec les doigts, sans oublier les ailes du nez.",
        "Mouille tes mains et masse encore : l'huile devient laiteuse.",
        "Rince à l'eau tiède, jamais chaude.",
        "Passe un nettoyant doux, rince et tapote avec une serviette propre.",
        "Mets ta crème sur une peau encore un peu humide.",
      ],
    },
    {
      type: "p",
      texte:
        "L'Académie américaine de dermatologie donne les mêmes gestes : eau tiède, bout des doigts, nettoyant doux et sans alcool, jamais de frottement ([AAD](https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101)). Si ta peau reste rouge ou brûle après le démaquillage, parles-en à ton pharmacien ou à un dermatologue. Pour la suite de la routine, l'ordre complet est dans notre [routine skincare](/blog/routine-skincare), et la crème solaire du matin dans [les 7 erreurs du SPF](/blog/spf-50-visage-7-erreurs).",
    },

    { type: "h2", texte: "Et le lait démaquillant ?" },
    {
      type: "p",
      texte:
        "C'est le produit le plus parfumé du rayon : ==84 % des 1 076 laits de notre base contiennent du parfum==. Et c'est là que le parfum pèse le plus. Les laits parfumés ont une note médiane de 11,93 sur 20, les laits sans parfum de 16,12.",
    },
    {
      type: "p",
      texte:
        "Le meilleur pour la fin : le concombre, le raisin ou la rose écrits en gros sur le flacon. Dans ==deux tiers des eaux micellaires qui contiennent un extrait de plante, le tensioactif passe avant lui dans la liste== (1 540 sur 2 337). ++Ce qui travaille, c'est ce qui lave, pas ce qui est dessiné.++ La glycérine, elle, est dans 83 % d'entre elles : notre article sur [la glycérine](/blog/glycerine) dit pourquoi c'est une bonne nouvelle, et nos [gestes pour la peau sèche](/blog/peau-seche-visage) complètent le démaquillage des soirs d'hiver.",
    },
  ],
  faq: [
    {
      question: "Est-ce que l'eau micellaire se rince ?",
      reponse:
        "Le flacon dit souvent non, mais rincer à l'eau tiède est une bonne idée. Une eau micellaire contient un tensioactif, l'ingrédient qui lave, et une sur quatre un ammonium quaternaire, que l'Europe limite parce qu'il peut irriter. Si ta peau tiraille ou rougit, rince à chaque fois.",
    },
    {
      question: "Est-ce que l'eau micellaire enlève la crème solaire ?",
      reponse:
        "Mal. Les crèmes solaires sont faites pour résister à l'eau et à la sueur, comme le maquillage longue tenue. Une huile ou un baume démaquillant les dissout bien mieux, parce que le gras dissout le gras. Passe ensuite un nettoyant doux et rince : c'est le principe du double nettoyage.",
    },
    {
      question: "Est-ce que l'eau micellaire assèche la peau ?",
      reponse:
        "Elle peut, chez les peaux sèches ou réactives, surtout si on frotte et qu'on ne rince pas. Le tensioactif enlève une partie du gras de la peau en même temps que le maquillage. Choisis une formule sans parfum ni ammonium quaternaire, rince à l'eau tiède et mets ta crème juste après.",
    },
    {
      question: "Huile démaquillante ou baume : lequel choisir ?",
      reponse:
        "Ils font le même travail : un baume est une huile rendue solide par des cires. Le baume coule moins et voyage mieux, l'huile s'étale plus vite. Le plus important est dans la liste : un émulsionnant, pour qu'il se rince sans film gras, et si possible pas de parfum.",
    },
  ],
  notes: [
    { produit: "Avène, Eau Micellaire Démaquillante (200 ml)", ean: "3282770152463", note: 16.32, releveeLe: "2026-11-06" },
    { produit: "CeraVe, Eau Micellaire Purifiante peaux normales à grasses (400 ml)", ean: "3337875953160", note: 15.88, releveeLe: "2026-11-06" },
    { produit: "Caudalie, Eau Micellaire Démaquillante (200 ml)", ean: "3522930001423", note: 12.25, releveeLe: "2026-11-06" },
    { produit: "Bioderma, Sensibio H2O Eau Micellaire Démaquillante (500 ml)", ean: "3701129808719", note: 11.73, releveeLe: "2026-11-06" },
    { produit: "Garnier, Skinactive Eau Micellaire Tout en 1 (400 ml)", ean: "3600541358478", note: 11.23, releveeLe: "2026-11-06" },
    { produit: "Avène, Lotion Micellaire (400 ml)", ean: "3282770037364", note: 6.95, releveeLe: "2026-11-06" },
    { produit: "La Roche-Posay, Eau Micellaire Ultra (50 ml)", ean: "3337872414978", note: 1.34, releveeLe: "2026-11-06" },
    { produit: "Garnier, Eau Micellaire avec Huile d'Argan (100 ml)", ean: "3600542109741", note: 1.12, releveeLe: "2026-11-06" },
    { produit: "Bioderma, Créaline Huile Micellaire (150 ml)", ean: "3701129680780", note: 20, releveeLe: "2026-11-06" },
    { produit: "SVR, Huile Démaquillante Physiopure (150 ml)", ean: "3662361003273", note: 16.75, releveeLe: "2026-11-06" },
    { produit: "Caudalie, Huile de Soin Démaquillante (100 ml)", ean: "3522930001713", note: 16.66, releveeLe: "2026-11-06" },
    { produit: "DHC, Deep Cleansing Oil (70 ml)", ean: "4511413305478", note: 11.93, releveeLe: "2026-11-06" },
    { produit: "Clinique, Take The Day Off Baume Démaquillant (125 ml)", ean: "0020714215552", note: 11.38, releveeLe: "2026-11-06" },
  ],
};

export default article;
