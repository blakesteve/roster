import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Eyebrow } from "./Eyebrow";
import { cn } from "../../../lib/utils";

/**
 * Eyebrow's line, measured in Chromium. Its line is as tall as its letters:
 * 10, 11 and 12px for xs, sm and md. Each with a twin: the classes in the
 * order 5.7.0 wrote them, through the same `cn()`, which loses the line
 * height and draws 1.5 times the size.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Eyebrow/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const height = (root: HTMLElement, selector: string) => root.querySelector(selector)!.getBoundingClientRect().height;

export const ItsLineIsAsTallAsItsLetters: Story = {
  render: () => (
    /* A flex column, so each Eyebrow makes its own line, as it does as a
       flex item or rendered as a block. */
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, lineHeight: 1.5 }}>
      <Eyebrow size="xs" data-size="xs">Projects</Eyebrow>
      <Eyebrow size="sm" data-size="sm">Projects</Eyebrow>
      <Eyebrow size="md" data-size="md">Projects</Eyebrow>
      <Eyebrow as="p" style={{ margin: 0 }} data-size="p">Projects</Eyebrow>
      {/* The twin: 5.7.0's order, line height before size. */}
      <span className={cn("rst:font-mono rst:uppercase rst:leading-none", "rst:text-[0.625rem] rst:tracking-[0.16em]")} data-size="old">
        Projects
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(["xs", "sm", "md", "p"].map((s) => height(canvasElement, `[data-size="${s}"]`))).toEqual([10, 11, 12, 10]);
    await expect(height(canvasElement, '[data-size="old"]')).toBe(15);
  },
};

export const InlineItSitsOnItsParentsLine: Story = {
  render: () => (
    <div style={{ lineHeight: "24px", fontSize: 16 }}>
      <div data-line="with">
        <Eyebrow>Projects</Eyebrow>
      </div>
      <div data-line="without">Projects</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* Inline in running text, its line is the parent's: a fix to its own
       line height moves nothing here. The control is the same line with no
       Eyebrow in it; the twin that must differ is the flex item above. */
    await expect([height(canvasElement, '[data-line="with"]'), height(canvasElement, '[data-line="without"]')]).toEqual([24, 24]);
  },
};
