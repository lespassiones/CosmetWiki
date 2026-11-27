import type { Article } from "@/contenu/articles";

/**
 * Publié le 19/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz » (`rhode-hailey-bieber-composition` sortait de la fenêtre des dix
 * derniers) : la Volufiline, l'ingrédient « filler en flacon » de TikTok,
 * relancé cette semaine par la presse (HELLO!, 18/11/2026) et par le sérum
 * The Ordinary vendu chez Sephora France et Suisse. Volume (`VOLUMES.md`) :
 * « volufiline » 10 k à 100 k (22/10/2026, moins de 60 jours). Suggestions
 * Google du jour : « volufiline avis », « danger », « c'est quoi »,
 * « the ordinary avis », « comment utiliser la volufiline ». Premiers
 * résultats français : Elle Belgique (01/07/2026), Hypebae, des boutiques ;
 * aucun ne lit de liste d'ingrédients.
 *
 * Chiffres : `cosme_check.catalog_export`, fiches actives, relevé du
 * 19/11/2026, recherche de « Anemarrhena Asphodeloides Root Extract » (la
 * plante de la Volufiline) dans la liste INCI : 210 fiches, dont 176 avec
 * aussi Hydrogenated Polyisobutene (l'huile qui la porte), 146 à code-barres
 * coréen (880), 34 pour les lèvres, 18 pour les yeux, 11 pour le buste ;
 * place médiane 29e, 11 dans les dix premiers ; note médiane 8,38. Les notes
 * de produits citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "volufiline",
  titre: "Volufiline, le « filler en flacon » de TikTok : sa seule étude a été faite sur des seins, pas sur des visages (on a lu 210 listes)",
  titreSeo: "Volufiline : avis, composition et vrais effets",
  resume:
    "La Volufiline promet un effet « filler » sans aiguille. Sa seule étude, ce que contient vraiment le sérum « 92 % », et ce qu'on lit dans 210 listes.",
  chapo:
    "La Volufiline est un extrait de plante dilué dans une huile de synthèse, vendu comme un « filler en flacon ». Son unique étude publiée vient de son fabricant et a mesuré ==2,2 % de volume en plus, sur un sein, après deux mois==. ++Dans le sérum « 92 % », la plante elle-même pèse 1 % au plus.++",
  publieLe: "2026-11-19",
  modifieLe: "2026-11-27",
  minutes: 7,
  theme: "volufiline",
  motsCles: [
    "volufiline",
    "volufiline avis",
    "volufiline c'est quoi",
    "volufiline danger",
    "volufiline the ordinary avis",
    "comment utiliser la volufiline",
    "anemarrhena asphodeloides",
    "filler sans aiguille",
    "volufiline lèvres",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/volufiline.webp",
    alt: "Un petit flacon de sérum en verre ambré, avec une pipette noire et une étiquette vierge, posé sur un fond blanc.",
    largeur: 1024,
    hauteur: 683,
    credit: "Auteur inconnu, via rawpixel",
    licence: "CC0",
    source: "https://www.rawpixel.com/image/11515770/dropper-bottle-blank-retro-label",
  },
  blocs: [
    { type: "h2", texte: "La Volufiline, c'est quoi ?" },
    {
      type: "p",
      texte:
        "La Volufiline est un ingrédient tout prêt, vendu aux marques par la société française Sederma. C'est un extrait de racine d'une plante chinoise, l'*Anemarrhena asphodeloides*, mélangé à une huile. Le nom est une marque déposée, et The Ordinary précise sur [sa page produit](https://theordinary.com/fr-fr/volufiline-92-pal-isoleucine-1pct-plumping-serum-100724.html) ne pas être lié à Sederma.",
    },
    {
      type: "p",
      texte:
        "Sur la liste INCI (la liste officielle des ingrédients, écrite du plus dosé au moins dosé), tu ne liras jamais « Volufiline ». Tu liras deux noms : **Hydrogenated Polyisobutene**, une huile de synthèse qui rend la peau douce et brillante, et **Anemarrhena Asphodeloides Root Extract**, la plante.",
    },
    {
      type: "fiche",
      titre: "Volufiline",
      inci: "HYDROGENATED POLYISOBUTENE (et) ANEMARRHENA ASPHODELOIDES ROOT EXTRACT",
      niveau: "incertain",
      effet:
        "Selon son fabricant, la plante pousserait les cellules de graisse sous la peau à grossir. Une seule petite étude, faite par le fabricant, sur la poitrine.",
      statut:
        "Ingrédient cosmétique autorisé dans l'Union européenne, sans limite propre dans les annexes du règlement (CE) 1223/2009.",
    },

    { type: "h2", texte: "Pourquoi on l'appelle le « filler en flacon » ?" },
    {
      type: "p",
      texte:
        "Parce qu'elle promet du volume, comme une injection. Un filler, c'est un produit de comblement, souvent de l'acide hyaluronique, injecté par un médecin pour regonfler une joue ou une lèvre. Sur TikTok, des vidéos présentent la Volufiline comme la même chose, en crème et sans aiguille.",
    },
    {
      type: "p",
      texte:
        "L'idée vient du fabricant. Sederma dit que la sarsasapogénine, la molécule clé de la plante, stimulerait le développement des adipocytes, les cellules qui stockent la graisse sous la peau ([Elle Belgique, 01/07/2026](https://www.elle.be/fr/473761-volufiline-magie-des-fillers-sans-aiguilles.html)).",
    },

    { type: "h2", texte: "Que dit vraiment l'étude sur la Volufiline ?" },
    {
      type: "p",
      texte:
        "Pas grand-chose, et elle ne parle pas du visage. L'étude la plus citée a été faite par Sederma elle-même. ==28 femmes== ont appliqué une crème à 5 % de Volufiline ++sur un seul sein++, pendant 56 jours. Résultat : 2,2 % de volume en plus en moyenne, selon [Marie Claire (03/07/2026)](https://www.marieclaire.com/beauty/skincare/volufiline-ingredient-benefits-risks).",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Une seule petite étude, payée par le fabricant, sans revue indépendante.",
        "La peau du sein n'est pas celle du visage, et le volume d'un sein varie déjà au fil du mois.",
        "Le dermatologue Karan Lal juge ce 2,2 % « non significatif » (cité par Elle Belgique).",
        "La dermatologue Heidi Waldorf rappelle que la sarsasapogénine a d'abord été étudiée pour le diabète, pas pour la peau, et juge l'usage en cosmétique « prématuré ».",
      ],
    },
    {
      type: "encadre",
      ton: "ambre",
      titre: "À retenir",
      texte:
        "Aucune crème ne remplace une injection. La Volufiline peut lisser un peu la peau, mais rien ne prouve qu'elle rend du volume à un visage.",
    },

    { type: "h2", texte: "Que contient le sérum Volufiline 92 % de The Ordinary ?" },
    {
      type: "p",
      texte:
        "Sept ingrédients, et surtout de l'huile. Le « 92 % » veut dire que le flacon contient 92 % de l'ingrédient Volufiline, donc 92 % du mélange huile et plante. Pas 92 % de plante.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Hydrogenated Polyisobutene (l'huile de synthèse de la Volufiline).",
        "Caprylyl Glycol (il hydrate et aide à conserver).",
        "Polyglyceryl-3 Stearate (il lie le mélange).",
        "Palmitoyl Isoleucine (le « Pal-Isoleucine 1 % » du nom).",
        "Anemarrhena Asphodeloides Root Extract (la plante).",
        "Rhus Succedanea Fruit Wax (une cire végétale).",
        "Tocopherol (la vitamine E, qui protège l'huile).",
      ],
    },
    {
      type: "p",
      texte:
        "Regarde la quatrième ligne. Le règlement européen impose d'écrire les ingrédients du plus dosé au moins dosé, mais ceux à 1 % ou moins peuvent venir dans n'importe quel ordre ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). La Palmitoyl Isoleucine est à 1 %, comme l'annonce le nom. La plante vient après : ++elle pèse donc 1 % au plus du sérum++.",
    },
    {
      type: "p",
      texte:
        "Ce que tu sens tout de suite sur la peau, c'est surtout l'huile : elle lisse et fait briller. Dans la base Cosme Check, le sérum obtient 12,06 sur 20, avec un ingrédient classé orange.",
    },
    {
      type: "cta",
      texte:
        "**Ton sérum « repulpant » contient-il vraiment la plante ?** Scanne-le avec Cosme Check : tu vois en dix secondes la place de chaque ingrédient dans la liste, et sa couleur.",
    },

    { type: "h2", texte: "Où trouve-t-on la Volufiline dans notre base ?" },
    {
      type: "p",
      texte:
        "Dans 210 produits, et rarement en haut de la liste. On a cherché le nom de la plante dans toutes les listes de la base, le 19/11/2026. Près de sept produits sur dix viennent de Corée du Sud.",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Produits qui contiennent la plante de la Volufiline.", "210."],
        ["Dont ceux qui ont aussi son huile, Hydrogenated Polyisobutene.", "176."],
        ["Place médiane de la plante dans la liste.", "29e."],
        ["Produits qui la placent dans les dix premiers ingrédients.", "11."],
        ["Produits pour les lèvres, les yeux et le buste.", "34, 18 et 11."],
        ["Note médiane Cosme Check, sur 20.", "8,38."],
      ],
      legende: "Base Cosme Check, fiches actives, relevé du 19/11/2026.",
    },
    {
      type: "p",
      texte:
        "Les crèmes pour le buste ne sont pas un hasard : c'est le premier usage de la Volufiline, celui de son étude. On la trouve par exemple dans le Push me Up de Pupa (12,38 sur 20), en 42e place sur 45. Comme pour le [peptide de cuivre](/blog/peptide-de-cuivre) ou le [PDRN](/blog/pdrn), l'ingrédient vedette arrive souvent tout en bas.",
    },
    {
      type: "p",
      texte:
        "Les notes vont de très bas à correct. La Peptide 9 Volume Essence Pro de Medi-Peel obtient 1,47 sur 20, l'Intensive Volufiline Spray Ampoule de d'Alba 12,48. La note dépend du reste de la liste, pas de la Volufiline.",
    },

    { type: "h2", texte: "La Volufiline repulpe-t-elle les lèvres ?" },
    {
      type: "p",
      texte:
        "Rien ne le montre. Dans nos baumes, gloss et masques pour les lèvres (relevé du 27/11/2026), ==25 produits== contiennent sa plante : en 19e place médiane, et cinq fois en dernière place.",
    },
    {
      type: "p",
      texte:
        "Ce que tu sens vient d'ailleurs : 13 d'entre eux ajoutent un ingrédient qui chauffe ou rafraîchit. Le *Reedle Shot Lip Plumper Expert* de VT met **Menthyl Lactate** et **Vanillyl Butyl Ether** en 6e et 7e place, la plante en 18e (12,56 sur 20). ++Le picotement gonfle un peu la lèvre en l'irritant, pour quelques heures.++",
    },
    {
      type: "p",
      texte:
        "Le *Super Lustrous Glimmer Gloss* « repulpant » de Revlon obtient 7,81 sur 20 (parfum, BHT). Sur des lèvres sèches, un repulpant qui picote est un mauvais choix : voici les baumes qui conviennent aux [lèvres gercées](/blog/levres-gercees).",
    },

    { type: "h2", texte: "La Volufiline est-elle dangereuse ?" },
    {
      type: "p",
      texte:
        "Rien ne le montre aux doses des cosmétiques. Elle est autorisée en Europe, et on n'a trouvé aucune alerte officielle à son sujet. Le vrai risque est ailleurs : ++payer pour un volume qui ne viendra pas++, ou laisser une crème retarder un vrai avis.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Fais un test : un peu de produit derrière l'oreille ou dans le pli du coude, et attends 48 heures.",
        "Une peau qui picote ou rougit : arrête et lis le reste de la liste, le parfum est souvent en cause.",
        "Un visage qui se creuse vite ou une perte de poids sans raison : parles-en à un médecin, pas à un sérum.",
      ],
    },

    { type: "h2", texte: "Que mettre à la place pour une peau plus rebondie ?" },
    {
      type: "p",
      texte:
        "De l'eau, bien retenue. Une peau hydratée paraît plus pleine et plus lisse, et c'est prouvé. La [glycérine](/blog/glycerine) attire l'eau dans la peau et se trouve dans 8 crèmes hydratantes sur 10. L'[acide hyaluronique](/blog/acide-hyaluronique) retient l'eau en surface. Une crème qui met l'un des deux en haut de liste fait déjà ce que la Volufiline promet en surface.",
    },
    {
      type: "p",
      texte:
        "Le dernier geste est le plus simple : lis la liste avant le slogan. Avec [notre méthode en 5 étapes](/blog/analyse-composition-cosmetique), tu sais en une minute si l'actif de la boîte est en tête ou en 29e place. Pour la Volufiline, ++le chiffre écrit en gros sur le flacon parle surtout de l'huile++.",
    },
  ],
  faq: [
    {
      question: "Volufiline c'est quoi ?",
      reponse:
        "C'est un ingrédient cosmétique de la société Sederma : un extrait de racine d'*Anemarrhena asphodeloides* dans une huile de synthèse, l'Hydrogenated Polyisobutene. Le fabricant dit qu'il aide les cellules de graisse sous la peau à grossir. Il est vendu comme un « filler sans aiguille », mais une seule petite étude l'a testé, sur la poitrine.",
    },
    {
      question: "Volufiline The Ordinary avis : ça marche ?",
      reponse:
        "Le sérum lisse la peau grâce à son huile, mais rien ne prouve qu'il rend du volume au visage. Le « 92 % » désigne le mélange huile et plante. La plante vient après un ingrédient dosé à 1 %, donc elle pèse 1 % au plus. Dans Cosme Check, il obtient 12,06 sur 20.",
    },
    {
      question: "La volufiline est-elle dangereuse ?",
      reponse:
        "Rien ne le montre aux doses des cosmétiques : elle est autorisée en Europe et aucune alerte officielle ne la vise. Fais un test sur une petite zone pendant 48 heures. Si ta peau picote ou rougit, arrête. Un visage qui se creuse vite mérite l'avis d'un médecin, pas un sérum.",
    },
    {
      question: "Comment utiliser la volufiline ?",
      reponse:
        "Quelques gouttes sur une peau propre, le soir ou le matin, en tapotant les zones visées, puis ta crème hydratante. Comme c'est surtout une huile, elle se met après les sérums à l'eau. Le matin, termine par une crème solaire. N'attends pas l'effet d'une injection : au mieux, la peau paraît plus lisse.",
    },
  ],
  notes: [
    { produit: "The Ordinary, Volufiline 92% + Pal-Isoleucine 1% Serum (15 ml)", ean: "0769915236460", note: 12.06, releveeLe: "2026-11-19" },
    { produit: "PUPA Milano, Push me Up #fast Volumisant pour les Seins Action Rapide (75 ml)", ean: "8011607362776", note: 12.38, releveeLe: "2026-11-19" },
    { produit: "Medi-Peel, Peptide 9 Volume Tout En Un Essence Pro (100 ml)", ean: "8809941820386", note: 1.47, releveeLe: "2026-11-19" },
    { produit: "VT Cosmetics, Reedle Shot Lip Plumper Expert (4,3 g)", ean: "8803463006501", note: 12.56, releveeLe: "2026-11-27" },
    { produit: "Revlon, Super Lustrous Glimmer Gloss Repulpant 001 Diamond Drama (3,8 ml)", ean: "0309970174125", note: 7.81, releveeLe: "2026-11-27" },
    { produit: "d'Alba, Intensive Volufiline Spray Ampoule (50 ml)", ean: "8809563069026", note: 12.48, releveeLe: "2026-11-19" },
  ],
};

export default article;
