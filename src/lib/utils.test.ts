import { describe, expect, it } from "vitest";

import { cn } from "./utils";

/**
 * `cn` is `clsx` + `tailwind-merge`, and tailwind-merge has to be told about
 * Roster's `rst:` prefix. Without that configuration it stops recognising the
 * classes as utilities at all and quietly degrades to concatenation: both sides
 * of a conflict survive, and which one paints falls back to stylesheet order
 * rather than call order.
 *
 * That failure is invisible in a class-name snapshot — the string still
 * *contains* what you asked for — and obvious in a browser, which is the worst
 * pairing. Hence assertions on what gets dropped, not just on what remains.
 */
describe("cn", () => {
  it("keeps the last of two conflicting prefixed utilities", () => {
    expect(cn("rst:p-2", "rst:p-4")).toBe("rst:p-4");
  });

  it("resolves conflicts per property, not per class string", () => {
    const merged = cn("rst:bg-white rst:text-sm", "rst:bg-gray-900");
    expect(merged).toContain("rst:bg-gray-900");
    expect(merged).toContain("rst:text-sm");
    expect(merged).not.toContain("rst:bg-white");
  });

  it("treats a variant as its own property, so it does not eat the base", () => {
    const merged = cn("rst:bg-white", "rst:dark:bg-gray-950");
    expect(merged).toContain("rst:bg-white");
    expect(merged).toContain("rst:dark:bg-gray-950");
  });

  /**
   * The escape hatch Roster documents: a consumer passes their own unprefixed
   * class and it must survive untouched, because it lands in their `utilities`
   * layer and is supposed to win.
   */
  it("leaves a consumer's unprefixed class alone", () => {
    const merged = cn("rst:bg-white", "bg-brand");
    expect(merged).toContain("bg-brand");
    expect(merged).toContain("rst:bg-white");
  });

  it("still takes conditionals and arrays from clsx", () => {
    const collapsed = false;
    expect(cn("rst:flex", collapsed && "rst:hidden", ["rst:gap-2"])).toBe(
      "rst:flex rst:gap-2",
    );
  });
});
