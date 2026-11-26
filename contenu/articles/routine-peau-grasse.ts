import type { Article } from "@/contenu/articles";

/**
 * Publié le 26/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « routines » (`exfolier-visage` sortait de la fenêtre des dix derniers).
 * Volumes du 06/11/2026 (`docs/seo/VOLUMES.md`, moins de 60 jours, pas de
 * nouvelle mesure) : « peau grasse » 1 k à 10 k ; « routine peau grasse »,
 * « routine peau mixte », « peau grasse visage » 100 à 1 k, +900 % sur trois
 * mois. Suggestions Google du jour : « peau grasse que faire », « peau grasse
 * qui tiraille », « peau grasse quel savon utiliser », « peau grasse quelle
 * huile utiliser », « peau grasse déshydratée », « routine peau grasse la
 * roche-posay ». Premiers résultats : Sephora, Aroma-Zone, Charlotte Tilbury,
 * pharmacies en ligne ; aucun ne lit les listes.
 *
 * Chiffres : `cosme_check.catalog_export`, fiches actives, relevé du
 * 26/11/2026 (listes découpées sur les virgules hors parenthèses). 590 fiches
 * avec « peau(x) grasse(s) » dans le nom, 576 avec une liste d'au moins cinq
 * ingrédients, note médiane 11,84. Parfum dans 357. Alcool dénaturé dans 99
 * (51 dans les cinq premiers), médiane 11,52 contre 11,88. 101 nettoyants
 * visage, 29 avec un sulfate dans les cinq premiers (médiane 11,28 contre
 * 12,15). 54 fiches avec un silicone cyclique (Cyclopentasiloxane,
 * Cyclohexasiloxane, Cyclomethicone), médiane 1,31. Couleurs :
 * `cosme_check.ingredients` (D5, D6 et BHT rouges). Les notes citées sont
 * déclarées dans `notes`.
 */
const article: Article = {
  slug: "routine-peau-grasse",
  titre: "Peau grasse : arrête de la décaper (la routine en 4 gestes, et le fini mat qui plombe la note)",
  titreSeo: "Routine peau grasse : 4 gestes, 576 listes lues",
  resume:
    "Une peau grasse se lave doucement, s'hydrate et se protège du soleil. On a lu 576 produits « peau grasse » : les gestes et les listes qui comptent.",
  chapo:
    "Une peau grasse se lave deux fois par jour avec un nettoyant doux, s'hydrate avec un fluide léger et se protège du soleil le matin. ==La décaper ne la rend pas moins grasse==, elle la fait tirailler. Et sur les 576 produits « peau grasse » de notre base, ++les notes les plus basses se cachent dans les promesses de fini mat++.",
  publieLe: "2026-11-26",
  modifieLe: "2026-11-26",
  minutes: 7,
  theme: "routine peau grasse",
  motsCles: [
    "routine peau grasse",
    "peau grasse",
    "peau grasse visage",
    "peau grasse que faire",
    "peau grasse qui tiraille",
    "peau grasse déshydratée",
    "routine peau mixte",
    "peau grasse quel savon utiliser",
    "routine peau grasse la roche-posay",
    "crème hydratante peau grasse",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/routine-peau-grasse.webp",
    alt: "Gros plan en noir et blanc sur un robinet ancien en croix marqué « HOT », au-dessus d'un lavabo flou.",
    largeur: 1024,
    hauteur: 683,
    credit: "Unhindered by Talent, via Flickr",
    licence: "CC BY-SA 2.0",
    source: "https://www.flickr.com/photos/26406919@N00/3582005793",
  },
  blocs: [
    { type: "h2", texte: "Pourquoi une peau grasse brille-t-elle autant ?" },
    {
      type: "p",
      texte:
        "Parce qu'elle fabrique plus de sébum. Le sébum, c'est l'huile naturelle de la peau : de petites glandes le produisent à la base des poils. Il protège la surface et l'empêche de perdre son eau. Quand il y en a trop, le visage brille, surtout sur le front, le nez et le menton (la « zone T »).",
    },
    {
      type: "p",
      texte:
        "La quantité dépend surtout des hormones, de l'âge et de la génétique. La chaleur humide joue aussi : à La Réunion ou aux Antilles, la peau brille plus vite qu'à Montréal en janvier. L'Académie américaine de dermatologie rappelle un bon côté : ce sébum protège la peau ([AAD](https://www.aad.org/public/everyday-care/skin-care-basics/dry/oily-skin)). Le but n'est donc pas de l'effacer, mais de l'équilibrer.",
    },

    { type: "h2", texte: "Combien de fois laver une peau grasse ?" },
    {
      type: "p",
      texte:
        "Deux fois par jour suffit, matin et soir, avec un nettoyant doux. Une petite étude l'a testé sur des jeunes hommes. Deux lavages par jour donnaient de meilleurs résultats qu'un seul, et quatre n'apportaient rien de plus ([Choi et al., *Pediatric Dermatology*, 2006](https://pubmed.ncbi.nlm.nih.gov/17014635/)).",
    },
    {
      type: "p",
      texte:
        "Frotter plus fort ne sert à rien. Selon l'AAD, un nettoyant trop agressif irrite la peau et peut même relancer la production de sébum. Le coupable le plus courant, c'est le sulfate : un agent lavant qui mousse beaucoup et dégraisse fort, comme le **Sodium Laureth Sulfate**. Dans notre base, 29 des 101 nettoyants visage « peau grasse » en ont un dans leurs cinq premiers ingrédients.",
    },
    {
      type: "tableau",
      entetes: ["Nettoyant « peau grasse »", "Ce qui lave", "Note Cosme Check"],
      lignes: [
        ["Avène, Cleanance Hydra Crème Lavante Apaisante (200 ml).", "agents lavants doux (glutamate, glucoside).", "16,64 sur 20."],
        ["Bioderma, Sébium Gel Moussant Actif (100 ml).", "glucosides, avec acide salicylique.", "16,52 sur 20."],
        ["CeraVe, Gel Moussant peaux normales à grasses (236 ml).", "agents doux, avec céramides (des graisses naturelles de la peau) et niacinamide (la vitamine B3).", "12,12 sur 20."],
        ["La Roche-Posay, Effaclar Gel Moussant Purifiant (200 ml).", "Sodium Laureth Sulfate en 2e place.", "11,54 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 26/11/2026.",
    },
    {
      type: "p",
      texte:
        "Un nettoyant reste une minute sur la peau, puis part avec l'eau : sa note compte moins que celle d'une crème. Le gel CeraVe est d'ailleurs [décrypté en détail ici](/blog/cerave-gel-moussant). Le vrai réflexe, c'est l'eau tiède. ++L'eau très chaude dégraisse autant qu'un mauvais savon.++",
    },

    { type: "h2", texte: "Quelle routine pour une peau grasse, matin et soir ?" },
    {
      type: "p",
      texte: "Quatre gestes suffisent. Le reste est du bonus, à ajouter un produit à la fois.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "**Le matin, nettoyer** avec un gel doux, ou juste de l'eau tiède si la peau tiraille.",
        "**Le matin, protéger** : un fluide hydratant léger, puis un SPF 30 ou plus (le SPF, c'est l'indice de protection contre les UV). Une texture gel ou fluide passe bien sur une peau grasse, et il existe des [erreurs qui le rendent inutile](/blog/spf-50-visage-7-erreurs).",
        "**Le soir, démaquiller puis nettoyer** : une [eau micellaire ou une huile démaquillante](/blog/eau-micellaire-ou-huile-demaquillante) si tu portes du maquillage ou de la crème solaire, puis le gel.",
        "**Le soir, un actif, puis le fluide** : niacinamide ou acide salicylique, pas les deux le premier mois. Une [exfoliation douce](/blog/exfolier-visage) une ou deux fois par semaine suffit.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Ton gel nettoyant contient-il un sulfate ?** Scanne-le avec Cosme Check : la liste s'affiche en entier, avec la couleur de chaque ingrédient et la note du produit.",
    },

    { type: "h2", texte: "Une peau grasse doit-elle être hydratée ?" },
    {
      type: "p",
      texte:
        "Oui. Le sébum est de l'huile, pas de l'eau : une peau peut briller et manquer d'eau en même temps. On dit alors qu'elle est « déshydratée ». En hiver, le froid dehors et le chauffage dedans accentuent ce manque. C'est souvent pour ça qu'une peau grasse tiraille après la douche.",
    },
    {
      type: "p",
      texte:
        "Pas besoin d'une crème riche : un fluide ou un gel-crème avec de la glycérine (un ingrédient qui attire l'eau) fait le travail. Et l'alcool n'est pas l'ennemi qu'on croit. La *Pure Active Crème Hydratante Matifiante 3 en 1* de Garnier en contient en 4e place, et obtient ==16,20 sur 20==. Sur nos 576 produits « peau grasse », la note médiane est de 11,52 avec alcool, contre 11,88 sans : presque pareil.",
    },

    { type: "h2", texte: "Quels actifs choisir pour une peau grasse ?" },
    {
      type: "p",
      texte:
        "Deux actifs ont les meilleures preuves en cosmétique. La [niacinamide](/blog/niacinamide), c'est la vitamine B3. À 2 %, elle a réduit le sébum en quatre semaines dans un essai contre placebo ([Draelos et al., *Journal of Cosmetic and Laser Therapy*, 2006](https://pubmed.ncbi.nlm.nih.gov/16766489/)). L'[acide salicylique](/blog/acide-salicylique) est un BHA, un acide qui se dissout dans le gras et nettoie l'intérieur du pore.",
    },
    {
      type: "tableau",
      entetes: ["Soin « peau grasse »", "Actif repéré dans la liste", "Note Cosme Check"],
      lignes: [
        ["Garnier, Pure Active Crème Hydratante Matifiante 3 en 1 (50 ml).", "niacinamide en 2e place, acide salicylique.", "16,20 sur 20."],
        ["The Ordinary, Niacinamide 10 % + Zinc 1 % (30 ml).", "niacinamide en 2e place, zinc.", "11,48 sur 20."],
        ["La Roche-Posay, Effaclar Duo+M (40 ml).", "acide salicylique en 1re place, niacinamide en 6e.", "7,81 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 26/11/2026.",
    },
    {
      type: "p",
      texte:
        "La note lit toute la formule, pas seulement l'actif. Le Duo+M perd des points sur une série d'ingrédients classés orange, comme le Polysorbate 80. Pour repérer ceux qui bouchent les pores, relis notre guide des [ingrédients comédogènes](/blog/comedogene) (un comédon, c'est un pore bouché : le point noir ou le point blanc).",
    },

    { type: "h2", texte: "Pourquoi tant de soins matifiants ont-ils une note si basse ?" },
    {
      type: "p",
      texte:
        "C'est la surprise de nos listes. 54 produits « peau grasse » contiennent un silicone cyclique : **Cyclopentasiloxane** (D5) ou **Cyclohexasiloxane** (D6). Ces silicones s'évaporent et laissent un fini mat et sec, parfait sur une zone T qui brille. Leur note médiane : ==1,31==. Sur les 56 produits « peau grasse » notés sous 3, 42 en contiennent, et 37 sont des fonds de teint.",
    },
    {
      type: "p",
      texte:
        "Le *Sébium Mat Control* de Bioderma met le D5 en 3e place et le D6 en 5e : il obtient 1,22 sur 20. L'Europe interdit ces deux silicones à partir de 0,1 % dans les soins sans rinçage dès le 6 juin 2027 ([règlement (UE) 2024/1328](https://eur-lex.europa.eu/eli/reg/2024/1328/oj)). On les avait déjà croisés dans une [crème « collagène »](/blog/creme-collagene). Même gamme, autre verdict : le gel moussant Sébium plafonne à 16,52.",
    },
    {
      type: "p",
      texte:
        "Autre piège : l'eau micellaire *Effaclar purifiante* de La Roche-Posay obtient 1,51 sur 20. Elle contient du **BHT**, un conservateur antioxydant classé rouge dans Cosme Check. ++Le nom de la gamme ne dit rien de la note du flacon.++",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ne décape pas : savon très moussant, eau chaude, gommage tous les jours.",
        "Ne saute pas la crème hydratante parce que la peau brille.",
        "Ne cumule pas trois actifs d'un coup : la peau rougit, et tu ne sauras pas lequel en est la cause.",
        "Des boutons qui font mal, qui laissent des marques ou qui ne partent pas : parles-en à un dermatologue, aucune routine ne remplace son avis.",
      ],
    },
    {
      type: "encadre",
      titre: "Ce qu'il faut retenir",
      texte:
        "Deux lavages doux, un fluide léger, un SPF le matin, un seul actif le soir. Et pour le mat, ++un papier matifiant dans la poche fait mieux qu'un soin plein de silicones bientôt interdits++.",
      ton: "emeraude",
    },
    {
      type: "p",
      texte:
        "Un doute entre peau grasse et peau mixte ? Fais d'abord le [test de ton type de peau](/blog/type-de-peau). Puis regarde comment ranger tes produits dans [l'ordre d'une routine skincare](/blog/routine-skincare).",
    },
  ],
  faq: [
    {
      question: "Peau grasse : que faire ?",
      reponse:
        "Lave ton visage deux fois par jour avec un nettoyant doux et de l'eau tiède, hydrate-le avec un fluide léger, et mets un SPF le matin. Le soir, ajoute un seul actif, comme la niacinamide ou l'acide salicylique. Évite les nettoyants qui décapent : ils irritent la peau sans la rendre moins grasse.",
    },
    {
      question: "Pourquoi ma peau grasse tiraille ?",
      reponse:
        "Souvent parce qu'elle manque d'eau, pas de gras : on dit qu'elle est déshydratée. Un nettoyant trop fort, l'eau chaude, le froid et le chauffage en sont les causes les plus courantes. Passe à un nettoyant doux, rince à l'eau tiède et applique un fluide hydratant juste après, sur une peau encore un peu humide.",
    },
    {
      question: "Peau grasse : quel savon utiliser ?",
      reponse:
        "Un gel ou une crème lavante doux, sans sulfate dans les premiers ingrédients. Dans notre base, la crème lavante Cleanance Hydra d'Avène (16,64) et le gel moussant Sébium de Bioderma (16,52) ont les meilleures notes du lot. Un savon très moussant dégraisse fort et peut faire tirailler la peau.",
    },
    {
      question: "Peau grasse : quelle huile utiliser ?",
      reponse:
        "Une huile légère peut convenir, en petite quantité : l'huile de jojoba et le squalane sont notés très bas sur les échelles de comédogénicité. Évite les huiles épaisses, comme l'huile de coco, sur une peau qui fait des points noirs. Une huile ne remplace pas un fluide hydratant, qui apporte de l'eau.",
    },
  ],
  notes: [
    {
      produit: "Avène, Cleanance Hydra Crème Lavante Apaisante (200 ml)",
      ean: "3282770390476",
      note: 16.64,
      releveeLe: "2026-11-26",
    },
    {
      produit: "Bioderma, Sébium Gel Moussant Actif (100 ml)",
      ean: "3701129811313",
      note: 16.52,
      releveeLe: "2026-11-26",
    },
    {
      produit: "Garnier, Pure Active Crème Hydratante Matifiante 3 en 1 (50 ml)",
      ean: "3600542572873",
      note: 16.2,
      releveeLe: "2026-11-26",
    },
    {
      produit: "CeraVe, Gel Moussant Peaux Normales à Grasses (236 ml)",
      ean: "3337875597128",
      note: 12.12,
      releveeLe: "2026-11-26",
    },
    {
      produit: "La Roche-Posay, Effaclar Gel Moussant Purifiant (200 ml)",
      ean: "3337872411083",
      note: 11.54,
      releveeLe: "2026-11-26",
    },
    {
      produit: "The Ordinary, Niacinamide 10 % + Zinc 1 % (30 ml)",
      ean: "0769915195941",
      note: 11.48,
      releveeLe: "2026-11-26",
    },
    {
      produit: "La Roche-Posay, Effaclar Duo+M (40 ml)",
      ean: "3337875872034",
      note: 7.81,
      releveeLe: "2026-11-26",
    },
    {
      produit: "La Roche-Posay, Effaclar Eau Micellaire Purifiante",
      ean: "3433422408357",
      note: 1.51,
      releveeLe: "2026-11-26",
    },
    {
      produit: "Bioderma, Sébium Mat Control Soin Hydratant Anti-brillance (30 ml)",
      ean: "3401381682361",
      note: 1.22,
      releveeLe: "2026-11-26",
    },
  ],
};

export default article;
