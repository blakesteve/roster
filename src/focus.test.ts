import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buttonVariants } from "./components/atoms/Button/button-variants";
import { checkboxVariants } from "./components/atoms/Checkbox/checkbox-variants";
import { switchTrackVariants } from "./components/atoms/Switch/switch-variants";
import { inputVariants } from "./components/atoms/Input/input-variants";

const TOKENS = readFileSync(join(__dirname, "tokens.css"), "utf8");
const INDEX = readFileSync(join(__dirname, "index.css"), "utf8");

function resolve(name: string): string | null {
  const match = TOKENS.match(new RegExp(`--roster-${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match ? match[1] : null;
}

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  return (
    0.2126 * channel(parseInt(hex.slice(1, 3), 16)) +
    0.7152 * channel(parseInt(hex.slice(3, 5), 16)) +
    0.0722 * channel(parseInt(hex.slice(5, 7), 16))
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The focus indicator is a separate requirement from text contrast. The 3:1
 * bar is **1.4.11 Non-text Contrast** (AA), which covers the visual
 * information needed to identify a component's state.
 *
 * Not 2.4.11 — in WCAG 2.2 as published that is "Focus Not Obscured", about
 * sticky headers hiding the focused element. "Focus Appearance" carried the
 * number 2.4.11 in the working drafts, then was renumbered 2.4.13 and demoted
 * to AAA. Citing the draft number as the AA bar is an easy mistake to make and
 * would not survive an audit.
 *
 * Roster failed it completely and silently. `Button`, `Badge` and `Input` asked
 * for `ring-ring` and `ring-offset-background`, but neither `--color-ring` nor
 * `--color-background` was ever defined, so Tailwind emitted no rule for either
 * and the ring fell back to `var(--tw-ring-color, currentcolor)`. The focus ring
 * was the text color: a white ring, on a white offset band, on a white page.
 *
 * These assert the tokens exist and that the resulting indicator is visible on
 * both sides — against the offset band it paints, and against the page beyond
 * it. `scripts/check-classes-emit.mjs` is the other half, and catches the more
 * general form: any class naming a token that does not exist.
 */
describe("the focus indicator", () => {
  const INDICATOR = 3;

  /**
   * Reads a focus token out of one scope of the stylesheet.
   *
   * Anchored on the `Focus tokens` comment and then on the next `:root {` or
   * `.dark {` after it. An earlier version searched for the literal dark value
   * it expected to find, which meant changing that value made the helper report
   * "no token found in the dark scope" — false, and it sent you looking in
   * entirely the wrong place.
   */
  function themeVar(name: string, scope: "root" | "dark"): string | null {
    const from = INDEX.indexOf("Focus tokens");
    if (from === -1) return null;
    const opener = scope === "dark" ? ".dark {" : ":root {";
    const blockStart = INDEX.indexOf(opener, from);
    if (blockStart === -1) return null;
    const block = INDEX.slice(blockStart, INDEX.indexOf("}", blockStart));
    const match = block.match(new RegExp(`${name}:\\s*var\\((--roster-[\\w-]+)`));
    return match ? match[1].replace("--roster-", "") : null;
  }

  it("defines the tokens the components were already asking for", () => {
    /* Undefined, these emit nothing at all — the failure is silent. */
    const css = readFileSync(join(__dirname, "index.css"), "utf8");
    expect(css).toMatch(/--color-ring:\s*var\(--roster-ring/);
    expect(css).toMatch(/--color-background:\s*var\(--roster-ring-offset/);
  });

  it.each([
    ["light", "root"],
    ["dark", "dark"],
  ] as const)("is visible in %s mode", (mode, scope) => {
    /* Read from the stylesheet rather than restated here. Hardcoding the token
       names would mean this measures what the test assumes is configured, not
       what is — and a change to either token would sail past it. */
    const ringToken = themeVar("--roster-ring", scope);
    const surfaceToken = themeVar("--roster-ring-offset", scope);
    expect(ringToken, `no --roster-ring found in the ${scope} scope`).not.toBeNull();
    expect(surfaceToken, `no --roster-ring-offset found in the ${scope} scope`).not.toBeNull();

    const ring = resolve(ringToken!)!;
    const surface = resolve(surfaceToken!)!;

    /* Two adjacencies matter: the ring against the offset band it sits on, and
       the ring against the page beyond it. Both are the surface color here. */
    expect(
      contrast(ring, surface),
      `the ${mode} focus ring (${ringToken}) measures ` +
        `${contrast(ring, surface).toFixed(2)}:1 against ${surfaceToken}. ` +
        `1.4.11 needs ${INDICATOR}:1 or the indicator cannot be seen.`,
    ).toBeGreaterThanOrEqual(INDICATOR);
  });

  it("resolves the ring through --roster-*, so a consumer can retint it", () => {
    expect(themeVar("--roster-ring", "root")).toBe("primary-500");
    expect(themeVar("--roster-ring", "dark")).toBe("primary-400");
  });
});

/**
 * The controls themselves must keep asking for the ring.
 *
 * Everything above verifies the *tokens* are defined and contrast correctly.
 * None of it noticed when `rst:focus-visible:ring-ring` was deleted from Button
 * outright — the build stayed green and all 951 tests passed, with the
 * branch's headline change reverted. The token being right is worth nothing if
 * no component reaches for it.
 *
 * Paired with `scripts/check-classes-emit.mjs`, which proves the class emits
 * CSS, these two together mean "this control has a visible focus ring".
 * Neither one alone does.
 */
describe("controls reach for the ring", () => {
  const RING = "rst:focus-visible:ring-ring";

  it.each([
    ["Button", buttonVariants()],
    ["Checkbox", checkboxVariants()],
    ["Switch", switchTrackVariants()],
    ["Input", inputVariants()],
  ])("%s asks for the ring token", (_name, classes) => {
    expect(classes).toContain(RING);
  });

  /**
   * A ring offset width with no offset color falls back to Tailwind's `#fff`,
   * which paints a white halo on a dark page — the exact bug the token was
   * introduced to remove. Anything reserving the gap has to say what color it
   * is. This walks the components rather than naming them, so a control added
   * tomorrow is covered without anyone remembering to add it here.
   */
  it("every control reserving a ring offset also names its color", () => {
    const offenders: string[] = [];
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? walk(join(dir, e.name))
          : /\.tsx?$/.test(e.name) && !/\.(test|stories)\./.test(e.name)
            ? [join(dir, e.name)]
            : [],
      );

    for (const file of walk(join(__dirname, "components"))) {
      const source = readFileSync(file, "utf8");
      /* `[\w-]+`, not `\w+`: the variant is `focus-visible`, and a hyphen in
         the character class is the difference between this guard working and
         skipping every file it was written to check. */
      if (!/rst:(?:[\w-]+:)*ring-offset-\d/.test(source)) continue;
      if (/ring-offset-(background|white|gray-\d+|transparent)/.test(source)) continue;
      offenders.push(file.split("/components/")[1]);
    }

    expect(
      offenders,
      `these reserve a ring offset but never set its color, so it paints ` +
        `Tailwind's #fff: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
