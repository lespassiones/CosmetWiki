import type { Article } from "@/contenu/articles";

/**
 * Publié le 05/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » (`bakuchiol` sortait de la fenêtre des dix derniers), suite
 * naturelle de `acide-hyaluronique` (la glycérine passait avant l'actif dans
 * 73 % des listes). « glycérine » pèse 10 k à 100 k recherches par mois
 * (03/11/2026, dix zones) ; « glycérine végétale » et « glycerin » 1 k à 10 k,
 * « glycérine peau », « glycérine danger », « glycérine cheveux » 100 à 1 k
 * (05/11/2026, France, toutes langues : `docs/seo/VOLUMES.md`). Les premiers
 * résultats sont des pharmacies, des marques (Aroma-Zone, Typology, Weleda) et
 * des sites d'articles générés, sans étude ni lecture de liste. Les chiffres
 * viennent de `cosme_check.catalog_export` (fiches actives, relevé du
 * 05/11/2026, recherche du mot INCI exact « glycerin » ou « glycerine » dans
 * la liste). Les notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "glycerine",
  titre: "La glycérine est dans 8 crèmes hydratantes sur 10 : l'ingrédient banal qui fait le vrai travail",
  titreSeo: "Glycérine visage : bienfaits et vrais dangers",
  resume:
    "La glycérine hydrate mieux que sa réputation : ce que disent les études, les vrais risques, et ce qu'on lit dans 270 119 listes de notre base.",
  chapo:
    "La glycérine est un hydratant simple, bon marché et très bien étudié : elle attire l'eau dans la couche de surface de la peau et l'aide à se réparer. On la trouve dans ==8 crèmes hydratantes sur 10== de notre base. ++Ce n'est pas l'actif qu'on te vend, c'est souvent celui qui travaille.++",
  publieLe: "2026-11-05",
  modifieLe: "2026-11-05",
  minutes: 7,
  theme: "glycérine",
  motsCles: [
    "glycérine",
    "glycérine visage",
    "glycérine végétale",
    "glycerin",
    "glycérine peau",
    "glycérine danger",
    "glycérine peau grasse",
    "crème urée",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/glycerine-creme-main.webp",
    alt: "Deux mains sur un fond jaune : l'une tient un tube de crème bleu ciel, l'autre porte une noisette de crème blanche sur le dos de la main.",
    largeur: 1200,
    hauteur: 801,
    credit: "Moose Photos, via Wikimedia Commons",
    licence: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:Woman_applying_cream_to_hand.jpg",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, la glycérine ?" },
    {
      type: "p",
      texte:
        "La glycérine, c'est un petit alcool sucré, sans couleur ni odeur, un peu sirupeux. Ta peau en fabrique elle-même, et on la tire des huiles végétales ou des graisses. Sur la liste INCI (la liste officielle des ingrédients, écrite du plus dosé au moins dosé), elle s'appelle **[Glycerin](/i/glycerin)**.",
    },
    {
      type: "p",
      texte:
        "Dans une crème, c'est un **humectant** : un ingrédient qui attire l'eau et la retient dans la couche de surface de la peau. Elle est assez petite pour y entrer, à la différence de l'[acide hyaluronique](/blog/acide-hyaluronique), qui reste surtout dessus.",
    },
    {
      type: "fiche",
      titre: "Glycérine",
      inci: "GLYCERIN",
      niveau: "prouve",
      effet:
        "Hydrate la couche de surface de la peau, l'assouplit et aide sa barrière à se réparer, dans de nombreuses études contrôlées.",
      statut:
        "Autorisée dans l'Union européenne sans limite de dose (règlement (CE) 1223/2009, aucune restriction dans ses annexes). Classée verte dans Cosme Check.",
    },

    { type: "h2", texte: "La glycérine est-elle vraiment efficace sur la peau ?" },
    {
      type: "p",
      texte:
        "Oui, et c'est l'un des ingrédients les mieux étudiés de la cosmétique. La revue de référence rassemble les travaux sur le sujet ([Fluhr, Darlenski et Surber, *British Journal of Dermatology*, 2008](https://doi.org/10.1111/j.1365-2133.2008.08643.x)). Elle retient trois effets.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Elle augmente l'eau contenue dans la couche de surface de la peau.",
        "Elle aide la barrière de la peau à se refaire après une agression, comme un savon trop fort.",
        "Elle protège en partie contre les produits irritants.",
      ],
    },
    {
      type: "p",
      texte:
        "Le test le plus parlant oppose la glycérine à l'urée, une autre star des crèmes pour peau sèche. Chez ==197 personnes à la peau très sèche==, suivies en dermatologie, une crème à 20 % de glycérine a fait aussi bien qu'une crème à l'urée sur la sécheresse, selon les patients comme selon le dermatologue. Et elle piquait moins ([Lodén et al., *Acta Dermato-Venereologica*, 2002](https://doi.org/10.1080/000155502753600885)).",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "La glycérine n'est pas un ingrédient « de remplissage ». C'est un hydratant qui marche, à petit prix. Si elle est en deuxième ligne de ta crème, ta crème hydrate.",
    },

    { type: "h2", texte: "Combien de crèmes contiennent de la glycérine ?" },
    {
      type: "p",
      texte:
        "Presque toutes. On a cherché le mot exact *Glycerin* dans les listes de notre base, le 05/11/2026. Voici ce qu'on a compté.",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Produits actifs de la base qui contiennent de la glycérine.", "270 119 sur 478 190, soit 56 %."],
        ["Crèmes hydratantes qui en contiennent.", "39 549 sur 49 312, soit 80 %."],
        ["Crèmes hydratantes qui la placent dans les trois premiers ingrédients.", "21 669, soit 44 %."],
        ["Crèmes hydratantes qui contiennent de l'acide hyaluronique.", "12 640, soit 26 %."],
        ["Crèmes hydratantes qui contiennent de l'urée.", "2 529, soit 5 %."],
      ],
      legende: "Base Cosme Check, fiches actives, relevé du 05/11/2026.",
    },
    {
      type: "p",
      texte:
        "Quand la glycérine est dans un produit, elle est en deuxième place dans un cas sur cinq, juste après l'eau. Une place haute veut dire une vraie dose. C'est l'inverse de beaucoup d'actifs à la mode, souvent cachés en fin de liste, comme le [peptide de cuivre](/blog/peptide-de-cuivre).",
    },
    {
      type: "cta",
      texte:
        "**Ta crème met-elle la glycérine en haut de liste ?** Scanne-la avec Cosme Check : tu vois en dix secondes la place de chaque ingrédient et sa couleur.",
    },

    { type: "h2", texte: "Si toutes ont de la glycérine, pourquoi les notes sont-elles si différentes ?" },
    {
      type: "p",
      texte:
        "Parce que la glycérine est rarement le problème. La note dépend du reste de la liste : le parfum, les conservateurs, et les filtres solaires des crèmes à SPF (l'indice de protection contre les coups de soleil). Sept soins connus, avec la glycérine en deuxième ou troisième place.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place de la glycérine", "Parfum", "Note Cosme Check"],
      lignes: [
        ["Eucerin, UreaRepair Plus Crème Mains 5 % d'urée.", "2e sur 27.", "non.", "16,54 sur 20."],
        ["Neutrogena, Crème Mains Formule Norvégienne Concentrée Parfumée.", "2e sur 13.", "oui.", "16,45 sur 20."],
        ["Avène, Hydrance Aqua Gel-crème Hydratant.", "2e sur 27.", "oui.", "12,43 sur 20."],
        ["Nivea, Soft Crème Hydratante Rafraîchissante.", "2e sur 39.", "oui.", "12,18 sur 20."],
        ["CeraVe, Crème Hydratante Visage PM.", "2e sur 24.", "non.", "12,17 sur 20."],
        ["CeraVe, Crème Hydratante Visage SPF 30.", "2e sur 36.", "non.", "7,87 sur 20."],
        ["Avène, Hydrance Riche Crème Hydratante.", "3e sur 25.", "oui.", "7,48 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 05/11/2026.",
    },
    {
      type: "p",
      texte:
        "La crème mains Neutrogena tient en 13 ingrédients, dont la glycérine juste après l'eau : sa note est haute malgré le parfum. La crème CeraVe avec SPF perd des points à cause de ses filtres, pas de sa glycérine. La Nivea Soft contient de l'[alcool dénaturé](/i/alcohol-denat) en quatrième place, qui peut dessécher les peaux fragiles. Pour lire une liste en entier, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },

    { type: "h2", texte: "La glycérine végétale pure sur le visage, bonne idée ?" },
    {
      type: "p",
      texte:
        "Pas telle quelle. Le flacon de pharmacie contient de la glycérine presque pure : sur la peau, elle colle et laisse un film poisseux. Les recettes maison la diluent, souvent avec de l'eau florale, et c'est déjà mieux.",
    },
    {
      type: "p",
      texte:
        "Mais un humectant seul ne suffit pas. Il a besoin d'un **occlusif** par-dessus, un ingrédient qui forme un film et empêche l'eau de s'évaporer, comme la [vaseline](/i/petrolatum) ou les beurres ([Purnamawati et al., *Clinical Medicine & Research*, 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5849435/)). Une crème du commerce fait les deux à la fois. Et la glycérine n'est pas **comédogène**, c'est-à-dire qu'elle ne bouche pas les pores : notre article sur [le mot comédogène](/blog/comedogene) explique d'où viennent ces listes. Dans l'air sec d'un hiver à Montréal ou d'un appartement chauffé, c'est ce duo qui compte : relis [nos gestes pour la peau sèche](/blog/peau-seche-visage).",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Applique ta crème sur une peau propre et encore un peu humide : l'humectant a de l'eau à retenir.",
        "Si ta crème est légère, ajoute un baume le soir sur les zones qui tiraillent.",
        "Le matin, une crème solaire en dernier : évite [les 7 erreurs du SPF](/blog/spf-50-visage-7-erreurs).",
      ],
    },

    { type: "h2", texte: "La glycérine est-elle dangereuse ?" },
    {
      type: "p",
      texte:
        "Non, aux doses des cosmétiques. Elle est autorisée sans restriction par le [règlement européen (CE) 1223/2009](https://eur-lex.europa.eu/eli/reg/2009/1223/oj). L'Autorité européenne de sécurité des aliments l'a réexaminée en 2017 comme additif alimentaire, sous le nom E 422 : ==aucun souci de sécurité== aux quantités consommées ([EFSA, 2017](https://doi.org/10.2903/j.efsa.2017.4720)).",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Pure, elle peut picoter une peau abîmée ou irritée : dilue-la, ou préfère une crème qui la contient.",
        "Ne l'avale pas en cosmétique : le flacon de pharmacie n'est pas fait pour ça.",
        "Une peau qui réagit fort ou ne se calme pas : demande conseil à ton pharmacien ou à un dermatologue.",
      ],
    },
    {
      type: "p",
      texte:
        "Si une crème à la glycérine te fait rougir, regarde d'abord le [parfum](/i/parfum) et les actifs de sa liste. La glycérine est très rarement la coupable.",
    },

    { type: "h2", texte: "Pourquoi les marques n'en parlent-elles presque jamais ?" },
    {
      type: "p",
      texte:
        "Parce qu'elle coûte peu et ne fait pas rêver. On vend l'acide hyaluronique, les [céramides](/i/ceramide-np) (des graisses qui soudent les cellules de surface), la [niacinamide](/blog/niacinamide) (la vitamine B3). Dans notre base, la glycérine passait avant l'acide hyaluronique dans ==73 % des produits « hyaluroniques »==. Et une crème sans aucun actif à la mode, mais avec la glycérine en deuxième ligne et sans parfum, hydrate déjà très bien.",
    },
    {
      type: "p",
      texte:
        "Le meilleur pour la fin : parmi nos 49 312 crèmes hydratantes, il y a ==trois fois plus de glycérine que d'acide hyaluronique, et seize fois plus que d'urée==. ++L'hydratant le plus utile est aussi le plus présent : il n'est simplement jamais écrit en gros sur la boîte.++ Pour choisir la tienne, notre guide [crème hydratante ou réparatrice](/blog/cremes-hydratantes-reparatrices) et notre [routine skincare](/blog/routine-skincare) donnent l'ordre complet.",
    },
  ],
  faq: [
    {
      question: "La glycérine est-elle bonne pour la peau ?",
      reponse:
        "Oui. C'est un humectant : elle attire l'eau dans la couche de surface de la peau, l'assouplit et aide sa barrière à se réparer. C'est l'un des hydratants les mieux étudiés, autorisé en Europe sans limite de dose et classé vert dans Cosme Check. Elle marche mieux avec une crème qui retient l'eau par-dessus.",
    },
    {
      question: "La glycérine est-elle comédogène ?",
      reponse:
        "Non. Comédogène veut dire qui favorise les points noirs en bouchant les pores. La glycérine n'est pas un corps gras : elle se mélange à l'eau. Elle convient aux peaux grasses, souvent dans des gels légers. Si des boutons apparaissent, regarde plutôt les huiles et les cires de la liste. Notre article sur le mot comédogène explique la méthode.",
    },
    {
      question: "La glycérine est-elle toxique ?",
      reponse:
        "Non, aux doses des cosmétiques. Le règlement européen 1223/2009 l'autorise sans restriction, et l'EFSA, qui l'a réexaminée en 2017 comme additif alimentaire (E 422), n'a trouvé aucun souci de sécurité. Pure, elle peut picoter une peau abîmée : mieux vaut l'utiliser dans une crème ou bien diluée.",
    },
    {
      question: "La glycérine éclaircit-elle la peau ?",
      reponse:
        "Non. Aucune étude ne montre que la glycérine éclaircit la peau ou efface des taches. Elle hydrate : une peau bien hydratée paraît plus lisse et plus lumineuse, mais sa couleur ne change pas. Méfie-toi des recettes qui la mélangent au citron, qui peut irriter la peau au soleil.",
    },
  ],
  notes: [
    {
      produit: "Eucerin, UreaRepair Plus Crème Mains 5 % d'urée (30 ml)",
      ean: "4005800164217",
      note: 16.54,
      releveeLe: "2026-11-05",
    },
    {
      produit: "Neutrogena, Crème Mains Formule Norvégienne Concentrée Parfumée (75 ml)",
      ean: "3574661685991",
      note: 16.45,
      releveeLe: "2026-11-05",
    },
    {
      produit: "Avène, Hydrance Aqua Gel-crème Hydratant (50 ml)",
      ean: "3282770397925",
      note: 12.43,
      releveeLe: "2026-11-05",
    },
    {
      produit: "Nivea, Soft Crème Hydratante Rafraîchissante (75 ml)",
      ean: "4005900964526",
      note: 12.18,
      releveeLe: "2026-11-05",
    },
    {
      produit: "CeraVe, Crème Hydratante Visage PM (52 ml)",
      ean: "3337875597449",
      note: 12.17,
      releveeLe: "2026-11-05",
    },
    {
      produit: "CeraVe, Crème Hydratante Visage SPF 30 (52 ml)",
      ean: "3337875877053",
      note: 7.87,
      releveeLe: "2026-11-05",
    },
    {
      produit: "Avène, Hydrance Riche Crème Hydratante",
      ean: "3282779390132",
      note: 7.48,
      releveeLe: "2026-11-05",
    },
  ],
};

export default article;
