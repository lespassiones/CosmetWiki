import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/serums-visage-guide/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
 *
 * Mis au niveau le 01/11/2026 par le robot éditorial : quatrième page la plus
 * citée par Copilot (150 citations sur trois mois, Bing, « choisir sérum
 * visage sans tester », « choisir sérum anti-âge conseils »). Chiffres sans
 * source retirés, quatre études en lien, `h2` en questions, section « sans le
 * tester », liens internes. Titre de résultat inchangé.
 */
const article: Article = {
  slug: "serums-visage-guide",
  titre: "Sérums visage : vitamine C, acide hyaluronique, peptides, lequel choisir ?",
  titreSeo: "Sérum visage : lequel choisir selon ton besoin",
  resume:
    "Vitamine C, acide hyaluronique ou peptides : le guide simple pour choisir ton sérum visage selon ton besoin et les combiner sans erreur.",
  chapo:
    "Trois actifs dominent les rayons sérums : la **vitamine C**, l'**acide hyaluronique** et les **peptides**. Ils ne font ++pas la même chose++ et ne se mettent pas tous au même moment. Voici comment choisir et les combiner sans fausser leurs effets.",
  publieLe: "2026-05-18",
  modifieLe: "2026-11-01",
  minutes: 6,
  theme: "sérum visage",
  motsCles: [
    "sérum vitamine C",
    "sérum acide hyaluronique",
    "sérum peptides",
    "sérum anti-âge",
    "comment choisir un sérum",
    "ordre routine skincare sérum",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/serums/hero.webp",
    alt: "De profil devant un miroir, une femme en peignoir de satin dépose quelques gouttes de sérum sur sa joue avec une pipette, deux flacons ambrés au premier plan.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, un sérum visage ?" },
    {
      type: "p",
      texte:
        "Un sérum, c'est un soin fluide, souvent en flacon pipette, construit autour d'un ou deux actifs. Il se met ==avant la crème==, sur une peau propre, pour viser un besoin précis : l'éclat, l'hydratation ou les premières rides. La crème, elle, vient par-dessus pour nourrir et garder l'eau dans la peau.",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "Le bon réflexe",
      texte:
        "Un seul sérum bien choisi vaut mieux que trois mal combinés. Choisis ton besoin numéro un, puis l'actif qui y répond.",
    },

    { type: "h2", texte: "La vitamine C, à quoi ça sert ?" },
    {
      type: "p",
      texte:
        "La vitamine C, c'est un antioxydant : elle aide la peau à se défendre contre les dégâts du soleil et de la pollution, et elle freine la fabrication des taches brunes. C'est l'un des actifs les plus étudiés en cosmétique ([Telang, *Indian Dermatology Online Journal*, 2013](https://doi.org/10.4103/2229-5178.110593)).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Pour qui :** teint terne, petites taches, envie de prévenir.",
        "**Quand :** ==le matin==, sous la crème solaire. Les deux se complètent.",
        "**Dans la liste INCI** (la liste officielle des ingrédients, au dos) : [Ascorbic Acid](/i/ascorbic-acid), la forme pure, ou des formes plus stables et plus douces comme l'[Ascorbyl Glucoside](/i/ascorbyl-glucoside).",
        "**Le bon dosage :** pour la forme pure, une étude sur la peau a trouvé le meilleur passage jusqu'à 20 %, avec un produit très acide ; au-delà, pas de gain ([Pinnell et al., *Dermatologic Surgery*, 2001](https://doi.org/10.1046/j.1524-4725.2001.00264.x)).",
        "**Conservation :** à l'abri de la lumière. Si le sérum vire au jaune orangé foncé, la vitamine C s'est abîmée.",
      ],
    },

    { type: "h2", texte: "L'acide hyaluronique, est-ce qu'il hydrate vraiment ?" },
    {
      type: "p",
      texte:
        "Oui. L'acide hyaluronique, c'est une molécule que la peau fabrique elle-même pour retenir l'eau. Il y en a de moins en moins avec l'âge ([Papakonstantinou et al., *Dermato-Endocrinology*, 2012](https://doi.org/10.4161/derm.21923)). En sérum, il agit surtout en surface : il attire l'eau et donne une peau plus souple et plus rebondie, tant qu'on en met.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Pour qui :** toutes les peaux, surtout celles qui tiraillent.",
        "**Quand :** matin ou soir, sur une peau encore un peu humide.",
        "**Dans la liste INCI :** [Sodium Hyaluronate](/i/sodium-hyaluronate), la forme la plus courante.",
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "Astuce",
      texte:
        "Dans un air très sec (le chauffage en hiver, le froid de Montréal), mets toujours une crème par-dessus ton acide hyaluronique. Elle garde l'eau qu'il a attirée. Si ta peau tiraille déjà, lis aussi [notre article sur la peau sèche](/blog/peau-seche-visage).",
    },

    { type: "h2", texte: "Les peptides, pour qui ?" },
    {
      type: "p",
      texte:
        "Les peptides, ce sont de petits morceaux de protéines. Certains envoient à la peau le signal de fabriquer plus de collagène, la protéine qui la rend ferme. Les études existent, mais elles sont souvent petites et faites par les fabricants : l'effet est réel mais modeste ([Gorouhi et Maibach, *International Journal of Cosmetic Science*, 2009](https://doi.org/10.1111/j.1468-2494.2009.00490.x)).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Pour qui :** premières rides, peaux qui ne supportent pas le [rétinol](/blog/retinol) (la vitamine A des crèmes anti-âge, mieux prouvée mais plus irritante).",
        "**Quand :** le soir, après le nettoyage. Ils s'entendent avec presque tout.",
        "**Dans la liste INCI :** [Palmitoyl Tripeptide-1](/i/palmitoyl-tripeptide-1), [Acetyl Hexapeptide-8](/i/acetyl-hexapeptide-8) (vendu sous le nom Argireline), Copper Tripeptide-1.",
        "**Patience :** comme pour tout anti-âge, compte plusieurs semaines avant de juger.",
      ],
    },
    {
      type: "image",
      src: "/image/blog/serums/image1.webp",
      alt: "Application d'un sérum visage avec pipette en verre, illustration d'une routine skincare",
      largeur: 1915,
      hauteur: 821,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "Comment choisir un sérum sans le tester ?" },
    {
      type: "p",
      texte:
        "Retourne le flacon. Les ingrédients sont écrits du plus dosé au moins dosé. Trois choses à regarder en dix secondes :",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "L'actif promis sur le devant est-il dans la première moitié de la liste ? S'il arrive après le parfum, il est sans doute très peu dosé.",
        "Y a-t-il du [parfum](/i/parfum) (*Parfum* ou *Fragrance*) ? Dans notre base, ==59,9 % des 15 903 sérums visage en contiennent== (relevé du 27/10/2026). Pour une peau qui réagit, c'est souvent la première chose à éviter.",
        "Combien d'actifs forts à la fois ? Un sérum qui mélange vitamine C, rétinol et acide exfoliant (un acide qui décolle les cellules mortes) pique plus qu'il n'aide.",
      ],
    },
    {
      type: "p",
      texte:
        "Pour aller plus loin, notre [méthode d'analyse de composition](/blog/analyse-composition-cosmetique) détaille les cinq étapes. Et les sérums à la mode passent au même crible : le [PDRN](/blog/pdrn) ou le [bakuchiol](/blog/bakuchiol).",
    },
    {
      type: "cta",
      texte:
        "**Ton sérum tient-il ses promesses ?** Scanne-le avec Cosme Check : tu vois la place de l'actif dans la liste, le parfum et la couleur de chaque ingrédient.",
    },

    { type: "h2", texte: "Comment combiner ses sérums sans se planter ?" },
    {
      type: "p",
      texte:
        "La règle simple : la vitamine C le matin, les actifs plus forts le soir, l'acide hyaluronique quand tu veux. L'ordre complet de la routine est dans notre article [routine skincare](/blog/routine-skincare).",
    },
    {
      type: "tableau",
      entetes: ["Moment", "Sérum", "Pourquoi"],
      lignes: [
        ["**Matin.**", "Vitamine C.", "Elle aide la peau face au soleil, sous la crème solaire."],
        ["**Matin ou soir.**", "Acide hyaluronique.", "Il s'entend avec tout."],
        ["**Soir.**", "Peptides ou rétinol.", "Loin de la lumière, qui abîme le rétinol."],
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Vitamine C et [niacinamide](/blog/niacinamide)** (la vitamine B3) : elles s'entendent dans les formules actuelles, mais deux sérums forts l'un sur l'autre, c'est souvent un de trop.",
        "**Vitamine C et rétinol :** pas en même temps. La vitamine C le matin, le rétinol le soir.",
        "**Peptides et acides exfoliants** (AHA comme l'acide glycolique, BHA comme l'acide salicylique) : alterne les soirs, les acides peuvent abîmer certains peptides.",
      ],
    },

    { type: "h2", texte: "Lequel choisir, en résumé ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Teint terne ou taches :** vitamine C, le matin, sous la crème solaire.",
        "**Peau qui tiraille :** acide hyaluronique, sur peau humide, avec une crème par-dessus.",
        "**Premières rides, peau sensible :** peptides, le soir.",
        "**Un seul sérum** bien choisi vaut mieux que trois mal combinés.",
        "Le meilleur geste pour la fin : ==un sérum sans parfum, appliqué tous les jours pendant deux mois, bat n'importe quel sérum miracle oublié dans un tiroir.==",
      ],
    },
  ],
  faq: [
    {
      question: "Quand mettre un sérum à la vitamine C ?",
      reponse:
        "Le matin, sur une peau propre, avant ta crème et ta protection solaire. La vitamine C est un antioxydant : elle aide la peau à se défendre contre les dégâts du soleil et de la pollution. Garde le flacon à l'abri de la lumière, et remplace-le s'il vire au jaune orangé foncé.",
    },
    {
      question: "Comment appliquer un sérum à l'acide hyaluronique ?",
      reponse:
        "Le matin, le soir ou les deux, sur une peau encore un peu humide, puis une crème par-dessus. Cherche *Sodium Hyaluronate* dans la liste INCI. Dans un air très sec, la crème est indispensable : elle garde dans la peau l'eau que l'acide hyaluronique a attirée.",
    },
    {
      question: "Peut-on mélanger vitamine C et rétinol ?",
      reponse:
        "Pas en même temps : la vitamine C le matin, le rétinol le soir. Avec la niacinamide, la vitamine C s'entend bien dans les formules actuelles, mais évite d'empiler deux sérums forts. Et alterne les soirs entre peptides et acides exfoliants (AHA, BHA), qui peuvent abîmer certains peptides.",
    },
    {
      question: "Comment choisir un sérum anti-âge ?",
      reponse:
        "Choisis un seul actif selon ta peau : le rétinol est le mieux prouvé mais irrite au début, les peptides sont plus doux et plus modestes. Vérifie que l'actif est dans la première moitié de la liste INCI et qu'il n'y a pas de parfum. Puis donne-lui plusieurs semaines, avec une crème solaire chaque matin.",
    },
  ],
};

export default article;
