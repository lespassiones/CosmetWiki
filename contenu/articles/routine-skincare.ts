import type { Article } from "@/contenu/articles";

/**
 * Publié le 27/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « routines » : « routine skincare » pèse 1 k à 10 k recherches par mois
 * (`docs/seo/VOLUMES.md`, 27/10/2026, dix zones), et les variantes sur
 * l'ordre (« ordre des soins visage », « ordre routine skincare ») 10 à 100
 * chacune. Le jour où la presse reprend deux études du congrès EADV 2026 sur
 * les routines virales. Les pourcentages viennent de
 * `cosme_check.catalog_export` (produits actifs dont le nom contient
 * « sérum » ou « serum », hors cheveux, cils et ongles, dédoublonnés par
 * code-barres, relevé du 27/10/2026). Aucune note de produit.
 */
const article: Article = {
  slug: "routine-skincare",
  titre: "Arrête d'empiler : le bon ordre de ta routine skincare (3 produits suffisent)",
  titreSeo: "Routine skincare : le bon ordre des produits",
  resume:
    "Routine skincare : l'ordre des soins matin et soir, les actifs à ne pas empiler, et ce que deux études de 2026 disent des routines virales.",
  chapo:
    "L'ordre d'une routine skincare tient en trois gestes : nettoyer, mettre le soin qui agit, puis hydrater, avec la crème solaire en dernier le matin. Le reste, c'est souvent de l'empilement. En 2026, des dermatologues ont suivi 94 personnes dont la peau avait mal réagi à des produits vus sur les réseaux : ++près de deux sur trois mettaient plus de trois actifs à la fois++.",
  publieLe: "2026-10-27",
  modifieLe: "2026-10-27",
  minutes: 7,
  theme: "routine skincare",
  motsCles: [
    "routine skincare",
    "routine skincare ordre",
    "ordre des soins visage",
    "routine visage",
    "sérum avant ou après crème",
    "crème solaire avant ou après crème hydratante",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/routine-skincare.webp",
    alt: "Des dizaines de flacons anciens à bouchon doré alignés sur deux étagères, dans une vitrine de musée à Florence.",
    largeur: 1200,
    hauteur: 800,
    credit: "Didier Olmstead, via Wikimedia Commons",
    licence: "CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Cosmetic_Bottles,_Museum_at_Santa_Maria_Novella,_Florence,_Italy,_l%27Officina_Profuma_Farmaceutica_di_Santa_Maria_Novella.jpg",
  },
  blocs: [
    { type: "h2", texte: "Dans quel ordre mettre ses soins visage ?" },
    {
      type: "p",
      texte:
        "D'abord le nettoyant, puis le soin ciblé, puis la crème, et la crème solaire en dernier le matin. C'est l'ordre que donne l'Académie américaine de dermatologie. Elle ajoute que trop de produits peut irriter la peau ([American Academy of Dermatology, « Should I apply my skin care products in a certain order? »](https://www.aad.org/public/everyday-care/skin-care-basics/care/apply-skin-care-certain-order)).",
    },
    {
      type: "p",
      texte:
        "Pour le reste, une règle pratique suffit : ==du plus liquide au plus épais==. Un sérum fluide s'étale mal sur une crème riche ou sur une huile. Le soin le plus léger passe donc en premier, le plus gras en dernier.",
    },
    {
      type: "tableau",
      entetes: ["Étape", "Le matin", "Le soir"],
      lignes: [
        ["1. Nettoyer.", "De l'eau ou un nettoyant doux.", "Démaquiller si besoin, puis un nettoyant doux."],
        ["2. Le soin qui agit.", "Un sérum si tu en as un, par exemple vitamine C ou niacinamide (la vitamine B3).", "Un seul actif fort : rétinol **ou** acide exfoliant."],
        ["3. Hydrater.", "Ta crème hydratante.", "Ta crème, plus riche si ta peau tire."],
        ["4. Protéger ou sceller.", "La crème solaire, toujours en dernier.", "Une huile ou un baume, seulement si ta peau en a besoin."],
      ],
      legende: "Le contour des yeux se place après le sérum et avant la crème.",
    },

    { type: "h2", texte: "Crème solaire avant ou après la crème hydratante ?" },
    {
      type: "p",
      texte:
        "Après. La crème solaire est la dernière couche de soin, juste avant le maquillage. Posée dessous, elle serait frottée et étalée par les gestes suivants, et son film protecteur serait moins régulier. SPF veut dire *sun protection factor* : le chiffre dit à quel point la crème freine les coups de soleil.",
    },
    {
      type: "p",
      texte:
        "Le piège le plus courant, c'est la quantité. Une noisette pour tout le visage ne suffit pas : lis nos [7 erreurs qui divisent ton SPF](/blog/spf-50-visage-7-erreurs). Et sous le soleil de La Réunion ou des Antilles, la crème solaire se remet dans la journée, pas seulement le matin.",
    },

    { type: "h2", texte: "Pourquoi les routines virales en font trop ?" },
    {
      type: "p",
      texte:
        "Parce qu'elles empilent des produits et oublient le soleil. En 2025, des pédiatres de l'université Northwestern ont analysé 100 vidéos TikTok de jeunes de 7 à 18 ans. Les routines comptaient six produits en moyenne, et ==seulement 26 % des routines du matin contenaient une crème solaire== ([Hales et al., *Pediatrics*, 2025](https://doi.org/10.1542/peds.2024-070309)).",
    },
    {
      type: "p",
      texte:
        "En octobre 2026, au congrès de l'Académie européenne de dermatologie (EADV), deux études ont enfoncé le clou ([EMJ, 1er octobre 2026](https://www.emjreviews.com/dermatology/news/korean-skincare-tiktok-videos-contain-misleading-claims-eadv-2026/)). Dans 38 vidéos virales sur les soins coréens et la « glass skin », la peau de verre, presque toutes contenaient une promesse trompeuse. Deux seulement parlaient de protection solaire. Aucune ne conseillait de voir un dermatologue.",
    },
    {
      type: "p",
      texte:
        "La seconde étude a suivi 94 personnes dont la peau avait mal réagi à des produits vus sur les réseaux. 63 % utilisaient plus de trois actifs à la fois. Les coupables les plus fréquents étaient les acides exfoliants (34 % des cas) et les rétinoïdes vendus sans ordonnance (27 %). On a relevé une irritation de contact chez 42 % d'entre elles, des boutons apparus ou aggravés chez 28 %, et de légères brûlures chimiques chez 7 %.",
    },
    {
      type: "p",
      texte:
        "Les chercheurs le précisent : ++le problème n'est pas la beauté coréenne, ce sont les routines toutes faites, les mêmes pour toutes les peaux++.",
    },

    { type: "h2", texte: "Quels actifs ne pas mettre le même soir ?" },
    {
      type: "p",
      texte:
        "Un actif, c'est l'ingrédient qui fait le travail promis : lisser, unifier le teint, exfolier. Les acides exfoliants décollent les cellules mortes de la surface. On parle d'AHA pour l'[acide glycolique](/i/glycolic-acid) ou l'[acide mandélique](/i/mandelic-acid), et de BHA pour l'[acide salicylique](/i/salicylic-acid). Les rétinoïdes sont la famille de la vitamine A, dont le [rétinol](/i/retinol) et le [rétinal](/i/retinal). Les deux familles irritent quand on les cumule.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Rétinol et acide exfoliant le même soir : alterne plutôt les soirs.",
        "Un gommage à grains puis un sérum à l'acide glycolique : deux exfoliants l'un sur l'autre.",
        "Trois nouveaux produits la même semaine : si ta peau réagit, impossible de savoir lequel.",
        "Le rétinol le matin : il supporte mal la lumière, garde-le pour le soir.",
      ],
    },
    {
      type: "p",
      texte:
        "D'autres actifs sont plus doux. La [niacinamide](/i/niacinamide) se marie avec presque tout, comme on l'explique dans [notre article sur la niacinamide](/blog/niacinamide). Le bakuchiol pique moins que le rétinol, mais ses preuves sont minces : [on a lu l'étude](/blog/bakuchiol).",
    },
    {
      type: "encadre",
      titre: "La phrase à retenir",
      texte: "**Un seul actif fort par soir.** Si ta peau pique, rougit ou pèle, enlève le dernier produit ajouté.",
      ton: "ambre",
    },

    { type: "h2", texte: "Que contiennent vraiment les sérums ?" },
    {
      type: "p",
      texte:
        "Souvent plusieurs actifs à la fois, sans que le nom le dise. On a regardé les **15 903 sérums** de la base Cosme Check (relevé du 27/10/2026). Leur liste INCI, c'est-à-dire la liste officielle des ingrédients imprimée sur l'emballage, donne ceci.",
    },
    {
      type: "tableau",
      entetes: ["Ce que contient le sérum", "Part des sérums"],
      lignes: [
        ["Du parfum.", "59,9 %."],
        ["De la vitamine C ([acide ascorbique](/i/ascorbic-acid) ou un dérivé).", "24,2 %."],
        ["De la niacinamide.", "22,6 %."],
        ["Un acide exfoliant (glycolique, mandélique, salicylique, [gluconolactone](/i/gluconolactone)).", "13,3 %."],
        ["Un rétinoïde (rétinol, rétinal, palmitate de rétinyle).", "7,7 %."],
        ["Au moins deux de ces quatre familles d'actifs.", "15,4 %."],
      ],
      legende: "Sérums actifs dont le nom contient « sérum », hors cheveux, cils et ongles, dédoublonnés par code-barres.",
    },
    {
      type: "p",
      texte:
        "Autrement dit, ==près d'un sérum sur six mélange déjà deux familles d'actifs==. Deux sérums « simples » l'un sur l'autre peuvent donc faire quatre actifs. Et six sur dix contiennent du [parfum](/i/parfum), une source fréquente de réactions sur les peaux sensibles. Pour lire une liste en deux minutes, suis [notre méthode d'analyse de composition](/blog/analyse-composition-cosmetique).",
    },
    {
      type: "cta",
      texte:
        "**Que contient vraiment ta routine ?** Scanne chaque produit avec Cosme Check : en dix secondes, tu vois sa liste, le rétinol, l'acide ou le parfum s'il y en a, et la couleur de chaque ingrédient.",
    },

    { type: "h2", texte: "La routine courte qui suffit, c'est quoi ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Le matin : un nettoyant doux ou de l'eau, une crème hydratante, une crème solaire.",
        "Le soir : un démaquillant si besoin, un nettoyant doux, une crème hydratante.",
        "Un actif seulement pour un objectif précis (teint, petits boutons, ridules), le soir, un à la fois.",
        "Un nouveau produit à la fois, testé d'abord quelques jours sur une petite zone, dans le cou par exemple.",
      ],
    },
    {
      type: "p",
      texte:
        "Ensuite, on ajuste selon la peau. Une peau qui tire en hiver a besoin d'une crème plus riche : voir [peau sèche du visage](/blog/peau-seche-visage). Une peau qui brille cherche des textures légères qui ne bouchent pas les pores : voir [ce que veut dire comédogène](/blog/comedogene).",
    },
    {
      type: "p",
      texte:
        "Si une routine te laisse une peau qui brûle, pèle ou se couvre de boutons qui font mal, arrête les actifs et parles-en à un dermatologue ou à ton pharmacien.",
    },

    { type: "h2", texte: "Et le geste qu'on oublie le plus ?" },
    {
      type: "p",
      texte:
        "La crème solaire, justement. Elle manque dans trois routines virales du matin sur quatre. Or les acides exfoliants rendent la peau plus sensible au soleil, comme le rappelle l'agence américaine du médicament ([FDA, « Alpha Hydroxy Acids »](https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids)). ++Sans crème solaire le matin, ton sérum du soir travaille contre toi++.",
    },
  ],
  faq: [
    {
      question: "Routine skincare : quel ordre le matin ?",
      reponse:
        "Le matin, nettoie ton visage avec de l'eau ou un nettoyant doux, puis applique ton sérum si tu en utilises un. Viennent ensuite le contour des yeux et la crème hydratante. La crème solaire se met toujours en dernier, juste avant le maquillage. Garde le rétinol et les acides exfoliants pour le soir.",
    },
    {
      question: "Sérum avant ou après la crème hydratante ?",
      reponse:
        "Avant. Le sérum est plus fluide et plus concentré en actifs : il se pose sur la peau propre, juste après le nettoyage. La crème vient ensuite, par-dessus, pour garder l'eau dans la peau. La règle pratique marche pour toute la routine : du produit le plus liquide au plus épais.",
    },
    {
      question: "Crème solaire avant ou après la crème de jour ?",
      reponse:
        "Après. La crème solaire est la dernière couche de soin, avant le maquillage. Laisse ta crème de jour pénétrer une minute, puis applique une dose généreuse de crème solaire. Si ta crème de jour contient déjà un SPF, elle ne protège bien que si tu en mets autant qu'une vraie crème solaire.",
    },
    {
      question: "Où mettre l'huile dans une routine visage ?",
      reponse:
        "À la fin de la routine du soir, après la crème. L'huile est plus grasse que les autres soins : posée avant, elle empêcherait le sérum et la crème de bien s'étaler. Quelques gouttes suffisent, chauffées entre les mains puis pressées sur le visage. Le matin, la crème solaire reste la dernière étape.",
    },
  ],
};

export default article;
