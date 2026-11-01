import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Timeline, type TimelineStep } from "./Timeline";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * The timeline, checked rendered in Chromium and WebKit, and through
 * Chromium's accessibility tree.
 *
 * - **The columns line up across steps of different content**: a long
 *   "when", a title that wraps, a step with no actions, one with no content,
 *   a smaller mark of the consumer's own. Measured: every step's "when"
 *   starts at one edge, its marker centers on one line, its body starts at
 *   one edge and its actions end at one. Compared step to step rather than to
 *   pixels, since the "when" column is as wide as its text in the system font.
 * - **At 375px the leading column is stacked**: each "when" above its body,
 *   at the body's left edge, and the actions under the body.
 * - **The line runs unbroken** from the first marker to the last, wide and
 *   narrow, through the "now" divider, along the markers' centers, filled up
 *   to the current step.
 * - **In forced colors the line still says how far it's reached**: the
 *   passed part in Highlight, the rest in GrayText, the divider in
 *   CanvasText. The twin: outside forced colors, the tokens.
 * - **What a screen reader is handed**: the list and its name, an item per
 *   step and none for the divider, the markers ignored, and "done" after a
 *   finished step's title.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/Timeline/Checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const button = (label: string) => (
  <button type="button" style={{ font: "inherit", padding: "4px 10px" }}>
    {label}
  </button>
);
const STEPS: TimelineStep[] = [
  { id: "a", when: "Week 1 · Sep 2", title: "Soil and compost", content: "What a bed needs before anything goes in it.", actions: button("Edit") },
  { id: "b", when: "Week 12 · Dec 28 – Jan 3", title: "A title long enough that it wraps onto a second line at this width, and a third", actions: button("Edit") },
  { id: "c", when: "Week 3", title: "Water and mulch", content: "No actions on this one." },
  { id: "d", when: "Week 4 · Sep 23", title: "Pests without poison", actions: button("Add a topic"), marker: <span style={{ display: "block", width: 22, height: 22, background: "#b91c1c" }} /> },
  { id: "e", when: "Week 5", title: "No topic yet", marker: "hollow", actions: button("Edit") },
];

const rect = (el: Element | null) => el!.getBoundingClientRect();
const round = (n: number) => Math.round(n);
const same = (values: number[]) => values.every((v) => Math.abs(v - values[0]) <= 0.5);
const steps = (scope: ParentNode) => [...scope.querySelectorAll("li[data-step]")];
const markerCenter = (li: Element) => {
  const marks = li.querySelectorAll("[data-timeline-marker] > span:not([data-timeline-rail])");
  const r = rect(marks[marks.length - 1]);
  return r.left + r.width / 2;
};
/* The line: its stretches top to bottom, the gaps between them, and where it runs. */
function line(scope: ParentNode) {
  const segs = [...scope.querySelectorAll("[data-timeline-rail]")].map((e) => ({ r: rect(e), state: (e as HTMLElement).dataset.timelineRail }));
  segs.sort((a, b) => a.r.top - b.r.top);
  const gaps = segs.slice(1).map((s, i) => round(s.r.top - segs[i].r.bottom));
  return {
    gaps: gaps.every((g) => g === 0) ? "unbroken" : `gaps ${gaps.join(",")}`,
    along: same([...segs.map((s) => s.r.left + s.r.width / 2), ...steps(scope).map(markerCenter)]) ? "along the markers" : "off the markers",
    filled: segs.filter((s) => s.state === "done").length,
  };
}

export const TheColumnsLineUpAndStackWhenNarrow: Story = {
  tags: ["real-input"],
  render: () => (
    <div data-check="course" style={{ maxWidth: 820 }}>
      <Timeline label="The course" steps={STEPS} current={3} nowBefore={3} labels={{ now: "Today" }} />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const scope = document.querySelector('[data-check="course"]')!;
    const wide = () => {
      const li = steps(scope);
      const withActions = li.filter((s) => s.querySelector("[data-timeline-actions]"));
      return {
        when: same(li.map((s) => rect(s.querySelector("[data-timeline-when]")).left)),
        markers: same(li.map(markerCenter)),
        bodies: same(li.map((s) => rect(s.querySelector("[data-timeline-body]")).left)),
        actions: same(withActions.map((s) => rect(s.querySelector("[data-timeline-actions]")).right)),
        whenBesideBody: li.every((s) => rect(s.querySelector("[data-timeline-when]")).right < rect(s.querySelector("[data-timeline-body]")).left),
        ...line(scope),
      };
    };
    const narrow = () => {
      const li = steps(scope);
      return {
        whenAboveBody: li.every((s) => rect(s.querySelector("[data-timeline-when]")).bottom <= rect(s.querySelector("[data-timeline-body]")).top + 0.5),
        whenAtBodyEdge: li.every((s) => Math.abs(rect(s.querySelector("[data-timeline-when]")).left - rect(s.querySelector("[data-timeline-body]")).left) <= 0.5),
        actionsUnderBody: li
          .filter((s) => s.querySelector("[data-timeline-actions]"))
          .every((s) => rect(s.querySelector("[data-timeline-actions]")).top >= rect(s.querySelector("[data-timeline-body]")).bottom - 0.5),
        markers: same(li.map(markerCenter)),
        ...line(scope),
      };
    };
    await real.page.viewport(1280, 900);
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 200));
    const at1280 = wide();
    await real.page.viewport(375, 900);
    await new Promise((r) => setTimeout(r, 300));
    const at375 = narrow();
    await real.page.viewport(1280, 720);
    console.info(`TIMELINE COLUMNS ${JSON.stringify({ at1280, at375 })}`);
    await expect({ at1280, at375 }).toEqual({
      /* Filled: steps 1 and 2 onward, 2 and 3 in, and the divider's stretch
         before step 3, which is reached. */
      at1280: { when: true, markers: true, bodies: true, actions: true, whenBesideBody: true, gaps: "unbroken", along: "along the markers", filled: 5 },
      at375: { whenAboveBody: true, whenAtBodyEdge: true, actionsUnderBody: true, markers: true, gaps: "unbroken", along: "along the markers", filled: 5 },
    });
  },
};

/* ── Forced colors ────────────────────────────────────────────────────── */

export const InForcedColorsTheLineStillSaysHowFar: Story = {
  tags: ["real-input"],
  render: () => (
    <div data-check="forced" style={{ maxWidth: 820 }}>
      <span data-probe="Highlight" style={{ background: "Highlight", display: "block", width: 4, height: 4 }} />
      <span data-probe="GrayText" style={{ background: "GrayText", display: "block", width: 4, height: 4 }} />
      <span data-probe="CanvasText" style={{ background: "CanvasText", display: "block", width: 4, height: 4 }} />
      <Timeline label="The course" steps={STEPS} current={3} nowBefore={4} />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const bg = (sel: string) => getComputedStyle(document.querySelector(sel)!).backgroundColor;
    const read = () => {
      const system = (name: string) => bg(`[data-probe="${name}"]`);
      const named = (color: string) => ["Highlight", "GrayText", "CanvasText"].find((n) => system(n) === color) ?? "a token";
      return [
        `passed: ${named(bg('[data-timeline-rail="done"]'))}`,
        `ahead: ${named(bg('[data-timeline-rail="ahead"]'))}`,
        `divider: ${named(bg("[data-timeline-now] > span:last-child"))}`,
      ];
    };
    let forced: string[] = [];
    try {
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      forced = read();
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
    await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(false));
    const normal = [bg('[data-timeline-rail="done"]'), bg('[data-timeline-rail="ahead"]'), bg("[data-timeline-now] > span:last-child")];
    await expect({ forced, normal }).toEqual({
      forced: ["passed: Highlight", "ahead: GrayText", "divider: CanvasText"],
      normal: ["rgb(10, 79, 122)", "rgb(231, 229, 228)", "rgb(15, 100, 152)"],
    });
  },
};

/* ── What a screen reader is handed ───────────────────────────────────── */

export const WhatAScreenReaderIsHanded: Story = {
  tags: ["ax-tree"],
  render: () => (
    <div data-check="ax" style={{ maxWidth: 820 }}>
      <Timeline label="The course" steps={STEPS} current={3} nowBefore={3} labels={{ now: "Today" }} />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const scope = document.querySelector('[data-check="ax"]')!;
    const tag = (el: Element | null, probe: string) => el!.setAttribute("data-ax-probe", probe);
    tag(scope.querySelector("ol"), "list");
    tag(scope.querySelector("[data-timeline-now]"), "now");
    tag(scope.querySelector("li[data-step] [data-timeline-marker]"), "marker");
    tag(scope.querySelector('li[data-step="current"]'), "current");
    const [list, now, marker, current] = await real.commands.axStates(["list", "now", "marker", "current"].map((p) => `[data-ax-probe="${p}"]`));
    /* Chromium marks a span of text "ignored" and hands its text to its
       parent, so "done" is read from what keeps it out: no aria-hidden above
       it, and not hidden by display or visibility. */
    const done = scope.querySelector('li[data-step="done"] .rst\\:sr-only')!;
    const doneRead = !done.closest("[aria-hidden]") && getComputedStyle(done).display !== "none" && getComputedStyle(done).visibility !== "hidden";
    const items = scope.querySelectorAll("ol > li:not([aria-hidden])").length;
    const rows = [
      `list: ${list.role} "${list.name}", ${items} items`,
      `divider: ignored ${now.ignored}`,
      `marker: ignored ${marker.ignored}`,
      `done: read ${doneRead}, says "${done.textContent}"`,
      `current: ${current.role}, aria-current ${scope.querySelector('[data-ax-probe="current"]')!.getAttribute("aria-current")}`,
    ];
    console.info(`TIMELINE AX ${JSON.stringify(rows)}`);
    await expect(rows).toEqual([
      'list: list "The course", 5 items',
      "divider: ignored true",
      "marker: ignored true",
      'done: read true, says ", done"',
      "current: listitem, aria-current step",
    ]);
  },
};
