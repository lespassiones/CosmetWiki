import type { Article } from "@/contenu/articles";

/**
 * Publié le 08/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « comparatif honnête » (`cerave-creme-hydratante` sortait de la fenêtre des
 * dix derniers) : « cerave gel moussant » pèse 10 k à 100 k recherches par
 * mois, « cerave nettoyant », « cerave nettoyant visage », « gel moussant
 * cerave » et « cerave gel moussant anti imperfection » 1 k à 10 k chacune
 * (`docs/seo/VOLUMES.md`, 01/11/2026). Les premiers résultats sont des
 * pharmacies en ligne qui recopient la fiche de la marque : aucune ne compare
 * les nettoyants entre eux. Listes INCI, couleurs et notes relevées dans la
 * base Cosme Check le 08/11/2026 (`cosme_check.catalog_export` et
 * `cosme_check.ingredients`) ; les neuf notes sont déclarées dans `notes`.
 * Les pourcentages du rayon portent sur les 5 415 produits actifs des
 * catégories gel, crème et mousse nettoyante visage, dédoublonnés par
 * code-barres.
 */
const article: Article = {
  slug: "cerave-gel-moussant",
  titre: "Gel moussant CeraVe : on a lu les 9 nettoyants de la marque, et le mieux noté n'est pas le plus connu",
  titreSeo: "CeraVe gel moussant : quel nettoyant choisir ?",
  resume:
    "9 nettoyants CeraVe lus et notés : gel moussant, crème lavante, anti-imperfections. Une mousse à 16,52 sur 20, et une crème moussante à 60 ingrédients.",
  chapo:
    "Le Gel Moussant CeraVe est un bon nettoyant pour peau normale à grasse : sans parfum, sans sulfate, noté 12,12 sur 20. Mais ce n'est pas le mieux noté de la marque. On a lu les neuf nettoyants vendus en pharmacie, et ++le premier de la liste est une mousse dont presque personne ne parle++.",
  publieLe: "2026-11-08",
  modifieLe: "2026-11-08",
  minutes: 8,
  theme: "cerave gel moussant",
  motsCles: [
    "cerave gel moussant",
    "cerave nettoyant",
    "cerave nettoyant visage",
    "cerave gel moussant anti imperfection",
    "cerave crème lavante hydratante",
    "cerave gel moussant ou crème lavante",
    "quel nettoyant cerave choisir",
    "cerave nettoyant acide salicylique",
  ],
  categorie: "Marques",
  couverture: {
    src: "/image/blog/cerave-gel-moussant.webp",
    alt: "Deux mains en coupe sous le jet d'un robinet, au-dessus d'un lavabo blanc.",
    largeur: 1024,
    hauteur: 683,
    credit: "Freddy The Boy, via Flickr",
    licence: "CC BY 2.0",
    source: "https://www.flickr.com/photos/31557656@N06/3491641571",
  },
  blocs: [
    { type: "h2", texte: "Quel nettoyant CeraVe choisir ?" },
    {
      type: "p",
      texte:
        "Celui qui va à ta peau, et de préférence l'un des sept notés 12,11 sur 20 ou plus. Tous les nettoyants CeraVe partagent la même base : de l'eau, de la [glycérine](/blog/glycerine) et trois céramides. Ce qui change, c'est l'ingrédient qui lave. Voici les neuf nettoyants vendus en France, lus dans notre base.",
    },
    {
      type: "tableau",
      entetes: ["Nettoyant", "Pour qui, selon la marque", "Ingrédients", "Note Cosme Check"],
      lignes: [
        ["Mousse Nettoyante Équilibrante (148 ml).", "Peaux mixtes à grasses.", "26, aucun orange.", "16,52 sur 20."],
        ["Argile-moussante Nettoyante Anti-imperfections (118 ml).", "Peaux à imperfections.", "27, dont 1 orange.", "12,32 sur 20."],
        ["Gel Moussant Anti-imperfections (236 ml).", "Peaux à imperfections.", "27, dont 1 orange.", "12,18 sur 20."],
        ["Crème Lavante Hydratante (473 ml).", "Peaux normales à sèches.", "24, dont 3 orange.", "12,17 sur 20."],
        ["SA Gel Nettoyant Anti-rugosités (236 ml).", "Peaux sèches et rugueuses.", "24, dont 1 orange.", "12,17 sur 20."],
        ["Gel Moussant (236 ml).", "Peaux normales à grasses.", "25, dont 2 orange.", "12,12 sur 20."],
        ["Gel Nettoyant Éclat Vitamine C (236 ml).", "Teint terne.", "32, dont 3 orange.", "12,11 sur 20."],
        ["Huile Lavante Moussante Hydratante (473 ml).", "Peaux sèches, visage et corps.", "33, dont 7 orange.", "7,78 sur 20."],
        ["Crème Moussante Nettoyante Hydratante (473 ml).", "Peaux normales à sèches.", "60, dont 12 orange.", "7,70 sur 20."],
      ],
      legende:
        "Listes, couleurs et notes relevées dans la base Cosme Check le 08/11/2026. [Comment l'app classe les ingrédients](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "Sept nettoyants sur neuf se tiennent entre 12,11 et 16,52. Les deux derniers décrochent, et ==leur liste est la plus longue==. On retrouve la règle déjà vue sur les [crèmes hydratantes CeraVe](/blog/cerave-creme-hydratante).",
    },

    { type: "h2", texte: "Qu'est-ce qui lave, dans un gel moussant CeraVe ?" },
    {
      type: "p",
      texte:
        "Des tensioactifs doux, et aucun sulfate. Un tensioactif, c'est l'ingrédient qui attrape le gras et la saleté pour que l'eau les emporte. Les plus connus sont les sulfates, comme le [Sodium Laureth Sulfate](/i/sodium-laureth-sulfate), qui moussent beaucoup.",
    },
    {
      type: "p",
      texte:
        "Le Gel Moussant utilise d'autres tensioactifs : la [Cocamidopropyl Hydroxysultaine](/i/cocamidopropyl-hydroxysultaine) en 2e place, puis le [Sodium Lauroyl Sarcosinate](/i/sodium-lauroyl-sarcosinate) en 4e. Ils moussent moins fort. Pourquoi c'est important ? Les tensioactifs trop forts peuvent abîmer les protéines et les graisses de la peau, d'où les tiraillements après le lavage ([Ananthapadmanabhan et al., *Dermatologic Therapy*, 2004](https://pubmed.ncbi.nlm.nih.gov/14728695/)).",
    },
    {
      type: "p",
      texte:
        "Notre base le confirme : sur 5 415 nettoyants visage, ==28 % des gels contiennent du Sodium Laureth Sulfate==, et 73,5 % de tous les nettoyants sont parfumés. Les 32 nettoyants visage CeraVe de la base n'ont ni l'un ni l'autre.",
    },
    {
      type: "fiche",
      titre: "Sodium Lauroyl Sarcosinate",
      inci: "SODIUM LAUROYL SARCOSINATE",
      niveau: "prouve",
      effet:
        "Un tensioactif tiré d'un acide aminé et d'un acide gras. Il nettoie et mousse, plus doucement qu'un sulfate.",
      statut: "Autorisé dans l'Union européenne comme ingrédient cosmétique.",
    },
    {
      type: "p",
      texte:
        "Et les céramides ? Ce sont des graisses que ta peau fabrique pour retenir son eau. On en trouve dans tous les nettoyants CeraVe, contre 3,4 % des nettoyants des autres marques. Mais ++un nettoyant reste moins d'une minute sur la peau++, puis part à l'eau. Ne compte pas sur lui comme sur une crème.",
    },

    { type: "h2", texte: "CeraVe gel moussant ou crème lavante ?" },
    {
      type: "p",
      texte:
        "Gel si ta peau brille, crème si elle tire. Le Gel Moussant est fait pour les peaux normales à grasses : il mousse et laisse la peau nette. Il apporte aussi de la [niacinamide](/blog/niacinamide), la vitamine B3, en 7e place.",
    },
    {
      type: "p",
      texte:
        "La Crème Lavante Hydratante, elle, ne mousse presque pas. Juste après l'eau et la glycérine, on lit des alcools gras, des graisses qui adoucissent la peau. ++Elle lave comme un lait++, sans le gros tensioactif qui fait la mousse. C'est le bon choix pour une peau sèche en hiver, à Montréal comme à Genève.",
    },
    {
      type: "p",
      texte:
        "Tu hésites encore sur ton type de peau ? Le [test du mouchoir](/blog/type-de-peau) se fait en deux heures, chez toi.",
    },

    { type: "h2", texte: "Pourquoi la Mousse Équilibrante est la mieux notée ?" },
    {
      type: "p",
      texte:
        "Parce que ses 26 ingrédients sont tous verts ou jaunes dans la base. Pas de PEG, pas de polysorbate, pas de phénoxyéthanol. Elle lave avec des tensioactifs doux, comme le [Disodium Cocoyl Glutamate](/i/disodium-cocoyl-glutamate), et des [glycolipides](/i/glycolipids).",
    },
    {
      type: "p",
      texte:
        "Les autres perdent des points sur des PEG, comme le [PEG-150 Pentaerythrityl Tetrastearate](/i/peg-150-pentaerythrityl-tetrastearate) qui épaissit le Gel Moussant. Un PEG est un ingrédient fabriqué par éthoxylation, un procédé polluant : la base les classe orange pour ça. Ce n'est pas un danger pour ta peau, c'est un choix de formule.",
    },
    {
      type: "cta",
      texte:
        "**Ton nettoyant, c'est lequel ?** Scanne son code-barres avec Cosme Check : tu vois sa liste, la couleur de chaque ingrédient et sa note en dix secondes.",
    },

    { type: "h2", texte: "Que vaut le gel moussant anti-imperfections CeraVe ?" },
    {
      type: "p",
      texte:
        "C'est un gel bien noté, à 12,18, avec un vrai dosage d'actif. L'[acide salicylique](/i/salicylic-acid) arrive en 6e place. C'est un BHA, un acide exfoliant qui entre dans les pores et décolle les cellules mortes de la surface.",
    },
    {
      type: "p",
      texte:
        "En Europe, il est plafonné à 2 % dans la plupart des cosmétiques et interdit dans ceux pour les moins de 3 ans, sauf les shampooings ([règlement (UE) 2019/1966](https://eur-lex.europa.eu/eli/reg/2019/1966/oj)). Dans un gel qu'on rince, il agit peu de temps : c'est un appoint, pas un soin à lui seul. On l'a déjà vu dans les [pads Medicube](/blog/medicube-zero-pore-pad).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Peau qui brille vite : le Gel Moussant, ou la Mousse Équilibrante, mieux notée.",
        "Peau à petits boutons : le Gel Moussant Anti-imperfections ou l'Argile-moussante, matin ou soir.",
        "Peau sèche ou qui tire : la Crème Lavante Hydratante, avec de l'eau tiède.",
        "Maquillage ou crème solaire à retirer : une huile d'abord, puis le nettoyant. Le [double nettoyage](/blog/eau-micellaire-ou-huile-demaquillante) tient en deux gestes.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ne cumule pas un nettoyant à l'acide salicylique, un sérum exfoliant et du [rétinol](/blog/retinol) (un dérivé de la vitamine A) le même soir si ta peau tiraille.",
        "Lave ton visage matin et soir, et après le sport, du bout des doigts, sans frotter ([AAD](https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101)).",
        "Des boutons qui font mal, durent ou laissent des marques : parles-en à un dermatologue ou à ton pharmacien.",
      ],
    },

    { type: "h2", texte: "Et la Crème Moussante, pourquoi 7,70 ?" },
    {
      type: "p",
      texte:
        "Parce que sa liste compte 60 ingrédients, plus du double des autres. On y lit cinq PEG ou PPG, du [Chlorphenesin](/i/chlorphenesin), un conservateur, et un polysorbate : douze ingrédients orange au total. L'Huile Lavante Moussante, à 7,78, place un PEG dès la 3e place.",
    },
    {
      type: "p",
      texte:
        "Ça ne veut pas dire qu'elles lavent mal. Leur texture plaît, et elles restent sans parfum. Mais à usage égal, la Crème Lavante fait le même travail pour une peau sèche avec 24 ingrédients et 12,17 sur 20.",
    },
    {
      type: "p",
      texte:
        "Le geste à garder pour la fin : ++au rayon, ne lis pas le nom, compte les lignes++. Parmi ces neuf nettoyants, tous ceux qui ont moins de 30 ingrédients sont notés 12,12 sur 20 ou plus. Ensuite, une crème suit toujours le lavage : l'[ordre de la routine](/blog/routine-skincare) tient en quatre gestes.",
    },
  ],
  faq: [
    {
      question: "Quel nettoyant CeraVe choisir ?",
      reponse:
        "Pour une peau normale à grasse, le Gel Moussant (12,12 sur 20) ou la Mousse Nettoyante Équilibrante, la mieux notée de la marque à 16,52. Pour une peau sèche, la Crème Lavante Hydratante (12,17), qui mousse peu. Pour de petits boutons, le Gel Moussant Anti-imperfections, à l'acide salicylique (12,18).",
    },
    {
      question: "CeraVe gel moussant ou crème lavante ?",
      reponse:
        "Le gel moussant convient aux peaux normales à grasses : il mousse grâce à des tensioactifs doux, sans sulfate, et contient de la niacinamide. La crème lavante convient aux peaux normales à sèches : elle nettoie comme un lait, avec des alcools gras, et laisse moins de tiraillements. Les deux sont sans parfum, notés 12,12 et 12,17 sur 20.",
    },
    {
      question: "CeraVe gel moussant anti-imperfection : quel avis ?",
      reponse:
        "Sur la composition, c'est un bon gel : 12,18 sur 20 dans Cosme Check, sans parfum ni sulfate, avec de l'acide salicylique en 6e place et de la niacinamide. Comme il se rince, l'acide agit peu de temps : c'est un appoint. Si des boutons font mal ou laissent des marques, demande conseil à un dermatologue.",
    },
    {
      question: "Quel nettoyant CeraVe pour peau mixte ?",
      reponse:
        "Le Gel Moussant pour peaux normales à grasses, ou la Mousse Nettoyante Équilibrante, faite pour les peaux mixtes à grasses et notée 16,52 sur 20, sans aucun ingrédient orange. Si tes joues tirent en hiver, garde la Crème Lavante Hydratante pour le soir et le gel pour le matin.",
    },
  ],
  notes: [
    {
      produit: "CeraVe, Mousse Nettoyante Équilibrante (148 ml)",
      ean: "3337875925334",
      note: 16.52,
      releveeLe: "2026-11-08",
    },
    {
      produit: "CeraVe, Argile-moussante Nettoyante Anti-imperfections (118 ml)",
      ean: "3337875926836",
      note: 12.32,
      releveeLe: "2026-11-08",
    },
    {
      produit: "CeraVe, Gel Moussant Anti-imperfections (236 ml)",
      ean: "3433425436159",
      note: 12.18,
      releveeLe: "2026-11-08",
    },
    {
      produit: "CeraVe, Crème Lavante Hydratante (473 ml)",
      ean: "3337875905602",
      note: 12.17,
      releveeLe: "2026-11-08",
    },
    {
      produit: "CeraVe, SA Gel Nettoyant Anti-rugosités (236 ml)",
      ean: "3433425349428",
      note: 12.17,
      releveeLe: "2026-11-08",
    },
    {
      produit: "CeraVe, Gel Moussant peaux normales à grasses (236 ml)",
      ean: "3337875597128",
      note: 12.12,
      releveeLe: "2026-11-08",
    },
    {
      produit: "CeraVe, Gel Nettoyant Éclat Vitamine C (236 ml)",
      ean: "3337875952804",
      note: 12.11,
      releveeLe: "2026-11-08",
    },
    {
      produit: "CeraVe, Huile Lavante Moussante Hydratante (473 ml)",
      ean: "3337875773447",
      note: 7.78,
      releveeLe: "2026-11-08",
    },
    {
      produit: "CeraVe, Crème Moussante Nettoyante Hydratante (473 ml)",
      ean: "3337875884389",
      note: 7.7,
      releveeLe: "2026-11-08",
    },
  ],
};

export default article;
