/**
 * Counts on a tab or a nav link: what `LiquidTabs` and `LiquidNav` share
 * about them. Internal; the type is exported from `LiquidTabs`.
 */

/** Every word a count says. Pass any of them in `labels` to replace it. */
export interface LiquidTabsLabels {
  /**
   * What a count says after the label, as part of the tab's accessible name:
   * "12 items", so the tab reads "Open, 12 items". Name your own noun, with
   * its plural, `(n) => (n === 1 ? "1 game" : n.toLocaleString() + " games")`,
   * or use `Intl.PluralRules` for a language with more forms than two. Never
   * abbreviated, whatever the mark shows.
   */
  count: (count: number) => string;
  /**
   * How a count is written in the mark beside the label: "1,000", "12,345".
   * Not abbreviated by default, so a mark never hides a number; replace it to
   * write "12K" if a tab can't afford the width.
   */
  countMark: (count: number) => string;
}

export const LIQUID_COUNT_LABELS: LiquidTabsLabels = {
  count: (count) => `${count.toLocaleString("en-US")} ${count === 1 ? "item" : "items"}`,
  countMark: (count) => count.toLocaleString("en-US"),
};

/**
 * Whether a count gets a mark: a whole number, zero or more. `undefined`
 * means no count. A negative or fractional count, or `NaN`, isn't shown at
 * all, rather than rounded or clamped into a number nobody passed.
 */
export const shownCount = (count: number | undefined): count is number =>
  typeof count === "number" && Number.isInteger(count) && count >= 0;

/**
 * The item's whole name, "Open, 12 items", when its label is a string and it
 * has a count to show; otherwise `undefined`, and the name comes from the
 * content. Set as `aria-label` because hidden text alone can't make it
 * exact: Chromium names an element from its content with a space before any
 * visually hidden part, so the hidden ", 12 items" reads "Open , 12 items".
 * A label that's a node keeps that content name, which is spoken the same.
 */
export const countName = (label: unknown, count: number | undefined, labels: LiquidTabsLabels): string | undefined =>
  typeof label === "string" && shownCount(count) ? `${label}, ${labels.count(count)}` : undefined;
