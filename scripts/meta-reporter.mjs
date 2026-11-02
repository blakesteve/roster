/**
 * A vitest reporter for `write-meta.mjs`: which tests failed for good, and
 * which passed only on their retry. vitest's JSON report says neither, and
 * with stdout ignored the failing test's name used to go nowhere.
 *
 * Writes `{ failed, passedOnRetry }`, each a list of names, to the file named
 * by `ROSTER_META_REPORT`.
 */

import { writeFileSync } from "node:fs";
import { relative } from "node:path";

/**
 * The whole of the decision, separated from vitest's objects' plumbing so it
 * can be tested against a fixture. A test is named by its project, its file
 * and its full name, as vitest prints a failure.
 */
export function summarize(testModules, cwd = process.cwd()) {
  const failed = [];
  const passedOnRetry = [];
  for (const testModule of testModules) {
    for (const test of testModule.children.allTests()) {
      const name = `${test.project.name} ${relative(cwd, testModule.moduleId)} > ${test.fullName}`;
      const { state } = test.result();
      if (state === "failed") failed.push(name);
      else if (state === "passed" && (test.diagnostic()?.retryCount ?? 0) > 0) passedOnRetry.push(name);
    }
  }
  return { failed, passedOnRetry };
}

export default class MetaReporter {
  onTestRunEnd(testModules) {
    const out = process.env.ROSTER_META_REPORT;
    if (out) writeFileSync(out, JSON.stringify(summarize(testModules)));
  }
}
