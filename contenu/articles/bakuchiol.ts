import type { Article } from "@/contenu/articles";

/**
 * Publié le 25/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » : « bakuchiol » pèse 10 k à 100 k recherches par mois, à
 * +900 % sur trois mois (`docs/seo/VOLUMES.md`, 25/10/2026, dix zones). Les
 * premiers résultats sont des pages de marques (Aroma-Zone en tête) et de
 * revendeurs : aucun ne dit sur combien de personnes repose la comparaison
 * avec le rétinol. Les nombres de produits viennent de
 * `cosme_check.catalog_export` (produits actifs dont l'INCI contient
 * « bakuchiol », relevé du 25/10/2026, dédoublonnés par code-barres) ; les
 * quatre notes sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "bakuchiol",
  titre: "Bakuchiol : ton « rétinol végétal » n'a affronté le vrai que sur 44 visages",
  titreSeo: "Bakuchiol : avis, effets et différence rétinol",
  resume:
    "Le bakuchiol, « rétinol végétal » : ce que prouve l'étude face au rétinol, pour qui il est fait, et ce qu'on trouve dans les 1 306 produits de notre base.",
  chapo:
    "Le bakuchiol est un actif tiré des graines d'une plante indienne, vendu comme le « rétinol végétal » : il lisse un peu les ridules et unifie le teint, en piquant moins. Mais le seul face-à-face sérieux avec le rétinol tient sur **44 personnes et 12 semaines**. Et ++plus de six produits sur dix qui en contiennent sont parfumés++.",
  publieLe: "2026-10-25",
  modifieLe: "2026-10-25",
  minutes: 6,
  theme: "bakuchiol",
  motsCles: [
    "bakuchiol",
    "bakuchiol avis",
    "bakuchiol ou rétinol",
    "bakuchiol effet",
    "bakuchiol grossesse",
    "rétinol végétal",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/bakuchiol.webp",
    alt: "Des feuilles vertes, larges et dentelées, d'un plant de babchi (Psoralea corylifolia), la plante dont les graines donnent le bakuchiol.",
    largeur: 1200,
    hauteur: 798,
    credit: "Biswarup Ganguly, via Wikimedia Commons",
    licence: "CC BY 3.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Psoralea_corylifolia_-_Agri-Horticultural_Society_of_India_-_Alipore_-_Kolkata_2013-01-05_2280.JPG",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, le bakuchiol ?" },
    {
      type: "p",
      texte:
        "C'est une molécule extraite des graines du babchi, une plante utilisée depuis longtemps en Inde et en Chine. Sur l'étiquette, son nom INCI est simplement **[Bakuchiol](/i/bakuchiol)**. Le nom INCI, c'est le nom officiel de l'ingrédient dans la liste écrite au dos du produit.",
    },
    {
      type: "p",
      texte:
        "On l'appelle « rétinol végétal », mais ++ce n'est pas un rétinol++. Le rétinol, c'est une forme de vitamine A, l'actif anti-âge le plus étudié. Le bakuchiol ne lui ressemble pas chimiquement. Il active pourtant dans les cellules de la peau des gènes proches de ceux que le rétinol réveille ([Chaudhuri et Bojanowski, *International Journal of Cosmetic Science*, 2014](https://doi.org/10.1111/ics.12117)). D'où la comparaison.",
    },
    {
      type: "fiche",
      titre: "Bakuchiol",
      inci: "BAKUCHIOL",
      niveau: "incertain",
      effet:
        "Atténue un peu les ridules et les taches liées au soleil en 12 semaines, dans de petites études. Antioxydant. Mieux toléré que le rétinol dans l'étude qui les compare.",
      statut:
        "Autorisé dans l'Union européenne, sans limite de dose propre. Classé vert dans Cosme Check.",
    },

    { type: "h2", texte: "Le bakuchiol est-il aussi efficace que le rétinol ?" },
    {
      type: "p",
      texte:
        "Dans une seule étude bien faite, oui, à peu près. En 2019, des dermatologues de Californie ont comparé deux crèmes sur ==44 personnes pendant 12 semaines== ([Dhaliwal et al., *British Journal of Dermatology*, 2019](https://doi.org/10.1111/bjd.16918)). Ni les participants ni les médecins ne savaient qui avait quoi.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "Un groupe appliquait du bakuchiol à 0,5 %, **deux fois par jour**.",
        "L'autre appliquait du rétinol à 0,5 %, **une fois par jour**.",
        "Les deux ont réduit la surface des rides et les taches, **sans différence nette** entre eux.",
        "Le groupe rétinol se plaignait davantage de peau qui pèle et de picotements.",
      ],
    },
    {
      type: "p",
      texte:
        "C'est encourageant, mais c'est peu : 44 personnes, c'est une salle de classe. Le rétinol, lui, est étudié depuis des décennies, sur des milliers de peaux. Et il faut appliquer le bakuchiol deux fois plus souvent pour obtenir le même effet.",
    },
    {
      type: "encadre",
      ton: "ambre",
      titre: "Le détail que personne ne raconte",
      texte:
        "La crème au rétinol de l'étude était dosée à 0,5 %. Depuis le 1er novembre 2025, ++un nouveau soin visage vendu en Europe ne peut plus dépasser 0,3 %++ ([règlement (UE) 2024/996](https://eur-lex.europa.eu/eli/reg/2024/996/oj)). Le duel s'est donc fait face à un rétinol plus fort que ceux de ta pharmacie.",
    },

    { type: "h2", texte: "Pour qui le bakuchiol est-il intéressant ?" },
    {
      type: "p",
      texte:
        "Pour les peaux qui ne supportent pas le rétinol. Le rétinol fait souvent rougir, tirer et peler les premières semaines. Le bakuchiol est une porte d'entrée plus douce, si tu veux un soin anti-âge sans passer par cette phase.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Ta peau a mal réagi au rétinol, même à faible dose.",
        "Tu cherches un premier actif anti-âge, sans prise de tête.",
        "Tu veux un soin qui s'applique matin et soir, avec une crème solaire le jour, comme tous les soins anti-âge.",
      ],
    },
    {
      type: "p",
      texte:
        "Et si ta peau tolère bien le rétinol, rien ne prouve que passer au bakuchiol fasse mieux. Pour bien démarrer avec les actifs, la [niacinamide](/blog/niacinamide) (c'est la vitamine B3) reste aussi une option douce et bien étudiée.",
    },

    { type: "h2", texte: "Qu'est-ce qu'il y a dans les produits au bakuchiol ?" },
    {
      type: "p",
      texte:
        "Notre base compte ==1 306 produits== qui contiennent du bakuchiol (relevé du 25/10/2026). Surtout des crèmes et des sérums anti-âge, puis des soins anti-imperfections. Trois chiffres disent beaucoup de ce qu'on achète :",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Produits qui contiennent du [parfum](/i/parfum).", "812, soit 62 %."],
        ["Produits où le bakuchiol est dans les cinq premiers ingrédients.", "98, soit 7,5 %."],
        ["Produits qui mélangent bakuchiol et [rétinol](/i/retinol).", "164, soit 12,6 %."],
      ],
      legende: "Base Cosme Check, produits actifs, relevé du 25/10/2026.",
    },
    {
      type: "p",
      texte:
        "Le premier chiffre pique. Le bakuchiol est vendu comme l'actif des peaux sensibles, mais la plupart des produits ajoutent du parfum, ce qui peut justement irriter ces peaux. Le troisième surprend aussi : un produit sur huit mise sur le bakuchiol **et** le rétinol. Il n'est alors plus une « alternative ».",
    },
    {
      type: "cta",
      texte:
        "**Ton sérum au bakuchiol est-il parfumé ?** Scanne-le avec Cosme Check : en dix secondes, tu vois sa liste, la place du bakuchiol et la couleur de chaque ingrédient.",
    },

    { type: "h2", texte: "Le nom sur le flacon suffit-il pour choisir ?" },
    {
      type: "p",
      texte:
        "Non. Quatre soins qui mettent le bakuchiol en avant, et des formules qui n'ont rien à voir :",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place du bakuchiol", "Parfum", "Note Cosme Check"],
      lignes: [
        ["Typology, Sérum Imperfections Bakuchiol 1 %.", "3e sur 3.", "non.", "20 sur 20."],
        ["Medik8, Bakuchiol Peptides.", "2e sur 21.", "non.", "20 sur 20."],
        ["The Inkey List, Bakuchiol Moisturiser.", "7e sur 19.", "non.", "11,98 sur 20."],
        ["Ole Henriksen, Goodnight Glow Retin-ALT Sleeping Crème.", "20e sur 50.", "oui.", "7,96 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 25/10/2026.",
    },
    {
      type: "p",
      texte:
        "Les deux premiers sont des huiles très courtes. La crème The Inkey List hydrate avec du [squalane](/i/squalane) et de la [glycérine](/i/glycerin), mais porte trois ingrédients orange. La crème Ole Henriksen est riche et contient des acides exfoliants ([acide glycolique](/i/glycolic-acid), [acide lactique](/i/lactic-acid)), qui font sans doute une bonne part de son effet « glow ». Son bakuchiol arrive après le parfum. C'est la méthode de [l'analyse de composition](/blog/analyse-composition-cosmetique) : ++l'ingrédient du nom doit apparaître assez haut dans la liste++.",
    },

    { type: "h2", texte: "Comment l'utiliser sans se tromper ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Applique-le sur une peau propre, matin et soir, comme dans l'étude.",
        "Donne-lui au moins huit à douze semaines avant de juger : aucun actif anti-âge ne change une peau en sept jours.",
        "Teste d'abord sur une petite zone, au pli du coude ou derrière l'oreille, pendant deux jours.",
        "Le matin, termine par une [crème solaire](/blog/spf-50-visage-7-erreurs). Sans elle, aucun anti-âge ne tient ses promesses.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ça brûle, ça rougit fort ou ça démange : arrête et rince. Si ça dure, demande conseil à ton pharmacien.",
        "Peau à boutons : préfère une formule légère, et lis [ce que veut dire « comédogène »](/blog/comedogene) avant de choisir une huile.",
        "Enceinte ou en train d'allaiter : aucune étude n'a testé le bakuchiol dans ces moments-là. Parles-en à ton médecin, à ta sage-femme ou à ton pharmacien avant de l'adopter.",
      ],
    },
    {
      type: "p",
      texte:
        "Le meilleur pour la fin : le bakuchiol a un vrai atout, la douceur. Mais ==le geste anti-âge le mieux prouvé reste gratuit== : protéger sa peau du soleil tous les jours, même en hiver. Le bakuchiol vient après, pas à la place.",
    },
  ],
  faq: [
    {
      question: "Le bakuchiol est-il vraiment efficace ?",
      reponse:
        "Un peu, et c'est prouvé sur de petits groupes. Dans l'étude de référence (44 personnes, 2019), le bakuchiol à 0,5 % deux fois par jour a réduit les rides et les taches en 12 semaines. Il a fait aussi bien que le rétinol à 0,5 % une fois par jour. Il faut de la patience et une crème solaire chaque matin.",
    },
    {
      question: "Bakuchiol ou rétinol : lequel choisir ?",
      reponse:
        "Si ta peau supporte le rétinol, c'est l'actif le plus étudié : garde-le. Si elle rougit, tire ou pèle dès qu'elle en voit, le bakuchiol est une alternative plus douce, avec des résultats proches dans la seule étude qui les compare. Il s'applique deux fois par jour, matin et soir.",
    },
    {
      question: "Le bakuchiol est-il photosensibilisant ?",
      reponse:
        "L'étude de 2019 l'a fait appliquer matin et soir, sans signaler de problème lié au soleil. Mais elle est petite. Comme pour tout soin anti-âge, la règle ne change pas : une crème solaire chaque matin, c'est elle qui protège vraiment ta peau du vieillissement.",
    },
    {
      question: "Peut-on utiliser le bakuchiol pendant la grossesse ?",
      reponse:
        "On ne sait pas. Aucune étude n'a testé le bakuchiol chez les femmes enceintes ou qui allaitent. Le présenter comme « l'alternative au rétinol pour la grossesse » est donc une promesse, pas une preuve. Le plus sûr : montrer le produit à ton médecin, à ta sage-femme ou à ton pharmacien avant de l'utiliser.",
    },
  ],
  notes: [
    {
      produit: "Typology, Sérum Imperfections Bakuchiol 1% (L62)",
      ean: "3665467002591",
      note: 20,
      releveeLe: "2026-10-25",
    },
    {
      produit: "Medik8, Bakuchiol Peptides (30 ml)",
      ean: "0818625024451",
      note: 20,
      releveeLe: "2026-10-25",
    },
    {
      produit: "The Inkey List, Bakuchiol Moisturiser (30 ml)",
      ean: "5060879821347",
      note: 11.98,
      releveeLe: "2026-10-25",
    },
    {
      produit: "Ole Henriksen, Goodnight Glow Retin-alt Sleeping Crème (50 ml)",
      ean: "0816657026375",
      note: 7.96,
      releveeLe: "2026-10-25",
    },
  ],
};

export default article;
