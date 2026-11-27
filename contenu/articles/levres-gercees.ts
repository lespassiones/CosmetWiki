import type { Article } from "@/contenu/articles";

/**
 * Publié le 27/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « routines » (`creme-de-nuit` sortait de la fenêtre des dix derniers).
 * Planificateur de mots clés inaccessible ce jour (Google Ads renvoyait vers
 * la page de connexion, sur les deux comptes) : volume de la tête non mesuré,
 * décision prise sur le volume voisin « gommage lèvres » (1 k à 10 k,
 * `docs/seo/VOLUMES.md`), la saison et les suggestions Google du jour
 * (« lèvres gercées que faire », « lèvres gercées vaseline », « lèvres
 * gercées qui brûlent », « baume lèvres gercées », « carmex danger »,
 * « baume à lèvres laneige »). Premiers résultats : ELLE Belgique,
 * Aroma-Zone, Slate, Notino, Pourquoi Docteur ; aucun ne lit les listes.
 *
 * Chiffres : `cosme_check.catalog_export`, fiches actives, relevé du
 * 27/11/2026 (listes découpées sur les virgules hors parenthèses). 5 935
 * fiches en « baume à lèvres » et « crème pour les lèvres », 5 915 avec une
 * liste, note médiane 12,25 (baumes teintés exclus). Parfum ou arôme dans
 * 4 684 (79,2 %). Filtre solaire dans 1 156 (19,5 %), médiane 7,36 contre
 * 16,12 sans ; 942 avec un filtre chimique (médiane 6,95), 214 avec un filtre
 * minéral seul (médiane 12,46) ; 329 des 359 fiches sous 3 ont un filtre.
 * Camphre et menthol ensemble dans 100 fiches, médiane 7,21. Huile de ricin
 * dans 3 031 (51,2 %), médiane 16,21. Vaseline (Petrolatum) dans 897, médiane
 * 7,19. Couleurs : `cosme_check.ingredients` (octocrylène, homosalate,
 * Ethylhexyl Methoxycinnamate, benzophénone-3, BHT rouges ; Petrolatum,
 * Paraffinum Liquidum, Cera Microcristallina orange ; Camphor, Menthol,
 * Parfum, Aroma jaunes). Les notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "levres-gercees",
  titre: "Lèvres gercées : 4 baumes sur 5 contiennent ce que les dermatologues déconseillent",
  titreSeo: "Lèvres gercées : quel baume choisir en hiver ?",
  resume:
    "Lèvres gercées : les gestes qui marchent, et ce qu'on a trouvé dans 5 915 baumes. Parfum, camphre, filtres solaires : ce qu'il faut éviter.",
  chapo:
    "Des lèvres gercées ont besoin d'un baume épais, sans parfum, posé souvent, et surtout qu'on arrête de les lécher. Le problème, c'est le rayon : ==4 baumes à lèvres sur 5 contiennent un parfum ou un arôme==, que les dermatologues déconseillent sur des lèvres abîmées. Et ++le baume avec SPF est souvent le plus mal noté de la trousse++.",
  publieLe: "2026-11-27",
  modifieLe: "2026-11-27",
  minutes: 7,
  theme: "lèvres gercées",
  motsCles: [
    "lèvres gercées",
    "lèvres gercées que faire",
    "baume lèvres gercées",
    "lèvres gercées vaseline",
    "lèvres gercées qui brûlent",
    "lèvres sèches",
    "baume à lèvres",
    "baume à lèvres spf",
    "carmex danger",
    "carmex composition",
    "baume à lèvres laneige",
    "baume à lèvres nuxe",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/levres-gercees.webp",
    alt: "Sept bâtons de baume à lèvres alignés, turquoise, vert, orange, rose et violet, sur un fond bleu nuit.",
    largeur: 1023,
    hauteur: 544,
    credit: "Rawpixel Ltd, via Flickr",
    licence: "CC BY 2.0",
    source: "https://www.flickr.com/photos/147875007@N03/39726223570",
    position: "50% 75%",
  },
  blocs: [
    { type: "h2", texte: "Pourquoi les lèvres gercent-elles avant le reste du visage ?" },
    {
      type: "p",
      texte:
        "Parce qu'elles n'ont presque aucune défense : pas de glandes à sébum, cette huile naturelle qui protège la peau, et une couche de surface très fine. Une étude menée en hiver sur 303 femmes le confirme : les lèvres retiennent moins l'eau que les joues, et la perdent plus vite ([Kobayashi et Tagami, *British Journal of Dermatology*, 2004](https://pubmed.ncbi.nlm.nih.gov/15030342/)).",
    },
    {
      type: "p",
      texte:
        "Le froid, le chauffage et le vent font le reste, de Montréal à Genève. Le soleil de la plage gerce aussi : à La Réunion, c'est l'été en ce moment. ++Une lèvre gercée, c'est une lèvre qui a perdu son eau plus vite qu'elle ne la garde.++",
    },

    { type: "h2", texte: "Lèvres gercées : que faire tout de suite ?" },
    {
      type: "p",
      texte:
        "D'abord, arrêter de les lécher. La salive s'évapore et emporte l'eau des lèvres avec elle : elles finissent plus sèches qu'avant. Ensuite, sceller l'eau avec un produit épais. L'Académie américaine de dermatologie (AAD) donne une liste claire de ce qui marche ([AAD](https://www.aad.org/public/everyday-care/skin-care-basics/dry/heal-dry-chapped-lips)).",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "**Pose un baume plusieurs fois par jour**, et toujours avant de sortir dans le froid.",
        "**Le soir, mets une couche épaisse** de vaseline ou de baume gras, comme un masque de nuit.",
        "**Choisis un produit sans parfum ni arôme** tant que les lèvres sont fendues.",
        "**N'arrache pas les petites peaux** : tu rouvres la gerçure. Laisse le baume les ramollir.",
        "**Oublie le gommage** sur des lèvres à vif. Il sert à prévenir, une fois par semaine, sur des lèvres en bon état.",
      ],
    },
    {
      type: "p",
      texte:
        "L'AAD recommande la vaseline, l'huile minérale, l'huile de ricin, le karité et les céramides (des graisses naturelles de la peau). Dans la liste INCI, la liste officielle des ingrédients au dos du produit, la vaseline s'appelle **Petrolatum**. Ce sont des occlusifs : ils posent un film qui garde l'eau.",
    },

    { type: "h2", texte: "Qu'y a-t-il dans les baumes à lèvres du rayon ?" },
    {
      type: "p",
      texte:
        "On a lu les ==5 915 baumes et crèmes pour les lèvres== de notre base, sans compter les baumes teintés. Bonne nouvelle : les bases grasses sont là, comme le karité, dans six baumes sur dix.",
    },
    {
      type: "p",
      texte:
        "Mauvaise nouvelle ensuite : **4 684 baumes contiennent un parfum ou un arôme**, soit 79,2 %. L'AAD conseille de l'éviter sur des lèvres abîmées, parce qu'il peut les irriter. Sur nos listes, la note médiane passe de 15,93 sans parfum ni arôme à 12,15 avec.",
    },
    {
      type: "tableau",
      entetes: ["Ingrédient", "Baumes qui en contiennent", "Note médiane (sur 20)"],
      lignes: [
        ["Parfum ou arôme (Parfum, Aroma).", "4 684, soit 79,2 %.", "12,15."],
        ["Huile de ricin (Ricinus Communis Seed Oil).", "3 031, soit 51,2 %.", "16,21."],
        ["Filtre solaire.", "1 156, soit 19,5 %.", "7,36."],
        ["Vaseline (Petrolatum).", "897, soit 15,2 %.", "7,19."],
        ["Camphre et menthol ensemble.", "100.", "7,21."],
      ],
      legende: "Baumes et crèmes pour les lèvres de la base Cosme Check, relevé du 27/11/2026, baumes teintés exclus.",
    },
    {
      type: "p",
      texte:
        "La vaseline est un cas à part. C'est l'occlusif le mieux prouvé, et l'AAD la recommande en premier. Cosme Check la classe orange, comme les huiles et cires minérales, pour son origine pétrolière : ++le débat porte sur l'environnement, pas sur tes lèvres++. On l'explique en détail dans notre article sur la [peau sèche du visage](/blog/peau-seche-visage).",
    },

    { type: "h2", texte: "Pourquoi ton baume à lèvres picote-t-il ?" },
    {
      type: "p",
      texte:
        "Souvent à cause du camphre et du menthol. Leur fraîcheur fait croire que le baume « agit ». Or l'AAD les range parmi les ingrédients qui peuvent irriter des lèvres gercées, avec l'eucalyptus et le phénol. Le picotement n'est pas une preuve d'efficacité.",
    },
    {
      type: "fiche",
      titre: "Camphre",
      inci: "CAMPHOR",
      niveau: "prouve",
      effet:
        "Donne une sensation de froid puis de chaleur sur la peau. Sur des lèvres fendues, il peut piquer et irriter au lieu d'apaiser.",
      statut: "Autorisé dans les cosmétiques en Europe, classé jaune dans Cosme Check.",
    },
    {
      type: "p",
      texte:
        "L'exemple le plus connu est Carmex. Son *Classic Baume Hydratant* en tube réunit vaseline, lanoline, camphre, menthol et acide salicylique, un acide qui fait peler la peau. Il ajoute du **BHT**, un conservateur antioxydant classé rouge dans Cosme Check : ==7,21 sur 20==. La gamme *Naturally* de la même marque, à l'huile de ricin, monte au-dessus de 16.",
    },
    {
      type: "cta",
      texte:
        "**Ton baume contient-il du camphre ou un parfum ?** Scanne-le avec Cosme Check : la liste s'affiche en entier, avec la couleur de chaque ingrédient.",
    },

    { type: "h2", texte: "Le baume à lèvres avec SPF est-il le pire de la trousse ?" },
    {
      type: "p",
      texte:
        "Sur nos listes, oui. Un baume sur cinq contient un filtre solaire, et ==329 des 359 baumes notés sous 3 en ont un==. La note médiane tombe de 16,12 sans filtre à 7,36 avec. Le SPF, c'est l'indice de protection contre les UV du soleil.",
    },
    {
      type: "p",
      texte:
        "Ce sont les filtres chimiques qui font chuter la note. L'octocrylène, l'homosalate et la benzophénone-3 sont classés rouges dans Cosme Check, et l'Europe a plafonné leurs doses en 2022 ([règlement (UE) 2022/1176](https://eur-lex.europa.eu/eli/reg/2022/1176/oj)). Le *Hydro Care SPF 15* de Labello en a trois : ==1,4 sur 20==. Les baumes à filtre minéral seul (oxyde de zinc, dioxyde de titane) ont une médiane de 12,46.",
    },
    {
      type: "p",
      texte:
        "Faut-il se passer de SPF ? Non, mais il faut le choisir pour le bon moment. Sur les pistes de ski, à la mer ou sous le soleil des Antilles, les lèvres brûlent vite : l'AAD conseille un SPF 30 au zinc ou au titane. ++Pour le trajet en métro de décembre, un baume sans filtre suffit.++",
    },

    { type: "h2", texte: "Quel baume choisir pour des lèvres gercées ?" },
    {
      type: "p",
      texte:
        "Un baume épais, sans parfum, avec des corps gras en tête de liste. Voici dix baumes connus, lus et notés. Attention aux noms : ++deux baumes de la même gamme peuvent avoir deux listes très différentes++.",
    },
    {
      type: "tableau",
      entetes: ["Baume", "Ce qui compte dans la liste", "Note Cosme Check"],
      lignes: [
        ["Burt's Bees, Baume Hydratant Lèvres Non Parfumé (4,25 g).", "tournesol, coco, cire d'abeille, ricin, lanoline, karité, sans parfum.", "20 sur 20."],
        ["Bioderma, Atoderm Baume Lèvres (15 ml).", "huile de ricin en tête, sans parfum.", "16,6 sur 20."],
        ["Nuxe, Rêve de Miel Baume Lèvres (15 g).", "cire d'abeille, karité, miel ; huiles d'agrumes parfumées.", "16,28 sur 20."],
        ["Labello, Baume à Lèvres Original (4,8 g), liste au tournesol.", "tournesol, cire d'abeille, karité ; arôme.", "16,25 sur 20."],
        ["Avène, Cicalfate+ Lèvres (2 x 10 ml).", "huile de ricin en tête, glycérine, sans parfum.", "16,19 sur 20."],
        ["Labello, Original Stick (4,8 g), liste à la cire minérale.", "cire microcristalline en tête ; parfum.", "7,81 sur 20."],
        ["Laneige, Lip Sleeping Mask Berry (8 g).", "parfum, BHT.", "7,64 sur 20."],
        ["Carmex, Classic Baume Hydratant (10 g).", "vaseline, camphre, menthol, BHT.", "7,21 sur 20."],
        ["Uriage, Bariéderm Lèvres.", "huile et cires minérales, sans parfum.", "6,8 sur 20."],
        ["Labello, Hydro Care SPF 15 (4,8 g).", "trois filtres chimiques, parfum, BHT.", "1,4 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 27/11/2026.",
    },
    {
      type: "p",
      texte:
        "Deux pièges à connaître. Le *Labello Original* existe avec deux listes, à 16,25 et à 7,81 : seule la liste au dos dit laquelle tu tiens. Et Bioderma vend aussi un *Atoderm Lèvres Baume Réparateur* noté 1,17, à cause de deux silicones cycliques (D5 et D6) et du BHT. On avait vu le même écart dans les [routines peau grasse](/blog/routine-peau-grasse).",
    },
    {
      type: "p",
      texte:
        "La note ne dit pas tout. Le Bariéderm d'Uriage, noté bas pour ses ingrédients minéraux, suit les conseils de l'AAD : film épais, aucun parfum. Le Rêve de Miel, très bien noté, est parfumé aux agrumes. Pour aller plus loin, lis notre méthode pour [analyser une composition](/blog/analyse-composition-cosmetique).",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ne garde pas un baume qui pique, brûle ou fait gonfler les lèvres : arrête-le.",
        "Évite les « lip plumpers » (baumes repulpants) pendant une gerçure : certains contiennent du piment, de la cannelle ou un dérivé du menthol, qui gonflent la lèvre en l'irritant un peu. Même ceux à la [Volufiline](/blog/volufiline) misent souvent sur ce picotement.",
        "Des lèvres qui restent gercées après deux à trois semaines de bons gestes, des coins de la bouche fendus ou des croûtes : parles-en à un dermatologue ou à ton pharmacien.",
      ],
    },
    {
      type: "encadre",
      titre: "Ce qu'il faut retenir",
      texte:
        "Ne lèche plus tes lèvres, pose un baume sans parfum toute la journée et une couche de vaseline le soir. Garde le SPF pour le ski et la plage. Et le meilleur produit est souvent le plus simple : ==un pot de vaseline pure, c'est ce que les dermatologues conseillent en premier==.",
      ton: "emeraude",
    },
    {
      type: "p",
      texte:
        "Le reste du visage tire aussi ? Regarde la routine de la [peau sèche en hiver](/blog/peau-seche-visage) et la [crème de nuit](/blog/creme-de-nuit) qui va avec. Et si tu aimes les huiles à lèvres brillantes, on a aussi lu les listes des [lip oils](/blog/lip-oils-huiles-levres).",
    },
  ],
  faq: [
    {
      question: "Lèvres gercées : que faire ?",
      reponse:
        "Arrête de les lécher, puis pose un baume épais et sans parfum plusieurs fois par jour. Le soir, applique une couche épaisse de vaseline ou de baume gras. N'arrache pas les petites peaux et évite le gommage tant que les lèvres sont fendues. Dans une pièce chauffée, un humidificateur aide aussi.",
    },
    {
      question: "Lèvres gercées : la vaseline, ça marche ?",
      reponse:
        "Oui, c'est même le premier ingrédient conseillé par l'Académie américaine de dermatologie. La vaseline pose un film qui empêche l'eau des lèvres de s'évaporer. Mets-en une couche épaisse le soir. Cosme Check la classe orange pour son origine pétrolière, mais le débat porte sur l'environnement, pas sur tes lèvres.",
    },
    {
      question: "Lèvres gercées qui brûlent : pourquoi ?",
      reponse:
        "La gerçure laisse la peau à vif, et certains ingrédients piquent alors : camphre, menthol, parfum, acide salicylique ou filtres solaires. Passe à un baume sans parfum ni camphre et regarde si la brûlure baisse. Si elle dure, si les lèvres gonflent ou font des croûtes, parles-en à un dermatologue ou à ton pharmacien.",
    },
    {
      question: "Carmex : danger ?",
      reponse:
        "Rien n'indique un danger : ses ingrédients sont autorisés en Europe. Mais sa formule classique contient du camphre et du menthol, que les dermatologues déconseillent sur des lèvres gercées. Elle contient aussi du BHT, classé rouge dans Cosme Check : 7,21 sur 20 pour le tube Classic. La gamme Naturally, à l'huile de ricin, dépasse 16.",
    },
  ],
  notes: [
    {
      produit: "Burt's Bees, Baume Hydratant pour les Lèvres Non Parfumé (4,25 g)",
      ean: "0792850649187",
      note: 20,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Bioderma, Atoderm Baume Lèvres (15 ml)",
      ean: "3701129810064",
      note: 16.6,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Nuxe, Rêve de Miel Baume Lèvres Ultra-nourrissant (15 g)",
      ean: "3264680021633",
      note: 16.28,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Labello, Baume à Lèvres Original (4,8 g)",
      ean: "4005900990181",
      note: 16.25,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Avène, Cicalfate+ Lèvres Baume Réparateur (2 x 10 ml)",
      ean: "3282770401844",
      note: 16.19,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Labello, Original Stick soin des lèvres",
      ean: "4005900189950",
      note: 7.81,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Laneige, Lip Sleeping Mask Ex Berry (8 g)",
      ean: "8809685797340",
      note: 7.64,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Carmex, Classic Baume Hydratant pour les Lèvres (10 g)",
      ean: "3401351322617",
      note: 7.21,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Uriage, Bariéderm Lèvres Baume isolant réparateur",
      ean: "3661434000737",
      note: 6.8,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Labello, Hydro Care Baume à Lèvres SPF 15 (4,8 g)",
      ean: "4005808763009",
      note: 1.4,
      releveeLe: "2026-11-27",
    },
    {
      produit: "Bioderma, Atoderm Lèvres Baume Réparateur (15 ml)",
      ean: "3701129801000",
      note: 1.17,
      releveeLe: "2026-11-27",
    },
  ],
};

export default article;
