import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/spf-50-visage-7-erreurs/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
 */
const article: Article = {
  slug: "spf-50-visage-7-erreurs",
  titre: "SPF 50 visage : les 7 erreurs que tout le monde fait (et comment les éviter)",
  titreSeo: "SPF 50 visage : les 7 erreurs à éviter",
  resume:
    "Quantité, réapplication, filtres, hiver, parfum : les 7 erreurs qui font d'un SPF 50 visage une protection au rabais, et la bonne méthode.",
  chapo:
    "**80 % des gens appliquent leur crème solaire de la mauvaise façon**, et le SPF devient presque inutile. Une seule erreur (dose, moment, filtre) peut transformer un SPF 50 en SPF 7. Voici les 7 plus fréquentes, et la bonne méthode pour vraiment protéger ton visage.",
  publieLe: "2026-04-15",
  modifieLe: "2026-04-15",
  minutes: 5,
  theme: "crème solaire visage SPF 50",
  motsCles: [
    "crème solaire visage",
    "SPF 50",
    "protection solaire quotidienne",
    "SPF en hiver",
    "différence SPF minéral chimique",
    "comment appliquer crème solaire visage",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/landing/SPF.webp",
    alt: "Une femme lit l'étiquette d'un tube de crème solaire dans un rayon de magasin.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "Erreur 1 : mettre trop peu de produit" },
    {
      type: "p",
      texte:
        "Le SPF est calculé en labo avec ==2 mg de crème par cm² de peau==. Soit, pour un visage adulte, **deux longueurs de doigt** (index + majeur) ou une **demi-cuillère à café**. La plupart des gens en mettent 2 à 3 fois moins.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "À moitié dose, le SPF protège ==comme un SPF 7== (pas 25 : la relation n'est pas linéaire).",
        "Mesure ta dose sur les doigts, étale en deux temps (visage, puis cou + oreilles + racine des cheveux).",
        "Texture gel ou fluide si la quantité gêne (ex. *Heliocare 360 Water Gel*).",
      ],
    },

    { type: "h2", texte: "Erreur 2 : ne pas remettre en cours de journée" },
    {
      type: "p",
      texte:
        "Le SPF se dégrade : oxydation UV, transpiration, frottements. Après ==2 heures d'exposition==, sa protection effective chute fortement, même pour les formules tenaces.",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "La solution",
      texte:
        "Utilise un format **poudre, brume ou stick** (par exemple *Isdin Mineral Brush SPF 50*) qui se réapplique par-dessus le maquillage en quelques secondes. Une fois à 13 h pour une journée de bureau, deux fois en extérieur.",
    },

    { type: "h2", texte: "Erreur 3 : choisir un SPF aux filtres problématiques" },
    { type: "p", texte: "Tous les SPF 50 ne se valent pas. Les filtres à surveiller :" },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Oxybenzone (Benzophenone-3)** : suspecté perturbateur endocrinien (le comité scientifique européen n'a pas pu trancher dans son [avis de 2021](https://health.ec.europa.eu/publications/benzophenone-3_en), et l'Europe en a limité la dose), interdit à Hawaï pour son impact sur les coraux.",
        "**Octocrylène** : peut se dégrader en benzophénone (cancérogène possible) avec le temps.",
        "**Homosalate, Octinoxate** : pénètrent la peau, sous surveillance européenne.",
      ],
    },
    {
      type: "p",
      texte:
        "À l'inverse, les filtres modernes (**Tinosorb S, Mexoryl 400, Uvinul A Plus**) sont stables, sûrs et efficaces. Le bon angle n'est pas « chimique ou minéral » mais « ++quels filtres précis++ ».",
    },

    { type: "h2", texte: "Erreur 4 : croire que le maquillage SPF suffit" },
    {
      type: "p",
      texte:
        "Un fond de teint affiché SPF 30 ne protège que si on en met ==une demi-cuillère à café sur le visage==. Personne ne fait ça. En usage réel, la protection effective tombe à **SPF 4-5**.",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "La solution",
      texte:
        "Le maquillage SPF est un **bonus**, pas la couche principale. La routine reste : sérum → crème → SPF 50 dédié → maquillage par-dessus.",
    },
    {
      type: "image",
      src: "/image/blog/spf-50-erreurs/image1.webp",
      alt: "Application d'une crème solaire SPF 50 sur le bout des doigts, illustrant la règle des deux doigts",
      largeur: 1570,
      hauteur: 1001,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "Erreur 5 : ne pas mettre de SPF en hiver" },
    {
      type: "p",
      texte:
        "Les **UVA traversent les nuages et les vitres** toute l'année. Ce sont eux qui causent ==80 % des signes visibles du vieillissement== (taches, perte de fermeté, rides), pas l'âge en lui-même.",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "La solution",
      texte:
        "SPF 30-50 quotidien, ++365 jours par an++. En hiver, une texture hydratante ou une crème teintée fait double emploi sans alourdir.",
    },

    { type: "h2", texte: "Erreur 6 : choisir au parfum, pas à la composition" },
    {
      type: "p",
      texte:
        "Le parfum est l'un des premiers facteurs d'irritation et d'allergie cutanée. Certains composants parfumants sont aussi **photosensibilisants** : ils provoquent des taches ou des rougeurs sous UV, précisément là où tu voulais te protéger.",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "La solution",
      texte:
        "Privilégie une formule **sans parfum** sur le visage (mention « fragrance-free » ou absence de « Parfum/Fragrance » dans l'INCI). Garde les parfums solaires pour le corps.",
    },

    { type: "h2", texte: "Erreur 7 : confondre SPF minéral et chimique" },
    { type: "p", texte: "Le sujet le plus mal expliqué de la cosmétique solaire. Petit récap visuel :" },
    {
      type: "tableau",
      entetes: ["Type", "Mécanisme", "Avantage", "Limite"],
      lignes: [
        ["**Minéral**", "Réfléchit les UV", "Bien toléré, grossesse / enfant", "Fini blanc, texture pâteuse"],
        ["**Chimique**", "Absorbe les UV", "Texture invisible et fluide", "Selon la molécule choisie (cf. erreur 3)"],
      ],
    },
    {
      type: "p",
      texte:
        "Ni l'un ni l'autre n'est meilleur par nature. **Un Tinosorb moderne est aussi sûr** qu'un minéral classique. Ce qui compte : la liste INCI et la stabilité de la formule.",
    },
    {
      type: "image",
      src: "/image/blog/spf-50-erreurs/image2.webp",
      alt: "Femme appliquant une protection solaire visage SPF 50, illustration d'une routine quotidienne anti-UV",
      largeur: 1586,
      hauteur: 992,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "Analyser sa crème solaire avec Cosme Check" },
    { type: "p", texte: "Lis la composition, pas l'allégation. En 10 secondes :" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "**Scanne** le code-barres du tube.",
        "Note couleur ==vert / jaune / orange / rouge== ingrédient par ingrédient.",
        "Alerte directe sur les filtres controversés (benzophénone, octocrylène, oxybenzone...).",
        "Comparaison avec d'autres SPF 50 plus propres.",
      ],
    },
    {
      type: "p",
      texte:
        "Deux références qui ressortent bien à l'analyse : **Heliocare 360** (Tinosorb + Mexoryl, sans parfum) et **Isdin Mineral Brush SPF 50** (poudre pour la retouche).",
    },
    {
      type: "cta",
      texte:
        "**Vérifie la composition de ta crème solaire.** Télécharge Cosme Check pour obtenir la note ingrédient par ingrédient de ton SPF, repérer les filtres controversés et comparer avec des alternatives plus propres.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**La bonne dose** : deux doigts / demi-cuillère à café.",
        "**Réappliqué** au moins une fois en journée.",
        "**Formule propre** : sans filtres controversés, sans parfum sur le visage.",
        "**Toute l'année**, pas qu'en été ou à la plage.",
        "**Filtres précis** > catégorie minéral / chimique.",
      ],
    },
    {
      type: "p",
      texte:
        "La meilleure crème solaire est celle dont tu mets la bonne quantité, tous les jours, et que tu sais lire.",
    },
  ],
  faq: [
    {
      question: "Quelle quantité de crème solaire mettre sur le visage ?",
      reponse:
        "Compte deux longueurs de doigt (index et majeur), soit environ une demi-cuillère à café pour le visage. C'est la dose utilisée en labo pour mesurer le SPF (2 mg par cm²). Avec moitié moins, la protection réelle chute bien plus que de moitié.",
    },
    {
      question: "Faut-il mettre de la crème solaire en hiver ?",
      reponse:
        "Oui. Les UVA traversent les nuages et les vitres toute l'année, et ce sont eux qui marquent la peau (taches, rides, perte de fermeté). Un SPF 30 à 50 chaque matin suffit en hiver, dans une texture hydratante ou teintée.",
    },
    {
      question: "Le fond de teint SPF suffit-il à protéger la peau ?",
      reponse:
        "Non. Pour atteindre le SPF affiché, il faudrait en mettre une demi-cuillère à café sur le visage, ce que personne ne fait. En usage réel, la protection tombe autour de SPF 4 ou 5. Garde un vrai SPF 50 sous le maquillage.",
    },
    {
      question: "Crème solaire minérale ou chimique : laquelle choisir ?",
      reponse:
        "Aucune n'est meilleure par nature. Le minéral réfléchit les UV et convient aux peaux sensibles, mais laisse souvent un fini blanc. Le chimique absorbe les UV avec une texture invisible. Ce qui compte, ce sont les filtres précis de la liste INCI.",
    },
  ],
};

export default article;
