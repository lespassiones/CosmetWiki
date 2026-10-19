import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/masque-led-visage/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site, et l'article change de rubrique
 * (« Routines » devient « Tendances »). Le format de ce fichier est décrit en
 * tête de `contenu/articles.ts`.
 */
const article: Article = {
  slug: "masque-led-visage",
  titre: "Masque LED visage : effet réel ou simple tendance TikTok ?",
  titreSeo: "Masque LED visage : effet réel ou tendance ?",
  resume:
    "Boom des masques LED en 2026 : ce que disent vraiment les études, à quoi sert chaque couleur de lumière, et les précautions à connaître avant d'investir.",
  chapo:
    "Les masques LED ont explosé sur TikTok et chez les marques de skincare premium. Derrière l'effet « ovni » sur le visage, il y a une vraie technologie médicale (la **photobiomodulation**), aujourd'hui rendue accessible à la maison. Mais ++tous les masques ne se valent pas++, et le marketing va souvent plus vite que les études.",
  publieLe: "2026-05-17",
  modifieLe: "2026-05-17",
  minutes: 3,
  theme: "masque LED visage",
  motsCles: [
    "masque LED",
    "LED rouge peau",
    "LED bleue acné",
    "luminothérapie visage",
    "photobiomodulation",
    "masque LED avis",
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
    { type: "h2", texte: "1. Le principe : la photobiomodulation" },
    {
      type: "p",
      texte:
        "Des LED émettent une lumière à **longueur d'onde précise**. Chaque longueur pénètre la peau à une profondeur différente et déclenche une réaction biologique : stimulation des mitochondries, production de collagène, réduction de l'inflammation.",
    },
    {
      type: "encadre",
      ton: "indigo",
      titre: "À retenir",
      texte:
        "La technique est utilisée en dermatologie hospitalière ==depuis les années 2000==. Les versions maison sont moins puissantes mais reposent sur le même principe.",
    },

    { type: "h2", texte: "2. Que fait chaque couleur" },
    {
      type: "tableau",
      entetes: ["Couleur", "Longueur d'onde", "Effet ciblé"],
      lignes: [
        ["**Rouge**", "630-660 nm", "Anti-âge, collagène, fermeté"],
        ["**Bleue**", "415-465 nm", "Acné, bactérie *P. acnes*"],
        ["**Infrarouge**", "830-940 nm", "Cicatrisation, douleurs profondes"],
        ["**Verte**", "520-560 nm", "Taches pigmentaires (preuve faible)"],
      ],
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

    { type: "h2", texte: "3. Bénéfices documentés" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**LED rouge :** études cliniques montrent une augmentation visible du collagène et une réduction des rides fines après ==8 à 12 semaines== à raison de 3 à 5 séances de 10 minutes par semaine.",
        "**LED bleue :** efficacité prouvée contre l'acné inflammatoire légère à modérée. Souvent comparable à une crème topique à base de peroxyde de benzoyle.",
        "**LED infrarouge :** accélère la cicatrisation, utilisée en clinique post-laser ou post-microneedling.",
        "Aucune douleur, aucune éviction sociale, pas de photosensibilisation.",
      ],
    },

    { type: "h2", texte: "4. Limites et précautions" },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Régularité essentielle :** 3-5 séances par semaine pendant 2 à 3 mois minimum. Un masque utilisé « de temps en temps » ne donne rien.",
        "**Qualité variable :** beaucoup de masques low cost ont une puissance trop faible (irradiance) pour produire un effet biologique réel. Cherche la mention de la longueur d'onde précise et de la densité de LED.",
        "**Contre-indications :** épilepsie photosensible, certains traitements photosensibilisants (rétinoïdes oraux, tétracyclines), grossesse (par prudence). Demande un avis médical en cas de doute.",
        "**Protection oculaire :** porte les lunettes fournies. Ne regarde jamais les LED directement.",
      ],
    },

    { type: "h2", texte: "5. Comment choisir son masque" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Marquage CE médical** (CE 0123 ou équivalent), pas seulement CE jouet.",
        "Longueur d'onde précise indiquée : ==633 nm ou 660 nm== pour le rouge, 415 nm pour le bleu.",
        "**Densité de LED :** au moins 150 LED pour un visage complet.",
        "**Irradiance** (intensité) annoncée par le fabricant. En-dessous de 20 mW/cm², l'effet est probablement négligeable.",
        "Marques de référence : *CurrentBody, Dr. Dennis Gross, Omnilux, Foreo*.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Vérifie ta routine soin.** Cosme Check analyse tes crèmes et sérums pour qu'ils accompagnent au mieux ta routine LED, sans interaction avec des actifs photosensibilisants.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Technologie médicale réelle, pas de la magie TikTok.",
        "**Rouge** = anti-âge, **bleue** = acné, **infrarouge** = cicatrisation.",
        "Régularité > fréquence d'achat : 3-5 séances / semaine pendant ==8-12 semaines==.",
        "Choisir un masque **certifié CE médical**, avec longueur d'onde et irradiance précisées.",
        "Compatible avec une routine skincare normale ; éviter sur peau sous traitement photosensibilisant.",
      ],
    },
  ],
  faq: [
    {
      question: "Est-ce que le masque LED visage fonctionne vraiment ?",
      reponse:
        "La technique, la photobiomodulation, est utilisée en dermatologie hospitalière depuis les années 2000. Les masques maison sont moins puissants mais reposent sur le même principe. Des études cliniques montrent une réduction des rides fines avec la LED rouge, après 8 à 12 semaines d'usage régulier.",
    },
    {
      question: "Combien de séances de masque LED par semaine ?",
      reponse:
        "Compte 3 à 5 séances de 10 minutes par semaine, pendant 2 à 3 mois au minimum. C'est la régularité qui fait le résultat : un masque utilisé de temps en temps ne donne rien. Les effets de la LED rouge sur les rides fines se voient après 8 à 12 semaines.",
    },
    {
      question: "Quelle couleur de LED pour quel problème de peau ?",
      reponse:
        "Le rouge (630 à 660 nm) vise l'anti-âge, le collagène et la fermeté. Le bleu (415 à 465 nm) vise l'acné et la bactérie *P. acnes*. L'infrarouge (830 à 940 nm) vise la cicatrisation. Le vert (520 à 560 nm) vise les taches pigmentaires, avec des preuves faibles.",
    },
    {
      question: "Comment choisir un masque LED ?",
      reponse:
        "Vérifie le marquage CE médical, pas seulement CE jouet. La longueur d'onde doit être indiquée (633 ou 660 nm pour le rouge, 415 nm pour le bleu). Vise au moins 150 LED pour un visage complet, et une irradiance annoncée d'au moins 20 mW/cm², sinon l'effet est probablement négligeable.",
    },
  ],
};

export default article;
