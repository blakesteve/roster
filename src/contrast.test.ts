import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { badgeVariants } from "./components/atoms/Badge/badge-variants";
import { pillVariants } from "./components/atoms/Pill/pill-variants";
import { buttonVariants } from "./components/atoms/Button/button-variants";

/**
 * Every solid fill must carry a foreground that meets WCAG AA, at rest and on
 * hover.
 *
 * `Badge`, `Pill` and `Button` paint a family color and put text on top of it,
 * and that pairing was assumed rather than measured: `text-white` was the
 * default for every family except amber, where someone had clearly hit the
 * problem and fixed that one case by hand. Eleven resting pairs came in under
 * 4.5:1 — solid teal at 2.49 and solid info at 2.77, roughly half the
 * threshold.
 *
 * Hover is included deliberately. An earlier version of this test excluded it
 * on the reasoning that a hover fill is "transient" — which is not a position
 * WCAG takes, and which turned out to be exactly the wrong place to look away
 * from: moving the foreground to near-black while the hover fill *darkened*
 * regressed four pairs from passing to failing. Badge purple went 4.67 at rest
 * to 3.47 hovered, so pointing at it made it harder to read. A guard that
 * carves out the states its own change degrades is worse than no guard,
 * because it certifies the regression.
 *
 * The classes come from calling the cva functions, not from reading the source.
 * Parsing the file meant a variant reformatted across lines, or written with
 * `class:` instead of `className:`, or built by concatenation, silently
 * vanished from the list while its bad CSS shipped — five such mutations
 * survived the earlier version. Only the color-scheme *names* are read from
 * source, and their count is pinned below so a deletion cannot shrink the
 * surface unnoticed. The threshold itself is still a constant in this file, so
 * this is a guard against drift, not against someone determined to lower the
 * bar.
 *
 * AA for normal-size text is 4.5:1. Nothing here qualifies for the 3:1
 * large-text allowance: Badge runs 10-14px and Pill 12-14px at `font-medium`,
 * and Button's `lg` size only changes height and padding, not its 14px type.
 */

const AA = 4.5;
const TOKENS = readFileSync(join(__dirname, "tokens.css"), "utf8");

function token(name: string): string | null {
  const match = TOKENS.match(new RegExp(`--roster-${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match ? match[1] : null;
}

/**
 * A Tailwind color token resolved to hex.
 *
 * `black` and `white` go through the tokens like everything else. Short-
 * circuiting them to #000/#fff was wrong: this library maps `--roster-black`
 * to #1e1c1a, so `text-black` was being measured 2.4 points brighter than it
 * ships — and a retheme of that token would have gone unnoticed entirely.
 */
function resolve(name: string): string | null {
  return token(name);
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

/** Color-scheme names a variants module declares, read from its source. */
function schemeNames(file: string, key: "variant" | "colorScheme"): string[] {
  const source = readFileSync(join(__dirname, file), "utf8");
  const found = [...source.matchAll(new RegExp(`${key}: "(\\w+)"`, "g"))].map((m) => m[1]);
  return [...new Set(found)].filter((n) => n !== "solid" && n !== "soft" && n !== "outline");
}

type Pair = {
  component: string;
  scheme: string;
  mode: "light" | "dark";
  state: "rest" | "hover";
  bg: string;
  fg: string;
};

/**
 * Resolves one component's solid variant into the four pairs it can present:
 * light and dark, at rest and hovered. A class with no dark override inherits
 * its light counterpart, and a scheme with no hover fill keeps its resting one.
 */
function pairsFor(component: string, scheme: string, className: string): Pair[] {
  const classes = className.split(/\s+/).map((c) => c.replace(/^rst:/, ""));
  /*
   * Picks the class that names an actual color, not merely one starting with
   * the right prefix. A resolved cva string carries `text-xs` alongside
   * `text-white`, and taking the first `text-` match meant measuring the
   * contrast of a font size.
   */
  const pick = (test: (c: string) => boolean, prefix: string) => {
    const names = classes
      .filter(test)
      .map((c) => c.replace(/^(dark:)?(hover:)?/, ""))
      .filter((c) => c.startsWith(prefix))
      .map((c) => c.slice(prefix.length));
    return names.find((n) => token(n) !== null) ?? null;
  };
  const plain = (c: string) => !c.startsWith("dark:") && !c.startsWith("hover:");
  const hover = (c: string) => c.startsWith("hover:");
  const darkOnly = (c: string) => c.startsWith("dark:") && !c.startsWith("dark:hover:");
  const darkHover = (c: string) => c.startsWith("dark:hover:");

  const lightBg = pick(plain, "bg-");
  const lightFg = pick(plain, "text-");
  const darkBg = pick(darkOnly, "bg-") ?? lightBg;
  const darkFg = pick(darkOnly, "text-") ?? lightFg;
  const lightHoverBg = pick(hover, "bg-") ?? lightBg;
  const darkHoverBg = pick(darkHover, "bg-") ?? darkBg;

  const out: Pair[] = [];
  const add = (mode: Pair["mode"], state: Pair["state"], bg: string | null, fg: string | null) => {
    if (bg && fg) out.push({ component, scheme, mode, state, bg, fg });
  };
  add("light", "rest", lightBg, lightFg);
  add("light", "hover", lightHoverBg, lightFg);
  add("dark", "rest", darkBg, darkFg);
  add("dark", "hover", darkHoverBg, darkFg);
  return out;
}

const COMPONENTS = [
  {
    name: "Badge",
    file: "components/atoms/Badge/badge-variants.ts",
    key: "variant" as const,
    /** Pinned. A deletion here should fail loudly, not shrink the surface. */
    expected: 8,
    resolve: (scheme: string) =>
      badgeVariants({ fill: "solid", variant: scheme as never }),
  },
  {
    name: "Pill",
    file: "components/atoms/Pill/pill-variants.ts",
    key: "colorScheme" as const,
    expected: 6,
    resolve: (scheme: string) =>
      pillVariants({ variant: "solid", colorScheme: scheme as never }),
  },
  {
    name: "Button",
    file: "components/atoms/Button/button-variants.ts",
    key: "colorScheme" as const,
    expected: 8,
    resolve: (scheme: string) =>
      buttonVariants({ variant: "solid", colorScheme: scheme as never }),
  },
];

const PAIRS: Pair[] = COMPONENTS.flatMap((c) =>
  schemeNames(c.file, c.key).flatMap((scheme) => pairsFor(c.name, scheme, c.resolve(scheme))),
);

describe("solid fills meet WCAG AA", () => {
  it.each(COMPONENTS)("$name declares the color schemes this test expects", (component) => {
    /* An exact count, not a floor. The previous `PAIRS.length > 20` against an
       actual 44 left room to delete more than half the surface silently. */
    expect(schemeNames(component.file, component.key)).toHaveLength(component.expected);
  });

  it("checks every component that has a solid fill", () => {
    /* A fourth component with solid variants would otherwise never be parsed,
       never asserted, and its absence never noticed. */
    const registered = new Set(COMPONENTS.map((c) => c.file.split("/").pop()));
    const unregistered: string[] = [];
    for (const tier of readdirSync(join(__dirname, "components"), { withFileTypes: true })) {
      if (!tier.isDirectory()) continue;
      const tierDir = join(__dirname, "components", tier.name);
      for (const entry of readdirSync(tierDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        for (const file of readdirSync(join(tierDir, entry.name))) {
          if (!file.endsWith("-variants.ts") || registered.has(file)) continue;
          const source = readFileSync(join(tierDir, entry.name, file), "utf8");
          if (/(?:fill|variant): "solid"/.test(source)) unregistered.push(file);
        }
      }
    }
    expect(
      unregistered,
      `these declare a solid fill but are not checked for contrast: ${unregistered.join(", ")}`,
    ).toEqual(["checkbox-variants.ts"]);
  });

  it("resolves every color it is about to judge", () => {
    for (const pair of PAIRS) {
      expect(resolve(pair.bg), `${pair.component}/${pair.scheme}: unknown fill "${pair.bg}"`)
        .not.toBeNull();
      expect(resolve(pair.fg), `${pair.component}/${pair.scheme}: unknown text "${pair.fg}"`)
        .not.toBeNull();
    }
  });

  it.each(PAIRS)("$component $scheme, $mode $state: bg-$bg on text-$fg", (pair) => {
    const ratio = contrast(resolve(pair.bg)!, resolve(pair.fg)!);
    expect(
      ratio,
      `${pair.component} "${pair.scheme}" ${pair.mode} ${pair.state} puts text-${pair.fg} ` +
        `on bg-${pair.bg}, which measures ${ratio.toFixed(2)}:1. AA needs ${AA}:1 at this ` +
        `text size. Move the fill away from the foreground, or change the foreground.`,
    ).toBeGreaterThanOrEqual(AA);
  });
});

describe("the contrast calculation itself", () => {
  /* Pinned to known values. A broken formula could otherwise satisfy every
     assertion above by reporting that nothing has a contrast problem. */
  it("matches WCAG reference pairs", () => {
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 1);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrast("#000000", "#808080")).toBeCloseTo(5.32, 1);
  });

  it("does not depend on argument order", () => {
    expect(contrast("#0ea5e9", "#ffffff")).toBeCloseTo(contrast("#ffffff", "#0ea5e9"), 10);
  });

  it("reads black from the tokens rather than assuming it", () => {
    /* This library's black is #1e1c1a. Assuming #000000 overstated every
       `text-black` pair by about 2.4. */
    expect(resolve("black")).toBe("#1e1c1a");
  });
});
