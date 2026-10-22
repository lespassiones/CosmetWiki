import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/deodorant-sels-aluminium-verite/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
 *
 * Retouché le 22/10/2026 par le robot éditorial : 38 affichages en position
 * 59 sur « déodorant aluminium », « sel d aluminium danger » et « sels
 * d'aluminium » (Search Console, 28 jours au 21/10). Titre de résultat sur la
 * requête exacte, section « déodorant sans aluminium » (1 k à 10 k recherches,
 * `docs/seo/VOLUMES.md`), liens internes et fiches ingrédients, l'affirmation
 * non sourcée sur l'ANSES remplacée par l'avis du SCCS de 2020.
 */
const article: Article = {
  slug: "deodorant-sels-aluminium-verite",
  titre: "Déodorant ou anti-transpirant : faut-il vraiment fuir les sels d'aluminium ?",
  titreSeo: "Déodorant aluminium : vrai danger ou rumeur ?",
  resume:
    "Déodorant et sels d'aluminium : ce que dit la science (SCCS, ANSM), comment les repérer dans l'INCI et comment choisir un déodorant sans aluminium qui tient.",
  chapo:
    "Les sels d'aluminium ne se trouvent que dans les **anti-transpirants**, et aux doses autorisées en Europe, les experts les jugent sûrs. Entre les rumeurs, les déos « naturels » qui ne tiennent pas la journée et les irritations au bicarbonate, ++on fait le tri, preuves à l'appui++.",
  publieLe: "2026-06-17",
  modifieLe: "2026-10-22",
  minutes: 5,
  theme: "déodorant aluminium",
  motsCles: [
    "déodorant aluminium",
    "sels d'aluminium danger",
    "déodorant sans aluminium",
    "sel d'aluminium déodorant",
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
    { type: "h2", texte: "1. Déodorant ou anti-transpirant : quelle différence ?" },
    {
      type: "p",
      texte:
        "Un déodorant agit sur l'odeur, un anti-transpirant agit sur la sueur. C'est ==la confusion n°1==, et elle change tout, parce que seul le second contient des sels d'aluminium.",
    },
    {
      type: "tableau",
      entetes: ["", "Déodorant", "Anti-transpirant"],
      lignes: [
        ["**Rôle**", "Il masque ou neutralise l'odeur.", "Il réduit le flux de sueur."],
        ["**Comment**", "Avec des antibactériens et du parfum.", "Avec des sels d'aluminium qui bouchent un temps les pores."],
        ["**Tu transpires**", "Oui, mais sans odeur.", "Beaucoup moins."],
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "Seuls les **anti-transpirants** contiennent des sels d'aluminium. Un déodorant peut très bien n'en contenir aucun : ==ce n'est pas « tout ou rien »==.",
    },

    { type: "h2", texte: "2. Les sels d'aluminium sont-ils dangereux ?" },
    {
      type: "p",
      texte:
        "Aux doses autorisées, non : c'est la conclusion des experts européens. La rumeur d'un lien avec le cancer du sein ou la maladie d'Alzheimer circule depuis des années, mais ++aucun lien de cause à effet n'est établi++.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "En 2020, le comité scientifique européen pour la sécurité des consommateurs ([avis du SCCS sur l'aluminium](https://health.ec.europa.eu/publications/safety-aluminium-cosmetic-products-submission-ii_en)) a jugé les composés d'aluminium sûrs. La limite : 6,25 % d'aluminium dans les déodorants et anti-transpirants hors spray, et 10,60 % en spray.",
        "Les études « alarmistes » étaient surtout faites *in vitro*, c'est-à-dire sur des cellules en laboratoire, à des doses sans rapport avec un usage réel.",
        "La seule réserve sérieuse vient de l'Afssaps, aujourd'hui l'ANSM, dans son [rapport d'octobre 2011](https://archive.ansm.sante.fr/var/ansm_site/storage/original/application/ad548a50ee74cc320c788ce8d11ba373.pdf) : **éviter l'application sur une peau abîmée**, juste après le rasage par exemple, car l'aluminium y passe davantage.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "« Sans aluminium » est avant tout un **argument marketing**. Ça ne rend pas un produit meilleur par magie : un déo « naturel » peut être très irritant.",
        "Ne change pas de produit dans la panique : si ton anti-transpirant te convient, l'==usage normal est considéré comme sûr==.",
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
        "**Bicarbonate de soude** ([Sodium Bicarbonate](/i/sodium-bicarbonate)) : efficace contre l'odeur, mais son ++pH élevé++ irrite souvent la peau des aisselles. Le pH mesure l'acidité : la peau est un peu acide, le bicarbonate ne l'est pas du tout.",
        "**Pierre d'alun** : souvent vendue « naturelle », alors qu'elle contient elle-même de l'aluminium ([Potassium Alum](/i/potassium-alum)). Un vrai paradoxe.",
        "**Oxyde ou ricinoléate de zinc** ([Zinc Ricinoleate](/i/zinc-ricinoleate)) : il neutralise les odeurs en douceur, une bonne option pour les peaux sensibles.",
        "**Amidons et huiles végétales** : ils absorbent l'humidité sans bloquer la sueur. C'est confortable, mais la tenue est plus courte en pleine chaleur.",
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "Le vrai critère",
      texte:
        "La question n'est pas « avec ou sans aluminium », mais ==« est-ce que la formule est bien tolérée par TA peau ? »== C'est là que lire la composition devient utile.",
    },

    { type: "h2", texte: "4. Comment choisir un déodorant sans aluminium qui tient ?" },
    {
      type: "p",
      texte:
        "Un déodorant sans aluminium ne t'empêchera pas de transpirer : il doit surtout empêcher l'odeur. L'odeur ne vient pas de la sueur elle-même, mais des bactéries qui la dégradent sur la peau. Les meilleurs déodorants sans aluminium freinent ces bactéries ou captent les molécules qui sentent.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Cherche un anti-odeur doux dans la liste : *Zinc Ricinoleate* ou [Triethyl Citrate](/i/triethyl-citrate), qui freine les bactéries.",
        "Évite le bicarbonate en tête de liste si ta peau tiraille ou rougit vite.",
        "Mets-le sur une peau propre et sèche, le matin, et reprends-en à midi les jours de grosse chaleur.",
        "Laisse deux semaines à ta peau quand tu quittes un anti-transpirant : la sueur revient d'un coup, puis ça se calme souvent.",
      ],
    },

    { type: "h2", texte: "5. Lire la composition de ton déo en 10 secondes" },
    {
      type: "p",
      texte:
        "L'INCI, c'est la liste officielle des ingrédients, au dos du produit, du plus dosé au moins dosé. Notre méthode pour [analyser une composition en 5 étapes](/blog/analyse-composition-cosmetique) marche aussi pour un déodorant.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Sels d'aluminium** : [Aluminum Chlorohydrate](/i/aluminum-chlorohydrate), *Aluminum Zirconium…* Tu tiens un anti-transpirant, qui réduit la sueur.",
        "**Actifs anti-odeur doux** : *Zinc Ricinoleate*, *Triethyl Citrate*. Ils sont en général bien tolérés.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Sodium Bicarbonate** en tête de liste : à éviter si ta peau réagit facilement.",
        "**Alcohol Denat.** en première position : il pique sur une peau rasée et dessèche.",
        "**Parfum** abondant avec des allergènes comme [Limonene](/i/limonene) ou [Linalool](/i/linalool) : une cause fréquente de rougeurs sous les bras. Une réaction qui dure mérite l'avis d'un dermatologue.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Ton déo te convient-il vraiment ?** Scanne-le avec Cosme Check : l'app repère les sels d'aluminium, l'alcool et les parfums allergènes, ingrédient par ingrédient.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Déodorant** = anti-odeur. **Anti-transpirant** = anti-sueur, avec des sels d'aluminium.",
        "Aux doses autorisées en Europe, les sels d'aluminium sont jugés sûrs (SCCS, 2020). Seule réserve : la peau abîmée.",
        "« Sans aluminium » ne veut pas dire « sans risque » : le bicarbonate et la pierre d'alun ont aussi leurs défauts.",
        "Le bon réflexe : lire la liste et choisir une formule que ta peau supporte, pas un slogan. Le même raisonnement vaut pour [les perturbateurs endocriniens](/blog/perturbateurs-endocriniens-cosmetiques-2026) et pour savoir [si un cosmétique est fait pour toi](/blog/cosmetique-fait-pour-toi).",
      ],
    },
  ],
  faq: [
    {
      question: "Quelle différence entre un déodorant et un anti-transpirant ?",
      reponse:
        "Le déodorant masque ou neutralise l'odeur grâce à des antibactériens et du parfum : tu transpires toujours, mais sans odeur. L'anti-transpirant réduit le flux de sueur avec des sels d'aluminium qui bouchent un temps les pores. Seuls les anti-transpirants contiennent donc des sels d'aluminium.",
    },
    {
      question: "Les sels d'aluminium sont-ils dangereux ?",
      reponse:
        "Aux doses autorisées, non. En 2020, le comité scientifique européen pour la sécurité des consommateurs (SCCS) a jugé les composés d'aluminium sûrs dans les déodorants et anti-transpirants, dans des limites précises. Aucun lien de cause à effet n'est établi avec le cancer du sein ou Alzheimer. Seule réserve : éviter la peau abîmée.",
    },
    {
      question: "Un déodorant sans aluminium est-il meilleur pour la peau ?",
      reponse:
        "Pas forcément. « Sans aluminium » est d'abord un argument marketing. Le bicarbonate de soude, au pH élevé, irrite souvent les aisselles, et la pierre d'alun contient elle-même de l'aluminium. Le vrai critère, c'est une formule bien tolérée par ta peau : l'oxyde ou le ricinoléate de zinc sont de bonnes options douces.",
    },
    {
      question: "Peut-on mettre de l'anti-transpirant après le rasage ?",
      reponse:
        "Mieux vaut l'éviter. La seule réserve sérieuse, celle de l'Afssaps (aujourd'hui l'ANSM) en 2011, concerne l'application sur une peau abîmée, juste après le rasage ou sur des micro-coupures, parce que l'aluminium y passe davantage. Évite aussi les formules avec de l'Alcohol Denat. en première position, qui pique et dessèche.",
    },
  ],
};

export default article;
