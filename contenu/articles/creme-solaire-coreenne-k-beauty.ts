import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/creme-solaire-coreenne-k-beauty/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
 */
const article: Article = {
  slug: "creme-solaire-coreenne-k-beauty",
  titre: "Crèmes solaires coréennes (K-Beauty) : pourquoi elles cartonnent et comment bien choisir",
  titreSeo: "Crème solaire coréenne : pourquoi elle cartonne",
  resume:
    "Beauty of Joseon, Round Lab, Anua, COSRX : les SPF coréens explosent en France. Avantages, filtres face à l'Europe et précautions avant d'acheter.",
  chapo:
    "Les SPF coréens dominent aujourd'hui le top des ventes sur Yesstyle, Olive Young, et de plus en plus en parapharmacie française. **Beauty of Joseon Relief Sun** est devenu un phénomène TikTok. Mais pourquoi sont-ils si différents de nos SPF européens, et ++peut-on les acheter sans risque++ ?",
  publieLe: "2026-05-11",
  modifieLe: "2026-05-11",
  minutes: 3,
  theme: "crème solaire coréenne",
  motsCles: [
    "K-Beauty SPF",
    "Beauty of Joseon Relief Sun",
    "SPF coréen France",
    "filtres UV coréens",
    "SPF asiatique non gras",
    "meilleur SPF coréen",
  ],
  categorie: "Marques",
  couverture: {
    src: "/image/blog/k-beauty/hero.webp",
    alt: "Une jeune femme pose le bout des doigts sur sa joue dans un appartement baigné de soleil, une ville en arrière-plan.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "1. Pourquoi le boom en 2026 ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Texture :** les SPF coréens sont traditionnellement ==légers, non gras, sans fini blanc==. La culture skincare asiatique impose des produits agréables à porter au quotidien.",
        "**Innovation rapide :** nouvelles formules tous les 6-12 mois, là où une marque européenne peut mettre 3-5 ans à renouveler une gamme.",
        "**Prix :** souvent moins chers qu'un SPF européen, pour une protection souvent meilleure.",
        "**Effet « glass skin » :** beaucoup de SPF coréens jouent un rôle d'hybride entre soin hydratant et écran solaire.",
      ],
    },

    { type: "h2", texte: "2. EU vs Corée : la différence des filtres" },
    {
      type: "p",
      texte:
        "La Corée autorise des **filtres UV modernes** (Tinosorb, Uvinul, Mexoryl) que la FDA américaine n'a toujours pas approuvés, et qui sont aussi autorisés en Europe. C'est pour ça que les SPF coréens et européens partagent les mêmes molécules de pointe.",
    },
    {
      type: "tableau",
      entetes: ["Marché", "Filtres modernes", "Approche"],
      lignes: [
        ["**Corée**", "Tinosorb, Uvinul, Mexoryl, Iscotrizinol", "Texture + innovation rapide"],
        [
          "**Europe**",
          "Mêmes filtres ([Annexe VI](https://single-market-economy.ec.europa.eu/sectors/cosmetics/legislation_en))",
          "Cycles de validation plus longs",
        ],
        ["**États-Unis**", "Anciens uniquement (Avobenzone...)", "Filtres modernes *non approuvés*"],
      ],
    },
    {
      type: "encadre",
      ton: "violet",
      titre: "À retenir",
      texte:
        "Un SPF coréen importé en France est donc ==cohérent avec la réglementation EU== sur les filtres. C'est la grosse différence avec un SPF américain qui peut contenir uniquement des filtres anciens (oxybenzone, octocrylène).",
    },

    { type: "h2", texte: "3. Texture et innovation" },
    {
      type: "p",
      texte: "La force des SPF coréens, c'est l'ergonomie. Tu trouveras :",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Des **essences** hybrides (entre lotion et sérum) avec SPF intégré, idéales pour les peaux mixtes.",
        "Des **fluids invisibles** qui se posent sous le maquillage sans pilling.",
        "Des **sticks** ultra-pratiques pour la réapplication en journée par-dessus le maquillage.",
        "Des ajouts d'actifs cosmétiques : *niacinamide, panthénol, centella asiatica, propolis*, qui apportent un vrai bénéfice soin en plus du SPF.",
      ],
    },
    {
      type: "image",
      src: "/image/blog/k-beauty/image1.webp",
      alt: "Femme appliquant une crème solaire coréenne légère, illustration de la K-Beauty et de sa texture invisible",
      largeur: 1915,
      hauteur: 821,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "4. Les marques à connaître (disponibles en France)" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Beauty of Joseon Relief Sun Rice + Probiotics** (SPF 50+ PA++++) : la star TikTok. Texture chimique transparente, riz fermenté, INCI court. ==Excellent rapport qualité-prix==.",
        "**Round Lab Birch Juice Moisturizing Sunscreen** (SPF 50+ PA++++) : sève de bouleau, très hydratant, idéal peaux sèches ou matures.",
        "**Anua Heartleaf Silky Moisture Sun Cream** (SPF 50+ PA++++) : centella et heartleaf, apaisant, recommandé pour peaux sensibles ou sujettes à l'acné.",
        "**COSRX Aloe Soothing Sun Cream** (SPF 50+ PA+++) : aloe vera, classique abordable.",
        "**Innisfree Daily UV Defense Invisible Serum** (SPF 36 PA+++) : fini invisible parfait sous maquillage.",
      ],
    },

    { type: "h2", texte: "5. Précautions avant d'acheter" },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Vérifier la version :** certaines marques vendent des *« US versions »* avec filtres différents (et souvent moins bons). Préfère la version ==« Korean / Global »==.",
        "**Date de péremption :** sur certains sites tiers (Yesstyle, Stylevana), vérifie la date PAO (Period After Opening). Les filtres UV s'oxydent avec le temps.",
        "**Notation PA / SPF :** *SPF 50+ PA++++* est le maximum réglementaire en Corée. Au-dessous, c'est moins protecteur sur les UVA.",
        "**Parfums :** certains SPF coréens utilisent des parfums prononcés. Vérifie l'INCI si tu as la peau sensible.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Vérifie ton SPF coréen avant achat.** Cosme Check analyse l'INCI des SPF coréens et internationaux selon la réglementation européenne, signale les filtres modernes et alerte sur les molécules à surveiller.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "SPF coréens = **textures supérieures** et filtres modernes ==compatibles EU==.",
        "Très différents des SPF américains (filtres anciens uniquement aux USA).",
        "Stars du moment : **Beauty of Joseon, Round Lab, Anua, COSRX**.",
        "Vérifier la **version « Korean / Global »** et la date PAO sur les sites tiers.",
        "Toujours scanner l'INCI avant achat (parfums, alcool, filtres précis).",
      ],
    },
  ],
  faq: [
    {
      question: "Pourquoi les crèmes solaires coréennes sont-elles si populaires ?",
      reponse:
        "Pour leur texture d'abord : légère, non grasse, sans fini blanc, agréable à porter tous les jours. Les marques coréennes renouvellent aussi leurs formules tous les 6 à 12 mois, et beaucoup de leurs SPF jouent les hybrides entre soin hydratant et écran solaire, pour un effet « glass skin ».",
    },
    {
      question: "Les crèmes solaires coréennes sont-elles autorisées en Europe ?",
      reponse:
        "Leurs filtres modernes (Tinosorb, Uvinul, Mexoryl) sont aussi autorisés en Europe, à l'annexe VI du règlement cosmétique. Un SPF coréen importé est donc cohérent avec la réglementation européenne sur les filtres, contrairement à un SPF américain qui peut ne contenir que des filtres anciens comme l'oxybenzone ou l'octocrylène.",
    },
    {
      question: "Que veut dire PA++++ sur une crème solaire coréenne ?",
      reponse:
        "La notation PA mesure la protection contre les UVA. SPF 50+ PA++++ est le maximum réglementaire en Corée : en dessous, la crème protège moins bien des UVA. Avant d'acheter, vérifie aussi que tu prends la version « Korean / Global » et non une « US version » aux filtres différents.",
    },
  ],
};

export default article;
