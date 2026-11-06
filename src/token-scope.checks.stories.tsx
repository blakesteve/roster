import type { CSSProperties, HTMLAttributes } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Eyebrow } from "./components/atoms/Eyebrow/Eyebrow";
import { Select } from "./components/atoms/Select/Select";
import { Tabs, type TabItem } from "./components/molecules/Tabs/Tabs";
import { Timeline, type TimelineStep } from "./components/molecules/Timeline/Timeline";

/**
 * `data-roster-scope`, read in Chromium and WebKit from computed values.
 *
 * - **A scope re-derives what a wrapper can't:** a subtree with the attribute
 *   and its own ramp resolves `--roster-tabs-indicator` from that ramp, and a
 *   rendered Tabs and Timeline paint it. The twin: the same subtree without
 *   the attribute keeps the page's.
 * - **Every deriving block carries it.** The blocks are walked in the live
 *   stylesheet rather than listed, so a new one without the selector fails.
 * - **`.dark` on the scope wins,** from the scope's own ramps. Walked too, so a
 *   `.dark` block moved ahead of its own fails.
 * - **A scope owns its state:** in a dark page, or a dark region, one with no
 *   `.dark` of its own resets to light, all but the two blocks that read no
 *   ramp. With `.dark` it stays dark.
 * - **Nested scopes** derive from the ramps in force at each.
 * - **What it doesn't do:** it doesn't cross a portal, it doesn't stop `dark:`
 *   variants firing, and a token set at `:root` stops at it.
 * - **No change without the attribute:** all 43 tokens on `:root`, light and
 *   dark, against 5.18.0's values, read from the published `dist` in both
 *   engines. Those are literals on purpose, so this can't compare a build with
 *   itself.
 *
 * Tagged `real-input` for its project: that's the one with WebKit, and it runs
 * a file at a time, which a `.dark` set on `<html>` needs.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Token scope/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each token's computed value on `:root` in 5.18.0: light, then dark. */
const PUBLISHED: [token: string, light: string, dark: string][] = [
  ["--roster-ring", "#0f6498", "#5ea3de"],
  ["--roster-ring-offset", "#ffffff", "#0c0a09"],
  ["--roster-card-bg", "#ffffff", "#1c1917"],
  ["--roster-card-border", "#e7e5e4", "#292524"],
  ["--roster-card-text", "#1c1917", "#f5f5f4"],
  ["--roster-footer-bg", "#fafaf9", "color-mix(in srgb, #1c1917 50%, transparent)"],
  ["--roster-footer-border", "#e7e5e4", "#292524"],
  ["--roster-footer-text", "#65635f", "#a8a29e"],
  ["--roster-nav-bg", "#ffffff", "#0c0a09"],
  ["--roster-nav-border", "#e7e5e4", "#292524"],
  ["--roster-nav-text", "#1c1917", "#f5f5f4"],
  ["--roster-lt-bg", "#ffffff", "#292524"],
  ["--roster-lt-border", "#e7e5e4", "#44403c"],
  ["--roster-lt-pill", "#0f6498", "#0f6498"],
  ["--roster-lt-text-inactive", "#65635f", "#a8a29e"],
  ["--roster-lt-text-hover", "#1c1917", "#f5f5f4"],
  ["--roster-lt-text-active", "#ffffff", "#ffffff"],
  ["--roster-tabs-border", "#e7e5e4", "#292524"],
  ["--roster-tabs-text", "#65635f", "#a8a29e"],
  ["--roster-tabs-text-hover", "#1c1917", "#f5f5f4"],
  ["--roster-tabs-text-active", "#1c1917", "#f5f5f4"],
  ["--roster-tabs-indicator", "#0f6498", "#5ea3de"],
  ["--roster-tabs-indicator-hover", "#d6d3d1", "#57534e"],
  ["--roster-tile-border", "#65635f", "#a8a29e"],
  ["--roster-tile-bg", "transparent", "transparent"],
  ["--roster-tile-border-checked", "#0f6498", "#5ea3de"],
  ["--roster-tile-bg-checked", "#f2f8fc", "color-mix(in oklab, #021724 60%, transparent)"],
  ["--roster-timeline-rail", "#e7e5e4", "#44403c"],
  ["--roster-timeline-rail-done", "#0a4f7a", "#5ea3de"],
  ["--roster-timeline-now", "#0f6498", "#5ea3de"],
  ["--roster-shimmer-base", "#084063", "#5ea3de"],
  ["--roster-shimmer-highlight", "#9bcce9", "#ffffff"],
  ["--roster-skeleton", "#e7e5e4", "#44403c"],
  ["--roster-skeleton-highlight", "#f5f5f4", "#57534e"],
  ["--roster-scrollbar-thumb", "#d6d3d1", "#44403c"],
  ["--roster-scrollbar-track", "transparent", "transparent"],
  ["--roster-control-border", "#65635f", "#a8a29e"],
  ["--roster-control-bg", "transparent", "transparent"],
  ["--roster-control-text", "#1c1917", "#f5f5f4"],
  ["--roster-control-border-focus", "#0f6498", "#5ea3de"],
  ["--roster-popover-bg", "#ffffff", "#292524"],
  ["--roster-popover-border", "#e7e5e4", "#44403c"],
  ["--roster-popover-text", "#1c1917", "#f5f5f4"],
];

const LIGHT = Object.fromEntries(PUBLISHED.map(([token, light]) => [token, light]));
const DARK = Object.fromEntries(PUBLISHED.map(([token, , dark]) => [token, dark]));

/* The minified stylesheet and the dev server space a `color-mix()` differently. */
const plain = (value: string) => value.replace(/\/\*.*?\*\/|\s+/g, "");
const read = (element: Element, token: string) => getComputedStyle(element).getPropertyValue(token).trim();
const readAll = (element: Element, tokens: string[]) => Object.fromEntries(tokens.map((token) => [token, plain(read(element, token))]));
const plainly = (values: Record<string, string>) => Object.fromEntries(Object.entries(values).map(([token, value]) => [token, plain(value)]));

function styleRules(): CSSStyleRule[] {
  const found: CSSStyleRule[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      /* Not into a style rule: what's nested there is a utility's variant. */
      if (rule instanceof CSSStyleRule) found.push(rule);
      else if ("cssRules" in rule) walk(rule.cssRules as CSSRuleList);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
  return found;
}

const tokensIn = (rule: CSSStyleRule) => Array.from(rule.style).filter((name) => name.startsWith("--roster-"));
const derives = (rule: CSSStyleRule, token: string) => rule.style.getPropertyValue(token).includes("var(--roster-");
const derived = (rule: CSSStyleRule) => tokensIn(rule).filter((token) => derives(rule, token));

/**
 * The live stylesheet's blocks that derive a token from a ramp: the `.dark`
 * ones, or everything else but Roster's utilities. Any selector at all, so a
 * block written on `html` is found and fails too.
 */
const derivingBlocks = (scheme: "light" | "dark") =>
  styleRules().filter(
    (rule) => derived(rule).length > 0 && !rule.selectorText.startsWith(".rst\\:") && (rule.selectorText === ".dark") === (scheme === "dark"),
  );

/** Every ramp step in `tokens.css`, each with a value no real ramp has. */
function markedRamps() {
  const steps = styleRules()
    .filter((rule) => rule.selectorText === ":root")
    .flatMap((rule) => tokensIn(rule).filter((token) => /^#[0-9a-f]{6}$/i.test(rule.style.getPropertyValue(token).trim())));
  return Object.fromEntries(steps.map((step, index) => [step, `#${(index + 1).toString(16).padStart(6, "0")}`]));
}

/** Runs `then` on a page with `.dark` on `<html>`. */
function onADarkPage<T>(then: () => T): T {
  const root = document.documentElement;
  root.classList.add("dark");
  try {
    return then();
  } finally {
    root.classList.remove("dark");
  }
}

const at = (name: string) => document.querySelector(`[data-check="${name}"]`)!;
const Probe = ({ name, ...rest }: { name: string } & HTMLAttributes<HTMLDivElement> & { "data-roster-scope"?: string }) => (
  <div data-check={name} {...rest} />
);

const VIOLET = { "--roster-primary-400": "#a78bfa", "--roster-primary-500": "#7c3aed", "--roster-primary-600": "#6d28d9" } as CSSProperties;
const TEAL = { "--roster-primary-500": "#0d9488" } as CSSProperties;

export const ResolvesTheIndicatorFromTheScopesRamp: Story = {
  render: () => (
    <>
      <Probe name="scoped" data-roster-scope="" style={VIOLET} />
      <Probe name="wrapper" style={VIOLET} />
    </>
  ),
  play: async () => {
    await expect(read(at("scoped"), "--roster-tabs-indicator")).toBe("#7c3aed");
    await expect(read(at("wrapper"), "--roster-tabs-indicator")).toBe("#0f6498");
  },
};

/* Every deriving token, from every block, with every ramp marked. */
export const EveryBlockCarriesTheScope: Story = {
  render: () => {
    const ramps = markedRamps() as CSSProperties;
    return (
      <>
        <Probe name="scoped" data-roster-scope="" style={ramps} />
        <Probe name="wrapper" style={ramps} />
      </>
    );
  },
  play: async () => {
    const blocks = derivingBlocks("light");
    const tokens = blocks.flatMap(derived);
    const marks = new Set(Object.values(markedRamps()));

    /* A walk that found nothing would pass everything below. */
    await expect(marks.size).toBeGreaterThan(90);
    await expect(blocks.length).toBeGreaterThanOrEqual(12);
    await expect(tokens.length).toBeGreaterThanOrEqual(40);

    await expect(blocks.filter((block) => block.selectorText !== ":root, [data-roster-scope]").map(tokensIn)).toEqual([]);
    await expect(tokens.filter((token) => !marks.has(read(at("scoped"), token)))).toEqual([]);
    await expect(tokens.filter((token) => read(at("wrapper"), token) !== read(document.documentElement, token))).toEqual([]);
  },
};

const noop = () => {};
const TABS: TabItem[] = [
  { id: "one", label: "One" },
  { id: "two", label: "Two" },
];
const STEPS: TimelineStep[] = [
  { id: "a", title: "First" },
  { id: "b", title: "Second" },
  { id: "c", title: "Third" },
];
const Region = ({ name, scoped }: { name: string; scoped?: boolean }) => (
  <div data-check={name} {...(scoped ? { "data-roster-scope": "" } : {})} style={VIOLET}>
    <Tabs tabs={TABS} activeTab="one" onChange={noop} aria-label={name} />
    <Timeline steps={STEPS} current={3} nowBefore={3} label={`${name} steps`} />
  </div>
);

const painted = (name: string) => {
  const region = at(name);
  return {
    underline: getComputedStyle(region.querySelector('[role="tab"][aria-selected="true"]')!, "::after").borderBottomColor,
    rail: getComputedStyle(region.querySelector('[data-timeline-rail="done"]')!).backgroundColor,
    now: getComputedStyle(region.querySelector("[data-timeline-now] > span:last-child")!).backgroundColor,
  };
};

export const TabsAndTimelinePaintTheScopesColor: Story = {
  render: () => (
    <>
      <Region name="scoped" scoped />
      <Region name="wrapper" />
    </>
  ),
  play: async () => {
    await expect(painted("scoped")).toEqual({ underline: "rgb(124, 58, 237)", rail: "rgb(109, 40, 217)", now: "rgb(124, 58, 237)" });
    await expect(painted("wrapper")).toEqual({ underline: "rgb(15, 100, 152)", rail: "rgb(10, 79, 122)", now: "rgb(15, 100, 152)" });
  },
};

/* An element with both takes the dark values, from its own ramps. `.dark`
   alone re-derives too, so it's the walk's yardstick: anything else means a
   light block won. The token `.dark` leaves out is what the scope adds. */
export const DarkOnTheScopeWins: Story = {
  render: () => {
    const ramps = markedRamps() as CSSProperties;
    return (
      <>
        <Probe name="literal" data-roster-scope="" className="dark" style={VIOLET} />
        <Probe name="both" data-roster-scope="" className="dark" style={ramps} />
        <Probe name="dark" className="dark" style={ramps} />
      </>
    );
  },
  play: async () => {
    const blocks = derivingBlocks("dark");
    const tokens = blocks.flatMap(tokensIn);
    await expect(blocks.length).toBeGreaterThanOrEqual(12);

    await expect(read(at("literal"), "--roster-tabs-indicator")).toBe("#a78bfa");
    await expect(tokens.filter((token) => read(at("both"), token) !== read(at("dark"), token))).toEqual([]);

    const white = markedRamps()["--roster-white"];
    await expect(read(at("both"), "--roster-lt-text-active")).toBe(white);
    await expect(read(at("dark"), "--roster-lt-text-active")).toBe("#ffffff");
  },
};

const tokens = PUBLISHED.map(([token]) => token);

/* A scope owns its state. Sheet timing and elevation read no ramp, so they
   carry no scope and it inherits the page's dark values for them. */
async function resetsToLight(scope: Element, kept: Element, around: Element) {
  await expect(readAll(around, tokens)).toEqual(plainly(DARK));
  await expect(readAll(scope, tokens)).toEqual(plainly(LIGHT));
  await expect(readAll(kept, tokens)).toEqual(plainly(DARK));
  await expect(plain(read(scope, "--roster-sheet-backdrop"))).toBe(plain("rgb(0 0 0 / 0.8)"));
  await expect(read(scope, "--roster-elevation-raised")).toBe(read(around, "--roster-elevation-raised"));
  await expect(read(scope, "--roster-elevation-raised")).toContain("0.7");
}

export const AScopeInADarkPageResetsToLight: Story = {
  render: () => (
    <>
      <Probe name="around" />
      <Probe name="scope" data-roster-scope="" />
      <Probe name="kept" data-roster-scope="" className="dark" />
    </>
  ),
  play: async () => {
    const root = document.documentElement;
    root.classList.add("dark");
    try {
      await resetsToLight(at("scope"), at("kept"), at("around"));
    } finally {
      root.classList.remove("dark");
    }
  },
};

export const AScopeInADarkRegionResetsToLight: Story = {
  render: () => (
    <Probe name="around" className="dark">
      <Probe name="scope" data-roster-scope="" />
      <Probe name="kept" data-roster-scope="" className="dark" />
    </Probe>
  ),
  play: async () => {
    await resetsToLight(at("scope"), at("kept"), at("around"));
  },
};

export const NestedScopesDeriveWhereTheyStand: Story = {
  render: () => (
    <Probe name="outer" data-roster-scope="" style={VIOLET}>
      <Probe name="inner" data-roster-scope="" style={TEAL}>
        <Probe name="inside inner" />
      </Probe>
      <Probe name="inner, no ramp" data-roster-scope="" />
      <Probe name="wrapper, own ramp" style={TEAL} />
    </Probe>
  ),
  play: async () => {
    const indicator = (name: string) => read(at(name), "--roster-tabs-indicator");
    await expect(indicator("outer")).toBe("#7c3aed");
    await expect(indicator("inner")).toBe("#0d9488");
    await expect(indicator("inside inner")).toBe("#0d9488");
    await expect(indicator("inner, no ramp")).toBe("#7c3aed");
    await expect(indicator("wrapper, own ramp")).toBe("#7c3aed");
  },
};

/* The ramps in force, not only the ramps on the element. */
export const AScopeTakesARampSetAboveIt: Story = {
  render: () => (
    <div style={VIOLET}>
      <Probe name="scope" data-roster-scope="" />
    </div>
  ),
  play: async () => {
    await expect(read(at("scope"), "--roster-tabs-indicator")).toBe("#7c3aed");
  },
};

/* The scope re-declares its tokens, so a value set for the page stops there. */
export const ATokenSetAtTheRootStopsAtTheScope: Story = {
  render: () => (
    <>
      <Probe name="page" />
      <Probe name="scope" data-roster-scope="" />
      <Probe name="set on it" data-roster-scope="" style={{ "--roster-tabs-indicator": "rgb(4, 5, 6)" } as CSSProperties} />
    </>
  ),
  play: async () => {
    const root = document.documentElement;
    root.style.setProperty("--roster-tabs-indicator", "rgb(1, 2, 3)");
    try {
      await expect(read(at("page"), "--roster-tabs-indicator")).toBe("rgb(1, 2, 3)");
      await expect(read(at("scope"), "--roster-tabs-indicator")).toBe("#0f6498");
      await expect(read(at("set on it"), "--roster-tabs-indicator")).toBe("rgb(4, 5, 6)");
    } finally {
      root.style.removeProperty("--roster-tabs-indicator");
    }
  },
};

/* `dark:` keys on `.dark` above it, and a scope can't undo that: gray-400 in
   a dark page, scope or no scope, gray-500 in a light one. */
export const DarkVariantsStillFire: Story = {
  render: () => (
    <Probe name="scope" data-roster-scope="">
      <Eyebrow tone="faint">Label</Eyebrow>
    </Probe>
  ),
  play: async () => {
    const color = () => getComputedStyle(at("scope").firstElementChild!).color;
    await expect(color()).toBe("rgb(101, 99, 95)");
    await expect(onADarkPage(color)).toBe("rgb(168, 162, 158)");
  },
};

/* The panel renders at `<body>`, outside the scope, so it takes the page's
   surface. The twin: the scope itself has its own. */
export const AScopeDoesNotCrossAPortal: Story = {
  render: () => (
    <Probe name="scope" data-roster-scope="" style={{ "--roster-white": "#fde68a", width: 240 } as CSSProperties}>
      <Select label="Region" options={[{ value: "a", label: "Alpha" }]} value={null} onChange={noop} />
    </Probe>
  ),
  play: async () => {
    const scope = at("scope");
    await expect(read(scope, "--roster-popover-bg")).toBe("#fde68a");

    await userEvent.click(within(scope as HTMLElement).getByRole("button", { name: /Region/ }));
    const panel = await within(document.body).findByRole("listbox");
    await expect(scope.contains(panel)).toBe(false);
    const surface = panel.matches('[class*="roster-popover-bg"]') ? panel : panel.querySelector('[class*="roster-popover-bg"]')!;
    await expect(getComputedStyle(surface).backgroundColor).toBe("rgb(255, 255, 255)");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("listbox")).toBeNull());
  },
};

/* No attribute anywhere, so the page must read as it did. */
export const NoChangeWithoutTheAttribute: Story = {
  render: () => <Probe name="page" />,
  play: async () => {
    const root = document.documentElement;
    await expect(PUBLISHED).toHaveLength(43);
    await expect(readAll(root, tokens)).toEqual(plainly(LIGHT));
    await expect(onADarkPage(() => readAll(root, tokens))).toEqual(plainly(DARK));
  },
};
