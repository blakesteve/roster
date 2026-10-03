import type { CarouselPerView } from "./Carousel";

/**
 * Fluid mode's sizing. The items-per-view table becomes one item width per
 * breakpoint, set as custom properties on the list, and five short classes
 * pick the one for the current width. The server render is already the right
 * size, and nothing measures before it paints.
 *
 * Every breakpoint is filled in, carrying the one below it up, so the CSS
 * needs no fallback chain, and a row nested in another fluid row never
 * inherits the outer row's widths. Kept small on purpose: Roster's stylesheet
 * ships to every consumer, carousel or not.
 */

export const BREAKPOINTS = ["base", "sm", "md", "lg", "xl"] as const;

/**
 * One item's width for `n` items per view. A fraction is the peek, and the
 * peek runs into the trailing gutter, out to the edge. A whole number of items
 * fits between the gutters instead, so a one-per-view gallery sits centered.
 * `100%` is the list's content box, resolved where the width is used.
 */
export function fluidItemWidth(n: number): string {
  const gaps = Math.ceil(n) - 1;
  const peek = Number.isInteger(n) ? 0 : 1;
  return `calc((100% + ${peek} * var(--rst-cv-gutter) - ${gaps} * var(--rst-cv-gap)) / ${n})`;
}

export function perViewVars(perView: number | CarouselPerView): Record<string, string> {
  const table: Partial<Record<(typeof BREAKPOINTS)[number], number>> =
    typeof perView === "number" ? { base: perView } : perView;
  const vars: Record<string, string> = {};
  let current: number | undefined;
  for (const bp of BREAKPOINTS) {
    const n = table[bp];
    if (n !== undefined && n > 0) current = n;
    if (current !== undefined) vars[`--rst-cv-w-${bp}`] = fluidItemWidth(current);
  }
  return vars;
}

export const FLUID_ITEM_WIDTH = "var(--rst-cv-w)";

/* Written out rather than built in a loop, because Tailwind reads class names
   from the source text and never runs this file. */
export const FLUID_CLASSES =
  "rst:[--rst-cv-w:var(--rst-cv-w-base)] rst:sm:[--rst-cv-w:var(--rst-cv-w-sm)] rst:md:[--rst-cv-w:var(--rst-cv-w-md)] rst:lg:[--rst-cv-w:var(--rst-cv-w-lg)] rst:xl:[--rst-cv-w:var(--rst-cv-w-xl)]";
