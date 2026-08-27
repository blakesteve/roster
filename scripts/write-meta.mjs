/**
 * Writes `dist/meta.json` so consumers can report facts about this library that
 * are not derivable from what it ships.
 *
 * blakeb-dev's case study reads the installed package for everything it can:
 * the version from `package.json`, the component count by parsing the exports
 * out of `dist/*.d.ts`. The test count has no such source — `files` is `["dist"]`,
 * so the suite never leaves this repo, and the number was a hand-typed literal
 * that drifted two minor versions behind before anyone noticed it sitting next
 * to a live one.
 *
 * The count has to come from a real run rather than from counting `it(` in the
 * source: `it.each` expands at runtime, so a static count is wrong by however
 * many table-driven cases the suite has, which here is dozens.
 *
 * Runs from `prepublishOnly`, not from `build`. The suite takes long enough
 * that paying for it on every local build would be a tax on the wrong people,
 * and the only moment this number needs to be right is the moment it is
 * published.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

/**
 * The whole of the decision, separated from running vitest so it can be tested
 * against a fixture. Getting a field wrong here publishes a number to a public
 * page, which is the failure this file exists to prevent, so it is worth
 * pinning.
 */
export function buildMeta(run, pkg) {
  /* `numPassedTests` rather than `numTotalTests`: publishing a count that
     includes failures would be advertising the wrong number, and a failing
     suite should not reach publish anyway.

     File count comes from `testResults.length`, not from `numTotalTestSuites`.
     Despite the Jest-compatible name, vitest counts `describe` blocks there —
     166 against 92 real files at the time of writing. Reporting suites as files
     is exactly the class of quietly-wrong number this file exists to stop. */
  const meta = {
    version: pkg.version,
    tests: run.numPassedTests,
    testFiles: run.testResults.length,
  };

  if (!meta.tests) {
    throw new Error(
      "vitest reported zero passing tests — refusing to publish a meta.json " +
        "that would make the library look untested.",
    );
  }

  return meta;
}

/**
 * Guarded so a test can import `buildMeta` without this running vitest inside
 * vitest.
 */
function main() {
  const scratch = mkdtempSync(join(tmpdir(), "roster-meta-"));
  const report = join(scratch, "vitest.json");

  try {
    execFileSync(
      "npx",
      ["vitest", "run", "--reporter=json", `--outputFile=${report}`],
      { stdio: ["ignore", "ignore", "inherit"] },
    );

    const run = JSON.parse(readFileSync(report, "utf8"));
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const meta = buildMeta(run, pkg);

    writeFileSync("dist/meta.json", JSON.stringify(meta, null, 2) + "\n");
    console.log(
      `✓ dist/meta.json — ${meta.tests} tests across ${meta.testFiles} files @ ${meta.version}`,
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/* `process.argv[1]` is undefined under `node -e` and in some test runners, so
   it is checked before use rather than after a crash. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
