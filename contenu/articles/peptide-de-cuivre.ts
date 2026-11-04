import type { Article } from "@/contenu/articles";

/**
 * Publié le 04/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « buzz » (`masque-biodance` sortait de la fenêtre des dix derniers) : les
 * sérums aux peptides de cuivre, présentés comme la tendance qui « affole
 * TikTok » par Harper's Bazaar France (03/11/2026, données du cabinet Spate).
 * « peptide de cuivre » pèse 1 k à 10 k recherches par mois (+900 % sur trois
 * mois et sur un an), « ghk cu » 10 k à 100 k, « copper peptide » 1 k à 10 k
 * (`docs/seo/VOLUMES.md`, 04/11/2026, dix zones). Les premiers résultats sont
 * des pages de marques et de revendeurs (Aroma-Zone, Sephora, The Ordinary) :
 * aucune ne dit sur quoi reposent les études ni où l'actif se trouve dans les
 * listes. Listes INCI et notes relevées dans la base Cosme Check le
 * 04/11/2026 (`cosme_check.catalog`, 828 produits actifs avec un peptide de
 * cuivre) ; les notes sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "peptide-de-cuivre",
  titre: "Peptide de cuivre : sur TikTok, 9 vues sur 10 sont de la pub. On a lu 828 listes pour voir ce qu'il reste",
  titreSeo: "Peptide de cuivre : bienfaits et vraies preuves",
  resume:
    "Peptide de cuivre (GHK-Cu) : ce que disent les études, et ce qu'on lit dans 828 listes INCI. L'actif de TikTok est en fin de liste 7 fois sur 10.",
  chapo:
    "Le peptide de cuivre est une toute petite molécule que ton corps fabrique déjà, et qu'on met dans les sérums anti-âge pour la fermeté de la peau. Il entre bien dans la peau, mais ses preuves sur les rides restent minces. Et dans notre base, ==7 produits sur 10 le placent dans la seconde moitié de leur liste==. ++Le nom de l'actif est souvent plus gros que sa dose++.",
  publieLe: "2026-11-04",
  modifieLe: "2026-11-04",
  minutes: 7,
  theme: "peptide de cuivre",
  motsCles: [
    "peptide de cuivre",
    "peptides de cuivre",
    "peptide de cuivre bienfaits",
    "peptide de cuivre visage",
    "peptide de cuivre sérum",
    "peptides de cuivre ou rétinol",
    "peptides de cuivre et vitamine c",
    "ghk-cu",
    "copper tripeptide-1",
  ],
  categorie: "Tendances",
  couverture: {
    src: "/image/blog/peptide-de-cuivre.webp",
    alt: "Un petit flacon de sérum en verre ambré, avec une pipette noire et une étiquette vierge, sur un fond blanc.",
    largeur: 1024,
    hauteur: 683,
    credit: "Auteur inconnu, via rawpixel",
    licence: "CC0",
    source: "https://www.rawpixel.com/image/11515770/dropper-bottle-blank-retro-label",
  },
  blocs: [
    { type: "h2", texte: "Pourquoi tout le monde parle du peptide de cuivre ?" },
    {
      type: "p",
      texte:
        "Parce que TikTok en fait le nouveau sérum anti-âge à avoir. Harper's Bazaar France en a fait une « tendance » le 3 novembre. Selon le cabinet américain Spate, les recherches sur ces sérums ont bondi de 91,8 % en un an ([Harper's Bazaar, 03/11/2026](https://www.harpersbazaar.fr/beaute/trend-alert-ralentir-le-temps-et-les-rides-la-promesse-des-serums-aux-peptides-de-cuivre-qui-affolent-tiktok_8349)).",
    },
    {
      type: "p",
      texte:
        "Chez nous aussi : « peptide de cuivre » est tapé ==dix fois plus qu'il y a un an== en France, en Belgique, en Suisse et au Canada (Planificateur de mots clés de Google, relevé du 04/11/2026).",
    },
    {
      type: "p",
      texte:
        "Mais un chiffre du même article change tout. Sur TikTok, ++les contenus sponsorisés font 90,6 % de la visibilité++ de la tendance. Autrement dit, 9 vues sur 10 sont payées par une marque. Alors on a laissé les vidéos de côté, et on a lu les études et les listes.",
    },

    { type: "h2", texte: "C'est quoi, un peptide de cuivre ?" },
    {
      type: "p",
      texte:
        "C'est une chaîne de trois acides aminés accrochée à un atome de cuivre. Les acides aminés sont les briques des protéines, comme le collagène qui rend la peau ferme. Cette chaîne s'appelle GHK, et notre sang en contient naturellement : environ 200 nanogrammes par millilitre à 20 ans, 80 à 60 ans ([Pickart et Margolina, *International Journal of Molecular Sciences*, 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6073405/)).",
    },
    {
      type: "fiche",
      titre: "Peptide de cuivre (GHK-Cu)",
      inci: "COPPER TRIPEPTIDE-1",
      niveau: "incertain",
      effet:
        "Un agent d'entretien de la peau. En laboratoire, il pousse les cellules à fabriquer du collagène. Sur le visage, les preuves reposent sur quelques petites études.",
      statut:
        "Autorisé en Europe comme agent d'entretien de la peau ([base CosIng de la Commission européenne](https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-ingredient-database_en)), dans le cadre du règlement (CE) 1223/2009.",
    },
    {
      type: "p",
      texte:
        "Sur l'étiquette, cherche son nom INCI : [Copper Tripeptide-1](/i/copper-tripeptide-1). La liste INCI, c'est la liste officielle des ingrédients, écrite du plus dosé au moins dosé. Dans notre base, 818 des 828 produits au cuivre utilisent cette forme-là.",
    },

    { type: "h2", texte: "Est-ce qu'il entre vraiment dans la peau ?" },
    {
      type: "p",
      texte:
        "Oui, et c'est sa grande différence avec le [PDRN](/blog/pdrn), l'autre star de TikTok. Le PDRN est une molécule énorme, qui reste à la surface. Le GHK-Cu est minuscule. Sur de la vraie peau humaine en laboratoire, une partie du cuivre a traversé la peau en 48 heures. Une autre y est restée en réserve ([Hostynek et al., *Inflammation Research*, 2011](https://pubmed.ncbi.nlm.nih.gov/20721598/)).",
    },
    {
      type: "p",
      texte:
        "C'est un bon point. Mais entrer dans la peau ne veut pas dire effacer des rides. Pour ça, il faut des études sur des visages.",
    },

    { type: "h2", texte: "Que disent les études sur les rides ?" },
    {
      type: "p",
      texte:
        "Elles sont encourageantes, mais petites, et souvent anciennes. Le chiffre qu'on lit partout vient d'une crème testée 12 semaines sur 71 femmes : peau plus dense, ridules réduites. Or ce travail a été présenté en 2002 sous forme de résumé, lors d'un congrès de l'Académie américaine de dermatologie. ==On n'en trouve aucun article complet==, avec sa méthode et ses chiffres détaillés.",
    },
    {
      type: "p",
      texte:
        "Les autres essais sont du même calibre. Une crème pour les yeux sur 41 femmes, une étude pilote sur la peau des cuisses, un essai de 8 semaines face à un autre peptide. Ils sont tous rassemblés dans la revue de 2018 citée plus haut. Ses deux auteurs travaillent au service recherche de Skin Biology, une entreprise de soins, selon l'article lui-même.",
    },
    {
      type: "p",
      texte:
        "Pour comparer : le [rétinol](/blog/retinol) a des essais contre placebo publiés en entier. Un placebo, c'est une crème identique mais sans l'actif, pour voir ce qui vient vraiment de lui. ++Le peptide de cuivre n'est pas une arnaque, c'est un actif prometteur qui attend ses grandes études++.",
    },

    { type: "h2", texte: "Qu'est-ce qu'on lit dans 828 listes INCI ?" },
    {
      type: "p",
      texte:
        "On a relevé tous les produits de notre base qui contiennent un peptide de cuivre : 828 au 4 novembre 2026. Visage surtout, mais aussi 104 soins pour les cheveux. Voici ce que disent leurs listes.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "**Il est dans la seconde moitié de la liste 71 fois sur 100.** Il n'arrive dans les cinq premiers que dans 2,4 % des produits.",
        "**Il est rarement seul.** 8 produits sur 10 contiennent d'autres peptides, et la moitié en ajoute au moins quatre. Certains en alignent plus de cinquante.",
        "**La [glycérine](/i/glycerin) passe avant lui dans 88 % des cas.** C'est l'hydratant de base, celui qui fait déjà le gros du travail dans [les sérums à l'acide hyaluronique](/blog/acide-hyaluronique).",
        "**43 % contiennent du [parfum](/i/parfum).** C'est moins que la moyenne des soins, mais ça reste un produit parfumé sur deux pour les peaux sensibles.",
      ],
    },
    {
      type: "p",
      texte:
        "Pourquoi la place compte ? En Europe, un ingrédient dosé à moins de 1 % peut s'écrire dans n'importe quel ordre, à la fin de la liste ([règlement (CE) 1223/2009, article 19](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Les essais ont été faits avec des crèmes conçues pour le cuivre. Un peptide caché au milieu de cinquante autres n'a jamais été testé comme ça.",
    },

    { type: "h2", texte: "Quels produits le mettent vraiment en avant ?" },
    {
      type: "p",
      texte:
        "Ceux qui l'affichent dans leur nom le placent en général tôt. Les sérums « cocktail » coréens, eux, le noient souvent dans la liste. Voici quelques exemples lus dans la base.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Place du cuivre dans la liste", "Note Cosme Check"],
      lignes: [
        ["BasicLab, Copperis Crème de Jour Lissante (50 ml).", "15e sur 26.", "16,74 sur 20."],
        ["NIOD, Copper Amino Isolate Lipid 1 %.", "9e sur 22.", "16,46 sur 20."],
        ["The Ordinary, Sérum Multi-Peptides + Copper Peptides 1 % (30 ml).", "4e sur 49.", "16,34 sur 20."],
        ["Numbuzin, Glow Boosting Toner NAD+ PDRN + 50 peptides.", "71e sur 126.", "12,68 sur 20."],
        ["Medicube, Sérum aux Peptides Roses PDRN (30 ml).", "38e sur 41.", "8 sur 20."],
      ],
      legende:
        "Listes et notes relevées dans la base Cosme Check le 04/11/2026. [Comment l'app classe les ingrédients](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "La note lit toute la formule, pas seulement l'actif. Le sérum Medicube perd ses points à cause de son parfum et d'un ingrédient classé rouge. Le sérum The Ordinary, lui, n'a ni parfum ni ingrédient rouge, et place le cuivre juste après la [glycérine](/i/glycerin).",
    },
    {
      type: "cta",
      texte:
        "**Ton sérum au cuivre, il le place où ?** Scanne son code-barres avec Cosme Check : tu vois sa liste, la couleur de chaque ingrédient et sa note en dix secondes.",
    },

    { type: "h2", texte: "Comment l'utiliser sans faire d'erreur ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Un sérum sur peau propre, puis ta crème. L'[ordre de la routine skincare](/blog/routine-skincare) tient en quatre gestes.",
        "Ajoute un seul actif nouveau à la fois, et teste-le d'abord sur un petit coin de peau, comme le conseille The Ordinary sur ses sérums ([The Ordinary](https://theordinary.com/fr-fr/multi-peptide-copper-peptides-1-serum-100613.html)).",
        "Laisse-lui au moins deux mois : les essais ont duré de 8 à 12 semaines.",
        "Le matin, une crème solaire. Le SPF, c'est son indice de protection contre les coups de soleil, et aucun sérum ne remplace [la bonne dose](/blog/spf-50-visage-7-erreurs).",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Jamais de peptides en injection achetés en ligne. Sur TikTok, certains s'en injectent. Un chimiste de l'Université Laval rappelle qu'on ne connaît pas leur composition ([Noovo, 01/04/2026](https://www.noovo.info/nouvelles/sante/article/phenomene-des-peptides-sur-les-reseaux-sociaux-des-substances-miracles-qui-inquietent/)). Une crème n'a rien à voir.",
        "Rougeurs, brûlures ou boutons qui durent : arrête et demande conseil à ton pharmacien ou à un dermatologue.",
      ],
    },

    { type: "h2", texte: "Alors, ça vaut le coup ?" },
    {
      type: "p",
      texte:
        "Ça peut, si tu choisis bien. Le geste à garder pour la fin : ++si le cuivre n'est pas dans les dix premiers ingrédients, c'est un figurant++. Sur nos 828 produits, il n'y est qu'une fois sur dix.",
    },
    {
      type: "p",
      texte:
        "Pour lire n'importe quelle étiquette, notre méthode pour [analyser une composition en 5 étapes](/blog/analyse-composition-cosmetique) marche sur tous les pots. Et si tu veux un actif aux preuves plus solides, la [niacinamide](/blog/niacinamide) (la vitamine B3) et le rétinol restent devant.",
    },
  ],
  faq: [
    {
      question: "Peptides de cuivre ou rétinol ?",
      reponse:
        "Le rétinol a plus de preuves : des essais contre placebo publiés en entier montrent un effet sur les rides. Le peptide de cuivre repose surtout sur de petites études anciennes. Si ta peau supporte mal le rétinol, le cuivre est une autre piste, à tester au moins deux mois. Ne commence pas les deux la même semaine.",
    },
    {
      question: "Peut-on mélanger peptides de cuivre et vitamine C ?",
      reponse:
        "Aucune étude solide ne montre un danger ni un bénéfice à les appliquer ensemble. Par prudence, tu peux les séparer : la vitamine C le matin, le cuivre le soir. C'est aussi plus simple pour savoir lequel ta peau supporte. Ajoute toujours un seul actif nouveau à la fois.",
    },
    {
      question: "Le peptide de cuivre est-il bon pour les cheveux ?",
      reponse:
        "Il est de plus en plus vendu pour le cuir chevelu : notre base compte 104 soins capillaires qui en contiennent. Mais les études sur la pousse des cheveux ont surtout été faites en laboratoire et chez l'animal. Si tu perds beaucoup de cheveux, parles-en à un médecin ou à un dermatologue avant d'acheter.",
    },
    {
      question: "Le GHK-Cu a-t-il des effets secondaires ?",
      reponse:
        "En crème, il est en général bien toléré, mais toute peau peut réagir : rougeurs, picotements, petits boutons. Teste-le sur un coin de peau avant le visage. Les peptides vendus en injection sur internet sont un tout autre sujet : leur composition est inconnue et un chimiste de l'Université Laval les déconseille.",
    },
  ],
  notes: [
    {
      produit: "BasicLab, Copperis Crème de Jour Lissante (50 ml)",
      ean: "5904639175427",
      note: 16.74,
      releveeLe: "2026-11-04",
    },
    {
      produit: "NIOD, Copper Amino Isolate Lipid 1 %",
      ean: "0769915152043",
      note: 16.46,
      releveeLe: "2026-11-04",
    },
    {
      produit: "The Ordinary, Sérum Multi-Peptides + Copper Peptides 1 % (30 ml)",
      ean: "0769915233179",
      note: 16.34,
      releveeLe: "2026-11-04",
    },
    {
      produit: "Numbuzin, Glow Boosting Toner NAD+ PDRN + 50 peptides",
      ean: "8809652589794",
      note: 12.68,
      releveeLe: "2026-11-04",
    },
    {
      produit: "Medicube, Sérum aux Peptides Roses PDRN (30 ml)",
      ean: "8800256108053",
      note: 8,
      releveeLe: "2026-11-04",
    },
  ],
};

export default article;
