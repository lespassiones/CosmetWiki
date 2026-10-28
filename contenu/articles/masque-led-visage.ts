import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/masque-led-visage/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site, et l'article change de rubrique
 * (« Routines » devient « Tendances »). Le format de ce fichier est décrit en
 * tête de `contenu/articles.ts`.
 *
 * Retouché le 28/10/2026 par le robot éditorial : chiffres sans source
 * retirés (nombre de LED, irradiance minimale, comparaison au peroxyde de
 * benzoyle, liste de marques), trois sources (Wunsch et Matuschka 2014,
 * revue Cochrane 2016, rappel Neutrogena 2019), `h2` en questions, liens
 * vers quatre articles et deux fiches.
 */
const article: Article = {
  slug: "masque-led-visage",
  titre: "Masque LED visage : effet réel ou simple tendance TikTok ?",
  titreSeo: "Masque LED visage : effet réel ou tendance ?",
  resume:
    "Masque LED visage : ce que disent vraiment les études sur la lumière rouge et bleue, combien de séances il faut, et les précautions pour tes yeux.",
  chapo:
    "Un masque LED peut améliorer un peu l'aspect de la peau, à condition de s'en servir longtemps et souvent : l'essai le plus cité a demandé **30 séances en 15 semaines**. Pour les boutons, les preuves restent faibles. Voici ce que disent vraiment les études, et les deux précautions que la pub oublie : ++tes yeux et tes crèmes++.",
  publieLe: "2026-05-17",
  modifieLe: "2026-10-28",
  minutes: 5,
  theme: "masque LED visage",
  motsCles: [
    "masque LED",
    "masque LED visage avis",
    "LED rouge peau",
    "LED bleue boutons",
    "luminothérapie visage",
    "photobiomodulation",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/led/hero.webp",
    alt: "Une femme allongée sur un canapé dans une pièce sombre porte un masque LED qui éclaire son visage en rouge.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "Comment marche un masque LED ?" },
    {
      type: "p",
      texte:
        "Il éclaire ta peau avec une lumière d'une seule couleur, sans UV. On parle de **photobiomodulation** : l'idée que certaines couleurs de lumière réveillent l'activité des cellules de la peau. Chaque couleur a sa longueur d'onde, mesurée en nanomètres (nm) : le rouge tourne autour de 630 nm, le bleu autour de 415 nm.",
    },
    {
      type: "p",
      texte:
        "Ce n'est pas un cosmétique : un masque LED est un appareil électrique. Il ne suit donc pas les règles des crèmes ([règlement (CE) 1223/2009](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)), et ++rien ne garantit que sa lumière est assez forte pour faire quelque chose++.",
    },

    { type: "h2", texte: "Que fait chaque couleur de LED ?" },
    {
      type: "tableau",
      entetes: ["Couleur", "Longueur d'onde", "Ce qui a été testé", "Niveau de preuve"],
      lignes: [
        ["Rouge.", "Environ 610 à 660 nm.", "Le teint, le grain de peau, les ridules.", "Quelques essais encourageants."],
        ["Infrarouge proche.", "Environ 830 à 850 nm.", "Associé au rouge, les mêmes effets.", "Quelques essais."],
        ["Bleu.", "Environ 415 nm.", "Les boutons.", "Faible."],
        ["Vert, jaune.", "Environ 520 à 590 nm.", "Les taches, l'éclat.", "Très faible."],
      ],
      legende: "Les masques vendus affichent souvent sept couleurs : seuls le rouge et l'infrarouge ont des essais un peu solides.",
    },
    {
      type: "image",
      src: "/image/blog/led/image1.webp",
      alt: "Femme portant un masque LED rouge pour un soin photobiomodulation à domicile",
      largeur: 1915,
      hauteur: 821,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "Le masque LED rouge, ça marche vraiment ?" },
    {
      type: "p",
      texte:
        "Un peu, avec de la patience. L'essai le plus cité a suivi 136 volontaires. Ceux qui ont reçu de la lumière rouge, seule ou avec de l'infrarouge, pendant 30 séances avaient un teint et un grain de peau jugés meilleurs ([Wunsch et Matuschka, *Photomedicine and Laser Surgery*, 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC3926176/)).",
    },
    {
      type: "p",
      texte:
        "L'échographie montrait aussi un collagène plus dense. Le collagène, c'est la protéine qui fait la fermeté de la peau. Deux limites : l'essai utilisait un appareil de cabine, plus puissant qu'un masque maison, et les changements restent modestes. ==Une séance de temps en temps ne donne rien== : c'est la régularité sur des mois qui compte.",
    },

    { type: "h2", texte: "Et la lumière bleue contre les boutons ?" },
    {
      type: "p",
      texte:
        "Les preuves sont faibles. Une grande revue de 71 études conclut qu'on manque de données solides, et la plupart des essais étaient petits et financés par les fabricants ([revue Cochrane, 2016](https://www.cochrane.org/CD007917/SKIN_use-light-therapy-acne)). Si tes boutons font mal ou laissent des marques, parles-en à un dermatologue plutôt que d'acheter un masque.",
    },
    {
      type: "p",
      texte:
        "Au quotidien, les gestes simples comptent plus : une [routine en quatre étapes](/blog/routine-skincare), et des crèmes qui ne bouchent pas les pores (lis ce que veut dire [« comédogène »](/blog/comedogene)).",
    },
    {
      type: "cta",
      texte:
        "**Ta routine, elle contient quoi ?** Scanne tes crèmes avec Cosme Check : tu vois en dix secondes si l'une d'elles contient du rétinol ou un acide exfoliant.",
    },

    { type: "h2", texte: "Quelles précautions avant de s'en servir ?" },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Tes yeux d'abord.** En 2019, Neutrogena a retiré son masque LED de la vente, après une alerte australienne sur un risque pour la rétine chez certaines personnes ([Association of Optometrists, 2019](https://www.aop.org.uk/ot/news/2019/07/22/eye-injury-risk-prompts-recall-of-neutrogena-light-therapy-acne-mask)). Garde les yeux fermés et porte les lunettes fournies.",
        "**Une vue fragile ou une maladie des yeux** : demande l'avis d'un ophtalmologiste avant de commencer.",
        "**Un médicament qui rend sensible à la lumière** : demande à ton médecin ou à ton pharmacien.",
        "**Grossesse ou épilepsie** : demande d'abord un avis médical.",
        "**Ça chauffe, ça pique, ça rougit** : arrête, et parles-en à un professionnel.",
      ],
    },
    {
      type: "p",
      texte:
        "Et tes crèmes ? Le [rétinol](/i/retinol) et les acides exfoliants comme l'[acide glycolique](/i/glycolic-acid) rendent la peau plus réactive. Le soir d'une séance, garde une routine douce. Pour une option plus douce que le rétinol, lis notre article sur le [bakuchiol](/blog/bakuchiol).",
    },

    { type: "h2", texte: "Comment choisir un masque LED ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "La longueur d'onde écrite en nanomètres pour chaque couleur, et pas seulement « lumière rouge ».",
        "La puissance de la lumière (l'irradiance, en mW/cm²) annoncée par le fabricant. Sans ce chiffre, impossible de comparer avec les études.",
        "Une étude publiée sur l'appareil lui-même, ou au moins sur ses réglages.",
        "Une notice qui parle des yeux et des contre-indications. Son absence est un mauvais signe.",
      ],
    },
    {
      type: "p",
      texte:
        "Le geste à retenir : ++un masque LED ne remplace pas la crème solaire++. Les UV abîment le collagène toute l'année. Éviter les [7 erreurs qui divisent ton SPF](/blog/spf-50-visage-7-erreurs) protège mieux ta peau que n'importe quelle lumière rouge.",
    },
  ],
  faq: [
    {
      question: "Est-ce que le masque LED visage fonctionne vraiment ?",
      reponse:
        "Un peu, et seulement avec de la régularité. Un essai sur 136 volontaires a vu le teint et le grain de peau s'améliorer après 30 séances de lumière rouge, avec un appareil de cabine. Les masques maison sont souvent moins puissants, et contre les boutons les preuves restent faibles.",
    },
    {
      question: "Combien de séances de masque LED par semaine ?",
      reponse:
        "L'essai le plus cité faisait deux séances par semaine, pendant 15 semaines. Les fabricants conseillent souvent des séances courtes plus fréquentes : suis la notice de ton appareil. Ce qui compte, c'est de tenir plusieurs mois. Un masque utilisé de temps en temps ne donne rien de visible.",
    },
    {
      question: "Quelle couleur de LED pour quel problème de peau ?",
      reponse:
        "Le rouge, seul ou avec l'infrarouge, a les essais les plus solides, sur le teint, le grain de peau et les ridules. Le bleu est vendu contre les boutons, mais une revue Cochrane de 2016 juge les preuves faibles. Le vert et le jaune n'ont presque pas d'études sérieuses.",
    },
    {
      question: "Le masque LED est-il dangereux pour les yeux ?",
      reponse:
        "Il peut l'être pour certaines personnes. En 2019, Neutrogena a retiré un masque LED de la vente à cause d'un risque pour la rétine chez des personnes ayant certaines maladies des yeux. Garde les yeux fermés, porte les lunettes fournies, et demande conseil à un ophtalmologiste si ta vue est fragile.",
    },
  ],
};

export default article;
