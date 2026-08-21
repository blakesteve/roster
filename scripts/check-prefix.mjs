/**
 * Fails the build if Roster emits an unprefixed utility class.
 *
 * Roster's stylesheet sits in a layer BELOW the host's `utilities`, on purpose,
 * so a consumer's own `className` can override a component. The consequence
 * nobody predicted is that the host wins *any* class-name collision, including
 * on Roster's own internal elements. In practice:
 *
 *   - an app that used `bg-white` anywhere defeated Roster's Textarea
 *     `dark:bg-gray-950`, so the field rendered white on a dark page
 *   - an app that used `translate-x-0` defeated the Switch's
 *     `group-data-[checked]:translate-x-5`, so the thumb never moved
 *
 * Neither app touched those elements. Both bugs were invisible in this repo,
 * because Storybook is the only consumer here and it never collides with
 * itself — they only appear in an app with its own Tailwind build. So the check
 * has to be on the artifact rather than on a rendered component.
 *
 * `dark` is the one legitimate bare class: it is the consuming document's theme
 * class, which Roster's own `@custom-variant dark` matches by name.
 */
import { readFileSync, existsSync } from "node:fs";

const CSS = "dist/roster.css";
const ALLOWED_BARE = new Set(["dark"]);

if (!existsSync(CSS)) {
  console.error(`[check-prefix] ${CSS} not found — run the build first.`);
  process.exit(1);
}

/*
 * Strip `url(…)` and quoted values first. A texture URL contributes `.com` and
 * `.png` to a naive selector scan, which reports as two missing prefixes on
 * classes that were never classes.
 */
const css = readFileSync(CSS, "utf8")
  .replace(/url\([^)]*\)/g, "url()")
  .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');

/*
 * Class selectors only. A leading digit means this is a decimal inside a value
 * (`.25rem`, `.5`), not a selector, and matching those reports ~60 phantom
 * failures that send you looking for classes that do not exist.
 */
const selectors = new Set(
  [...css.matchAll(/\.((?:\\.|[a-zA-Z_-])(?:\\.|[a-zA-Z0-9_-])*)/g)].map((m) => m[1]),
);

const unprefixed = [...selectors]
  .filter((s) => !s.startsWith("rst\\:"))
  .filter((s) => !ALLOWED_BARE.has(s))
  .sort();

if (unprefixed.length) {
  console.error(
    `[check-prefix] ${unprefixed.length} unprefixed class selector(s) in ${CSS}.\n` +
      "Every class Roster emits must carry the `rst:` prefix, or a host app\n" +
      "using the same name silently overrides it. Run:\n" +
      "  APPLY=1 node scripts/prefix-classes.mjs <files>\n\n" +
      unprefixed.slice(0, 20).map((s) => `  .${s}`).join("\n"),
  );
  process.exit(1);
}

console.log(
  `✓ all ${selectors.size - ALLOWED_BARE.size} emitted class selectors are prefixed`,
);
