import type { Article } from "@/contenu/articles";

/**
 * Publié le 20/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » : « niacinamide » pèse 10 k à 100 k recherches par mois sur
 * dix zones francophones, et « niacinamide et rétinol » +900 % sur trois mois
 * (`docs/seo/VOLUMES.md`). Le nombre de produits vient de
 * `cosme_check.catalog_export` (produits actifs dont l'INCI contient
 * « niacinamide », relevé du 20/10/2026) ; la couleur, de la fiche
 * `/i/niacinamide`.
 */
const article: Article = {
  slug: "niacinamide",
  titre: "Niacinamide : ce qu'elle fait vraiment sur ta peau (et pourquoi 10 % n'est pas forcément mieux)",
  titreSeo: "Niacinamide : à quoi ça sert vraiment ?",
  resume:
    "La niacinamide (vitamine B3) : ce que les études prouvent sur le sébum, les taches et les ridules, le bon dosage, et avec quoi la mélanger sans risque.",
  chapo:
    "La niacinamide, c'est la **vitamine B3** : un actif doux qui aide à limiter la brillance, atténuer les taches brunes et renforcer la peau. Les études l'ont testée entre 2 et 5 %, sur 4 à 12 semaines. ++Le sérum le plus dosé n'est donc pas forcément le meilleur++.",
  publieLe: "2026-10-20",
  modifieLe: "2026-10-20",
  minutes: 6,
  theme: "niacinamide",
  motsCles: [
    "niacinamide à quoi ça sert",
    "niacinamide bienfaits",
    "sérum niacinamide",
    "niacinamide et rétinol",
    "niacinamide et vitamine c",
    "niacinamide quand utiliser",
    "vitamine b3 peau",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/niacinamide.webp",
    alt: "Un flacon de sérum en verre ambré avec sa pipette noire et une étiquette vierge, posé sur un fond blanc.",
    largeur: 1024,
    hauteur: 683,
    credit: "Auteur inconnu, via rawpixel",
    licence: "CC0",
    source: "https://www.rawpixel.com/image/11515770/dropper-bottle-blank-retro-label",
  },
  blocs: [
    { type: "h2", texte: "Niacinamide : c'est quoi exactement ?" },
    {
      type: "p",
      texte:
        "La [niacinamide](/i/niacinamide), c'est une forme de la vitamine B3. On la trouve aussi sous le nom de nicotinamide. Rien à voir avec la nicotine, et malgré son surnom d'« acide niacinamide », ce n'est pas un acide : elle n'exfolie pas la peau.",
    },
    {
      type: "p",
      texte:
        "Elle est partout. Dans notre base, ==29 138 produits== la contiennent (relevé du 20/10/2026) : sérums, crèmes, gels nettoyants, et même des dentifrices. Dans Cosme Check, elle est classée **verte**, sans risque connu.",
    },
    {
      type: "fiche",
      titre: "Niacinamide (vitamine B3)",
      inci: "NIACINAMIDE",
      niveau: "prouve",
      effet:
        "Limite le sébum (le gras de la peau), atténue les taches brunes et les ridules, aide la barrière de la peau. Testée entre 2 et 5 % dans les études, bien tolérée à ces doses.",
      statut: "Autorisée dans l'Union européenne, sans limite de dose propre (base CosIng de la Commission européenne).",
    },

    { type: "h2", texte: "À quoi sert la niacinamide, preuves à l'appui ?" },
    {
      type: "p",
      texte:
        "La niacinamide agit sur quatre fronts, mais pas avec la même force de preuve. Voici ce que montrent les études, du plus solide au plus prometteur.",
    },
    {
      type: "tableau",
      entetes: ["Effet", "Ce que montre l'étude", "Dose"],
      lignes: [
        [
          "Moins de brillance",
          "100 personnes au Japon : moins de sébum après 2 et 4 semaines, face à une crème sans actif ([Draelos et al., 2006](https://pubmed.ncbi.nlm.nih.gov/16766489/)).",
          "2 %",
        ],
        [
          "Taches brunes atténuées",
          "18 femmes, une moitié du visage traitée : surface des taches réduite en 8 semaines ([Hakozaki et al., 2002](https://pubmed.ncbi.nlm.nih.gov/12100180/)).",
          "5 %",
        ],
        [
          "Ridules, teint, rougeurs",
          "50 femmes pendant 12 semaines : ridules, taches, plaques rouges et teint terne améliorés (Bissett et al., 2004).",
          "5 %",
        ],
        [
          "Barrière de la peau",
          "Elle aide la peau à fabriquer ses propres graisses protectrices : effet bien décrit, surtout en laboratoire.",
          "2 à 5 %",
        ],
      ],
      legende:
        "Études résumées dans la revue de [Boo, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8389214/), qui conclut que la niacinamide est bien tolérée par la peau.",
    },
    {
      type: "p",
      texte:
        "Le sébum, c'est le gras que fabrique ta peau : c'est lui qui fait briller le front et le nez. La barrière de la peau, c'est sa couche la plus externe, qui garde l'eau dedans et les agressions dehors. Quand elle est abîmée, la peau tiraille et rougit plus vite.",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "La niacinamide ne fait rien en une nuit. Toutes ces études ont duré ==4 à 12 semaines==. Donne-lui au moins un mois avant de juger.",
    },

    { type: "h2", texte: "5 %, 10 %, 20 % : faut-il viser le plus fort dosage ?" },
    {
      type: "p",
      texte:
        "Non. Les études sérieuses ont utilisé entre 2 et 5 %. Une seule a comparé deux doses sur les taches : à 5 %, les taches ont reculé plus que sans actif ; à 2 %, l'écart n'était pas assez net pour conclure (revue de Boo, 2021). Personne n'a montré que 10 % fait mieux que 5 %.",
    },
    {
      type: "p",
      texte:
        "Les sérums stars du rayon affichent pourtant 10 %, parfois avec du [zinc](/i/zinc-pca). Ce n'est pas un danger, mais plus de dose ne veut pas dire plus d'effet. Et une peau qui réagit vite supporte souvent mieux une crème à 4 ou 5 %.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ta peau rougit, chauffe ou tiraille après le sérum : passe à un produit moins dosé, ou espace les jours.",
        "Des boutons qui font mal ou laissent des marques : c'est l'affaire d'un dermatologue, pas d'un sérum.",
      ],
    },

    { type: "h2", texte: "Niacinamide et rétinol : peut-on les mélanger ? Et la vitamine C ?" },
    {
      type: "p",
      texte:
        "Oui pour le rétinol. Le [rétinol](/i/retinol) est un dérivé de la vitamine A, connu pour lisser la peau mais aussi pour l'irriter au début. La niacinamide, douce, fait un bon duo avec lui : plusieurs soins testés en étude associent les deux (revue de Boo, 2021).",
    },
    {
      type: "p",
      texte:
        "Pour la [vitamine C](/i/ascorbic-acid), on lit souvent qu'elles « s'annulent ». La revue de 2021 cite au contraire un essai où niacinamide et dérivé de vitamine C marchaient ensemble contre les taches. Si ta peau picote, le geste simple : vitamine C le matin, niacinamide le soir.",
    },
    {
      type: "tableau",
      entetes: ["Avec…", "Ça va ?", "Le geste"],
      lignes: [
        ["[Rétinol](/i/retinol)", "Oui", "Niacinamide d'abord, rétinol ensuite, le soir."],
        ["[Vitamine C](/i/ascorbic-acid)", "Oui", "Si ça picote : vitamine C le matin, niacinamide le soir."],
        ["[Acide salicylique](/i/salicylic-acid)", "Oui", "Pas les deux en même temps si ta peau tiraille."],
        ["[Acide hyaluronique](/i/sodium-hyaluronate)", "Oui", "Duo très doux, matin et soir."],
      ],
    },
    {
      type: "cta",
      texte:
        "**Ton sérum contient-il vraiment de la niacinamide, et à quelle place ?** Scanne-le avec Cosme Check : tu vois toute sa liste, ingrédient par ingrédient.",
    },

    { type: "h2", texte: "Quand et comment l'utiliser dans ta routine ?" },
    {
      type: "p",
      texte:
        "Matin, soir, ou les deux : la niacinamide n'a pas d'heure. Elle ne rend pas la peau plus sensible au soleil. Une étude l'a même testée dans une crème avec filtre solaire (Hakozaki, 2002).",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Nettoie ton visage.",
        "Applique 2 ou 3 gouttes de sérum, ou ta crème à la niacinamide.",
        "Le soir, ajoute ensuite ta crème hydratante, comme dans notre [guide des sérums](/blog/serums-visage-guide).",
        "Le matin, termine par un SPF, l'indice de protection solaire. Sans lui, les taches reviennent : évite [les 7 erreurs de la crème solaire](/blog/spf-50-visage-7-erreurs).",
      ],
    },
    {
      type: "p",
      texte:
        "Peau grasse ou à imperfections ? Elle s'intègre bien à [une routine anti-imperfections](/blog/meilleurs-produits-anti-imperfections). Peau sèche ? Choisis-la plutôt dans une crème riche que dans un sérum seul.",
    },

    { type: "h2", texte: "Liste INCI : comment repérer la niacinamide ?" },
    {
      type: "p",
      texte:
        "La liste INCI, c'est la liste officielle des ingrédients au dos du produit. Cherche le mot exact **Niacinamide**. Si tu lis *Nicotinic Acid*, ce n'est pas la même chose : cette autre forme de vitamine B3 peut faire rougir la peau.",
    },
    {
      type: "p",
      texte:
        "Et voici le réflexe que peu de gens connaissent. Les ingrédients dosés à plus de 1 % sont rangés du plus dosé au moins dosé ; sous 1 %, l'ordre est libre ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Le *Phenoxyethanol*, un conservateur très courant, est limité à 1 % par la loi. Une niacinamide écrite après lui est donc dosée à 1 % au plus : ==bien en dessous des 2 à 5 % des études==. Elle fait joli sur l'étiquette, rarement plus. Pour lire le reste de la liste, notre article [« ce cosmétique est-il fait pour toi ? »](/blog/cosmetique-fait-pour-toi) t'aide.",
    },
  ],
  faq: [
    {
      question: "Niacinamide quand utiliser ?",
      reponse:
        "Le matin, le soir, ou les deux : la niacinamide n'a pas d'heure et ne rend pas la peau sensible au soleil. Applique-la sur une peau propre, avant ta crème hydratante. Le matin, termine toujours par une crème solaire. Compte au moins quatre semaines d'usage régulier avant de juger le résultat.",
    },
    {
      question: "Est-ce que la niacinamide est photosensible ?",
      reponse:
        "Non. La niacinamide ne rend pas la peau plus sensible au soleil, contrairement à certains acides exfoliants. Une étude publiée en 2002 l'a même testée à 2 % dans une crème hydratante avec filtre solaire. Tu peux donc l'utiliser le matin, à condition de mettre ta protection solaire comme chaque jour.",
    },
    {
      question: "Est-ce que la niacinamide peut donner des boutons ?",
      reponse:
        "Elle n'est pas connue pour boucher les pores, et elle n'exfolie pas : elle ne provoque donc pas de « purge ». Si des boutons apparaissent, regarde le reste de la formule, souvent plus riche ou parfumée. Si ces boutons font mal, durent ou laissent des marques, demande conseil à un dermatologue.",
    },
    {
      question: "Est-ce que la niacinamide éclaircit la peau ?",
      reponse:
        "Elle ne change pas la couleur naturelle de ta peau. Elle atténue les taches brunes : dans l'étude de Hakozaki en 2002, une crème à 5 % a réduit leur surface en huit semaines. Pour que les taches ne reviennent pas, la crème solaire chaque matin reste le geste le plus important.",
    },
  ],
};

export default article;
