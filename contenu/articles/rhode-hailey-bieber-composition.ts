import type { Article } from "@/contenu/articles";

/**
 * Publié le 09/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz et célébrités » (`pdrn` sortait de la fenêtre des dix derniers) :
 * Rhode, la marque fondée par Hailey Bieber, arrivée chez Sephora en France le
 * 30/09/2026. « rhode blush » et « rhode glazing milk » pèsent 10 k à 100 k
 * recherches par mois (30/10), « rhode lip tint », « rhode peptide lip
 * treatment » et « rhode sephora » 1 k à 10 k (09/11, dix zones,
 * `docs/seo/VOLUMES.md`). Les listes INCI ont été lues sur les fiches
 * Sephora France le 09/11/2026. Les produits Rhode ne sont pas dans la base
 * Cosme Check : aucune note pour eux. Les notes citées sont celles d'autres
 * produits, relevées le 09/11/2026 et déclarées dans `notes`.
 */
const article: Article = {
  slug: "rhode-hailey-bieber-composition",
  titre: "Rhode, la marque de Hailey Bieber : on a lu les listes, et le peptide du baume star arrive en 17e position",
  titreSeo: "Rhode Hailey Bieber : avis et composition",
  resume:
    "Glazing Milk, Glazing Fluid, Peptide Lip Treatment, Barrier Restore Cream : on a lu les 4 listes Rhode de Sephora France, et ce qu'elles ne disent pas.",
  chapo:
    "Rhode, la marque fondée par Hailey Bieber, vend des soins simples, sans parfum dans les quatre listes qu'on a lues. Ses formules tiennent la route, mais ==le peptide de son baume star arrive en 17e place sur 27==. Et ++un détail de la loi européenne++ change la façon de lire ce genre de chiffre.",
  publieLe: "2026-11-09",
  modifieLe: "2026-11-09",
  minutes: 7,
  theme: "rhode hailey bieber",
  motsCles: [
    "rhode",
    "rhode hailey bieber",
    "rhode avis",
    "rhode avis composition",
    "rhode glazing milk",
    "rhode glazing milk avis",
    "rhode glazing fluid",
    "rhode peptide lip treatment",
    "rhode barrier restore cream",
    "rhode sephora france",
  ],
  categorie: "Célébrités",
  couverture: {
    src: "/image/blog/rhode-hailey-bieber-composition.webp",
    alt: "Deux petits boîtiers de baume à lèvres ouverts, posés avec leurs couvercles sur une feuille de cahier couverte de notes manuscrites.",
    largeur: 1024,
    hauteur: 683,
    credit: "saiberiac, via Flickr",
    licence: "CC BY 2.0",
    source: "https://www.flickr.com/photos/22806462@N03/32472416024",
  },
  blocs: [
    { type: "h2", texte: "Pourquoi tout le monde parle de Rhode ?" },
    {
      type: "p",
      texte:
        "Parce que la marque américaine de Hailey Bieber est enfin en rayon chez nous. Rhode est arrivée chez Sephora le 30 septembre 2026 dans 19 pays, dont la France, la Belgique, la Suisse, le Luxembourg et Monaco ([communiqué de Rhode, 31/08/2026](https://via.tt.se/pressmeddelande/4522870/rhode-announces-official-launch-date-for-its-retail-expansion-in-europe-with-sephora?lang=en)). Au Canada, elle y était déjà depuis 2025.",
    },
    {
      type: "p",
      texte:
        "La marque appartient depuis 2025 au groupe e.l.f. Beauty, et Hailey Bieber en reste la fondatrice et la directrice de la création ([e.l.f. Beauty, 30/04/2026](https://www.elfbeauty.com/articles/rhode-continues-its-global-retail-expansion-into-sephora-europe)). Côté recherches, « rhode glazing milk » est tapé ==dix fois plus qu'il y a un an== en France, en Belgique, en Suisse et au Canada (Planificateur de mots clés de Google, relevé du 30/10/2026).",
    },
    {
      type: "p",
      texte:
        "Voici la limite de cet article : les produits Rhode ne sont pas encore dans la base Cosme Check. **Ils n'ont donc pas de note ici.** On a lu leur liste INCI, c'est-à-dire la liste officielle des ingrédients, sur les fiches [Sephora France](https://www.sephora.fr/p/peptide-lip-treatment---effet-glaze-nourrissant-P1000209352.html), le 9 novembre 2026.",
    },

    { type: "h2", texte: "Que contient le Peptide Lip Treatment ?" },
    {
      type: "p",
      texte:
        "Surtout des huiles de synthèse, du beurre de karité et des cires : c'est un baume brillant classique, bien construit. On lit ici la version sans parfum (*Unscented*), avec ses 27 ingrédients. La liste démarre par le [Hydrogenated Polyisobutene](/i/hydrogenated-polyisobutene), une huile de synthèse qui donne l'effet glacé, puis le Diisostearyl Malate, qui adoucit, et le [beurre de karité](/i/butyrospermum-parkii-butter) en 3e place.",
    },
    {
      type: "p",
      texte:
        "Ces corps gras sont des **occlusifs** : ils posent un film qui empêche l'eau de s'évaporer ([Purnamawati et al., *Clinical Medicine & Research*, 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5849435/)). C'est ce film qui rend les lèvres plus douces, tout de suite. Et le fameux peptide ? Le [Palmitoyl Tripeptide-1](/i/palmitoyl-tripeptide-1) n'arrive qu'en 17e place, juste après deux formes de vitamine E et une de vitamine C.",
    },
    {
      type: "fiche",
      titre: "Palmitoyl Tripeptide-1",
      inci: "PALMITOYL TRIPEPTIDE-1",
      niveau: "incertain",
      effet:
        "Un peptide, c'est une petite chaîne d'acides aminés. Celui-ci est classé parmi les peptides « messagers », censés pousser la peau à fabriquer du collagène (revue de Schagen, 2017). La liste ne dit pas la dose du baume.",
      statut: "Autorisé dans l'Union européenne comme ingrédient cosmétique.",
    },
    {
      type: "p",
      texte:
        "Ce baume n'est pas seul sur ce créneau. Notre base compte ==43 produits pour les lèvres== qui mélangent les mêmes trois premiers ingrédients et ce même peptide. Le peptide reste rare : il est présent dans 165 soins des lèvres sur 6 923. Les notes des 43 vont de 7,19 à 12,29 sur 20.",
    },
    {
      type: "tableau",
      entetes: ["Produit de la base", "Point commun avec le baume Rhode", "Note Cosme Check"],
      lignes: [
        ["Paula's Choice, Pro-collagen Peptide Gloss Balm.", "Même peptide, huile de synthèse en tête de liste.", "12,29 sur 20."],
        ["Catrice, Kiss & Glow Peptide Lip Tint.", "Même peptide, teinté comme le Peptide Lip Tint.", "11,93 sur 20."],
      ],
      legende:
        "Listes et notes relevées dans la base Cosme Check le 09/11/2026. Rhode n'y figure pas. [Comment l'app classe les ingrédients](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "Si les soins pour les lèvres t'intéressent, on a aussi lu [les lip oils qui ont envahi TikTok](/blog/lip-oils-huiles-levres).",
    },

    { type: "h2", texte: "Glazing Milk : des céramides, vraiment ?" },
    {
      type: "p",
      texte:
        "Oui, et ce sont les trois céramides les plus connus du rayon. Les céramides sont des graisses que ta peau fabrique pour retenir son eau. La Glazing Milk contient le [Ceramide NP](/i/ceramide-np), le [Ceramide AP](/i/ceramide-ap) et le [Ceramide EOP](/i/ceramide-eop), en 12e, 13e et 14e places sur 40 ingrédients. C'est le trio qu'on trouve aussi dans [les crèmes CeraVe](/blog/cerave-creme-hydratante).",
    },
    {
      type: "p",
      texte:
        "Ce trio n'a rien d'exclusif : il figure dans ==2 328 produits de notre base==. La Lotion Faciale Hydratante CeraVe, par exemple, le contient et obtient 12,17 sur 20. La Glazing Milk ajoute quatre formes d'[acide hyaluronique](/blog/acide-hyaluronique), de la [glycérine](/blog/glycerine) en 4e place et un [émollient léger](/i/c12-15-alkyl-benzoate), un corps gras qui adoucit. Sa formule a du sens pour une peau qui tire.",
    },

    { type: "h2", texte: "Peptide Glazing Fluid : que fait ce sérum ?" },
    {
      type: "p",
      texte:
        "C'est d'abord un sérum hydratant à la niacinamide, et sa liste de 22 ingrédients est courte. On y lit de l'eau, deux ingrédients qui retiennent l'eau, de l'[huile de marula](/i/sclerocarya-birrea-seed-oil), puis la [niacinamide](/blog/niacinamide) en 5e place. Cette vitamine B3 est l'actif le mieux placé du flacon.",
    },
    {
      type: "p",
      texte:
        "Le peptide, l'[Acetyl Hexapeptide-8](/i/acetyl-hexapeptide-8), arrive en 9e place. On le connaît sous le nom d'Argireline. Dans une petite étude citée par une revue scientifique, une crème à ==10 %== a réduit les rides autour des yeux de 30 %, chez 10 femmes, en 30 jours ([Schagen, *Cosmetics*, 2017](https://www.mdpi.com/2079-9284/4/2/16)). Les marques qui affichent ce dosage existent : la solution Argireline 10 % de The Ordinary obtient 11,84 sur 20 dans notre base. Rhode, elle, ne donne pas le sien sur sa liste.",
    },

    { type: "h2", texte: "Barrier Restore Cream : la crème la plus complète ?" },
    {
      type: "p",
      texte:
        "C'est la liste la plus fournie en peptides, avec quatre d'entre eux, en 10e à 13e places sur 35 ingrédients. La crème repose sur une base simple : eau, glycérine, triglycérides, karité, alcool gras. La niacinamide arrive en 7e place et le [squalane](/i/squalane), un corps gras très léger, en 8e.",
    },
    {
      type: "p",
      texte:
        "Côté conservateurs, le [phénoxyéthanol](/i/phenoxyethanol) arrive juste derrière les peptides. C'est un conservateur classique, autorisé jusqu'à 1 % en Europe. On le retrouve dans les trois soins du visage lus ici. Aucun des quatre produits ne contient de parfum dans la liste relevée. Attention : d'autres versions du baume ont leur propre liste, donc lis celle de ta teinte.",
    },
    {
      type: "cta",
      texte:
        "**Tu as déjà un baume ou un sérum aux peptides ?** Scanne son code-barres avec Cosme Check : tu vois sa liste, la couleur de chaque ingrédient et sa note en dix secondes.",
    },

    { type: "h2", texte: "Comment lire une place dans une liste INCI ?" },
    {
      type: "p",
      texte:
        "Une place ne donne jamais une dose, et c'est le piège de tous les articles comme celui-ci. Le [règlement européen 1223/2009](https://eur-lex.europa.eu/eli/reg/2009/1223/oj) impose de classer les ingrédients du plus dosé au moins dosé, ++mais seulement au-dessus de 1 %++. En dessous, la marque les place dans l'ordre de son choix.",
    },
    {
      type: "p",
      texte:
        "Notre 17e place ne prouve donc pas que le peptide est sous-dosé. Les peptides s'utilisent de toute façon en très petite quantité. Sans chiffre de la marque, personne ne peut dire s'il est assez présent pour agir.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Cherche le premier conservateur plafonné à 1 %, comme le phénoxyéthanol : tout ce qui vient après lui est dosé à 1 % ou moins.",
        "Regarde si l'actif vanté est chiffré sur l'emballage ou sur le site. Pas de chiffre, pas de promesse à prendre au mot.",
        "Juge un baume sur le confort : c'est son film protecteur qui fait le travail que tu sens.",
      ],
    },
    {
      type: "p",
      texte:
        "Pour t'entraîner, suis notre méthode pour [analyser la composition d'un cosmétique](/blog/analyse-composition-cosmetique). Et si tes lèvres gercent et saignent, ou si une plaque ne part pas, demande conseil à ton pharmacien ou à un dermatologue.",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "À retenir",
      texte:
        "Rhode fait des formules courtes, sans parfum dans les listes lues, avec des actifs connus. ++Rien de secret dedans++ : le trio de céramides, la niacinamide et ces peptides se trouvent aussi ailleurs.",
    },
  ],
  faq: [
    {
      question: "Rhode est la marque de qui ?",
      reponse:
        "Rhode est la marque de soins fondée par Hailey Bieber, dont c'est aussi le deuxième prénom. Elle appartient depuis 2025 au groupe e.l.f. Beauty, et Hailey Bieber y reste fondatrice et directrice de la création. En France, elle se vend chez Sephora depuis le 30 septembre 2026.",
    },
    {
      question: "Rhode est-elle une bonne marque ?",
      reponse:
        "Ses formules lues ici sont courtes, sans parfum et construites autour d'actifs connus : céramides, niacinamide, peptides. Elles ne sont pas notées par Cosme Check, car la marque n'est pas encore dans notre base. Ses doses ne sont pas données sur les listes, donc l'effet des peptides reste impossible à vérifier.",
    },
    {
      question: "Rhode glazing fluid vs milk ?",
      reponse:
        "La Glazing Milk est une essence laiteuse avec trois céramides, plutôt pour une peau qui tire. Le Peptide Glazing Fluid est un sérum gel plus léger, avec de la niacinamide en 5e place et un peptide en 9e. Sa marque les présente comme deux étapes d'une même routine, à toi de voir si les deux te servent.",
    },
    {
      question: "Glazing milk, c'est quoi ?",
      reponse:
        "C'est une essence de la marque Rhode : un soin liquide et laiteux, appliqué avant la crème. Sa liste de 40 ingrédients contient trois céramides, quatre formes d'acide hyaluronique et de la glycérine. Son but est d'hydrater et de laisser un fini brillant. Elle ne contient pas de parfum dans la liste de Sephora France.",
    },
  ],
  notes: [
    {
      produit: "Paula's Choice, Pro-collagen Peptide Gloss Balm",
      ean: "0655439711807",
      note: 12.29,
      releveeLe: "2026-11-09",
    },
    {
      produit: "Catrice, Kiss & Glow Peptide Lip Tint",
      ean: "4059729513496",
      note: 11.93,
      releveeLe: "2026-11-09",
    },
    {
      produit: "Vaseline, Gluta-Hya Lip Serum Gloss",
      ean: "8886304600991",
      note: 7.19,
      releveeLe: "2026-11-09",
    },
    {
      produit: "CeraVe, Lotion Faciale Hydratante (89 ml)",
      ean: "3606000537446",
      note: 12.17,
      releveeLe: "2026-11-09",
    },
    {
      produit: "The Ordinary, Solution Argireline 10 % (30 ml)",
      ean: "0769915195644",
      note: 11.84,
      releveeLe: "2026-11-09",
    },
  ],
};

export default article;
