import type { Article } from "@/contenu/articles";

/**
 * Publié le 10/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » (`retinol` sortait de la fenêtre des dix derniers), suite
 * de `glycerine` (Lodén 2002 compare les deux). « crème urée » et « crème à
 * l'urée » pèsent 1 k à 10 k recherches par mois chacune, « crème à l'urée »
 * +900 % sur un an (05/11/2026, France, toutes langues : `docs/seo/VOLUMES.md` ;
 * pas de nouvelle mesure le 10/11, Chrome injoignable). Les premiers résultats
 * sont des pharmacies en ligne et des fiches de marque (Eucerin), sans
 * lecture de listes. Les chiffres viennent de `cosme_check.catalog_export`
 * (fiches actives, relevé du 10/11/2026 : listes découpées ingrédient par
 * ingrédient, « Urea » seule séparée des conservateurs « Imidazolidinyl Urea »
 * et « Diazolidinyl Urea »). Les notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "creme-uree",
  titre: "Crème à l'urée : on a lu 10 197 listes, et le faux « urea » de l'étiquette n'a rien à voir",
  titreSeo: "Crème urée : bienfaits, dosage et faux amis",
  resume:
    "L'urée hydrate à 5 % et adoucit les talons à 10 % et plus. Mais deux « urea » de l'étiquette sont des conservateurs : ce qu'on lit dans 10 197 listes.",
  chapo:
    "L'urée est un hydratant que ta peau fabrique déjà : à faible dose, elle retient l'eau, et à partir de 10 % elle ramollit les zones épaisses comme les talons. On l'a trouvée dans ==10 197 produits== de notre base. ++Mais deux autres « urea » de l'étiquette sont des conservateurs++, et ils n'hydratent rien du tout.",
  publieLe: "2026-11-10",
  modifieLe: "2026-11-10",
  minutes: 7,
  theme: "crème urée",
  motsCles: [
    "crème urée",
    "crème à l'urée",
    "crème urée visage",
    "crème urée pieds",
    "crème urée 30",
    "urée peau",
    "urea crème",
    "imidazolidinyl urea",
    "diazolidinyl urea",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/creme-uree.webp",
    alt: "Un tube de crème en métal, presque vide et tout froissé, posé ouvert sur une table en bois à côté de son bouchon noir.",
    largeur: 1024,
    hauteur: 680,
    credit: "sk8geek, via Flickr",
    licence: "CC BY-SA 2.0",
    source: "https://www.flickr.com/photos/26170836@N05/5479087072",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, l'urée dans une crème ?" },
    {
      type: "p",
      texte:
        "L'urée, c'est une toute petite molécule que ta peau fabrique elle-même. Elle fait partie des substances qui gardent naturellement l'eau dans la couche de surface de la peau. Celle des crèmes est fabriquée en usine, elle ne vient pas de l'urine. Sur la liste INCI (la liste officielle des ingrédients, du plus dosé au moins dosé), elle s'appelle **[Urea](/i/urea)**.",
    },
    {
      type: "p",
      texte:
        "Dans une crème, c'est un **humectant** : un ingrédient qui attire l'eau et la retient, comme la [glycérine](/blog/glycerine). Mais l'urée a un second talent que la glycérine n'a pas. À forte dose, elle est **kératolytique** : elle défait la couche de cellules mortes qui épaissit la peau des talons ou des coudes.",
    },
    {
      type: "fiche",
      titre: "Urée",
      inci: "UREA",
      niveau: "prouve",
      effet:
        "Hydrate la couche de surface de la peau ; à partir d'environ 10 %, ramollit et aide à éliminer les zones épaisses et rugueuses.",
      statut:
        "Autorisée dans l'Union européenne sans limite de dose (règlement (CE) 1223/2009, aucune restriction dans ses annexes). « Sans risque connu » dans Cosme Check.",
    },

    { type: "h2", texte: "5 %, 10 %, 30 % : quel dosage d'urée choisir ?" },
    {
      type: "p",
      texte:
        "Le dosage change tout : l'urée n'agit pas pareil à 5 % et à 30 %. La revue de référence le résume ainsi ([Piquero-Casals et al., *Dermatology and Therapy*, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8611129/)).",
    },
    {
      type: "tableau",
      entetes: ["Dosage", "Ce qu'elle fait", "Où la mettre"],
      lignes: [
        ["Moins de 10 %.", "Elle hydrate et assouplit.", "Visage, corps, mains."],
        ["De 10 % à 20 %.", "Elle hydrate et commence à ramollir la peau épaisse.", "Corps très sec, coudes, genoux, pieds."],
        ["Plus de 20 %.", "Elle défait la couche dure.", "Talons, callosités, jamais le visage."],
      ],
      legende: "D'après Piquero-Casals et al., 2021.",
    },
    {
      type: "p",
      texte:
        "Dans notre base, les produits qui écrivent leur dosage dans leur nom annoncent surtout ==10 % (177 produits) ou 5 % (171)==. Au-delà de 20 %, on n'en compte que quelques dizaines. Sur les 10 197 produits à l'urée, 871 sont des soins des pieds, et l'urée y est dans les cinq premiers ingrédients 623 fois.",
    },

    { type: "h2", texte: "Pourquoi les crèmes à l'urée n'ont-elles pas toutes la même note ?" },
    {
      type: "p",
      texte:
        "Parce que l'urée est rarement le problème. La note dépend du reste de la liste, et d'abord du [parfum](/i/parfum) : il est présent dans ==3 produits à l'urée sur 4== (75,6 %). Huit soins connus, relevés dans notre base le 10/11/2026.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place de l'urée", "Parfum", "Note Cosme Check"],
      lignes: [
        ["Eucerin, UreaRepair Plus Lotion 10 %.", "2e sur 33.", "non.", "16,77 sur 20."],
        ["Nivea, Repair & Care Urea Lait Corporel.", "7e sur 20.", "oui.", "16,32 sur 20."],
        ["Cien (Lidl), Crème Pieds 10 % d'Urée.", "2e sur 22.", "oui.", "16,19 sur 20."],
        ["La Roche-Posay, Lipikar Lait Urea 5+.", "4e sur 28.", "oui.", "12,13 sur 20."],
        ["Mixa, Urea Cica Repair+ Crème Corps.", "2e sur 25.", "oui.", "11,73 sur 20."],
        ["Isdin, Ureadin Ultra 10 Plus Lotion.", "2e sur 31.", "oui.", "11,70 sur 20."],
        ["Scholl, Baume Stick Talons 25 % d'Urée.", "3e sur 23.", "non.", "8,05 sur 20."],
        ["La Roche-Posay, Lipikar Lait Urea 10 %.", "2e sur 36.", "non.", "7,93 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 10/11/2026.",
    },
    {
      type: "p",
      texte:
        "La lotion Eucerin tient sans parfum ni ingrédient pénalisé. Le lait Nivea, rien à voir avec [la boîte bleue et ses 21 ingrédients](/blog/creme-nivea-composition), place l'urée en 7e position, derrière la glycérine. Il ajoute de l'[acide salicylique](/i/salicylic-acid), un exfoliant, c'est-à-dire un ingrédient qui aide les cellules mortes à partir. Le stick Scholl contient deux huiles essentielles, menthe poivrée et lavande. Et le lait Lipikar à 10 %, sans parfum, perd des points sur six autres ingrédients. Pour lire une liste en entier, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },

    { type: "h2", texte: "Imidazolidinyl urea, diazolidinyl urea : est-ce de l'urée ?" },
    {
      type: "p",
      texte:
        "Non. [Imidazolidinyl Urea](/i/imidazolidinyl-urea) et [Diazolidinyl Urea](/i/diazolidinyl-urea) sont des **conservateurs**, des ingrédients qui empêchent les microbes de pousser dans le pot. Ils agissent en libérant lentement un peu de [formaldéhyde](/i/formaldehyde). Ce gaz tue les microbes, mais il peut aussi donner des allergies de contact aux personnes déjà sensibles.",
    },
    {
      type: "p",
      texte:
        "La loi européenne les autorise jusqu'à 0,6 % et 0,5 % ([règlement (CE) 1223/2009, annexe V](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Le [règlement (UE) 2022/1181](https://eur-lex.europa.eu/eli/reg/2022/1181/oj) a durci l'étiquette après un avis du comité scientifique européen, le SCCS. Dès que le produit libère plus de 0,001 % de formaldéhyde, il doit porter la mention ==« libère du formaldéhyde »==. Depuis le 31 juillet 2026, c'est obligatoire pour tous les produits vendus dans l'Union européenne.",
    },
    {
      type: "p",
      texte:
        "Dans notre base, ==6 546 produits== contiennent l'un de ces deux conservateurs, surtout des soins capillaires, des laits corporels et des masques. La moitié d'entre eux sont notés sous 7,2 dans l'app, contre 11,8 pour la moitié des produits à la vraie urée. Dans Cosme Check, l'urée est « sans risque connu », et ces deux conservateurs ont une « pénalité forte ». ++Le même mot sur l'étiquette, deux mondes opposés.++",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ta peau a déjà réagi à un conservateur : cherche « Imidazolidinyl Urea », « Diazolidinyl Urea » et la mention « libère du formaldéhyde ».",
        "Hors de l'Union européenne, au Québec par exemple, cette mention n'est pas imposée : seule la liste fait foi.",
        "[Hydroxyethyl Urea](/i/hydroxyethyl-urea), dans 2 378 produits, est encore autre chose : un hydratant voisin, pas un conservateur.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Ta crème cache-t-elle un faux « urea » ?** Scanne-la avec Cosme Check : tu vois chaque ingrédient avec sa couleur, et l'urée ne joue pas dans la même équipe que ces conservateurs.",
    },

    { type: "h2", texte: "La crème à l'urée peut-elle piquer ?" },
    {
      type: "p",
      texte:
        "Oui, parfois. L'urée est bien tolérée, mais elle peut picoter, surtout à forte dose et sur une peau abîmée ou crevassée (Piquero-Casals, 2021). Quatre gestes pour bien commencer.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Sur le visage, reste sous 10 % : 5 % suffit pour hydrater.",
        "Garde 10 % et plus pour le corps, les coudes et les pieds.",
        "Sur les talons, applique le soir et enfile des chaussettes en coton.",
        "Évite le contour des yeux, les lèvres et la peau qui vient d'être rasée.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Une crevasse qui saigne, une peau qui reste rouge ou qui démange : demande conseil à ton pharmacien ou à un dermatologue.",
        "Pour un bébé ou un jeune enfant, demande l'avis du pharmacien avant une crème à l'urée.",
      ],
    },

    { type: "h2", texte: "Urée ou glycérine : laquelle choisir ?" },
    {
      type: "p",
      texte:
        "Pour hydrater, les deux se valent. Chez ==197 personnes à la peau très sèche==, une crème à 20 % de glycérine a fait aussi bien qu'une crème à l'urée, et elle piquait moins ([Lodén et al., *Acta Dermato-Venereologica*, 2002](https://doi.org/10.1080/000155502753600885)). Dans les crèmes hydratantes de notre base, la glycérine est d'ailleurs seize fois plus présente que l'urée.",
    },
    {
      type: "p",
      texte:
        "L'urée garde un vrai avantage : les zones épaisses. Talons rugueux, coudes, genoux, peau qui pèle en hiver : là, une crème à 10 % fait ce que la glycérine ne fait pas. Dans l'air sec d'un hiver à Montréal ou d'un appartement chauffé, relis aussi [nos gestes pour la peau sèche](/blog/peau-seche-visage). Pour le visage, une crème légère suffit souvent : notre guide [crème hydratante ou réparatrice](/blog/cremes-hydratantes-reparatrices) t'aide à choisir.",
    },

    { type: "h2", texte: "La boîte dit-elle vrai sur l'urée ?" },
    {
      type: "p",
      texte:
        "Pour une fois, oui. On a pris les 875 produits qui écrivent « urée » ou « urea » dans leur nom. Dans ==85 % d'entre eux==, l'urée est dans les cinq premiers ingrédients. Seuls 18 la cachent dans la seconde moitié de la liste. C'est l'inverse des actifs à la mode, comme le [peptide de cuivre](/blog/peptide-de-cuivre), relégué en fin de liste dans 71 % des produits.",
    },
    {
      type: "p",
      texte:
        "++Le vrai piège n'est donc pas sur le devant de la boîte, il est au dos++ : un petit « urea » collé à un nom de conservateur. Quand tu lis une liste, regarde le mot juste avant.",
    },
  ],
  faq: [
    {
      question: "Urée crème, c'est quoi ?",
      reponse:
        "C'est une crème qui contient de l'urée, une petite molécule que la peau fabrique déjà pour garder son eau. Celle des crèmes est fabriquée en usine. Sous 10 %, elle hydrate ; à partir de 10 %, elle ramollit aussi les zones épaisses comme les talons. Sur la liste INCI, elle s'écrit « Urea », seule.",
    },
    {
      question: "Peut-on mettre une crème à l'urée sur le visage ?",
      reponse:
        "Oui, à faible dose. Sur le visage, une crème à 5 % d'urée hydrate sans trop picoter. Évite le contour des yeux et les lèvres, et garde les dosages de 10 % et plus pour le corps et les pieds. Si ta peau rougit ou chauffe, arrête et demande conseil à ton pharmacien.",
    },
    {
      question: "À quoi sert une crème à l'urée 30 % ?",
      reponse:
        "À ramollir la peau très épaisse, surtout celle des talons et des callosités. À cette dose, l'urée défait la couche de cellules mortes. Ce n'est pas une crème pour le visage. Applique-la le soir sur des pieds propres, puis enfile des chaussettes. Sur une crevasse qui saigne, demande d'abord conseil à un pharmacien.",
    },
    {
      question: "L'urée convient-elle à une peau grasse ?",
      reponse:
        "Oui. L'urée n'est pas un corps gras : elle se mélange à l'eau et ne bouche pas les pores. Une peau grasse peut aussi manquer d'eau, et une crème légère à faible dose d'urée l'hydrate sans briller. Vérifie plutôt les huiles, les cires et le parfum de la liste.",
    },
  ],
  notes: [
    {
      produit: "Eucerin, Lotion Corporelle UreaRepair Plus 10 % (400 ml)",
      ean: "4005800162350",
      note: 16.77,
      releveeLe: "2026-11-10",
    },
    {
      produit: "Nivea, Repair & Care Urea Lait Corporel Régénérant (400 ml)",
      ean: "9005800403533",
      note: 16.32,
      releveeLe: "2026-11-10",
    },
    {
      produit: "Cien, Crème Pieds 10 % d'Urée (100 ml)",
      ean: "4056489306603",
      note: 16.19,
      releveeLe: "2026-11-10",
    },
    {
      produit: "La Roche-Posay, Lipikar Lait Urea 5+ (400 ml)",
      ean: "3337875685818",
      note: 12.13,
      releveeLe: "2026-11-10",
    },
    {
      produit: "Mixa, Urea Cica Repair+ Crème pour le Corps (400 ml)",
      ean: "3600551137063",
      note: 11.73,
      releveeLe: "2026-11-10",
    },
    {
      produit: "Isdin, Ureadin Ultra 10 Plus Lotion Réparatrice (400 ml)",
      ean: "8470001557568",
      note: 11.7,
      releveeLe: "2026-11-10",
    },
    {
      produit: "Scholl, Baume Stick Réparateur Talons 25 % d'Urée",
      ean: "5056585803111",
      note: 8.05,
      releveeLe: "2026-11-10",
    },
    {
      produit: "La Roche-Posay, Lipikar Lait Urea 10 % (200 ml)",
      ean: "3337875852333",
      note: 7.93,
      releveeLe: "2026-11-10",
    },
  ],
};

export default article;
