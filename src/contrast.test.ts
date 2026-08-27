import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { badgeVariants } from "./components/atoms/Badge/badge-variants";
import { pillVariants } from "./components/atoms/Pill/pill-variants";
import { buttonVariants } from "./components/atoms/Button/button-variants";
import { checkboxVariants } from "./components/atoms/Checkbox/checkbox-variants";

/**
 * Every solid fill must carry a foreground that meets WCAG AA, at rest and on
 * hover.
 *
 * `Badge`, `Pill`, `Button` and `Checkbox` paint a family color and put a
 * foreground on top of it, and that pairing was assumed rather than measured:
 * `text-white` was the default for every family except amber, where someone had
 * clearly hit the problem and fixed that one case by hand. Eleven resting pairs
 * came in under 4.5:1 — solid teal at 2.49 and solid info at 2.77, roughly half
 * the threshold.
 *
 * The foreground is no longer hardcoded. Each fill carries its own
 * `--roster-{fill}-ink`, so what this measures is the *default* each token
 * resolves to — which is what an untouched consumer renders. A consumer who
 * overrides one is choosing their own contrast, and only their build can judge
 * it. Every state is paired with the ink belonging to its own fill, and a
 * separate assertion below holds that invariant, because contrast alone does
 * not: a missing `hover:text-*` falls back to the resting ink and measures fine
 * until someone sets one token and not the other.
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
 * AA for normal-size text is 4.5:1, and nothing here qualifies for the 3:1
 * large-text allowance: Badge runs 10-14px and Pill 12-14px at `font-medium`,
 * and Button's `lg` size only changes height and padding, not its 14px type.
 *
 * `Checkbox` is the one exception, and for a different reason entirely. Its
 * foreground is a tick — a `FontAwesomeIcon`, not a character — so the bar is
 * WCAG 1.4.11 Non-text Contrast at 3:1, not 1.4.3 at 4.5:1. It used to be
 * excluded from this file outright, which measured it against nothing at all.
 */

const AA = 4.5;
/* WCAG 1.4.11 Non-text Contrast. A checkbox's tick is a graphical object, not
   text, so 3:1 is the bar it has to clear rather than 4.5:1. Excluding the
   component outright — which is what happened before — measured it against
   nothing at all. */
const AA_NON_TEXT = 3;
const TOKENS = readFileSync(join(__dirname, "tokens.css"), "utf8");
const INDEX = readFileSync(join(__dirname, "index.css"), "utf8");

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
  /*
   * Ink tokens resolve through their default. `--color-primary-600-ink` is
   * declared in index.css as `var(--roster-primary-600-ink, <white or
   * gray-950>)`, so what a consumer sees untouched is that fallback — which is
   * the pairing this suite exists to judge. A consumer who overrides one is
   * choosing their own contrast, and only their own build can check it.
   */
  const ink = name.match(/^(.*)-ink$/);
  if (ink) {
    const declared = INDEX.match(
      new RegExp(`--color-${ink[1]}-ink:\\s*var\\([^,]+,\\s*var\\(--roster-([a-z0-9-]+),`),
    );
    return declared ? token(declared[1]) : null;
  }
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
  /** 4.5:1 for text, 3:1 where the foreground is a glyph. */
  bar: number;
};

/**
 * Resolves one component's solid variant into the four pairs it can present:
 * light and dark, at rest and hovered. A class with no dark override inherits
 * its light counterpart, and a scheme with no hover fill keeps its resting one.
 */
function pairsFor(component: string, scheme: string, className: string, bar: number): Pair[] {
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
    return names.find((n) => resolve(n) !== null) ?? null;
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
  /* Hover has its own foreground now. Ink is keyed by fill, so a scheme whose
     hover moves to a different shade carries that shade's ink — and pairing the
     hover *fill* with the *resting* ink, which is what this did before, judged
     a combination that never renders. It passed only because every hover ink
     default happens to equal its rest ink default today; repointing one at a
     dark ink shipped 1.81:1 without failing anything. */
  const lightHoverFg = pick(hover, "text-") ?? lightFg;
  const darkHoverFg = pick(darkHover, "text-") ?? darkFg;

  const out: Pair[] = [];
  const add = (mode: Pair["mode"], state: Pair["state"], bg: string | null, fg: string | null) => {
    if (bg && fg) out.push({ component, scheme, mode, state, bg, fg, bar });
  };
  add("light", "rest", lightBg, lightFg);
  add("light", "hover", lightHoverBg, lightHoverFg);
  add("dark", "rest", darkBg, darkFg);
  add("dark", "hover", darkHoverBg, darkHoverFg);
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
  {
    name: "Checkbox",
    file: "components/atoms/Checkbox/checkbox-variants.ts",
    key: "colorScheme" as const,
    expected: 8,
    /* Only the checked state paints a fill; unchecked is a bordered box with
       nothing on it to judge. */
    resolve: (scheme: string) =>
      checkboxVariants({ variant: "solid", colorScheme: scheme as never, checked: true }),
    bar: AA_NON_TEXT,
  },
];

const PAIRS: Pair[] = COMPONENTS.flatMap((c) =>
  schemeNames(c.file, c.key).flatMap((scheme) =>
    pairsFor(c.name, scheme, c.resolve(scheme), c.bar ?? AA),
  ),
);

describe("the ink tokens themselves", () => {
  /* Every `text-*-ink` a variant asks for, read straight from the sources. */
  const referenced = [
    ...new Set(
      COMPONENTS.flatMap((c) => {
        const src = readFileSync(join(__dirname, c.file), "utf8");
        return [...src.matchAll(/text-([a-z]+-\d+)-ink/g)].map((m) => m[1]);
      }),
    ),
  ].sort();

  it("declares one for every fill a variant asks for", () => {
    /* Tailwind emits a utility only when its token exists, so a missing
       declaration is not an error — it is a class that produces no CSS and sits
       in the component looking correct. That is the `ring-ring` bug this
       library already carries a build guard for, and it reaches ink tokens the
       same way. */
    expect(referenced.length).toBeGreaterThan(20);
    const undeclared = referenced.filter(
      (fill) => !INDEX.includes(`--color-${fill}-ink:`),
    );
    expect(undeclared, `no --color-*-ink declaration for: ${undeclared.join(", ")}`).toEqual([]);
  });

  it("gives each one a fallback the theme can actually resolve", () => {
    /* The shape has to stay `var(--roster-X-ink, var(--roster-Y, #hex))`: the
       outer name is the consumer's override point, the inner one is the default
       that renders untouched. Flattening it to a bare hex still emits CSS, so
       nothing else here would notice — but `resolve()` could no longer read the
       default, and the pair would vanish from this suite rather than fail. */
    const broken: string[] = [];
    for (const fill of referenced) {
      const m = INDEX.match(
        new RegExp(`--color-${fill}-ink:\\s*var\\(--roster-${fill}-ink,\\s*var\\(--roster-([a-z0-9-]+),`),
      );
      if (!m || token(m[1]) === null) broken.push(fill);
    }
    expect(broken, `malformed or unresolvable ink declarations: ${broken.join(", ")}`).toEqual([]);
  });
});

describe("solid fills meet WCAG AA", () => {
  it("has pairs to judge at all", () => {
    /* `it.each([])` passes. When solid variants moved from `text-white` to
       per-fill ink tokens, the class picker stopped resolving any foreground,
       every pair vanished, and this file went green while asserting nothing —
       44 checks to 0, silently. A floor makes that impossible to repeat. */
    /* An exact count. A floor of 40 against an actual 120 let either the hover
       half or the dark half be deleted silently — the same slack this file's
       own comment criticises three tests down. Four states per scheme, 30
       solid variants. */
    expect(PAIRS).toHaveLength(
      COMPONENTS.reduce((n, c) => n + c.expected * 4, 0),
    );
  });

  it("gives every state the ink belonging to its own fill", () => {
    /* The invariant the per-fill tokens exist to hold: whatever fill is painted
       in a given state, the foreground is that fill's ink. Contrast alone does
       not enforce it — a missing `hover:text-*` falls back to the resting ink,
       which measures fine today because the two defaults coincide, and breaks
       the moment a consumer sets one of them and not the other. */
    const wrong = PAIRS.filter((p) => p.fg !== `${p.bg}-ink`);
    expect(
      wrong.map((p) => `${p.component}/${p.scheme} ${p.mode} ${p.state}: bg-${p.bg} carries text-${p.fg}`),
    ).toEqual([]);
  });

  it("draws pairs from every registered component", () => {
    /* The count above can stay healthy while one component contributes nothing,
       which is how Checkbox went unmeasured for as long as it did. */
    const byComponent = Object.fromEntries(
      COMPONENTS.map((c) => [c.name, PAIRS.filter((p) => p.component === c.name).length]),
    );
    for (const [name, count] of Object.entries(byComponent)) {
      expect(count, `${name} contributed no pairs: ${JSON.stringify(byComponent)}`).toBeGreaterThan(0);
    }
    expect(byComponent).toMatchObject({ Checkbox: expect.any(Number) });
  });

  it("holds the checkbox tick to the non-text bar, not the text one", () => {
    /* If this ever reads 4.5 the tick is being judged as text, which it is not
       — and teal would fail on a technicality rather than a real problem. */
    /* Pinned to the literals, not to the constants. Comparing `bar === AA`
       passes trivially the moment someone lowers `AA` to 3, which is exactly
       the edit this is meant to stop. */
    expect(AA).toBe(4.5);
    expect(AA_NON_TEXT).toBe(3);
    const ticks = PAIRS.filter((p) => p.component === "Checkbox");
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.every((p) => p.bar === 3)).toBe(true);
    expect(PAIRS.filter((p) => p.component === "Button").every((p) => p.bar === 4.5)).toBe(true);
  });

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
    ).toEqual([]);
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
        `on bg-${pair.bg}, which measures ${ratio.toFixed(2)}:1, under the ${pair.bar}:1 ` +
        `this component has to clear. Move the fill away from the foreground, or set ` +
        `--roster-${pair.bg}-ink.`,
    ).toBeGreaterThanOrEqual(pair.bar);
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
