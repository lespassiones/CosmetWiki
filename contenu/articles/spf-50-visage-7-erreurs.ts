import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/spf-50-visage-7-erreurs/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
 *
 * Retouché le 03/11/2026 par le robot éditorial : l'article le plus lié du
 * blog (seize articles pointent vers lui) n'avait aucun lien sortant ni
 * source pour ses chiffres. Retirés faute de source : « 80 % des gens »,
 * « comme un SPF 7 », « SPF 4-5 », « 80 % des signes du vieillissement »,
 * et deux produits présentés comme « ressortant bien à l'analyse » sans note
 * relevée. Ajoutés : Faurschou et Wulf 2007, FDA, Downs 2021, règlement
 * (UE) 2022/1176, Hughes 2013, `h2` en questions, liens internes.
 */
const article: Article = {
  slug: "spf-50-visage-7-erreurs",
  titre: "SPF 50 visage : les 7 erreurs que tout le monde fait (et comment les éviter)",
  titreSeo: "SPF 50 visage : les 7 erreurs à éviter",
  resume:
    "Quantité, réapplication, filtres, hiver, parfum : les 7 erreurs qui font d'un SPF 50 visage une protection au rabais, et la bonne méthode.",
  chapo:
    "Un SPF 50 ne protège comme promis que si tu en mets assez, et que tu en remets. Le SPF, c'est l'indice de protection contre les coups de soleil, mesuré en laboratoire avec une dose que presque personne n'applique. Voici les 7 erreurs les plus fréquentes, et la bonne méthode pour vraiment protéger ton visage.",
  publieLe: "2026-04-15",
  modifieLe: "2026-11-03",
  minutes: 6,
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
    { type: "h2", texte: "Erreur 1 : combien de crème solaire faut-il mettre ?" },
    {
      type: "p",
      texte:
        "Le SPF est mesuré en laboratoire avec ==2 mg de crème par cm² de peau==. Pour un visage adulte, ça fait **deux longueurs de doigt** (index et majeur), soit environ une demi-cuillère à café. La plupart des gens en mettent beaucoup moins.",
    },
    {
      type: "p",
      texte:
        "Le problème, c'est que la protection ne baisse pas au même rythme que la dose. Dans une étude sur des volontaires, appliquer 0,5 ou 1 mg par cm² a fait chuter le SPF bien plus que de moitié ([Faurschou et Wulf, *British Journal of Dermatology*, 2007](https://doi.org/10.1111/j.1365-2133.2006.07684.x)). Une demi-dose ne donne donc pas une demi-protection, mais bien moins.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Mesure ta dose sur deux doigts, puis étale en deux temps : le visage d'abord, puis le cou, les oreilles et la racine des cheveux.",
        "Si la quantité te gêne, choisis une texture fluide ou gel : elle s'étale mieux et se sent moins.",
      ],
    },

    { type: "h2", texte: "Erreur 2 : faut-il remettre de la crème solaire dans la journée ?" },
    {
      type: "p",
      texte:
        "Oui. La sueur, l'eau, les frottements et les mains sur le visage emportent le produit. L'agence américaine du médicament conseille d'en remettre ==au moins toutes les deux heures== quand on est dehors, et plus souvent après la baignade ou une forte transpiration ([FDA, « Sun Protection »](https://www.fda.gov/consumers/consumer-updates/tips-stay-safe-sun-sunscreen-sunglasses)).",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "La solution",
      texte:
        "Un format **poudre, brume ou stick** se remet par-dessus le maquillage en quelques secondes. Une fois en milieu de journée au bureau, toutes les deux heures dehors.",
    },

    { type: "h2", texte: "Erreur 3 : quels filtres solaires surveiller ?" },
    {
      type: "p",
      texte:
        "Tous les SPF 50 ne se valent pas. Un filtre, c'est l'ingrédient qui arrête les UV. Sur la liste INCI (la liste officielle des ingrédients, du plus dosé au moins dosé), trois noms font débat :",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**[Benzophenone-3](/i/benzophenone-3)** (oxybenzone) : suspecté d'agir comme perturbateur endocrinien, c'est-à-dire de dérégler les hormones. Le comité scientifique européen n'a pas pu trancher dans son [avis de 2021](https://health.ec.europa.eu/publications/benzophenone-3_en), et l'Europe a réduit sa dose maximale ([règlement (UE) 2022/1176](https://eur-lex.europa.eu/eli/reg/2022/1176/oj)).",
        "**[Octocrylene](/i/octocrylene)** : il peut se dégrader lentement en benzophénone dans le flacon, surtout dans un produit qui vieillit ([Downs et al., *Chemical Research in Toxicology*, 2021](https://doi.org/10.1021/acs.chemrestox.0c00461)). L'Europe le juge sûr, mais l'a limité à 10 % dans le même règlement de 2022.",
        "**[Homosalate](/i/homosalate)** : sa dose maximale a été réduite à 7,34 % dans un soin visage par ce règlement de 2022.",
      ],
    },
    {
      type: "p",
      texte:
        "Le bon réflexe n'est donc pas « chimique ou minéral », mais « ++quels filtres précis, et à quelle place dans la liste++ ». Notre article sur [les perturbateurs endocriniens](/blog/perturbateurs-endocriniens-cosmetiques-2026) détaille le statut européen de chacun.",
    },

    { type: "h2", texte: "Erreur 4 : le maquillage avec SPF suffit-il ?" },
    {
      type: "p",
      texte:
        "Rarement. Un fond de teint « SPF 30 » ne protège comme annoncé que si on en met ==autant qu'une crème solaire==, soit une demi-cuillère à café. Personne ne se maquille avec une telle couche. Avec la dose habituelle, et vu l'erreur 1, la protection réelle est bien plus faible que le chiffre.",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "La solution",
      texte:
        "Le maquillage avec SPF est un **bonus**, pas la couche principale. L'ordre reste : sérum, crème, crème solaire, puis maquillage par-dessus. Notre [routine skincare](/blog/routine-skincare) le détaille étape par étape.",
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

    { type: "h2", texte: "Erreur 5 : faut-il mettre de la crème solaire en hiver ?" },
    {
      type: "p",
      texte:
        "Oui. Les UVA, les rayons qui vieillissent la peau, traversent les nuages et les vitres toute l'année. Un essai australien a suivi 903 adultes pendant quatre ans ([Hughes et al., *Annals of Internal Medicine*, 2013](https://pubmed.ncbi.nlm.nih.gov/23732711/)). Ceux qui mettaient une crème solaire chaque jour avaient ==24 % de signes de vieillissement en moins== que ceux qui en mettaient à leur guise.",
    },
    {
      type: "p",
      texte:
        "C'est encore plus vrai si tu utilises un actif qui rend la peau plus sensible au soleil, comme le [rétinol](/blog/retinol) ou un acide exfoliant. Et sur la neige ou en altitude, le soleil d'hiver tape fort, des Alpes aux pistes du Québec.",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "La solution",
      texte:
        "Un SPF 30 à 50 chaque matin, ++toute l'année++. En hiver, une crème solaire hydratante ou teintée fait double emploi. Si ta peau tiraille avec le froid, lis [nos gestes pour la peau sèche](/blog/peau-seche-visage).",
    },

    { type: "h2", texte: "Erreur 6 : pourquoi éviter le parfum dans une crème solaire visage ?" },
    {
      type: "p",
      texte:
        "Le [parfum](/i/parfum) est l'une des premières causes d'allergie aux cosmétiques. Certains de ses composants peuvent aussi réagir à la lumière et marquer la peau, précisément là où tu voulais la protéger.",
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "La solution",
      texte:
        "Sur le visage, choisis une formule **sans parfum** : vérifie l'absence de « Parfum » ou « Fragrance » dans la liste INCI. Garde les crèmes parfumées pour le corps, si tu y tiens.",
    },

    { type: "h2", texte: "Erreur 7 : crème solaire minérale ou chimique, laquelle choisir ?" },
    {
      type: "p",
      texte:
        "Aucune n'est meilleure par nature. Les filtres minéraux (oxyde de zinc, dioxyde de titane) réfléchissent et absorbent les UV ; les filtres chimiques les absorbent. Petit récapitulatif.",
    },
    {
      type: "tableau",
      entetes: ["Type", "Comment il agit", "Avantage", "Limite"],
      lignes: [
        ["**Minéral**.", "Il fait écran aux UV.", "Bien toléré par les peaux réactives.", "Fini souvent blanc, texture plus épaisse."],
        ["**Chimique**.", "Il absorbe les UV.", "Texture invisible et fluide.", "Dépend du filtre choisi (voir l'erreur 3)."],
      ],
    },
    {
      type: "p",
      texte:
        "Les filtres récents comme le Tinosorb S (*Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine*) sont stables et autorisés en Europe. Ce qui compte : la liste INCI, la stabilité de la formule, et surtout la dose que tu mets. Les crèmes solaires d'Asie ont d'autres filtres : notre article sur [les crèmes solaires coréennes](/blog/creme-solaire-coreenne-k-beauty) les compare.",
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

    { type: "h2", texte: "Comment vérifier sa crème solaire avec Cosme Check ?" },
    { type: "p", texte: "Lis la composition, pas la promesse. En dix secondes :" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "**Scanne** le code-barres du tube.",
        "Regarde la couleur de chaque ingrédient : ==vert, jaune, orange ou rouge==.",
        "Repère les filtres discutés (benzophénone, octocrylène, homosalate) et leur place dans la liste.",
        "Compare avec d'autres crèmes solaires du même rayon.",
      ],
    },
    {
      type: "p",
      texte:
        "Notre méthode d'[analyse de composition](/blog/analyse-composition-cosmetique) t'apprend à lire le reste de la liste, ligne par ligne.",
    },
    {
      type: "cta",
      texte:
        "**Vérifie la composition de ta crème solaire.** Télécharge Cosme Check pour voir la note de ton SPF ingrédient par ingrédient et repérer les filtres discutés.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**La bonne dose** : deux doigts, soit une demi-cuillère à café.",
        "**Remise** toutes les deux heures dehors, une fois en journée au bureau.",
        "**Des filtres que tu connais**, et pas de parfum sur le visage.",
        "**Toute l'année**, pas seulement l'été ou à la plage.",
        "**Les filtres précis** comptent plus que « minéral ou chimique ».",
      ],
    },
    {
      type: "p",
      texte:
        "La meilleure crème solaire est celle dont tu mets la bonne quantité, tous les jours, et que tu sais lire. Et si ta peau sèche la tiraille, une crème hydratante dessous, à la glycérine ou à l'[acide hyaluronique](/blog/acide-hyaluronique) (deux ingrédients qui retiennent l'eau), la rend plus agréable à porter.",
    },
  ],
  faq: [
    {
      question: "Quelle quantité de crème solaire mettre sur le visage ?",
      reponse:
        "Compte deux longueurs de doigt (index et majeur), soit environ une demi-cuillère à café pour le visage. C'est la dose utilisée en laboratoire pour mesurer le SPF (2 mg par cm²). Avec moitié moins, la protection réelle chute bien plus que de moitié, comme l'a montré une étude de 2007.",
    },
    {
      question: "Faut-il mettre de la crème solaire en hiver ?",
      reponse:
        "Oui. Les UVA traversent les nuages et les vitres toute l'année, et ce sont eux qui marquent la peau (taches, rides, perte de fermeté). Un SPF 30 à 50 chaque matin suffit en hiver, dans une texture hydratante ou teintée. Sur la neige ou en altitude, remets-en souvent.",
    },
    {
      question: "Le fond de teint SPF suffit-il à protéger la peau ?",
      reponse:
        "Non. Pour atteindre le SPF affiché, il faudrait en mettre une demi-cuillère à café sur le visage, ce que personne ne fait. Avec la dose habituelle, la protection réelle est bien plus faible que le chiffre de l'étiquette. Garde une vraie crème solaire sous le maquillage.",
    },
    {
      question: "Crème solaire minérale ou chimique : laquelle choisir ?",
      reponse:
        "Aucune n'est meilleure par nature. Le minéral convient souvent aux peaux réactives, mais laisse fréquemment un fini blanc. Le chimique offre une texture invisible. Ce qui compte, ce sont les filtres précis de la liste INCI, la stabilité de la formule et la quantité que tu appliques.",
    },
  ],
};

export default article;
