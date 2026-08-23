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

describe("font-ui token", () => {
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
});
