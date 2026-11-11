import type { Article } from "@/contenu/articles";

/**
 * Publié le 11/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « Cosme Check pratique » (`cosmetiques-grossesse` sortait de la fenêtre des
 * dix derniers). Grappe de requêtes moyennes plutôt qu'une tête : « crème
 * périmée », « crème solaire périmée », « péremption crème solaire » et
 * « scanner produit cosmétique » pèsent 100 à 1 k recherches par mois chacune
 * (11/11/2026, neuf zones : France, Belgique, Suisse, Luxembourg, Monaco,
 * Andorre, Canada, Nouvelle-Calédonie, Polynésie française ; toutes langues :
 * `docs/seo/VOLUMES.md`). Les premiers résultats sont des sites de régime,
 * d'assurance et d'agrégation, sans source ni ingrédient lu. Les chiffres
 * viennent de `cosme_check.catalog_export` (fiches actives, relevé du
 * 11/11/2026, listes découpées ingrédient par ingrédient). Aucune note de
 * produit n'est citée.
 */
const article: Article = {
  slug: "creme-perimee",
  titre: "Ta salle de bain cache des produits périmés, et peut-être un parfum interdit depuis 2022 : le tri en 10 minutes",
  titreSeo: "Crème périmée : le tri de ta salle de bain",
  resume:
    "Le petit pot ouvert, la date, la crème solaire de l'été dernier, et 3 ingrédients interdits encore listés sur 7 120 fiches : le tri en 10 minutes.",
  chapo:
    "Une crème ouverte se garde le temps écrit dans le petit pot dessiné au dos (6M, 12M), une crème fermée jusqu'à la date imprimée, si elle en a une. Au-delà, elle n'est pas forcément dangereuse, mais elle protège et soigne moins bien ta peau. Et le tri ne s'arrête pas à la date : dans notre base, ==7 120 fiches== listent encore un ingrédient ++interdit en Europe depuis 2019 ou 2022++.",
  publieLe: "2026-11-11",
  modifieLe: "2026-11-11",
  minutes: 7,
  theme: "crème périmée",
  motsCles: [
    "crème périmée",
    "crème solaire périmée",
    "péremption crème solaire",
    "date de péremption cosmétique",
    "symbole pot ouvert",
    "mascara périmé",
    "lilial",
    "scanner produit cosmétique",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/creme-perimee.webp",
    alt: "Vue plongeante dans une armoire de salle de bain ouverte au-dessus d'un lavabo : des pots, des flacons et des tubes entassés sur des étagères en plastique.",
    largeur: 1024,
    hauteur: 1024,
    credit: "raganmd, via Flickr",
    licence: "CC BY-SA 2.0",
    source: "https://www.flickr.com/photos/45199237@N04/6927388615",
    position: "50% 40%",
  },
  blocs: [
    { type: "h2", texte: "Comment savoir si une crème est périmée ?" },
    {
      type: "p",
      texte:
        "Regarde le dos du pot : deux signes peuvent y figurer, et la loi européenne dit lequel ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Un produit qui se garde moins de 30 mois porte une date, « à utiliser de préférence avant fin… », parfois avec un petit sablier. Un produit qui tient plus longtemps n'a pas de date : il porte le **symbole du pot ouvert**.",
    },
    {
      type: "tableau",
      entetes: ["Ce que tu vois", "Ce que ça veut dire", "Ton geste"],
      lignes: [
        ["Une date, ou un sablier suivi d'une date.", "Le produit se garde, fermé, jusqu'à cette date.", "Utilise-le avant, même s'il n'est pas ouvert."],
        ["Un pot ouvert avec « 6M », « 12M » ou « 24M ».", "Une fois ouvert, il se garde 6, 12 ou 24 mois.", "Note la date d'ouverture au feutre sur l'emballage."],
        ["Ni date ni pot ouvert.", "Fermé, il tient plus de 30 mois.", "Ouvert, fie-toi à l'odeur, la couleur et la texture."],
      ],
      legende: "D'après l'article 19 et l'annexe VII du règlement (CE) 1223/2009.",
    },
    {
      type: "p",
      texte:
        "Le pot ouvert s'appelle le **PAO**, pour « période après ouverture ». C'est le seul chiffre qui compte pour un produit déjà entamé. Le problème, c'est qu'il démarre le jour où tu ouvres, et que personne ne s'en souvient. ++D'où le feutre++.",
    },

    { type: "h2", texte: "Une crème périmée est-elle dangereuse ?" },
    {
      type: "p",
      texte:
        "Rarement, mais elle n'est plus fiable. Une crème contient des **conservateurs**, des ingrédients qui empêchent les microbes de pousser dans le pot, comme le [phénoxyéthanol](/i/phenoxyethanol). Avec le temps, l'air et les doigts, ils s'épuisent. Les actifs fragiles perdent aussi de leur force, et la texture peut se séparer.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Une odeur qui a changé, rance ou aigre : jette.",
        "Une couleur qui a foncé, des grains ou de l'eau qui se sépare : jette.",
        "Un pot qui a passé l'été au soleil ou dans une voiture : méfie-toi, même avant la date.",
        "Une peau qui pique, rougit ou gratte après application : arrête, et demande conseil à ton pharmacien si ça dure.",
      ],
    },
    {
      type: "p",
      texte:
        "Les yeux méritent plus de prudence que le reste. La FDA, l'autorité américaine de la santé, conseille de ==jeter le mascara trois mois après l'achat==, parce que la brosse fait entrer des microbes à chaque passage ([FDA, Eye Cosmetic Safety](https://www.fda.gov/cosmetics/resources-consumers-cosmetics/cosmetics-safety-qa-eye-cosmetic-safety)). Jamais d'eau ni de salive pour le rallonger.",
    },

    { type: "h2", texte: "Crème solaire périmée : protège-t-elle encore ?" },
    {
      type: "p",
      texte:
        "Tu ne peux plus le savoir, et c'est tout le problème. Le SPF, c'est l'indice de protection contre les coups de soleil, et il n'est garanti que pendant la durée testée par la marque. Aux États-Unis, une crème solaire sans date doit être stable au moins trois ans, et la FDA conseille de ==jeter un tube dont on ignore l'âge== ([FDA, Sunscreen](https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun)).",
    },
    {
      type: "p",
      texte:
        "La chaleur use les filtres solaires plus vite que le temps. Un tube oublié sur la plage à La Réunion, aux Antilles ou dans la boîte à gants l'été n'a plus la même protection qu'un tube resté au frais. Pour la bonne dose et les autres pièges, lis [les 7 erreurs qui divisent ton SPF](/blog/spf-50-visage-7-erreurs), et si tu aimes les textures coréennes, [ce que valent les crèmes solaires K-beauty](/blog/creme-solaire-coreenne-k-beauty).",
    },

    { type: "h2", texte: "Quels ingrédients interdits peuvent encore traîner dans ta salle de bain ?" },
    {
      type: "p",
      texte:
        "Trois noms reviennent dans les vieilles listes. Ils ont été interdits dans les cosmétiques vendus dans l'Union européenne, mais un flacon acheté avant peut dormir au fond d'un placard. La liste INCI, c'est la liste officielle des ingrédients, au dos de chaque produit. Notre base garde aussi ces anciennes listes : ==7 120 fiches== en contiennent au moins un.",
    },
    {
      type: "tableau",
      entetes: ["Nom sur la liste INCI", "Ce que c'était", "Interdit depuis", "Fiches dans notre base"],
      lignes: [
        ["Butylphenyl Methylpropional (le « Lilial »).", "Un parfum à l'odeur de muguet.", "Le 1er mars 2022.", "6 010."],
        ["Hydroxyisohexyl 3-Cyclohexene Carboxaldehyde (le « Lyral »).", "Un parfum qui donnait des allergies.", "Le 23 août 2021 en rayon.", "1 024."],
        ["Zinc Pyrithione.", "Un antipelliculaire des shampoings.", "Le 1er mars 2022.", "809."],
      ],
      legende: "Fiches actives de la base Cosme Check au 11/11/2026 ; un produit peut contenir deux de ces ingrédients.",
    },
    {
      type: "p",
      texte:
        "Le [Butylphenyl Methylpropional](/i/butylphenyl-methylpropional) et le [Zinc Pyrithione](/i/zinc-pyrithione) ont été classés **reprotoxiques** de catégorie 1B, c'est-à-dire présumés nuire à la fertilité d'après des études chez l'animal. Ils sont passés dans l'annexe II, la liste des substances interdites ([règlement (UE) 2021/1902](https://eur-lex.europa.eu/eli/reg/2021/1902/oj)). Le [Hydroxyisohexyl 3-Cyclohexene Carboxaldehyde](/i/hydroxyisohexyl-3-cyclohexene-carboxaldehyde) est un **allergène**, une substance qui déclenche des allergies chez les personnes sensibles. Il donnait trop d'eczémas de contact, des plaques qui grattent là où le produit touche la peau. Il a quitté les nouveaux produits en 2019, puis les rayons en 2021 ([règlement (UE) 2017/1410](https://eur-lex.europa.eu/eli/reg/2017/1410/oj)).",
    },
    {
      type: "fiche",
      titre: "Lilial",
      inci: "BUTYLPHENYL METHYLPROPIONAL",
      niveau: "prouve",
      effet:
        "Parfum de synthèse. Classé toxique pour la reproduction (catégorie 1B) sur la base d'études chez l'animal, et allergène connu.",
      statut:
        "Interdit dans les cosmétiques de l'Union européenne depuis le 1er mars 2022 (règlement (UE) 2021/1902, annexe II). En rouge dans Cosme Check.",
    },
    {
      type: "p",
      texte:
        "Pas de panique : ces produits ont été reformulés, et un flacon de 2021 ne devient pas un poison du jour au lendemain. Mais le signe est utile. ++Si la liste d'un flacon acheté en Europe porte l'un de ces trois noms, il a été fabriqué avant 2022++ : il a donc plus de trois ans et demi. Au Québec, d'autres règles s'appliquent, et seule la liste fait foi. Le parfum est le seul souci des deux premiers, et il en reste beaucoup d'autres : [ce qu'il cache dans une liste](/i/parfum). Dans notre base, 1 092 de ces fiches sont des produits d'hygiène, dont 429 déodorants, et 2 913 des produits pour les cheveux.",
    },
    {
      type: "cta",
      texte:
        "**Ton vieux flacon est-il encore en règle ?** Scanne-le avec Cosme Check : les substances interdites de l'annexe II apparaissent en rouge, et tu vois si le produit va à ta peau.",
    },

    { type: "h2", texte: "Le tri en 10 minutes : par où commencer ?" },
    {
      type: "p",
      texte:
        "Par ce qui touche les yeux et ce qui te protège du soleil. Le reste peut attendre. Cinq gestes, dans l'ordre.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Les yeux d'abord : mascara et eye-liner liquide ouverts depuis plus de trois mois, à la poubelle.",
        "La crème solaire : sans date lisible, ou restée au chaud tout l'été, remplace-la avant le prochain départ.",
        "Les pots entamés : lis le pot ouvert, et écris la date d'ouverture au feutre sur ceux que tu gardes.",
        "Les vieux flacons : cherche les trois noms interdits sur la liste, surtout sur les parfums, les déodorants et les shampoings antipelliculaires.",
        "Ce qui reste : scanne-le pour savoir s'il est fait pour ta peau, pas seulement s'il est encore bon.",
      ],
    },
    {
      type: "p",
      texte:
        "Ce dernier geste est le plus souvent oublié. Une crème non périmée peut très bien ne pas te convenir : trop de parfum pour une peau sensible, trop riche pour une peau grasse. Si tu hésites sur ta peau, commence par [connaître ton type de peau](/blog/type-de-peau), puis pose-toi [les trois questions pour savoir si un cosmétique est bon pour toi](/blog/cosmetique-fait-pour-toi).",
    },
    {
      type: "encadre",
      titre: "Pour ranger ce que tu gardes",
      ton: "emeraude",
      texte:
        "Au sec, à l'abri du soleil et de la chaleur, bouchon bien fermé. Une spatule plutôt que les doigts pour les pots. Et la date d'ouverture écrite dessus, toujours.",
    },

    { type: "h2", texte: "Et si la liste était le meilleur indice de l'âge ?" },
    {
      type: "p",
      texte:
        "C'est la surprise de ce tri. La date s'efface, le PAO ne dit rien sans la date d'ouverture, mais ==la liste d'ingrédients, elle, ne ment pas sur son époque==. Un parfum interdit en 2022 date un flacon aussi sûrement qu'un tampon. Les conservateurs aussi changent de règles : depuis le 31 juillet 2026, ceux qui libèrent du formaldéhyde doivent l'écrire en toutes lettres, on l'explique dans [notre article sur la crème à l'urée](/blog/creme-uree). Pour lire une liste du début à la fin, suis [notre méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },
  ],
  faq: [
    {
      question: "Crème périmée pas ouverte : peut-on l'utiliser ?",
      reponse:
        "Une crème fermée se garde jusqu'à la date imprimée. Après, elle n'est pas forcément mauvaise, mais la marque ne garantit plus son efficacité ni sa stabilité. Sans date, elle tient plus de 30 mois fermée. Ouvre-la, sens-la, regarde sa couleur et sa texture : au moindre changement, jette-la.",
    },
    {
      question: "Une crème périmée est-elle dangereuse ?",
      reponse:
        "Rarement, mais elle peut irriter. Avec le temps, ses conservateurs s'épuisent et des microbes peuvent pousser dans le pot, surtout si on y met les doigts. Une odeur rance, une couleur qui change ou une texture qui se sépare sont les signes à surveiller. Autour des yeux, ne prends aucun risque.",
    },
    {
      question: "Crème solaire périmée non ouverte : est-elle encore efficace ?",
      reponse:
        "Personne ne peut le garantir. Le SPF n'est testé que pour la durée de vie annoncée par la marque. Un tube fermé, gardé au frais, a de bonnes chances de tenir, mais un tube resté au soleil ou dans une voiture perd sa protection plus vite. Dans le doute, remplace-le avant de t'exposer.",
    },
    {
      question: "Date de péremption maquillage : comment la connaître ?",
      reponse:
        "Cherche le petit pot ouvert au dos ou sur la boîte : « 6M » veut dire six mois après ouverture, « 12M » douze mois. Le mascara fait exception : on le change tous les trois mois. Pour le reste, écris la date d'ouverture au feutre sur l'emballage dès que tu l'entames.",
    },
  ],
};

export default article;
