import type { Article } from "@/contenu/articles";

/**
 * Publié le 02/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz » (`calendrier-avent-beaute` sortait de la fenêtre des dix derniers) :
 * les disques Medicube Zero Pore Pad, présentés comme viraux par Le Parisien
 * (30/10/2026) et Ouest-France (31/10/2026). « medicube » pèse 100 k à 1 M
 * recherches par mois, « medicube zero pore pad » 10 k à 100 k (+900 % sur un
 * an), « medicube avis » 1 k à 10 k (`docs/seo/VOLUMES.md`, 02/11/2026, dix
 * zones). Les premiers résultats sont des fiches de revendeurs : aucune ne
 * compare les listes. Listes INCI, couleurs et notes relevées dans la base
 * Cosme Check le 02/11/2026 (`cosme_check.catalog_export` et
 * `cosme_check.ingredients`) ; les notes sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "medicube-zero-pore-pad",
  titre: "Medicube Zero Pore Pad : on a lu les 47 ingrédients du disque viral (et ton pot n'a peut-être pas la même note)",
  titreSeo: "Medicube Zero Pore Pad : avis et composition",
  resume:
    "Acide lactique, acide salicylique, 7 huiles essentielles : on a lu la liste des disques Medicube Zero Pore Pad, notés de 12,16 à 16,16 selon le pot.",
  chapo:
    "Les Medicube Zero Pore Pad sont des disques imbibés de deux acides qui exfolient : l'acide lactique et l'acide salicylique. Ce duo peut aider contre les points noirs, à condition de ne pas en abuser. Mais leur liste cache aussi ==sept huiles essentielles==. Et selon le code-barres de ton pot, la même liste d'ingrédients obtient ++12,16 ou 16,16 sur 20++ dans Cosme Check.",
  publieLe: "2026-11-02",
  modifieLe: "2026-11-02",
  minutes: 7,
  theme: "medicube zero pore pad",
  motsCles: [
    "medicube zero pore pad",
    "medicube zero pore pad 2.0",
    "medicube zero pore pad avis",
    "medicube zero pore pad utilisation",
    "medicube zero pore pad matin ou soir",
    "medicube zero pore pad mild",
    "medicube avis",
    "medicube",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/medicube-zero-pore-pad.webp",
    alt: "Dans une salle de bain claire, deux mains versent un liquide transparent d'un flacon sur un disque de coton, au-dessus d'un lavabo blanc.",
    largeur: 1200,
    hauteur: 1800,
    position: "50% 35%",
    credit: "Nenad Stojković (Shixart1985), via Wikimedia Commons",
    licence: "CC BY 2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Person_applying_liquid_from_a_bottle_to_a_cotton_pad_in_a_bathroom_setting.jpg",
  },
  blocs: [
    { type: "h2", texte: "Pourquoi tout le monde parle des Zero Pore Pad ?" },
    {
      type: "p",
      texte:
        "Parce qu'ils sont partout sur TikTok, et que la presse a suivi. Le Parisien parle de « plus de 10 000 ventes » sur Amazon en octobre ([Le Parisien, 30/10/2026](https://www.leparisien.fr/guide-shopping/mode-soins/beaute/plus-de-10-000-ventes-en-octobre-2026-ce-soin-medicube-qui-reduit-efficacement-les-points-noirs-devient-viral-cet-automne-30-10-2026-COYD4YMFBRCTVDG2DT4ZHB6THA.php)). Le lendemain, Ouest-France met la marque en avant ([Ouest-France, 31/10/2026](https://www.ouest-france.fr/shopping/beaute/medicube-fait-un-carton-avec-ces-5-produits-skin-care-affiches-a-prix-tout-doux-ce-samedi-e92d9f62-d3b6-11f1-af78-2d36ec019942)).",
    },
    {
      type: "p",
      texte:
        "Côté recherches, « medicube zero pore pad » est tapé ==dix fois plus qu'il y a un an== en France, en Belgique, en Suisse et au Canada (Planificateur de mots clés de Google, relevé du 02/11/2026). Medicube est une marque sud-coréenne, et ses disques promettent de réduire les points noirs en deux semaines.",
    },
    {
      type: "p",
      texte:
        "Un chiffre circule : « 44,93 % de points noirs en moins ». Il vient de la marque. On n'a trouvé ni l'étude, ni le nombre de personnes testées. ++Un pourcentage sans méthode ne prouve rien++, dans un sens comme dans l'autre. Alors on a fait ce qu'on sait faire : lire la liste.",
    },

    { type: "h2", texte: "Qu'est-ce qu'il y a dans un disque Zero Pore Pad ?" },
    {
      type: "p",
      texte:
        "Surtout de l'eau et deux acides. La liste INCI, c'est la liste officielle des ingrédients, écrite du plus dosé au moins dosé. Dans la version 2025, on lit d'abord l'eau, un solvant et un ingrédient qui règle l'acidité. Puis vient l'[acide lactique](/i/lactic-acid) en 4e place, et l'alcool en 5e.",
    },
    {
      type: "p",
      texte:
        "L'acide lactique est un AHA, un acide qui décolle les cellules mortes à la surface de la peau. L'[acide salicylique](/i/salicylic-acid) est un BHA : il fait le même travail, mais il se dissout dans le gras. Selon la fiche d'un pharmacien en ligne, un disque contient 4,5 % d'acide lactique et 0,45 % d'acide salicylique ([Redcare Pharmacie](https://www.redcare-pharmacie.fr/beaute/F00599456/medicube-zero-pore-pad.htm)).",
    },
    {
      type: "fiche",
      titre: "Acide salicylique",
      inci: "SALICYLIC ACID",
      niveau: "prouve",
      effet:
        "Un exfoliant soluble dans le gras, qui se concentre dans les pores. C'est pour ça qu'on le retrouve dans les soins contre les points noirs.",
      statut:
        "Autorisé en Europe à 2 % au plus dans la plupart des cosmétiques, jugé sûr à ces doses par le SCCS ([règlement (UE) 2019/1966](https://eur-lex.europa.eu/eli/reg/2019/1966/oj)).",
    },
    {
      type: "p",
      texte:
        "Ces doses sont modérées. Un point noir, c'est un pore bouché par du sébum (le gras naturel de la peau) et des cellules mortes, dont la surface fonce à l'air. L'acide salicylique est le seul des deux à entrer dans ce gras ([Arif, *Clinical, Cosmetic and Investigational Dermatology*, 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4554394/)). Un dermatologue de la Cleveland Clinic le conseille d'ailleurs en premier contre les points noirs légers ([Cleveland Clinic](https://health.clevelandclinic.org/how-to-get-rid-of-blackheads)).",
    },

    { type: "h2", texte: "Pourquoi le même disque a deux notes différentes ?" },
    {
      type: "p",
      texte:
        "Parce que la liste n'est pas imprimée dans le même ordre sur tous les pots. On a trouvé quatre codes-barres de Zero Pore Pad 2.0 dans notre base. La version 2025 et les deux pots notés 16 contiennent ==exactement les mêmes 47 ingrédients==. Seul l'ordre change.",
    },
    {
      type: "tableau",
      entetes: ["Disques", "Code-barres", "Place des 2 ingrédients orange", "Note Cosme Check"],
      lignes: [
        ["Zero Pore Pad 2.0, version 2025 (70 disques).", "8800256114665.", "8e et 10e.", "12,16 sur 20."],
        ["Zero Pore Pad 2.0 (70 disques), liste proche.", "8800289479915.", "10e et 20e.", "12,21 sur 20."],
        ["Zero Pore Pad 2.0, compresses purifiantes.", "8809517412908.", "40e et 43e.", "16,11 sur 20."],
        ["Disques Zero Pore 2.0.", "8809517418870.", "40e et 43e.", "16,16 sur 20."],
        ["Zero Pore Pad Mild (sans acide salicylique).", "8809517414315.", "5e et 38e.", "12,30 sur 20."],
      ],
      legende:
        "Listes, couleurs et notes relevées dans la base Cosme Check le 02/11/2026. [Comment l'app classe les ingrédients](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "Les deux ingrédients orange sont le [Glycereth-26](/i/glycereth-26), un humectant fabriqué par un procédé polluant appelé éthoxylation, et un [polymère de synthèse](/i/ammonium-acryloyldimethyltaurate-vp-copolymer) qui épaissit le liquide. La note de Cosme Check tient compte de leur place : en fin de liste, un ingrédient à surveiller pèse moins.",
    },
    {
      type: "p",
      texte:
        "Comment l'ordre peut-il changer ? En Europe, un ingrédient dosé à moins de 1 % peut s'écrire dans n'importe quel ordre ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Or l'acide salicylique, à 0,45 %, arrive dès la 7e ou la 9e place : tout ce qui suit pèse donc 1 % ou moins. ++La note lit la liste telle qu'elle est imprimée++. D'où le bon réflexe : regarder le code-barres de ton pot, pas seulement son nom.",
    },

    { type: "h2", texte: "Les sept huiles essentielles, c'est un problème ?" },
    {
      type: "p",
      texte:
        "Pas pour tout le monde, mais il faut le savoir. Les Zero Pore Pad 2.0 contiennent des huiles d'orange douce, de citron, de pamplemousse, de [bergamote](/i/citrus-aurantium-bergamia-fruit-oil), de romarin, d'eucalyptus et de [lavande](/i/lavandula-angustifolia-oil). Elles parfument, et elles apportent du [limonène](/i/limonene), un allergène que l'Europe oblige à déclarer. Un allergène, c'est une substance qui peut déclencher une allergie chez certaines personnes.",
    },
    {
      type: "p",
      texte:
        "Sur une peau sensible, sept huiles plus deux acides, ça fait beaucoup. Et l'Anses (l'agence française de sécurité sanitaire) déconseille les huiles essentielles aux femmes enceintes et aux enfants ([Anses, 2024](https://www.anses.fr/fr/article/huiles-essentielles-risques-precautions)). Notre guide [cosmétiques et grossesse](/blog/cosmetiques-grossesse) explique comment les repérer sous leur nom latin.",
    },
    {
      type: "p",
      texte:
        "C'est un trait de la marque. Notre base compte 219 produits Medicube : ==66 % contiennent du parfum ou une huile essentielle==, et la note médiane de la marque est de 12,25. La version Mild, elle, n'a ni huile essentielle ni acide salicylique : elle exfolie avec du gluconolactone, un acide plus doux.",
    },

    { type: "h2", texte: "Et le reste de la gamme Zero Pore ?" },
    {
      type: "tableau",
      entetes: ["Produit", "Ce qui pèse sur la note", "Note Cosme Check"],
      lignes: [
        ["Zero Pore Blackhead Mud Mask (100 g).", "Aucun ingrédient orange ni rouge.", "16,49 sur 20."],
        ["Zero Pore Blackhead Deep Cleansing Oil (205 ml).", "Un émulsifiant orange en 2e place.", "12,62 sur 20."],
        ["Zero Pore Cream 2.0.", "Deux silicones rouges en 8e et 9e place.", "8,31 sur 20."],
        ["Zero Pore Serum 2.0 (37 ml).", "Deux silicones rouges en 4e et 6e place, et du BHT.", "1,09 sur 20."],
      ],
      legende: "Notes relevées dans la base Cosme Check le 02/11/2026.",
    },
    {
      type: "p",
      texte:
        "Le sérum s'effondre à cause de deux silicones, le [cyclopentasiloxane](/i/cyclopentasiloxane) (D5) et le cyclohexasiloxane (D6). L'Europe les limitera à 0,1 % dans les soins sans rinçage à partir de juin 2027 ([règlement (UE) 2024/1328](https://eur-lex.europa.eu/eli/reg/2024/1328/oj)). Ils restent autorisés d'ici là. S'y ajoute le [BHT](/i/bht), un antioxydant classé rouge dans Cosme Check.",
    },
    {
      type: "cta",
      texte:
        "**Ton pot est lequel ?** Scanne son code-barres avec Cosme Check : tu vois sa liste à lui, la couleur de chaque ingrédient et sa note en dix secondes.",
    },

    { type: "h2", texte: "Comment utiliser les Zero Pore Pad sans abîmer ta peau ?" },
    {
      type: "p",
      texte:
        "Doucement, et plutôt le soir. Les acides comme l'acide lactique rendent la peau plus sensible au soleil. L'agence américaine du médicament a mesuré 18 % de coups de soleil en plus après quatre semaines, un effet qui disparaît une semaine après l'arrêt ([FDA, « Alpha Hydroxy Acids »](https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids)).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Commence par deux ou trois soirs par semaine, sur une peau propre et sèche.",
        "Passe le disque sans frotter, surtout sur le nez et le menton, puis mets ta crème hydratante.",
        "Le matin, une crème solaire, même en hiver. Les [7 erreurs qui divisent ton SPF](/blog/spf-50-visage-7-erreurs) expliquent la bonne dose.",
        "Garde un seul exfoliant dans ta [routine skincare](/blog/routine-skincare) : le disque, ou le sérum aux acides, pas les deux.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Pas le même soir que le [rétinol](/blog/retinol) : les deux ensemble irritent.",
        "Pas sur une peau qui tire, qui pique ou qui vient d'être rasée.",
        "Enceinte, ou peau qui réagit fort (rougeurs qui durent, brûlures) : arrête et demande conseil à ton pharmacien ou à un dermatologue.",
      ],
    },

    { type: "h2", texte: "Les points noirs vont-ils disparaître pour de bon ?" },
    {
      type: "p",
      texte:
        "Non, et c'est le geste à garder pour la fin. Un pore se remplit à nouveau de sébum : un exfoliant l'entretient, il ne le vide pas une fois pour toutes. Si tu arrêtes les disques, les points noirs reviennent. Ce qui compte, c'est donc un produit que ta peau supporte ++sur des mois++, pas celui qui promet le plus en deux semaines.",
    },
    {
      type: "p",
      texte:
        "Pour choisir, lis la liste plutôt que la vidéo. Notre méthode pour [analyser une composition en 5 étapes](/blog/analyse-composition-cosmetique) marche sur n'importe quel pot. Et si tu crains les boutons, vérifie ce que veut dire [« comédogène »](/blog/comedogene) avant d'ajouter une crème riche par-dessus.",
    },
  ],
  faq: [
    {
      question: "Medicube zero pore pad matin ou soir ?",
      reponse:
        "Plutôt le soir. Les disques contiennent de l'acide lactique, un AHA qui rend la peau plus sensible au soleil. Le soir, la peau a la nuit pour se reposer. Si tu les utilises le matin, mets toujours une crème solaire ensuite, même en hiver. Commence par deux ou trois soirs par semaine pour voir comment ta peau réagit.",
    },
    {
      question: "Medicube zero pore pad comment utiliser ?",
      reponse:
        "Sur une peau propre et sèche, passe un disque sur le visage sans frotter, en insistant sur le nez et le menton. Ne rince pas, puis applique ta crème hydratante. Commence deux ou trois fois par semaine. Évite le même soir que le rétinol ou un autre exfoliant, et arrête si ta peau pique ou rougit.",
    },
    {
      question: "Medicube est-elle une bonne marque ?",
      reponse:
        "Ça dépend du produit. Notre base compte 219 produits Medicube, avec une note médiane de 12,25. Les écarts sont grands : 16,49 pour le masque Zero Pore à l'argile, 1,09 pour le sérum Zero Pore 2.0, à cause de deux silicones. Et 66 % des produits contiennent du parfum ou une huile essentielle.",
    },
    {
      question: "Medicube est une marque de quel pays ?",
      reponse:
        "Medicube est une marque de cosmétiques sud-coréenne, connue pour ses soins du visage vendus en ligne et repris sur TikTok. On la trouve en France, en Belgique et en Suisse surtout sur les sites de vente en ligne et chez certains revendeurs de beauté coréenne. Ses listes INCI sont souvent longues : jusqu'à 47 ingrédients pour les Zero Pore Pad.",
    },
  ],
  notes: [
    {
      produit: "Medicube, Zero Pore Pad 2.0, version 2025 (70 disques)",
      ean: "8800256114665",
      note: 12.16,
      releveeLe: "2026-11-02",
    },
    {
      produit: "Medicube, Zero Pore Pad 2.0 (70 disques)",
      ean: "8800289479915",
      note: 12.21,
      releveeLe: "2026-11-02",
    },
    {
      produit: "Medicube, Zero Pore Pad 2.0, compresses purifiantes",
      ean: "8809517412908",
      note: 16.11,
      releveeLe: "2026-11-02",
    },
    {
      produit: "Medicube, Disques Zero Pore 2.0",
      ean: "8809517418870",
      note: 16.16,
      releveeLe: "2026-11-02",
    },
    {
      produit: "Medicube, Zero Pore Pad Mild",
      ean: "8809517414315",
      note: 12.3,
      releveeLe: "2026-11-02",
    },
    {
      produit: "Medicube, Zero Pore Blackhead Mud Mask (100 g)",
      ean: "8809960356767",
      note: 16.49,
      releveeLe: "2026-11-02",
    },
    {
      produit: "Medicube, Zero Pore Blackhead Deep Cleansing Oil (205 ml)",
      ean: "8800256114610",
      note: 12.62,
      releveeLe: "2026-11-02",
    },
    {
      produit: "Medicube, Zero Pore Cream 2.0",
      ean: "8800240567330",
      note: 8.31,
      releveeLe: "2026-11-02",
    },
    {
      produit: "Medicube, Zero Pore Serum 2.0 (37 ml)",
      ean: "8800256118892",
      note: 1.09,
      releveeLe: "2026-11-02",
    },
  ],
};

export default article;
