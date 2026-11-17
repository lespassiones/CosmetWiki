import type { Article } from "@/contenu/articles";

/**
 * Publié le 17/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`), lors
 * d'un **passage spécial GTA 6** demandé par Brian (deuxième article du jour,
 * règle « un par jour » levée pour lui seul). Famille « buzz » : GTA 6 sort
 * le jeudi 19/11/2026 (PS5, Xbox Series X|S), c'est le crochet ; le sujet
 * reste les cernes, les poches et les soins du contour des yeux.
 * Volumes (Planificateur, 17/11/2026, dix zones, toutes langues,
 * `docs/seo/VOLUMES.md`) : « gta 6 » 1 M à 10 M (+900 % sur un an) ;
 * « poches sous les yeux » et « nuit blanche » 10 k à 100 k ; « cernes »,
 * « cernes sous les yeux », « cernes noires », « contour des yeux »,
 * « teint terne » 1 k à 10 k ; « contour des yeux caféine » et « yeux gonflés
 * le matin » 100 à 1 k ; « lumière bleue peau » et « crème anti lumière
 * bleue » 10 à 100 (d'où une seule section sur l'écran).
 * Les chiffres viennent de `cosme_check.catalog` (fiches actives, relevé du
 * 17/11/2026) : soins des yeux = rubriques `soin-des-yeux` (générique),
 * `soin-contour-des-yeux`, `anti-poches-anti-cernes`, `patch-contour-des-yeux`,
 * `masque-contour-des-yeux` et `soin-contour-yeux-anti-age` (6 641 fiches,
 * 6 626 avec une liste lisible). Caféine = élément « CAFFEINE » de la liste
 * (virgules entre chiffres neutralisées, « 1,2-hexanediol »). Promesse dans le
 * nom = « cerne », « poche », « dark circle », « puff », « anti-fatigue »,
 * « dégonfl », « décongest » (467 fiches). Aucune image de Rockstar.
 */
const article: Article = {
  slug: "gta-6-nuit-blanche-cernes",
  titre: "GTA 6 jusqu'à 4 h du matin ? Tes cernes vont parler, et 2 soins anti-cernes sur 3 n'ont même pas de caféine",
  titreSeo: "GTA 6 : cernes et poches après une nuit blanche",
  resume:
    "Nuit blanche sur GTA 6 : ce qui creuse les cernes et gonfle les yeux, ce que vaut la caféine, et ce qu'on a trouvé dans 6 626 soins des yeux.",
  chapo:
    "Après une nuit blanche sur **GTA 6**, les cernes et les poches viennent du manque de sommeil, pas de l'écran. Une compresse froide et une vraie nuit font plus que n'importe quel pot. La caféine aide un peu sur les poches, mais ++deux soins « anti-poches anti-cernes » sur trois n'en contiennent pas.++",
  publieLe: "2026-11-17",
  modifieLe: "2026-11-17",
  minutes: 7,
  theme: "cernes après une nuit blanche",
  motsCles: [
    "GTA 6",
    "GTA 6 nuit blanche",
    "cernes",
    "cernes sous les yeux",
    "poches sous les yeux",
    "yeux gonflés le matin",
    "contour des yeux caféine",
    "lumière bleue peau",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/gta-6-nuit-blanche-cernes.webp",
    alt: "Deux mains aux ongles vernis de noir tiennent une manette de console rose, devant une étagère de jeux et de livres.",
    largeur: 1200,
    hauteur: 774,
    credit: "InclusiveGameLab, via Wikimedia Commons",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:InclusiveGameLab_Person-with-PS5-Controller_2_CC-BY-SA.jpg",
    // La manette est à droite et en haut : sur téléphone, un cadrage centré la couperait.
    position: "68% 35%",
  },
  blocs: [
    {
      type: "encadre",
      ton: "indigo",
      titre: "GTA 6 en bref",
      texte:
        "Grand Theft Auto VI sort le **jeudi 19 novembre 2026** sur PS5 et Xbox Series X|S ([page officielle Xbox](https://www.xbox.com/fr-FR/games/grand-theft-auto-vi)). Rockstar a fixé cette date le 6 novembre 2025 ([Gematsu](https://www.gematsu.com/2025/11/grand-theft-auto-vi-delayed-to-november-19-2026)). Il est classé PEGI 18 ([Digital Trends, 4/10/2026](https://www.digitaltrends.com/gaming/gta-6-pegi-rating-detailed-decapitation-drug-use/)). Aucune date n'est annoncée pour la version PC.",
    },
    {
      type: "p",
      texte:
        "Les précommandes dépassent les attentes de l'éditeur, Take-Two ([Shacknews, novembre 2026](https://shacknews.com/article/151308/grand-theft-auto-6-pre-orders-q2-fy27)). Autrement dit : jeudi, beaucoup de monde va découvrir Vice City et l'État de Leonida tard dans la nuit. Et vendredi matin, beaucoup de visages vont le raconter. Voici ce qui se passe sous tes yeux, et ce qui marche vraiment.",
    },

    { type: "h2", texte: "Une nuit blanche se voit-elle vraiment sur le visage ?" },
    {
      type: "p",
      texte:
        "Oui, et les autres la voient. Des chercheurs suédois ont photographié dix personnes après une nuit normale, puis après 31 heures sans dormir. Quarante inconnus ont ensuite noté les photos. Après la nuit blanche, ils ont vu des paupières plus tombantes, des yeux plus rouges et plus gonflés, ==des cernes plus sombres== et une peau plus pâle ([Sundelin et al., *Sleep*, 2013](https://pubmed.ncbi.nlm.nih.gov/23997369/)).",
    },
    {
      type: "p",
      texte:
        "La bonne nouvelle, c'est que l'effet d'une seule nuit est passager. Une ou deux vraies nuits, et le visage revient à la normale. Ce qui dure, ce sont les cernes que tu avais déjà avant la partie.",
    },

    { type: "h2", texte: "Cernes ou poches : quelle différence ?" },
    {
      type: "p",
      texte:
        "Une cerne est une question de couleur, une poche est une question de volume. On les confond, mais elles n'ont pas les mêmes causes, et un soin ne fait pas les deux ([Sarkar et al., revue, 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4756872/)).",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "**La cerne bleue ou violette** : la peau sous l'œil est l'une des plus fines du corps, et on voit les petits vaisseaux à travers. La fatigue la rend plus visible.",
        "**La cerne brune** : un surplus de pigment, souvent de famille ou entretenu par le soleil. Une nuit blanche ne la crée pas, et une crème ne l'efface pas en un matin.",
        "**Le creux** : une ombre sous l'œil, liée à la forme du visage. Aucun soin ne la comble.",
        "**La poche** : un gonflement, souvent de l'eau retenue sous la paupière. C'est elle qui grossit après une nuit courte, un repas salé ou des larmes.",
      ],
    },
    {
      type: "p",
      texte:
        "Le test du miroir : tire doucement la peau sous l'œil. Si la couleur s'éclaircit, ce sont surtout des vaisseaux. Si elle reste, c'est du pigment.",
    },

    { type: "h2", texte: "La caféine dans un contour des yeux, ça marche ?" },
    {
      type: "p",
      texte:
        "Un peu, surtout sur les poches, et pour quelques heures. Appliquée sur la peau, la caféine resserre les petits vaisseaux et stimule la circulation, ce qui peut dégonfler et éclaircir légèrement ([Herman et Herman, *Skin Pharmacology and Physiology*, 2013](https://pubmed.ncbi.nlm.nih.gov/23075568/)).",
    },
    {
      type: "p",
      texte:
        "Les preuves restent minces. L'essai le plus cité a testé un patch à 3 % de caféine et de la vitamine K sous un seul œil, chez onze femmes. Au bout de quatre semaines, les cernes étaient moins marquées de ce côté ([Ahmadraji et Shatalebi, 2015](https://pubmed.ncbi.nlm.nih.gov/25625116/)). Onze personnes, c'est très peu. Retiens donc un effet réel mais modeste, pas un miracle.",
    },

    { type: "h2", texte: "Qu'y a-t-il vraiment dans un soin anti-cernes ?" },
    {
      type: "p",
      texte:
        "Pour le savoir, on a lu les listes INCI de ==6 626 soins des yeux== de la base Cosme Check, le 17/11/2026. La liste INCI, c'est la liste officielle des ingrédients, du plus dosé au moins dosé.",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Soins des yeux avec de la caféine.", "1 655, soit un sur quatre."],
        ["Les mêmes, avec la caféine parmi les cinq premiers ingrédients.", "160, soit un sur dix."],
        ["Rayon « anti-poches anti-cernes » avec de la caféine.", "968 sur 2 981, soit un sur trois."],
        ["Produits qui promettent cernes, poches ou fatigue dans leur nom, avec de la caféine.", "161 sur 467, soit un sur trois."],
        ["Soins des yeux avec du parfum.", "38,8 %."],
        ["Patchs pour les yeux avec du parfum.", "58,7 %."],
        ["Soins des yeux avec des nacres ou des pigments (mica, oxydes de fer).", "30,1 %."],
      ],
      legende: "Base Cosme Check, fiches actives, relevé du 17/11/2026.",
    },
    {
      type: "p",
      texte:
        "Trois choses sautent aux yeux. D'abord, la caféine est souvent loin dans la liste, donc peu dosée. Ensuite, beaucoup de produits « anti-fatigue » misent sur autre chose : l'hydratation, ou des nacres qui reflètent la lumière. Elles donnent un effet bonne mine tout de suite, puis partent au démaquillage. Enfin, le parfum est très présent sur la zone la plus fine du visage, surtout dans les patchs.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place de la caféine", "Note"],
      lignes: [
        ["The Ordinary, Caffeine Solution 5 % + EGCG.", "2e ingrédient.", "16,28 sur 20."],
        ["Typology, Lab-1003 Caféine 5 % + Niacinamide 5 %.", "3e sur 17.", "16,25 sur 20."],
        ["Nuxe, Prodigieuse [hyalu] Boost Stick Yeux Défatigant.", "5e sur 10.", "16,12 sur 20."],
        ["Vichy, Minéral 89 Yeux.", "6e sur 15.", "16,51 sur 20."],
        ["La Roche-Posay, Hydraphase HA Yeux.", "6e sur 18.", "11,6 sur 20."],
        ["Nivea, Luminous 630 crème yeux anti-cernes.", "15e, après un actif pour les taches brunes.", "12,35 sur 20."],
        ["Neutrogena, Hydro Boost Soin Réveil Contour des Yeux.", "Aucune : il mise sur l'hydratation.", "16,39 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 17/11/2026.",
    },
    {
      type: "p",
      texte:
        "La note dit si la formule est bien faite pour la peau, pas si elle dégonfle. Un produit sans caféine peut être un très bon soin hydratant. Pour lire une liste toi-même, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },
    {
      type: "cta",
      texte:
        "**Ton contour des yeux contient-il vraiment de la caféine ?** Scanne-le avec Cosme Check : tu vois sa place dans la liste, et s'il y a du parfum, en dix secondes.",
    },

    { type: "h2", texte: "Et la lumière bleue de l'écran, elle abîme la peau ?" },
    {
      type: "p",
      texte:
        "Celle de ton écran, très peu. En laboratoire, une forte lumière bleue-violette a bien causé des taches brunes durables sur des peaux mates ([Duteil et al., 2014](https://pubmed.ncbi.nlm.nih.gov/24888214/)). Mais ces lampes étaient bien plus puissantes qu'une télé.",
    },
    {
      type: "p",
      texte:
        "Les chercheurs de Beiersdorf, le groupe qui fabrique Nivea, ont fait le calcul pour un écran à 30 cm. Une semaine entière devant équivaut à une minute de soleil de midi en été à Hambourg ([Beiersdorf, 2021](https://www.beiersdorf.com/~/media/Beiersdorf/newsroom/press-releases/2021/2021-05-04-cell-phone-screens-do-not-damage-skin/Beiersdorf-cell-phone-screens-do-not-damage-skin.pdf)). C'est un fabricant qui parle, mais d'autres chercheurs disent la même chose. La lumière bleue qui compte vient du soleil : c'est le travail de ta [crème solaire](/blog/spf-50-visage-7-erreurs), pas d'une crème « anti-écran ».",
    },

    { type: "h2", texte: "Que faire le lendemain d'une nuit blanche sur GTA 6 ?" },
    {
      type: "p",
      texte:
        "Le froid d'abord, la crème ensuite. La Mayo Clinic conseille une compresse froide sur les poches, moins de sel et moins de boisson avant le coucher ([Mayo Clinic](https://www.mayoclinic.org/diseases-conditions/bags-under-eyes/diagnosis-treatment/drc-20369931)).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Pose un gant de toilette mouillé d'eau froide sur les yeux fermés, quelques minutes.",
        "Mets ton contour des yeux au frigo : le froid dégonfle, la caféine aide un peu.",
        "Applique-le en tapotant du bout de l'annulaire, du coin interne vers l'extérieur.",
        "Le soir de la partie, évite le plat très salé et la grande bouteille juste avant de dormir.",
        "Le matin, crème solaire sur le visage : le soleil fonce les cernes brunes, pas l'écran.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Ne frotte pas tes yeux fatigués : la peau est fine, et ça entretient la couleur.",
        "Peau qui réagit vite : choisis un soin des yeux sans parfum, la liste te le dit.",
        "Un œil gonflé d'un seul côté, rouge, qui gratte ou fait mal : ce n'est pas la fatigue, demande à ton pharmacien ou à un médecin.",
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "Une nuit blanche gonfle et assombrit, une ou deux bonnes nuits effacent. La caféine aide un peu sur les poches, à condition d'être haut dans la liste. Le reste, c'est du froid et du sommeil.",
    },
    {
      type: "p",
      texte:
        "Pour la suite de ta routine, la [niacinamide](/blog/niacinamide) aide sur le teint terne, et une [crème de nuit](/blog/creme-de-nuit) n'a rien de magique. Mais ++le meilleur soin anti-cernes de la semaine ne coûte rien++ : sauvegarde, pose la manette, et dors. Vice City sera encore là demain.",
    },
  ],
  faq: [
    {
      question: "Jouer à GTA 6 toute la nuit donne-t-il des cernes ?",
      reponse:
        "Oui, mais à cause du manque de sommeil, pas de l'écran. Une étude de 2013 montre qu'après 31 heures sans dormir, les cernes sont plus sombres et les yeux plus gonflés. L'effet passe en une ou deux nuits. La lumière d'un écran, elle, est trop faible pour abîmer la peau.",
    },
    {
      question: "Quelles sont les causes des cernes sous les yeux ?",
      reponse:
        "Il y en a trois, souvent mêlées. Des vaisseaux visibles à travers une peau très fine, ce qui donne une couleur bleue ou violette. Un surplus de pigment, souvent de famille, qui donne une couleur brune. Et un creux qui fait de l'ombre. La fatigue rend surtout les vaisseaux plus visibles.",
    },
    {
      question: "Yeux gonflés le matin : quelle solution ?",
      reponse:
        "Le froid est le geste le plus rapide : un gant mouillé d'eau froide ou un contour des yeux sorti du frigo, quelques minutes. Pour la nuit suivante, moins de sel et moins de boisson avant le coucher. Si un seul œil gonfle, rougit ou fait mal, parles-en à un pharmacien ou à un médecin.",
    },
    {
      question: "Le contour des yeux à la caféine est-il efficace ?",
      reponse:
        "Un peu, surtout sur les poches. La caféine resserre les petits vaisseaux et peut dégonfler pendant quelques heures. Les études sont petites, donc l'effet reste modeste. Vérifie sa place dans la liste : dans notre base, un soin des yeux sur dix seulement la place parmi les cinq premiers ingrédients.",
    },
  ],
  notes: [
    { produit: "The Ordinary, Caffeine Solution 5% + EGCG contour des yeux (30 ml)", ean: "0769915195712", note: 16.28, releveeLe: "2026-11-17" },
    { produit: "Typology, Lab-1003 Caféine 5% + Niacinamide 5%", ean: "3665467000665", note: 16.25, releveeLe: "2026-11-17" },
    { produit: "Nuxe, Prodigieuse [hyalu] Boost Stick Yeux Défatigant (5 g)", ean: "3264680046582", note: 16.12, releveeLe: "2026-11-17" },
    { produit: "Vichy, Minéral 89 Yeux Fortifiant Réparateur", ean: "0000030159273", note: 16.51, releveeLe: "2026-11-17" },
    { produit: "La Roche-Posay, Hydraphase HA Yeux", ean: "3337872415647", note: 11.6, releveeLe: "2026-11-17" },
    { produit: "Nivea, Luminous 630 Eye Cream Anti-dark Circles", ean: "0056594019812", note: 12.35, releveeLe: "2026-11-17" },
    { produit: "Neutrogena, Hydro Boost Soin Réveil Contour des Yeux (15 ml)", ean: "3574661784748", note: 16.39, releveeLe: "2026-11-17" },
  ],
};

export default article;
