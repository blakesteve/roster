import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * .github/workflows/discord.yml, run rather than read: the job's real `if:` is
 * evaluated against each event, and its real script runs in bash with stand-ins
 * for curl and gh. What this can't show is Discord accepting the message or the
 * post appearing, which only a real run and a person reading the channel can.
 *
 * The shared notices workflow's test (v2), with two later fixes: the script
 * runs in its temp dir, so hostile text that ran would land where the checks
 * look, and a test post reads CI's own latest failure on main. In the unit
 * project, which CI runs.
 */

const ROOT = join(__dirname, "..");
const WORKFLOW = readFileSync(join(ROOT, ".github/workflows/discord.yml"), "utf8");
const CI = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");
const SECRET = "https://discord.test/api/webhooks/123/not-a-real-token";
const SHA = "60eea50c818ba9fd1473ad0705ec04925ec22c9c";
const GREEN = 5763719;
const RED = 15548997;

/** The lines of a block scalar (`key: |` or `key: >-`), with their indentation removed. */
function block(key: string): string {
  const lines = WORKFLOW.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^\\s*${key}: [|>]`).test(l));
  const indent = lines[start].search(/\S/);
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() && line.search(/\S/) <= indent) break;
    body.push(line);
  }
  const margin = Math.min(...body.filter((l) => l.trim()).map((l) => l.search(/\S/)));
  return body.map((l) => l.slice(margin)).join("\n");
}

/** A value in the workflow's top-level `env`, as the run gets it. */
function env(key: string): string {
  const value = WORKFLOW.match(new RegExp(`^env:\\n(?: {2}.*\\n)*? {2}${key}: (.*)$`, "m"))?.[1] ?? "";
  return value.replace(/^"(.*)"$/, "$1");
}

const SCRIPT = block("run");
const CONDITION = block("if");
const APP_NAME = env("APP_NAME");
const SITE_URL = env("SITE_URL");

/* GitHub's expressions here are only ==, &&, || and strings, which read the same in JavaScript. */
const posts = (github: Record<string, unknown>): boolean =>
  new Function("github", `return (${CONDITION.replaceAll("==", "===")});`)(github);

const deployment = (environment: string, state: string) => ({
  event_name: "deployment_status",
  event: { deployment: { environment }, deployment_status: { state } },
});
const ciRun = (conclusion: string, event: string) => ({
  event_name: "workflow_run",
  event: { workflow_run: { conclusion, event } },
});

describe("the settings, read from the file", () => {
  it("names the app Roster, links its Storybook, and ships with details on", () => {
    expect([APP_NAME, SITE_URL, env("DETAILS")]).toEqual(["Roster", "https://roster-tan.vercel.app", "on"]);
    expect(WORKFLOW).toMatch(/^ {2}# on: PR titles, release notes and the failed job and step\. off: version and link only\.\n {2}DETAILS: "on"$/m);
    // Each is set once, at the top, so no step's own env can change what a run gets.
    expect(["APP_NAME", "SITE_URL", "DETAILS"].map((key) => WORKFLOW.match(new RegExp(`^\\s*${key}:`, "gm"))?.length)).toEqual([1, 1, 1]);
  });

  it("runs on CI's image, so this test runs the script where the job does", () => {
    const images = (file: string) => [...file.matchAll(/^ {4}runs-on: (.+)$/gm)].map((m) => m[1]);
    expect(images(WORKFLOW)).toEqual(["ubuntu-24.04"]);
    expect(images(CI)).toEqual(["ubuntu-24.04", "ubuntu-24.04", "ubuntu-24.04"]);
  });

  it("matches CI: its name, its push to main, and the three jobs a red post names", () => {
    expect(CI).toMatch(/^name: CI$/m);
    expect(CI).toMatch(/^ {2}push:\n {4}branches: \["main"\]$/m);
    const jobs = [...CI.slice(CI.indexOf("\njobs:\n")).matchAll(/^ {2}([\w-]+):\n {4}name: (.+)$/gm)].map((m) => `${m[1]} ${m[2]}`);
    expect(jobs).toEqual(["test Unit Tests", "storybook Storybook Tests", "build Build"]);
  });
});

describe("which events post", () => {
  it.each(["success", "failure", "error"])("a production deploy that ends in %s", (state) => {
    expect(posts(deployment("Production", state))).toBe(true);
  });

  it.each(["pending", "in_progress", "queued", "inactive"])("twin: not a production deploy still %s", (state) => {
    expect(posts(deployment("Production", state))).toBe(false);
  });

  it.each(["success", "failure", "error"])("twin: never a preview, even one that ends in %s", (state) => {
    expect(posts(deployment("Preview", state))).toBe(false);
  });

  it("a release", () => {
    expect(posts({ event_name: "release", event: {} })).toBe(true);
    expect(WORKFLOW).toMatch(/release:\n\s+types: \[published\]/);
  });

  it("CI going red from a push", () => {
    expect(posts(ciRun("failure", "push"))).toBe(true);
  });

  /* Canceled is also how a job stopped at its own timeout ends the run (a
     time-limited job's run read 9 Nov), so a hung job on main posts nothing. */
  it("twin: not CI going green, or canceled", () => {
    expect(posts(ciRun("success", "push"))).toBe(false);
    expect(posts(ciRun("cancelled", "push"))).toBe(false);
  });

  it("twin: not CI red on a pull request, which a branch named main would read as main", () => {
    expect(posts(ciRun("failure", "pull_request"))).toBe(false);
  });

  it("only CI, and only on main", () => {
    expect(WORKFLOW).toMatch(/workflow_run:\n\s+workflows: \[CI\]\n\s+types: \[completed\]\n\s+branches: \[main\]\n/);
  });

  it("a message sent on demand", () => {
    expect(posts({ event_name: "workflow_dispatch", event: {} })).toBe(true);
  });

  it("twin: nothing else", () => {
    expect(posts({ event_name: "push", event: {} })).toBe(false);
  });
});

describe("the workflow's rules", () => {
  it("asks only to read", () => {
    expect(WORKFLOW).toMatch(/^permissions:\n {2}contents: read\n {2}actions: read\n {2}deployments: read\n {2}pull-requests: read\n\n/m);
    expect(WORKFLOW.match(/permissions:/g)).toHaveLength(1);
    expect(WORKFLOW).not.toMatch(/: write$/m);
  });

  it("uses no third-party action and no checkout", () => {
    expect(WORKFLOW).not.toMatch(/^\s*(- )?uses:/m);
  });

  it("puts no expression in the script, so nothing from a commit runs as code", () => {
    expect(SCRIPT).not.toContain("${{");
  });

  it("never turns on shell tracing", () => {
    expect(SCRIPT).not.toMatch(/^\s*set [^\n]*-[a-z]*x/m);
    expect(SCRIPT).not.toMatch(/bash -x/);
  });

  it("is its own workflow, so CI and deploys don't wait on it", () => {
    expect(CI).not.toContain("DISCORD");
    expect(WORKFLOW).toMatch(/timeout-minutes: 2/);
  });

  it("never reaches the package, which ships dist alone", () => {
    expect(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).files).toEqual(["dist"]);
  });
});

let dir: string;

/** A path GitHub's API is asked for, and its answer. null: the call fails. */
type Api = Record<string, unknown>;

function stubs(httpCode: string, responseBody: string, packageJson: string | null, api: Api) {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, "curl"), `#!/bin/bash
while [ $# -gt 0 ]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    -d) printf '%s' "$2" > "${dir}/payload.json"; shift 2 ;;
    -w|-H|--max-time) shift 2 ;;
    -sS) shift ;;
    *) printf '%s' "$1" > "${dir}/url.txt"; shift ;;
  esac
done
printf '%s' '${responseBody}' > "$out"
printf '%s' '${httpCode}'
`);
  const routes = Object.entries(api).map(([path, answer], i) => {
    if (answer === null) return `  *"${path}"*) exit 1 ;;`;
    writeFileSync(join(dir, `api-${i}.json`), JSON.stringify(answer));
    return `  *"${path}"*) cat "${dir}/api-${i}.json"; exit 0 ;;`;
  });
  writeFileSync(join(bin, "gh"), `#!/bin/bash
printf '%s\\n' "$*" >> "${dir}/gh.txt"
case "$*" in
${routes.join("\n")}
esac
${packageJson === null ? "exit 1" : `printf '%s' '${packageJson}'`}
`);
  chmodSync(join(bin, "curl"), 0o755);
  chmodSync(join(bin, "gh"), 0o755);
  return bin;
}

interface Run {
  event: string;
  details?: string;
  api?: Api;
  payload?: unknown;
  httpCode?: string;
  response?: string;
  packageJson?: string | null;
  webhook?: string;
  refName?: string;
}

function run({ event, details = "off", api = {}, payload = {}, httpCode = "200", response = '{"id":"999"}', packageJson = '{"version":"5.19.0"}', webhook = SECRET, refName = "main" }: Run) {
  const bin = stubs(httpCode, response, packageJson, api);
  const eventPath = join(dir, "event.json");
  writeFileSync(eventPath, JSON.stringify(payload));
  const scriptPath = join(dir, "script.sh");
  writeFileSync(scriptPath, SCRIPT);
  // Run in `dir`, so anything hostile text manages to run lands where the tests look.
  const result = spawnSync("bash", [scriptPath], {
    cwd: dir,
    encoding: "utf8",
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      DISCORD_WEBHOOK_URL: webhook,
      GITHUB_EVENT_NAME: event,
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_REPOSITORY: "blakesteve/roster",
      GITHUB_RUN_ID: "42",
      GITHUB_SHA: SHA,
      GITHUB_REF_NAME: refName,
      RUNNER_TEMP: dir,
      APP_NAME,
      SITE_URL,
      DETAILS: details,
      NODE_ENV: "test",
    },
  });
  const sent = () => JSON.parse(readFileSync(join(dir, "payload.json"), "utf8"));
  return { ...result, sent, embed: () => sent().embeds[0], output: result.stdout + result.stderr };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "discord-workflow-"));
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

const asked = () => (existsSync(join(dir, "gh.txt")) ? readFileSync(join(dir, "gh.txt"), "utf8").trim().split("\n") : []);

const DEPLOY = { deployment: { id: 3 }, deployment_status: { state: "success", target_url: "https://roster-abc.vercel.app" } };
const FAILED_DEPLOY = { deployment_status: { state: "failure", target_url: "https://vercel.com/deployment/abc" } };
const RELEASE = { release: { tag_name: "v5.19.0", html_url: "https://github.com/blakesteve/roster/releases/tag/v5.19.0" } };
const RED_CI = { workflow_run: { head_branch: "main", head_sha: "abcdef1234567890", html_url: "https://github.com/blakesteve/roster/actions/runs/7" } };

describe("the messages", () => {
  it("a production deploy says Storybook was deployed, green, with its link, not the deployment's own address", () => {
    const { status, embed } = run({ event: "deployment_status", payload: DEPLOY });
    expect(status).toBe(0);
    expect(embed()).toEqual({
      title: "Roster Storybook deployed",
      description: "Version 5.19.0, commit 60eea50",
      url: "https://roster-tan.vercel.app",
      color: GREEN,
    });
  });

  it.each(["failure", "error"])("a deploy that ends in %s: red, in words too, linking the deployment", (state) => {
    const { embed } = run({ event: "deployment_status", payload: { deployment_status: { ...FAILED_DEPLOY.deployment_status, state } } });
    expect(embed()).toMatchObject({
      title: "Roster Storybook deploy failed",
      url: "https://vercel.com/deployment/abc",
      color: RED,
    });
  });

  it("a release: green, with its own version and link", () => {
    const { embed } = run({ event: "release", payload: RELEASE });
    expect(embed()).toEqual({
      title: "Roster released",
      description: "Version 5.19.0, commit 60eea50",
      url: "https://github.com/blakesteve/roster/releases/tag/v5.19.0",
      color: GREEN,
    });
  });

  it("red CI: names the branch, the failing commit rather than the default branch's, and the run", () => {
    const { embed } = run({ event: "workflow_run", payload: RED_CI });
    expect(embed()).toEqual({
      title: "Roster CI failed on main",
      description: "Version 5.19.0, commit abcdef1",
      url: "https://github.com/blakesteve/roster/actions/runs/7",
      color: RED,
    });
  });

  it("reads the version at the commit in question", () => {
    run({ event: "workflow_run", payload: RED_CI });
    expect(readFileSync(join(dir, "gh.txt"), "utf8")).toContain("contents/package.json?ref=abcdef1234567890");
  });

  it("twin: a version it can't read doesn't stop the post", () => {
    const { status, embed } = run({ event: "deployment_status", payload: DEPLOY, packageJson: null });
    expect(status).toBe(0);
    expect(embed().description).toBe("Version unknown, commit 60eea50");
  });

  it("can't ping anyone", () => {
    expect(run({ event: "release", payload: RELEASE }).sent().allowed_mentions).toEqual({ parse: [] });
  });

  it("asks Discord to confirm the message was saved", () => {
    run({ event: "release", payload: RELEASE });
    expect(readFileSync(join(dir, "url.txt"), "utf8")).toBe(`${SECRET}?wait=true`);
  });

  it("carries hostile text from an event as text", () => {
    const hostile = 'x"; touch pwned; echo "$(touch pwned2) `touch pwned3`';
    const { status, embed } = run({
      event: "workflow_run",
      payload: { workflow_run: { ...RED_CI.workflow_run, head_branch: hostile } },
    });
    expect(status).toBe(0);
    expect(embed().title).toBe(`Roster CI failed on ${hostile}`);
    const left = execFileSync("ls", [dir], { encoding: "utf8" });
    expect(left).not.toContain("pwned");
  });
});

describe("a message sent on demand", () => {
  const send = (message: string) => run({ event: "workflow_dispatch", payload: { inputs: { message } } });

  it.each([
    ["deploy", "Test: Roster Storybook deployed", GREEN, "https://roster-tan.vercel.app"],
    ["deploy-failed", "Test: Roster Storybook deploy failed", RED, "https://github.com/blakesteve/roster/actions/runs/42"],
    ["release", "Test: Roster released", GREEN, "https://github.com/blakesteve/roster/actions/runs/42"],
    ["ci-failed", "Test: Roster CI failed on main", RED, "https://github.com/blakesteve/roster/actions/runs/42"],
  ])("%s is the real shape, marked as a test", (message, title, color, url) => {
    expect(send(message).embed()).toMatchObject({ title, color, url });
  });

  it("offers every shape the script knows", () => {
    expect(WORKFLOW).toContain("options: [deploy, deploy-failed, release, ci-failed]");
  });

  it("refuses a message it doesn't know", () => {
    const { status, output } = send("nonsense");
    expect(status).not.toBe(0);
    expect(output).toContain("No message called nonsense");
  });
});

const pr = (title: string, merge: string, ref = "bb/thing", merged = "2026-11-07T10:00:00Z") => ({
  title,
  merge_commit_sha: merge,
  merged_at: merged,
  head: { ref },
});

/** This deploy is record 3. The last good one is at sha "old"; "new1" and "new2" have shipped since. */
const SINCE_OLD = {
  "deployments/3/statuses": [{ state: "success" }, { state: "in_progress" }],
  "deployments?environment": [{ id: 3, sha: SHA }, { id: 2, sha: "broken" }, { id: 1, sha: "old" }],
  "deployments/2/statuses": [{ state: "failure" }],
  "deployments/1/statuses": [{ state: "success" }],
  [`compare/old...${SHA}`]: { commits: [{ sha: "new1" }, { sha: "new2" }] },
};
const on = (extra: Partial<Run> & { event: string }) => run({ details: "on", ...extra });
const deployWith = (pulls: unknown[], extra: Api = {}) =>
  on({ event: "deployment_status", payload: DEPLOY, api: { ...SINCE_OLD, "pulls?state=closed": pulls, ...extra } });

describe("a deploy's details", () => {
  it("lists what merged since the last good deploy, newest first, skipping a failed one", () => {
    const { embed } = deployWith([
      pr("fix(a): first", "new1", "bb/a", "2026-11-06T10:00:00Z"),
      pr("feat(b): second", "new2", "bb/b", "2026-11-07T10:00:00Z"),
    ]);
    expect(embed().description).toBe(
      "Version 5.19.0, commit 60eea50\n\nMerged since the last deploy:\n• feat\\(b\\)\\: second\n• fix\\(a\\)\\: first",
    );
  });

  it("counts a deploy GitHub has since marked inactive as good", () => {
    const { embed } = deployWith([pr("kept", "new1")], {
      "deployments?environment": [{ id: 1, sha: "old" }],
      "deployments/1/statuses": [{ state: "inactive" }],
    });
    expect(embed().description).toContain("• kept");
  });

  it("says nothing extra on a redeploy, which adds a second success to the same record", () => {
    const { embed } = deployWith([pr("already posted", "new1")], {
      "deployments/3/statuses": [{ state: "success" }, { state: "in_progress" }, { state: "success" }],
    });
    expect(embed().description).toBe("Version 5.19.0, commit 60eea50");
  });

  it("says nothing extra on a redeploy that made a new record for the same commit", () => {
    const { embed } = deployWith([pr("already posted", "new1")], {
      "deployments?environment": [{ id: 3, sha: SHA }, { id: 2, sha: SHA }],
      "deployments/2/statuses": [{ state: "success" }],
      [`compare/${SHA}...${SHA}`]: { commits: [] },
    });
    expect(embed().description).toBe("Version 5.19.0, commit 60eea50");
  });

  it("twin: a commit whose first deploy failed still lists what it ships", () => {
    const { embed } = deployWith([pr("first good deploy", "new1")], {
      "deployments?environment": [{ id: 3, sha: SHA }, { id: 2, sha: SHA }, { id: 1, sha: "old" }],
    });
    expect(embed().description).toContain("• first good deploy");
  });

  it("compares with the deploy before this one, even if a newer one exists by the time it runs", () => {
    const { embed } = deployWith([pr("this one", "new1")], {
      "deployments?environment": [{ id: 4, sha: "later" }, { id: 3, sha: SHA }, { id: 2, sha: "broken" }, { id: 1, sha: "old" }],
    });
    expect(embed().description).toContain("• this one");
  });

  it.each(["dev-tools", "develop", "maintenance", "main-nav", "release-notes-page"])("keeps a feature branch that only starts like plumbing: %s", (ref) => {
    expect(deployWith([pr("real work", "new1", ref)]).embed().description).toContain("• real work");
  });

  it.each(["main", "release/5.19.0"])("twin: leaves out %s", (ref) => {
    expect(deployWith([pr("plumbing", "new1", ref)]).embed().description).toBe("Version 5.19.0, commit 60eea50");
  });

  it("copes with a PR whose branch is gone", () => {
    const { embed, output } = deployWith([{ ...pr("from a deleted fork", "new1"), head: { ref: null } }]);
    expect(embed().description).toContain("• from a deleted fork");
    expect(output).not.toContain("::warning::");
  });

  it("twin: leaves out PRs that shipped earlier, weren't merged, or only moved a release", () => {
    const { embed } = deployWith([
      pr("real change", "new1"),
      pr("shipped before", "older"),
      { ...pr("closed unmerged", "new2"), merged_at: null },
      pr("release 5.19.0", "new2", "release/5.19.0"),
    ]);
    expect(embed().description).toBe("Version 5.19.0, commit 60eea50\n\nMerged since the last deploy:\n• real change");
  });

  it("says nothing extra when nothing merged, as on a redeploy", () => {
    expect(deployWith([pr("elsewhere", "older")]).embed().description).toBe("Version 5.19.0, commit 60eea50");
  });

  it("says nothing extra when there's no earlier deploy to compare with", () => {
    const { status, embed } = on({
      event: "deployment_status",
      payload: DEPLOY,
      api: { "deployments/3/statuses": [{ state: "success" }], "deployments?environment": [{ id: 3, sha: SHA }] },
    });
    expect(status).toBe(0);
    expect(embed().description).toBe("Version 5.19.0, commit 60eea50");
  });

  it("caps the list at ten and says how many more", () => {
    const { embed } = deployWith(Array.from({ length: 13 }, (_, i) => pr(`pr ${i}`, "new1", "bb/a", `2026-11-07T10:00:${10 + i}Z`)));
    const lines = embed().description.split("\n");
    expect(lines.filter((l: string) => l.startsWith("• "))).toHaveLength(10);
    expect(lines.at(-1)).toBe("…and 3 more");
  });

  it("cuts a long title", () => {
    const line = deployWith([pr("a".repeat(300), "new1")]).embed().description.split("\n").at(-1);
    expect(line).toBe(`• ${"a".repeat(119)}…`);
  });

  it.each(["deployments/3/statuses", "deployments?environment", "deployments/1/statuses", `compare/old...${SHA}`, "pulls?state=closed"])(
    "still posts, with a warning, when %s doesn't answer",
    (path) => {
      const { status, embed, output } = deployWith([pr("x", "new1")], { [path]: null });
      expect(status).toBe(0);
      expect(embed().description).toBe("Version 5.19.0, commit 60eea50");
      expect(output).toContain("::warning::Posting without details");
    },
  );
});

describe("a release's details", () => {
  /* v5.19.0's notes as GitHub generated them, with a newcomer and a comment added. */
  const BODY = [
    "## What's Changed",
    "* build(meta): retry once before publish, split the LiquidTabs pin by @blakesteve in https://github.com/blakesteve/roster/pull/232",
    "* feat(tokens): add a scope for semantic tokens by @blakesteve in https://github.com/blakesteve/roster/pull/233",
    "* release 5.19.0 by @blakesteve in https://github.com/blakesteve/roster/pull/234",
    "- feat: by the book by @someone in https://github.com/blakesteve/roster/pull/1",
    "",
    "## New Contributors",
    "* @someone made their first contribution in https://github.com/blakesteve/roster/pull/1",
    "<!-- Release notes generated using configuration in .github/release.yml -->",
    "",
    "",
    "**Full Changelog**: https://github.com/blakesteve/roster/compare/v5.18.0...v5.19.0",
  ].join("\r\n");

  it("carries the notes, tidied, with a link to all of them", () => {
    const { embed } = on({ event: "release", payload: { release: { ...RELEASE.release, body: BODY } } });
    expect(embed().description).toBe(
      "Version 5.19.0, commit 60eea50\n\n" +
        "• build\\(meta\\)\\: retry once before publish, split the LiquidTabs pin\n" +
        "• feat\\(tokens\\)\\: add a scope for semantic tokens\n• feat\\: by the book\n\n" +
        `[Full notes](${RELEASE.release.html_url})`,
    );
  });

  it("keeps notes someone wrote by hand", () => {
    const { embed } = on({ event: "release", payload: { release: { ...RELEASE.release, body: "A quiet one.\n\nFixes the header." } } });
    expect(embed().description).toContain("• A quiet one.\n• Fixes the header.");
  });

  it("keeps a comment hidden on GitHub hidden, on one line or several", () => {
    const body = "<!-- one line -->\nFirst\n<!--\nsecret plan\n-->\nSecond";
    const { embed } = on({ event: "release", payload: { release: { ...RELEASE.release, body } } });
    expect(embed().description).toContain("• First\n• Second\n\n[Full notes]");
    expect(embed().description).not.toContain("secret");
  });

  it.each(["release 2 of the token scope", "release notes for the README", "thanks to the 5 who made their first contribution here"])(
    "keeps a title that only looks like plumbing: %s",
    (title) => {
      const { embed } = on({ event: "release", payload: { release: { ...RELEASE.release, body: `* ${title} by @x in https://github.com/o/r/pull/1` } } });
      expect(embed().description).toContain(`• ${title}`);
    },
  );

  it.each(["release 5.19.0", "Release 6.0.0", "chore: release v0.2.0"])("twin: leaves out %s", (title) => {
    const { embed } = on({ event: "release", payload: { release: { ...RELEASE.release, body: `* ${title} by @x in https://github.com/o/r/pull/1` } } });
    expect(embed().description).toBe("Version 5.19.0, commit 60eea50");
  });

  it("gets through a huge single line quickly, well inside the job's limit", () => {
    const started = Date.now();
    const { status, embed } = on({ event: "release", payload: { release: { ...RELEASE.release, body: "​".repeat(125000) + "x" } } });
    expect(status).toBe(0);
    expect(embed().title).toBe("Roster released");
    expect(Date.now() - started).toBeLessThan(20000);
  });

  it("twin: an empty release gets no empty link", () => {
    const { embed } = on({ event: "release", payload: { release: { ...RELEASE.release, body: "" } } });
    expect(embed().description).toBe("Version 5.19.0, commit 60eea50");
  });
});

const redWith = (jobs: unknown[]) =>
  on({ event: "workflow_run", payload: { workflow_run: { ...RED_CI.workflow_run, id: 7 } }, api: { "actions/runs/7/jobs": { jobs } } });
const step = (name: string, conclusion: string) => ({ name, conclusion });
/** The Storybook job as GitHub's API gave it for run 41499137051, a push to main, failed at the step `at`. */
const storybookFailed = (at = "Run Storybook tests with real input") => ({
  name: "Storybook Tests",
  conclusion: "failure",
  steps: [
    step("Set up job", "success"),
    step("Initialize containers", "success"),
    step("Run actions/checkout@v4", "success"),
    step("Run actions/setup-node@v4", "success"),
    step("Install dependencies", "success"),
    step("Run Storybook tests", "success"),
    step("Run Storybook tests under reduced motion", "success"),
    step(at, "failure"),
    step("Run accessibility-tree checks", "skipped"),
    step("Post Run actions/setup-node@v4", "skipped"),
    step("Post Run actions/checkout@v4", "success"),
    step("Stop containers", "success"),
    step("Complete job", "success"),
  ],
});
const passed = (name: string) => ({ name, conclusion: "success", steps: [step("Set up job", "success"), step("Complete job", "success")] });
/** CI's failed runs from pushes to main, as a test post asks for them. */
const CI_FAILURES = "actions/workflows/ci.yml/runs?branch=main&event=push&status=failure";
const testPost = (api: Api) => on({ event: "workflow_dispatch", payload: { inputs: { message: "ci-failed" } }, api });

describe("a failure's details", () => {
  it("red CI names each failed job and its failed step, as run 41499137051 failed", () => {
    const { embed } = redWith([passed("Unit Tests"), storybookFailed(), passed("Build")]);
    expect(embed().description).toBe("Version 5.19.0, commit abcdef1\n\nFailed:\n• Storybook Tests\\: Run Storybook tests with real input");
  });

  it("names only the failed steps of jobs that failed, a step stopped at its own timeout among them", () => {
    const { embed } = redWith([
      { name: "Unit Tests", conclusion: "failure", steps: [step("Lint", "failure"), step("Run unit tests", "skipped")] },
      storybookFailed("Run Storybook tests under reduced motion"),
      { name: "Build", conclusion: "failure", steps: [step("Build library", "failure")] },
      { name: "Allowed to fail", conclusion: "success", steps: [step("Flaky", "failure")] },
      { name: "Never", conclusion: "skipped" },
    ]);
    expect(embed().description).toBe(
      "Version 5.19.0, commit abcdef1\n\nFailed:\n• Unit Tests\\: Lint\n• Storybook Tests\\: Run Storybook tests under reduced motion\n• Build\\: Build library",
    );
  });

  it("twin: names the job alone when it failed outside any step, as in setup", () => {
    const inSetup = { name: "Storybook Tests", conclusion: "failure", steps: [step("Set up job", "success"), step("Install dependencies", "skipped")] };
    const noSteps = { name: "Build", conclusion: "failure" };
    expect(redWith([inSetup, noSteps]).embed().description).toBe("Version 5.19.0, commit abcdef1\n\nFailed:\n• Storybook Tests\n• Build");
  });

  it("a failed deploy gives what the deployment said, Vercel's real wording kept whole", () => {
    const description = "Deployment has failed — run this Vercel CLI command: npx vercel inspect dpl_X --logs";
    const { embed } = on({
      event: "deployment_status",
      payload: { deployment_status: { ...FAILED_DEPLOY.deployment_status, description } },
    });
    expect(embed().description).toBe(
      "Version 5.19.0, commit 60eea50\n\nFailed:\n• Deployment has failed — run this Vercel CLI command\\: npx vercel inspect dpl\\_X --logs",
    );
  });

  it("still posts red CI when the job list doesn't answer, with a warning", () => {
    const { status, embed, output } = on({
      event: "workflow_run",
      payload: { workflow_run: { ...RED_CI.workflow_run, id: 7 } },
      api: { "actions/runs/7/jobs": null },
    });
    expect(status).toBe(0);
    expect(embed()).toMatchObject({ title: "Roster CI failed on main", description: "Version 5.19.0, commit abcdef1" });
    expect(output).toContain("::warning::Posting without details");
  });

  it("caps the list at ten and says how many more", () => {
    const lines = redWith(Array.from({ length: 13 }, (_, i) => storybookFailed(`step ${i}`))).embed().description.split("\n");
    expect(lines.filter((l: string) => l.startsWith("• "))).toHaveLength(10);
    expect(lines.at(-1)).toBe("…and 3 more");
  });
});

describe("a detail sent on demand", () => {
  it("a release test reads the latest real release", () => {
    const { embed } = on({
      event: "workflow_dispatch",
      payload: { inputs: { message: "release" } },
      api: { "releases/latest": { body: "* a fix by @x in https://github.com/o/r/pull/1", html_url: "https://github.com/o/r/releases/tag/v1" } },
    });
    expect(embed().description).toContain("• a fix\n\n[Full notes](https://github.com/o/r/releases/tag/v1)");
  });

  it("a release test with no link gets no empty one", () => {
    const { embed } = on({ event: "workflow_dispatch", payload: { inputs: { message: "release" } }, api: { "releases/latest": { body: "* a fix" } } });
    expect(embed().description).toContain("• a fix");
    expect(embed().description).not.toContain("Full notes");
  });

  it("a release test that can't read the release warns", () => {
    const { status, output } = on({ event: "workflow_dispatch", payload: { inputs: { message: "release" } }, api: { "releases/latest": null } });
    expect(status).toBe(0);
    expect(output).toContain("::warning::Posting without details");
  });

  it("a red CI test reads CI's latest failure on a push to main, not the repo's, which could be this workflow's own", () => {
    const { embed } = testPost({
      [CI_FAILURES]: { workflow_runs: [{ id: 9 }] },
      "actions/runs?status=failure": { workflow_runs: [{ id: 8 }] },
      "actions/runs/8/jobs": { jobs: [{ name: "Post to Discord", conclusion: "failure" }] },
      "actions/runs/9/jobs": { jobs: [storybookFailed()] },
    });
    expect(embed().description).toBe(`Version 5.19.0, commit ${SHA.slice(0, 7)}\n\nFailed:\n• Storybook Tests\\: Run Storybook tests with real input`);
  });

  it("twin: a red CI test with no failed CI run posts the version alone, with no warning and no jobs asked for", () => {
    const { status, embed, output } = testPost({ [CI_FAILURES]: { workflow_runs: [] } });
    expect(status).toBe(0);
    expect(embed().description).toBe(`Version 5.19.0, commit ${SHA.slice(0, 7)}`);
    expect(output).not.toContain("::warning::");
    expect(asked().filter((line) => !line.includes("contents/package.json"))).toEqual([`api repos/blakesteve/roster/${CI_FAILURES}&per_page=1`]);
  });

  it("twin: a red CI test whose query for CI's failures doesn't answer still posts, with a warning", () => {
    const { status, output } = testPost({ [CI_FAILURES]: null });
    expect(status).toBe(0);
    expect(output).toContain("::warning::Posting without details");
  });
});

describe("hostile text in a detail", () => {
  const shown = (title: string) => deployWith([pr(title, "new1")]).embed().description.split("\n").at(-1);

  it.each([
    ["a link that says anything", "[Free Nitro](https://evil.test)", "• \\[Free Nitro\\]\\(https\\://evil.test\\)"],
    ["a mention", "@everyone <@123> <@&456> <#789>", "• \\@everyone \\<\\@123\\> \\<\\@&456\\> \\<\\#789\\>"],
    ["formatting", "**bold** __u__ ~~s~~ ||spoiler|| `code`", "• \\*\\*bold\\*\\* \\_\\_u\\_\\_ \\~\\~s\\~\\~ \\|\\|spoiler\\|\\| \\`code\\`"],
    ["a block at the start of a line", "> quote", "• \\> quote"],
    ["a backslash meant to undo the escape", "\\[x](y)", "• \\\\\\[x\\]\\(y\\)"],
    ["text that reverses itself", "safe‮gnp.exe", "• safegnp.exe"],
    ["a control character", "one\u0007two", "• onetwo"],
    ["a line separator faking a second bullet", "ok • Bogus", "• ok• Bogus"],
    ["a paragraph separator", "ok second", "• oksecond"],
  ])("%s", (_name, title, expected) => {
    expect(shown(title)).toBe(expected);
  });

  it("a job or step name is text too", () => {
    const { embed } = redWith([{ name: "[Job](https://evil.test)", conclusion: "failure", steps: [step("@everyone", "failure")] }]);
    expect(embed().description.split("\n").at(-1)).toBe("• \\[Job\\]\\(https\\://evil.test\\)\\: \\@everyone");
  });

  it("never runs as code, wherever it comes in", () => {
    const hostile = 'x"; touch pwned; echo "$(touch pwned2) `touch pwned3` \' $(touch pwned4)';
    expect(deployWith([pr(hostile, "new1")]).status).toBe(0);
    expect(on({ event: "release", payload: { release: { ...RELEASE.release, body: `* ${hostile}` } } }).status).toBe(0);
    expect(redWith([{ name: hostile, conclusion: "failure", steps: [step(hostile, "failure")] }]).status).toBe(0);
    expect(execFileSync("ls", [dir], { encoding: "utf8" })).not.toContain("pwned");
  });

  it("stays inside Discord's limit at the worst case, where every character needs escaping", () => {
    const { embed, sent } = deployWith(Array.from({ length: 30 }, () => pr("*".repeat(500), "new1")));
    expect(embed().description.length).toBeLessThan(4096);
    expect(sent().allowed_mentions).toEqual({ parse: [] });
  });
});

describe("the version and link, with details on or off", () => {
  it.each([
    ["a tag holding a mention", { release: { ...RELEASE.release, tag_name: "v<@123>" } }],
    ["a tag holding formatting", { release: { ...RELEASE.release, tag_name: "v||x||" } }],
  ])("%s reads as unknown", (_name, payload) => {
    expect(run({ event: "release", payload }).embed().description).toBe("Version unknown, commit 60eea50");
  });

  it.each([
    ["a link", "[Free Nitro](https://evil.test)"],
    ["a heading on a new line", "1.0\\n\\n# Heading"],
  ])("a package version holding %s reads as unknown", (_name, version) => {
    const { embed } = run({ event: "deployment_status", payload: DEPLOY, packageJson: `{"version":"${version}"}` });
    expect(embed().description).toBe("Version unknown, commit 60eea50");
  });

  it("an absurdly long version is cut, so it can't lose the post", () => {
    const { embed } = run({ event: "deployment_status", payload: DEPLOY, packageJson: `{"version":"${"1".repeat(5000)}"}` });
    expect(embed().description).toBe(`Version ${"1".repeat(40)}, commit 60eea50`);
  });

  it("twin: a real version with a prerelease and build survives", () => {
    const { embed } = run({ event: "release", payload: { release: { ...RELEASE.release, tag_name: "v1.2.3-rc.1+b5" } } });
    expect(embed().description).toBe("Version 1.2.3-rc.1+b5, commit 60eea50");
  });

  it.each(["javascript:alert(1)", "not a url", "ftp://x.test", "http://x.test"])("a link of %s falls back to the run, so Discord can't refuse the post", (target_url) => {
    const { embed } = run({ event: "deployment_status", payload: { deployment_status: { ...FAILED_DEPLOY.deployment_status, target_url } } });
    expect(embed().url).toBe("https://github.com/blakesteve/roster/actions/runs/42");
  });
});

describe("with details off", () => {
  it.each([
    ["a deploy", "deployment_status", DEPLOY],
    ["a failed deploy", "deployment_status", { deployment_status: { ...FAILED_DEPLOY.deployment_status, description: "Secret build error" } }],
    ["a release", "release", { release: { ...RELEASE.release, body: "* a private title by @x in https://github.com/o/r/pull/1" } }],
    ["red CI", "workflow_run", { workflow_run: { ...RED_CI.workflow_run, id: 7 } }],
  ])("%s carries the version and commit, and asks GitHub for nothing else", (_name, event, payload) => {
    const { embed } = run({ event, payload, details: "off" });
    expect(embed().description).toMatch(/^Version [\d.]+, commit [0-9a-f]{7}$/);
    expect(asked().every((line) => line.includes("contents/package.json"))).toBe(true);
  });

  it("is what a copy gets if the setting is missing", () => {
    const { embed } = run({ event: "release", payload: { release: { ...RELEASE.release, body: "* private" } }, details: "" });
    expect(embed().description).toBe("Version 5.19.0, commit 60eea50");
  });
});

describe("a failed post", () => {
  it.each([
    ["refused", "403", '{"message":"Missing Access"}'],
    ["rate limited", "429", '{"message":"You are being rate limited."}'],
    ["a server error", "500", "oops"],
  ])("fails the job when Discord's answer is %s", (_name, httpCode, response) => {
    const { status, output } = run({ event: "release", payload: RELEASE, httpCode, response });
    expect(status).not.toBe(0);
    expect(output).toContain(`::error::Discord didn't save the message (status ${httpCode})`);
  });

  it("fails on a success code with no saved message, which is all a 204 is", () => {
    expect(run({ event: "release", payload: RELEASE, httpCode: "204", response: "" }).status).not.toBe(0);
    expect(run({ event: "release", payload: RELEASE, httpCode: "200", response: "{}" }).status).not.toBe(0);
  });

  it("fails on any status but 200, even with an id in the answer", () => {
    expect(run({ event: "release", payload: RELEASE, httpCode: "500", response: '{"id":"999"}' }).status).not.toBe(0);
  });

  it("twin: a saved message passes, and the log has the status and the id", () => {
    const { status, output } = run({ event: "release", payload: RELEASE });
    expect(status).toBe(0);
    expect(output).toContain("Discord answered 200");
    expect(output).toContain("Saved as message 999");
  });
});

describe("the webhook", () => {
  it("is skipped cleanly when it isn't set, for a fork or a new repo", () => {
    const { status, output } = run({ event: "release", payload: RELEASE, webhook: "" });
    expect(status).toBe(0);
    expect(output).toContain("::notice::DISCORD_WEBHOOK_URL isn't set");
    expect(() => readFileSync(join(dir, "url.txt"))).toThrow();
  });

  it.each([
    ["a post", {}],
    ["a refused post", { httpCode: "403", response: "{}" }],
  ])("never appears in the log of %s", (_name, extra) => {
    expect(run({ event: "release", payload: RELEASE, ...extra }).output).not.toContain("not-a-real-token");
  });
});
