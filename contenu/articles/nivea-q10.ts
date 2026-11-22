import type { Article } from "@/contenu/articles";

/**
 * Publié le 22/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz et produits du moment » (`suif-de-boeuf` sortait de la fenêtre des
 * dix derniers) : suite de `creme-nivea-composition`, la page la plus
 * affichée du blog sur Google, sur la méthode « grande marque de pharmacie,
 * gamme notée » (leçon vérifiée trois fois : Nivea, CeraVe crèmes, CeraVe
 * nettoyants). Volumes (`VOLUMES.md`) : « nivea q10 » 1 k à 10 k (22/10/2026,
 * France seule et cinq zones), « nivea q10 avis » 100 à 1 k (+900 %).
 * Suggestions Google du jour : « nivea q10 avis que choisir », « nivea q10 avis
 * dermatologue », « nivea q10 jour et nuit », « nivea q10 corps », « crème
 * nivea q10 anti rides avis ». Premiers résultats : fiches de magasins (Auchan,
 * Notino) et de la marque ; aucun ne compare les listes jour et nuit.
 *
 * Chiffres : `cosme_check.catalog_export`, fiches actives, relevé du
 * 22/11/2026. 3 823 produits avec UBIQUINONE dans la liste, dont 625 de la
 * marque Nivea. 299 fiches Nivea « Q10 » de soin du visage (plusieurs pays et
 * éditions d'une même crème) : 121 avec au moins un filtre UV organique de
 * l'annexe VI (note médiane 7,63), 178 sans (16,18). Place médiane du Q10 :
 * 13e, pour une liste médiane de 28 ingrédients ; créatine dans 267 fiches,
 * parfum dans 269. Paires jour et nuit comparées sur la liste découpée aux
 * virgules (Sensitive : 23 et 23 ingrédients, 15 communs ; Power : 31 et 27,
 * 15 communs). Fiches Nivea « Q10 » pour le corps : 126, médiane 11,79.
 * Les notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "nivea-q10",
  titre: "Nivea Q10 : ta crème de nuit a deux fois la note de ta crème de jour, et ce n'est pas la faute du Q10",
  titreSeo: "Nivea Q10 : avis et composition, jour ou nuit",
  resume:
    "Nivea Q10 : 299 fiches lues. Crèmes de nuit, note médiane 16,18. Crèmes de jour avec filtre solaire, 7,63. Ce qui change, et laquelle choisir.",
  chapo:
    "Les crèmes Nivea Q10 sont bien notées la nuit et deux fois moins le jour. Le Q10 n'y est pour rien : il est dans les deux pots. ++La différence, ce sont les filtres solaires ajoutés à la crème de jour.++",
  publieLe: "2026-11-22",
  modifieLe: "2026-11-22",
  minutes: 7,
  theme: "nivea q10",
  motsCles: [
    "nivea q10",
    "nivea q10 avis",
    "crème nivea q10",
    "nivea q10 jour et nuit",
    "nivea q10 power",
    "nivea q10 anti-rides",
    "crème nivea q10 anti rides avis",
    "coenzyme q10 crème",
  ],
  categorie: "Marques",
  couverture: {
    src: "/image/blog/nivea-q10.webp",
    alt: "Un pot de crème de jour en verre, ouvert, l'opercule argenté soulevé, à côté de son couvercle bleu.",
    largeur: 1200,
    hauteur: 900,
    credit: "Benff, via Wikimedia Commons",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Day_cream_02.jpg",
  },
  blocs: [
    { type: "h2", texte: "Nivea Q10 : que vaut la gamme, d'après sa composition ?" },
    {
      type: "p",
      texte:
        "La gamme a deux visages. Dans la base Cosme Check, on compte 299 fiches de soins du visage Nivea « Q10 », éditions de plusieurs pays comprises. ==Les 178 sans filtre solaire ont une note médiane de 16,18. Les 121 avec filtre solaire tombent à 7,63.== La médiane, c'est la valeur du milieu : la moitié des produits est au-dessus, l'autre moitié en dessous.",
    },
    {
      type: "p",
      texte:
        "Dit autrement : presque toutes les crèmes de nuit Q10 sont dans le vert, et presque toutes les crèmes de jour à FPS sont dans l'orange. Le FPS (ou SPF), c'est le facteur de protection contre les coups de soleil.",
    },
    {
      type: "p",
      texte:
        "Si la boîte bleue t'intéresse aussi, on a lu sa liste ligne par ligne dans [notre décryptage de la crème Nivea](/blog/creme-nivea-composition).",
    },

    { type: "h2", texte: "C'est quoi, le Q10, dans une crème ?" },
    {
      type: "fiche",
      titre: "Coenzyme Q10",
      inci: "Ubiquinone",
      niveau: "incertain",
      effet:
        "Une molécule que nos cellules fabriquent pour produire leur énergie. C'est aussi un antioxydant : il freine l'oxydation, l'usure des cellules par l'oxygène et les UV. Appliqué sur la peau, il en augmente le taux dans l'épiderme. Un effet visible sur les rides n'est pas démontré par des études indépendantes.",
      statut: "Autorisé dans l'Union européenne, sans limite de dose propre.",
    },
    {
      type: "p",
      texte:
        "Le Q10, ou coenzyme Q10, s'écrit **Ubiquinone** dans la liste INCI (la liste officielle des ingrédients, rangés du plus dosé au moins dosé). Notre peau en contient moins avec l'âge et après le soleil.",
    },
    {
      type: "p",
      texte:
        "Les études sur la peau viennent surtout des chercheurs de Beiersdorf, le groupe qui fabrique Nivea. En 2015, 73 femmes ont appliqué des crèmes au Q10 pendant deux semaines. Le Q10 est bien monté dans les couches profondes de l'épiderme, avec un effet antioxydant mesuré ([Knott et al., *BioFactors*, 2015](https://pubmed.ncbi.nlm.nih.gov/26648450/)). C'est sérieux, mais c'est la marque qui mesure sa propre molécule.",
    },
    {
      type: "p",
      texte:
        "Dans les crèmes Nivea, le Q10 arrive en général vers la 13e place, au milieu de la liste. La marque ne publie pas sa dose. Il est presque toujours suivi de la **créatine** (267 fiches sur 299), une molécule qui aide les cellules à stocker leur énergie, elle aussi étudiée par Beiersdorf ([Lenz et al., 2005](https://pubmed.ncbi.nlm.nih.gov/15675966/)).",
    },

    { type: "h2", texte: "Pourquoi la crème de jour Nivea Q10 est-elle moins bien notée ?" },
    {
      type: "p",
      texte:
        "À cause de ses filtres solaires. Un filtre solaire est un ingrédient qui arrête une partie des UV. La crème de jour en contient trois à cinq, et la crème de nuit aucun. Le reste se ressemble beaucoup.",
    },
    {
      type: "p",
      texte:
        "Prends la gamme **Sensitive**, la plus simple à comparer. Les deux crèmes ont 23 ingrédients, sans parfum, et 15 sont communs : l'eau, la glycérine, le beurre de karité, le Q10, la créatine, l'extrait de réglisse. La crème de jour ajoute quatre filtres : Ethylhexyl Salicylate, Butyl Methoxydibenzoylmethane, Octocrylene et Phenylbenzimidazole Sulfonic Acid.",
    },
    {
      type: "tableau",
      entetes: ["Gamme Nivea Q10", "Crème de jour, avec filtres", "Crème de nuit, sans filtre"],
      lignes: [
        ["Sensitive.", "Soin de Jour Apaisant FPS 15 : 7,63 sur 20.", "Soin de Nuit Apaisant : 16,56 sur 20."],
        ["Power.", "Soin de Jour Extra Fermeté FPS 30 : 7,89 sur 20.", "Soin de Nuit Raffermissant : 16,61 sur 20."],
        ["Energy.", "Crème de Jour Anti-rides FPS 15 : 7,58 sur 20.", "Crème de Nuit Anti-rides : 16,21 sur 20."],
        ["Extra Nourrissant 60+.", "Crème de Jour FPS 15 : 7,86 sur 20.", "Crème de Nuit : 16,08 sur 20."],
      ],
      legende: "Base Cosme Check, fiches actives, relevé du 22/11/2026.",
    },
    {
      type: "p",
      texte:
        "Notre base classe ces filtres en orange, parfois en rouge, et la note baisse d'autant plus qu'ils sont haut dans la liste. Le plus bas de la gamme le montre : le **Soin de Jour Pores Resserrés Texture Légère**, avec l'octocrylène en 3e place, obtient 3,14 sur 20.",
    },
    {
      type: "p",
      texte:
        "Ces filtres sont autorisés. L'octocrylène, par exemple, est limité à 10 % de la formule depuis 2022, après un avis du SCCS, le comité scientifique européen pour la sécurité des consommateurs ([règlement (UE) 2022/1176](https://eur-lex.europa.eu/eli/reg/2022/1176/oj)). Notre note signale un ingrédient à surveiller, pas un produit interdit.",
    },
    {
      type: "cta",
      texte:
        "**Ton pot Nivea Q10, c'est lequel ?** Scanne son code-barres avec Cosme Check : tu vois en dix secondes s'il contient des filtres solaires, et à quelle place.",
    },

    { type: "h2", texte: "Nivea Q10 jour ou nuit : laquelle choisir ?" },
    {
      type: "p",
      texte:
        "Ça dépend de ce que tu mets déjà le matin. ++La note ne mesure pas la protection solaire++ : une crème de jour à FPS 15 protège mieux qu'une crème sans filtre, même si elle est moins bien notée.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Tu mets une vraie crème solaire chaque matin** : une crème hydratante sans filtre suffit dessous. La crème de nuit Q10 de ta gamme, ou le baume Collagen Expert « jour et nuit » (16,62 sur 20), font l'affaire.",
        "**Tu ne mets rien d'autre** : garde une crème de jour avec filtre. L'Académie américaine de dermatologie conseille au moins un FPS 30 pour le visage au quotidien ([AAD](https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-select-sunscreen)). Dans la gamme, vise donc une version **FPS 30**, pas FPS 15.",
        "**Ta peau tire ou réagit facilement** : les versions Sensitive n'ont pas de parfum, alors que 269 fiches Q10 de la marque sur 299 en contiennent.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Une crème de jour à FPS 15 **sous** une crème solaire : tu paies deux fois les filtres, et tu ajoutes des ingrédients à ta routine pour rien.",
        "Compter sur une crème FPS 15 pour une journée dehors : la dose qu'on met sur le visage est souvent bien plus faible que celle des tests. Revois [les erreurs qui divisent ton SPF](/blog/spf-50-visage-7-erreurs).",
      ],
    },
    {
      type: "p",
      texte:
        "Ce schéma n'est pas propre à Nivea. On l'a retrouvé dans [251 gammes jour et nuit](/blog/creme-de-nuit), et la Q10 Intense de Cien chez Lidl suit exactement la même règle ([notre lecture de la marque Cien](/blog/cien-lidl)).",
    },

    { type: "h2", texte: "Et le Q10 pour le corps ?" },
    {
      type: "p",
      texte:
        "Les laits et crèmes Q10 pour le corps n'ont pas de filtre solaire, mais ils ne montent pas aussi haut. Sur 126 fiches, la note médiane est de 11,79. Le réflexe ne change pas : lis le haut de la liste, là où sont les gros dosages.",
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "Le Q10 est le même le jour et la nuit. Ce qui fait chuter la crème de jour, ce sont ses filtres solaires. Si tu mets déjà une crème solaire, prends la version sans filtre. Sinon, choisis un FPS 30. Et pour une peau qui réagit fort, demande conseil à ton pharmacien ou à un dermatologue.",
    },
  ],
  faq: [
    {
      question: "La crème Nivea Q10 anti-rides est-elle efficace ?",
      reponse:
        "Le Q10 appliqué sur la peau en augmente le taux dans l'épiderme et agit comme antioxydant, selon une étude de 2015 menée par les chercheurs de Nivea. Aucune étude indépendante ne prouve qu'il efface les rides. La crème hydrate bien, et c'est déjà ce qui lisse la peau au quotidien.",
    },
    {
      question: "Faut-il prendre Nivea Q10 jour et nuit ?",
      reponse:
        "Pas forcément. Les deux crèmes partagent le Q10 et la créatine. La crème de jour ajoute surtout des filtres solaires. Si tu mets déjà une crème solaire le matin, la crème de nuit ou un baume sans filtre peut servir matin et soir. Sinon, garde une crème de jour, de préférence en FPS 30.",
    },
    {
      question: "Quelle différence entre Nivea Q10 Power et Q10 Energy ?",
      reponse:
        "Les deux contiennent du Q10. La gamme Power ajoute de l'acide hyaluronique, une molécule qui retient l'eau à la surface de la peau. La gamme Energy mise sur la vitamine C dans sa crème de jour. Dans notre base, les crèmes de nuit des deux gammes dépassent 16, les crèmes de jour à FPS restent sous 8.",
    },
    {
      question: "Nivea Q10 corps : même formule que le visage ?",
      reponse:
        "Non. Les laits et crèmes Q10 pour le corps gardent le Q10, souvent avec de la vitamine C, mais leur formule est différente. Ils n'ont pas de filtre solaire. Dans notre base, leur note médiane est de 11,79 sur 126 fiches, plus bas que les crèmes de nuit pour le visage.",
    },
  ],
  notes: [
    { produit: "Nivea, Q10 Anti-rides Sensitive Soin de Jour Apaisant FPS 15", ean: "4005900561619", note: 7.63, releveeLe: "2026-11-22" },
    { produit: "Nivea, Q10 Anti-rides Sensitive Soin de Nuit Apaisant", ean: "4005900545589", note: 16.56, releveeLe: "2026-11-22" },
    { produit: "Nivea, Q10 Anti-rides Power Soin de Jour Extra Fermeté FPS 30", ean: "4005900192479", note: 7.89, releveeLe: "2026-11-22" },
    { produit: "Nivea, Q10 Anti-rides Power Soin de Nuit Raffermissant", ean: "4005808966875", note: 16.61, releveeLe: "2026-11-22" },
    { produit: "Nivea, Q10 Energy Crème de Jour Anti-rides FPS 15", ean: "4005808920242", note: 7.58, releveeLe: "2026-11-22" },
    { produit: "Nivea, Q10 Energy Crème de Nuit Anti-rides", ean: "0056594014749", note: 16.21, releveeLe: "2026-11-22" },
    { produit: "Nivea, Q10 Crème de Jour Anti-rides 60+ Extra Nourrissante SPF 15", ean: "4005900661364", note: 7.86, releveeLe: "2026-11-22" },
    { produit: "Nivea, Q10 Crème de Nuit Anti-rides 60+ Extra Nourrissante", ean: "4005900661371", note: 16.08, releveeLe: "2026-11-22" },
    { produit: "Nivea, Q10 Anti-rides Pores Resserrés Soin de Jour Texture Légère", ean: "4005808330577", note: 3.14, releveeLe: "2026-11-22" },
    { produit: "Nivea, Q10 Anti-rides Collagen Expert Baume riche jour et nuit", ean: "4006000231310", note: 16.62, releveeLe: "2026-11-22" },
  ],
};

export default article;
