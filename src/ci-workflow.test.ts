import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards on CI's workflow that a review can miss.
 *
 * The Storybook job runs in Playwright's image for one version, and the
 * browsers in an image only launch from the same version of the playwright
 * package. A lockfile bump without the image, or the reverse, would fail at
 * launch with "Executable doesn't exist", and only in CI. Every job also has a
 * ceiling, so a stall fails inside a stated bound rather than at GitHub's six
 * hours.
 */
const ROOT = join(__dirname, "..");
const workflow = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");
const lock = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));

describe("ci.yml", () => {
  it("runs the browsers in Playwright's image for the locked version", () => {
    const images = [...workflow.matchAll(/image:\s*mcr\.microsoft\.com\/playwright:v([\d.]+)-noble/g)].map((m) => m[1]);
    const locked = [lock.packages["node_modules/playwright"].version, lock.packages["node_modules/playwright-core"].version];
    /* One image, and the package and its core both at its version. */
    expect([images.length, ...locked]).toEqual([1, images[0], images[0]]);
  });

  it("installs no browsers and no system libraries", () => {
    expect(workflow).not.toMatch(/playwright install|apt-get/);
  });

  it("runs every Vitest project", () => {
    const projects = [...readFileSync(join(ROOT, "vite.config.ts"), "utf8").matchAll(/\n {10}name: '([\w-]+)',\n/g)].map((m) => m[1]);
    const run = [...workflow.matchAll(/vitest run --project ([\w-]+)/g)].map((m) => m[1]);
    expect(projects.length).toBeGreaterThanOrEqual(6);
    expect(run.sort()).toEqual(projects.sort());
  });

  /* `storybook-touch` reads only `*.touch.checks.stories.tsx`, and every other
     project leaves the tag out, so a story tagged `touch` in another file
     would run nowhere. */
  it("finds every story tagged touch in a file the touch project reads", () => {
    const files = readdirSync(join(ROOT, "src"), { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".stories.tsx"));
    const tagged = files.filter((f) => /tags: \[[^\]]*["']touch["']/.test(readFileSync(join(ROOT, "src", f), "utf8")));
    expect(tagged.length).toBeGreaterThan(0);
    expect(tagged.filter((f) => !f.endsWith(".touch.checks.stories.tsx"))).toEqual([]);
  });

  it("gives every job a ceiling", () => {
    const jobs = workflow.slice(workflow.indexOf("\njobs:\n")).split(/\n {2}(?=[a-z][\w-]*:\n)/).slice(1);
    expect(jobs.map((job) => [job.slice(0, job.indexOf(":")), /\n {4}timeout-minutes: \d+\n/.test(job)])).toEqual([
      ["test", true],
      ["storybook", true],
      ["build", true],
    ]);
  });
});
