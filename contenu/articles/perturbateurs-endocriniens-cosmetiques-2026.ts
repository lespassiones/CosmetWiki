import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/perturbateurs-endocriniens-cosmetiques-2026/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
 *
 * Retouché le 25/10/2026 par le robot éditorial : c'est la page du site la
 * plus citée par Copilot (309 citations sur trois mois, Bing Webmaster Tools,
 * requêtes « perturbateurs endocriniens ingrédients parfumants cosmétiques »
 * et « conservateurs maquillage irritations allergies perturbateurs
 * endocriniens »). Statuts européens corrigés et sourcés (parabènes,
 * triclosan, filtres UV, siloxanes, bisphénol A), chiffres sans source
 * retirés, section « parfum et conservateurs » ajoutée, liens internes.
 */
const article: Article = {
  slug: "perturbateurs-endocriniens-cosmetiques-2026",
  titre: "Perturbateurs endocriniens dans les cosmétiques : ce qu'il faut vraiment surveiller en 2026",
  titreSeo: "Perturbateurs endocriniens cosmétiques en 2026",
  resume:
    "Perturbateurs endocriniens dans les cosmétiques : lesquels surveiller en 2026, ce que dit la loi européenne, le cas du parfum et comment les repérer.",
  chapo:
    "Un perturbateur endocrinien, c'est une substance qui dérègle les hormones. Dans les cosmétiques, quelques-unes ont un effet prouvé, d'autres sont seulement suspectées, et ++l'Europe a déjà interdit ou limité les plus connues++. Voici ce qu'il faut vraiment surveiller en 2026, sans psychose et sans angle mort.",
  publieLe: "2026-05-16",
  modifieLe: "2026-10-25",
  minutes: 7,
  theme: "perturbateur endocrinien cosmétique",
  motsCles: [
    "perturbateur endocrinien",
    "cosmétique sans perturbateur endocrinien",
    "parabène perturbateur endocrinien",
    "liste perturbateurs endocriniens cosmétiques",
    "réglementation européenne perturbateur endocrinien",
    "perturbateur endocrinien grossesse cosmétique",
    "parfum perturbateur endocrinien",
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
    { type: "h2", texte: "C'est quoi, un perturbateur endocrinien ?" },
    {
      type: "p",
      texte:
        "C'est une substance qui **dérègle le système hormonal**. Les hormones sont les messagers chimiques du corps : elles règlent la croissance, la puberté, la fertilité. Une substance peut les gêner de trois façons :",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Elle imite une hormone** et prend sa place sur son récepteur, la « serrure » où l'hormone se fixe.",
        "**Elle bloque le récepteur** sans l'activer. *La fausse clé qui bouche la serrure* pour la vraie clé.",
        "**Elle dérègle la fabrication** des hormones, leur transport ou leur élimination.",
      ],
    },
    {
      type: "encadre",
      ton: "indigo",
      titre: "À retenir",
      texte:
        "Pour être reconnue **officiellement** par l'EFSA et l'ECHA, une substance doit cumuler ==3 critères== : un mode d'action, un effet néfaste, et un lien entre les deux. Ces critères datent de 2018 ([page de l'EFSA sur les perturbateurs endocriniens](https://www.efsa.europa.eu/fr/topics/endocrine-disruptors)). C'est pourquoi beaucoup de molécules restent « suspectées ».",
    },

    { type: "h2", texte: "Pourquoi les cosmétiques comptent-ils ?" },
    {
      type: "p",
      texte:
        "Parce qu'on les utilise tous les jours. L'alimentation reste la première source d'exposition. La cosmétique vient après, mais elle est **quotidienne**, et c'est la plus facile à choisir soi-même.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Certaines molécules **traversent la peau** et se retrouvent dans le sang et l'urine.",
        "**L'effet cocktail** : chaque molécule est évaluée seule, alors qu'on en reçoit plusieurs à la fois.",
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

    { type: "h2", texte: "Quelles substances surveiller ?" },
    {
      type: "p",
      texte:
        "Les molécules les plus citées, classées par **niveau de preuve** : prouvé, suspecté ou incertain. Chaque nom mène à sa fiche dans Cosme Check.",
    },
    { type: "h3", texte: "Niveau 1 : effet prouvé" },
    {
      type: "fiche",
      titre: "Parabènes à longue chaîne",
      inci: "Butylparaben, Propylparaben",
      niveau: "prouve",
      effet:
        "Une faible activité hormonale (ils imitent un peu les œstrogènes) est démontrée en laboratoire. Les parabènes à courte chaîne, [Methylparaben](/i/methylparaben) et Ethylparaben, en ont beaucoup moins.",
      statut:
        "[Butylparaben](/i/butylparaben) et [Propylparaben](/i/propylparaben) : 0,14 % au plus en Europe, interdits dans les soins sans rinçage pour le siège des moins de 3 ans ([règlement (UE) 1004/2014](https://eur-lex.europa.eu/eli/reg/2014/1004/oj)). [Isobutylparaben](/i/isobutylparaben), Isopropylparaben et trois autres : interdits depuis 2014 ([règlement (UE) 358/2014](https://eur-lex.europa.eu/eli/reg/2014/358/oj)).",
    },
    {
      type: "fiche",
      titre: "Triclosan",
      inci: "Triclosan",
      niveau: "prouve",
      effet: "Antibactérien. Perturbe la thyroïde chez l'animal ; on le soupçonne aussi de favoriser la résistance des bactéries.",
      statut:
        "[Triclosan](/i/triclosan) : limité depuis 2014 à quelques produits, comme les dentifrices, les savons et les déodorants non sprays. La dose maximale est de 0,3 %, et de 0,2 % dans les bains de bouche ([règlement (UE) 358/2014](https://eur-lex.europa.eu/eli/reg/2014/358/oj)).",
    },
    { type: "h3", texte: "Niveau 2 : effet suspecté" },
    {
      type: "fiche",
      titre: "Benzophénone-3 (Oxybenzone)",
      inci: "Benzophenone-3, Oxybenzone",
      niveau: "suspecte",
      effet:
        "Filtre UV. Activité hormonale chez l'animal ; on le retrouve dans le sang et l'urine après application sur la peau.",
      statut:
        "[Benzophenone-3](/i/benzophenone-3) : depuis 2023, 6 % au plus dans les produits pour le visage, les mains et les lèvres, 2,2 % dans les produits pour le corps ([règlement (UE) 2022/1176](https://eur-lex.europa.eu/eli/reg/2022/1176/oj)).",
    },
    {
      type: "fiche",
      titre: "Octocrylène",
      inci: "Octocrylene",
      niveau: "suspecte",
      effet:
        "Filtre UV très répandu. Il peut se dégrader en benzophénone avec le temps et la chaleur.",
      statut:
        "[Octocrylene](/i/octocrylene) : 10 % au plus, 9 % dans les sprays à gaz propulseur, depuis 2023 ([règlement (UE) 2022/1176](https://eur-lex.europa.eu/eli/reg/2022/1176/oj)). Ne garde pas une vieille crème solaire d'un été à l'autre.",
    },
    {
      type: "fiche",
      titre: "Siloxanes cycliques (D4, D5)",
      inci: "Cyclotetrasiloxane (D4), Cyclopentasiloxane (D5)",
      niveau: "suspecte",
      effet:
        "Des silicones qui donnent un toucher poudré. Suspectés chez l'animal, et ils s'accumulent dans l'environnement.",
      statut:
        "[Cyclotetrasiloxane](/i/cyclotetrasiloxane) et [Cyclopentasiloxane](/i/cyclopentasiloxane) : 0,1 % au plus dans les produits rincés depuis 2020 ([règlement REACH (UE) 2018/35](https://eur-lex.europa.eu/eli/reg/2018/35/oj)).",
    },
    { type: "h3", texte: "Niveau 3 : données incertaines" },
    {
      type: "fiche",
      titre: "Phtalates",
      inci: "Dibutyl Phthalate, DEHP (interdits), Diethyl Phthalate (autorisé)",
      niveau: "incertain",
      effet:
        "Effet anti-hormone mâle chez l'animal pour les phtalates lourds. Le [Diethyl Phthalate](/i/diethyl-phthalate) (DEP), lui, reste autorisé et peut se cacher derrière le mot « Parfum ».",
      statut:
        "Les phtalates lourds sont interdits dans les cosmétiques en Europe. Pour éviter le DEP, choisis des produits sans parfum.",
    },
    {
      type: "fiche",
      titre: "Bisphénol A (BPA)",
      inci: "Pas dans la formule, mais il peut migrer depuis certains emballages",
      niveau: "incertain",
      effet: "Activité œstrogénique documentée. La cosmétique pèse peu face à l'alimentation.",
      statut:
        "Interdit dans les biberons depuis 2011, puis dans les emballages au contact des aliments ([règlement (UE) 2024/3190](https://eur-lex.europa.eu/eli/reg/2024/3190/oj)).",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "Le bon réflexe",
      texte:
        "La **plupart** des substances dangereuses connues sont ==déjà interdites ou strictement limitées== en Europe. La vigilance porte désormais sur les molécules en cours de réévaluation et sur l'effet cocktail.",
    },

    { type: "h2", texte: "Et le parfum, et les conservateurs ?" },
    {
      type: "p",
      texte:
        "Le mot « Parfum » dans une liste cache souvent des dizaines de molécules, sans les nommer. La loi oblige seulement à écrire en clair les **allergènes**, ces molécules qui peuvent déclencher une allergie, comme [Limonene](/i/limonene) ou [Linalool](/i/linalool). Un allergène, ce n'est pas un perturbateur endocrinien : il irrite ou provoque une réaction, sans toucher aux hormones. Le vrai point de vigilance hormonal du parfum, c'est le DEP vu plus haut.",
    },
    {
      type: "p",
      texte:
        "Pour les conservateurs, ces ingrédients qui empêchent les microbes de pousser dans le pot, il faut séparer deux risques. Le risque hormonal concerne surtout les parabènes à longue chaîne. Le risque d'allergie, lui, a fait interdire la [Methylisothiazolinone](/i/methylisothiazolinone) dans les soins sans rinçage dès 2017 ([règlement (UE) 2016/1198](https://eur-lex.europa.eu/eli/reg/2016/1198/oj)). Le [Phenoxyethanol](/i/phenoxyethanol), très courant dans le maquillage, est limité à 1 %.",
    },

    { type: "h2", texte: "Que dit la loi européenne ?" },
    {
      type: "p",
      texte:
        "Le règlement **1223/2009** ([présenté avec ses annexes par la Commission européenne](https://single-market-economy.ec.europa.eu/sectors/cosmetics/legislation_en)) est l'un des plus protecteurs au monde. Il fonctionne par listes, appelées annexes :",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Annexe II** : plus d'un millier de substances interdites.",
        "**Annexe III** : les substances limitées (dose maximale, conditions d'usage).",
        "**Annexes V et VI** : les conservateurs et les filtres UV autorisés. Tout ce qui n'y figure pas est interdit.",
      ],
    },
    {
      type: "p",
      texte:
        "La liste bouge chaque année. Les filtres UV ont été revus en 2022, le triclosan et plusieurs actifs en 2024.",
    },

    { type: "h2", texte: "Qui doit faire le plus attention ?" },
    {
      type: "p",
      texte:
        "Pour ces trois groupes, la **règle du minimum** (moins de produits, plus simples, sans parfum) a plus de sens que pour le reste de la population.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "**Les femmes enceintes.** Le placenta laisse passer certaines substances, et le bébé se forme par étapes sensibles. Montre tes produits à ton médecin, ta sage-femme ou ton pharmacien, et méfie-toi des promesses « spécial grossesse » comme celle du [bakuchiol](/blog/bakuchiol).",
        "**Les bébés de 0 à 3 ans.** Leur peau laisse mieux passer les substances, et leur corps les élimine moins bien.",
        "**Les ados en pleine puberté.** Leurs hormones sont en plein changement. Mieux vaut éviter les déodorants et les parfums très chargés.",
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

    { type: "h2", texte: "Comment les repérer en 3 étapes ?" },
    {
      type: "p",
      texte:
        "Pas besoin d'être chimiste. Tout se joue dans la liste INCI, c'est-à-dire la liste officielle des ingrédients écrite au dos du produit, du plus dosé au moins dosé. Voici [la méthode complète pour la lire](/blog/analyse-composition-cosmetique), en version courte :",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "**Préfère les listes courtes** : moins d'ingrédients, c'est moins de molécules à surveiller.",
        "**Repère les noms-clés** : Butylparaben, Propylparaben, Benzophenone-3, Triclosan, Parfum, Cyclopentasiloxane, Octocrylene, [Homosalate](/i/homosalate).",
        "**Scanne le produit avec Cosme Check** : chaque ingrédient a sa couleur, et l'app signale les perturbateurs endocriniens suspectés ou prouvés.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Vérifie tes produits du quotidien.** Scanne ta crème, ton déodorant ou ta crème solaire : en dix secondes, Cosme Check te montre les ingrédients suspectés.",
    },
    {
      type: "p",
      texte:
        "Pour aller plus loin, trois cas concrets : [le déodorant et les sels d'aluminium](/blog/deodorant-sels-aluminium-verite), [les crèmes solaires coréennes et leurs filtres](/blog/creme-solaire-coreenne-k-beauty), et [comment savoir si un cosmétique est bon pour ta peau](/blog/cosmetique-fait-pour-toi).",
    },

    {
      type: "p",
      texte:
        "Le but n'est pas d'avoir peur, c'est une ++vigilance ciblée++. Lire la liste (ou laisser Cosme Check le faire) suffit à garder un temps d'avance, sans panique.",
    },
  ],
  faq: [
    {
      question: "C'est quoi un perturbateur endocrinien dans un cosmétique ?",
      reponse:
        "C'est une substance qui dérègle le système hormonal : elle imite une hormone, bloque son récepteur ou gêne sa fabrication. Pour être reconnue officiellement par l'EFSA et l'ECHA, elle doit cumuler trois critères : un mode d'action, un effet néfaste et un lien entre les deux. Beaucoup restent donc « suspectées ».",
    },
    {
      question: "Quels perturbateurs endocriniens éviter dans les cosmétiques ?",
      reponse:
        "Les effets les mieux prouvés concernent les parabènes à longue chaîne (Butylparaben, Propylparaben) et le triclosan, déjà limités en Europe. Sont suspectés la benzophénone-3, l'octocrylène et les siloxanes D4 et D5. Les données restent incertaines pour les phtalates, cachés derrière « Parfum », et pour le bisphénol A venu de l'emballage.",
    },
    {
      question: "Les parabènes sont-ils tous des perturbateurs endocriniens ?",
      reponse:
        "Non. L'activité hormonale concerne surtout les parabènes à longue chaîne. Butylparaben et Propylparaben sont limités à 0,14 % en Europe ; Isobutylparaben et Isopropylparaben sont interdits depuis 2014. Les parabènes à courte chaîne, Methylparaben et Ethylparaben, ont une activité bien plus faible et restent autorisés.",
    },
    {
      question: "Le parfum contient-il des perturbateurs endocriniens ?",
      reponse:
        "Parfois. Le mot « Parfum » regroupe des dizaines de molécules sans les nommer. Le Diethyl Phthalate (DEP), un phtalate encore autorisé, peut s'y trouver, et ses effets hormonaux restent incertains. Les allergènes du parfum, eux, irritent sans toucher aux hormones. Pour réduire les deux, choisis des produits sans parfum.",
    },
  ],
};

export default article;
