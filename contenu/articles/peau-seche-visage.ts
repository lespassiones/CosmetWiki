import type { Article } from "@/contenu/articles";

/**
 * Publié le 26/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « routines » : « peau sèche visage », « crème peau sèche visage »,
 * « peau déshydratée » et « slugging » pèsent chacune 1 k à 10 k recherches
 * par mois (`docs/seo/VOLUMES.md`, 26/10/2026, dix zones), au lendemain du
 * changement d'heure et le jour où National Geographic consacre un article au
 * slugging. Les pourcentages viennent de `cosme_check.catalog_export`
 * (produits actifs dont le nom contient « peau sèche » ou « peaux sèches »,
 * relevé du 26/10/2026, dédoublonnés par code-barres) ; les cinq notes sont
 * déclarées dans `notes`.
 */
const article: Article = {
  slug: "peau-seche-visage",
  titre: "Ta peau tire en hiver ? 3 produits « peau sèche » sur 4 contiennent du parfum",
  titreSeo: "Peau sèche visage en hiver : que faire ?",
  resume:
    "Peau sèche du visage en hiver : pourquoi elle tire, sèche ou déshydratée, ce qu'il faut dans ta crème, le slugging, et ce que cachent 1 489 produits.",
  chapo:
    "Une peau de visage qui tire en hiver manque surtout de gras pour retenir son eau : le froid dehors et le chauffage dedans fragilisent sa couche protectrice. Le bon réflexe tient en deux gestes, une crème qui attire et garde l'eau, et le soir une fine couche de vaseline sur les zones qui tirent. Mais en rayon, ++trois produits « peau sèche » sur quatre contiennent du parfum++.",
  publieLe: "2026-10-26",
  modifieLe: "2026-10-26",
  minutes: 9,
  theme: "peau sèche visage",
  motsCles: [
    "peau sèche visage",
    "peau sèche hiver",
    "crème peau sèche visage",
    "peau déshydratée",
    "peau sèche ou déshydratée",
    "slugging",
    "slugging vaseline",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/peau-seche-visage.webp",
    alt: "Des cristaux de givre en forme de plumes sur une vitre, devant un ciel bleu nuit d'hiver.",
    largeur: 1200,
    hauteur: 800,
    credit: "Jojoo64, via Wikimedia Commons",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Ice_Crystals_on_Window_Pane.jpg",
  },
  blocs: [
    { type: "h2", texte: "Pourquoi ta peau tire-t-elle plus en hiver ?" },
    {
      type: "p",
      texte:
        "Parce que l'air froid et l'air chauffé sont tous les deux très secs, et qu'ils abîment la barrière de ta peau. La barrière, c'est la couche la plus en surface : des cellules collées par un ciment de gras qui empêche l'eau de s'échapper. Quand ce ciment s'abîme, l'eau part, et la peau tire, gratte ou pèle.",
    },
    {
      type: "p",
      texte:
        "Une revue de dermatologues européens l'a résumé en 2016. ==Le froid et l'air sec affaiblissent la barrière de la peau== et la rendent plus réactive aux produits irritants ([Engebretsen et al., *Journal of the European Academy of Dermatology and Venereology*, 2016](https://doi.org/10.1111/jdv.13301)). À Montréal en janvier comme dans un appartement chauffé à Lyon, le résultat se sent pareil au réveil.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Les douches longues et très chaudes dissolvent le gras de la peau.",
        "Les nettoyants qui moussent fort, ou un savon de toilette sur le visage, font pareil.",
        "Les gommages répétés « pour enlever les peaux mortes » abîment encore plus la barrière.",
      ],
    },

    { type: "h2", texte: "Peau sèche ou peau déshydratée : quelle différence ?" },
    {
      type: "p",
      texte:
        "Une peau sèche manque de **gras**, toute l'année. Une peau déshydratée manque d'**eau**, pour un temps. La première est un type de peau. La seconde est un état passager, et ++même une peau grasse peut être déshydratée++.",
    },
    {
      type: "tableau",
      entetes: ["Ce que tu remarques", "Peau plutôt sèche", "Peau plutôt déshydratée"],
      lignes: [
        ["En plein milieu de la journée.", "Elle ne brille jamais.", "Elle peut briller sur le front et le nez."],
        ["Au toucher.", "Rugueuse, avec de petites peaux.", "Fine, avec des ridules qui partent quand tu hydrates."],
        ["Depuis quand.", "Depuis toujours, été compris.", "Depuis le froid, le chauffage ou un nouveau produit."],
      ],
      legende: "Un repère, pas un diagnostic : beaucoup de peaux sont un peu les deux en hiver.",
    },
    {
      type: "p",
      texte:
        "Dans les deux cas, la réponse se ressemble : une crème qui ramène de l'eau et un ingrédient qui l'empêche de repartir. Seule la texture change. Pour aller plus loin, lis notre guide [crème hydratante ou réparatrice](/blog/cremes-hydratantes-reparatrices).",
    },

    { type: "h2", texte: "Que doit contenir une crème pour peau sèche ?" },
    {
      type: "p",
      texte:
        "Trois familles d'ingrédients, qui font chacune un travail différent. Tu les repères dans la liste INCI, c'est-à-dire la liste officielle des ingrédients imprimée au dos du pot.",
    },
    {
      type: "tableau",
      entetes: ["Famille", "Ce qu'elle fait", "Noms à chercher dans la liste"],
      lignes: [
        ["Humectants.", "Ils attirent l'eau dans la peau, comme une éponge.", "[Glycerin](/i/glycerin), [Urea](/i/urea), [Sodium Hyaluronate](/i/sodium-hyaluronate)."],
        ["Émollients.", "Ils remplissent les fissures entre les cellules et adoucissent (les céramides sont les gras qui collent ces cellules entre elles).", "[Squalane](/i/squalane), [Butyrospermum Parkii Butter](/i/butyrospermum-parkii-butter) (karité), [Ceramide NP](/i/ceramide-np)."],
        ["Occlusifs.", "Ils posent un film qui empêche l'eau de s'évaporer.", "[Petrolatum](/i/petrolatum) (vaseline), [Paraffinum Liquidum](/i/paraffinum-liquidum), [Lanolin](/i/lanolin)."],
      ],
    },
    {
      type: "p",
      texte:
        "Le duo qui compte, c'est l'humectant **avec** l'occlusif. Une revue scientifique de 2017 le dit simplement : la glycérine soulage mieux la sécheresse quand elle est associée à un occlusif ([Purnamawati et al., *Clinical Medicine & Research*, 2017](https://doi.org/10.3121/cmr.2017.1363)). Un sérum à l'acide hyaluronique seul, sans crème par-dessus, laisse repartir l'eau qu'il a attirée.",
    },

    { type: "h2", texte: "Le slugging, ça marche vraiment ?" },
    {
      type: "p",
      texte:
        "Oui, sur une peau sèche, et c'est même le geste le mieux prouvé de cet article. Le slugging, c'est appliquer le soir une fine couche de vaseline en dernier, par-dessus ta crème, pour « sceller » l'eau dans la peau. Le nom vient de l'anglais *slug*, la limace, pour l'effet brillant.",
    },
    {
      type: "p",
      texte:
        "La même revue de 2017 donne les chiffres : ==la vaseline réduit de plus de 98 % la perte d'eau de la peau==. La lanoline, l'huile minérale ou les silicones ne la réduisent que de 20 à 30 %. Et elle ne fait pas qu'étouffer : elle se glisse entre les cellules de surface et laisse la barrière se réparer en dessous ([Ghadially et al., *Journal of the American Academy of Dermatology*, 1992](https://doi.org/10.1016/0190-9622%2892%2970060-S)).",
    },
    {
      type: "fiche",
      titre: "Vaseline",
      inci: "PETROLATUM",
      niveau: "prouve",
      effet:
        "L'occlusif le plus efficace mesuré : elle limite fortement l'évaporation de l'eau de la peau et l'aide à réparer sa barrière.",
      statut:
        "Autorisée en Europe seulement si son raffinage est entièrement connu et montre qu'elle ne vient pas d'une matière cancérogène (règlement (CE) 1223/2009, annexe II, entrée 904). Classée orange dans Cosme Check, pour son origine pétrolière et sa très faible biodégradabilité.",
    },
    {
      type: "p",
      texte:
        "Le texte européen est le [règlement (CE) n° 1223/2009](https://eur-lex.europa.eu/eli/reg/2009/1223/oj) (2009) : la vaseline vendue en cosmétique y est raffinée et contrôlée. Le débat porte surtout sur l'environnement, pas sur ta peau.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Peau grasse ou à boutons : passe ton tour, ou limite-toi aux ailes du nez et aux lèvres. La vaseline n'est pas [comédogène](/blog/comedogene) (elle ne bouche pas les pores sur les échelles classiques), mais un film épais sur tout le visage reste lourd.",
        "Le soir où tu mets un rétinol ou un acide exfoliant, ne slugue pas par-dessus : par prudence, un film occlusif peut faire piquer davantage un actif fort.",
        "Une couche fine suffit, deux ou trois soirs par semaine, sur une taie d'oreiller que tu ne crains pas de tacher.",
      ],
    },

    { type: "h2", texte: "Qu'y a-t-il dans les produits « peau sèche » ?" },
    {
      type: "p",
      texte:
        "Notre base compte ==1 489 produits== dont le nom promet de s'occuper des peaux sèches (relevé du 26/10/2026). Crèmes, laits, nettoyants, huiles : voici ce qu'on trouve dans leurs listes.",
    },
    {
      type: "tableau",
      entetes: ["Ce qu'on a compté", "Résultat"],
      lignes: [
        ["Produits qui contiennent de la glycérine.", "1 264, soit 84,9 %."],
        ["Produits qui contiennent du [parfum](/i/parfum).", "1 132, soit 76,0 %."],
        ["Produits avec du karité.", "582, soit 39,1 %."],
        ["Produits avec de la vaseline ou une huile minérale.", "309, soit 20,8 %."],
        ["Produits avec de l'urée.", "179, soit 12,0 %."],
        ["Produits avec des céramides.", "62, soit 4,2 %."],
      ],
      legende: "Base Cosme Check, produits actifs dont le nom contient « peau sèche » ou « peaux sèches », relevé du 26/10/2026.",
    },
    {
      type: "p",
      texte:
        "La bonne nouvelle : presque tous ont de la glycérine. La mauvaise : ==trois sur quatre sont parfumés==, alors qu'une barrière abîmée laisse passer plus facilement ce qui irrite. Pour les seuls soins visage (167 produits), c'est encore 62,9 %. Et les céramides, star des publicités, ne sont que dans un produit sur vingt-quatre.",
    },
    {
      type: "cta",
      texte:
        "**Ta crème « peau sèche » est-elle parfumée ?** Scanne-la avec Cosme Check : en dix secondes, tu vois sa liste, le parfum s'il y en a, et la couleur de chaque ingrédient.",
    },

    { type: "h2", texte: "Quel baume choisir pour le slugging ?" },
    {
      type: "p",
      texte:
        "Pas forcément le plus connu. Cinq produits qu'on croise souvent dans les tutos, et ce que dit leur liste :",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Ce qu'il y a dedans", "Note Cosme Check"],
      lignes: [
        ["CeraVe, Lotion Hydratante peaux sèches à très sèches.", "Crème légère : glycérine, céramides, acide hyaluronique. À mettre sous le baume.", "12,12 sur 20."],
        ["La Roche-Posay, Cicaplast Baume B5 (40 ml).", "Glycérine, karité, panthénol et silicone : un film plus léger que la vaseline.", "11,54 sur 20."],
        ["Eucerin, Aquaphor Onguent Réparateur.", "Vaseline, huile minérale, glycérine, panthénol.", "7,23 sur 20."],
        ["Vaseline, Pure Petroleum Jelly Original.", "Vaseline, et rien d'autre.", "5 sur 20."],
        ["Vaseline, Original petroleum jelly (250 ml).", "Vaseline, vitamine E et BHT.", "1,63 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 26/10/2026.",
    },
    {
      type: "p",
      texte:
        "Les deux pots de vaseline se ressemblent, mais pas leurs listes. Le second ajoute du [BHT](/i/bht), un antioxydant qui sert à conserver le produit, classé rouge dans Cosme Check : c'est lui qui fait chuter la note. C'est tout l'intérêt de [lire la composition](/blog/analyse-composition-cosmetique) plutôt que la marque. Et si tu as déjà une [crème Nivea](/blog/creme-nivea-composition) dans un placard, elle est riche en huile minérale : moins occlusive que la vaseline, mais elle peut dépanner.",
    },

    { type: "h2", texte: "Quelle routine pour une peau sèche en hiver ?" },
    {
      type: "liste",
      style: "numeros",
      items: [
        "**Le soir, nettoie en douceur** : un lait, une huile ou un gel sans savon, à l'eau tiède, sans frotter.",
        "**Applique ta crème sur une peau encore un peu humide** : la glycérine a de l'eau à retenir.",
        "**Deux ou trois soirs par semaine**, pose une fine couche de vaseline sur les zones qui tirent.",
        "**Le matin**, de l'eau tiède suffit souvent, puis ta crème et une [crème solaire](/blog/spf-50-visage-7-erreurs) : le SPF (l'indice de protection contre les coups de soleil) compte aussi en hiver, surtout à la montagne.",
        "**Les lèvres** : un baume à chaque sortie dans le froid.",
      ],
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Choisis ta crème sans parfum, ou avec le parfum tout en bas de la liste.",
        "Garde ta douche courte et tiède : c'est gratuit, et ça protège plus que n'importe quel pot.",
        "Teste chaque nouveau produit sur une petite zone pendant deux jours avant le visage entier.",
      ],
    },
    {
      type: "p",
      texte:
        "Des plaques rouges qui grattent fort, qui suintent ou qui ne partent pas après deux semaines de bons gestes : ce n'est plus une simple peau sèche d'hiver. Montre-les à un dermatologue, à ton médecin ou à ton pharmacien.",
    },
    {
      type: "p",
      texte:
        "Le meilleur pour la fin : ==le produit le plus efficace contre la perte d'eau est aussi le plus simple== de ton armoire. Un pot de vaseline pure bat les formules à vingt ingrédients sur ce point précis. La crème apporte l'eau, la vaseline la garde : c'est tout le slugging.",
    },
  ],
  faq: [
    {
      question: "Peau sèche visage : quelle cause ?",
      reponse:
        "Le plus souvent, une barrière de la peau qui manque de gras pour retenir l'eau. En hiver, le froid, l'air chauffé, les douches chaudes et les nettoyants trop moussants l'aggravent. L'âge joue aussi, car la peau produit moins de sébum avec les années. Si la sécheresse s'accompagne de plaques rouges qui grattent fort, parles-en à un dermatologue.",
    },
    {
      question: "Peau sèche en hiver : que faire ?",
      reponse:
        "Raccourcis les douches chaudes, nettoie ton visage avec un produit doux sans savon, puis applique une crème à la glycérine sur la peau encore humide. Le soir, deux ou trois fois par semaine, ajoute une fine couche de vaseline sur les zones qui tirent. Préfère les crèmes sans parfum et garde la crème solaire le matin.",
    },
    {
      question: "Peau sèche ou déshydratée : comment faire le test ?",
      reponse:
        "Regarde ta peau en milieu de journée, sans rien mettre après le nettoyage du matin. Si elle ne brille nulle part et reste rugueuse, elle est plutôt sèche. Si elle brille sur le front ou le nez mais tire sur les joues, elle est plutôt déshydratée. Beaucoup de peaux sont un peu les deux en hiver.",
    },
    {
      question: "Slugging : vaseline ou crème Nivea ?",
      reponse:
        "La vaseline pure est l'occlusif le plus efficace mesuré : elle réduit de plus de 98 % la perte d'eau de la peau. La crème Nivea en boîte bleue contient surtout de l'eau et de l'huile minérale : elle protège aussi, mais moins. Pour le slugging, la vaseline reste la référence, en couche fine, sur une crème hydratante.",
    },
  ],
  notes: [
    {
      produit: "CeraVe, Lotion Hydratante peaux sèches à très sèches (562 ml)",
      ean: "3337875837200",
      note: 12.12,
      releveeLe: "2026-10-26",
    },
    {
      produit: "La Roche-Posay, Cicaplast Baume B5 (40 ml)",
      ean: "3337872412998",
      note: 11.54,
      releveeLe: "2026-10-26",
    },
    {
      produit: "Eucerin, Aquaphor Onguent Réparateur",
      ean: "0056594014053",
      note: 7.23,
      releveeLe: "2026-10-26",
    },
    {
      produit: "Vaseline, Pure Petroleum Jelly Original",
      ean: "0000042108634",
      note: 5,
      releveeLe: "2026-10-26",
    },
    {
      produit: "Vaseline, Original petroleum jelly (250 ml)",
      ean: "0000042182658",
      note: 1.63,
      releveeLe: "2026-10-26",
    },
  ],
};

export default article;
