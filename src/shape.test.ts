import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard for the shape tokens: corner radius, edge width and the backdrop.
 *
 * Before them, color and surfaces were tokens and shape was not, so an app
 * that wanted square corners or heavier keylines patched every call site. The
 * failure this guards against is drift back to that: a component that reaches
 * for a literal corner or a literal 1px edge, which no token then reaches, and
 * which an app finds only by setting the token and seeing one control ignore
 * it.
 *
 * Every default below is written as the requirement, not read from the file
 * under test: the value each utility had before the token existed, so an app
 * that sets nothing renders as it did. The Chromium side, that each site
 * really follows its token, is `src/shape.checks.stories.tsx`.
 */

const SRC = __dirname;
const css = readFileSync(join(SRC, "index.css"), "utf8");

/* The `@theme inline { … }` block, where a theme key becomes a utility. */
const theme = (() => {
  const start = css.indexOf("@theme inline {");
  return css.slice(start, css.indexOf("\n}", start));
})();

/* Library source: no tests, no stories, which ship nothing to an app. */
function sourceFiles(): { name: string; path: string; text: string }[] {
  const out: { name: string; path: string; text: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.|\.stories\./.test(entry.name)) {
        out.push({ name: entry.name, path, text: readFileSync(path, "utf8") });
      }
    }
  };
  walk(SRC);
  return out;
}

/* Every `rst:` class in source matching `pattern` (after any variants), as
   `file: class` so a failure names the site. */
function classesMatching(pattern: RegExp): string[] {
  const found: string[] = [];
  for (const file of sourceFiles()) {
    for (const match of file.text.matchAll(/rst:(?:[\w@[\]&=.()/-]+:)*([\w[\]().%,/#-]+)/g)) {
      if (pattern.test(match[1])) found.push(`${file.name}: ${match[0]}`);
    }
  }
  return found;
}

describe("radius tokens", () => {
  it.each([
    ["sm", "0.25rem"],
    ["md", "0.375rem"],
    ["lg", "0.5rem"],
    ["xl", "0.75rem"],
    ["2xl", "1rem"],
    ["3xl", "1.5rem"],
  ])("rounded-%s reads --roster-radius-%s, defaulting to %s", (step, fallback) => {
    expect(theme).toContain(`--radius-${step}: var(--roster-radius-${step}, ${fallback});`);
    /* A hook: Roster never sets it, so a `:root` override holds in dark mode. */
    expect(css).not.toMatch(new RegExp(`--roster-radius-${step}\\s*:`));
  });

  it("leaves no corner the tokens can't reach", () => {
    /* Bare `rounded` is a literal 0.25rem that no token reads. Six controls
       carried it (Button `xs`, Toast's close, Checkbox `md`, InlineCode,
       Alert's dismiss, PasswordInput's toggle), so squaring an app's corners
       left exactly those round. An arbitrary radius is the same hole. */
    expect(classesMatching(/^rounded(?:-[trblse]{1,2})?(?:-\[.*\])?$/)).toEqual([]);
  });
});

describe("border width token", () => {
  it("drives every bare border and ring, defaulting to 1px", () => {
    /* Tailwind reads `--default-border-width` for `border` and its sides and
       for `divide-*`, and `--default-ring-width` for a bare `ring`. */
    expect(theme).toContain("--default-border-width: var(--roster-border-width, 1px);");
    expect(theme).toContain("--default-ring-width: var(--roster-border-width, 1px);");
    expect(css).not.toMatch(/--roster-border-width\s*:/);
  });

  it("leaves no 1px edge the token can't reach", () => {
    /* `ring-1` is how Select's trigger and the anchored panels draw their
       edge; a 1px border written as a number or an arbitrary value is the
       same literal, and so is a rule drawn as a 1px box, which Accordion and
       LabeledDivider used. Edges that are deliberately other widths
       (`border-2`, `border-t-4`, `ring-2` for focus) aren't 1px and aren't
       caught. */
    expect(
      classesMatching(/^(?:ring-1|ring-\[1px\]|border(?:-[xytrblse])?-(?:1|\[1px\])|[hw]-(?:px|\[1px\]))$/),
    ).toEqual([]);
  });
});

describe("backdrop tokens", () => {
  const dialog = readFileSync(join(SRC, "components/organisms/Dialog/Dialog.tsx"), "utf8");
  const sheet = readFileSync(join(SRC, "components/organisms/Sheet/Sheet.tsx"), "utf8");

  it("blurs Dialog's backdrop by --roster-backdrop-blur, defaulting to 8px", () => {
    expect(theme).toContain("--blur-backdrop: var(--roster-backdrop-blur, 8px);");
    expect(dialog).toContain("rst:backdrop-blur-backdrop");
    expect(dialog).not.toMatch(/rst:(?:[\w-]+:)*backdrop-blur-sm\b/);
  });

  it("gives Dialog and Sheet one scrim, --roster-backdrop, each with its own default", () => {
    /* Both of Dialog's backdrops, in both schemes, read the token: four
       classes, light and dark for the default and for `glass`. */
    expect(dialog.split("rst:bg-[var(--roster-backdrop,").length - 1).toBe(2);
    expect(dialog.split("rst:dark:bg-[var(--roster-backdrop,").length - 1).toBe(2);
    /* The defaults are Dialog's own, as before: slate-900 at 60% and 40% in
       light, Roster's black at 80% and 60% in dark. */
    for (const fallback of [
      "color-mix(in_oklab,oklch(20.8%_0.042_265.755)_60%,transparent)",
      "color-mix(in_oklab,oklch(20.8%_0.042_265.755)_40%,transparent)",
      "color-mix(in_oklab,var(--roster-black,#1e1c1a)_80%,transparent)",
      "color-mix(in_oklab,var(--roster-black,#1e1c1a)_60%,transparent)",
    ]) {
      expect(dialog).toContain(`[var(--roster-backdrop,${fallback})]`);
    }
    /* Sheet falls back to its older token, which keeps that name working. */
    expect(sheet).toContain("rst:bg-[var(--roster-backdrop,var(--roster-sheet-backdrop))]");
  });

  it("keeps --roster-sheet-backdrop defined in both schemes", () => {
    /* It's Sheet's default now, so it has to stay defined: undefined, Sheet's
       scrim would be transparent for every app that sets neither name. */
    const root = css.slice(css.lastIndexOf(":root {", css.indexOf("--roster-sheet-enter-duration:")));
    expect(root.slice(0, root.indexOf("}"))).toContain("--roster-sheet-backdrop: rgb(15 23 42 / 0.6);");
    const dark = root.slice(root.indexOf(".dark {"));
    expect(dark.slice(0, dark.indexOf("}"))).toContain("--roster-sheet-backdrop: rgb(0 0 0 / 0.8);");
    expect(css).not.toMatch(/--roster-backdrop\s*:/);
  });
});
