import type { Article } from "@/contenu/articles";

/**
 * Publié le 12/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz » (`medicube-zero-pore-pad` sortait de la fenêtre des dix derniers) :
 * la crème au suif de bœuf (« beef tallow »), tendance TikTok reprise par
 * L'ADN et par des sites de santé. Volumes du 12/11/2026 (France, Belgique,
 * Suisse, Luxembourg, Canada ; toutes langues : `docs/seo/VOLUMES.md`) :
 * « beef tallow » 10 k à 100 k, « suif de boeuf visage » et « crème suif de
 * boeuf » 100 à 1 k (la seconde +900 % sur un an en France). Premiers
 * résultats : L'ADN, un site de régime, des sites anglais ; aucun ne lit de
 * liste. Chiffres tirés de `cosme_check.catalog_export` (fiches actives,
 * relevé du 12/11/2026) ; les notes sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "suif-de-boeuf",
  titre: "Crème au suif de bœuf : la tendance TikTok que tu as sûrement déjà sous la douche (on a lu 777 listes)",
  titreSeo: "Suif de bœuf visage : ce que dit la science",
  resume:
    "Le suif de bœuf de TikTok hydrate-t-il vraiment ? Ce que disent les études, les notes des crèmes au suif, et les 602 savons de notre base qui en contiennent.",
  chapo:
    "Le suif de bœuf est de la graisse de bœuf fondue : sur la peau, il fait un film gras qui retient l'eau, comme une crème riche. Mais aucune étude solide ne montre qu'il fait mieux qu'une crème classique. Et la vraie surprise est ailleurs : dans notre base, ==602 savons== en contiennent déjà, ++souvent en premier ingrédient++.",
  publieLe: "2026-11-12",
  modifieLe: "2026-11-12",
  minutes: 7,
  theme: "suif de bœuf visage",
  motsCles: [
    "suif de bœuf visage",
    "crème suif de bœuf",
    "beef tallow",
    "suif de bœuf peau",
    "graisse de bœuf visage",
    "suif de bœuf avis",
    "sodium tallowate",
    "adeps bovis",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/suif-de-boeuf.webp",
    alt: "Un petit bocal en verre à fermeture mécanique, rempli de graisse de bœuf fondue et figée, blanche et crémeuse, posé ouvert sur une table en bois.",
    largeur: 1000,
    hauteur: 475,
    credit: "FotoosvanRobin, via Wikimedia Commons",
    licence: "CC BY-SA 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Tallow-beef_suet_after_rendering.jpg",
  },
  blocs: [
    { type: "h2", texte: "Pourquoi le suif de bœuf est partout sur TikTok ?" },
    {
      type: "p",
      texte:
        "Parce que des créatrices de contenu ont remplacé leurs crèmes par un petit pot de graisse de bœuf, et le racontent en vidéo. Le mot-clé #beeftallow (« suif de bœuf » en anglais) regroupe des centaines de vidéos, et la presse française a suivi ([L'ADN](https://www.ladn.eu/nouveaux-usages/senduire-de-graisse-de-boeuf-la-nouvelle-tocade-beaute-de-tiktok/)).",
    },
    {
      type: "p",
      texte:
        "Les recherches suivent aussi. En France, « crème suif de bœuf » est tapé ==dix fois plus qu'il y a un an== (Planificateur de mots clés de Google, relevé du 12/11/2026). Les promesses vont loin : peau « nourrie », moins de boutons, « comme nos grands-parents ». Alors on a fait ce qu'on sait faire : regarder ce que disent les études, puis lire les listes.",
    },

    { type: "h2", texte: "Le suif de bœuf, c'est quoi exactement ?" },
    {
      type: "p",
      texte:
        "Le suif, c'est la graisse de bœuf fondue puis filtrée, souvent prise autour des reins. Sur une étiquette, son nom INCI (la liste officielle des ingrédients, du plus dosé au moins dosé) est [Tallow](/i/tallow) ou [Adeps Bovis](/i/adeps-bovis).",
    },
    {
      type: "p",
      texte:
        "Il est fait d'acides gras, les petites briques qui composent toutes les graisses. Environ un quart d'acide palmitique, un tiers à près de la moitié d'acide oléique, et une part très variable d'acide stéarique ([Yılmaz et al., *European Journal of Lipid Science and Technology*, 2010](https://doi.org/10.1002/ejlt.200900133)). Rien d'exotique : on trouve les mêmes dans le beurre de karité ou l'huile d'olive.",
    },
    {
      type: "p",
      texte:
        "TikTok répète qu'il ressemble au sébum, le gras naturel de la peau. C'est vrai en partie seulement. Le sébum humain contient aussi environ un quart de cires et plus d'un dixième de squalène, que le suif n'a pas ([Picardo et al., *Dermato-Endocrinology*, 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2835893/)).",
    },

    { type: "h2", texte: "Que dit la science sur le suif pour la peau ?" },
    {
      type: "p",
      texte:
        "Presque rien, et c'est la réponse la plus honnête. Une dermatologue de la Cleveland Clinic le résume : ses acides gras peuvent hydrater, mais les études manquent pour dire s'il pénètre et s'il apporte un vrai bénéfice ([Cleveland Clinic](https://health.clevelandclinic.org/beef-tallow-for-skin)). On n'a trouvé aucun essai qui compare une crème au suif à une crème classique sur des visages.",
    },
    {
      type: "p",
      texte:
        "Ce qu'on sait, c'est comment agit un corps gras. Le suif est un **occlusif** : il pose un film sur la peau qui freine l'évaporation de l'eau. La vaseline, le beurre de karité ou la cire d'abeille font la même chose ([Purnamawati et al., *Clinical Medicine & Research*, 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5849435/)). Sur une [peau sèche en hiver](/blog/peau-seche-visage), ça soulage. Ça ne fait pas de miracle.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Une texture épaisse peut boucher les pores des peaux grasses, prévient la même dermatologue. Notre article sur le mot [comédogène](/blog/comedogene) explique pourquoi les listes de « gras qui donnent des boutons » sont peu fiables.",
        "Comme tout ingrédient, il peut provoquer une allergie, même chez qui mange du bœuf sans souci.",
        "Le suif fait maison n'a souvent aucun conservateur : la graisse peut rancir, c'est-à-dire s'oxyder à l'air et sentir fort.",
      ],
    },

    { type: "h2", texte: "Le suif est-il déjà dans tes cosmétiques ?" },
    {
      type: "p",
      texte:
        "Oui, et depuis longtemps. Dans notre base, ==777 fiches== listent une forme de suif. La grande majorité sont des savons : 602 produits contiennent du [Sodium Tallowate](/i/sodium-tallowate), et 492 le placent en premier ingrédient. Ça fait ++un savon solide sur quinze++.",
    },
    {
      type: "p",
      texte:
        "Le Sodium Tallowate, c'est du suif transformé en savon par la soude. Ce procédé, la saponification, est le même que pour l'huile d'olive ou de coco. On le trouve chez Rogé Cavaillès, La Cigale, Nivea, Fa ou Persavon, et dans bien des savons « de Marseille » de supermarché. Le savon de Marseille de Carrefour écrit même « Suif » en tête de liste, et obtient 20 sur 20 dans Cosme Check.",
    },
    {
      type: "tableau",
      entetes: ["Forme du suif dans la liste", "Ce que c'est", "Fiches dans la base"],
      lignes: [
        ["Sodium Tallowate.", "Du suif transformé en savon, puis rincé.", "602."],
        ["Tallow ou Adeps Bovis.", "De la graisse de bœuf telle quelle, laissée sur la peau.", "77, dont 26 baumes à lèvres et 18 produits de rasage."],
        ["Dérivés (Tallowtrimonium Chloride…).", "Des molécules fabriquées à partir du suif, surtout dans les après-shampooings.", "84."],
        ["Deer Fat.", "De la graisse de cerf, dans des crèmes pour les pieds allemandes.", "13."],
      ],
      legende: "Listes relevées dans la base Cosme Check le 12/11/2026 (fiches actives). Une fiche peut contenir deux formes.",
    },
    {
      type: "p",
      texte:
        "Un détail surprenant : les célèbres baumes tchèques au « suif de cerf » (Jelení lůj, de la marque Regina). Sur 36 des 37 produits Regina et Jelení lůj de notre base, la graisse inscrite est Adeps Bovis, le nom INCI de la graisse de bœuf. ++Le nom sur le pot ne dit pas toujours ce qu'il y a dedans++ : seule la liste fait foi.",
    },

    { type: "h2", texte: "Que valent les crèmes au suif de la base ?" },
    {
      type: "tableau",
      entetes: ["Produit", "Ce que dit la liste", "Note Cosme Check"],
      lignes: [
        ["Fat Cow Skincare, Tallow Face Cream.", "Deux ingrédients : suif et huile d'amande douce.", "20 sur 20."],
        ["Butter Me Up, Whipped Tallow Cream.", "Suif, huile d'amande douce, squalane, poudre d'arrow-root, vitamine E.", "20 sur 20."],
        ["Vigority, Tallow Sunscreen SPF 50 (crème solaire ; le SPF est son indice de protection contre les coups de soleil).", "Filtre minéral (oxyde de zinc) et graisse de bœuf en 3e place.", "16,70 sur 20."],
        ["Fuss Wohl, Deer Tallow Cream (pieds).", "Graisse de cerf en 8e place, parfum en fin de liste.", "16,58 sur 20."],
        ["Ancestral Cosmetics, Tallow & Charcoal Cleansing Balm.", "Suif, huile de ricin, charbon, huiles essentielles et leurs allergènes.", "16,25 sur 20."],
        ["Regina, Traditional Crème au Suif de Cerf.", "Graisse de bœuf, paraffines, bronopol et méthylparabène comme conservateurs.", "6,36 sur 20."],
      ],
      legende:
        "Listes et notes relevées dans la base Cosme Check le 12/11/2026. [Comment l'app classe les ingrédients](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "Deux crèmes au suif à 20 sur 20 : est-ce la preuve que la tendance a raison ? Non. La note lit la liste : elle dit qu'aucun ingrédient n'est classé à surveiller. ++Elle ne dit pas que le produit hydrate mieux qu'un autre++, ni comment le pot a été fabriqué. Une [crème à la glycérine](/blog/glycerine) bien formulée peut obtenir la même note.",
    },
    {
      type: "cta",
      texte:
        "**Ton baume ou ton savon contient-il du suif ?** Scanne son code-barres avec Cosme Check : tu vois chaque ingrédient, sa couleur et la note du produit en dix secondes.",
    },

    { type: "h2", texte: "Le suif fait maison, c'est risqué ?" },
    {
      type: "p",
      texte:
        "C'est là que le bât blesse. En Europe, tout cosmétique vendu doit passer une évaluation de sécurité, faite par un expert, avant d'arriver en rayon ([règlement (CE) 1223/2009, article 10](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Un pot préparé dans sa cuisine n'en a aucune, et un pot vendu sur un marché ou en ligne doit l'avoir aussi.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Si tu veux essayer, choisis un produit fini avec une liste INCI complète, plutôt qu'un suif de boucherie fondu chez toi.",
        "Teste d'abord sur une petite zone, au pli du coude, pendant deux ou trois jours.",
        "Garde le pot au frais et fermé, et jette-le s'il change d'odeur ou de couleur.",
        "Peau grasse ou à boutons : commence par le soir, sur les zones sèches seulement.",
      ],
    },
    {
      type: "p",
      texte:
        "Une peau qui réagit fort, des boutons qui font mal ou une plaque qui ne part pas : là, parles-en à ton pharmacien ou à un dermatologue. Aucun pot, au suif ou non, ne remplace un avis médical.",
    },

    { type: "h2", texte: "Alors, tu essaies ou pas ?" },
    {
      type: "p",
      texte:
        "Si ta peau tire en hiver, le suif peut faire le travail d'un baume riche, ni plus ni moins. Si elle est grasse, il y a plus simple. Et si tu veux savoir comment choisir, notre guide pour [connaître ton type de peau](/blog/type-de-peau) est un meilleur point de départ qu'une vidéo de trente secondes.",
    },
    {
      type: "p",
      texte:
        "Le geste à garder pour la fin : avant d'acheter un pot de graisse de bœuf, retourne ton savon. Il y a des chances que le suif soit déjà dans ta salle de bain, écrit en toutes lettres au dos. Pour lire une liste en deux minutes, suis notre méthode d'[analyse de composition en 5 étapes](/blog/analyse-composition-cosmetique).",
    },
  ],
  faq: [
    {
      question: "Suif de bœuf c'est quoi ?",
      reponse:
        "C'est la graisse de bœuf fondue puis filtrée, souvent prise autour des reins. On l'utilise depuis des siècles en cuisine, pour les bougies et pour le savon. Sur une étiquette de cosmétique, il s'écrit Tallow ou Adeps Bovis, et Sodium Tallowate quand il a été transformé en savon.",
    },
    {
      question: "Suif de bœuf bon pour la peau ?",
      reponse:
        "Il peut hydrater comme un baume riche : c'est un corps gras qui fait un film sur la peau et retient l'eau. Mais aucune étude solide ne montre qu'il fait mieux qu'une crème classique, selon une dermatologue de la Cleveland Clinic. Il peut aussi irriter ou provoquer une allergie : teste-le d'abord sur une petite zone.",
    },
    {
      question: "Suif de bœuf peau grasse ?",
      reponse:
        "Ce n'est pas le meilleur choix. Sa texture épaisse peut boucher les pores et favoriser les boutons sur une peau grasse. Si tu veux l'essayer, garde-le pour les zones sèches et pour le soir. Une crème légère avec de la glycérine hydrate une peau grasse sans l'alourdir.",
    },
    {
      question: "Suif de bœuf visage avis ?",
      reponse:
        "Les avis enthousiastes viennent surtout de vidéos, pas d'études. Dans notre base, deux crèmes au suif obtiennent 20 sur 20, parce que leur liste est courte et sans ingrédient à surveiller. Mais la note juge la liste, pas l'efficacité. Préfère un produit fini à un suif fait maison, sans contrôle ni conservateur.",
    },
  ],
  notes: [
    { produit: "Fat Cow Skincare, Tallow Face Cream", ean: "5065018225079", note: 20, releveeLe: "2026-11-12" },
    { produit: "Butter Me Up, Whipped Tallow Cream", ean: "0699838224322", note: 20, releveeLe: "2026-11-12" },
    { produit: "Vigority, Tallow Sunscreen with Mineral SPF 50", ean: "0198168306239", note: 16.7, releveeLe: "2026-11-12" },
    { produit: "Fuss Wohl, Deer Tallow Cream", ean: "4047196042380", note: 16.58, releveeLe: "2026-11-12" },
    { produit: "Ancestral Cosmetics, Tallow & Charcoal Cleansing Balm", ean: "0710497675888", note: 16.25, releveeLe: "2026-11-12" },
    { produit: "Regina, Traditional Crème au Suif de Cerf", ean: "8595002321694", note: 6.36, releveeLe: "2026-11-12" },
    { produit: "Carrefour, Savon de Marseille", ean: "3560070731220", note: 20, releveeLe: "2026-11-12" },
  ],
};

export default article;
