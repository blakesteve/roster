import { describe, it, expect } from "vitest";
import {
  POPUP_PANEL,
  POPUP_WIDTH_OF_BUTTON,
  POPUP_WIDTH_OF_INPUT,
  POPUP_ANCHOR,
} from "./popup";

/**
 * These pin the two things that were got wrong in a real app before this
 * module existed, so that copying them into a third component cannot quietly
 * reintroduce either.
 */
describe("the shared popup panel", () => {
  it("draws its surface from the popover tokens, never hardcoded colors", () => {
    /* A consumer repainting the trigger with `--roster-control-*` was opening
       a hardcoded white sheet under it. */
    expect(POPUP_PANEL).toContain("rst:bg-[var(--roster-popover-bg)]");
    expect(POPUP_PANEL).toContain("rst:text-[var(--roster-popover-text)]");
    expect(POPUP_PANEL).toContain("rst:ring-[var(--roster-popover-border)]");
    expect(POPUP_PANEL).not.toContain("bg-white");
    expect(POPUP_PANEL).not.toContain("dark:bg-gray-800");
  });

  it("sets no height and no overflow, because Headless UI writes both inline", () => {
    /* Asserted as an absence, which is the only shape this can take: the day
       someone adds a height utility here it fails and sends them to the
       comment explaining that an inline rule outranks it. */
    const classes = POPUP_PANEL.split(/\s+/);
    expect(classes.some((c) => /^rst:max-h-/.test(c))).toBe(false);
    expect(classes.some((c) => /^rst:overflow-/.test(c))).toBe(false);
  });

  it("keeps the anchor gap as a variable a consumer can reach", () => {
    expect(POPUP_PANEL).toContain("rst:[--anchor-gap:4px]");
  });

  it("keeps width out of the panel, because which control to match differs", () => {
    /* Not a hypothetical separation. Headless UI writes both variables inline
       on the panel: for a Listbox the button IS the trigger, but for a
       Combobox it is the chevron beside the input — matching it rendered the
       menu about 20px wide and unreadable. */
    expect(POPUP_WIDTH_OF_BUTTON).toBe("rst:w-(--button-width)");
    expect(POPUP_WIDTH_OF_INPUT).toBe("rst:w-(--input-width)");
    expect(POPUP_PANEL).not.toContain("--button-width");
    expect(POPUP_PANEL).not.toContain("--input-width");
  });

  it("opens below and start-aligned, the one anchor Roster uses", () => {
    expect(POPUP_ANCHOR).toBe("bottom start");
  });
});
