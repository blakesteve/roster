import { describe, it, expect } from "vitest";
import {
  exceedsSheetTapSlop,
  sheetDragOutcome,
  sheetReleaseVelocity,
} from "./sheet-drag";

/* Every number here is a literal from the requirement, not one read back from
   the module's constants. A test that computed 30% from
   `SHEET_CLOSE_DISTANCE` would pass whatever the constant said. */

describe("sheetDragOutcome", () => {
  describe("by distance, at a 600px sheet", () => {
    it("closes past 30%: 186px (31%)", () => {
      expect(sheetDragOutcome(186, 600, 0)).toBe("close");
    });

    it("stays short of it: 174px (29%)", () => {
      expect(sheetDragOutcome(174, 600, 0)).toBe("stay");
    });

    it("stays at exactly 30%, which is not more than 30%", () => {
      expect(sheetDragOutcome(180, 600, 0)).toBe("stay");
    });

    it("scales with the height: 31% of 300px closes", () => {
      expect(sheetDragOutcome(93, 300, 0)).toBe("close");
      expect(sheetDragOutcome(93, 600, 0)).toBe("stay");
    });
  });

  describe("by flick", () => {
    it("closes at 0.6 px/ms over 20px", () => {
      expect(sheetDragOutcome(20, 600, 0.6)).toBe("close");
    });

    it("stays at 0.6 px/ms over 10px, too short to be a flick", () => {
      expect(sheetDragOutcome(10, 600, 0.6)).toBe("stay");
    });

    it("closes at exactly 0.5 px/ms over exactly 16px", () => {
      expect(sheetDragOutcome(16, 600, 0.5)).toBe("close");
    });

    it("stays just under either bound", () => {
      expect(sheetDragOutcome(15, 600, 0.5)).toBe("stay");
      expect(sheetDragOutcome(16, 600, 0.49)).toBe("stay");
    });
  });

  describe("upward", () => {
    it("never closes on an upward flick at 2 px/ms", () => {
      expect(sheetDragOutcome(-40, 600, -2)).toBe("stay");
    });

    it("never closes on an upward flick, even from past 30%", () => {
      /* Pulled most of the way down, then flung back up: a change of mind. */
      expect(sheetDragOutcome(400, 600, -2)).toBe("stay");
    });

    it("never closes on upward travel", () => {
      expect(sheetDragOutcome(-300, 600, 0)).toBe("stay");
    });
  });

  it("treats 8px as a tap, whatever the speed", () => {
    expect(sheetDragOutcome(8, 20, 5)).toBe("stay");
    expect(sheetDragOutcome(9, 20, 0)).toBe("close");
  });
});

describe("exceedsSheetTapSlop", () => {
  it("8px of movement is a tap", () => {
    expect(exceedsSheetTapSlop(0, 8)).toBe(false);
    expect(exceedsSheetTapSlop(8, 0)).toBe(false);
    expect(exceedsSheetTapSlop(0, -8)).toBe(false);
  });

  it("anything further is a drag", () => {
    expect(exceedsSheetTapSlop(0, 9)).toBe(true);
    expect(exceedsSheetTapSlop(-9, 0)).toBe(true);
  });

  it("measures the distance, not each axis: 6 and 6 is 8.49px", () => {
    expect(exceedsSheetTapSlop(6, 6)).toBe(true);
    expect(exceedsSheetTapSlop(5, 6)).toBe(false);
  });
});

describe("sheetReleaseVelocity", () => {
  it("averages over the last 100ms, not the whole drag", () => {
    /* 60px in the last 100ms is 0.6 px/ms. Over the last 200ms it would be
       70px, 0.35; over the whole drag, 100px in 500ms, 0.2. Only the 100ms
       window gives 0.6. */
    const samples = [
      { t: 0, y: 100 },
      { t: 300, y: 130 },
      { t: 400, y: 140 },
      { t: 450, y: 170 },
      { t: 500, y: 200 },
    ];
    expect(sheetReleaseVelocity(samples)).toBeCloseTo(0.6, 10);
  });

  it("includes a sample exactly 100ms before the last", () => {
    expect(
      sheetReleaseVelocity([
        { t: 0, y: 0 },
        { t: 100, y: 50 },
      ]),
    ).toBe(0.5);
  });

  it("is negative for an upward flick", () => {
    expect(
      sheetReleaseVelocity([
        { t: 1000, y: 400 },
        { t: 1050, y: 300 },
      ]),
    ).toBe(-2);
  });

  it("is zero when the finger stopped before lifting", () => {
    /* No movement for 250ms, so the last 100ms hold one instant. */
    expect(
      sheetReleaseVelocity([
        { t: 0, y: 0 },
        { t: 50, y: 60 },
        { t: 300, y: 60 },
      ]),
    ).toBe(0);
  });

  it("is zero with fewer than two samples", () => {
    expect(sheetReleaseVelocity([])).toBe(0);
    expect(sheetReleaseVelocity([{ t: 5, y: 5 }])).toBe(0);
  });
});
