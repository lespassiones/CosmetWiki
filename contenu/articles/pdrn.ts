import type { Article } from "@/contenu/articles";

/**
 * Publié le 30/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz » (`creme-nivea-composition` sortait de la fenêtre des dix
 * derniers) : « pdrn » pèse 10 k à 100 k recherches par mois (+900 % sur un
 * an), « pdrn skincare » 1 k à 10 k (+900 %), « sperme de saumon » et
 * « sodium dna » 100 à 1 k (`docs/seo/VOLUMES.md`, 30/10/2026). Les premiers
 * résultats sont des fiches produit (Sephora, Medicube, Notino) : aucun ne
 * lit les listes ni ne dit ce que la science a testé sur la peau. Les 612
 * produits, les positions dans les listes et les sept notes viennent de la
 * base Cosme Check (relevé du 30/10/2026, `cosme_check.catalog_export` et
 * `cosme_check.ingredients`) ; les notes sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "pdrn",
  titre: "PDRN : le « sperme de saumon » de ta crème, on a lu 612 compositions (et il est trop gros pour entrer)",
  titreSeo: "PDRN : c'est quoi, et ça marche vraiment ?",
  resume:
    "PDRN, l'ADN de saumon des crèmes coréennes : on a lu 612 compositions. Où il est placé, ce qu'il fait sur la peau, et la note des produits Medicube, Anua et VT.",
  chapo:
    "Le PDRN, c'est de l'ADN tiré de la laitance de saumon, et dans une crème il agit surtout comme un hydratant. Ses effets « régénérants » ont été étudiés en injection, pas en crème. On a lu les 612 produits qui en contiennent dans notre base : ++dans 9 cas sur 10, la niacinamide est plus dosée que lui++.",
  publieLe: "2026-10-30",
  modifieLe: "2026-10-30",
  minutes: 7,
  theme: "pdrn",
  motsCles: [
    "pdrn",
    "pdrn c'est quoi",
    "pdrn skincare",
    "pdrn saumon",
    "sperme de saumon",
    "adn de saumon",
    "sodium dna",
    "pdrn medicube",
    "pdrn anua",
    "pdrn avis",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/pdrn-adn-saumon.webp",
    alt: "Un pavé de saumon cru, orange vif, parsemé de brins de thym, sur un fond vert sombre.",
    largeur: 960,
    hauteur: 640,
    credit: "NjoyHarmony, via Wikimedia Commons",
    licence: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:SalmonFillet.jpg",
  },
  blocs: [
    { type: "h2", texte: "Le PDRN, c'est quoi exactement ?" },
    {
      type: "p",
      texte:
        "Le PDRN, c'est un mélange de petits morceaux d'ADN. Son nom complet est polydésoxyribonucléotide. L'ADN, c'est la molécule qui porte le code génétique de chaque être vivant. Celui du PDRN vient de la laitance de saumon ou de truite, autrement dit leur sperme : ses cellules donnent un ADN très pur ([Squadrito et al., *Frontiers in Pharmacology*, 2017](https://doi.org/10.3389/fphar.2017.00224)).",
    },
    {
      type: "p",
      texte:
        "Sur une boîte, tu ne liras jamais « PDRN ». Dans la liste INCI (la liste officielle des ingrédients, écrite du plus dosé au moins dosé), il s'appelle presque toujours **Sodium DNA**. Les crèmes coréennes l'ont rendu viral cette année, et [Paris Match](https://www.parismatch.be/actualites/people/2026/08/15/pourquoi-kim-kardashian-charli-xcx-ou-encore-jennifer-aniston-ont-toutes-succombe-au-sperme-de-saumon-AJW3H7VUUFBXPNUDRYUYTYRXSI/) en a fait un sujet people en août 2026.",
    },
    {
      type: "fiche",
      titre: "ADN de saumon (PDRN)",
      inci: "SODIUM DNA",
      niveau: "incertain",
      effet: "Retient l'eau à la surface de la peau. Ses effets sur la réparation de la peau ont été montrés en injection ; en crème, les études sont rares, petites et souvent faites par les fabricants.",
      statut: "Ingrédient cosmétique listé dans la base européenne CosIng, sans restriction particulière.",
    },
    {
      type: "p",
      texte:
        "Sa fiche dans Cosme Check est verte : [Sodium DNA](/i/sodium-dna). Rien d'inquiétant, donc. La vraie question, c'est ce qu'il fait une fois posé sur ta joue.",
    },

    { type: "h2", texte: "Le PDRN en crème fait-il la même chose qu'en injection ?" },
    {
      type: "p",
      texte:
        "Non. En médecine, le PDRN s'utilise surtout en injection, sous la peau ou dans le muscle. C'est là qu'il aide des plaies à se refermer, en se fixant sur des récepteurs des cellules qu'on appelle A2A (Squadrito, 2017). Les injections d'« ADN de saumon » au visage sont un acte médical : pour ça, c'est à un dermatologue qu'il faut parler.",
    },
    {
      type: "p",
      texte:
        "Dans une crème, le PDRN doit d'abord traverser la surface de la peau. Or ses fragments pèsent de 50 000 à 1 500 000 daltons (le dalton est l'unité qui sert à peser les molécules). La « règle des 500 daltons » dit qu'au-delà de 500, une molécule passe mal ([Bos et Meinardi, 2000](https://doi.org/10.1034/j.1600-0625.2000.009003165.x)). ==Le PDRN est au moins 100 fois trop gros==, comme le collagène du [masque Biodance](/blog/masque-biodance).",
    },

    { type: "h2", texte: "Que disent les études sur le PDRN en crème ?" },
    {
      type: "p",
      texte:
        "Pas grand-chose de solide. La plupart des chiffres des boutiques viennent de tests payés par les marques, sans groupe de comparaison. La seule étude publiée qu'on a trouvée sur un PDRN en crème porte sur **10 personnes**. Elle teste un PDRN tiré de la pivoine, et tous ses auteurs travaillent pour l'entreprise qui le fabrique ([Bak et al., *International Journal of Molecular Sciences*, 2025](https://doi.org/10.3390/ijms27010220)).",
    },
    {
      type: "p",
      texte:
        "Ce que le PDRN fait sûrement, c'est hydrater. L'ADN aime l'eau, il la garde à la surface de la peau, un peu comme un humectant (un ingrédient qui attire l'eau et la retient). Ta peau paraît plus lisse et plus rebondie. Mais la glycérine fait ce travail depuis des décennies, pour beaucoup moins de bruit.",
    },

    { type: "h2", texte: "Où est le PDRN dans la liste des ingrédients ?" },
    {
      type: "p",
      texte:
        "Souvent loin. On a lu les **612 produits** de la base Cosme Check qui contiennent du Sodium DNA. Voici ce que disent leurs listes.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "Dans 344 produits sur 612 (56 %), il est dans la seconde moitié de la liste, là où les ingrédients sont les moins dosés.",
        "Il n'est dans les cinq premiers que 14 fois (2 %).",
        "Quand il y a aussi de la [niacinamide](/blog/niacinamide), elle est placée avant lui dans 321 cas sur 346 (93 %).",
        "Un produit sur deux (308, soit 50 %) contient du parfum.",
      ],
    },
    {
      type: "p",
      texte:
        "En Europe, les ingrédients qui font moins de 1 % peuvent s'écrire dans n'importe quel ordre en fin de liste ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Un ingrédient vedette rangé derrière les conservateurs est presque toujours sous cette ligne. Le nom du produit dit « PDRN », ++la liste dit surtout eau, glycérine et niacinamide++. C'est la méthode pour [lire n'importe quelle composition](/blog/analyse-composition-cosmetique).",
    },
    {
      type: "cta",
      texte:
        "**Ta crème « au saumon », elle vaut quoi ?** Scanne-la avec Cosme Check : en dix secondes, tu vois où est placé le PDRN, la couleur de chaque ingrédient et sa note.",
    },

    { type: "h2", texte: "Medicube, Anua ou VT : quel produit PDRN choisir ?" },
    {
      type: "p",
      texte:
        "Trois marques coréennes font l'essentiel du rayon : Medicube (64 produits dans la base), Anua (28) et VT Cosmetics (22). Leurs notes vont du simple au quadruple, et le produit le plus connu n'est pas le mieux noté.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place du PDRN", "Note Cosme Check"],
      lignes: [
        ["Medicube, PDRN Pink Cica Soothing Toner (lotion tonique).", "8e sur 35.", "16,73 sur 20."],
        ["Anua, PDRN Glow Moisture Serum.", "18e sur 34.", "12,55 sur 20."],
        ["VT Cosmetics, PDRN Reedle Shot 100.", "41e sur 53.", "12,44 sur 20."],
        ["Anua, PDRN Hyaluronic Acid 100 Moisturising Cream.", "7e sur 48.", "8,26 sur 20."],
        ["Medicube, PDRN Pink Collagen Capsule Cream.", "25e sur 59.", "8,19 sur 20."],
        ["Medicube, sérum aux peptides roses PDRN.", "8e sur 40.", "8 sur 20."],
        ["Medicube, PDRN Pink Hyaluronic Moisturizing Cream.", "29e sur 58.", "4,08 sur 20."],
      ],
      legende:
        "Listes et notes relevées dans la base Cosme Check le 30/10/2026. [Comment l'app note un produit](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "Les deux crèmes stars, celle d'Anua et celle de Medicube, perdent des points sur la même chose : des polymères de synthèse (des plastiques qui épaississent la crème), classés orange. La crème d'Anua a pourtant le PDRN le mieux placé du tableau, en 7e position. La [Glycereth-26](/i/glycereth-26) et le parfum pèsent sur le sérum de Medicube.",
    },
    {
      type: "p",
      texte:
        "La crème hyaluronique de Medicube est la plus basse. Elle contient en 5e place du [cyclopentasiloxane](/i/cyclopentasiloxane), un silicone que l'Europe limitera à 0,1 % dans les soins sans rinçage à partir de juin 2027 ([règlement (UE) 2024/1328](https://eur-lex.europa.eu/eli/reg/2024/1328/oj)). Il est autorisé d'ici là. Et la note mesure la formule, pas le plaisir : ++la lotion tonique la mieux notée est aussi la plus simple++.",
    },

    { type: "h2", texte: "Alors, ça vaut le coup ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Achète un produit PDRN pour sa texture et son hydratation, pas pour « régénérer » ta peau.",
        "Regarde les cinq premiers ingrédients : c'est eux qui font le travail. Cherche [glycérine](/i/glycerin), [niacinamide](/i/niacinamide) ou [hyaluronate de sodium](/i/sodium-hyaluronate).",
        "Peau sensible : choisis une formule sans parfum. Un produit PDRN sur deux en contient.",
        "Garde ta routine simple : un nettoyant, une crème, une crème solaire. Le [bon ordre est ici](/blog/routine-skincare).",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Allergie au poisson : demande d'abord à ton pharmacien. Certains produits ajoutent aussi des œufs de saumon ([Salmon Egg Extract](/i/salmon-egg-extract)) ou de la laitance ([Milt Extract](/i/milt-extract)).",
        "Méfie-toi des promesses d'« effet injection » : une crème ne fait pas ce que fait une aiguille.",
        "Rougeurs ou boutons après quelques jours : arrête, et lis [ce que veut dire « comédogène »](/blog/comedogene).",
      ],
    },
    {
      type: "p",
      texte:
        "Le geste qui compte le plus, pour finir : ==aucun ADN de saumon ne protège ta peau du soleil==. Les UV abîment chaque jour le collagène et l'ADN de tes propres cellules. Une crème solaire le matin fera toujours plus pour ta peau que le plus viral des sérums.",
    },
  ],
  faq: [
    {
      question: "PDRN, c'est quoi ?",
      reponse:
        "Le PDRN (polydésoxyribonucléotide) est un mélange de fragments d'ADN tirés de la laitance de saumon ou de truite. Sur les listes d'ingrédients, il s'appelle Sodium DNA. En médecine, il s'utilise en injection. Dans les crèmes, il sert surtout à hydrater, car ses molécules sont trop grosses pour entrer dans la peau.",
    },
    {
      question: "PDRN Medicube ou Anua : lequel choisir ?",
      reponse:
        "Ça dépend du produit, pas de la marque. Dans la base Cosme Check, la lotion tonique PDRN Pink Cica de Medicube a 16,73 sur 20 et le sérum Glow d'Anua 12,55 sur 20. Leurs crèmes PDRN les plus connues tournent autour de 8 sur 20, à cause de polymères de synthèse. Scanne celui que tu vises.",
    },
    {
      question: "Le PDRN convient-il aux peaux sensibles ?",
      reponse:
        "L'ingrédient lui-même est classé vert dans Cosme Check. Le risque vient plutôt du reste de la formule : la moitié des produits au PDRN de notre base contiennent du parfum. Choisis une formule sans parfum, teste-la d'abord sur une petite zone, et demande conseil à ton pharmacien si ta peau réagit.",
    },
    {
      question: "L'ADN de saumon, ça marche vraiment ?",
      reponse:
        "En injection, le PDRN a des études médicales, notamment sur la réparation de plaies. En crème, les preuves sont minces : une étude publiée sur 10 personnes, menée par le fabricant, et des tests de marque. Ce qu'on peut attendre d'une crème au PDRN, c'est une peau bien hydratée, comme avec une bonne crème hydratante.",
    },
  ],
  notes: [
    {
      produit: "Medicube, PDRN Pink Cica Soothing Toner",
      ean: "8800289474897",
      note: 16.73,
      releveeLe: "2026-10-30",
    },
    {
      produit: "Anua, PDRN Glow Moisture Serum",
      ean: "8800307378299",
      note: 12.55,
      releveeLe: "2026-10-30",
    },
    {
      produit: "VT Cosmetics, PDRN Reedle Shot 100 (50 ml)",
      ean: "8803463006853",
      note: 12.44,
      releveeLe: "2026-10-30",
    },
    {
      produit: "Anua, PDRN Hyaluronic Acid 100 Moisturising Cream (60 ml)",
      ean: "8800307371252",
      note: 8.26,
      releveeLe: "2026-10-30",
    },
    {
      produit: "Medicube, PDRN Pink Collagen Capsule Cream (55 g)",
      ean: "8800289467714",
      note: 8.19,
      releveeLe: "2026-10-30",
    },
    {
      produit: "Medicube, sérum aux peptides roses PDRN (30 ml)",
      ean: "8800256108053",
      note: 8,
      releveeLe: "2026-10-30",
    },
    {
      produit: "Medicube, PDRN Pink Hyaluronic Moisturizing Cream (50 ml)",
      ean: "8800256113101",
      note: 4.08,
      releveeLe: "2026-10-30",
    },
  ],
};

export default article;
