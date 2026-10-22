import { describe, it, expect } from "vitest";
import { survivingNeighbor, typeaheadIndex } from "./carousel-selection";

const LABELS = ["Night Swim", "Paper Suns", "Glasshouse", "Gold Leaf", "Glow"];
const at = (labels: string[]) => (i: number) => labels[i];

describe("typeaheadIndex", () => {
  it("one letter finds the next option starting with it, after the active one, and wraps", () => {
    expect([
      typeaheadIndex(5, 0, "g", at(LABELS)),
      typeaheadIndex(5, 2, "g", at(LABELS)),
      typeaheadIndex(5, 3, "g", at(LABELS)),
      typeaheadIndex(5, 4, "g", at(LABELS)),
    ]).toEqual([2, 3, 4, 2]);
  });

  it("the same letter again steps on to the next, like a single one", () => {
    expect([typeaheadIndex(5, 2, "gg", at(LABELS)), typeaheadIndex(5, 3, "ggg", at(LABELS))]).toEqual([3, 4]);
  });

  it("a longer string matches from the active option itself, so typing on keeps a match", () => {
    /* The twin: "gl" from Glasshouse stays; from Gold Leaf it moves on to Glow. */
    expect([typeaheadIndex(5, 2, "gl", at(LABELS)), typeaheadIndex(5, 3, "gl", at(LABELS)), typeaheadIndex(5, 0, "pa", at(LABELS))]).toEqual([2, 4, 1]);
  });

  it("ignores case and the label's surrounding space, and finds nothing when nothing matches", () => {
    expect([
      typeaheadIndex(2, 1, "n", at(["  night swim", "Paper"])),
      typeaheadIndex(5, 0, "x", at(LABELS)),
      typeaheadIndex(0, 0, "g", at([])),
      typeaheadIndex(5, 0, "", at(LABELS)),
    ]).toEqual([0, -1, -1, -1]);
  });

  it("reads labels only as far as the search goes", () => {
    const read: number[] = [];
    typeaheadIndex(5, 0, "g", (i) => (read.push(i), LABELS[i]));
    expect(read).toEqual([1, 2]);
  });
});

describe("survivingNeighbor", () => {
  const before = ["a", "b", "c", "d", "e"];
  it("moves to the nearest option after the lost one that's still there", () => {
    expect([survivingNeighbor(before, new Set(["a", "b", "d", "e"]), "c"), survivingNeighbor(before, new Set(["a", "e"]), "c")]).toEqual(["d", "e"]);
  });
  it("falls back to the nearest before it when nothing after is left", () => {
    expect([survivingNeighbor(before, new Set(["a", "b"]), "c"), survivingNeighbor(before, new Set(["a", "b", "c", "d"]), "e")]).toEqual(["b", "d"]);
  });
  it("has nothing to offer when no neighbor is left, nothing was lost, or the lost one is unknown", () => {
    expect([survivingNeighbor(before, new Set(), "c"), survivingNeighbor(before, new Set(["a"]), null), survivingNeighbor(before, new Set(["a"]), "z")]).toEqual([null, null, null]);
  });
});
