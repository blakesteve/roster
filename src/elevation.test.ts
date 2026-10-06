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
 * The controls that carry a lift, and the file each is in. They used to be
 * exempt from the scale and keep a raw `shadow-sm` (the Switch thumb a bare
 * `shadow`, the same value); they now have their own level, `control`, so an
 * app can flatten or restyle them with one token, and the exemption is gone.
 */
const CONTROLS: Record<string, string[]> = {
  "button-variants.ts": ["solid", "outline"],
  "select-variants.ts": ["the trigger"],
  "avatar-variants.ts": ["the avatar"],
  "switch-variants.ts": ["the thumb"],
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
        "-anchored | -overlay, or rst:elevation-control on a control.",
    ).toEqual([]);
  });

  it("gives every control with a lift the control level", () => {
    /* The guard above proves no raw shadow is left. This proves the lift
       wasn't simply deleted along the way: each control still asks for one,
       and asks for the level an app can set. */
    const files = new Map(sourceFiles().map((file) => [file.name, file.path]));
    for (const [name, sites] of Object.entries(CONTROLS)) {
      const path = files.get(name);
      expect(path, `${name} no longer exists`).toBeDefined();
      const uses = readFileSync(path!, "utf8").split("rst:elevation-control").length - 1;
      expect(uses, `${name}: ${sites.join(", ")}`).toBe(sites.length);
    }
  });

  it("makes the control level a hook whose fallback is Tailwind's shadow-sm", () => {
    /* A hook, not a definition: same in both schemes, so an app's `:root`
       override has to hold in dark mode, which a Roster `.dark` rule would
       break. The fallback is `shadow-sm` as Tailwind 4 emits it, written
       here as the requirement: an app that sets nothing sees the shadow its
       controls had before. */
    const css = readFileSync(join(__dirname, "index.css"), "utf8");
    expect(css).not.toMatch(/--roster-elevation-control\s*:/);

    const utility = css.slice(css.indexOf("@utility elevation-control {"));
    const body = utility.slice(0, utility.indexOf("\n}")).replace(/\s+/g, " ");
    expect(body).toContain(
      "--tw-shadow: var( --roster-elevation-control, " +
        "0 1px 3px 0 var(--tw-shadow-color, #0000001a), " +
        "0 1px 2px -1px var(--tw-shadow-color, #0000001a) );",
    );
    /* Composed like the other levels, so a control's ring survives it: the
       Select trigger draws its edge as one. */
    expect(body).toContain("var(--tw-ring-shadow), var(--tw-shadow);");
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
