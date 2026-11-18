import type { Article } from "@/contenu/articles";

/**
 * Publié le 18/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « comparatif honnête » (`cerave-gel-moussant` sortait de la fenêtre des dix
 * derniers). Volumes (`docs/seo/VOLUMES.md`, moins de 60 jours) : « cien
 * lidl » et « produits lidl » 1 k à 10 k (28/10 et 02/11/2026, concurrence
 * faible), « crème cien avis dermatologue » 1 k à 10 k, « crème cien » et
 * « crème cien avis » 100 à 1 k. Suggestions Google du jour : « cien est elle
 * une bonne marque », « creme cien avis dermatologue », « cien q10 intense fps
 * 15 », « creme solaire cien avis », « cien lidl creme visage ». Les premiers
 * résultats sont des fiches Que Choisir payantes, des articles qui relaient
 * un test à la fois et un blog : aucun ne lit la gamme entière.
 *
 * Chiffres : `cosme_check.catalog_export`, fiches actives, relevé du
 * 18/11/2026. « Cien » = marques qui commencent par « Cien » (Cien, Cien Men,
 * Cien Sun, Cien Nature, Cien Bio…), dédoublonnées par code-barres : 1 797
 * fiches, vendues dans plusieurs pays d'Europe. Crèmes visage = rubriques
 * « creme-visage », « creme-anti-age-visage-jour » et « -nuit » (95 fiches
 * Cien) ; « avec filtre » = au moins un filtre UV organique de l'annexe VI
 * dans la liste (23 fiches, médiane 7,63 ; 72 sans, médiane 16,18 ; aucune
 * avec filtre à 12 ou plus). Médianes des rayons : toutes marques
 * confondues, dédoublonnées par code-barres, même relevé. Les notes de
 * produits citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "cien-lidl",
  titre: "Cien de Lidl : on a lu 1 797 produits, et ses crèmes visage font mieux que la pharmacie (sauf une famille)",
  titreSeo: "Cien Lidl : que valent ses crèmes visage ?",
  resume:
    "Cien de Lidl : 1 797 produits lus. Les crèmes visage sans filtre solaire ont une médiane de 16,18, celles avec filtre 7,63. La raison, et quoi acheter.",
  chapo:
    "Oui, Cien est une bonne marque pour le visage : dans notre base, ses crèmes visage ont une note médiane plus haute que celles de Nivea, La Roche-Posay, Avène ou CeraVe. Mais il y a un piège. ++Dès qu'une crème Cien contient un filtre solaire, sa note est divisée par deux.++",
  publieLe: "2026-11-18",
  modifieLe: "2026-11-18",
  minutes: 7,
  theme: "cien lidl",
  motsCles: [
    "cien lidl",
    "crème cien",
    "crème cien avis",
    "cien lidl avis",
    "crème cien avis dermatologue",
    "cien q10 intense fps 15",
    "cien est elle une bonne marque",
    "crème solaire cien avis",
  ],
  categorie: "Marques",
  couverture: {
    src: "/image/blog/cien-lidl.webp",
    alt: "Une longue allée de supermarché Lidl, avec des rayons de chaque côté, des bacs de promotions et quelques clients au fond.",
    largeur: 960,
    hauteur: 533,
    credit: "Milliomos, via Wikimedia Commons",
    licence: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:Lidl_Inside2.jpg",
  },
  blocs: [
    { type: "h2", texte: "Cien est-elle une bonne marque ?" },
    {
      type: "p",
      texte:
        "Pour les soins du visage et des mains, oui, si on juge la liste des ingrédients. Cien est la marque de cosmétiques de Lidl. Notre base en compte ==1 797 fiches==, vendues en France, en Belgique, en Suisse et ailleurs en Europe. On les a toutes relues le 18/11/2026, rayon par rayon.",
    },
    {
      type: "p",
      texte:
        "Pour comparer, on utilise la note médiane. C'est la note du milieu : la moitié des produits fait mieux, l'autre moitié fait moins bien. Elle résume un rayon sans se laisser tirer par un produit extrême.",
    },
    {
      type: "tableau",
      entetes: ["Rayon", "Cien", "Tout le rayon"],
      lignes: [
        ["Crèmes visage.", "16,15 (30 crèmes).", "12,05 (8 099 crèmes)."],
        ["Eaux micellaires.", "16,09 (19).", "11,87 (2 385)."],
        ["Crèmes pour les mains.", "15,93 (29).", "11,89 (5 812)."],
        ["Gels douche.", "11,57 (163).", "11,51 (16 385)."],
        ["Shampooings.", "11,48 (21).", "11,32 (8 441)."],
        ["Crèmes solaires.", "6,76 (82).", "7,18 (9 856)."],
      ],
      legende:
        "Notes médianes, base Cosme Check, fiches actives, relevé du 18/11/2026. [Comment l'app note un produit](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "Le visage et les mains sortent du lot. Le corps et les cheveux restent dans la moyenne du rayon. Les crèmes solaires sont un peu en dessous. Pour situer : dans les mêmes crèmes visage, la médiane est de 11,6 chez Nivea, 11,64 chez La Roche-Posay, 11,73 chez Avène et 12,09 chez CeraVe.",
    },

    { type: "h2", texte: "Pourquoi la crème de jour Cien Q10 est-elle si mal notée ?" },
    {
      type: "p",
      texte:
        "À cause de ses filtres solaires, pas de son Q10. La Q10 Intense crème de jour FPS 15 obtient 8,04 sur 20. La crème de nuit de la même gamme, sans filtre, obtient 16,23 sur 20. Les deux pots partagent la base, le Q10 et la caféine. Même écart dans la gamme Cellintense, qui mise sur l'acide hyaluronique, une molécule qui retient l'eau à la surface de la peau.",
    },
    {
      type: "p",
      texte:
        "La différence tient en quatre lignes de la liste INCI, la liste officielle des ingrédients rangés du plus dosé au moins dosé. La crème de jour contient quatre filtres solaires : Ethylhexyl Salicylate, Ethylhexyl Triazone, Butyl Methoxydibenzoylmethane et Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine. Un filtre solaire est l'ingrédient qui arrête une partie des UV. Notre base classe ces quatre filtres en orange, et chacun fait perdre des points.",
    },
    {
      type: "tableau",
      entetes: ["Gamme Cien", "Crème de jour, avec filtre", "Crème de nuit, sans filtre"],
      lignes: [
        ["Q10 Intense.", "8,04 sur 20 (FPS 15).", "16,23 sur 20."],
        ["Cellintense Acide Hyaluronique.", "8,14 sur 20 (FPS 15).", "16,49 sur 20."],
      ],
      legende: "Notes de la base Cosme Check, relevé du 18/11/2026.",
    },
    {
      type: "p",
      texte:
        "La règle vaut pour toute la gamme. Sur 95 crèmes visage Cien, ==23 contiennent un filtre solaire, et aucune ne dépasse 12==. Les 72 autres ont une note médiane de 16,18. On avait vu le même écart dans [notre comparaison de 251 gammes jour et nuit](/blog/creme-de-nuit) : la crème de nuit est souvent la crème de jour, sans les filtres.",
    },
    {
      type: "encadre",
      ton: "ambre",
      titre: "Attention à la conclusion",
      texte:
        "Une note plus basse ne veut pas dire qu'il faut fuir la protection solaire. Elle dit que la liste contient des ingrédients que la base classe orange. Le geste du matin reste le même : une vraie crème solaire.",
    },

    { type: "h2", texte: "Que dit Que Choisir de la crème Cien Q10 ?" },
    {
      type: "p",
      texte:
        "Du bien, sur l'efficacité. Que Choisir a publié son [comparatif des crèmes antirides le 18/09/2025](https://www.quechoisir.org/comparatif-creme-antiride-n103/cien-lidl-q10-intense-fps-15-creme-de-jour-p281900/). Selon le résumé de [Croq'Kilos du 07/10/2025](https://www.croq-kilos.com/actus/anti-rides-2025-le-grand-comparatif-de-lufc-que-choisir-revele-une-surprise-de-taille), la Q10 Intense FPS 15 y finit deuxième, avec 14 points sur 20, derrière le Time-Filler 5XP de Filorga.",
    },
    {
      type: "p",
      texte:
        "Comment la même crème peut-elle avoir 14 chez Que Choisir et 8,04 chez nous ? ++Les deux notes ne mesurent pas la même chose.++ Que Choisir fait tester la crème par un panel pendant quatre semaines et mesure la peau. Cosme Check lit la liste et note chaque ingrédient. Une crème peut être efficace et contenir des ingrédients discutés. Les deux informations sont vraies en même temps.",
    },
    {
      type: "p",
      texte:
        "Et la fameuse « liste rouge » de Que Choisir contre trois produits Cien ? Elle n'existe pas. L'association l'a démentie elle-même : [« Non, Que Choisir n'a pas publié de liste rouge épinglant trois cosmétiques Cien »](https://www.quechoisir.org/actualite-liste-rouge-de-cosmetiques-publiee-par-que-choisir-une-fake-news-largement-relayee-n96956) (13/12/2021).",
    },
    {
      type: "cta",
      texte:
        "**Ta crème Cien, c'est laquelle ?** Scanne son code-barres avec Cosme Check : tu vois en dix secondes si elle contient un filtre solaire, la couleur de chaque ingrédient et sa note.",
    },

    { type: "h2", texte: "Quels produits Cien choisir ?" },
    {
      type: "p",
      texte:
        "Ceux qui font un seul travail, sans filtre solaire. Voici cinq produits Cien qui obtiennent plus de 16 dans la base, avec une liste courte ou des ingrédients tous verts ou jaunes.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Eau Micellaire (250 ml)**, 16,59 sur 20 : 19 ingrédients, des tensioactifs doux, sans parfum. Le bon geste pour s'en servir est dans [notre article sur l'eau micellaire](/blog/eau-micellaire-ou-huile-demaquillante).",
        "**Crème de Jour Anti-âge à l'Huile d'Argan Bio**, 16,52 sur 20 : une crème de jour sans filtre solaire.",
        "**Crème Mains Intensive MED 5 % Urée**, 16,51 sur 20 : l'urée attire l'eau dans la peau, et 5 % est une bonne dose pour des mains sèches ([tout sur l'urée](/blog/creme-uree)).",
        "**Sensitive Amande Crème Visage 24h**, 16,49 sur 20 : huile de tournesol, glycérine et beurre de karité en tête de liste.",
        "**Cellintense crème de nuit à l'acide hyaluronique**, 16,49 sur 20.",
      ],
    },
    {
      type: "p",
      texte:
        "Le matin, garde une vraie crème solaire par-dessus ta crème de jour. Une crème de jour à FPS 15 ne suffit pas pour une journée dehors. L'[Académie américaine de dermatologie (AAD)](https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-select-sunscreen) conseille un SPF 30 au moins, et [Test-Achats, qui a testé 23 crèmes de jour en 2026](https://www.test-achats.be/sante/sante-au-quotidien/creme-de-jour/news/creme-hydratante-avec-ou-sans-spf), dit la même chose. Le SPF, c'est l'indice qui dit combien la crème freine les UVB, les rayons qui brûlent. Les [7 erreurs qui gâchent une crème solaire](/blog/spf-50-visage-7-erreurs) valent aussi pour Cien Sun.",
    },

    { type: "h2", texte: "Quels produits Cien laisser en rayon ?" },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Les crèmes de jour à FPS 15 ou 6, si tu mets déjà une crème solaire : tu paies deux fois les filtres, et la crème perd la moitié de sa note.",
        "Les crèmes « or 24k » et les gammes à « venin de vipère » : la promesse est sur le pot, pas dans la liste. Elles tournent autour de 12.",
        "Les anti-transpirants aux sels d'aluminium, notés sous 4 comme l'Antitranspirant 48 h Invisible (3,36 sur 20). Le SCCS, le comité scientifique européen, les juge sûrs jusqu'à 6,25 % dans un déodorant non spray ([avis de 2020](https://health.ec.europa.eu/publications/safety-aluminium-cosmetic-products-submission-ii_en)). La base les note bas quand même : [on t'explique pourquoi](/blog/deodorant-sels-aluminium-verite).",
      ],
    },
    {
      type: "p",
      texte:
        "Le prix bas ne fait pas une mauvaise formule, et le prix haut n'en fait pas une bonne. On l'a déjà vu avec [les meilleures crèmes hydratantes visage](/blog/meilleures-cremes-hydratantes-visage). Chez Cien, ++la meilleure crème de la gamme Q10 est souvent celle qu'on range sur la table de nuit++.",
    },
  ],
  faq: [
    {
      question: "Cien est-elle une bonne marque ?",
      reponse:
        "Pour le visage et les mains, oui, d'après la liste des ingrédients. Dans notre base, ses crèmes visage ont une note médiane de 16,15, contre 12,05 pour l'ensemble du rayon. Ses gels douche et shampooings sont dans la moyenne. Ses crèmes solaires et ses crèmes de jour avec filtre sont nettement plus bas.",
    },
    {
      question: "Que pensent les dermatologues de la crème Cien ?",
      reponse:
        "Aucun avis de dermatologue publié ne juge toute la gamme. Les tests de Que Choisir donnent de bons résultats d'efficacité à la crème Q10 Intense FPS 15. Pour une peau qui réagit, une acné qui fait mal ou une plaque qui ne part pas, montre ta crème à un dermatologue ou à ton pharmacien.",
    },
    {
      question: "Que vaut la Cien Q10 Intense FPS 15 ?",
      reponse:
        "Elle est bien classée par Que Choisir sur l'efficacité, deuxième de son comparatif antirides de 2025 selon Croq'Kilos. Dans notre base, elle obtient 8,04 à cause de ses quatre filtres solaires classés orange. La crème de nuit de la même gamme, sans filtre, obtient 16,23.",
    },
    {
      question: "La crème solaire Cien est-elle bonne ?",
      reponse:
        "Sa liste est dans la moyenne basse du rayon : médiane de 6,76 dans notre base, contre 7,18 pour toutes les crèmes solaires. Presque toutes les crèmes solaires sont notées bas, à cause des filtres. La note ne mesure pas la protection : choisis un SPF 30 au moins et remets-en toutes les deux heures au soleil.",
    },
  ],
  notes: [
    { produit: "Cien, Q10 Intense Crème de Jour Anti-rides FPS 15 (50 ml)", ean: "4056489928522", note: 8.04, releveeLe: "2026-11-18" },
    { produit: "Cien, Q10 Intense Peaux normales Crème de nuit", ean: "4056489236108", note: 16.23, releveeLe: "2026-11-18" },
    { produit: "Cien, Cellintense Acide Hyaluronique Crème de Jour Raffermissant FPS 15 (50 ml)", ean: "4056489498919", note: 8.14, releveeLe: "2026-11-18" },
    { produit: "Cien, Cellintense Acide Hyaluronique Crème de Nuit Raffermissant (50 ml)", ean: "4056489498926", note: 16.49, releveeLe: "2026-11-18" },
    { produit: "Cien, Eau Micellaire (250 ml)", ean: "4056489350415", note: 16.59, releveeLe: "2026-11-18" },
    { produit: "Cien, Crème de Jour Anti-âge à l'Huile d'Argan Bio", ean: "4056489729242", note: 16.52, releveeLe: "2026-11-18" },
    { produit: "Cien, Crème Mains Intensive MED 5 % Urée", ean: "4056489431732", note: 16.51, releveeLe: "2026-11-18" },
    { produit: "Cien, Sensitive Amande Crème Visage 24h", ean: "4056489329800", note: 16.49, releveeLe: "2026-11-18" },
    { produit: "Cien, Déodorant Antitranspirant 48 h Invisible", ean: "4056489643654", note: 3.36, releveeLe: "2026-11-18" },
  ],
};

export default article;
