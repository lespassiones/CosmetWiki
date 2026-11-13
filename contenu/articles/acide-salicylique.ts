import type { Article } from "@/contenu/articles";

/**
 * Publié le 13/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » (`acide-hyaluronique` sortait de la fenêtre des dix
 * derniers, qui comptait déjà trois buzz). Volumes du 13/11/2026 (dix zones :
 * France, Belgique, Suisse, Luxembourg, Monaco, Andorre, Canada,
 * Nouvelle-Calédonie, Polynésie française, Saint-Pierre-et-Miquelon ; toutes
 * langues : `docs/seo/VOLUMES.md`) : « acide salicylique » 10 k à 100 k. Les
 * premiers résultats sont Aroma-Zone, Notino, des marques et Futura, sans
 * liste comptée. Les chiffres viennent de `cosme_check.catalog` (fiches
 * actives, relevé du 13/11/2026 : listes découpées sur les virgules qui ne
 * sont pas suivies d'un chiffre, pour ne pas couper « 1,2-Hexanediol »).
 * Doses : règlement (UE) 2019/1966, lu dans son texte. Les notes citées sont
 * déclarées dans `notes`.
 */
const article: Article = {
  slug: "acide-salicylique",
  titre: "Acide salicylique : on l'a trouvé dans 18 208 produits, et ton shampoing passe avant ton sérum",
  titreSeo: "Acide salicylique visage : à quoi ça sert ?",
  resume:
    "L'acide salicylique débouche les pores, à 2 % au plus. Mais dans 18 208 produits de notre base, il est surtout dans les shampoings, et souvent en fin de liste.",
  chapo:
    "L'acide salicylique est un exfoliant qui entre dans les pores et les débouche : c'est l'actif star contre les points noirs, autorisé à ==2 % au plus== sur le visage. On l'a trouvé dans 18 208 produits de notre base. ++Mais son premier rayon, c'est le shampoing++, et deux fois sur trois il est rangé dans la seconde moitié de la liste.",
  publieLe: "2026-11-13",
  modifieLe: "2026-11-13",
  minutes: 7,
  theme: "acide salicylique",
  motsCles: [
    "acide salicylique",
    "acide salicylique visage",
    "acide salicylique peau",
    "acide salicylique point noir",
    "acide salicylique 2",
    "acide salicylique danger",
    "BHA",
    "salicylic acid",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/acide-salicylique.webp",
    alt: "Le tronc d'un vieux saule en gros plan, à l'écorce grise et profondément fendue en longues lanières, au pied duquel pousse un peu d'herbe.",
    largeur: 1200,
    hauteur: 800,
    credit: "Nino Barbieri, via Wikimedia Commons",
    licence: "CC BY 2.5",
    source: "https://commons.wikimedia.org/wiki/File:-_Willow%27s_Bark_01_-.jpg",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, l'acide salicylique ?" },
    {
      type: "p",
      texte:
        "L'acide salicylique est un **BHA**, un acide exfoliant : il aide les cellules mortes à se détacher de la surface de la peau. Son nom vient du saule, *Salix* en latin, dont l'écorce en contient un cousin. Celui des cosmétiques est fabriqué en usine. Sur la liste INCI (la liste officielle des ingrédients, du plus dosé au moins dosé), il s'écrit **[Salicylic Acid](/i/salicylic-acid)**.",
    },
    {
      type: "p",
      texte:
        "Son talent tient en un mot : il se dissout dans le gras. Il peut donc entrer dans le pore, rempli de sébum (le gras naturel de la peau), et défaire le bouchon. Les AHA comme l'[acide glycolique](/i/glycolic-acid), eux, restent surtout à la surface ([Arif, *Clinical, Cosmetic and Investigational Dermatology*, 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4554394/)). D'où sa réputation contre les points noirs, dont on explique l'origine dans [notre article sur les comédons](/blog/comedogene).",
    },
    {
      type: "fiche",
      titre: "Acide salicylique",
      inci: "SALICYLIC ACID",
      niveau: "prouve",
      effet:
        "Exfoliant qui se dissout dans le gras et entre dans les pores ; aussi utilisé contre les pellicules et, à petite dose, comme conservateur.",
      statut:
        "Autorisé en Europe à 2 % au plus sur la peau, 3 % dans les produits capillaires rincés, 0,5 % comme conservateur ([règlement (UE) 2019/1966](https://eur-lex.europa.eu/eli/reg/2019/1966/oj)). « Pénalité légère » (jaune) dans Cosme Check.",
    },

    { type: "h2", texte: "Pourquoi y en a-t-il dans ton shampoing ?" },
    {
      type: "p",
      texte:
        "Parce que le cuir chevelu aussi fait des cellules mortes, et que les pellicules en sont des paquets. Dans notre base de 478 194 fiches, ==18 208 produits== contiennent de l'acide salicylique. Le classement par rayon surprend.",
    },
    {
      type: "tableau",
      entetes: ["Rayon", "Produits avec acide salicylique"],
      lignes: [
        ["Shampoings.", "5 386."],
        ["Soins anti-imperfections.", "2 387."],
        ["Soins capillaires.", "1 688."],
        ["Nettoyants visage.", "1 576."],
        ["Crèmes hydratantes.", "1 254."],
        ["Produits pour le bain.", "1 160."],
        ["Masques et gommages.", "1 047."],
      ],
      legende: "Fiches actives de la base Cosme Check, relevé du 13/11/2026.",
    },
    {
      type: "p",
      texte:
        "Le shampoing arrive donc loin devant. Et dans les soins anti-imperfections, l'acide salicylique n'est que dans ==un produit sur quatre== (2 387 sur 8 892). Les autres misent sur la [niacinamide](/blog/niacinamide), le zinc ou d'autres acides : notre guide [anti-imperfections](/blog/meilleurs-produits-anti-imperfections) les compare.",
    },
    {
      type: "p",
      texte:
        "Il a aussi des cousins au nom voisin. [Sodium Salicylate](/i/sodium-salicylate) (5 507 produits) sert surtout de conservateur. [Capryloyl Salicylic Acid](/i/capryloyl-salicylic-acid) (1 715) est un dérivé plus doux, qu'on appelle LHA. Et [Betaine Salicylate](/i/betaine-salicylate) en compte 314.",
    },

    { type: "h2", texte: "Quelle dose d'acide salicylique est autorisée ?" },
    {
      type: "p",
      texte:
        "La loi européenne fixe des plafonds précis. Le comité scientifique européen, le SCCS, les a jugés sûrs dans un avis de décembre 2018. Le [règlement (UE) 2019/1966](https://eur-lex.europa.eu/eli/reg/2019/1966/oj) les applique depuis le 1er mai 2020.",
    },
    {
      type: "tableau",
      entetes: ["Usage", "Dose maximale"],
      lignes: [
        ["Produits capillaires qu'on rince.", "3 %."],
        ["Autres produits (sérum, crème, nettoyant).", "2 %."],
        ["Lait corporel, mascara, rouge à lèvres, déodorant à bille.", "0,5 %, comme conservateur seulement."],
        ["Conservateur, dans tous les produits.", "0,5 %."],
      ],
      legende: "Règlement (CE) 1223/2009, annexe III n° 98 et annexe V n° 3, modifiées par le règlement (UE) 2019/1966.",
    },
    {
      type: "p",
      texte:
        "Le même texte l'interdit dans les sprays qu'on peut respirer et dans les produits pour la bouche. Comme actif, il est aussi interdit dans les produits pour enfants de moins de 3 ans. Pourquoi tant de prudence ? L'acide salicylique est classé comme substance suspectée d'être toxique pour la reproduction, et il irrite fortement les yeux. Le SCCS l'a pourtant jugé sûr à ces doses ; il attendait en 2018 des tests sur un possible effet hormonal.",
    },
    {
      type: "p",
      texte:
        "Au Québec et dans le reste du Canada, la règle est différente. Un produit à l'acide salicylique vendu contre les boutons y est un médicament en vente libre, et non un simple cosmétique ([Santé Canada, 2015](https://www.canada.ca/fr/sante-canada/services/medicaments-produits-sante/medeffet-canada/examens-innocuite/examen-produits-topiques-vente-libre-contenant-peroxyde-benzoyle-acide-salicylique.html)).",
    },

    { type: "h2", texte: "Pourquoi est-il si souvent en fin de liste ?" },
    {
      type: "p",
      texte:
        "Parce qu'il est peu dosé, même quand il sert d'actif. Dans notre base, il est dans les cinq premiers ingrédients de seulement ==6 % des produits== (1 085), et dans la seconde moitié de la liste de 65,5 % (11 930). Dans les shampoings, c'est 68,6 %.",
    },
    {
      type: "p",
      texte:
        "Attention, une fin de liste ne veut pas dire « rien ». La loi permet de ranger dans n'importe quel ordre les ingrédients dosés sous 1 % ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Et l'acide salicylique ne dépasse jamais 2 % sur le visage. Une fin de liste veut donc dire moins de 1 %, sans dire combien.",
    },
    {
      type: "p",
      texte:
        "Le plus étonnant vient des boîtes. On a pris les 775 produits qui écrivent « salicylique », « salicylic » ou « BHA » dans leur nom. ==Un sur quatre seulement== (192) le place dans les cinq premiers, et 313 le rangent dans la seconde moitié. Le gel nettoyant Garnier Pure Active Salicylic le met en 24e place sur 26. Le soin Effaclar Duo(+) de La Roche-Posay, présenté comme « désincrustant », le liste en 28e place sur 30, avec son cousin LHA en 22e.",
    },
    {
      type: "cta",
      texte:
        "**Ton nettoyant « purifiant » contient-il vraiment de l'acide salicylique ?** Scanne-le avec Cosme Check : tu vois la liste entière, ingrédient par ingrédient, avec sa couleur.",
    },

    { type: "h2", texte: "Que valent les produits à l'acide salicylique les plus connus ?" },
    {
      type: "p",
      texte:
        "Les notes vont du simple au double, et l'acide salicylique n'y est pour presque rien. Huit produits connus, relevés dans notre base le 13/11/2026.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place de l'acide", "Note Cosme Check"],
      lignes: [
        ["Bioderma, Sébium Gel Moussant Actif.", "6e sur 26.", "16,52 sur 20."],
        ["Typology, Sérum Ciblé Imperfections 2 % + Zinc 1 %.", "3e sur 11.", "16,12 sur 20."],
        ["CeraVe, SA Crème Anti-rugosités.", "19e sur 32.", "12,29 sur 20."],
        ["CeraVe, Gel Moussant Anti-imperfections.", "6e sur 27.", "12,18 sur 20."],
        ["The Ordinary, Salicylic Acid 2 % Solution.", "4e sur 11.", "11,48 sur 20."],
        ["Paula's Choice, Skin Perfecting 2 % BHA Liquid Exfoliant.", "4e sur 8.", "11,44 sur 20."],
        ["Garnier, Pure Active Salicylic Gel Nettoyant Doux.", "24e sur 26.", "7,50 sur 20."],
        ["La Roche-Posay, Effaclar Duo(+).", "28e sur 30.", "7,49 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 13/11/2026.",
    },
    {
      type: "p",
      texte:
        "Le sérum Typology tient en onze ingrédients, avec l'acide en 3e place. La célèbre lotion Paula's Choice n'en a que huit, mais perd des points sur un émulsifiant, le Polysorbate 20. Le gel Garnier, lui, aligne plusieurs émulsifiants classés orange dans l'app, comme le PEG-100 Stearate. Pour lire une liste en entier, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique). Et pour les nettoyants de la marque, on a comparé [neuf gels CeraVe](/blog/cerave-gel-moussant).",
    },

    { type: "h2", texte: "Comment utiliser l'acide salicylique sans abîmer ta peau ?" },
    {
      type: "p",
      texte:
        "Doucement. Un exfoliant trop souvent répété dessèche et irrite, surtout en hiver. Cinq gestes pour bien commencer.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Commence par un nettoyant : il se rince vite, c'est la façon la plus douce d'essayer.",
        "Pour un soin sans rinçage, deux ou trois soirs par semaine au début.",
        "Ne le mets pas le même soir que du [rétinol](/blog/retinol) (un dérivé de la vitamine A) ou un autre acide exfoliant.",
        "Hydrate ensuite avec une crème simple, même sur une [peau grasse](/blog/type-de-peau).",
        "Le jour, mets une crème solaire, comme avec tout exfoliant.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Garde-le loin des yeux : le SCCS le range parmi les irritants oculaires sérieux.",
        "Une peau qui brûle, gonfle ou démange après l'application : arrête, et demande conseil à ton pharmacien. Santé Canada a relevé de rares réactions allergiques graves en 2015.",
        "Grossesse ou allaitement : montre le produit à ton pharmacien avant de continuer, comme on l'explique dans [notre guide grossesse](/blog/cosmetiques-grossesse).",
        "Des boutons douloureux, nombreux, qui laissent des marques : c'est l'affaire d'un dermatologue, pas d'un sérum.",
      ],
    },

    { type: "h2", texte: "Que retenir avant d'acheter ?" },
    {
      type: "p",
      texte:
        "Un mot sur le devant de la boîte ne dit pas la dose. Si tu cherches vraiment un soin à l'acide salicylique, vérifie deux choses au dos : que « Salicylic Acid » soit écrit en toutes lettres, et qu'il arrive avant la longue traîne des conservateurs.",
    },
    {
      type: "p",
      texte:
        "Et si ton seul souci, ce sont les pellicules, ++ton shampoing en contient peut-être déjà++. Ce n'est pas un hasard : 30 % des produits à l'acide salicylique de notre base sont des shampoings.",
    },
  ],
  faq: [
    {
      question: "Acide salicylique visage : y a-t-il un danger ?",
      reponse:
        "Aux doses autorisées en Europe, 2 % au plus, le comité scientifique européen le juge sûr. Les vrais risques sont l'irritation et la sécheresse si on en abuse, et une forte irritation des yeux. Commence deux ou trois fois par semaine. Pendant la grossesse, demande l'avis de ton pharmacien.",
    },
    {
      question: "Acide salicylique et niacinamide : peut-on les mélanger ?",
      reponse:
        "Oui. Les deux vont bien ensemble, et beaucoup de produits les associent : dans notre base, 2 786 produits à l'acide salicylique contiennent aussi de la niacinamide. L'un débouche les pores, l'autre aide à réguler le gras. Si ta peau tiraille, garde-les plutôt pour des moments différents de la journée.",
    },
    {
      question: "Acide salicylique et rétinol : peut-on les utiliser ensemble ?",
      reponse:
        "Pas le même soir au début. Les deux peuvent dessécher et irriter, et leurs effets s'additionnent. Le plus simple est d'alterner : un soir l'acide salicylique, un soir le rétinol, avec une crème hydratante à chaque fois. Si la peau rougit ou pèle, espace encore, et demande conseil à ton pharmacien.",
    },
    {
      question: "Acide salicylique point noir : est-ce que ça marche ?",
      reponse:
        "Oui, c'est l'actif le mieux placé contre les points noirs, parce qu'il se dissout dans le gras et entre dans le pore. Il faut quelques semaines d'usage régulier. Il ne fait pas disparaître les pores, et frotter plus fort n'aide pas. Un nettoyant ou un soin à 0,5 à 2 % suffit.",
    },
  ],
  notes: [
    {
      produit: "Bioderma, Sébium Gel Moussant Actif (500 ml)",
      ean: "3701129811337",
      note: 16.52,
      releveeLe: "2026-11-13",
    },
    {
      produit: "Typology, Sérum Ciblé Imperfections Acide Salicylique 2 % + Zinc 1 %",
      ean: "3665467005356",
      note: 16.12,
      releveeLe: "2026-11-13",
    },
    {
      produit: "CeraVe, SA Crème Anti-rugosités (177 ml)",
      ean: "3337875374095",
      note: 12.29,
      releveeLe: "2026-11-13",
    },
    {
      produit: "CeraVe, Gel Moussant Anti-imperfections (236 ml)",
      ean: "3433425436159",
      note: 12.18,
      releveeLe: "2026-11-13",
    },
    {
      produit: "The Ordinary, Salicylic Acid 2 % Solution (30 ml)",
      ean: "0769915199574",
      note: 11.48,
      releveeLe: "2026-11-13",
    },
    {
      produit: "Paula's Choice, Skin Perfecting 2 % BHA Liquid Exfoliant (118 ml)",
      ean: "0655439020046",
      note: 11.44,
      releveeLe: "2026-11-13",
    },
    {
      produit: "Garnier, Pure Active Salicylic Gel Nettoyant Doux (250 ml)",
      ean: "3600542642842",
      note: 7.5,
      releveeLe: "2026-11-13",
    },
    {
      produit: "La Roche-Posay, Effaclar Duo(+) (3 ml)",
      ean: "3337875598088",
      note: 7.49,
      releveeLe: "2026-11-13",
    },
  ],
};

export default article;
