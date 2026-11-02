import { describe, it, expect } from "vitest";
// @ts-expect-error — a build script, deliberately plain JS with no types.
import { buildMeta, vitestArgs } from "../scripts/write-meta.mjs";
// @ts-expect-error — the build script's reporter, plain JS too.
import { summarize } from "../scripts/meta-reporter.mjs";

/**
 * `dist/meta.json` is how the test count reaches a portfolio site's case
 * study, which renders it under the words "live · roster @ x.y.z". A wrong
 * field here does not fail anything — it publishes a confident, incorrect
 * number to a public page, which is precisely the failure the file was written
 * to end.
 *
 * The vitest JSON report is the fixture, trimmed to the fields that matter.
 * `numTotalTestSuites` and `testResults` disagree in exactly the way that
 * caused the first draft to report 166 files for a 92-file suite.
 */

/** Shaped like a real `vitest run --reporter=json` payload. */
function report(over: Record<string, unknown> = {}) {
  return {
    numTotalTests: 995,
    numPassedTests: 995,
    numFailedTests: 0,
    /* Named for Jest compatibility, but vitest counts `describe` blocks here,
       not files. The gap is the whole point of this fixture. */
    numTotalTestSuites: 166,
    numPassedTestSuites: 166,
    testResults: Array.from({ length: 92 }, (_, i) => ({ name: `file-${i}.test.ts` })),
    ...over,
  };
}

const pkg = { version: "4.6.0" };

describe("the published meta", () => {
  it("counts files, not describe blocks", () => {
    /* The defect that shipped in the first draft: `numPassedTestSuites` reads
       like a file count and is not one. */
    const meta = buildMeta(report(), pkg);
    expect(meta.testFiles).toBe(92);
    expect(meta.testFiles).not.toBe(166);
  });

  it("counts passing tests, not collected ones", () => {
    /* A skipped test was collected and never ran, so it isn't counted. A
       failing one doesn't get this far: it refuses (below). */
    const meta = buildMeta(report({ numTotalTests: 1000, numPassedTests: 995, numFailedTests: 0, numPendingTests: 5 }), pkg);
    expect(meta.tests).toBe(995);
  });

  it("carries the version the count belongs to", () => {
    /* Without it the consumer cannot tell a fresh count from one published two
       minor versions ago, which is the state this replaced. */
    expect(buildMeta(report(), { version: "5.1.2" }).version).toBe("5.1.2");
  });

  it("refuses to publish a zero", () => {
    /* A runner that collected nothing reports zero passing rather than
       failing, so without this the page would read "live · 0 tests" and look
       authoritative doing it. The sibling `getRosterComponents` throws on an
       empty parse for the same reason. */
    expect(() => buildMeta(report({ numPassedTests: 0 }), pkg)).toThrow(/zero passing tests/);
  });

  it("refuses when the field is missing entirely", () => {
    /* A reporter change that renames the field should stop the publish, not
       silently write `undefined`. */
    expect(() => buildMeta(report({ numPassedTests: undefined }), pkg)).toThrow(
      /zero passing tests/,
    );
  });

  it("refuses to write with a test that failed even on its retry, and names it", () => {
    /* A meta.json is written only by a green run: a count that includes a
       failure is the wrong number, published. */
    const retries = { failed: ["unit src/a.test.ts > a > breaks"], passedOnRetry: [] };
    expect(() => buildMeta(report({ numFailedTests: 1 }), pkg, retries)).toThrow(
      "1 test failed, retried once — refusing to write meta.json:\n  unit src/a.test.ts > a > breaks",
    );
  });

  it("refuses on either report's word of a failure", () => {
    /* The JSON report's count stands when the retry report is missing one,
       and the other way round. */
    const none = { failed: [], passedOnRetry: [] };
    const named = { failed: ["unit src/a.test.ts > a"], passedOnRetry: [] };
    expect(() => buildMeta(report({ numFailedTests: 2 }), pkg, none)).toThrow(/^2 tests failed/);
    expect(() => buildMeta(report({ numFailedTests: 0 }), pkg, named)).toThrow(/^1 test failed/);
  });

  it("records how many tests passed only on their retry", () => {
    const retries = { failed: [], passedOnRetry: ["a", "b"] };
    expect([buildMeta(report(), pkg, retries).passedOnRetry, buildMeta(report(), pkg).passedOnRetry]).toEqual([2, 0]);
  });

  it("runs every test with one retry, through both reports", () => {
    expect(vitestArgs("/tmp/r.json")).toEqual([
      "vitest",
      "run",
      "--retry=1",
      "--reporter=json",
      "--outputFile.json=/tmp/r.json",
      "--reporter=./scripts/meta-reporter.mjs",
    ]);
  });
});

/** A vitest test case as the reporter API hands it over, trimmed. */
function testCase(fullName: string, state: string, retryCount?: number, project = "unit") {
  return {
    fullName,
    project: { name: project },
    result: () => ({ state }),
    diagnostic: () => (retryCount === undefined ? undefined : { retryCount }),
  };
}
const testModule = (moduleId: string, tests: ReturnType<typeof testCase>[]) => ({
  moduleId,
  children: { allTests: () => tests[Symbol.iterator]() },
});

describe("the retry report", () => {
  it("names every test that failed for good, and every one that passed only on its retry", () => {
    const modules = [
      testModule("/repo/src/a.test.ts", [
        testCase("a > passes", "passed", 0),
        testCase("a > passes second time", "passed", 1),
        testCase("a > fails", "failed", 1),
        testCase("a > skipped", "skipped"),
      ]),
      testModule("/repo/src/b.stories.tsx", [testCase("Walk", "failed", 1, "storybook-real-input (webkit)")]),
    ];
    expect(summarize(modules, "/repo")).toEqual({
      failed: ["unit src/a.test.ts > a > fails", "storybook-real-input (webkit) src/b.stories.tsx > Walk"],
      passedOnRetry: ["unit src/a.test.ts > a > passes second time"],
    });
  });
});
