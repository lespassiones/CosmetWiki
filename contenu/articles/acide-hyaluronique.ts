import type { Article } from "@/contenu/articles";

/**
 * Publié le 03/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » (`comedogene` sortait de la fenêtre des dix derniers) :
 * « acide hyaluronique » pèse 10 k à 100 k recherches par mois, « acide
 * hyaluronique visage », « sérum acide hyaluronique », « crème acide
 * hyaluronique », « acide hyaluronique bienfaits » et « sodium hyaluronate »
 * 1 k à 10 k chacune (`docs/seo/VOLUMES.md`, 03/11/2026, dix zones). Les
 * premiers résultats sont des marques et des revendeurs (Aroma-Zone, Sephora,
 * Atida, Pharma GDD), qui répètent « 1 000 fois son poids en eau » sans source
 * et ne lisent aucune liste. Les chiffres viennent de
 * `cosme_check.catalog_export` : produits actifs dont le nom contient
 * « hyalur », dédoublonnés par code-barres (5 893), dont 5 753 ont au moins
 * une forme hyaluronique dans leur liste relevée (03/11/2026). Les notes
 * citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "acide-hyaluronique",
  titre: "Ton sérum à l'acide hyaluronique est souvent un sérum à la glycérine : on a lu 5 753 listes",
  titreSeo: "Acide hyaluronique visage : à quoi ça sert ?",
  resume:
    "L'acide hyaluronique hydrate, mais pas comme on te le vend : ce que dit l'étude de référence, le vrai rôle de la glycérine et ce qu'on lit dans 5 753 listes.",
  chapo:
    "L'acide hyaluronique est un hydratant : il attire l'eau et la garde à la surface de la peau, qui paraît plus souple et plus lisse. Il ne comble pas les rides comme une injection. Et dans les 5 753 produits de notre base qui l'affichent dans leur nom, ++trois sur quatre contiennent d'abord de la glycérine++.",
  publieLe: "2026-11-03",
  modifieLe: "2026-11-03",
  minutes: 7,
  theme: "acide hyaluronique",
  motsCles: [
    "acide hyaluronique",
    "acide hyaluronique visage",
    "sérum acide hyaluronique",
    "crème acide hyaluronique",
    "acide hyaluronique bienfaits",
    "sodium hyaluronate",
    "acide hyaluronique matin ou soir",
    "glycérine visage",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/acide-hyaluronique-serum.webp",
    alt: "Une personne aux cheveux bruns, tête en arrière, tient au-dessus de son visage une pipette de sérum transparent, dans une pièce claire.",
    largeur: 1200,
    hauteur: 1800,
    position: "50% 22%",
    credit: "Shixart1985, via Wikimedia Commons",
    licence: "CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Woman_applying_serum_on_her_face_closeup.jpg",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, l'acide hyaluronique ?" },
    {
      type: "p",
      texte:
        "L'acide hyaluronique, c'est un sucre géant que ton corps fabrique lui-même. Il remplit l'espace entre les cellules de la peau et des articulations, comme un gel qui retient l'eau. Avec l'âge et le soleil, la peau en garde moins.",
    },
    {
      type: "p",
      texte:
        "Dans une crème, on parle d'un **humectant** : un ingrédient qui attire l'eau et la retient dans la couche de surface de la peau. Sur la liste INCI (la liste officielle des ingrédients, écrite du plus dosé au moins dosé), il porte presque toujours un autre nom : **[Sodium Hyaluronate](/i/sodium-hyaluronate)**, sa forme en sel, plus stable. On trouve aussi [Hyaluronic Acid](/i/hyaluronic-acid), [Hydrolyzed Hyaluronic Acid](/i/hydrolyzed-hyaluronic-acid) (coupé en petits morceaux) ou [Sodium Hyaluronate Crosspolymer](/i/sodium-hyaluronate-crosspolymer) (des chaînes reliées en filet).",
    },
    {
      type: "fiche",
      titre: "Acide hyaluronique",
      inci: "SODIUM HYALURONATE",
      niveau: "prouve",
      effet:
        "Hydrate la surface de la peau et la rend plus souple dans des études contrôlées. Effet sur la profondeur des rides seulement avec les petites molécules, et modeste.",
      statut:
        "Autorisé dans l'Union européenne sans limite de dose (règlement (CE) 1223/2009, aucune restriction dans ses annexes). Classé vert dans Cosme Check.",
    },

    { type: "h2", texte: "« 1 000 fois son poids en eau » : vrai ou slogan ?" },
    {
      type: "p",
      texte:
        "La phrase revient sur presque toutes les pages en tête de Google. Aucune de celles qu'on a lues ne donne sa source. Mais le vrai sujet est ailleurs : ce que la molécule fait dans un flacon ne dit pas ce qu'elle fait sur ton visage.",
    },
    {
      type: "p",
      texte:
        "Pour entrer dans la peau, une molécule doit en général peser moins de 500 daltons, l'unité qui mesure le poids des molécules ([Bos et Meinardi, *Experimental Dermatology*, 2000](https://doi.org/10.1034/j.1600-0625.2000.009003165.x)). L'acide hyaluronique des crèmes pèse de 50 000 à plus d'un million de daltons. ==Il reste donc surtout en surface==, où il forme un film qui retient l'eau. C'est déjà utile, mais ce n'est pas une piqûre de remplissage.",
    },

    { type: "h2", texte: "L'acide hyaluronique marche-t-il vraiment sur le visage ?" },
    {
      type: "p",
      texte:
        "Oui pour l'hydratation, plus modestement pour les rides. L'étude de référence a suivi ==76 femmes de 30 à 60 ans pendant 60 jours== ([Pavicic et al., *Journal of Drugs in Dermatology*, 2011](https://pubmed.ncbi.nlm.nih.gov/22052267/)). Chacune appliquait une crème à 0,1 % d'acide hyaluronique autour d'un œil, et une crème sans actif autour de l'autre, matin et soir.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "Les cinq tailles de molécule testées ont amélioré l'hydratation et la souplesse de la peau.",
        "Seules les deux plus petites (50 000 et 130 000 daltons) ont réduit la profondeur des ridules.",
        "La dose testée était de 0,1 % : un actif efficace à très petite dose.",
      ],
    },
    {
      type: "p",
      texte:
        "Voilà pourquoi les marques mettent souvent plusieurs formes à la fois, les « multi-poids ». Dans notre base, 1 247 produits en contiennent au moins deux, et 134 en affichent huit. Plus de formes ne veut pas dire plus d'effet : aucune étude ne l'a comparé.",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "Crème ou injection : deux mondes",
      texte:
        "L'acide hyaluronique injecté est un acte fait par un médecin, avec un gel fabriqué pour rester sous la peau. Une crème ne remplit pas une ride. Elle hydrate, et une peau bien hydratée marque moins les ridules de sécheresse.",
    },

    { type: "h2", texte: "Qu'est-ce qu'il y a vraiment dans les produits « hyaluroniques » ?" },
    {
      type: "p",
      texte:
        "On a relevé tous les produits de notre base dont le nom annonce l'acide hyaluronique : sérums, crèmes, masques, shampooings, fonds de teint. Sur ==5 753 listes== qui en contiennent au moins une forme (relevé du 03/11/2026), voici ce qu'on a compté.",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Produits avec de la [glycérine](/i/glycerin) placée avant l'acide hyaluronique.", "4 219, soit 73 %."],
        ["Produits où l'acide hyaluronique est dans les cinq premiers ingrédients.", "875, soit 15 %."],
        ["Produits où il est dans la seconde moitié de la liste.", "2 394, soit 42 %."],
        ["Produits qui contiennent du [parfum](/i/parfum).", "3 824, soit 66,5 %."],
      ],
      legende: "Base Cosme Check, produits actifs dont le nom contient « hyaluronique », relevé du 03/11/2026.",
    },
    {
      type: "p",
      texte:
        "La glycérine, c'est un autre humectant, banal et très bon marché. Elle est petite, entre dans la couche de surface et y retient l'eau. Elle aide aussi la barrière de la peau à se réparer ([Fluhr et al., *British Journal of Dermatology*, 2008](https://doi.org/10.1111/j.1365-2133.2008.08643.x)). Dans la plupart de ces produits, ++c'est elle qui fait le gros du travail d'hydratation++, et l'acide hyaluronique qui donne son nom au flacon.",
    },
    {
      type: "p",
      texte:
        "Ce n'est pas une arnaque : les deux se complètent. Mais si ta crème hydratante sans « hyaluronique » sur la boîte contient de la glycérine en deuxième ligne, elle hydrate déjà.",
    },
    {
      type: "cta",
      texte:
        "**Ton sérum est-il hyaluronique, ou surtout glycériné ?** Scanne-le avec Cosme Check : tu vois en dix secondes la place de chaque ingrédient et sa couleur.",
    },

    { type: "h2", texte: "Quel sérum ou quelle crème à l'acide hyaluronique choisir ?" },
    {
      type: "p",
      texte:
        "Le mot sur l'étiquette ne dit rien de la formule autour. Huit soins connus, et des notes qui vont de 7,6 à 16,41.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place de l'acide hyaluronique", "Parfum", "Note Cosme Check"],
      lignes: [
        ["Avène, Hyaluron Activ B3 Sérum Concentré Repulpant.", "5e sur 8.", "non.", "16,41 sur 20."],
        ["Vichy, Minéral 89 Gel Sorbet Mat Hydratant.", "11e sur 21.", "non.", "16,34 sur 20."],
        ["Caudalie, Vinohydra Sérum Hyaluronique.", "15e sur 23.", "oui.", "16,31 sur 20."],
        ["The Ordinary, Hyaluronic Acid 2% + B5.", "2e sur 17.", "non.", "15,93 sur 20."],
        ["CeraVe, Sérum Hydratant à l'Acide Hyaluronique.", "6e sur 24.", "non.", "12,09 sur 20."],
        ["L'Oréal Paris, Revitalift Filler Sérum Revolumisant.", "8e sur 24.", "oui.", "11,52 sur 20."],
        ["Garnier, Hyaluronic Aloe Sérum Repulpant.", "10e sur 15.", "oui.", "11,34 sur 20."],
        ["Nivea, Hyaluron Cellular Filler + Fermeté Crème de Jour FPS 15.", "19e sur 33.", "oui.", "7,6 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 03/11/2026.",
    },
    {
      type: "p",
      texte:
        "Le sérum The Ordinary est le seul de ce tableau où l'acide hyaluronique passe avant la glycérine. La crème Nivea perd des points pour autre chose : ses filtres solaires, dont l'[octocrylène](/i/octocrylene), classé rouge dans l'app. Et la crème Vichy *Aqualia Thermal UV FPS 30*, vendue « avec acide hyaluronique », n'en contient aucune forme dans la liste relevée pour son code-barres (note 1,37 sur 20). La formule a peut-être changé depuis : c'est pour ça qu'on lit le pot qu'on a en main.",
    },

    { type: "h2", texte: "Comment bien utiliser l'acide hyaluronique ?" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Sur une peau propre et encore un peu humide : l'humectant a de l'eau à retenir.",
        "Deux ou trois gouttes de sérum suffisent pour tout le visage.",
        "Une crème par-dessus. Elle contient des **occlusifs**, des ingrédients qui forment un film et empêchent l'eau de s'évaporer ([Purnamawati et al., *Clinical Medicine & Research*, 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5849435/)). C'est encore plus vrai dans l'air sec d'un hiver québécois ou d'un appartement chauffé : relis [nos gestes pour la peau sèche](/blog/peau-seche-visage).",
        "Le matin, une crème solaire en dernier. Son SPF, c'est son indice de protection contre les coups de soleil : évite [les 7 erreurs du SPF](/blog/spf-50-visage-7-erreurs).",
      ],
    },
    {
      type: "p",
      texte:
        "Il se marie avec à peu près tout : la [niacinamide](/blog/niacinamide), le [rétinol](/blog/retinol), la vitamine C. Notre [routine skincare](/blog/routine-skincare) donne l'ordre complet.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Rougeurs, picotements ou boutons après un nouveau sérum : regarde d'abord le parfum et les autres actifs de la liste, puis arrête si ça continue.",
        "Une peau qui réagit fort ou ne se calme pas : demande conseil à ton pharmacien ou à un dermatologue.",
      ],
    },
    {
      type: "p",
      texte:
        "Le meilleur pour la fin. Dans notre méthode d'[analyse de composition](/blog/analyse-composition-cosmetique), un actif écrit après le *Phenoxyethanol* (un conservateur limité à 1 % par la loi) est dosé à 1 % au plus. C'est le cas d'un produit « hyaluronique » sur quatre parmi ceux qui contiennent ce conservateur. ++Pour le rétinol ou la niacinamide, c'est souvent trop peu. Pour l'acide hyaluronique, non++ : l'étude de référence a testé 0,1 %. Ici, la petite dose n'est pas un piège. Le piège, c'est de payer pour le mot quand la glycérine fait le reste.",
    },
  ],
  faq: [
    {
      question: "Acide hyaluronique visage : matin ou soir ?",
      reponse:
        "Les deux. L'acide hyaluronique ne rend pas la peau sensible au soleil et ne s'abîme pas à la lumière comme le rétinol. Applique-le sur une peau propre et un peu humide, puis mets ta crème hydratante par-dessus. Le matin, termine par une crème solaire, même en hiver.",
    },
    {
      question: "L'acide hyaluronique sur le visage est-il dangereux ?",
      reponse:
        "Non. En crème ou en sérum, c'est un ingrédient très bien toléré, autorisé en Europe sans limite de dose et classé vert dans Cosme Check. Ton corps en fabrique lui-même. Si un produit pique ou rougit, regarde plutôt le parfum ou les autres actifs de sa liste. Les injections, elles, sont un acte médical.",
    },
    {
      question: "L'acide hyaluronique, est-ce du botox ?",
      reponse:
        "Non. Le botox est une toxine injectée qui relâche les muscles. L'acide hyaluronique est un sucre qui retient l'eau. Injecté par un médecin, il sert à remplir. En crème, il reste en surface et hydrate : il rend la peau plus souple, mais il ne bloque pas les muscles et ne comble pas les rides.",
    },
    {
      question: "L'acide hyaluronique, est-ce naturel ?",
      reponse:
        "Ton corps en fabrique, mais celui des cosmétiques est presque toujours produit par des bactéries, par fermentation, puis purifié. Il est donc identique à celui de la peau, sans venir d'un animal. Sur la liste INCI, cherche Sodium Hyaluronate, sa forme la plus courante.",
    },
  ],
  notes: [
    {
      produit: "Avène, Hyaluron Activ B3 Sérum Concentré Repulpant (30 ml)",
      ean: "3282770153101",
      note: 16.41,
      releveeLe: "2026-11-03",
    },
    {
      produit: "Vichy, Minéral 89 Gel Sorbet Mat Hydratant 48h (50 ml)",
      ean: "3337875894104",
      note: 16.34,
      releveeLe: "2026-11-03",
    },
    {
      produit: "Caudalie, Vinohydra Sérum Hyaluronique (30 ml)",
      ean: "3522930004363",
      note: 16.31,
      releveeLe: "2026-11-03",
    },
    {
      produit: "The Ordinary, Hyaluronic Acid 2% + B5 (60 ml)",
      ean: "0769915194982",
      note: 15.93,
      releveeLe: "2026-11-03",
    },
    {
      produit: "CeraVe, Sérum Hydratant avec Acide Hyaluronique (30 ml)",
      ean: "3606000552630",
      note: 12.09,
      releveeLe: "2026-11-03",
    },
    {
      produit: "L'Oréal Paris, Revitalift Filler Sérum Hyaluronique Revolumisant (30 ml)",
      ean: "3600522892441",
      note: 11.52,
      releveeLe: "2026-11-03",
    },
    {
      produit: "Garnier, Skinactive Hyaluronic Aloe Sérum Repulpant (30 ml)",
      ean: "3600542432962",
      note: 11.34,
      releveeLe: "2026-11-03",
    },
    {
      produit: "Nivea, Hyaluron Cellular Filler + Fermeté Crème de Jour FPS 15 (50 ml)",
      ean: "4005900129208",
      note: 7.6,
      releveeLe: "2026-11-03",
    },
    {
      produit: "Vichy, Aqualia Thermal UV Hydratant Visage FPS 30 (50 ml)",
      ean: "3337875686983",
      note: 1.37,
      releveeLe: "2026-11-03",
    },
  ],
};

export default article;
