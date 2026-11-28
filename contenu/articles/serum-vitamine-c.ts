import type { Article } from "@/contenu/articles";

/**
 * Publié le 28/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « comparatifs honnêtes » (`cien-lidl` sortait de la fenêtre des dix
 * derniers). Volumes mesurés il y a moins de 60 jours (`docs/seo/VOLUMES.md`) :
 * « sérum vitamine c » 1 k à 10 k (France, French), 10 k à 100 k (dix zones,
 * toutes langues, 13/11) ; « meilleur sérum vitamine c » 100 à 1 k.
 * Suggestions Google du jour : « serum vitamine c la roche posay / garnier /
 * avene / cerave / the ordinary / aroma zone », « vitamine c visage matin ou
 * soir », « vitamine c visage bienfaits », « sérum vitamine c la roche posay
 * que choisir ». Premiers résultats : comparatifs affiliés (Meilleurtest,
 * Futura, Atida, Beezy), aucun ne compare les listes INCI.
 *
 * Chiffres : `cosme_check.catalog_export`, fiches actives, relevé du
 * 28/11/2026. 858 sérums, boosters, ampoules et concentrés pour le visage dont
 * le nom annonce la vitamine C (masques, nettoyants, soins yeux, produits
 * avec SPF et coffrets exclus), note médiane 12,29. Forme de vitamine C =
 * le premier dérivé « ASCORB » de la liste. Parfum dans 443 (51,6 %), médiane
 * 11,9 contre 16,09 sans ; alcool dénaturé dans 157 (18,3 %), médiane 11,74 ;
 * D5 ou D6 dans 21, médiane 3,35 ; ni parfum, ni alcool, ni D5/D6 : 369,
 * médiane 16,12. Formes : acide ascorbique 232 (place médiane 2e, note 12,02),
 * acide ascorbique éthylé 193 (4e, 12,18), ascorbyl glucoside 148 (6e,
 * 16,08), sodium ascorbyl phosphate 118 (4e, 15,93), formes grasses
 * (tétrahexyldécyl ascorbate, ascorbyl tétraisopalmitate) 87 (5e, 12,46).
 * La Roche-Posay Pure Vitamin C12 (30 ingrédients) et L'Oréal Revitalift
 * Clinical 12 % (29) : 25 ingrédients communs, les sept premiers dans le même
 * ordre. Couleurs : `cosme_check.ingredients` (Polysilicone-11, Laureth-7,
 * PEG-20 Methyl Glucose Sesquistearate orange ; Parfum, Alcohol Denat.,
 * Dimethicone jaunes ; Cyclopentasiloxane, Cyclohexasiloxane rouges). Les
 * notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "serum-vitamine-c",
  titre: "Sérum vitamine C : on a lu 858 listes, et le sérum de pharmacie a un jumeau en supermarché",
  titreSeo: "Meilleur sérum vitamine C : on a lu 858 listes",
  resume:
    "Sérum vitamine C : on a lu 858 listes. La bonne forme, le piège du parfum, deux sérums presque jumeaux, et 13 sérums notés du meilleur au moins bon.",
  chapo:
    "Le meilleur sérum vitamine C, c'est celui qui met la vitamine C en haut de sa liste, et le parfum nulle part. On a lu les 858 sérums de notre base : ==sans parfum, leur note médiane est de 16,09 ; avec, elle tombe à 11,9==. Et en chemin, on a trouvé ++un sérum de pharmacie et un sérum de supermarché qui partagent 25 ingrédients++.",
  publieLe: "2026-11-28",
  modifieLe: "2026-11-28",
  minutes: 7,
  theme: "sérum vitamine C",
  motsCles: [
    "sérum vitamine c",
    "meilleur sérum vitamine c",
    "vitamine c visage",
    "vitamine c visage matin ou soir",
    "vitamine c visage bienfaits",
    "sérum vitamine c la roche posay",
    "sérum vitamine c la roche posay avis",
    "sérum vitamine c garnier",
    "sérum vitamine c the ordinary",
    "sérum vitamine c cerave",
    "sérum vitamine c avène",
    "dupe sérum vitamine c",
  ],
  categorie: "Marques",
  couverture: {
    src: "/image/blog/serum-vitamine-c.webp",
    alt: "Des dizaines d'oranges coupées en deux, entassées, la chair orange vif tournée vers le haut.",
    largeur: 1024,
    hauteur: 683,
    credit: "Caitlinator, via Flickr",
    licence: "CC BY 2.0",
    source: "https://www.flickr.com/photos/21484712@N00/15729994747",
  },
  blocs: [
    { type: "h2", texte: "Quel est le meilleur sérum vitamine C ?" },
    {
      type: "p",
      texte:
        "Celui qui coche trois cases dans sa liste INCI, la liste officielle des ingrédients au dos du flacon. La vitamine C arrive dans les premiers ingrédients. Il n'y a pas de parfum. Et la formule évite les ingrédients que Cosme Check classe rouge, comme certains silicones.",
    },
    {
      type: "p",
      texte:
        "Dans notre base, **369 sérums vitamine C** n'ont ni parfum, ni alcool dénaturé, ni silicone rouge. Leur note médiane est de 16,12. Les 858 sérums réunis sont à 12,29. Le tableau complet, marque par marque, est plus bas.",
    },

    { type: "h2", texte: "Que fait vraiment la vitamine C sur la peau ?" },
    {
      type: "p",
      texte:
        "La vitamine C, c'est un antioxydant : une molécule qui aide la peau à se défendre contre les dégâts du soleil et de la pollution. Elle aide aussi à unifier le teint et à atténuer l'apparence des taches brunes. C'est l'un des actifs les mieux étudiés en cosmétique ([Telang, *Indian Dermatology Online Journal*, 2013](https://doi.org/10.4103/2229-5178.110593)).",
    },
    {
      type: "p",
      texte:
        "Elle a un défaut : elle s'abîme vite à l'air et à la lumière. Associée à la vitamine E et à l'acide férulique, elle tient mieux et protège davantage, selon une étude de référence ([Lin et al., *Journal of Investigative Dermatology*, 2005](https://pubmed.ncbi.nlm.nih.gov/16185284/)). ++Elle ne remplace pas la crème solaire, elle la complète.++",
    },

    { type: "h2", texte: "Acide ascorbique, glucoside, éthylé : quelle forme de vitamine C choisir ?" },
    {
      type: "p",
      texte:
        "La vitamine C pure s'appelle **Ascorbic Acid** dans la liste. Elle est la plus étudiée, mais aussi la plus fragile. Pour la stabiliser, les marques utilisent des dérivés, des formes modifiées qui la libèrent sur la peau.",
    },
    {
      type: "p",
      texte:
        "La forme pure a une exigence. Sur une peau de porc, elle ne pénètre qu'à un pH inférieur à 3,5, donc dans une formule très acide. Son effet plafonne à 20 % ([Pinnell et al., *Dermatologic Surgery*, 2001](https://pubmed.ncbi.nlm.nih.gov/11207686/)). Un pH, c'est la mesure de l'acidité : plus il est bas, plus ça pique.",
    },
    {
      type: "tableau",
      entetes: ["Forme (nom INCI)", "Sérums", "Place médiane", "Note médiane (sur 20)"],
      lignes: [
        ["Vitamine C pure (Ascorbic Acid).", "232.", "2e.", "12,02."],
        ["Vitamine C éthylée (3-O-Ethyl Ascorbic Acid).", "193.", "4e.", "12,18."],
        ["Ascorbyl Glucoside.", "148.", "6e.", "16,08."],
        ["Sodium Ascorbyl Phosphate.", "118.", "4e.", "15,93."],
        ["Formes grasses (Tetrahexyldecyl Ascorbate).", "87.", "5e.", "12,46."],
      ],
      legende: "Sérums vitamine C pour le visage de la base Cosme Check, relevé du 28/11/2026. La forme retenue est la première qui apparaît dans la liste.",
    },
    {
      type: "p",
      texte:
        "Ce tableau ne dit pas qu'une forme est meilleure qu'une autre. Il dit que ++la forme ne fait pas la note : c'est le reste de la liste qui la fait++. Une peau qui tiraille facilement sera souvent plus à l'aise avec un dérivé, moins acide que la forme pure.",
    },

    { type: "h2", texte: "Pourquoi le parfum fait-il chuter la note d'un sérum vitamine C ?" },
    {
      type: "p",
      texte:
        "Parce qu'il n'apporte rien à la peau, et qu'il peut l'irriter. **443 sérums vitamine C sur 858 contiennent du parfum**, soit 51,6 %. Leur note médiane est de 11,9, contre 16,09 sans parfum.",
    },
    {
      type: "p",
      texte:
        "Un sérum se pose sur la peau nue et y reste toute la journée. C'est le pire endroit pour un allergène, une molécule qui peut déclencher une allergie chez certaines personnes. L'Europe oblige d'ailleurs à nommer environ 80 substances parfumantes sur les étiquettes, contre 26 avant ([règlement (UE) 2023/1545](https://eur-lex.europa.eu/eli/reg/2023/1545/oj)).",
    },
    {
      type: "p",
      texte:
        "Le second piège est l'alcool dénaturé (**Alcohol Denat.**), présent dans 157 sérums : il rend la texture légère, mais il peut dessécher. Leur médiane est de 11,74.",
    },

    { type: "h2", texte: "La Roche-Posay et L'Oréal : deux sérums vitamine C presque jumeaux ?" },
    {
      type: "p",
      texte:
        "Sur la liste, oui. Le *Pure Vitamin C12* de La Roche-Posay, vendu en pharmacie, compte 30 ingrédients. Le *Revitalift Clinical 12 % Vitamine C* de L'Oréal Paris, vendu en grande surface, en compte 29. ==Ils en partagent 25, et les sept premiers sont dans le même ordre==. Les deux marques appartiennent au même groupe.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Aqua (eau).",
        "Ascorbic Acid (vitamine C pure, annoncée à 12 % sur les deux).",
        "Dimethicone (un silicone).",
        "Glycerin (glycérine).",
        "Alcohol Denat. (alcool dénaturé).",
        "Potassium Hydroxide (il règle l'acidité).",
        "Polysilicone-11 (un autre silicone).",
      ],
    },
    {
      type: "p",
      texte:
        "Ce qu'ils font bien : la vitamine C pure arrive en deuxième place, à un dosage clair. Ce qui les fait baisser : du parfum en dernière place, de l'alcool en cinquième, et plusieurs ingrédients classés orange (Polysilicone-11, Laureth-7, PEG-20 Methyl Glucose Sesquistearate). Résultat : ==7,51 pour La Roche-Posay et 7,29 pour L'Oréal==.",
    },
    {
      type: "p",
      texte:
        "Une liste proche ne veut pas dire un produit identique : les dosages des autres ingrédients ne sont pas publiés. Mais si tu cherches un « dupe », c'est le cas le plus net de notre base. On avait déjà lu toute la gamme dans notre article sur [Revitalift](/blog/revitalift).",
    },
    {
      type: "p",
      texte:
        "Dans le même groupe, deux sérums font autrement. Le *LiftActiv 16 % Vitamine C Pure* de Vichy n'a ni parfum ni alcool : 12,21. Le *Skin Renewing Vitamin C* de CeraVe n'a pas de parfum non plus : 12,08. La marque a d'autres bonnes listes, comparées dans notre article sur la [crème hydratante CeraVe](/blog/cerave-creme-hydratante). Les deux restent pénalisés par d'autres ingrédients jaunes ou orange.",
    },
    {
      type: "cta",
      texte:
        "Ton sérum vitamine C, scanne-le : Cosme Check te dit en dix secondes s'il contient du parfum, de l'alcool, et où se cache la vitamine C.",
    },

    { type: "h2", texte: "Les sérums vitamine C notés, du meilleur au moins bon" },
    {
      type: "p",
      texte:
        "Voici treize sérums que l'on trouve en pharmacie, en parfumerie ou en grande surface, du Québec à la Belgique. La note lit toute la formule, pas seulement la vitamine C.",
    },
    {
      type: "tableau",
      entetes: ["Sérum", "Vitamine C (place)", "Parfum", "Note (sur 20)"],
      lignes: [
        ["The Ordinary, Ethylated Ascorbic Acid 15 % Solution.", "Éthylée (2e sur 2).", "Non.", "20."],
        ["Caudalie, Vinergetic C+ Sérum.", "Forme grasse (7e).", "Non.", "16,63."],
        ["Typology, Sérum Éclat Vitamine C 11 %.", "Sodium Ascorbyl Phosphate (2e).", "Non.", "16,6."],
        ["Aroma-Zone, Gouttes Illuminatrices Acide Hyaluronique et Vitamine C.", "Glucoside (7e).", "Non.", "16,51."],
        ["Nivea, Cellular Expert Filler Sérum Illuminateur Vitamine C.", "Glucoside (6e).", "Non.", "16,38."],
        ["Vichy, LiftActiv Sérum 16 % Vitamine C Pure.", "Pure (2e).", "Non.", "12,21."],
        ["CeraVe, Skin Renewing Vitamin C Serum.", "Pure (2e).", "Non.", "12,08."],
        ["SkinCeuticals, C E Ferulic.", "Pure (3e).", "Non.", "12,03."],
        ["Garnier Skin Active, Sérum Nuit 10 % Vitamine C Pure.", "Pure (2e).", "Oui (17e).", "11,87."],
        ["Avène, A-Oxitive Sérum Défense Antioxydant.", "Glucoside (7e).", "Oui (17e).", "7,6."],
        ["La Roche-Posay, Pure Vitamin C12 Sérum.", "Pure (2e).", "Oui (30e).", "7,51."],
        ["L'Oréal Paris, Revitalift Clinical 12 % Vitamine C.", "Pure (2e).", "Oui (29e).", "7,29."],
        ["Medik8, C-Tetra Lipid Vitamin C Antioxidant Serum.", "Forme grasse (4e).", "Non.", "1."],
      ],
      legende: "Notes Cosme Check relevées le 28/11/2026. Une même gamme peut exister en plusieurs formules : vérifie toujours la liste de ton flacon.",
    },
    {
      type: "p",
      texte:
        "Le Medik8 n'a pas de parfum, mais il place deux silicones classés rouges en deuxième et troisième place : le **Cyclopentasiloxane** (D5) et le **Cyclohexasiloxane** (D6). L'Europe les limite à 0,1 % dans les soins sans rinçage à partir du 6 juin 2027 ([règlement (UE) 2024/1328](https://eur-lex.europa.eu/eli/reg/2024/1328/oj)). Dans notre base, les 21 sérums vitamine C qui en contiennent ont une note médiane de 3,35.",
    },

    { type: "h2", texte: "Comment utiliser un sérum vitamine C sans le gâcher ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Le matin**, sur une peau propre, avant la crème hydratante. Sa place exacte est dans notre [routine skincare](/blog/routine-skincare).",
        "**Toujours suivi d'une crème solaire** : la vitamine C renforce sa protection, elle ne la remplace pas. Les erreurs à éviter sont dans notre article sur le [SPF 50](/blog/spf-50-visage-7-erreurs).",
        "**Garde-le fermé, à l'abri de la lumière.** Un flacon opaque ou une pompe vaut mieux qu'une pipette en verre clair.",
        "**Regarde sa couleur.** S'il vire au brun foncé, la vitamine C s'est oxydée : elle a perdu son effet.",
        "**Commence un jour sur deux** si ta peau tiraille, surtout avec la forme pure.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Ta peau picote ?** Ne superpose pas la vitamine C avec un acide exfoliant (qui décolle les cellules mortes) ou du rétinol (un dérivé de la vitamine A). Garde-la pour le matin.",
        "**Rougeurs ou brûlures qui durent ?** Arrête le produit et demande conseil à ton pharmacien ou à un dermatologue.",
      ],
    },
    {
      type: "p",
      texte:
        "Pour combiner la vitamine C avec d'autres actifs, notre guide des [sérums visage](/blog/serums-visage-guide) explique quoi mettre avec quoi. La [niacinamide](/blog/niacinamide) (la vitamine B3) peut se poser dans la même routine.",
    },
    {
      type: "encadre",
      titre: "Le geste à retenir",
      ton: "emeraude",
      texte:
        "En rayon, retourne le flacon et lis la fin de la liste avant le début. Si le dernier mot est **Parfum**, repose-le. Le seul sérum de notre tableau noté 20 contient ==deux ingrédients==, et aucun ne sent quoi que ce soit.",
    },
  ],
  faq: [
    {
      question: "Vitamine C visage : matin ou soir ?",
      reponse:
        "Plutôt le matin. La vitamine C est un antioxydant : elle aide la peau à se défendre contre les dégâts du soleil et de la pollution pendant la journée. Pose-la sur une peau propre, avant la crème hydratante, et termine toujours par une crème solaire. Le soir, laisse la place au rétinol ou aux acides si tu en utilises.",
    },
    {
      question: "Quels sont les bienfaits de la vitamine C sur le visage ?",
      reponse:
        "La vitamine C aide la peau à se défendre contre les dégâts du soleil et de la pollution. Elle renforce la protection de la crème solaire, et elle aide à atténuer l'apparence des taches brunes pour un teint plus uniforme. Ses effets demandent plusieurs semaines d'usage régulier, et dépendent de la forme et de la concentration choisies.",
    },
    {
      question: "Que vaut le sérum vitamine C de La Roche-Posay ?",
      reponse:
        "Le Pure Vitamin C12 met la vitamine C pure en deuxième place, à 12 %, ce qui est un bon point. Il contient aussi du parfum, de l'alcool dénaturé et plusieurs ingrédients classés orange : Cosme Check le note 7,51 sur 20. Sa liste est très proche de celle du Revitalift Clinical 12 % de L'Oréal Paris.",
    },
    {
      question: "Quel sérum vitamine C choisir en pharmacie ?",
      reponse:
        "Cherche la vitamine C dans les cinq premiers ingrédients et aucun parfum dans la liste. En pharmacie, le LiftActiv 16 % de Vichy (12,21) et le Skin Renewing de CeraVe (12,08) n'ont pas de parfum. Préfère un flacon opaque, et demande conseil à ton pharmacien si ta peau réagit facilement.",
    },
  ],
  notes: [
    { produit: "The Ordinary Ethylated Ascorbic Acid 15% Solution", ean: "0769915194463", note: 20, releveeLe: "2026-11-28" },
    { produit: "Caudalie Vinergetic C+ Sérum Vitamine C Anti-fatigue 30 ml", ean: "3522930003489", note: 16.63, releveeLe: "2026-11-28" },
    { produit: "Typology Sérum Éclat Vitamine C 11% + Extrait d'Arbre à Soie", ean: "3665467005370", note: 16.6, releveeLe: "2026-11-28" },
    { produit: "Aroma-Zone Gouttes Illuminatrices Acide Hyaluronique & Vitamine C", ean: "9782017332558", note: 16.51, releveeLe: "2026-11-28" },
    { produit: "Nivea Expert Filler Cellular Sérum Illuminateur Vitamine C 30 ml", ean: "4006000155128", note: 16.38, releveeLe: "2026-11-28" },
    { produit: "Vichy Liftactiv Sérum Éclat 16% Vitamine C Pure 20 ml", ean: "3337875796583", note: 12.21, releveeLe: "2026-11-28" },
    { produit: "CeraVe Skin Renewing Vitamin C Serum 30 ml", ean: "3337875903738", note: 12.08, releveeLe: "2026-11-28" },
    { produit: "SkinCeuticals CE Ferulic Sérum triple anti-oxydant", ean: "0635494363203", note: 12.03, releveeLe: "2026-11-28" },
    { produit: "Garnier Skin Active Vitamine C Sérum Nuit 10% Vitamine C Pure 30 ml", ean: "3600542543323", note: 11.87, releveeLe: "2026-11-28" },
    { produit: "Avène A-Oxitive Sérum Défense Antioxydant 30 ml", ean: "3282779309646", note: 7.6, releveeLe: "2026-11-28" },
    { produit: "La Roche-Posay Pure Vitamin C12 Sérum 30 ml", ean: "3337875909235", note: 7.51, releveeLe: "2026-11-28" },
    { produit: "L'Oréal Revitalift Clinical Sérum Visage à la Vitamine C 30 ml", ean: "3600524069797", note: 7.29, releveeLe: "2026-11-28" },
    { produit: "Medik8 C-Tetra Lipid Vitamin C Antioxidant Serum 30 ml", ean: "0818625020989", note: 1, releveeLe: "2026-11-28" },
  ],
};

export default article;
