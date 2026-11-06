import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/lip-oils-huiles-levres/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site, et l'article change de rubrique
 * (Routines → Tendances). Le format de ce fichier est décrit en tête de
 * `contenu/articles.ts`.
 */
const article: Article = {
  slug: "lip-oils-huiles-levres",
  titre: "Lip oils : la vraie différence avec un gloss (et lesquels choisir)",
  titreSeo: "Lip oil : avis et notes de 5 huiles à lèvres",
  resume:
    "Lip oil ou gloss ? Le Dior Lip Glow Oil classique commence par deux huiles synthétiques : 5 lip oils notés, et les 3 ingrédients à chercher.",
  chapo:
    "Les **lip oils** sont devenus viraux sur TikTok, et ont rendu célèbre le Lip Glow Oil de Dior. Promesse : la brillance d'un gloss avec le soin d'un baume. ++Vrai sur le papier++, mais à condition de bien choisir.",
  publieLe: "2026-05-14",
  modifieLe: "2026-11-06",
  minutes: 4,
  theme: "lip oil",
  motsCles: [
    "huile à lèvres",
    "lip oil avis",
    "Dior lip glow oil",
    "lip oil teinté",
    "meilleur lip oil",
    "gloss vs huile lèvres",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/lip-oils/hero.webp",
    alt: "Une jeune femme sourit à son reflet dans le miroir de la salle de bains, un flacon d'huile à lèvres à la main.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "1. Différence avec un gloss classique" },
    {
      type: "tableau",
      entetes: ["Critère", "Gloss", "Lip oil"],
      lignes: [
        ["**Base.**", "Polymères et silicones.", "Huiles (jojoba, ricin) ou huiles synthétiques."],
        ["**Texture.**", "Collante, épaisse.", "Fluide, légère, non collante."],
        ["**Effet.**", "Brillance pure.", "Brillance et confort."],
        ["**Tenue.**", "Plus longue.", "Courte, on réapplique."],
      ],
    },

    { type: "h2", texte: "2. Ce que ça apporte vraiment" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Nutrition immédiate :** les huiles végétales colmatent les micro-fissures des lèvres et limitent l'évaporation de l'eau.",
        "**Confort durable :** les versions sérieuses comprennent du beurre de karité, du squalane végétal ou de l'huile de jojoba.",
        "**Effet plump léger :** certaines formules ajoutent de la *menthe poivrée* ou un extrait de piment ([Capsicum Annuum Fruit Extract](/i/capsicum-annuum-fruit-extract)) pour gonfler temporairement la lèvre. Joli sur Instagram, parfois irritant.",
      ],
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "À retenir",
      texte:
        "Le lip oil ==remplace souvent le baume== au quotidien. Mais sur des lèvres gercées profondes, rien ne vaut un baume très occlusif (qui forme un film épais pour garder l'eau), type Cicaplast. Pour ces lèvres-là, lis notre [guide des crèmes réparatrices](/blog/cremes-hydratantes-reparatrices).",
    },

    { type: "h2", texte: "3. Liste INCI : que regarder ?" },
    {
      type: "p",
      texte:
        "La liste INCI, c'est la liste officielle des ingrédients au dos du produit, du plus dosé au moins dosé. Les trois premiers noms font l'essentiel de la formule : c'est là que tout se joue. Pour t'entraîner sur d'autres produits, suis notre méthode [« ce cosmétique est-il fait pour toi ? »](/blog/cosmetique-fait-pour-toi).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Premiers ingrédients = vraies huiles :** [Helianthus Annuus Seed Oil](/i/helianthus-annuus-seed-oil) (tournesol), [Ricinus Communis Seed Oil](/i/ricinus-communis-seed-oil) (ricin), [Simmondsia Chinensis Seed Oil](/i/simmondsia-chinensis-seed-oil) (jojoba), [Squalane](/i/squalane), [Butyrospermum Parkii Butter](/i/butyrospermum-parkii-butter) (karité).",
        "**Pas que des esters :** certains lip oils ne contiennent que [Polybutene](/i/polybutene) et [Hydrogenated Polyisobutene](/i/hydrogenated-polyisobutene), des huiles synthétiques qui imitent les vraies. Brillant, mais pas nourrissant.",
        "**Vitamine E ([Tocopherol](/i/tocopherol)) :** bon indicateur de qualité, antioxydant qui protège les huiles de l'oxydation.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Parfums forts** et arômes (cannelle, [huile de menthe poivrée](/i/mentha-piperita-oil)) : risque d'allergie ou de tiraillement.",
        "**Colorants** ([CI 15850](/i/ci-15850), CI 15985) : ils sont autorisés en Europe, listés à l'annexe IV du [règlement (CE) 1223/2009](https://eur-lex.europa.eu/eli/reg/2009/1223/oj). Mais si tes lèvres réagissent facilement, une version transparente est plus sûre.",
      ],
    },
    {
      type: "image",
      src: "/image/blog/lip-oils/image1.webp",
      alt: "Application d'une huile à lèvres teintée avec applicateur, mise en avant de la texture brillante et fluide",
      largeur: 1915,
      hauteur: 821,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "4. Que valent les lip oils du moment ?" },
    {
      type: "p",
      texte:
        "On a lu leurs listes dans notre base, le 06/11/2026. Surprise : le plus célèbre ne suit pas la règle des trois premiers ingrédients. Le *Dior Addict Lip Glow Oil* classique commence par deux huiles synthétiques, [Hydrogenated Polyisobutene](/i/hydrogenated-polyisobutene) et [Polybutene](/i/polybutene). Son huile de cerise (*Prunus Avium Seed Oil*) n'arrive qu'en ==12e place sur 25==, après le parfum.",
    },
    {
      type: "tableau",
      entetes: ["Lip oil", "Les premiers ingrédients", "Note Cosme Check"],
      lignes: [
        ["Take Care, Lip Glow Oil Parfum Fraise.", "huile de colza, huile de ricin.", "16,19 sur 20."],
        ["Dior, Addict Lip Glow Oil 081 Latte, finition Glaze.", "ester végétal, huile de colza.", "16,11 sur 20."],
        ["Clarins, Lip Comfort Oil 01.", "polymère, huile de jojoba, huile de rose musquée.", "11,79 sur 20."],
        ["Charlotte Tilbury, Unreal Lips Healthy Glow Nectar Oil Cherry Glaze.", "Polybutene, Hydrogenated Polydecene.", "11,63 sur 20."],
        ["Dior, Addict Lip Glow Oil 001 Pink.", "Hydrogenated Polyisobutene, Polybutene.", "7,73 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 06/11/2026.",
    },
    {
      type: "p",
      texte:
        "Chez Dior, la note double selon la teinte. Les nouvelles finitions Glaze et Sparkly mettent l'huile de colza en troisième place et montent autour de 16. Le Pink classique, avec du menthol et de l'huile de menthe poivrée, reste à 7,73. Et la mieux notée du tableau est la plus simple : 11 ingrédients, deux vraies huiles en tête. ++Le prix ne dit rien de la liste.++",
    },
    {
      type: "cta",
      texte:
        "**Vérifie tes huiles à lèvres en 10 secondes.** Scanne ton lip oil avec Cosme Check : note ingrédient par ingrédient, alerte sur les parfums irritants et les huiles synthétiques.",
    },

    { type: "h2", texte: "Un lip oil protège-t-il du soleil ?" },
    {
      type: "p",
      texte:
        "Presque jamais. Les lèvres ont très peu de mélanine, le pigment qui protège un peu la peau du soleil : elles brûlent vite. Un lip oil n'a pas de filtre, sauf si un SPF (l'indice de protection solaire) est écrit sur le tube.",
    },
    {
      type: "p",
      texte:
        "Au ski, à la plage, ou sous le soleil des Antilles et de La Réunion, choisis un stick à lèvres avec SPF, et garde ton lip oil pour le soir. Les mêmes réflexes que pour ton visage : [les 7 erreurs de la crème solaire](/blog/spf-50-visage-7-erreurs).",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Gloss** = brillance pure. **Lip oil** = brillance + nutrition.",
        "Cherche ==une vraie huile végétale== dans les 3 premiers ingrédients de l'INCI.",
        "Évite les arômes forts (menthe, cannelle) si tu as les lèvres sensibles.",
        "Il tient moins qu'un gloss : c'est normal, on réapplique. Pas un défaut produit.",
      ],
    },
  ],
  faq: [
    {
      question: "Quelle est la différence entre un lip oil et un gloss ?",
      reponse:
        "Le gloss repose sur des polymères et des silicones : texture collante et épaisse, brillance pure, tenue plus longue. Le lip oil repose sur des huiles, végétales comme le jojoba ou le ricin, ou synthétiques : texture fluide et non collante, brillance plus confort, mais il faut le remettre plus souvent.",
    },
    {
      question: "Un lip oil peut-il remplacer un baume à lèvres ?",
      reponse:
        "Au quotidien, souvent oui : ses huiles végétales colmatent les micro-fissures des lèvres et limitent l'évaporation de l'eau. En revanche, il ne remplace pas un baume très occlusif, type Cicaplast, quand les lèvres sont profondément gercées. Dans ce cas, le baume reste le bon choix.",
    },
    {
      question: "Comment choisir un bon lip oil en lisant l'INCI ?",
      reponse:
        "Cherche une vraie huile végétale dans les trois premiers ingrédients, comme Helianthus annuus oil, Ricinus communis oil ou Jojoba esters. Méfie-toi des formules faites seulement de Polybutene ou d'Hydrogenated Polyisobutene, brillantes mais pas nourrissantes. La vitamine E (Tocopherol) est un bon indicateur de qualité.",
    },
    {
      question: "Pourquoi mon lip oil ne tient-il pas longtemps ?",
      reponse:
        "C'est normal : un lip oil tient moins longtemps qu'un gloss, parce qu'il est moins collant. Sa texture est fluide, légère et non collante, et la brillance vient d'huiles végétales qui nourrissent la lèvre. Ce n'est pas un défaut du produit : on le réapplique simplement dans la journée.",
    },
  ],
  notes: [
    { produit: "Take Care, Huile à Lèvres Lip Glow Oil Parfum Fraise (7,5 ml)", ean: "3661075357764", note: 16.19, releveeLe: "2026-11-06" },
    { produit: "Dior, Addict Lip Glow Oil 081 Latte, finition Glaze", ean: "3348901792165", note: 16.11, releveeLe: "2026-11-06" },
    { produit: "Clarins, Lip Comfort Oil 01 (7 ml)", ean: "3666057037429", note: 11.79, releveeLe: "2026-11-06" },
    { produit: "Charlotte Tilbury, Unreal Lips Healthy Glow Nectar Oil Cherry Glaze (14 ml)", ean: "5056446653800", note: 11.63, releveeLe: "2026-11-06" },
    { produit: "Dior, Addict Lip Glow Oil 001 Pink (6 ml)", ean: "3348901795319", note: 7.73, releveeLe: "2026-11-06" },
  ],
};

export default article;
