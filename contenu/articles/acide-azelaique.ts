import type { Article } from "@/contenu/articles";

/**
 * Publié le 23/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « ingrédients » (`acide-salicylique` sortait de la fenêtre des dix
 * derniers). Volumes du 22/11/2026 (France, French, `docs/seo/VOLUMES.md`) :
 * « acide azelaique » 10 k à 100 k ; « acide azélaïque », « acide azelaique
 * the ordinary », « creme acide azelaique », « acide azelaique 15 » 1 k à
 * 10 k, +900 % sur un an. Suggestions Google du jour : « pharmacie »,
 * « skinoren », « the ordinary », « 10 », « 15 », « 20 », « et niacinamide »,
 * « et rétinol », « et grossesse ». Premiers résultats : Aroma-Zone, Notino,
 * Typology, sites de marques ; aucun ne compte les listes.
 *
 * Chiffres : `cosme_check.catalog_export`, fiches actives, relevé du
 * 23/11/2026 (listes découpées sur les virgules qui ne sont pas suivies d'un
 * chiffre). 481 fiches avec AZELAIC ACID sur 478 378 ; place médiane 8e pour
 * une liste médiane de 26 ; 179 dans les cinq premiers ; note médiane 12,19.
 * 418 fiches avec POTASSIUM AZELOYL DIGLYCINATE, dont 14 avec les deux ;
 * 21 fiches dont le nom annonce l'acide azélaïque (et pas l'« azéloglycine »)
 * sans AZELAIC ACID dans la liste. Les notes citées sont déclarées dans
 * `notes`.
 */
const article: Article = {
  slug: "acide-azelaique",
  titre: "Acide azélaïque : ton sérum « 10 % » n'en contient peut-être pas une goutte",
  titreSeo: "Acide azélaïque : à quoi ça sert, quelle dose ?",
  resume:
    "L'acide azélaïque calme les rougeurs et unifie le teint. Il n'est que dans 481 produits sur 478 378, et 21 l'annoncent sans en contenir.",
  chapo:
    "L'acide azélaïque est un actif doux qui aide à calmer les rougeurs, à désencombrer les pores et à unifier le teint. Il est rare : ==481 produits sur 478 378== dans notre base. ++Et 21 produits l'écrivent sur la boîte sans l'avoir dans leur liste.++",
  publieLe: "2026-11-23",
  modifieLe: "2026-11-23",
  minutes: 7,
  theme: "acide azélaïque",
  motsCles: [
    "acide azélaïque",
    "acide azelaique",
    "acide azélaïque pharmacie",
    "acide azélaïque the ordinary",
    "crème acide azélaïque",
    "acide azélaïque 10",
    "acide azélaïque et niacinamide",
    "azelaic acid",
    "potassium azeloyl diglycinate",
  ],
  categorie: "Ingrédients",
  couverture: {
    src: "/image/blog/acide-azelaique.webp",
    alt: "Un coquelicot rouge, seul, au milieu d'un champ d'orge vert dont les épis aux longues barbes ondulent.",
    largeur: 1024,
    hauteur: 768,
    credit: "zakwitnij, via Flickr",
    licence: "CC BY 2.0",
    source: "https://www.flickr.com/photos/11656083@N00/180514815",
  },
  blocs: [
    { type: "h2", texte: "C'est quoi, l'acide azélaïque ?" },
    {
      type: "p",
      texte:
        "L'acide azélaïque est un petit acide qu'on trouve dans des céréales comme le blé, l'orge et le seigle. Une levure qui vit sur notre peau en fabrique aussi. Celui des cosmétiques est produit en usine. Sur la liste INCI (la liste officielle des ingrédients, du plus dosé au moins dosé), il s'écrit **Azelaic Acid**.",
    },
    {
      type: "p",
      texte:
        "Il a plusieurs talents à la fois. C'est un exfoliant doux (un actif qui aide les cellules mortes à se détacher). Il freine aussi les bactéries qui aiment les pores bouchés. Et il calme l'inflammation, c'est-à-dire la réaction de la peau qui la fait rougir et gonfler. Il ralentit aussi la fabrication de la mélanine, le pigment qui fait les taches brunes ([revue de *Clinical, Cosmetic and Investigational Dermatology*, 2024](https://www.dovepress.com/azelaic-acid-mechanisms-of-action-and-clinical-applications-peer-reviewed-fulltext-article-CCID)).",
    },
    {
      type: "fiche",
      titre: "Acide azélaïque",
      inci: "AZELAIC ACID",
      niveau: "prouve",
      effet:
        "Aide à désencombrer les pores, à calmer les rougeurs et à atténuer les taches brunes ; effet bien étudié à 15 et 20 %, dans des médicaments.",
      statut:
        "Autorisé dans les cosmétiques en Europe, sans plafond chiffré propre. À 15 et 20 %, il existe en France sous forme de médicaments sur ordonnance.",
    },

    { type: "h2", texte: "Acide azélaïque en pharmacie : cosmétique ou médicament ?" },
    {
      type: "p",
      texte:
        "Les deux existent, et la dose fait la différence. Les études les plus solides portent sur des produits à 15 et 20 %. En France, ce sont des médicaments vendus sur ordonnance : le gel [Finacea 15 %](https://www.sante.fr/medicament/acide-azelaique/finacea-15-gel) et la crème [Skinoren 20 %](https://www.sante.fr/medicament/acide-azelaique/skinoren-20-creme-pour-application-cutanee). Le médecin ou le dermatologue les prescrit contre la rosacée ou l'acné.",
    },
    {
      type: "p",
      texte:
        "Les sérums et les crèmes en vente libre, eux, sont des cosmétiques. Ils affichent le plus souvent ==10 %==, parfois un peu plus. Ils ne remplacent pas un traitement : ce sont des soins du quotidien pour une peau qui rougit vite ou qui brille.",
    },
    {
      type: "p",
      texte:
        "Si ta peau reste rouge, brûle ou se couvre de boutons qui font mal, ne cherche pas le bon sérum. ++Montre-la à un médecin ou à un dermatologue++ : lui seul peut dire ce qui se passe.",
    },

    { type: "h2", texte: "Pourquoi l'acide azélaïque est-il si rare dans les cosmétiques ?" },
    {
      type: "p",
      texte:
        "Parce qu'il est difficile à travailler. Il se dissout mal, dans l'eau comme dans l'huile, et donne vite une texture granuleuse. Résultat : sur 478 378 produits de notre base, ==481 seulement== en contiennent. C'est environ un produit sur mille. À titre de comparaison, on a compté 18 208 produits avec de l'[acide salicylique](/blog/acide-salicylique).",
    },
    {
      type: "tableau",
      entetes: ["Rayon", "Produits avec acide azélaïque"],
      lignes: [
        ["Soins anti-imperfections.", "243."],
        ["Crèmes hydratantes.", "53."],
        ["Masques et gommages.", "51."],
        ["Nettoyants visage.", "26."],
        ["Soins anti-âge.", "21."],
        ["Soins capillaires.", "20."],
      ],
      legende: "Fiches actives de la base Cosme Check, relevé du 23/11/2026.",
    },
    {
      type: "p",
      texte:
        "Quand il est là, il est souvent bien placé. Sa place médiane est la 8e, pour une liste médiane de 26 ingrédients (la médiane, c'est la valeur du milieu). Il est dans les cinq premiers de 179 produits. Et parmi les 126 qui l'affichent dans leur nom, 81 le rangent dans les cinq premiers.",
    },

    { type: "h2", texte: "Azéloglycine : est-ce le même ingrédient ?" },
    {
      type: "p",
      texte:
        "Non. Beaucoup de marques utilisent un cousin plus facile à mélanger : le **Potassium Azeloyl Diglycinate**, qu'on appelle aussi azéloglycine. C'est de l'acide azélaïque accroché à un acide aminé, la glycine. Il se dissout dans l'eau, et les textures sont plus légères. On l'a trouvé dans 418 produits, presque autant que l'original.",
    },
    {
      type: "p",
      texte:
        "Le problème, c'est la preuve. Les études publiées sur l'azéloglycine sont rares, et elles la testent presque toujours mélangée à d'autres actifs. On ne sait donc pas si elle fait aussi bien que l'acide azélaïque, ni à quelle dose.",
    },
    {
      type: "p",
      texte:
        "Certaines boîtes le disent clairement, avec le mot « azéloglycine ». D'autres non. ==21 produits== de notre base annoncent l'acide azélaïque dans leur nom alors que leur liste ne contient que l'azéloglycine. Par exemple, le sérum Naturium « Acide Azélaïque Topique 10 % » : sa liste commence par l'eau, le propanediol (un solvant), puis le Potassium Azeloyl Diglycinate. Sa formule est par ailleurs bien notée (16,25 sur 20), mais elle ne contient pas d'Azelaic Acid.",
    },
    {
      type: "cta",
      texte:
        "**Ton sérum contient-il de l'acide azélaïque, ou son cousin ?** Scanne-le avec Cosme Check : la liste s'affiche en entier, et tu vois tout de suite si « Azelaic Acid » y figure.",
    },

    { type: "h2", texte: "Que valent les produits à l'acide azélaïque les plus connus ?" },
    {
      type: "p",
      texte:
        "Les notes vont de 6,72 à 16,51, et l'acide azélaïque n'y est pour rien : ce sont les autres ingrédients qui font la différence. Huit produits connus, relevés dans notre base le 23/11/2026.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place de l'acide", "Note Cosme Check"],
      lignes: [
        ["Ducray, Melascreen Concentré Antitaches.", "2e sur 20.", "16,51 sur 20."],
        ["Anua, sérum Azelaic Acid 10 + Hyaluron.", "2e sur 35.", "16,45 sur 20."],
        ["Typology, Acide azélaïque 10 % + Extrait de bambou.", "2e sur 9.", "16,25 sur 20."],
        ["Medicube, Azelaic Acid 16 BB Calming Serum.", "2e sur 31.", "12,90 sur 20."],
        ["Paula's Choice, 10 % Booster Acide Azélaïque.", "2e sur 21.", "12,34 sur 20."],
        ["La Roche-Posay, Effaclar A.Z. Gel-crème.", "2e sur 26.", "7,70 sur 20."],
        ["The Ordinary, Suspension d'Acide Azélaïque 10 %.", "4e sur 17.", "6,72 sur 20."],
        ["Naturium, Acide Azélaïque Topique 10 %.", "absent (azéloglycine en 3e).", "16,25 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 23/11/2026.",
    },
    {
      type: "p",
      texte:
        "Le Typology tient en neuf ingrédients, sans parfum. Le best-seller de The Ordinary, lui, place deux silicones avant l'acide, puis plusieurs émulsifiants classés orange dans l'app, comme le Polysorbate 60. Le gel-crème Effaclar A.Z. perd des points sur son parfum et un émulsifiant, le PEG-100 Stearate. Pour lire une liste entière toi-même, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },

    { type: "h2", texte: "Comment utiliser l'acide azélaïque sans irriter ta peau ?" },
    {
      type: "p",
      texte:
        "Il est réputé doux, mais il pique souvent les premiers jours. Cinq gestes pour bien commencer.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Commence un soir sur deux, en couche fine, sur une peau sèche.",
        "Attends deux semaines avant de passer à tous les soirs, puis matin et soir si tout va bien.",
        "Ne le mets pas le même soir qu'un autre acide exfoliant, comme l'[acide glycolique](/blog/acide-glycolique), au début.",
        "Hydrate ensuite avec une crème simple, sans parfum.",
        "Le jour, mets une crème solaire : sans elle, les taches reviennent.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Un léger picotement passe en quelques minutes. Une brûlure qui dure, des plaques ou un gonflement : arrête, et demande conseil à ton pharmacien.",
        "Garde-le loin des yeux et des lèvres.",
        "Les notices des médicaments à l'acide azélaïque signalent de rares cas d'asthme aggravé : si tu es asthmatique, parles-en à ton médecin.",
        "Patience : les effets se voient en général après plusieurs semaines d'usage régulier.",
      ],
    },
    {
      type: "encadre",
      titre: "Ce qu'il faut retenir",
      texte:
        "Le nom sur la boîte ne suffit pas. Cherche « Azelaic Acid » en toutes lettres dans la liste, de préférence dans les premières lignes. ++« Potassium Azeloyl Diglycinate », c'est un cousin++, moins étudié.",
      ton: "emeraude",
    },
    {
      type: "p",
      texte:
        "Il se marie bien avec la [niacinamide](/blog/niacinamide) : dans notre base, 181 produits à l'acide azélaïque en contiennent aussi. Et pour savoir comment le placer dans ta routine, relis [l'ordre des produits](/blog/routine-skincare).",
    },
  ],
  faq: [
    {
      question: "Acide azélaïque et niacinamide : peut-on les mélanger ?",
      reponse:
        "Oui. Les deux vont bien ensemble et beaucoup de soins les associent : 181 produits à l'acide azélaïque de notre base contiennent aussi de la niacinamide. L'acide aide à désencombrer les pores, la niacinamide à réguler le gras et à renforcer la peau. Si ça tiraille, utilise-les à des moments différents de la journée.",
    },
    {
      question: "Acide azélaïque et rétinol : peut-on les utiliser ensemble ?",
      reponse:
        "Pas le même soir au début. Le rétinol, un dérivé de la vitamine A, irrite souvent les premières semaines, et l'acide azélaïque pique aussi. Le plus simple est d'alterner : un soir l'un, un soir l'autre, avec une crème hydratante à chaque fois. Si la peau rougit ou pèle, espace encore et demande conseil à ton pharmacien.",
    },
    {
      question: "Acide azélaïque en pharmacie : faut-il une ordonnance ?",
      reponse:
        "Pas pour les cosmétiques : sérums et crèmes, le plus souvent dosés autour de 10 %, sont en vente libre, en pharmacie comme ailleurs. Les produits à 15 et 20 %, comme Finacea et Skinoren, sont des médicaments : en France, ils se délivrent sur ordonnance, après l'avis d'un médecin ou d'un dermatologue.",
    },
    {
      question: "Acide azélaïque et grossesse : est-ce possible ?",
      reponse:
        "C'est une question à poser à ton médecin, à ta sage-femme ou à ton pharmacien, avec le produit en main. Il ne fait pas partie des rétinoïdes, les dérivés de la vitamine A contre-indiqués pendant la grossesse. Notre [guide sur les cosmétiques et la grossesse](/blog/cosmetiques-grossesse) liste les ingrédients à repérer et les questions à poser.",
    },
  ],
  notes: [
    {
      produit: "Ducray, Melascreen Concentré Antitaches (30 ml)",
      ean: "3282770389197",
      note: 16.51,
      releveeLe: "2026-11-23",
    },
    {
      produit: "Anua, Sérum apaisant pour rougeurs à l'acide azélaïque 10 + hyaluronique (30 ml)",
      ean: "8809640737190",
      note: 16.45,
      releveeLe: "2026-11-23",
    },
    {
      produit: "Typology, Acide azélaïque 10 % + Extrait de bambou",
      ean: "3665467002584",
      note: 16.25,
      releveeLe: "2026-11-23",
    },
    {
      produit: "Medicube, Azelaic Acid 16 BB Calming Serum (30 ml)",
      ean: "8800256119318",
      note: 12.9,
      releveeLe: "2026-11-23",
    },
    {
      produit: "Paula's Choice, 10 % Booster Acide Azélaïque",
      ean: "0655439008051",
      note: 12.34,
      releveeLe: "2026-11-23",
    },
    {
      produit: "La Roche-Posay, Effaclar A.Z. Gel-crème",
      ean: "3337875923125",
      note: 7.7,
      releveeLe: "2026-11-23",
    },
    {
      produit: "The Ordinary, Suspension d'Acide Azélaïque 10 % (30 ml)",
      ean: "0769915195682",
      note: 6.72,
      releveeLe: "2026-11-23",
    },
    {
      produit: "Naturium, Acide Azélaïque Topique 10 % (30 ml)",
      ean: "0810120262185",
      note: 16.25,
      releveeLe: "2026-11-23",
    },
  ],
};

export default article;
