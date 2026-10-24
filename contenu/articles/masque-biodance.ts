import type { Article } from "@/contenu/articles";

/**
 * Publié le 24/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz » : « masque biodance » et « biodance » pèsent 10 k à 100 k
 * recherches par mois chacune, « masque biodance » à +900 % sur un an
 * (`docs/seo/VOLUMES.md`, 22 et 24/10/2026). Les premiers résultats sont des
 * pharmacies en ligne et des boutiques de K-beauty : aucun ne lit la liste
 * dans l'ordre ni ne confronte le « collagène » à ce qui traverse la peau.
 * La liste INCI et les couleurs viennent de la base Cosme Check (relevé du
 * 24/10/2026, `cosme_check.catalog_export` et `cosme_check.ingredients`) ;
 * les cinq notes sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "masque-biodance",
  titre: "Masque Biodance : le collagène n'arrive qu'en 25e position (et il ne rentre pas dans ta peau)",
  titreSeo: "Masque Biodance : avis et composition décryptée",
  resume:
    "Masque Biodance Bio-Collagen : on a lu ses 34 ingrédients. Ce que fait vraiment le collagène, ce qui hydrate, et la note Cosme Check de chaque masque.",
  chapo:
    "Le masque Biodance Bio-Collagen hydrate bien, mais pas grâce au collagène : il arrive en **25e position sur 34 ingrédients**, et sa molécule est bien trop grosse pour entrer dans la peau. Ce qui travaille, c'est l'eau, la glycérine et le gel qui colle à ton visage pendant des heures. On a lu toute la liste, et ++la note de la base te dit lequel des masques de la marque choisir++.",
  publieLe: "2026-10-24",
  modifieLe: "2026-10-24",
  minutes: 7,
  theme: "masque biodance",
  motsCles: [
    "masque biodance",
    "biodance",
    "biodance avis",
    "biodance collagen",
    "bio collagen real deep mask",
    "masque biodance comment utiliser",
    "masque coréen collagène",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/masque-biodance.webp",
    alt: "Un présentoir rempli de masques en tissu coréens dans leurs sachets colorés, au premier plan d'une boutique de cosmétiques.",
    largeur: 1023,
    hauteur: 683,
    credit: "Moona.Store, via Flickr",
    licence: "CC BY-SA 2.0",
    source: "https://www.flickr.com/photos/191132816@N02/50632211872",
  },
  blocs: [
    { type: "h2", texte: "Qu'est-ce qu'il y a dans le masque Biodance Bio-Collagen ?" },
    {
      type: "p",
      texte:
        "Surtout de l'eau, de la glycérine et un gel. Le masque Biodance est un masque **hydrogel** : au lieu d'un tissu imbibé, c'est une feuille de gelée, faite d'eau prise dans des gommes d'algues et de caroube. On le pose le soir, on le garde plusieurs heures, et il devient transparent en séchant.",
    },
    {
      type: "p",
      texte:
        "Sa liste INCI compte 34 ingrédients dans la version de notre base. La liste INCI, c'est la liste officielle des ingrédients écrite sur la boîte, du plus dosé au moins dosé. Voici ce qu'ils font, regroupés par rôle.",
    },
    {
      type: "tableau",
      entetes: ["Ingrédients (noms INCI)", "Ce qu'ils font", "Couleur Cosme Check"],
      lignes: [
        ["Aqua, [Glycerin](/i/glycerin), Betaine.", "L'eau, et deux humectants : des ingrédients qui attirent l'eau et la gardent dans la peau.", "vert."],
        ["[Acrylates Copolymer](/i/acrylates-copolymer).", "Un polymère qui forme un film et tient le gel.", "orange."],
        ["[Niacinamide](/i/niacinamide).", "La vitamine B3, 4e de la liste : le seul actif bien placé.", "vert."],
        ["Ceratonia Siliqua Gum, [Chondrus Crispus Extract](/i/chondrus-crispus-extract), [Algin](/i/algin), [Agar](/i/agar).", "Des gommes de caroube et d'algues : ce sont elles qui font la gelée.", "vert."],
        ["[Dipropylene Glycol](/i/dipropylene-glycol), 1,2-Hexanediol, [Butylene Glycol](/i/butylene-glycol), [Caprylyl Glycol](/i/caprylyl-glycol).", "Des solvants qui aident aussi à conserver le produit.", "jaune."],
        ["[Disodium EDTA](/i/disodium-edta).", "Il stabilise la formule.", "jaune."],
        ["[Collagen Extract](/i/collagen-extract), [Hydrolyzed Hyaluronic Acid](/i/hydrolyzed-hyaluronic-acid), [Galactomyces Ferment Filtrate](/i/galactomyces-ferment-filtrate), [Adenosine](/i/adenosine), extraits de fruits et de fleurs.", "Les ingrédients mis en avant par la marque, tous en fin de liste.", "vert (eau de rose : jaune)."],
      ],
      legende:
        "Liste et couleurs relevées dans la base Cosme Check le 24/10/2026 (Bio Collagen Real Deep Mask, lot de 4). [Comment l'app classe les ingrédients](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "Bonne nouvelle pour les peaux qui réagissent : la liste ne contient **pas de parfum**. L'orange de l'Acrylates Copolymer vise sa fabrication en plastique de synthèse, ++pas un danger pour ta peau++.",
    },

    { type: "h2", texte: "Où est le collagène dans la liste ?" },
    {
      type: "p",
      texte:
        "À la 25e place sur 34, après l'eau de rose. En Europe, les ingrédients s'écrivent du plus dosé au moins dosé, sauf ceux qui font moins de 1 % : ceux-là peuvent venir dans n'importe quel ordre ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Un ingrédient placé aussi loin, derrière les conservateurs, est presque toujours sous cette ligne du 1 %.",
    },
    {
      type: "p",
      texte:
        "Le nom du masque promet du collagène. La liste dit surtout de l'eau et du gel. C'est la même méthode que pour [lire n'importe quelle composition](/blog/analyse-composition-cosmetique) : on regarde les cinq premiers, et on se méfie de l'ingrédient vedette rangé en bas.",
    },

    { type: "h2", texte: "Le collagène du masque entre-t-il dans la peau ?" },
    {
      type: "p",
      texte:
        "Non, pas tel quel. Le collagène est une protéine qui forme la charpente de la peau, dans une couche profonde appelée le derme. Pour traverser la surface de la peau, une molécule doit être petite : moins de 500 daltons environ, d'après la « règle des 500 daltons » ([Bos et Meinardi, *Experimental Dermatology*, 2000](https://doi.org/10.1034/j.1600-0625.2000.009003165.x)). Le dalton, c'est l'unité qui sert à peser les molécules.",
    },
    {
      type: "p",
      texte:
        "Or [la fiche du masque chez un pharmacien en ligne](https://www.pharma-gdd.com/fr/biodance-masque-collagene-bio-collagen-real-deep-mask) annonce un collagène « de très faible poids moléculaire » : 52 000. Même ce chiffre, présenté comme petit, est ==plus de 100 fois au-dessus de la limite==.",
    },
    {
      type: "fiche",
      titre: "Extrait de collagène",
      inci: "COLLAGEN EXTRACT",
      niveau: "prouve",
      effet: "Retient l'eau à la surface de la peau et laisse un toucher doux. Trop grosse pour atteindre le derme, la molécule ne remplace pas le collagène de ta peau.",
      statut: "Autorisé dans l'Union européenne comme ingrédient cosmétique.",
    },
    {
      type: "p",
      texte:
        "Ce n'est pas inutile pour autant : à la surface, le collagène retient l'eau comme un humectant. Il ne fabrique pas de collagène neuf, et il ne remplit pas les rides.",
    },

    { type: "h2", texte: "Alors pourquoi la peau est si douce au réveil ?" },
    {
      type: "p",
      texte:
        "Parce que le gel est occlusif : il couvre la peau et empêche son eau de s'évaporer pendant des heures. Pendant ce temps, la glycérine et la bétaïne attirent l'eau dans la couche du dessus. Une peau gorgée d'eau paraît plus lisse et plus rebondie. Une revue scientifique a mesuré l'effet des soins qui couvrent la peau : ils réduisent nettement sa perte d'eau ([Purnamawati et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5849435/)).",
    },
    {
      type: "p",
      texte:
        "Le seul actif bien dosé, c'est la [niacinamide](/blog/niacinamide), en 4e position. Elle aide la peau à garder son eau et à paraître plus nette. L'effet du masque, lui, est surtout immédiat : ++l'éclat du matin dure le temps que l'eau reste dans la peau++, souvent une journée.",
    },
    {
      type: "cta",
      texte:
        "**Ton masque, il contient quoi ?** Scanne sa boîte avec Cosme Check : en dix secondes, tu vois sa liste, la couleur de chaque ingrédient et sa note.",
    },

    { type: "h2", texte: "Quel masque Biodance choisir ?" },
    {
      type: "p",
      texte:
        "La marque vend plusieurs masques du même format, et leurs notes ne se ressemblent pas. Les deux plus bas ont des listes bien plus longues, avec quatre ou cinq ingrédients orange, surtout des polymères de synthèse.",
    },
    {
      type: "tableau",
      entetes: ["Masque", "Ingrédients", "Note Cosme Check"],
      lignes: [
        ["Refreshing Sea Kelp (varech marin).", "42, dont 1 orange.", "12,57 sur 20."],
        ["Radiant Vita Niacinamide.", "46, dont 2 orange.", "12,51 sur 20."],
        ["Bio-Collagen.", "34, dont 1 orange.", "12,49 sur 20."],
        ["Hydro Cera-nol.", "65, dont 4 orange.", "8,47 sur 20."],
        ["Rejuvenating Caviar PDRN.", "55, dont 5 orange.", "8,39 sur 20."],
      ],
      legende:
        "Notes et listes relevées dans la base Cosme Check le 24/10/2026. Le PDRN est un fragment d'ADN tiré du poisson, à la mode en ce moment.",
    },
    {
      type: "p",
      texte:
        "La note ne mesure ni le plaisir ni l'effet glow, elle lit la formule. Comme pour [la crème Nivea face à une crème de luxe](/blog/creme-nivea-composition), ++le nom le plus prometteur n'a pas la meilleure liste++.",
    },

    { type: "h2", texte: "Comment l'utiliser sans faire de bêtise ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Sur une peau propre et sèche, le soir. Retire le film protecteur, pose le gel, lisse-le avec les doigts.",
        "Garde-le quelques heures, jusqu'à ce qu'il devienne transparent. Puis retire-le et masse ce qui reste.",
        "Une à deux fois par semaine suffit : entre deux, une [crème hydratante adaptée à ta peau](/blog/cremes-hydratantes-reparatrices) fait le même travail de fond.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Peau grasse ou à boutons : un gel occlusif toute la nuit ne va pas à toutes les peaux. Teste d'abord deux heures, et lis [ce que veut dire « comédogène »](/blog/comedogene).",
        "Ça pique, ça chauffe, ça rougit : retire-le tout de suite et rince à l'eau fraîche.",
        "Le masque est très copié. Achète-le en pharmacie ou chez un revendeur connu, et compare la liste de la boîte avec celle de l'app.",
      ],
    },
    {
      type: "p",
      texte:
        "Le meilleur geste pour la fin : ==un masque ne remplace pas la crème solaire==. Les UV comptent parmi ce qui abîme le plus le collagène de ta peau, toute l'année. Les [crèmes solaires coréennes](/blog/creme-solaire-coreenne-k-beauty) en sont la preuve : la K-beauty commence par là.",
    },
  ],
  faq: [
    {
      question: "Comment utiliser le masque Biodance ?",
      reponse:
        "Pose-le le soir sur une peau propre et sèche, après avoir retiré les deux films en plastique. Lisse le gel avec les doigts pour chasser les bulles d'air. Garde-le quelques heures, jusqu'à ce qu'il devienne transparent, puis retire-le et fais pénétrer le reste en massant. Pas besoin de rincer.",
    },
    {
      question: "Le masque Biodance est-il bon pour la peau ?",
      reponse:
        "Il hydrate bien et ne contient pas de parfum. Sa note est de 12,49 sur 20 dans Cosme Check, avec un seul ingrédient orange, un polymère de synthèse. Son effet vient surtout de l'eau, de la glycérine et du gel qui couvre la peau, pas du collagène, placé en 25e position.",
    },
    {
      question: "Combien de temps garder le masque Biodance ?",
      reponse:
        "Plusieurs heures : la marque conseille de le garder au moins trois à quatre heures, ou jusqu'à ce qu'il devienne transparent. Si ta peau est grasse ou réagit vite, commence par deux heures et regarde comment elle se comporte le lendemain. Une à deux fois par semaine suffit.",
    },
    {
      question: "Peut-on dormir avec le masque Biodance ?",
      reponse:
        "Oui, il est pensé pour ça, et beaucoup le gardent toute la nuit. Mais un gel qui couvre la peau pendant huit heures ne convient pas à toutes les peaux. Si tu vois apparaître des boutons ou des rougeurs, raccourcis la pose, et demande conseil à ton pharmacien si ça continue.",
    },
  ],
  notes: [
    {
      produit: "Biodance, Bio Collagen Real Deep Mask (lot de 4, 34 g)",
      ean: "8809937360858",
      note: 12.49,
      releveeLe: "2026-10-24",
    },
    {
      produit: "Biodance, Refreshing Sea Kelp Real Deep Mask (34 g)",
      ean: "8809937362135",
      note: 12.57,
      releveeLe: "2026-10-24",
    },
    {
      produit: "Biodance, Radiant Vita Niacinamide Real Deep Mask (7 x 34 g)",
      ean: "8809891184132",
      note: 12.51,
      releveeLe: "2026-10-24",
    },
    {
      produit: "Biodance, Hydro Cera-nol Real Deep Mask (34 g)",
      ean: "8809937362173",
      note: 8.47,
      releveeLe: "2026-10-24",
    },
    {
      produit: "Biodance, Rejuvenating Caviar PDRN Real Deep Mask (34 g)",
      ean: "8809891184606",
      note: 8.39,
      releveeLe: "2026-10-24",
    },
  ],
};

export default article;
