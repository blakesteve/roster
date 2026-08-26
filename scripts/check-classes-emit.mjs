/**
 * Fails the build if a component asks for a utility Tailwind never emitted.
 *
 * Tailwind v4 generates utilities from theme tokens, so a class naming a token
 * that does not exist is not an error — it simply produces no CSS. The class
 * sits in the component's `className` looking correct, and does nothing.
 *
 * Roster shipped exactly that for a long time. `Button` asked for
 * `rst:focus-visible:ring-ring` and `rst:ring-offset-background`, and neither
 * `--color-ring` nor `--color-background` was ever defined. Both
 * utilities emitted zero rules, so the ring fell back to
 * `var(--tw-ring-color, currentcolor)` — the focus ring became the text color,
 * which on a solid Button with white text drew a white ring on a white page.
 * An invisible focus indicator, on the most-used control in the library,
 * across six of the eight color schemes — solid teal and amber carry dark text,
 * so their fallback rings were near-black rather than invisible.
 *
 * Nothing caught it. Typecheck cannot see a class name, the unit tests assert
 * that the class is *present* rather than that it does anything, and Storybook
 * looked fine because a missing ring is not a visible defect — it is a missing
 * one.
 *
 * So the check has to compare what the components reference against what the
 * build actually produced. Same reasoning as check-prefix.mjs: the bug only
 * exists in the artifact, so the artifact is where to look.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const CSS = "dist/roster.css";
const SRC_DIRS = ["src"];

if (!existsSync(CSS)) {
  console.error(`[check-classes-emit] ${CSS} not found — run the build first.`);
  process.exit(1);
}

const css = readFileSync(CSS, "utf8");

/**
 * Classes that legitimately produce no CSS of their own.
 *
 * `group` and `peer` are markers Tailwind reads from a parent; `dark` is the
 * consuming document's theme class. None of them emit a rule, and none should.
 * `sr-only` was listed here once and does not belong — it emits a real rule, so
 * exempting it would have hidden a genuine regression.
 */
const NO_RULE_EXPECTED = new Set(["group", "peer", "dark"]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry) && !/\.(test|stories)\./.test(entry))
      out.push(full);
  }
  return out;
}

/**
 * Every `rst:`-prefixed class referenced in component source.
 *
 * Only string literals are read, which is the same limitation the rest of the
 * tooling has: a class assembled at runtime cannot be checked statically.
 */
function referencedClasses() {
  const found = new Map(); // class -> first file that used it
  for (const file of SRC_DIRS.flatMap(walk)) {
    const source = readFileSync(file, "utf8");
    /* Any `rst:` token, whatever quoting it sits in. Reading only
       double-quoted literals meant a class in a template literal or single
       quotes was invisible to the check — and several components use both. */
    for (const match of source.matchAll(/\brst:(?:\[[^\]]*\]|[^\s"'`{}])+/g)) {
      const cls = match[0].replace(/[.,;]+$/, "");
      if (!found.has(cls)) found.set(cls, file);
    }
  }
  return found;
}

/**
 * Every class name the build actually emitted, unescaped.
 *
 * Compared as whole class names, variants included. An earlier version reduced
 * each class to its last segment and substring-matched that against the CSS
 * text, which was wrong three ways at once: a misspelled variant
 * (`focus-visable:ring-ring`) passed because the bare utility existed
 * elsewhere; `bg-black` "matched" inside `.rst\\:bg-black\\/20`, giving 44
 * utilities a false pass; and anything containing `[`, `(` or `/` — a fifth of
 * all references — was skipped outright rather than checked.
 */
function emittedClasses() {
  const names = new Set();
  for (const match of css.matchAll(
    /\.((?:\\.|[a-zA-Z_-])(?:\\.|[a-zA-Z0-9_-])*)/g,
  )) {
    names.add(match[1].replace(/\\(.)/g, "$1"));
  }
  return names;
}

/**
 * Dead classes this check is willing to tolerate.
 *
 * Empty, and worth keeping that way. It carried ten entries when the check was
 * written — seven animation classes with no plugin behind them, two gradient
 * stops naming a color that did not exist, and a scrollbar class defined
 * nowhere. All ten are fixed.
 *
 * Ten was the count in component source, which is all `walk` reads: it skips
 * `*.test.*` and `*.stories.*`, because docs blurbs carry CSS code fences and
 * prose that would false-positive. Two more dead classes were sitting in
 * `ActionBar.stories.tsx` the whole time and had to be found by hand. The
 * exclusion is the right default, but read this check as covering shipped
 * components, not the Storybook surface.
 *
 * The mechanism stays because the next person to find a dead class may not be
 * able to fix it in the same sitting. Add it here with a reason and the build
 * goes green on the state it inherited while still failing on anything new. The
 * check also fails when a listed class starts emitting, so a fix cannot leave a
 * stale entry behind — which is how these ten got pruned rather than forgotten.
 */
const KNOWN_DEAD = new Map();

const REFERENCED = referencedClasses();
const EMITTED = emittedClasses();
const dead = [];
const revived = [];
for (const [cls, file] of REFERENCED) {
  const bare = cls.replace(/^rst:/, "").split(":").pop();
  if (NO_RULE_EXPECTED.has(bare)) continue;
  const emitted = EMITTED.has(cls);
  if (!emitted && !KNOWN_DEAD.has(bare))
    dead.push({ cls, utility: bare, file });
  if (emitted && KNOWN_DEAD.has(bare)) revived.push(bare);
}

if (dead.length > 0) {
  console.error(
    `\n[check-classes-emit] ${dead.length} class(es) reference a utility that was never emitted.` +
      `\nTailwind generates utilities from theme tokens, so these produce no CSS at all:\n`,
  );
  for (const { cls, utility, file } of dead) {
    console.error(`  ${cls}`);
    console.error(`    no rule for "${cls}" in ${CSS} (utility: ${utility})`);
    console.error(`    referenced by ${file}\n`);
  }
  console.error(
    "Define the missing theme token, or use a utility that exists.\n" +
      "This is how the focus ring was inert for months: the classes read fine.\n",
  );
  process.exit(1);
}

if (revived.length > 0) {
  console.error(
    `\n[check-classes-emit] ${revived.length} class(es) now emit but are still listed as known-dead:\n`,
  );
  for (const utility of new Set(revived)) console.error(`  ${utility}`);
  console.error(
    "\nRemove them from KNOWN_DEAD so the list keeps meaning something.\n",
  );
  process.exit(1);
}

const known = new Set([...KNOWN_DEAD.keys()]);
console.log(
  `✓ ${REFERENCED.size} referenced rst: classes checked against ` +
    `${EMITTED.size} emitted, ` +
    `${known.size} known-dead carried over`,
);
if (process.argv.includes("--verbose")) {
  for (const [utility, why] of KNOWN_DEAD)
    console.log(`  · ${utility} — ${why}`);
}
