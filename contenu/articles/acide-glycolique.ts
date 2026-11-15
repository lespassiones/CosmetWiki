import type { Article } from "@/contenu/articles";

/**
 * Publié le 15/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » (`glycerine` sortait de la fenêtre des dix derniers).
 * Volumes : « acide glycolique » 10 k à 100 k (13/11/2026, dix zones, toutes
 * langues) ; « glycolic acid », « elseve glycolic gloss », « glycolic gloss »,
 * « the ordinary glycolic acid » 1 k à 10 k, « acide glycolique visage »,
 * « cheveux », « danger », « aisselles » 100 à 1 k (15/11/2026, France seule,
 * toutes langues : `docs/seo/VOLUMES.md`). Les premiers résultats sont
 * Aroma-Zone, Notino, des marques et Futura, sans liste comptée. Les chiffres
 * viennent de `cosme_check.catalog` (fiches actives, relevé du 15/11/2026 :
 * listes découpées sur les virgules qui ne sont pas suivies d'un chiffre,
 * ingrédient compté quand il vaut exactement « Glycolic Acid »). Les notes
 * citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "acide-glycolique",
  titre: "Acide glycolique : on l'a trouvé dans 4 700 produits, et ton shampoing « Glycolic » le range tout au bout",
  titreSeo: "Acide glycolique visage : à quoi ça sert ?",
  resume:
    "L'acide glycolique exfolie et donne de l'éclat. On l'a lu dans 4 700 produits : bien placé dans les sérums, en fin de liste dans les shampoings « Glycolic ».",
  chapo:
    "L'acide glycolique est un exfoliant : il décolle les cellules mortes de la surface de la peau, qui paraît plus lisse et plus lumineuse. On l'a trouvé dans 4 700 produits de notre base. ++Les cheveux en contiennent plus que les soins anti-imperfections++, et dans les shampoings qui portent son nom, il arrive ==presque toujours en fin de liste==.",
  publieLe: "2026-11-15",
  modifieLe: "2026-11-15",
  minutes: 7,
  theme: "acide glycolique",
  motsCles: [
    "acide glycolique",
    "acide glycolique visage",
    "acide glycolique cheveux",
    "acide glycolique danger",
    "glycolic acid",
    "glycolic gloss",
    "AHA",
    "exfoliant visage",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/acide-glycolique.webp",
    alt: "Un champ de canne à sucre sous un ciel gris : de hautes tiges vertes aux feuilles sèches à leur pied, bordées d'une bande d'herbe tondue.",
    largeur: 1200,
    hauteur: 900,
    credit: "Kerry Raymond, via Wikimedia Commons",
    licence: "CC BY 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Sugarcane_field,_Cane_Farm_Road,_Alberton,_2022.jpg",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, l'acide glycolique ?" },
    {
      type: "p",
      texte:
        "L'acide glycolique est un **AHA**, un acide de fruit. Les AHA (acides alpha-hydroxylés) relâchent la « colle » qui tient les cellules mortes entre elles, à la surface de la peau. Elles partent plus vite, et la peau d'en dessous renvoie mieux la lumière. On le tire à l'origine de la canne à sucre, mais celui des cosmétiques est presque toujours fabriqué en usine. Sur la liste INCI (la liste officielle des ingrédients, du plus dosé au moins dosé), il s'écrit **Glycolic Acid**.",
    },
    {
      type: "p",
      texte:
        "C'est le plus petit des AHA ([Kornhauser et al., *Clinical, Cosmetic and Investigational Dermatology*, 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC3047947/)). Il entre donc plus facilement dans la surface de la peau que l'acide lactique, son cousin plus doux. Il ne faut pas le confondre avec l'[acide salicylique](/blog/acide-salicylique), un BHA : celui-là se dissout dans le gras et entre dans les pores, alors que l'acide glycolique travaille surtout à la surface.",
    },
    {
      type: "fiche",
      titre: "Acide glycolique",
      inci: "GLYCOLIC ACID",
      niveau: "prouve",
      effet:
        "Exfoliant : il aide les cellules mortes à se détacher, pour une peau plus lisse et plus lumineuse. Aussi utilisé pour ajuster l'acidité d'un produit.",
      statut:
        "Pas de dose maximale propre dans le règlement européen. Le comité scientifique européen conseille 4 % au plus, avec un pH de 3,8 ou plus, dans les produits grand public ([SCCNFP, 2004](https://ec.europa.eu/health/archive/ph_risk/committees/sccp/documents/out284_en.pdf)).",
    },

    { type: "h2", texte: "Où trouve-t-on de l'acide glycolique ?" },
    {
      type: "p",
      texte:
        "Partout, et pas là où on l'attend. Dans notre base de plus de 478 000 fiches, ==4 700 produits== contiennent de l'acide glycolique. Voici les rayons qui en comptent le plus.",
    },
    {
      type: "tableau",
      entetes: ["Rayon", "Produits avec acide glycolique"],
      lignes: [
        ["Soins anti-imperfections.", "753."],
        ["Masques et gommages.", "704."],
        ["Soins capillaires (après-shampoings, masques).", "560."],
        ["Soins anti-âge.", "549."],
        ["Nettoyants visage.", "463."],
        ["Crèmes hydratantes.", "377."],
        ["Shampoings.", "326."],
      ],
      legende: "Fiches actives de la base Cosme Check, relevé du 15/11/2026.",
    },
    {
      type: "p",
      texte:
        "Additionne les soins capillaires et les shampoings : ==886 produits pour les cheveux==, plus que pour les boutons. Dans les cheveux, il sert surtout à rendre le produit un peu acide, ce qui lisse la surface de la fibre et la fait briller.",
    },
    {
      type: "p",
      texte:
        "Attention aux noms voisins. Thioglycolic Acid (138 produits) n'a rien d'un exfoliant : c'est l'actif des crèmes dépilatoires et des permanentes, encadré à part par la loi. Et « Lactic Acid/Glycolic Acid Copolymer » (249 produits) est un plastique fait à partir de ces deux acides, qui ne les libère pas sur ta peau.",
    },

    { type: "h2", texte: "Pourquoi le pourcentage ne suffit-il pas ?" },
    {
      type: "p",
      texte:
        "Parce que l'acide glycolique travaille selon l'acidité du produit, son **pH**. Le pH mesure l'acidité, de 0 (très acide) à 14 : la peau est autour de 5. Plus le pH est bas, plus l'acide est actif, et plus il pique. Les fabricants ajoutent donc presque toujours une base pour le remonter, comme la soude (Sodium Hydroxide). On en trouve une dans 65 % de nos listes à l'acide glycolique.",
    },
    {
      type: "p",
      texte:
        "C'est ce qui rend les chiffres de la boîte trompeurs. Un « 10 % » peu acide peut piquer moins qu'un « 5 % » très acide. En Europe, le comité scientifique a jugé sûr 4 % au plus, à un pH de 3,8 ou plus, pour un usage sans professionnel ([SCCNFP, 2004](https://ec.europa.eu/health/archive/ph_risk/committees/sccp/documents/out284_en.pdf)). Le pH, lui, n'est presque jamais écrit sur la boîte.",
    },

    { type: "h2", texte: "Le Glycolic Gloss d'Elseve contient-il vraiment de l'acide glycolique ?" },
    {
      type: "p",
      texte:
        "Oui, mais tout au bout. On a lu les 139 fiches « Glycolic Gloss » de notre base, toutes tailles et tous pays confondus. L'acide glycolique y est ==dernier ou avant-dernier 124 fois==, et jamais avant la 15e place. Dans le shampoing, il arrive 33e sur 34, après le parfum et ses allergènes.",
    },
    {
      type: "p",
      texte:
        "Ce n'est pas illégal, ni forcément inutile. La loi permet de ranger dans n'importe quel ordre les ingrédients dosés sous 1 % ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Et pour rendre un après-shampoing un peu acide, il en faut peu. Mais une fin de liste veut dire moins de 1 %. Le nom de la gamme parle plus fort que la dose.",
    },
    {
      type: "p",
      texte:
        "Le phénomène dépasse cette marque. Parmi les 865 produits qui écrivent « glycolique », « glycolic » ou « AHA » dans leur nom, ++moins d'un sur deux++ (414) le place dans les cinq premiers ingrédients.",
    },
    {
      type: "cta",
      texte:
        "**Ton soin « glycolique » en contient-il vraiment ?** Scanne-le avec Cosme Check : tu vois la liste entière, la place de l'acide et la couleur de chaque ingrédient.",
    },

    { type: "h2", texte: "Que valent les produits à l'acide glycolique les plus connus ?" },
    {
      type: "p",
      texte:
        "Les notes vont du simple au double, et ce n'est pas l'acide qui fait la différence. Huit produits connus, relevés dans notre base le 15/11/2026.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place de l'acide", "Note Cosme Check"],
      lignes: [
        ["Typology, Sérum Exfoliant Acide Glycolique 10 %.", "2e sur 16.", "16,53 sur 20."],
        ["Caudalie, Vinoperfect Essence Glycolique.", "6e sur 18.", "16,25 sur 20."],
        ["Pixi, Glow Tonic.", "2e sur 31.", "16,02 sur 20."],
        ["Paula's Choice, Skin Perfecting 8 % AHA Gel.", "2e sur 15.", "15,99 sur 20."],
        ["The Ordinary, Glycolic Acid 7 % Toning Solution.", "2e sur 42.", "12,42 sur 20."],
        ["La Roche-Posay, Sérum Glycolic B5.", "3e sur 14.", "11,79 sur 20."],
        ["Elseve, Glycolic Gloss Masque Brillance.", "29e sur 29.", "11,69 sur 20."],
        ["Elseve, Glycolic Gloss Shampooing.", "33e sur 34.", "7,01 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 15/11/2026.",
    },
    {
      type: "p",
      texte:
        "La célèbre lotion de The Ordinary place bien l'acide en 2e position, mais aligne 42 ingrédients. Deux sont classés orange dans l'app : un émulsifiant, le Polysorbate 20, et la triéthanolamine, qui sert à régler le pH. Le shampoing Glycolic Gloss, lui, perd ses points sur ses tensioactifs et ses émulsifiants, pas sur l'acide. Pour lire une liste en entier, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },

    { type: "h2", texte: "Comment utiliser l'acide glycolique sans abîmer ta peau ?" },
    {
      type: "p",
      texte:
        "En douceur, et avec une crème solaire. Les AHA rendent la peau plus sensible au soleil pendant qu'on les utilise, et jusqu'à une semaine après l'arrêt ([FDA](https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids)). Cinq gestes pour bien commencer.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Commence par un produit qui se rince, comme un nettoyant : c'est la façon la plus douce d'essayer.",
        "Pour un tonique ou un sérum, applique-le le soir, deux ou trois fois par semaine au début, sur une peau sèche.",
        "Ne l'empile pas le même soir avec du [rétinol](/blog/retinol) (un dérivé de la vitamine A) ou de l'acide salicylique.",
        "Termine par une crème simple : la [glycérine](/blog/glycerine) ou l'[urée](/blog/creme-uree) compensent bien.",
        "Le matin, mets une crème solaire, même en hiver : on t'explique comment dans [nos 7 erreurs](/blog/spf-50-visage-7-erreurs).",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Un léger picotement est courant au début. Une brûlure, des rougeurs qui durent ou une peau qui pèle beaucoup : arrête, et demande conseil à ton pharmacien.",
        "Garde-le loin des yeux, et évite les lèvres et les coins du nez.",
        "Les « peelings » forts, à 20 % et plus, sont l'affaire d'un dermatologue, pas de ta salle de bain.",
        "Grossesse ou allaitement : montre le produit à ton pharmacien, comme on l'explique dans [notre guide grossesse](/blog/cosmetiques-grossesse).",
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "Un bon soin à l'acide glycolique le place dans les premières lignes, juste après l'eau. Si le mot est sur le devant de la boîte mais tout au bout de la liste, tu paies surtout un nom.",
    },

    { type: "h2", texte: "Que retenir avant d'acheter ?" },
    {
      type: "p",
      texte:
        "Regarde la place, pas le slogan. Dans les 4 700 produits de notre base, l'acide glycolique est dans les cinq premiers ingrédients de ==30 % des listes== seulement, et dans la seconde moitié de 39 %. Les deux tiers de ces produits sont aussi parfumés.",
    },
    {
      type: "p",
      texte:
        "Pour la [niacinamide](/blog/niacinamide) comme pour l'acide glycolique, la règle est la même : un actif utile se lit en haut de la liste. Et sur un flacon de shampoing, ++un nom d'actif sur l'étiquette ne dit rien de sa dose++ : seule la liste le dit.",
    },
  ],
  faq: [
    {
      question: "Acide glycolique : quel danger pour la peau ?",
      reponse:
        "Aux doses des produits grand public, le comité scientifique européen le juge sûr, à 4 % au plus et à un pH de 3,8 ou plus. Les vrais risques sont l'irritation et une peau plus sensible au soleil. Commence deux ou trois fois par semaine, mets une crème solaire le matin, et arrête si la peau brûle.",
    },
    {
      question: "Acide glycolique ou acide salicylique : lequel choisir ?",
      reponse:
        "L'acide glycolique travaille à la surface : il lisse et donne de l'éclat, plutôt pour une peau terne ou sèche. L'acide salicylique se dissout dans le gras et entre dans les pores, plutôt pour les points noirs. Une peau mixte peut alterner les deux, mais pas le même soir au début.",
    },
    {
      question: "Acide glycolique cheveux : est-ce que ça marche ?",
      reponse:
        "Dans les après-shampoings et les masques, il sert surtout à rendre le produit un peu acide, ce qui lisse la surface du cheveu et le fait briller. Il en faut peu, d'où sa place en fin de liste. Sur le cuir chevelu, un gommage à l'acide glycolique aide à décoller les peaux mortes.",
    },
    {
      question: "Peut-on mettre de l'acide glycolique sous les aisselles ?",
      reponse:
        "C'est une astuce venue des réseaux : l'idée est qu'un produit acide gênerait les bactéries de l'odeur. Mais ce n'est pas un déodorant testé pour cet usage, et une peau rasée ou épilée peut piquer fort. Jamais juste après le rasage, et arrête à la moindre irritation.",
    },
  ],
  notes: [
    {
      produit: "Typology, Sérum Exfoliant Acide Glycolique 10 % + Extrait de Pistachier Lentisque",
      ean: "3665467005257",
      note: 16.53,
      releveeLe: "2026-11-15",
    },
    {
      produit: "Caudalie, Vinoperfect Essence Glycolique Concentrée d'Éclat (150 ml)",
      ean: "3522930003267",
      note: 16.25,
      releveeLe: "2026-11-15",
    },
    {
      produit: "Pixi, Glow Tonic Lotion Tonique Exfoliante (100 ml)",
      ean: "0885190821693",
      note: 16.02,
      releveeLe: "2026-11-15",
    },
    {
      produit: "Paula's Choice, Skin Perfecting 8 % AHA Gel Exfoliant (100 ml)",
      ean: "0655439006873",
      note: 15.99,
      releveeLe: "2026-11-15",
    },
    {
      produit: "The Ordinary, Glycolic Acid 7 % Toning Solution (240 ml)",
      ean: "0769915195743",
      note: 12.42,
      releveeLe: "2026-11-15",
    },
    {
      produit: "La Roche-Posay, Sérum Glycolic B5 (30 ml)",
      ean: "3337872413162",
      note: 11.79,
      releveeLe: "2026-11-15",
    },
    {
      produit: "Elseve, Glycolic Gloss Masque Brillance (300 ml)",
      ean: "3600524246860",
      note: 11.69,
      releveeLe: "2026-11-15",
    },
    {
      produit: "Elseve, Glycolic Gloss Shampooing Embellisseur de Brillance (300 ml)",
      ean: "3600524230616",
      note: 7.01,
      releveeLe: "2026-11-15",
    },
  ],
};

export default article;
