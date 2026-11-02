/**
 * A vitest reporter for `write-meta.mjs`: what failed, and which tests passed
 * only on their retry. vitest's JSON report says neither, and with stdout
 * ignored the failing test's name used to go nowhere.
 *
 * It explains a failure; it doesn't decide one. vitest's exit code does that
 * (`write-meta.mjs`), since a run can fail in ways no test result shows: a
 * file that throws as it loads, or an error thrown after a test has passed.
 * So all three are named here, beside the tests that failed.
 *
 * Writes `{ failed, failedFiles, unhandled, passedOnRetry }`, each a list of
 * lines, to the file named by `ROSTER_META_REPORT`.
 */

import { writeFileSync } from "node:fs";
import { relative } from "node:path";

/* An error in one line: its name and the first line of its message that
   says something. Storybook opens a story's with a blank line and a link to
   the story, so those are passed over. */
const said = (error) => {
  const lines = String(error?.message ?? error)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("Click to debug the error"));
  return `${error?.name ?? "Error"}: ${lines[0] ?? ""}`;
};

/**
 * The whole of the summary, separated from vitest's plumbing so it can be
 * tested against a fixture. A test is named by its project, its file and its
 * full name, as vitest prints a failure.
 */
export function summarize(testModules, unhandledErrors = [], cwd = process.cwd()) {
  const failed = [];
  const failedFiles = [];
  const passedOnRetry = [];
  for (const testModule of testModules) {
    const file = `${testModule.project.name} ${relative(cwd, testModule.moduleId)}`;
    /* Errors outside any test: the file failed to load, or a suite's hook
       threw. Its tests may never have run, so no test result says so. */
    for (const error of testModule.errors()) failedFiles.push(`${file}: ${said(error)}`);
    for (const suite of testModule.children.allSuites()) {
      for (const error of suite.errors()) failedFiles.push(`${file} > ${suite.fullName}: ${said(error)}`);
    }
    for (const test of testModule.children.allTests()) {
      const name = `${file} > ${test.fullName}`;
      const { state, errors = [] } = test.result();
      /* With why, its error's first line: a timeout and a wrong value read
         alike as a name alone. */
      if (state === "failed") failed.push(errors.length ? `${name}: ${said(errors[0])}` : name);
      else if (state === "passed" && (test.diagnostic()?.retryCount ?? 0) > 0) passedOnRetry.push(name);
    }
  }
  /* Thrown where no test catches it, such as a timer firing after its test
     passed. vitest names the test it was running when it can. */
  const unhandled = unhandledErrors.map((error) => {
    const during = error?.VITEST_TEST_NAME ? `, during ${relative(cwd, error.VITEST_TEST_PATH ?? "")} > ${error.VITEST_TEST_NAME}` : "";
    return `unhandled ${said(error)}${during}`;
  });
  return { failed, failedFiles, unhandled, passedOnRetry };
}

export default class MetaReporter {
  onTestRunEnd(testModules, unhandledErrors) {
    const out = process.env.ROSTER_META_REPORT;
    if (out) writeFileSync(out, JSON.stringify(summarize(testModules, unhandledErrors)));
  }
}
