import type { Article } from "@/contenu/articles";

/**
 * Publié le 14/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz » (`peptide-de-cuivre` sortait de la fenêtre des dix derniers) : le
 * « project pan », finir ses cosmétiques avant d'en racheter, revenu sur
 * TikTok et repris par Elle Suisse, à deux semaines du Black Friday (27/11).
 * Volumes du 14/11/2026 (dix zones : France, Belgique, Suisse, Luxembourg,
 * Monaco, Andorre, Canada, Nouvelle-Calédonie, Polynésie française,
 * Saint-Pierre-et-Miquelon ; toutes langues : `docs/seo/VOLUMES.md`) :
 * « project pan » 1 k à 10 k, +900 % sur trois mois et sur un an,
 * concurrence faible. Les parts « sans eau » viennent de `cosme_check.catalog`
 * (fiches actives avec une liste, catégorie de la base, liste sans « Aqua »
 * ni « Water », relevé du 14/11/2026). Aucune note de produit.
 */
const article: Article = {
  slug: "project-pan",
  titre: "Project pan : finis tes produits avant d'en racheter, sauf ton mascara (on a lu 6 380 fards)",
  titreSeo: "Project pan : c'est quoi, et comment le faire",
  resume:
    "Le project pan, la tendance TikTok qui fait finir ses cosmétiques avant d'en racheter. Quoi finir d'abord, quoi jeter, et ce que l'eau dans la liste change.",
  chapo:
    "Le project pan, c'est finir ses cosmétiques jusqu'au bout avant d'en racheter. Bonne idée, à une condition : tout ne se finit pas. Dans notre base, ==4 fards à paupières sur 5 ne contiennent pas d'eau==, et se gardent longtemps. ++95 % des mascaras en contiennent++, et ceux-là ne se finissent pas : ils se jettent.",
  publieLe: "2026-11-14",
  modifieLe: "2026-11-14",
  minutes: 7,
  theme: "project pan",
  motsCles: [
    "project pan",
    "project pan c'est quoi",
    "project pan tiktok",
    "finir ses produits de beauté",
    "no buy",
    "low buy",
    "déconsommation beauté",
    "durée de vie maquillage",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/project-pan.webp",
    alt: "Un boîtier de trois fards à paupières roses et bruns, entouré d'autres boîtiers ronds dont certains sont vides jusqu'au fond.",
    largeur: 1024,
    hauteur: 576,
    credit: "Debs (ò‿ó)♪, via Flickr",
    licence: "CC BY 2.0",
    source: "https://www.flickr.com/photos/30223382@N06/4748054995",
  },
  blocs: [
    { type: "h2", texte: "Le project pan, c'est quoi ?" },
    {
      type: "p",
      texte:
        "Le project pan est un défi : choisir quelques produits déjà ouverts et les utiliser jusqu'au bout, sans rien racheter entre-temps. Le nom vient du « pan », le fond métallique d'un boîtier de poudre, qui apparaît quand le produit s'use. Elle Suisse le présente comme une tendance contre la surconsommation ([Elle Suisse](https://elle.ch/166479/beaute/tiktok-quelle-est-cette-tendance-beaute-anti-surconsommation)).",
    },
    {
      type: "p",
      texte:
        "L'idée n'a rien de neuf. Des vidéastes de YouTube filmaient déjà leurs produits terminés vers 2014, et un forum Reddit y est consacré depuis 2015. Mais l'intérêt pour le project pan a bondi de 572,9 % depuis 2024, selon l'outil de tendances Spate cité par [Glossy (décembre 2025)](https://www.glossy.co/beauty/beauty-sales-are-booming-and-so-is-project-pan/).",
    },
    {
      type: "p",
      texte:
        "Chez nous aussi, ça monte. « Project pan » est tapé ==dix fois plus qu'il y a trois mois== en France, en Belgique, en Suisse et au Canada (Planificateur de mots clés de Google, relevé du 14/11/2026). Le moment s'y prête : le Black Friday tombe le 27 novembre, et les calendriers de l'Avent remplissent déjà les tiroirs.",
    },

    { type: "h2", texte: "Pourquoi certains produits se gardent et d'autres non ?" },
    {
      type: "p",
      texte:
        "À cause de l'eau. Les microbes ont besoin d'eau pour se multiplier. Un produit qui en contient a donc besoin de **conservateurs**, des ingrédients qui freinent les bactéries et les moisissures, comme le [phénoxyéthanol](/i/phenoxyethanol) ([Halla et al., *Molecules*, 2018](https://doi.org/10.3390/molecules23071571)). Une poudre sans eau leur offre peu de prise.",
    },
    {
      type: "p",
      texte:
        "Pour le savoir, pas besoin de laboratoire : lis la liste INCI, la liste officielle des ingrédients au dos de l'emballage. L'eau y porte le nom d'[Aqua](/i/aqua) ou de Water, souvent en premier. On a regardé combien de produits de notre base n'en contiennent pas du tout.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Part sans eau dans la liste", "Pour ton project pan"],
      lignes: [
        ["Rouge à lèvres (11 487 fiches).", "87,5 %.", "Peut attendre, s'il ne sent pas le rance."],
        ["Fard à paupières (6 380 fiches).", "81,5 %.", "Le vrai terrain du « pan » : il se garde longtemps."],
        ["Poudre compacte (2 097 fiches).", "75,9 %.", "Peut attendre."],
        ["Blush (4 796 fiches).", "74,2 %.", "Peut attendre."],
        ["Fond de teint (10 877 fiches).", "15,7 %.", "À finir en priorité."],
        ["Crème solaire (11 282 fiches).", "12,4 %.", "À finir avant la date, ou à jeter."],
        ["Mascara (3 444 fiches).", "4,7 %.", "Ne se finit pas : il se jette à quelques mois."],
        ["Crème visage (13 216 fiches).", "1,9 %.", "À finir en priorité, dans son délai."],
      ],
      legende:
        "Fiches actives de la base Cosme Check dont la liste ne contient ni « Aqua » ni « Water », par catégorie, relevé du 14/11/2026.",
    },
    {
      type: "p",
      texte:
        "Sans eau ne veut pas dire éternel. Les huiles et les cires d'un rouge à lèvres finissent par rancir, c'est-à-dire s'oxyder à l'air et sentir fort. Et un produit qu'on pose sur la bouche ou près des yeux reçoit des microbes à chaque passage. Mais une palette de fards à base de [mica](/i/mica) et de [talc](/i/talc) tient bien plus longtemps qu'une crème.",
    },

    { type: "h2", texte: "Quels produits ne faut-il surtout pas finir ?" },
    {
      type: "p",
      texte:
        "Ceux qui ont dépassé leur délai, même à moitié pleins. Ce délai s'écrit sur l'emballage : une date, ou le petit pot ouvert avec « 6M » ou « 12M », le nombre de mois après ouverture ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Notre guide pour savoir [si une crème est périmée](/blog/creme-perimee) détaille chaque signe.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Le mascara : les fabricants conseillent en général de le jeter deux à quatre mois après l'achat, parce que la brosse ramène des microbes à chaque passage ([FDA, Shelf Life and Expiration Dating of Cosmetics](https://www.fda.gov/cosmetics/cosmetics-labeling/shelf-life-and-expiration-dating-cosmetics)).",
        "La crème solaire trop vieille ou restée au chaud : sa protection n'est plus garantie. Voir [les 7 erreurs qui divisent ton SPF](/blog/spf-50-visage-7-erreurs).",
        "Tout produit dont l'odeur, la couleur ou la texture a changé.",
        "Un produit qui pique, rougit ou gratte : le finir n'a rien d'un exploit. Arrête, et parles-en à ton pharmacien si ça dure.",
      ],
    },
    {
      type: "p",
      texte:
        "La même source le rappelle : un mascara sec ne se ranime jamais avec de l'eau, et encore moins avec de la salive. On y ajouterait justement les microbes que les conservateurs tiennent à distance.",
    },

    { type: "h2", texte: "Comment faire un project pan qui marche ?" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Vide ton tiroir et fais le tri : ce qui est périmé ou abîmé part, avant tout le reste.",
        "Choisis cinq produits, pas plus. Commence par ceux qui contiennent de l'eau, dont le délai court déjà : crème, fond de teint, crème solaire.",
        "Écris la date d'ouverture au feutre sur chaque produit que tu gardes.",
        "Un produit fini, c'est un produit remplacé, un seul. Pas trois en promotion.",
        "Garde les emballages vides jusqu'à la fin du défi : les voir s'empiler motive plus qu'une liste.",
      ],
    },
    {
      type: "encadre",
      titre: "La règle à retenir",
      ton: "ambre",
      texte:
        "**Finis d'abord ce qui contient de l'eau.** Les poudres, les rouges à lèvres et les fards peuvent attendre leur tour. Le mascara, lui, n'attend personne.",
    },
    {
      type: "cta",
      texte:
        "**Que vaut ce qui reste dans ton tiroir ?** Scanne chaque produit avec Cosme Check : en dix secondes, tu vois sa liste, la couleur de chaque ingrédient et sa note, avant de décider s'il mérite ton project pan.",
    },

    { type: "h2", texte: "Et si un produit ne te convient pas ?" },
    {
      type: "p",
      texte:
        "Alors ne te force pas. Le project pan vise à moins gaspiller, pas à supporter une crème trop riche ou un parfum qui irrite. Pour savoir ce qui va vraiment à ta peau, commence par [connaître ton type de peau](/blog/type-de-peau), puis pose-toi [les trois questions qui disent si un cosmétique est fait pour toi](/blog/cosmetique-fait-pour-toi).",
    },
    {
      type: "p",
      texte:
        "Un produit encore fermé et dans son délai peut se donner, à quelqu'un de ton entourage ou à une association qui en accepte. Et pour la suite, une [routine courte de trois produits](/blog/routine-skincare) se vide bien plus vite qu'une étagère de dix flacons.",
    },

    { type: "h2", texte: "Le vrai gain du project pan ?" },
    {
      type: "p",
      texte:
        "Apprendre à lire avant d'acheter. Beaucoup de crèmes partagent la même base : eau, glycérine, quelques huiles. Avant de craquer pour une nouveauté le jour du Black Friday, compare sa liste avec celle du pot que tu as déjà, grâce à notre méthode d'[analyse de composition en 5 étapes](/blog/analyse-composition-cosmetique).",
    },
    {
      type: "p",
      texte:
        "Et voici l'ironie de la tendance. Le « pan », ce fond qu'on est si fier de montrer, n'apparaît que sur les poudres. ++Ce sont justement les produits qui pressent le moins++ : sans eau, ils se gardent longtemps. Ceux qu'il faut vraiment finir à temps, les crèmes et les fonds de teint, n'offrent jamais ce petit trophée.",
    },
  ],
  faq: [
    {
      question: "Project pan c'est quoi ?",
      reponse:
        "C'est un défi venu des communautés beauté : choisir quelques cosmétiques déjà ouverts et les finir jusqu'au bout avant d'en racheter. Le nom vient du « pan », le fond métallique d'un boîtier de poudre qui apparaît quand le produit s'use. La tendance revient sur TikTok contre la surconsommation, avant le Black Friday.",
    },
    {
      question: "Comment faire un project pan ?",
      reponse:
        "Trie d'abord ton tiroir et jette ce qui est périmé ou abîmé. Choisis ensuite cinq produits au plus, en commençant par ceux qui contiennent de l'eau, comme les crèmes et les fonds de teint, dont le délai court déjà. Note la date d'ouverture, et ne rachète qu'un produit pour un produit fini.",
    },
    {
      question: "Combien de produits pour un project pan ?",
      reponse:
        "Il n'y a pas de règle officielle, mais cinq produits est un bon départ : assez pour voir des résultats, assez peu pour tous les utiliser chaque semaine. Prends-en dans plusieurs familles, par exemple une crème, un fond de teint et une palette, pour ne pas t'ennuyer et vider en priorité ce qui se garde le moins.",
    },
    {
      question: "Faut-il finir un produit périmé ?",
      reponse:
        "Non. Un produit qui a dépassé sa date ou le délai du pot ouvert peut contenir des microbes, et ses conservateurs ne sont plus garantis. Le mascara se jette en général deux à quatre mois après l'achat, et une crème solaire trop vieille ne protège plus comme prévu. Le project pan s'arrête là où commence le risque.",
    },
  ],
};

export default article;
