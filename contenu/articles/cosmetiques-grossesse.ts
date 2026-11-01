import type { Article } from "@/contenu/articles";

/**
 * Publié le 01/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « Cosme Check pratique » (`analyse-composition-cosmetique` sortait de la
 * fenêtre des dix derniers) : « cosmétique grossesse », « cosmétique femme
 * enceinte », « produits de beauté femme enceinte » et deux variantes pèsent
 * 100 à 1 k recherches par mois chacune (`docs/seo/VOLUMES.md`, 25/10/2026).
 * Les premiers résultats sont des boutiques en ligne, des blogs générés et
 * l'INSPQ : aucun ne lit les listes. Les 368 produits et leurs parts viennent
 * de `cosme_check.catalog_export` (produits actifs des rubriques « soin
 * anti-vergetures » et « soin de grossesse », avec une liste INCI, relevé du
 * 01/11/2026) ; les notes citées sont déclarées dans `notes`. Les huiles
 * essentielles sont repérées par leur nom INCI (genre botanique connu suivi
 * de « leaf », « peel », « flower »… « oil ») : un minimum, pas un compte exact.
 */
const article: Article = {
  slug: "cosmetiques-grossesse",
  titre: "Grossesse : arrête de tout jeter, voici les 4 ingrédients à vérifier dans ta salle de bain",
  titreSeo: "Cosmétique grossesse : les ingrédients à éviter",
  resume:
    "Cosmétiques et grossesse : les 4 ingrédients à vérifier (rétinol, huiles essentielles, acide salicylique, parfum) et ce qu'on lit dans 368 soins de grossesse.",
  chapo:
    "Pendant la grossesse, la plupart des cosmétiques restent utilisables : il suffit de repérer quatre familles d'ingrédients, les rétinoïdes (la vitamine A), les huiles essentielles, l'acide salicylique à forte dose et le parfum. Et méfie-toi du rayon « maternité » : sur 368 soins de grossesse et anti-vergetures de notre base, ++6 sur 10 contiennent du parfum ou une huile essentielle++.",
  publieLe: "2026-11-01",
  modifieLe: "2026-11-01",
  minutes: 7,
  theme: "cosmétique grossesse",
  motsCles: [
    "cosmétique grossesse",
    "cosmétique femme enceinte",
    "produits de beauté femme enceinte",
    "cosmetique interdit grossesse",
    "cosmetique compatible grossesse",
    "rétinol enceinte",
    "huile essentielle enceinte",
    "crème vergetures grossesse",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/cosmetiques-grossesse.webp",
    alt: "Une personne enceinte assise dans un fauteuil en bois, en robe bleu marine à fleurs, les deux mains posées sur son ventre arrondi.",
    largeur: 1200,
    hauteur: 800,
    position: "50% 45%",
    credit: "Alabama Extension, via Wikimedia Commons",
    licence: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:Baby_Bump_-_52272333068.jpg",
  },
  blocs: [
    { type: "h2", texte: "Faut-il changer tous ses cosmétiques pendant la grossesse ?" },
    {
      type: "p",
      texte:
        "Non. Ta crème hydratante, ton gel douche et ton maquillage peuvent rester. L'Institut national de santé publique du Québec le dit simplement : les crèmes pour le visage, les mains ou le corps sans ingrédient médicamenteux ne posent pas de problème ([INSPQ, mis à jour en 2026](https://www.inspq.qc.ca/mieux-vivre/grossesse/sante-securite/precautions/soins-personnels)). Même chose pour les colorations de cheveux.",
    },
    {
      type: "p",
      texte:
        "Ce qui compte, c'est de lire la liste INCI, la liste officielle des ingrédients écrite au dos, du plus dosé au moins dosé. Quatre familles méritent un coup d'œil. Le reste peut attendre.",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "Moins de produits, des listes plus courtes, et un avis de ta sage-femme, de ton médecin ou de ton pharmacien pour tout ce qui contient un actif fort. ==Pas besoin de vider ta salle de bain.==",
    },

    { type: "h2", texte: "Pourquoi mettre la vitamine A de côté pendant la grossesse ?" },
    {
      type: "p",
      texte:
        "Le rétinol, c'est une forme de vitamine A. Prise en excès par la bouche, la vitamine A est liée à des malformations du bébé. Sur la peau, le passage dans le sang est faible, mais personne ne peut dire qu'il est nul. Par précaution, l'ANSM (l'agence française du médicament) a contre-indiqué en 2018 les rétinoïdes sur ordonnance appliqués sur la peau, chez les femmes enceintes ou qui veulent un enfant ([ANSM, 2018](https://ansm.sante.fr/actualites/nouvelle-contre-indication-pendant-la-grossesse-pour-les-retinoides-utilises-par-voie-cutanee-dans-le-traitement-de-lacne)).",
    },
    {
      type: "p",
      texte:
        "Les cosmétiques sont beaucoup moins dosés. Mais depuis novembre 2025, ceux qui contiennent du rétinol ou ses cousins portent la mention « Contient de la vitamine A » ([règlement (UE) 2024/996](https://eur-lex.europa.eu/eli/reg/2024/996/oj)). C'est le signal à repérer. Les noms INCI à chercher :",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "[Retinol](/i/retinol), le plus connu ([notre guide du rétinol](/blog/retinol)).",
        "[Retinyl Palmitate](/i/retinyl-palmitate) et Retinyl Acetate, des formes plus douces mais de la vitamine A quand même.",
        "Retinal, et [Hydroxypinacolone Retinoate](/i/hydroxypinacolone-retinoate), vendu comme « rétinoïde nouvelle génération » (un dérivé de la vitamine A).",
      ],
    },
    {
      type: "p",
      texte:
        "Tu cherches un remplaçant ? Le [bakuchiol](/blog/bakuchiol) est souvent présenté comme l'alternative, mais on n'a aucune donnée chez la femme enceinte. La [niacinamide](/blog/niacinamide), c'est la vitamine B3 : la piste la plus simple à discuter avec ton pharmacien.",
    },

    { type: "h2", texte: "Les huiles essentielles sont-elles dangereuses enceinte ?" },
    {
      type: "p",
      texte:
        "Elles sont déconseillées. L'Anses (l'agence française de sécurité sanitaire) écrit noir sur blanc que les huiles essentielles sont déconseillées aux femmes enceintes et aux enfants. Avant de s'en servir, elle conseille de demander l'avis d'un professionnel de santé ([Anses, 2024](https://www.anses.fr/fr/article/huiles-essentielles-risques-precautions)). Certaines contiennent des molécules qui agissent sur le système nerveux, comme le [camphre](/i/camphor).",
    },
    {
      type: "p",
      texte:
        "Le piège, c'est qu'elles se cachent sous leur nom latin. *Lavandula Angustifolia Oil*, c'est la lavande. *Citrus Aurantium Dulcis Peel Oil*, l'orange douce. *Rosmarinus Officinalis Leaf Oil*, le romarin. Dans une liste, une huile essentielle s'écrit avec le nom latin d'une plante aromatique suivi de *Oil*, souvent avec la partie utilisée : *Leaf Oil* pour la feuille, *Peel Oil* pour l'écorce d'un agrume. Ne confonds pas avec les huiles végétales (*Seed Oil*, *Kernel Oil*), comme l'amande douce ou le jojoba : elles ne posent pas ce problème.",
    },

    { type: "h2", texte: "Et l'acide salicylique ?" },
    {
      type: "p",
      texte:
        "L'[acide salicylique](/i/salicylic-acid), c'est le BHA, l'exfoliant des produits contre les boutons et les points noirs. En Europe, il est classé comme substance suspectée d'être toxique pour la reproduction. Il reste autorisé dans les cosmétiques, à 2 % au plus dans la plupart des produits. Le SCCS (le comité d'experts qui conseille la Commission européenne) l'a jugé sûr à ces doses en 2018 ([règlement (UE) 2019/1966](https://eur-lex.europa.eu/eli/reg/2019/1966/oj)).",
    },
    {
      type: "p",
      texte:
        "En pratique, un nettoyant qu'on rince en trente secondes expose peu. Un sérum laissé toute la nuit, ou un peeling, c'est autre chose. Pour ceux-là, demande à ton pharmacien avant de continuer.",
    },
    {
      type: "cta",
      texte:
        "**Un doute sur un produit de ta trousse ?** Scanne-le avec Cosme Check : tu vois en dix secondes s'il contient du rétinol, une huile essentielle ou du parfum, ingrédient par ingrédient.",
    },

    { type: "h2", texte: "Que contiennent les crèmes de grossesse ?" },
    {
      type: "p",
      texte:
        "On a lu les ==368 soins de grossesse et anti-vergetures== de notre base : crèmes et huiles pour le ventre, baumes d'allaitement, huiles pour le périnée. Voici ce qu'on y a trouvé.",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Produits avec du [parfum](/i/parfum).", "199, soit 54 %."],
        ["Produits avec au moins une huile essentielle repérable.", "51, soit 14 %."],
        ["Produits avec du parfum ou une huile essentielle.", "226, soit 61 %."],
        ["Soins anti-vergetures parfumés.", "152 sur 226, soit 67 %."],
        ["Produits avec un allergène à déclarer (comme le [linalool](/i/linalool) ou le [limonene](/i/limonene)).", "101, soit 27 %."],
        ["Produits avec de la vitamine A (rétinol ou dérivé).", "9, soit 2,4 %."],
      ],
      legende: "Base Cosme Check, produits actifs, relevé du 01/11/2026.",
    },
    {
      type: "p",
      texte:
        "Le parfum ne fait pas de mal au bébé. Mais pendant la grossesse, beaucoup de personnes supportent moins bien les odeurs, et la peau du ventre qui s'étire peut devenir plus réactive. Un soin sans parfum, c'est un risque d'irritation en moins.",
    },

    { type: "h2", texte: "Quelle crème anti-vergetures choisir ?" },
    {
      type: "p",
      texte:
        "Commençons par la vérité qui fâche : aucune crème n'a prouvé qu'elle empêche les vergetures. La revue Cochrane, qui rassemble les meilleures études, n'a trouvé aucune preuve solide pour les produits testés ([Brennan et al., Cochrane, 2012](https://doi.org/10.1002/14651858.CD000066.pub2)). Masser son ventre avec une crème ou une huile reste agréable et garde la peau souple. Alors autant choisir une liste simple.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Parfum", "Vitamine A", "Note Cosme Check"],
      lignes: [
        ["Mustela, Maternité Huile Vergetures sans Parfum (4 ingrédients).", "non.", "non.", "20 sur 20."],
        ["Bio-Oil, Huile de Soin Naturelle (16 ingrédients).", "non.", "non.", "16,53 sur 20."],
        ["Mustela, Crème Vergetures Action 3 en 1 (27 ingrédients).", "oui, 17e.", "non.", "16,51 sur 20."],
        ["Lierac, Phytolastil Le Gel Prévention Vergetures (11 ingrédients).", "non.", "non.", "16,01 sur 20."],
        ["Nivea, Luminous 630 Crème Corps Anti-vergetures (22 ingrédients).", "oui, 22e.", "non.", "12,28 sur 20."],
        ["Bio-Oil, Soin de la Peau, l'huile classique (27 ingrédients).", "oui, 15e.", "oui, 5e.", "11,6 sur 20."],
        ["Palmer's, Lotion intensive anti-vergetures Q10 (31 ingrédients).", "oui, 10e.", "non.", "7,89 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 01/11/2026.",
    },
    {
      type: "p",
      texte:
        "La ligne qui surprend, c'est l'huile Bio-Oil classique, la plus connue du rayon. Sa liste place le [Retinyl Palmitate](/i/retinyl-palmitate), une forme de vitamine A, en 5e position. Rien n'interdit de l'utiliser, mais c'est exactement la question à poser à ta sage-femme. La même marque vend une version « Naturelle », sans vitamine A ni parfum, notée 16,53.",
    },

    { type: "h2", texte: "Comment faire le tri dans sa trousse en 10 minutes ?" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Sors tous les produits que tu laisses sur la peau : sérums, crèmes, huiles, contour des yeux. Les produits rincés passent après.",
        "Retourne chaque produit et cherche la mention « Contient de la vitamine A », puis les noms en *Retin-* dans la liste.",
        "Cherche les plantes aromatiques suivies de *Oil* (lavande, agrumes, romarin, menthe, eucalyptus) : ce sont des huiles essentielles.",
        "Mets de côté les sérums et peelings à l'acide salicylique, à montrer à ton pharmacien.",
        "Garde le reste. Pour lire une liste sans t'y perdre, suis notre [méthode d'analyse de composition](/blog/analyse-composition-cosmetique).",
      ],
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Une crème solaire chaque matin : l'INSPQ la conseille aussi pour limiter les taches brunes qui apparaissent sur le visage pendant la grossesse ([les 7 erreurs avec le SPF](/blog/spf-50-visage-7-erreurs)).",
        "Une crème hydratante simple si ta peau tiraille ([notre article sur la peau sèche](/blog/peau-seche-visage)).",
        "Épilation au laser et électrolyse : à remettre après la grossesse, par précaution selon l'INSPQ.",
      ],
    },
    {
      type: "p",
      texte:
        "Le meilleur geste pour la fin : ==demande à ton pharmacien de regarder ta trousse avec toi==. Une rougeur qui ne passe pas, une démangeaison forte ou une réaction à un produit, c'est aussi pour lui, ta sage-femme ou ton médecin. Et dans Cosme Check, le Beauty Advisor répond à la question « quels actifs éviter enceinte ? » à partir de ta propre routine. Il ne remplace pas leur avis, il t'aide à préparer la question.",
    },
  ],
  faq: [
    {
      question: "Quels cosmétiques pendant la grossesse ?",
      reponse:
        "La plupart des cosmétiques restent utilisables : crème hydratante, gel douche, maquillage, coloration. Vérifie surtout quatre familles d'ingrédients : les rétinoïdes (rétinol, retinyl palmitate), les huiles essentielles, l'acide salicylique dans un soin qui reste sur la peau, et le parfum si ta peau réagit. En cas de doute, montre la liste à ton pharmacien.",
    },
    {
      question: "Rétinol enceinte : quel danger ?",
      reponse:
        "La vitamine A en excès est liée à des malformations du bébé. Le passage du rétinol à travers la peau est faible, mais on ne peut pas l'exclure : l'ANSM contre-indique depuis 2018 les rétinoïdes sur ordonnance appliqués sur la peau pendant la grossesse. Par précaution, mets ton rétinol de côté et parles-en à ton médecin.",
    },
    {
      question: "Huile essentielle enceinte : et la lavande ?",
      reponse:
        "L'Anses déconseille les huiles essentielles aux femmes enceintes, sans exception pour la lavande. Dans un cosmétique, elle s'écrit *Lavandula Angustifolia Oil*. Une trace dans un gel douche rincé expose peu, mais un soin ou une huile de massage qui en contient se discute avec ta sage-femme ou ton pharmacien avant usage.",
    },
    {
      question: "Nettoyant à l'acide salicylique enceinte : c'est possible ?",
      reponse:
        "Un nettoyant qu'on rince vite expose beaucoup moins qu'un sérum laissé sur la peau. L'acide salicylique est autorisé jusqu'à 2 % dans les cosmétiques européens, mais il est classé substance suspectée pour la reproduction. Le plus simple : montre le flacon à ton pharmacien, qui te dira si tu peux le garder.",
    },
  ],
  notes: [
    {
      produit: "Mustela, Maternité Huile Vergetures sans Parfum (105 ml)",
      ean: "3504105033873",
      note: 20,
      releveeLe: "2026-11-01",
    },
    {
      produit: "Bio-Oil, Huile de Soin Naturelle, cicatrices et vergetures",
      ean: "6001159125341",
      note: 16.53,
      releveeLe: "2026-11-01",
    },
    {
      produit: "Mustela, Crème Vergetures Action 3 en 1 (150 ml)",
      ean: "3504105033835",
      note: 16.51,
      releveeLe: "2026-11-01",
    },
    {
      produit: "Lierac, Phytolastil Le Gel Prévention Vergetures (200 ml)",
      ean: "3701436917616",
      note: 16.01,
      releveeLe: "2026-11-01",
    },
    {
      produit: "Nivea, Luminous 630 Crème Corps Anti-vergetures et Taches (200 ml)",
      ean: "4006000043692",
      note: 12.28,
      releveeLe: "2026-11-01",
    },
    {
      produit: "Bio-Oil, Soin de la Peau (cicatrices et vergetures)",
      ean: "6001159116318",
      note: 11.6,
      releveeLe: "2026-11-01",
    },
    {
      produit: "Palmer's, Lotion intensive anti-vergetures au Q10",
      ean: "0010181041242",
      note: 7.89,
      releveeLe: "2026-11-01",
    },
  ],
};

export default article;
