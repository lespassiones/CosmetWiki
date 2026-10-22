import type { Article } from "@/contenu/articles";

/**
 * Publié le 22/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz » (saisonnier) : « calendrier de l'avent maquillage » et « calendrier
 * de l'avent sephora » pèsent 10 k à 100 k recherches par mois, « calendrier
 * de l'avent beauté » 10 k à 100 k avec +9 900 % sur trois mois
 * (`docs/seo/VOLUMES.md`, 21 et 22/10/2026). Les premiers résultats sont des
 * pages marchandes et des sites de bons plans : aucun ne parle des
 * compositions. Aucun prix, aucune note : les calendriers de la base ne
 * portent qu'une seule liste INCI pour 24 produits, elle ne dit rien du
 * coffret.
 */
const article: Article = {
  slug: "calendrier-avent-beaute",
  titre: "Calendrier de l'Avent beauté : 24 cases, 24 compositions (et tu n'en lis aucune)",
  titreSeo: "Calendrier de l'Avent beauté : ce qu'il cache",
  resume:
    "Calendrier de l'Avent beauté : où lire les ingrédients des miniatures, le parfum qui s'accumule, les actifs à ne pas mélanger et le bon geste à l'ouverture.",
  chapo:
    "Un calendrier de l'Avent beauté, ce n'est pas un produit : c'est **jusqu'à 24 compositions différentes**, souvent sans leur liste d'ingrédients sous les yeux. Avant d'ouvrir la première case, quatre réflexes évitent la mauvaise surprise de décembre, et ++le dernier change la façon d'ouvrir les cases++.",
  publieLe: "2026-10-22",
  modifieLe: "2026-10-22",
  minutes: 7,
  theme: "calendrier de l'avent beauté",
  motsCles: [
    "calendrier de l'avent beauté",
    "calendrier de l'avent beauté 2026",
    "calendrier de l'avent maquillage",
    "calendrier avent cosmétique",
    "calendrier de l'avent beauté ado",
    "calendrier de l'avent maquillage enfant",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/calendrier-avent-beaute.webp",
    alt: "Vingt-quatre petits sacs en papier kraft numérotés et décorés de flocons, posés sur un parquet comme un calendrier de l'Avent.",
    largeur: 1024,
    hauteur: 768,
    credit: "Le living and co., via Flickr",
    licence: "CC BY 2.0",
    source: "https://www.flickr.com/photos/89292944@N05/8247944906",
  },
  blocs: [
    { type: "h2", texte: "Qu'y a-t-il vraiment dans un calendrier de l'Avent beauté ?" },
    {
      type: "p",
      texte:
        "Un calendrier de l'Avent beauté contient surtout des **miniatures** : des soins, du maquillage, des produits pour le bain, parfois une bougie ou un accessoire. « 24 surprises » ne veut donc pas dire 24 cosmétiques. Une trousse, un bandeau ou un pinceau comptent aussi pour une case.",
    },
    {
      type: "p",
      texte:
        "Les calendriers sont partout depuis début octobre : en parfumerie, en pharmacie, au supermarché, chez Kruidvat en Belgique ou chez Pharmaprix au Québec. Les recherches suivent : ==« calendrier de l'avent beauté » a été multiplié par cent en trois mois== selon le Planificateur de mots clés de Google (relevé du 21/10/2026). Certaines marques disent combien de produits sont en taille normale. Le calendrier *Sephora Favorites* 2026 annonce 24 surprises dont 14 en taille standard ([fiche Manor](https://www.manor.ch/fr/p/10004201375)).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Cherche la liste du contenu avant d'acheter : la plupart des marques la dévoilent, et les sites de bons plans la recopient.",
        "Compte les vrais soins, le maquillage et les accessoires. C'est souvent très différent de ce que la boîte laisse croire.",
        "Regarde les contenances en ml. Un sérum de 5 ml dure environ deux semaines, une crème de 15 ml un peu plus.",
      ],
    },
    {
      type: "encadre",
      ton: "ambre",
      titre: "La « valeur » annoncée",
      texte:
        "Elle est calculée par la marque à partir des grands formats. Elle dit combien coûterait le contenu au détail, ++pas s'il convient à ta peau++.",
    },

    { type: "h2", texte: "Où trouver les ingrédients d'une miniature ?" },
    {
      type: "p",
      texte:
        "La liste INCI, c'est la liste officielle des ingrédients, rangée du plus dosé au moins dosé. Elle est obligatoire sur tout cosmétique vendu en Europe, mais la loi autorise à l'imprimer seulement sur l'emballage extérieur ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Quand le produit est trop petit, elle peut être sur une notice, une étiquette ou une carte jointe. Un dessin le signale : une main qui tient un livre ouvert.",
    },
    {
      type: "p",
      texte:
        "Pour les savons, les boules de bain et les autres petits produits, la règle va plus loin : la liste peut même se trouver sur une affichette près du produit, au magasin. Or un calendrier ne passe jamais par le rayon case par case. En 2017, [l'UFC-Que Choisir](https://www.quechoisir.org/actualite-produits-cosmetiques-camera-cachee-mais-ou-sont-les-listes-d-ingredients-n46460/) avait déjà cherché ces notices en magasin, sans jamais les obtenir.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Garde la petite boîte de chaque case jusqu'à la fin du produit : la liste est souvent dessus, pas sur le tube.",
        "Pas de boîte ? Photographie le dos du flacon avant de jeter quoi que ce soit.",
        "Rien d'écrit nulle part : cherche le produit par son nom sur le site de la marque, ou dans une application qui lit les listes.",
      ],
    },

    { type: "h2", texte: "Pourquoi le parfum s'accumule-t-il en décembre ?" },
    {
      type: "p",
      texte:
        "Parce que presque chaque case sent bon. Gel douche, lait pour le corps, baume, mini parfum : dans notre base, ==deux produits sur trois contiennent du [Parfum](/i/parfum)== (relevé du 21/10/2026). Ouvrir un produit parfumé neuf chaque matin, c'est en mettre beaucoup plus que d'habitude sur la peau.",
    },
    {
      type: "p",
      texte:
        "Or pour l'allergie, c'est la dose totale qui compte. Le [règlement (UE) 2023/1545](https://eur-lex.europa.eu/eli/reg/2023/1545/oj) le rappelle, en s'appuyant sur l'avis du SCCS de 2012 (le comité scientifique européen sur la sécurité des consommateurs). Les substances parfumantes viennent de nombreux produits, et c'est la quantité cumulée sur la peau qui pèse. Un allergène, c'est une molécule qui peut provoquer une allergie chez certaines personnes : [Limonene](/i/limonene), [Linalool](/i/linalool), [Coumarin](/i/coumarin) ou [Benzyl Alcohol](/i/benzyl-alcohol) en font partie.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ne mets pas trois nouveaux produits parfumés le même jour : garde le gel douche pour demain.",
        "Ta peau a déjà réagi à un parfum ? Repère ses allergènes dans l'ancienne liste et cherche-les dans chaque case.",
        "Une rougeur qui gratte, qui gonfle ou qui revient : arrête le produit et parles-en à un pharmacien ou à un dermatologue.",
      ],
    },

    { type: "h2", texte: "Rétinol, acides, vitamine C : faut-il tout tester d'un coup ?" },
    {
      type: "p",
      texte:
        "Non : un seul nouvel actif à la fois. Un actif, c'est l'ingrédient qui fait l'effet promis. Les calendriers de soin glissent souvent des sérums puissants dans les cases. Le [rétinol](/i/retinol) est un dérivé de la vitamine A qui peut tirailler au début. Les acides de fruits (AHA), comme l'[acide glycolique](/i/glycolic-acid) ou l'[acide lactique](/i/lactic-acid), font peler la couche de surface. Et il y a souvent de la vitamine C ([Ascorbic Acid](/i/ascorbic-acid)).",
    },
    {
      type: "p",
      texte:
        "Le piège, c'est d'ouvrir le rétinol le 3 décembre et l'exfoliant le 4, puis de tout mettre le même soir. Ces deux-là ensemble peuvent irriter. La règle simple : un sérum neuf, quelques soirs seuls, puis le suivant. La [niacinamide](/blog/niacinamide), elle, se mélange sans souci avec presque tout.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Fais un essai : une noisette dans le pli du coude, deux soirs de suite. Rien ne bouge ? Tu peux passer au visage.",
        "Un seul actif fort par soirée : rétinol **ou** acide, jamais les deux.",
        "Le lendemain matin d'un rétinol ou d'un acide, une crème solaire, même en hiver ([nos 7 erreurs avec le SPF](/blog/spf-50-visage-7-erreurs)).",
      ],
    },
    {
      type: "cta",
      texte:
        "**Une case, un scan.** Cherche la miniature dans Cosme Check ou colle sa liste : l'app te montre en couleurs les ingrédients que tu préfères éviter.",
    },

    { type: "h2", texte: "Calendrier maquillage : quelles cases regarder de près ?" },
    {
      type: "p",
      texte:
        "Le calendrier de maquillage est le plus recherché de tous. Ses cases demandent trois coups d'œil. D'abord, les produits pour les yeux : mascara et crayon se gardent peu une fois ouverts, et ne se prêtent pas. Ensuite, les couleurs : les noms en « CI » suivis de chiffres sont des pigments, comme le [mica](/i/mica) qui fait briller. Notre méthode pour [analyser une composition](/blog/analyse-composition-cosmetique) les décode.",
    },
    {
      type: "p",
      texte:
        "Enfin, les paillettes. Depuis le 17 octobre 2023, l'Europe interdit la vente de paillettes en plastique en vrac ([règlement (UE) 2023/2055](https://eur-lex.europa.eu/eli/reg/2023/2055/oj)). Les autres cosmétiques ont des délais pour s'en passer : jusqu'en 2035 pour le maquillage, les lèvres et les ongles. Les fards à paupières pailletés d'un calendrier restent donc autorisés, mais les formules changent peu à peu. Pour les gloss et les huiles à lèvres des cases, notre article sur [les lip oils](/blog/lip-oils-huiles-levres) lit une formule complète.",
    },

    { type: "h2", texte: "Le dernier réflexe : pourquoi ne pas tout ouvrir en décembre ?" },
    {
      type: "p",
      texte:
        "Chaque miniature porte un petit pot ouvert avec « 6M » ou « 12M » : c'est le nombre de mois pendant lesquels elle reste bonne une fois ouverte. Il est obligatoire quand le produit se garde plus de 30 mois fermé (règlement 1223/2009, article 19). Si tu ouvres les 24 cases en décembre, une partie aura tourné au printemps, avant d'avoir servi.",
    },
    {
      type: "p",
      texte:
        "Le geste qui change tout : ouvre la case, découvre le produit, puis ++ne casse pas l'opercule tant que tu n'en as pas besoin++. Une miniature encore fermée attend sagement janvier, février ou les vacances. Et écris la date d'ouverture au feutre sous le tube. Ton calendrier dure alors trois mois au lieu de trois semaines.",
    },
  ],
  faq: [
    {
      question: "Que contient un calendrier de l'Avent beauté ?",
      reponse:
        "Surtout des miniatures : soins du visage et du corps, maquillage, produits pour le bain, parfois un mini parfum, une bougie ou un accessoire comme une trousse. Le nombre de cases ne dit pas le nombre de cosmétiques. Cherche la liste du contenu, que la plupart des marques publient, et compte les vrais soins et les grands formats.",
    },
    {
      question: "Quel calendrier de l'Avent beauté pour une ado ?",
      reponse:
        "Un calendrier de maquillage léger ou de soins doux convient mieux qu'un calendrier anti-âge. À l'adolescence, la peau n'a pas besoin de rétinol ni d'acides puissants, qui peuvent l'irriter. Vérifie les listes d'ingrédients, évite les cases très parfumées si la peau réagit, et garde un démaquillant simple pour le soir.",
    },
    {
      question: "Un calendrier de l'Avent maquillage pour enfant, c'est une bonne idée ?",
      reponse:
        "Oui pour jouer, à condition de choisir un calendrier conçu pour les enfants et vendu comme cosmétique, avec sa liste d'ingrédients. Préfère des produits qui partent à l'eau, peu ou pas parfumés, et démaquille le soir même. Un jouet de maquillage vendu sans liste INCI ne se met pas sur la peau.",
    },
    {
      question: "Un calendrier de l'Avent maquillage bio est-il mieux pour la peau ?",
      reponse:
        "Pas forcément. Bio veut dire que certains ingrédients viennent de l'agriculture biologique, pas qu'ils conviennent à toutes les peaux. Les huiles essentielles, fréquentes dans le bio, contiennent des allergènes comme le limonene ou le linalool. Lis la liste de chaque case, comme pour un calendrier classique.",
    },
  ],
};

export default article;
