import { describe, it, expect } from "vitest";
// @ts-expect-error — a build script, deliberately plain JS with no types.
import { buildMeta } from "../scripts/write-meta.mjs";

/**
 * `dist/meta.json` is how the test count reaches blakeb-dev's case study, which
 * renders it under the words "live · roster @ x.y.z". A wrong field here does
 * not fail anything — it publishes a confident, incorrect number to a public
 * page, which is precisely the failure the file was written to end.
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

  it("counts passing tests, not attempted ones", () => {
    /* A suite with failures should not reach publish at all, but if it does,
       the number advertised has to be the one that actually passed. */
    const meta = buildMeta(
      report({ numTotalTests: 1000, numPassedTests: 995, numFailedTests: 5 }),
      pkg,
    );
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
});
