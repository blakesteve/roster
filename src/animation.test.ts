import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The hand-rolled animation and scrollbar utilities.
 *
 * `Tooltip` referenced `animate-in`, `fade-in-0`, `zoom-in-95` and four
 * `slide-in-from-*` classes — all from `tailwindcss-animate`, a plugin this
 * library has never depended on. Seven classes emitted nothing, so every
 * tooltip appeared with no transition. Countdown had the same shape of problem
 * from the other direction: `via-accent-600` against a `--color-accent` that
 * does not exist, so its gradient ran from a color to itself.
 *
 * `scripts/check-classes-emit.mjs` proves these classes emit CSS, which is the
 * thing that was broken. It cannot check that the CSS does anything. That is
 * this file's job, and the first version of it was bad at it: an audit found
 * that deleting the `animation:` line from `animate-in` outright — restoring
 * the original bug — passed all eighteen assertions and both build guards. The
 * keyframes were checked, the modifier variables were checked, and the one line
 * connecting them was not.
 *
 * So: assert the shorthand, read blocks by matching braces rather than by
 * slicing to the first `}`, and parse keyframe offsets rather than only the
 * values inside them.
 */

const CSS = readFileSync(join(__dirname, "index.css"), "utf8");

/**
 * The body of a CSS block, found by matching braces.
 *
 * `slice(0, indexOf("}"))` was the previous idiom and it truncated at the first
 * closing brace, which is wrong for any block containing a nested one — the
 * scrollbar utility has three. Worse, when the header was missing, `indexOf`
 * returned -1, `slice(-1)` yielded the file's last character, and assertions
 * failed against an empty string with a message describing the wrong problem.
 * Missing headers throw here instead.
 */
function block(header: string): string {
  const start = CSS.indexOf(header);
  if (start === -1) throw new Error(`index.css has no "${header}"`);
  const open = CSS.indexOf("{", start);
  if (open === -1) throw new Error(`"${header}" has no block`);

  let depth = 0;
  for (let i = open; i < CSS.length; i += 1) {
    if (CSS[i] === "{") depth += 1;
    else if (CSS[i] === "}") {
      depth -= 1;
      if (depth === 0) return CSS.slice(open + 1, i);
    }
  }
  throw new Error(`"${header}" is never closed`);
}

const utility = (name: string) => block(`@utility ${name} {`);

/** Brace-matched body of the block whose header starts at `index`. */
function blockAt(index: number): string {
  const open = CSS.indexOf("{", index);
  let depth = 0;
  for (let i = open; i < CSS.length; i += 1) {
    if (CSS[i] === "{") depth += 1;
    else if (CSS[i] === "}") {
      depth -= 1;
      if (depth === 0) return CSS.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated block at ${index}`);
}

/**
 * Whether a `:root` or `.dark` block anywhere in the stylesheet defines a token.
 *
 * Scans every block with that selector rather than anchoring on nearby text. An
 * earlier version located the dark scope by searching for a comment that
 * happened to sit near it, and matched a different `.dark` block entirely — the
 * kind of brittleness that makes a test report the wrong thing rather than fail
 * honestly.
 */
function definedIn(selector: ":root" | ".dark", token: string): boolean {
  const needle = `${selector} {`;
  let from = 0;
  for (;;) {
    const at = CSS.indexOf(needle, from);
    if (at === -1) return false;
    if (blockAt(at).includes(token)) return true;
    from = at + needle.length;
  }
}

/** One declaration's value, anchored so a longer value cannot pass as a prefix. */
function declaration(body: string, property: string): string | null {
  const match = body.match(new RegExp(`(?:^|[;{\\s])${property}:\\s*([^;]+);`));
  return match ? match[1].trim() : null;
}

/** The `animation` shorthand, split into the parts worth asserting. */
function animation(name: string) {
  const value = declaration(utility(name), "animation");
  if (value === null) {
    throw new Error(
      `@utility ${name} sets no \`animation\`. The keyframes and the modifier ` +
        `variables can both be perfect and nothing will move.`,
    );
  }
  return {
    value,
    /* The first token is the keyframe name in every form this file uses. */
    keyframe: value.split(/\s+/)[0],
    seconds:
      Number.parseFloat(
        (value.match(/(?:^|[\s,(])(\d*\.?\d+)m?s\b/) ?? [])[1] ?? "NaN",
      ) * (/\d\s*ms\b/.test(value) ? 0.001 : 1),
    infinite: /\binfinite\b/.test(value),
    timing: value.includes("steps(") ? "steps" : "smooth",
  };
}

describe("the animation shorthands", () => {
  /*
   * These are the assertions whose absence let the original bug back in. Every
   * one of them corresponds to a mutation that previously passed the suite.
   */
  it.each(["animate-in", "animate-shimmer"])(
    "%s actually declares an animation",
    (name) => {
      expect(() => animation(name)).not.toThrow();
    },
  );

  it.each(["animate-in", "animate-shimmer"])(
    "%s names a keyframe that exists",
    (name) => {
      const { keyframe } = animation(name);
      expect(
        CSS,
        `@utility ${name} animates "${keyframe}", which is not defined anywhere`,
      ).toContain(`@keyframes ${keyframe}`);
    },
  );

  it.each(["animate-in", "animate-shimmer"])(
    "%s runs for a visible duration",
    (name) => {
      const { seconds } = animation(name);
      expect(seconds).toBeGreaterThan(0.05);
      expect(seconds).toBeLessThan(10);
    },
  );

  it("the entrance plays once and the shimmer repeats", () => {
    expect(animation("animate-in").infinite, "an entrance that loops").toBe(
      false,
    );
    expect(
      animation("animate-shimmer").infinite,
      "a shimmer that runs once",
    ).toBe(true);
  });

  it("the shimmer interpolates rather than stepping", () => {
    /* `steps()` would teleport the highlight instead of sweeping it. */
    expect(animation("animate-shimmer").timing).toBe("smooth");
  });
});

describe("the entrance animation", () => {
  it("has one keyframe that reads every property the modifiers set", () => {
    /* Three separate animations would fight over `transform`; the last declared
       would win and the other two would silently do nothing. A single keyframe
       reading four variables is what lets `fade-in-0 zoom-in-95
       slide-in-from-top-2` compose. */
    const from = block("@keyframes rst-enter");
    for (const property of [
      "--rst-enter-opacity",
      "--rst-enter-scale",
      "--rst-enter-translate-x",
      "--rst-enter-translate-y",
    ]) {
      expect(
        from,
        `rst-enter never reads ${property}, so whichever modifier sets it does nothing`,
      ).toContain(property);
    }
  });

  it("has no explicit `to`, so the animation lands on the element's own styles", () => {
    /* A `to` mirroring `from` makes the whole thing a no-op, and the previous
       version of this file could not see past the `from` block to notice. */
    const keyframe = block("@keyframes rst-enter");
    expect(keyframe).not.toMatch(/(?:^|\s)(?:to|100%)\s*\{/);
  });

  it("defaults every unset property to a no-op", () => {
    /* `fade-in-0` alone must not also translate or scale. The fallbacks in the
       keyframe are what make each modifier independent. */
    const from = block("@keyframes rst-enter");
    expect(from).toMatch(/--rst-enter-opacity,\s*1\)/);
    expect(from).toMatch(/--rst-enter-scale,\s*1\)/);
    expect(from).toMatch(/--rst-enter-translate-x,\s*0\)/);
    expect(from).toMatch(/--rst-enter-translate-y,\s*0\)/);
  });

  it.each([
    ["fade-in-0", "--rst-enter-opacity", "0"],
    ["zoom-in-95", "--rst-enter-scale", "0.95"],
    ["slide-in-from-top-2", "--rst-enter-translate-y", "-0.5rem"],
    ["slide-in-from-bottom-2", "--rst-enter-translate-y", "0.5rem"],
    ["slide-in-from-left-2", "--rst-enter-translate-x", "-0.5rem"],
    ["slide-in-from-right-2", "--rst-enter-translate-x", "0.5rem"],
  ])("%s sets %s to exactly %s", (name, property, value) => {
    /* Exact, not `toContain`: `0.9599` contains `0.95`, and `0.9` contains `0`,
       so prefix matching let a modifier drift to a different value silently. */
    expect(declaration(utility(name), property)).toBe(value);
  });

  it("slides in from the opposite side to the one it is anchored on", () => {
    /* A tooltip above its trigger should rise from below. Getting this backwards
       is invisible in a screenshot and obvious in motion. */
    const tooltip = readFileSync(
      join(__dirname, "components/atoms/Tooltip/Tooltip.tsx"),
      "utf8",
    );
    expect(tooltip).toContain("data-[side=top]:slide-in-from-bottom-2");
    expect(tooltip).toContain("data-[side=bottom]:slide-in-from-top-2");
    expect(tooltip).toContain("data-[side=left]:slide-in-from-right-2");
    expect(tooltip).toContain("data-[side=right]:slide-in-from-left-2");
  });
});

/**
 * Keyframe steps as `{ offset, x }`, with the count checked against the number
 * of declarations found.
 *
 * The previous parser matched only `background-position: <number>%` and dropped
 * anything else on the floor — an axis-swapped `center 100%` or a value in `px`
 * simply vanished from the array, and the range assertion then looped over
 * nothing and passed. Requiring the counts to agree turns a value this cannot
 * read into a failure rather than a silent omission.
 */
function shimmerSteps(): { offset: number; x: number }[] {
  const body = block("@keyframes rst-shimmer");
  const declared = (body.match(/background-position\s*:/g) ?? []).length;

  const steps: { offset: number; x: number }[] = [];
  for (const match of body.matchAll(
    /(\d+)%\s*\{[^}]*background-position:\s*(-?[\d.]+)%\s+center\s*;?[^}]*\}/g,
  )) {
    steps.push({ offset: Number(match[1]), x: Number(match[2]) });
  }

  expect(
    steps.length,
    `parsed ${steps.length} of ${declared} background-position declarations. ` +
      `An unreadable value — the wrong axis, or a unit other than %, or a ` +
      `keyword — would otherwise disappear from every assertion below.`,
  ).toBe(declared);

  return steps;
}

describe("the shimmer", () => {
  it("sweeps left to right", () => {
    /* Direction was previously unasserted: reversing the keyframe contradicted
       the comment block and passed. */
    const steps = shimmerSteps();
    expect(steps[0].x).toBe(100);
    expect(steps[1].x).toBe(0);
  });

  it("stays inside the range where the gradient still covers the glyphs", () => {
    /* `background-clip: text` with transparent glyphs means uncovered is
       invisible. An image wider than the box covers it for positions in 0-100%
       and not outside it, so a sweep that overshoots makes the digits disappear
       at the ends. */
    for (const { offset, x } of shimmerSteps()) {
      expect(
        x,
        `${offset}% puts the image at ${x}%, off the glyphs`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        x,
        `${offset}% puts the image at ${x}%, off the glyphs`,
      ).toBeLessThanOrEqual(100);
    }
  });

  it("rests for a meaningful part of the cycle, with the highlight out of frame", () => {
    /* The hold is the pause between passes. Its length was unasserted, so it
       could shrink to nothing while the test still saw "two equal stops". */
    const steps = shimmerSteps();
    const [last, secondLast] = [steps.at(-1)!, steps.at(-2)!];
    expect(last.x, "no hold: the sweep restarts the instant it finishes").toBe(
      secondLast.x,
    );
    expect([0, 100]).toContain(last.x);
    expect(
      last.offset - secondLast.offset,
      "the rest is too short to read as a pause",
    ).toBeGreaterThanOrEqual(20);
  });

  it("is wide enough that the sweep travels", () => {
    const size = declaration(utility("animate-shimmer"), "background-size");
    expect(size).not.toBeNull();
    /* index.css ships 260%; the coverage arithmetic holds for anything over
       100%, but barely over 100% would satisfy a `> 100` check while moving
       almost nothing. */
    expect(Number.parseFloat(size!)).toBeGreaterThanOrEqual(200);
  });

  it("does not tile, or the next pass leaks in behind the current one", () => {
    /* `background-repeat` defaults to `repeat`. With an image wider than its box
       and a moving position, the adjacent tile's highlight slides into view from
       the opposite edge — visible as a flicker just before each reset. */
    expect(declaration(utility("animate-shimmer"), "background-repeat")).toBe(
      "no-repeat",
    );
  });

  it("moves a highlight across a base rather than between two colors", () => {
    const stops = [
      ...utility("animate-shimmer").matchAll(
        /var\(--roster-shimmer-(base|highlight)\)/g,
      ),
    ].map((m) => m[1]);
    expect(stops).toEqual(["base", "highlight", "base"]);
  });

  it("defines its colors in both themes", () => {
    /* Without the `.dark` pair, dark mode renders a `primary-700` base on a
       near-black ground: digits that are effectively invisible, with every other
       assertion here still passing. */
    for (const token of [
      "--roster-shimmer-base",
      "--roster-shimmer-highlight",
    ]) {
      expect(
        definedIn(":root", token),
        `${token} is never set for light mode`,
      ).toBe(true);
      expect(
        definedIn(".dark", token),
        `${token} is never set for dark mode`,
      ).toBe(true);
    }
  });

  it("no longer reaches for a color the theme never defined", () => {
    const countdown = readFileSync(
      join(__dirname, "components/organisms/Countdown/countdown-variants.ts"),
      "utf8",
    );
    expect(countdown).toContain("rst:animate-shimmer");
    expect(countdown).not.toContain("via-accent");
    expect(countdown).not.toContain("animate-pulse");
  });
});

describe("the scrollbar", () => {
  it("carries the standard properties, plus the legacy branch behind them", () => {
    /* Every current engine honors `scrollbar-width` / `scrollbar-color`, so the
       standard pair is what actually runs. The WebKit pseudo-elements are the
       fallback for Safari 18.1 and older and Chromium 120 and older, which a
       supporting browser discards outright once either standard property is set
       — the two never fight. Drop the standard pair and the utility is dead
       everywhere current, which is the shape of the original defect. */
    const body = utility("custom-scrollbar");
    expect(declaration(body, "scrollbar-width")).toBe("thin");
    expect(body).toContain("scrollbar-color");
    expect(body).toContain("::-webkit-scrollbar-thumb");
  });

  it("reads the same tokens from both mechanisms", () => {
    /* Two mechanisms diverging is how a themed scrollbar ends up themed in one
       browser and not another. */
    const body = utility("custom-scrollbar");
    const uses = (body.match(/--roster-scrollbar-thumb/g) ?? []).length;
    expect(
      uses,
      "the WebKit branch and the standard branch disagree",
    ).toBeGreaterThanOrEqual(2);
  });

  it("defines its colors in both themes", () => {
    /* The story's own docs warn that a `:root`-only override is discarded in
       dark mode. Roster should not make that mistake itself. */
    expect(definedIn(":root", "--roster-scrollbar-thumb")).toBe(true);
    expect(definedIn(".dark", "--roster-scrollbar-thumb")).toBe(true);
  });

  it("is still applied to Textarea", () => {
    const textarea = readFileSync(
      join(__dirname, "components/atoms/Textarea/textarea-variants.ts"),
      "utf8",
    );
    expect(textarea).toContain("rst:custom-scrollbar");
  });
});

describe("motion preferences", () => {
  /** The reduced-motion block that mentions a given utility. */
  function reducedBlockFor(utilityName: string): string {
    for (const match of CSS.matchAll(
      /@media \(prefers-reduced-motion: reduce\)/g,
    )) {
      const body = blockAt(match.index!);
      if (body.includes(utilityName)) return body;
    }
    throw new Error(`no prefers-reduced-motion block mentions ${utilityName}`);
  }

  it.each(["animate-in", "animate-shimmer"])(
    "%s stops for reduced motion",
    (name) => {
      /* Previously this joined every reduced-motion block into one string and
       asserted the name and `animation: none` independently — so one block
       supplying the name and a different block supplying `animation: none`
       satisfied both, while the named utility ignored the preference entirely. */
      const body = reducedBlockFor(name);
      expect(
        body,
        `the block naming ${name} never sets \`animation: none\``,
      ).toMatch(/animation:\s*none/);
    },
  );

  it("leaves the shimmer flat rather than parking its highlight", () => {
    /*
     * This asserted the opposite once, and it was wrong.
     *
     * Parking the highlight at 50% kept some of the gradient's lift, but
     * `primary-300` measures 1.72:1 on white — under the 3:1 floor for text this
     * size — so it pinned a permanently unreadable band across the middle of the
     * numerals, for the users least likely to want visual noise. With no
     * override the digits fall back to flat `primary-700` at 10.92:1.
     */
    const body = reducedBlockFor("animate-shimmer");
    expect(
      body,
      "a parked highlight is a permanent low-contrast band, not a feature",
    ).not.toContain("background-position");
  });

  it.each([
    ["--roster-shimmer-base", 3],
    ["--roster-shimmer-highlight", 0],
  ])("%s is readable enough for its role", (tokenName, floor) => {
    /*
     * The base carries the digits and has to clear the large-text floor on its
     * own, because that is what renders whenever the sweep is elsewhere — and
     * all of the time under reduced motion. The highlight is deliberately
     * exempt: it is a moving specular pass, on screen for a fraction of a second
     * per glyph, and holding it to 3:1 would flatten the effect entirely.
     */
    if (floor === 0) return;
    const tokens = readFileSync(join(__dirname, "tokens.css"), "utf8");
    const hex = (name: string) =>
      (tokens.match(new RegExp(`--roster-${name}:\\s*(#[0-9a-fA-F]{6})`)) ??
        [])[1];

    const scoped = block(
      CSS.slice(CSS.indexOf(":root {", CSS.indexOf("Shimmer"))),
    );
    const family = scoped.match(
      new RegExp(`${tokenName}:\\s*var\\(--roster-([\\w-]+)`),
    );
    expect(
      family,
      `${tokenName} is not defined in the light scope`,
    ).not.toBeNull();

    const channel = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const lum = (h: string) =>
      0.2126 * channel(parseInt(h.slice(1, 3), 16)) +
      0.7152 * channel(parseInt(h.slice(3, 5), 16)) +
      0.0722 * channel(parseInt(h.slice(5, 7), 16));
    const colour = hex(family![1])!;
    const white = hex("white")!;
    const [hi, lo] = [lum(colour), lum(white)].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);

    expect(
      ratio,
      `${tokenName} resolves to ${family![1]} (${colour}), ${ratio.toFixed(2)}:1 on white`,
    ).toBeGreaterThanOrEqual(floor);
  });
});
