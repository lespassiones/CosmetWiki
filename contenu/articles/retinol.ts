import type { Article } from "@/contenu/articles";

/**
 * Publié le 31/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » (`niacinamide` sortait de la fenêtre des dix derniers) :
 * « rétinol » pèse 1 k à 10 k recherches par mois, « rétinol visage »,
 * « sérum rétinol », « crème rétinol », « rétinol pharmacie » et « rétinol
 * et soleil » 100 à 1 k chacune (`docs/seo/VOLUMES.md`, 23 et 24/10/2026,
 * dix zones). Les premiers résultats sont des pages de marques et de
 * revendeurs (Aroma-Zone, Atida, Marionnaud, Notino) : aucun ne lit les
 * listes. Les 1 381 produits, les parts et les notes médianes viennent de
 * `cosme_check.catalog_export` (produits actifs dont la liste INCI contient
 * l'ingrédient « retinol », dédoublonnés par code-barres, relevé du
 * 31/10/2026) ; les notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "retinol",
  titre: "Rétinol : on a lu 1 381 produits, et un sur deux cache son actif en fin de liste",
  titreSeo: "Rétinol : bienfaits, dosage et comment débuter",
  resume:
    "Le rétinol, l'actif anti-âge le plus étudié : comment débuter sans irriter ta peau, la limite européenne de 0,3 % et ce qu'on lit dans 1 381 produits.",
  chapo:
    "Le rétinol est une forme de vitamine A qui lisse les ridules et affine le grain de peau, à condition de commencer doucement, le soir, avec une crème solaire le matin. Depuis novembre 2025, l'Europe le limite à 0,3 % dans un soin visage. Et dans les 1 381 produits de notre base qui en contiennent, ++un sur deux le place dans la seconde moitié de sa liste++.",
  publieLe: "2026-10-31",
  modifieLe: "2026-10-31",
  minutes: 7,
  theme: "rétinol",
  motsCles: [
    "rétinol",
    "rétinol visage",
    "sérum rétinol",
    "crème rétinol",
    "rétinol débutant",
    "rétinol et soleil",
    "rétinol pharmacie",
    "rétinol ou rétinal",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/retinol-flacon-ambre.webp",
    alt: "Deux flacons en verre brun posés sur une table en bois, l'un fermé par un bouchon noir, l'autre ouvert, avec une pipette compte-gouttes couchée devant eux.",
    largeur: 1200,
    hauteur: 900,
    position: "50% 40%",
    credit: "Nieuw, via Wikimedia Commons",
    licence: "CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Bruin_glaswerk_en_druppelteller.JPG",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, le rétinol ?" },
    {
      type: "p",
      texte:
        "Le rétinol, c'est une forme de vitamine A. Sur la liste INCI (la liste officielle des ingrédients, écrite du plus dosé au moins dosé), il s'écrit simplement **[Retinol](/i/retinol)**. Une fois dans la peau, il se transforme en deux étapes : d'abord en rétinal, puis en acide rétinoïque. C'est cette dernière forme qui agit sur les cellules.",
    },
    {
      type: "p",
      texte:
        "L'acide rétinoïque pur, lui, est un médicament, vendu sur ordonnance. Le rétinol des crèmes est sa version douce : il en faut plus, et il agit plus lentement, mais il pique moins. On range toute cette famille sous le nom de rétinoïdes.",
    },
    {
      type: "fiche",
      titre: "Rétinol",
      inci: "RETINOL",
      niveau: "prouve",
      effet:
        "Atténue les ridules et lisse le grain de peau en quelques mois, dans des études contrôlées. Peut tirailler, rougir et faire peler les premières semaines.",
      statut:
        "Autorisé dans l'Union européenne, au plus 0,3 % dans un soin visage et 0,05 % dans un lait corporel, avec une mention obligatoire sur l'étiquette (règlement (UE) 2024/996). Classé jaune dans Cosme Check.",
    },

    { type: "h2", texte: "Le rétinol marche-t-il vraiment ?" },
    {
      type: "p",
      texte:
        "Oui, c'est l'actif anti-âge des crèmes le mieux prouvé. L'étude la plus citée a un détail étonnant : elle a été faite ==sur les bras de 36 personnes âgées de 87 ans en moyenne== ([Kafi et al., *Archives of Dermatology*, 2007](https://doi.org/10.1001/archderm.143.5.606)). Chacune recevait une lotion à 0,4 % de rétinol sur un bras et une lotion sans actif sur l'autre, jusqu'à trois fois par semaine pendant 24 semaines.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "Le bras traité avait des ridules nettement moins marquées.",
        "Sous le microscope, la peau fabriquait plus de collagène, la protéine qui la rend ferme.",
        "La plupart des personnes ont eu une légère irritation du côté rétinol.",
      ],
    },
    {
      type: "p",
      texte:
        "Deux limites, quand même. Quatre auteurs avaient déposé un brevet sur ce traitement. Et la peau d'un bras de 87 ans n'est pas celle d'un visage de 30 ans. Le rétinol est sérieux, mais il ne fait pas de miracle : il faut des mois, et une crème solaire chaque matin, pour voir une différence.",
    },

    { type: "h2", texte: "Que dit la nouvelle règle européenne sur le rétinol ?" },
    {
      type: "p",
      texte:
        "Depuis le 1er novembre 2025, un nouveau soin au rétinol vendu en Europe a un plafond : ==0,3 % dans une crème ou un sérum, 0,05 % dans un lait pour le corps== ([règlement (UE) 2024/996](https://eur-lex.europa.eu/eli/reg/2024/996/oj)). Les produits plus dosés déjà en rayon peuvent encore être vendus jusqu'au 1er mai 2027 ([Test-Achats](https://www.test-achats.be/sante/sante-au-quotidien/creme-anti-rides/news/retinol-cosmetiques)).",
    },
    {
      type: "p",
      texte:
        "Pourquoi cette limite ? Ta crème n'est pas la seule source de vitamine A : il y en a aussi dans l'alimentation et dans certains compléments. Les experts européens du SCCS (le comité scientifique qui conseille la Commission sur la sécurité des cosmétiques) ont calculé un plafond pour que le total reste raisonnable. D'où la mention qui apparaît désormais sur les boîtes : « Contient de la vitamine A », suivie d'une invitation à penser à ce qu'on en prend déjà chaque jour avant de l'utiliser.",
    },
    {
      type: "p",
      texte:
        "Dans notre base, ==34 produits annoncent encore 0,5 % ou 1 % de rétinol dans leur nom==. Ce n'est pas forcément une infraction : ils peuvent venir d'avant la règle, ou d'un autre pays. Mais pour un premier rétinol, ce n'est de toute façon pas par là qu'on commence.",
    },

    { type: "h2", texte: "Qu'est-ce qu'il y a dans les produits au rétinol ?" },
    {
      type: "p",
      texte:
        "Notre base compte ==1 381 produits== qui contiennent du rétinol (relevé du 31/10/2026) : surtout des soins anti-âge, des crèmes hydratantes et des contours des yeux. Voici ce qu'on y a compté :",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Produits où le rétinol est dans la seconde moitié de la liste.", "698, soit 50,5 %."],
        ["Produits où il est dans les cinq premiers ingrédients.", "72, soit 5,2 %."],
        ["Produits qui contiennent du [parfum](/i/parfum).", "801, soit 58 %."],
        ["Produits qui l'associent à un acide exfoliant (AHA).", "192, soit 13,9 %."],
        ["Produits qui l'associent à la [niacinamide](/i/niacinamide).", "397, soit 28,7 %."],
      ],
      legende: "Base Cosme Check, produits actifs, relevé du 31/10/2026.",
    },
    {
      type: "p",
      texte:
        "Que le rétinol soit loin dans la liste n'a rien d'anormal : il agit à très petite dose, souvent sous 1 %. Le chiffre qui pique, c'est le parfum. Le rétinol irrite déjà un peu ; le parfum peut en rajouter. Résultat dans l'app : la note médiane des produits parfumés est de 7,9, contre ==11,7 pour ceux qui n'en ont pas==.",
    },
    {
      type: "cta",
      texte:
        "**Ton sérum au rétinol est-il parfumé ?** Scanne-le avec Cosme Check : en dix secondes, tu vois la place du rétinol dans la liste et la couleur de chaque ingrédient.",
    },

    { type: "h2", texte: "Quel produit au rétinol choisir ?" },
    {
      type: "p",
      texte:
        "Le nom sur la boîte ne suffit pas. Huit soins connus, dont deux crèmes de jour avec SPF (l'indice de protection contre le soleil), et des notes qui vont de 1 à 16.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place du rétinol", "Parfum", "Note Cosme Check"],
      lignes: [
        ["SVR, Ampoule [A] Lift.", "16e sur 34.", "non.", "16,52 sur 20."],
        ["The Ordinary, Retinol 1% in Squalane.", "4e sur 8.", "non.", "12,17 sur 20."],
        ["CeraVe, Sérum au rétinol resurfaçant.", "19e sur 33.", "non.", "12,07 sur 20."],
        ["Neutrogena, Retinol Boost+ Sérum de Nuit Intense.", "7e sur 12.", "non.", "11,76 sur 20."],
        ["La Roche-Posay, Retinol B3 Sérum.", "10e sur 21.", "oui.", "11,6 sur 20."],
        ["L'Oréal Paris, Revitalift Laser Pure Retinol Sérum de Nuit.", "14e sur 29.", "oui.", "11,56 sur 20."],
        ["Neutrogena, Retinol Boost Crème de Jour SPF 15.", "24e sur 30.", "oui.", "1,13 sur 20."],
        ["La Roche-Posay, Redermic R Corrective UV SPF 30.", "22e sur 38.", "oui.", "1,08 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 31/10/2026.",
    },
    {
      type: "p",
      texte:
        "Les deux dernières lignes ne sont pas des erreurs. Ce sont des crèmes de jour au rétinol avec un filtre solaire, et certains de leurs filtres, comme l'[octocrylène](/i/octocrylene) ou l'[homosalate](/i/homosalate), sont classés rouge dans l'app. Sur les 95 produits au rétinol de la base qui contiennent un filtre solaire chimique, la note médiane tombe à 6,8. Pour lire ces listes toi-même, suis notre [méthode d'analyse de composition](/blog/analyse-composition-cosmetique).",
    },

    { type: "h2", texte: "Comment débuter le rétinol sans irriter sa peau ?" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Le soir seulement : la lumière abîme le rétinol, et il peut rendre la peau plus sensible au soleil.",
        "Deux soirs par semaine les deux premières semaines, puis un soir sur deux, puis tous les soirs si tout va bien.",
        "Une noisette pour tout le visage, sur peau sèche, en évitant le bord des yeux, des narines et des lèvres.",
        "Une crème hydratante par-dessus si ça tire. Pour une peau qui tiraille déjà en hiver, lis [notre article sur la peau sèche](/blog/peau-seche-visage).",
        "Le matin, une crème solaire, même en hiver et même sous un ciel gris ([les 7 erreurs avec le SPF](/blog/spf-50-visage-7-erreurs)).",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ne le mets pas le même soir qu'un acide exfoliant (AHA comme l'[acide glycolique](/i/glycolic-acid), ou BHA comme l'[acide salicylique](/i/salicylic-acid)). Un soir l'un, un soir l'autre. Notre [routine skincare](/blog/routine-skincare) donne l'ordre complet.",
        "Rougeurs qui brûlent, plaques qui démangent, peau qui pèle encore après un mois : arrête et demande conseil à ton pharmacien ou à un dermatologue.",
        "Enceinte, en train d'allaiter ou en projet de grossesse : la vitamine A en excès est liée à un risque de malformations du bébé. Parles-en à ton médecin, à ta sage-femme ou à ton pharmacien avant d'utiliser un rétinol.",
      ],
    },
    {
      type: "p",
      texte:
        "Ta peau ne supporte décidément pas le rétinol ? Le [bakuchiol](/blog/bakuchiol) est une alternative plus douce, avec une preuve plus mince. Et la [niacinamide](/blog/niacinamide), douce et bien étudiée, se marie sans souci avec lui.",
    },
    {
      type: "p",
      texte:
        "Le meilleur pour la fin : regarde le flacon. Le rétinol se dégrade à la lumière et à l'air. ==Un tube opaque ou une pompe protège mieux ton actif qu'un pot qu'on ouvre tous les soirs.== Et un rétinol bien conservé, appliqué deux soirs par semaine, fera plus qu'un sérum à 1 % qui finit au fond du placard parce qu'il a brûlé.",
    },
  ],
  faq: [
    {
      question: "Quand appliquer le rétinol, le matin ou le soir ?",
      reponse:
        "Le soir. La lumière dégrade le rétinol, et il peut rendre la peau plus sensible au soleil. Applique-le sur une peau propre et sèche, après le nettoyage, puis mets ta crème hydratante. Le lendemain matin, une crème solaire est indispensable, même en hiver.",
    },
    {
      question: "Peut-on utiliser le rétinol en été ?",
      reponse:
        "Oui, à condition de l'appliquer seulement le soir et de mettre une crème solaire chaque matin, en renouvelant l'application si tu restes dehors. Si tu pars plusieurs jours au soleil, à la plage ou en altitude, tu peux faire une pause : le rétinol reprendra là où tu l'as laissé.",
    },
    {
      question: "Rétinol ou rétinal : quelle différence ?",
      reponse:
        "Le rétinal (ou rétinaldéhyde) est l'étape suivante du rétinol dans la peau : il lui reste une seule transformation pour devenir de l'acide rétinoïque, la forme active. Il agit donc un peu plus vite et, selon les formules, il peut piquer un peu plus. Pour un premier essai, un rétinol doux reste le choix le plus simple.",
    },
    {
      question: "Peut-on acheter du rétinol en pharmacie sans ordonnance ?",
      reponse:
        "Oui. Les crèmes et sérums au rétinol sont des cosmétiques, vendus librement en pharmacie, en parapharmacie et en magasin, dans la limite de 0,3 % en Europe. Seul l'acide rétinoïque (trétinoïne) est un médicament délivré sur ordonnance. En cas de doute sur ta peau, demande conseil au pharmacien.",
    },
  ],
  notes: [
    {
      produit: "Laboratoire SVR, Ampoule [A] Lift (30 ml)",
      ean: "3662361005000",
      note: 16.52,
      releveeLe: "2026-10-31",
    },
    {
      produit: "The Ordinary, Retinol Serum 1% in Squalane",
      ean: "0769915194043",
      note: 12.17,
      releveeLe: "2026-10-31",
    },
    {
      produit: "CeraVe, Sérum au rétinol resurfaçant (30 ml)",
      ean: "3606000512276",
      note: 12.07,
      releveeLe: "2026-10-31",
    },
    {
      produit: "Neutrogena, Retinol Boost+ Sérum de Nuit Intense",
      ean: "3574661780511",
      note: 11.76,
      releveeLe: "2026-10-31",
    },
    {
      produit: "La Roche-Posay, Retinol B3 Sérum Concentré Anti-rides (10 ml)",
      ean: "3337875912419",
      note: 11.6,
      releveeLe: "2026-10-31",
    },
    {
      produit: "L'Oréal Paris, Revitalift Laser Pure Retinol Sérum de Nuit (30 ml)",
      ean: "3600523972036",
      note: 11.56,
      releveeLe: "2026-10-31",
    },
    {
      produit: "Neutrogena, Crème de Jour Retinol Boost SPF 15 (50 ml)",
      ean: "3574661760414",
      note: 1.13,
      releveeLe: "2026-10-31",
    },
    {
      produit: "La Roche-Posay, Redermic R Corrective UV SPF 30",
      ean: "3337875517614",
      note: 1.08,
      releveeLe: "2026-10-31",
    },
  ],
};

export default article;
