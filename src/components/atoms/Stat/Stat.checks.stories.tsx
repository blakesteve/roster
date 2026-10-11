import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Stat } from "./Stat";
import { cn } from "../../../lib/utils";

/**
 * Stat's lines, measured in Chromium. The figure's line is as tall as the
 * figure and the label's as tall as its letters, in both markups, so a Stat
 * is its figure, a 3px gap and a 10px label. The twin: the value's classes in
 * the order 5.7.0 wrote them, through the same `cn()`, which loses the line
 * height to the size's own.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Stat/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const box = (root: HTMLElement, selector: string) => root.querySelector(selector)!.getBoundingClientRect().height;

export const ItsLinesAreAsTallAsTheirType: Story = {
  render: () => (
    /* The page's line height, which an inline label would otherwise sit on. */
    <div style={{ display: "flex", alignItems: "flex-start", gap: 32, lineHeight: 1.5 }}>
      <dl style={{ margin: 0 }} data-form="definition">
        <Stat size="sm" value="1,204" label="Plays" />
      </dl>
      <div data-form="standalone">
        <Stat size="sm" semantics="standalone" value="1,204" label="Plays" />
      </div>
      <dl style={{ margin: 0 }} data-form="sourced">
        <Stat size="sm" value="1,204" label="Plays" source="live" />
      </dl>
      {/* The twin: 5.7.0's order, line height before size. */}
      <span className={cn("rst:block rst:font-bold rst:leading-none", "rst:text-xl")} data-old="">
        1,204
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* sm is text-xl, 20px: a 20px figure, a 3px gap, a 10px label. */
    await expect(box(canvasElement, '[data-form="definition"] dd')).toBe(20);
    await expect(box(canvasElement, '[data-form="definition"] dt')).toBe(10);
    await expect(box(canvasElement, '[data-form="definition"] > div')).toBe(33);
    await expect(box(canvasElement, '[data-form="standalone"] > div')).toBe(33);
    /* With a source: one more gap and its 8.5px line. */
    await expect(box(canvasElement, '[data-form="sourced"] > div')).toBe(44.5);
    /* The twin: text-xl's own line height, 28px. */
    await expect(box(canvasElement, "[data-old]")).toBe(28);
  },
};

export const AFluidFigureIsAsTallAsItsSize: Story = {
  render: () => (
    <div style={{ lineHeight: 1.5 }}>
      <dl style={{ margin: 0 }}>
        <Stat size="lg" value="48" label="Weeks" />
      </dl>
      {/* The twin: 5.7.0's order, which inherits the page's 1.5. */}
      <span className={cn("rst:block rst:font-bold rst:leading-none", "rst:text-[clamp(2rem,5vw,3rem)]")} data-old="">
        48
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const dd = canvasElement.querySelector("dd")!;
    const size = parseFloat(getComputedStyle(dd).fontSize);
    /* lg is a clamp, so read the size it resolved to; the line must match
       it, not inherit the page's 1.5. */
    await expect(dd.getBoundingClientRect().height).toBeCloseTo(size, 1);
    await expect(size).toBeGreaterThanOrEqual(32);
    await expect(box(canvasElement, "[data-old]")).toBeCloseTo(size * 1.5, 1);
  },
};
