/**
 * Selection mode's decisions that need no DOM: which option type-ahead lands
 * on, and where the active option goes when the one it was on leaves.
 *
 * Pure, so they're tested with literals; the stories drive the real keys.
 */

/** How long a pause starts type-ahead over, in ms. */
export const TYPEAHEAD_RESET_MS = 700;

/**
 * The option type-ahead lands on, or -1 for none.
 *
 * `text` is everything typed since the last pause, lowercased. One letter, or
 * the same letter again and again, steps through the options starting with
 * it, beginning after `from` and wrapping, so pressing "g" three times visits
 * the third option starting with "g". Anything longer matches from `from`
 * itself, so "gl" typed after "g" stays put when the active option already
 * starts with "gl".
 *
 * `labelAt(i)` is option `i`'s text, read only as far as the search goes.
 */
export function typeaheadIndex(count: number, from: number, text: string, labelAt: (index: number) => string): number {
  if (!count || !text) return -1;
  const repeated = [...text].every((c) => c === text[0]);
  const query = repeated ? text[0] : text;
  const start = repeated ? from + 1 : from;
  for (let step = 0; step < count; step++) {
    const i = (((start + step) % count) + count) % count;
    if (labelAt(i).trim().toLowerCase().startsWith(query)) return i;
  }
  return -1;
}

/**
 * Where the active option goes when its own has left the row: the nearest
 * option after it that's still there, in the order before the change, else
 * the nearest before it. `null` when none of its old neighbors is left, or
 * when it wasn't in the old order at all.
 */
export function survivingNeighbor(previous: readonly string[], present: ReadonlySet<string>, lost: string | null): string | null {
  if (lost === null) return null;
  const at = previous.indexOf(lost);
  if (at === -1) return null;
  for (let i = at + 1; i < previous.length; i++) if (present.has(previous[i])) return previous[i];
  for (let i = at - 1; i >= 0; i--) if (present.has(previous[i])) return previous[i];
  return null;
}
