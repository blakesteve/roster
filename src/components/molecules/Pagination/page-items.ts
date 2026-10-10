/**
 * Which page numbers a numbered pager shows, and where it skips.
 *
 * Always the same number of slots once there are more pages than fit: the
 * first page, the last, the current one with `siblings` on each side, and a
 * gap marker on each side, which becomes a page number itself near either
 * end. A pager whose width doesn't change as you page through is one whose
 * buttons don't move out from under the pointer.
 */
export type PageItem = number | "gap-start" | "gap-end";

export function pageItems(page: number, pageCount: number, siblings = 1): PageItem[] {
  const count = Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0;
  const s = Number.isFinite(siblings) ? Math.max(0, Math.floor(siblings)) : 1;
  const current = clampPage(page, count);
  const slots = 2 * s + 5;
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

  if (count <= slots) return range(1, count);

  const left = Math.max(current - s, 1);
  const right = Math.min(current + s, count);
  /* A gap is only worth a marker when it hides two or more pages; one hidden
     page is shown instead, which costs the same slot. */
  const gapStart = left > 3;
  const gapEnd = right < count - 2;

  if (!gapStart) return [...range(1, slots - 2), "gap-end", count];
  if (!gapEnd) return [1, "gap-start", ...range(count - (slots - 3), count)];
  return [1, "gap-start", ...range(left, right), "gap-end", count];
}

/** `page` brought into 1 to `pageCount`. */
export const clampPage = (page: number, pageCount: number) =>
  Math.min(Math.max(1, Math.floor(page) || 1), Math.max(1, Number.isFinite(pageCount) ? Math.floor(pageCount) : 1));
