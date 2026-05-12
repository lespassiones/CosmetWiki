/**
 * Educational tips shown on the home dashboard.
 *
 * Rotation is deterministic (hour-based) so the same tip is shown to every
 * visitor at the same hour and changes every hour. With 50 tips the full
 * pool cycles in about two days.
 */
export const DAILY_TIPS: string[] = [
  // INCI list basics
  "Les 5 premiers ingrédients d'une liste INCI représentent environ 75 % de la formule.",
  "L'ordre INCI correspond à l'ordre décroissant de concentration jusqu'à environ 1 %.",
  "Si AQUA est en 1ère position, c'est une formule à base d'eau.",
  "Un actif placé après le 1er conservateur est généralement présent à moins de 1 %.",
  "Au-dessous d'1 %, les ingrédients peuvent être listés dans n'importe quel ordre.",
  "Un ingrédient placé après PARFUM ou FRAGRANCE est généralement présent à moins de 1 % — son impact réel reste limité même s'il est pénalisé.",
  "Avant PARFUM dans la liste = concentration ≥ 1 %, à surveiller. Après PARFUM = traces, plus rassurant.",
  "Le mot \"parfum\" ou \"fragrance\" peut cacher des dizaines de molécules non déclarées individuellement.",
  "Les colorants apparaissent souvent en fin de liste sous la forme \"CI 12345\".",
  "Un nom en italique sur l'étiquette physique indique souvent un actif issu de la nomenclature INCI.",
  "Une note basse ne signifie pas \"dangereux\" : c'est une grille de tolérance, pas un verdict toxicologique.",
  "La liste INCI est obligatoire en UE : si elle manque, c'est un signal à fuir.",

  // Allergens & sensitive ingredients
  "Les allergènes parfumants UE sont 26 composés à déclarer dès 0,001 % en leave-on.",
  "Limonene, Linalool, Citronellol et Geraniol sont les allergènes parfumants les plus fréquents.",
  "Methylisothiazolinone (MIT) est l'un des conservateurs les plus allergisants — vérifie son absence en leave-on.",
  "Les parabens longs (butyl-, propyl-) sont restreints depuis 2014 mais les courts (methyl-, ethyl-) restent autorisés.",
  "Le formaldéhyde libre est interdit, mais certains conservateurs en libèrent lentement (DMDM Hydantoin, Quaternium-15…).",
  "Les huiles essentielles sont des cocktails d'allergènes : doses faibles = irritation cumulée possible.",
  "Si tu as la peau réactive, surveille Phenoxyethanol, Sodium Benzoate et les EOs en haut de liste.",
  "Les huiles essentielles photo-sensibilisantes (bergamote, citron) sont à éviter avant exposition solaire.",

  // Solaires & UV
  "Un SPF 30 bloque ~97 % des UVB, un SPF 50 ~98 %. La différence est marginale, l'application régulière est plus importante.",
  "PA+++ et PA++++ indiquent la protection UVA — toujours regarder ce critère, pas que le SPF.",
  "Un solaire perd son efficacité après 2 ans ouvert : note la date sur le tube.",
  "Octocrylene peut se dégrader en benzophénone avec le temps — un solaire vieilli n'est pas neutre.",
  "Les filtres minéraux (Zinc Oxide, Titanium Dioxide) sont moins susceptibles d'allergie que les filtres chimiques.",

  // Routine & application
  "Sur peau humide les actifs pénètrent mieux — applique tes sérums sur peau légèrement tamponnée.",
  "Plus la molécule est petite, mieux elle pénètre : la niacinamide passe, le collagène en topique non.",
  "L'acide hyaluronique hydrate la couche cornée mais ne remplace pas une bonne barrière lipidique.",
  "La rétine (rétinol, rétinal) est photosensibilisante : applique-la le soir et SPF le matin obligatoire.",
  "Vitamine C + SPF le matin = combo synergique pour les UV et les taches pigmentaires.",
  "N'empile pas acides exfoliants + rétinol le même soir sur peau sensible : risque d'irritation.",
  "Les actifs anti-âge demandent 8 à 12 semaines pour un résultat visible — patience.",

  // Tensioactifs & lavants
  "SLS (Sodium Lauryl Sulfate) est plus décapant que SLES — pour les peaux sensibles, privilégie le second ou des tensioactifs doux.",
  "Coco Glucoside, Decyl Glucoside : tensioactifs doux d'origine végétale, bonne tolérance.",
  "Un shampooing qui mousse beaucoup n'est pas forcément plus efficace — c'est surtout cosmétique.",
  "Sebum + sueur se nettoient bien avec un pH proche de 5,5 : un savon trop alcalin assèche.",

  // Conservation & date
  "Le PAO (Period After Opening) est le petit pot ouvert avec un chiffre : 6M, 12M… durée après ouverture.",
  "Sans conservateur, un produit aqueux ne dépasse pas 1 mois avant contamination microbienne.",
  "Stocker un solaire ou un sérum à plus de 30 °C accélère la dégradation des actifs.",
  "Les produits sans eau (huiles pures, baumes) se conservent plus longtemps que les émulsions.",

  // Étiquettes & marketing
  "\"Hypoallergénique\" n'est pas une mention encadrée par la loi — sans liste INCI claire, méfiance.",
  "\"Sans parabens\" peut cacher d'autres conservateurs plus allergisants comme la MIT.",
  "\"Naturel à 99 %\" inclut souvent l'eau dans le pourcentage — vérifie la liste, pas le claim.",
  "Bio ne signifie pas non-allergisant : huiles essentielles bio = allergènes bio.",
  "Les pictos écolos (feuille verte, etc.) sont rarement audités — la liste INCI reste l'arbitre.",

  // Catégories spécifiques
  "Pour bébé, vise une liste INCI courte : moins de 10 ingrédients, sans parfum, sans alcool dénaturé.",
  "Les déodorants sans sels d'aluminium existent mais sont moins efficaces sur la transpiration — différencier déodorant et anti-transpirant.",
  "Les masques argile absorbent le sébum : à utiliser 1–2× par semaine max sur zones grasses.",
  "Un démaquillant huileux retire mieux les écrans solaires résistants à l'eau qu'une eau micellaire.",

  // Pratiques générales
  "Tester un nouveau produit dans le pli du coude 48 h avant utilisation faciale réduit le risque de réaction.",
  "Réduire le nombre de produits (8–10 max) limite l'exposition cumulée aux allergènes et conservateurs.",
  "Lis la liste INCI avant le packaging : la formule fait le produit, pas la pub.",
  "Garde une note de tes produits qui ont irrité ta peau pour identifier l'ingrédient commun.",
];

/**
 * Pick the tip for the current hour. Hour-based rotation gives roughly one
 * change per hour and cycles through the whole pool in ~2 days.
 */
export function tipForToday(date: Date = new Date()): string {
  const hoursSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60));
  return DAILY_TIPS[hoursSinceEpoch % DAILY_TIPS.length];
}

/**
 * Return a rotated slice of `count` tips starting at the current hour. This
 * gives the carousel a "tip-of-the-day-first, then variety" feel — the user
 * always sees the same first tip everyone else sees right now, but can swipe
 * to discover more.
 */
export function tipsForCarousel(count = 12, date: Date = new Date()): string[] {
  const hoursSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60));
  const start = hoursSinceEpoch % DAILY_TIPS.length;
  const out: string[] = [];
  for (let i = 0; i < Math.min(count, DAILY_TIPS.length); i++) {
    out.push(DAILY_TIPS[(start + i) % DAILY_TIPS.length]);
  }
  return out;
}
