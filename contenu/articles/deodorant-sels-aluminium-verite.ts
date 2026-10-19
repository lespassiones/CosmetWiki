import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/deodorant-sels-aluminium-verite/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
 */
const article: Article = {
  slug: "deodorant-sels-aluminium-verite",
  titre: "Déodorant ou anti-transpirant : faut-il vraiment fuir les sels d'aluminium ?",
  titreSeo: "Sels d'aluminium déodorant : faut-il les fuir ?",
  resume:
    "Cancer, Alzheimer, déos « naturels » : ce que dit la science sur les sels d'aluminium, déodorant ou anti-transpirant, et comment lire l'INCI de ton déo.",
  chapo:
    "Dès les premières chaleurs, la même question revient : **les sels d'aluminium sont-ils dangereux ?** Entre les rumeurs de cancer, les déos « naturels » qui ne tiennent pas la journée et les irritations au bicarbonate, ++on fait le tri, preuves à l'appui++.",
  publieLe: "2026-06-17",
  modifieLe: "2026-06-17",
  minutes: 3,
  theme: "sels d'aluminium déodorant",
  motsCles: [
    "sels d'aluminium danger",
    "déodorant sans aluminium",
    "anti-transpirant cancer",
    "déodorant naturel avis",
    "déodorant vs anti-transpirant",
    "déodorant bicarbonate irritation",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/deodorant-aluminium/hero.webp",
    alt: "Un homme lève le bras devant le miroir de sa salle de bains et applique un déodorant stick sous l'aisselle.",
    largeur: 1600,
    hauteur: 773,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "1. Déodorant ≠ anti-transpirant" },
    { type: "p", texte: "C'est ==la confusion n°1==, et elle change tout :" },
    {
      type: "tableau",
      entetes: ["", "Déodorant", "Anti-transpirant"],
      lignes: [
        ["**Rôle**", "Masque / neutralise l'odeur", "Réduit le flux de sueur"],
        ["**Comment**", "Antibactériens + parfum", "Sels d'aluminium qui resserrent les pores"],
        ["**Tu transpires**", "Oui (mais sans odeur)", "Beaucoup moins"],
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "Seuls les **anti-transpirants** contiennent des sels d'aluminium. Un déodorant peut très bien en être totalement dépourvu : ==ce n'est pas « tout ou rien »==.",
    },

    { type: "h2", texte: "2. Sels d'aluminium : ce que dit (et ne dit pas) la science" },
    {
      type: "p",
      texte:
        "La rumeur cancer du sein / Alzheimer circule depuis des années. À ce jour, ++aucun lien de cause à effet n'est établi++ :",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Les grandes autorités sanitaires (dont l'**ANSES** en France) estiment qu'il n'existe **pas de preuve solide** reliant les déodorants au cancer du sein ou à la maladie d'Alzheimer.",
        "Les études « alarmistes » étaient surtout *in vitro* (sur cellules), à des doses sans rapport avec un usage réel.",
        "La seule réserve sérieuse vient de l'Afssaps (aujourd'hui l'ANSM), dans son [rapport d'octobre 2011](https://archive.ansm.sante.fr/var/ansm_site/storage/original/application/ad548a50ee74cc320c788ce8d11ba373.pdf) : **éviter l'application sur peau lésée** (juste après le rasage, micro-coupures) car l'absorption augmente.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "« Sans aluminium » est avant tout un **argument marketing**. Ça ne rend pas un produit « sain » par magie : un déo naturel peut être très irritant.",
        "Ne change pas de produit dans la panique : si ton anti-transpirant te convient, l'==usage normal est considéré comme sûr==. En 2020, le comité scientifique européen pour la sécurité des consommateurs ([avis du SCCS sur l'aluminium dans les cosmétiques](https://health.ec.europa.eu/publications/safety-aluminium-cosmetic-products-submission-ii_en)) a jugé les composés d'aluminium sûrs jusqu'à 6,25 % d'aluminium dans les déodorants et anti-transpirants hors spray, et 10,60 % en spray.",
      ],
    },
    {
      type: "image",
      src: "/image/blog/deodorant-aluminium/image1.webp",
      alt: "Plusieurs déodorants et anti-transpirants alignés : stick, roll-on et spray, avec étiquettes INCI visibles",
      largeur: 1280,
      hauteur: 853,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "3. Les alternatives « sans aluminium » (et leurs limites)" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Bicarbonate de soude :** efficace contre l'odeur, mais ++pH élevé++ = irritations et rougeurs fréquentes sous les aisselles.",
        "**Pierre d'alun :** souvent vendue « naturelle »… alors qu'elle contient elle-même de l'aluminium (*Potassium alum*). Paradoxe complet.",
        "**Oxyde de zinc / ricinoléate de zinc :** neutralise les odeurs en douceur, bonne option peaux sensibles.",
        "**Amidons + huiles végétales :** absorbent l'humidité sans bloquer la sueur. Confort, mais tenue plus courte en pleine chaleur.",
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "Le vrai critère",
      texte:
        "La question n'est pas « avec ou sans aluminium », mais ==« est-ce que la formule est bien tolérée par TA peau ? »== C'est là que lire l'INCI devient utile.",
    },

    { type: "h2", texte: "4. Lire l'INCI de ton déo en 10 secondes" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Sels d'aluminium :** *Aluminum chlorohydrate, Aluminum zirconium…* → tu tiens un anti-transpirant (réduit la sueur).",
        "**Actifs anti-odeur doux :** *Zinc ricinoleate, Triethyl citrate* → bonne tolérance.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Sodium bicarbonate** en tête de liste : à éviter si tu as la peau réactive.",
        "**Alcohol denat.** en première position : pique sur peau rasée, dessèche.",
        "**Parfum / Fragrance** abondant + allergènes (*Limonene, Linalool*) : cause fréquente d'eczéma des aisselles.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Ton déo te convient-il vraiment ?** Scanne ton déodorant ou anti-transpirant avec Cosme Check : détection des sels d'aluminium, de l'alcool et des parfums allergènes, note ingrédient par ingrédient et alternatives mieux tolérées.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Déodorant** = anti-odeur. **Anti-transpirant** = anti-sueur (sels d'aluminium).",
        "À ce jour, ==aucun lien prouvé== entre sels d'aluminium et cancer ou Alzheimer. Seule réserve : peau lésée.",
        "« Sans aluminium » ≠ « sans risque » : le bicarbonate et la pierre d'alun ont aussi leurs défauts.",
        "Le bon réflexe : **lire l'INCI** et choisir une formule tolérée par ta peau, pas un slogan.",
      ],
    },
  ],
  faq: [
    {
      question: "Quelle différence entre un déodorant et un anti-transpirant ?",
      reponse:
        "Le déodorant masque ou neutralise l'odeur grâce à des antibactériens et du parfum : tu transpires toujours, mais sans odeur. L'anti-transpirant réduit le flux de sueur avec des sels d'aluminium qui resserrent les pores. Seuls les anti-transpirants contiennent donc des sels d'aluminium.",
    },
    {
      question: "Les sels d'aluminium donnent-ils le cancer du sein ?",
      reponse:
        "À ce jour, aucun lien de cause à effet n'est établi. Les grandes autorités sanitaires, dont l'ANSES en France, estiment qu'il n'existe pas de preuve solide reliant les déodorants au cancer du sein ou à Alzheimer. Les études alarmistes étaient surtout faites sur cellules, à des doses sans rapport avec un usage réel.",
    },
    {
      question: "Un déodorant sans aluminium est-il meilleur pour la peau ?",
      reponse:
        "Pas forcément. « Sans aluminium » est d'abord un argument marketing. Le bicarbonate de soude, au pH élevé, irrite souvent les aisselles, et la pierre d'alun contient elle-même de l'aluminium. Le vrai critère, c'est une formule bien tolérée par ta peau : l'oxyde ou le ricinoléate de zinc sont de bonnes options douces.",
    },
    {
      question: "Peut-on mettre de l'anti-transpirant après le rasage ?",
      reponse:
        "Mieux vaut l'éviter. La seule réserve sérieuse, celle de l'Afssaps (aujourd'hui l'ANSM) en 2011, concerne l'application sur peau lésée, juste après le rasage ou sur des micro-coupures, parce que l'absorption augmente. Évite aussi les formules avec de l'Alcohol denat. en première position, qui pique sur peau rasée et dessèche.",
    },
  ],
};

export default article;
