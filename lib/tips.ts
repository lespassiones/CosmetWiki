/**
 * Daily educational tips for the home screen. Rotation is deterministic
 * (based on day-of-year) so the same tip is shown to all visitors on the
 * same day, and the index changes once a day at midnight.
 */
export const DAILY_TIPS: string[] = [
  "Les 5 premiers ingrédients d'une liste INCI représentent environ 75 % de la formule.",
  "L'ordre INCI correspond à l'ordre décroissant de concentration jusqu'à environ 1 %.",
  "Le mot \"parfum\" peut cacher des dizaines de molécules non déclarées individuellement.",
  "Un actif placé après le 1er conservateur est généralement présent à moins de 1 %.",
  "Si AQUA est en 1ère position, c'est une formule à base d'eau.",
  "Les allergènes parfumants UE sont 26 composés à déclarer dès 0,001 % en leave-on.",
  "Les sulfates peuvent dessécher le cuir chevelu. Privilégie les formules douces sans SLS/SLES pour préserver la barrière cutanée.",
  "Une note basse ne signifie pas \"dangereux\" : c'est une grille de tolérance, pas un verdict toxicologique.",
];

export function tipForToday(date: Date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}
