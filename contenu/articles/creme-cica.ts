import type { Article } from "@/contenu/articles";

/**
 * Publié le 20/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » (`creme-uree` sortait de la fenêtre des dix derniers) : la
 * Centella asiatica, et le mot « cica » qu'on lit sur les crèmes de
 * pharmacie. Volumes (`VOLUMES.md`) : « centella asiatica » 10 k à 100 k (dix
 * zones, 13/11/2026) ; « cicaplast » et « cicalfate » 10 k à 100 k, « cica »
 * 1 k à 10 k, « crème cica » 100 à 1 k (+900 % sur un an), « madecassoside »,
 * « crème centella », « centella asiatica crème » 100 à 1 k (France seule,
 * 20/11/2026). Suggestions Google du jour : « cicaplast ou cicalfate »,
 * « centella asiatica bienfaits visage », « centella asiatica danger »,
 * « cicalfate visage ». Premiers résultats : Aroma-Zone, Notino, une
 * pharmacie en ligne, des boutiques coréennes, un site de compléments ; aucun
 * ne compte les crèmes « cica » qui n'ont pas la plante.
 *
 * Chiffres : `cosme_check.catalog_export`, fiches actives, relevé du
 * 20/11/2026. Produits « cica » : nom qui contient « cica » hors
 * « cicatri… » (1 295). Centella comptée présente si la liste INCI contient
 * CENTELLA, MADECASS…, ASIATICOSIDE ou ASIATIC ACID : 914 avec, 381 sans
 * (29,4 %) ; place médiane 13e ; 135 dans les cinq premiers. Douze marques de
 * pharmacie et de grande surface (Avène, La Roche-Posay, Bioderma, Uriage,
 * Mixa, SVR, A-Derma, Noreva, Neutrogena, Eucerin, Vichy, CeraVe) : 237
 * produits « cica », 173 sans centella. Toutes les fiches avec centella :
 * 9 790, parfum dans 52,8 %. Les notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "creme-cica",
  titre: "Ta crème « cica » n'a peut-être jamais vu une feuille de centella : on a lu 1 295 listes, Cicaplast et Cicalfate compris",
  titreSeo: "Cicaplast, Cicalfate : où est la centella ?",
  resume:
    "Cicalfate, Mixa Cica, Bariéderm-Cica : 3 crèmes « cica » sur 10 n'ont aucune centella. Ce qu'on a lu dans 1 295 listes, et comment repérer la plante.",
  chapo:
    "« Cica » devrait vouloir dire *Centella asiatica*, une plante qu'on dit apaisante. Dans notre base, ==381 produits « cica » sur 1 295 n'en contiennent pas la moindre trace==, dont des crèmes très connues de pharmacie. ++Le mot sur le tube ne dit pas ce qu'il y a dedans : la liste, si.++",
  publieLe: "2026-11-20",
  modifieLe: "2026-11-20",
  minutes: 7,
  theme: "crème cica",
  motsCles: [
    "crème cica",
    "cica",
    "centella asiatica",
    "centella asiatica bienfaits visage",
    "centella asiatica danger",
    "cicaplast ou cicalfate",
    "cicaplast",
    "cicalfate",
    "madecassoside",
    "herbe du tigre",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/creme-cica.webp",
    alt: "Un tapis de feuilles rondes et vert tendre de Centella asiatica, la plante qu'on appelle aussi herbe du tigre.",
    largeur: 1200,
    hauteur: 800,
    credit: "HPN, via Wikimedia Commons",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Centella_asiatica_-_large.jpg",
  },
  blocs: [
    { type: "h2", texte: "La cica, c'est quoi ?" },
    {
      type: "p",
      texte:
        "La cica, c'est le surnom de la *Centella asiatica*, une petite plante des zones humides d'Asie, aussi appelée herbe du tigre ou gotu kola. En cosmétique, on la met dans les crèmes pour apaiser une peau qui tiraille ou qui rougit.",
    },
    {
      type: "p",
      texte:
        "Sur la liste INCI (la liste officielle des ingrédients, écrite du plus dosé au moins dosé), la plante ne s'appelle jamais « cica ». Tu peux lire son extrait, ou l'une des molécules qu'on en tire. Ces molécules portent des noms qui font peur, mais ce sont elles que les chercheurs étudient.",
    },
    {
      type: "fiche",
      titre: "Centella asiatica (cica)",
      inci: "CENTELLA ASIATICA EXTRACT, CENTELLA ASIATICA LEAF EXTRACT, MADECASSOSIDE, ASIATICOSIDE, ASIATIC ACID, MADECASSIC ACID",
      niveau: "incertain",
      effet:
        "Hydrate et apaise la peau selon de petites études sur volontaires. Ses molécules sont surtout étudiées en laboratoire.",
      statut:
        "Ingrédient cosmétique autorisé dans l'Union européenne, sans limite propre dans les annexes du règlement (CE) 1223/2009.",
    },

    { type: "h2", texte: "Combien de crèmes « cica » contiennent vraiment de la centella ?" },
    {
      type: "p",
      texte:
        "Sept sur dix seulement. On a relevé, le 20/11/2026, tous les produits de la base Cosme Check dont le nom contient « cica », puis cherché la plante ou l'une de ses molécules dans leur liste.",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Produits dont le nom contient « cica ».", "1 295."],
        ["Dont ceux sans aucune trace de centella.", "381, soit 29 %."],
        ["Place médiane de la centella, quand elle est là.", "13e."],
        ["Produits qui la mettent dans les cinq premiers ingrédients.", "135, un sur dix."],
        ["Produits « cica » de douze grandes marques de pharmacie et de supermarché.", "237."],
        ["Dont ceux sans centella.", "173, soit 73 %."],
      ],
      legende: "Base Cosme Check, fiches actives, relevé du 20/11/2026.",
    },
    {
      type: "p",
      texte:
        "Le chiffre change selon le rayon. ++En pharmacie et en grande surface, « cica » est surtout devenu un mot pour dire « crème réparatrice »++. Chez les marques coréennes, c'est souvent l'inverse : la plante arrive parfois en premier.",
    },

    { type: "h2", texte: "Que contiennent Cicalfate, Cicaplast et les autres ?" },
    {
      type: "p",
      texte:
        "Des listes très différentes sous le même mot. Voici ce qu'on lit dans les fiches de notre base, pour les crèmes les plus cherchées.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "**Avène Cicalfate+ Crème Réparatrice Protectrice** : aucune centella. Elle mise sur le sulfate de cuivre, le sulfate de zinc, l'oxyde de zinc et un ferment maison (*Aquaphilus Dolomiae Ferment Filtrate*). Note : 6,95 sur 20.",
        "**La Roche-Posay Cicaplast Baume B5** : la madécassoside, une molécule de la centella, arrive en 13e place sur 23. Le « B5 » est le panthénol, en 6e place. Note : 11,66 sur 20.",
        "**Mixa Cica-crème** : aucune centella. ==Ses onze premiers ingrédients sont ceux du Cicaplast, dans le même ordre==, sans la madécassoside. Note : 11,46 sur 20.",
        "**Uriage Bariéderm-Cica Crème au Cuivre-Zinc** : aucune centella, du cuivre, du zinc et du panthénol. Note : 7,85 sur 20.",
        "**Bioderma Cicabio crème** : trois molécules de la centella, entre la 17e et la 19e place sur 28. Note : 7,70 sur 20.",
        "**Dr.Jart+ Crème Cicapair** : la madécassoside en 27e place, et l'extrait de centella en ++dernière place sur 65++. Note : 8,28 sur 20.",
        "**Erborian Centella Barrier Cream** : l'extrait de feuille en 11e place. Note : 16,45 sur 20.",
        "**Skin1004 Madagascar Centella Hyalu-Cica First Ampoule** : l'extrait de centella en premier ingrédient. Note : 12,55 sur 20.",
      ],
    },
    {
      type: "p",
      texte:
        "Une crème sans centella n'est pas une mauvaise crème. Le Cicalfate+ et le Bariéderm-Cica misent sur d'autres ingrédients, et la note de Cosme Check ne mesure pas l'effet : elle lit la liste entière. ++Le seul problème, c'est de payer pour une plante qui n'est pas dans le pot.++",
    },
    {
      type: "cta",
      texte:
        "**Ta crème « cica » contient-elle vraiment la plante ?** Scanne-la avec Cosme Check : tu vois en dix secondes la liste dans l'ordre, et la place de chaque ingrédient.",
    },

    { type: "h2", texte: "Que dit la science sur la centella pour le visage ?" },
    {
      type: "p",
      texte:
        "Des résultats encourageants, mais sur de petits groupes. Une revue polonaise rappelle que la plante est utilisée depuis longtemps et que ses molécules aident, en laboratoire, les cellules qui fabriquent le collagène, la protéine qui rend la peau ferme ([Bylka et al., 2013](https://pubmed.ncbi.nlm.nih.gov/24278045/)).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Sur 25 volontaires, une crème à 5 % d'extrait a mieux hydraté la peau de l'avant-bras en quatre semaines, et limité une rougeur provoquée exprès ([Ratz-Łyko et al., 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4852572/)).",
        "Sur 20 femmes, un soin à la vitamine C et à la madécassoside a amélioré la souplesse et les ridules en six mois, chez deux sur trois ([Haftek et al., 2008](https://pubmed.ncbi.nlm.nih.gov/18503551/)). Impossible de dire ce qui revient à la madécassoside seule.",
      ],
    },
    {
      type: "p",
      texte:
        "Note la dose de la première étude : 5 % d'extrait. Une centella en 27e ou en 65e place est dosée bien en dessous. Le règlement européen permet d'écrire les ingrédients à 1 % ou moins dans n'importe quel ordre ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)) : en fin de liste, la plante sert surtout à remplir le nom.",
    },

    { type: "h2", texte: "La centella asiatica est-elle dangereuse sur la peau ?" },
    {
      type: "p",
      texte:
        "Rien ne le montre aux doses des cosmétiques. Elle est autorisée en Europe, et l'étude sur 25 volontaires n'a vu ni irritation ni allergie. Les mises en garde qu'on lit en ligne visent surtout les gélules à avaler, un autre sujet.",
    },
    {
      type: "p",
      texte:
        "Le risque, sur une peau sensible, vient plus souvent du reste de la liste. Dans notre base, ==plus d'un produit à la centella sur deux contient du parfum== (52,8 % de 9 790 fiches).",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Une nouvelle crème se teste derrière l'oreille ou dans le pli du coude, pendant 48 heures.",
        "Une peau qui picote, rougit ou gratte : arrête, et cherche *Parfum* dans la liste.",
        "Une plaie, une brûlure, une cicatrice ou une plaque qui ne part pas : demande conseil à ton pharmacien ou à un dermatologue, pas à un tube marqué « cica ».",
      ],
    },

    { type: "h2", texte: "Comment repérer une vraie crème à la centella ?" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Cherche dans la liste *Centella Asiatica*, *Madecassoside*, *Asiaticoside*, *Asiatic Acid* ou *Madecassic Acid*.",
        "Regarde sa place : dans les dix premiers, elle compte ; après un ingrédient connu pour être dosé à 1 %, elle pèse moins.",
        "Vérifie le reste : sans parfum si ta peau réagit vite, et un bon humectant en tête, comme la [glycérine](/blog/glycerine).",
        "Ne paie pas pour le mot « cica » seul : une simple [crème réparatrice](/blog/cremes-hydratantes-reparatrices) au panthénol fait souvent le même travail.",
      ],
    },
    {
      type: "p",
      texte:
        "Pour une peau qui tiraille en hiver, l'eau compte plus que la plante. Une crème à la glycérine ou à l'[urée](/blog/creme-uree), avec un corps gras pour garder l'eau, aide déjà une [peau sèche du visage](/blog/peau-seche-visage). La centella vient en plus, si elle est bien placée.",
    },
    {
      type: "p",
      texte:
        "Le meilleur geste est le plus court : lis la liste avant le nom. Avec [notre méthode en 5 étapes](/blog/analyse-composition-cosmetique), une minute suffit. Et souviens-toi de la Mixa et du Cicaplast : ++deux pots presque jumeaux, et un seul des deux contient la molécule de la plante++.",
    },
  ],
  faq: [
    {
      question: "Cicaplast ou Cicalfate : lequel choisir ?",
      reponse:
        "Ils ne contiennent pas la même chose. Le Cicaplast Baume B5 mise sur le panthénol et contient de la madécassoside, une molécule de la centella. La crème Cicalfate+ mise sur le cuivre, le zinc et un ferment, sans centella. Pour une plaie, une brûlure ou une cicatrice, demande conseil à ton pharmacien.",
    },
    {
      question: "Centella asiatica bienfaits visage : ça marche ?",
      reponse:
        "De petites études montrent qu'une crème à 5 % d'extrait hydrate mieux la peau et calme une rougeur provoquée, en quelques semaines. C'est prometteur, mais testé sur peu de personnes. Pour en profiter, la plante doit être assez haut dans la liste : en fin de liste, sa dose est trop faible pour compter.",
    },
    {
      question: "Centella asiatica danger : faut-il s'inquiéter ?",
      reponse:
        "Non, aux doses des cosmétiques, rien ne montre de danger : la plante est autorisée en Europe et bien tolérée dans les études. Les mises en garde qu'on lit visent surtout les gélules à avaler. Sur une peau sensible, regarde plutôt le parfum, présent dans plus d'un produit à la centella sur deux.",
    },
    {
      question: "Peut-on mettre Cicalfate sur le visage ?",
      reponse:
        "Oui, la crème est faite pour le visage et le corps, et Avène en vend aussi des versions pour le visage seul. Elle est riche et peut briller sur une peau grasse. Sache qu'elle ne contient pas de centella : dans son nom, « cica » ne désigne pas la plante.",
    },
  ],
  notes: [
    { produit: "Avène, Cicalfate+ Crème Réparatrice Protectrice (40 ml)", ean: "3282770204667", note: 6.95, releveeLe: "2026-11-20" },
    { produit: "La Roche-Posay, Cicaplast Baume B5", ean: "3337872413018", note: 11.66, releveeLe: "2026-11-20" },
    { produit: "Mixa, Cica-crème", ean: "3600550808339", note: 11.46, releveeLe: "2026-11-20" },
    { produit: "Uriage, Bariéderm-Cica Crème au Cuivre-Zinc (100 ml)", ean: "3661434004742", note: 7.85, releveeLe: "2026-11-20" },
    { produit: "Bioderma, Cicabio crème", ean: "3401397163496", note: 7.7, releveeLe: "2026-11-20" },
    { produit: "Dr.Jart+, Crème Cicapair (50 ml)", ean: "8809535806208", note: 8.28, releveeLe: "2026-11-20" },
    { produit: "Erborian, Centella Barrier Cream Baume Cica-réparateur (50 ml)", ean: "8809255789621", note: 16.45, releveeLe: "2026-11-20" },
    { produit: "Skin1004, Madagascar Centella Hyalu-Cica First Ampoule (100 ml)", ean: "8809576261486", note: 12.55, releveeLe: "2026-11-20" },
  ],
};

export default article;
