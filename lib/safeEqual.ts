import { timingSafeEqual } from "node:crypto";

/**
 * Comparaison de chaînes en temps constant, pour les secrets partagés
 * (headers d'admin/cron). Évite l'oracle temporel d'un `===` qui court-circuite
 * au premier octet différent. Retourne false si les longueurs diffèrent.
 */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
