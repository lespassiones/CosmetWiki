import type { Article } from "@/contenu/articles";

/**
 * Publié le 25/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » (`acide-glycolique` sortait de la fenêtre des dix
 * derniers). Volumes du 22/11/2026 et du 24/11/2026 (France, `docs/seo/VOLUMES.md`,
 * moins de 60 jours, pas de nouvelle mesure) : « creme collagene visage »,
 * « creme visage collagene » 1 k à 10 k, +900 % sur trois mois ; « crème
 * collagène », « creme au collagene » 1 k à 10 k. Suggestions Google du jour :
 * « crème collagène visage efficace », « crème collagène lissante krème
 * pharmacie », « crème au collagène en pharmacie », « collagene creme ou
 * gelule », « crème collagène et acide hyaluronique ». Premiers résultats :
 * Aroma-Zone, comparatifs affiliés, revendeurs ; aucun ne compte les listes.
 *
 * Chiffres : `cosme_check.catalog_export`, fiches actives, relevé du
 * 25/11/2026 (listes découpées sur les virgules hors parenthèses). 3 209
 * fiches avec « collag » dans le nom ; 998 sans aucun ingrédient « COLLAG… »
 * dans la liste ; 2 202 avec collagène (hors « Collagen Water »), place
 * médiane 13e, 269 dans les cinq premiers, 515 avec le parfum avant le
 * collagène. Soins visage (anti-âge, crèmes hydratantes, yeux) : 1 926, dont
 * 639 sans collagène, dont 330 avec un peptide ; note médiane 11,88 avec
 * collagène, 12,23 sans. Marques : Vichy 26 fiches sur 26 sans collagène,
 * Olay 33 sur 34, L'Oréal 87 sur 105, Elemis 41 sur 89, Krème 7 sur 8.
 * Couleurs : `cosme_check.ingredients` (Cyclopentasiloxane et
 * Cyclohexasiloxane rouges). Les notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "creme-collagene",
  titre: "Crème au collagène : un produit sur trois n'en contient pas une goutte (et ce n'est pas le pire)",
  titreSeo: "Crème collagène visage : efficace ou pas ?",
  resume:
    "On a lu 3 209 listes de produits « collagène » : un sur trois n'en contient pas, et celui qui en contient ne passe pas la peau. Ce qui compte vraiment.",
  chapo:
    "Une crème au collagène hydrate la surface de la peau, mais son collagène ne rejoint pas celui de ton visage : la molécule est bien trop grosse. Et souvent, il n'y en a même pas : sur 3 209 produits « collagène » de notre base, ==998 n'en contiennent aucun==. ++La meilleure note du lot va d'ailleurs à une crème sans collagène.++",
  publieLe: "2026-11-25",
  modifieLe: "2026-11-25",
  minutes: 7,
  theme: "crème au collagène",
  motsCles: [
    "crème collagène",
    "crème au collagène",
    "crème collagène visage",
    "crème collagène visage efficace",
    "crème au collagène en pharmacie",
    "crème collagène lissante",
    "collagène crème ou gélule",
    "collagen specialist",
    "pro-collagène",
    "collagène végétal",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/creme-collagene.webp",
    alt: "Gros plan sur une gelée rouge en forme de couronne, démoulée, brillante et translucide, aux bords ondulés.",
    largeur: 1200,
    hauteur: 900,
    credit: "SutKartonu, via Wikimedia Commons",
    licence: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:Jelly_Dessert_Shaped_in_Bundt_Pan.jpg",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, le collagène ?" },
    {
      type: "p",
      texte:
        "Le collagène est une protéine qui sert de charpente à la peau. Il vit dans le derme, la couche profonde sous la surface. Sa molécule est géante : trois longues chaînes enroulées comme une corde ([Shoulders et Raines, *Annual Review of Biochemistry*, 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2846778/)). Avec l'âge et le soleil, la peau en fabrique moins et en perd plus.",
    },
    {
      type: "p",
      texte:
        "Tu en manges sans le savoir : la gélatine des bonbons et des desserts, c'est du collagène cuit. Dans les cosmétiques, on le lit sur la liste INCI (la liste officielle des ingrédients, du plus dosé au moins dosé) sous les noms **Collagen**, **Soluble Collagen**, **Hydrolyzed Collagen** ou **Atelocollagen**.",
    },
    {
      type: "fiche",
      titre: "Collagène",
      inci: "COLLAGEN, SOLUBLE COLLAGEN, HYDROLYZED COLLAGEN",
      niveau: "prouve",
      effet:
        "Retient l'eau à la surface de la peau et laisse un toucher doux. Trop gros pour atteindre le derme, il ne remplace pas le collagène de la peau.",
      statut: "Autorisé dans les cosmétiques en Europe, classé vert dans Cosme Check.",
    },

    { type: "h2", texte: "Une crème au collagène est-elle efficace ?" },
    {
      type: "p",
      texte:
        "Oui pour hydrater, non pour « recharger » ta peau en collagène. Pour traverser la surface de la peau, une molécule doit peser moins de 500 daltons environ (le dalton est l'unité qui sert à peser les molécules). C'est la règle des 500 daltons ([Bos et Meinardi, *Experimental Dermatology*, 2000](https://pubmed.ncbi.nlm.nih.gov/10839713/)). Le collagène la dépasse de très loin, même coupé en morceaux (« hydrolysé »).",
    },
    {
      type: "p",
      texte:
        "Il reste donc en surface. Là, il fait un vrai travail : il attire l'eau, comme un humectant, et forme un film léger. La peau paraît plus lisse, ++le temps qu'elle reste hydratée++. Même [Aroma-Zone, qui en vend](https://www.aroma-zone.com/page/creme-au-collagene-pour-le-visage-pourquoi-et-comment-ladopter), écrit qu'une crème au collagène ne peut pas renflouer les réserves de la peau.",
    },

    { type: "h2", texte: "Combien de crèmes « collagène » n'en contiennent pas ?" },
    {
      type: "p",
      texte:
        "Un produit sur trois. Notre base compte 3 209 produits avec « collagène » ou « collagen » dans leur nom. ==998 n'ont aucune forme de collagène dans leur liste.== Chez les autres, il arrive en 13e place en médiane (la médiane, c'est la valeur du milieu). Et dans 515 produits, il vient même après le parfum.",
    },
    {
      type: "tableau",
      entetes: ["Gamme", "Fiches « collagène » de la base", "Sans collagène dans la liste"],
      lignes: [
        ["Vichy, Liftactiv Collagen Specialist (et Dercos).", "26.", "26."],
        ["Olay, Regenerist Collagen Peptide 24.", "34.", "33."],
        ["L'Oréal Paris (Age Perfect, Revitalift, Elvive…).", "105.", "87."],
        ["Elemis, Pro-Collagen.", "89.", "41."],
        ["Krème, Collagène Lissante.", "8.", "7."],
      ],
      legende: "Fiches actives de la base Cosme Check, relevé du 25/11/2026.",
    },
    {
      type: "p",
      texte:
        "Ce n'est pas forcément trompeur. Un nom comme « Collagen Specialist » ou « Pro-Collagen » parle du collagène de ta peau, pas de celui du pot. En Europe, une allégation doit être honnête et prouvée, nom du produit compris ([règlement (UE) n° 655/2013](https://eur-lex.europa.eu/eli/reg/2013/655/oj?locale=fr)). Mais si tu achètes une crème pour son collagène, ++lis la liste avant le nom++.",
    },
    {
      type: "p",
      texte:
        "Le « collagène végétal » mérite la même méfiance. Les plantes ne fabriquent pas de collagène : c'est une protéine animale. Chez Yves Rocher, le « collagène végétal » est un extrait de bugle rampante (*Ajuga Reptans*). Chez Krème, sept fiches sur huit n'ont pas de collagène dans leur liste : la crème porte une protéine végétale hydrolysée en 11e place.",
    },

    { type: "h2", texte: "Qu'est-ce qu'il y a à la place du collagène ?" },
    {
      type: "p",
      texte:
        "Souvent des peptides. Un peptide est un petit bout de protéine, assez court pour qu'on lui prête un rôle de messager. Sur les 639 soins du visage « collagène » sans collagène de notre base, ==330 contiennent un peptide==.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "**Olay Collagen Peptide 24** mise sur le **Palmitoyl Pentapeptide-4**, en 10e place. Une étude de 12 semaines sur 93 femmes a mesuré moins de rides et de ridules qu'avec la même crème sans peptide ([Robinson et al., 2005](https://pubmed.ncbi.nlm.nih.gov/18492182/)). Elle a été menée par le fabricant.",
        "**Vichy Liftactiv Collagen Specialist** associe trois peptides (à partir de la 17e place), de la [niacinamide](/blog/niacinamide) en 8e place et une forme de vitamine C.",
        "**Nivea Q10 Expert Collagène** ajoute un peptide et l'Acetyl Hydroxyproline, un dérivé d'un acide aminé du collagène, à côté de sa [coenzyme Q10](/blog/nivea-q10).",
        "**Elemis Pro-Collagen** compte sur une algue brune, *Padina Pavonica*, en 29e place.",
      ],
    },
    {
      type: "p",
      texte:
        "Les peptides ont des preuves modestes, souvent apportées par les marques. Les actifs les mieux étudiés pour aider la peau à garder son collagène restent le [rétinol](/blog/retinol) (un dérivé de la vitamine A), la vitamine C et, surtout, la crème solaire.",
    },
    {
      type: "cta",
      texte:
        "**Ta crème « collagène » en contient-elle vraiment ?** Scanne-la avec Cosme Check : la liste s'affiche en entier, avec la couleur de chaque ingrédient et la note du produit.",
    },

    { type: "h2", texte: "Quelle crème au collagène a la meilleure note ?" },
    {
      type: "p",
      texte:
        "Pas celle qui en contient le plus. Sur les 1 926 soins du visage « collagène » de la base, la note médiane est de 11,88 avec du collagène et de 12,23 sans. Les crèmes de jour avec un SPF (l'indice de protection contre les UV) perdent souvent des points à cause de leurs filtres. Neuf produits connus, relevés le 25/11/2026.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Collagène dans la liste", "Note Cosme Check"],
      lignes: [
        ["Nivea, Q10 Expert Collagène Baume riche jour et nuit.", "aucun.", "16,62 sur 20."],
        ["Krème, Crème Collagène Lissante.", "aucun (protéine végétale en 11e).", "16,51 sur 20."],
        ["Yves Rocher, Lift Pro-collagène Sérum.", "aucun.", "16,39 sur 20."],
        ["Cien (Lidl), Collagen Effect.", "15e sur 31.", "16,08 sur 20."],
        ["Elemis, Pro-Collagen Marine Crème ultra-riche.", "aucun.", "7,81 sur 20."],
        ["Olay, Collagen Peptide 24 crème de jour.", "aucun.", "7,73 sur 20."],
        ["Vichy, Liftactiv Collagen Specialist crème.", "aucun.", "7,72 sur 20."],
        ["L'Oréal Paris, Age Perfect Collagen Expert SPF 30.", "aucun.", "7,39 sur 20."],
        ["Medicube, Triple Collagen Cream.", "19e sur 68.", "1,59 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 25/11/2026.",
    },
    {
      type: "p",
      texte:
        "La note lit toute la formule, pas le nom. La Triple Collagen Cream de Medicube contient bien du collagène, mais aussi deux silicones classés rouges, dont le **Cyclopentasiloxane** en 5e place. L'Europe les interdit à partir de 0,1 % dans les soins sans rinçage dès le 6 juin 2027 ([règlement (UE) 2024/1328](https://eur-lex.europa.eu/eli/reg/2024/1328/oj)). Pour lire une liste toi-même, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },

    { type: "h2", texte: "Comment choisir une crème au collagène ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Achète-la pour ce qu'elle fait vraiment : hydrater. Une [crème hydratante bien choisie](/blog/meilleures-cremes-hydratantes-visage) fait le même travail.",
        "Cherche « Collagen » dans la liste si c'est lui que tu veux, et regarde sa place.",
        "Pour la fermeté, regarde plutôt les actifs suivis : rétinol le soir, vitamine C ou peptides.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Un nom « Collagen », « Pro-Collagen » ou « Booster de collagène » ne dit rien de la liste.",
        "« Collagen Water » en tête de liste, comme chez Biodance, c'est surtout de l'eau : le vrai collagène arrive bien plus bas, comme dans son [masque Bio-Collagen](/blog/masque-biodance).",
        "Une peau qui se relâche vite ou change d'un coup : parles-en à un dermatologue, aucune crème ne remplace son avis.",
      ],
    },
    {
      type: "encadre",
      titre: "Ce qu'il faut retenir",
      texte:
        "Le collagène d'une crème hydrate la surface, rien de plus. ++Le geste qui protège vraiment le collagène de ta peau, c'est la crème solaire.++ Une seule exposition aux UV augmente les enzymes qui le découpent ([Fisher et al., *New England Journal of Medicine*, 1997](https://pubmed.ncbi.nlm.nih.gov/9358139/)).",
      ton: "emeraude",
    },
    {
      type: "p",
      texte:
        "Le soir, si tu veux un actif, mise sur le [rétinol](/blog/retinol) ou le [peptide de cuivre](/blog/peptide-de-cuivre). Le matin, ==un SPF 30 ou plus, tous les jours==, même en hiver : et évite [les 7 erreurs qui le rendent inutile](/blog/spf-50-visage-7-erreurs).",
    },
  ],
  faq: [
    {
      question: "Une crème au collagène est-elle efficace ?",
      reponse:
        "Elle est efficace pour hydrater : le collagène attire l'eau et forme un film doux à la surface. Elle ne remplace pas le collagène de ta peau, car la molécule est trop grosse pour atteindre le derme. Et un produit « collagène » sur trois n'en contient pas : dans ce cas, ce sont les autres ingrédients qui travaillent.",
    },
    {
      question: "Collagène : crème ou gélule ?",
      reponse:
        "Ce sont deux mondes. La crème est un cosmétique : son collagène reste à la surface et hydrate. La gélule est un complément alimentaire : le collagène est digéré, c'est-à-dire découpé en petits morceaux. Cosme Check ne note que les cosmétiques. Pour une gélule, demande conseil à ton pharmacien ou à ton médecin, surtout si tu suis un traitement.",
    },
    {
      question: "Où trouver une crème au collagène en pharmacie ?",
      reponse:
        "Presque toutes les grandes marques de pharmacie en ont une, mais beaucoup ne contiennent pas de collagène : aucune des 26 fiches Vichy « collagène » de notre base n'en contient, Liftactiv Collagen Specialist compris. Ce n'est pas un défaut, juste un nom qui vise la peau. Lis la liste, ou scanne le pot avec Cosme Check.",
    },
    {
      question: "Crème au collagène et acide hyaluronique : est-ce une bonne idée ?",
      reponse:
        "Oui, les deux font bon ménage : ce sont deux ingrédients qui retiennent l'eau à la surface de la peau. L'acide hyaluronique est souvent plus haut dans la liste. Ensemble, ils hydratent, sans effet sur le collagène profond. Pour en savoir plus, relis notre article sur [l'acide hyaluronique](/blog/acide-hyaluronique) et regarde la place des deux.",
    },
  ],
  notes: [
    {
      produit: "Nivea, Q10 Anti-rides Expert Collagène Baume riche jour & nuit (50 ml)",
      ean: "4006000275901",
      note: 16.62,
      releveeLe: "2026-11-25",
    },
    {
      produit: "Krème, Crème Collagène Lissante",
      ean: "3770016038478",
      note: 16.51,
      releveeLe: "2026-11-25",
    },
    {
      produit: "Yves Rocher, Lift Pro-collagène Sérum Anti-rides Liftant (30 ml)",
      ean: "3660005410197",
      note: 16.39,
      releveeLe: "2026-11-25",
    },
    {
      produit: "Cien, Collagen Effect",
      ean: "4056489172260",
      note: 16.08,
      releveeLe: "2026-11-25",
    },
    {
      produit: "Elemis, Pro-Collagen Marine Crème Hydratante Ultra-Riche",
      ean: "0641628001941",
      note: 7.81,
      releveeLe: "2026-11-25",
    },
    {
      produit: "Olay, Collagen Peptide 24 Crème de jour",
      ean: "8006540060209",
      note: 7.73,
      releveeLe: "2026-11-25",
    },
    {
      produit: "Vichy, Liftactiv Crème Collagen Specialist (50 ml)",
      ean: "3337875607254",
      note: 7.72,
      releveeLe: "2026-11-25",
    },
    {
      produit: "L'Oréal Paris, Age Perfect Pro-Collagen Expert Soin Jour SPF 30 (50 ml)",
      ean: "3600523997527",
      note: 7.39,
      releveeLe: "2026-11-25",
    },
    {
      produit: "Medicube, Triple Collagen Cream (50 ml)",
      ean: "8800256114313",
      note: 1.59,
      releveeLe: "2026-11-25",
    },
  ],
};

export default article;
