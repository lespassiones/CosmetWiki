import type { Article } from "@/contenu/articles";

/**
 * Publié le 19/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz » : la boîte bleue fait la une des magazines beauté depuis début
 * octobre 2026, et « crème nivea » pèse 10 k à 100 k recherches par mois
 * (`docs/seo/VOLUMES.md`). La liste INCI vient de la fiche officielle Nivea,
 * identique à celle de la base Cosme Check ; les deux notes sont relevées
 * dans `cosme_check.catalog_export` (champ `notes`).
 */
const article: Article = {
  slug: "creme-nivea-composition",
  titre: "Crème Nivea : on a lu les 21 ingrédients de la boîte bleue (tu vas la regarder autrement)",
  titreSeo: "Crème Nivea : la composition de la boîte bleue",
  resume:
    "Crème Nivea : on a lu les 21 ingrédients de la boîte bleue. Ce qu'ils font, ce qu'ils ne font pas (soleil, rides) et la note que lui donne Cosme Check.",
  chapo:
    "La crème Nivea, c'est surtout **de l'eau, de l'huile minérale et des cires** : un mélange simple qui hydrate en posant un film sur la peau. Elle ne protège pas du soleil et ne lisse pas les rides. On a lu ses 21 ingrédients, et ++la fin réserve une surprise++.",
  publieLe: "2026-10-19",
  modifieLe: "2026-10-19",
  minutes: 6,
  theme: "crème nivea",
  motsCles: [
    "crème nivea composition",
    "nivea creme",
    "crème nivea visage",
    "nivea boîte bleue",
    "crème nivea danger",
    "la crème nivea est elle bonne pour le visage",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/creme-nivea-composition.webp",
    alt: "Une ancienne boîte ronde de crème Nivea en métal bleu, avec l'inscription « Nivea Creme zur Hautpflege » en lettres jaunes.",
    largeur: 1200,
    hauteur: 1200,
    credit: "Berthold Werner, via Wikimedia Commons",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Nivea_Creme_BW_2025-07-05_16-51-45_s.jpg",
    // Image carrée dans un bandeau : centrée, le mot NIVEA était coupé en haut (capture du 19/10/2026).
    position: "50% 28%",
  },
  blocs: [
    { type: "h2", texte: "Qu'est-ce qu'il y a dans la crème Nivea ?" },
    {
      type: "p",
      texte:
        "La crème Nivea contient 21 ingrédients, et les quatre premiers font presque tout le travail : de l'eau, une huile minérale et deux cires. On le lit dans sa liste INCI : c'est la liste officielle des ingrédients, du plus dosé au moins dosé. Celle de [la fiche Nivea](https://www.nivea.fr/produits/creme-multi-usage-hydratante-eucerit-34140908013290040.html) est identique à celle de notre base.",
    },
    {
      type: "p",
      texte:
        "La recette date de 1911. Son secret, l'Eucerit, est un émulsifiant : un ingrédient qui fait tenir l'eau et le gras ensemble. Il vient de la lanoline, la graisse de la laine de mouton ([histoire de Beiersdorf](https://www.beiersdorf.com/about-us/our-history/founding-history)).",
    },
    {
      type: "tableau",
      entetes: ["Ingrédients (noms INCI)", "Ce qu'ils font", "Couleur Cosme Check"],
      lignes: [
        ["Aqua", "De l'eau, la base de la crème.", "vert"],
        [
          "[Paraffinum Liquidum](/i/paraffinum-liquidum), [Paraffin](/i/paraffin), [Cera Microcristallina](/i/cera-microcristallina)",
          "Une huile et des cires minérales qui posent un film sur la peau.",
          "orange",
        ],
        ["[Glycerin](/i/glycerin), [Panthenol](/i/panthenol)", "Elles attirent l'eau et la gardent.", "vert"],
        ["[Lanolin Alcohol](/i/lanolin-alcohol) (Eucerit)", "Il lie l'eau et le gras.", "vert"],
        ["[Decyl Oleate](/i/decyl-oleate), [Octyldodecanol](/i/octyldodecanol)", "Des corps gras légers, pour étaler facilement.", "vert"],
        [
          "[Magnesium Sulfate](/i/magnesium-sulfate), [Aluminum Stearates](/i/aluminum-stearates), Magnesium Stearate, Citric Acid",
          "Ils tiennent la texture et règlent l'acidité.",
          "jaune (acide citrique : vert)",
        ],
        ["[Parfum](/i/parfum) et 7 allergènes", "L'odeur Nivea.", "jaune"],
      ],
      legende:
        "Couleurs relevées dans la base Cosme Check le 19/10/2026. [Comment l'app classe les ingrédients](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "**Aluminum Stearates** est un épaississant, rien à voir avec les sels d'aluminium des anti-transpirants ([on t'explique la différence](/blog/deodorant-sels-aluminium-verite)). Et la liste ne contient aucun conservateur, l'ingrédient qui empêche les microbes de pousser dans le pot.",
    },

    { type: "h2", texte: "L'huile minérale de la crème Nivea est-elle dangereuse ?" },
    {
      type: "p",
      texte:
        "Non : sur la peau, l'huile minérale des cosmétiques ne pose pas de risque connu. Une huile minérale, c'est une huile tirée du pétrole puis purifiée. En 2018, l'institut allemand d'évaluation des risques n'attendait aucun risque pour la santé avec celles des cosmétiques ([avis du BfR, 2018](https://www.bfr.bund.de/cm/343/hochraffinierte-mineraloele-in-kosmetika-gesundheitliche-risiken-sind-nach-derzeitigem-kenntnisstand-nicht-zu-erwarten.pdf)). L'Europe n'autorise que des huiles au raffinage entièrement connu ([règlement (CE) 1223/2009](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)).",
    },
    {
      type: "p",
      texte:
        "Son vrai rôle : elle est occlusive, ce qui veut dire qu'elle empêche l'eau de la peau de s'évaporer. Selon une revue scientifique, la lanoline et l'huile minérale réduisent ainsi de ==20 à 30 % la perte d'eau== de la peau ([Purnamawati et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5849435/)).",
    },
    {
      type: "p",
      texte:
        "Et l'orange dans Cosme Check ? Il pénalise une fabrication pétrochimique peu écologique, ++pas un danger pour ta peau++.",
    },
    {
      type: "fiche",
      titre: "Paraffinum Liquidum (huile minérale)",
      inci: "PARAFFINUM LIQUIDUM",
      niveau: "prouve",
      effet: "Forme un film qui limite la perte d'eau de la peau. Aucun risque attendu sur la peau avec les qualités très raffinées (BfR, 2018).",
      statut: "Autorisée dans l'Union européenne si son raffinage est entièrement connu.",
    },

    { type: "h2", texte: "Quels allergènes cache le parfum de la crème Nivea ?" },
    {
      type: "p",
      texte:
        "Sept, écrits en toutes lettres : limonene, geraniol, hydroxycitronellal, linalool, citronellol, benzyl benzoate et cinnamyl alcohol. Un allergène, c'est une substance qui peut déclencher une réaction (rougeurs, démangeaisons) chez une personne devenue sensible. L'Europe oblige à les écrire dès 0,001 % dans un soin sans rinçage ([règlement (CE) 1223/2009, annexe III](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)), et le [règlement (UE) 2023/1545](https://eur-lex.europa.eu/eli/reg/2023/1545/oj) allonge encore la liste.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Peau qui réagit vite : préfère une crème **sans parfum**, comme dans notre [sélection par type de peau](/blog/meilleures-cremes-hydratantes-visage).",
        "Allergie connue à la lanoline ou à l'un des sept : passe ton chemin.",
        "Une rougeur qui ne part pas : arrête la crème et demande conseil à ton pharmacien.",
      ],
    },

    { type: "h2", texte: "La crème Nivea est-elle bonne pour le visage ?" },
    {
      type: "p",
      texte:
        "Oui pour une peau sèche, beaucoup moins pour une peau grasse. Sa texture riche soulage une peau qui tiraille, surtout en hiver. Sur une peau qui brille, elle est souvent trop lourde. Nivea la dit non comédogène, ce qui veut dire qu'elle ne boucherait pas les pores.",
    },
    {
      type: "p",
      texte:
        "Côté hydratation, [Test-Achats l'a testée](https://www.test-achats.be/sante/sante-au-quotidien/creme-de-jour/news/creme-bleue-nivea) en janvier 2026 sur l'avant-bras de 20 volontaires : ==4 sur 5==. Pas sur le visage, donc.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Une noisette, chauffée entre les doigts, le soir sur les zones sèches.",
        "Sur des mains ou des coudes très secs, une couche épaisse : c'est là qu'elle brille.",
      ],
    },

    { type: "h2", texte: "Protège-t-elle du soleil ? Lisse-t-elle les rides ?" },
    {
      type: "p",
      texte:
        "Non et non. Sa liste ne contient **aucun filtre solaire**, la presse beauté le rappelle depuis début octobre. Au soleil, il faut un SPF (l'indice de protection écrit sur le tube) : évite [les 7 erreurs qui gâchent ta crème solaire](/blog/spf-50-visage-7-erreurs).",
    },
    {
      type: "p",
      texte:
        "Pour les rides, aucun actif étudié contre les signes de l'âge, comme le rétinol (un dérivé de la vitamine A). Une peau hydratée paraît plus lisse sur le moment, c'est tout. Notre [guide des sérums](/blog/serums-visage-guide) te dit quel actif fait quoi.",
    },
    {
      type: "cta",
      texte:
        "**Et ta crème à toi, elle contient quoi ?** Scanne-la avec Cosme Check : en dix secondes, tu sais si elle va à ta peau et quels allergènes elle cache.",
    },

    { type: "h2", texte: "Une crème de luxe a-t-elle vraiment une autre base ?" },
    {
      type: "p",
      texte:
        "Pas tant que ça. Pose la liste de la *Crème de la Mer*, la crème culte de la marque de luxe La Mer, à côté de la boîte bleue. ==18 des 21 ingrédients de la crème Nivea s'y retrouvent== : l'eau, l'huile minérale, les cires, la glycérine, la lanoline, le panthénol et une bonne partie du parfum.",
    },
    {
      type: "p",
      texte:
        "La Mer place en tête son extrait d'algues, sa signature, et ajoute huiles végétales, minéraux et vitamines. Mais la base qui hydrate est cousine.",
    },
    {
      type: "p",
      texte:
        "Dans Cosme Check, la boîte bleue obtient **11,32 sur 20** et la Crème de la Mer **7,60 sur 20** : la crème de luxe compte 6 ingrédients orange, contre 3. La note ne mesure ni le plaisir ni le flacon, elle lit la formule. ++Le prix ne fait pas la formule++, pour toutes les [crèmes hydratantes](/blog/cremes-hydratantes-reparatrices).",
    },
  ],
  faq: [
    {
      question: "La crème Nivea est-elle bonne pour le visage ?",
      reponse:
        "Oui pour une peau sèche : sa texture riche et son huile minérale posent un film qui retient l'eau. Sur une peau grasse, elle est souvent trop lourde. Mets une petite noisette le soir sur les zones qui tiraillent, et choisis une crème sans parfum si ta peau réagit facilement.",
    },
    {
      question: "Est-ce que la crème Nivea est bonne pour les rides ?",
      reponse:
        "Pas vraiment. Sa liste ne contient aucun actif étudié contre les signes de l'âge, comme le rétinol. Elle hydrate, et une peau hydratée paraît plus lisse sur le moment. Contre le vieillissement de la peau, le premier geste reste une crème solaire chaque jour.",
    },
    {
      question: "Est-ce que la crème Nivea est bonne pour la santé ?",
      reponse:
        "Elle ne pose pas de risque connu sur la peau. Ses huiles minérales sont très raffinées, et l'institut allemand BfR n'attend aucun risque avec ce type d'huile dans les cosmétiques (avis de 2018). Le point à surveiller est son parfum : sept allergènes déclarés, à éviter si ta peau y réagit.",
    },
    {
      question: "Est-ce que la crème Nivea est bonne pour les coups de soleil ?",
      reponse:
        "Elle ne protège pas du soleil : sa liste ne contient aucun filtre. Elle n'est pas non plus pensée comme un après-soleil. Sur un coup de soleil léger, mise sur l'eau fraîche et un soin apaisant sans parfum. Avec des cloques ou de la fièvre, va voir un pharmacien ou un médecin.",
    },
  ],
  notes: [
    {
      produit: "NIVEA Creme, crème hydratante visage, corps et mains (150 ml)",
      ean: "4005808166190",
      note: 11.32,
      releveeLe: "2026-10-19",
    },
    {
      produit: "La Mer, Crème de la Mer (30 ml)",
      ean: "0747930000020",
      note: 7.6,
      releveeLe: "2026-10-19",
    },
  ],
};

export default article;
