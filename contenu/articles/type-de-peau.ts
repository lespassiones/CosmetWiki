import type { Article } from "@/contenu/articles";

/**
 * Publié le 07/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « routines » (`routine-skincare` sortait de la fenêtre des dix derniers) :
 * « type de peau » pèse 1 k à 10 k recherches par mois à concurrence faible
 * (`docs/seo/VOLUMES.md`, 27/10/2026, dix zones), « connaître son type de
 * peau », « test type de peau », « peau mixte » 100 à 1 k, « routine peau
 * mixte » +900 % sur trois mois (06/11/2026). Les pourcentages viennent de
 * `cosme_check.catalog_export` (produits actifs dont le nom contient « peau »
 * ou « peaux » suivi à quarante caractères au plus de « grasse », « mixte »,
 * « sensible », « normale » ou « sèche », relevé du 07/11/2026, dédoublonnés
 * par code-barres) ; les huit notes sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "type-de-peau",
  titre: "Ton type de peau n'est peut-être pas celui que tu crois : le test du mouchoir en 2 heures",
  titreSeo: "Comment connaître son type de peau : le test",
  resume:
    "Comment connaître son type de peau : le test du mouchoir en 2 heures, pourquoi on se trompe souvent, la peau mixte, la peau sensible et 8 produits notés.",
  chapo:
    "Pour connaître ton type de peau, lave ton visage, n'applique rien et attends deux heures. Presse ensuite un mouchoir sur ton front, ton nez et tes joues : là où il marque du gras, ta peau en produit beaucoup. Simple, et pourtant ++la plupart des gens sous-estiment leur peau grasse++, selon une étude qui a mesuré le gras de leur visage.",
  publieLe: "2026-11-07",
  modifieLe: "2026-11-07",
  minutes: 9,
  theme: "type de peau",
  motsCles: [
    "type de peau",
    "comment connaître son type de peau",
    "test type de peau",
    "quel est mon type de peau",
    "peau mixte",
    "peau grasse",
    "peau sensible",
    "type de peau phototype",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/type-de-peau.webp",
    alt: "Un mouchoir en papier blanc qui sort d'une boîte, éclairé par une lumière chaude sur un fond sombre.",
    largeur: 1023,
    hauteur: 685,
    credit: "|Chris|, via Flickr",
    licence: "CC BY 2.0",
    source: "https://www.flickr.com/photos/33852688@N08/4385234366",
  },
  blocs: [
    { type: "h2", texte: "Quels sont les types de peau ?" },
    {
      type: "p",
      texte:
        "On parle de quatre types de peau : normale, sèche, grasse et mixte. Ce qui les sépare, c'est surtout la quantité de sébum. Le sébum, c'est le gras naturel que ta peau fabrique pour se protéger. Beaucoup de sébum donne une peau qui brille. Trop peu donne une peau qui tire.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "**Normale** : ni brillante ni tiraillée, presque toute la journée.",
        "**Sèche** : elle ne brille jamais, elle tire, parfois elle pèle.",
        "**Grasse** : elle brille partout, les pores se voient bien.",
        "**Mixte** : elle brille sur la zone T (le front, le nez et le menton, qui dessinent un T) et reste normale ou sèche sur les joues.",
      ],
    },
    {
      type: "p",
      texte:
        "Et la peau sensible ? Ce n'est pas un cinquième type. C'est une peau qui picote ou rougit facilement, et ++elle peut être grasse, sèche ou mixte en même temps++.",
    },

    { type: "h2", texte: "Comment faire le test du mouchoir ?" },
    {
      type: "p",
      texte:
        "Le test du mouchoir se fait chez toi, sans matériel, en deux heures. Le but est de voir ta peau telle qu'elle est, sans crème qui fausse le résultat.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "**Lave ton visage** avec un nettoyant doux, rince à l'eau tiède et sèche en tapotant.",
        "**N'applique rien** : ni crème, ni sérum, ni maquillage.",
        "**Attends deux heures**, sans toucher ton visage.",
        "**Presse un mouchoir en papier** (ou un papier matifiant) sur ton front, ton nez, ton menton, puis sur chaque joue.",
        "**Regarde le papier à la lumière** : une tache grasse et transparente veut dire beaucoup de sébum à cet endroit.",
      ],
    },
    {
      type: "tableau",
      entetes: ["Ce que montre le mouchoir", "Ce que ça indique"],
      lignes: [
        ["Peu ou pas de gras, partout. La peau tire.", "Plutôt sèche."],
        ["Un peu de gras, partout pareil. Rien ne tire.", "Plutôt normale."],
        ["Du gras sur le front et le nez, rien sur les joues.", "Plutôt mixte."],
        ["Du gras partout, joues comprises.", "Plutôt grasse."],
      ],
      legende: "Un repère pour choisir tes produits, pas un diagnostic.",
    },
    {
      type: "p",
      texte:
        "Fais le test deux ou trois jours de suite, à la même heure. Un seul essai peut tomber un jour de canicule.",
    },

    { type: "h2", texte: "Pourquoi se trompe-t-on si souvent sur son type de peau ?" },
    {
      type: "p",
      texte:
        "Parce qu'on se fie à l'impression, et que l'impression ment. Des dermatologues de Séoul ont mesuré le sébum de visages à quatre endroits avec un appareil, puis comparé avec ce que les gens disaient de leur peau. Résultat : ==la plupart des participants sous-estimaient le gras de leur visage== ([Youn et al., *Skin Research and Technology*, 2002](https://doi.org/10.1034/j.1600-0846.2002.10320.x)).",
    },
    {
      type: "p",
      texte:
        "Pire, l'étude n'a trouvé aucune différence nette de sébum entre peaux dites « normales » et « grasses », ni entre « normales » et « sèches ». Seuls les deux extrêmes se distinguaient. Hésiter est donc normal.",
    },
    {
      type: "p",
      texte:
        "Ton type change aussi avec les saisons. La même équipe a suivi des volontaires pendant un an. Le sébum était plus élevé sur la zone T que sur les joues, et ==il montait en été== ([Youn et al., *Skin Research and Technology*, 2005](https://doi.org/10.1111/j.1600-0846.2005.00119.x)). Refais le test quand la saison change.",
    },

    { type: "h2", texte: "La peau mixte, un vrai type ou un fourre-tout ?" },
    {
      type: "p",
      texte:
        "Un peu des deux. Les chercheurs de 2005 notent que c'est le type le plus courant, mais aussi le plus mal défini. Les étiquettes le confirment. Dans notre base, ==597 produits== parlent de peau mixte dans leur nom (relevé du 07/11/2026). Seuls 83 d'entre eux, soit 14 %, visent la peau mixte seule.",
    },
    {
      type: "tableau",
      entetes: ["Ce que dit le nom du produit", "Nombre de produits"],
      lignes: [
        ["« Mixtes à grasses » (ou mixte et grasse).", "268."],
        ["« Normales à mixtes » (ou normale et mixte).", "219."],
        ["Mixte avec « sèche » dans le nom.", "35."],
        ["Mixte seule.", "83."],
      ],
      legende: "Base Cosme Check, 597 produits actifs dont le nom parle de peau mixte, relevé du 07/11/2026. Un produit peut cumuler plusieurs mentions.",
    },
    {
      type: "p",
      texte:
        "Le réflexe utile : rien ne t'oblige à acheter « mixte ». Un nettoyant doux et un gel-crème léger suffisent, avec un peu plus de crème sur les joues si elles tirent.",
    },

    { type: "h2", texte: "Et si ta peau est sensible ?" },
    {
      type: "p",
      texte:
        "C'est très courant. Sur 5 000 personnes interrogées en France, ==59 % disent avoir la peau sensible ou très sensible== ([Misery et al., *Journal of the European Academy of Dermatology and Venereology*, 2018](https://doi.org/10.1111/jdv.14837)). C'est plus fréquent avec une peau sèche, mais l'étude le trouve aussi chez les peaux mixtes et grasses.",
    },
    {
      type: "p",
      texte:
        "Le paradoxe est en rayon. Dans notre base, ==2 596 produits== disent s'adresser aux peaux sensibles, et ++62,7 % contiennent du [parfum](/i/parfum)++. Pour les seuls soins du visage, c'est encore 54,2 %. Or le parfum est l'une des causes les plus fréquentes d'allergie aux cosmétiques, selon le comité d'experts de la Commission européenne ([SCCS, 2012](https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf)). Une peau qui picote a tout intérêt à le fuir, ou à le garder tout en bas de la liste INCI, la liste officielle des ingrédients au dos du produit.",
    },
    {
      type: "cta",
      texte:
        "**Ta crème « peau sensible » est-elle parfumée ?** Scanne-la avec Cosme Check : tu vois sa liste, le parfum s'il y en a, et si elle colle au profil de peau que tu as renseigné.",
    },

    { type: "h2", texte: "Que disent les étiquettes ? 8 produits notés" },
    {
      type: "p",
      texte:
        "La mention « peau grasse » ou « peau sensible » sur la boîte ne dit rien de la liste. Huit produits connus, relevés dans la base Cosme Check le 07/11/2026.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Ce que dit sa liste", "Note Cosme Check"],
      lignes: [
        ["Eucerin, Aquaporin Active Soin Hydratant peaux normales et mixtes.", "Glycérine en 2e place, sans parfum, avec de l'alcool en 3e.", "15,93 sur 20."],
        ["CeraVe, Gel-crème Hydratant Oil Control peaux mixtes à grasses.", "[Niacinamide](/i/niacinamide) en 2e place, trois [céramides](/i/ceramide-np) (les gras qui collent les cellules de la peau), sans parfum.", "12,34 sur 20."],
        ["Eucerin, Soin apaisant anti-rougeurs peaux hypersensibles.", "Glycérine, karité, panthénol, sans parfum.", "12,29 sur 20."],
        ["Bioderma, Sébium Gel Moussant peaux mixtes à grasses.", "Deux tensioactifs, du zinc, du parfum en dernier.", "7,44 sur 20."],
        ["La Roche-Posay, Hydreane Riche peaux sensibles.", "Glycérine, vaseline, karité, et du parfum en dernier.", "7,36 sur 20."],
        ["La Roche-Posay, Effaclar Gel Moussant peaux grasses et sensibles.", "[Sodium Laureth Sulfate](/i/sodium-laureth-sulfate), [Zinc PCA](/i/zinc-pca), et du parfum.", "7,09 sur 20."],
        ["Mixa, Soin Hydratant Apaisant peaux sensibles et réactives.", "Avoine, vaseline, un silicone cyclique et du parfum.", "3,01 sur 20."],
        ["Nivea, Matifiant crème de jour FPS 15 peau mixte et grasse.", "Alcool en 4e place, octocrylène, un paraben, parfum.", "1,28 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 07/11/2026.",
    },
    {
      type: "p",
      texte:
        "Le soin « matifiant » de Nivea perd ses points sur deux ingrédients. L'[octocrylène](/i/octocrylene), un filtre solaire dont l'Europe a limité la dose ([règlement (UE) 2022/1176](https://eur-lex.europa.eu/eli/reg/2022/1176/oj), 2022), et le [methylparaben](/i/methylparaben), un conservateur. Le soin Mixa contient du [cyclohexasiloxane](/i/cyclohexasiloxane). L'Europe limitera ce silicone à 0,1 % dans les soins sans rinçage à partir de juin 2027 ([règlement (UE) 2024/1328](https://eur-lex.europa.eu/eli/reg/2024/1328/oj)). À l'inverse, les deux soins Eucerin sans parfum passent au-dessus de 12.",
    },

    { type: "h2", texte: "Type de peau ou phototype : quelle différence ?" },
    {
      type: "p",
      texte:
        "Le type de peau parle du gras. Le phototype parle du soleil. Le phototype, c'est la façon dont ta peau réagit au soleil, classée de I (brûle toujours, ne bronze jamais) à VI (ne brûle presque jamais). Cette échelle a été mise au point par le dermatologue Thomas Fitzpatrick ([Fitzpatrick, *Archives of Dermatology*, 1988](https://doi.org/10.1001/archderm.1988.01670060015008)).",
    },
    {
      type: "p",
      texte:
        "Une peau claire peut être grasse, une peau noire peut être sèche : le test du mouchoir vaut pour toutes les couleurs de peau. Le phototype, lui, sert à choisir ta [crème solaire](/blog/spf-50-visage-7-erreurs).",
    },

    { type: "h2", texte: "Que changer dans ta routine selon ton type de peau ?" },
    {
      type: "p",
      texte:
        "Les gestes restent les mêmes : nettoyer, hydrater, protéger le matin (l'ordre est dans notre [routine skincare](/blog/routine-skincare)). Seules la texture et quelques ingrédients changent.",
    },
    {
      type: "tableau",
      entetes: ["Type", "Texture à préférer", "À chercher dans la liste", "À limiter"],
      lignes: [
        ["Sèche.", "Crème riche, baume.", "[Glycérine](/i/glycerin), céramides, vaseline le soir.", "Parfum, nettoyants qui moussent fort."],
        ["Normale.", "Crème légère.", "Glycérine.", "Les actifs en trop."],
        ["Mixte.", "Gel-crème.", "Niacinamide, glycérine.", "Alcool en tête de liste sur les joues."],
        ["Grasse.", "Gel, fluide.", "Niacinamide, [acide salicylique](/i/salicylic-acid) (un BHA, exfoliant qui entre dans les pores).", "Huiles lourdes si tu as des boutons."],
      ],
      legende: "Des repères généraux, à ajuster selon ce que ta peau supporte.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Une peau grasse a besoin d'une crème aussi : sans eau, elle tire, et l'hiver n'arrange rien.",
        "Si tu as des boutons, regarde si tes produits sont [comédogènes](/blog/comedogene), c'est-à-dire s'ils risquent de boucher les pores.",
        "Peau sèche en hiver : notre guide [peau sèche du visage](/blog/peau-seche-visage) détaille le slugging.",
        "Pour te démaquiller selon ta peau, compare [eau micellaire et huile démaquillante](/blog/eau-micellaire-ou-huile-demaquillante).",
      ],
    },
    {
      type: "p",
      texte:
        "Une peau qui brûle à chaque produit, des rougeurs qui restent, des boutons qui font mal ou laissent des marques : ce n'est plus une question de type de peau. Parles-en à un dermatologue, à ton médecin ou à ton pharmacien.",
    },
    {
      type: "p",
      texte:
        "Le meilleur pour la fin : la mention la plus rassurante n'est pas la plus douce. Parmi tous les produits de notre base qui parlent de type de peau, ce sont ceux pour ==peaux « normales » qui sont le plus souvent parfumés : 82,3 %==, devant les peaux sèches (76,2 %) et grasses (60,7 %). Le mot sur la boîte décrit la peau visée, pas ce qu'il y a dedans. Pour ça, il faut [lire la composition](/blog/analyse-composition-cosmetique), ou savoir [si un cosmétique est fait pour toi](/blog/cosmetique-fait-pour-toi).",
    },
  ],
  faq: [
    {
      question: "Comment connaître son type de peau ?",
      reponse:
        "Lave ton visage avec un nettoyant doux, n'applique aucun produit et attends deux heures. Presse ensuite un mouchoir en papier sur ton front, ton nez, ton menton et tes joues. Du gras partout indique une peau grasse, seulement sur la zone T une peau mixte, presque rien une peau sèche. Refais le test deux ou trois jours.",
    },
    {
      question: "Type de peau et phototype : quelle différence ?",
      reponse:
        "Le type de peau décrit la quantité de sébum, le gras naturel du visage : sèche, normale, mixte ou grasse. Le phototype décrit la réaction au soleil, de I (brûle toujours) à VI (ne brûle presque jamais), selon l'échelle de Fitzpatrick. Le premier guide le choix de ta crème, le second celui de ta protection solaire.",
    },
    {
      question: "Peau mixte et sensible : c'est possible ?",
      reponse:
        "Oui. La peau sensible n'est pas un type de peau mais une tendance à picoter ou rougir. Une grande enquête française de 2018 la retrouve chez les peaux sèches, mais aussi chez les peaux mixtes et grasses. Dans ce cas, choisis des textures légères sans parfum, et teste chaque nouveau produit sur une petite zone.",
    },
    {
      question: "Peau mixte déshydratée : que faire ?",
      reponse:
        "Une peau mixte peut briller sur la zone T et manquer d'eau en même temps, surtout en hiver. Garde un nettoyant doux, sans savon, et applique un gel-crème à la glycérine sur la peau encore humide. Évite les produits très alcoolisés et les gommages répétés, qui assèchent sans réduire la brillance.",
    },
  ],
  notes: [
    {
      produit: "Eucerin, AQUAporin Active Soin Hydratant Peaux Normales & Mixtes (50 ml)",
      ean: "4005800128608",
      note: 15.93,
      releveeLe: "2026-11-07",
    },
    {
      produit: "CeraVe, Gel-crème Hydratant Oil Control Peaux Mixtes à Grasses (52 ml)",
      ean: "3337875904537",
      note: 12.34,
      releveeLe: "2026-11-07",
    },
    {
      produit: "Eucerin, Soin apaisant anti-rougeurs peaux hypersensibles",
      ean: "4005800109096",
      note: 12.29,
      releveeLe: "2026-11-07",
    },
    {
      produit: "Bioderma, Sébium Gel Moussant Nettoyant Purifiant Peaux Mixtes/grasses (45 ml)",
      ean: "3401381716523",
      note: 7.44,
      releveeLe: "2026-11-07",
    },
    {
      produit: "La Roche-Posay, Hydreane riche, crème hydratante peaux sensibles",
      ean: "3433425002170",
      note: 7.36,
      releveeLe: "2026-11-07",
    },
    {
      produit: "La Roche-Posay, Effaclar Gel Moussant Purifiant Peaux Grasses et Sensibles (125 ml)",
      ean: "3337872411632",
      note: 7.09,
      releveeLe: "2026-11-07",
    },
    {
      produit: "Mixa, Soin Hydratant Apaisant Peaux Sensibles et Réactives",
      ean: "3600550365207",
      note: 3.01,
      releveeLe: "2026-11-07",
    },
    {
      produit: "Nivea, Matifiant crème de jour PF15 Peau mixte et grasse (50 ml)",
      ean: "4005900091840",
      note: 1.28,
      releveeLe: "2026-11-07",
    },
  ],
};

export default article;
