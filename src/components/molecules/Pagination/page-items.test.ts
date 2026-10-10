import { describe, expect, it } from "vitest";
import { clampPage, pageItems } from "./page-items";

const G = "gap-start" as const;
const E = "gap-end" as const;

describe("pageItems", () => {
  it("shows every page when they fit", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageItems(1, 0)).toEqual([]);
  });

  it("keeps seven slots across 79 pages, wherever you are", () => {
    expect(pageItems(1, 79)).toEqual([1, 2, 3, 4, 5, E, 79]);
    expect(pageItems(4, 79)).toEqual([1, 2, 3, 4, 5, E, 79]);
    expect(pageItems(5, 79)).toEqual([1, G, 4, 5, 6, E, 79]);
    expect(pageItems(40, 79)).toEqual([1, G, 39, 40, 41, E, 79]);
    expect(pageItems(75, 79)).toEqual([1, G, 74, 75, 76, E, 79]);
    expect(pageItems(76, 79)).toEqual([1, G, 75, 76, 77, 78, 79]);
    expect(pageItems(79, 79)).toEqual([1, G, 75, 76, 77, 78, 79]);
  });

  it("shows a lone hidden page rather than a gap for it", () => {
    /* At 4 of 8, a gap before 3 would hide only 2, so 2 shows; the gap after
       5 hides 6 and 7, so it stays. At 5 of 8 it's the mirror: 7 shows, and
       the gap hides 2 and 3. */
    expect(pageItems(4, 8)).toEqual([1, 2, 3, 4, 5, E, 8]);
    expect(pageItems(5, 8)).toEqual([1, G, 4, 5, 6, 7, 8]);
  });

  it("widens with more siblings", () => {
    expect(pageItems(40, 79, 2)).toEqual([1, G, 38, 39, 40, 41, 42, E, 79]);
    expect(pageItems(40, 79, 0)).toEqual([1, G, 40, E, 79]);
  });

  it("treats a page out of range as the nearest end", () => {
    expect(pageItems(0, 79)).toEqual(pageItems(1, 79));
    expect(pageItems(500, 79)).toEqual(pageItems(79, 79));
    expect([clampPage(0, 79), clampPage(80, 79), clampPage(2.7, 79), clampPage(Number.NaN, 79), clampPage(3, 0)]).toEqual([1, 79, 2, 1, 1]);
    expect([pageItems(Number.NaN, 79), pageItems(1, Number.NaN), pageItems(1, Number.POSITIVE_INFINITY)]).toEqual([pageItems(1, 79), [], []]);
    expect(clampPage(5, Number.NaN)).toBe(1);
  });
});
