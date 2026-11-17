import type { Article } from "@/contenu/articles";

/**
 * Publié le 17/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « routines » (`type-de-peau` sortait de la fenêtre des dix derniers).
 * Volume : « crème de nuit » 1 k à 10 k (15/11/2026, Planificateur,
 * `docs/seo/VOLUMES.md`) ; suggestions Google du jour : « faut il mettre une
 * creme de nuit », « … apres le serum », « pourquoi mettre creme de nuit »,
 * « difference creme de jour et creme de nuit », « creme de nuit avis
 * dermatologue ». Les premiers résultats sont des marques (Rituals, Charlotte
 * Tilbury, Aroma-Zone), Test-Achats et un site de régime : des avis, aucune
 * liste comparée. Les chiffres viennent de `cosme_check.catalog` (fiches
 * actives, relevé du 17/11/2026) : crèmes de nuit = rubriques
 * « hydratant-visage-nuit » et « creme-anti-age-visage-nuit » (4 281 fiches) ;
 * crèmes de jour = fiches des rubriques « creme-visage » et
 * « creme-anti-age-visage-jour » dont le nom contient « jour » ou « day »
 * (2 910). Gammes jumelles = même marque, même nom une fois retirés « jour »,
 * « nuit », la contenance et l'indice ; ressemblance = ingrédients communs
 * sur ingrédients des deux listes (251 gammes, une paire par gamme). Les
 * notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "creme-de-nuit",
  titre: "Ta crème de nuit ressemble peut-être trait pour trait à ta crème de jour : on a comparé 251 gammes",
  titreSeo: "Crème de nuit : vraiment différente du jour ?",
  resume:
    "Crème de nuit : à quoi elle sert, en quoi elle diffère d'une crème de jour, et ce qu'on a trouvé en comparant 251 gammes jour et nuit.",
  chapo:
    "Une crème de nuit hydrate la peau pendant qu'elle dort, et elle peut porter des actifs qui craignent la lumière, comme le rétinol. Pour le reste, elle ressemble souvent beaucoup à la crème de jour. ++Dans une gamme sur cinq, les deux pots partagent au moins 80 % de leurs ingrédients.++",
  publieLe: "2026-11-17",
  modifieLe: "2026-11-17",
  minutes: 7,
  theme: "crème de nuit",
  motsCles: [
    "crème de nuit",
    "crème de nuit visage",
    "différence crème de jour et crème de nuit",
    "faut-il mettre une crème de nuit",
    "pourquoi mettre une crème de nuit",
    "crème de nuit rétinol",
    "crème de jour SPF",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/creme-de-nuit.webp",
    alt: "Une lampe de chevet allumée, à l'abat-jour en toile, posée sur un napperon dans une chambre sombre au papier peint fleuri.",
    largeur: 1024,
    hauteur: 683,
    credit: "Auteur inconnu, via rawpixel",
    licence: "CC0",
    source: "https://www.rawpixel.com/image/6055148/free-public-domain-cc0-photo",
  },
  blocs: [
    { type: "h2", texte: "À quoi sert une crème de nuit ?" },
    {
      type: "p",
      texte:
        "Une crème de nuit sert d'abord à hydrater : elle limite l'eau que la peau perd pendant le sommeil. Et la peau en perd davantage le soir. Une équipe de dermatologues a suivi seize adultes pendant 24 heures. Résultat : la barrière de la peau laisse passer plus d'eau le soir et la nuit que le matin ([Yosipovitch et al., *Journal of Investigative Dermatology*, 1998](https://pubmed.ncbi.nlm.nih.gov/9424081/)).",
    },
    {
      type: "p",
      texte:
        "Elle a un deuxième rôle : porter les actifs qui supportent mal le soleil. C'est le cas du rétinol, un dérivé de la vitamine A qui accélère le renouvellement de la peau. La nuit, il n'a pas de lumière pour le dégrader.",
    },

    { type: "h2", texte: "Quelle est la différence entre une crème de jour et une crème de nuit ?" },
    {
      type: "p",
      texte:
        "Sur le papier, la crème de jour protège et la crème de nuit nourrit. Pour vérifier, on a lu les listes INCI de ==4 281 crèmes de nuit== et de 2 910 crèmes vendues « de jour », le 17/11/2026. La liste INCI, c'est la liste officielle des ingrédients, du plus dosé au moins dosé.",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Crèmes de nuit", "Crèmes de jour"],
      lignes: [
        ["Huiles, beurres, cires ou silicones parmi les huit premiers ingrédients, en moyenne.", "1,9.", "1,6."],
        ["Avec du rétinol.", "205, soit 4,8 %.", "33, soit 1,1 %."],
        ["Avec un filtre solaire.", "1,8 %.", "33,2 %."],
        ["Avec du parfum.", "76 %.", "86 %."],
      ],
      legende: "Base Cosme Check, fiches actives, relevé du 17/11/2026.",
    },
    {
      type: "p",
      texte:
        "Les écarts existent, mais ils sont petits. La crème de nuit est à peine plus riche en corps gras, ceux qui forment un film sur la peau et retiennent l'eau. Le rétinol y est quatre fois plus fréquent, et elle ne contient presque jamais de filtre solaire. C'est à peu près tout.",
    },

    { type: "h2", texte: "Faut-il vraiment deux pots ?" },
    {
      type: "p",
      texte:
        "Pas toujours. On a cherché les gammes vendues en version jour **et** en version nuit, sous le même nom et la même marque : il y en a 251. En moyenne, les deux pots partagent 60 % de leurs ingrédients. ==54 gammes dépassent 80 %==, et ++12 ont exactement la même liste++, ingrédient pour ingrédient.",
    },
    {
      type: "tableau",
      entetes: ["Gamme", "Ce qui change la nuit", "Notes jour et nuit"],
      lignes: [
        ["Nuxe, Rêve de Miel crème visage ultra-réconfortante.", "Les 51 ingrédients du jour sont tous là, avec les 18 premiers dans le même ordre. La nuit en ajoute deux : une protéine de lupin et un conservateur.", "11,96 et 11,96 sur 20."],
        ["Diadermine, Bio Expertise soin anti-rides.", "Une huile d'onagre en plus.", "16,51 et 16,52 sur 20."],
        ["Nivea Naturally Good, crème anti-âge.", "Un ingrédient remplacé par deux autres.", "16,41 et 16,32 sur 20."],
        ["Diadermine, Reactivance soin anti-âge.", "La version jour ajoute deux filtres solaires, que la nuit n'a pas.", "7,95 et 16,07 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 17/11/2026.",
    },
    {
      type: "p",
      texte:
        "La dernière ligne mérite un mot. Les filtres solaires sont classés orange dans l'app, et c'est l'essentiel de l'écart de note entre les deux Reactivance. Une note plus basse ne veut pas dire qu'il faut fuir la protection solaire : le soleil reste le premier ennemi d'une peau qui vieillit. Pour lire une liste toi-même, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },
    {
      type: "cta",
      texte:
        "**Ta crème de jour et ta crème de nuit sont-elles jumelles ?** Scanne les deux pots avec Cosme Check : tu compares leurs listes et leurs notes en dix secondes.",
    },

    { type: "h2", texte: "Ta crème de jour te protège-t-elle du soleil ?" },
    {
      type: "p",
      texte:
        "Probablement pas, et c'est le chiffre le plus surprenant de notre relevé. ==Seule une crème de jour sur trois contient un filtre solaire== (965 sur 2 910). Les deux autres tiers sont, au fond, des crèmes hydratantes qu'on te conseille de mettre le matin.",
    },
    {
      type: "p",
      texte:
        "Et quand il y a un filtre, l'indice est souvent bas. Le SPF, c'est l'indice de protection contre les UVB, les rayons qui brûlent. Parmi les 567 crèmes de jour qui l'affichent dans leur nom, deux sur trois annoncent 20 ou moins, le plus souvent 15. L'Académie américaine de dermatologie conseille un SPF 30 au moins, à large spectre, sur toutes les zones qui voient le jour ([AAD](https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-select-sunscreen)). Les bons gestes sont dans nos [7 erreurs du SPF](/blog/spf-50-visage-7-erreurs).",
    },

    { type: "h2", texte: "Le rétinol, la vraie raison d'avoir une crème de nuit ?" },
    {
      type: "p",
      texte:
        "Oui, c'est l'argument le plus solide. Le rétinol se dégrade à la lumière ([Tolleson et al., 2005](https://pubmed.ncbi.nlm.nih.gov/16705812/)) : c'est pour ça qu'on le conseille le soir. Dans notre base, il est dans 205 crèmes de nuit, contre 33 crèmes de jour. Tout ce qu'il faut savoir avant de commencer est dans notre article sur le [rétinol](/blog/retinol).",
    },
    {
      type: "p",
      texte:
        "Depuis le 1er novembre 2025, l'Europe limite le rétinol et ses cousins à 0,3 % dans les nouveaux soins du visage. Tous les produits devront s'y plier d'ici mai 2027 ([règlement (UE) 2024/996](https://eur-lex.europa.eu/eli/reg/2024/996/oj)). Une crème de nuit au rétinol se commence doucement : deux ou trois soirs par semaine, jamais le même soir qu'un [exfoliant](/blog/exfolier-visage).",
    },

    { type: "h2", texte: "Comment choisir sa crème de nuit ?" },
    {
      type: "p",
      texte:
        "Pars de ton [type de peau](/blog/type-de-peau), pas du mot « nuit » sur le pot. Si ta crème de jour n'a pas de filtre solaire et que ta peau s'en contente, rien ne t'empêche de la remettre le soir.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Peau sèche ou qui tiraille : une crème plus riche, avec de la [glycérine](/blog/glycerine) en haut de liste et un beurre ou une huile. Nos gestes pour la [peau sèche](/blog/peau-seche-visage) vont plus loin.",
        "Peau grasse ou mixte : une crème légère suffit, la même que le matin si elle n'a pas de filtre solaire.",
        "Envie de rétinol : une crème de nuit qui le contient, ou un sérum suivi de ta crème habituelle.",
        "Peau qui réagit vite : une formule courte et sans parfum, qu'on garde le jour comme la nuit.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ne mets pas une crème de jour avec filtre solaire le soir : le filtre ne sert à rien dans le noir.",
        "Ne compte pas sur une crème de nuit le matin : elle ne protège pas du soleil.",
        "Grossesse ou allaitement : demande conseil avant tout produit au rétinol, à ton médecin ou à ton pharmacien.",
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "La crème de nuit n'a rien de magique : c'est une crème hydratante, parfois un peu plus riche, parfois porteuse de rétinol. Compare les deux listes avant d'acheter le deuxième pot.",
    },
    {
      type: "p",
      texte:
        "Le geste qui change tout est ailleurs, et il se place dans l'ordre de ta [routine skincare](/blog/routine-skincare). ++Le pot qu'on ne peut pas remplacer, c'est celui du matin : la crème solaire.++ Une crème de nuit peut être ta crème de jour. L'inverse, presque jamais.",
    },
  ],
  faq: [
    {
      question: "Quelle est la différence entre une crème de jour et une crème de nuit ?",
      reponse:
        "La crème de nuit est souvent un peu plus riche et peut contenir du rétinol, qui craint la lumière. La crème de jour contient parfois un filtre solaire, mais seulement une sur trois dans notre base. Pour le reste, les deux se ressemblent : dans une gamme sur cinq, elles partagent au moins 80 % de leurs ingrédients.",
    },
    {
      question: "Faut-il mettre une crème de nuit ?",
      reponse:
        "Ce n'est pas obligatoire. La peau perd plus d'eau le soir, donc une crème hydratante au coucher aide, surtout si elle tiraille. Mais ta crème de jour peut faire ce travail, à condition qu'elle ne contienne pas de filtre solaire. Une crème de nuit devient utile si tu veux un actif comme le rétinol.",
    },
    {
      question: "Faut-il mettre une crème de nuit après le sérum ?",
      reponse:
        "Oui, si ta peau en a besoin. L'ordre va du plus léger au plus épais : nettoyant, sérum, puis crème. Le sérum apporte l'actif, la crème retient l'eau par-dessus. Une peau grasse peut parfois se contenter du sérum seul, une peau sèche gagne presque toujours à ajouter la crème.",
    },
    {
      question: "Peut-on mettre une crème de nuit le jour ?",
      reponse:
        "Oui, si elle ne contient pas de rétinol, mais elle ne protège pas du soleil. Les crèmes de nuit n'ont presque jamais de filtre solaire : 1,8 % dans notre base. Le matin, ajoute toujours une crème solaire par-dessus, même en hiver et même par temps gris.",
    },
  ],
  notes: [
    { produit: "Nuxe, Rêve de Miel Crème visage ultra-réconfortante jour", ean: "3264680004100", note: 11.96, releveeLe: "2026-11-17" },
    { produit: "Nuxe, Rêve de Miel Crème visage ultra-réconfortante nuit", ean: "3264680004094", note: 11.96, releveeLe: "2026-11-17" },
    { produit: "Diadermine, Bio Expertise Soin du jour anti-rides", ean: "3178040680814", note: 16.51, releveeLe: "2026-11-17" },
    { produit: "Diadermine, Bio Expertise Anti-rides Soin Nuit (50 ml)", ean: "3178040680821", note: 16.52, releveeLe: "2026-11-17" },
    { produit: "Nivea Naturally Good, Crème de Jour Anti-Âge", ean: "4005900772787", note: 16.41, releveeLe: "2026-11-17" },
    { produit: "Nivea Naturally Good, Anti Age Night Cream (50 ml)", ean: "4005900768858", note: 16.32, releveeLe: "2026-11-17" },
    { produit: "Diadermine, Reactivance Soin Anti-âge Jour Peaux Très Matures et Sèches", ean: "3178040675216", note: 7.95, releveeLe: "2026-11-17" },
    { produit: "Diadermine, Reactivance Soin Anti-âge Nuit Peaux Très Matures et Sèches", ean: "3178040675223", note: 16.07, releveeLe: "2026-11-17" },
  ],
};

export default article;
