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
  modifieLe: "2026-06-17",
  minutes: 4,
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
    { type: "h2", texte: "1. Pourquoi les joueurs soignent (vraiment) leur peau" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Le soleil et la sueur :** entraînements en plein air, transpiration permanente, douches répétées… la barrière cutanée prend cher. Sans protection, ça donne teint terne, déshydratation et imperfections.",
        "**Les voyages incessants :** avion, décalage horaire, air sec des hôtels. La peau se déshydrate vite, exactement comme pour n'importe quel grand voyageur.",
        "**L'exposition médiatique :** caméras 4K, sponsoring beauté, réseaux sociaux. Plusieurs stars ont lancé ou prêté leur image à des marques de soin : ==David Beckham avec House 99== en est l'exemple le plus connu ([annonce de L'Oréal, 2018](https://www.loreal.com/en/news/brands/david-beckham-partners-with-loreal-and-launches-house-99/)).",
      ],
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "Le vrai parallèle",
      texte:
        "Ce que vit la peau d'un joueur (soleil + sueur + fatigue) est exactement ce que vit la tienne en été, à la salle de sport ou en festival. La routine est ==transposable à 100 %==.",
    },

    { type: "h2", texte: "2. Ce qu'ils utilisent vraiment (sans le marketing)" },
    {
      type: "p",
      texte:
        "Au-delà des marques de stars, les routines partagées par les dermatologues du sport et les préparateurs reviennent toujours aux mêmes familles de produits :",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Un nettoyant doux** matin et soir pour éliminer sueur et sébum sans décaper.",
        "**Une crème hydratante légère**, souvent un gel ou une émulsion non grasse, adaptée aux peaux qui transpirent.",
        "**Une protection solaire SPF 50** systématique : c'est ++le geste anti-âge n°1++, et le plus négligé chez les hommes.",
        "**Parfois un actif ciblé :** vitamine C le matin (éclat), rétinol ou acide le soir (texture, marques).",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Méfie-toi des routines **« 10 étapes »** postées sur les réseaux : spectaculaires, mais souvent du contenu sponsorisé. Plus de produits ≠ meilleure peau.",
        "Les **parfums forts** dans les soins masculins (after-shave, gels « fraîcheur ») irritent les peaux déjà agressées par la sueur.",
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

    { type: "h2", texte: "3. La routine « niveau pro » en 3 minutes par jour" },
    {
      type: "tableau",
      entetes: ["Moment", "Geste", "Pourquoi"],
      lignes: [
        ["**Matin**", "Nettoyant + hydratant + SPF 50", "Protège du soleil et de la pollution toute la journée"],
        ["**Après sport**", "Rinçage à l'eau + hydratant léger", "Évite boutons et tiraillements liés à la sueur"],
        ["**Soir**", "Nettoyant + (1 soir / 2) actif", "Régénération nocturne, texture et marques"],
      ],
    },
    {
      type: "encadre",
      ton: "rose",
      titre: "Astuce terrain",
      texte:
        "Tu transpires beaucoup ? Garde un ==SPF en stick== ou une brume dans ton sac pour réappliquer à la mi-temps, exactement ce que font les staffs médicaux pour les joueurs sur le banc.",
    },

    { type: "h2", texte: "4. Les ingrédients qui comptent vraiment" },
    {
      type: "liste",
      style: "coches",
      items: [
        "**Niacinamide :** régule le sébum et apaise, parfait pour les peaux qui transpirent.",
        "**Acide hyaluronique :** réhydrate sans graisser, idéal après l'effort et les voyages.",
        "**Filtres solaires modernes** (*Tinosorb, Uvinul*) : large spectre, texture légère, pas d'effet blanc.",
        "**Vitamine C (*Ascorbic acid*) :** coup d'éclat anti-teint terne, antioxydant.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**Alcool dénaturé (*Alcohol denat.*) en tête de liste :** dessèche, fréquent dans les soins « pour hommes ».",
        "**Parfum (*Parfum / Fragrance*) très présent :** première cause d'allergie cosmétique.",
      ],
    },
    {
      type: "cta",
      texte:
        "**Scanne le soin que tu utilises déjà.** Avant d'acheter la crème « du joueur préféré », vérifie sa vraie composition avec Cosme Check : note ingrédient par ingrédient, alerte sur l'alcool et les parfums, et alternatives plus propres.",
    },

    { type: "h2", texte: "En résumé" },
    {
      type: "liste",
      style: "coches",
      items: [
        "La peau nette des stars du foot tient à ==3 gestes==, pas à 10 produits hors de prix.",
        "**Nettoyant doux + hydratant léger + SPF 50** : la base qui marche pour 90 % des hommes.",
        "Soleil et sueur abîment ta peau exactement comme la leur : la protection solaire est non négociable.",
        "Méfie-toi du marketing « star » : c'est l'INCI qui compte, pas le nom sur le flacon.",
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
        "Méfie-toi de l'alcool dénaturé (*Alcohol denat.*) en tête de liste : il dessèche, et il revient souvent dans les soins « pour hommes ». Surveille aussi le parfum (*Parfum* ou *Fragrance*) très présent, première cause d'allergie cosmétique, surtout sur une peau déjà agressée par la sueur.",
    },
    {
      question: "Faut-il mettre de la crème solaire quand on fait du sport ?",
      reponse:
        "Oui. Un SPF 50 chaque matin est le geste anti-âge numéro un, et le plus négligé chez les hommes. Si tu transpires beaucoup, garde un SPF en stick ou une brume dans ton sac pour en remettre pendant la pause, comme les joueurs à la mi-temps.",
    },
  ],
};

export default article;
