/**
 * Where a carousel's row is, and where it should go.
 *
 * Pure, and kept out of the component so paging and snapping can be tested
 * with literal numbers. jsdom has no layout, so a test that read positions
 * from the DOM would be testing zero; the stories measure the real thing.
 *
 * Every position is in the scroller's own coordinates, the space `scrollLeft`
 * is measured in: an item's `start` is how far `scrollLeft` would have to be
 * for the item's leading edge to sit at the scroller's leading edge.
 */

export interface CarouselItemBox {
  start: number;
  end: number;
}

export interface CarouselGeometry {
  items: readonly CarouselItemBox[];
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
  /** `scroll-padding-inline-start`: the gutter a snapped item lines up with. */
  paddingStart: number;
  /** `scroll-padding-inline-end`. */
  paddingEnd: number;
  align: "start" | "center";
}

/** Movement past this, in px, makes a mouse press a drag, and its click is dropped. */
export const CAROUSEL_DRAG_THRESHOLD = 6;

/** Sub-pixel layout leaves fractions; anything closer than this is "at". */
export const CAROUSEL_TOLERANCE = 1;

export function maxScroll(g: CarouselGeometry): number {
  return Math.max(0, g.scrollWidth - g.clientWidth);
}

/** Whether the row is wider than its box at all. */
export function overflows(g: CarouselGeometry): boolean {
  return maxScroll(g) > CAROUSEL_TOLERANCE;
}

export function canScrollPrev(g: CarouselGeometry): boolean {
  return g.scrollLeft > CAROUSEL_TOLERANCE;
}

export function canScrollNext(g: CarouselGeometry): boolean {
  return g.scrollLeft < maxScroll(g) - CAROUSEL_TOLERANCE;
}

/**
 * The `scrollLeft` that snaps item `i` into place, clamped to what the row can
 * reach. The last items of a row that can't align to the start land at the
 * end, which is also where the browser's own snapping puts them.
 */
export function snapPosition(g: CarouselGeometry, i: number): number {
  const item = g.items[i];
  if (!item) return 0;
  const raw =
    g.align === "start"
      ? item.start - g.paddingStart
      : (item.start + item.end) / 2 -
        (g.paddingStart + (g.clientWidth - g.paddingStart - g.paddingEnd) / 2);
  return Math.min(Math.max(0, raw), maxScroll(g));
}

/** Indices of the items wholly inside the box at the current scroll. */
export function fullyVisible(g: CarouselGeometry): number[] {
  const left = g.scrollLeft - CAROUSEL_TOLERANCE;
  const right = g.scrollLeft + g.clientWidth + CAROUSEL_TOLERANCE;
  const out: number[] = [];
  g.items.forEach((item, i) => {
    if (item.start >= left && item.end <= right) out.push(i);
  });
  return out;
}

/** The item whose snap position is nearest the current scroll. */
export function nearestIndex(g: CarouselGeometry): number {
  let best = 0;
  let bestDistance = Infinity;
  g.items.forEach((_, i) => {
    const distance = Math.abs(snapPosition(g, i) - g.scrollLeft);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  });
  return best;
}

/**
 * The first item wholly in view, which is what the row reports as its index.
 * An item wider than the box is never wholly in view, so then it is the item
 * the row is snapped nearest to.
 */
export function currentIndex(g: CarouselGeometry): number {
  const visible = fullyVisible(g);
  return visible.length ? visible[0] : nearestIndex(g);
}

/**
 * Where a previous or next arrow should take the row: a page, which is as many
 * items as are wholly in view (at least one), landing on an item's snap point.
 * Measured every time rather than a fixed pixel step, so it holds whatever the
 * items' widths and however many are in view.
 *
 * Returns the target `scrollLeft`.
 */
export function pageTarget(g: CarouselGeometry, direction: 1 | -1): number {
  const count = g.items.length;
  if (!count) return 0;
  const visible = fullyVisible(g);
  const first = visible.length ? visible[0] : nearestIndex(g);
  const page = Math.max(1, visible.length);
  let index = Math.min(count - 1, Math.max(0, first + direction * page));
  /* A page that would not move the row, because the item is already at its
     clamped snap point, steps on one item at a time until something moves. */
  while (
    index > 0 &&
    index < count - 1 &&
    Math.abs(snapPosition(g, index) - g.scrollLeft) <= CAROUSEL_TOLERANCE
  ) {
    index += direction;
  }
  return snapPosition(g, index);
}
