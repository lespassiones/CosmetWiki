/**
 * Deterministic daily-picks selection.
 *
 * Every user gets the SAME 10 items on a given day (no per-user
 * personalisation — keeps it simple and predictable). The "day index"
 * advances by 1 each day, and we slice 10 consecutive items from the
 * catalog. When we reach the end, we wrap back to the start.
 *
 * Day index = days since UNIX epoch in UTC. We round to the day so users
 * around the world flip to the next batch at midnight UTC consistently.
 */

export type PickKind = "quiz" | "myth";

export type DailyPickItem = {
  id: string;
  kind: PickKind;
  order_index: number;
  question: string;
  options: string[];
  correct_index: number;
  reveal: string;
  category: string | null;
};

const PICKS_PER_DAY = 10;

/** UTC days since 1970-01-01 (integer). */
function daysSinceEpoch(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000);
}

/**
 * Pick the 10 items for a given day from the full catalog.
 *
 * Catalog is assumed sorted by `order_index` ascending. We compute a start
 * offset from the day index and the catalog size, then slice. If the slice
 * would go past the end, we wrap around to the start so day N+1 always gets
 * the next 10 items, no gaps.
 */
export function pickTodaysItems(
  catalog: DailyPickItem[],
  date: Date = new Date(),
): DailyPickItem[] {
  if (catalog.length === 0) return [];
  if (catalog.length <= PICKS_PER_DAY) return catalog;

  const day = daysSinceEpoch(date);
  // The day-of-cycle: how many "10-item batches" before we wrap.
  // Using floor(catalog.length / PICKS_PER_DAY) makes the rotation stable
  // regardless of whether catalog.length is a multiple of 10.
  const batches = Math.max(1, Math.ceil(catalog.length / PICKS_PER_DAY));
  const batchIdx = day % batches;
  const start = (batchIdx * PICKS_PER_DAY) % catalog.length;

  // Slice 10, wrapping if the batch crosses the end of the catalog.
  const out: DailyPickItem[] = [];
  for (let i = 0; i < PICKS_PER_DAY; i++) {
    out.push(catalog[(start + i) % catalog.length]);
  }
  return out;
}
