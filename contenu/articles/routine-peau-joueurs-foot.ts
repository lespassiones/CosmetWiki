import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/routine-peau-joueurs-foot/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Il gagne une
 * source : l'annonce de House 99 par L'Oréal (2018), seule affirmation sur
 * une personnalité nommée. Le titre promettait « la routine de Ronaldo,
 * Mbappé & co décryptée » alors que le texte ne dit rien d'eux : il est
 * réécrit, parce que la doctrine interdit de prêter une routine à une
 * célébrité sans source (docs/seo/ROBOT.md, section 5). Le format de ce fichier est décrit en tête de
 * `contenu/articles.ts`.
 */
const article: Article = {
  slug: "routine-peau-joueurs-foot",
  titre: "Skincare des stars du foot : ce que leur peau subit, et la routine à copier en 3 minutes",
  titreSeo: "Routine peau footballeur : la version à copier",
  resume:
    "Soleil, sueur, voyages : pourquoi les footballeurs soignent leur peau, les ingrédients qui comptent et la routine simple à copier en 3 minutes par jour.",
  chapo:
    "Pendant la **Coupe du monde**, leurs visages passent en gros plan des centaines de fois par match. Et beaucoup l'ont compris : une peau nette, c'est aussi une image de marque. Mais derrière les routines impressionnantes des stars, ++l'essentiel tient en 3 gestes++ accessibles à tout le monde, pas besoin d'un contrat à 200 millions.",
  publieLe: "2026-06-17",
  modifieLe: "2026-11-02",
  minutes: 5,
  theme: "routine peau footballeur",
  motsCles: [
    "soin visage homme",
    "routine peau homme simple",
    "skincare homme coupe du monde",
    "David Beckham House 99",
    "soin peau sportif",
    "routine peau homme 2026",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/foot-skincare/hero.webp",
    alt: "Dans un vestiaire, un joueur en maillot bleu applique une crème sur sa joue devant le miroir, entouré de coéquipiers.",
    largeur: 1536,
    hauteur: 1024,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "Pourquoi les footballeurs soignent leur peau ?" },
    {
      type: "p",
      texte:
        "Parce que leur peau encaisse beaucoup, et que leur visage passe en gros plan. Soleil, sueur, douches répétées, avion : tout ce qui abîme une peau, un joueur le vit chaque semaine. Bonne nouvelle, la tienne vit la même chose à plus petite dose, à la salle de sport, au stade ou en vacances.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Le soleil et la sueur :** entraînements en plein air, transpiration, douches répétées. La barrière de la peau, ce film de gras et de cellules qui retient l'eau, s'use plus vite. Résultat : teint terne, tiraillements, parfois des boutons.",
        "**Les voyages :** l'air de l'avion et des hôtels est sec. La peau perd son eau, comme chez n'importe quel grand voyageur.",
        "**L'image :** caméras, sponsors, réseaux sociaux. Certaines stars ont même leur marque de soins : ==David Beckham a lancé House 99== avec L'Oréal ([annonce de L'Oréal, 2018](https://www.loreal.com/en/news/brands/david-beckham-partners-with-loreal-and-launches-house-99/)).",
      ],
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "Le vrai parallèle",
      texte:
        "Soleil, sueur, fatigue : c'est ce que vit ta peau en été, après le sport ou en festival. La routine des pros se copie ==telle quelle==.",
    },

    { type: "h2", texte: "Qu'est-ce qu'une routine de sportif contient vraiment ?" },
    {
      type: "p",
      texte:
        "Trois produits, pas dix. Les routines qui marchent tournent autour des mêmes familles, et chacune a un rôle simple.",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Un nettoyant doux**, matin et soir, pour enlever la sueur et le sébum (le gras naturel de la peau) sans la décaper.",
        "**Une crème hydratante légère**, en gel ou en émulsion non grasse, qui ne colle pas sur une peau qui transpire.",
        "**Une crème solaire SPF 50** chaque matin. Le SPF, c'est l'indice de protection contre les coups de soleil. Une étude australienne l'a mesuré : ceux qui en mettaient chaque jour avaient ++24 % de signes de vieillissement en moins++ après quatre ans et demi ([Hughes et al., *Annals of Internal Medicine*, 2013](https://pubmed.ncbi.nlm.nih.gov/23732711/)).",
        "**Parfois un actif**, c'est-à-dire l'ingrédient qui fait le travail promis : de la vitamine C le matin, du [rétinol](/blog/retinol) ou un acide le soir, jamais les deux le même soir.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Méfie-toi des routines en **10 étapes** sur les réseaux : spectaculaires, mais souvent sponsorisées. Plus de produits ne veut pas dire une meilleure peau.",
        "Les **parfums forts** des soins « pour hommes » (après-rasage, gels « fraîcheur ») irritent une peau déjà fatiguée par la sueur.",
      ],
    },
    {
      type: "image",
      src: "/image/blog/foot-skincare/image1.webp",
      alt: "Routine de soin du visage masculine simple : nettoyant, crème hydratante et protection solaire posés côte à côte",
      largeur: 1280,
      hauteur: 853,
      credit: "Cosme Check",
      licence: "illustration générée par IA pour Cosme Check",
    },

    { type: "h2", texte: "Quelle routine copier en 3 minutes par jour ?" },
    {
      type: "p",
      texte:
        "Celle-ci, qui tient en trois moments. L'ordre suit la règle de toute [routine skincare](/blog/routine-skincare) : du plus léger au plus épais, et la crème solaire en dernier le matin.",
    },
    {
      type: "tableau",
      entetes: ["Moment", "Geste", "Pourquoi"],
      lignes: [
        ["**Matin.**", "Nettoyant, hydratant, SPF 50.", "Protège du soleil toute la journée."],
        ["**Après le sport.**", "Rinçage à l'eau, hydratant léger.", "Enlève la sueur et évite les tiraillements."],
        ["**Soir.**", "Nettoyant, et un soir sur deux un actif.", "Travaille la texture et les marques."],
      ],
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "Astuce terrain",
      texte:
        "Tu transpires beaucoup ? Garde un ==SPF en stick== dans ton sac et remets-en à la pause. La crème solaire part avec la sueur et le frottement de la serviette. Les [7 erreurs qui divisent ton SPF](/blog/spf-50-visage-7-erreurs) disent combien en mettre.",
    },

    { type: "h2", texte: "Quels ingrédients chercher dans un soin pour sportif ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**[Niacinamide](/i/niacinamide) :** c'est la vitamine B3, qui aide la peau à garder son eau et à rester nette. Notre [guide de la niacinamide](/blog/niacinamide) détaille ce qu'elle fait vraiment.",
        "**Acide hyaluronique ([Sodium Hyaluronate](/i/sodium-hyaluronate)) :** il retient l'eau sans graisser, pratique après l'effort et l'avion.",
        "**Filtres solaires récents**, comme le [Tinosorb S](/i/bis-ethylhexyloxyphenol-methoxyphenyl-triazine) : ils couvrent les UVA et les UVB, sans laisser de traces blanches.",
        "**Vitamine C ([Ascorbic Acid](/i/ascorbic-acid)) :** un antioxydant qui redonne de l'éclat à un teint terne.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Alcool dénaturé ([Alcohol Denat.](/i/alcohol-denat-)) en tête de liste :** il dessèche, et on le croise souvent dans les soins « pour hommes ».",
        "**[Parfum](/i/parfum) très présent :** c'est l'une des causes les plus fréquentes d'allergie aux cosmétiques, selon le comité d'experts de la Commission européenne ([SCCS, 2012](https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf)).",
        "**Crème trop riche sur une peau à boutons :** vérifie ce que veut dire [« comédogène »](/blog/comedogene) avant de choisir.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Scanne le soin que tu utilises déjà.** Avant d'acheter la crème « du joueur préféré », vérifie sa composition avec Cosme Check : la couleur de chaque ingrédient, l'alcool et le parfum repérés en dix secondes.",
    },

    { type: "h2", texte: "Ce qu'il faut retenir" },
    {
      type: "liste",
      style: "coches",
      items: [
        "La peau nette des pros tient à ==3 gestes==, pas à 10 produits.",
        "**Nettoyant doux, hydratant léger, SPF 50** : la base, quel que soit ton sport.",
        "En hiver, quand le froid s'ajoute à la sueur, passe à une crème un peu plus riche : notre guide de la [peau sèche](/blog/peau-seche-visage) explique comment.",
        "Méfie-toi du marketing « star » : c'est la liste INCI qui compte, pas le nom sur le flacon. La liste INCI, c'est la liste officielle des ingrédients, du plus dosé au moins dosé.",
      ],
    },
  ],
  faq: [
    {
      question: "Quelle routine peau pour un homme sportif ?",
      reponse:
        "Trois gestes suffisent. Le matin : un nettoyant doux, une crème hydratante légère et un SPF 50. Après le sport : un rinçage à l'eau et un hydratant léger. Le soir : un nettoyant, et un soir sur deux un actif comme le rétinol ou un acide, pour la texture et les marques.",
    },
    {
      question: "Pourquoi les footballeurs prennent soin de leur peau ?",
      reponse:
        "Entraînements au soleil, sueur, douches répétées, avion et air sec des hôtels : leur barrière cutanée est mise à rude épreuve. Leur visage passe aussi en gros plan devant les caméras 4K, et plusieurs stars ont lancé une marque de soin, comme David Beckham avec House 99.",
    },
    {
      question: "Quels ingrédients éviter dans un soin pour homme ?",
      reponse:
        "Méfie-toi de l'alcool dénaturé (*Alcohol denat.*) en tête de liste : il dessèche, et il revient souvent dans les soins « pour hommes ». Surveille aussi le parfum (*Parfum* ou *Fragrance*) très présent : c'est l'une des causes les plus fréquentes d'allergie aux cosmétiques, surtout sur une peau déjà agressée par la sueur.",
    },
    {
      question: "Faut-il mettre de la crème solaire quand on fait du sport ?",
      reponse:
        "Oui. Un SPF 50 chaque matin protège des coups de soleil et du vieillissement : dans une étude australienne de 2013, ceux qui en mettaient tous les jours avaient 24 % de signes de vieillissement en moins. Si tu transpires beaucoup, garde un SPF en stick dans ton sac et remets-en pendant la pause.",
    },
  ],
};

export default article;
