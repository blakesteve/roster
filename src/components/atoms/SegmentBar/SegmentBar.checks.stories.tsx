import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { SegmentBar } from "./SegmentBar";
import { Card } from "../Card/Card";
import { backgroundOf, contrast, paint, textContrast } from "../../../test/painted";

/**
 * The legend's percent, measured as painted, in Chromium and WebKit (tagged
 * `real-input` for the project that runs both; nothing here takes input).
 *
 * The percent is text at 12px, so its bar is WCAG AA's 4.5:1, against the
 * page and against a Card, light and dark. The figures are literals, the same
 * in both engines to 0.01, and the label's are pinned beside them: the
 * percent stays a step quieter than the label it follows.
 *
 * The twin is the legend as 5.19 drew it, the label's gray at `opacity-60`.
 * Read from the span's own computed color, as a check that ignores opacity
 * reads it, it passed at the label's ratio; composited as painted, it fails.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/SegmentBar/Checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SEGMENTS = [
  { key: "keyboard", label: "Keyboard", value: 60, color: "#2563eb" },
  { key: "controller", label: "Controller", value: 40, color: "#f59e0b" },
];

/* 5.19's legend entry, as it rendered, in a row like the legend's: the twin. */
function OldEntry() {
  return (
    <div className="rst:font-ui rst:flex rst:flex-wrap rst:gap-x-3 rst:gap-y-0.5">
      <span data-old="" className="rst:flex rst:items-center rst:gap-1.5 rst:text-xs rst:text-gray-600 rst:dark:text-gray-400">
        <span className="rst:h-2 rst:w-2 rst:flex-none rst:rounded-full" style={{ backgroundColor: "#2563eb" }} aria-hidden="true" />
        Keyboard
        <span className="rst:opacity-60">60%</span>
      </span>
    </div>
  );
}

const GROUNDS = ["light-page", "light-card", "dark-page", "dark-card"] as const;

function Ground({ id }: { id: (typeof GROUNDS)[number] }) {
  const dark = id.startsWith("dark");
  const body = (
    <>
      <SegmentBar segments={SEGMENTS} />
      <OldEntry />
    </>
  );
  return (
    <div data-ground={id} className={dark ? "dark" : undefined} style={{ padding: 16, width: 280, background: dark ? "#0c0a09" : "#ffffff" }}>
      {id.endsWith("card") ? <Card>{body}</Card> : body}
    </div>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;
/* How a check read text before: the element's own color over the
   backgrounds behind it, with no opacity anywhere. */
const unComposited = (el: Element) => {
  const ground = backgroundOf(el);
  return round(contrast(paint([...ground, getComputedStyle(el).color]), paint(ground)));
};

export const ThePercentPassesOnEveryGround: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {GROUNDS.map((id) => (
        <Ground key={id} id={id} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const read = (id: string) => {
      const ground = canvasElement.querySelector(`[data-ground="${id}"]`)!;
      const entry = ground.querySelector('[data-testid="segment-bar-legend"] > span')!;
      const old = ground.querySelector("[data-old]")!;
      return {
        label: round(textContrast(entry)),
        percent: round(textContrast(entry.lastElementChild!)),
        oldPercent: round(textContrast(old.lastElementChild!)),
        oldPercentUnComposited: unComposited(old.lastElementChild!),
      };
    };
    const all = Object.fromEntries(GROUNDS.map((id) => [id, read(id)]));
    console.info(`SEGMENTBAR LEGEND ${JSON.stringify(all)}`);

    const percent = (id: string) => all[id].percent;
    /* Light: gray-500 on white, and on a Card, which is white. */
    await expect(percent("light-page")).toBeCloseTo(5.99, 1);
    await expect(percent("light-card")).toBeCloseTo(5.99, 1);
    /* Dark: the mix, on the page (gray-950) and on a Card (gray-900). */
    await expect(percent("dark-page")).toBeCloseTo(6.15, 1);
    await expect(percent("dark-card")).toBeCloseTo(5.45, 1);
    for (const id of GROUNDS) {
      await expect(percent(id), id).toBeGreaterThanOrEqual(4.5);
      /* A step quieter than the label, which is unchanged. */
      await expect(percent(id), id).toBeLessThan(all[id].label);
    }
    await expect(GROUNDS.map((id) => all[id].label)).toEqual([7.63, 7.63, 7.83, 6.93]);

    /* The twin: 5.19's percent. Read without its opacity, it passes at the
       label's ratio; composited, it fails on every ground. */
    await expect(GROUNDS.map((id) => all[id].oldPercentUnComposited)).toEqual([7.63, 7.63, 7.83, 6.93]);
    await expect(GROUNDS.map((id) => all[id].oldPercent)).toEqual([2.88, 2.88, 3.44, 3.33]);
  },
};

export const OnlyThePercentsColorChanged: Story = {
  render: () => (
    <div style={{ padding: 16, width: 280 }}>
      <SegmentBar segments={SEGMENTS} />
      <OldEntry />
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* The legend's first entry and 5.19's are the same box, and so are their
       percents: the change is the ink, nothing that takes space. */
    const entry = canvasElement.querySelector('[data-testid="segment-bar-legend"] > span')!;
    const old = canvasElement.querySelector("[data-old]")!;
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return [round(r.width), round(r.height)];
    };
    await expect(box(entry)).toEqual(box(old));
    await expect(box(entry.lastElementChild!)).toEqual(box(old.lastElementChild!));
    const style = getComputedStyle(entry.lastElementChild!);
    await expect([style.opacity, style.fontSize, style.fontWeight]).toEqual(["1", "12px", "400"]);
  },
};
