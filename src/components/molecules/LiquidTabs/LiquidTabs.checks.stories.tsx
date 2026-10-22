import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { LiquidTabs, type TabItem } from "./LiquidTabs";
import { LiquidTabPanel } from "./LiquidTabPanel";
import { Button } from "../../atoms/Button/Button";
import { contrast, paint } from "../../../test/painted";
import { realInputOrSkip } from "../../../test/real-input";
import { settled } from "../../../test/settle";

/**
 * Counts on tabs, and the panel, checked rendered.
 *
 * - **The pill follows a count that widens a tab,** in Chromium and WebKit:
 *   the selected tab moves when a count before it grows, and widens when its
 *   own does, and the pill lands on it each time. The twin is the move
 *   itself: the selected tab really moved, so the pill matching it isn't a
 *   pill that never had to go anywhere.
 * - **The pill follows tabs that trade width:** one count loses a digit as
 *   the selected one gains it, so the strip keeps its width and only the
 *   tabs' own sizes change. The twin: the strip really held its width, and
 *   the selected tab really moved.
 * - **A count reads on every state:** at rest, selected and hovered, on both
 *   variants, in light and dark, its number clears 4.5:1 against its mark,
 *   painted over what's actually behind it. The twin: the mark's fill shows
 *   (it isn't the bare ground), so it's a mark and not a loose number.
 * - **The names, from the accessibility tree:** a counted tab is "Open, 12
 *   items", its panel is named for it, and an uncounted tab is just its label.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/LiquidTabs/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const box = (el: Element) => el.getBoundingClientRect();
const frames = async (n = 3) => {
  for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r));
};

function Growing() {
  const [counts, setCounts] = useState({ a: 1, b: 2, c: 3 });
  const tabs: TabItem[] = [
    { id: "a", label: "Alpha", count: counts.a },
    { id: "b", label: "Beta", count: counts.b },
    { id: "c", label: "Gamma", count: counts.c },
  ];
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <LiquidTabs aria-label="Growing" tabs={tabs} activeTab="c" onChange={() => {}} />
      <Button onClick={() => setCounts((c) => ({ ...c, a: 12345 }))}>Grow the first count</Button>
      <Button onClick={() => setCounts((c) => ({ ...c, c: 98765 }))}>Grow the selected count</Button>
    </div>
  );
}

export const ThePillFollowsACountThatWidensATab: Story = {
  tags: ["real-input"],
  render: () => <Growing />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pill = canvasElement.querySelector<HTMLElement>('[data-testid="liquid-tabs-pill"]')!;
    const selected = () => canvas.getByRole("tab", { selected: true });
    /* The pill on the selected tab, to the pixel. */
    const fit = () => {
      const p = box(pill);
      const t = box(selected());
      return [Math.abs(p.left - t.left) < 1, Math.abs(p.width - t.width) < 1];
    };
    await waitFor(() => expect(fit()).toEqual([true, true]));
    const before = box(selected());

    /* A count before it grows: the selected tab moves right, and the pill with it. */
    canvas.getByRole("button", { name: "Grow the first count" }).click();
    await frames();
    await waitFor(() => expect(fit()).toEqual([true, true]));
    const moved = box(selected()).left - before.left;

    /* Its own count grows: the selected tab widens, and so does the pill. */
    canvas.getByRole("button", { name: "Grow the selected count" }).click();
    await frames();
    await waitFor(() => expect(fit()).toEqual([true, true]));
    const widened = box(selected()).width - before.width;

    console.info(`LIQUID COUNT pill | moved ${moved.toFixed(1)}px, widened ${widened.toFixed(1)}px`);
    /* The twin: the tab really moved and really widened. */
    await expect([moved > 10, widened > 10]).toEqual([true, true]);
  },
};

/* One item moves from Open to Done: Open loses a digit and Done gains one.
   The digits are tabular, so the strip keeps its width to the pixel and only
   the tabs inside it change: the case the strip's own size can't report. */
function Trading() {
  const [moved, setMoved] = useState(false);
  const tabs: TabItem[] = [
    { id: "open", label: "Open", count: moved ? 9999 : 10000 },
    { id: "done", label: "Done", count: moved ? 100000 : 99999 },
  ];
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <LiquidTabs aria-label="Trading" tabs={tabs} activeTab="done" onChange={() => {}} />
      <Button onClick={() => setMoved(true)}>Move one across</Button>
    </div>
  );
}

export const ThePillFollowsTabsThatTradeWidth: Story = {
  tags: ["real-input"],
  render: () => <Trading />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const strip = canvas.getByRole("tablist");
    const pill = canvasElement.querySelector<HTMLElement>('[data-testid="liquid-tabs-pill"]')!;
    const done = canvas.getByRole("tab", { selected: true });
    const fit = () => {
      const p = box(pill);
      const t = box(done);
      return [Math.abs(p.left - t.left) < 1, Math.abs(p.width - t.width) < 1];
    };
    /* Fonts arriving re-measure the pill too: let that happen first, so only
       the tabs' own sizes can move it after the trade. */
    await document.fonts.ready;
    await frames();
    await waitFor(() => expect(fit()).toEqual([true, true]));
    const [stripBefore, before] = [box(strip), box(done)];

    canvas.getByRole("button", { name: "Move one across" }).click();
    await frames();
    await waitFor(() => expect(fit()).toEqual([true, true]));
    const [stripAfter, after] = [box(strip), box(done)];

    const grew = stripAfter.width - stripBefore.width;
    const moved = after.left - before.left;
    const widened = after.width - before.width;
    console.info(`LIQUID COUNT trade | strip ${grew.toFixed(2)}px, selected moved ${moved.toFixed(1)}px, widened ${widened.toFixed(1)}px`);
    /* The twin: the strip held its width while the selected tab really moved
       left and widened, so only the tabs' own sizes said anything changed. */
    await expect([Math.abs(grew) < 0.5, moved < -3, widened > 3]).toEqual([true, true, true]);
  },
};

const STATES: TabItem[] = [
  { id: "open", label: "Open", count: 12 },
  { id: "done", label: "Done", count: 0 },
];

function Strips() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {(["light", "dark"] as const).map((scheme) => (
        <div key={scheme} className={scheme === "dark" ? "dark" : undefined} data-scheme={scheme} style={{ display: "grid", gap: 12, padding: 16, background: scheme === "dark" ? "#0c0a09" : "#ffffff" }}>
          <LiquidTabs aria-label={`${scheme} pill`} tabs={STATES} activeTab="open" onChange={() => {}} variant="pill" />
          <LiquidTabs aria-label={`${scheme} filled`} tabs={STATES} activeTab="open" onChange={() => {}} variant="filled" size="lg" />
        </div>
      ))}
    </div>
  );
}

/* The fills behind a tab's mark, bottom to top: the strip, the pill under a
   selected tab, then the mark's own tint. */
function ground(strip: Element, tab: Element) {
  const layers = [getComputedStyle(strip).backgroundColor];
  if (tab.getAttribute("aria-selected") === "true") layers.push(getComputedStyle(strip.querySelector('[data-testid="liquid-tabs-pill"]')!).backgroundColor);
  return layers;
}

export const ACountReadsOnEveryState: Story = {
  tags: ["real-input"],
  render: () => <Strips />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const rows: [string, number, number][] = [];
    const read = (label: string, strip: Element, tab: Element) => {
      const mark = tab.querySelector("[data-tab-count]")!;
      const under = paint(ground(strip, tab));
      const withMark = paint([...ground(strip, tab), getComputedStyle(mark).backgroundColor]);
      const ink = paint([...ground(strip, tab), getComputedStyle(mark).backgroundColor, getComputedStyle(mark).color]);
      rows.push([label, Number(contrast(ink, withMark).toFixed(2)), Number(contrast(withMark, under).toFixed(3))]);
    };
    await frames();
    for (const strip of document.querySelectorAll<HTMLElement>('[role="tablist"]')) {
      const name = strip.getAttribute("aria-label")!;
      const [open, done] = within(strip).getAllByRole("tab");
      read(`${name}, selected`, strip, open);
      read(`${name}, at rest`, strip, done);
      done.setAttribute("data-check", `${name.replace(" ", "-")}-done`);
      await real.commands.realHover(`[data-check="${name.replace(" ", "-")}-done"]`);
      await new Promise((r) => setTimeout(r, 50));
      await settled(done);
      /* Hover styles sit inside `@media (hover: hover)`, which headless WebKit
         answers no: there the tab matches `:hover` but keeps its colors at
         rest, so this row reads the at-rest tab again. Chromium's is the
         hovered one. */
      read(`${name}, hovered${matchMedia("(hover: hover)").matches ? "" : " (no hover media: at rest)"}`, strip, done);
    }
    console.info(`LIQUID COUNT contrast\n${rows.map((r) => r.join(" | ")).join("\n")}`);
    /* Every number clears 4.5:1; the twin, every mark's fill shows against what's under it. */
    await expect(rows.filter(([, text]) => text < 4.5)).toEqual([]);
    await expect(rows.filter(([, , fill]) => fill <= 1.02)).toEqual([]);
  },
};

export const ACountIsInTheTabsName: Story = {
  tags: ["ax-tree"],
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      <LiquidTabs
        id="named"
        aria-label="Named"
        tabs={[
          { id: "open", label: "Open", count: 12, panelId: "named-panel" },
          { id: "plain", label: "Plain", panelId: "named-panel" },
          { id: "node", label: <span>Node</span>, count: 3, panelId: "named-panel" },
        ]}
        activeTab="open"
        onChange={() => {}}
      />
      <LiquidTabPanel tabsId="named" id="named-panel" tab="open">
        <p style={{ margin: 0 }}>Twelve things</p>
      </LiquidTabPanel>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const [open, plain, node] = within(document.body).getAllByRole("tab");
    open.setAttribute("data-ax-probe", "open");
    plain.setAttribute("data-ax-probe", "plain");
    node.setAttribute("data-ax-probe", "node");
    document.getElementById("named-panel")!.setAttribute("data-ax-probe", "panel");
    const read = await real.commands.axStates(['[data-ax-probe="open"]', '[data-ax-probe="plain"]', '[data-ax-probe="panel"]', '[data-ax-probe="node"]']);
    console.info(`LIQUID AX ${JSON.stringify(read.map((a) => [a.role, a.name]))}`);
    /* The count is in the name; the panel takes its tab's name; the twin, an
       uncounted tab, is its label alone. */
    await expect(read.slice(0, 3).map((a) => [a.role, a.name])).toEqual([
      ["tab", "Open, 12 items"],
      ["tab", "Plain"],
      ["tabpanel", "Open, 12 items"],
    ]);
    /* A label that's a node is named from its content, the hidden count text
       included. Chromium puts a space before the hidden part, which is spoken
       the same; pinned as it reads. */
    await expect(read[3].name).toBe("Node , 3 items");
  },
};
