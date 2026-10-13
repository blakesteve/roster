/**
 * The item typeahead lands on: the next one, after `current`, whose label
 * starts with what's been typed, wrapping round to the start. Typing the same
 * letter again cycles through the items starting with it. `-1` when nothing
 * matches, so focus stays put.
 */
export function nextByTypeahead(labels: string[], current: number, typed: string): number {
  const query = typed.toLocaleLowerCase();
  if (!query || labels.length === 0) return -1;
  /* "aaa" means "the next a", not "an item starting with aaa". */
  const repeated = [...query].every((char) => char === query[0]);
  const search = repeated ? query[0] : query;
  /* A multi-letter search may match the current item itself (typing "ne" while
     on "New"); a single letter moves on. */
  const start = repeated ? current + 1 : current;
  for (let step = 0; step < labels.length; step++) {
    const index = (Math.max(start, 0) + step) % labels.length;
    if (labels[index].trim().toLocaleLowerCase().startsWith(search)) return index;
  }
  return -1;
}
