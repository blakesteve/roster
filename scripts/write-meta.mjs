/**
 * Writes `dist/meta.json` so consumers can report facts about this library that
 * are not derivable from what it ships.
 *
 * A portfolio site's case study reads the installed package for everything it can:
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
 * Runs from `prepack`, not from `build`. The suite takes long enough that
 * paying for it on every local build would be a tax on the wrong people, and
 * the only moment this number has to be right is the moment the tarball is
 * built.
 *
 * `prepack` rather than `prepublishOnly`, which was the first attempt and
 * shipped 4.6.1 without the file. `prepublishOnly` fires only on `npm publish`,
 * so there is no way to check its output short of publishing — which is how a
 * version went out with the writer wired up and never run. `prepack` runs for
 * `npm pack` too, so `tar -tzf` on a local tarball answers the question before
 * anyone publishes anything.
 *
 * Each failing test gets one retry (`--retry=1`), and `meta.json` records how
 * many passed only on it. A real-browser test can time out once on a busy
 * machine and pass on a second try, and a publish shouldn't stop for that; a
 * test that fails twice still stops it. Then the failing tests' names are
 * printed, since vitest's own output is ignored here, and no `meta.json` is
 * written: a published count never includes a failure.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

/**
 * The whole of the decision, separated from running vitest so it can be tested
 * against a fixture. Getting a field wrong here publishes a number to a public
 * page, which is the failure this file exists to prevent, so it is worth
 * pinning.
 */
export function buildMeta(run, pkg, retries = { failed: [], passedOnRetry: [] }) {
  /* After the retry. Either report's word is enough: the JSON report's count
     catches a failure the retry report missed, and the other way round. */
  const failed = retries.failed.length || run.numFailedTests || 0;
  if (failed) {
    const names = retries.failed.length ? retries.failed.map((n) => `\n  ${n}`).join("") : "";
    throw new Error(`${failed} ${failed === 1 ? "test" : "tests"} failed, retried once — refusing to write meta.json:${names}`);
  }

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
    /* Passed only on their retry: a number to watch, not a failure. */
    passedOnRetry: retries.passedOnRetry.length,
  };

  if (!meta.tests) {
    throw new Error(
      "vitest reported zero passing tests — refusing to publish a meta.json " +
        "that would make the library look untested.",
    );
  }

  return meta;
}

/** The run: every test, a failing one retried once, through both reports. */
export function vitestArgs(report) {
  return [
    "vitest",
    "run",
    "--retry=1",
    "--reporter=json",
    `--outputFile.json=${report}`,
    "--reporter=./scripts/meta-reporter.mjs",
  ];
}

/**
 * Guarded so a test can import `buildMeta` without this running vitest inside
 * vitest.
 */
function main() {
  const scratch = mkdtempSync(join(tmpdir(), "roster-meta-"));
  const report = join(scratch, "vitest.json");
  const retryReport = join(scratch, "retries.json");
  /* No meta.json survives a run that doesn't earn one. */
  rmSync("dist/meta.json", { force: true });

  try {
    try {
      execFileSync("npx", vitestArgs(report), {
        stdio: ["ignore", "ignore", "inherit"],
        env: { ...process.env, ROSTER_META_REPORT: retryReport },
      });
    } catch (error) {
      /* A failing test exits non-zero; the reports below say which. With no
         report at all, vitest stopped before running anything. */
      if (!existsSync(report) || !existsSync(retryReport)) {
        throw new Error(`vitest stopped before reporting (exit ${error.status ?? "unknown"}) — no meta.json written`);
      }
    }

    const run = JSON.parse(readFileSync(report, "utf8"));
    const retries = JSON.parse(readFileSync(retryReport, "utf8"));
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    for (const name of retries.passedOnRetry) console.log(`↻ passed on its retry: ${name}`);
    const meta = buildMeta(run, pkg, retries);

    writeFileSync("dist/meta.json", JSON.stringify(meta, null, 2) + "\n");
    console.log(
      `✓ dist/meta.json — ${meta.tests} tests across ${meta.testFiles} files @ ${meta.version}` +
        (meta.passedOnRetry ? `, ${meta.passedOnRetry} only on retry` : ""),
    );
  } catch (error) {
    console.error(`✗ ${error.message}`);
    process.exitCode = 1;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/* `process.argv[1]` is undefined under `node -e` and in some test runners, so
   it is checked before use rather than after a crash. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
