/**
 * Fails the build if the `"use client"` boundary landed in the wrong place.
 *
 * The directive decides which modules a consumer's React Server Component may
 * import. Get it wrong in either direction and nothing here notices: the build
 * is green, the unit tests do not read `dist`, and the other three guards all
 * inspect emitted CSS. It fails in somebody else's app, at render.
 *
 * Both directions have already shipped once.
 *
 * Stamping too much: the directive used to go on every chunk, which marked
 * `cn` and the CSS shims as client references. Importing `cn` from the root
 * and calling it inside a server component typechecked, then threw at render.
 *
 * Stamping too little: the rule that replaced it keyed off importing React,
 * and `react-hot-toast` is a client module that is not React. The toast handle
 * reads properties off that import at module scope, so in a server graph it
 * throws on IMPORT rather than on call — a worse failure than the one the
 * boundary move was fixing.
 *
 * So this derives the expectation from the SOURCE, independently of the rule in
 * `vite.config.ts` that produced the output. A guard that re-ran the build's
 * own logic would agree with it by construction and catch nothing.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = "src";
const DIST = "dist";

/** Packages that are themselves client modules. Keep in step with vite.config.ts. */
const CLIENT_PACKAGES = ["react", "react-dom", "react-hot-toast"];

/**
 * Emitted files that must NEVER carry the directive, by exact path.
 *
 * The entries a consumer is invited to use from a server component, plus the
 * two CSS shims and the barrels. A barrel has to stay bare for the boundary
 * move to work at all: stamped, it pins its whole namespace.
 */
const MUST_NOT_STAMP = [
  "utils.js", "utils.cjs",
  "lib/utils.js", "lib/utils.cjs",
  "tokens.js", "tokens.cjs",
  "preflight.js", "preflight.cjs",
  "roster.js", "roster.cjs",
  "data-table.js", "data-table.cjs",
];

if (!existsSync(DIST)) {
  console.error(`[check-client-boundary] ${DIST} not found — run the build first.`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const stamped = (file) =>
  existsSync(file) && readFileSync(file, "utf8").startsWith('"use client"');

const problems = [];

/* Direction 1: every source module that reaches for client-only code must be
   stamped in both formats. Parsed off the source's own import statements. */
const sources = walk(SRC).filter(
  (f) => /\.tsx?$/.test(f) && !/\.(test|stories)\./.test(f),
);

let expected = 0;
for (const src of sources) {
  const code = readFileSync(src, "utf8");
  const imports = [...code.matchAll(/from\s*["']([^"']+)["']/g)].map((m) => m[1]);
  const isClient = imports.some((i) =>
    CLIENT_PACKAGES.some((pkg) => i === pkg || i.startsWith(pkg + "/")),
  );
  if (!isClient) continue;

  const base = relative(SRC, src).replace(/\.tsx?$/, "");
  const emitted = [join(DIST, base + ".js"), join(DIST, base + ".cjs")];
  /* Not every source module is emitted — the dev host is not part of the
     package. Only judge the ones that are. */
  if (!emitted.some(existsSync)) continue;

  expected += 1;
  for (const file of emitted.filter(existsSync)) {
    if (!stamped(file)) {
      problems.push(
        `  ${file}\n    imports client-only code but carries no directive.\n` +
        `    A server component importing it crosses no boundary and fails at render.`,
      );
    }
  }
}

/* Direction 2: the entries a server component is meant to use stay bare. */
for (const name of MUST_NOT_STAMP) {
  const file = join(DIST, name);
  if (stamped(file)) {
    problems.push(
      `  ${file}\n    carries the directive and must not.\n` +
      `    Stamping this makes it a client reference and breaks server-side use.`,
    );
  }
}

/* Direction 2b: a variant table is pure by construction. If one is stamped the
   rule has started matching on something other than what a module imports. */
for (const file of walk(DIST).filter((f) => /-variants\.(js|cjs)$/.test(f))) {
  if (stamped(file)) {
    problems.push(
      `  ${file}\n    is a variant table and must not carry the directive.`,
    );
  }
}

if (problems.length) {
  console.error(
    `[check-client-boundary] ${problems.length} module(s) sit on the wrong side of the client boundary.\n`,
  );
  console.error(problems.join("\n\n"));
  console.error(
    `\nThe rule lives in vite.config.ts, in the output banner. Fix the rule, not this check.`,
  );
  process.exit(1);
}

const total = walk(DIST).filter((f) => /\.(js|cjs)$/.test(f) && stamped(f)).length;
console.log(
  `✓ client boundary: ${total} emitted modules stamped, ${expected} source modules required it, ` +
  `and the ${MUST_NOT_STAMP.length} server-safe entries are bare`,
);
