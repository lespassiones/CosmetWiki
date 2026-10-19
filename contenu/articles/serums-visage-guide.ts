import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/serums-visage-guide/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
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
  modifieLe: "2026-05-18",
  minutes: 4,
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
    { type: "h2", texte: "1. Pourquoi un sérum ?" },
    {
      type: "p",
      texte:
        "Un sérum est une **formule très concentrée en actifs** (souvent 3 à 10 fois plus qu'une crème), à la texture fluide qui pénètre vite. Il vient ==avant la crème== pour cibler un besoin précis : éclat, hydratation, rides...",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "Le bon réflexe",
      texte:
        "Un seul sérum bien choisi vaut mieux que trois mal combinés. On identifie son besoin n°1, puis on choisit l'actif adapté.",
    },

    { type: "h2", texte: "2. Vitamine C : pour l'éclat et les taches" },
    {
      type: "p",
      texte:
        "L'antioxydant le plus étudié en cosmétique. Il neutralise les radicaux libres causés par les UV et la pollution, et inhibe la production de mélanine responsable des taches.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Pour qui :** teint terne, taches pigmentaires, prévention anti-âge.",
        "**Quand :** ==le matin==, sous le SPF (effet synergique avec la protection UV).",
        "**Concentration efficace :** 10 à 20 % d'*L-ascorbic acid*, ou des dérivés stables (*Ascorbyl Glucoside, MAP, THD-ascorbate*) si peau sensible.",
        "**Conservation :** garder loin de la lumière, jeter si la formule vire au jaune-orange foncé.",
      ],
    },

    { type: "h2", texte: "3. Acide hyaluronique : pour l'hydratation" },
    {
      type: "p",
      texte:
        "Naturellement présent dans la peau, l'acide hyaluronique retient ==jusqu'à 1 000 fois son poids en eau==. Il regonfle la peau visiblement en quelques semaines.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Pour qui :** toutes les peaux, surtout déshydratées, tiraillements, ridules de déshydratation.",
        "**Quand :** matin et / ou soir, sur peau légèrement humide pour booster l'hydratation.",
        "**À chercher dans l'INCI :** *Sodium Hyaluronate* (la forme la mieux absorbée), ou des combinaisons de petites et grandes molécules.",
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "Astuce",
      texte:
        "Si tu vis dans un climat très sec, scelle ton sérum à l'acide hyaluronique avec une crème grasse par-dessus. Sinon, il peut puiser l'eau **de la peau elle-même**.",
    },

    { type: "h2", texte: "4. Peptides : pour l'anti-âge" },
    {
      type: "p",
      texte:
        "Les peptides sont de **petits fragments de protéines** qui envoient à la peau un signal de réparation : produire plus de collagène, raffermir, lisser. C'est l'alternative douce au rétinol.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Pour qui :** premières rides, perte de fermeté, peaux qui ne tolèrent pas le rétinol.",
        "**Quand :** ==le soir==, après nettoyage. Compatible avec presque tout.",
        "**Mots-clés INCI :** *Palmitoyl Tripeptide-1, Acetyl Hexapeptide-8 (Argireline), Copper Tripeptide-1, Matrixyl 3000*.",
        "**Patience :** 6 à 12 semaines pour voir un effet visible, contre 2 à 4 pour la vitamine C.",
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

    { type: "h2", texte: "5. Comment les combiner sans se planter" },
    { type: "p", texte: "La règle simple, validée par la majorité des dermatologues :" },
    {
      type: "tableau",
      entetes: ["Moment", "Sérum", "Pourquoi"],
      lignes: [
        ["**Matin**", "Vitamine C", "Antioxydant qui prépare aux UV"],
        ["**Matin ou soir**", "Acide hyaluronique", "Hydratation compatible avec tout"],
        ["**Soir**", "Peptides", "Réparation pendant le sommeil"],
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Vitamine C + niacinamide :** compatible en formules modernes, mais éviter de superposer deux sérums forts. Choisis l'un, pas les deux.",
        "**Vitamine C + rétinol :** jamais en même temps. Vitamine C le matin, rétinol le soir.",
        "**Peptides + acides exfoliants (AHA, BHA) :** les acides peuvent dégrader certains peptides. Alterne les soirs.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Analyse la composition de ton sérum.** Cosme Check te donne la note ingrédient par ingrédient de ton sérum, signale les actifs efficaces et les ingrédients à surveiller.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Vitamine C** = éclat et taches. ==Le matin==, sous SPF.",
        "**Acide hyaluronique** = hydratation. Matin ou soir, sur peau humide.",
        "**Peptides** = anti-âge doux. ==Le soir==, après nettoyage.",
        "Un seul sérum bien choisi > trois mal combinés.",
        "Patience : 4 à 12 semaines pour un résultat visible.",
      ],
    },
  ],
  faq: [
    {
      question: "Quand mettre un sérum à la vitamine C ?",
      reponse:
        "Le matin, sous ta protection solaire : la vitamine C est un antioxydant qui neutralise les radicaux libres causés par les UV et la pollution. Vise 10 à 20 % de *L-ascorbic acid*, ou un dérivé stable si ta peau est sensible. Jette le flacon si la formule vire au jaune-orange foncé.",
    },
    {
      question: "Comment appliquer un sérum à l'acide hyaluronique ?",
      reponse:
        "Le matin, le soir ou les deux, sur une peau légèrement humide pour booster l'hydratation. Cherche *Sodium Hyaluronate* dans la liste INCI. Si tu vis dans un climat très sec, scelle-le avec une crème grasse par-dessus : sinon, il peut puiser l'eau de la peau elle-même.",
    },
    {
      question: "Peut-on mélanger vitamine C et rétinol ?",
      reponse:
        "Jamais en même temps : vitamine C le matin, rétinol le soir. Avec la niacinamide, c'est compatible en formules modernes, mais évite de superposer deux sérums forts et choisis l'un des deux. Et alterne les soirs entre peptides et acides exfoliants (AHA, BHA), qui peuvent dégrader certains peptides.",
    },
    {
      question: "Combien de temps pour voir l'effet d'un sérum ?",
      reponse:
        "Compte 2 à 4 semaines pour la vitamine C, et 6 à 12 semaines pour les peptides. L'acide hyaluronique regonfle la peau visiblement en quelques semaines. Dans tous les cas, la patience compte, et un seul sérum bien choisi vaut mieux que trois mal combinés.",
    },
  ],
};

export default article;
