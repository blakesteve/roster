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
 * machine and pass on a second try, and a publish shouldn't stop for that.
 * Anything else that fails the run stops it: vitest's exit code is the
 * authority, so a file that throws as it loads, or an error thrown after a
 * test passed, stops it too, though no test failed. Then what failed is
 * printed, since vitest's own output is ignored here, and no `meta.json` is
 * written: a published count never comes from a failed run.
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

     File count is the test files that ran, each once, not `numTotalTestSuites`.
     Despite the Jest-compatible name, vitest counts `describe` blocks there —
     166 against 92 real files at the time of writing. Nor is it
     `testResults.length`, which has an entry for each file in each project
     and browser that collects it, skipped or not: 699 entries for 219 files
     on 2 Nov 2026. Reporting either as files is exactly the class of
     quietly-wrong number this file exists to stop. */
  const ran = run.testResults.filter((file) =>
    (file.assertionResults ?? []).some((test) => test.status === "passed" || test.status === "failed"),
  );
  const meta = {
    version: pkg.version,
    tests: run.numPassedTests,
    testFiles: new Set(ran.map((file) => file.name)).size,
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

/**
 * The run's verdict. vitest's exit code decides it: any exit but 0 refuses,
 * whatever the reports say, since a run can fail where no test result shows
 * it. The retry report only names what failed: the tests, the files that
 * didn't load, and the errors nothing caught.
 */
export function verdict(exit, run, retries, pkg) {
  if (exit !== 0) {
    const named = [...(retries?.failed ?? []), ...(retries?.failedFiles ?? []), ...(retries?.unhandled ?? [])];
    const list = named.length ? `:${named.map((n) => `\n  ${n}`).join("")}` : ", naming nothing; run `npx vitest run` to see why";
    throw new Error(`vitest exited ${exit} — refusing to write meta.json${list}`);
  }
  return buildMeta(run, pkg, retries);
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
    let exit = 0;
    try {
      execFileSync("npx", vitestArgs(report), {
        stdio: ["ignore", "ignore", "inherit"],
        env: { ...process.env, ROSTER_META_REPORT: retryReport },
      });
    } catch (error) {
      exit = typeof error.status === "number" ? error.status : 1;
    }
    /* With no report at all, vitest stopped before running anything. */
    const read = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);
    const run = read(report);
    const retries = read(retryReport);
    if (exit === 0 && (!run || !retries)) throw new Error("vitest exited 0 but wrote no report — refusing to write meta.json");

    for (const name of retries?.passedOnRetry ?? []) console.log(`↻ passed on its retry: ${name}`);
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const meta = verdict(exit, run, retries, pkg);

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
