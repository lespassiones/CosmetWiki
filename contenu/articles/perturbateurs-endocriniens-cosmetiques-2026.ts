import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/perturbateurs-endocriniens-cosmetiques-2026/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
 */
const article: Article = {
  slug: "perturbateurs-endocriniens-cosmetiques-2026",
  titre: "Perturbateurs endocriniens dans les cosmétiques : ce qu'il faut vraiment surveiller en 2026",
  titreSeo: "Perturbateurs endocriniens cosmétiques en 2026",
  resume:
    "Les perturbateurs endocriniens font peur. Lesquels surveiller vraiment dans tes cosmétiques en 2026, et comment les repérer sans tomber dans la psychose.",
  chapo:
    "Les perturbateurs endocriniens font peur, parfois pour de bonnes raisons. Mais toutes les molécules pointées du doigt ++n'ont pas le même niveau de preuve++, et l'Europe en a déjà interdit ==plus de 1 700==. Voici ce qu'il faut vraiment surveiller en 2026, sans psychose et sans angle mort.",
  publieLe: "2026-05-16",
  modifieLe: "2026-05-16",
  minutes: 5,
  theme: "perturbateur endocrinien cosmétique",
  motsCles: [
    "perturbateur endocrinien",
    "cosmétique sans perturbateur endocrinien",
    "parabène perturbateur endocrinien",
    "liste perturbateurs endocriniens cosmétiques",
    "réglementation européenne perturbateur endocrinien",
    "perturbateur endocrinien grossesse cosmétique",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/perturbateurs-endocriniens/hero.webp",
    alt: "Une femme en peignoir lit l'étiquette d'un flacon de soin dans sa salle de bains, d'autres produits posés devant elle.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "1. C'est quoi, un perturbateur endocrinien ?" },
    {
      type: "p",
      texte: "Une substance qui **interfère avec le système hormonal**. Trois grands mécanismes :",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Mimétisme** : la molécule imite une hormone et active ses récepteurs à sa place (ex. xénoestrogènes qui imitent les œstrogènes).",
        "**Blocage** : elle occupe le récepteur sans l'activer. *La fausse clé qui bouche la serrure* pour la vraie clé.",
        "**Perturbation de synthèse** : production, transport ou élimination des hormones modifiés.",
      ],
    },
    {
      type: "encadre",
      ton: "indigo",
      titre: "À retenir",
      texte:
        "Pour une reconnaissance **officielle** par l'EFSA et l'ECHA, ==3 critères cumulatifs== sont exigés : mode d'action, effet néfaste, lien de cause à effet (critères fixés en 2018, voir la [page de l'EFSA sur les perturbateurs endocriniens](https://www.efsa.europa.eu/fr/topics/endocrine-disruptors)). Cette définition stricte explique pourquoi beaucoup de molécules restent au statut « suspectées ».",
    },

    { type: "h2", texte: "2. Pourquoi la cosmétique compte" },
    {
      type: "p",
      texte:
        "L'alimentation reste la voie principale d'exposition. Mais la cosmétique est **secondaire mais durable** : répétée, quotidienne, et facile à maîtriser.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Une femme adulte utilise en moyenne ==12 produits par jour==, soit plus de 100 substances différentes.",
        "Certaines molécules **pénètrent la peau** et se retrouvent dans le sang et l'urine.",
        "L'**effet cocktail** : l'évaluation se fait molécule par molécule, mais l'exposition réelle est multi-substances.",
        "Plusieurs voies d'entrée : peau, muqueuses, inhalation (sprays, parfums).",
      ],
    },
    {
      type: "image",
      src: "/image/blog/perturbateurs-endocriniens/image1.webp",
      alt: "Femme appliquant sa routine de soins du visage, illustrant l'exposition quotidienne et répétée aux ingrédients cosmétiques",
      largeur: 1915,
      hauteur: 821,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "3. Les substances à surveiller" },
    {
      type: "p",
      texte:
        "Les molécules les plus citées, classées par **niveau de preuve**. Cette classification reflète le consensus actuel de l'ANSES, l'EFSA et l'ECHA.",
    },
    { type: "h3", texte: "Niveau 1 : effet prouvé" },
    {
      type: "fiche",
      titre: "Parabènes à longue chaîne",
      inci: "Butylparaben, Propylparaben, Isobutylparaben, Isopropylparaben",
      niveau: "prouve",
      effet:
        "Activité œstrogénique démontrée in vitro et in vivo. Les parabènes courte chaîne (Methylparaben, Ethylparaben) sont considérés plus sûrs.",
      statut:
        "Max 0,14 % en EU (somme des esters) depuis 2015. Interdits dans les produits sans rinçage pour enfants de moins de 3 ans.",
    },
    {
      type: "fiche",
      titre: "Triclosan",
      inci: "Triclosan",
      niveau: "prouve",
      effet: "Antibactérien. Perturbation thyroïdienne chez l'animal, soupçon d'antibiorésistance.",
      statut:
        "Interdit dans la majorité des cosmétiques EU depuis 2014. Autorisé uniquement en dentifrice à 0,3 % max.",
    },
    { type: "h3", texte: "Niveau 2 : effet suspecté" },
    {
      type: "fiche",
      titre: "Benzophénone-3 (Oxybenzone)",
      inci: "Benzophenone-3, Oxybenzone, BP-3",
      niveau: "suspecte",
      effet:
        "Filtre UV chimique. Activité œstrogénique chez l'animal, retrouvée dans le sang/urine après application cutanée.",
      statut: "Max 6 % en filtre solaire EU. Interdite à Hawaï pour impact sur les coraux.",
    },
    {
      type: "fiche",
      titre: "Octocrylène",
      inci: "Octocrylene",
      niveau: "suspecte",
      effet:
        "Filtre UV répandu. Peut se dégrader en benzophénone (cancérogène possible) avec le temps et la chaleur.",
      statut: "Autorisé jusqu'à 10 % en EU. Éviter les produits anciens.",
    },
    {
      type: "fiche",
      titre: "Siloxanes cycliques (D4, D5)",
      inci: "Cyclotetrasiloxane (D4), Cyclopentasiloxane (D5)",
      niveau: "suspecte",
      effet:
        "Silicones utilisés pour la texture (toucher poudré). Suspectés perturbateurs chez l'animal, bioaccumulation environnementale.",
      statut: "D4 restreint à 0,1 % dans les produits rincés en EU depuis 2020. D5 sous surveillance.",
    },
    { type: "h3", texte: "Niveau 3 : données incertaines" },
    {
      type: "fiche",
      titre: "Phtalates",
      inci: "DEHP, DBP, BBP (interdits), DEP (autorisé)",
      niveau: "incertain",
      effet:
        "Activité anti-androgénique chez l'animal. Le DEP reste autorisé et peut se cacher derrière « Fragrance/Parfum » dans l'INCI.",
      statut:
        "Phtalates lourds interdits depuis 2009 en EU. Vigilance sur le DEP : préférer les produits sans parfum.",
    },
    {
      type: "fiche",
      titre: "Bisphénols (BPA, BPS)",
      inci: "Pas dans la formule, mais migration possible depuis l'emballage",
      niveau: "incertain",
      effet: "Activité œstrogénique documentée. Voie d'exposition mineure vs alimentation.",
      statut:
        "BPA interdit dans les biberons EU depuis 2011, dans les contenants alimentaires depuis 2024. Préférer le verre ou les plastiques « BPA-free ».",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "Le bon réflexe",
      texte:
        "La **grande majorité** des substances dangereuses connues sont ==déjà interdites ou strictement encadrées== en Europe. L'attention se concentre désormais sur les substances en cours de réévaluation et l'effet cocktail.",
    },

    { type: "h2", texte: "4. La réglementation européenne" },
    {
      type: "p",
      texte:
        "Le règlement **1223/2009** (adopté en 2009, [présenté avec ses annexes et leurs modifications par la Commission européenne](https://single-market-economy.ec.europa.eu/sectors/cosmetics/legislation_en)) est l'un des plus protecteurs au monde. Il fonctionne par annexes :",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Annexe II** : 1 700+ substances interdites.",
        "**Annexe III** : substances réglementées (dose max, conditions d'usage).",
        "**Annexes V & VI** : conservateurs et filtres UV autorisés (listes positives, tout le reste est interdit).",
      ],
    },
    {
      type: "tableau",
      entetes: ["Marché", "Substances interdites en cosmétique"],
      lignes: [
        ["**Union européenne**", "==1 700+=="],
        ["**États-Unis (FDA)**", "~11"],
      ],
    },
    {
      type: "p",
      texte:
        "Depuis **2023**, la Commission accélère la réévaluation des filtres UV anciens et de plusieurs conservateurs. Cosme Check s'appuie sur cette base et l'actualise au fil des décisions.",
    },

    { type: "h2", texte: "5. Les populations prioritaires" },
    {
      type: "p",
      texte:
        "Pour ces trois populations, la **règle du minimum** (moins de produits, plus simples, sans parfum) est plus pertinente que pour la population générale.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "**Priorité 1 : femmes enceintes.** Le placenta n'est pas une barrière imperméable. Fenêtres de vulnérabilité fœtale précises (organogenèse, neuro).",
        "**Priorité 2 : nourrissons (0-3 ans).** Peau plus perméable, foie immature, rapport surface / poids élevé. C'est pourquoi les produits « bébé » ont un cahier des charges plus strict.",
        "**Priorité 3 : ados en puberté.** Système hormonal en pleine recomposition. Éviter les déodorants et parfums chargés, limiter le maquillage quotidien.",
      ],
    },
    {
      type: "image",
      src: "/image/blog/perturbateurs-endocriniens/image2.webp",
      alt: "Femme enceinte examinant la composition d'un produit cosmétique, illustration de la vigilance pendant la grossesse",
      largeur: 1915,
      hauteur: 821,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "6. Identifier ces substances en 3 étapes" },
    {
      type: "p",
      texte:
        "Pas besoin d'être chimiste. Trois réflexes simples couvrent ==80 % des produits problématiques==.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "**Préférer les listes INCI courtes** (10-20 ingrédients > 40 ingrédients).",
        "**Repérer les noms-clés** : Butylparaben, Propylparaben, Benzophenone-3, Oxybenzone, Triclosan, Fragrance / Parfum, Cyclopentasiloxane, Octocrylene, Homosalate.",
        "**Scanner avec Cosme Check** : note couleur ingrédient par ingrédient, alerte directe sur les perturbateurs suspectés / prouvés, alternatives proposées en 10 secondes.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Vérifie tes produits du quotidien.** Scanne la crème, le déodorant ou la protection solaire que tu utilises tous les jours. Cosme Check identifie les perturbateurs endocriniens suspectés ou prouvés selon la réglementation européenne et l'ANSES.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Reconnaissance officielle : **3 critères cumulatifs** (mode d'action, effet, lien).",
        "Cosmétique : ==12 produits/jour==, voie secondaire mais durable.",
        "**Prouvés** : parabènes longue chaîne, triclosan.",
        "**Suspectés** : benzophénone-3, octocrylène, D4 / D5.",
        "**Incertains** : phtalates (parfum), bisphénols (emballage).",
        "EU = **1 700+ interdites** vs ~11 aux USA.",
        "Vigilance prio : **enceintes, 0-3 ans, ados**.",
        "Méthode : listes courtes, mots-clés, et Cosme Check.",
      ],
    },
    {
      type: "p",
      texte:
        "L'objectif n'est pas la peur, c'est la ++vigilance ciblée++. Lire l'INCI (ou laisser Cosme Check le faire) suffit à garder un temps d'avance sans entrer en panique.",
    },
  ],
  faq: [
    {
      question: "C'est quoi un perturbateur endocrinien dans un cosmétique ?",
      reponse:
        "C'est une substance qui interfère avec le système hormonal : elle imite une hormone, bloque son récepteur ou dérègle sa production. Pour être reconnue officiellement par l'EFSA et l'ECHA, elle doit cumuler trois critères : un mode d'action, un effet néfaste et un lien de cause à effet. Beaucoup restent donc « suspectées ».",
    },
    {
      question: "Quels perturbateurs endocriniens éviter dans les cosmétiques ?",
      reponse:
        "Les effets les mieux prouvés concernent les parabènes à longue chaîne (Butylparaben, Propylparaben) et le triclosan. Sont suspectés la benzophénone-3, l'octocrylène et les siloxanes D4 et D5. Les données restent incertaines pour les phtalates, cachés derrière « Parfum », et pour les bisphénols venus de l'emballage.",
    },
    {
      question: "Les parabènes sont-ils tous des perturbateurs endocriniens ?",
      reponse:
        "Non. L'activité œstrogénique est démontrée pour les parabènes à longue chaîne (Butylparaben, Propylparaben, Isobutylparaben, Isopropylparaben), limités à 0,14 % en Europe depuis 2015 et interdits dans les produits sans rinçage pour les moins de 3 ans. Les parabènes à courte chaîne, Methylparaben et Ethylparaben, sont considérés plus sûrs.",
    },
    {
      question: "Comment repérer un perturbateur endocrinien dans la liste INCI ?",
      reponse:
        "Préfère les listes INCI courtes, de 10 à 20 ingrédients plutôt que 40. Cherche les noms-clés : Butylparaben, Propylparaben, Benzophenone-3, Oxybenzone, Triclosan, Fragrance ou Parfum, Cyclopentasiloxane, Octocrylene, Homosalate. Ou scanne le produit avec Cosme Check, qui signale les perturbateurs suspectés ou prouvés.",
    },
  ],
};

export default article;
