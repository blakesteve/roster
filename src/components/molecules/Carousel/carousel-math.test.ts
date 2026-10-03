import { describe, it, expect } from "vitest";
import {
  canScrollNext,
  canScrollPrev,
  currentIndex,
  fullyVisible,
  maxScroll,
  nearestIndex,
  overflows,
  pageTarget,
  snapPosition,
  type CarouselGeometry,
} from "./carousel-math";

/* A row of cards: 13 items of 240px with a 12px gap and a 16px gutter, in a
   720px box. Every expected value below is worked out by hand from those
   numbers, not taken from the module, so a wrong formula can't agree with
   itself. Item i starts at 16 + 252i. scrollWidth = 16 + 13 * 240 + 12 * 12
   + 16 = 3296. */
const cards = (scrollLeft: number, overrides: Partial<CarouselGeometry> = {}): CarouselGeometry => ({
  items: Array.from({ length: 13 }, (_, i) => ({ start: 16 + 252 * i, end: 256 + 252 * i })),
  scrollLeft,
  clientWidth: 720,
  scrollWidth: 3296,
  paddingStart: 16,
  paddingEnd: 16,
  align: "start",
  ...overrides,
});

describe("carousel arithmetic", () => {
  it("knows how far the row can go, and whether it overflows", () => {
    expect(maxScroll(cards(0))).toBe(2576);
    expect(overflows(cards(0))).toBe(true);
    expect(overflows(cards(0, { scrollWidth: 720 }))).toBe(false);
    expect(overflows(cards(0, { scrollWidth: 721 }))).toBe(false); // a pixel of rounding is not overflow
  });

  it("can't go back at the start or on at the end", () => {
    expect(canScrollPrev(cards(0))).toBe(false);
    expect(canScrollNext(cards(0))).toBe(true);
    expect(canScrollPrev(cards(2576))).toBe(true);
    expect(canScrollNext(cards(2576))).toBe(false);
    expect(canScrollNext(cards(2575.5))).toBe(false); // sub-pixel short of the end is the end
  });

  it("snaps an item's edge onto the gutter, and clamps the last ones to the end", () => {
    expect(snapPosition(cards(0), 0)).toBe(0);
    expect(snapPosition(cards(0), 2)).toBe(504);
    expect(snapPosition(cards(0), 12)).toBe(2576); // 3040 unclamped
  });

  it("centers an item in the padded box when snapping to center", () => {
    // Item 3's middle is 16 + 756 + 120 = 892; the padded box's middle is 16 + 344 = 360.
    expect(snapPosition(cards(0, { align: "center" }), 3)).toBe(532);
  });

  it("counts only the items wholly in view", () => {
    expect(fullyVisible(cards(0))).toEqual([0, 1]); // item 2 runs to 760, past 720
    expect(fullyVisible(cards(504))).toEqual([2, 3]);
    expect(currentIndex(cards(504))).toBe(2);
  });

  it("pages by the number wholly in view, onto the next item's edge", () => {
    expect(pageTarget(cards(0), 1)).toBe(504); // two in view: from item 0 to item 2
    expect(pageTarget(cards(504), 1)).toBe(1008);
    expect(pageTarget(cards(504), -1)).toBe(0);
    expect(pageTarget(cards(2576), 1)).toBe(2576); // nowhere further to go
  });

  it("pages back from the end so the page before it shows", () => {
    // At 2576 the box runs 2576 to 3296: items 11 (2788..3028) and 12 (3040..3280) are in view.
    expect(fullyVisible(cards(2576))).toEqual([11, 12]);
    expect(pageTarget(cards(2576), -1)).toBe(2268); // item 9's edge: 16 + 252 * 9 - 16
  });

  it("moves at least one item when an item is wider than the box", () => {
    const wide = cards(0, {
      items: [
        { start: 16, end: 816 },
        { start: 828, end: 1628 },
      ],
      scrollWidth: 1644,
    });
    expect(fullyVisible(wide)).toEqual([]);
    expect(currentIndex(wide)).toBe(0);
    expect(pageTarget(wide, 1)).toBe(812);
  });

  it("settles a drag on the nearest item", () => {
    expect(nearestIndex(cards(120))).toBe(0); // 120 is nearer 0 than 252
    expect(nearestIndex(cards(130))).toBe(1);
    expect(nearestIndex(cards(2500))).toBe(10); // item 10 snaps at 2520, the end at 2576
    // Items 11 and 12 both clamp to the end, 2576; the first of them wins.
    expect(nearestIndex(cards(2560))).toBe(11);
  });

  it("does nothing at all with no items", () => {
    const empty = cards(0, { items: [], scrollWidth: 720 });
    expect(pageTarget(empty, 1)).toBe(0);
    expect(snapPosition(empty, 0)).toBe(0);
  });
});
