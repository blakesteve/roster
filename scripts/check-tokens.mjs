/**
 * Fails the build if a promised token is not themeable through `--roster-*`.
 *
 * Roster exposes three type roles, and each has to be settable by a consuming
 * app with one custom property. The failure this guards against is silent in
 * both directions:
 *
 *   - `font-mono` used to resolve through `--rst-font-mono`, a Tailwind
 *     INTERNAL prefixed variable. The components that opt into mono — Eyebrow,
 *     InlineCode, Stat, Pullquote, DescriptionList, MatchupCard, Countdown —
 *     could only be retyped by reaching into a `--rst-*` name that is not ours
 *     to promise. Nothing failed; it just was not a supported surface.
 *   - `font-display` emitted no utility at all, because Tailwind generates only
 *     what it finds in the source IT scans, and no Roster component asks for
 *     the display face. A consuming app's own build has never heard of
 *     `--roster-font-display`, so the role was unreachable for everyone.
 *
 * Checking the built artifact rather than the source is deliberate: the second
 * failure above is invisible in `src/index.css`, where the token looks fine.
 */
import { readFileSync, existsSync } from "node:fs";

const CSS = "dist/roster.css";
const ROLES = ["ui", "mono", "display"];

/* The motion knobs a consumer is meant to set. The rest of the `--rst-enter-*`
   family is deliberately absent: `opacity`, `scale` and the translates are
   written BY the `fade-in-*` and `zoom-in-*` utilities, so they are
   implementation rather than API and belong in the internal prefix. */
const MOTION = ["enter-duration", "enter-easing"];

/* The elevation scale. A level that emits nothing means some surface stopped
   using it, which is how a scale quietly becomes three unused tokens. */
const ELEVATION = ["elevation-raised", "elevation-anchored", "elevation-overlay"];

if (!existsSync(CSS)) {
  console.error(`[check-tokens] ${CSS} not found — run the build first.`);
  process.exit(1);
}

const css = readFileSync(CSS, "utf8");
const problems = [];

for (const role of ROLES) {
  const rule = new RegExp(`\\.rst\\\\:font-${role}\\{([^}]*)\\}`).exec(css);

  if (!rule) {
    problems.push(
      `\`rst:font-${role}\` emits no CSS. Tailwind only generates a utility it ` +
        `finds in scanned source — add \`@source inline("rst:font-${role}")\` ` +
        `to src/index.css, or have a component use it.`,
    );
    continue;
  }

  /* The comma matters. `var(--roster-font-ui)` with no fallback passes a
     naive substring check and is invalid at computed-value time for every
     consumer who sets nothing — the utility drops, the element inherits
     `body`, and an app reading in a serif gets serif buttons. That is the
     exact failure `--font-ui` exists to prevent, and it would ship green. */
  if (!rule[1].includes(`var(--roster-font-${role},`)) {
    problems.push(
      `\`rst:font-${role}\` must read \`var(--roster-font-${role}, <fallback>)\` ` +
        `— with a fallback, or it is invalid for anyone who sets nothing. ` +
        `It resolves to: ${rule[1]}`,
    );
  }
}

/* Two kinds of token, two different invariants.

   A HOOK is one Roster never defines — the font roles, the motion knobs. It is
   read with a fallback, and the fallback is what a consumer who sets nothing
   gets, so a missing one is invalid at computed-value time.

   A DEFINED token is one Roster sets at `:root` itself — the elevation levels.
   It needs no fallback, because it always has a value; what it needs is to
   still be DEFINED and still be READ. A level nothing reads is how a scale
   quietly becomes three unused custom properties. */
for (const hook of MOTION) {
  if (!css.includes(`var(--roster-${hook},`)) {
    problems.push(
      `\`--roster-${hook}\` is not read with a fallback, so a consumer who ` +
        `sets nothing gets an invalid declaration.`,
    );
  }
}

for (const token of ELEVATION) {
  if (!css.includes(`--roster-${token}:`)) {
    problems.push(`\`--roster-${token}\` is never defined at \`:root\`.`);
  }
  if (!css.includes(`var(--roster-${token})`)) {
    problems.push(
      `\`--roster-${token}\` is defined but nothing reads it — the level has ` +
        `no surfaces, so the scale has a rung nobody stands on.`,
    );
  }
}

if (problems.length > 0) {
  console.error("[check-tokens] promised tokens are not themeable:\n");
  for (const problem of problems) console.error(`  - ${problem}\n`);
  process.exit(1);
}

console.log(
  `✓ ${ROLES.length} font roles, ${MOTION.length} motion knobs and ${ELEVATION.length} elevation levels are themeable via --roster-*`,
);
