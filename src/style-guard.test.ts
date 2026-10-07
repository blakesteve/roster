import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Style rules a component must follow to theme with everything else, checked
 * on the components listed in GUARDED.
 *
 * Roster's tokens only reach a component that asks for them. A hex color, an
 * arbitrary radius, a raw shadow or a Tailwind palette name is a value no
 * token can move, so an app that retints or reshapes Roster finds that one
 * component ignoring it. These rules aren't enforced library-wide yet (older
 * components break some of them); a component joins GUARDED when it's new or
 * once it's been brought in line, and stays.
 */
const GUARDED = ["components/organisms/ModerationQueue", "components/molecules/MediaPreview"];

/* A class with any variants in front of it: `rst:dark:hover:`. */
const V = String.raw`rst:(?:[\w@[\]&=.()/-]+:)*`;

const RULES: { name: string; why: string; test: RegExp }[] = [
  { name: "hex color", why: "use a Roster ramp or a --roster-* token", test: /#[0-9a-fA-F]{3,8}\b/ },
  { name: "arbitrary radius", why: "use the radius scale, which reads --roster-radius-*", test: new RegExp(`${V}rounded(?:-[a-z]{1,2})?-\\[`) },
  { name: "bare rounded", why: "a literal 0.25rem no token reaches; use rounded-sm", test: new RegExp(`${V}rounded(?![-\\w])`) },
  { name: "literal shadow", why: "use an elevation-* level", test: new RegExp(`${V}(?:inset-)?shadow(?!-none\\b)(?:-[\\w[\\]/.%-]+)?(?![\\w-])`) },
  {
    name: "Tailwind palette name",
    why: "Roster's ramps only: primary, gray, error, success, info, amber, orange, teal, purple",
    test: new RegExp(
      `${V}(?:bg|text|border|ring|from|via|to|fill|stroke|outline|divide|placeholder|decoration|accent|caret)-(?:slate|zinc|neutral|stone|red|yellow|lime|green|emerald|cyan|sky|blue|indigo|violet|fuchsia|pink|rose)-\\d`,
    ),
  },
  { name: "Tooltip not themed", why: "Tooltip takes variant=\"themed\", the one that reads the tokens", test: /<Tooltip\b(?![^>]*\bvariant=["']themed["'])[^>]*>/ },
  { name: "font weight", why: "medium, semibold or bold only", test: new RegExp(`${V}font-(?:thin|extralight|light|normal|extrabold|black)\\b`) },
];

/* Comments explain the rules and may name what they forbid. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/.*$/gm, "$1");

function guardedFiles(): { path: string; source: string }[] {
  return GUARDED.flatMap((dir) => {
    const full = join(__dirname, dir);
    return readdirSync(full)
      .filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\./.test(f))
      .map((f) => ({ path: `${dir}/${f}`, source: code(readFileSync(join(full, f), "utf8")) }));
  });
}

/* The fixtures spell Roster's prefix in capitals and lower it at runtime, so
   Tailwind, which scans this file too, never sees a class to emit. */
const lower = (s: string) => s.replaceAll("RST:", "rst:");
const FIXTURES: Record<string, { bad: string; good: string }> = {
  "hex color": { bad: `style={{ color: "#c8553d" }}`, good: `className="RST:text-error-600"` },
  "arbitrary radius": { bad: `className="RST:rounded-[3px]"`, good: `className="RST:rounded-md"` },
  "bare rounded": { bad: `className="RST:p-1 RST:rounded RST:border"`, good: `className="RST:p-1 RST:rounded-sm RST:border"` },
  "literal shadow": { bad: `className="RST:hover:shadow-lg"`, good: `className="RST:elevation-raised RST:shadow-none"` },
  "Tailwind palette name": { bad: `className="RST:dark:bg-slate-900"`, good: `className="RST:dark:bg-gray-900"` },
  "Tooltip not themed": { bad: `<Tooltip content="Why" variant="dark">`, good: `<Tooltip content="Why" variant="themed">` },
  "font weight": { bad: `className="RST:font-light"`, good: `className="RST:font-semibold"` },
};

describe("style guard", () => {
  it("covers the files it's meant to", () => {
    /* A guard that matches no files passes everything. */
    expect(guardedFiles().map((f) => f.path)).toEqual([
      "components/organisms/ModerationQueue/ModerationQueue.tsx",
      "components/organisms/ModerationQueue/QueueEditDialog.tsx",
      "components/organisms/ModerationQueue/QueueEditSheet.tsx",
      "components/organisms/ModerationQueue/queue-actions.ts",
      "components/molecules/MediaPreview/MediaPreview.tsx",
    ]);
  });

  it.each(RULES.map((r) => [r.name, r] as const))("catches a %s, and passes its twin", (name, rule) => {
    expect(rule.test.test(lower(FIXTURES[name].bad)), `${name}: the failing fixture`).toBe(true);
    expect(rule.test.test(lower(FIXTURES[name].good)), `${name}: the passing twin`).toBe(false);
  });

  it("finds nothing in the guarded components", () => {
    const offenders: string[] = [];
    for (const file of guardedFiles()) {
      for (const rule of RULES) {
        const hit = file.source.match(new RegExp(rule.test.source, rule.test.flags + "g"));
        if (hit) offenders.push(`${file.path}: ${rule.name} (${[...new Set(hit)].join(", ")}): ${rule.why}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
