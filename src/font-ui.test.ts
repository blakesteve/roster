import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard for the `--roster-font-ui` rollout.
 *
 * Components used to declare no `font-family` at all, so every one of them
 * inherited whatever the host app had set on `body`. That is correct for a Card
 * wrapping someone else's prose and wrong for a Button, and the difference had
 * never been written down — so a consuming app with a serif body font rendered
 * serif badges, and the fix was a local hack in that app rather than here.
 *
 * The per-component tests cannot catch a regression here, because the failure
 * mode is a *new* component shipping with no font declaration at all. Nothing
 * asserts the absence of a class. So this test walks the source instead, and
 * the exemptions below have to be argued for in writing rather than acquired by
 * forgetting.
 */

const COMPONENTS_DIR = join(__dirname, "components");

/**
 * Components that inherit on purpose. Two reasons, and no third:
 *
 * - They render the host's own content, and that text is not Roster's to
 *   restyle. A Card is a box around someone else's page.
 * - They render no text at all, so a font-family would be inert.
 */
const INHERITS_ON_PURPOSE: Record<string, string> = {
  Card: "a container for host content; restyling it would override the page",
  Link: "sits inline inside host prose and must match its surroundings",
  Spinner: "renders no text",
};

/**
 * Components that set `font-mono` deliberately, as a design decision that
 * predates the token. The mono is the point in each case, so `font-ui` would be
 * a regression rather than a fix.
 */
const DELIBERATELY_MONO = [
  "Eyebrow",
  "InlineCode",
  "Stat",
  "DescriptionList",
  "MatchupCard",
  "Pullquote",
  "Countdown",
];

/**
 * Components whose root *is* another Roster component, so the token arrives by
 * inheritance. Listed explicitly rather than inferred, because the day one of
 * these grows its own wrapper element is the day it silently drops the font.
 */
const COVERED_BY_COMPOSITION: Record<string, string> = {
  ThemeToggle: "renders Button as its root",
  PasswordInput: "renders Input as its root",
  Combobox:
    "its trigger is Input's variants and its panel is the shared popup, so the token arrives from both",
  MultiSelect:
    "its trigger is Select's variants and its panel is the shared popup; the only markup it owns beyond those is chips, and Chip declares the token itself",
};

function componentDirs(): { name: string; dir: string }[] {
  return readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((tier) => tier.isDirectory())
    .flatMap((tier) => {
      const tierDir = join(COMPONENTS_DIR, tier.name);
      return readdirSync(tierDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({ name: entry.name, dir: join(tierDir, entry.name) }));
    });
}

function sourceOf(dir: string): string {
  return readdirSync(dir)
    .filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\./.test(f))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
}

describe("font-ui coverage", () => {
  const components = componentDirs();

  it("finds the component tree", () => {
    expect(components.length).toBeGreaterThan(30);
  });

  it.each(components)("$name declares a font family", ({ name, dir }) => {
    if (name in INHERITS_ON_PURPOSE || name in COVERED_BY_COMPOSITION) return;

    const src = sourceOf(dir);
    const declares =
      /rst:font-ui/.test(src) ||
      /rst:font-mono/.test(src) ||
      /font-\[family-name/.test(src);

    expect(
      declares,
      `${name} sets no font-family, so it will inherit the host app's body ` +
        `font. Add \`rst:font-ui\` to its root, or add it to one of the ` +
        `exemption lists in this file with a reason.`,
    ).toBe(true);
  });

  it.each(DELIBERATELY_MONO)("%s keeps its mono face", (name) => {
    const match = components.find((c) => c.name === name);
    expect(match, `${name} is listed as mono but no longer exists`).toBeDefined();
    expect(sourceOf(match!.dir)).toMatch(/rst:font-mono/);
  });

  it("exempts nothing that is not argued for", () => {
    // Every exemption carries a reason string. An empty one is a TODO wearing
    // a disguise.
    for (const reason of Object.values(INHERITS_ON_PURPOSE)) {
      expect(reason.length).toBeGreaterThan(10);
    }
    for (const reason of Object.values(COVERED_BY_COMPOSITION)) {
      expect(reason.length).toBeGreaterThan(10);
    }
  });
});

describe("font role tokens", () => {
  const css = readFileSync(join(__dirname, "index.css"), "utf8");

  it("is defined as a themeable custom property with a system fallback", () => {
    expect(css).toMatch(/--font-ui:\s*var\(\s*--roster-font-ui,/);
  });

  it("falls back to a sans stack, not a serif or mono one", () => {
    const decl = css.slice(css.indexOf("--font-ui:"));
    const fallback = decl.slice(0, decl.indexOf(");"));
    expect(fallback).toContain("ui-sans-serif");
    expect(fallback).not.toContain("ui-serif");
    expect(fallback).not.toContain("ui-monospace");
  });

  it("routes every font role through a --roster-* hook", () => {
    /* The invariant, rather than three hard-coded assertions: a fourth role
       added later must be themeable too. `font-mono` failed this for the life
       of the library — it resolved through `--rst-font-mono`, a Tailwind
       internal, so the components that opt into mono could not be retyped by a
       consuming app at all. */
    const theme = css.slice(css.indexOf("@theme inline"));
    /* Matches EVERY `--font-*` declaration, not only the ones already written
       as `var(...)`. A fourth role added the obvious way — `--font-serif:
       ui-serif, Georgia, serif;` — matched nothing under the narrower pattern,
       so the count stayed at three and the invariant passed while the new role
       was unthemeable. */
    const roles = [...theme.matchAll(/--font-([a-z]+):\s*([^;]+);/g)];

    expect(roles.length).toBeGreaterThanOrEqual(3);
    for (const [, role, value] of roles) {
      expect(
        value.replace(/\s+/g, " "),
        `--font-${role} must read var(--roster-font-${role}, <fallback>)`,
      ).toContain(`var( --roster-font-${role}, `.replace(/\s+/g, " "));
    }
  });

  it("keeps the mono fallback identical to Tailwind's own default", () => {
    /* Identity, in order, complete — not a containment check. Deleting the tail
       of the stack (`"Liberation Mono", "Courier New", monospace`) left a
       containment assertion green while dropping the generic `monospace`
       family, so an unthemed consumer on a machine without the five named
       faces would inherit `body` instead. This is the one invariant the whole
       "setting nothing changes nothing" claim rests on. */
    const decl = css.slice(css.indexOf("--font-mono:"));
    const fallback = decl
      .slice(decl.indexOf("--roster-font-mono,") + "--roster-font-mono,".length, decl.indexOf(");"))
      .split(",")
      .map((face) => face.trim())
      .filter(Boolean);

    expect(fallback).toEqual([
      "ui-monospace",
      "SFMono-Regular",
      "Menlo",
      "Monaco",
      "Consolas",
      '"Liberation Mono"',
      '"Courier New"',
      "monospace",
    ]);
  });

  it("defaults display to the UI stack, so setting nothing changes nothing", () => {
    const decl = css.slice(css.indexOf("--font-display:"));
    const fallback = decl.slice(0, decl.indexOf(");"));
    expect(fallback).toContain("ui-sans-serif");
    expect(fallback).not.toContain("ui-monospace");
  });
});
