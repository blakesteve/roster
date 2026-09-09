import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard for the elevation scale.
 *
 * Before it existed, sixteen call sites reached for whatever Tailwind shadow the
 * author had in mind that day: `Dialog` carried `shadow-xl` AND `shadow-2xl`,
 * `Toast` carried `shadow-lg` AND `shadow-2xl`, and `Avatar` used `shadow-sm`
 * in its variants while its popover used `shadow-xl`. Four steps, no rule.
 *
 * The failure mode this catches is drift back to that: a new surface, or a new
 * variant of an old one, quietly reaching for `shadow-lg` again. The scale is
 * only worth having if it is the only way depth gets expressed.
 */

/* All of `src`, not just `components`. `src/internal/popup.ts` is the panel
   behind Select, Combobox and MultiSelect — the single most-shared surface in
   the library, the one the exemption list points at, and the one this guard
   could not see. */
const SRC = __dirname;

/**
 * Controls may carry a bare shadow, because the scale is about surfaces that
 * hold content and a control is not one. Each entry has to be argued for in
 * writing rather than acquired by forgetting.
 */
const CONTROLS_MAY_KEEP_A_HAIRLINE: Record<string, string> = {
  "button-variants.ts": "a button is a control, not a surface it sits on",
  "avatar-variants.ts": "the ring around an image, not a container",
  "select-variants.ts": "the trigger is a control; its PANEL is anchored",
  "switch-variants.ts":
    "the thumb is a moving control part, and its bare `shadow` is what lifts " +
    "it off the track rather than off the page",
};

function sourceFiles(): { name: string; path: string }[] {
  const out: { name: string; path: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (
        /\.(ts|tsx)$/.test(entry.name) &&
        !/\.test\.|\.stories\./.test(entry.name)
      ) {
        out.push({ name: entry.name, path });
      }
    }
  };
  walk(SRC);
  return out;
}

describe("elevation scale", () => {
  it("is the only way a surface expresses depth", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      if (file.name in CONTROLS_MAY_KEEP_A_HAIRLINE) continue;
      const source = readFileSync(file.path, "utf8");
      /* An optional variant prefix, and arbitrary values. Without the prefix
         group, `rst:dark:shadow-black/50` sailed past — and two of those were
         live in the library while this test was green.

         `(?:…:)*` so STACKED variants are caught — `rst:dark:hover:shadow-lg`
         slipped past a single-segment pattern, and stacked variants are an
         established idiom in this repo. The trailing group is optional so bare
         `rst:shadow` is caught too, and `inset-shadow-*` and `drop-shadow-*`
         count as depth just as much as `shadow-*` does.

         Everything except `shadow-none` counts, colors included. A
         `shadow-<color>` on an elevated surface is DEAD: the levels carry
         their own color and never read `--tw-shadow-color`, so
         `rst:dark:shadow-black/50` on Card and Dialog was doing nothing while
         this suite was green.

         `shadow-none` is deliberately allowed. It sets no depth, so it cannot
         drift into ad-hoc depth — it is a surface saying it has none, which
         `ActionBar`'s flat variant legitimately does. */
      const raw = source.match(
        /rst:(?:[\w@[\]./-]+:)*(?:inset-)?shadow(?!-none\b)(?:-[\w[\]/.%-]+)?/g,
      );
      if (raw) offenders.push(`${file.name}: ${[...new Set(raw)].join(", ")}`);
    }

    expect(
      offenders,
      "these reach for a raw Tailwind shadow instead of rst:elevation-raised | " +
        "-anchored | -overlay. If the component is genuinely a control rather " +
        "than a surface, add it to CONTROLS_MAY_KEEP_A_HAIRLINE with a reason.",
    ).toEqual([]);
  });

  it("keeps every exemption pointing at a file that still exists", () => {
    /* Asserting the reason strings are long enough only restated three
       literals declared forty lines above, which could not fail. What can
       actually rot is an exemption outliving its file. */
    const names = new Set(sourceFiles().map((file) => file.name));
    for (const [file, reason] of Object.entries(CONTROLS_MAY_KEEP_A_HAIRLINE)) {
      expect(names.has(file), `${file} is exempted but no longer exists`).toBe(
        true,
      );
      expect(reason.length, `${file} needs a real reason`).toBeGreaterThan(20);
    }
  });

  it("defines all three levels in both schemes", () => {
    /* A level defined only at `:root` renders the light shadow on a dark page,
       where it is invisible — the same trap the popover family documents. */
    const css = readFileSync(join(__dirname, "index.css"), "utf8");
    const root = css.slice(css.indexOf("--roster-elevation-raised"));
    const dark = css.slice(css.indexOf(".dark {", css.indexOf("--roster-elevation-raised")));

    for (const level of ["raised", "anchored", "overlay"]) {
      expect(root).toContain(`--roster-elevation-${level}:`);
      expect(
        dark.slice(0, dark.indexOf("}")),
        `--roster-elevation-${level} must be redefined under .dark`,
      ).toContain(`--roster-elevation-${level}:`);
    }
  });

  it("gives the shadow-only levels an edge in forced-colors mode", () => {
    /* Forced-colors drops `box-shadow`. `anchored` surfaces draw their border
       as `ring-1`, which IS a box-shadow — so without an outline
       they lose their depth AND their edge at the same time and become
       unbordered rectangles on the content behind them.

       `raised` and `overlay` are exempt because every surface at those levels
       has a real border. */
    const css = readFileSync(join(__dirname, "index.css"), "utf8");

    const anchored = css.slice(css.indexOf("@utility elevation-anchored {"));
    const body = anchored.slice(0, anchored.indexOf("\n}"));
    expect(body, "elevation-anchored needs a forced-colors edge").toContain(
      "forced-colors: active",
    );
    expect(body).toContain("outline:");

    /* And it has to survive `:focus`, because those panels are focused for as
       long as they are open and `focus:outline-hidden` outranks a single-class
       utility. */
    expect(css).toContain(".rst\\:elevation-anchored:focus");

    /* `raised` and `overlay` are exempt: every surface at those levels draws a
       real border, so an outline would paint a second edge. */
    for (const level of ["raised", "overlay"]) {
      const utility = css.slice(css.indexOf(`@utility elevation-${level} {`));
      const levelBody = utility.slice(0, utility.indexOf("\n}"));
      expect(
        levelBody,
        `elevation-${level} surfaces have real borders; no outline needed`,
      ).not.toContain("forced-colors");
    }
  });
});
